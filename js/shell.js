import { initThemeToggle } from './theme.js';
import { startScene } from './scene/index.js';

// Behaviour shared by every page: the theme toggle and the pixel-art background.
export function initShell() {
  initThemeToggle(document.querySelector('#theme-toggle'));
  startScene({
    world: document.querySelector('#scene-world'),
    sky: document.querySelector('#scene-sky'),
    column: document.querySelector('.page')
  });
}
