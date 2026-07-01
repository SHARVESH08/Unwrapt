import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star } from "lucide-react";
import confetti from "canvas-confetti";
import { useGift } from "../config/GiftContext";
import { resolveAudio } from "../config/defaultAudio";
import { ShimmerText } from "./ui/ShimmerText";

/* The eight chapter accent colours (Lumina arc), gathered for the very end. */
const ROUND_COLORS = [
  "#ff9ec9", "#ff9a8f", "#ff6bd6", "#b07bff",
  "#5cf0d0", "#7c9bff", "#c46bff", "#ff7cc6",
];

const LINES = ["You made it.", "Every single one.", "This was all for you."];

/* The special track holds here until she taps the photo, then continues. */
const SPECIAL_PAUSE_AT = 28; // seconds
const FINALE_VOLUME = 0.7;

/* Closing-words shimmer. The secret-code ending is pink + blue; the plain
 * ending is the warm gold/coral palette with a little extra pink. */
const SECRET_TEXT_GRADIENT =
  "linear-gradient(110deg, #ff7eb3 12%, #c9a3ff 27%, #7ec8ff 42%, #ffffff 50%, #ff9ec4 64%, #7aa8ff 80%, #ff7eb3 94%)";
const NORMAL_TEXT_GRADIENT =
  "linear-gradient(110deg, #ffb14d 12%, #ff9ec4 27%, #ffd166 41%, #ffffff 50%, #ff7eb3 64%, #ffb14d 80%, #ffd166 94%)";

/* Smoothly ramp an audio element's volume to `to` over `ms`. */
function fadeEl(
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

/* Loop a track seamlessly: two players overlap and crossfade near the end of
 * each pass, so it never has the hard click of a plain loop. Returns a stop fn. */
function startCrossfadeLoop(src: string, targetVol: number, firstFadeMs: number) {
  const CROSSFADE_S = 4;
  const els = [new Audio(src), new Audio(src)];
  els.forEach((e) => {
    e.preload = "auto";
    e.volume = 0;
  });
  let cur = 0;
  let crossing = false;
  let stopped = false;
  let raf = 0;

  const startEl = (i: number, fadeMs: number) => {
    const e = els[i];
    e.currentTime = 0;
    e.play().catch(() => {});
    fadeEl(e, targetVol, fadeMs);
  };

  const tick = () => {
    if (stopped) return;
    const e = els[cur];
    const dur = e.duration;
    if (dur && isFinite(dur) && !crossing && dur - e.currentTime <= CROSSFADE_S) {
      crossing = true;
      const next = 1 - cur;
      startEl(next, CROSSFADE_S * 1000); // fade the next pass in…
      fadeEl(e, 0, CROSSFADE_S * 1000, () => e.pause()); // …while this one fades out
      cur = next;
      window.setTimeout(() => {
        crossing = false;
      }, (CROSSFADE_S + 0.5) * 1000);
    }
    raf = requestAnimationFrame(tick);
  };

  startEl(0, firstFadeMs);
  raf = requestAnimationFrame(tick);

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    els.forEach((e) => e.pause());
  };
}

type Phase = "black" | "lines" | "photo" | "celebrate";

/* The reveal. A carefully timed sequence: the music settles, three quiet lines
 * arrive, the final photo fills in, and then everything blooms at once.
 * Text / photos / ending tracks all come from the active gift config. */
