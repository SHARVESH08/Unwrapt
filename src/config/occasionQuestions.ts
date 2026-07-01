/* Default trivia tuned per occasion, so a birthday gift doesn't ask the same
 * questions as a proposal. Used by the live demo (occasion switcher) and as the
 * themed seed for premade content. `custom` / fallback uses the generic set. */

import type { Occasion } from "../types/gift";
import type { TriviaItem } from "../game/types";
import { SAMPLE_GIFT } from "./sampleGift";

const BIRTHDAY: TriviaItem[] = [
  { question: "What makes the best birthday?", correct: "Being surrounded by people who love you", wrong: ["A pile of paperwork", "An early Monday alarm", "A very long queue"], funnyResponse: "Aw, no. Try again 🎂" },
  { question: "The perfect birthday cake is...", correct: "The one we share, icing and all", wrong: ["A stale biscuit", "A spreadsheet", "A rain check"], funnyResponse: "Sweeter than that 🍰" },
  { question: "A birthday wish should be...", correct: "Made with your eyes closed and heart open", wrong: ["Filed in triplicate", "Read off a card", "Skipped entirely"], funnyResponse: "Make a wish and guess again ✨" },
  { question: "How should we spend your day?", correct: "Exactly how you want to", wrong: ["Doing chores", "In a waiting room", "Stuck in traffic"], funnyResponse: "It's your day. Try again 🎈" },
  { question: "The best birthday gift is...", correct: "Another whole year of you", wrong: ["More cables", "A forgotten gift card", "Another mug"], funnyResponse: "Warmer 🎁 guess again" },
  { question: "Birthdays are really about...", correct: "Celebrating that you exist", wrong: ["Getting older", "Awkward singing", "Cleaning up after"], funnyResponse: "Nope, kinder than that 💛" },
];

const ANNIVERSARY: TriviaItem[] = [
  { question: "What's the best part of another year together?", correct: "Every ordinary day with you", wrong: ["Splitting the bills", "Arguing over the thermostat", "Sharing one armrest"], funnyResponse: "Aww, try again 💞" },
  { question: "Our story is best described as...", correct: "Still being written", wrong: ["Overdue at the library", "A cliffhanger forever", "Lost in the post"], funnyResponse: "Keep reading, guess again 📖" },
  { question: "The secret to us is...", correct: "Choosing each other, daily", wrong: ["A shared calendar", "Separate snacks", "Good wifi"], funnyResponse: "Warmer 💛 try again" },
  { question: "After all this time, you're still...", correct: "My favourite person", wrong: ["Hogging the blanket", "Late, somehow", "Ignoring the dishes"], funnyResponse: "Sweet try, but no 😊" },
  { question: "Where would I relive our first date?", correct: "Anywhere, as long as it's with you", wrong: ["The DMV", "A crowded airport", "A long meeting"], funnyResponse: "Not quite the spot 🌙" },
  { question: "What's worth toasting tonight?", correct: "Us, and everything still ahead", wrong: ["The unpaid invoice", "The to-do list", "The weather report"], funnyResponse: "Raise a glass and try again 🥂" },
];

const PROPOSAL: TriviaItem[] = [
  { question: "What's the answer to the biggest question?", correct: "Yes. Always yes", wrong: ["Let me check my calendar", "Ask again on Tuesday", "Maybe later"], funnyResponse: "You know the answer 😄 try again" },
  { question: "Forever sounds like...", correct: "Not nearly long enough with you", wrong: ["A very long meeting", "A slow loading screen", "An endless queue"], funnyResponse: "Warmer 💍 guess again" },
  { question: "The best adventure left to take is...", correct: "The rest of our lives", wrong: ["The morning commute", "A trip to the DMV", "The laundry pile"], funnyResponse: "Aim higher 🗺️ try again" },
  { question: "When I picture the future, I see...", correct: "You, right beside me", wrong: ["A tidy inbox", "A paid-off car", "A quiet phone"], funnyResponse: "Closer to my heart 💙" },
  { question: "Some things are just certain. Like...", correct: "Wanting you, always", wrong: ["Death and taxes", "Monday mornings", "Spam emails"], funnyResponse: "Softer than that 💫 try again" },
  { question: "The sweetest words to hear are...", correct: "\"It's always been you\"", wrong: ["\"Please hold\"", "\"Battery low\"", "\"See attached\""], funnyResponse: "Almost. Try again 💌" },
];

const JUST_BECAUSE: TriviaItem[] = [
  { question: "Why send this with no reason at all?", correct: "Because you deserve it, always", wrong: ["A clerical error", "A wrong number", "A slow afternoon"], funnyResponse: "Kinder than that 💛 try again" },
  { question: "The best kind of message is...", correct: "An unexpected I love you", wrong: ["A meeting invite", "A bill reminder", "A delivery update"], funnyResponse: "Warmer 😊 guess again" },
  { question: "What's worth celebrating today?", correct: "You, exactly as you are", wrong: ["Inbox zero", "A free parking spot", "A short queue"], funnyResponse: "Sweeter than that ✨" },
  { question: "A good day is mostly made of...", correct: "Little reasons to smile", wrong: ["Finished chores", "Quiet notifications", "Green traffic lights"], funnyResponse: "Aww, try again 🌤️" },
  { question: "What never needs an occasion?", correct: "Telling you you're loved", wrong: ["Doing taxes", "Charging your phone", "Watering the plants"], funnyResponse: "Warmer 💞 guess again" },
];

export function triviaForOccasion(occasion: Occasion): TriviaItem[] {
  switch (occasion) {
    case "birthday":
      return BIRTHDAY;
    case "anniversary":
      return ANNIVERSARY;
    case "proposal":
      return PROPOSAL;
    case "justBecause":
      return JUST_BECAUSE;
    default:
      return SAMPLE_GIFT.content.trivia;
  }
}

/* Themed trivia padded with the generic pool so it still satisfies the engine's
 * minimum count for a full playthrough (premade-content path in the builder). */
export function triviaForOccasionPadded(occasion: Occasion, min = 18): TriviaItem[] {
  const themed = triviaForOccasion(occasion);
  if (themed.length >= min) return themed;
  const filler = SAMPLE_GIFT.content.trivia.filter(
    (g) => !themed.some((t) => t.question === g.question),
  );
  return [...themed, ...filler].slice(0, Math.max(min, themed.length));
}
