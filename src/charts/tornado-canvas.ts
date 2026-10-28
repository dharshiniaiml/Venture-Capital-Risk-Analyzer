import { TornadoItem } from '../engine/types';

export function renderTornadoChart(
  canvas: HTMLCanvasElement,
  items: TornadoItem[],
  baseRisk: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 460;
  const height = rect.height || 260;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const padding = { top: 20, right: 30, bottom: 25, left: 160 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const rowCount = items.length;
  const rowHeight = plotHeight / rowCount;
  const barThickness = Math.min(18, rowHeight * 0.55);

  // Center line represents the Base Risk Score
  const minScore = Math.max(0, baseRisk - 35);
  const maxScore = Math.min(100, baseRisk + 35);
  const scoreSpan = maxScore - minScore;

  const getX = (score: number) => padding.left + ((score - minScore) / scoreSpan) * plotWidth;
  const centerX = getX(baseRisk);

  // Draw Vertical Center Base Risk Line
  ctx.beginPath();
  ctx.moveTo(centerX, padding.top);
  ctx.lineTo(centerX, padding.top + plotHeight);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Base Risk Label
  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Base: ${baseRisk}`, centerX, padding.top - 6);

  // Draw each sensitivity bar
  items.forEach((item, index) => {
    const y = padding.top + index * rowHeight + rowHeight / 2;

    // Label on left
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(item.variable, padding.left - 12, y + 4);

    const xDown = getX(Math.min(item.downRisk, item.upRisk));
    const xUp = getX(Math.max(item.downRisk, item.upRisk));

    // Negative impact bar (left of center = beneficial reduction)
    if (xDown < centerX) {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(xDown, y - barThickness / 2, centerX - xDown, barThickness);
    }

    // Positive impact bar (right of center = hazard amplification)
    if (xUp > centerX) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(centerX, y - barThickness / 2, xUp - centerX, barThickness);
    }

    // Swing Annotation on right
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`±${item.swingImpact} pts`, xUp + 6, y + 3.5);
  });
}
