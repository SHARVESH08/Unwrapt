/* Deterministic randomness.
 *
 * Everything here is seeded so the same `seed` always produces the same
 * 64-step adventure. That's what lets her close the tab and come back to
 * exactly where she left off, in the same order, every time. */

/** Mulberry32 — a tiny, fast, well-distributed seeded PRNG. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded Fisher–Yates shuffle. Returns a new array; input is untouched. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** A fresh random seed for a brand-new adventure. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
