/**
 * Gravi en el Vacío — Generador de Números Pseudoaleatorios (PRNG) Determinista
 * Algoritmo Mulberry32: garantiza que la misma semilla genere exactamente la misma torre.
 */

export function createRNG(seed = Date.now()) {
  let s = Math.floor(Math.abs(seed)) || 123456789;

  function next() {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    seed: s,
    next,
    float(min = 0, max = 1) {
      return min + next() * (max - min);
    },
    int(min, max) {
      return Math.floor(min + next() * (max - min + 1));
    },
    pick(array) {
      if (!array || array.length === 0) return null;
      return array[Math.floor(next() * array.length)];
    },
    shuffle(array) {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
  };
}
