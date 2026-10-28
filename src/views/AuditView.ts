import { store } from '../framework/store';
import { calculateRiskAssessment } from '../engine/scorer';
import { renderRadarChart } from '../charts/radar-canvas';
import { renderTornadoChart } from '../charts/tornado-canvas';

export function renderAuditView(): HTMLElement {
  const state = store.getState();
  const startup = store.getSelectedStartup();
  const assessment = calculateRiskAssessment(startup, state.stressScenario);

  const root = document.createElement('div');
  root.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6';

  // Header & Company Selector
  const headerBlock = document.createElement('div');
  headerBlock.className = 'flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5';

  const selectorHtml = `
    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-sky-400 text-lg border border-slate-700 shrink-0">
        ${startup.name.slice(0, 2).toUpperCase()}
      </div>
      <div>
        <div class="flex items-center gap-3">
          <select id="company-picker" class="bg-[#0f172a] border border-slate-700 text-slate-100 font-bold text-lg rounded-md px-2.5 py-1 focus:outline-none">
            ${state.startups
              .map(
                (s) =>
                  `<option value="${s.id}" ${s.id === startup.id ? 'selected' : ''}>${s.name} (${s.stage})</option>`
              )
              .join('')}
          </select>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
          <span>${startup.stage}</span>
          <span aria-hidden="true">·</span>
          <span>${startup.sector}</span>
          <span aria-hidden="true">·</span>
          <span>HQ: ${startup.headquarters}</span>
          <span aria-hidden="true">·</span>
          <span>Founded ${startup.foundingYear}</span>
          <span aria-hidden="true">·</span>
          <span>${startup.teamSize} Headcount</span>
        </div>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button id="jump-to-memo-btn" class="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-md transition-colors whitespace-nowrap cursor-pointer">
        View AI Partner Memo
      </button>
    </div>
  `;
  headerBlock.innerHTML = selectorHtml;

  headerBlock.querySelector('#company-picker')?.addEventListener('change', (e: any) => {
    store.setSelectedStartup(e.target.value);
  });
  headerBlock.querySelector('#jump-to-memo-btn')?.addEventListener('click', () => {
    store.setActiveTab('diligence');
  });

  // Top Metric Cards Row (Risk Summary, Radar Chart, Quantitative Core)
  const topGrid = document.createElement('div');
  topGrid.className = 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch';

  // Column 1: Composite Risk Grade (4 cols)
  const riskSummaryCard = document.createElement('div');
  riskSummaryCard.className = 'lg:col-span-4 bg-[#0f172a] border border-slate-800 rounded-lg p-5 flex flex-col justify-between';

  let gradeColor = 'text-emerald-400';
  let tierBadgeBg = 'text-emerald-400';
  if (assessment.letterGrade === 'C') {
    gradeColor = 'text-amber-400';
    tierBadgeBg = 'text-amber-400';
  } else if (assessment.letterGrade === 'D' || assessment.letterGrade === 'F') {
    gradeColor = 'text-rose-400';
    tierBadgeBg = 'text-rose-400';
  }

  riskSummaryCard.innerHTML = `
    <div>
      <div class="text-xs font-semibold uppercase tracking-wider text-slate-400">Composite Risk Grade</div>
      <div class="flex items-baseline gap-4 mt-2">
        <div class="text-5xl font-extrabold font-mono tabular-nums ${gradeColor}">${assessment.letterGrade}</div>
        <div>
          <div class="text-xl font-bold font-mono tabular-nums text-slate-200">${assessment.compositeRiskScore} <span class="text-xs text-slate-400 font-normal">/ 100 Index</span></div>
          <div class="text-xs font-medium ${tierBadgeBg}">${assessment.riskTier}</div>
        </div>
      </div>

      <div class="mt-5 space-y-3 pt-4 border-t border-slate-800/80 text-xs">
        <div>
          <div class="text-slate-400">Primary Risk Bottleneck</div>
          <div class="font-semibold text-slate-200 mt-0.5">${assessment.keyRiskDriver}</div>
        </div>
        <div>
          <div class="text-slate-400">Mandatory Diligence Covenant</div>
          <div class="text-slate-300 mt-0.5 leading-relaxed">${assessment.topMitigation}</div>
        </div>
      </div>
    </div>

    <div class="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
      <div>
        <span class="text-slate-400">CBT Bias Index</span>
        <div class="font-mono tabular-nums font-bold text-sm text-slate-200 mt-0.5">${assessment.cbtCognitiveScore}/100</div>
      </div>
      <div>
        <span class="text-slate-400">Unit Econ Stress</span>
        <div class="font-mono tabular-nums font-bold text-sm text-slate-200 mt-0.5">${assessment.unitEconomicsScore}/100</div>
      </div>
    </div>
  `;

  // Column 2: HTML5 Canvas Radar / Spider Chart (5 cols)
  const radarCard = document.createElement('div');
  radarCard.className = 'lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-lg p-5 flex flex-col';
  radarCard.innerHTML = `
    <div class="flex items-center justify-between pb-2 border-b border-slate-800/60">
      <div>
        <div class="text-xs font-semibold text-slate-300">Risk Dimension Spider Chart</div>
        <div class="text-[11px] text-slate-500">Comparing company profile against cohort median</div>
      </div>
      <div class="text-[10px] text-slate-400 font-mono">
        <span class="inline-block w-2.5 h-0.5 bg-sky-400 mr-1"></span> Startup
        <span class="inline-block w-2.5 h-0.5 border-b border-dashed border-slate-400 mx-1"></span> Median
      </div>
    </div>
    <div class="flex-1 flex items-center justify-center py-2">
      <canvas id="radar-canvas" class="w-full h-[300px]"></canvas>
    </div>
  `;

  // Column 3: Quantitative Unit Economics (3 cols)
  const quantCard = document.createElement('div');
  quantCard.className = 'lg:col-span-3 bg-[#0f172a] border border-slate-800 rounded-lg p-5 flex flex-col justify-between text-xs space-y-3';
  quantCard.innerHTML = `
    <div>
      <div class="text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800/60">Quantitative Unit Economics</div>
      <div class="mt-3 space-y-3">
        <div class="flex justify-between items-center py-1 border-b border-slate-800/40">
          <span class="text-slate-400">Annual Revenue</span>
          <span class="font-mono tabular-nums font-bold text-slate-200">$${(startup.arr / 1000000).toFixed(2)}M</span>
        </div>
        <div class="flex justify-between items-center py-1 border-b border-slate-800/40">
          <span class="text-slate-400">Burn Multiple</span>
          <span class="font-mono tabular-nums font-bold ${startup.burnMultiple > 2.0 ? 'text-rose-400' : 'text-slate-200'}">${startup.burnMultiple}x</span>
        </div>
        <div class="flex justify-between items-center py-1 border-b border-slate-800/40">
          <span class="text-slate-400">Cash Runway</span>
          <span class="font-mono tabular-nums font-bold ${startup.runwayMonths < 10 ? 'text-rose-400' : 'text-slate-200'}">${startup.runwayMonths} mo</span>
        </div>
        <div class="flex justify-between items-center py-1 border-b border-slate-800/40">
          <span class="text-slate-400">Net Dollar Retention</span>
          <span class="font-mono tabular-nums font-bold ${startup.netDollarRetention >= 120 ? 'text-emerald-400' : 'text-slate-200'}">${startup.netDollarRetention}%</span>
        </div>
        <div class="flex justify-between items-center py-1 border-b border-slate-800/40">
          <span class="text-slate-400">CAC Payback</span>
          <span class="font-mono tabular-nums font-bold text-slate-200">${startup.cacPaybackMonths} mo</span>
        </div>
        <div class="flex justify-between items-center py-1 border-b border-slate-800/40">
          <span class="text-slate-400">Gross Margin</span>
          <span class="font-mono tabular-nums font-bold text-slate-200">${startup.grossMargin}%</span>
        </div>
        <div class="flex justify-between items-center py-1">
          <span class="text-slate-400">Founder Equity</span>
          <span class="font-mono tabular-nums font-bold text-slate-200">${startup.founderEquityPercent}%</span>
        </div>
      </div>
    </div>
    <div class="pt-2 text-[11px] text-slate-500 border-t border-slate-800/80">
      Asking Val: <span class="font-mono font-bold text-slate-300">$${(startup.askingValuation / 1000000).toFixed(1)}M</span>
    </div>
  `;

  topGrid.appendChild(riskSummaryCard);
  topGrid.appendChild(radarCard);
  topGrid.appendChild(quantCard);

  // Section 2: Cognitive-Behavioral Thesis (CBT) Trait Matrix & Interactive Calibrator
  const cbtSection = document.createElement('div');
  cbtSection.className = 'bg-[#0f172a] border border-slate-800 rounded-lg p-5 space-y-4';

  cbtSection.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
      <div>
        <h2 class="text-base font-bold text-slate-100">CBT Cognitive Bias & Founder Psychology Engine</h2>
        <p class="text-xs text-slate-400">Adjust behavioral trait ratings based on founder interviews to recalibrate risk in real time.</p>
      </div>
      <div class="text-xs text-slate-500">
        Scale: 0 (Disciplined / Resilient) &rarr; 100 (Severe Cognitive Hazard)
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="cbt-sliders-container">
    </div>
  `;

  const slidersContainer = cbtSection.querySelector('#cbt-sliders-container') as HTMLElement;

  const traitsConfig: Array<{
    key: keyof typeof startup.cbtTraits;
    name: string;
    subtitle: string;
    rationale: string;
  }> = [
    {
      key: 'tamDelusion',
      name: 'TAM Sizing & Dunning-Kruger',
      subtitle: 'Market size overestimation vs bottom-up addressability',
      rationale: 'Overconfident projections lead to premature team scaling and excessive burn ahead of true PMF.',
    },
    {
      key: 'sunkCostAnchor',
      name: 'Sunk Cost & Pivot Reluctance',
      subtitle: 'Attachment to dead features or unviable architectures',
      rationale: 'Reluctance to write off capital investments delays necessary market pivots by 6-9 months.',
    },
    {
      key: 'founderOmniscience',
      name: 'Founder Omniscience & Micromanagement',
      subtitle: 'Inability to delegate executive and sales authority',
      rationale: 'Founder becomes the primary operational bottleneck, stifling VP hires and organizational scale.',
    },
    {
      key: 'churnBlindspot',
      name: 'Churn Signal Avoidance',
      subtitle: 'Rationalizing customer churn as "non-ideal ICP"',
      rationale: 'Ignores product friction until cohort retention degrades below 95% net dollar retention.',
    },
    {
      key: 'burnApathy',
      name: 'Capital Frugality Friction',
      subtitle: 'Vanity spending & tolerance for loose unit margins',
      rationale: 'Treats investor equity as non-dilutive working capital rather than high-cost risk capital.',
    },
    {
      key: 'keyManDependency',
      name: 'Key-Person Single Failure Point',
      subtitle: 'Asymmetric reliance on single founder for core IP',
      rationale: 'Leaves the enterprise vulnerable to partner fallout, burnout, or unmitigated cap-table holdouts.',
    },
  ];

  traitsConfig.forEach((trait) => {
    const val = startup.cbtTraits[trait.key];
    const item = document.createElement('div');
    item.className = 'bg-[#090d16] border border-slate-800 rounded-md p-3.5 flex flex-col justify-between space-y-2.5';

    let valColor = 'text-emerald-400';
    if (val > 65) valColor = 'text-rose-400';
    else if (val > 45) valColor = 'text-amber-400';

    item.innerHTML = `
      <div>
        <div class="flex items-center justify-between text-xs">
          <span class="font-semibold text-slate-200">${trait.name}</span>
          <span class="font-mono tabular-nums font-bold ${valColor}" id="val-${trait.key}">${val}/100</span>
        </div>
        <div class="text-[11px] text-slate-400 mt-0.5">${trait.subtitle}</div>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value="${val}"
        class="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        id="slider-${trait.key}"
      />

      <div class="text-[10px] text-slate-500 leading-tight">
        ${trait.rationale}
      </div>
    `;

    const slider = item.querySelector(`#slider-${trait.key}`) as HTMLInputElement;
    slider.addEventListener('input', (e: any) => {
      const newVal = Number(e.target.value);
      const updatedStartup = {
        ...startup,
        cbtTraits: {
          ...startup.cbtTraits,
          [trait.key]: newVal,
        },
      };
      store.updateStartup(updatedStartup);
    });

    slidersContainer.appendChild(item);
  });

  // Section 3: Sensitivity Tornado Chart
  const tornadoSection = document.createElement('div');
  tornadoSection.className = 'bg-[#0f172a] border border-slate-800 rounded-lg p-5 space-y-3';
  tornadoSection.innerHTML = `
    <div class="flex items-center justify-between pb-2 border-b border-slate-800/60">
      <div>
        <h3 class="text-sm font-bold text-slate-200">Sensitivity Tornado Chart</h3>
        <p class="text-xs text-slate-400">Identifies which single operational or cognitive swing moves overall risk the most</p>
      </div>
      <div class="text-xs text-slate-400 font-mono">
        <span class="text-emerald-400">Green</span>: Downside Reduction · <span class="text-rose-400">Red</span>: Hazard Expansion
      </div>
    </div>
    <div class="flex items-center justify-center py-2">
      <canvas id="tornado-canvas" class="w-full h-[240px]"></canvas>
    </div>
  `;

  root.appendChild(headerBlock);
  root.appendChild(topGrid);
  root.appendChild(cbtSection);
  root.appendChild(tornadoSection);

  // Trigger canvas drawings after DOM mount
  setTimeout(() => {
    const radarCanvas = root.querySelector('#radar-canvas') as HTMLCanvasElement;
    if (radarCanvas) {
      renderRadarChart(radarCanvas, assessment.radarAxes, startup.name);
    }
    const tornadoCanvas = root.querySelector('#tornado-canvas') as HTMLCanvasElement;
    if (tornadoCanvas) {
      renderTornadoChart(tornadoCanvas, assessment.tornado, assessment.compositeRiskScore);
    }
  }, 50);

  return root;
}
