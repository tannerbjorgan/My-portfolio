import { view, theme } from './state.js';
import { applySunlight } from './lighting.js';
import {
  clamp01, createLayer, dither, fillEllipse, hash, hexToRgb, mixRgb, noise, plot, rgb, seeded, shade2d, smoothstep, tone
} from './pixels.js';

// The creek's centre line, sampled densely, plus cumulative distance along it.
export const creek = {
  points: [],
  distances: [],
  waterPixels: [],
  groveAt: 0,
  rigStart: 0,
  rigEnd: 0
};

export function creekAt(distance) {
  const { points, distances } = creek;
  let i = 1;
  while (i < distances.length - 1 && distances[i] < distance) i++;
  const f = clamp01((distance - distances[i - 1]) / ((distances[i] - distances[i - 1]) || 1));
  return [points[i - 1][0] + (points[i][0] - points[i - 1][0]) * f, points[i - 1][1] + (points[i][1] - points[i - 1][1]) * f];
}

const creekWidth = (y) => 0.6 + clamp01((y - view.horizon) / (view.height - view.horizon)) * 9;

function ridged(x, seed) {
  let value = 0, amplitude = 1, frequency = 0.011, total = 0;
  for (let octave = 0; octave < 4; octave++) {
    const n = 1 - Math.abs(noise(x * frequency, octave * 7.1, seed) * 2 - 1);
    value += n * n * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2.1;
  }
  return value / total;
}

const peakTop = (x) => view.horizon - 6 - ridged(x, 1) * view.peakHeight;

function ridgeTop(x) {
  const { horizon, peakHeight, valleyX, width } = view;
  const wobble = (noise(x * 0.06, 3, 4) - 0.5) * 6;
  return x < valleyX
    ? horizon + 12 - smoothstep(valleyX, valleyX * 0.35, x) * peakHeight * 0.42 + wobble
    : horizon + 12 - Math.pow(smoothstep(valleyX, width + 30, x), 0.7) * peakHeight * 0.55 + wobble;
}

function drawPine(g, x, base, height, colors) {
  x = Math.round(x);
  base = Math.round(base);
  plot(g, rgb(colors[0]), x, base - 1, 1, 2);
  const top = base - 1 - height;
  for (let y = top; y < base - 1; y++) {
    const half = Math.round(((y - top) / height) * height * 0.32 + ((y - top) % 3 === 2 ? 1 : 0));
    for (let dx = -half; dx <= half; dx++) plot(g, tone(colors, dx > 0 ? 0.75 : dx === 0 ? 0.5 : 0.2), x + dx, y);
  }
}

function drawRoundTree(g, x, base, height, colors) {
  const trunk = Math.max(1, Math.round(height * 0.3));
  plot(g, '#3a2418', Math.round(x), Math.round(base - trunk), 1, trunk);
  fillEllipse(g, x, base - trunk - height * 0.35, Math.max(1.2, height * 0.36), Math.max(1.2, height * 0.42), (nx, ny, px, py, nz) => {
    if (Math.hypot(nx, ny) > 0.78 + noise(px * 0.6, py * 0.6, 33) * 0.3) return null;
    return tone(colors, shade2d(nx, ny, nz) + (hash(px, py, 34) - 0.5) * 0.25);
  });
}

function drawValleyTree(g, x, base, height, rand) {
  const kind = Math.floor(rand() * 10);
  const palettes = theme.colors.valleyTrees;
  if (kind < 3) drawPine(g, x, base, Math.round(height), palettes[3]);
  else drawRoundTree(g, x, base, height * 0.8, palettes[kind % 3]);
}

