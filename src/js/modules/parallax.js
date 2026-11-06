// Параллакс: по прокрутке и по движению мыши. Отключается при prefers-reduced-motion.
//
// По скроллу — слой внутри контейнера с overflow:hidden (слой делаем выше контейнера, см. .parallax):
//   <div class="parallax"><div class="parallax__bg" data-parallax="0.3"></div> …</div>
//   data-parallax — скорость, по умолчанию 0.2; отрицательная — движение в другую сторону.
//
// По мыши — контейнер и слои с глубиной (максимальное смещение ≈ глубина × 100px):
//   <div class="parallax-mouse" data-parallax-mouse>
//     <div class="parallax-mouse__layer" data-depth="0.1"></div>
//   </div>

function initScroll(layers) {
  const visible = new Set(); // родители слоёв, которые сейчас в зоне видимости
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) =>
        entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target)
      ),
    { rootMargin: '20% 0px' }
  );
  layers.forEach((layer) => observer.observe(layer.parentElement));

  const update = () => {
    const half = window.innerHeight / 2;
    layers
      .filter((layer) => visible.has(layer.parentElement))
      .forEach((layer) => {
        const speed = Number(layer.dataset.parallax) || 0.2;
        const rect = layer.parentElement.getBoundingClientRect(); // родитель не двигается — нет обратной связи
        const shift = (rect.top + rect.height / 2 - half) * -speed;
        layer.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
      });
  };

  let ticking = false;
  const schedule = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  schedule();
}

function initMouse(zone) {
  const layers = [...zone.querySelectorAll('[data-depth]')];
  let frame = 0;

  zone.addEventListener('mousemove', (event) => {
    const rect = zone.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      layers.forEach((layer) => {
        const depth = Number(layer.dataset.depth) || 0.05;
        layer.style.transform = `translate3d(${-x * depth * 200}px, ${-y * depth * 200}px, 0)`;
      });
    });
  });

  zone.addEventListener('mouseleave', () => {
    layers.forEach((layer) => (layer.style.transform = ''));
  });
}

export function parallaxInit() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const layers = [...document.querySelectorAll('[data-parallax]')];
  if (layers.length) initScroll(layers);

  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('[data-parallax-mouse]').forEach(initMouse);
  }
}
