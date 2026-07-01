import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { SentenceItem } from "../../game/types";
import { makeRng, shuffle } from "../../game/shuffle";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

/* Complete-the-sentence: a tender stem with a few endings. The right ending
 * unlocks the way forward; others gently invite another try. */
export function Sentence({
  item,
  seed,
  onComplete,
}: {
  item: SentenceItem;
  seed: number;
  onComplete: () => void;
}) {
  const options = useMemo(
    () => shuffle(item.options, makeRng(seed + item.stem.length)),
    [item, seed],
  );
  const [picked, setPicked] = useState<string | null>(null);
  const solved = picked === item.correct;

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-10 text-center">
      <h2 className="font-display text-4xl italic leading-snug text-text">
        “{item.stem}”
      </h2>

      <div className="flex w-full flex-col gap-4">
        {options.map((opt, i) => {
          const isCorrect = solved && opt === item.correct;
          const isWrongPick = picked === opt && !solved;
          return (
            <motion.button
              key={`${opt}-${i}`}
              onClick={() => !solved && setPicked(opt)}
              disabled={solved}
              whileHover={{ scale: solved ? 1 : 1.02 }}
              whileTap={{ scale: 0.99 }}
              className={cn(
                "rounded-2xl border px-7 py-5 text-lg transition-colors duration-300",
                "border-border bg-surface/70 text-text backdrop-blur-sm",
                !solved && "hover:border-accent hover:bg-surface cursor-pointer",
                isCorrect && "border-accent bg-accent text-surface",
                isWrongPick && "border-accent-2/50 opacity-60",
              )}
            >
              … {opt}
            </motion.button>
          );
        })}
      </div>

      <div className="min-h-[4rem]">
        <AnimatePresence mode="wait">
          {picked && !solved && (
            <motion.p
              key={picked}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-display text-xl italic text-text-soft"
            >
              Sweet… but not quite the one. Try again 💭
            </motion.p>
          )}
          {solved && (
            <motion.div
              key="solved"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <p className="font-display text-xl italic text-accent">
                That's the one 💛
              </p>
              <Button size="lg" onClick={onComplete}>
                Continue
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
