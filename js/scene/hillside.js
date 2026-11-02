import { view, theme } from './state.js';
import { applySunlight } from './lighting.js';
import { DESK_ORIGIN_X, DESK_ORIGIN_Y } from './raytrace.js';
import { clamp01, createLayer, fillEllipse, fillTaper, hash, noise, plot, seeded, shade2d, smoothstep, tone } from './pixels.js';

// Height of the hill's top edge: a flat shelf for the desk that drops away toward the valley.
export function hillTop(x) {
  const { deskX, plateau } = view;
  const wobble = (noise(x * 0.05, 7, 14) - 0.5) * 3;
  const shelfStart = deskX + 6, shelfEnd = deskX + 100;
  if (x < shelfStart) return plateau - (shelfStart - x) * 0.09 + wobble;
  if (x <= shelfEnd) return plateau + wobble * 0.5;
  return plateau + Math.pow(x - shelfEnd, 1.45) * 0.35 + wobble;
}

const underCanopy = (x) => 1 - smoothstep(view.columnLeft - 40, view.columnLeft + 6, x);

export function drawLeaf(g, x, y, shape, color) {
  x = Math.round(x);
  y = Math.round(y);
  plot(g, color, x, y);
  if (shape === 1) plot(g, color, x + 1, y);
  else if (shape === 2) plot(g, color, x, y + 1);
  else if (shape === 3) {
    plot(g, color, x + 1, y);
    plot(g, color, x, y - 1);
  }
}

const randomLeafColor = (rand) => theme.colors.leaves[Math.floor(rand() * theme.colors.leaves.length)];

export function buildHillLayer() {
  const { width, height, columnLeft, deskX, deskY } = view;
  const [canvas, g] = createLayer(width, height);
  const end = Math.min(width, columnLeft + 60);

  for (let x = 0; x < end; x++) {
    const top = Math.round(hillTop(x));
    const shade = underCanopy(x);
    for (let y = Math.max(0, top); y < height; y++) {
      const depth = y - top;
      const stripe = noise(x * 0.25 + y * 0.6, y * 0.35, 15) - 0.5;
      const dappled = noise(x * 0.09, y * 0.22, 16) > 0.6;
      let v = 0.42 + stripe * 0.35 - depth * 0.004 + (depth < 2 ? 0.25 : 0);
      v -= shade * (dappled ? 0.05 : 0.3);
      plot(g, tone(theme.colors.grass, v), x, y);
    }
  }

  // Shadow pooled under the desk, chair and dog.
  g.fillStyle = 'rgba(25,12,6,.32)';
  for (let y = -4; y <= 4; y++) {
    const half = Math.round(50 * Math.sqrt(1 - (y / 5) ** 2));
    g.fillRect(deskX + DESK_ORIGIN_X + 10 - half, deskY + DESK_ORIGIN_Y + 2 + y, half * 2, 1);
  }

  const rand = seeded(19);
  for (let i = 0; i < end * 3; i++) {
    const x = rand() * end, y = hillTop(x) + rand() * (height - hillTop(x));
    if (rand() > 0.45 + underCanopy(x) * 0.5) continue;
    drawLeaf(g, x, y, Math.floor(rand() * 4), randomLeafColor(rand));
  }

  applySunlight(canvas, 0.7);
  return canvas;
}

// Trunk and branch skeleton. Each branch is [start, bend, tip, startRadius, tipRadius].
function treeShape() {
  const { treeX: x, treeSpan: span, height: H } = view;
  const base = hillTop(x) + 4;
  return {
    root: [x, base],
    middle: [x + 4, H * 0.56],
    top: [x + 11, H * 0.3],
    branches: [
      [[x + 11, H * 0.3], [x + span * 0.45, H * 0.2], [x + span, H * 0.3], 5, 1.4],
      [[x + 10, H * 0.32], [x + 18, H * 0.12], [x + 26, -12], 5, 2.4],
      [[x + 6, H * 0.46], [x + span * 0.35, H * 0.38], [x + span * 0.62, H * 0.42], 3.6, 1.1],
      [[x + 5, H * 0.38], [x - 14, H * 0.24], [x - 32, H * 0.16], 3.4, 1.2]
    ]
  };
}

