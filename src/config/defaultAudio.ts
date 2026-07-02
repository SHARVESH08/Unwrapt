/* The bundled default audio library.
 *
 * Givers can ship sound with zero effort by referencing "default:<name>".
 * The default tracks are CC0 (public-domain) solo-piano recordings from Musopen,
 * hotlinked from Wikimedia Commons (which serves them with open CORS), so no
 * heavy audio lives in the repo. If a URL ever fails, playback simply stays
 * silent and the player never breaks. A custom track is any other string: a
 * direct URL, or a resolved Drive link. */

import type { Occasion } from "../types/gift";

export const DEFAULT_AUDIO: Record<string, string> = {
  // Background loops, one distinct piece per occasion (see defaultAudioForOccasion).
  "soft-loop": // Chopin, Impromptu No. 2 (gentle, generic/custom fallback)
    "https://upload.wikimedia.org/wikipedia/commons/1/1e/Impromptu_no._2_-_Op._36.mp3",
  "birthday-loop": // Chopin, Grande Valse Brillante (joyful waltz)
    "https://upload.wikimedia.org/wikipedia/commons/7/77/Grande_Valse_Brilliante_Op.18_In_E_flat_major.mp3",
  "anniversary-loop": // Chopin, Fantaisie-Impromptu (romantic)
    "https://upload.wikimedia.org/wikipedia/commons/2/2b/Fantaisie_Impromptu_Op._66.mp3",
  "proposal-loop": // Chopin, Ballade No. 1 (builds to a swell)
    "https://upload.wikimedia.org/wikipedia/commons/1/1b/Ballade_no._1_-_Op._23.mp3",
  "justbecause-loop": // Chopin, Impromptu No. 1 (light, sweet)
    "https://upload.wikimedia.org/wikipedia/commons/9/9a/Impromptu_no._1_-_Op._29.mp3",
  // Finale endings.
  "warm-ending": // Chopin, Mazurka Op. 17 No. 3 (tender resolution)
    "https://upload.wikimedia.org/wikipedia/commons/8/8d/Mazurka_Op._17_no._3_in_A_flat_major.mp3",
  "love-ending": // Chopin, Ballade No. 4 (emotional swell)
    "https://upload.wikimedia.org/wikipedia/commons/2/2f/Ballade_no._4_-_Op._52.mp3",
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
