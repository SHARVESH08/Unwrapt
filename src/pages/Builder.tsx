import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import type { ActivityKind } from "../game/types";
import type { GiftConfig, GiftContent, AdventureSettings } from "../types/gift";
import { ALL_ACTIVITY_KINDS } from "../types/gift";
import { fullSpecs } from "../builder/sequence";
import { EventListEditor } from "../builder/eventList";
import { OccasionSurprises } from "../components/OccasionSurprises";
import { useAuth } from "../auth/AuthContext";
import { createGift, updateGift, getMyGift } from "../lib/gifts";
import { buildAdventurePlan, requirementsFor } from "../game/plan";
import { resolveFolderToUrls, isDriveConfigured } from "../lib/drive";
import { PageShell } from "../components/ui/PageShell";
import { Button } from "../components/ui/button";
import { Modal } from "../components/ui/Modal";
import {
  type GiftDraft,
  OCCASIONS,
  emptyDraft,
  draftFromGift,
  draftToInput,
  premadeContent,
  samplePhotoUrls,
  validateStep,
} from "../builder/draft";
import {
  Field,
  TextInput,
  TextArea,
  Select,
  Toggle,
  StringListEditor,
} from "../builder/fields";
import {
  TriviaEditor,
  SentenceEditor,
  GroupsEditor,
  CardMatchEditor,
  FinaleEditor,
} from "../builder/contentEditors";

const STEPS = ["Basics", "The ending", "Content", "Photos", "Music", "Adventure", "Review"];

const KIND_LABELS: Record<ActivityKind, string> = {
  trivia: "Trivia",
  sentence: "Sentences",
  memory: "Photo memories",
  jigsaw: "Jigsaw",
  wordsearch: "Word search",
  cardmatch: "Card match",
  balloon: "Balloon pop",
};

const LENGTH_OPTIONS = [8, 16, 24, 32, 40, 48, 56, 64];

/** Effective content + photo count for previews/requirements (mirrors save). */
function effective(draft: GiftDraft): { content: GiftContent; photoCount: number } {
  return {
    content: draft.usePremadeQuestions ? premadeContent() : draft.content,
    photoCount: draft.media.photoUrls.length || samplePhotoUrls().length,
  };
}

