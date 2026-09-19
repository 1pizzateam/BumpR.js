/** Shared cap for interactive examples to conserve CPU. */
export const CANVAS_FPS_CAP = 30;

/** Colors that track the active VitePress color scheme. */
export function palette() {
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  return {
    dark,
    surface: dark ? '#1b1b1f' : '#ffffff',
    grid: dark ? '#2e2e32' : '#eceef1',
    gridHighlight: dark ? 'rgba(255, 107, 107, 0.25)' : 'rgba(255, 107, 107, 0.15)',
    guide: dark ? '#4a4a52' : '#c6cad1',
    text: dark ? '#c9c9cd' : '#3c3c43',
    accent: '#ff6b6b', // BumpR red/coral theme
    accentGlow: dark ? 'rgba(255, 107, 107, 0.35)' : 'rgba(255, 107, 107, 0.25)',
    blue: '#5b8cff',
    warm: '#ff9f43',
    fresh: '#38c793',
    bodyFill: dark ? '#2a2b36' : '#f0f2f5',
    bodyStroke: dark ? '#85899c' : '#575b6e',
  };
}

/**
 * Run draw() with a device-pixel-ratio aware context and requestAnimationFrame loop.
 * Returns a teardown function.
 */
export function startCanvas(canvas, draw, { fps = CANVAS_FPS_CAP } = {}) {
  const context = canvas.getContext('2d');
  const state = { width: 0, height: 0, time: 0, lastTime: 0, pointer: null };
  let animId = null;
  let isRunning = false;
  const frameInterval = fps > 0 ? 1000 / fps : 0;
  let lastFrameTime = 0;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    state.width = width;
    state.height = height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function movePointer(event) {
    const rect = canvas.getBoundingClientRect();
    state.pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function clearPointer() {
    state.pointer = null;
  }

  function loop(now) {
    if (!isRunning) return;
    animId = requestAnimationFrame(loop);

    if (frameInterval > 0) {
      const elapsed = now - lastFrameTime;
      if (elapsed < frameInterval) return;
      lastFrameTime = now - (elapsed % frameInterval);
    }

    state.time = now * 0.001;
    context.clearRect(0, 0, state.width, state.height);
    draw(context, state, palette());
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    lastFrameTime = performance.now();
    animId = requestAnimationFrame(loop);
  }

  function stop() {
    isRunning = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  const visibilityObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) start();
    else stop();
  });
  visibilityObserver.observe(canvas);

  canvas.addEventListener('pointermove', movePointer);
  canvas.addEventListener('pointerleave', clearPointer);

  resize();
  start();

  return () => {
    stop();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    canvas.removeEventListener('pointermove', movePointer);
    canvas.removeEventListener('pointerleave', clearPointer);
  };
}

/** Draw a caption in the canvas. */
export function label(context, text, color, x = 12, y = 20) {
  context.font = '12px ui-monospace, SFMono-Regular, Menlo, monospace';
  context.fillStyle = color;
  context.fillText(text, x, y);
}
