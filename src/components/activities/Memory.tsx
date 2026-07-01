import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gift } from "lucide-react";
import { GlowFrame } from "../ui/GlowFrame";
import { Button } from "../ui/button";
import { RevealText } from "../ui/ShimmerText";

/* Click-to-reveal memory: a wrapped, glowing frame that unfolds on click to
 * show a photo and its caption. */
export function Memory({
  photo,
  caption,
  onComplete,
}: {
  photo: string;
  caption: string;
  onComplete: () => void;
}) {
  const [opened, setOpened] = useState(false);

  return (
    <div className="flex w-full max-w-6xl flex-col items-center gap-8 text-center">
      <h2 className="font-display text-3xl text-text-soft">
        {opened ? "A little moment, just for you" : "Something is wrapped up for you"}
      </h2>

      <AnimatePresence mode="wait">
        {!opened ? (
          <motion.button
            key="wrapped"
            onClick={() => setOpened(true)}
            className="group flex h-80 w-80 max-w-[85vw] cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-gradient-to-br from-accent/30 to-accent-2/20 soft-pulse"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, rotate: 2 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.03 }}
          >
            <motion.div
              animate={{ rotate: [-4, 4, -4], y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-accent"
            >
              <Gift size={88} strokeWidth={1.2} />
            </motion.div>
            <span className="font-body text-sm uppercase tracking-[0.25em] text-text-soft">
              Click to unwrap
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="open"
            initial={{ opacity: 0, scale: 0.85, rotateY: 40 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <GlowFrame src={photo} alt={caption} maxClass="max-h-[58vh] max-w-[88vw]" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {opened && (
          <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            <p className="max-w-xl font-display text-2xl italic leading-relaxed text-text">
              <RevealText text={caption} delay={0.6} />
            </p>
            <Button size="lg" onClick={onComplete}>
              Keep going
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
