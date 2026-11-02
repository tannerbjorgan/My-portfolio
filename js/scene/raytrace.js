import { clamp01 } from './pixels.js';

// A tiny orthographic ray tracer for the desk scene. Models are built in a local space where x
// points to the coder's right, y up and z toward his back; the camera looks from behind-left and
// slightly above, so the desk appears turned toward the valley.

const YAW = 0.6, PITCH = 0.38;
const cosYaw = Math.cos(YAW), sinYaw = Math.sin(YAW), cosPitch = Math.cos(PITCH), sinPitch = Math.sin(PITCH);

export const DESK_WIDTH = 112, DESK_HEIGHT = 116;
export const DESK_ORIGIN_X = 36, DESK_ORIGIN_Y = DESK_HEIGHT - 22;

const RAY = [-cosPitch * sinYaw, -sinPitch, -cosPitch * cosYaw];
const RAY_START = 300;

export const toLocalDirection = ([x, y, z]) => [x * cosYaw + z * sinYaw, y, -x * sinYaw + z * cosYaw];

export function project(x, y, z) {
  return [DESK_ORIGIN_X + x * cosYaw - z * sinYaw, DESK_ORIGIN_Y - y * cosPitch + (x * sinYaw + z * cosYaw) * sinPitch];
}

export function rayOrigin(px, py) {
  const s = DESK_ORIGIN_Y - (py + 0.5), X = px + 0.5 - DESK_ORIGIN_X;
  const Y = s * cosPitch + RAY_START * sinPitch, Z = -s * sinPitch + RAY_START * cosPitch;
  return [X * cosYaw + Z * sinYaw, Y, -X * sinYaw + Z * cosYaw];
}

// Each intersection returns the hit distance (or -1) and stores the surface normal here.
let normal = [0, 0, 1];

function hitBox(origin, { min, max }) {
  let near = -1e9, far = 1e9, axis = 0, sign = 0;
  for (let i = 0; i < 3; i++) {
    const inverse = 1 / RAY[i];
    let a = (min[i] - origin[i]) * inverse, b = (max[i] - origin[i]) * inverse, s = -1;
    if (a > b) {
      [a, b] = [b, a];
      s = 1;
    }
    if (a > near) {
      near = a;
      axis = i;
      sign = s;
    }
    if (b < far) far = b;
    if (near > far) return -1;
  }
  if (near < 0) return -1;
  normal = [0, 0, 0];
  normal[axis] = sign;
  return near;
}