export function Builder() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user, configured, loading } = useAuth();

  const [draft, setDraft] = useState<GiftDraft>(() => emptyDraft());
  const [photosText, setPhotosText] = useState("");
  const [loadingGift, setLoadingGift] = useState(isEdit);
  const [editing, setEditing] = useState<GiftConfig | null>(null);

  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<GiftConfig | null>(null);
  const [reqOpen, setReqOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Load an existing gift in edit mode.
  useEffect(() => {
    if (!isEdit || !id) return;
    let active = true;
    getMyGift(id)
      .then((g) => {
        if (!active) return;
        if (g) {
          setEditing(g);
          setDraft(draftFromGift(g));
          setPhotosText(g.media.photoUrls.join("\n"));
        }
        setLoadingGift(false);
      })
      .catch(() => active && setLoadingGift(false));
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  const isProposal = draft.mode === "proposal";
  const patch = (p: Partial<GiftDraft>) => setDraft((d) => ({ ...d, ...p }));
  const patchContent = (p: Partial<GiftDraft["content"]>) =>
    setDraft((d) => ({ ...d, content: { ...d.content, ...p } }));
  const patchMedia = (p: Partial<GiftDraft["media"]>) =>
    setDraft((d) => ({ ...d, media: { ...d.media, ...p } }));
  const patchSettings = (p: Partial<AdventureSettings>) =>
    setDraft((d) => ({ ...d, settings: { ...d.settings, ...p } }));

  // Live requirements for the chosen settings (mirrors what will actually play).
  const eff = useMemo(() => effective(draft), [draft]);
  const req = useMemo(
    () => requirementsFor(eff.content, eff.photoCount, draft.settings),
    [eff, draft.settings],
  );
  const plannedLength = useMemo(
    () => buildAdventurePlan(eff.content, eff.photoCount, draft.settings).length,
    [eff, draft.settings],
  );

  // Turn manual ordering on/off. Going manual seeds the sequence from the
  // current content (once) and switches to editable content; the event editor
  // then owns both the sequence and the content from there.
  const setManualOrdering = (manual: boolean) => {
    if (!manual) {
      patchSettings({ randomGameOrder: true });
      return;
    }
    const seeded = draft.settings.manualSequence?.length
      ? draft.settings.manualSequence
      : fullSpecs(draft.content, draft.settings.enabledGames, draft.media.photoUrls.length || 1);
    patch({ usePremadeQuestions: false });
    patchSettings({ randomGameOrder: false, manualSequence: seeded });
  };

  const ensureKind = (k: ActivityKind) => {
    if (!draft.settings.enabledGames.includes(k))
      patchSettings({ enabledGames: [...draft.settings.enabledGames, k] });
  };

  const setPhotos = (text: string) => {
    setPhotosText(text);
    patchMedia({
      photoUrls: text.split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
    });
  };

  const next = () => {
    const v = validateStep(step, draft);
    if (v) return setError(v);
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const save = async () => {
    for (let s = 0; s <= 1; s++) {
      const v = validateStep(s, draft);
      if (v) {
        setStep(s);
        return setError(v);
      }
    }
    if (draft.settings.enabledGames.length === 0) {
      setStep(5);
      return setError("Enable at least one activity type.");
    }
    if (!draft.settings.randomGameOrder) {
      // Hand-ordered: just needs at least one activity in the sequence.
      if (!draft.settings.manualSequence?.length) {
        setStep(5);
        return setError("Add at least one activity to the order.");
      }
    } else {
      if (plannedLength === 0) {
        setStep(2);
        return setError("Add some content for at least one enabled game.");
      }
      // Min-requirement gate (fixed length only — auto-scale just shrinks to fit).
      if (!draft.settings.autoScale && !req.allMet) {
        setStep(5);
        setReqOpen(true);
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      const input = draftToInput(draft);
      if (isEdit && editing) {
        await updateGift({ ...editing, ...input });
        navigate("/app");
      } else {
        setCreated(await createGift(input));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the gift.");
      setSaving(false);
    }
  };

  if (!configured || (!loading && !user)) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="font-display text-3xl text-text">Please sign in first</h1>
          <Link to="/app"><Button>Go to sign in</Button></Link>
        </div>
      </PageShell>
    );
  }

  if (loadingGift) {
    return (
      <PageShell>
        <p className="text-center font-display text-2xl italic text-text-soft">Loading…</p>
      </PageShell>
    );
  }

  if (created) return <CreatedView gift={created} />;

  return (
    <PageShell wide>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
          <h1 className="font-display text-4xl text-text">
            {isEdit ? "Edit gift" : "Create a gift"}
          </h1>
          <Stepper step={step} onJump={(s) => s < step && setStep(s)} />
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-5"
          >
            {step === 0 && <BasicsStep draft={draft} patch={patch} />}
            {step === 1 && <EndingStep draft={draft} patch={patch} />}
            {step === 2 && (
              <ContentStep
                draft={draft}
                isProposal={isProposal}
                patch={patch}
                patchContent={patchContent}
                patchSettings={patchSettings}
                setManualOrdering={setManualOrdering}
                ensureKind={ensureKind}
              />
            )}
            {step === 3 && (
              <PhotosStep
                draft={draft}
                isProposal={isProposal}
                photosText={photosText}
                setPhotos={setPhotos}
                patchMedia={patchMedia}
              />
            )}
            {step === 4 && (
              <MusicStep draft={draft} isProposal={isProposal} patchMedia={patchMedia} />
            )}
            {step === 5 && (
              <AdventureStep
                draft={draft}
                patchSettings={patchSettings}
                plannedLength={plannedLength}
                req={req}
                onShowReq={() => setReqOpen(true)}
                onPreviewSurprises={() => setPreviewOpen(true)}
              />
            )}
            {step === 6 && (
              <ReviewStep draft={draft} isProposal={isProposal} plannedLength={plannedLength} />
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="font-display italic text-accent-2">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          {step === 0 ? (
            <Link to="/app" className="font-body text-sm text-text-soft hover:text-text hover:underline">
              ← Cancel
            </Link>
          ) : (
            <Button variant="ghost" onClick={back}>← Back</Button>
          )}

          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Next →</Button>
          ) : (
            <Button size="lg" onClick={save} disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create gift"}
            </Button>
          )}
        </div>
      </div>

      <RequirementsModal
        open={reqOpen}
        onClose={() => setReqOpen(false)}
        req={req}
        autoScale={draft.settings.autoScale}
      />

      <SurprisesPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        occasion={draft.occasion}
        customEmojis={draft.settings.customEmojis ?? []}
      />
    </PageShell>
  );
}

function SurprisesPreviewModal({
  open,
  onClose,
  occasion,
  customEmojis,
}: {
  open: boolean;
  onClose: () => void;
  occasion: GiftConfig["occasion"];
  customEmojis: string[];
}) {
  return (
    <Modal open={open} onClose={onClose} title="Surprises preview">
      <p className="mb-3 font-body text-sm text-text-soft">
        A peek at the themed touches that drift past during the adventure.
      </p>
      <div className="relative h-72 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#1a0a12] to-[#0c0610]">
        {open && (
          <OccasionSurprises
            occasion={occasion}
            active
            customEmojis={customEmojis}
            contained
            rate={3}
          />
        )}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="font-display text-lg italic text-text-soft/70">
            …your adventure plays here…
          </span>
        </div>
      </div>
    </Modal>
  );
}

function RequirementsModal({
  open,
  onClose,
  req,
  autoScale,
}: {
  open: boolean;
  onClose: () => void;
  req: ReturnType<typeof requirementsFor>;
  autoScale: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title="A little more content">
      <p className="font-body text-sm text-text-soft">
        For a <b className="text-text">{req.length}-activity</b> adventure, add at
        least this many in each segment. Anything <b className="text-text">extra</b>{" "}
        isn't wasted — it gets shuffled in across replays, so no two play-throughs
        feel the same.
      </p>
      <ul className="mt-4 flex flex-col gap-1.5">
        {req.requirements.map((r) => (
          <li
            key={r.kind}
            className={`flex items-center justify-between rounded-xl border px-4 py-2 font-body text-sm ${
              r.ok ? "border-border/60 text-text-soft" : "border-accent-2/70 text-text"
            }`}
          >
            <span>{r.label}</span>
            <span className={r.ok ? "text-text-soft" : "font-semibold text-accent-2"}>
              {r.have} / {r.required} {r.ok ? "✓" : ""}
            </span>
          </li>
        ))}
      </ul>
      {autoScale && (
        <p className="mt-4 font-body text-xs text-text-soft/80">
          Auto-scale is on, so the adventure simply shrinks to fit what you add —
          you won't get blocked. Turn it off to lock a fixed length.
        </p>
      )}
      <div className="mt-5 flex justify-end">
        <Button onClick={onClose}>Got it</Button>
      </div>
    </Modal>
  );
}

function Stepper({ step, onJump }: { step: number; onJump: (s: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STEPS.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => onJump(i)}
          className={`rounded-full px-3 py-1 font-body text-xs transition-colors ${
            i === step
              ? "bg-accent text-surface"
              : i < step
                ? "border border-border text-text-soft hover:text-text"
                : "border border-border/50 text-text-soft/50"
          }`}
        >
          {i + 1}. {label}
        </button>
      ))}
    </div>
  );
}

