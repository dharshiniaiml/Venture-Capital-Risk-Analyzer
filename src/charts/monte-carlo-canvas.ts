import { MonteCarloSimulation } from '../engine/types';

export function renderMonteCarloChart(
  canvas: HTMLCanvasElement,
  simulation: MonteCarloSimulation,
  initialCash: number,
  monthlyBurn: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 540;
  const height = rect.height || 320;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const padding = { top: 28, right: 30, bottom: 44, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxCash = Math.max(initialCash * 1.3, 1000000);
  const totalMonths = 24;

  const getX = (m: number) => padding.left + (m / totalMonths) * plotWidth;
  const getY = (cash: number) => padding.top + plotHeight - (Math.max(0, cash) / maxCash) * plotHeight;

  // Background Grid Lines
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i++) {
    const cashVal = (maxCash / yTicks) * i;
    const y = getY(cashVal);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    // Y Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    const labelStr = cashVal >= 1000000 ? `$${(cashVal / 1000000).toFixed(1)}M` : `$${Math.round(cashVal / 1000)}k`;
    ctx.fillText(labelStr, padding.left - 8, y + 3);
  }

  // X Axis Grid & Month Labels
  const monthIntervals = [0, 3, 6, 9, 12, 15, 18, 21, 24];
  monthIntervals.forEach((m) => {
    const x = getX(m);
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + plotHeight);
    ctx.strokeStyle = m === 12 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(51, 65, 85, 0.2)';
    ctx.stroke();

    ctx.fillStyle = m === 12 ? '#ef4444' : '#64748b';
    ctx.font = m === 12 ? 'bold 10px "JetBrains Mono", monospace' : '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`M${m}`, x, height - padding.bottom + 16);
  });

  // Zero-Cash Insolvency Baseline
  const zeroY = getY(0);
  ctx.beginPath();
  ctx.moveTo(padding.left, zeroY);
  ctx.lineTo(width - padding.right, zeroY);
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#ef4444';
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('INSOLVENCY ZERO-CASH BOUNDARY', padding.left + 8, zeroY - 6);

  // Draw Sample Trajectories
  ctx.lineWidth = 1;
  simulation.trajectoryPaths.forEach((path, idx) => {
    ctx.beginPath();
    path.forEach((cash, m) => {
      const x = getX(m);
      const y = getY(cash);
      if (m === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    // Varying opacity and hue
    const isFailed = path[path.length - 1] === 0;
    ctx.strokeStyle = isFailed ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.15)';
    ctx.stroke();
  });

  // Draw 50th Percentile (Median Expected Trajectory)
  ctx.beginPath();
  for (let m = 0; m <= totalMonths; m++) {
    const expectedCash = Math.max(0, initialCash - monthlyBurn * m);
    const x = getX(m);
    const y = getY(expectedCash);
    if (m === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Axis Titles
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Simulation Horizon (Months)', width / 2, height - 8);

  // Legend annotations in top right corner
  ctx.textAlign = 'right';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('— Deterministic Median Path', width - padding.right - 10, padding.top + 10);
  ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
  ctx.fillText(`· 12-Mo Insolvency Risk: ${simulation.failureProbability12Mo}%`, width - padding.right - 10, padding.top + 26);
  ctx.fillText(`· 24-Mo Insolvency Risk: ${simulation.failureProbability24Mo}%`, width - padding.right - 10, padding.top + 40);
}
