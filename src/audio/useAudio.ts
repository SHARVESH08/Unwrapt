/* Sound.
 *
 * A gentle background loop that plays through the chapters. Browsers only allow
 * audio to start after the visitor has interacted with the page, so playback is
 * kicked off on the first click/confirm — never automatically on load.
 *
 * The two ending tracks (normal / special) are handled inside the Finale
 * component, because their timing is tied to the reveal. */

import { useCallback, useEffect, useRef, useState } from "react";

const BACKGROUND_VOLUME = 0.32;

function fade(
  el: HTMLAudioElement,
  to: number,
  ms: number,
  onDone?: () => void,
) {
  const from = el.volume;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    el.volume = Math.max(0, Math.min(1, from + (to - from) * t));
    if (t < 1) requestAnimationFrame(step);
    else onDone?.();
  };
  requestAnimationFrame(step);
}

export interface AudioControls {
  enabled: boolean;
  toggle: () => void;
  /** Begin the background loop (call on first interaction). */
  startBackground: () => void;
  /** Fade the background out over `ms`, resolving when silent. */
  fadeOutBackground: (ms: number) => Promise<void>;
}

/**
 * @param loopUrl Resolved URL for the background loop (from the gift config).
 *   Empty string → the player runs silently (no background music).
 */
export function useAudio(loopUrl: string): AudioControls {
  const [enabled, setEnabled] = useState(true);
  const bgRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);
  const enabledRef = useRef(enabled);

  // Build the background audio element once per loop URL.
  useEffect(() => {
    if (!loopUrl) {
      bgRef.current = null;
      return;
    }
    const bg = new Audio(loopUrl);
    bg.loop = true;
    bg.volume = 0;
    bg.preload = "auto";
    bgRef.current = bg;
    return () => {
      bg.pause();
      bgRef.current = null;
    };
  }, [loopUrl]);

  // Mirror `enabled` and pause/resume the loop when it's toggled.
  useEffect(() => {
    enabledRef.current = enabled;
    const bg = bgRef.current;
    if (!enabled) {
      bg?.pause();
    } else if (startedRef.current && bg && bg.paused) {
      bg.play().catch(() => {});
    }
  }, [enabled]);

  const startBackground = useCallback(() => {
    const bg = bgRef.current;
    if (!bg || startedRef.current) return;
    startedRef.current = true;
    if (!enabledRef.current) return;
    bg.play().catch(() => {});
    fade(bg, BACKGROUND_VOLUME, 1800);
  }, []);

  const fadeOutBackground = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      const bg = bgRef.current;
      if (!bg) return resolve();
      fade(bg, 0, ms, () => {
        bg.pause();
        resolve();
      });
    });
  }, []);

  const toggle = useCallback(() => setEnabled((e) => !e), []);

  return { enabled, toggle, startBackground, fadeOutBackground };
}
