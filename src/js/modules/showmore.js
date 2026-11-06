// «Показать больше»: сворачивает контент до заданной высоты, кнопка скрывается, если контент короче.
//
// <div data-showmore="120" data-showmore-labels="Показать больше|Скрыть">   ← 120 — высота в px
//   <div data-showmore-content>…длинный текст…</div>
//   <button class="showmore__btn" type="button" data-showmore-btn></button>
// </div>

export function showmoreInit() {
  document.querySelectorAll('[data-showmore]').forEach((root) => {
    const content = root.querySelector('[data-showmore-content]');
    const button = root.querySelector('[data-showmore-btn]');
    if (!content || !button) return;

    const collapsed = Number(root.dataset.showmore) || 120;
    const [more, less] = (root.dataset.showmoreLabels ?? 'Показать больше|Скрыть').split('|');
    let open = false;

    const apply = () => {
      const needed = content.scrollHeight > collapsed + 8;
      button.hidden = !needed;
      content.style.maxHeight = !needed ? '' : open ? `${content.scrollHeight}px` : `${collapsed}px`;
      button.textContent = open ? less : more;
      button.setAttribute('aria-expanded', String(open));
      root.classList.toggle('is-open', open);
    };

    button.addEventListener('click', () => {
      open = !open;
      apply();
    });
    window.addEventListener('resize', apply);
    window.addEventListener('load', apply); // картинки внутри могли поменять высоту
    apply();
  });
}