function BasicsStep({ draft, patch }: { draft: GiftDraft; patch: (p: Partial<GiftDraft>) => void }) {
  return (
    <>
      <Field label="Recipient's name" hint="They'll type this exactly to enter their gift.">
        <TextInput value={draft.recipientName} onChange={(v) => patch({ recipientName: v })} placeholder="e.g. Alex" />
      </Field>
      <Field label="Occasion">
        <Select value={draft.occasion} onChange={(v) => patch({ occasion: v })} options={OCCASIONS} />
      </Field>
    </>
  );
}

function EndingStep({ draft, patch }: { draft: GiftDraft; patch: (p: Partial<GiftDraft>) => void }) {
  const isProposal = draft.mode === "proposal";
  return (
    <>
      <Toggle
        checked={isProposal}
        onChange={(v) => patch({ mode: v ? "proposal" : "normal" })}
        label="This is a proposal"
        description="Unlocks a special hidden ending, revealed only with a secret code."
      />
      {isProposal && (
        <Field label="Secret code" hint="They type this under their name to unlock the special ending.">
          <TextInput value={draft.secretCode} onChange={(v) => patch({ secretCode: v })} placeholder="something only they'd know" />
        </Field>
      )}
      {!isProposal && (
        <p className="font-body text-sm text-text-soft">
          The gift ends with a warm, celebratory finale. Turn this on to add a
          private, code-locked ending instead.
        </p>
      )}
    </>
  );
}