export function buildSunLayer() {
  const { width, height, sunX, sunY } = view;
  const { sun, sunEdge, halo } = theme.colors;
  const [canvas, g] = createLayer(width, height);
  const radius = theme.night ? 9 : 7;

  for (let y = -radius - 14; y <= radius + 14; y++) {
    for (let x = -radius - 14; x <= radius + 14; x++) {
      const d = Math.hypot(x, y);
      if (d <= radius + 0.3) plot(g, d > radius - 1.5 ? sunEdge : sun, sunX + x, sunY + y);
      else if (d < radius + 14 && dither(sunX + x, sunY + y) < Math.pow(1 - (d - radius) / 14, 1.6) * 0.75) plot(g, halo, sunX + x, sunY + y);
    }
  }
  if (theme.night) {
    for (const [x, y, r] of [[-3, -2, 1.6], [2, 3, 1.2], [-1, 4, 0.9], [4, -2, 1]]) {
      fillEllipse(g, sunX + x, sunY + y, r, r, () => sunEdge);
    }
  }
  return canvas;
}

export function buildMountainLayer() {
  const { width, height, horizon, peakHeight } = view;
  const colors = theme.colors;
  const [canvas, g] = createLayer(width, height);

  for (let x = 0; x < width; x++) {
    const top = Math.round(peakTop(x));
    for (let y = top; y < horizon + 8; y++) {
      if (y > horizon - 6 && dither(x, y) < (y - (horizon - 6)) / 14) continue;
      const reach = 2 + (y - top) * 0.6;
      const slope = peakTop(x - reach) - peakTop(x + reach) + (noise(x * 0.35 + y * 0.12, y * 0.05, 8) - 0.5) * 7;
      const snowLine = horizon - peakHeight * 0.5 + (noise(x * 0.08, 1, 9) - 0.5) * 10;
      const snowy = y < snowLine && y - top < 18 + noise(x * 0.2, y * 0.2, 10) * 8;
      const lit = slope < 0;
      plot(g, snowy ? (lit ? colors.snowLit : colors.snowShade) : (lit ? colors.farLit : colors.farShade), x, y);
    }
  }

  for (let x = 0; x < width; x++) {
    const top = Math.round(ridgeTop(x));
    for (let y = top; y < top + 30; y++) {
      if (y > top + 14 && dither(x, y) < (y - top - 14) / 16) continue;
      plot(g, ridgeTop(x - 3) - ridgeTop(x + 3) < -0.4 ? colors.ridgeLit : colors.ridgeShade, x, y);
    }
  }

  const rand = seeded(31);
  const ridgeTree = () => colors.ridgeTrees[Math.floor(rand() * colors.ridgeTrees.length)];
  for (let i = 0; i < width * 2.2; i++) {
    const x = rand() * width, y = ridgeTop(x) + rand() * 17, r = 0.9 + rand() * 1.4, color = ridgeTree();
    const shaded = rgb(mixRgb(hexToRgb(color), [30, 15, 20], 0.3));
    fillEllipse(g, x, y, r, r * 1.1, (nx) => (nx > 0.2 ? color : shaded));
  }
  for (let x = 1; x < width; x += 2 + Math.floor(rand() * 3)) {
    const r = 1.2 + rand() * 1.5, color = ridgeTree();
    fillEllipse(g, x, ridgeTop(x) + 0.5, r, r * 1.2, () => color);
  }

  applySunlight(canvas, 1);
  return canvas;
}

// A probe point that is always opaque on the mountain layer, used to detect a dropped canvas.
export const mountainProbe = () => [Math.floor(view.width / 2), Math.round(peakTop(Math.floor(view.width / 2))) + 2];

