import { view, theme } from './state.js';
import { RAMPS } from './palette.js';
import { applySunlight } from './lighting.js';
import {
  DESK_HEIGHT, DESK_WIDTH, box, capsule, cylinder, ellipsoid, outline, project, rayOrigin, screenBounds, sphere, toLocalDirection, trace
} from './raytrace.js';
import { clamp01, createLayer, fillEllipse, hash, mixRgb, noise, pick, seeded } from './pixels.js';

const SUN = toLocalDirection([0.66, 0.66, 0.36]);
const LAMP_BULB = [-28, 56, -22];
const LAMP_COLOR = [255, 196, 120];

// ---------------------------------------------------------------------------
// Lighting and materials
// ---------------------------------------------------------------------------

let lampGlow = 0;

// Sun from the right, broken into dapples by the canopy; at night the desk lamp adds warm light.
function light(p, n) {
  const facing = Math.max(0, n[0] * SUN[0] + n[1] * SUN[1] + n[2] * SUN[2]);
  const dapple = noise(p[0] * 0.11 + 3, p[2] * 0.11 + p[1] * 0.06, 77) > 0.58 ? 1 : 0.3;
  let v = theme.night ? 0.2 + 0.4 * facing * dapple : 0.36 + 0.7 * facing * dapple;

  lampGlow = 0;
  if (theme.night) {
    const bx = LAMP_BULB[0] - p[0], by = LAMP_BULB[1] - p[1], bz = LAMP_BULB[2] - p[2];
    const distance = Math.hypot(bx, by, bz) || 1;
    lampGlow = Math.max(0, (n[0] * bx + n[1] * by + n[2] * bz) / distance) * Math.pow(clamp01(1 - distance / 46), 1.4);
    v += lampGlow * 0.75;
  }
  return v;
}

const withLamp = (color) => (lampGlow > 0 ? mixRgb(color, LAMP_COLOR, lampGlow * 0.22) : color);
const shaded = (colors, offset = 0) => (p, n) => withLamp(pick(colors, light(p, n) + offset));
const textured = (colors, texture) => (p, n) => withLamp(pick(colors, light(p, n) + texture(p, n)));
const flat = (color) => () => color;

// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------

const DOG_SCALE = 1.35, DOG_HEADING = 0.95;

// The dog is modelled small, facing the desk, then scaled and turned to look out at the valley.
function dogPoint([x, y, z]) {
  const dx = (x - 25) * DOG_SCALE, dz = (z - 6) * DOG_SCALE;
  const c = Math.cos(DOG_HEADING), s = Math.sin(DOG_HEADING);
  return [24 + dx * c - dz * s, y * DOG_SCALE, 10 + dx * s + dz * c];
}

