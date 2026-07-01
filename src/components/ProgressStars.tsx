import { motion } from "motion/react";
import { Star } from "lucide-react";
import { ACTIVITIES_PER_ROUND } from "../game/types";

/* Eight little stars per chapter that glow in, one by one, as she goes.
 * Presented as decoration — never as a "3 of 8" counter. */
export function ProgressStars({ filled }: { filled: number }) {
  return (
    <div className="flex items-center gap-2.5">
      {Array.from({ length: ACTIVITIES_PER_ROUND }, (_, i) => {
        const lit = i < filled;
        return (
          <motion.span
            key={i}
            initial={false}
            animate={
              lit
                ? { scale: [0.6, 1.3, 1], opacity: 1 }
                : { scale: 1, opacity: 0.35 }
            }
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Star
              size={18}
              strokeWidth={1.5}
              className={lit ? "text-accent" : "text-text-soft"}
              fill={lit ? "var(--c-accent)" : "transparent"}
              style={lit ? { filter: "drop-shadow(0 0 6px var(--c-glow))" } : undefined}
            />
          </motion.span>
        );
      })}
    </div>
  );
}
