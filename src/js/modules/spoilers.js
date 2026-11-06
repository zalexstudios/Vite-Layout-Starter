// Спойлеры (аккордеон). Анимация высоты — на CSS (grid-template-rows), JS только переключает класс.
//
// <div class="spoilers" data-spoilers data-spoilers-one>   ← data-spoilers-one: открыт только один
//   <div class="spoiler [is-open]">
//     <button class="spoiler__title" type="button" data-spoiler>Заголовок</button>
//     <div class="spoiler__body"><div class="spoiler__inner"><div class="spoiler__content">...</div></div></div>
//   </div>
// </div>

function setState(item, open) {
  item.classList.toggle('is-open', open);
  item.querySelector('[data-spoiler]')?.setAttribute('aria-expanded', String(open));
  const body = item.querySelector('.spoiler__body');
  if (body) body.inert = !open; // скрытое содержимое недоступно для Tab и скринридеров
}

export function spoilersInit() {
  document.querySelectorAll('[data-spoilers]').forEach((group) => {
    const oneOpen = group.hasAttribute('data-spoilers-one');
    const items = [...group.querySelectorAll('.spoiler')];

    items.forEach((item) => setState(item, item.classList.contains('is-open')));

    group.addEventListener('click', (event) => {
      const button = event.target.closest('[data-spoiler]');
      if (!button || !group.contains(button)) return;

      const item = button.closest('.spoiler');
      const willOpen = !item.classList.contains('is-open');
      if (oneOpen && willOpen) {
        items.forEach((other) => other !== item && setState(other, false));
      }
      setState(item, willOpen);
    });
  });
}