function pointAlong([start, bend, tip], t) {
  const [a, b, f] = t < 0.5 ? [start, bend, t * 2] : [bend, tip, (t - 0.5) * 2];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
}

export function buildTrunkLayer() {
  const { width, height } = view;
  const [canvas, g] = createLayer(width, height);
  const { root, middle, top, branches } = treeShape();
  const bark = (ox, oy, x, y) => tone(theme.colors.bark, 0.4 + ox * 0.45 + (noise(x * 0.8, y * 0.1, 4) - 0.5) * 0.5 - (y > height * 0.6 ? 0.08 : 0));

  fillTaper(g, root[0], root[1], root[0] - 16, root[1] + 4, 5, 1.2, bark);
  fillTaper(g, root[0], root[1], root[0] + 13, root[1] + 4, 5, 1.2, bark);
  fillTaper(g, root[0], root[1], middle[0], middle[1], 11, 8.5, bark);
  fillTaper(g, middle[0], middle[1], top[0], top[1], 8.5, 6.5, bark);
  for (const [start, bend, tip, r0, r1] of branches) {
    const mid = (r0 + r1) / 2;
    fillTaper(g, start[0], start[1], bend[0], bend[1], r0, mid, bark);
    fillTaper(g, bend[0], bend[1], tip[0], tip[1], mid, r1, bark);
  }

  applySunlight(canvas, 0.5);
  return canvas;
}

let leafSpawns = [];

// The canopy is split across two layers that sway slightly out of step.
export function buildCanopyLayers() {
  const { width, height, treeX, treeSpan, columnLeft } = view;
  const [front, frontContext] = createLayer(width, height);
  const [back, backContext] = createLayer(width, height);
  const rand = seeded(23);
  const clusters = [];

  treeShape().branches.forEach((branch, index) => {
    const count = index === 0 ? 46 : index === 1 ? 28 : 22;
    for (let i = 0; i < count; i++) {
      const [x, y] = pointAlong(branch, 0.2 + rand() * 0.8);
      clusters.push([x + (rand() - 0.5) * 30, y + (rand() - 0.5) * 22 - 5, 5 + rand() * 7, rand()]);
    }
  });
  for (let x = treeX - 36; x < treeX + treeSpan; x += 6 + rand() * 6) {
    clusters.push([x, rand() * height * 0.12, 8 + rand() * 7, rand() * 0.6]);
  }
  clusters.sort((a, b) => a[3] - b[3]);
  leafSpawns = clusters.filter(([, y]) => y > height * 0.12).map(([x, y]) => [x, y]);

  const limit = columnLeft - 4;
  clusters.forEach(([cx, cy, r, depth], i) => {
    fillEllipse(i % 2 ? backContext : frontContext, cx, cy, r + 2, r + 2, (nx, ny, x, y, nz) => {
      if (x > limit - hash(x, y, 43) * 10) return null;
      const edge = (Math.hypot(nx, ny) * (r + 2)) / r;
      const clump = noise(x * 0.35, y * 0.35, 40);
      if (edge > 0.78 + clump * 0.4) return null;
      if (edge < 0.7 && hash(x, y, 41) < 0.012) return null;

      // Patches of red, orange and gold drift across the crown.
      const hue = noise(x * 0.025, y * 0.03, 50) * 2.4 + (hash(x >> 2, y >> 2, 51) - 0.5) * 0.5;
      const colors = theme.colors.canopy[Math.max(0, Math.min(2, Math.floor(hue)))];
      const leaf = hash(x, y, 42) - 0.5, speck = hash(x >> 1, y >> 1, 44) - 0.5;
      let v = shade2d(nx, ny, nz) * 0.55 + depth * 0.25 - 0.06 + leaf * 0.16 + speck * 0.22 + (clump - 0.5) * 0.2;
      v -= clamp01((y - height * 0.18) / (height * 0.3)) * 0.18;
      if (nx > 0.5 && edge > 0.6) v += 0.18;
      return tone(colors, v);
    });
  });

  applySunlight(front, 0.8);
  applySunlight(back, 0.8);
  return [front, back];
}

let falling = [];
let settled = [];

