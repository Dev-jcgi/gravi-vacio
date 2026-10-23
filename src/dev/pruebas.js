// Utilidades de prueba en desarrollo (no se importan en el juego):
//   await import('/src/dev/pruebas.js')  desde la consola del navegador
const ev = (type, code) => {
  const e = new KeyboardEvent(type, { bubbles: true });
  Object.defineProperty(e, 'keyCode', { get: () => code });
  Object.defineProperty(e, 'which', { get: () => code });
  window.dispatchEvent(e);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hold = async (codes, ms) => {
  codes.forEach((c) => ev('keydown', c));
  await sleep(ms);
  codes.forEach((c) => ev('keyup', c));
};
const ir = async (k, intro = true) => {
  const g = window.__GRAVI_GAME__;
  while (!g.scene.getScenes(true).some((s) => ['Privacidad', 'Prologo', 'Menu'].includes(s.scene.key) || s.scene.key !== 'Boot')) await sleep(200);
  while (g.scene.isActive('Boot')) await sleep(200);
  if (g.scene.isActive(k)) {
    g.scene.getScene(k).scene.restart();
  } else {
    g.scene.getScenes(true).forEach((s) => s.scene.stop());
    g.scene.start(k);
  }
  await sleep(1500);
  const t = g.scene.getScene(k);
  if (intro) t.terminarIntro?.();
  return t;
};
Object.assign(window, { ev, sleep, hold, ir });
