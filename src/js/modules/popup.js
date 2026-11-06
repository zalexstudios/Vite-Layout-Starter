// Попапы на нативном <dialog>: фокус-ловушка, Esc и inert-фон даёт сам браузер.
//
// Разметка:  <dialog class="popup" id="popup-id" data-popup> ... </dialog>
// Открыть:   <button data-popup-open="popup-id">
// Закрыть:   <button data-popup-close> внутри попапа, Esc или клик по подложке
// Из JS:     import { openPopup, closePopup } from './popup.js'
import { bodyLock } from '../files/functions.js';

const root = document.documentElement;
const getDialog = (id) => document.getElementById(id);

export function openPopup(id) {
  const dialog = getDialog(id);
  if (!(dialog instanceof HTMLDialogElement) || dialog.open) return;
  document.querySelectorAll('dialog[data-popup][open]').forEach((other) => other.close());
  dialog.showModal();
  bodyLock(true);
}

export function closePopup(id) {
  getDialog(id)?.close();
}

export function popupInit() {
  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-popup-open]');
    if (opener) {
      event.preventDefault();
      openPopup(opener.dataset.popupOpen);
      return;
    }

    const closer = event.target.closest('[data-popup-close]');
    if (closer) {
      closer.closest('dialog')?.close();
      return;
    }

    // Клик по подложке: целью события становится сам <dialog>
    if (event.target instanceof HTMLDialogElement && event.target.hasAttribute('data-popup')) {
      event.target.close();
    }
  });

  document.querySelectorAll('dialog[data-popup]').forEach((dialog) => {
    dialog.addEventListener('close', () => {
      const anyOpen = document.querySelector('dialog[data-popup][open]');
      if (!anyOpen && !root.classList.contains('menu-open')) bodyLock(false);
    });
  });
}
