/* A complete, generic, out-of-the-box gift.
 *
 * This is SAMPLE/PLACEHOLDER content only — no personal data. It lets the player
 * run immediately for demos and development. The builder (Slice 3) will write
 * real GiftConfigs in this same shape. Pools are sized to satisfy the engine's
 * slot plan (see game/session.ts): trivia ≥18, memoryCaptions ≥16,
 * sentences ≥14, wordsearch ≥4, cardmatch ≥4, balloonWords ≥6.
 *
 * Photos use a public placeholder host so it works with zero setup; swap for
 * real resolved URLs in production. */

import type { GiftConfig } from "../types/gift";
import { DEFAULT_ADVENTURE_SETTINGS } from "../types/gift";

const ph = (seed: number, w = 1200, h = 1500) =>
  `https://picsum.photos/seed/gift-${seed}/${w}/${h}`;

const photoUrls = Array.from({ length: 14 }, (_, i) => ph(i + 1));

export const SAMPLE_GIFT: GiftConfig = {
  id: "sample",
  giftNumber: "SAMPLE01",
  ownerId: "demo",

  occasion: "proposal",
  mode: "proposal",
  recipientName: "Friend",
  secretCode: "always",
  theme: undefined,

  usePremadeQuestions: true,
  settings: DEFAULT_ADVENTURE_SETTINGS,

  content: {
    trivia: [
      { question: "What is the best way to spend a slow afternoon?", correct: "Together, doing nothing in particular", wrong: ["Filing taxes", "Sitting in traffic", "Reading the terms & conditions"], funnyResponse: "A noble guess, but no — try again 😄" },
      { question: "Which sounds like the perfect little trip?", correct: "A quiet place by the water", wrong: ["A crowded airport queue", "The DMV", "A spreadsheet convention"], funnyResponse: "Not quite the dream destination 🌊" },
      { question: "What always makes a good day better?", correct: "An unexpected laugh", wrong: ["A flat tyre", "A dropped ice cream", "A slow wifi day"], funnyResponse: "Close-ish? No. Guess again 😆" },
      { question: "The best kind of evening is…", correct: "Cosy, warm, and unhurried", wrong: ["Loud and exhausting", "Cold and rainy indoors", "Full of chores"], funnyResponse: "Bless you for trying, but no 🕯️" },
      { question: "What's worth keeping forever?", correct: "The little moments", wrong: ["Old receipts", "Spam emails", "Single socks"], funnyResponse: "Hmm, think warmer 💛" },
      { question: "The nicest sound in the world is…", correct: "Someone you love laughing", wrong: ["A car alarm", "A 6am alarm clock", "A buffering video"], funnyResponse: "Try again, you 😊" },
      { question: "A perfect morning starts with…", correct: "No rush at all", wrong: ["A blaring alarm", "Cold coffee", "A long commute"], funnyResponse: "Brrr, no — guess warmer ☕" },
      { question: "What's the best thing to share?", correct: "Dessert (and everything else)", wrong: ["A cold", "An armrest fight", "The last parking spot"], funnyResponse: "So close. But no 🍰" },
      { question: "The best adventures are…", correct: "The ones we take together", wrong: ["The ones with no snacks", "The ones in the rain", "The ones that get cancelled"], funnyResponse: "Aww, try again 🗺️" },
      { question: "What never gets old?", correct: "A really terrible pun", wrong: ["A long meeting", "A pop-up ad", "A loading screen"], funnyResponse: "Groan-worthy guess. No 😆" },
      { question: "The cosiest place to be is…", correct: "Wherever you are", wrong: ["The back of a bus", "A waiting room", "A cold office"], funnyResponse: "Warmer… try again 🏡" },
      { question: "What's the best plan for a rainy day?", correct: "Stay in and be lazy together", wrong: ["Mow the lawn", "Wash the car", "Go for a long run"], funnyResponse: "Nope, cosier than that ☔" },
      { question: "A great story always has…", correct: "A happy ending", wrong: ["A cliffhanger forever", "An unpaid invoice", "A plot hole"], funnyResponse: "Keep going — try again 📖" },
      { question: "The best gift is…", correct: "Time spent together", wrong: ["More cables", "A gift card you forget", "Another mug"], funnyResponse: "Sweet try, but no 🎁" },
      { question: "What makes a house a home?", correct: "The people in it", wrong: ["The wifi password", "The thermostat", "The doorbell"], funnyResponse: "Warmer 💞 try again" },
      { question: "The best kind of surprise is…", correct: "A kind one", wrong: ["A surprise bill", "A surprise meeting", "A surprise exam"], funnyResponse: "Ha! No. Guess again 🎈" },
      { question: "What's better shared than alone?", correct: "Pretty much everything", wrong: ["A headache", "A parking ticket", "A bad cold"], funnyResponse: "Aw, try again 🤝" },
      { question: "The sweetest words to hear are…", correct: "\"I'm so glad it's you\"", wrong: ["\"Please hold\"", "\"Battery low\"", "\"See attached\""], funnyResponse: "Almost — try again 💌" },
      { question: "What's the heart of every good memory?", correct: "Who you were with", wrong: ["The receipts", "The weather report", "The parking situation"], funnyResponse: "Warmer still 💛" },
    ],
    sentences: [
      { stem: "The best part of any day is ___.", options: ["a long queue", "you", "paperwork"], correct: "you" },
      { stem: "Home is wherever ___ is.", options: ["the remote", "you", "the wifi"], correct: "you" },
      { stem: "I could spend forever ___.", options: ["in meetings", "with you", "on hold"], correct: "with you" },
      { stem: "My favourite adventure is ___.", options: ["the commute", "us", "the laundry"], correct: "us" },
      { stem: "Everything is better when it's ___.", options: ["shared", "rushed", "cancelled"], correct: "shared" },
      { stem: "The best sound is your ___.", options: ["ringtone", "laugh", "alarm"], correct: "laugh" },
      { stem: "I'd choose ___ every single time.", options: ["you", "the snooze button", "the long way"], correct: "you" },
      { stem: "Together we make even ordinary days feel ___.", options: ["long", "magic", "busy"], correct: "magic" },
      { stem: "The little things matter because ___.", options: ["they add up", "they're cheap", "they're small"], correct: "they add up" },
      { stem: "My favourite place is ___.", options: ["next to you", "the back row", "the waiting room"], correct: "next to you" },
      { stem: "You make me ___ more than anyone.", options: ["laugh", "wait", "worry"], correct: "laugh" },
      { stem: "The future looks best when it has ___ in it.", options: ["you", "deadlines", "traffic"], correct: "you" },
      { stem: "I'm luckiest when I'm ___.", options: ["with you", "off the clock", "asleep"], correct: "with you" },
      { stem: "Of all the things I love, ___ is the best.", options: ["you", "naps", "snacks"], correct: "you" },
    ],
    memoryCaptions: [
      "A moment worth keeping.",
      "One of the good ones.",
      "Just look at this.",
      "Caught a little magic here.",
      "This one always makes me smile.",
      "A favourite, no contest.",
      "Pure happiness, right here.",
      "Small moment, big feeling.",
      "Wouldn't trade this for anything.",
      "Still my favourite kind of day.",
      "A keeper, this one.",
      "Sunshine, basically.",
      "The kind of day you bottle up.",
      "Look how good this was.",
      "A little piece of joy.",
      "This — exactly this.",
    ],
    wordsearch: [
      ["HAPPY", "SMILE", "JOY", "LIGHT", "WARM"],
      ["LAUGH", "HEART", "HOME", "SHINE", "HUG"],
      ["DREAM", "STARS", "SWEET", "GLOW", "CALM"],
      ["LOVE", "KIND", "GIFT", "SPARK", "BLOOM"],
    ],
    cardmatch: [
      ["Sun", "Moon", "Tea", "Toast", "Star", "Sky", "Day", "Night"],
      ["Cosy", "Blanket", "Rain", "Window", "Book", "Candle", "Cat", "Nap"],
      ["Beach", "Wave", "Trip", "Map", "Song", "Dance", "Cake", "Wish"],
      ["Smile", "Laugh", "Hug", "Heart", "Walk", "Talk", "Home", "Us"],
    ],
    balloonWords: [
      "Joy", "Hope", "Smile", "Sweet", "Bright", "Warm",
      "Happy", "Shine", "Love", "Kind", "Glow", "Magic",
    ],
    rewardMessages: [
      "You're doing wonderfully ✨",
      "Look at you go 💛",
      "That smile suits you 😊",
      "One more lovely moment ⭐",
      "You make this look easy 🎈",
      "Keep going — it's worth it 💫",
      "Every step is a little gift 🎁",
      "You're amazing, you know 🌟",
      "Almost can't keep up with you 😄",
      "Saving the best for last 💝",
    ],
    roundEndMessages: [
      "Chapter one, done — and you're glowing.",
      "Two down. This is just the beginning.",
      "Halfway-ish, and getting sweeter.",
      "Look how far you've come already.",
      "Five chapters in. Still smiling?",
      "Nearly there — the best is close.",
      "One more after this. Hold on tight.",
      "Last chapter. Take a breath…",
    ],
    finale: {
      normal: {
        bigText: "YOU MADE IT 🎉",
        subText: "Thank you for playing — hope it made you smile.",
      },
      special: {
        bigText: "I LOVE YOU 💙",
        subText: "Every little step was leading here. It's always been you.",
      },
    },
  },

  media: {
    photosFolderUrl: undefined,
    photoUrls,
    finalePhotos: {
      normal: ph(101, 1400, 1600),
      special: ph(102, 1400, 1600),
      specialOnClick: ph(103, 1400, 1600),
    },
    audio: {
      loop: "default:soft-loop",
      normalEnding: "default:warm-ending",
      specialEnding: "default:love-ending",
    },
  },

  createdAt: "2026-06-28T00:00:00.000Z",
  updatedAt: "2026-06-28T00:00:00.000Z",
};
