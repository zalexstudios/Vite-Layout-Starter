// Маски полей ввода без зависимостей.
//
// <input type="tel" data-mask="phone">              — алиас: +7 (###) ###-##-##
// <input data-mask="##.##.####">                    — любой шаблон, # = цифра
// <input data-mask="phone" data-mask-error="…">     — свой текст ошибки
//
// Телефон: ведущие 7 / 8 / +7 при вводе и вставке отбрасываются. Незаполненная до конца маска
// делает поле невалидным (setCustomValidity), поэтому форма с data-validate её не пропустит.

const ALIASES = { phone: '+7 (###) ###-##-##' };

function parse(pattern) {
  return {
    pattern,
    length: [...pattern].filter((char) => char === '#').length,
    head: pattern.slice(0, Math.max(pattern.indexOf('#'), 0)), // постоянная часть в начале: "+7 ("
    prefix: pattern.match(/^\+?(\d+)/)?.[1] ?? '', // код страны: "7"
  };
}

function extractDigits(value, spec) {
  let digits = value.replace(/\D/g, '');
  if (spec.prefix) {
    const formatted = (spec.head && value.startsWith(spec.head)) || value.startsWith('+');
    const country = spec.prefix === '7' ? /^[78]/ : new RegExp(`^${spec.prefix}`);
    if ((formatted || digits.length > spec.length || digits.length === 1) && country.test(digits)) {
      digits = digits.slice(spec.prefix.length);
    }
  }
  return digits.slice(0, spec.length);
}

function format(digits, spec) {
  let text = '';
  let index = 0;
  const ends = []; // позиция в тексте сразу после каждой введённой цифры (для каретки)
  for (const char of spec.pattern) {
    if (index >= digits.length) break;
    if (char === '#') {
      text += digits[index++];
      ends.push(text.length);
    } else {
      text += char;
    }
  }
  return { text, ends };
}

/** Чистая функция: применяет маску к строке. Удобна для тестов и для своих нужд. */
export function applyMask(value, pattern) {
  const spec = parse(ALIASES[pattern] ?? pattern);
  return format(extractDigits(value, spec), spec).text;
}

function bind(input) {
  const spec = parse(ALIASES[input.dataset.mask] ?? input.dataset.mask);
  if (!spec.length) return;

  if (!input.placeholder) input.placeholder = spec.pattern.replace(/#/g, '_');
  if (spec.prefix && input.type === 'text') input.type = 'tel';
  if (!input.inputMode) input.inputMode = spec.prefix ? 'tel' : 'numeric';

  const validate = () => {
    const digits = extractDigits(input.value, spec);
    const incomplete = input.value !== '' && digits.length < spec.length;
    input.setCustomValidity(incomplete ? input.dataset.maskError || 'Заполните поле полностью' : '');
  };

  const apply = () => {
    const { value } = input;
    const caret = input.selectionStart ?? value.length;
    const atEnd = caret >= value.length;
    const { text, ends } = format(extractDigits(value, spec), spec);

    if (text !== value) input.value = text;

    if (!atEnd && document.activeElement === input) {
      const before = extractDigits(value.slice(0, caret), spec).length;
      const position =
        before === 0
          ? Math.max((ends[0] ?? 1) - 1, 0)
          : (ends[Math.min(before, ends.length) - 1] ?? text.length);
      input.setSelectionRange(position, position);
    }
    validate();
  };

  input.addEventListener('input', apply);

  // Backspace «перепрыгивает» через скобки и пробелы, иначе маска вернёт их обратно
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Backspace' || input.selectionStart !== input.selectionEnd) return;
    let position = input.selectionStart;
    while (position > 0 && /\D/.test(input.value[position - 1])) position -= 1;
    if (position !== input.selectionStart) input.setSelectionRange(position, position);
  });

  input.addEventListener('focus', () => {
    if (!input.value && spec.head) {
      input.value = spec.head;
      validate();
    }
  });

  input.addEventListener('blur', () => {
    if (extractDigits(input.value, spec).length === 0) {
      input.value = '';
      input.setCustomValidity('');
    }
  });

  input.form?.addEventListener('reset', () => setTimeout(validate));

  if (input.value) apply();
}

export function maskInit() {
  document.querySelectorAll('input[data-mask]').forEach(bind);
}
