/* The hand-ordered, inline event editor (shown in the Content step when the
 * giver turns off random order). One reorderable list where each "event" is a
 * specific activity, editable in place. Hover the gap between two events to
 * insert a new one of any type — Google-Forms style. */

import { useState, Fragment } from "react";
import { GripVertical, X, Plus, ChevronUp, ChevronDown } from "lucide-react";
import type { ActivityKind, TriviaItem, SentenceItem } from "../game/types";
import type { GiftContent, SlotSpec } from "../types/gift";
import { specId } from "./sequence";
import { Field, TextInput, StringListEditor } from "./fields";

const EVENT_TYPES: { kind: ActivityKind; label: string }[] = [
  { kind: "trivia", label: "Trivia question" },
  { kind: "sentence", label: "Fill-in sentence" },
  { kind: "memory", label: "Photo memory" },
  { kind: "wordsearch", label: "Word search" },
  { kind: "cardmatch", label: "Card match" },
  { kind: "balloon", label: "Balloon pop" },
  { kind: "jigsaw", label: "Jigsaw" },
];

const KIND_BADGE: Record<ActivityKind, string> = {
  trivia: "Trivia",
  sentence: "Sentence",
  memory: "Memory",
  jigsaw: "Jigsaw",
  wordsearch: "Word search",
  cardmatch: "Card match",
  balloon: "Balloon",
};

export function EventListEditor({
  sequence,
  content,
  onSequence,
  onContent,
  onEnsureKind,
}: {
  sequence: SlotSpec[];
  content: GiftContent;
  onSequence: (next: SlotSpec[]) => void;
  onContent: (patch: Partial<GiftContent>) => void;
  onEnsureKind: (kind: ActivityKind) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= sequence.length || from === to) return;
    const a = [...sequence];
    const [m] = a.splice(from, 1);
    a.splice(to, 0, m);
    onSequence(a);
  };
  const removeAt = (i: number) => onSequence(sequence.filter((_, idx) => idx !== i));

  const addAt = (index: number, kind: ActivityKind) => {
    let ref = 0;
    const patch: Partial<GiftContent> = {};
    switch (kind) {
      case "trivia":
        ref = content.trivia.length;
        patch.trivia = [...content.trivia, { question: "", correct: "", wrong: ["", "", ""], funnyResponse: "" }];
        break;
      case "sentence":
        ref = content.sentences.length;
        patch.sentences = [...content.sentences, { stem: "", options: ["", "", ""], correct: "" }];
        break;
      case "memory":
        ref = content.memoryCaptions.length;
        patch.memoryCaptions = [...content.memoryCaptions, ""];
        break;
      case "wordsearch":
        ref = content.wordsearch.length;
        patch.wordsearch = [...content.wordsearch, ["", "", ""]];
        break;
      case "cardmatch":
        ref = content.cardmatch.length;
        patch.cardmatch = [...content.cardmatch, ["", "", "", ""]];
        break;
      case "balloon": {
        const padded = [...content.balloonWords];
        while (padded.length % 6 !== 0) padded.push("");
        ref = padded.length / 6;
        patch.balloonWords = [...padded, "", "", "", "", "", ""];
        break;
      }
      case "jigsaw": {
        const used = sequence.filter((s) => s.kind === "jigsaw").map((s) => s.ref);
        ref = used.length ? Math.max(...used) + 1 : 0;
        break;
      }
    }
    if (Object.keys(patch).length) onContent(patch);
    onEnsureKind(kind);
    const next = [...sequence];
    next.splice(index, 0, { kind, ref });
    onSequence(next);
  };

  const updateAt = (kind: ActivityKind, ref: number, value: unknown) => {
    switch (kind) {
      case "trivia":
        onContent({ trivia: content.trivia.map((it, i) => (i === ref ? (value as TriviaItem) : it)) });
        break;
      case "sentence":
        onContent({ sentences: content.sentences.map((it, i) => (i === ref ? (value as SentenceItem) : it)) });
        break;
      case "memory":
        onContent({ memoryCaptions: content.memoryCaptions.map((c, i) => (i === ref ? (value as string) : c)) });
        break;
      case "wordsearch":
        onContent({ wordsearch: content.wordsearch.map((g, i) => (i === ref ? (value as string[]) : g)) });
        break;
      case "cardmatch":
        onContent({ cardmatch: content.cardmatch.map((g, i) => (i === ref ? (value as string[]) : g)) });
        break;
      case "balloon": {
        const words = [...content.balloonWords];
        while (words.length < ref * 6 + 6) words.push("");
        const v = value as string[];
        for (let i = 0; i < 6; i++) words[ref * 6 + i] = v[i] ?? "";
        onContent({ balloonWords: words });
        break;
      }
    }
  };

  return (
    <div className="flex flex-col">
      <AddGap onAdd={(k) => addAt(0, k)} />
      {sequence.map((spec, i) => (
        <Fragment key={specId(spec)}>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (dragIndex !== null && dragIndex !== i) {
                move(dragIndex, i);
                setDragIndex(i);
              }
            }}
            className={`flex gap-2 rounded-2xl border bg-surface/50 p-3 transition-colors ${
              dragIndex === i ? "border-accent" : "border-border"
            }`}
          >
            <div className="flex flex-col items-center gap-1 pt-1">
              <span
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragEnd={() => setDragIndex(null)}
                className="cursor-grab text-text-soft"
                title="Drag to reorder"
              >
                <GripVertical size={16} />
              </span>
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up" className="text-text-soft hover:text-text disabled:opacity-30">
                <ChevronUp size={15} />
              </button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === sequence.length - 1} aria-label="Move down" className="text-text-soft hover:text-text disabled:opacity-30">
                <ChevronDown size={15} />
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-body text-[11px] text-accent">
                  {i + 1} · {KIND_BADGE[spec.kind]}
                </span>
                <button type="button" onClick={() => removeAt(i)} aria-label="Remove event" className="text-text-soft hover:text-accent-2">
                  <X size={16} />
                </button>
              </div>
              <EventBody
                spec={spec}
                content={content}
                onChange={(v) => updateAt(spec.kind, spec.ref, v)}
              />
            </div>
          </div>
          <AddGap onAdd={(k) => addAt(i + 1, k)} />
        </Fragment>
      ))}
    </div>
  );
}