function ContentStep({
  draft,
  isProposal,
  patch,
  patchContent,
  patchSettings,
  setManualOrdering,
  ensureKind,
}: {
  draft: GiftDraft;
  isProposal: boolean;
  patch: (p: Partial<GiftDraft>) => void;
  patchContent: (p: Partial<GiftDraft["content"]>) => void;
  patchSettings: (p: Partial<AdventureSettings>) => void;
  setManualOrdering: (manual: boolean) => void;
  ensureKind: (k: ActivityKind) => void;
}) {
  const c = draft.content;
  const manual = !draft.settings.randomGameOrder;

  return (
    <>
      <Toggle
        checked={draft.settings.randomGameOrder}
        onChange={(v) => setManualOrdering(!v)}
        label="Let the app order the activities (random)"
        description="On: the app picks & mixes activities. Off: arrange every activity by hand below, in the exact order they'll play."
      />

      {manual ? (
        /* Hand-ordered: one editable, reorderable list with hover-insert gaps. */
        <Section title="Your activities, in order">
          <p className="-mt-1 font-body text-xs text-text-soft">
            Drag to reorder, edit in place, and hover the gap between two cards to
            insert a new one of any type.
          </p>
          <EventListEditor
            sequence={draft.settings.manualSequence ?? []}
            content={c}
            onSequence={(next) => patchSettings({ manualSequence: next })}
            onContent={(p) => patchContent(p)}
            onEnsureKind={ensureKind}
          />
        </Section>
      ) : (
        <>
          <Toggle
            checked={draft.usePremadeQuestions}
            onChange={(v) =>
              patch(
                v
                  ? { usePremadeQuestions: true }
                  : { usePremadeQuestions: false, content: draft.content },
              )
            }
            label="Use warm pre-made content"
            description="Instant, generic-but-sweet questions and messages. Turn off to write your own."
          />

          {draft.usePremadeQuestions ? (
            <div className="rounded-2xl border border-border bg-surface/40 p-5">
              <p className="font-body text-text-soft">
                Using the built-in adventure content. The finale wording is still
                yours below.
              </p>
              <button
                type="button"
                onClick={() => patch({ usePremadeQuestions: false })}
                className="mt-2 font-body text-sm text-accent underline-offset-4 hover:underline"
              >
                Start from these and customise →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-7">
              <Section title="Trivia">
                <TriviaEditor items={c.trivia} onChange={(v) => patchContent({ trivia: v })} />
              </Section>
              <Section title="Fill-in-the-blank sentences">
                <SentenceEditor items={c.sentences} onChange={(v) => patchContent({ sentences: v })} />
              </Section>
              <Section title="Photo memory captions">
                <StringListEditor items={c.memoryCaptions} onChange={(v) => patchContent({ memoryCaptions: v })} placeholder="A little caption…" addLabel="Add caption" />
              </Section>
              <Section title="Word search boards">
                <GroupsEditor groups={c.wordsearch} onChange={(v) => patchContent({ wordsearch: v })} groupLabel="Board" itemPlaceholder="A word" hint="Short single words work best." />
              </Section>
              <Section title="Card-match games">
                <CardMatchEditor games={c.cardmatch} onChange={(v) => patchContent({ cardmatch: v })} />
              </Section>
              <Section title="Balloon words">
                <StringListEditor items={c.balloonWords} onChange={(v) => patchContent({ balloonWords: v })} placeholder="A happy word" addLabel="Add word" />
              </Section>
              <Section title="Reward messages">
                <StringListEditor items={c.rewardMessages} onChange={(v) => patchContent({ rewardMessages: v })} placeholder="Well done!" addLabel="Add message" />
              </Section>
              <Section title="Chapter-end messages (8)">
                <StringListEditor items={c.roundEndMessages} onChange={(v) => patchContent({ roundEndMessages: v })} placeholder="A chapter close…" addLabel="Add message" />
              </Section>
            </div>
          )}
        </>
      )}

      {/* Reward + chapter messages still apply in manual mode. */}
      {manual && (
        <>
          <Section title="Reward messages">
            <StringListEditor items={c.rewardMessages} onChange={(v) => patchContent({ rewardMessages: v })} placeholder="Well done!" addLabel="Add message" />
          </Section>
          <Section title="Chapter-end messages">
            <StringListEditor items={c.roundEndMessages} onChange={(v) => patchContent({ roundEndMessages: v })} placeholder="A chapter close…" addLabel="Add message" />
          </Section>
        </>
      )}

      <Section title="Finale wording">
        <FinaleEditor finale={c.finale} isProposal={isProposal} onChange={(v) => patchContent({ finale: v })} />
      </Section>
    </>
  );
}

