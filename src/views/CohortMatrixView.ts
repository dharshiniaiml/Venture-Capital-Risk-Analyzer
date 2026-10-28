import { store } from '../framework/store';
import { calculateRiskAssessment } from '../engine/scorer';

export function renderCohortMatrixView(): HTMLElement {
  const state = store.getState();
  const root = document.createElement('div');
  root.className = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6';

  const assessedList = state.startups.map((s) => ({
    startup: s,
    assessment: calculateRiskAssessment(s, state.stressScenario),
  }));

  // Header
  const header = document.createElement('div');
  header.className = 'flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5';
  header.innerHTML = `
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-slate-100">Cohort Efficiency Frontier & Risk Mapping</h1>
      <div class="flex items-center gap-2 text-xs text-slate-400 mt-1">
        <span>Framework: Bessemer & Benchmark Efficiency Matrix</span>
        <span aria-hidden="true">·</span>
        <span>${state.startups.length} Portfolio Deals Plotted</span>
        <span aria-hidden="true">·</span>
        <span>Bubble Radius: ARR Scale</span>
      </div>
    </div>
  `;

  // Plot Canvas Card
  const plotCard = document.createElement('div');
  plotCard.className = 'bg-[#0f172a] border border-slate-800 rounded-lg p-5 space-y-3';
  plotCard.innerHTML = `
    <div class="flex items-center justify-between pb-2 border-b border-slate-800/60">
      <div>
        <h2 class="text-sm font-bold text-slate-200">Burn Multiple vs. YoY Growth Frontier</h2>
        <p class="text-[11px] text-slate-500">Interactive quadrant map. Click any node to inspect diligence audit.</p>
      </div>
      <div class="text-[10px] text-slate-400 font-mono flex items-center gap-3">
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Low Risk</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Moderate</span>
        <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Critical</span>
      </div>
    </div>
    <div class="flex items-center justify-center py-2 relative">
      <canvas id="frontier-canvas" class="w-full h-[400px] cursor-pointer"></canvas>
    </div>
  `;

  // Comparative Table Below
  const tableCard = document.createElement('div');
  tableCard.className = 'bg-[#0f172a] border border-slate-800 rounded-lg overflow-hidden';
  tableCard.innerHTML = `
    <div class="p-4 border-b border-slate-800 bg-[#090d16]/70">
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Quadrant Positioning & Capital Efficiency Summary</h3>
    </div>
    <table class="w-full text-left text-xs">
      <thead class="bg-[#090d16] text-slate-400 border-b border-slate-800">
        <tr>
          <th class="py-2.5 px-4">Company</th>
          <th class="py-2.5 px-3">Quadrant Thesis</th>
          <th class="py-2.5 px-3 text-right">Burn Multiple</th>
          <th class="py-2.5 px-3 text-right">Growth YoY</th>
          <th class="py-2.5 px-3 text-right">ARR</th>
          <th class="py-2.5 px-3 text-center">Risk Grade</th>
          <th class="py-2.5 px-4 text-right">Action</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800/60" id="matrix-tbody">
      </tbody>
    </table>
  `;

  const tbody = tableCard.querySelector('#matrix-tbody') as HTMLElement;
  assessedList.forEach(({ startup, assessment }) => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-800/40 transition-colors cursor-pointer';

    let quadrant = 'Capital-Intensive Sprint';
    if (startup.burnMultiple <= 1.5 && startup.growthRate >= 80) quadrant = 'Efficient Hyper-Growth';
    else if (startup.burnMultiple <= 1.5 && startup.growthRate < 80) quadrant = 'Disciplined Cash Preserver';
    else if (startup.burnMultiple > 2.0 && startup.growthRate < 80) quadrant = 'Vulnerable Friction Trap';

    let gradeColor = 'text-emerald-400';
    if (assessment.letterGrade === 'C') gradeColor = 'text-amber-400';
    if (assessment.letterGrade === 'D' || assessment.letterGrade === 'F') gradeColor = 'text-rose-400';

    tr.innerHTML = `
      <td class="py-2.5 px-4 font-semibold text-slate-200">
        ${startup.name}
        <span class="text-[10px] text-slate-500 block font-normal">${startup.sector} · ${startup.stage}</span>
      </td>
      <td class="py-2.5 px-3 text-slate-300 font-medium">${quadrant}</td>
      <td class="py-2.5 px-3 text-right font-mono tabular-nums text-slate-200">${startup.burnMultiple}x</td>
      <td class="py-2.5 px-3 text-right font-mono tabular-nums text-slate-200">+${startup.growthRate}%</td>
      <td class="py-2.5 px-3 text-right font-mono tabular-nums text-slate-200">$${(startup.arr / 1000000).toFixed(2)}M</td>
      <td class="py-2.5 px-3 text-center font-mono font-bold ${gradeColor}">${assessment.letterGrade}</td>
      <td class="py-2.5 px-4 text-right">
        <button class="inspect-btn text-xs text-sky-400 hover:text-sky-300 font-medium">Inspect</button>
      </td>
    `;

    tr.onclick = () => {
      store.setSelectedStartup(startup.id);
      store.setActiveTab('audit');
    };

    tbody.appendChild(tr);
  });

  root.appendChild(header);
  root.appendChild(plotCard);
  root.appendChild(tableCard);

  // Render Canvas
  setTimeout(() => {
    const canvas = root.querySelector('#frontier-canvas') as HTMLCanvasElement;
    if (canvas) {
      drawFrontierCanvas(canvas, assessedList);
    }
  }, 50);

  return root;
}