/* The hover-revealed insert affordance between events. */
function AddGap({ onAdd }: { onAdd: (kind: ActivityKind) => void }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="relative z-10 my-1">
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-accent/50 bg-bg-soft/95 p-2 shadow-lg">
          <span className="px-1 font-body text-xs text-text-soft">Add:</span>
          {EVENT_TYPES.map((t) => (
            <button
              key={t.kind}
              type="button"
              onClick={() => {
                onAdd(t.kind);
                setOpen(false);
              }}
              className="rounded-full border border-border bg-surface/70 px-3 py-1.5 font-body text-xs text-text-soft transition-colors hover:border-accent hover:text-text"
            >
              {t.label}
            </button>
          ))}
          <button type="button" onClick={() => setOpen(false)} className="ml-auto px-2 font-body text-xs text-text-soft hover:text-text">
            cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex h-7 items-center justify-center">
      <span className="absolute h-0.5 w-full rounded-full bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex scale-90 items-center gap-1.5 rounded-full border border-accent/60 bg-bg-soft px-4 py-1.5 font-body text-xs font-semibold text-accent opacity-0 shadow-[0_2px_10px_-4px_var(--c-glow)] transition-all duration-200 hover:bg-accent hover:text-surface hover:shadow-[0_4px_16px_-4px_var(--c-glow)] group-hover:scale-100 group-hover:opacity-100"
      >
        <Plus size={15} strokeWidth={2.5} /> Add event
      </button>
    </div>
  );
}

