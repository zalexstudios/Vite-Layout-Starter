import fs from 'node:fs';
import path from 'node:path';

/**
 * SVG-спрайт без зависимостей.
 *
 * Все файлы из src/img/icons/*.svg собираются в <symbol id="icon-<имя файла>">
 * и вставляются сразу после <body>. Использование:
 *
 *   <svg class="icon"><use href="#icon-close"></use></svg>
 *
 * Чтобы иконка наследовала цвет текста, в самом SVG-файле ставьте fill="currentColor".
 */
const toPosix = (p) => p.split(path.sep).join('/');

export default function svgSprite({ root, dir = 'img/icons' } = {}) {
  const iconsDir = path.resolve(root, dir);

  const buildSprite = () => {
    if (!fs.existsSync(iconsDir)) return '';
    const symbols = fs
      .readdirSync(iconsDir)
      .filter((file) => file.endsWith('.svg'))
      .sort()
      .map((file) => {
        const source = fs.readFileSync(path.join(iconsDir, file), 'utf8');
        const match = source.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
        if (!match) return '';
        const viewBox = match[1].match(/viewBox=(["'])(.*?)\1/i)?.[2];
        const inner = match[2].replace(/<\?xml[\s\S]*?\?>|<!--[\s\S]*?-->/g, '').trim();
        const id = `icon-${path.parse(file).name}`;
        return `<symbol id="${id}"${viewBox ? ` viewBox="${viewBox}"` : ''}>${inner}</symbol>`;
      })
      .filter(Boolean);

    if (!symbols.length) return '';
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" ' +
      'style="position:absolute;width:0;height:0;overflow:hidden">' +
      symbols.join('') +
      '</svg>'
    );
  };

  return {
    name: 'svg-sprite',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const sprite = buildSprite();
        return sprite ? html.replace(/<body[^>]*>/i, (body) => `${body}\n${sprite}`) : html;
      },
    },
    handleHotUpdate({ file, server }) {
      if (toPosix(file).startsWith(toPosix(iconsDir)) && file.endsWith('.svg')) {
        server.ws.send({ type: 'full-reload', path: '*' });
        return [];
      }
    },
  };
}
