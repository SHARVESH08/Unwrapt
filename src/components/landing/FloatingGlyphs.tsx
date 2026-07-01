/* Ambient, slow-drifting glyphs for the landing's hero stage — the product's
 * "surprise" vocabulary (hearts, sparkles, rings) at low opacity. Decorative
 * and non-interactive; quiet enough not to read as AI confetti. */

import { motion, useReducedMotion } from "motion/react";

const GLYPHS = ["✦", "❤", "✧", "♡", "✦", "❀", "✧", "♥"];

const SEED = [
  { left: 8, top: 22, size: 22, dur: 17, delay: 0 },
  { left: 18, top: 68, size: 14, dur: 21, delay: 2 },
  { left: 33, top: 38, size: 16, dur: 19, delay: 4 },
  { left: 47, top: 78, size: 12, dur: 23, delay: 1 },
  { left: 64, top: 28, size: 18, dur: 18, delay: 3 },
  { left: 76, top: 62, size: 14, dur: 22, delay: 5 },
  { left: 88, top: 34, size: 20, dur: 20, delay: 2 },
  { left: 92, top: 74, size: 13, dur: 24, delay: 4 },
];

export function FloatingGlyphs() {
  const reduce = useReducedMotion();
  if (reduce) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {SEED.map((g, i) => (
        <motion.span
          key={i}
          className="absolute font-display"
          style={{
            left: `${g.left}%`,
            top: `${g.top}%`,
            fontSize: g.size,
            color: i % 2 ? "rgba(255,158,196,0.30)" : "rgba(230,180,34,0.28)",
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: [0, 0.9, 0.9, 0],
            y: [12, -22, -42, -64],
            rotate: [0, 8, -6, 0],
          }}
          transition={{
            duration: g.dur,
            delay: g.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {GLYPHS[i % GLYPHS.length]}
        </motion.span>
      ))}
    </div>
  );
}
