import './index.css';
import { store } from './framework/store';
import { renderHeader } from './views/HeaderView';
import { renderPipelineView } from './views/PipelineView';
import { renderAuditView } from './views/AuditView';
import { renderSimulatorView } from './views/SimulatorView';
import { renderDiligenceMemoView } from './views/DiligenceMemoView';
import { renderCohortMatrixView } from './views/CohortMatrixView';
import { renderIntakeModal } from './views/IntakeModalView';

function renderApp() {
  const root = document.getElementById('root');
  if (!root) return;

  // Clear current DOM
  root.innerHTML = '';
  root.className = 'min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans';

  // 1. Header (Strict Top Bar Contract)
  const header = renderHeader();
  root.appendChild(header);

  // 2. Main Viewport Container
  const main = document.createElement('main');
  main.className = 'flex-1 pb-16';

  const state = store.getState();
  switch (state.activeTab) {
    case 'pipeline':
      main.appendChild(renderPipelineView());
      break;
    case 'audit':
      main.appendChild(renderAuditView());
      break;
    case 'simulator':
      main.appendChild(renderSimulatorView());
      break;
    case 'diligence':
      main.appendChild(renderDiligenceMemoView());
      break;
    case 'matrix':
      main.appendChild(renderCohortMatrixView());
      break;
    default:
      main.appendChild(renderPipelineView());
  }

  root.appendChild(main);

  // 3. Footer (Quiet copyright and framework indicator)
  const footer = document.createElement('footer');
  footer.className = 'w-full border-t border-slate-900 bg-[#070a12] py-6 text-xs text-slate-500';
  footer.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <span class="font-semibold text-slate-400">VentureCBT Intelligence</span>
        <span aria-hidden="true" class="mx-1.5">·</span>
        <span>Zero-Framework Vanilla JS Engine & CBT Diligence Matrix</span>
      </div>
      <div class="flex items-center gap-4 text-[11px] text-slate-500">
        <span>Stochastic Monte Carlo Horizon: 24mo</span>
        <span aria-hidden="true">·</span>
        <span>Bessemer Efficiency Index</span>
        <span aria-hidden="true">·</span>
        <span>Institutional Grade</span>
      </div>
    </div>
  `;
  root.appendChild(footer);

  // 4. Modal if open
  const modal = renderIntakeModal();
  if (modal) {
    root.appendChild(modal);
  }

  // 5. Notification Toast (Floating bottom right)
  if (state.notification) {
    const toast = document.createElement('div');
    const isError = state.notification.type === 'error';
    const isSuccess = state.notification.type === 'success';

    let borderCol = 'border-slate-700 bg-slate-900 text-slate-200';
    if (isError) borderCol = 'border-rose-700 bg-rose-950/90 text-rose-200';
    if (isSuccess) borderCol = 'border-emerald-700 bg-emerald-950/90 text-emerald-200';

    toast.className = `fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg border text-xs shadow-xl flex items-center gap-2 backdrop-blur-md transition-all ${borderCol}`;
    toast.innerHTML = `
      <span>${state.notification.message}</span>
    `;
    root.appendChild(toast);
  }
}

// Initial render
renderApp();

// Subscribe to store updates for reactive zero-framework updates
store.subscribe(() => {
  renderApp();
});
