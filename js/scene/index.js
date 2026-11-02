import { view, theme, setTheme } from './state.js';
import { drawSunRays } from './lighting.js';
import {
  buildClouds, buildGroveLayer, buildMountainLayer, buildStars, buildSunLayer, buildValleyLayer, drawStars, drawWaterSparkles, mountainProbe
} from './valley.js';
import { buildRigSprites, drawRig, updateRig } from './rig.js';
import {
  buildCanopyLayers, buildGrass, buildHillLayer, buildTrunkLayer, drawFallingLeaves, drawGrass, drawSettledLeaves, resetLeaves, updateLeaves
} from './hillside.js';
import { DESK_HEIGHT, DESK_ORIGIN_Y } from './raytrace.js';
import { buildDesk, drawDesk, lookOutSoon, updateDesk } from './desk.js';
import { drawBird, isBirdFlying, updateBird } from './bird.js';

const SCENE_FPS = 12;
const DESK_RIGHT_EDGE = 94;

// Renders the pixel-art world on `world` (behind the page) and the bird on `sky`. `column` is the
// content column; the scenery is laid out around it.
export function startScene({ world, sky, column }) {
  if (!world?.getContext || !sky?.getContext || !column) return;

  const ctx = world.getContext('2d');
  const skyContext = sky.getContext('2d');
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const layers = {};
  let clouds = [], stars = [];

  function layout() {
    const scale = Math.max(2, Math.min(4, Math.round(innerHeight / 310)));
    const width = Math.ceil(innerWidth / scale), height = Math.ceil(innerHeight / scale);
    const bounds = column.getBoundingClientRect();
    const columnLeft = Math.floor(bounds.left / scale), columnRight = Math.ceil(bounds.right / scale);
    const horizon = Math.round(height * 0.6), peakHeight = Math.round(height * 0.2);
    const room = width - columnRight;
    const deskX = columnLeft - 30 - DESK_RIGHT_EDGE, deskY = height - DESK_HEIGHT - 2;
    const treeX = Math.max(4, deskX - 4);

    Object.assign(view, {
      scale, width, height, columnLeft, columnRight, horizon, peakHeight,
      valleyX: room >= 70 ? columnRight + Math.round(Math.max(14, room * 0.3)) : Math.round(width * 0.82),
      sunX: Math.round(room >= 70 ? Math.min(width - 20, columnRight + Math.max(36, room * 0.6)) : width * 0.86),
      sunY: Math.round(horizon - peakHeight - 22),
      showDesk: columnLeft >= 112,
      showRig: room >= 80,
      deskX, deskY,
      plateau: deskY + DESK_ORIGIN_Y - 26,
      treeX,
      treeSpan: columnLeft - 10 - treeX
    });

    for (const canvas of [world, sky]) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width * scale}px`;
      canvas.style.height = `${height * scale}px`;
    }
  }

  function build() {
    setTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
    layers.sun = buildSunLayer();
    layers.mountains = buildMountainLayer();
    layers.valley = buildValleyLayer();
    layers.grove = buildGroveLayer();
    buildRigSprites();
    if (view.showDesk) {
      layers.hill = buildHillLayer();
      layers.trunk = buildTrunkLayer();
      [layers.canopyFront, layers.canopyBack] = buildCanopyLayers();
      buildDesk();
    }
    buildGrass();
    clouds = buildClouds();
    stars = buildStars();
    resetLeaves();
  }

  // Fades the scenery behind the content column so the text stays readable.
  function drawColumnVeil() {
    const { columnLeft, columnRight, height } = view;
    const color = theme.colors.pageBackground, feather = 14;
    const gradient = ctx.createLinearGradient(columnLeft - feather, 0, columnRight + feather, 0);
    const edge = feather / (columnRight - columnLeft + feather * 2);
    gradient.addColorStop(0, `rgba(${color},0)`);
    gradient.addColorStop(edge, `rgba(${color},.72)`);
    gradient.addColorStop(1 - edge, `rgba(${color},.72)`);
    gradient.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(columnLeft - feather, 0, columnRight - columnLeft + feather * 2, height);
  }

  function draw(t) {
    const { width, height, showDesk, deskX } = view;
    ctx.clearRect(0, 0, width, height);

    if (theme.night) drawStars(ctx, stars, t);
    ctx.drawImage(layers.sun, 0, 0);
    for (const cloud of clouds) ctx.drawImage(cloud.canvas, Math.round(cloud.x), cloud.y);
    ctx.drawImage(layers.mountains, 0, 0);
    ctx.drawImage(layers.valley, 0, 0);
    drawWaterSparkles(ctx, t);
    drawRig(ctx, t);
    ctx.drawImage(layers.grove, 0, 0);
    drawSunRays(ctx, t, showDesk ? [deskX + 40, height - 20] : [width * 0.2, height]);
    drawColumnVeil();

    if (showDesk) {
      ctx.drawImage(layers.hill, 0, 0);
      drawSettledLeaves(ctx);
      drawGrass(ctx, t);
      ctx.drawImage(layers.trunk, 0, 0);
      drawDesk(ctx, t);
      ctx.drawImage(layers.canopyFront, Math.round(Math.sin(t * 0.7) * 0.7), 0);
      ctx.drawImage(layers.canopyBack, Math.round(Math.sin(t * 0.9 + 1.3) * 0.8), 0);
      drawFallingLeaves(ctx, t);
    } else {
      drawGrass(ctx, t);
    }
  }

  const startTime = performance.now();
  const elapsed = () => (performance.now() - startTime) / 1000;
  let lastStep = 0;

  function step(t) {
    const dt = Math.min(0.25, t - lastStep);
    lastStep = t;
    if (view.showDesk) updateDesk(t);
    updateRig(t, dt, lookOutSoon);
    updateLeaves(t, dt);
    for (const cloud of clouds) {
      cloud.x += cloud.speed * dt;
      if (cloud.x > view.width + 2) cloud.x = -cloud.width - 2;
    }
    draw(t);
  }

  let running = false, lastFrame = 0, lastSceneFrame = 0, skyDirty = false;

  // The bird animates every frame; the rest of the scene steps at a lower, pixel-art frame rate.
  function loop(ms) {
    if (!running || reducedMotion.matches) {
      running = false;
      return;
    }
    requestAnimationFrame(loop);
    const t = (ms - startTime) / 1000, dt = Math.min(0.1, Math.max(0, ms - lastFrame) / 1000);
    lastFrame = ms;

    updateBird(t, dt, view.width, view.height);
    if (isBirdFlying() || skyDirty) {
      skyContext.clearRect(0, 0, view.width, view.height);
      drawBird(skyContext);
      skyDirty = isBirdFlying();
    }
    if (ms - lastSceneFrame >= 1000 / SCENE_FPS) {
      lastSceneFrame = ms;
      step(t);
    }
  }

  function rebuild() {
    build();
    lastStep = elapsed();
    step(elapsed());
  }

  function resize() {
    layout();
    rebuild();
    sky.hidden = reducedMotion.matches;
    skyDirty = true;
    if (!reducedMotion.matches && !running) {
      running = true;
      lastFrame = performance.now();
      requestAnimationFrame(loop);
    }
  }

  // Browsers can discard off-screen canvases while a tab is hidden; rebuild if that happened.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || !layers.mountains) return;
    const [x, y] = mountainProbe();
    if (!layers.mountains.getContext('2d').getImageData(x, y, 1, 1).data[3]) rebuild();
  });
  world.addEventListener('contextrestored', rebuild);
  new MutationObserver(rebuild).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 80);
  });
  reducedMotion.addEventListener('change', resize);

  world.hidden = false;
  resize();
}