function deskModel() {
  const wood = textured(RAMPS.wood, (p, n) => (n[1] > 0.5
    ? (noise(p[0] * 0.12, p[2] * 0.9, 2) - 0.5) * 0.3
    : (noise(p[0] * 0.1 + p[2] * 0.1, p[1] * 1.4, 3) - 0.5) * 0.2 - 0.05));
  const charcoal = shaded(RAMPS.charcoal);
  const chrome = shaded(RAMPS.chrome);

  const drawers = (p, n) => {
    if (n[2] > 0.5) {
      if (Math.abs(p[1] - 26) < 0.5) return shaded(RAMPS.wood, -0.35)(p, n);
      const handle = p[0] > 23 && p[0] < 29 && (Math.abs(p[1] - 32) < 0.6 || Math.abs(p[1] - 20) < 0.6);
      if (handle) return shaded(RAMPS.chrome, 0.2)(p, n);
    }
    return wood(p, n);
  };
  const monitor = (p, n) => {
    if (n[2] > 0.5 && Math.abs(p[0]) <= 20.5 && p[1] >= 52 && p[1] <= 75.5) return { screen: [p[0] + 20.5, 75.5 - p[1]] };
    return charcoal(p, n);
  };
  const keyboard = (p, n) => {
    const key = n[1] > 0.5 && (Math.floor((p[0] + 12) / 1.6) + Math.floor((p[2] + 24) / 1.6)) & 1;
    return withLamp(pick(RAMPS.charcoal, light(p, n) * 0.8 + (key ? 0.15 : 0)));
  };
  const book = (colors, edgeLow, edgeHigh) => (p, n) =>
    shaded(n[0] > 0.5 && p[1] > edgeLow && p[1] < edgeHigh ? RAMPS.pages : colors)(p, n);

  const legs = [];
  for (const x of [-39, 36]) for (const z of [-43, -14]) legs.push(box([x, 0, z], [x + 3, 38, z + 3], wood));

  return [
    box([-40, 38, -44], [40, 41, -10], wood),
    ...legs,
    box([17, 14, -42], [35, 38, -13], drawers),
    box([-22, 50, -39], [22, 77, -36], monitor),
    box([-12, 55, -42], [12, 72, -39], charcoal),
    box([-2, 41, -42], [2, 56, -40], charcoal),
    box([-8, 41, -43], [8, 42, -35], charcoal),
    box([-12, 41, -24], [12, 42, -17], keyboard),
    ellipsoid([18, 41.5, -19], [1.6, 0.9, 2.3], shaded(RAMPS.ceramic)),

    // Lamp
    ellipsoid([-35, 41.5, -15], [3.6, 1, 3.6], shaded(RAMPS.lamp)),
    capsule([-35, 42, -15], [-37, 57, -19], 0.8, chrome),
    sphere([-37, 57, -19], 1.3, chrome),
    capsule([-37, 57, -19], [-30, 60, -22], 0.8, chrome),
    ellipsoid([-29, 58.6, -22.4], [2.8, 2.6, 3.2], shaded(RAMPS.lamp)),
    ellipsoid([-28.2, 56.8, -22.4], [1.3, 1, 1.3], () => (theme.night ? [255, 241, 194] : [217, 210, 189])),

    // Mug, books and a plant
    cylinder(26, -20, 41, 46, 2.4, (p, n) => (n[1] > 0.5 && Math.hypot(p[0] - 26, p[2] + 20) < 1.7 ? [61, 37, 25] : shaded(RAMPS.ceramic)(p, n))),
    capsule([28.8, 42.4, -20], [28.8, 44.8, -20], 0.7, shaded(RAMPS.ceramic)),
    box([24, 41, -38], [36, 43.5, -29], book(RAMPS.bookBlue, 41.6, 43)),
    box([25, 43.5, -37], [35, 45.8, -30], book(RAMPS.bookRed, 44, 45.4)),
    cylinder(30, -33.5, 45.8, 50.5, 3.2, (p, n) => (n[1] > 0.5 ? [52, 36, 26] : shaded(RAMPS.pot, p[1] > 49.6 ? 0.15 : 0)(p, n))),
    ...[[26, 58, -34], [29, 61.5, -32], [32.5, 60, -35], [35, 56, -33], [31, 57, -29.5], [27, 55, -37]].map((tip, i) =>
      capsule([30, 50, -33.5], tip, 0.75, textured(RAMPS.plant, (p) => (i % 2) * 0.08 + (hash(p[0] * 3 | 0, p[1] * 3 | 0, 9) < 0.15 ? 0.15 : 0))))
  ];
}

function chairModel() {
  const charcoal = shaded(RAMPS.charcoal);
  const fabric = shaded(RAMPS.charcoal, -0.05);
  const chrome = shaded(RAMPS.chrome);
  const mesh = (p) => Math.abs(p[0]) < 11 && p[1] > 31 && p[1] < 45 && !(p[1] > 36 && p[1] < 38) && ((Math.floor(p[0] + 20) + Math.floor(p[1])) & 1) === 1;

  const shapes = [
    box([-12.5, 22, -4], [12.5, 25, 14], fabric),
    box([-13, 29, 15], [13, 47, 17], fabric, { hole: mesh }),
    box([-2, 22, 13], [2, 30, 16], charcoal),
    box([-16, 25, 2], [-14, 33, 5], charcoal),
    box([14, 25, 2], [16, 33, 5], charcoal),
    box([-17, 33, -3], [-13, 34.5, 9], fabric),
    box([13, 33, -3], [17, 34.5, 9], fabric),
    cylinder(0, 5, 6, 22, 1.3, chrome),
    cylinder(0, 5, 14, 22, 1.9, charcoal)
  ];
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 0.4 + 0.3, x = Math.cos(angle) * 13, z = 5 + Math.sin(angle) * 13;
    shapes.push(capsule([0, 5, 5], [x, 2.6, z], 1.1, charcoal), ellipsoid([x, 1.4, z], [1.5, 1.4, 1.5], charcoal));
  }
  return shapes;
}

const hoodieTexture = (p) => (noise(p[0] * 0.22 + p[1] * 0.1, p[1] * 0.28 + p[2] * 0.12, 5) - 0.5) * 0.32
  + (p[1] < 29 ? -0.1 + (Math.floor(p[0] * 1.2) & 1) * 0.07 : 0);

