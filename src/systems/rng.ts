/**
 * Simple mulberry32 seeded PRNG.
 * Call seedRng(seed) at run start; then use seededRandom() in place of Math.random()
 * wherever reproducible results are needed (incident spawning, district selection).
 */

let _state = 0;

function hashSeed(seed: string): number {
  let h = 0x9747b28c;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x9e3779b9);
    h ^= h >>> 16;
  }
  const result = h >>> 0;
  return result === 0 ? 1 : result;
}

export function seedRng(seed: string): void {
  _state = hashSeed(seed);
}

export function seededRandom(): number {
  _state = (_state + 0x6d2b79f5) | 0;
  let t = Math.imul(_state ^ (_state >>> 15), 1 | _state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