/* The inline editor for one event, by kind. */
function EventBody({
  spec,
  content,
  onChange,
}: {
  spec: SlotSpec;
  content: GiftContent;
  onChange: (value: unknown) => void;
}) {
  switch (spec.kind) {
    case "trivia": {
      const item = content.trivia[spec.ref] ?? { question: "", correct: "", wrong: ["", "", ""], funnyResponse: "" };
      const set = (p: Partial<TriviaItem>) => onChange({ ...item, ...p });
      return (
        <div className="flex flex-col gap-2">
          <TextInput value={item.question} onChange={(v) => set({ question: v })} placeholder="Ask something sweet…" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <TextInput value={item.correct} onChange={(v) => set({ correct: v })} placeholder="Correct answer" />
            <div className="grid grid-cols-3 gap-2">
              {item.wrong.map((w, wi) => (
                <TextInput key={wi} value={w} onChange={(v) => set({ wrong: item.wrong.map((x, i) => (i === wi ? v : x)) })} placeholder={`Wrong ${wi + 1}`} />
              ))}
            </div>
          </div>
          <TextInput value={item.funnyResponse} onChange={(v) => set({ funnyResponse: v })} placeholder="Playful reply when wrong" />
        </div>
      );
    }
    case "sentence": {
      const item = content.sentences[spec.ref] ?? { stem: "", options: ["", "", ""], correct: "" };
      const set = (p: Partial<SentenceItem>) => onChange({ ...item, ...p });
      return (
        <div className="flex flex-col gap-2">
          <TextInput value={item.stem} onChange={(v) => set({ stem: v })} placeholder="The best part of my day is ___." />
          <Field label="Options">
            <StringListEditor items={item.options} onChange={(o) => set({ options: o })} placeholder="An option…" addLabel="Add option" />
          </Field>
          <TextInput value={item.correct} onChange={(v) => set({ correct: v })} placeholder="Correct option (must match one above)" />
        </div>
      );
    }
    case "memory": {
      const caption = content.memoryCaptions[spec.ref] ?? "";
      return <TextInput value={caption} onChange={(v) => onChange(v)} placeholder="A little caption for a photo…" />;
    }
    case "wordsearch": {
      const board = content.wordsearch[spec.ref] ?? [];
      return <StringListEditor items={board} onChange={(b) => onChange(b)} placeholder="A word" addLabel="Add word" />;
    }
    case "cardmatch": {
      const flat = content.cardmatch[spec.ref] ?? [];
      return <CardMatchInline flat={flat} onChange={(f) => onChange(f)} />;
    }
    case "balloon": {
      const window = content.balloonWords.slice(spec.ref * 6, spec.ref * 6 + 6);
      while (window.length < 6) window.push("");
      return (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {window.map((w, i) => (
            <TextInput key={i} value={w} onChange={(v) => onChange(window.map((x, idx) => (idx === i ? v : x)))} placeholder={`Word ${i + 1}`} />
          ))}
        </div>
      );
    }
    case "jigsaw":
      return (
        <p className="font-body text-sm text-text-soft">
          A jigsaw of one of your photos — nothing to fill in.
        </p>
      );
  }
}

/* Inline pair editor for a single card-match game. */
function CardMatchInline({ flat, onChange }: { flat: string[]; onChange: (next: string[]) => void }) {
  const pairs: [string, string][] = [];
  for (let i = 0; i < flat.length; i += 2) pairs.push([flat[i] ?? "", flat[i + 1] ?? ""]);
  const write = (p: [string, string][]) => onChange(p.flat());

  return (
    <div className="flex flex-col gap-2">
      {pairs.map((p, pi) => (
        <div key={pi} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
          <TextInput value={p[0]} onChange={(v) => write(pairs.map((x, i) => (i === pi ? [v, x[1]] : x)))} placeholder="Card" />
          <span className="text-center text-text-soft">↔</span>
          <TextInput value={p[1]} onChange={(v) => write(pairs.map((x, i) => (i === pi ? [x[0], v] : x)))} placeholder="Matches with" />
          <button type="button" onClick={() => write(pairs.filter((_, i) => i !== pi))} aria-label="Remove pair" className="text-text-soft hover:text-accent-2">
            <X size={15} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => write([...pairs, ["", ""]])}
        className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-surface/60 px-3 py-1.5 font-body text-xs text-text-soft hover:border-accent hover:text-text"
      >
        <Plus size={13} /> Add pair
      </button>
    </div>
  );
}
