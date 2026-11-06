// Динамический адаптив: переносит элемент в другой контейнер на нужной ширине и возвращает обратно.
//
// data-da="селектор-контейнера, ширина, позиция"
//   ширина  — max-width в px (по умолчанию 767.98)
//   позиция — first | last | номер (по умолчанию last)
//
// <div class="header__phone" data-da=".header__menu, 767.98, last">
//
// Вызывать нужно раньше остальных модулей (в app.js — первым), чтобы они видели итоговый DOM.

export function adaptInit() {
  document.querySelectorAll('[data-da]').forEach((element) => {
    const [selector, width = '767.98', position = 'last'] = element.dataset.da
      .split(',')
      .map((part) => part.trim());

    const marker = document.createComment('da'); // запоминаем исходное место
    element.before(marker);

    const media = matchMedia(`(max-width: ${Number(width)}px)`);

    const update = () => {
      if (!media.matches) {
        marker.after(element);
        return;
      }
      const target = document.querySelector(selector);
      if (!target) return;
      if (position === 'first') {
        target.prepend(element);
      } else if (position === 'last') {
        target.append(element);
      } else {
        const reference = [...target.children].filter((child) => child !== element)[Number(position)];
        if (reference) reference.before(element);
        else target.append(element);
      }
    };

    media.addEventListener('change', update);
    update();
  });
}
