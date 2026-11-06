import fs from 'node:fs';
import path from 'node:path';

/**
 * Мини-плагин HTML-партиалов без внешних зависимостей.
 *
 * Подключение:   @include("html/header.html")
 * С параметрами: @include("html/head.html", {"title": "Главная"})
 * В партиале:    @@title
 *
 * Пути считаются от папки src. Вложенные @include поддерживаются.
 * Параметры — валидный JSON (двойные кавычки, без вложенных объектов).
 */
const INCLUDE_RE = /@include\(\s*(['"])(.+?)\1\s*(?:,\s*(\{[\s\S]*?\}))?\s*\)/g;

export default function htmlInclude({ root, maxDepth = 10 } = {}) {
  const render = (html, depth = 0) => {
    if (depth > maxDepth) {
      throw new Error('[html-include] слишком глубокая вложенность — нет ли цикла?');
    }
    return html.replace(INCLUDE_RE, (_match, _quote, file, json) => {
      const full = path.resolve(root, file);
      if (!fs.existsSync(full)) {
        throw new Error(`[html-include] файл не найден: ${file}`);
      }
      let params = {};
      if (json) {
        try {
          params = JSON.parse(json);
        } catch {
          throw new Error(`[html-include] некорректный JSON в параметрах для ${file}`);
        }
      }
      const part = fs
        .readFileSync(full, 'utf8')
        .replace(/@@(\w+)/g, (_m, key) => (key in params ? String(params[key]) : ''));
      return render(part, depth + 1);
    });
  };

  return {
    name: 'html-include',
    transformIndexHtml: { order: 'pre', handler: (html) => render(html) },
    // Правка партиала — полная перезагрузка страницы в dev-режиме
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.html')) {
        server.ws.send({ type: 'full-reload', path: '*' });
        return [];
      }
    },
  };
}
