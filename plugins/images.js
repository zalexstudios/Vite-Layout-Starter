import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

/**
 * Оптимизация изображений после сборки (только `vite build`):
 *  1. сжимает jpg/png в dist/ (файл перезаписывается, только если стал меньше);
 *  2. создаёт рядом .webp-копию (если она легче оригинала);
 *  3. оборачивает <img src="*.jpg|png"> в <picture> с <source type="image/webp">
 *     во всех html-файлах dist/. Чтобы пропустить картинку — атрибут data-no-webp.
 *
 * В dev-режиме ничего не меняется: подставляются исходные файлы.
 * Фоновые изображения из CSS получают .webp-копию, но в стилях не подменяются.
 */
const RASTER = /\.(jpe?g|png)$/i;
const IMG_TAG = /<img\b[^>]*?\bsrc=(["'])([^"']+?\.(?:jpe?g|png))\1[^>]*>/gi;
const PICTURE_BLOCK = /<picture[\s\S]*?<\/picture>/gi;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
    )
  );
  return nested.flat();
}

async function optimize(file, quality) {
  const input = await fs.readFile(file);
  const image = sharp(input).rotate(); // применяем EXIF-ориентацию, т.к. метаданные удаляются
  const output = /\.png$/i.test(file)
    ? await image.png({ compressionLevel: 9, effort: 10 }).toBuffer()
    : await image.jpeg({ quality, mozjpeg: true }).toBuffer();
  if (output.length < input.length) {
    await fs.writeFile(file, output);
    return output;
  }
  return input;
}

function wrapPictures(html, htmlFile, outDir, webpFiles) {
  // Уже существующие <picture> не трогаем
  const kept = [];
  const masked = html.replace(PICTURE_BLOCK, (block) => `\u0000${kept.push(block) - 1}\u0000`);

  const wrapped = masked.replace(IMG_TAG, (tag, _quote, src) => {
    if (/\bdata-no-webp\b/.test(tag) || /^(?:[a-z]+:)?\/\//i.test(src)) return tag;
    const webpSrc = src.replace(RASTER, '.webp');
    let decoded = webpSrc;
    try {
      decoded = decodeURI(webpSrc);
    } catch {
      /* оставляем как есть */
    }
    const absolute = decoded.startsWith('/')
      ? path.join(outDir, decoded)
      : path.resolve(path.dirname(htmlFile), decoded);
    if (!webpFiles.has(absolute)) return tag;
    return `<picture><source srcset="${webpSrc}" type="image/webp">${tag}</picture>`;
  });

  return wrapped.replace(/\u0000(\d+)\u0000/g, (_match, index) => kept[Number(index)]);
}

export default function images({ quality = 80, webp = true, webpQuality = 80 } = {}) {
  let outDir;
  let logger;

  return {
    name: 'images',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
      logger = config.logger;
    },
    async closeBundle() {
      const files = await walk(outDir);
      const rasters = files.filter((file) => RASTER.test(file));
      const webpFiles = new Set();

      for (const file of rasters) {
        const buffer = await optimize(file, quality);
        if (!webp) continue;
        const webpBuffer = await sharp(buffer).webp({ quality: webpQuality }).toBuffer();
        if (webpBuffer.length < buffer.length) {
          const target = file.replace(RASTER, '.webp');
          await fs.writeFile(target, webpBuffer);
          webpFiles.add(target);
        }
      }

      if (webpFiles.size) {
        for (const file of files.filter((f) => f.endsWith('.html'))) {
          const html = await fs.readFile(file, 'utf8');
          const result = wrapPictures(html, file, outDir, webpFiles);
          if (result !== html) await fs.writeFile(file, result);
        }
      }
      logger?.info(`[images] обработано: ${rasters.length}, webp создано: ${webpFiles.size}`);
    },
  };
}