function PhotosStep({
  draft,
  isProposal,
  photosText,
  setPhotos,
  patchMedia,
}: {
  draft: GiftDraft;
  isProposal: boolean;
  photosText: string;
  setPhotos: (t: string) => void;
  patchMedia: (p: Partial<GiftDraft["media"]>) => void;
}) {
  const fp = draft.media.finalePhotos ?? { normal: "", special: "", specialOnClick: "" };
  const setFp = (k: keyof typeof fp, v: string) =>
    patchMedia({ finalePhotos: { ...fp, [k]: v } });

  const [folderLink, setFolderLink] = useState(draft.media.photosFolderUrl ?? "");
  const [resolving, setResolving] = useState(false);
  const [driveMsg, setDriveMsg] = useState("");
  const [driveErr, setDriveErr] = useState("");

  const resolve = async () => {
    setDriveErr("");
    setDriveMsg("");
    setResolving(true);
    try {
      const { urls, count } = await resolveFolderToUrls(folderLink);
      if (count === 0) {
        setDriveErr("No images found in that folder.");
      } else {
        setPhotos(urls.join("\n"));
        patchMedia({ photosFolderUrl: folderLink });
        setDriveMsg(`Imported ${count} photo${count === 1 ? "" : "s"} from Drive.`);
      }
    } catch (e) {
      setDriveErr(e instanceof Error ? e.message : "Could not read that folder.");
    }
    setResolving(false);
  };

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/40 p-5">
        <p className="font-display text-lg text-text">Import from Google Drive</p>
        <p className="font-body text-xs text-text-soft">
          Share one folder as “anyone with the link can view”, then paste its link.
          We list its images and use them automatically.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={folderLink}
            onChange={(e) => setFolderLink(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/…"
            className="w-full rounded-2xl border border-border bg-surface/70 px-5 py-3 font-body text-text outline-none transition-colors focus:border-accent"
          />
          <Button onClick={resolve} disabled={resolving || !folderLink.trim() || !isDriveConfigured}>
            {resolving ? "Reading…" : "Import"}
          </Button>
        </div>
        {!isDriveConfigured && (
          <p className="font-body text-xs text-accent-2">
            Drive import needs <code>VITE_GOOGLE_DRIVE_API_KEY</code> in .env. You
            can still paste direct image links below.
          </p>
        )}
        {driveMsg && <p className="font-body text-xs text-text">{driveMsg}</p>}
        {driveErr && <p className="font-body text-xs text-accent-2">{driveErr}</p>}
        <p className="font-body text-[11px] text-text-soft/70">
          Heads-up: “anyone with the link” images are technically viewable by
          anyone who has the URL.
        </p>
      </div>

      <Field
        label="Photo URLs"
        hint="One per line. Direct image links, or individual Google Drive file links (auto-converted). Leave blank to use sample photos."
      >
        <TextArea value={photosText} onChange={setPhotos} rows={6} placeholder={"https://…/photo1.jpg\nhttps://…/photo2.jpg"} />
      </Field>
      <p className="font-body text-xs text-text-soft/70">
        {draft.media.photoUrls.length} photo
        {draft.media.photoUrls.length === 1 ? "" : "s"} added.
      </p>

      {isProposal && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface/40 p-5">
          <p className="font-display text-lg text-text">Finale photos</p>
          <p className="font-body text-xs text-text-soft">
            Leave blank to use placeholders for now.
          </p>
          <Field label="Shown if the code is NOT entered">
            <TextInput value={fp.normal} onChange={(v) => setFp("normal", v)} placeholder="Normal ending photo URL" />
          </Field>
          <Field label="Special photo (tappable)">
            <TextInput value={fp.special} onChange={(v) => setFp("special", v)} placeholder="Special photo URL" />
          </Field>
          <Field label="What it becomes on tap">
            <TextInput value={fp.specialOnClick} onChange={(v) => setFp("specialOnClick", v)} placeholder="Reveal photo URL" />
          </Field>
        </div>
      )}
    </>
  );
}

