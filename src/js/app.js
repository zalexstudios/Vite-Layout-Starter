// Единая точка входа: скрипты + стили (стили импортируем последними — они приоритетнее)
import { addLoadedClass, addTouchClass, menuInit } from './files/functions.js';
import { adaptInit } from './modules/adapt.js';
import { popupInit } from './modules/popup.js';
import { spoilersInit } from './modules/spoilers.js';
import { tabsInit } from './modules/tabs.js';
import { selectInit } from './modules/select.js';
import { maskInit } from './modules/mask.js';
import { formsInit } from './modules/forms.js';
import { quantityInit } from './modules/quantity.js';
import { showmoreInit } from './modules/showmore.js';
import { scrollInit } from './modules/scroll.js';
import { watcherInit } from './modules/watcher.js';
import { parallaxInit } from './modules/parallax.js';
import './files/script.js';
import '../scss/style.scss';

adaptInit(); // первым: переносит элементы до того, как остальные модули начнут с ними работать
addTouchClass();
addLoadedClass();
menuInit();
popupInit();
spoilersInit();
tabsInit();
selectInit();
maskInit();
formsInit();
quantityInit();
showmoreInit();
scrollInit();
watcherInit();
parallaxInit();

// Swiper тяжёлый — грузим его (и его CSS) только там, где есть слайдер
if (document.querySelector('[data-slider]')) {
  import('./modules/slider.js').then(({ slidersInit }) => slidersInit());
}