function drawFrontierCanvas(
  canvas: HTMLCanvasElement,
  items: Array<{ startup: any; assessment: any }>
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 700;
  const height = rect.height || 400;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const padding = { top: 30, right: 40, bottom: 50, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Domain axes:
  // X: Burn Multiple (0.5x to 3.5x)
  // Y: Growth Rate (0% to 250%)
  const minX = 0.5;
  const maxX = 3.5;
  const minY = 0;
  const maxY = 250;

  const getX = (bm: number) => padding.left + ((bm - minX) / (maxX - minX)) * plotWidth;
  const getY = (gr: number) => padding.top + plotHeight - ((gr - minY) / (maxY - minY)) * plotHeight;

  // Draw Quadrant Dividers
  const midX = getX(1.7); // Burn Multiple threshold 1.7x
  const midY = getY(90);  // Growth threshold 90%

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
  ctx.setLineDash([4, 4]);

  ctx.beginPath();
  ctx.moveTo(midX, padding.top);
  ctx.lineTo(midX, padding.top + plotHeight);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padding.left, midY);
  ctx.lineTo(width - padding.right, midY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Quadrant Watermark Labels
  ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
  ctx.textAlign = 'left';
  ctx.fillText('EFFICIENT HYPER-GROWTH', padding.left + 15, padding.top + 25);

  ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.textAlign = 'right';
  ctx.fillText('CAPITAL-INTENSIVE SPRINT', width - padding.right - 15, padding.top + 25);

  ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.textAlign = 'left';
  ctx.fillText('DISCIPLINED PRESERVER', padding.left + 15, padding.top + plotHeight - 15);

  ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
  ctx.textAlign = 'right';
  ctx.fillText('FRICTION / DILUTION TRAP', width - padding.right - 15, padding.top + plotHeight - 15);

  // Axes lines and labels
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
  ctx.lineWidth = 1;

  // X Axis ticks
  const xTicks = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5];
  xTicks.forEach((tick) => {
    const x = getX(tick);
    ctx.beginPath();
    ctx.moveTo(x, padding.top + plotHeight);
    ctx.lineTo(x, padding.top + plotHeight + 6);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${tick.toFixed(1)}x`, x, padding.top + plotHeight + 18);
  });

  // Y Axis ticks
  const yTicks = [0, 50, 100, 150, 200, 250];
  yTicks.forEach((tick) => {
    const y = getY(tick);
    ctx.beginPath();
    ctx.moveTo(padding.left - 6, y);
    ctx.lineTo(padding.left, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`+${tick}%`, padding.left - 10, y + 3.5);
  });

  // Axes titles
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Net Burn Multiple (Lower is More Capital Efficient)', width / 2, height - 12);

  ctx.save();
  ctx.translate(16, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Annual YoY Growth Rate (%)', 0, 0);
  ctx.restore();

  // Draw Company Nodes
  items.forEach(({ startup, assessment }) => {
    const x = getX(startup.burnMultiple);
    const y = getY(startup.growthRate);

    // Node radius proportional to ARR (8px to 22px)
    const radius = Math.max(8, Math.min(22, 7 + Math.sqrt(startup.arr / 1000000) * 4));

    let fillCol = '#10b981';
    if (assessment.riskTier === 'Moderate Risk') fillCol = '#f59e0b';
    if (assessment.riskTier === 'High Risk' || assessment.riskTier === 'Critical Risk') fillCol = '#ef4444';

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fillCol;
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Node Name Tag
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(startup.name, x, y - radius - 4);
  });
}
