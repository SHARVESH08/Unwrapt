import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import type { TriviaItem } from "../../game/types";
import { makeRng, shuffle } from "../../game/shuffle";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

/* Multiple-choice question. Wrong answers get a warm, funny line and unlimited
 * retries with no penalty; the right answer unlocks the way forward. */
export function Trivia({
  item,
  seed,
  onComplete,
}: {
  item: TriviaItem;
  seed: number;
  onComplete: () => void;
}) {
  // Options (and their order) are shuffled deterministically per slot.
  const options = useMemo(() => {
    const all = [item.correct, ...item.wrong];
    return shuffle(all, makeRng(seed + item.question.length));
  }, [item, seed]);

  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  const choose = (opt: string) => {
    if (solved) return;
    setPicked(opt);
    if (opt === item.correct) setSolved(true);
  };

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-10 text-center">
      <h2 className="font-display text-4xl leading-tight text-text">
        {item.question}
      </h2>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {options.map((opt, i) => {
          const isCorrect = solved && opt === item.correct;
          const isWrongPick = picked === opt && opt !== item.correct;
          return (
            <motion.button
              key={`${opt}-${i}`}
              onClick={() => choose(opt)}
              disabled={solved}
              whileHover={{ scale: solved ? 1 : 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center justify-center gap-2 rounded-2xl border px-6 py-5 text-lg transition-colors duration-300",
                "border-border bg-surface/70 text-text backdrop-blur-sm",
                !solved && "hover:border-accent hover:bg-surface cursor-pointer",
                isCorrect && "border-accent bg-accent text-surface",
                isWrongPick && "border-accent-2/60 opacity-60",
              )}
            >
              {isCorrect && <Check size={20} />}
              {opt}
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
              {item.funnyResponse}
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
                Exactly right ✨
              </p>
              <Button size="lg" onClick={onComplete}>
                Lovely — next
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
