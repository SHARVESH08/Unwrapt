import { useEffect } from "react";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { GlowFrame } from "./ui/GlowFrame";
import { Button } from "./ui/button";
import { RevealText, ShimmerText } from "./ui/ShimmerText";

/* The bigger birthday wish at the close of each chapter: a themed message, a
 * glowing round-end photo, and a burst of confetti. */
export function RoundEndScreen({
  message,
  photo,
  isLastRound,
  onNext,
}: {
  message: string;
  photo: string;
  isLastRound: boolean;
  onNext: () => void;
}) {
  useEffect(() => {
    const accent =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--c-accent")
        .trim() || "#ff9ec9";
    const accent2 =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--c-accent-2")
        .trim() || "#6fe6e0";

    confetti({
      particleCount: 140,
      spread: 90,
      origin: { y: 0.4 },
      colors: [accent, accent2, "#fff0fb"],
      scalar: 1.1,
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="flex w-full max-w-4xl flex-col items-center gap-10 text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.9 }}
      >
        <GlowFrame src={photo} alt="A birthday wish" maxClass="max-h-[50vh] max-w-[82vw]" />
      </motion.div>

      <h2 className="font-display text-4xl leading-snug text-text">
        <ShimmerText>
          <RevealText text={message} delay={0.5} stagger={0.06} />
        </ShimmerText>
      </h2>

      <Button size="lg" onClick={onNext}>
        {isLastRound ? "One more thing…" : "Onwards"}
      </Button>
    </motion.div>
  );
}
