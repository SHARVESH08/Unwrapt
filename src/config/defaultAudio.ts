/* The bundled default audio library.
 *
 * Givers can ship sound with zero effort by referencing "default:<name>".
 * The default tracks are public-domain recordings (ragtime piano rolls and
 * US military band performances), hotlinked from Wikimedia Commons (which
 * serves them with open CORS), so no heavy audio lives in the repo. If a URL
 * ever fails, playback simply stays silent and the player never breaks. A
 * custom track is any other string: a direct URL, or a resolved Drive link. */

import type { Occasion } from "../types/gift";

export const DEFAULT_AUDIO: Record<string, string> = {
  // Background loops, one distinct upbeat piece per occasion (see defaultAudioForOccasion).
  "soft-loop": // Brahms, Hungarian Dance No. 1 (lively, generic/custom fallback)
    "https://upload.wikimedia.org/wikipedia/commons/2/23/Hungarian_Dance_No._1_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3",
  "birthday-loop": // Joplin, The Entertainer (cheerful ragtime)
    "https://upload.wikimedia.org/wikipedia/commons/6/6d/Scott_Joplin_-_04_-_The_Entertainer_1902_piano_roll.mp3",
  "anniversary-loop": // Strauss, The Blue Danube (celebratory waltz)
    "https://upload.wikimedia.org/wikipedia/commons/d/d4/%22An_der_sch%C3%B6nen%2C_blauen_Donau%22_performed_by_the_U.S._Marine_Band.mp3",
  "proposal-loop": // Pachelbel, Canon in D (warm, builds)
    "https://upload.wikimedia.org/wikipedia/commons/1/12/Canon_%282004%29_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3",
  "justbecause-loop": // Joplin, Maple Leaf Rag (playful ragtime)
    "https://upload.wikimedia.org/wikipedia/commons/5/57/Maple_Leaf_Rag_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3",
  // Finale endings.
  "warm-ending": // Chabrier, Espana (festive finish)
    "https://upload.wikimedia.org/wikipedia/commons/2/25/Espana_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3",
  "love-ending": // Brahms, Hungarian Dance No. 4 (emotional swell)
    "https://upload.wikimedia.org/wikipedia/commons/6/6a/Hungarian_Dance_No._4_-_Strolling_Strings_-_United_States_Air_Force_Band.mp3",
};

const DEFAULT_PREFIX = "default:";

/** Resolve an AudioRef to a playable URL ("" if unknown → silent). */
export function resolveAudio(ref: string | undefined): string {
  if (!ref) return "";
  if (ref.startsWith(DEFAULT_PREFIX)) {
    return DEFAULT_AUDIO[ref.slice(DEFAULT_PREFIX.length)] ?? "";
  }
  return ref;
}

/* Per-occasion default background song, so a birthday and a proposal don't
 * share the same track. Endings stay shared (warm normal, love special). */
const OCCASION_LOOP: Record<Occasion, string> = {
  birthday: "default:birthday-loop",
  anniversary: "default:anniversary-loop",
  proposal: "default:proposal-loop",
  justBecause: "default:justbecause-loop",
  custom: "default:soft-loop",
};

export function defaultAudioForOccasion(occasion: Occasion): {
  loop: string;
  normalEnding: string;
  specialEnding: string;
} {
  return {
    loop: OCCASION_LOOP[occasion] ?? "default:soft-loop",
    normalEnding: "default:warm-ending",
    specialEnding: "default:love-ending",
  };
}
