/* The interactive demo (a real taste of the experience, not a video). A small
 * device screen shows the actual dreamy gift look and lets the visitor answer a
 * couple of sample questions, with the occasion surprises drifting past — the
 * same surprises engine the gift uses. */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, RotateCcw } from "lucide-react";
import type { Occasion } from "../../types/gift";
import { triviaForOccasion } from "../../config/occasionQuestions";
import { OccasionSurprises } from "../OccasionSurprises";

type Q = { question: string; correct: string; options: string[]; nudge: string };

function buildQuestions(occasion: Occasion): Q[] {
  return triviaForOccasion(occasion).slice(0, 3).map((t, qi) => {
    const opts = [t.correct, ...t.wrong.slice(0, 3)];
    // Deterministic-but-varied shuffle (stable across renders, varies per question).
    const order = opts
      .map((o, i) => ({ o, k: (i * 7 + qi * 3 + 5) % opts.length }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.o);
    return { question: t.question, correct: t.correct, options: order, nudge: t.funnyResponse };
  });
}

const OCCASIONS: { value: Occasion; label: string }[] = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "proposal", label: "Proposal" },
];

export function LiveDemo() {
  const [occasion, setOccasion] = useState<Occasion>("birthday");
  const questions = useMemo(() => buildQuestions(occasion), [occasion]);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const done = step >= questions.length;
  const q = questions[step];

  const pick = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    if (opt === q.correct) {
      window.setTimeout(() => {
        setPicked(null);
        setStep((s) => s + 1);
      }, 850);
    } else {
      window.setTimeout(() => setPicked(null), 1100);
    }
  };

  const restart = () => {
    setPicked(null);
    setStep(0);
  };

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Occasion switcher (drives the surprises). */}
      <div className="mb-4 flex items-center justify-center gap-2">
        {OCCASIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              setOccasion(o.value);
              setStep(0);
              setPicked(null);
            }}
            className={`rounded-full px-4 py-1.5 font-body text-sm transition-colors ${
              occasion === o.value
                ? "bg-accent text-bg"
                : "border border-border text-text-soft hover:border-accent hover:text-text"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Device frame. */}
      <div className="rounded-[2.4rem] border border-border bg-surface/50 p-3 shadow-[0_40px_100px_-30px_var(--c-glow)] backdrop-blur-sm">
        <div
          data-round="3"
          className="gift-screen relative aspect-[9/14] overflow-hidden rounded-[1.9rem]"
        >
          <div className="scene-backdrop absolute inset-0" />
          <OccasionSurprises occasion={occasion} active customEmojis={[]} contained rate={2} />

          <div className="relative flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-4"
                >
                  <span className="text-5xl">✨</span>
                  <p className="font-display text-2xl italic text-text">
                    …and it ends with a finale made just for them.
                  </p>
                  <button
                    type="button"
                    onClick={restart}
                    className="mt-1 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-2 font-body text-sm text-text-soft transition-colors hover:text-text"
                  >
                    <RotateCcw size={15} /> Play again
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.4 }}
                  className="flex w-full flex-col items-center gap-5"
                >
                  <p className="font-body text-xs uppercase tracking-[0.3em] text-text-soft">
                    Question {step + 1} of {questions.length}
                  </p>
                  <h4 className="font-display text-2xl leading-snug text-text">{q.question}</h4>
                  <div className="flex w-full flex-col gap-2.5">
                    {q.options.map((opt) => {
                      const isPicked = picked === opt;
                      const isRight = opt === q.correct;
                      const state = !picked
                        ? "idle"
                        : isPicked && isRight
                          ? "right"
                          : isPicked
                            ? "wrong"
                            : "dim";
                      return (
                        <motion.button
                          key={opt}
                          type="button"
                          onClick={() => pick(opt)}
                          whileTap={{ scale: 0.97 }}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left font-body text-sm transition-colors ${
                            state === "right"
                              ? "border-transparent bg-accent text-surface"
                              : state === "wrong"
                                ? "border-accent-2 text-accent-2"
                                : state === "dim"
                                  ? "border-border text-text-soft/50"
                                  : "border-border bg-surface/60 text-text hover:border-accent"
                          }`}
                        >
                          {opt}
                          {state === "right" && <Check size={16} />}
                        </motion.button>
                      );
                    })}
                  </div>
                  <div className="min-h-[1.25rem]">
                    {picked && picked !== q.correct && (
                      <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-display text-base italic text-accent-2"
                      >
                        {q.nudge}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <p className="mt-5 text-center font-body text-sm text-text-soft">
        A real taste. Switch the occasion and watch the surprises change.
      </p>
    </div>
  );
}
