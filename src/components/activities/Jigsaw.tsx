import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { makeRng, shuffle } from "../../game/shuffle";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

const SIZE = 4; // 4x4 grid
const COUNT = SIZE * SIZE;

/* Photo jigsaw. The image is split into a 4×4 grid; tap one piece then another
 * to swap them, until the picture is whole again. Works with a real photo or,
 * until one is added, with numbered glowing tiles. */
export function Jigsaw({
  photo,
  seed,
  onComplete,
}: {
  photo: string;
  seed: number;
  onComplete: () => void;
}) {
  const [hasPhoto, setHasPhoto] = useState(false);
  // The puzzle takes the photo's own shape so nothing is stretched.
  const [ratio, setRatio] = useState(1);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setHasPhoto(true);
      if (img.naturalWidth && img.naturalHeight) {
        setRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.onerror = () => setHasPhoto(false);
    img.src = photo;
  }, [photo]);

  // `order[slot] = pieceId`. Start from a seeded scramble that isn't solved.
  const initial = useMemo(() => {
    const ids = Array.from({ length: COUNT }, (_, i) => i);
    let scrambled = shuffle(ids, makeRng(seed + 7));
    if (scrambled.every((v, i) => v === i)) scrambled = scrambled.reverse();
    return scrambled;
  }, [seed]);

  const [order, setOrder] = useState<number[]>(initial);
  const [selected, setSelected] = useState<number | null>(null);
  const solved = order.every((v, i) => v === i);

  const tap = (slot: number) => {
    if (solved) return;
    if (selected === null) {
      setSelected(slot);
    } else if (selected === slot) {
      setSelected(null);
    } else {
      setOrder((prev) => {
        const next = [...prev];
        [next[selected], next[slot]] = [next[slot], next[selected]];
        return next;
      });
      setSelected(null);
    }
  };

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-8 text-center">
      <h2 className="font-display text-3xl text-text">
        Piece this picture back together
      </h2>

      <div
        className="grid grid-cols-4 gap-1.5 rounded-3xl border border-border bg-surface/60 p-1.5 soft-pulse"
        style={{
          aspectRatio: hasPhoto ? ratio : 1,
          width: `min(26rem, 90vw, calc(68vh * ${hasPhoto ? ratio : 1}))`,
        }}
      >
        {order.map((pieceId, slot) => {
          const row = Math.floor(pieceId / SIZE);
          const col = pieceId % SIZE;
          return (
            <motion.button
              key={slot}
              layout
              onClick={() => tap(slot)}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={cn(
                "relative overflow-hidden rounded-lg",
                selected === slot && "ring-4 ring-accent",
              )}
              style={
                hasPhoto
                  ? {
                      backgroundImage: `url(${photo})`,
                      backgroundSize: `${SIZE * 100}% ${SIZE * 100}%`,
                      backgroundPosition: `${(col / (SIZE - 1)) * 100}% ${(row / (SIZE - 1)) * 100}%`,
                    }
                  : undefined
              }
            >
              {!hasPhoto && (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/30 to-accent-2/20 font-display text-2xl text-text">
                  {pieceId + 1}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {solved && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <p className="font-display text-xl italic text-accent">
            Whole again — just perfect ✨
          </p>
          <Button size="lg" onClick={onComplete}>
            Continue
          </Button>
        </motion.div>
      )}
    </div>
  );
}
