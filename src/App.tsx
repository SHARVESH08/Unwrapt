import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Slot } from "./game/types";
import type { GiftContent } from "./types/gift";
import {
  loadSession,
  saveIndex,
  buildSequence,
  buildRoundEndPhotos,
  clearSession,
  loadUnlocked,
  saveUnlocked,
  ROUND_SIZE,
} from "./game/session";
import { DEFAULT_ADVENTURE_SETTINGS } from "./types/gift";
import { useGift } from "./config/GiftContext";
import { resolveAudio } from "./config/defaultAudio";
import { useAudio } from "./audio/useAudio";

import { AuroraBackground } from "./components/ui/AuroraBackground";
import { Sparkles } from "./components/ui/Sparkles";
import { OccasionSurprises } from "./components/OccasionSurprises";
import { SoundToggle } from "./components/SoundToggle";
import { ProgressStars } from "./components/ProgressStars";
import { NameGate } from "./components/NameGate";
import { RewardScreen } from "./components/RewardScreen";
import { RoundEndScreen } from "./components/RoundEndScreen";
import { Finale } from "./components/Finale";

import { Memory } from "./components/activities/Memory";
import { Trivia } from "./components/activities/Trivia";
import { Sentence } from "./components/activities/Sentence";
import { CardMatch } from "./components/activities/CardMatch";
import { Jigsaw } from "./components/activities/Jigsaw";
import { WordSearch } from "./components/activities/WordSearch";
import { BalloonPop } from "./components/activities/BalloonPop";

/* Subtle chapter titles — evocative, never revealing. */
const ROUND_TITLES = [
  "Once Upon a Time…",
  "The Beginning",
  "All Things You",
  "Favourite Things",
  "Little Things",
  "Our Little World",
  "What Comes Next",
  "The Best Part…",
];

type Phase = "gate" | "activity" | "reward" | "roundend" | "finale";

