# Hosted Gift Builder

A hosted website where anyone can build and send a personalised, cinematic
"adventure" gift. Built by reusing the player engine from a one-off personal
gift, made **config-driven** so every personal field is user-supplied data —
no personal content lives in this codebase.

## Status — Slices 1 & 2 complete

**Slice 1 — config-driven player.** The player renders entirely from a
`GiftConfig` (`src/types/gift.ts`); a generic sample (`src/config/sampleGift.ts`)
runs out of the box. Preserved mechanics: 64-slot deterministic seeded sequence
with resume, 7 activities, per-chapter palettes, reward/round-end screens, full
finale choreography (secret-code → special ending, tap-to-reveal photo, 28s
audio hold, crossfade loop).

**Slice 2 — Supabase + gift number.** Google sign-in (giver), a `gifts` table
with Row-Level Security, a receiver RPC (`get_gift_by_number`), routed pages
(landing / receive / play / dashboard / create), and the full
create → gift-number → receive → play loop.

**Slice 3 — builder wizard.** A 7-step create/edit wizard (`/app/new`,
`/app/edit/:id`): basics → ending (proposal + secret code) → content
(pre-made toggle, or full editors for trivia/sentences/captions/word-search/
card-match (2-column pairs)/balloon words/reward + chapter messages/finale) →
photos (URLs + finale photos) → music (bundled or custom) → **adventure
settings** → review. Dashboard gains Edit.

**Adventure settings (configurable per gift, in `settings`):**
- **Auto-scale** length to the content entered (8–64), or pick a fixed length.
- **Shuffle questions** on/off (random pick & order, or entered order).
- **Random game order** on/off (mixed types, or an even rotation).
- **Enable/disable** any of the 7 activity types.
- **Min-requirement gate** with an explainer popup: a fixed-length gift won't
  save until each segment has enough content; extras shuffle in across replays.
  Auto-scale never blocks (it shrinks to fit). Engine guarantees no repeats
  within a single play-through.
- **Occasion surprises**: ambient themed pop-ins (birthday cake & candles,
  anniversary/proposal hearts & roses, sparkles…) drifting in from the sides.

### One-time backend setup

1. Run `supabase/migrations/0001_gifts.sql` in Supabase → SQL Editor.
2. Supabase → Authentication → Providers → Google: enable + paste Google
   client id/secret. Redirect URI in Google: `https://<ref>.supabase.co/auth/v1/callback`.
3. Supabase → Authentication → URL Configuration: Site URL
   `http://localhost:5173`, add `http://localhost:5173/**` to Redirect URLs
   (add your Vercel URL when you deploy).
4. Copy `.env.example` → `.env` with your project URL + publishable key.

### Routes

`/` landing · `/receive` enter number · `/g/:number` play a gift ·
`/demo` play the sample · `/app` giver dashboard · `/app/new` create a gift.

**Slice 4 — Google Drive photos.** `src/lib/drive.ts` resolves a shared folder
link to image URLs via the Drive API (`VITE_GOOGLE_DRIVE_API_KEY`), using the
reliable `thumbnail?id=…&sz=w1600` endpoint; resolved URLs are stored at save
time. The builder's Photos step has a one-paste **Import from Google Drive**;
individual Drive file links pasted anywhere are auto-converted. Falls back to
direct URLs (and sample photos) when no key/folder is set.

### Google Drive setup (optional — for folder import)

1. Google Cloud Console → APIs & Services → **enable "Google Drive API"**.
2. Credentials → Create **API key**. Restrict it: HTTP referrers (your dev +
   prod origins) and API restriction = Drive API only.
3. Put it in `.env` as `VITE_GOOGLE_DRIVE_API_KEY=…`, restart dev.
4. Share a photo folder as “anyone with the link can view”, paste its link in
   the builder's Photos step → Import.

> Reliability (spec's #1 risk): Google can throttle Drive image hotlinking. We
> use the most reliable endpoint and store resolved URLs; if it ever breaks,
> only `driveThumbUrl` in `src/lib/drive.ts` needs changing. Truly private media
> would need proxying/storage (outside the free model).

### Remaining slices

5. Polish — commercial 3D landing, "My gifts" polish, default-audio library,
   sharing/privacy guidance, demo gift

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

## Key files

| Path | Purpose |
| --- | --- |
| `src/types/gift.ts` | `GiftConfig` — the one shape builder writes / player reads |
| `src/config/sampleGift.ts` | Generic out-of-the-box sample gift (placeholder content) |
| `src/config/GiftContext.tsx` | Provides the active gift to the player tree |
| `src/config/defaultAudio.ts` | `"default:<name>"` → bundled royalty-free track resolver |
| `src/game/session.ts` | 64-slot deterministic sequence builder (fed by config) |
| `src/components/Finale.tsx` | Finale choreography (text/photos/audio from config) |

Default audio: drop royalty-free `.mp3`s into `public/assets/audio/`
(see the README there). Missing tracks degrade to silence.
