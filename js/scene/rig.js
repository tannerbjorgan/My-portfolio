import { view, theme } from './state.js';
import { RAMPS } from './palette.js';
import { creek, creekAt } from './valley.js';
import { clamp, clamp01, createLayer, dither, hash, hexToRgb, mixRgb, noise, plot, rgb, tone } from './pixels.js';

const SPRITE_WIDTH = 44, SPRITE_HEIGHT = 22;
const REAR_WHEEL = 9, FRONT_WHEEL = 28, AXLE_OFFSET = 9.5;
const SPEED = 9;

const rig = { active: false, distance: 0, direction: 1, nextAt: 3, rotation: 0 };
let sprites = { right: null, left: null };
let splashes = [];

// Side view of an overland 4x4 facing right; the left-facing copy is mirrored from it.
export function buildRigSprites() {
  const [canvas, g] = createLayer(SPRITE_WIDTH, SPRITE_HEIGHT);
  const body = (v) => tone(RAMPS.rig, v);
  const wheels = [[REAR_WHEEL, 18], [FRONT_WHEEL, 18]];
  const inWheelArch = (x, y) => y > 11 && wheels.some(([wx, wy]) => Math.hypot(x + 0.5 - wx, y + 0.5 - wy) < 6);
  const windshieldEdge = (y) => Math.round(25 - (8 - y) * 0.6);
  const glass = (x, y) => ((x - y) % 5 === 0 ? '#4b6479' : '#1d2834');

  for (let y = 9; y <= 14; y++) {
    for (let x = 3; x <= 37; x++) {
      if (inWheelArch(x, y)) continue;
      plot(g, body(y === 9 ? 0.85 : y === 10 ? 0.7 : y >= 13 ? 0.3 : 0.55), x, y);
      if (y >= 11 && hash(x, y, 70) < 0.3) plot(g, hash(x, y, 71) < 0.5 ? '#5d4630' : '#6e5638', x, y);
    }
  }
  for (let x = 25; x <= 37; x++) {
    plot(g, body(0.95), x, 8);
    plot(g, body(0.7), x, 7);
  }
  for (let y = 2; y <= 8; y++) {
    for (let x = 5; x <= windshieldEdge(y); x++) plot(g, body(y === 2 ? 0.95 : 0.62), x, y);
  }
  for (let y = 3; y <= 6; y++) {
    for (let x = 7; x <= 13; x++) plot(g, glass(x, y), x, y);
    for (let x = 15; x <= windshieldEdge(y) - 2; x++) plot(g, glass(x, y), x, y);
  }
  plot(g, body(0.45), 14, 3, 1, 10);
  plot(g, body(0.95), 12, 10);
  plot(g, body(0.95), 21, 10);

  for (const [wx, wy] of wheels) {
    for (let y = wy - 8; y <= wy - 2; y++) {
      for (let x = wx - 8; x <= wx + 8; x++) {
        const d = Math.hypot(x + 0.5 - wx, y + 0.5 - wy);
        if (d >= 5.6 && d < 7) plot(g, '#1c1c1e', x, y);
      }
    }
  }

  plot(g, '#202123', 38, 7, 1, 7); // grille
  plot(g, '#2a2b2e', 37, 13, 4, 2); // front bumper
  plot(g, body(0.55), 2, 4, 2, 10); // tailgate
  plot(g, '#b8322b', 2, 6, 1, 2); // tail light
  plot(g, '#18181a', 0, 5, 2, 7); // spare tyre
  plot(g, '#6c6f75', 0, 8);
  plot(g, '#2a2b2e', 0, 13, 4, 2); // rear bumper
  plot(g, '#222326', 12, 15, 13, 1); // rock slider
  plot(g, '#26272a', 6, 1, 19, 1); // roof rack
  plot(g, '#5b6a46', 7, -1, 12, 1); // rooftop tent
  plot(g, '#4a573a', 7, 0, 12, 1);
  plot(g, '#9b2f25', 21, 0, 2, 1); // jerrycan
  plot(g, theme.night ? '#fff6dc' : '#e8b04a', 22, 1, 3, 1); // light bar
  plot(g, '#18181a', 26, 3, 1, 7); // snorkel
  plot(g, '#18181a', 26, 2, 2, 1);
  plot(g, '#18181a', 24, 5); // mirror

  if (theme.night) {
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(16,10,28,.28)';
    g.fillRect(0, 0, SPRITE_WIDTH, SPRITE_HEIGHT);
    g.globalCompositeOperation = 'source-over';
  }
  plot(g, '#f4eccd', 38, 8); // headlight
  if (theme.night) plot(g, '#ff4a3a', 2, 6, 1, 2);

  const [mirrored, mg] = createLayer(SPRITE_WIDTH, SPRITE_HEIGHT);
  mg.translate(SPRITE_WIDTH, 0);
  mg.scale(-1, 1);
  mg.drawImage(canvas, 0, 0);
  sprites = { right: canvas, left: mirrored };
}