// Everything on him except the head and forearms, which move.
function coderModel() {
  const jeans = textured(RAMPS.jeans, (p) => (noise(p[0] * 0.5, p[1] * 0.5 + p[2] * 0.3, 6) - 0.5) * 0.18);
  const hoodie = textured(RAMPS.hoodie, hoodieTexture);
  const shapes = [];
  for (const side of [-1, 1]) {
    shapes.push(
      capsule([side * 5.5, 27, 8], [side * 6.5, 28, -10], 4.6, jeans),
      capsule([side * 6.5, 28, -10], [side * 7, 4, -13], 3.3, jeans),
      ellipsoid([side * 7, 2.2, -16], [2.6, 2.2, 4.2], shaded(RAMPS.shoes)),
      capsule([side * 11.5, 47.5, 6.5], [side * 14.5, 37, 0], 3.4, hoodie)
    );
  }
  shapes.push(
    ellipsoid([0, 38, 7], [12, 12.5, 6.8], hoodie),
    capsule([-9.5, 48, 6.5], [9.5, 48, 6.5], 4.6, hoodie),
    ellipsoid([0, 51, 10.5], [7.5, 3.6, 3.5], textured(RAMPS.hoodie, (p) => (p[1] < 49.8 ? -0.2 : 0.05))),
    capsule([0, 52, 6], [0, 57, 5.5], 2.8, shaded(RAMPS.skin, -0.12))
  );
  return shapes;
}

// Built from capsules and spheres so it can be turned to any heading.
function dogModel() {
  const fur = textured(RAMPS.dog, (p) => (noise(p[0] * 0.6 + p[2] * 0.25, p[1] * 0.7 + p[2] * 0.3, 12) - 0.5) * 0.28);
  const part = (a, b, radius, material) => capsule(dogPoint(a), dogPoint(b), radius * DOG_SCALE, material);
  const ball = (center, radius, material) => sphere(dogPoint(center), radius * DOG_SCALE, material);
  const shapes = [
    part([25, 4.2, 1], [25, 4.2, 11], 4, fur),
    ball([25, 5.2, -2], 4.3, fur),
    part([23, 1.3, -3], [23, 1.3, -10], 1.25, fur),
    part([27, 1.3, -3], [27, 1.3, -10], 1.25, fur),
    part([28.4, 3.6, 8], [28.4, 3.6, 12], 2.1, fur),
    ball([25, 9.6, -5.6], 3.1, fur),
    part([25, 8.7, -8.2], [25, 8.7, -10.2], 1.5, shaded(RAMPS.dog, 0.1)),
    ball([25, 9, -11.6], 0.7, flat([24, 16, 12]))
  ];
  for (const side of [-1, 1]) {
    shapes.push(
      part([25 + side * 2.6, 10.8, -5], [25 + side * 2.8, 7.9, -5], 1.1, shaded(RAMPS.dog, -0.18)),
      ball([25 + side * 1.5, 10.5, -8.2], 0.5, flat([20, 12, 10]))
    );
  }
  return shapes;
}

const pose = { headYaw: 0, headNod: 0, typingLift: [0, 0], tailWag: 0 };

function movingParts() {
  const hoodie = textured(RAMPS.hoodie, (p) => (noise(p[0] * 0.22, p[1] * 0.28 + p[2] * 0.12, 5) - 0.5) * 0.3 - 0.04);
  const skin = shaded(RAMPS.skin);
  const shapes = [];

  [-1, 1].forEach((side, i) => {
    const lift = pose.typingLift[i];
    shapes.push(
      capsule([side * 14.5, 37, 0], [side * 8.5, 42.2 + lift, -16], 2.7, hoodie),
      ellipsoid([side * 7.8, 42.4 + lift, -18.6], [2, 1.3, 2.6], skin)
    );
  });

  const head = [0, 63.5 - pose.headNod * 0.8, 5 - pose.headNod * 0.6];
  const forward = [Math.sin(pose.headYaw), 0, -Math.cos(pose.headYaw)];
  const right = [Math.cos(pose.headYaw), 0, Math.sin(pose.headYaw)];
  const at = (ahead, across, up) => [head[0] + forward[0] * ahead + right[0] * across, head[1] + up, head[2] + forward[2] * ahead + right[2] * across];
  const hair = textured(RAMPS.hair, (p) => (noise(p[0] * 0.9 + p[2] * 0.9, p[1] * 0.22, 3) - 0.5) * 0.5);
  const faceOrHair = (p, n) => {
    const facing = n[0] * forward[0] + n[2] * forward[2];
    const face = (facing > 0.28 && n[1] < 0.42) || (p[1] < head[1] - 5 && facing > -0.15);
    return face ? skin(p, n) : hair(p, n);
  };
  const headphones = shaded(RAMPS.headphones);

  shapes.push(
    ellipsoid(head, [6, 7.2, 6.6], faceOrHair),
    ellipsoid(at(6.2, 0, -1), [1, 1.4, 1], skin),
    sphere(at(5.2, 2.3, 0.9), 0.55, flat([24, 18, 16])),
    sphere(at(5.2, -2.3, 0.9), 0.55, flat([24, 18, 16])),
    ellipsoid(at(0, -6.5, -0.6), [2.3, 3.2, 2.3], headphones),
    ellipsoid(at(0, 6.5, -0.6), [2.3, 3.2, 2.3], headphones)
  );
  for (let i = 0; i <= 12; i++) {
    const angle = (Math.PI * i) / 12;
    shapes.push(sphere(at(0.4, Math.cos(angle) * 6.9, Math.sin(angle) * 8 + 0.2), 0.9, headphones));
  }

  shapes.push(capsule(dogPoint([25, 3.4, 14.5]), dogPoint([25 + pose.tailWag * 5, 2.2, 20.5]), 1.3 * DOG_SCALE, shaded(RAMPS.dog, 0.05)));
  return shapes;
}

