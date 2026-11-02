// Math and drawing helpers shared by the scene. Everything is drawn one art pixel at a time onto
// low-resolution canvases that the page scales up with `image-rendering: pixelated`.

export function hash(x, y, seed = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed + 1, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Smooth value noise in [0, 1).
export function noise(x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

// Deterministic random generator (mulberry32), so the landscape looks the same on every visit.
export function seeded(seed) {
  return () => {
    seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const dither = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export function smoothstep(edge0, edge1, v) {
  const t = clamp01((v - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export const hexToRgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
export const rgb = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
export const mixRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// A ramp is a dark-to-light list of RGB colours; `pick` quantises a 0–1 shade onto it.
export const ramp = (hexes) => hexes.map(hexToRgb);
export const pick = (colors, v) => colors[clamp(Math.floor(v * colors.length), 0, colors.length - 1)];
export const tone = (colors, v) => rgb(pick(colors, v));
export const darken = (colors, amount, toward = [20, 12, 24]) => colors.map((c) => mixRgb(c, toward, amount));

// Shade for a point on a rounded 2D shape, lit from the upper right where the sun sits.
export function shade2d(nx, ny, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))) {
  return clamp01(0.5 + nx * 0.42 - ny * 0.45 + nz * 0.22);
}

export function createLayer(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return [canvas, canvas.getContext('2d')];
}

export function plot(g, color, x, y, w = 1, h = 1) {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
}

// `paint(nx, ny, x, y, nz)` receives the normalised position inside the ellipse and returns a colour or null.
export function fillEllipse(g, cx, cy, rx, ry, paint) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d = nx * nx + ny * ny;
      if (d > 1) continue;
      const color = paint(nx, ny, x, y, Math.sqrt(1 - d));
      if (color) plot(g, color, x, y);
    }
  }
}

// A capsule whose radius tapers from r0 to r1. `paint(ox, oy, x, y, t)` receives the offset from the
// centre line (normalised by radius) and how far along the stroke the pixel is.
export function fillTaper(g, x0, y0, x1, y1, r0, r1, paint) {
  const dx = x1 - x0, dy = y1 - y0, len2 = dx * dx + dy * dy || 1, pad = Math.max(r0, r1) + 1;
  for (let y = Math.floor(Math.min(y0, y1) - pad); y <= Math.ceil(Math.max(y0, y1) + pad); y++) {
    for (let x = Math.floor(Math.min(x0, x1) - pad); x <= Math.ceil(Math.max(x0, x1) + pad); x++) {
      const px = x + 0.5, py = y + 0.5;
      const t = clamp01(((px - x0) * dx + (py - y0) * dy) / len2);
      const ox = px - (x0 + dx * t), oy = py - (y0 + dy * t), r = r0 + (r1 - r0) * t;
      if (ox * ox + oy * oy > r * r) continue;
      const color = paint(ox / r, oy / r, x, y, t);
      if (color) plot(g, color, x, y);
    }
  }
}

export function fillPolygon(g, points, color) {
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
      const px = x + 0.5, py = y + 0.5;
      let inside = false;
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [xi, yi] = points[i], [xj, yj] = points[j];
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) plot(g, color, x, y);
    }
  }
}
