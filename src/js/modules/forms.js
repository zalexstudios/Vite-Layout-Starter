// Валидация форм на нативном Constraint Validation API + отправка через fetch.
//
// <form data-validate>                    — только валидация, дальше обычная отправка
// <form data-ajax action="/api/send">     — валидация + fetch (FormData)
//   data-popup-success="id"               — попап после успешной отправки
//   data-popup-error="id"                 — попап при ошибке
// Если action пустой или "#" — демо-режим: сеть не используется, считаем отправку успешной.
//
// Правила — обычные атрибуты: required, type="email", minlength, pattern (+ title как текст ошибки).
// Свой текст ошибки для поля: data-error="Введите телефон".
// Структура поля: <div class="field"> <input class="field__input"> </div>
import { openPopup } from './popup.js';

const FIELD_SELECTOR =
  'input:not([type="submit"], [type="button"], [type="reset"], [type="hidden"]), textarea, select';
const isField = (element) => element instanceof Element && element.matches(FIELD_SELECTOR);
const getFields = (form) => [...form.elements].filter(isField);
const getWrapper = (field) => field.closest('.field') ?? field.parentElement;

let errorCounter = 0;

function getErrorElement(field) {
  const wrapper = getWrapper(field);
  let element = wrapper.querySelector('.field__error');
  if (!element) {
    element = document.createElement('p');
    element.className = 'field__error';
    element.id = `field-error-${++errorCounter}`;
    wrapper.append(element);
  }
  return element;
}

function getMessage(field) {
  if (field.dataset.error) return field.dataset.error;
  const { validity } = field;
  if (validity.valueMissing) {
    return field.type === 'checkbox' ? 'Необходимо ваше согласие' : 'Заполните это поле';
  }
  if (validity.typeMismatch) {
    return field.type === 'email' ? 'Введите корректный email' : 'Некорректное значение';
  }
  if (validity.tooShort) return `Минимум символов: ${field.minLength}`;
  if (validity.patternMismatch) return field.title || 'Неверный формат';
  return field.validationMessage;
}

function clearState(field) {
  getWrapper(field).classList.remove('is-invalid');
  field.removeAttribute('aria-invalid');
  field.removeAttribute('aria-describedby');
  const error = getWrapper(field).querySelector('.field__error');
  if (error) {
    error.textContent = '';
    error.hidden = true;
  }
}

function validateField(field) {
  const valid = field.checkValidity();
  if (valid) {
    clearState(field);
    return true;
  }
  const error = getErrorElement(field);
  error.textContent = getMessage(field);
  error.hidden = false;
  getWrapper(field).classList.add('is-invalid');
  field.setAttribute('aria-invalid', 'true');
  field.setAttribute('aria-describedby', error.id);
  return false;
}

async function sendForm(form) {
  const button = form.querySelector('[type="submit"]');
  const action = form.getAttribute('action');
  const demo = !action || action === '#';

  form.classList.add('is-sending');
  if (button) button.disabled = true;

  try {
    if (!demo) {
      const response = await fetch(action, {
        method: (form.getAttribute('method') ?? 'post').toUpperCase(),
        body: new FormData(form),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    }
    form.reset();
    getFields(form).forEach(clearState);
    if (form.dataset.popupSuccess) openPopup(form.dataset.popupSuccess);
  } catch (error) {
    console.error('[forms] ошибка отправки:', error);
    if (form.dataset.popupError) openPopup(form.dataset.popupError);
  } finally {
    form.classList.remove('is-sending');
    if (button) button.disabled = false;
  }
}

export function formsInit() {
  document.querySelectorAll('form[data-validate], form[data-ajax]').forEach((form) => {
    form.noValidate = true; // отключаем нативные «пузыри», показываем свои ошибки

    form.addEventListener('focusout', (event) => {
      if (isField(event.target)) validateField(event.target);
    });

    // После первой ошибки перепроверяем поле по мере ввода
    const recheck = (event) => {
      if (isField(event.target) && event.target.getAttribute('aria-invalid') === 'true') {
        validateField(event.target);
      }
    };
    form.addEventListener('input', recheck);
    form.addEventListener('change', recheck);

    form.addEventListener('submit', async (event) => {
      const invalid = getFields(form).filter((field) => !validateField(field));
      if (invalid.length) {
        event.preventDefault();
        invalid[0].focus();
        return;
      }
      if (form.hasAttribute('data-ajax')) {
        event.preventDefault();
        await sendForm(form);
      }
    });
  });
}
