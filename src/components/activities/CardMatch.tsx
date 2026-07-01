import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Heart } from "lucide-react";
import { makeRng, shuffle } from "../../game/shuffle";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

interface Card {
  id: number;
  pairId: number;
  label: string;
}

/* Memory match. `pairs` is a flat list where each consecutive two items belong
 * together (0&1, 2&3, …). Cards start face-down; flip two to find a match. */
export function CardMatch({
  pairs,
  seed,
  onComplete,
}: {
  pairs: string[];
  seed: number;
  onComplete: () => void;
}) {
  const cards = useMemo<Card[]>(() => {
    const built = pairs.map((label, i) => ({
      id: i,
      pairId: Math.floor(i / 2),
      label,
    }));
    return shuffle(built, makeRng(seed + pairs.length));
  }, [pairs, seed]);

  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const allMatched = matched.length === cards.length;

  const flip = (id: number) => {
    if (busy || flipped.includes(id) || matched.includes(id)) return;
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length === 2) {
      setBusy(true);
      const [a, b] = next.map((i) => cards.find((c) => c.id === i)!);
      if (a.pairId === b.pairId) {
        setTimeout(() => {
          setMatched((m) => [...m, a.id, b.id]);
          setFlipped([]);
          setBusy(false);
        }, 550);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setBusy(false);
        }, 950);
      }
    }
  };

  const cols = cards.length > 6 ? 4 : 3;

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
      <h2 className="font-display text-3xl text-text">
        Find the little pairs that belong together
      </h2>

      <div
        className="grid w-full gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cards.map((card) => {
          const isUp =
            flipped.includes(card.id) || matched.includes(card.id);
          const isMatched = matched.includes(card.id);
          return (
            <button
              key={card.id}
              onClick={() => flip(card.id)}
              className="relative aspect-[3/4] [perspective:1000px]"
            >
              <motion.div
                className="relative h-full w-full [transform-style:preserve-3d]"
                animate={{ rotateY: isUp ? 180 : 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Back */}
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-accent/30 to-accent-2/20 [backface-visibility:hidden]">
                  <Heart className="text-accent/70" size={28} />
                </div>
                {/* Front */}
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-2xl border px-2 text-center text-base font-semibold [backface-visibility:hidden] [transform:rotateY(180deg)]",
                    isMatched
                      ? "border-accent bg-accent text-surface"
                      : "border-border bg-surface text-text",
                  )}
                >
                  {card.label}
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>

      {allMatched && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="font-display text-xl italic text-accent">
            All matched — beautifully done ✨
          </p>
          <Button size="lg" onClick={onComplete}>
            Continue
          </Button>
        </motion.div>
      )}
    </div>
  );
}
