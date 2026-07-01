/* Session & progress.
 *
 * The adventure sequence is generated once from a random seed + the gift's
 * AdventureSettings, then the seed and progress are stored in the browser
 * (localStorage), namespaced per gift. On every revisit we rebuild the identical
 * sequence and resume where she left off. Finishing clears the seed so the next
 * play-through reshuffles. */

import type { GiftContent, AdventureSettings } from "../types/gift";
import type { ActivityKind, Slot, SessionState } from "./types";
import { makeRng, shuffle, randomSeed } from "./shuffle";
import { buildAdventurePlan, BALLOON_PER_GAME, ROUND_SIZE } from "./plan";

const KEY_PREFIX = "gift";

function keys(giftKey: string) {
  const base = `${KEY_PREFIX}_${giftKey}`;
  return { seed: `${base}_seed`, index: `${base}_index`, unlocked: `${base}_unlocked` };
}

/* A reshuffling "bag" of photos: hands out images one at a time, reshuffling a
 * fresh copy each time it empties, so the same photo never repeats within a
 * pass. Returns undefined when no photos exist (a placeholder frame shows). */
function makePhotoBag(photos: string[], rng: () => number): () => string | undefined {
  let bag: string[] = [];
  return () => {
    if (photos.length === 0) return undefined;
    if (bag.length === 0) bag = shuffle(photos, rng);
    return bag.shift();
  };
}

/** Build the deterministic adventure for a given seed + content + settings. */
export function buildSequence(
  content: GiftContent,
  photos: string[],
  seed: number,
  settings: AdventureSettings,
): Slot[] {
  const rng = makeRng(seed);

  // Hand-ordered adventure: play exactly the giver's sequence, in order.
  if (!settings.randomGameOrder && settings.manualSequence?.length) {
    const seq: Slot[] = [];
    for (const spec of settings.manualSequence) {
      switch (spec.kind) {
        case "trivia":
          if (content.trivia[spec.ref]) seq.push({ kind: "trivia", triviaIndex: spec.ref });
          break;
        case "sentence":
          if (content.sentences[spec.ref]) seq.push({ kind: "sentence", sentenceIndex: spec.ref });
          break;
        case "memory":
          if (content.memoryCaptions[spec.ref] != null) seq.push({ kind: "memory", memoryIndex: spec.ref });
          break;
        case "wordsearch":
          if (content.wordsearch[spec.ref]) seq.push({ kind: "wordsearch", wordsearchIndex: spec.ref });
          break;
        case "cardmatch":
          if (content.cardmatch[spec.ref]) seq.push({ kind: "cardmatch", cardmatchIndex: spec.ref });
          break;
        case "jigsaw":
          seq.push({ kind: "jigsaw" });
          break;
        case "balloon": {
          const start = spec.ref * BALLOON_PER_GAME;
          const chunk = content.balloonWords.slice(start, start + BALLOON_PER_GAME);
          if (chunk.length) seq.push({ kind: "balloon", balloonWords: chunk });
          break;
        }
      }
    }
    return assignPhotos(seq, photos, rng);
  }

  const plan = buildAdventurePlan(content, photos.length, settings);
  if (plan.length === 0) return [];

  // Pick `count` distinct indices from a pool, shuffled or in entered order.
  const pickIdx = (poolLen: number, count: number): number[] => {
    const idx = Array.from({ length: poolLen }, (_, i) => i);
    const order = settings.shuffleContent ? shuffle(idx, rng) : idx;
    return order.slice(0, count);
  };

  // Build the slots for each kind separately (so we can order them after).
  const byKind: Record<ActivityKind, Slot[]> = {
    trivia: [], sentence: [], memory: [], jigsaw: [], wordsearch: [], cardmatch: [], balloon: [],
  };

  for (const kind of plan.kinds) {
    const n = plan.counts[kind];
    if (!n) continue;
    switch (kind) {
      case "trivia":
        byKind.trivia = pickIdx(content.trivia.length, n).map((i) => ({ kind: "trivia", triviaIndex: i }));
        break;
      case "sentence":
        byKind.sentence = pickIdx(content.sentences.length, n).map((i) => ({ kind: "sentence", sentenceIndex: i }));
        break;
      case "memory":
        byKind.memory = pickIdx(content.memoryCaptions.length, n).map((i) => ({ kind: "memory", memoryIndex: i }));
        break;
      case "jigsaw":
        byKind.jigsaw = Array.from({ length: n }, () => ({ kind: "jigsaw" }));
        break;
      case "wordsearch":
        byKind.wordsearch = pickIdx(content.wordsearch.length, n).map((i) => ({ kind: "wordsearch", wordsearchIndex: i }));
        break;
      case "cardmatch":
        byKind.cardmatch = pickIdx(content.cardmatch.length, n).map((i) => ({ kind: "cardmatch", cardmatchIndex: i }));
        break;
      case "balloon": {
        const words = settings.shuffleContent ? shuffle(content.balloonWords, rng) : content.balloonWords.slice();
        byKind.balloon = Array.from({ length: n }, (_, g) => ({
          kind: "balloon",
          balloonWords: words.slice(g * BALLOON_PER_GAME, g * BALLOON_PER_GAME + BALLOON_PER_GAME),
        }));
        break;
      }
    }
  }

  // Order the slots: random mix, or a fixed even rotation across the kinds.
  let seq: Slot[];
  if (settings.randomGameOrder) {
    seq = shuffle(plan.kinds.flatMap((k) => byKind[k]), rng);
  } else {
    seq = [];
    const queues = plan.kinds.map((k) => byKind[k].slice());
    let remaining = queues.reduce((s, q) => s + q.length, 0);
    while (remaining > 0) {
      for (const q of queues) {
        const next = q.shift();
        if (next) {
          seq.push(next);
          remaining--;
        }
      }
    }
  }
  seq = seq.slice(0, plan.length);
  return assignPhotos(seq, photos, rng);
}

