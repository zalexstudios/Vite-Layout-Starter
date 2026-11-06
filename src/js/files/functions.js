// Общие функции. Добавляйте сюда свои хелперы и импортируйте в app.js / script.js

const root = document.documentElement;

/** Мобильное устройство по userAgent */
export const isMobile = () => /Android|iPhone|iPad|iPod|IEMobile/i.test(navigator.userAgent);

/** Класс "touch" / "no-touch" на <html> — удобно для hover-стилей */
export function addTouchClass() {
  root.classList.add(isMobile() || 'ontouchstart' in window ? 'touch' : 'no-touch');
}

/** Класс "loaded" после полной загрузки страницы */
export function addLoadedClass() {
  window.addEventListener('load', () => setTimeout(() => root.classList.add('loaded'), 0));
}

/** Блокировка/разблокировка прокрутки страницы */
export const bodyLock = (state) => root.classList.toggle('lock', state);

/** Бургер-меню: кнопка [data-menu-btn], закрытие по Esc и по клику на ссылку */
export function menuInit() {
  const btn = document.querySelector('[data-menu-btn]');
  if (!btn) return;

  const toggle = (force) => {
    const open = root.classList.toggle('menu-open', force);
    btn.setAttribute('aria-expanded', String(open));
    bodyLock(open);
  };

  btn.addEventListener('click', () => toggle());
  document.addEventListener('keydown', (e) => e.key === 'Escape' && toggle(false));
  document.querySelector('#menu')?.addEventListener('click', (e) => {
    if (e.target.closest('a')) toggle(false);
  });
}
