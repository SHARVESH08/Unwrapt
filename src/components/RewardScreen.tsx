import { motion } from "motion/react";
import { GlowFrame } from "./ui/GlowFrame";
import { Button } from "./ui/button";
import { RevealText } from "./ui/ShimmerText";

/* The little celebration shown after each activity: a sweet line beside a
 * glowing random photo from src/photos/. */
export function RewardScreen({
  message,
  photo,
  onNext,
}: {
  message: string;
  photo: string;
  onNext: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="flex w-full max-w-3xl flex-col items-center gap-8 text-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7 }}
      >
        <GlowFrame src={photo} alt="A little reward" maxClass="max-h-[42vh] max-w-[74vw]" />
      </motion.div>

      <p className="font-display text-3xl italic leading-relaxed text-text">
        <RevealText text={message} delay={0.4} />
      </p>

      <Button size="lg" onClick={onNext}>
        Next
      </Button>
    </motion.div>
  );
}
