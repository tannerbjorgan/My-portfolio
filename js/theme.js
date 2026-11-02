const STORAGE_KEY = 'portfolio-theme';

const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function apply(theme) {
  root.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (e.g. private browsing); the toggle still works for this visit.
  }
}

export function initThemeToggle(button) {
  let switching = false;

  button.addEventListener('click', () => {
    if (switching) return;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';

    if (!document.startViewTransition || reducedMotion.matches) {
      apply(next);
      return;
    }

    switching = true;
    root.classList.add('theme-switching');
    const done = () => {
      switching = false;
      root.classList.remove('theme-switching');
    };
    document.startViewTransition(() => apply(next)).finished.then(done, done);
  });
}
