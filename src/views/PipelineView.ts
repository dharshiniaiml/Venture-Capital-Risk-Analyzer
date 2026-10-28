import { store } from '../framework/store';
import { calculateRiskAssessment } from '../engine/scorer';
import { Startup } from '../engine/types';

export function renderPipelineView(): HTMLElement {
  const state = store.getState();
  const root = document.createElement('div');
  root.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6';

  // Calculate assessed metrics for all startups
  const assessedList = state.startups.map((s) => ({
    startup: s,
    assessment: calculateRiskAssessment(s, state.stressScenario),
  }));

  // Filtering
  const filtered = assessedList.filter(({ startup, assessment }) => {
    if (state.filters.sector !== 'All' && startup.sector !== state.filters.sector) return false;
    if (state.filters.stage !== 'All' && startup.stage !== state.filters.stage) return false;
    if (state.filters.riskTier !== 'All' && assessment.riskTier !== state.filters.riskTier) return false;
    if (state.filters.search) {
      const q = state.filters.search.toLowerCase();
      const matchName = startup.name.toLowerCase().includes(q);
      const matchSector = startup.sector.toLowerCase().includes(q);
      const matchTag = startup.tagline.toLowerCase().includes(q);
      if (!matchName && !matchSector && !matchTag) return false;
    }
    return true;
  });

  // KPI Metrics Calculation
  const totalValuation = state.startups.reduce((acc, s) => acc + s.askingValuation, 0);
  const avgBurn = (state.startups.reduce((acc, s) => acc + s.burnMultiple, 0) / state.startups.length).toFixed(1);
  const avgRunway = Math.round(state.startups.reduce((acc, s) => acc + s.runwayMonths, 0) / state.startups.length);
  const avgCbt = Math.round(
    assessedList.reduce((acc, item) => acc + item.assessment.cbtCognitiveScore, 0) / assessedList.length
  );

  // Top Section: Editorial title & unboxed metadata
  const headerBlock = document.createElement('div');
  headerBlock.className = 'flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5';
  headerBlock.innerHTML = `
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-100">Venture Pipeline & Risk Scoring</h1>
      <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
        <span>Active Pipeline: ${state.startups.length} Companies</span>
        <span aria-hidden="true">·</span>
        <span>Screening Horizon: 24 Months</span>
        <span aria-hidden="true">·</span>
        <span>CBT Cognitive Bias Engine v2.4</span>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button id="restore-cohort-btn" class="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer px-2 py-1">
        Reset Default Cohort
      </button>
    </div>
  `;

  headerBlock.querySelector('#restore-cohort-btn')?.addEventListener('click', () => {
    store.restoreDefaults();
  });

  // KPI Summary Strip (4-column row)
  const kpiStrip = document.createElement('div');
  kpiStrip.className = 'grid grid-cols-2 md:grid-cols-4 gap-4';
  kpiStrip.innerHTML = `
    <div class="bg-[#0f172a] border border-slate-800/80 rounded-lg p-4">
      <div class="text-xs text-slate-400">Total Pipeline Enterprise Value</div>
      <div class="text-xl font-bold text-slate-100 font-mono tabular-nums mt-1">$${(totalValuation / 1000000).toFixed(1)}M</div>
      <div class="text-[11px] text-slate-500 mt-0.5">Across ${state.startups.length} deals</div>
    </div>
    <div class="bg-[#0f172a] border border-slate-800/80 rounded-lg p-4">
      <div class="text-xs text-slate-400">Cohort Median Burn Multiple</div>
      <div class="text-xl font-bold font-mono tabular-nums mt-1 ${Number(avgBurn) > 1.8 ? 'text-amber-400' : 'text-emerald-400'}">${avgBurn}x</div>
      <div class="text-[11px] text-slate-500 mt-0.5">Top-decile benchmark: &lt;1.0x</div>
    </div>
    <div class="bg-[#0f172a] border border-slate-800/80 rounded-lg p-4">
      <div class="text-xs text-slate-400">Median Cash Runway Buffer</div>
      <div class="text-xl font-bold font-mono tabular-nums mt-1 text-slate-100">${avgRunway} mo.</div>
      <div class="text-[11px] text-slate-500 mt-0.5">Target buffer &ge; 18 months</div>
    </div>
    <div class="bg-[#0f172a] border border-slate-800/80 rounded-lg p-4">
      <div class="text-xs text-slate-400">CBT Cognitive Bias Mean</div>
      <div class="text-xl font-bold font-mono tabular-nums mt-1 ${avgCbt > 55 ? 'text-rose-400' : 'text-sky-400'}">${avgCbt}/100</div>
      <div class="text-[11px] text-slate-500 mt-0.5">Psychological fragility index</div>
    </div>
  `;

  // Controls & Filter Bar
  const filterBar = document.createElement('div');
  filterBar.className = 'bg-[#0f172a] border border-slate-800 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs';

  // Search input
  const searchWrap = document.createElement('div');
  searchWrap.className = 'flex items-center gap-2 bg-[#090d16] border border-slate-700/80 rounded-md px-3 py-1.5 w-full sm:w-64';
  searchWrap.innerHTML = `
    <svg class="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 1114 0z"></path>
    </svg>
    <input type="text" placeholder="Search startup, sector, thesis..." value="${state.filters.search}" class="bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none w-full text-xs" id="search-input" />
  `;

  searchWrap.querySelector('#search-input')?.addEventListener('input', (e: any) => {
    store.setFilter('search', e.target.value);
  });

  // Filter Dropdowns / Segments
  const controlsRight = document.createElement('div');
  controlsRight.className = 'flex flex-wrap items-center gap-2.5';

  // Sector Select
  const sectors = ['All', 'AI & Agents', 'Enterprise SaaS', 'DeepTech Robotics', 'Fintech', 'BioTech', 'ClimateTech'];
  const sectorSelect = document.createElement('select');
  sectorSelect.className = 'bg-[#090d16] border border-slate-700 text-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none text-xs';
  sectors.forEach((sec) => {
    const opt = document.createElement('option');
    opt.value = sec;
    opt.textContent = sec === 'All' ? 'All Sectors' : sec;
    if (state.filters.sector === sec) opt.selected = true;
    sectorSelect.appendChild(opt);
  });
  sectorSelect.onchange = (e: any) => store.setFilter('sector', e.target.value);

  // Stage Select
  const stages = ['All', 'Pre-Seed', 'Seed', 'Series A', 'Series B'];
  const stageSelect = document.createElement('select');
  stageSelect.className = 'bg-[#090d16] border border-slate-700 text-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none text-xs';
  stages.forEach((stg) => {
    const opt = document.createElement('option');
    opt.value = stg;
    opt.textContent = stg === 'All' ? 'All Stages' : stg;
    if (state.filters.stage === stg) opt.selected = true;
    stageSelect.appendChild(opt);
  });
  stageSelect.onchange = (e: any) => store.setFilter('stage', e.target.value);

  // Risk Tier Select
  const riskTiers = ['All', 'Low Risk', 'Moderate Risk', 'High Risk', 'Critical Risk'];
  const riskSelect = document.createElement('select');
  riskSelect.className = 'bg-[#090d16] border border-slate-700 text-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none text-xs';
  riskTiers.forEach((rt) => {
    const opt = document.createElement('option');
    opt.value = rt;
    opt.textContent = rt === 'All' ? 'All Risk Grades' : rt;
    if (state.filters.riskTier === rt) opt.selected = true;
    riskSelect.appendChild(opt);
  });
  riskSelect.onchange = (e: any) => store.setFilter('riskTier', e.target.value);

  // Reset Filters button
  const resetBtn = document.createElement('button');
  resetBtn.className = 'text-slate-400 hover:text-slate-200 px-2 py-1 text-xs cursor-pointer';
  resetBtn.textContent = 'Clear Filters';
  resetBtn.onclick = () => store.resetFilters();

  controlsRight.appendChild(sectorSelect);
  controlsRight.appendChild(stageSelect);
  controlsRight.appendChild(riskSelect);
  controlsRight.appendChild(resetBtn);

  filterBar.appendChild(searchWrap);
  filterBar.appendChild(controlsRight);

  // Data Table Container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'bg-[#0f172a] border border-slate-800 rounded-lg overflow-hidden';

  if (filtered.length === 0) {
    tableContainer.innerHTML = `
      <div class="p-12 text-center text-slate-400">
        <div class="text-sm font-medium text-slate-300">No startups match active filters</div>
        <div class="text-xs text-slate-500 mt-1">Try resetting your filter parameters or search terms.</div>
        <button id="clear-empty-filter" class="mt-4 px-3 py-1.5 text-xs bg-slate-800 text-slate-200 rounded-md hover:bg-slate-700 transition-colors">
          Reset All Filters
        </button>
      </div>
    `;
    tableContainer.querySelector('#clear-empty-filter')?.addEventListener('click', () => store.resetFilters());
  } else {
    const table = document.createElement('table');
    table.className = 'w-full text-left border-collapse text-xs';

    table.innerHTML = `
      <thead>
        <tr class="border-b border-slate-800 bg-[#090d16]/70 text-slate-400 font-semibold tracking-wider">
          <th class="py-3 px-4">Company & Thesis</th>
          <th class="py-3 px-3 text-right">ARR</th>
          <th class="py-3 px-3 text-right">YoY Growth</th>
          <th class="py-3 px-3 text-right">Runway</th>
          <th class="py-3 px-3 text-right">Burn Mult.</th>
          <th class="py-3 px-3 text-right">CBT Bias</th>
          <th class="py-3 px-3 text-center">Risk Grade</th>
          <th class="py-3 px-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800/60" id="table-body">
      </tbody>
    `;

    const tbody = table.querySelector('#table-body') as HTMLElement;

    filtered.forEach(({ startup, assessment }) => {
      const tr = document.createElement('tr');
      const isSelected = startup.id === state.selectedStartupId;
      tr.className = `hover:bg-slate-800/40 transition-colors cursor-pointer ${
        isSelected ? 'bg-sky-950/20' : ''
      }`;

      // Clean unboxed color status (no pill badges)
      let gradeColor = 'text-emerald-400';
      if (assessment.letterGrade === 'C') gradeColor = 'text-amber-400';
      if (assessment.letterGrade === 'D' || assessment.letterGrade === 'F') gradeColor = 'text-rose-400';

      tr.innerHTML = `
        <td class="py-3 px-4">
          <div class="font-semibold text-slate-200 text-sm">${startup.name}</div>
          <div class="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span>${startup.stage}</span>
            <span aria-hidden="true">·</span>
            <span>${startup.sector}</span>
            <span aria-hidden="true">·</span>
            <span>${startup.headquarters}</span>
          </div>
        </td>
        <td class="py-3 px-3 text-right font-mono tabular-nums text-slate-200">
          $${(startup.arr / 1000000).toFixed(2)}M
        </td>
        <td class="py-3 px-3 text-right font-mono tabular-nums ${startup.growthRate >= 100 ? 'text-emerald-400' : 'text-slate-300'}">
          +${startup.growthRate}%
        </td>
        <td class="py-3 px-3 text-right font-mono tabular-nums ${startup.runwayMonths < 10 ? 'text-rose-400' : 'text-slate-200'}">
          ${startup.runwayMonths} mo
        </td>
        <td class="py-3 px-3 text-right font-mono tabular-nums ${startup.burnMultiple > 2.0 ? 'text-rose-400' : startup.burnMultiple > 1.5 ? 'text-amber-400' : 'text-emerald-400'}">
          ${startup.burnMultiple}x
        </td>
        <td class="py-3 px-3 text-right font-mono tabular-nums ${assessment.cbtCognitiveScore > 65 ? 'text-rose-400' : assessment.cbtCognitiveScore > 45 ? 'text-amber-400' : 'text-slate-300'}">
          ${assessment.cbtCognitiveScore}/100
        </td>
        <td class="py-3 px-3 text-center">
          <div class="font-mono tabular-nums font-bold text-sm ${gradeColor}">
            ${assessment.letterGrade}
          </div>
          <div class="text-[10px] text-slate-400 font-mono">
            Score: ${assessment.compositeRiskScore}
          </div>
        </td>
        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-2">
            <button class="select-diligence-btn text-xs text-sky-400 hover:text-sky-300 font-medium px-2 py-1 rounded hover:bg-sky-950/40 transition-colors">
              Audit
            </button>
            <button class="select-stress-btn text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition-colors">
              Simulate
            </button>
          </div>
        </td>
      `;

      tr.onclick = (e) => {
        // Prevent clicking buttons from triggering twice
        const target = e.target as HTMLElement;
        if (target.closest('.select-diligence-btn')) {
          store.setSelectedStartup(startup.id);
          store.setActiveTab('audit');
          return;
        }
        if (target.closest('.select-stress-btn')) {
          store.setSelectedStartup(startup.id);
          store.setActiveTab('simulator');
          return;
        }
        store.setSelectedStartup(startup.id);
      };

      tbody.appendChild(tr);
    });

    tableContainer.appendChild(table);
  }

  root.appendChild(headerBlock);
  root.appendChild(kpiStrip);
  root.appendChild(filterBar);
  root.appendChild(tableContainer);

  return root;
}
