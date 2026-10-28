import { RadarAxis } from '../engine/types';

export function renderRadarChart(
  canvas: HTMLCanvasElement,
  axes: RadarAxis[],
  companyName: string
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 380;
  const height = rect.height || 340;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height / 2 + 10;
  const radius = Math.min(width, height) * 0.36;
  const totalAxes = axes.length;

  // Background concentric polygons (20, 40, 60, 80, 100)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];
  ctx.lineWidth = 1;

  levels.forEach((level) => {
    ctx.beginPath();
    for (let i = 0; i < totalAxes; i++) {
      const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * (radius * level);
      const y = centerY + Math.sin(angle) * (radius * level);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = level === 1.0 ? 'rgba(71, 85, 105, 0.5)' : 'rgba(51, 65, 85, 0.25)';
    ctx.stroke();

    // Subtle scale label
    ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(level * 100)}`, centerX + 4, centerY - (radius * level) - 2);
  });

  // Spokes from center
  for (let i = 0; i < totalAxes; i++) {
    const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
    ctx.stroke();

    // Axis labels
    const labelDistance = radius + 22;
    const lx = centerX + Math.cos(angle) * labelDistance;
    const ly = centerY + Math.sin(angle) * labelDistance;

    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';

    if (Math.abs(Math.cos(angle)) < 0.1) {
      ctx.textAlign = 'center';
    } else if (Math.cos(angle) > 0) {
      ctx.textAlign = 'left';
    } else {
      ctx.textAlign = 'right';
    }

    ctx.fillText(axes[i].label, lx, ly);

    // Score display next to label
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    const scoreColor = axes[i].score > 65 ? '#ef4444' : axes[i].score > 45 ? '#f59e0b' : '#10b981';
    ctx.fillStyle = scoreColor;
    ctx.fillText(`(${axes[i].score})`, lx, ly + 12);
  }

  // Draw Benchmark Median polygon (dashed neutral line)
  ctx.beginPath();
  for (let i = 0; i < totalAxes; i++) {
    const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
    const val = axes[i].benchmarkMedian / 100;
    const x = centerX + Math.cos(angle) * (radius * val);
    const y = centerY + Math.sin(angle) * (radius * val);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  // Draw Company Risk Polygon
  ctx.beginPath();
  for (let i = 0; i < totalAxes; i++) {
    const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
    const val = Math.min(100, Math.max(5, axes[i].score)) / 100;
    const x = centerX + Math.cos(angle) * (radius * val);
    const y = centerY + Math.sin(angle) * (radius * val);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  // Dynamic fill based on average score
  const avgScore = axes.reduce((acc, a) => acc + a.score, 0) / totalAxes;
  const isHighRisk = avgScore > 60;
  const isModerate = avgScore > 40;

  const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
  if (isHighRisk) {
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.1)');
    ctx.strokeStyle = '#ef4444';
  } else if (isModerate) {
    gradient.addColorStop(0, 'rgba(245, 158, 11, 0.4)');
    gradient.addColorStop(1, 'rgba(245, 158, 11, 0.1)');
    ctx.strokeStyle = '#f59e0b';
  } else {
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
    ctx.strokeStyle = '#10b981';
  }

  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw vertices dots
  for (let i = 0; i < totalAxes; i++) {
    const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
    const val = Math.min(100, Math.max(5, axes[i].score)) / 100;
    const x = centerX + Math.cos(angle) * (radius * val);
    const y = centerY + Math.sin(angle) * (radius * val);

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = isHighRisk ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981';
    ctx.fill();
    ctx.strokeStyle = '#090d16';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
