import { RAMPS } from './palette.js';
import { clamp, fillEllipse, fillPolygon, fillTaper, plot, rgb, tone } from './pixels.js';

// A barn swallow that crosses the page now and then: bursts of wingbeats that climb, then glides
// that sink. Each wing is an arm and a hand jointed at the wrist, posed in 3D.

let bird = null;
let nextBirdAt = 4 + Math.random() * 8;

// Every beat varies in depth, tempo and down/up timing, with the odd quick, shallow flutter.
function nextBeat(b) {
  const flutter = Math.random() < 0.18;
  b.beat = flutter
    ? { top: 0.45 + Math.random() * 0.2, bottom: -0.35 - Math.random() * 0.2, split: 0.5, frequency: 7 + Math.random() * 1.5 }
    : { top: 0.85 + Math.random() * 0.3, bottom: -0.65 - Math.random() * 0.35, split: 0.5 + Math.random() * 0.1, frequency: (4.3 + Math.random() * 1.6) * b.tempo };
}

// Wing pose: a quick, fully spread downstroke, then a slower upstroke with the wrist folded and the
// hand swept back. Angles are elevations in radians (positive is up).
function wingPose(b) {
  if (b.gliding) return { arm: 0.2, hand: 0.08, fold: 0.95, sweep: 0.9, bob: 0 };
  const { top, bottom, split } = b.beat;
  const down = b.phase < split, u = down ? b.phase / split : (b.phase - split) / (1 - split);
  const ease = 0.5 - 0.5 * Math.cos(Math.PI * u), arc = Math.sin(Math.PI * u), depth = (top - bottom) / 1.9;
  const arm = down ? top - (top - bottom) * ease : bottom + (top - bottom) * ease;
  return down
    ? { arm, hand: arm + 0.35 * arc, fold: 1, sweep: 0.3, bob: -0.9 * arc * depth }
    : { arm, hand: arm - 0.5 * arc, fold: 1 - 0.5 * arc * depth, sweep: 0.3 + 1.1 * arc, bob: 0.5 * arc * depth };
}

export function updateBird(t, dt, width, height) {
  if (!bird) {
    if (t < nextBirdAt) return;
    const direction = Math.random() < 0.65 ? 1 : -1;
    const cruise = height * (0.12 + Math.random() * 0.3);
    bird = {
      direction,
      x: direction > 0 ? -16 : width + 16,
      y: cruise,
      cruise,
      vy: 0,
      speed: 44 + Math.random() * 12,
      tempo: 0.9 + Math.random() * 0.2,
      phase: Math.random(),
      gliding: false,
      beatsLeft: 2 + Math.floor(Math.random() * 5),
      glideUntil: 0
    };
    nextBeat(bird);
  }

  const b = bird;
  if (!b.gliding) {
    b.phase += dt * b.beat.frequency;
    if (b.phase >= 1) {
      b.phase -= 1;
      nextBeat(b);
      if (--b.beatsLeft <= 0 && b.y < b.cruise + 12) {
        b.gliding = true;
        b.glideUntil = t + 0.35 + Math.random() * 1.8;
      }
    }
    const lift = (b.beat.top - b.beat.bottom) / 1.9;
    b.vy += ((b.phase < b.beat.split ? -14 * lift : 4) - b.vy) * Math.min(1, dt * 6);
    b.speed = Math.min(62, b.speed + dt * 6 * lift);
  } else {
    b.vy += (7 - b.vy) * Math.min(1, dt * 2);
    b.speed = Math.max(40, b.speed - dt * 4);
    if (t > b.glideUntil || b.y > b.cruise + 18) {
      b.gliding = false;
      b.phase = Math.random() * 0.3;
      b.beatsLeft = 2 + Math.floor(Math.random() * 5);
      nextBeat(b);
    }
  }

  b.x += b.direction * b.speed * dt;
  b.y += b.vy * dt;
  if (b.x < -24 || b.x > width + 24) {
    bird = null;
    nextBirdAt = t + 18 + Math.random() * 20;
  }
}

export const isBirdFlying = () => bird !== null;

export function drawBird(g) {
  if (!bird) return;
  const b = bird, s = b.direction, pose = wingPose(b);
  const pitch = clamp(Math.atan2(b.vy, b.speed), -0.35, 0.35);
  const cosPitch = Math.cos(pitch), sinPitch = Math.sin(pitch);

  // Local space: x toward the head, y down, z toward the viewer, seen slightly from below.
  const toScreen = (x, y, z) => {
    const rx = x * cosPitch - y * sinPitch, ry = x * sinPitch + y * cosPitch;
    return [b.x + (rx + z * 0.1) * s, b.y + pose.bob + ry + z * 0.27];
  };
  const stroke = (from, to, r0, r1, paint) => {
    const [x0, y0] = toScreen(...from), [x1, y1] = toScreen(...to);
    fillTaper(g, x0, y0, x1, y1, r0, r1, paint);
  };

  const wing = (side, shade) => {
    const shoulder = [0.8, -0.8, side * 0.9];
    const wrist = [shoulder[0] - 0.9, shoulder[1] - Math.sin(pose.arm) * 6, shoulder[2] + side * Math.cos(pose.arm) * 6];
    const handLength = 8 * pose.fold;
    const tip = [wrist[0] - pose.sweep * 8, wrist[1] - Math.sin(pose.hand) * handLength, wrist[2] + side * Math.cos(pose.hand) * handLength];
    const trailingWrist = [wrist[0] - 3 - pose.sweep * 1.5, wrist[1] + 0.3, wrist[2]];
    const trailingShoulder = [shoulder[0] - 4, shoulder[1] + 0.4, shoulder[2]];
    const outline = [shoulder, wrist, tip, trailingWrist, trailingShoulder].map((p) => toScreen(...p));

    fillPolygon(g, outline, tone(RAMPS.bird, shade));
    const [a, w, t] = outline;
    fillTaper(g, a[0], a[1], w[0], w[1], 0.9, 0.7, () => tone(RAMPS.bird, shade + 0.22));
    fillTaper(g, w[0], w[1], t[0], t[1], 0.7, 0.3, () => tone(RAMPS.bird, shade + 0.12));
    plot(g, tone(RAMPS.bird, shade - 0.15), Math.floor((outline[3][0] + t[0]) / 2), Math.floor((outline[3][1] + t[1]) / 2));
  };

  wing(-1, 0.12);
  const spread = b.gliding ? 1.2 : 0.6;
  stroke([-4, -0.2, 0], [-14, -1.6 - spread, -1], 1.1, 0.25, () => rgb(RAMPS.bird[1]));
  stroke([-4, 0.3, 0], [-13.5, 1.2 + spread, 1], 1, 0.25, () => rgb(RAMPS.bird[0]));
  stroke([-5, 0, 0], [3, 0, 0], 1.4, 2.3, (ox, oy) => (oy > 0.25 ? (oy > 0.7 ? '#cfc8ba' : '#ece6da') : tone(RAMPS.bird, 0.5 - oy * 0.4)));
  const [headX, headY] = toScreen(4.8, -0.8, 0);
  fillEllipse(g, headX, headY, 2.1, 2, (nx, ny) => (ny > 0.3 && nx * s > -0.2 ? '#a24e2a' : tone(RAMPS.bird, 0.45 - ny * 0.35)));
  const eye = toScreen(5.5, -1.2, 0), beak = toScreen(7.2, -0.6, 0);
  plot(g, '#0b0d12', Math.floor(eye[0]), Math.floor(eye[1]));
  plot(g, '#2a2620', Math.floor(beak[0]), Math.floor(beak[1]));
  wing(1, 0.5);
}
