# Vite Layout Starter

Независимый стартер для верстки на **Vite 7**: HTML-партиалы, SCSS, автопрефиксы,
мультистраничная сборка. Без фреймворков и без плагинов-«комбайнов» — одна небольшая
самописная вставка (`plugins/html-include.js`) вместо внешних зависимостей.

Структура папок и подход вдохновлены шаблоном «Чертоги Фрилансера» (`src/js/files`,
`src/scss`, `@include`), но это отдельный проект с собственным кодом.

## Требования

Node.js `^20.19.0 || >=22.12.0` (требование Vite 7). Подсказка: `nvm use` возьмёт версию из `.nvmrc`.

## Быстрый старт

```bash
npm install
npm run dev       # dev-сервер с HMR, откроется браузер
npm run build     # сборка в dist/
npm run preview   # локальный просмотр dist/
npm run format    # Prettier (JS, SCSS, JSON)
npm run lint      # ESLint + Stylelint (lint:js, lint:css, lint:fix)
```

## Структура

```
├─ public/            статика «как есть» (favicon, robots.txt, ...)
├─ plugins/
│  ├─ html-include.js плагин HTML-партиалов
│  ├─ svg-sprite.js   SVG-спрайт из src/img/icons
│  └─ images.js       сжатие картинок + webp + <picture> (только build)
├─ src/
│  ├─ *.html          каждая страница = отдельная точка входа сборки
│  ├─ html/           партиалы (head, header, footer, ...)
│  ├─ scss/           style.scss + _vars, _mixins, _fonts, _reset, _base, _layout,
│  │                  _popup, _spoilers, _forms, _slider, _tabs, _select, _extras
│  ├─ js/
│  │  ├─ app.js       точка входа (подключает модули и стили)
│  │  ├─ files/       functions.js (хелперы), script.js (ваш код)
│  │  └─ modules/     popup, spoilers, forms, slider, tabs, select, mask, parallax,
│  │                  watcher, scroll, quantity, showmore, adapt
│  ├─ img/            изображения
│  │  └─ icons/       *.svg для спрайта
│  └─ fonts/          шрифты
├─ .vscode/           сниппеты, настройки редактора, рекомендуемые расширения
└─ vite.config.js
```

## HTML-партиалы

```html
@include("html/header.html")
@include("html/head.html", {"title": "Главная", "description": "Описание"})
```

В партиале переменные вставляются как `@@title`. Пути считаются от `src/`, вложенность
поддерживается. Параметры — валидный JSON (двойные кавычки, без вложенных объектов).
Правка партиала в dev-режиме перезагружает страницу.

## Новая страница

Создайте `src/contacts.html` по образцу `about.html` — она сама попадёт в сборку
(`dist/contacts.html`). В dev-режиме новый файл подхватывается сразу, а список страниц для `build` читается при каждом запуске.

## Алиасы

`@` → `src`, `@img`, `@fonts`, `@scss`, `@js`. Работают в JS и SCSS
(например, `url('@fonts/Inter-Regular.woff2')` в `_fonts.scss`).
В HTML используйте пути от корня `src`: `<img src="/img/logo.svg">`.

## SCSS-инструменты (`_mixins.scss`)

```scss
@use 'mixins' as *;

.title {
  font-size: fluid(32, 64);   // плавный clamp() между 375px и 1440px
  margin-bottom: to-rem(24);     // 24px → 1.5rem

  @include mq(md) { ... }     // max-width: 767.98px (desktop-first)
  @include mq-up(md) { ... }  // min-width: 768px
}
```

Брейкпоинты и цвета — в `_vars.scss`.

## Модули

Рабочие примеры — на страницах `src/components.html` и `src/extras.html`.
Все модули управляются `data-` атрибутами, подключены в `app.js`.

### Попапы (`modules/popup.js`)

Построены на нативном `<dialog>`: фокус-ловушку, Esc и недоступность фона обеспечивает браузер.

```html
<button data-popup-open="popup-id">Открыть</button>

<dialog class="popup" id="popup-id" data-popup>
  <div class="popup__body">
    <button class="popup__close" type="button" data-popup-close aria-label="Закрыть">…</button>
    …
  </div>
</dialog>
```

Закрытие: `data-popup-close`, Esc, клик по подложке. Из JS: `openPopup('popup-id')`, `closePopup('popup-id')`.

### Спойлеры (`modules/spoilers.js`)

Контейнер `data-spoilers` (+ `data-spoilers-one`, чтобы был открыт только один), кнопка `data-spoiler`,
класс `is-open` на `.spoiler` — открыт по умолчанию. Высота анимируется на CSS (`grid-template-rows`).

### Формы (`modules/forms.js`)

Валидация на нативных атрибутах (`required`, `type="email"`, `minlength`, `pattern` + `title`),
свои тексты ошибок — через `data-error`. Ошибки показываются при потере фокуса и при отправке.