export function Finale({
  fadeOutBackground,
  enabled,
  unlocked,
}: {
  fadeOutBackground: (ms: number) => Promise<void>;
  enabled: boolean;
  unlocked: boolean;
}) {
  const gift = useGift();
  const finale = gift.content.finale;
  const finalePhotos = gift.media.finalePhotos;

  // The three finale images (proposal only). Mirrors the original three slots:
  //  normal       → shown when the code was NOT matched
  //  special      → shown when the code matched (tappable)
  //  specialOnClick → what `special` becomes on tap
  const NORMAL_PHOTO = finalePhotos?.normal ?? "";
  const FINAL_PHOTO = finalePhotos?.special ?? "";
  const FINAL_ON_CLICK_PHOTO = finalePhotos?.specialOnClick ?? "";

  const NORMAL_AUDIO = resolveAudio(gift.media.audio.normalEnding);
  const SPECIAL_AUDIO = resolveAudio(gift.media.audio.specialEnding);

  // The optional welcome-screen code chooses which closing message shows.
  const text = unlocked && finale.special ? finale.special : finale.normal;
  const bigText = text.bigText;
  const subText = text.subText;
  const bigGradient = unlocked ? SECRET_TEXT_GRADIENT : NORMAL_TEXT_GRADIENT;
  const bigGlow = unlocked
    ? "drop-shadow-[0_0_32px_rgba(200,150,255,0.55)] drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)]"
    : "drop-shadow-[0_0_32px_rgba(255,150,190,0.55)] drop-shadow-[0_3px_10px_rgba(0,0,0,0.85)]";

  const [phase, setPhase] = useState<Phase>("black");
  const [lineCount, setLineCount] = useState(0);
  const [showBigText, setShowBigText] = useState(false);
  const [showSubText, setShowSubText] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const timers = useRef<number[]>([]);
  const finAudioRef = useRef<HTMLAudioElement | null>(null);
  const tappedRef = useRef(false);

  // The closing photo. Without the code it's a single still image. With the
  // code, a first photo is shown that she can tap to reveal a second one.
  const [tapped, setTapped] = useState(false);
  const canTap = unlocked && !!FINAL_ON_CLICK_PHOTO && !tapped;
  const finalePhoto = unlocked
    ? (tapped ? FINAL_ON_CLICK_PHOTO : FINAL_PHOTO) || FINAL_PHOTO || NORMAL_PHOTO
    : NORMAL_PHOTO;

  // Tapping the closing photo swaps the image and, for the special ending,
  // resumes the music (held at 28s) right as the picture changes.
  const revealOnTap = () => {
    if (!canTap) return;
    setTapped(true);
    tappedRef.current = true;
    const a = finAudioRef.current;
    if (a && a.paused && enabled) a.play().catch(() => {});
  };

  // Preload the tap-reveal image so the swap is instant.
  useEffect(() => {
    if (unlocked && FINAL_ON_CLICK_PHOTO) {
      const img = new Image();
      img.src = FINAL_ON_CLICK_PHOTO;
    }
  }, [unlocked, FINAL_ON_CLICK_PHOTO]);

  useEffect(() => {
    const after = (ms: number, fn: () => void) => {
      timers.current.push(window.setTimeout(fn, ms));
    };

    // (1) Fade the looping background music out over 3s, then stop it.
    void fadeOutBackground(3000);

    // The ending music. The special (code) track plays once and holds at 28s;
    // the plain ending track loops with a gentle crossfade so it never cuts.
    let cleanupAudio = () => {};
    if (unlocked && SPECIAL_AUDIO) {
      const track = new Audio(SPECIAL_AUDIO);
      track.preload = "auto";
      track.volume = 0;
      finAudioRef.current = track;
      const onTime = () => {
        if (!tappedRef.current && track.currentTime >= SPECIAL_PAUSE_AT) {
          track.pause();
          track.currentTime = SPECIAL_PAUSE_AT; // resume from exactly 28s
        }
      };
      track.addEventListener("timeupdate", onTime);
      after(5000, () => {
        if (!enabled) return;
        track.currentTime = 0;
        track.play().catch(() => {});
        fadeEl(track, FINALE_VOLUME, 3000);
      });
      cleanupAudio = () => {
        track.removeEventListener("timeupdate", onTime);
        track.pause();
        finAudioRef.current = null;
      };
    } else if (NORMAL_AUDIO) {
      let stopLoop: (() => void) | null = null;
      after(5000, () => {
        if (!enabled) return;
        stopLoop = startCrossfadeLoop(NORMAL_AUDIO, FINALE_VOLUME, 3000);
      });
      cleanupAudio = () => stopLoop?.();
    }

    // (4) Three lines, 1.5s apart.
    after(5000, () => {
      setPhase("lines");
      setLineCount(1);
    });
    after(6500, () => setLineCount(2));
    after(8000, () => setLineCount(3));

    // (5) The final photo slowly fills in.
    after(10000, () => setPhase("photo"));

    // (6) A few seconds of stillness, then (7–12) everything blooms.
    after(13500, () => {
      setPhase("celebrate");
      runCelebration();
      setShowBigText(true);
    });
    after(14500, () => setShowSubText(true));
    after(15500, () => setShowStars(true));

    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      cleanupAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-[#13071f] px-6 text-center">
      {/* Quiet opening lines. */}
      <AnimatePresence>
        {(phase === "black" || phase === "lines") && (
          <motion.div
            key="lines"
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center gap-6"
          >
            {LINES.slice(0, lineCount).map((line) => (
              <motion.p
                key={line}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2 }}
                className="font-display text-4xl text-[#f7eeff]"
              >
                {line}
              </motion.p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* The final photo, filling in softly. Shown whole (no cropping) so any
          size or shape looks right. With the code it's tappable to reveal a
          second image. */}
      <AnimatePresence>
        {(phase === "photo" || phase === "celebrate") && finalePhoto && (
          <motion.div
            key="photo"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: phase === "celebrate" ? 0.88 : 1, scale: 1 }}
            transition={{ duration: 3, ease: "easeOut" }}
            onClick={canTap ? revealOnTap : undefined}
            className={`absolute inset-0${canTap ? " cursor-pointer" : ""}`}
          >
            <img
              src={finalePhoto}
              alt=""
              onLoad={() => setPhotoLoaded(true)}
              onError={() => setPhotoLoaded(false)}
              className="h-full w-full object-contain"
            />
            {!photoLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-[#2a0f44] to-[#160826]" />
            )}
            {/* Soft vignette (light, so the photo stays bright). */}
            <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_150px_50px_rgba(0,0,0,0.4)]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The bloom. */}
      {phase === "celebrate" && (
        <>
          <FloatingBalloons />
          <div
            className={`absolute inset-x-0 top-0 z-10 flex flex-col items-center gap-6 px-6 ${
              unlocked ? "pt-3 md:pt-6" : "pt-6 md:pt-10"
            }`}
          >
            {showBigText && (
              <motion.h1
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: [0.7, 1.08, 1] }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={`font-display text-6xl font-semibold leading-tight ${bigGlow} md:text-7xl`}
              >
                <motion.span
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block"
                >
                  <ShimmerText gradient={bigGradient}>{bigText}</ShimmerText>
                </motion.span>
              </motion.h1>
            )}

            {showSubText && (
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="font-display text-2xl italic text-[#ffd9ec] [text-shadow:0_2px_8px_rgba(0,0,0,0.85)] md:text-3xl"
              >
                {subText}
              </motion.p>
            )}

            {showStars && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="flex items-center gap-3"
              >
                {ROUND_COLORS.map((color, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ delay: i * 0.12, duration: 0.6 }}
                  >
                    <Star
                      size={28}
                      fill={color}
                      stroke={color}
                      style={{ filter: `drop-shadow(0 0 8px ${color})` }}
                    />
                  </motion.span>
                ))}
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* Balloons in all eight chapter colours, scattered across the whole screen and
 * drifting gently in every direction. Each is a shaded teardrop body with a
 * little knot and a hanging string. */
function FloatingBalloons() {
  // The words sit at the TOP, so keep balloons off the top centre. Fill the
  // side edges generously (that's where the blank space is), plus a bottom row.
  const balloons = Array.from({ length: 32 }, (_, i) => {
    let top: number;
    let left: number;
    if (i < 8) {
      top = 82 + Math.random() * 13; // bottom row
      left = 5 + Math.random() * 88;
    } else if (i < 20) {
      top = 30 + Math.random() * 62; // left side (filled)
      left = 0 + Math.random() * 12;
    } else {
      top = 30 + Math.random() * 62; // right side (filled)
      left = 87 + Math.random() * 12;
    }
    return {
      id: i,
      color: ROUND_COLORS[i % ROUND_COLORS.length],
      top,
      left,
      size: 28 + Math.random() * 26,
      dur: 7 + Math.random() * 7,
      delay: Math.random() * 3,
      dx: 10 + Math.random() * 18,
      dy: 12 + Math.random() * 24,
      dir: Math.random() < 0.5 ? 1 : -1,
      rot: 4 + Math.random() * 6,
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Shared light/shadow gradients so every balloon looks rounded. */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <radialGradient id="balloonShine" cx="33%" cy="26%" r="62%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="48%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <radialGradient id="balloonShade" cx="64%" cy="76%" r="68%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.24)" />
          </radialGradient>
        </defs>
      </svg>
      {balloons.map((b) => (
        <motion.div
          key={b.id}
          className="absolute"
          style={{ top: `${b.top}%`, left: `${b.left}%` }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: 1,
            scale: 1,
            x: [0, b.dx * b.dir, -b.dx * 0.6 * b.dir, b.dx * 0.3 * b.dir, 0],
            y: [0, -b.dy * 0.6, b.dy * 0.4, -b.dy, 0],
            rotate: [0, b.rot * b.dir, -b.rot * b.dir, 0],
          }}
          transition={{
            opacity: { duration: 1.2, delay: b.delay },
            scale: { duration: 1.2, delay: b.delay },
            x: { duration: b.dur, delay: b.delay, repeat: Infinity, ease: "easeInOut" },
            y: { duration: b.dur * 1.25, delay: b.delay, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: b.dur, delay: b.delay, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <svg
            width={b.size}
            height={b.size * 1.7}
            viewBox="0 0 40 68"
            style={{ display: "block", overflow: "visible" }}
          >
            {/* string */}
            <path
              d="M20 44 q 7 9 -1 18"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="1.1"
              strokeLinecap="round"
              fill="none"
            />
            {/* knot */}
            <path d="M20 41 l -3.6 5 l 7.2 0 z" fill={b.color} />
            {/* body, with soft shading + highlight */}
            <ellipse cx="20" cy="21" rx="16" ry="21" fill={b.color} />
            <ellipse cx="20" cy="21" rx="16" ry="21" fill="url(#balloonShade)" />
            <ellipse cx="20" cy="21" rx="16" ry="21" fill="url(#balloonShine)" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

/* Confetti raining from the top, plus party-poppers from both bottom corners. */
function runCelebration() {
  const colors = [...ROUND_COLORS, "#fff0fb"];
  const end = Date.now() + 4500;

  const rain = () => {
    confetti({
      particleCount: 6,
      angle: 90,
      spread: 70,
      startVelocity: 30,
      origin: { x: Math.random(), y: -0.1 },
      colors,
      gravity: 1.1,
      scalar: 1.1,
    });
    if (Date.now() < end) requestAnimationFrame(rain);
  };
  rain();

  // Party-poppers from both bottom corners.
  const popper = (x: number, angle: number) =>
    confetti({
      particleCount: 120,
      angle,
      spread: 70,
      startVelocity: 60,
      origin: { x, y: 1 },
      colors,
      scalar: 1.2,
    });
  popper(0, 60);
  popper(1, 120);
  setTimeout(() => {
    popper(0, 60);
    popper(1, 120);
  }, 700);
}