function traceCreek() {
  const { width, height, horizon, valleyX } = view;
  const controls = [
    [valleyX, horizon + 10],
    [valleyX + 8, horizon + 20],
    [valleyX - 3, horizon + 34],
    [valleyX + 16, Math.round(height * 0.77)],
    [valleyX + 16 + (width - valleyX) * 0.45, Math.round(height * 0.84)],
    [width + 50, Math.round(height * 0.88)]
  ];

  creek.points = [];
  for (let i = 0; i < controls.length - 1; i++) {
    const p0 = controls[Math.max(0, i - 1)], p1 = controls[i], p2 = controls[i + 1], p3 = controls[Math.min(controls.length - 1, i + 2)];
    for (let s = 0; s < 1; s += 1 / 80) {
      const s2 = s * s, s3 = s2 * s;
      const catmullRom = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s2 + (-a + 3 * b - 3 * c + d) * s3);
      creek.points.push([catmullRom(p0[0], p1[0], p2[0], p3[0]), catmullRom(p0[1], p1[1], p2[1], p3[1])]);
    }
  }

  let total = 0;
  creek.distances = creek.points.map((point, i) => {
    if (i) total += Math.hypot(point[0] - creek.points[i - 1][0], point[1] - creek.points[i - 1][1]);
    return total;
  });
  return controls;
}

export function buildValleyLayer() {
  const { width, height, horizon, columnRight } = view;
  const colors = theme.colors;
  const [canvas, g] = createLayer(width, height);
  const controls = traceCreek();
  const length = creek.distances[creek.distances.length - 1];

  const water = new Map();
  for (const [x, y] of creek.points) {
    const w = creekWidth(y), bank = 3 + w * 0.6;
    for (let px = Math.round(x - w - bank); px <= Math.round(x + w + bank); px++) {
      const py = Math.round(y), key = py * 10000 + px, offset = Math.abs(px + 0.5 - x);
      if (offset <= w) water.set(key, Math.min(water.get(key) ?? 1, offset / w));
      else if (!water.has(key) && hash(px, py, 40) < 0.5 * (1 - (offset - w) / bank)) {
        plot(g, colors.gravel[Math.floor(hash(px, py, 41) * colors.gravel.length)], px, py);
      }
    }
  }

  creek.waterPixels = [];
  for (const [key, offset] of water) {
    const y = Math.floor(key / 10000), x = key - y * 10000;
    const v = 0.25 + noise(x * 0.3, y * 0.9, 42) * 0.45 - (offset > 0.8 ? 0.25 : 0);
    plot(g, rgb(colors.water[Math.min(2, Math.max(0, Math.floor(v * 3)))]), x, y);
    creek.waterPixels.push([x, y]);
  }

  const rand = seeded(52);
  const trees = [];
  for (let i = 0; i < 80; i++) {
    const [x, y] = creekAt(rand() * length * 0.75), w = creekWidth(y), side = rand() < 0.5 ? -1 : 1;
    const px = x + side * (w + 5 + rand() * (10 + (y - horizon) * 0.9)), py = y + (rand() - 0.5) * 6;
    if (px < columnRight + 4 || px > width - 2 || py > height * 0.79) continue;
    trees.push([px, py, 3 + ((py - horizon) / (height - horizon)) * 24 * (0.7 + rand() * 0.5)]);
  }
  trees.sort((a, b) => a[1] - b[1]).forEach(([x, y, h]) => drawValleyTree(g, x, y, h, rand));

  for (let i = 0; i < 18; i++) {
    const [x, y] = creekAt(rand() * length * 0.95), w = creekWidth(y);
    const bx = x + (rand() < 0.5 ? -1 : 1) * (w + 1 + rand() * 4), r = 0.8 + ((y - horizon) / (height - horizon)) * 3 * rand();
    if (bx < columnRight) continue;
    fillEllipse(g, bx, y, r * 1.4, r, (nx, ny, px, py, nz) => tone(colors.rock, shade2d(nx, ny, nz)));
  }

  let groveIndex = 0;
  while (groveIndex < creek.points.length - 1 && creek.points[groveIndex][1] < controls[3][1]) groveIndex++;
  creek.groveAt = creek.distances[groveIndex];
  creek.rigStart = creek.groveAt - 16;
  creek.rigEnd = length;
  for (let i = creek.points.length - 1; i > 0; i--) {
    if (creek.points[i][0] < width + 30) {
      creek.rigEnd = creek.distances[i];
      break;
    }
  }

  applySunlight(canvas, 1);
  return canvas;
}

