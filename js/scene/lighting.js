import { view, theme } from './state.js';
import { createLayer } from './pixels.js';

// Warms and brightens everything on a layer by how close it is to the sun (or moon). Only pixels
// that already exist are touched, so the page background stays clean.
export function applySunlight(canvas, amount, offsetX = 0, offsetY = 0) {
  const g = canvas.getContext('2d'), { width, height } = canvas;
  const [mask, maskContext] = createLayer(width, height);
  maskContext.drawImage(canvas, 0, 0);

  const x = view.sunX - offsetX, y = view.sunY - offsetY;
  const glow = g.createRadialGradient(x, y, 0, x, y, Math.max(view.width, view.height) * 0.95);
  glow.addColorStop(0, theme.colors.glow[0]);
  glow.addColorStop(0.35, theme.colors.glow[1]);
  glow.addColorStop(1, 'rgba(0,0,0,0)');

  g.globalAlpha = amount;
  g.globalCompositeOperation = 'screen';
  g.fillStyle = glow;
  g.fillRect(0, 0, width, height);
  g.globalCompositeOperation = 'soft-light';
  g.fillStyle = theme.colors.grade;
  g.fillRect(0, 0, width, height);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(mask, 0, 0);
  g.globalCompositeOperation = 'source-over';
}

export function drawSunRays(ctx, t, target) {
  const { sunX, sunY, width, height } = view;
  const { ray, rayAlpha } = theme.colors;
  const base = Math.atan2(target[1] - sunY, target[0] - sunX), length = Math.hypot(width, height) * 1.1;

  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {
    const angle = base + (i - 3) * 0.075 + Math.sin(t * 0.07 + i) * 0.01, spread = 0.012 + (i % 3) * 0.008;
    const alpha = rayAlpha * (0.6 + 0.4 * Math.sin(t * 0.25 + i * 1.7));
    const gradient = ctx.createLinearGradient(sunX, sunY, sunX + Math.cos(angle) * length, sunY + Math.sin(angle) * length);
    gradient.addColorStop(0, `rgba(${ray},${alpha})`);
    gradient.addColorStop(0.7, `rgba(${ray},${alpha * 0.4})`);
    gradient.addColorStop(1, `rgba(${ray},0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(sunX, sunY);
    ctx.lineTo(sunX + Math.cos(angle - spread) * length, sunY + Math.sin(angle - spread) * length);
    ctx.lineTo(sunX + Math.cos(angle + spread) * length, sunY + Math.sin(angle + spread) * length);
    ctx.fill();
  }

  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 46);
  glow.addColorStop(0, `rgba(${ray},${theme.night ? 0.18 : 0.35})`);
  glow.addColorStop(1, `rgba(${ray},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 46, sunY - 46, 92, 92);
  ctx.globalCompositeOperation = 'source-over';
}
