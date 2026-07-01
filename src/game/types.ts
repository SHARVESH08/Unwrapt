/* Shared data shapes used across the app.
 * (Editing words? You want content.ts, not this file.) */

export interface TriviaItem {
  question: string;
  correct: string;
  wrong: string[];
  funnyResponse: string;
}

export interface MemoryItem {
  caption: string;
}

export interface SentenceItem {
  stem: string;
  options: string[];
  correct: string;
}

/* The seven kinds of activity that can fill any slot. */
export type ActivityKind =
  | "memory"
  | "trivia"
  | "sentence"
  | "cardmatch"
  | "jigsaw"
  | "wordsearch"
  | "balloon";

/* A single playable slot in the 64-step sequence. Each kind carries only
 * the reference(s) it needs to render its content from the pools.
 * `photo` is a randomly-assigned image (for memory & jigsaw slots) and
 * `rewardPhoto` is the random image shown on the reward card after the slot. */
export interface Slot {
  kind: ActivityKind;
  triviaIndex?: number;
  memoryIndex?: number;
  sentenceIndex?: number;
  wordsearchIndex?: number;
  cardmatchIndex?: number;
  balloonWords?: string[];
  photo?: string;
  rewardPhoto?: string;
}

/* Persisted progress (see session.ts). */
export interface SessionState {
  seed: number;
  index: number; // 0..64 — how many slots completed
}

export const TOTAL_ROUNDS = 8;
export const ACTIVITIES_PER_ROUND = 8;
export const TOTAL_SLOTS = TOTAL_ROUNDS * ACTIVITIES_PER_ROUND; // 64
