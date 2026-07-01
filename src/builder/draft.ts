/* The builder's working shape — everything a giver edits, minus the server-set
 * fields (id / giftNumber / ownerId / timestamps). createGift / updateGift take
 * it from here. */

import type {
  GiftConfig,
  GiftContent,
  GiftMedia,
  Occasion,
  AdventureSettings,
} from "../types/gift";
import { DEFAULT_ADVENTURE_SETTINGS } from "../types/gift";
import { SAMPLE_GIFT } from "../config/sampleGift";
import { normalizeImageLink } from "../lib/drive";

export type GiftDraft = {
  occasion: Occasion;
  mode: "normal" | "proposal";
  recipientName: string;
  secretCode: string;
  usePremadeQuestions: boolean;
  settings: AdventureSettings;
  content: GiftContent;
  media: GiftMedia;
};

export const OCCASIONS: { value: Occasion; label: string }[] = [
  { value: "birthday", label: "Birthday" },
  { value: "anniversary", label: "Anniversary" },
  { value: "proposal", label: "Proposal" },
  { value: "justBecause", label: "Just because" },
  { value: "custom", label: "Custom" },
];

const clone = <T,>(v: T): T =>
  typeof structuredClone === "function"
    ? structuredClone(v)
    : JSON.parse(JSON.stringify(v));

/** A fresh draft seeded from the warm premade content. */
export function emptyDraft(): GiftDraft {
  return {
    occasion: "birthday",
    mode: "normal",
    recipientName: "",
    secretCode: "",
    usePremadeQuestions: true,
    settings: clone(DEFAULT_ADVENTURE_SETTINGS),
    content: clone(SAMPLE_GIFT.content),
    media: {
      photosFolderUrl: undefined,
      photoUrls: [],
      finalePhotos: undefined,
      audio: {
        loop: "default:soft-loop",
        normalEnding: "default:warm-ending",
        specialEnding: "default:love-ending",
      },
    },
  };
}

/** Turn an existing saved gift into an editable draft. */
export function draftFromGift(gift: GiftConfig): GiftDraft {
  return {
    occasion: gift.occasion,
    mode: gift.mode,
    recipientName: gift.recipientName,
    secretCode: gift.secretCode ?? "",
    usePremadeQuestions: gift.usePremadeQuestions,
    settings: clone(gift.settings ?? DEFAULT_ADVENTURE_SETTINGS),
    content: clone(gift.content),
    media: clone(gift.media),
  };
}

/** The premade content block (for the "use premade" path / resets). */
export function premadeContent(): GiftContent {
  return clone(SAMPLE_GIFT.content);
}

export function samplePhotoUrls(): string[] {
  return [...SAMPLE_GIFT.media.photoUrls];
}

export function sampleFinalePhotos() {
  return SAMPLE_GIFT.media.finalePhotos
    ? { ...SAMPLE_GIFT.media.finalePhotos }
    : undefined;
}

/** Build the create/update payload from a draft, applying premade + mode rules. */
export function draftToInput(draft: GiftDraft): Omit<
  GiftConfig,
  "id" | "giftNumber" | "ownerId" | "createdAt" | "updatedAt"
> {
  const isProposal = draft.mode === "proposal";
  // Hand-ordered adventures always edit real content, so never substitute premade.
  const content =
    draft.usePremadeQuestions && draft.settings.randomGameOrder
      ? premadeContent()
      : draft.content;

  // Photos: normalise any Drive file links → hotlinkable URLs; fall back to
  // sample so a gift is always playable for now.
  const entered = draft.media.photoUrls.map((u) => normalizeImageLink(u)).filter(Boolean);
  const photoUrls = entered.length ? entered : samplePhotoUrls();

  const fp = draft.media.finalePhotos;
  const finalePhotos = isProposal
    ? fp && fp.normal && fp.special && fp.specialOnClick
      ? {
          normal: normalizeImageLink(fp.normal),
          special: normalizeImageLink(fp.special),
          specialOnClick: normalizeImageLink(fp.specialOnClick),
        }
      : sampleFinalePhotos()
    : undefined;

  return {
    occasion: draft.occasion,
    mode: draft.mode,
    recipientName: draft.recipientName.trim(),
    secretCode: isProposal ? draft.secretCode.trim() || undefined : undefined,
    usePremadeQuestions: draft.usePremadeQuestions,
    settings: draft.settings,
    content,
    media: {
      photosFolderUrl: draft.media.photosFolderUrl,
      photoUrls,
      finalePhotos,
      audio: {
        loop: draft.media.audio.loop,
        normalEnding: draft.media.audio.normalEnding,
        specialEnding: isProposal ? draft.media.audio.specialEnding : undefined,
      },
    },
  };
}

/** Per-step validation. Returns an error string, or "" if the step is valid. */
export function validateStep(step: number, draft: GiftDraft): string {
  switch (step) {
    case 0:
      if (!draft.recipientName.trim()) return "Enter the recipient's name.";
      return "";
    case 1:
      if (draft.mode === "proposal" && !draft.secretCode.trim())
        return "A proposal needs a secret code for the special ending.";
      return "";
    default:
      return "";
  }
}
