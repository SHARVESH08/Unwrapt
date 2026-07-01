/* Adventure planning.
 *
 * Decides how many of each activity type fill the adventure, and how long the
 * adventure is — driven by the giver's AdventureSettings and how much content
 * they entered. Guarantees no item repeats WITHIN a single playthrough: any
 * surplus content is what the shuffle rotates in across replays. */

import type { ActivityKind } from "./types";
import type { GiftContent, AdventureSettings } from "../types/gift";

export const ROUND_SIZE = 8; // activities per chapter
export const MAX_ROUNDS = 8;
export const MAX_LENGTH = ROUND_SIZE * MAX_ROUNDS; // 64
export const MIN_LENGTH = ROUND_SIZE; // 8

export const BALLOON_PER_GAME = 6;

/* The original tuned distribution — used as relative weights. */
const WEIGHT: Record<ActivityKind, number> = {
  trivia: 18,
  sentence: 14,
  memory: 16,
  jigsaw: 4,
  wordsearch: 4,
  cardmatch: 4,
  balloon: 4,
};

const floorTo = (n: number, step: number) => Math.floor(n / step) * step;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Unique items available per kind (what can be used without repeating). */
export function availableCounts(
  content: GiftContent,
  photoCount: number,
): Record<ActivityKind, number> {
  return {
    trivia: content.trivia.length,
    sentence: content.sentences.length,
    memory: content.memoryCaptions.length, // photo comes from a reshuffling bag
    jigsaw: photoCount > 0 ? MAX_LENGTH : 0, // only needs a photo
    wordsearch: content.wordsearch.length,
    cardmatch: content.cardmatch.length,
    balloon: Math.floor(content.balloonWords.length / BALLOON_PER_GAME),
  };
}

export interface AdventurePlan {
  counts: Record<ActivityKind, number>;
  kinds: ActivityKind[]; // enabled + usable, in canonical order
  length: number;
  rounds: number;
}

/** Distribute `length` slots across `kinds` by weight, each capped by `cap`. */
function allocate(
  length: number,
  kinds: ActivityKind[],
  cap: Record<ActivityKind, number>,
): Record<ActivityKind, number> {
  const counts = Object.fromEntries(kinds.map((k) => [k, 0])) as Record<ActivityKind, number>;
  let remaining = length;

  // Water-fill by weight, respecting caps, until we run out of slots or capacity.
  // A few passes converge because caps redistribute leftover weight.
  for (let pass = 0; pass < 6 && remaining > 0; pass++) {
    const open = kinds.filter((k) => counts[k] < cap[k]);
    if (open.length === 0) break;
    const wsum = open.reduce((s, k) => s + WEIGHT[k], 0);

    const before = remaining;
    // Largest-remainder rounding for this pass.
    const want = open.map((k) => {
      const ideal = (remaining * WEIGHT[k]) / wsum;
      const give = Math.min(cap[k] - counts[k], Math.floor(ideal));
      return { k, give, frac: ideal - Math.floor(ideal) };
    });
    for (const { k, give } of want) {
      counts[k] += give;
      remaining -= give;
    }
    // Hand out leftover one-by-one to the highest fractional parts that still fit.
    want
      .sort((a, b) => b.frac - a.frac)
      .forEach(({ k }) => {
        if (remaining > 0 && counts[k] < cap[k]) {
          counts[k] += 1;
          remaining -= 1;
        }
      });
    if (remaining === before) break; // no progress
  }
  return counts;
}

/** Build the plan for the given content + settings. */
export function buildAdventurePlan(
  content: GiftContent,
  photoCount: number,
  settings: AdventureSettings,
): AdventurePlan {
  const avail = availableCounts(content, photoCount);
  // Preserve the giver's chosen order (used for the fixed rotation).
  const kinds = settings.enabledGames.filter((k) => avail[k] > 0);

  if (kinds.length === 0) {
    return { counts: {} as Record<ActivityKind, number>, kinds: [], length: 0, rounds: 0 };
  }

  let length: number;
  if (settings.autoScale) {
    // As much as the content supports (capped at the original weight), to 64.
    const supported = kinds.reduce((s, k) => s + Math.min(avail[k], WEIGHT[k]), 0);
    length = clamp(floorTo(supported, ROUND_SIZE), MIN_LENGTH, MAX_LENGTH);
  } else {
    length = clamp(floorTo(settings.length, ROUND_SIZE), MIN_LENGTH, MAX_LENGTH);
  }

  // Never repeat within a play: cap each kind by what's available.
  const counts = allocate(length, kinds, avail);

  // The true length is whatever we could allocate (may be < requested if the
  // giver hasn't added enough — the requirements check warns them first).
  // Snap down to a clean chapter multiple, but keep a sub-chapter remainder
  // playable rather than trimming it to zero.
  const total = kinds.reduce((s, k) => s + counts[k], 0);
  const realLength = total >= ROUND_SIZE ? floorTo(total, ROUND_SIZE) : total;

  // Trim surplus counts down to the realLength.
  let trim = total - realLength;
  for (const k of [...kinds].reverse()) {
    while (trim > 0 && counts[k] > 0) {
      counts[k] -= 1;
      trim -= 1;
    }
  }

  return {
    counts,
    kinds,
    length: realLength,
    rounds: Math.max(1, Math.ceil(realLength / ROUND_SIZE)),
  };
}

export interface KindRequirement {
  kind: ActivityKind;
  label: string;
  required: number;
  have: number;
  ok: boolean;
}

const KIND_LABEL: Record<ActivityKind, string> = {
  trivia: "Trivia questions",
  sentence: "Fill-in sentences",
  memory: "Photo captions",
  jigsaw: "Photos (for jigsaw)",
  wordsearch: "Word-search boards",
  cardmatch: "Card-match games",
  balloon: "Balloon words (×6 per game)",
};

/** What the giver needs for the CHOSEN length (used by the save gate + popup). */
export function requirementsFor(
  content: GiftContent,
  photoCount: number,
  settings: AdventureSettings,
): { requirements: KindRequirement[]; allMet: boolean; length: number } {
  const avail = availableCounts(content, photoCount);

  // Target the requested length (not the auto-trimmed one) so we tell the giver
  // exactly what to add to reach it.
  const targetSettings: AdventureSettings = settings.autoScale
    ? { ...settings, autoScale: false, length: MAX_LENGTH }
    : settings;
  const kinds = settings.enabledGames.slice();

  // Ideal allocation ignoring caps, to express the per-segment minimum.
  const requested = settings.autoScale
    ? // auto-scale never forces repeats, so the minimum is just "at least 1 of
      // each enabled, plenty for variety" — recommend a small floor.
      Object.fromEntries(kinds.map((k) => [k, k === "balloon" ? BALLOON_PER_GAME : 1])) as Record<ActivityKind, number>
    : allocate(
        clamp(floorTo(targetSettings.length, ROUND_SIZE), MIN_LENGTH, MAX_LENGTH),
        kinds,
        Object.fromEntries(kinds.map((k) => [k, MAX_LENGTH])) as Record<ActivityKind, number>,
      );

  const requirements: KindRequirement[] = kinds.map((k) => {
    const required = k === "balloon"
      ? requested[k] * BALLOON_PER_GAME // express balloons as words needed
      : requested[k];
    const have = k === "balloon" ? content.balloonWords.length : avail[k];
    return { kind: k, label: KIND_LABEL[k], required, have, ok: have >= required };
  });

  return {
    requirements,
    allMet: requirements.every((r) => r.ok),
    length: clamp(floorTo(targetSettings.length, ROUND_SIZE), MIN_LENGTH, MAX_LENGTH),
  };
}