export default function App() {
  const gift = useGift();
  const content = gift.content;
  const settings = gift.settings ?? DEFAULT_ADVENTURE_SETTINGS;
  const giftKey = gift.giftNumber;
  const photoUrls = gift.media.photoUrls;

  const audio = useAudio(resolveAudio(gift.media.audio.loop));

  // Load (or start) the saved adventure and rebuild its exact sequence.
  const session = useMemo(() => loadSession(giftKey), [giftKey]);
  const sequence = useMemo<Slot[]>(
    () => buildSequence(content, photoUrls, session.seed, settings),
    [content, photoUrls, session.seed, settings],
  );
  const totalSlots = sequence.length;
  const totalRounds = Math.max(1, Math.ceil(totalSlots / ROUND_SIZE));
  const roundEndPhotos = useMemo(
    () => buildRoundEndPhotos(photoUrls, session.seed, totalRounds),
    [photoUrls, session.seed, totalRounds],
  );

  const startIndex = Math.min(session.index, totalSlots);
  const [index, setIndex] = useState(startIndex);
  const [unlocked, setUnlocked] = useState<boolean>(() => loadUnlocked(giftKey));
  const [phase, setPhase] = useState<Phase>(() =>
    totalSlots > 0 && startIndex >= totalSlots - 1 ? "finale" : "gate",
  );
  const completedRoundRef = useRef(1);

  const round = Math.min(totalRounds, Math.floor(index / ROUND_SIZE) + 1);
  const starsFilled = index % ROUND_SIZE;

  // Repaint the whole interface for the current chapter.
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-round",
      String(phase === "finale" ? Math.min(totalRounds, 8) : Math.min(round, 8)),
    );
  }, [round, phase, totalRounds]);

  // Hidden replay/testing shortcut: Ctrl+Shift+Alt+R wipes progress + reloads.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.altKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        clearSession(giftKey);
        window.location.reload();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [giftKey]);

  const enter = useCallback(
    (didUnlock: boolean) => {
      setUnlocked(didUnlock);
      saveUnlocked(giftKey, didUnlock);
      audio.startBackground();
      setPhase(index >= totalSlots - 1 ? "finale" : "activity");
    },
    [audio, index, giftKey, totalSlots],
  );

  const completeActivity = useCallback(() => setPhase("reward"), []);

  const afterReward = useCallback(() => {
    const newIndex = index + 1;
    saveIndex(giftKey, newIndex);
    setIndex(newIndex);

    if (newIndex % ROUND_SIZE === 0 && newIndex < totalSlots) {
      completedRoundRef.current = newIndex / ROUND_SIZE;
      setPhase("roundend");
    } else if (newIndex >= totalSlots - 1) {
      clearSession(giftKey);
      setPhase("finale");
    } else {
      setPhase("activity");
    }
  }, [index, giftKey, totalSlots]);

  const afterRoundEnd = useCallback(() => setPhase("activity"), []);

  // Empty adventure guard (e.g. all games disabled / no content at all).
  if (totalSlots === 0) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center px-6 text-center">
        <AuroraBackground />
        <p className="relative font-display text-2xl italic text-text-soft">
          This gift has no activities yet.
        </p>
      </div>
    );
  }

  const rewardMessage =
    content.rewardMessages[index % content.rewardMessages.length] ?? "";
  const rewardPhoto = sequence[index]?.rewardPhoto ?? "";

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      <AuroraBackground />
      <Sparkles />
      {settings.surprises && phase !== "finale" && (
        <OccasionSurprises
          occasion={gift.occasion}
          active={phase !== "gate"}
          customEmojis={settings.customEmojis}
        />
      )}
      {phase !== "gate" && phase !== "finale" && (
        <SoundToggle enabled={audio.enabled} onToggle={audio.toggle} />
      )}

      {phase === "activity" && (
        <button
          type="button"
          onClick={completeActivity}
          aria-label="Skip this activity"
          className="fixed bottom-3 left-3 z-40 rounded px-1.5 py-1 font-body text-[11px] lowercase tracking-wide text-text-soft opacity-30 transition-opacity duration-300 hover:opacity-90"
        >
          skip
        </button>
      )}

      {phase === "gate" && <NameGate onEnter={enter} onUnlockAudio={audio.startBackground} />}

      {(phase === "activity" || phase === "reward" || phase === "roundend") && (
        <div className="relative flex min-h-screen w-full flex-col">
          <header className="flex w-full flex-col items-center gap-3 pt-10">
            <motion.h2
              key={round}
              initial={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-gradient-accent font-display text-2xl tracking-wide"
            >
              {ROUND_TITLES[(round - 1) % ROUND_TITLES.length]}
            </motion.h2>
            <ProgressStars filled={phase === "roundend" ? ROUND_SIZE : starsFilled} />
          </header>

          <main className="flex flex-1 items-center justify-center px-6 py-10">
            <AnimatePresence mode="wait">
              {phase === "activity" && (
                <motion.div
                  key={`act-${index}`}
                  initial={{ opacity: 0, y: 24, scale: 0.98, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, scale: 0.98, filter: "blur(6px)" }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="flex w-full justify-center"
                >
                  <ActivityView
                    slot={sequence[index]}
                    content={content}
                    seed={session.seed + index}
                    onComplete={completeActivity}
                  />
                </motion.div>
              )}

              {phase === "reward" && (
                <motion.div key={`rew-${index}`} className="flex w-full justify-center">
                  <RewardScreen message={rewardMessage} photo={rewardPhoto} onNext={afterReward} />
                </motion.div>
              )}

              {phase === "roundend" && (
                <motion.div key={`end-${completedRoundRef.current}`} className="flex w-full justify-center">
                  <RoundEndScreen
                    message={content.roundEndMessages[(completedRoundRef.current - 1) % content.roundEndMessages.length] ?? ""}
                    photo={roundEndPhotos[completedRoundRef.current - 1] ?? ""}
                    isLastRound={false}
                    onNext={afterRoundEnd}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      )}

      {phase === "finale" && (
        <Finale
          fadeOutBackground={audio.fadeOutBackground}
          enabled={audio.enabled}
          unlocked={unlocked}
        />
      )}
    </div>
  );
}

/* Renders whichever activity fills the current slot, fed from the gift content. */
function ActivityView({
  slot,
  content,
  seed,
  onComplete,
}: {
  slot: Slot;
  content: GiftContent;
  seed: number;
  onComplete: () => void;
}) {
  switch (slot.kind) {
    case "memory": {
      const caption = content.memoryCaptions[slot.memoryIndex ?? 0] ?? "";
      return <Memory photo={slot.photo ?? ""} caption={caption} onComplete={onComplete} />;
    }
    case "trivia":
      return <Trivia item={content.trivia[slot.triviaIndex ?? 0]} seed={seed} onComplete={onComplete} />;
    case "sentence":
      return <Sentence item={content.sentences[slot.sentenceIndex ?? 0]} seed={seed} onComplete={onComplete} />;
    case "cardmatch":
      return <CardMatch pairs={content.cardmatch[slot.cardmatchIndex ?? 0]} seed={seed} onComplete={onComplete} />;
    case "jigsaw":
      return <Jigsaw photo={slot.photo ?? ""} seed={seed} onComplete={onComplete} />;
    case "wordsearch":
      return <WordSearch words={content.wordsearch[slot.wordsearchIndex ?? 0]} seed={seed} onComplete={onComplete} />;
    case "balloon":
      return <BalloonPop words={slot.balloonWords ?? []} onComplete={onComplete} />;
    default:
      return null;
  }
}
