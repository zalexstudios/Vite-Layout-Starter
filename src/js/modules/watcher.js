// Анимации появления и счётчики по прокрутке (IntersectionObserver).
//
// <div data-animate="fade-up" data-delay="200">   — fade | fade-up | zoom, задержка в мс (необязательно)
// <span data-count="1500" data-count-duration="2000">0</span>  — число «набегает» при появлении
// <div data-watch data-watch-repeat>              — только класс is-visible (повторять при каждом входе в экран)
//
// Скрытое начальное состояние включается классом html.js (ставится в head.html) —
// без JS контент остаётся видимым.

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const formatNumber = (value) => Math.round(value).toLocaleString('ru-RU');

function animateCount(element) {
  const target = Number(element.dataset.count);
  if (Number.isNaN(target)) return;
  if (reduceMotion()) {
    element.textContent = formatNumber(target);
    return;
  }
  const duration = Number(element.dataset.countDuration) || 1500;
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    element.textContent = formatNumber(target * (1 - (1 - progress) ** 3)); // ease-out
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function reveal(element) {
  element.classList.add('is-visible');
  if (element.hasAttribute('data-count')) animateCount(element);
}

export function watcherInit() {
  const items = document.querySelectorAll('[data-animate], [data-watch], [data-count]');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        const repeat = element.hasAttribute('data-watch-repeat');
        if (entry.isIntersecting) {
          reveal(element);
          if (!repeat) observer.unobserve(element);
        } else if (repeat) {
          element.classList.remove('is-visible');
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
  );

  items.forEach((element) => {
    if (element.dataset.delay) element.style.setProperty('--delay', `${element.dataset.delay}ms`);
    observer.observe(element);
  });
}