function MusicStep({
  draft,
  isProposal,
  patchMedia,
}: {
  draft: GiftDraft;
  isProposal: boolean;
  patchMedia: (p: Partial<GiftDraft["media"]>) => void;
}) {
  const a = draft.media.audio;
  const setAudio = (p: Partial<typeof a>) => patchMedia({ audio: { ...a, ...p } });
  return (
    <>
      <p className="font-body text-sm text-text-soft">
        Pick a bundled track or paste your own direct audio URL. (Bundled tracks
        play once you add royalty-free files to <code>public/assets/audio/</code>.)
      </p>
      <AudioField label="Background loop" defaultRef="default:soft-loop" value={a.loop} onChange={(v) => setAudio({ loop: v })} />
      <AudioField label="Normal ending" defaultRef="default:warm-ending" value={a.normalEnding} onChange={(v) => setAudio({ normalEnding: v })} />
      {isProposal && (
        <AudioField label="Special ending" defaultRef="default:love-ending" value={a.specialEnding ?? "default:love-ending"} onChange={(v) => setAudio({ specialEnding: v })} />
      )}
    </>
  );
}

function AudioField({
  label,
  defaultRef,
  value,
  onChange,
}: {
  label: string;
  defaultRef: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const mode = value === defaultRef ? "default" : value === "" ? "none" : "custom";
  return (
    <Field label={label}>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {(["default", "custom", "none"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() =>
                onChange(m === "default" ? defaultRef : m === "none" ? "" : "https://")
              }
              className={`rounded-full px-4 py-2 font-body text-sm capitalize transition-colors ${
                mode === m ? "bg-accent text-surface" : "border border-border text-text-soft hover:text-text"
              }`}
            >
              {m === "default" ? "Bundled track" : m === "none" ? "Silent" : "Custom URL"}
            </button>
          ))}
        </div>
        {mode === "custom" && (
          <TextInput value={value} onChange={onChange} placeholder="https://…/track.mp3" />
        )}
      </div>
    </Field>
  );
}

