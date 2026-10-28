import { store } from '../framework/store';
import { Startup, Sector, Stage } from '../engine/types';

export function renderIntakeModal(): HTMLElement | null {
  const state = store.getState();
  if (!state.intakeModalOpen) return null;

  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto';

  const modal = document.createElement('div');
  modal.className = 'bg-[#0f172a] border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8 text-xs';

  modal.innerHTML = `
    <div class="flex items-center justify-between pb-3 border-b border-slate-800">
      <div>
        <h2 class="text-base font-bold text-slate-100">Enroll New Startup for CBT Diligence</h2>
        <p class="text-slate-400 text-[11px]">Input financial traction and founder psychological markers</p>
      </div>
      <button id="close-modal-btn" class="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <form id="intake-form" class="space-y-4">
      <!-- General Info -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-slate-300 font-semibold mb-1">Company Name *</label>
          <input required type="text" id="name" placeholder="e.g. Nexus AI" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none focus:border-sky-400" />
        </div>
        <div>
          <label class="block text-slate-300 font-semibold mb-1">Headquarters</label>
          <input type="text" id="headquarters" placeholder="e.g. Austin, TX" value="San Francisco, CA" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none" />
        </div>
      </div>

      <div>
        <label class="block text-slate-300 font-semibold mb-1">One-Line Investment Thesis / Tagline</label>
        <input type="text" id="tagline" placeholder="e.g. Autonomous data pipeline self-healing agent" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="block text-slate-300 font-semibold mb-1">Sector</label>
          <select id="sector" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none">
            <option value="AI & Agents">AI & Agents</option>
            <option value="Enterprise SaaS">Enterprise SaaS</option>
            <option value="DeepTech Robotics">DeepTech Robotics</option>
            <option value="Fintech">Fintech</option>
            <option value="BioTech">BioTech</option>
            <option value="ClimateTech">ClimateTech</option>
          </select>
        </div>
        <div>
          <label class="block text-slate-300 font-semibold mb-1">Round Stage</label>
          <select id="stage" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none">
            <option value="Pre-Seed">Pre-Seed</option>
            <option value="Seed">Seed</option>
            <option value="Series A" selected>Series A</option>
            <option value="Series B">Series B</option>
          </select>
        </div>
        <div>
          <label class="block text-slate-300 font-semibold mb-1">Founding Year</label>
          <input type="number" id="foundingYear" value="2023" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 focus:outline-none" />
        </div>
      </div>

      <!-- Financial Metrics -->
      <div class="pt-2 border-t border-slate-800">
        <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Quantitative Financials</div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label class="block text-slate-400 mb-0.5">ARR ($ USD)</label>
            <input required type="number" id="arr" value="2400000" step="50000" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 font-mono text-xs focus:outline-none" />
          </div>
          <div>
            <label class="block text-slate-400 mb-0.5">YoY Growth (%)</label>
            <input required type="number" id="growthRate" value="120" step="5" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 font-mono text-xs focus:outline-none" />
          </div>
          <div>
            <label class="block text-slate-400 mb-0.5">Monthly Burn ($)</label>
            <input required type="number" id="monthlyBurn" value="180000" step="10000" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 font-mono text-xs focus:outline-none" />
          </div>
          <div>
            <label class="block text-slate-400 mb-0.5">Cash in Bank ($)</label>
            <input required type="number" id="cashBalance" value="2500000" step="100000" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 font-mono text-xs focus:outline-none" />
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          <div>
            <label class="block text-slate-400 mb-0.5">Net Retention (%)</label>
            <input type="number" id="netDollarRetention" value="114" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 font-mono text-xs focus:outline-none" />
          </div>
          <div>
            <label class="block text-slate-400 mb-0.5">CAC Payback (Mo)</label>
            <input type="number" id="cacPaybackMonths" value="12" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 font-mono text-xs focus:outline-none" />
          </div>
          <div>
            <label class="block text-slate-400 mb-0.5">Asking Val ($ USD)</label>
            <input type="number" id="askingValuation" value="24000000" step="500000" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 font-mono text-xs focus:outline-none" />
          </div>
        </div>
      </div>

      <!-- CBT Trait Markers -->
      <div class="pt-2 border-t border-slate-800">
        <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">CBT Founder Cognitive Markers (0 = Resilient, 100 = Severe Hazard)</div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-slate-400 mb-0.5">TAM Delusion (0-100)</label>
            <input type="number" min="0" max="100" id="tamDelusion" value="50" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 font-mono text-xs focus:outline-none" />
          </div>
          <div>
            <label class="block text-slate-400 mb-0.5">Sunk Cost Anchor (0-100)</label>
            <input type="number" min="0" max="100" id="sunkCostAnchor" value="45" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 font-mono text-xs focus:outline-none" />
          </div>
          <div>
            <label class="block text-slate-400 mb-0.5">Founder Omniscience (0-100)</label>
            <input type="number" min="0" max="100" id="founderOmniscience" value="55" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 font-mono text-xs focus:outline-none" />
          </div>
          <div>
            <label class="block text-slate-400 mb-0.5">Churn Blindspot (0-100)</label>
            <input type="number" min="0" max="100" id="churnBlindspot" value="40" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 font-mono text-xs focus:outline-none" />
          </div>
          <div>
            <label class="block text-slate-400 mb-0.5">Burn Apathy (0-100)</label>
            <input type="number" min="0" max="100" id="burnApathy" value="45" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 font-mono text-xs focus:outline-none" />
          </div>
          <div>
            <label class="block text-slate-400 mb-0.5">Key-Man Risk (0-100)</label>
            <input type="number" min="0" max="100" id="keyManDependency" value="50" class="w-full bg-[#090d16] border border-slate-700 rounded p-2 text-slate-100 font-mono text-xs focus:outline-none" />
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
        <button type="button" id="cancel-btn" class="px-4 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer">
          Cancel
        </button>
        <button type="submit" class="px-4 py-2 bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold rounded shadow-sm transition-colors cursor-pointer">
          Enroll into Diligence Pipeline
        </button>
      </div>
    </form>
  `;

  modal.querySelector('#close-modal-btn')?.addEventListener('click', () => {
    store.setIntakeModalOpen(false);
  });
  modal.querySelector('#cancel-btn')?.addEventListener('click', () => {
    store.setIntakeModalOpen(false);
  });

  const form = modal.querySelector('#intake-form') as HTMLFormElement;
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const arr = Number((modal.querySelector('#arr') as HTMLInputElement).value) || 1000000;
    const monthlyBurn = Number((modal.querySelector('#monthlyBurn') as HTMLInputElement).value) || 100000;
    const cashBalance = Number((modal.querySelector('#cashBalance') as HTMLInputElement).value) || 1200000;
    const runwayMonths = Math.max(1, Math.round(cashBalance / monthlyBurn));

    // Calculate burn multiple approximately: (Annualized Burn) / (Annualized Net New ARR)
    const growthRate = Number((modal.querySelector('#growthRate') as HTMLInputElement).value) || 80;
    const netNewArr = Math.max(100000, arr * (growthRate / 100));
    const annualBurn = monthlyBurn * 12;
    const burnMultiple = Number((annualBurn / netNewArr).toFixed(1));

    const newStartup: Startup = {
      id: `custom-${Date.now()}`,
      name: (modal.querySelector('#name') as HTMLInputElement).value.trim(),
      tagline: (modal.querySelector('#tagline') as HTMLInputElement).value.trim() || 'Early-stage venture opportunity',
      sector: (modal.querySelector('#sector') as HTMLSelectElement).value as Sector,
      stage: (modal.querySelector('#stage') as HTMLSelectElement).value as Stage,
      foundingYear: Number((modal.querySelector('#foundingYear') as HTMLInputElement).value) || 2023,
      teamSize: 15,
      headquarters: (modal.querySelector('#headquarters') as HTMLInputElement).value.trim() || 'San Francisco, CA',
      arr,
      growthRate,
      monthlyBurn,
      cashBalance,
      runwayMonths,
      netDollarRetention: Number((modal.querySelector('#netDollarRetention') as HTMLInputElement).value) || 110,
      grossMargin: 75,
      cacPaybackMonths: Number((modal.querySelector('#cacPaybackMonths') as HTMLInputElement).value) || 12,
      burnMultiple,
      founderEquityPercent: 65,
      deadEquityPercent: 0,
      capitalRaised: cashBalance * 1.5,
      askingValuation: Number((modal.querySelector('#askingValuation') as HTMLInputElement).value) || 20000000,
      cbtTraits: {
        tamDelusion: Number((modal.querySelector('#tamDelusion') as HTMLInputElement).value) || 50,
        sunkCostAnchor: Number((modal.querySelector('#sunkCostAnchor') as HTMLInputElement).value) || 50,
        founderOmniscience: Number((modal.querySelector('#founderOmniscience') as HTMLInputElement).value) || 50,
        churnBlindspot: Number((modal.querySelector('#churnBlindspot') as HTMLInputElement).value) || 50,
        burnApathy: Number((modal.querySelector('#burnApathy') as HTMLInputElement).value) || 50,
        keyManDependency: Number((modal.querySelector('#keyManDependency') as HTMLInputElement).value) || 50,
      },
      diligenceNotes: 'Custom intake startup registered for comprehensive CBT cognitive risk evaluation.',
    };

    store.addStartup(newStartup);
  });

  overlay.appendChild(modal);
  return overlay;
}
