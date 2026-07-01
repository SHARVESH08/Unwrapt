/* The bundled default audio library.
 *
 * Givers can ship sound with zero effort by referencing "default:<name>".
 * Drop royalty-free tracks into `public/assets/audio/` matching these paths.
 * If a file is missing, playback simply stays silent (the player never breaks).
 *
 * A custom track is any other string — a direct URL (or a resolved Drive link). */

export const DEFAULT_AUDIO: Record<string, string> = {
  "soft-loop": "/assets/audio/default-soft-loop.mp3",
  "warm-ending": "/assets/audio/default-warm-ending.mp3",
  "love-ending": "/assets/audio/default-love-ending.mp3",
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