function AdventureStep({
  draft,
  patchSettings,
  plannedLength,
  req,
  onShowReq,
  onPreviewSurprises,
}: {
  draft: GiftDraft;
  patchSettings: (p: Partial<AdventureSettings>) => void;
  plannedLength: number;
  req: ReturnType<typeof requirementsFor>;
  onShowReq: () => void;
  onPreviewSurprises: () => void;
}) {
  const s = draft.settings;
  const manual = !s.randomGameOrder;
  const pill = (on: boolean) =>
    `rounded-full px-4 py-2 font-body text-sm transition-colors ${
      on ? "bg-accent text-surface" : "border border-border text-text-soft hover:text-text"
    }`;
  const chip = (on: boolean) =>
    `rounded-2xl border px-4 py-2.5 text-center font-body text-sm transition-colors ${
      on ? "border-accent bg-accent/15 text-text" : "border-border text-text-soft hover:border-accent/60"
    }`;

  const toggleKind = (k: ActivityKind) => {
    const has = s.enabledGames.includes(k);
    patchSettings({
      enabledGames: has ? s.enabledGames.filter((x) => x !== k) : [...s.enabledGames, k],
    });
  };

  if (manual) {
    // In hand-ordered mode the activities + order are set on the Content step.
    return (
      <>
        <div className="rounded-2xl border border-border bg-surface/40 p-5">
          <p className="font-display text-lg text-text">Hand-ordered adventure</p>
          <p className="mt-1 font-body text-sm text-text-soft">
            <b className="text-text">{s.manualSequence?.length ?? 0} activities</b> will
            play exactly as you arranged them on the Content step.
          </p>
        </div>
        <SurprisesControls
          draft={draft}
          patchSettings={patchSettings}
          onPreviewSurprises={onPreviewSurprises}
        />
      </>
    );
  }

  return (
    <>
      <Toggle
        checked={s.autoScale}
        onChange={(v) => patchSettings({ autoScale: v })}
        label="Auto-scale length to content"
        description="The adventure grows as you add more — up to 64 activities. Never blocks you."
      />
      {!s.autoScale && (
        <Field label="Adventure length" hint="How many activities before the finale (chapters of 8).">
          <div className="flex flex-wrap gap-2">
            {LENGTH_OPTIONS.map((n) => (
              <button key={n} type="button" onClick={() => patchSettings({ length: n })} className={pill(s.length === n)}>
                {n}
              </button>
            ))}
          </div>
        </Field>
      )}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface/40 px-5 py-3">
        <span className="font-body text-sm text-text-soft">Planned length</span>
        <span className="font-display text-xl text-text">{plannedLength} activities</span>
      </div>
      <Toggle
        checked={s.shuffleContent}
        onChange={(v) => patchSettings({ shuffleContent: v })}
        label="Shuffle the questions"
        description="On: random pick & order each play (extras rotate in). Off: your exact entered order."
      />

      <SurprisesControls
        draft={draft}
        patchSettings={patchSettings}
        onPreviewSurprises={onPreviewSurprises}
      />

      <Field label="Activities to include">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ALL_ACTIVITY_KINDS.map((k) => (
            <button key={k} type="button" onClick={() => toggleKind(k)} className={chip(s.enabledGames.includes(k))}>
              {KIND_LABELS[k]}
            </button>
          ))}
        </div>
      </Field>

      <button
        type="button"
        onClick={onShowReq}
        className="inline-flex w-fit items-center gap-1 font-body text-sm text-accent underline-offset-4 hover:underline"
      >
        ℹ︎ How much content do I need?
      </button>
      {!req.allMet && !s.autoScale && (
        <p className="font-body text-sm text-accent-2">
          Not enough content for a {req.length}-activity adventure yet — tap above to see what to add (or turn on auto-scale).
        </p>
      )}
    </>
  );
}

