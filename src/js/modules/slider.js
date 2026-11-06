// Слайдеры на Swiper. Подгружается лениво — только на страницах с [data-slider] (см. app.js).
//
// <div class="swiper slider" data-slider='{"loop":true,"breakpoints":{"768":{"slidesPerView":2}}}'>
//   <div class="swiper-wrapper"><div class="swiper-slide">…</div></div>
//   <div class="swiper-pagination"></div>        ← необязательно
//   <button class="swiper-button-prev"></button> ← необязательно (вместе с next)
//   <button class="swiper-button-next"></button>
// </div>
//
// В data-slider — любые параметры Swiper в виде JSON: https://swiperjs.com/swiper-api
import Swiper from 'swiper';
import { A11y, Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export function slidersInit() {
  document.querySelectorAll('[data-slider]').forEach((element) => {
    let custom = {};
    try {
      custom = JSON.parse(element.dataset.slider || '{}');
    } catch {
      console.warn('[slider] некорректный JSON в data-slider:', element);
    }

    const prev = element.querySelector('.swiper-button-prev');
    const next = element.querySelector('.swiper-button-next');
    const pagination = element.querySelector('.swiper-pagination');

    new Swiper(element, {
      modules: [Navigation, Pagination, A11y, Autoplay],
      slidesPerView: 1,
      spaceBetween: 16,
      ...(prev && next ? { navigation: { prevEl: prev, nextEl: next } } : {}),
      ...(pagination ? { pagination: { el: pagination, clickable: true } } : {}),
      ...custom,
    });
  });
}