export function resetLeaves() {
  falling = [];
  settled = [];
}

export function updateLeaves(t, dt) {
  if (!view.showDesk || !leafSpawns.length) return;
  if (Math.random() < dt * 1.4) {
    const [x, y] = leafSpawns[Math.floor(Math.random() * leafSpawns.length)];
    falling.push({ x, y, vy: 5 + Math.random() * 5, phase: Math.random() * 6, color: randomLeafColor(Math.random) });
  }

  for (const leaf of falling) {
    leaf.y += leaf.vy * dt;
    leaf.x += (Math.sin(t * 1.6 + leaf.phase) * 7 + 3) * dt;
  }
  falling = falling.filter((leaf) => {
    if (leaf.x < 0 || leaf.x > view.width) return false;
    if (leaf.x < view.columnLeft + 50 && leaf.y >= hillTop(leaf.x) + 1) {
      settled.push({ x: Math.round(leaf.x), y: Math.round(leaf.y + Math.random() * 3), color: leaf.color, shape: Math.floor(Math.random() * 4) });
      if (settled.length > 90) settled.shift();
      return false;
    }
    return leaf.y < view.height;
  });
}

export const drawSettledLeaves = (ctx) => settled.forEach((leaf) => drawLeaf(ctx, leaf.x, leaf.y, leaf.shape, leaf.color));
export const drawFallingLeaves = (ctx, t) => falling.forEach((leaf) => drawLeaf(ctx, leaf.x, leaf.y, Math.floor(t * 4 + leaf.phase) % 3, leaf.color));

let blades = [];

export function buildGrass() {
  const { width, height, columnLeft, columnRight, deskX, showDesk } = view;
  const rand = seeded(17);
  blades = [];

  if (showDesk) {
    const end = columnLeft + 40;
    for (let i = 0; i < end * 2.2; i++) {
      const x = rand() * end, depth = Math.floor(rand() * 3), top = hillTop(x);
      if (top > height) continue;
      if (x > deskX + 14 && x < deskX + 96 && rand() < 0.8) continue;
      blades.push({
        x,
        base: Math.round(top) + depth,
        height: 2 + noise(x * 0.1, 0, 9) * 4 + rand() * 3,
        lean: (rand() - 0.5) * 3,
        tint: rand() * 0.18 - depth * 0.05 - underCanopy(x) * 0.18,
        flower: rand() < 0.03 ? (rand() < 0.5 ? '#f2c14e' : '#e0782a') : null
      });
    }
    for (let i = 0; i < end * 1.2; i++) {
      const x = rand() * end, depth = Math.floor(rand() * 4);
      if (x > deskX + 26 && x < deskX + 82 && rand() < 0.75) continue;
      blades.push({ x, base: height - 4 + depth, height: 4 + rand() * 7, lean: (rand() - 0.5) * 3, tint: rand() * 0.15 - 0.1 - underCanopy(x) * 0.15, flower: null });
    }
  }

  if (width - columnRight > 60) {
    for (let i = 0; i < 90; i++) {
      const start = width - Math.min(70, (width - columnRight) * 0.5);
      const x = start + rand() * (width - start + 4), depth = Math.floor(rand() * 4);
      blades.push({
        x,
        base: height - 4 + depth,
        height: (3 + rand() * 7) * clamp01((x - start) / 30),
        lean: (rand() - 0.5) * 3,
        tint: rand() * 0.18 - depth * 0.05,
        flower: rand() < 0.04 ? '#f2c14e' : null
      });
    }
  }

  blades.sort((a, b) => a.base - b.base);
}

export function drawGrass(ctx, t) {
  const gust = Math.sin(t * 0.45) * 0.7;
  for (const blade of blades) {
    const steps = Math.round(blade.height);
    if (steps < 1) continue;
    const sway = Math.sin(t * 1.3 + blade.x * 0.07) * 1.1 + gust;
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      plot(ctx, tone(theme.colors.grass, 0.2 + f * 0.7 + blade.tint), Math.round(blade.x + blade.lean * f + sway * f * f), blade.base - i);
    }
    if (blade.flower) plot(ctx, blade.flower, Math.round(blade.x + blade.lean + sway), blade.base - steps - 1);
  }
}
