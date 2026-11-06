// Кастомные селекты поверх нативного <select data-select>.
// Нативный select остаётся в DOM (отправка формы, валидация, label[for]), поверх строится
// доступный combobox + listbox: клавиатура, поиск по первой букве, закрытие по клику вне.
//
// <div class="field">
//   <label class="field__label" for="city">Город</label>
//   <select id="city" name="city" data-select required>
//     <option value="">Выберите город</option>   ← пустой option = плейсхолдер
//     <option value="msk">Москва</option>
//   </select>
// </div>
//
// Значок стрелки берётся из спрайта (#icon-chevron-down).

let uid = 0;
let closeOpened = null;

function createSelect(select) {
  const id = ++uid;

  const wrapper = document.createElement('div');
  wrapper.className = 'select';
  select.before(wrapper);
  wrapper.append(select);
  select.classList.add('select__native');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');

  const allOptions = [...select.options];
  const items = allOptions.filter((option) => option.value !== '');
  const placeholder =
    allOptions.find((option) => option.value === '')?.textContent.trim() ||
    select.dataset.placeholder ||
    'Выберите';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'select__btn';
  button.setAttribute('role', 'combobox');
  button.setAttribute('aria-haspopup', 'listbox');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', `select-list-${id}`);
  button.innerHTML =
    '<span class="select__value"></span>' +
    '<svg class="icon" aria-hidden="true"><use href="#icon-chevron-down"></use></svg>';
  const valueElement = button.querySelector('.select__value');
  valueElement.id = `select-value-${id}`;

  const label = select.labels?.[0];
  if (label) {
    label.id ||= `select-label-${id}`;
    button.setAttribute('aria-labelledby', `${label.id} ${valueElement.id}`);
  }

  const list = document.createElement('ul');
  list.className = 'select__list';
  list.id = `select-list-${id}`;
  list.setAttribute('role', 'listbox');
  list.hidden = true;

  const optionElements = items.map((option, index) => {
    const element = document.createElement('li');
    element.className = 'select__option';
    element.id = `select-${id}-option-${index}`;
    element.setAttribute('role', 'option');
    element.textContent = option.text.trim();
    list.append(element);
    return element;
  });

  wrapper.append(button, list);

  let active = -1;
  const selectedIndex = () => items.findIndex((option) => option.selected);

  function sync() {
    const index = selectedIndex();
    valueElement.textContent = index >= 0 ? items[index].text.trim() : placeholder;
    valueElement.classList.toggle('is-placeholder', index < 0);
    optionElements.forEach((element, i) => element.setAttribute('aria-selected', String(i === index)));
    button.disabled = select.disabled;
  }

  function setActive(index) {
    active = index;
    optionElements.forEach((element, i) => element.classList.toggle('is-active', i === index));
    if (index >= 0) {
      button.setAttribute('aria-activedescendant', optionElements[index].id);
      optionElements[index].scrollIntoView({ block: 'nearest' });
    } else {
      button.removeAttribute('aria-activedescendant');
    }
  }

  function close() {
    list.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    setActive(-1);
    if (closeOpened === close) closeOpened = null;
  }

  function open() {
    if (button.disabled) return;
    closeOpened?.();
    closeOpened = close;
    list.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    setActive(Math.max(selectedIndex(), 0));
  }

  function choose(index) {
    const option = items[index];
    if (!option) return;
    option.selected = true;
    sync();
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Поиск по первой букве (набор из нескольких букв подряд — по префиксу)
  let query = '';
  let queryTimer;
  function typeahead(char) {
    query += char.toLowerCase();
    clearTimeout(queryTimer);
    queryTimer = setTimeout(() => (query = ''), 600);
    const texts = items.map((option) => option.text.trim().toLowerCase());
    const from = list.hidden ? selectedIndex() : active;
    const shift = query.length === 1 ? from + 1 : Math.max(from, 0);
    const found = [...texts.keys()]
      .map((key) => (key + shift) % texts.length)
      .find((key) => texts[key].startsWith(query));
    if (found === undefined) return;
    if (list.hidden) choose(found);
    else setActive(found);
  }

  button.addEventListener('click', () => (list.hidden ? open() : close()));

  button.addEventListener('keydown', (event) => {
    const isOpen = !list.hidden;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (isOpen) setActive(Math.min(active + 1, items.length - 1));
        else open();
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) setActive(Math.max(active - 1, 0));
        else open();
        break;
      case 'Home':
      case 'End':
        if (isOpen) {
          event.preventDefault();
          setActive(event.key === 'Home' ? 0 : items.length - 1);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen) {
          choose(active);
          close();
        } else {
          open();
        }
        break;
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          close();
        }
        break;
      case 'Tab':
        close();
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          typeahead(event.key);
        }
    }
  });

  // Пробел в Firefox вызывает click на keyup — гасим, иначе список сразу закроется
  button.addEventListener('keyup', (event) => {
    if (event.key === ' ') event.preventDefault();
  });

  list.addEventListener('mousedown', (event) => event.preventDefault()); // фокус остаётся на кнопке
  list.addEventListener('click', (event) => {
    const index = optionElements.indexOf(event.target.closest('.select__option'));
    if (index === -1) return;
    choose(index);
    close();
    button.focus();
  });
  list.addEventListener('mousemove', (event) => {
    const index = optionElements.indexOf(event.target.closest('.select__option'));
    if (index !== -1 && index !== active) setActive(index);
  });

  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) close();
  });

  // Программный focus() нативного select (например, при ошибке валидации) уходит на кнопку
  select.addEventListener('focus', () => button.focus());
  select.addEventListener('change', sync);
  select.form?.addEventListener('reset', () => setTimeout(sync));

  // Состояние ошибки, которое выставляет forms.js, дублируем на кнопку
  new MutationObserver(() =>
    button.setAttribute('aria-invalid', select.getAttribute('aria-invalid') ?? 'false')
  ).observe(select, { attributes: true, attributeFilter: ['aria-invalid'] });

  sync();
}

export function selectInit() {
  document.querySelectorAll('select[data-select]').forEach(createSelect);
}
