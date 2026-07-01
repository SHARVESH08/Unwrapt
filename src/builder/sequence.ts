/* Helpers for hand-ordered ("manual") adventures.
 *
 * A manual sequence is an explicit, reorderable list of SlotSpecs — one per
 * specific activity. We can build the full default list from the content, keep
 * it reconciled as the giver edits content, and label each entry for the UI. */

import type { ActivityKind } from "../game/types";
import type { GiftContent, SlotSpec } from "../types/gift";
import { BALLOON_PER_GAME } from "../game/plan";

/** How many jigsaw instances to offer by default (each just needs a photo). */
export const JIGSAW_DEFAULT = 4;

export const specId = (s: SlotSpec): string => `${s.kind}:${s.ref}`;

/** Every selectable activity for the given content + enabled games, in order. */
export function fullSpecs(
  content: GiftContent,
  enabledGames: ActivityKind[],
  photoCount: number,
): SlotSpec[] {
  const out: SlotSpec[] = [];
  for (const kind of enabledGames) {
    switch (kind) {
      case "trivia":
        content.trivia.forEach((_, i) => out.push({ kind, ref: i }));
        break;
      case "sentence":
        content.sentences.forEach((_, i) => out.push({ kind, ref: i }));
        break;
      case "memory":
        content.memoryCaptions.forEach((_, i) => out.push({ kind, ref: i }));
        break;
      case "wordsearch":
        content.wordsearch.forEach((_, i) => out.push({ kind, ref: i }));
        break;
      case "cardmatch":
        content.cardmatch.forEach((_, i) => out.push({ kind, ref: i }));
        break;
      case "balloon": {
        const groups = Math.floor(content.balloonWords.length / BALLOON_PER_GAME);
        for (let g = 0; g < groups; g++) out.push({ kind, ref: g });
        break;
      }
      case "jigsaw": {
        const n = photoCount > 0 ? Math.min(photoCount, JIGSAW_DEFAULT) : 0;
        for (let j = 0; j < n; j++) out.push({ kind, ref: j });
        break;
      }
    }
  }
  return out;
}

/** Keep an existing hand-ordered list valid as content/enabled games change:
 * drop specs that no longer exist, append newly-available ones at the end. */
export function reconcileSequence(
  existing: SlotSpec[] | undefined,
  content: GiftContent,
  enabledGames: ActivityKind[],
  photoCount: number,
): SlotSpec[] {
  const full = fullSpecs(content, enabledGames, photoCount);
  if (!existing) return full;
  const fullIds = new Set(full.map(specId));
  const existingIds = new Set(existing.map(specId));
  const kept = existing.filter(
    (s) => fullIds.has(specId(s)) && enabledGames.includes(s.kind),
  );
  const added = full.filter((s) => !existingIds.has(specId(s)));
  return [...kept, ...added];
}

const KIND_SHORT: Record<ActivityKind, string> = {
  trivia: "Trivia",
  sentence: "Sentence",
  memory: "Memory",
  jigsaw: "Jigsaw",
  wordsearch: "Word search",
  cardmatch: "Card match",
  balloon: "Balloon pop",
};

/** A short label + kind for one spec, for the sequence editor rows. */
export function specLabel(
  s: SlotSpec,
  content: GiftContent,
): { kind: string; text: string } {
  const kind = KIND_SHORT[s.kind];
  switch (s.kind) {
    case "trivia":
      return { kind, text: content.trivia[s.ref]?.question || "—" };
    case "sentence":
      return { kind, text: content.sentences[s.ref]?.stem || "—" };
    case "memory":
      return { kind, text: content.memoryCaptions[s.ref] || "—" };
    case "wordsearch":
      return { kind, text: `Board ${s.ref + 1}` };
    case "cardmatch":
      return { kind, text: `Game ${s.ref + 1}` };
    case "balloon":
      return { kind, text: `Set ${s.ref + 1}` };
    case "jigsaw":
      return { kind, text: `Photo puzzle ${s.ref + 1}` };
  }
}