```html
<form data-validate>                      <!-- только валидация, дальше обычная отправка -->
<form data-ajax action="/api/send"        <!-- валидация + fetch(FormData) -->
      data-popup-success="popup-success"  <!-- попап после успеха -->
      data-popup-error="popup-error">     <!-- попап при ошибке -->
```

Если `action` пустой или `#` — демо-режим без сети (успех считается сразу).
Разметка поля: `<div class="field"><input class="field__input" …></div>`.

### Слайдеры (`modules/slider.js`)

Swiper 11. Подгружается лениво — только на страницах, где есть `[data-slider]`.
Настройки — JSON в атрибуте (любые [параметры Swiper](https://swiperjs.com/swiper-api)):

```html
<div class="swiper slider" data-slider='{"loop":true,"breakpoints":{"768":{"slidesPerView":2}}}'>
```

Стрелки и пагинация включаются, если внутри есть `.swiper-button-prev/next` и `.swiper-pagination`.

### Табы (`modules/tabs.js`)

```html
<div class="tabs" data-tabs>
  <div class="tabs__nav">
    <button class="tabs__btn is-active" type="button" data-tab="one">Один</button>
    <button class="tabs__btn" type="button" data-tab="two">Два</button>
  </div>
  <div class="tabs__panel" data-tab-panel="one">…</div>
  <div class="tabs__panel" data-tab-panel="two">…</div>
</div>
```

ARIA-роли расставляются автоматически, работают стрелки, Home и End. Вложенные табы поддерживаются.

### Селекты (`modules/select.js`)

Достаточно обычного `<select data-select>` внутри `.field`. Нативный select остаётся в форме
(отправка, `required`, `label[for]`), а поверх строится доступный combobox: клавиатура, поиск по первой
букве, закрытие по клику вне. Пустой `<option value="">` становится плейсхолдером.
Работает вместе с валидацией форм (ошибки, `data-error`).

### Маски (`modules/mask.js`)

```html
<input data-mask="phone">          <!-- +7 (###) ###-##-## -->
<input data-mask="##.##.####">     <!-- свой шаблон: # = цифра -->
<input data-mask="phone" data-mask-error="Введите номер полностью">
```

Для телефона ведущие `7`, `8`, `+7` отбрасываются (в том числе при вставке), каретка не «прыгает»
при правке в середине, Backspace проходит через скобки и пробелы. Незаполненная маска делает поле
невалидным, форма с `data-validate` её не пропустит. Чистая функция `applyMask(value, pattern)`
экспортируется для своих задач.

### Параллакс (`modules/parallax.js`)

```html
<!-- по скроллу: слой выше контейнера (см. .parallax), data-parallax — скорость -->
<div class="parallax"><div class="parallax__bg" data-parallax="0.25"></div>…</div>

<!-- по мыши: смещение ≈ depth × 100px -->
<div class="parallax-mouse" data-parallax-mouse>
  <div class="parallax-mouse__layer" data-depth="0.1"></div>
</div>
```

Отключается при `prefers-reduced-motion`; эффект мыши — только на устройствах с курсором.

### Анимации и счётчики (`modules/watcher.js`)

```html
<div data-animate="fade-up" data-delay="200">…</div>   <!-- fade | fade-up | zoom -->
<b data-count="1500" data-count-duration="2000">0</b>
<div data-watch data-watch-repeat>…</div>               <!-- только класс is-visible -->
```

Скрытое состояние включается классом `html.js` (его ставит inline-скрипт в `head.html`),
поэтому без JS контент остаётся видимым.

### Скролл (`modules/scroll.js`)

- `<a href="#id" data-goto>` — плавный переход с учётом высоты `.header` (`data-goto-offset` — доп. отступ);
- `<button data-to-top>` — кнопка «Наверх», появляется после 400px (уже есть в `footer.html`);
- `.header` получает класс `is-scrolled` после 10px прокрутки.

### Количество (`modules/quantity.js`)

Блок `data-quantity` с кнопками `data-quantity-minus` / `data-quantity-plus`;
`min`, `max`, `step` берутся из атрибутов input, крайние значения блокируют кнопки.

### Показать больше (`modules/showmore.js`)

`data-showmore="120"` (высота в px), внутри `[data-showmore-content]` и `[data-showmore-btn]`.
Кнопка скрывается, если контент и так короче. Тексты: `data-showmore-labels="Показать|Скрыть"`.

### Динамический адаптив (`modules/adapt.js`)

```html
<div class="header__phone" data-da=".header__menu, 767.98, last">
```

Формат: `селектор-цели, max-width в px, позиция (first | last | номер)`. Элемент переезжает в цель
на нужной ширине и возвращается на место при расширении окна.

### Утилиты

`.visually-hidden` (скрыть визуально, оставить для скринридеров) и `.ibg` — картинка-«обложка»
(`object-fit: cover` внутри блока с заданной пропорцией).

## Сниппеты VS Code

Файл `.vscode/vite-layout.code-snippets` подхватывается автоматически при открытии папки проекта.
Все префиксы начинаются с `vl-`, список подсказок появится при вводе `vl`.

| HTML | |
|---|---|
| `vl-page` | каркас страницы с партиалами |
| `vl-include`, `vl-include-p` | партиал / партиал с параметрами |
| `vl-icon`, `vl-img`, `vl-ibg`, `vl-nowebp` | иконка из спрайта, картинка, обложка, img без webp |
| `vl-btn`, `vl-field`, `vl-form`, `vl-select`, `vl-mask` | кнопка, поле, форма, селект, телефон |
| `vl-tabs`, `vl-spoilers`, `vl-slider` | табы, аккордеон, слайдер |
| `vl-popup`, `vl-popup-open` | попап и кнопка открытия |
| `vl-parallax`, `vl-parallax-mouse` | параллакс по скроллу / по мыши |
| `vl-animate`, `vl-count`, `vl-quantity`, `vl-showmore`, `vl-da`, `vl-goto` | остальные модули |

| SCSS | |
|---|---|
| `vl-use` | `@use 'vars'` и `@use 'mixins'` |
| `vl-mq`, `vl-mqup` | медиазапросы desktop-first / mobile-first |
| `vl-fluid`, `vl-rem` | плавный размер, px → rem |
| `vl-hover`, `vl-transition` | hover только для курсора, transition |
| `vl-block`, `vl-font` | BEM-блок, `@font-face` |

| JS | |
|---|---|
| `vl-module` | заготовка модуля с `xxxInit()` |
| `vl-click`, `vl-qsa` | делегирование клика, перебор элементов |
| `vl-lazy`, `vl-openpopup` | ленивый `import()`, открыть попап из кода |

Чтобы добавить свой сниппет, дополните JSON-файл по образцу существующих.
В `.vscode/` также лежат рекомендуемые расширения (Prettier, ESLint, Stylelint) и настройки
форматирования при сохранении (для HTML отключено — из-за `@include`).

## SVG-спрайт

Положите иконки в `src/img/icons/name.svg` (внутри ставьте `fill="currentColor"`) и используйте:

```html
<svg class="icon"><use href="#icon-name"></use></svg>
```

Спрайт вставляется после `<body>` автоматически, в dev и в build, без лишних запросов.

## Картинки и webp

При `npm run build` плагин `plugins/images.js`:

1. сжимает jpg/png в `dist/` (sharp; файл перезаписывается, только если стал меньше);
2. создаёт рядом `.webp`, если он легче оригинала;
3. оборачивает `<img src="….jpg|png">` в `<picture>` с `<source type="image/webp">`.

Пропустить картинку — атрибут `data-no-webp`. В dev-режиме подставляются исходные файлы.
Настройки качества — в `vite.config.js`: `images({ quality: 80, webp: true, webpQuality: 80 })`.
Картинки из CSS (`background-image`) получают `.webp`-копию, но в стилях не подменяются.

## Линтеры

- ESLint 9 (flat config): `eslint.config.js`, совместим с Prettier.
- Stylelint: `.stylelintrc.json` на базе `stylelint-config-standard-scss`
  (отключены `selector-class-pattern` — для BEM — и `no-descending-specificity`).
- `npm run lint` — проверка, `npm run lint:fix` — автоисправление.

## Если что-то не работает

**`[sass] Tried writing to closed dispatcher`** — упал встроенный компилятор `sass-embedded` (отдельный процесс).
Стартер использует обычный пакет `sass` (чистый JS), поэтому у вас такой ошибки быть не должно. Если вы обновляли
проект поверх старой копии, выполните:

```bash
npm uninstall sass-embedded
npm install -D sass
rm -rf node_modules/.vite      # сброс кэша Vite
npm run dev
```

**Увидеть настоящую ошибку в стилях** — скомпилируйте SCSS напрямую, без Vite:

```bash
npx sass --no-source-map src/scss/style.scss > /dev/null
```

В выводе будет файл, строка и причина. Пришлите её — по ней проще всего найти проблему.

## Сборка

- Результат: `dist/` с `css/`, `js/`, `img/`, `fonts/` и хешами в именах файлов.
- `base: './'` — пути относительные, сборку можно выкладывать в любую папку хостинга.
- Ничего не вшивается в base64 (`assetsInlineLimit: 0`).
- Целевые браузеры — `browserslist` в `package.json` (влияет на автопрефиксер).

## Свой модуль

Создайте `src/js/modules/имя.js`, экспортируйте `имяInit()` и вызовите в `app.js`
(для тяжёлых библиотек — через динамический `import()`, как слайдер).