// Crawls out of the grove and down the creek, then back upstream on the next pass.
// `onAppear` is called each time it sets off.
export function updateRig(t, dt, onAppear) {
  if (!view.showRig) return;
  if (!rig.active) {
    if (t < rig.nextAt) return;
    rig.active = true;
    rig.distance = rig.direction > 0 ? creek.rigStart : creek.rigEnd;
    onAppear?.(t);
  }

  rig.distance += rig.direction * SPEED * dt;
  rig.rotation += (SPEED * dt) / 4.5;
  if ((rig.direction > 0 && rig.distance > creek.rigEnd) || (rig.direction < 0 && rig.distance < creek.rigStart)) {
    rig.active = false;
    rig.direction *= -1;
    rig.nextAt = t + 6 + Math.random() * 10;
  }

  if (rig.active && Math.random() < 0.9) {
    for (const offset of [-AXLE_OFFSET, AXLE_OFFSET]) {
      const [x, y] = creekAt(rig.distance + offset * rig.direction);
      if (x > view.width) continue;
      splashes.push({
        x: x + (Math.random() - 0.5) * 3,
        y: y - 1,
        vx: -rig.direction * (4 + Math.random() * 10),
        vy: -(6 + Math.random() * 12),
        life: 0.4 + Math.random() * 0.4
      });
    }
  }
  for (const s of splashes) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += 50 * dt;
    s.life -= dt;
  }
  splashes = splashes.filter((s) => s.life > 0);
}

function drawWheel(ctx, x, y, rotation) {
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const d = Math.hypot(dx + 0.5 - (x % 1), dy + 0.5 - (y % 1));
      if (d > 4.6) continue;
      let color;
      if (d < 1) color = '#3a3b3f';
      else if (d < 2.4) color = dx - dy > 0 ? '#b4b0a8' : '#7d8087';
      else if (d < 2.9) color = '#2b2c30';
      else {
        const knob = Math.floor(((Math.atan2(dy, dx) + rotation) * 8) / Math.PI) & 1;
        color = knob ? '#232326' : d > 3.9 ? '#141416' : '#1b1b1e';
      }
      if (theme.night) color = rgb(mixRgb(hexToRgb(color), [16, 10, 28], 0.25));
      plot(ctx, color, Math.floor(x) + dx, Math.floor(y) + dy);
    }
  }
}

export function drawRig(ctx, t) {
  if (!view.showRig || !rig.active) return;
  const direction = rig.direction;
  const [centerX, centerY] = creekAt(rig.distance);
  const rear = creekAt(rig.distance - AXLE_OFFSET * direction);
  const front = creekAt(rig.distance + AXLE_OFFSET * direction);
  const bump = (d) => (noise(d * 0.35, 0, 80) - 0.5) * 2.2;
  const rideHeight = centerY - 4.5;
  const rearY = rideHeight + clamp(rear[1] - centerY + bump(rig.distance - AXLE_OFFSET * direction), -2.5, 2.5);
  const frontY = rideHeight + clamp(front[1] - centerY + bump(rig.distance + AXLE_OFFSET * direction), -2.5, 2.5);
  const sprite = direction > 0 ? sprites.right : sprites.left;
  const left = Math.round(centerX - SPRITE_WIDTH / 2);

  // Draw the body a column at a time so it pitches between the two axles.
  for (let column = 0; column < SPRITE_WIDTH; column++) {
    const spriteX = direction > 0 ? column : SPRITE_WIDTH - 1 - column;
    const f = clamp01((spriteX - REAR_WHEEL) / (FRONT_WHEEL - REAR_WHEEL));
    const y = rearY + (frontY - rearY) * f - 18 + Math.sin(t * 9) * 0.3;
    ctx.drawImage(sprite, column, 0, 1, SPRITE_HEIGHT, left + column, Math.round(y), 1, SPRITE_HEIGHT);
  }

  const rearX = left + (direction > 0 ? REAR_WHEEL : SPRITE_WIDTH - 1 - REAR_WHEEL);
  const frontX = left + (direction > 0 ? FRONT_WHEEL : SPRITE_WIDTH - FRONT_WHEEL - 1);
  drawWheel(ctx, rearX, rearY, rig.rotation * direction);
  drawWheel(ctx, frontX, frontY, rig.rotation * direction);

  const water = theme.colors.water, frame = Math.floor(t * 8);
  for (const [wx, wy] of [[rearX, rearY], [frontX, frontY]]) {
    for (let dx = -6; dx <= 6; dx++) {
      if (hash(dx + frame, 3, 90) < 0.55) plot(ctx, rgb(water[hash(dx, frame, 91) < 0.3 ? 3 : 1]), Math.floor(wx) + dx, Math.round(wy + 4));
    }
  }

  if (theme.night) {
    const lampX = left + (direction > 0 ? 39 : 4), lampY = Math.round(frontY - 10);
    for (let d = 1; d < 30; d++) {
      for (let k = -Math.floor(d / 5); k <= Math.floor(d / 5) + 1; k++) {
        if (dither(d, k + 8) < (1 - d / 30) * 0.5) plot(ctx, 'rgba(255,236,190,.22)', lampX + d * direction, lampY + k);
      }
    }
  }

  const spray = theme.night ? '170,180,215' : '255,246,228';
  for (const s of splashes) plot(ctx, `rgba(${spray},${Math.min(1, s.life * 2)})`, Math.round(s.x), Math.round(s.y));
}
