import { PALETTES } from './palette.js';

// Layout of the scene in art pixels, recomputed on every resize.
export const view = {
  scale: 3,
  width: 0,
  height: 0,
  columnLeft: 0,
  columnRight: 0,
  horizon: 0,
  peakHeight: 0,
  valleyX: 0,
  sunX: 0,
  sunY: 0,
  showDesk: false,
  showRig: false,
  deskX: 0,
  deskY: 0,
  plateau: 0,
  treeX: 0,
  treeSpan: 0
};

export const theme = { colors: PALETTES.dark, night: true };

export function setTheme(name) {
  theme.colors = PALETTES[name] ?? PALETTES.dark;
  theme.night = theme.colors.night;
}