// The stand of trees the rig emerges from. Drawn after the rig so it can hide behind them.
export function buildGroveLayer() {
  const [canvas, g] = createLayer(view.width, view.height);
  const rand = seeded(61);
  const trees = [];
  for (let i = 0; i < 10; i++) {
    const [x, y] = creekAt(creek.groveAt - 34 + i * 5 + rand() * 4);
    trees.push([x + (rand() - 0.5) * 14, y + 4 + rand() * 5, 20 + Math.round(rand() * 10)]);
  }
  trees.sort((a, b) => a[1] - b[1]).forEach(([x, y, h]) => drawValleyTree(g, x, y, h, rand));

  const [gx, gy] = creekAt(creek.groveAt - 4);
  for (const [ox, oy, rx, ry] of [[-8, 3, 6, 4], [3, 4, 5, 3.4], [-2, 6, 4, 2.6]]) {
    fillEllipse(g, gx + ox, gy + oy, rx, ry, (nx, ny, px, py, nz) => tone(theme.colors.rock, shade2d(nx, ny, nz) + (hash(px, py, 62) - 0.5) * 0.2));
  }

  applySunlight(canvas, 1);
  return canvas;
}

export function drawWaterSparkles(ctx, t) {
  const sparkle = rgb(theme.colors.water[3]);
  const pixels = creek.waterPixels;
  for (let i = 0; i < pixels.length; i += 7) {
    if (hash(i, Math.floor(t * 3), 95) < 0.08) plot(ctx, sparkle, pixels[i][0], pixels[i][1]);
  }
}

export function buildClouds() {
  const { width, height } = view;
  const colors = theme.colors;
  const rand = seeded(21);

  return Array.from({ length: Math.max(3, Math.round(width / 160)) }, () => {
    const w = 40 + Math.floor(rand() * 34), h = 18;
    const [canvas, g] = createLayer(w, h);
    const puffs = Array.from({ length: 7 }, (_, i) => {
      const f = (i + 0.5) / 7, r = (4 + rand() * 3.5) * (1 - Math.abs(f - 0.5) * 0.9);
      return [w * (0.08 + f * 0.84), h - 3 - r * 0.8 - rand() * 2, r + 1.5];
    });

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let inside = null;
        for (const [px, py, r] of puffs) {
          const dx = (x + 0.5 - px) / r, dy = (y + 0.5 - py) / r;
          if (dx * dx + dy * dy <= 1 && y < h - 2) inside = [dx, dy];
        }
        if (!inside) continue;
        const v = 0.5 + inside[0] * 0.35 - inside[1] * 0.45 - (y > h - 5 ? 0.3 : 0) + (dither(x, y) - 0.5) * 0.2;
        plot(g, v > 0.72 ? colors.cloudLight : v > 0.36 ? colors.cloud : colors.cloudShade, x, y);
      }
    }
    return { canvas, width: w, x: rand() * (width + 80) - 40, y: Math.round(height * (0.03 + rand() * 0.22)), speed: 0.5 + rand() * 0.8 };
  });
}

export function buildStars() {
  const { width, height, horizon, peakHeight } = view;
  const rand = seeded(3);
  return Array.from({ length: Math.round((width * height) / 900) }, () => ({
    x: Math.floor(rand() * width),
    y: Math.floor(rand() * (horizon - peakHeight)),
    phase: rand() * 7,
    speed: 0.6 + rand() * 1.6
  }));
}

export function drawStars(ctx, stars, t) {
  for (const star of stars) {
    const v = Math.sin(t * star.speed + star.phase);
    if (v > -0.3) plot(ctx, v > 0.6 ? '#f0e4cc' : '#76686e', star.x, star.y);
  }
}