/* Hand out random photos: one bag for feature photos (memory + jigsaw), a
 * separate bag for the small reward-card photos. */
function assignPhotos(seq: Slot[], photos: string[], rng: () => number): Slot[] {
  const featureBag = makePhotoBag(photos, rng);
  const rewardBag = makePhotoBag(photos, rng);
  for (const slot of seq) {
    if (slot.kind === "memory" || slot.kind === "jigsaw") slot.photo = featureBag();
    slot.rewardPhoto = rewardBag();
  }
  return seq;
}

/** The per-chapter end photos, picked at random but stable for this seed. */
export function buildRoundEndPhotos(
  photos: string[],
  seed: number,
  rounds: number,
): (string | undefined)[] {
  const bag = makePhotoBag(photos, makeRng(seed + 9973));
  return Array.from({ length: rounds }, () => bag());
}

export { ROUND_SIZE };

function readSeed(giftKey: string): number | null {
  const raw = localStorage.getItem(keys(giftKey).seed);
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Load existing progress for this gift, or start a fresh adventure. The raw
 * index is clamped against the rebuilt sequence length back in the player. */
export function loadSession(giftKey: string): SessionState {
  const k = keys(giftKey);
  let seed = readSeed(giftKey);
  if (seed === null) {
    seed = randomSeed();
    localStorage.setItem(k.seed, String(seed));
    localStorage.setItem(k.index, "0");
  }
  const idxRaw = Number(localStorage.getItem(k.index));
  const index = Number.isFinite(idxRaw) ? Math.max(idxRaw, 0) : 0;
  return { seed, index };
}

export function saveIndex(giftKey: string, index: number): void {
  localStorage.setItem(keys(giftKey).index, String(index));
}

export function saveUnlocked(giftKey: string, unlocked: boolean): void {
  localStorage.setItem(keys(giftKey).unlocked, unlocked ? "1" : "0");
}

export function loadUnlocked(giftKey: string): boolean {
  return localStorage.getItem(keys(giftKey).unlocked) === "1";
}

export function clearSession(giftKey: string): void {
  const k = keys(giftKey);
  localStorage.removeItem(k.seed);
  localStorage.removeItem(k.index);
  localStorage.removeItem(k.unlocked);
}
