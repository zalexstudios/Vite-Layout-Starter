// Поле «количество» с кнопками − / +. Берёт min, max и step из атрибутов input.
//
// <div class="quantity" data-quantity>
//   <button class="quantity__btn" type="button" data-quantity-minus aria-label="Меньше">−</button>
//   <input class="quantity__input" type="number" name="qty" value="1" min="1" max="10" step="1" />
//   <button class="quantity__btn" type="button" data-quantity-plus aria-label="Больше">+</button>
// </div>

export function quantityInit() {
  document.querySelectorAll('[data-quantity]').forEach((root) => {
    const input = root.querySelector('input');
    const minus = root.querySelector('[data-quantity-minus]');
    const plus = root.querySelector('[data-quantity-plus]');
    if (!input) return;

    const min = input.min === '' ? 1 : Number(input.min);
    const max = input.max === '' ? Infinity : Number(input.max);
    const step = Number(input.step) || 1;

    const set = (value) => {
      const next = Math.min(max, Math.max(min, Number.isNaN(value) ? min : value));
      if (String(next) !== input.value) {
        input.value = String(next);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (minus) minus.disabled = next <= min;
      if (plus) plus.disabled = next >= max;
    };

    root.addEventListener('click', (event) => {
      if (event.target.closest('[data-quantity-minus]')) set(Number(input.value) - step);
      if (event.target.closest('[data-quantity-plus]')) set(Number(input.value) + step);
    });
    input.addEventListener('change', () => set(Number(input.value)));
    set(Number(input.value));
  });
}
