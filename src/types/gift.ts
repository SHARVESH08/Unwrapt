/* The single shape everything hangs off of.
 *
 * The BUILDER writes a `GiftConfig`; the PLAYER reads it. The original app had
 * this baked into `content.ts` + `photos.ts`; here it is plain data so any gift
 * can be rendered by feeding a different config. NO personal data lives in code. */

import type { TriviaItem, SentenceItem, ActivityKind } from "../game/types";

/* A pointer to one specific activity, for hand-ordered adventures.
 * `ref` indexes that kind's pool (trivia/sentence/memory/wordsearch/cardmatch),
 * a balloon set, or a jigsaw instance. */
export interface SlotSpec {
  kind: ActivityKind;
  ref: number;
}

/* How the adventure is assembled — all giver-controllable. */
export interface AdventureSettings {
  /** Derive the adventure length from how much content was entered. */
  autoScale: boolean;
  /** Used when autoScale is false. A multiple of 8 (one chapter), 8–64. */
  length: number;
  /** Shuffle which items appear and their order; off = use entered order. */
  shuffleContent: boolean;
  /** Mix the activity types randomly; off = the giver hand-orders every activity. */
  randomGameOrder: boolean;
  /** Which of the 7 activity types may appear (order = fixed-rotation order). */
  enabledGames: ActivityKind[];
  /** The exact, hand-ordered activity sequence used when randomGameOrder is off. */
  manualSequence?: SlotSpec[];
  /** Occasion-themed ambient surprises (cake/candles, hearts, …). */
  surprises: boolean;
  /** Extra emojis the giver wants drifting in alongside the occasion set. */
  customEmojis?: string[];
}

export const ALL_ACTIVITY_KINDS: ActivityKind[] = [
  "trivia",
  "sentence",
  "memory",
  "jigsaw",
  "wordsearch",
  "cardmatch",
  "balloon",
];

export const DEFAULT_ADVENTURE_SETTINGS: AdventureSettings = {
  autoScale: true,
  length: 64,
  shuffleContent: true,
  randomGameOrder: true,
  enabledGames: [...ALL_ACTIVITY_KINDS],
  manualSequence: undefined,
  surprises: true,
  customEmojis: [],
};

export type Occasion =
  | "birthday"
  | "anniversary"
  | "proposal"
  | "justBecause"
  | "custom";

export type GiftMode = "normal" | "proposal";

/* The closing words shown on the final screen. */
export interface FinaleText {
  bigText: string;
  subText: string;
}

/* Everything the adventure SAYS. Mirrors the old content.ts pools 1:1. */
export interface GiftContent {
  trivia: TriviaItem[];
  sentences: SentenceItem[];
  /** One caption per "memory" reveal (paired with a random photo at runtime). */
  memoryCaptions: string[];
  /** Each entry is one board's worth of words. */
  wordsearch: string[][];
  /** Each entry is one game's flat pair list (items 0&1, 2&3, … belong together). */
  cardmatch: string[][];
  balloonWords: string[];
  rewardMessages: string[];
  /** Exactly 8 — one per chapter. */
  roundEndMessages: string[];
  finale: {
    normal: FinaleText;
    /** Proposal only — shown when the secret code matched. */
    special?: FinaleText;
  };
}

/* A reference to an audio track: either a direct URL, or "default:<name>"
 * pointing into the bundled royalty-free library (see config/defaultAudio.ts). */
export type AudioRef = string;

export interface GiftMedia {
  /** Source of truth for photos (Drive folder link). Resolved at save time. */
  photosFolderUrl?: string;
  /** Resolved, directly-usable image URLs (what the player actually shows). */
  photoUrls: string[];
  /** Proposal only — the three finale images. */
  finalePhotos?: {
    /** Shown if the code was NOT matched. */
    normal: string;
    /** Shown if the code matched (tappable). */
    special: string;
    /** What the special image becomes on tap. */
    specialOnClick: string;
  };
  audio: {
    loop: AudioRef;
    normalEnding: AudioRef;
    /** Proposal only. */
    specialEnding?: AudioRef;
  };
}

export interface GiftConfig {
  id: string;
  /** 8-char shareable code (not guessable). */
  giftNumber: string;
  ownerId: string;

  occasion: Occasion;
  mode: GiftMode;
  recipientName: string;
  /** Proposal only — unlocks the special ending. */
  secretCode?: string;
  /** Optional palette choice; falls back to the occasion default. */
  theme?: string;

  usePremadeQuestions: boolean;
  settings: AdventureSettings;
  content: GiftContent;
  media: GiftMedia;

  createdAt: string;
  updatedAt: string;
}
