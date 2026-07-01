import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";

const PALETTE = [
  "#ff9ec9", "#ff9a8f", "#ff6bd6", "#b07bff",
  "#5cf0d0", "#7c9bff", "#c46bff", "#ff7cc6",
];

/* Balloons drift gently upward; pop each one to reveal a sweet little word.
 * (A soft foreshadow of the balloons that return at the very end.) */
export function BalloonPop({
  words,
  onComplete,
}: {
  words: string[];
  onComplete: () => void;
}) {
  const balloons = useMemo(
    () =>
      words.map((word, i) => ({
        id: i,
        word,
        color: PALETTE[i % PALETTE.length],
        left: 8 + (i * 84) / Math.max(1, words.length - 1),
        duration: 7 + (i % 4),
        delay: (i % 5) * 0.6,
        drift: i % 2 === 0 ? 18 : -18,
      })),
    [words],
  );

  const [popped, setPopped] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<{ id: number; word: string; color: string }[]>([]);
  const allPopped = popped.size === balloons.length;

  const pop = (b: (typeof balloons)[number]) => {
    if (popped.has(b.id)) return;
    setPopped((p) => new Set(p).add(b.id));
    setRevealed((r) => [...r, { id: b.id, word: b.word, color: b.color }]);
  };

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6 text-center">
      <h2 className="font-display text-3xl text-text">
        Pop the balloons — there's a word inside each one
      </h2>

      <div className="relative h-[26rem] w-full overflow-hidden rounded-3xl border border-border bg-surface/40">
        {balloons.map((b) =>
          popped.has(b.id) ? null : (
            <motion.button
              key={b.id}
              onClick={() => pop(b)}
              className="absolute bottom-0 cursor-pointer"
              style={{ left: `${b.left}%` }}
              initial={{ y: "120%" }}
              animate={{ y: "-120%", x: [0, b.drift, 0] }}
              transition={{
                y: { duration: b.duration, delay: b.delay, repeat: Infinity, ease: "linear" },
                x: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              }}
              whileHover={{ scale: 1.08 }}
            >
              <Balloon color={b.color} />
            </motion.button>
          ),
        )}

        {/* Words gathering as they're revealed. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-wrap items-center justify-center gap-2 px-4">
          <AnimatePresence>
            {revealed.map((r) => (
              <motion.span
                key={r.id}
                initial={{ opacity: 0, scale: 0.6, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="rounded-full px-3 py-1 text-sm font-semibold text-surface shadow"
                style={{ backgroundColor: r.color }}
              >
                {r.word}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {allPopped && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="font-display text-xl italic text-accent">
            Every one of them, just for you ✨
          </p>
          <Button size="lg" onClick={onComplete}>
            Continue
          </Button>
        </motion.div>
      )}
    </div>
  );
}

function Balloon({ color }: { color: string }) {
  return (
    <div className="relative flex flex-col items-center">
      <div
        className="h-16 w-14 rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.6), ${color} 60%)`,
          boxShadow: `0 6px 18px -4px ${color}`,
        }}
      />
      <div
        className="-mt-1 h-2 w-2 rotate-45"
        style={{ backgroundColor: color }}
      />
      <div className="h-10 w-px bg-text-soft/40" />
    </div>
  );
}