// ---------------------------------------------------------------------------
// Code on the monitor
// ---------------------------------------------------------------------------

const code = { lines: [], typed: 0, nextKeyAt: 0, lastKeyAt: -10, indent: 0, rand: seeded(99) };
const MAX_LINES = 11;
const lineLength = (line) => line.segments.reduce((total, s) => total + s.length + 1, 0);

function newLine() {
  const rand = code.rand;
  if (rand() < 0.12) return { indent: 0, segments: [] };
  code.indent = Math.max(0, Math.min(4, code.indent + (rand() < 0.3 ? 1 : rand() < 0.35 ? -1 : 0)));
  const segments = [];
  let room = 34 - code.indent * 3;
  while (room > 4 && (segments.length === 0 || rand() < 0.72)) {
    const length = Math.min(room - 1, 2 + Math.floor(rand() * 6));
    segments.push({ length, color: RAMPS.syntax[Math.floor(rand() * RAMPS.syntax.length)] });
    room -= length + 1;
  }
  return { indent: code.indent, segments };
}

for (let i = 0; i < 8; i++) code.lines.push(newLine());

function typeCode(t, paused) {
  if (paused) {
    code.nextKeyAt = Math.max(code.nextKeyAt, t);
    return;
  }
  while (t >= code.nextKeyAt) {
    if (code.typed >= lineLength(code.lines[code.lines.length - 1])) {
      code.lines.push(newLine());
      if (code.lines.length > MAX_LINES) code.lines.shift();
      code.typed = 0;
    } else {
      code.typed++;
    }
    code.lastKeyAt = code.nextKeyAt;
    const r = code.rand();
    code.nextKeyAt += r < 0.035 ? 1.5 + r * 30 : 0.05 + r * 0.1;
  }
}

function screenColor(u, v, t) {
  const row = Math.floor(v), column = Math.floor(u);
  if (row >= 2 && (row - 2) % 2 === 0) {
    const i = (row - 2) / 2;
    const line = code.lines[i];
    if (line) {
      if (column === 1 || column === 2) return [70, 78, 98];
      const isLast = i === code.lines.length - 1;
      const start = 5 + line.indent * 3;
      let x = start, budget = isLast ? code.typed : Infinity;
      for (const segment of line.segments) {
        if (column >= x && column < x + Math.min(segment.length, budget)) return segment.color;
        x += segment.length + 1;
        budget -= segment.length + 1;
        if (budget <= 0) break;
      }
      const cursorOn = Math.floor(t * 2.5) % 2 === 0;
      if (isLast && cursorOn && column === start + Math.min(code.typed, lineLength(line))) return [232, 230, 226];
    }
  }
  const background = theme.night ? [22, 28, 44] : [26, 31, 42], fade = 1 - v / 60;
  return [background[0] * fade, background[1] * fade, background[2] * fade];
}

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

let lookAt = 20, lookUntil = 0;

// He stops to look out at the valley every so often, and whenever the rig appears.
export const lookOutSoon = (t) => {
  lookAt = t + 2.5;
};

