# AI Level Assessment — Dev Handoff Notes

## What This Is
Single-file React app (`ai-level.jsx`) — an AI proficiency assessment that generates a shareable badge. Built as a prototype in Claude; this doc captures everything the dev needs to take it to production.

---

## Changelog (This Session)

### Level System
- **L6 "Pioneer" exists but is not reachable in this assessment.** Max score from `computeLevel()` is 5. L6 is the aspirational ceiling — shown in scales, badge denominator (/6), and gap descriptions.
- Level names aligned between `LEVEL_DATA` (0-6), `LEVEL_SCALE` (0-6), `BADGE_GEM_TIERS` (0-6), badge `levelNames`, and self-select options (0-5, since L6 isn't achievable here).
- Removed all "4+" display logic. Level 4 now shows as "4".
- `BADGE_GEM_TIERS` has 7 entries (0-6). Badge shows "/6". L6 tier is RUBY.

### Scoring
- **goBack now restores scores.** Added `scoreSnapshots` array — each `navigate()` snapshots current scores; `goBack()` restores the previous snapshot. This prevents score accumulation when re-answering questions.

### Lead Capture
- **Country code dropdown** replaces hardcoded +91. 20 countries (IN, US, UK, AE, SG, AU, DE, FR, JP, CN, BR, NG, KE, ZA, ID, MY, PH, SA, QA, HK). Phone field accepts up to 15 digits.
- Phone is stored as `${countryCode}${phone}` in lead data.

### Badge (Share Card)
- Level denominator "/5" made larger (60px, 0.55 alpha) for feed-size readability.
- L0/L1 steel gem brightened — darker background, lighter gem colors for contrast.
- CTA section enlarged: "What's your AI Level?" at 22px bold, URL at 19px, tagline at 14px.
- Low-level badges (L0-L1) show "Now I know where I stand — growth starts here" instead of misleading "Top 95%" percentile.
- "3M+ assessed" changed to "4M+ assessed" everywhere.

### UX
- Progress bars added to Context, BehavioralFrequency, AIDiet, Item5b screens.
- All progress bars renumbered to sequential 1-10 across the assessment flow (Path C uses 1-12 for its extra screens).
- Item6 accepts `progressStep`/`progressTotal` props — set to 10/12 for Path C users so the bar doesn't show "full" when SystemBuilder still follows.
- Item6 text input state lifted to parent — persists through back navigation.
- Low-level share text reframed to make sharing attractive (self-awareness angle, not punishment).

### Technical Fixes
- `LoadingScreen`: `onDone` stored in ref to prevent stale closure.
- `PartnerModule`: `useEffect` dependency fixed (`questions.length`), `onSubmit` stored in ref.
- `handleShare`: Error handling now falls through to next method on any error (not just AbortError).

---

## Incomplete Functionality — Dev Must Build

### P0: LinkedIn Desktop Share
**The biggest gap.** `navigator.share` doesn't exist on desktop browsers (Chrome, Firefox, Safari desktop). Current fallback is download + clipboard copy — a 5-step manual process. Desktop is where LinkedIn lives.

**Options to implement:**
1. **LinkedIn Share API** — `window.open('https://www.linkedin.com/sharing/share-offsite/?url=...')` for URL sharing. Doesn't support image attachment natively.
2. **Upload-then-share flow** — Upload the badge image to a server, generate an OG-tagged URL for that specific badge, then share that URL to LinkedIn. LinkedIn will render the OG image as the preview. **This is the right approach.**
3. **Fallback UX improvement** — At minimum, show a clear 3-step instruction modal: "1. Image downloaded 2. Caption copied 3. Open LinkedIn" with a direct "Open LinkedIn" button.

### P1: Backend Lead Capture
- Current implementation stores lead data in `window.__aiLevelLead` (client-side only).
- Needs: Supabase/API endpoint to persist leads with level, relationship status, scores, timestamp.
- WhatsApp delivery integration (the UI promises "Sent to your WhatsApp — instantly").

### P1: Analytics Events
Track these events:
- `assessment_started` (landing → self-select)
- `assessment_completed` (reach loading screen)
- `lead_captured` (form submitted)
- `share_attempted` (share button clicked)
- `share_completed` (share API success)
- `share_fallback` (download+clipboard fallback)
- `challenge_sent` (challenge a friend)
- `prove_reserved` / `improve_reserved` (certification CTAs)

### P2: Backend Scoring Validation
- Client-side scoring is tamper-able. For production: send raw answers to backend, compute level server-side.
- Badge image could also be generated server-side (via canvas/sharp) with a signed URL to prevent forgery.

---

## Things to Keep in Mind

### Architecture
- **Single file.** ~3850 lines, all in one JSX. For production, consider splitting into: components/, screens/, scoring/, badge-renderer/.
- **No routing.** Navigation is state-driven (`screen` state + `history` array). Consider react-router for deep linking (e.g., sharing results URLs).
- **No state management.** All state in root component. Fine for this size, but if adding features, consider useReducer or zustand.

### Scoring Engine
- `computeLevel()` is the core logic. It uses gatekeeper items (Item 3 = Artifact Effect, Item 4 = iteration quality) to cap scores.
- Path routing (`determinePath`) sends advanced users to extra questions (WorkflowDesign, SystemBuilder).
- **Score range is 0-5 (max achievable).** L6 exists in the data model but `computeLevel()` never returns 6. Level 5 requires: workflowScore ≥ 3, systemBuilderScore ≥ 3, total ≥ 18, item6Level ≥ 3, featureDepth ≥ 3.
- `goBack` now snapshots and restores scores. If you change navigation logic, maintain this pattern.

### Badge Rendering
- `renderShareCard()` draws to a 1080×1080 Canvas. All coordinates are absolute pixels.
- `BADGE_GEM_TIERS` defines the color palette per level. The gem is a hexagonal shape with faceted lighting.
- Seeded PRNG (`_seed`) ensures sparkle positions are deterministic per level.
- Text rendering uses `spacedText()` helper for letter-spaced text (Canvas doesn't support CSS letter-spacing).

### Lead Capture Gate
- Gate is BEFORE results (by design — sunk cost drives conversion).
- The blurred preview cards create FOMO for locked content.
- Country code selector defaults to +91 (India). Consider auto-detecting via IP/timezone.
- Phone validation requires ≥10 digits. Some countries (SG, HK, QA) use 8-digit numbers — dev may want to lower to ≥7 or make validation country-aware.

### Relationship Status
- `RELATIONSHIP_DATA` has 5 statuses: single, casual, committed, merged, complicated.
- Resolution logic maps level + behavioral signals to a relationship status.
- "Complicated" triggers when signals contradict (high skill in some areas, dependency in others).

### Co-Branding
- `BRAND_CONFIG` at top of file supports partner branding, partner questions module, custom hashtags.
- Partner questions auto-skip if `partner_questions` is empty.

### Preview Mode
- `?preview=reveal` in URL skips to results with mock data (produces L3 result).
- Mock scores simulate a Path C profile (selfSelectedLevel=3, dietScore=4) but with workflow/systemBuilder at 0 (since those screens are skipped in preview).
- Useful for testing badge rendering and results screen without taking the assessment.

---

## File Structure
```
code/
  ai-level.jsx          — The full app (single file)
  ai-level-preview.html — Preview build (esbuild bundle)
  DEV-HANDOFF.md        — This file
```

## Badge PNGs (Reference)
```
v8_L0.png through v8_L5.png — Current badge renders per level (in parent folder)
```
