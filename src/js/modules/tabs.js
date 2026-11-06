// Табы с ARIA-ролями и клавиатурой (← → Home End).
//
// <div class="tabs" data-tabs>
//   <div class="tabs__nav">
//     <button class="tabs__btn is-active" type="button" data-tab="one">Один</button>
//     <button class="tabs__btn" type="button" data-tab="two">Два</button>
//   </div>
//   <div class="tabs__panel" data-tab-panel="one">…</div>
//   <div class="tabs__panel" data-tab-panel="two">…</div>
// </div>
//
// Активная вкладка по умолчанию — с классом is-active, иначе первая. Вложенные табы поддерживаются.

export function tabsInit() {
  document.querySelectorAll('[data-tabs]').forEach((root, index) => {
    const own = (element) => element.closest('[data-tabs]') === root;
    const buttons = [...root.querySelectorAll('[data-tab]')].filter(own);
    const panels = [...root.querySelectorAll('[data-tab-panel]')].filter(own);
    if (!buttons.length) return;

    const panelFor = (button) => panels.find((panel) => panel.dataset.tabPanel === button.dataset.tab);

    buttons[0].parentElement.setAttribute('role', 'tablist');
    buttons.forEach((button) => {
      const panel = panelFor(button);
      if (!panel) return;
      button.id = `tab-${index}-${button.dataset.tab}`;
      panel.id = `tabpanel-${index}-${button.dataset.tab}`;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', button.id);
      panel.tabIndex = 0;
    });

    const activate = (button, focus = false) => {
      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
        const panel = panelFor(item);
        if (panel) {
          panel.hidden = !active;
          panel.classList.toggle('is-active', active);
        }
      });
      if (focus) button.focus();
    };

    root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-tab]');
      if (button && buttons.includes(button)) activate(button);
    });

    root.addEventListener('keydown', (event) => {
      const current = buttons.indexOf(document.activeElement);
      if (current === -1) return;
      const last = buttons.length - 1;
      const target = {
        ArrowRight: current === last ? 0 : current + 1,
        ArrowLeft: current === 0 ? last : current - 1,
        Home: 0,
        End: last,
      }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      activate(buttons[target], true);
    });

    activate(buttons.find((button) => button.classList.contains('is-active')) ?? buttons[0]);
  });
}
