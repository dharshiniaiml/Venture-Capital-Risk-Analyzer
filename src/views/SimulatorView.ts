import { store } from '../framework/store';
import { calculateRiskAssessment } from '../engine/scorer';
import { renderMonteCarloChart } from '../charts/monte-carlo-canvas';

export function renderSimulatorView(): HTMLElement {
  const state = store.getState();
  const startup = store.getSelectedStartup();
  const scenario = state.stressScenario;

  const baselineAssessment = calculateRiskAssessment(startup);
  const stressedAssessment = calculateRiskAssessment(startup, scenario);

  const root = document.createElement('div');
  root.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6';

  // Header Block
  const header = document.createElement('div');
  header.className = 'flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5';
  header.innerHTML = `
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-100">Macro Stress-Testing & Monte Carlo Simulator</h1>
      <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
        <span>Active Subject: <strong class="text-slate-200">${startup.name}</strong></span>
        <span aria-hidden="true">·</span>
        <span>Runway: ${startup.runwayMonths} Months</span>
        <span aria-hidden="true">·</span>
        <span>1,000 Iterations Stochastic Walk</span>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <select id="sim-company-select" class="bg-[#0f172a] border border-slate-700 text-slate-200 text-xs rounded-md px-3 py-1.5 focus:outline-none">
        ${state.startups
          .map((s) => `<option value="${s.id}" ${s.id === startup.id ? 'selected' : ''}>${s.name}</option>`)
          .join('')}
      </select>
      <button id="reset-scenario-btn" class="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 rounded-md transition-colors cursor-pointer">
        Reset Scenario
      </button>
    </div>
  `;

  header.querySelector('#sim-company-select')?.addEventListener('change', (e: any) => {
    store.setSelectedStartup(e.target.value);
  });
  header.querySelector('#reset-scenario-btn')?.addEventListener('click', () => {
    store.resetScenario();
  });

  // Main 2-Column Grid: Left Controls (5 cols), Right Simulation Canvas (7 cols)
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch';

  // Left Column: Scenario Controls & Presets
  const controlsCard = document.createElement('div');
  controlsCard.className = 'lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-lg p-5 flex flex-col justify-between space-y-5';

  controlsCard.innerHTML = `
    <div>
      <div class="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h2 class="text-sm font-bold text-slate-200">Macro & Execution Stress Dials</h2>
          <p class="text-[11px] text-slate-500">Inject shocks to simulate capital exhaustion vulnerability</p>
        </div>
      </div>

      <!-- Quick Preset Buttons -->
      <div class="mt-3">
        <div class="text-[11px] text-slate-400 mb-1.5">Scenario Presets:</div>
        <div class="flex flex-wrap gap-1.5">
          <button id="preset-baseline" class="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer">
            Baseline (0%)
          </button>
          <button id="preset-mild" class="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors cursor-pointer">
            Tech Correction
          </button>
          <button id="preset-winter" class="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-rose-300 rounded transition-colors cursor-pointer">
            VC Winter
          </button>
          <button id="preset-severe" class="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-rose-400 rounded transition-colors cursor-pointer">
            Severe Shock
          </button>
        </div>
      </div>

      <!-- Sliders List -->
      <div class="mt-4 space-y-3.5 text-xs">
        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-slate-300">Market Procurement Downturn</span>
            <span class="font-mono tabular-nums text-slate-400 font-bold" id="val-downturn">-${scenario.marketDownturn}%</span>
          </div>
          <input type="range" min="0" max="50" step="5" value="${scenario.marketDownturn}" class="w-full accent-sky-400 h-1.5 bg-slate-800 rounded cursor-pointer" id="slider-downturn" />
          <div class="text-[10px] text-slate-500 mt-0.5">Enterprise sales cycle freeze & pipeline shrinkage</div>
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-slate-300">CAC Acquisition Inflation</span>
            <span class="font-mono tabular-nums text-slate-400 font-bold" id="val-cac">+${scenario.cacInflation}%</span>
          </div>
          <input type="range" min="0" max="100" step="10" value="${scenario.cacInflation}" class="w-full accent-sky-400 h-1.5 bg-slate-800 rounded cursor-pointer" id="slider-cac" />
          <div class="text-[10px] text-slate-500 mt-0.5">Competitive ad cost surge & outbound conversion decline</div>
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-slate-300">Customer Churn Shock Spike</span>
            <span class="font-mono tabular-nums text-slate-400 font-bold" id="val-churn">+${scenario.churnSpike}%</span>
          </div>
          <input type="range" min="0" max="30" step="2" value="${scenario.churnSpike}" class="w-full accent-sky-400 h-1.5 bg-slate-800 rounded cursor-pointer" id="slider-churn" />
          <div class="text-[10px] text-slate-500 mt-0.5">Client logo attrition & downgrade contraction</div>
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-slate-300">Next Equity Round Delay</span>
            <span class="font-mono tabular-nums text-slate-400 font-bold" id="val-delay">+${scenario.roundDelayMonths} mo</span>
          </div>
          <input type="range" min="0" max="12" step="1" value="${scenario.roundDelayMonths}" class="w-full accent-sky-400 h-1.5 bg-slate-800 rounded cursor-pointer" id="slider-delay" />
          <div class="text-[10px] text-slate-500 mt-0.5">Series bridge / extension funding term-sheet delay</div>
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-slate-300">CBT Founder Cognitive Friction</span>
            <span class="font-mono tabular-nums text-slate-400 font-bold" id="val-cbt">+${scenario.founderFriction}%</span>
          </div>
          <input type="range" min="0" max="50" step="5" value="${scenario.founderFriction}" class="w-full accent-sky-400 h-1.5 bg-slate-800 rounded cursor-pointer" id="slider-cbt" />
          <div class="text-[10px] text-slate-500 mt-0.5">Heightened denial, micromanagement, and refusal to right-size</div>
        </div>
      </div>
    </div>

    <!-- Comparative Score Summary Box -->
    <div class="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
      <div class="bg-[#090d16] p-2.5 rounded border border-slate-800">
        <div class="text-slate-500">Baseline Risk Index</div>
        <div class="text-lg font-mono tabular-nums font-bold text-slate-200 mt-0.5">
          ${baselineAssessment.compositeRiskScore} <span class="text-xs font-normal">(${baselineAssessment.letterGrade})</span>
        </div>
      </div>
      <div class="bg-[#090d16] p-2.5 rounded border border-slate-800">
        <div class="text-slate-500">Stressed Risk Index</div>
        <div class="text-lg font-mono tabular-nums font-bold ${stressedAssessment.compositeRiskScore > baselineAssessment.compositeRiskScore ? 'text-rose-400' : 'text-slate-200'} mt-0.5">
          ${stressedAssessment.compositeRiskScore} <span class="text-xs font-normal">(${stressedAssessment.letterGrade})</span>
        </div>
      </div>
    </div>
  `;

  // Hook up preset buttons
  controlsCard.querySelector('#preset-baseline')?.addEventListener('click', () => {
    store.resetScenario();
  });
  controlsCard.querySelector('#preset-mild')?.addEventListener('click', () => {
    store.updateScenario({ marketDownturn: 15, cacInflation: 25, churnSpike: 6, roundDelayMonths: 3, founderFriction: 10 });
  });
  controlsCard.querySelector('#preset-winter')?.addEventListener('click', () => {
    store.updateScenario({ marketDownturn: 35, cacInflation: 60, churnSpike: 12, roundDelayMonths: 7, founderFriction: 25 });
  });
  controlsCard.querySelector('#preset-severe')?.addEventListener('click', () => {
    store.updateScenario({ marketDownturn: 50, cacInflation: 80, churnSpike: 20, roundDelayMonths: 10, founderFriction: 40 });
  });

  // Hook up slider events
  const bindSlider = (id: string, key: keyof typeof scenario) => {
    const el = controlsCard.querySelector(`#slider-${id}`) as HTMLInputElement;
    el?.addEventListener('input', (e: any) => {
      store.updateScenario({ [key]: Number(e.target.value) });
    });
  };
  bindSlider('downturn', 'marketDownturn');
  bindSlider('cac', 'cacInflation');
  bindSlider('churn', 'churnSpike');
  bindSlider('delay', 'roundDelayMonths');
  bindSlider('cbt', 'founderFriction');

  // Right Column: Canvas Monte Carlo Visualization (7 cols)
  const canvasCard = document.createElement('div');
  canvasCard.className = 'lg:col-span-7 bg-[#0f172a] border border-slate-800 rounded-lg p-5 flex flex-col justify-between';

  canvasCard.innerHTML = `
    <div>
      <div class="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h2 class="text-sm font-bold text-slate-200">Monte Carlo 24-Month Cash Depletion Cone</h2>
          <p class="text-[11px] text-slate-500">Stochastic simulation with Gaussian macroeconomic drift & churn shocks</p>
        </div>
      </div>

      <!-- KPI Stat Indicators -->
      <div class="grid grid-cols-3 gap-3 my-4">
        <div class="bg-[#090d16] p-3 rounded border border-slate-800">
          <div class="text-[11px] text-slate-400">12-Mo Insolvency Risk</div>
          <div class="text-xl font-mono tabular-nums font-bold ${stressedAssessment.simulation.failureProbability12Mo > 30 ? 'text-rose-400' : 'text-slate-200'} mt-1">
            ${stressedAssessment.simulation.failureProbability12Mo}%
          </div>
          <div class="text-[10px] text-slate-500 mt-0.5">Probability of zero cash</div>
        </div>
        <div class="bg-[#090d16] p-3 rounded border border-slate-800">
          <div class="text-[11px] text-slate-400">24-Mo Insolvency Risk</div>
          <div class="text-xl font-mono tabular-nums font-bold ${stressedAssessment.simulation.failureProbability24Mo > 50 ? 'text-rose-400' : 'text-slate-200'} mt-1">
            ${stressedAssessment.simulation.failureProbability24Mo}%
          </div>
          <div class="text-[10px] text-slate-500 mt-0.5">Full horizon default risk</div>
        </div>
        <div class="bg-[#090d16] p-3 rounded border border-slate-800">
          <div class="text-[11px] text-slate-400">P10 Conservative Runway</div>
          <div class="text-xl font-mono tabular-nums font-bold text-sky-400 mt-1">
            ${stressedAssessment.simulation.p10Runway} mo
          </div>
          <div class="text-[10px] text-slate-500 mt-0.5">Downside 10th percentile</div>
        </div>
      </div>

      <!-- Canvas Plot -->
      <div class="w-full flex items-center justify-center">
        <canvas id="monte-carlo-canvas" class="w-full h-[280px]"></canvas>
      </div>
    </div>

    <div class="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
      <span>Starting Bank Balance: <strong class="text-slate-200 font-mono tabular-nums">$${(startup.cashBalance / 1000000).toFixed(2)}M</strong></span>
      <span>Effective Burn: <strong class="text-slate-200 font-mono tabular-nums">$${Math.round(startup.monthlyBurn / 1000)}k/mo</strong></span>
    </div>
  `;

  grid.appendChild(controlsCard);
  grid.appendChild(canvasCard);

  root.appendChild(header);
  root.appendChild(grid);

  // Trigger canvas drawing
  setTimeout(() => {
    const canvas = root.querySelector('#monte-carlo-canvas') as HTMLCanvasElement;
    if (canvas) {
      renderMonteCarloChart(canvas, stressedAssessment.simulation, startup.cashBalance, startup.monthlyBurn);
    }
  }, 50);

  return root;
}
