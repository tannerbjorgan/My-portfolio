// Pixel-art world behind the portfolio: an autumn hillside where a guy codes at a desk under a huge
// overhanging tree, his dog at his feet, looking down into a valley with mountains, a creek and an
// offroad rig crawling along the creek bed. Everything is a separate entity on the page background,
// lit by a low sun (or harvest moon). A bird occasionally flies across the page.
// Drawn at low resolution and scaled up with `image-rendering: pixelated`.
(() => {
  const world = document.getElementById('pixel-world');
  const sky = document.getElementById('pixel-sky');
  const frame = document.querySelector('.page-frame');
  if (!world || !sky || !frame || !world.getContext) return;
  const ctx = world.getContext('2d');
  const skyCtx = sky.getContext('2d');
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- helpers ----------
  const hash = (x, y, seed = 0) => {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed + 1, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const noise = (x, y, seed = 0) => {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
  const seeded = (seed) => () => {
    seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
  const dither = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const css = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  const mixRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const pick = (ramp, v) => ramp[Math.min(ramp.length - 1, Math.max(0, Math.floor(v * ramp.length)))];
  const tone = (ramp, v) => css(pick(ramp, v));
  // 2D shading for round shapes; the sun is to the right.
  const lit2d = (nx, ny, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny))) => clamp01(0.5 + nx * 0.42 - ny * 0.45 + nz * 0.22);

  const put = (g, color, x, y, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(x, y, w, h); };
  function ellipse(g, cx, cy, rx, ry, paint) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d = nx * nx + ny * ny;
        if (d > 1) continue;
        const color = paint(nx, ny, x, y, Math.sqrt(1 - d));
        if (color) put(g, color, x, y);
      }
    }
  }
  function limb(g, x0, y0, x1, y1, r0, r1, paint) {
    const dx = x1 - x0, dy = y1 - y0, len2 = dx * dx + dy * dy || 1, pad = Math.max(r0, r1) + 1;
    for (let y = Math.floor(Math.min(y0, y1) - pad); y <= Math.ceil(Math.max(y0, y1) + pad); y++) {
      for (let x = Math.floor(Math.min(x0, x1) - pad); x <= Math.ceil(Math.max(x0, x1) + pad); x++) {
        const px = x + 0.5, py = y + 0.5;
        const t = clamp01(((px - x0) * dx + (py - y0) * dy) / len2);
        const ox = px - (x0 + dx * t), oy = py - (y0 + dy * t), r = r0 + (r1 - r0) * t;
        if (ox * ox + oy * oy > r * r) continue;
        const color = paint(ox / r, oy / r, x, y, t);
        if (color) put(g, color, x, y);
      }
    }
  }
  const layer = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return [c, c.getContext('2d')];
  };
  const ramp = list => list.map(hex);
  const darken = (rmp, k = 0.6, to = [20, 12, 24]) => rmp.map(c => mixRgb(c, to, k));

  // ---------- palettes ----------
  const R = {
    wood: ramp(['#4a2f1d', '#5f3d26', '#764e31', '#8c5f3c', '#a17149', '#b5845a', '#c79a6e']),
    hoodie: ramp(['#4a2013', '#652d1a', '#823b23', '#9f4b2d', '#ba5d38', '#d27347', '#e28f5f']),
    jeans: ramp(['#18202d', '#212c3e', '#2b3a52', '#364a68', '#465e82', '#5a759c']),
    skin: ramp(['#5e3727', '#7a4a35', '#965e44', '#b07455', '#c78c69', '#d9a481']),
    hair: ramp(['#110b08', '#1b130e', '#281c14', '#37271c', '#4a3426', '#5e4433']),
    phones: ramp(['#0d0d10', '#17171b', '#222228', '#303038', '#44444e', '#5c5c68']),
    dark: ramp(['#0f1013', '#17191c', '#202328', '#2b2f35', '#393e46', '#4b515b']),
    chrome: ramp(['#3d4045', '#5d6168', '#83878f', '#aeb2b9', '#d6d9de']),
    lamp: ramp(['#16302a', '#1f4037', '#2a5246', '#376656', '#467b69', '#5a927e']),
    ceramic: ramp(['#7f7d78', '#a3a09a', '#c4c1ba', '#dcd9d2', '#efede8']),
    bookA: ramp(['#162843', '#1f3658', '#2b4a6e', '#3a5f8a', '#4d76a6']),
    bookB: ramp(['#4a1719', '#651f22', '#7f2a2c', '#99393b', '#b24a49']),
    pages: ramp(['#a9a28f', '#c8c1ad', '#e2dccb', '#f1ecdf']),
    pot: ramp(['#5a2a18', '#763621', '#93452a', '#ad5734', '#c56c44']),
    plant: ramp(['#1c3d22', '#255030', '#2f6337', '#3e7a43', '#55944f', '#6aa95e']),
    shoes: ramp(['#121214', '#1c1c20', '#28282e', '#3a3a42', '#4c4c56']),
    dog: ramp(['#4a2a10', '#6a3e16', '#8c561e', '#ae7029', '#c98c3a', '#ddaa58', '#ebc57e']),
    bird: ramp(['#0f1626', '#18233a', '#22324f', '#30466b', '#43608c']),
    rig: ramp(['#4f3d29', '#6b553a', '#8a6f4c', '#a88b61', '#c3a679', '#dbc297']),
    code: ['#7fd1b9', '#e6b450', '#c792ea', '#82aaff', '#a6accd', '#f07178'].map(hex)
  };
  const CANOPY = [
    ramp(['#3a1410', '#5a1c12', '#7e2616', '#a5351a', '#c84c20', '#e0702c', '#f09a44', '#f8c46a']),
    ramp(['#3d200e', '#5e3010', '#844616', '#ad601c', '#d07e24', '#e89c34', '#f5bc50', '#fbd878']),
    ramp(['#3a2c0e', '#5a4412', '#806218', '#a8821e', '#cca22a', '#e4bf3e', '#f2d460', '#fae88e'])
  ];
  const FALL_TREES = [
    ramp(['#5a1c12', '#8a2c18', '#b8441f', '#d9692a', '#ee9a4a']),
    ramp(['#6a3412', '#99521a', '#c97624', '#e89a34', '#f5c25e']),
    ramp(['#6a5014', '#98761c', '#c49e28', '#e2c03e', '#f6dc72']),
    ramp(['#1f3324', '#2b4630', '#3a5c3c', '#4f7548', '#638a55'])
  ];
  const THEMES = {
    light: {
      night: false,
      farLit: '#efc9a8', farShade: '#ab9dbd', snowLit: '#fff4e2', snowShade: '#d8cde3',
      wallLit: '#c98a4b', wallShade: '#9b6040',
      wallBlobs: ['#b8401f', '#d9692a', '#e89a34', '#f2c14e', '#8a3a1c', '#4f6a3a', '#3f5a34'],
      canopy: CANOPY, trees: FALL_TREES,
      water: ramp(['#5f86a3', '#7fa5bd', '#a9c6d6', '#fff0d0']), gravel: ['#b5a58c', '#9a8a72', '#cbbda3', '#857660'],
      rock: ramp(['#6e5e52', '#8a7868', '#a8937e', '#c4ae94']),
      hill: ramp(['#3a4219', '#4d5824', '#64702c', '#808534', '#a1983c', '#c0ab4a', '#d8c068']),
      bark: ramp(['#2e1d14', '#45291b', '#5e3a25', '#7a4e31', '#94653f']),
      leaves: ['#c4471f', '#e0782a', '#f0a830', '#b8321e', '#d9952e', '#8f2a1a'],
      cloud: '#f9dcc0', cloudShade: '#e9b08a', cloudLight: '#fff4e4', body: '#fff6dc', bodyShade: '#ffe2a0', halo: '#ffdb9a',
      glow: ['rgba(255,200,120,.65)', 'rgba(255,170,90,.2)'], grade: 'rgba(255,150,60,.32)', ray: '255,214,150', rayAlpha: 0.08
    },
    dark: {
      night: true,
      farLit: '#4d4569', farShade: '#2c2742', snowLit: '#978aa6', snowShade: '#5a5272',
      wallLit: '#3e2b2c', wallShade: '#2a1e22',
      wallBlobs: ['#4a2018', '#5e2c1c', '#6e3e22', '#7a5428', '#3a1814', '#1d2a22', '#18231c'],
      canopy: CANOPY.map(r => darken(r, 0.6)), trees: FALL_TREES.map(r => darken(r, 0.6)),
      water: ramp(['#1b2038', '#252c4a', '#343c60', '#f2c27a']), gravel: ['#3b3438', '#2f292e', '#4a4146', '#262126'],
      rock: ramp(['#2a2428', '#363036', '#463e44', '#5a5056']),
      hill: ramp(['#12160f', '#191e13', '#212617', '#2a2e1b', '#33361f', '#3e3f24', '#4a4a2a']),
      bark: ramp(['#140d0b', '#1f1410', '#2b1c15', '#3a261b', '#4a3222']),
      leaves: ['#5a2418', '#6e3420', '#7a4a24', '#4a1c14', '#6a2a18', '#3a1810'],
      cloud: '#342b3e', cloudShade: '#271f30', cloudLight: '#4e3f52', body: '#f6d69a', bodyShade: '#e0b56e', halo: '#4a3436',
      glow: ['rgba(255,196,130,.4)', 'rgba(180,120,140,.1)'], grade: 'rgba(150,90,150,.28)', ray: '255,206,150', rayAlpha: 0.035
    }
  };
  let T = THEMES.dark, night = true;

  // ---------- layout ----------
  let scale = 3, W = 0, H = 0, colL = 0, colR = 0, hY = 0, mh = 0, vx = 0, sunX = 0, sunY = 0;
  let showDesk = false, showRig = false, plateau = 0;
  let skyLayer, mountainLayer, valleyLayer, groveLayer, hillLayer, trunkLayer, crownA, crownB;
  let creek = [], creekLen = [], waterPixels = [], blades = [], clouds = [], stars = [], leafSpawns = [];
  let tx = 0, treeBase = 0, span = 0, layerProbe = null;

  // =====================================================================
  // 3D foreground: desk, chair, the guy and his dog, ray-cast into pixels.
  // Local space: x to his right, y up, z toward his back (he faces -z).
  // =====================================================================
  const YAW = 0.6, PITCH = 0.38;
  const ca = Math.cos(YAW), sa = Math.sin(YAW), cp = Math.cos(PITCH), sp = Math.sin(PITCH);
  const RD = [-cp * sa, -sp, -cp * ca];
  const LW = [0.66, 0.66, 0.36];
  const LL = [LW[0] * ca + LW[2] * sa, LW[1], -LW[0] * sa + LW[2] * ca];
  const BULB = [-28, 56, -22];
  const FW = 112, FH = 116, OX = 36, OY = FH - 22;
  let fgX = 0, fgY = 0;
  let fgCanvas, fgCtx, fgImage, staticColor, staticDepth, frameDepth, screenPixels = [], staticPrims = [];

  const project = (x, y, z) => [OX + x * ca - z * sa, OY - y * cp + (x * sa + z * ca) * sp];
  let N = [0, 0, 1];

  function hitBox(ro, b) {
    let t0 = -1e9, t1 = 1e9, axis = 0, sign = 0;
    for (let i = 0; i < 3; i++) {
      const inv = 1 / RD[i];
      let ta = (b.min[i] - ro[i]) * inv, tb = (b.max[i] - ro[i]) * inv, s = -1;
      if (ta > tb) { const tmp = ta; ta = tb; tb = tmp; s = 1; }
      if (ta > t0) { t0 = ta; axis = i; sign = s; }
      if (tb < t1) t1 = tb;
      if (t0 > t1) return -1;
    }
    if (t0 < 0) return -1;
    N = [0, 0, 0]; N[axis] = sign;
    return t0;
  }
  function hitEll(ro, e) {
    const ox = (ro[0] - e.c[0]) / e.r[0], oy = (ro[1] - e.c[1]) / e.r[1], oz = (ro[2] - e.c[2]) / e.r[2];
    const dx = RD[0] / e.r[0], dy = RD[1] / e.r[1], dz = RD[2] / e.r[2];
    const a = dx * dx + dy * dy + dz * dz, b = ox * dx + oy * dy + oz * dz, c = ox * ox + oy * oy + oz * oz;
    const h = b * b - a * (c - 1);
    if (h < 0) return -1;
    const t = (-b - Math.sqrt(h)) / a;
    if (t < 0) return -1;
    const px = ro[0] + RD[0] * t - e.c[0], py = ro[1] + RD[1] * t - e.c[1], pz = ro[2] + RD[2] * t - e.c[2];
    const nx = px / (e.r[0] * e.r[0]), ny = py / (e.r[1] * e.r[1]), nz = pz / (e.r[2] * e.r[2]), l = Math.hypot(nx, ny, nz);
    N = [nx / l, ny / l, nz / l];
    return t;
  }
  function hitCap(ro, k) {
    const ba = [k.b[0] - k.a[0], k.b[1] - k.a[1], k.b[2] - k.a[2]], oa = [ro[0] - k.a[0], ro[1] - k.a[1], ro[2] - k.a[2]];
    const baba = ba[0] * ba[0] + ba[1] * ba[1] + ba[2] * ba[2];
    const bard = ba[0] * RD[0] + ba[1] * RD[1] + ba[2] * RD[2];
    const baoa = ba[0] * oa[0] + ba[1] * oa[1] + ba[2] * oa[2];
    const rdoa = RD[0] * oa[0] + RD[1] * oa[1] + RD[2] * oa[2];
    const oaoa = oa[0] * oa[0] + oa[1] * oa[1] + oa[2] * oa[2];
    const a = baba - bard * bard, b = baba * rdoa - baoa * bard, c = baba * oaoa - baoa * baoa - k.r * k.r * baba;
    let h = b * b - a * c, t = -1;
    if (h >= 0) {
      t = (-b - Math.sqrt(h)) / a;
      const y = baoa + t * bard;
      if (!(y > 0 && y < baba)) {
        const oc = y <= 0 ? oa : [ro[0] - k.b[0], ro[1] - k.b[1], ro[2] - k.b[2]];
        const b2 = RD[0] * oc[0] + RD[1] * oc[1] + RD[2] * oc[2], c2 = oc[0] * oc[0] + oc[1] * oc[1] + oc[2] * oc[2] - k.r * k.r;
        h = b2 * b2 - c2;
        t = h > 0 ? -b2 - Math.sqrt(h) : -1;
      }
    }
    if (t < 0) return -1;
    const p = [ro[0] + RD[0] * t, ro[1] + RD[1] * t, ro[2] + RD[2] * t];
    const s = clamp01(((p[0] - k.a[0]) * ba[0] + (p[1] - k.a[1]) * ba[1] + (p[2] - k.a[2]) * ba[2]) / baba);
    N = [(p[0] - k.a[0] - ba[0] * s) / k.r, (p[1] - k.a[1] - ba[1] * s) / k.r, (p[2] - k.a[2] - ba[2] * s) / k.r];
    return t;
  }
  function hitCyl(ro, k) {
    let best = -1, bn = null;
    const tTop = (k.y1 - ro[1]) / RD[1];
    if (tTop > 0) {
      const px = ro[0] + RD[0] * tTop - k.x, pz = ro[2] + RD[2] * tTop - k.z;
      if (px * px + pz * pz <= k.r * k.r) { best = tTop; bn = [0, 1, 0]; }
    }
    const ox = ro[0] - k.x, oz = ro[2] - k.z;
    const a = RD[0] * RD[0] + RD[2] * RD[2], b = ox * RD[0] + oz * RD[2], c = ox * ox + oz * oz - k.r * k.r, h = b * b - a * c;
    if (h >= 0) {
      const t = (-b - Math.sqrt(h)) / a, y = ro[1] + RD[1] * t;
      if (t > 0 && y >= k.y0 && y <= k.y1 && (best < 0 || t < best)) { best = t; bn = [(ox + RD[0] * t) / k.r, 0, (oz + RD[2] * t) / k.r]; }
    }
    if (bn) N = bn;
    return best;
  }
  const HIT = { box: hitBox, ell: hitEll, cap: hitCap, cyl: hitCyl };

  function trace(prims, ro) {
    let best = 1e9, prim = null, n = null;
    for (const pr of prims) {
      const t = HIT[pr.k](ro, pr);
      if (t > 0 && t < best) {
        if (pr.hole && pr.hole([ro[0] + RD[0] * t, ro[1] + RD[1] * t, ro[2] + RD[2] * t])) continue;
        best = t; prim = pr; n = N;
      }
    }
    return prim ? { t: best, prim, n, p: [ro[0] + RD[0] * best, ro[1] + RD[1] * best, ro[2] + RD[2] * best] } : null;
  }
  const rayOrigin = (px, py) => {
    const s = OY - (py + 0.5), X = px + 0.5 - OX, Y = s * cp + 300 * sp, Z = -s * sp + 300 * cp;
    return [X * ca + Z * sa, Y, -X * sa + Z * ca];
  };

  // Lighting: warm sun (or moon) from the right, broken into dapples by the canopy, plus the lamp at night.
  let lampGlow = 0;
  function light(p, n) {
    const d = Math.max(0, n[0] * LL[0] + n[1] * LL[1] + n[2] * LL[2]);
    const dapple = noise(p[0] * 0.11 + 3, p[2] * 0.11 + p[1] * 0.06, 77) > 0.58 ? 1 : 0.3;
    let v = night ? 0.2 + 0.4 * d * dapple : 0.36 + 0.7 * d * dapple;
    lampGlow = 0;
    if (night) {
      const bx = BULB[0] - p[0], by = BULB[1] - p[1], bz = BULB[2] - p[2], dist = Math.hypot(bx, by, bz) || 1;
      lampGlow = Math.max(0, (n[0] * bx + n[1] * by + n[2] * bz) / dist) * Math.pow(clamp01(1 - dist / 46), 1.4);
      v += lampGlow * 0.75;
    }
    return v;
  }
  const WARM = [255, 196, 120];
  const finish = rgb => lampGlow > 0 ? mixRgb(rgb, WARM, lampGlow * 0.22) : rgb;
  const mat = (rmp, tex) => (p, n) => finish(pick(rmp, light(p, n) + (tex ? tex(p, n) : 0)));

  // The dog is modelled at a small size and scaled up around its body.
  // It is turned to gaze out at the valley, the same way he looks when he glances over.
  const DOG_S = 1.35, DOG_YAW = 0.95;
  const DOG = ([x, y, z]) => {
    const dx = (x - 25) * DOG_S, dz = (z - 6) * DOG_S;
    return [24 + dx * Math.cos(DOG_YAW) - dz * Math.sin(DOG_YAW), y * DOG_S, 10 + dx * Math.sin(DOG_YAW) + dz * Math.cos(DOG_YAW)];
  };

  // Animated pose
  let headYaw = 0, headNod = 0, typingLift = [0, 0], tailWag = 0;

  function buildStaticPrims() {
    const P = [];
    const box = (min, max, m, extra = {}) => P.push({ k: 'box', min, max, m, ...extra });
    const ell = (c, r, m) => P.push({ k: 'ell', c, r, m });
    const cap = (a, b, r, m) => P.push({ k: 'cap', a, b, r, m });
    const cyl = (x, z, y0, y1, r, m) => P.push({ k: 'cyl', x, z, y0, y1, r, m });

    const wood = mat(R.wood, (p, n) => n[1] > 0.5
      ? (noise(p[0] * 0.12, p[2] * 0.9, 2) - 0.5) * 0.3
      : (noise(p[0] * 0.1 + p[2] * 0.1, p[1] * 1.4, 3) - 0.5) * 0.2 - 0.05);
    const dark = mat(R.dark);
    const chrome = mat(R.chrome);

    // Desk
    box([-40, 38, -44], [40, 41, -10], wood);
    for (const x of [-39, 36]) for (const z of [-43, -14]) box([x, 0, z], [x + 3, 38, z + 3], wood);
    box([17, 14, -42], [35, 38, -13], (p, n) => {
      if (n[2] > 0.5) {
        if (Math.abs(p[1] - 26) < 0.5) return finish(pick(R.wood, light(p, n) - 0.35));
        if (p[0] > 23 && p[0] < 29 && (Math.abs(p[1] - 32) < 0.6 || Math.abs(p[1] - 20) < 0.6)) return finish(pick(R.chrome, light(p, n) + 0.2));
      }
      return wood(p, n);
    });
    // Monitor with the screen on its front face
    box([-22, 50, -39], [22, 77, -36], (p, n) => {
      if (n[2] > 0.5 && Math.abs(p[0]) <= 20.5 && p[1] >= 52 && p[1] <= 75.5) return { screen: [p[0] + 20.5, 75.5 - p[1]] };
      return dark(p, n);
    });
    box([-12, 55, -42], [12, 72, -39], dark);
    box([-2, 41, -42], [2, 56, -40], dark);
    box([-8, 41, -43], [8, 42, -35], dark);
    // Keyboard and mouse
    box([-12, 41, -24], [12, 42, -17], (p, n) => finish(pick(R.dark, light(p, n) * 0.8 + (n[1] > 0.5 && ((Math.floor((p[0] + 12) / 1.6) + Math.floor((p[2] + 24) / 1.6)) & 1) ? 0.15 : 0))));
    ell([18, 41.5, -19], [1.6, 0.9, 2.3], mat(R.ceramic));
    // Lamp
    ell([-35, 41.5, -15], [3.6, 1, 3.6], mat(R.lamp));
    cap([-35, 42, -15], [-37, 57, -19], 0.8, chrome);
    ell([-37, 57, -19], [1.3, 1.3, 1.3], chrome);
    cap([-37, 57, -19], [-30, 60, -22], 0.8, chrome);
    ell([-29, 58.6, -22.4], [2.8, 2.6, 3.2], mat(R.lamp));
    ell([-28.2, 56.8, -22.4], [1.3, 1, 1.3], () => night ? [255, 241, 194] : [217, 210, 189]);
    // Mug
    cyl(26, -20, 41, 46, 2.4, (p, n) => n[1] > 0.5 && Math.hypot(p[0] - 26, p[2] + 20) < 1.7 ? [61, 37, 25] : finish(pick(R.ceramic, light(p, n))));
    cap([28.8, 42.4, -20], [28.8, 44.8, -20], 0.7, mat(R.ceramic));
    // Books and a plant
    box([24, 41, -38], [36, 43.5, -29], (p, n) => n[0] > 0.5 && p[1] > 41.6 && p[1] < 43 ? finish(pick(R.pages, light(p, n))) : finish(pick(R.bookA, light(p, n))));
    box([25, 43.5, -37], [35, 45.8, -30], (p, n) => n[0] > 0.5 && p[1] > 44 && p[1] < 45.4 ? finish(pick(R.pages, light(p, n))) : finish(pick(R.bookB, light(p, n))));
    cyl(30, -33.5, 45.8, 50.5, 3.2, (p, n) => n[1] > 0.5 ? [52, 36, 26] : finish(pick(R.pot, light(p, n) + (p[1] > 49.6 ? 0.15 : 0))));
    [[26, 58, -34], [29, 61.5, -32], [32.5, 60, -35], [35, 56, -33], [31, 57, -29.5], [27, 55, -37]].forEach((tip, i) =>
      cap([30, 50, -33.5], tip, 0.75, mat(R.plant, (p) => (i % 2) * 0.08 + (hash(p[0] * 3 | 0, p[1] * 3 | 0, 9) < 0.15 ? 0.15 : 0))));

    // Chair
    const fabric = mat(R.dark, () => -0.05);
    box([-12.5, 22, -4], [12.5, 25, 14], fabric);
    box([-13, 29, 15], [13, 47, 17], fabric, {
      hole: (p) => Math.abs(p[0]) < 11 && p[1] > 31 && p[1] < 45 && !(p[1] > 36 && p[1] < 38) && ((Math.floor(p[0] + 20) + Math.floor(p[1])) & 1) === 1
    });
    box([-2, 22, 13], [2, 30, 16], dark);
    for (const s of [-1, 1]) {
      box(s < 0 ? [-16, 25, 2] : [14, 25, 2], s < 0 ? [-14, 33, 5] : [16, 33, 5], dark);
      box(s < 0 ? [-17, 33, -3] : [13, 33, -3], s < 0 ? [-13, 34.5, 9] : [17, 34.5, 9], fabric);
    }
    cyl(0, 5, 6, 22, 1.3, chrome);
    cyl(0, 5, 14, 22, 1.9, dark);
    for (let i = 0; i < 5; i++) {
      const ang = i * Math.PI * 0.4 + 0.3, ex = Math.cos(ang) * 13, ez = 5 + Math.sin(ang) * 13;
      cap([0, 5, 5], [ex, 2.6, ez], 1.1, dark);
      ell([ex, 1.4, ez], [1.5, 1.4, 1.5], dark);
    }

    // The guy (head and forearms are animated separately)
    const jeans = mat(R.jeans, (p) => (noise(p[0] * 0.5, p[1] * 0.5 + p[2] * 0.3, 6) - 0.5) * 0.18);
    const hoodie = mat(R.hoodie, (p) => (noise(p[0] * 0.22 + p[1] * 0.1, p[1] * 0.28 + p[2] * 0.12, 5) - 0.5) * 0.32
      + (p[1] < 29 ? -0.1 + (Math.floor(p[0] * 1.2) & 1) * 0.07 : 0));
    for (const s of [-1, 1]) {
      cap([s * 5.5, 27, 8], [s * 6.5, 28, -10], 4.6, jeans);
      cap([s * 6.5, 28, -10], [s * 7, 4, -13], 3.3, jeans);
      ell([s * 7, 2.2, -16], [2.6, 2.2, 4.2], mat(R.shoes));
      cap([s * 11.5, 47.5, 6.5], [s * 14.5, 37, 0], 3.4, hoodie);
    }
    ell([0, 38, 7], [12, 12.5, 6.8], hoodie);
    cap([-9.5, 48, 6.5], [9.5, 48, 6.5], 4.6, hoodie);
    ell([0, 51, 10.5], [7.5, 3.6, 3.5], mat(R.hoodie, (p) => p[1] < 49.8 ? -0.2 : 0.05));
    cap([0, 52, 6], [0, 57, 5.5], 2.8, mat(R.skin, () => -0.12));

    // His dog, lying beside the chair with its head up (the tail wags separately)
    const fur = mat(R.dog, (p) => (noise(p[0] * 0.6 + p[2] * 0.25, p[1] * 0.7 + p[2] * 0.3, 12) - 0.5) * 0.28);
    // Built from capsules and round parts so it can be turned to any heading.
    const dogEll = (c, r, m) => ell(DOG(c), [r * DOG_S, r * DOG_S, r * DOG_S], m);
    const dogCap = (a, b, r, m) => cap(DOG(a), DOG(b), r * DOG_S, m);
    dogCap([25, 4.2, 1], [25, 4.2, 11], 4, fur);
    dogEll([25, 5.2, -2], 4.3, fur);
    for (const s of [-1, 1]) dogCap([25 + s * 2, 1.3, -3], [25 + s * 2, 1.3, -10], 1.25, fur);
    dogCap([28.4, 3.6, 8], [28.4, 3.6, 12], 2.1, fur);
    dogEll([25, 9.6, -5.6], 3.1, fur);
    dogCap([25, 8.7, -8.2], [25, 8.7, -10.2], 1.5, mat(R.dog, () => 0.1));
    dogEll([25, 9, -11.6], 0.7, () => [24, 16, 12]);
    for (const s of [-1, 1]) {
      dogCap([25 + s * 2.6, 10.8, -5], [25 + s * 2.8, 7.9, -5], 1.1, mat(R.dog, () => -0.18));
      dogEll([25 + s * 1.5, 10.5, -8.2], 0.5, () => [20, 12, 10]);
    }
    return P;
  }

  function dynamicPrims() {
    const P = [];
    const hoodie = mat(R.hoodie, (p) => (noise(p[0] * 0.22, p[1] * 0.28 + p[2] * 0.12, 5) - 0.5) * 0.3 - 0.04);
    const skin = mat(R.skin);
    for (const [i, s] of [[0, -1], [1, 1]]) {
      const lift = typingLift[i];
      P.push({ k: 'cap', a: [s * 14.5, 37, 0], b: [s * 8.5, 42.2 + lift, -16], r: 2.7, m: hoodie });
      P.push({ k: 'ell', c: [s * 7.8, 42.4 + lift, -18.6], r: [2, 1.3, 2.6], m: skin });
    }
    const H0 = [0, 63.5 - headNod * 0.8, 5 - headNod * 0.6];
    const fwd = [Math.sin(headYaw), 0, -Math.cos(headYaw)], right = [Math.cos(headYaw), 0, Math.sin(headYaw)];
    const at = (f, r, u) => [H0[0] + fwd[0] * f + right[0] * r, H0[1] + u, H0[2] + fwd[2] * f + right[2] * r];
    const hair = mat(R.hair, (p) => (noise(p[0] * 0.9 + p[2] * 0.9, p[1] * 0.22, 3) - 0.5) * 0.5);
    P.push({
      k: 'ell', c: H0, r: [6, 7.2, 6.6], m: (p, n) => {
        const facing = n[0] * fwd[0] + n[2] * fwd[2];
        if ((facing > 0.28 && n[1] < 0.42) || (p[1] < H0[1] - 5 && facing > -0.15)) return skin(p, n);
        return hair(p, n);
      }
    });
    P.push({ k: 'ell', c: at(6.2, 0, -1), r: [1, 1.4, 1], m: skin });
    P.push({ k: 'ell', c: at(5.2, 2.3, 0.9), r: [0.55, 0.55, 0.55], m: () => [24, 18, 16] });
    P.push({ k: 'ell', c: at(5.2, -2.3, 0.9), r: [0.55, 0.55, 0.55], m: () => [24, 18, 16] });
    const phones = mat(R.phones);
    for (const s of [-1, 1]) P.push({ k: 'ell', c: at(0, s * 6.5, -0.6), r: [2.3, 3.2, 2.3], m: phones });
    for (let i = 0; i <= 12; i++) {
      const ang = Math.PI * i / 12;
      P.push({ k: 'ell', c: at(0.4, Math.cos(ang) * 6.9, Math.sin(ang) * 8 + 0.2), r: [0.9, 0.9, 0.9], m: phones });
    }
    P.push({ k: 'cap', a: DOG([25, 3.4, 14.5]), b: DOG([25 + tailWag * 5, 2.2, 20.5]), r: 1.3 * DOG_S, m: mat(R.dog, () => 0.05) });
    return P;
  }

  function outline(color, depth, x0, y0, x1, y1, only) {
    for (let y = Math.max(0, y0); y <= Math.min(FH - 1, y1); y++) {
      for (let x = Math.max(0, x0); x <= Math.min(FW - 1, x1); x++) {
        const i = y * FW + x;
        if (depth[i] >= 1e9 || (only && !only[i])) continue;
        let edge = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          const nd = nx < 0 || ny < 0 || nx >= FW || ny >= FH ? 1e9 : depth[ny * FW + nx];
          if (nd >= 1e9) edge = Math.max(edge, 0.62);
          else if (depth[i] - nd > 6) edge = Math.max(edge, 0.78);
        }
        if (edge) { color[i * 4] *= edge; color[i * 4 + 1] *= edge; color[i * 4 + 2] *= edge; }
      }
    }
  }

  function renderStaticForeground() {
    staticPrims = buildStaticPrims();
    staticColor = new Uint8ClampedArray(FW * FH * 4);
    staticDepth = new Float32Array(FW * FH).fill(1e9);
    screenPixels = [];
    for (let y = 0; y < FH; y++) {
      for (let x = 0; x < FW; x++) {
        const hit = trace(staticPrims, rayOrigin(x, y));
        if (!hit) continue;
        const i = y * FW + x, c = hit.prim.m(hit.p, hit.n);
        staticDepth[i] = hit.t;
        if (c.screen) { screenPixels.push([i, c.screen[0], c.screen[1]]); continue; }
        staticColor[i * 4] = c[0]; staticColor[i * 4 + 1] = c[1]; staticColor[i * 4 + 2] = c[2]; staticColor[i * 4 + 3] = 255;
      }
    }
    outline(staticColor, staticDepth, 0, 0, FW - 1, FH - 1);
    for (const [i] of screenPixels) staticColor[i * 4 + 3] = 255;
    [fgCanvas, fgCtx] = layer(FW, FH);
    fgImage = fgCtx.createImageData(FW, FH);
    frameDepth = new Float32Array(FW * FH);
  }

  function screenColor(u, v, t) {
    const row = Math.floor(v), col = Math.floor(u);
    const bg = night ? [22, 28, 44] : [26, 31, 42];
    const shade = 1 - v / 60;
    if (row >= 2 && (row - 2) % 2 === 0) {
      const i = (row - 2) / 2;
      if (i < code.lines.length) {
        if (col === 1 || col === 2) return [70, 78, 98];
        const line = code.lines[i], isLast = i === code.lines.length - 1;
        let x = 5 + line.indent * 3, budget = isLast ? code.typed : Infinity;
        for (const s of line.segs) {
          const len = Math.min(s.len, budget);
          if (col >= x && col < x + len) return s.color;
          x += s.len + 1; budget -= s.len + 1;
          if (budget <= 0) break;
        }
        if (isLast && Math.floor(t * 2.5) % 2 === 0 && col === 5 + line.indent * 3 + Math.min(code.typed, lineLength(line))) return [232, 230, 226];
      }
    }
    return [bg[0] * shade, bg[1] * shade, bg[2] * shade];
  }

  function renderForeground(t) {
    const color = fgImage.data;
    color.set(staticColor);
    frameDepth.set(staticDepth);
    for (const [i, u, v] of screenPixels) {
      const c = screenColor(u, v, t);
      color[i * 4] = c[0]; color[i * 4 + 1] = c[1]; color[i * 4 + 2] = c[2];
    }
    const dyn = dynamicPrims();
    let x0 = FW, y0 = FH, x1 = 0, y1 = 0;
    for (const pr of dyn) {
      const pts = pr.k === 'cap' ? [pr.a, pr.b] : [pr.c];
      const rad = pr.k === 'cap' ? pr.r : Math.max(...pr.r);
      for (const q of pts) {
        const [sx, sy] = project(q[0], q[1], q[2]);
        x0 = Math.min(x0, Math.floor(sx - rad - 2)); x1 = Math.max(x1, Math.ceil(sx + rad + 2));
        y0 = Math.min(y0, Math.floor(sy - rad - 2)); y1 = Math.max(y1, Math.ceil(sy + rad + 2));
      }
    }
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(FW - 1, x1); y1 = Math.min(FH - 1, y1);
    const mask = new Uint8Array(FW * FH);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * FW + x, hit = trace(dyn, rayOrigin(x, y));
        if (!hit || hit.t >= frameDepth[i]) continue;
        const c = hit.prim.m(hit.p, hit.n);
        frameDepth[i] = hit.t; mask[i] = 1;
        color[i * 4] = c[0]; color[i * 4 + 1] = c[1]; color[i * 4 + 2] = c[2]; color[i * 4 + 3] = 255;
      }
    }
    outline(color, frameDepth, x0, y0, x1, y1, mask);
    fgCtx.putImageData(fgImage, 0, 0);
    grade(fgCanvas, 0.6, fgX, fgY);
  }

  // ---------- code on the monitor ----------
  const code = { lines: [], typed: 0, nextAt: 0, rand: seeded(99), indent: 0 };
  function newLine() {
    const rand = code.rand;
    if (rand() < 0.12) return { indent: 0, segs: [] };
    code.indent = Math.max(0, Math.min(4, code.indent + (rand() < 0.3 ? 1 : rand() < 0.35 ? -1 : 0)));
    const segs = [];
    let room = 34 - code.indent * 3;
    while (room > 4 && (segs.length === 0 || rand() < 0.72)) {
      const len = Math.min(room - 1, 2 + Math.floor(rand() * 6));
      segs.push({ len, color: R.code[Math.floor(rand() * R.code.length)] });
      room -= len + 1;
    }
    return { indent: code.indent, segs };
  }
  const lineLength = (line) => line.segs.reduce((n, s) => n + s.len + 1, 0);
  for (let i = 0; i < 8; i++) code.lines.push(newLine());
  let lastKey = -10;
  function stepCode(t, paused) {
    if (paused) { code.nextAt = Math.max(code.nextAt, t); return; }
    while (t >= code.nextAt) {
      const current = code.lines[code.lines.length - 1];
      if (code.typed >= lineLength(current)) {
        code.lines.push(newLine());
        if (code.lines.length > 11) code.lines.shift();
        code.typed = 0;
      } else code.typed++;
      lastKey = code.nextAt;
      const r = code.rand();
      code.nextAt += r < 0.035 ? 1.5 + r * 30 : 0.05 + r * 0.1;
    }
  }

  // =====================================================================
  // Light: everything drawn is warmed and brightened toward the sun (or moon).
  // Only pixels that exist are touched, so the page background stays clean.
  // =====================================================================
  function grade(c, amount, ox = 0, oy = 0) {
    const g = c.getContext('2d'), w = c.width, h = c.height;
    const [mask, mg] = layer(w, h);
    mg.drawImage(c, 0, 0);
    const reach = Math.max(W, H) * 0.95;
    const glow = g.createRadialGradient(sunX - ox, sunY - oy, 0, sunX - ox, sunY - oy, reach);
    glow.addColorStop(0, T.glow[0]); glow.addColorStop(0.35, T.glow[1]); glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = amount;
    g.globalCompositeOperation = 'screen';
    g.fillStyle = glow; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'soft-light';
    g.fillStyle = T.grade; g.fillRect(0, 0, w, h);
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(mask, 0, 0);
    g.globalCompositeOperation = 'source-over';
  }

  // =====================================================================
  // The valley: mountains, autumn ridges, creek, trees and the rig.
  // =====================================================================
  const ridged = (x, seed) => {
    let v = 0, amp = 1, f = 0.011, total = 0;
    for (let o = 0; o < 4; o++) {
      const n = 1 - Math.abs(noise(x * f, o * 7.1, seed) * 2 - 1);
      v += n * n * amp; total += amp; amp *= 0.5; f *= 2.1;
    }
    return v / total;
  };
  const farTop = x => hY - 6 - ridged(x, 1) * mh;
  const wallTop = x => {
    const wobble = (noise(x * 0.06, 3, 4) - 0.5) * 6;
    return x < vx
      ? hY + 12 - smooth(vx, vx * 0.35, x) * mh * 0.42 + wobble
      : hY + 12 - Math.pow(smooth(vx, W + 30, x), 0.7) * mh * 0.55 + wobble;
  };

  function drawPine(g, x, base, h, rmp) {
    x = Math.round(x); base = Math.round(base);
    put(g, css(rmp[0]), x, base - 1, 1, 2);
    const top = base - 1 - h;
    for (let y = top; y < base - 1; y++) {
      const f = (y - top) / h;
      const half = Math.round(f * h * 0.32 + ((y - top) % 3 === 2 ? 1 : 0));
      for (let dx = -half; dx <= half; dx++) put(g, tone(rmp, dx > 0 ? 0.75 : dx === 0 ? 0.5 : 0.2), x + dx, y);
    }
  }
  function drawFallTree(g, x, base, h, rmp) {
    const trunk = Math.max(1, Math.round(h * 0.3));
    put(g, '#3a2418', Math.round(x), Math.round(base - trunk), 1, trunk);
    ellipse(g, x, base - trunk - h * 0.35, Math.max(1.2, h * 0.36), Math.max(1.2, h * 0.42), (nx, ny, px, py, nz) => {
      if (Math.hypot(nx, ny) > 0.78 + noise(px * 0.6, py * 0.6, 33) * 0.3) return null;
      return tone(rmp, lit2d(nx, ny, nz) + (hash(px, py, 34) - 0.5) * 0.25);
    });
  }
  const treeAt = (g, x, base, h, rand) => {
    const k = Math.floor(rand() * 10);
    if (k < 3) drawPine(g, x, base, Math.round(h), T.trees[3]);
    else drawFallTree(g, x, base, h * 0.8, T.trees[k % 3]);
  };

  function buildSky() {
    const [c, g] = layer(W, H);
    const r = night ? 9 : 7;
    for (let y = -r - 14; y <= r + 14; y++) for (let x = -r - 14; x <= r + 14; x++) {
      const d = Math.hypot(x, y);
      if (d <= r + 0.3) put(g, d > r - 1.5 ? T.bodyShade : T.body, sunX + x, sunY + y);
      else if (d < r + 14 && dither(sunX + x, sunY + y) < Math.pow(1 - (d - r) / 14, 1.6) * 0.75) put(g, T.halo, sunX + x, sunY + y);
    }
    if (night) [[-3, -2, 1.6], [2, 3, 1.2], [-1, 4, 0.9], [4, -2, 1]].forEach(([x, y, cr]) =>
      ellipse(g, sunX + x, sunY + y, cr, cr, () => T.bodyShade));
    return c;
  }

  function buildMountains() {
    const [c, g] = layer(W, H);
    for (let x = 0; x < W; x++) {
      const top = Math.round(farTop(x));
      for (let y = top; y < hY + 8; y++) {
        if (y > hY - 6 && dither(x, y) < (y - (hY - 6)) / 14) continue;
        const k = 2 + (y - top) * 0.6;
        const slope = farTop(x - k) - farTop(x + k) + (noise(x * 0.35 + y * 0.12, y * 0.05, 8) - 0.5) * 7;
        const snowLine = hY - mh * 0.5 + (noise(x * 0.08, 1, 9) - 0.5) * 10;
        const isSnow = y < snowLine && (y - top) < 18 + noise(x * 0.2, y * 0.2, 10) * 8;
        const litSide = slope < 0;
        put(g, isSnow ? (litSide ? T.snowLit : T.snowShade) : (litSide ? T.farLit : T.farShade), x, y);
      }
    }
    // Ridges forming the valley walls, covered in autumn trees.
    for (let x = 0; x < W; x++) {
      const top = Math.round(wallTop(x));
      for (let y = top; y < top + 30; y++) {
        if (y > top + 14 && dither(x, y) < (y - top - 14) / 16) continue;
        const slope = wallTop(x - 3) - wallTop(x + 3);
        put(g, slope < -0.4 ? T.wallLit : T.wallShade, x, y);
      }
    }
    const rand = seeded(31);
    for (let i = 0; i < W * 2.2; i++) {
      const x = rand() * W, top = wallTop(x), y = top + rand() * 17, r = 0.9 + rand() * 1.4;
      const col = T.wallBlobs[Math.floor(rand() * T.wallBlobs.length)];
      ellipse(g, x, y, r, r * 1.1, (nx) => nx > 0.2 ? col : css(mixRgb(hex(col), [30, 15, 20], 0.3)));
    }
    for (let x = 1; x < W; x += 2 + Math.floor(rand() * 3)) {
      const r = 1.2 + rand() * 1.5, col = T.wallBlobs[Math.floor(rand() * T.wallBlobs.length)];
      ellipse(g, x, wallTop(x) + 0.5, r, r * 1.2, () => col);
    }
    grade(c, 1);
    layerProbe = [Math.floor(W / 2), Math.round(farTop(Math.floor(W / 2))) + 2];
    return c;
  }

  function buildCreek() {
    const P = [
      [vx, hY + 10], [vx + 8, hY + 20], [vx - 3, hY + 34], [vx + 16, Math.round(H * 0.77)],
      [vx + 16 + (W - vx) * 0.45, Math.round(H * 0.84)], [W + 50, Math.round(H * 0.88)]
    ];
    creek = []; creekLen = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      for (let s = 0; s < 1; s += 1 / 80) {
        const s2 = s * s, s3 = s2 * s;
        const f = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * s + (2 * a - 5 * b + 4 * c2 - d) * s2 + (-a + 3 * b - 3 * c2 + d) * s3);
        creek.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    let total = 0;
    creek.forEach((pt, i) => { if (i) total += Math.hypot(pt[0] - creek[i - 1][0], pt[1] - creek[i - 1][1]); creekLen.push(total); });
    return P;
  }
  const creekWidth = y => 0.6 + clamp01((y - hY) / (H - hY)) * 9;
  function creekAt(d) {
    let i = 1;
    while (i < creekLen.length - 1 && creekLen[i] < d) i++;
    const f = clamp01((d - creekLen[i - 1]) / ((creekLen[i] - creekLen[i - 1]) || 1));
    return [creek[i - 1][0] + (creek[i][0] - creek[i - 1][0]) * f, creek[i - 1][1] + (creek[i][1] - creek[i - 1][1]) * f];
  }

  let rigStart = 0, rigEnd = 0, groveAt = 0;
  function buildValley() {
    const [c, g] = layer(W, H);
    const P = buildCreek();
    const water = new Map();
    creek.forEach(([x, y]) => {
      const w = creekWidth(y);
      for (let xx = Math.round(x - w - 3 - w * 0.6); xx <= Math.round(x + w + 3 + w * 0.6); xx++) {
        const yy = Math.round(y), key = yy * 10000 + xx, off = Math.abs(xx + 0.5 - x);
        if (off <= w) water.set(key, Math.min(water.get(key) ?? 1, off / w));
        else if (!water.has(key) && hash(xx, yy, 40) < 0.5 * (1 - (off - w) / (3 + w * 0.6))) {
          put(g, T.gravel[Math.floor(hash(xx, yy, 41) * T.gravel.length)], xx, yy);
        }
      }
    });
    waterPixels = [];
    for (const [key, off] of water) {
      const y = Math.floor(key / 10000), x = key - y * 10000;
      const v = 0.25 + noise(x * 0.3, y * 0.9, 42) * 0.45 - (off > 0.8 ? 0.25 : 0);
      put(g, css(T.water[Math.min(2, Math.max(0, Math.floor(v * 3)))]), x, y);
      waterPixels.push([x, y]);
    }
    const rand = seeded(52);
    const trees = [];
    for (let i = 0; i < 80; i++) {
      const d = rand() * creekLen[creekLen.length - 1] * 0.75;
      const [x, y] = creekAt(d), w = creekWidth(y), side = rand() < 0.5 ? -1 : 1;
      const px = x + side * (w + 5 + rand() * (10 + (y - hY) * 0.9)), py = y + (rand() - 0.5) * 6;
      if (px < colR + 4 || px > W - 2 || py > H * 0.79) continue;
      trees.push([px, py, 3 + (py - hY) / (H - hY) * 24 * (0.7 + rand() * 0.5)]);
    }
    trees.sort((a, b) => a[1] - b[1]).forEach(([x, y, h]) => treeAt(g, x, y, h, rand));
    for (let i = 0; i < 18; i++) {
      const [x, y] = creekAt(rand() * creekLen[creekLen.length - 1] * 0.95), w = creekWidth(y);
      const bx = x + (rand() < 0.5 ? -1 : 1) * (w + 1 + rand() * 4), r = 0.8 + (y - hY) / (H - hY) * 3 * rand();
      if (bx < colR) continue;
      ellipse(g, bx, y, r * 1.4, r, (nx, ny, px, py, nz) => tone(T.rock, lit2d(nx, ny, nz)));
    }
    let i3 = 0;
    while (i3 < creek.length - 1 && creek[i3][1] < P[3][1]) i3++;
    groveAt = creekLen[i3];
    rigStart = groveAt - 16;
    rigEnd = creekLen[creekLen.length - 1];
    for (let i = creek.length - 1; i > 0; i--) if (creek[i][0] < W + 30) { rigEnd = creekLen[i]; break; }
    grade(c, 1);
    return c;
  }

  function buildGrove() {
    const [c, g] = layer(W, H);
    const rand = seeded(61);
    const items = [];
    for (let i = 0; i < 10; i++) {
      const [x, y] = creekAt(groveAt - 34 + i * 5 + rand() * 4);
      items.push([x + (rand() - 0.5) * 14, y + 4 + rand() * 5, 20 + Math.round(rand() * 10)]);
    }
    items.sort((a, b) => a[1] - b[1]).forEach(([x, y, h]) => treeAt(g, x, y, h, rand));
    const [gx, gyy] = creekAt(groveAt - 4);
    [[-8, 3, 6, 4], [3, 4, 5, 3.4], [-2, 6, 4, 2.6]].forEach(([ox, oy, rx, ry]) =>
      ellipse(g, gx + ox, gyy + oy, rx, ry, (nx, ny, px, py, nz) => tone(T.rock, lit2d(nx, ny, nz) + (hash(px, py, 62) - 0.5) * 0.2)));
    grade(c, 1);
    return c;
  }

  // ---------- the rig ----------
  let rigSprite, rigSpriteFlip;
  function buildRig() {
    const [c, g] = layer(44, 22);
    const body = v => tone(R.rig, v);
    const wheels = [[9, 18], [28, 18]];
    const archCut = (x, y) => wheels.some(([wx, wy]) => Math.hypot(x + 0.5 - wx, y + 0.5 - wy) < 6 && y > 11);
    for (let y = 9; y <= 14; y++) for (let x = 3; x <= 37; x++) {
      if (archCut(x, y)) continue;
      put(g, body(y === 9 ? 0.85 : y === 10 ? 0.7 : y >= 13 ? 0.3 : 0.55), x, y);
      if (y >= 11 && hash(x, y, 70) < 0.3) put(g, hash(x, y, 71) < 0.5 ? '#5d4630' : '#6e5638', x, y);
    }
    for (let x = 25; x <= 37; x++) put(g, body(0.95), x, 8);
    for (let x = 25; x <= 37; x++) put(g, body(0.7), x, 7);
    for (let y = 2; y <= 8; y++) {
      const right = Math.round(25 - (8 - y) * 0.6);
      for (let x = 5; x <= right; x++) put(g, body(y === 2 ? 0.95 : 0.62), x, y);
    }
    for (let y = 3; y <= 6; y++) {
      for (let x = 7; x <= 13; x++) put(g, (x - y) % 5 === 0 ? '#4b6479' : '#1d2834', x, y);
      for (let x = 15; x <= Math.round(25 - (8 - y) * 0.6) - 2; x++) put(g, (x - y) % 5 === 0 ? '#4b6479' : '#1d2834', x, y);
    }
    put(g, body(0.45), 14, 3, 1, 10);
    put(g, body(0.95), 12, 10); put(g, body(0.95), 21, 10);
    wheels.forEach(([wx, wy]) => {
      for (let y = wy - 8; y <= wy - 2; y++) for (let x = wx - 8; x <= wx + 8; x++) {
        const d = Math.hypot(x + 0.5 - wx, y + 0.5 - wy);
        if (d >= 5.6 && d < 7) put(g, '#1c1c1e', x, y);
      }
    });
    put(g, '#202123', 38, 7, 1, 7);
    put(g, '#2a2b2e', 37, 13, 4, 2);
    put(g, body(0.55), 2, 4, 2, 10);
    put(g, '#b8322b', 2, 6, 1, 2);
    put(g, '#18181a', 0, 5, 2, 7);
    put(g, '#6c6f75', 0, 8);
    put(g, '#2a2b2e', 0, 13, 4, 2);
    put(g, '#222326', 12, 15, 13, 1);
    put(g, '#26272a', 6, 1, 19, 1);
    put(g, '#5b6a46', 7, -1, 12, 1);
    put(g, '#4a573a', 7, 0, 12, 1);
    put(g, '#9b2f25', 21, 0, 2, 1);
    put(g, night ? '#fff6dc' : '#e8b04a', 22, 1, 3, 1);
    put(g, '#18181a', 26, 3, 1, 7);
    put(g, '#18181a', 26, 2, 2, 1);
    put(g, '#18181a', 24, 5);
    if (night) { g.fillStyle = 'rgba(16,10,28,.28)'; g.globalCompositeOperation = 'source-atop'; g.fillRect(0, 0, 44, 22); g.globalCompositeOperation = 'source-over'; }
    put(g, '#f4eccd', 38, 8);
    if (night) put(g, '#ff4a3a', 2, 6, 1, 2);
    rigSprite = c;
    const [f, fg] = layer(44, 22);
    fg.translate(44, 0); fg.scale(-1, 1); fg.drawImage(c, 0, 0);
    rigSpriteFlip = f;
  }

  const rig = { active: false, d: 0, dir: 1, nextAt: 3, rot: 0 };
  let splashes = [];
  function updateRig(t, dt) {
    if (!showRig) return;
    if (!rig.active) {
      if (t < rig.nextAt) return;
      rig.active = true;
      rig.d = rig.dir > 0 ? rigStart : rigEnd;
      lookAt = t + 2.5;
    }
    rig.d += rig.dir * 9 * dt;
    rig.rot += 9 * dt / 4.5;
    if ((rig.dir > 0 && rig.d > rigEnd) || (rig.dir < 0 && rig.d < rigStart)) {
      rig.active = false;
      rig.dir *= -1;
      rig.nextAt = t + 6 + Math.random() * 10;
    }
    if (rig.active && Math.random() < 0.9) {
      for (const off of [-9.5, 9.5]) {
        const [x, y] = creekAt(rig.d + off * rig.dir);
        if (x > W) continue;
        splashes.push({ x: x + (Math.random() - 0.5) * 3, y: y - 1, vx: -rig.dir * (4 + Math.random() * 10), vy: -(6 + Math.random() * 12), life: 0.4 + Math.random() * 0.4 });
      }
    }
    splashes.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 50 * dt; s.life -= dt; });
    splashes = splashes.filter(s => s.life > 0);
  }

  function drawWheel(x, y, rot) {
    for (let yy = -5; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) {
      const d = Math.hypot(xx + 0.5 - (x % 1), yy + 0.5 - (y % 1));
      if (d > 4.6) continue;
      let color;
      if (d < 1) color = '#3a3b3f';
      else if (d < 2.4) color = (xx - yy > 0) ? '#b4b0a8' : '#7d8087';
      else if (d < 2.9) color = '#2b2c30';
      else {
        const ang = Math.atan2(yy, xx) + rot;
        color = (Math.floor(ang * 8 / Math.PI) & 1) ? '#232326' : (d > 3.9 ? '#141416' : '#1b1b1e');
      }
      if (night) color = css(mixRgb(hex(color), [16, 10, 28], 0.25));
      put(ctx, color, Math.floor(x) + xx, Math.floor(y) + yy);
    }
  }

  function drawRig(t) {
    if (!showRig || !rig.active) return;
    const s = rig.dir;
    const [cx0, cy0] = creekAt(rig.d);
    const rear = creekAt(rig.d - 9.5 * s), front = creekAt(rig.d + 9.5 * s);
    const bump = (d) => (noise(d * 0.35, 0, 80) - 0.5) * 2.2;
    const midY = cy0 - 4.5;
    const rearY = midY + Math.max(-2.5, Math.min(2.5, rear[1] - cy0 + bump(rig.d - 9.5 * s)));
    const frontY = midY + Math.max(-2.5, Math.min(2.5, front[1] - cy0 + bump(rig.d + 9.5 * s)));
    const sprite = s > 0 ? rigSprite : rigSpriteFlip;
    const left = Math.round(cx0 - 22);
    for (let col = 0; col < 44; col++) {
      const wx = s > 0 ? col : 43 - col;
      const f = clamp01((wx - 9) / 19);
      const yOff = rearY + (frontY - rearY) * f - 18 + Math.sin(t * 9) * 0.3;
      ctx.drawImage(sprite, col, 0, 1, 22, left + col, Math.round(yOff), 1, 22);
    }
    const rx = s > 0 ? left + 9 : left + 34, fx = s > 0 ? left + 28 : left + 15;
    drawWheel(rx, rearY, rig.rot * s);
    drawWheel(fx, frontY, rig.rot * s);
    for (const [wx, wy] of [[rx, rearY], [fx, frontY]]) {
      for (let xx = -6; xx <= 6; xx++) {
        if (hash(xx + Math.floor(t * 8), 3, 90) < 0.55) put(ctx, css(T.water[hash(xx, Math.floor(t * 8), 91) < 0.3 ? 3 : 1]), Math.floor(wx) + xx, Math.round(wy + 4));
      }
    }
    if (night) {
      const hx = s > 0 ? left + 39 : left + 4, hy = Math.round(frontY - 10);
      for (let d = 1; d < 30; d++) for (let k = -Math.floor(d / 5); k <= Math.floor(d / 5) + 1; k++) {
        if (dither(d, k + 8) < (1 - d / 30) * 0.5) put(ctx, 'rgba(255,236,190,.22)', hx + d * s, hy + k);
      }
    }
    splashes.forEach(sp => put(ctx, `rgba(${night ? '170,180,215' : '255,246,228'},${Math.min(1, sp.life * 2)})`, Math.round(sp.x), Math.round(sp.y)));
  }

  // ---------- the hill, the big tree and fallen leaves ----------
  const hillTop = x => {
    const wobble = (noise(x * 0.05, 7, 14) - 0.5) * 3;
    const left = fgX + 6, right = fgX + 100;
    if (x < left) return plateau - (left - x) * 0.09 + wobble;
    if (x <= right) return plateau + wobble * 0.5;
    return plateau + Math.pow(x - right, 1.45) * 0.35 + wobble;
  };
  const underCanopy = (x) => 1 - smooth(colL - 40, colL + 6, x);

  function buildHill() {
    const [c, g] = layer(W, H);
    const end = Math.min(W, colL + 60);
    for (let x = 0; x < end; x++) {
      const top = Math.round(hillTop(x));
      for (let y = Math.max(0, top); y < H; y++) {
        const depth = y - top;
        const stripe = noise(x * 0.25 + y * 0.6, y * 0.35, 15) - 0.5;
        let v = 0.42 + stripe * 0.35 - depth * 0.004;
        if (depth < 2) v += 0.25;
        const shade = underCanopy(x);
        const dap = noise(x * 0.09, y * 0.22, 16) > 0.6 ? 1 : 0;
        v -= shade * (dap ? 0.05 : 0.3);
        put(g, tone(T.hill, v), x, y);
      }
    }
    // Shadow pooled under the desk, chair and dog
    g.fillStyle = 'rgba(25,12,6,.32)';
    for (let y = -4; y <= 4; y++) {
      const half = Math.round(50 * Math.sqrt(1 - (y / 5) ** 2));
      g.fillRect(fgX + OX + 10 - half, fgY + OY + 2 + y, half * 2, 1);
    }
    // Fallen leaves, thicker near the trunk
    const rand = seeded(19);
    for (let i = 0; i < end * 3; i++) {
      const x = rand() * end, y = hillTop(x) + rand() * (H - hillTop(x));
      if (rand() > 0.45 + underCanopy(x) * 0.5) continue;
      drawLeaf(g, x, y, Math.floor(rand() * 4), T.leaves[Math.floor(rand() * T.leaves.length)]);
    }
    grade(c, 0.7);
    return c;
  }
  function drawLeaf(g, x, y, shape, color) {
    x = Math.round(x); y = Math.round(y);
    put(g, color, x, y);
    if (shape === 1) put(g, color, x + 1, y);
    else if (shape === 2) put(g, color, x, y + 1);
    else if (shape === 3) { put(g, color, x + 1, y); put(g, color, x, y - 1); }
  }

  function trunkPath() {
    const base = hillTop(tx) + 4;
    return {
      base,
      a: [tx, base], b: [tx + 4, H * 0.56], c: [tx + 11, H * 0.3],
      branches: [
        [[tx + 11, H * 0.3], [tx + span * 0.45, H * 0.2], [tx + span, H * 0.3], 5, 1.4],
        [[tx + 10, H * 0.32], [tx + 18, H * 0.12], [tx + 26, -12], 5, 2.4],
        [[tx + 6, H * 0.46], [tx + span * 0.35, H * 0.38], [tx + span * 0.62, H * 0.42], 3.6, 1.1],
        [[tx + 5, H * 0.38], [tx - 14, H * 0.24], [tx - 32, H * 0.16], 3.4, 1.2]
      ]
    };
  }
  const along = (pts, t) => {
    const seg = t < 0.5 ? 0 : 1, f = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    return [pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * f, pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * f];
  };

  function buildTree() {
    const [c, g] = layer(W, H);
    const path = trunkPath();
    const bark = (ox, oy, x, y) => tone(T.bark, 0.4 + ox * 0.45 + (noise(x * 0.8, y * 0.1, 4) - 0.5) * 0.5 - (y > H * 0.6 ? 0.08 : 0));
    limb(g, path.a[0], path.a[1], path.a[0] - 16, path.a[1] + 4, 5, 1.2, bark);
    limb(g, path.a[0], path.a[1], path.a[0] + 13, path.a[1] + 4, 5, 1.2, bark);
    limb(g, path.a[0], path.a[1], path.b[0], path.b[1], 11, 8.5, bark);
    limb(g, path.b[0], path.b[1], path.c[0], path.c[1], 8.5, 6.5, bark);
    for (const [p0, p1, p2, r0, r1] of path.branches) {
      limb(g, p0[0], p0[1], p1[0], p1[1], r0, (r0 + r1) / 2, bark);
      limb(g, p1[0], p1[1], p2[0], p2[1], (r0 + r1) / 2, r1, bark);
    }
    grade(c, 0.5);
    return c;
  }

  function buildCrowns() {
    const [a, ga] = layer(W, H), [b, gb] = layer(W, H);
    const path = trunkPath(), rand = seeded(23);
    const clusters = [];
    path.branches.forEach(([p0, p1, p2], bi) => {
      const count = bi === 0 ? 46 : bi === 1 ? 28 : 22;
      for (let i = 0; i < count; i++) {
        const [x, y] = along([p0, p1, p2], 0.2 + rand() * 0.8);
        clusters.push([x + (rand() - 0.5) * 30, y + (rand() - 0.5) * 22 - 5, 5 + rand() * 7, rand()]);
      }
    });
    for (let x = tx - 36; x < tx + span; x += 6 + rand() * 6) clusters.push([x, rand() * H * 0.12, 8 + rand() * 7, rand() * 0.6]);
    clusters.sort((p, q) => p[3] - q[3]);
    leafSpawns = clusters.filter(([, y]) => y > H * 0.12).map(([x, y]) => [x, y]);
    const limit = colL - 4;
    clusters.forEach(([cx, cy, r, depth], i) => {
      ellipse(i % 2 ? gb : ga, cx, cy, r + 2, r + 2, (nx, ny, x, y, nz) => {
        if (x > limit - hash(x, y, 43) * 10) return null;
        const edge = Math.hypot(nx, ny) * (r + 2) / r;
        const clump = noise(x * 0.35, y * 0.35, 40);
        if (edge > 0.78 + clump * 0.4) return null;
        if (edge < 0.7 && hash(x, y, 41) < 0.012) return null;
        // Colour drifts across the crown in patches of red, orange and gold.
        const hue = noise(x * 0.025, y * 0.03, 50) * 2.4 + (hash(x >> 2, y >> 2, 51) - 0.5) * 0.5;
        const rmp = T.canopy[Math.max(0, Math.min(2, Math.floor(hue)))];
        const leaf = hash(x, y, 42) - 0.5, speck = hash(x >> 1, y >> 1, 44) - 0.5;
        let v = lit2d(nx, ny, nz) * 0.55 + depth * 0.25 - 0.06 + leaf * 0.16 + speck * 0.22 + (clump - 0.5) * 0.2;
        v -= clamp01((y - H * 0.18) / (H * 0.3)) * 0.18;
        if (nx > 0.5 && edge > 0.6) v += 0.18;
        return tone(rmp, v);
      });
    });
    grade(a, 0.8); grade(b, 0.8);
    crownA = a; crownB = b;
  }

  // Leaves drifting down from the canopy and settling on the hill.
  let falling = [], settled = [];
  function updateLeaves(t, dt) {
    if (!showDesk || !leafSpawns.length) return;
    if (Math.random() < dt * 1.4) {
      const [x, y] = leafSpawns[Math.floor(Math.random() * leafSpawns.length)];
      falling.push({ x, y, vy: 5 + Math.random() * 5, phase: Math.random() * 6, color: T.leaves[Math.floor(Math.random() * T.leaves.length)] });
    }
    falling.forEach(l => { l.y += l.vy * dt; l.x += (Math.sin(t * 1.6 + l.phase) * 7 + 3) * dt; });
    falling = falling.filter(l => {
      if (l.x < 0 || l.x > W) return false;
      if (l.x < colL + 50 && l.y >= hillTop(l.x) + 1) {
        settled.push({ x: Math.round(l.x), y: Math.round(l.y + Math.random() * 3), color: l.color, shape: Math.floor(Math.random() * 4) });
        if (settled.length > 90) settled.shift();
        return false;
      }
      return l.y < H;
    });
  }

  // ---------- grass, clouds, stars ----------
  function buildBlades() {
    const rand = seeded(17);
    blades = [];
    if (showDesk) {
      const end = colL + 40;
      for (let i = 0; i < end * 2.2; i++) {
        const x = rand() * end, depth = Math.floor(rand() * 3), top = hillTop(x);
        if (top > H) continue;
        const behindDesk = x > fgX + 14 && x < fgX + 96 && rand() < 0.8;
        if (behindDesk) continue;
        blades.push({
          x, base: Math.round(top) + depth, h: 2 + noise(x * 0.1, 0, 9) * 4 + rand() * 3,
          lean: (rand() - 0.5) * 3, tint: rand() * 0.18 - depth * 0.05 - underCanopy(x) * 0.18,
          flower: rand() < 0.03 ? (rand() < 0.5 ? '#f2c14e' : '#e0782a') : null
        });
      }
      for (let i = 0; i < end * 1.2; i++) {
        const x = rand() * end, depth = Math.floor(rand() * 4);
        if (x > fgX + 26 && x < fgX + 82 && rand() < 0.75) continue;
        blades.push({ x, base: H - 4 + depth, h: 4 + rand() * 7, lean: (rand() - 0.5) * 3, tint: rand() * 0.15 - 0.1 - underCanopy(x) * 0.15, flower: null });
      }
    }
    if (W - colR > 60) {
      for (let i = 0; i < 90; i++) {
        const x0 = W - Math.min(70, (W - colR) * 0.5), x = x0 + rand() * (W - x0 + 4), depth = Math.floor(rand() * 4);
        blades.push({ x, base: H - 4 + depth, h: (3 + rand() * 7) * clamp01((x - x0) / 30), lean: (rand() - 0.5) * 3, tint: rand() * 0.18 - depth * 0.05, flower: rand() < 0.04 ? '#f2c14e' : null });
      }
    }
    blades.sort((a, b) => a.base - b.base);
  }
  function buildClouds() {
    const rand = seeded(21);
    clouds = Array.from({ length: Math.max(3, Math.round(W / 160)) }, () => {
      const w = 40 + Math.floor(rand() * 34), h = 18;
      const [c, g] = layer(w, h);
      const puffs = Array.from({ length: 7 }, (_, i) => {
        const f = (i + 0.5) / 7, r = (4 + rand() * 3.5) * (1 - Math.abs(f - 0.5) * 0.9);
        return [w * (0.08 + f * 0.84), h - 3 - r * 0.8 - rand() * 2, r + 1.5];
      });
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let best = null;
        for (const [px, py, r] of puffs) {
          const dx = (x + 0.5 - px) / r, dy = (y + 0.5 - py) / r;
          if (dx * dx + dy * dy <= 1 && y < h - 2) best = [dx, dy];
        }
        if (!best) continue;
        const v = 0.5 + best[0] * 0.35 - best[1] * 0.45 - (y > h - 5 ? 0.3 : 0) + (dither(x, y) - 0.5) * 0.2;
        put(g, v > 0.72 ? T.cloudLight : v > 0.36 ? T.cloud : T.cloudShade, x, y);
      }
      return { c, w, x: rand() * (W + 80) - 40, y: Math.round(H * (0.03 + rand() * 0.22)), speed: 0.5 + rand() * 0.8 };
    });
  }
  function buildStars() {
    const rand = seeded(3);
    stars = Array.from({ length: Math.round(W * H / 900) }, () => ({
      x: Math.floor(rand() * W), y: Math.floor(rand() * (hY - mh)), phase: rand() * 7, speed: 0.6 + rand() * 1.6
    }));
  }

  // ---------- build ----------
  function buildAll() {
    T = THEMES[root.dataset.theme === 'light' ? 'light' : 'dark'];
    night = T.night;
    skyLayer = buildSky();
    mountainLayer = buildMountains();
    valleyLayer = buildValley();
    groveLayer = buildGrove();
    buildRig();
    if (showDesk) {
      hillLayer = buildHill();
      trunkLayer = buildTree();
      buildCrowns();
      renderStaticForeground();
    }
    buildBlades();
    buildClouds();
    buildStars();
    settled = [];
  }

  // ---------- per-frame ----------
  let lookAt = 20, lookUntil = 0;
  function updateGuy(t) {
    if (t > lookAt && t > lookUntil) { lookUntil = t + 4.5; lookAt = t + 22 + Math.random() * 14; }
    const looking = t < lookUntil;
    headYaw += ((looking ? 0.95 : 0) - headYaw) * 0.25;
    headNod = !looking && (t % 12) < 5 ? (Math.sin(t * 10.7) > 0 ? 1 : 0) : 0;
    const typing = !looking && t - lastKey < 0.3, beat = Math.floor(t * 12) % 2;
    typingLift = [typing && beat === 0 ? 0.9 : 0, typing && beat === 1 ? 0.9 : 0];
    tailWag = Math.sin(t * (looking ? 12 : 5)) * (looking ? 1 : 0.5);
    return looking;
  }

  function drawRays(t) {
    const target = showDesk ? [fgX + 40, H - 20] : [W * 0.2, H];
    const base = Math.atan2(target[1] - sunY, target[0] - sunX), len = Math.hypot(W, H) * 1.1;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const ang = base + (i - 3) * 0.075 + Math.sin(t * 0.07 + i) * 0.01, width = 0.012 + (i % 3) * 0.008;
      const alpha = T.rayAlpha * (0.6 + 0.4 * Math.sin(t * 0.25 + i * 1.7));
      const grad = ctx.createLinearGradient(sunX, sunY, sunX + Math.cos(ang) * len, sunY + Math.sin(ang) * len);
      grad.addColorStop(0, `rgba(${T.ray},${alpha})`); grad.addColorStop(0.7, `rgba(${T.ray},${alpha * 0.4})`); grad.addColorStop(1, `rgba(${T.ray},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(sunX + Math.cos(ang - width) * len, sunY + Math.sin(ang - width) * len);
      ctx.lineTo(sunX + Math.cos(ang + width) * len, sunY + Math.sin(ang + width) * len);
      ctx.fill();
    }
    const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 46);
    glow.addColorStop(0, `rgba(${T.ray},${night ? 0.18 : 0.35})`); glow.addColorStop(1, `rgba(${T.ray},0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - 46, sunY - 46, 92, 92);
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawBlades(t) {
    const gust = Math.sin(t * 0.45) * 0.7;
    for (const b of blades) {
      const steps = Math.round(b.h);
      if (steps < 1) continue;
      const sway = Math.sin(t * 1.3 + b.x * 0.07) * 1.1 + gust;
      for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        put(ctx, tone(T.hill, 0.2 + f * 0.7 + b.tint), Math.round(b.x + b.lean * f + sway * f * f), b.base - i);
      }
      if (b.flower) put(ctx, b.flower, Math.round(b.x + b.lean + sway), b.base - steps - 1);
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    if (night) stars.forEach(s => {
      const v = Math.sin(t * s.speed + s.phase);
      if (v > -0.3) put(ctx, v > 0.6 ? '#f0e4cc' : '#76686e', s.x, s.y);
    });
    ctx.drawImage(skyLayer, 0, 0);
    clouds.forEach(cl => ctx.drawImage(cl.c, Math.round(cl.x), cl.y));
    ctx.drawImage(mountainLayer, 0, 0);
    ctx.drawImage(valleyLayer, 0, 0);
    for (let i = 0; i < waterPixels.length; i += 7) {
      if (hash(i, Math.floor(t * 3), 95) < 0.08) put(ctx, css(T.water[3]), waterPixels[i][0], waterPixels[i][1]);
    }
    drawRig(t);
    ctx.drawImage(groveLayer, 0, 0);
    drawRays(t);
    // Soft veil behind the content column keeps the text readable.
    const veil = ctx.createLinearGradient(colL - 14, 0, colR + 14, 0), bg = night ? '22,21,20' : '255,255,255';
    const edge = 14 / (colR - colL + 28);
    veil.addColorStop(0, `rgba(${bg},0)`); veil.addColorStop(edge, `rgba(${bg},.72)`);
    veil.addColorStop(1 - edge, `rgba(${bg},.72)`); veil.addColorStop(1, `rgba(${bg},0)`);
    ctx.fillStyle = veil;
    ctx.fillRect(colL - 14, 0, colR - colL + 28, H);
    if (showDesk) {
      ctx.drawImage(hillLayer, 0, 0);
      settled.forEach(l => drawLeaf(ctx, l.x, l.y, l.shape, l.color));
      drawBlades(t);
      ctx.drawImage(trunkLayer, 0, 0);
      renderForeground(t);
      ctx.drawImage(fgCanvas, fgX, fgY);
      const [mx, my] = project(26, 46.5, -20);
      for (let i = 0; i < 4; i++) {
        const p = (t * 0.6 + i / 4) % 1;
        ctx.fillStyle = `rgba(240,232,222,${(1 - p) * (night ? 0.3 : 0.5)})`;
        ctx.fillRect(Math.round(fgX + mx + Math.sin(p * 7 + i * 2) * 1.2), Math.round(fgY + my - 1 - p * 9), 1, 1);
      }
      if (night) {
        const [bx, by] = project(BULB[0], BULB[1], BULB[2]);
        ellipse(ctx, fgX + bx, fgY + by, 4, 4, (nx, ny) => `rgba(255,220,150,${(1 - Math.hypot(nx, ny)) * 0.3})`);
      }
    }
    if (!showDesk) drawBlades(t);
    if (showDesk) {
      ctx.drawImage(crownA, Math.round(Math.sin(t * 0.7) * 0.7), 0);
      ctx.drawImage(crownB, Math.round(Math.sin(t * 0.9 + 1.3) * 0.8), 0);
      falling.forEach(l => drawLeaf(ctx, l.x, l.y, Math.floor(t * 4 + l.phase) % 3, l.color));
    }
  }

  // ---------- bird ----------
  let bird = null, nextBird = 4 + Math.random() * 8, skyW = 0, skyH = 0, skyDirty = false;
  // Fills a polygon pixel by pixel so its edges stay crisp.
  function fillPoly(g, pts, color) {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      for (let x = Math.floor(Math.min(...xs)); x <= Math.ceil(Math.max(...xs)); x++) {
        const px = x + 0.5, py = y + 0.5;
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) put(g, color, x, y);
      }
    }
  }

  // Wing pose through one beat: a quick, fully spread downstroke, then a slower upstroke with the
  // wrist folded and the hand swept back. Angles are elevations in radians (positive is up).
  function wingPose(b) {
    if (b.mode === 'glide') return { arm: 0.2, hand: 0.08, fold: 0.95, sweep: 0.9, bob: 0 };
    const { top, bottom, split } = b.beat;
    const down = b.phase < split, u = down ? b.phase / split : (b.phase - split) / (1 - split);
    const ease = 0.5 - 0.5 * Math.cos(Math.PI * u), arc = Math.sin(Math.PI * u), depth = (top - bottom) / 1.9;
    const arm = down ? top - (top - bottom) * ease : bottom + (top - bottom) * ease;
    return down
      ? { arm, hand: arm + 0.35 * arc, fold: 1, sweep: 0.3, bob: -0.9 * arc * depth }
      : { arm, hand: arm - 0.5 * arc, fold: 1 - 0.5 * arc * depth, sweep: 0.3 + 1.1 * arc, bob: 0.5 * arc * depth };
  }

  function drawBird(g, b) {
    const s = b.dir, pose = wingPose(b);
    const pitch = Math.max(-0.35, Math.min(0.35, Math.atan2(b.vy, b.speed)));
    const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
    // Local space: x toward the head, y down, z toward the viewer. Seen slightly from below and the side.
    const P = (lx, ly, lz) => {
      const rx = lx * cosP - ly * sinP, ry = lx * sinP + ly * cosP;
      return [b.x + (rx + lz * 0.1) * s, b.y + pose.bob + ry + lz * 0.27];
    };
    const wing = (side, base) => {
      const sh = [0.8, -0.8, side * 0.9];
      const elbow = [sh[0] - 0.9, sh[1] - Math.sin(pose.arm) * 6, sh[2] + side * Math.cos(pose.arm) * 6];
      const handLen = 8 * pose.fold;
      const tip = [elbow[0] - pose.sweep * 8, elbow[1] - Math.sin(pose.hand) * handLen, elbow[2] + side * Math.cos(pose.hand) * handLen];
      const outline = [sh, elbow, tip, [elbow[0] - 3 - pose.sweep * 1.5, elbow[1] + 0.3, elbow[2]], [sh[0] - 4, sh[1] + 0.4, sh[2]]].map(p => P(...p));
      fillPoly(g, outline, tone(R.bird, base));
      const [a, e, t] = outline;
      limb(g, a[0], a[1], e[0], e[1], 0.9, 0.7, () => tone(R.bird, base + 0.22));
      limb(g, e[0], e[1], t[0], t[1], 0.7, 0.3, () => tone(R.bird, base + 0.12));
      const tail = outline[3];
      put(g, tone(R.bird, base - 0.15), Math.floor((tail[0] + t[0]) / 2), Math.floor((tail[1] + t[1]) / 2));
    };
    const line = (a, c, r0, r1, paint) => { const [x0, y0] = P(...a), [x1, y1] = P(...c); limb(g, x0, y0, x1, y1, r0, r1, paint); };

    wing(-1, 0.12);
    const spread = b.mode === 'glide' ? 1.2 : 0.6;
    line([-4, -0.2, 0], [-14, -1.6 - spread, -1], 1.1, 0.25, () => css(R.bird[1]));
    line([-4, 0.3, 0], [-13.5, 1.2 + spread, 1], 1, 0.25, () => css(R.bird[0]));
    line([-5, 0, 0], [3, 0, 0], 1.4, 2.3, (ox, oy) => oy > 0.25 ? (oy > 0.7 ? '#cfc8ba' : '#ece6da') : tone(R.bird, 0.5 - oy * 0.4));
    const [hx, hy] = P(4.8, -0.8, 0);
    ellipse(g, hx, hy, 2.1, 2, (nx, ny) => ny > 0.3 && nx * s > -0.2 ? '#a24e2a' : tone(R.bird, 0.45 - ny * 0.35));
    const eye = P(5.5, -1.2, 0), beak = P(7.2, -0.6, 0);
    put(g, '#0b0d12', Math.floor(eye[0]), Math.floor(eye[1]));
    put(g, '#2a2620', Math.floor(beak[0]), Math.floor(beak[1]));
    wing(1, 0.5);
  }

  // Every beat is a little different: depth, tempo and the down/up timing all vary, with the odd
  // quick shallow flutter mixed in.
  const newBeat = (b) => {
    const flutter = Math.random() < 0.18;
    b.beat = flutter
      ? { top: 0.45 + Math.random() * 0.2, bottom: -0.35 - Math.random() * 0.2, split: 0.5, freq: 7 + Math.random() * 1.5 }
      : { top: 0.85 + Math.random() * 0.3, bottom: -0.65 - Math.random() * 0.35, split: 0.5 + Math.random() * 0.1, freq: (4.3 + Math.random() * 1.6) * b.tempo };
  };
  function updateBird(t, dt) {
    if (!bird) {
      if (t < nextBird) return;
      const dir = Math.random() < 0.65 ? 1 : -1;
      const baseY = skyH * (0.12 + Math.random() * 0.3);
      bird = { dir, x: dir > 0 ? -16 : skyW + 16, y: baseY, baseY, vy: 0, speed: 44 + Math.random() * 12, phase: Math.random(), mode: 'flap', beats: 2 + Math.floor(Math.random() * 5), glideUntil: 0, tempo: 0.9 + Math.random() * 0.2 };
      newBeat(bird);
    }
    const b = bird;
    if (b.mode === 'flap') {
      // Each beat pushes the bird up and forward; a burst of beats ends in a glide.
      b.phase += dt * b.beat.freq;
      if (b.phase >= 1) {
        b.phase -= 1;
        newBeat(b);
        if (--b.beats <= 0 && b.y < b.baseY + 12) { b.mode = 'glide'; b.glideUntil = t + 0.35 + Math.random() * 1.8; }
      }
      const lift = (b.beat.top - b.beat.bottom) / 1.9;
      b.vy += ((b.phase < b.beat.split ? -14 * lift : 4) - b.vy) * Math.min(1, dt * 6);
      b.speed = Math.min(62, b.speed + dt * 6 * lift);
    } else {
      b.vy += (7 - b.vy) * Math.min(1, dt * 2);
      b.speed = Math.max(40, b.speed - dt * 4);
      if (t > b.glideUntil || b.y > b.baseY + 18) {
        b.mode = 'flap'; b.phase = Math.random() * 0.3; b.beats = 2 + Math.floor(Math.random() * 5);
        newBeat(b);
      }
    }
    b.x += b.dir * b.speed * dt;
    b.y += b.vy * dt;
    if (b.x < -24 || b.x > skyW + 24) { bird = null; nextBird = t + 18 + Math.random() * 20; }
  }

  // ---------- loop & sizing ----------
  const startTime = performance.now();
  let running = false, lastFrame = 0, lastScene = 0, lastSceneT = 0;
  const now = () => (performance.now() - startTime) / 1000;

  function step(t) {
    const dt = Math.min(0.25, t - lastSceneT);
    lastSceneT = t;
    const looking = updateGuy(t);
    stepCode(t, looking);
    updateRig(t, dt);
    updateLeaves(t, dt);
    clouds.forEach(cl => { cl.x += cl.speed * dt; if (cl.x > W + 2) cl.x = -cl.w - 2; });
    draw(t);
  }

  function loop(ms) {
    if (!running || reducedMotion.matches) { running = false; return; }
    requestAnimationFrame(loop);
    const t = (ms - startTime) / 1000, dt = Math.min(0.1, Math.max(0, ms - lastFrame) / 1000);
    lastFrame = ms;
    updateBird(t, dt);
    if (bird || skyDirty) {
      skyCtx.clearRect(0, 0, skyW, skyH);
      if (bird) drawBird(skyCtx, bird);
      skyDirty = !!bird;
    }
    if (ms - lastScene >= 1000 / 12) { lastScene = ms; step(t); }
  }

  function resize() {
    scale = Math.max(2, Math.min(4, Math.round(innerHeight / 310)));
    W = Math.ceil(innerWidth / scale); H = Math.ceil(innerHeight / scale);
    world.width = W; world.height = H;
    world.style.width = `${W * scale}px`; world.style.height = `${H * scale}px`;
    const rect = frame.getBoundingClientRect();
    colL = Math.floor(rect.left / scale); colR = Math.ceil(rect.right / scale);
    hY = Math.round(H * 0.6); mh = Math.round(H * 0.2);
    const room = W - colR;
    vx = room >= 70 ? colR + Math.round(Math.max(14, room * 0.3)) : Math.round(W * 0.82);
    sunX = Math.round(room >= 70 ? Math.min(W - 20, colR + Math.max(36, room * 0.6)) : W * 0.86);
    sunY = Math.round(hY - mh - 22);
    showDesk = colL >= 112;
    showRig = room >= 80;
    fgX = colL - 30 - 94; fgY = H - FH - 2;
    plateau = fgY + OY - 26;
    tx = Math.max(4, fgX - 4);
    span = colL - 10 - tx;
    buildAll();
    lastSceneT = now();
    step(now());

    skyW = Math.ceil(innerWidth / scale); skyH = Math.ceil(innerHeight / scale);
    sky.width = skyW; sky.height = skyH;
    sky.style.width = `${skyW * scale}px`; sky.style.height = `${skyH * scale}px`;
    sky.hidden = reducedMotion.matches;
    skyDirty = true;
    if (!reducedMotion.matches && !running) {
      running = true;
      lastFrame = performance.now();
      requestAnimationFrame(loop);
    }
  }

  // Browsers may drop off-screen canvas contents while a tab is hidden; rebuild if that happened.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || !mountainLayer || !layerProbe) return;
    const alpha = mountainLayer.getContext('2d').getImageData(layerProbe[0], layerProbe[1], 1, 1).data[3];
    if (!alpha) { buildAll(); step(now()); }
  });
  world.addEventListener('contextrestored', () => { buildAll(); step(now()); });

  new MutationObserver(() => { buildAll(); step(now()); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 80); });
  reducedMotion.addEventListener?.('change', resize);
  world.hidden = false;
  resize();
})();
