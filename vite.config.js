import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import autoprefixer from 'autoprefixer';
import htmlInclude from './plugins/html-include.js';
import svgSprite from './plugins/svg-sprite.js';
import images from './plugins/images.js';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const root = path.resolve(projectRoot, 'src');
const r = (p) => path.resolve(root, p);

// Каждая src/*.html автоматически становится отдельной страницей сборки
const pages = Object.fromEntries(
  fs
    .readdirSync(root)
    .filter((file) => file.endsWith('.html'))
    .map((file) => [path.parse(file).name, path.join(root, file)])
);

const IMG = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'ico'];
const FONT = ['woff', 'woff2', 'ttf', 'otf', 'eot'];

export default defineConfig({
  root,
  base: './', // относительные пути: сборку можно открыть откуда угодно
  publicDir: path.resolve(projectRoot, 'public'),
  envDir: projectRoot,

  plugins: [
    htmlInclude({ root }),
    svgSprite({ root }), // src/img/icons/*.svg → <symbol id="icon-имя">
    images({ quality: 80, webp: true }), // сжатие + webp + <picture> (только build)
  ],

  resolve: {
    alias: {
      '@': root,
      '@img': r('img'),
      '@fonts': r('fonts'),
      '@scss': r('scss'),
      '@js': r('js'),
    },
  },

  css: {
    devSourcemap: true,
    postcss: { plugins: [autoprefixer()] },
  },

  server: { open: true, host: true },

  build: {
    outDir: path.resolve(projectRoot, 'dist'),
    emptyOutDir: true,
    assetsInlineLimit: 0, // ничего не вшиваем в base64 — как в классической верстке
    rollupOptions: {
      input: pages,
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: ({ names, name }) => {
          const ext = path.extname(names?.[0] ?? name ?? '').slice(1).toLowerCase();
          if (ext === 'css') return 'css/[name]-[hash][extname]';
          if (IMG.includes(ext)) return 'img/[name]-[hash][extname]';
          if (FONT.includes(ext)) return 'fonts/[name]-[hash][extname]';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
