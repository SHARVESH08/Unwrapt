/* Editors for the structured content pools. Each takes its slice of
 * GiftContent and an onChange. Kept deliberately simple — premade values seed
 * everything so nothing is ever blank. */

import { Trash2, Plus } from "lucide-react";
import type { TriviaItem, SentenceItem } from "../game/types";
import type { GiftContent } from "../types/gift";
import { Field, TextInput, TextArea, StringListEditor } from "./fields";

const cardClass =
  "flex flex-col gap-3 rounded-2xl border border-border bg-surface/40 p-4";
const addBtn =
  "inline-flex w-fit items-center gap-1 rounded-full border border-border bg-surface/60 px-4 py-2 font-body text-sm text-text-soft transition-colors hover:border-accent hover:text-text";
const delBtn =
  "inline-flex w-fit items-center gap-1 self-end rounded-full border border-border bg-surface/60 px-3 py-1.5 font-body text-xs text-text-soft transition-colors hover:border-accent-2 hover:text-accent-2";

export function TriviaEditor({
  items,
  onChange,
}: {
  items: TriviaItem[];
  onChange: (next: TriviaItem[]) => void;
}) {
  const set = (i: number, patch: Partial<TriviaItem>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const setWrong = (i: number, wi: number, v: string) =>
    set(i, { wrong: items[i].wrong.map((w, idx) => (idx === wi ? v : w)) });
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([
      ...items,
      { question: "", correct: "", wrong: ["", "", ""], funnyResponse: "" },
    ]);

  return (
    <div className="flex flex-col gap-4">
      {items.map((it, i) => (
        <div key={i} className={cardClass}>
          <Field label={`Question ${i + 1}`}>
            <TextInput value={it.question} onChange={(v) => set(i, { question: v })} placeholder="Ask something sweet…" />
          </Field>
          <Field label="Correct answer">
            <TextInput value={it.correct} onChange={(v) => set(i, { correct: v })} />
          </Field>
          <Field label="Wrong answers (3)">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {it.wrong.map((w, wi) => (
                <TextInput key={wi} value={w} onChange={(v) => setWrong(i, wi, v)} placeholder={`Wrong ${wi + 1}`} />
              ))}
            </div>
          </Field>
          <Field label="Playful reply when they're wrong">
            <TextInput value={it.funnyResponse} onChange={(v) => set(i, { funnyResponse: v })} />
          </Field>
          <button type="button" onClick={() => remove(i)} className={delBtn}>
            <Trash2 size={13} /> Remove question
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className={addBtn}>
        <Plus size={15} /> Add question
      </button>
    </div>
  );
}

export function SentenceEditor({
  items,
  onChange,
}: {
  items: SentenceItem[];
  onChange: (next: SentenceItem[]) => void;
}) {
  const set = (i: number, patch: Partial<SentenceItem>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([...items, { stem: "", options: ["", "", ""], correct: "" }]);

  return (
    <div className="flex flex-col gap-4">
      {items.map((it, i) => (
        <div key={i} className={cardClass}>
          <Field label={`Sentence ${i + 1}`} hint="Use ___ where the missing word goes.">
            <TextInput value={it.stem} onChange={(v) => set(i, { stem: v })} placeholder="The best part of my day is ___." />
          </Field>
          <Field label="Options">
            <StringListEditor
              items={it.options}
              onChange={(opts) => set(i, { options: opts })}
              placeholder="An option…"
              addLabel="Add option"
            />
          </Field>
          <Field label="Correct option" hint="Must match one of the options exactly.">
            <TextInput value={it.correct} onChange={(v) => set(i, { correct: v })} />
          </Field>
          <button type="button" onClick={() => remove(i)} className={delBtn}>
            <Trash2 size={13} /> Remove sentence
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className={addBtn}>
        <Plus size={15} /> Add sentence
      </button>
    </div>
  );
}

/* Word-search boards (each board = a list of words) and card-match games
 * (each game = a flat list of pairs: items 0&1, 2&3… belong together). */
export function GroupsEditor({
  groups,
  onChange,
  groupLabel,
  itemPlaceholder,
  hint,
}: {
  groups: string[][];
  onChange: (next: string[][]) => void;
  groupLabel: string;
  itemPlaceholder: string;
  hint?: string;
}) {
  const setGroup = (i: number, items: string[]) =>
    onChange(groups.map((g, idx) => (idx === i ? items : g)));
  const remove = (i: number) => onChange(groups.filter((_, idx) => idx !== i));
  const add = () => onChange([...groups, ["", ""]]);

  return (
    <div className="flex flex-col gap-4">
      {groups.map((g, i) => (
        <div key={i} className={cardClass}>
          <Field label={`${groupLabel} ${i + 1}`} hint={i === 0 ? hint : undefined}>
            <StringListEditor
              items={g}
              onChange={(items) => setGroup(i, items)}
              placeholder={itemPlaceholder}
              addLabel="Add"
            />
          </Field>
          <button type="button" onClick={() => remove(i)} className={delBtn}>
            <Trash2 size={13} /> Remove {groupLabel.toLowerCase()}
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className={addBtn}>
        <Plus size={15} /> Add {groupLabel.toLowerCase()}
      </button>
    </div>
  );
}

/* Card-match games. Each game is stored flat (items 0&1, 2&3 … are pairs) but
 * edited as explicit two-column rows, so a giver always enters complete pairs
 * and never has to count to an even number. */
export function CardMatchEditor({
  games,
  onChange,
}: {
  games: string[][];
  onChange: (next: string[][]) => void;
}) {
  const toPairs = (flat: string[]): [string, string][] => {
    const pairs: [string, string][] = [];
    for (let i = 0; i < flat.length; i += 2) pairs.push([flat[i] ?? "", flat[i + 1] ?? ""]);
    return pairs;
  };
  const setGame = (gi: number, pairs: [string, string][]) =>
    onChange(games.map((g, idx) => (idx === gi ? pairs.flat() : g)));

  const removeGame = (gi: number) => onChange(games.filter((_, idx) => idx !== gi));
  const addGame = () => onChange([...games, ["", "", "", ""]]);

  return (
    <div className="flex flex-col gap-4">
      {games.map((flat, gi) => {
        const pairs = toPairs(flat);
        const setPair = (pi: number, side: 0 | 1, v: string) =>
          setGame(
            gi,
            pairs.map((p, idx) => (idx === pi ? ((side === 0 ? [v, p[1]] : [p[0], v]) as [string, string]) : p)),
          );
        const removePair = (pi: number) =>
          setGame(gi, pairs.filter((_, idx) => idx !== pi));
        const addPair = () => setGame(gi, [...pairs, ["", ""]]);

        return (
          <div key={gi} className={cardClass}>
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-text-soft">Game {gi + 1}</span>
              <button type="button" onClick={() => removeGame(gi)} className={delBtn}>
                <Trash2 size={13} /> Remove game
              </button>
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
              {pairs.map((p, pi) => (
                <div key={pi} className="contents">
                  <input
                    value={p[0]}
                    onChange={(e) => setPair(pi, 0, e.target.value)}
                    placeholder="Card"
                    className="rounded-2xl border border-border bg-surface/70 px-4 py-2.5 font-body text-text outline-none transition-colors focus:border-accent"
                  />
                  <span className="px-1 text-center font-body text-text-soft">↔</span>
                  <input
                    value={p[1]}
                    onChange={(e) => setPair(pi, 1, e.target.value)}
                    placeholder="Matches with"
                    className="rounded-2xl border border-border bg-surface/70 px-4 py-2.5 font-body text-text outline-none transition-colors focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => removePair(pi)}
                    aria-label="Remove pair"
                    className="rounded-full border border-border bg-surface/60 p-2 text-text-soft transition-colors hover:border-accent-2 hover:text-accent-2"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addPair} className={addBtn}>
              <Plus size={15} /> Add pair
            </button>
          </div>
        );
      })}
      <button type="button" onClick={addGame} className={addBtn}>
        <Plus size={15} /> Add game
      </button>
    </div>
  );
}

export function FinaleEditor({
  finale,
  isProposal,
  onChange,
}: {
  finale: GiftContent["finale"];
  isProposal: boolean;
  onChange: (next: GiftContent["finale"]) => void;
}) {
  const setNormal = (patch: Partial<GiftContent["finale"]["normal"]>) =>
    onChange({ ...finale, normal: { ...finale.normal, ...patch } });
  const setSpecial = (patch: Partial<NonNullable<GiftContent["finale"]["special"]>>) =>
    onChange({
      ...finale,
      special: {
        bigText: finale.special?.bigText ?? "",
        subText: finale.special?.subText ?? "",
        ...patch,
      },
    });

  return (
    <div className="flex flex-col gap-5">
      <div className={cardClass}>
        <p className="font-display text-lg text-text">Normal ending</p>
        <Field label="Big text">
          <TextInput value={finale.normal.bigText} onChange={(v) => setNormal({ bigText: v })} placeholder="YOU MADE IT 🎉" />
        </Field>
        <Field label="Sub text">
          <TextArea value={finale.normal.subText} onChange={(v) => setNormal({ subText: v })} rows={2} />
        </Field>
      </div>

      {isProposal && (
        <div className={cardClass}>
          <p className="font-display text-lg text-text">Special ending (unlocked by the secret code)</p>
          <Field label="Big text">
            <TextInput value={finale.special?.bigText ?? ""} onChange={(v) => setSpecial({ bigText: v })} placeholder="I LOVE YOU 💙" />
          </Field>
          <Field label="Sub text">
            <TextArea value={finale.special?.subText ?? ""} onChange={(v) => setSpecial({ subText: v })} rows={2} />
          </Field>
        </div>
      )}
    </div>
  );
}
