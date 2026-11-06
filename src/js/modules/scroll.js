// Скролл: плавный переход к блоку, кнопка «Наверх», состояние шапки при прокрутке.
//
// <a href="#about" data-goto>                       — к блоку #about (с учётом высоты шапки .header)
// <button data-goto="#contacts" data-goto-offset="20">   — дополнительный отступ в px
// <button data-to-top>                              — получает is-visible после 400px прокрутки
// .header                                           — получает is-scrolled после 10px прокрутки

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const behavior = () => (reduceMotion() ? 'auto' : 'smooth');

export function scrollInit() {
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-goto]');
    if (!trigger) return;

    const selector = trigger.dataset.goto || trigger.getAttribute('href');
    let target = null;
    try {
      target = selector ? document.querySelector(selector) : null;
    } catch {
      /* некорректный селектор — просто ничего не делаем */
    }
    if (!target) return;

    event.preventDefault();
    const header = document.querySelector('.header');
    const offset = (header?.offsetHeight ?? 0) + (Number(trigger.dataset.gotoOffset) || 0);
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: behavior() });
  });

  const header = document.querySelector('.header');
  const toTop = document.querySelector('[data-to-top]');

  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: behavior() }));

  let ticking = false;
  const update = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 10);
    toTop?.classList.toggle('is-visible', window.scrollY > 400);
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
}