export function updateDesk(t) {
  if (t > lookAt && t > lookUntil) {
    lookUntil = t + 4.5;
    lookAt = t + 22 + Math.random() * 14;
  }
  const looking = t < lookUntil;
  pose.headYaw += ((looking ? 0.95 : 0) - pose.headYaw) * 0.25;
  pose.headNod = !looking && t % 12 < 5 && Math.sin(t * 10.7) > 0 ? 1 : 0;
  const typing = !looking && t - code.lastKeyAt < 0.3, beat = Math.floor(t * 12) % 2;
  pose.typingLift = [typing && beat === 0 ? 0.9 : 0, typing && beat === 1 ? 0.9 : 0];
  pose.tailWag = Math.sin(t * (looking ? 12 : 5)) * (looking ? 1 : 0.5);
  typeCode(t, looking);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const PIXELS = DESK_WIDTH * DESK_HEIGHT;
let canvas, context, image, staticColor, staticDepth, frameDepth;
let screenPixels = [];

// The still parts are traced once per build; each frame only re-traces the moving parts.
export function buildDesk() {
  const shapes = [...deskModel(), ...chairModel(), ...coderModel(), ...dogModel()];
  staticColor = new Uint8ClampedArray(PIXELS * 4);
  staticDepth = new Float32Array(PIXELS).fill(1e9);
  screenPixels = [];

  for (let y = 0; y < DESK_HEIGHT; y++) {
    for (let x = 0; x < DESK_WIDTH; x++) {
      const hit = trace(shapes, rayOrigin(x, y));
      if (!hit) continue;
      const i = y * DESK_WIDTH + x, color = hit.shape.material(hit.point, hit.normal);
      staticDepth[i] = hit.distance;
      if (color.screen) {
        screenPixels.push([i, ...color.screen]);
        continue;
      }
      staticColor.set([color[0], color[1], color[2], 255], i * 4);
    }
  }
  outline(staticColor, staticDepth, 0, 0, DESK_WIDTH - 1, DESK_HEIGHT - 1);
  for (const [i] of screenPixels) staticColor[i * 4 + 3] = 255;

  [canvas, context] = createLayer(DESK_WIDTH, DESK_HEIGHT);
  image = context.createImageData(DESK_WIDTH, DESK_HEIGHT);
  frameDepth = new Float32Array(PIXELS);
}

function renderFrame(t) {
  const color = image.data;
  color.set(staticColor);
  frameDepth.set(staticDepth);

  for (const [i, u, v] of screenPixels) {
    const c = screenColor(u, v, t);
    color[i * 4] = c[0];
    color[i * 4 + 1] = c[1];
    color[i * 4 + 2] = c[2];
  }

  const shapes = movingParts();
  let x0 = DESK_WIDTH, y0 = DESK_HEIGHT, x1 = 0, y1 = 0;
  for (const [left, top, right, bottom] of shapes.flatMap(screenBounds)) {
    x0 = Math.min(x0, Math.floor(left - 2));
    y0 = Math.min(y0, Math.floor(top - 2));
    x1 = Math.max(x1, Math.ceil(right + 2));
    y1 = Math.max(y1, Math.ceil(bottom + 2));
  }
  x0 = Math.max(0, x0);
  y0 = Math.max(0, y0);
  x1 = Math.min(DESK_WIDTH - 1, x1);
  y1 = Math.min(DESK_HEIGHT - 1, y1);

  const moved = new Uint8Array(PIXELS);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * DESK_WIDTH + x, hit = trace(shapes, rayOrigin(x, y));
      if (!hit || hit.distance >= frameDepth[i]) continue;
      const c = hit.shape.material(hit.point, hit.normal);
      frameDepth[i] = hit.distance;
      moved[i] = 1;
      color.set([c[0], c[1], c[2], 255], i * 4);
    }
  }
  outline(color, frameDepth, x0, y0, x1, y1, moved);
  context.putImageData(image, 0, 0);
  applySunlight(canvas, 0.6, view.deskX, view.deskY);
}

export function drawDesk(ctx, t) {
  const { deskX, deskY } = view;
  renderFrame(t);
  ctx.drawImage(canvas, deskX, deskY);

  const [mugX, mugY] = project(26, 46.5, -20);
  for (let i = 0; i < 4; i++) {
    const rise = (t * 0.6 + i / 4) % 1;
    ctx.fillStyle = `rgba(240,232,222,${(1 - rise) * (theme.night ? 0.3 : 0.5)})`;
    ctx.fillRect(Math.round(deskX + mugX + Math.sin(rise * 7 + i * 2) * 1.2), Math.round(deskY + mugY - 1 - rise * 9), 1, 1);
  }

  if (theme.night) {
    const [bulbX, bulbY] = project(...LAMP_BULB);
    fillEllipse(ctx, deskX + bulbX, deskY + bulbY, 4, 4, (nx, ny) => `rgba(255,220,150,${(1 - Math.hypot(nx, ny)) * 0.3})`);
  }
}