function hitEllipsoid(origin, { center, radii }) {
  const ox = (origin[0] - center[0]) / radii[0], oy = (origin[1] - center[1]) / radii[1], oz = (origin[2] - center[2]) / radii[2];
  const dx = RAY[0] / radii[0], dy = RAY[1] / radii[1], dz = RAY[2] / radii[2];
  const a = dx * dx + dy * dy + dz * dz, b = ox * dx + oy * dy + oz * dz, c = ox * ox + oy * oy + oz * oz;
  const h = b * b - a * (c - 1);
  if (h < 0) return -1;
  const t = (-b - Math.sqrt(h)) / a;
  if (t < 0) return -1;
  const px = origin[0] + RAY[0] * t - center[0], py = origin[1] + RAY[1] * t - center[1], pz = origin[2] + RAY[2] * t - center[2];
  const nx = px / radii[0] ** 2, ny = py / radii[1] ** 2, nz = pz / radii[2] ** 2, length = Math.hypot(nx, ny, nz);
  normal = [nx / length, ny / length, nz / length];
  return t;
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

function hitCapsule(origin, { a: start, b: end, radius }) {
  const axis = sub(end, start), toOrigin = sub(origin, start);
  const axisLength2 = dot(axis, axis), axisRay = dot(axis, RAY), axisOrigin = dot(axis, toOrigin);
  const a = axisLength2 - axisRay * axisRay;
  const b = axisLength2 * dot(RAY, toOrigin) - axisOrigin * axisRay;
  const c = axisLength2 * dot(toOrigin, toOrigin) - axisOrigin * axisOrigin - radius * radius * axisLength2;
  let h = b * b - a * c, t = -1;
  if (h >= 0) {
    t = (-b - Math.sqrt(h)) / a;
    const along = axisOrigin + t * axisRay;
    if (!(along > 0 && along < axisLength2)) {
      const cap = along <= 0 ? toOrigin : sub(origin, end);
      const b2 = dot(RAY, cap), c2 = dot(cap, cap) - radius * radius;
      h = b2 * b2 - c2;
      t = h > 0 ? -b2 - Math.sqrt(h) : -1;
    }
  }
  if (t < 0) return -1;
  const point = [origin[0] + RAY[0] * t, origin[1] + RAY[1] * t, origin[2] + RAY[2] * t];
  const s = clamp01(dot(sub(point, start), axis) / axisLength2);
  normal = [(point[0] - start[0] - axis[0] * s) / radius, (point[1] - start[1] - axis[1] * s) / radius, (point[2] - start[2] - axis[2] * s) / radius];
  return t;
}

// Upright cylinder; the camera is above, so only the side and top cap can be seen.
function hitCylinder(origin, { x, z, bottom, top, radius }) {
  let best = -1, bestNormal = null;
  const tTop = (top - origin[1]) / RAY[1];
  if (tTop > 0) {
    const px = origin[0] + RAY[0] * tTop - x, pz = origin[2] + RAY[2] * tTop - z;
    if (px * px + pz * pz <= radius * radius) {
      best = tTop;
      bestNormal = [0, 1, 0];
    }
  }
  const ox = origin[0] - x, oz = origin[2] - z;
  const a = RAY[0] ** 2 + RAY[2] ** 2, b = ox * RAY[0] + oz * RAY[2], c = ox * ox + oz * oz - radius * radius, h = b * b - a * c;
  if (h >= 0) {
    const t = (-b - Math.sqrt(h)) / a, y = origin[1] + RAY[1] * t;
    if (t > 0 && y >= bottom && y <= top && (best < 0 || t < best)) {
      best = t;
      bestNormal = [(ox + RAY[0] * t) / radius, 0, (oz + RAY[2] * t) / radius];
    }
  }
  if (bestNormal) normal = bestNormal;
  return best;
}

const INTERSECT = { box: hitBox, ellipsoid: hitEllipsoid, capsule: hitCapsule, cylinder: hitCylinder };

// Shape constructors. `material(point, normal)` returns an RGB colour for the surface.
export const box = (min, max, material, extra = {}) => ({ type: 'box', min, max, material, ...extra });
export const ellipsoid = (center, radii, material) => ({ type: 'ellipsoid', center, radii, material });
export const sphere = (center, radius, material) => ellipsoid(center, [radius, radius, radius], material);
export const capsule = (a, b, radius, material) => ({ type: 'capsule', a, b, radius, material });
export const cylinder = (x, z, bottom, top, radius, material) => ({ type: 'cylinder', x, z, bottom, top, radius, material });

// Nearest hit along the ray from `origin`. Shapes with a `hole(point)` test can be seen through.
export function trace(shapes, origin) {
  let best = 1e9, shape = null, hitNormal = null;
  for (const candidate of shapes) {
    const t = INTERSECT[candidate.type](origin, candidate);
    if (t <= 0 || t >= best) continue;
    if (candidate.hole?.([origin[0] + RAY[0] * t, origin[1] + RAY[1] * t, origin[2] + RAY[2] * t])) continue;
    best = t;
    shape = candidate;
    hitNormal = normal;
  }
  if (!shape) return null;
  return { distance: best, shape, normal: hitNormal, point: [origin[0] + RAY[0] * best, origin[1] + RAY[1] * best, origin[2] + RAY[2] * best] };
}

// Screen-space bounds of a shape, used to limit how much is re-traced each frame.
export function screenBounds(shape) {
  const points = shape.type === 'capsule' ? [shape.a, shape.b] : [shape.center];
  const radius = shape.type === 'capsule' ? shape.radius : Math.max(...shape.radii);
  return points.map((p) => {
    const [x, y] = project(...p);
    return [x - radius, y - radius, x + radius, y + radius];
  });
}

// Darkens pixels on silhouettes and depth edges to give the models a pixel-art outline.
export function outline(color, depth, x0, y0, x1, y1, only) {
  for (let y = Math.max(0, y0); y <= Math.min(DESK_HEIGHT - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(DESK_WIDTH - 1, x1); x++) {
      const i = y * DESK_WIDTH + x;
      if (depth[i] >= 1e9 || (only && !only[i])) continue;
      let edge = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        const neighbour = nx < 0 || ny < 0 || nx >= DESK_WIDTH || ny >= DESK_HEIGHT ? 1e9 : depth[ny * DESK_WIDTH + nx];
        if (neighbour >= 1e9) edge = Math.max(edge, 0.62);
        else if (depth[i] - neighbour > 6) edge = Math.max(edge, 0.78);
      }
      if (edge) {
        color[i * 4] *= edge;
        color[i * 4 + 1] *= edge;
        color[i * 4 + 2] *= edge;
      }
    }
  }
}
