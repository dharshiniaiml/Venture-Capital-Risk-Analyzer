import { Startup, StressTestScenario, AIDiligenceReport, Sector, Stage, RiskTier } from '../engine/types';
import { INITIAL_STARTUPS } from '../engine/benchmark-data';
import { calculateRiskAssessment } from '../engine/scorer';

export type TabId = 'pipeline' | 'audit' | 'simulator' | 'diligence' | 'matrix';

export interface AppState {
  startups: Startup[];
  selectedStartupId: string;
  activeTab: TabId;
  filters: {
    sector: string;
    stage: string;
    riskTier: string;
    search: string;
  };
  stressScenario: StressTestScenario;
  aiReports: Record<string, AIDiligenceReport>;
  isAiLoading: boolean;
  intakeModalOpen: boolean;
  notification: { message: string; type: 'info' | 'success' | 'warning' | 'error' } | null;
}

const STORAGE_KEY = 'venture_cbt_startups_v1';

function loadStoredStartups(): Startup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load from localStorage', e);
  }
  return INITIAL_STARTUPS;
}

function saveStartups(startups: Startup[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(startups));
  } catch (e) {
    console.warn('Failed to save to localStorage', e);
  }
}

class Store {
  private state: AppState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    const startups = loadStoredStartups();
    this.state = {
      startups,
      selectedStartupId: startups[0]?.id || 'startup-1',
      activeTab: 'pipeline',
      filters: {
        sector: 'All',
        stage: 'All',
        riskTier: 'All',
        search: '',
      },
      stressScenario: {
        marketDownturn: 0,
        cacInflation: 0,
        churnSpike: 0,
        roundDelayMonths: 0,
        founderFriction: 0,
      },
      aiReports: {},
      isAiLoading: false,
      intakeModalOpen: false,
      notification: null,
    };
  }

  public getState(): AppState {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getSelectedStartup(): Startup {
    const found = this.state.startups.find((s) => s.id === this.state.selectedStartupId);
    return found || this.state.startups[0];
  }

  public setSelectedStartup(id: string) {
    this.state.selectedStartupId = id;
    this.notify();
  }

  public setActiveTab(tab: TabId) {
    this.state.activeTab = tab;
    this.notify();
  }

  public setFilter(key: 'sector' | 'stage' | 'riskTier' | 'search', value: string) {
    this.state.filters[key] = value;
    this.notify();
  }

  public resetFilters() {
    this.state.filters = {
      sector: 'All',
      stage: 'All',
      riskTier: 'All',
      search: '',
    };
    this.notify();
  }

  public updateScenario(partial: Partial<StressTestScenario>) {
    this.state.stressScenario = { ...this.state.stressScenario, ...partial };
    this.notify();
  }

  public resetScenario() {
    this.state.stressScenario = {
      marketDownturn: 0,
      cacInflation: 0,
      churnSpike: 0,
      roundDelayMonths: 0,
      founderFriction: 0,
    };
    this.notify();
  }

  public updateStartup(updated: Startup) {
    this.state.startups = this.state.startups.map((s) => (s.id === updated.id ? updated : s));
    saveStartups(this.state.startups);
    this.showNotification(`Updated profile for ${updated.name}`, 'success');
    this.notify();
  }

  public addStartup(newStartup: Startup) {
    this.state.startups = [newStartup, ...this.state.startups];
    this.state.selectedStartupId = newStartup.id;
    this.state.intakeModalOpen = false;
    this.state.activeTab = 'audit';
    saveStartups(this.state.startups);
    this.showNotification(`Enrolled ${newStartup.name} into Diligence Pipeline`, 'success');
    this.notify();
  }

  public deleteStartup(id: string) {
    if (this.state.startups.length <= 1) {
      this.showNotification('Cannot delete the last remaining startup in pipeline', 'warning');
      return;
    }
    const target = this.state.startups.find((s) => s.id === id);
    this.state.startups = this.state.startups.filter((s) => s.id !== id);
    if (this.state.selectedStartupId === id) {
      this.state.selectedStartupId = this.state.startups[0].id;
    }
    saveStartups(this.state.startups);
    this.showNotification(`Removed ${target?.name || 'startup'} from pipeline`, 'info');
    this.notify();
  }

  public restoreDefaults() {
    this.state.startups = INITIAL_STARTUPS;
    this.state.selectedStartupId = INITIAL_STARTUPS[0].id;
    saveStartups(INITIAL_STARTUPS);
    this.showNotification('Restored initial baseline venture cohort', 'info');
    this.notify();
  }

  public setIntakeModalOpen(open: boolean) {
    this.state.intakeModalOpen = open;
    this.notify();
  }

  public showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    this.state.notification = { message, type };
    this.notify();
    setTimeout(() => {
      if (this.state.notification?.message === message) {
        this.state.notification = null;
        this.notify();
      }
    }, 4000);
  }

  public async requestAIDiligence(startupId: string) {
    const startup = this.state.startups.find((s) => s.id === startupId);
    if (!startup) return;

    this.state.isAiLoading = true;
    this.notify();

    try {
      const risk = calculateRiskAssessment(startup, this.state.stressScenario);

      const response = await fetch('/api/ai/evaluate-startup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startup,
          cbtMetrics: startup.cbtTraits,
          quantitativeRisk: risk,
          scenario: this.state.stressScenario,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const report: AIDiligenceReport = await response.json();
      this.state.aiReports[startupId] = report;
      this.showNotification(`Generated AI Investment Committee memo for ${startup.name}`, 'success');
    } catch (err: any) {
      console.error('Failed to generate AI Diligence:', err);
      this.showNotification(`AI Diligence Memo generation failed: ${err.message}`, 'error');
    } finally {
      this.state.isAiLoading = false;
      this.notify();
    }
  }
}

export const store = new Store();