/* The surprises toggle + custom emojis + live preview link (shared by both modes). */
function SurprisesControls({
  draft,
  patchSettings,
  onPreviewSurprises,
}: {
  draft: GiftDraft;
  patchSettings: (p: Partial<AdventureSettings>) => void;
  onPreviewSurprises: () => void;
}) {
  const s = draft.settings;
  return (
    <div className="flex flex-col gap-2">
      <Toggle
        checked={s.surprises}
        onChange={(v) => patchSettings({ surprises: v })}
        label="Occasion surprises"
        description="Themed touches drift past — cake & candles, hearts, sparkles…"
      />
      {s.surprises && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface/30 p-4">
          <button
            type="button"
            onClick={onPreviewSurprises}
            className="self-start font-body text-sm text-accent underline-offset-4 hover:underline"
          >
            ▶ Preview surprises
          </button>
          <Field label="Your own emojis" hint="These drift in alongside the occasion set. One emoji (or short word) each.">
            <StringListEditor
              items={s.customEmojis ?? []}
              onChange={(v) => patchSettings({ customEmojis: v })}
              placeholder="🐱"
              addLabel="Add emoji"
            />
          </Field>
        </div>
      )}
    </div>
  );
}

function ReviewStep({
  draft,
  isProposal,
  plannedLength,
}: {
  draft: GiftDraft;
  isProposal: boolean;
  plannedLength: number;
}) {
  const c = draft.usePremadeQuestions ? premadeContent() : draft.content;
  const s = draft.settings;
  const manual = !s.randomGameOrder;
  const lengthLabel = manual
    ? `${s.manualSequence?.length ?? 0} activities (hand-ordered)`
    : `${plannedLength} activities${s.autoScale ? " (auto)" : ""}`;
  const rows: [string, string][] = [
    ["For", draft.recipientName || "—"],
    ["Occasion", draft.occasion],
    ["Ending", isProposal ? `Proposal · code “${draft.secretCode}”` : "Normal celebration"],
    ["Content", draft.usePremadeQuestions ? "Pre-made" : "Custom"],
    ["Length", lengthLabel],
    ["Games", `${s.enabledGames.length} of 7 enabled`],
    ["Order", manual ? "Hand-ordered" : s.shuffleContent ? "Shuffled · mixed" : "Entered order · mixed"],
    ["Surprises", s.surprises ? `On${s.customEmojis?.length ? ` (+${s.customEmojis.length} custom)` : ""}` : "Off"],
    ["Photos", String(draft.media.photoUrls.length || "sample placeholders")],
    ["Finale", `“${(isProposal && c.finale.special ? c.finale.special : c.finale.normal).bigText}”`],
  ];
  return (
    <div className="flex flex-col gap-4">
      <p className="font-body text-text-soft">Looks good? Create the gift to get a shareable number.</p>
      <dl className="overflow-hidden rounded-2xl border border-border bg-surface/40">
        {rows.map(([k, v], i) => (
          <div key={k} className={`flex justify-between gap-6 px-5 py-3 ${i ? "border-t border-border/60" : ""}`}>
            <dt className="font-body text-sm text-text-soft">{k}</dt>
            <dd className="text-right font-body text-text capitalize">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function CreatedView({ gift }: { gift: GiftConfig }) {
  return (
    <PageShell>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <p className="font-body text-sm uppercase tracking-[0.4em] text-text-soft">Your gift is ready</p>
        <h1 className="font-display text-3xl text-text">Send {gift.recipientName} this number:</h1>
        <div className="rounded-2xl border border-accent bg-surface/70 px-8 py-5 font-display text-4xl tracking-[0.35em] text-text">
          {gift.giftNumber}
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigator.clipboard.writeText(gift.giftNumber)}>Copy number</Button>
          <Link to={`/g/${gift.giftNumber}`}><Button variant="outline">Preview</Button></Link>
        </div>
        <Link to="/app" className="font-body text-sm text-text-soft hover:text-text hover:underline">← Back to my gifts</Link>
      </motion.div>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xl text-text">{title}</h2>
      {children}
    </section>
  );
}
