import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useGift } from "../config/GiftContext";
import { Button } from "./ui/button";
import { RevealText } from "./ui/ShimmerText";

/* The cinematic welcome. The receiver types the name on the gift to enter; the
 * right name is greeted warmly, anything else gets a gentle nudge. In proposal
 * mode a secret-code field decides which ending shows. Name + code come from the
 * active gift config — never hardcoded. */
export function NameGate({
  onEnter,
  onUnlockAudio,
}: {
  onEnter: (unlocked: boolean) => void;
  onUnlockAudio: () => void;
}) {
  const gift = useGift();
  const recipientName = gift.recipientName;
  const isProposal = gift.mode === "proposal";
  // The demo has no "real" recipient, so tell the visitor what to type (and
  // prefill it) — otherwise the name gate is an unanswerable guess.
  const isDemo = gift.id === "sample";

  const [value, setValue] = useState(isDemo ? recipientName : "");
  const [code, setCode] = useState(isDemo && gift.secretCode ? gift.secretCode : "");
  const [wrong, setWrong] = useState(false);
  const [welcomed, setWelcomed] = useState(false);

  const normalise = (s: string) => s.trim().toLowerCase();

  const submit = () => {
    if (normalise(value) === normalise(recipientName)) {
      // The optional code decides which version of the final screen shows.
      const unlocked =
        isProposal && !!gift.secretCode && code.trim() === gift.secretCode;
      // Unlock audio inside this real click so browsers allow playback.
      onUnlockAudio();
      setWelcomed(true);
      // A short beat before the adventure begins.
      setTimeout(() => onEnter(unlocked), 2600);
    } else {
      setWrong(true);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {!welcomed ? (
          <motion.div
            key="gate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="flex max-w-2xl flex-col items-center gap-10 text-center"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 1.2 }}
              className="font-body text-sm uppercase tracking-[0.4em] text-text-soft"
            >
              A little adventure
            </motion.p>

            <h1 className="font-display text-5xl leading-tight text-text">
              <RevealText
                text="This was made for someone very special."
                delay={0.6}
                stagger={0.06}
              />
            </h1>
            <p className="font-display text-2xl italic text-text-soft">
              Is it you?
            </p>

            <div className="flex w-full max-w-md flex-col items-center gap-4">
              {isDemo && (
                <p className="font-body text-sm text-text-soft">
                  Demo — type{" "}
                  <span className="font-semibold text-text">“{recipientName}”</span>
                  {isProposal && gift.secretCode && (
                    <>
                      {" "}and the code{" "}
                      <span className="font-semibold text-text">“{gift.secretCode}”</span>
                    </>
                  )}{" "}
                  (already filled in) to step inside.
                </p>
              )}
              <input
                autoFocus
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setWrong(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Type your name…"
                className="w-full rounded-full border border-border bg-surface/70 px-7 py-4 text-center font-body text-lg text-text outline-none backdrop-blur-sm transition-colors focus:border-accent"
              />
              {isProposal && (
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Secret code (optional)"
                  className="w-full rounded-full border border-border bg-surface/50 px-7 py-3 text-center font-body text-base text-text-soft outline-none backdrop-blur-sm transition-colors placeholder:text-text-soft/60 focus:border-accent"
                />
              )}
              <Button size="lg" onClick={submit} disabled={!value.trim()}>
                Step inside
              </Button>

              <div className="min-h-[1.5rem]">
                <AnimatePresence>
                  {wrong && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="font-display text-lg italic text-accent-2"
                    >
                      Hmm… that doesn't seem right. Try again 😄
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center gap-6 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-7xl"
            >
              ✨
            </motion.div>
            <h1 className="font-display text-5xl text-text">
              <RevealText text="I've been waiting for you" delay={0.4} />
            </h1>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
