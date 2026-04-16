LearnTube  |  AI Level Test  |  Dev Handoff  |  April 2026

**AI Level Test**

Developer Handoff Document

From: Shronit  |  To: Dev Team  |  Date: 14 April 2026

File: ai-level.jsx  |  Status: Ready for integration testing

|This document covers everything you need to take ai-level.jsx from artifact prototype to live test on learntube.ai. Read it fully before starting.|
| :- |


# **1. What This Is**
AI Level is a quick, viral engagement test that measures how well someone uses AI. It takes 3 minutes, asks 6 scenario-based questions, and gives the user a personalized score across two dimensions: their AI Level (0–4) and their AI Relationship Status (Single, Casual, Committed, Merged, or Complicated).

|This is NOT a standalone assessment product. It is a top-of-funnel engagement tool. The objective is: quick delight → share with friends → capture lead → convert to full assessment or learning path.|
| :- |

## **1.1 The Funnel**
The user journey this test powers:

1. User lands on the test page (via social share, ad, or direct link)
1. Takes 6 questions in ~3 minutes — each question reveals something about their AI skill
1. Sees a loading screen that builds anticipation (4.5 seconds)
1. Hits the lead capture gate — sees their level number + 3 locked insight cards, submits name + WhatsApp to unlock
1. Gets their full reveal: AI Level, Relationship Status, personalized insights, tips
1. Sees two product cards: “Prove your level” (full assessment with certification) and “Level up” (learning path with certification) — both “reserve your spot” intent captures
1. Shares their result card to WhatsApp, LinkedIn, Instagram — driving new users back to step 1

## **1.2 Success Metrics**
- Completion rate: % of users who start the test and reach the reveal screen
- Lead capture rate: % of completers who submit name + phone
- Share rate: % of users who tap the share button
- Reserve rate: % of users who tap either product card CTA
- Viral coefficient: new users driven per share (measured via referral link)

# **2. Technical Setup**
The entire test is a single React component in ai-level.jsx. It was built as a Claude artifact and needs to be integrated into a real web environment.

## **2.1 File Structure**
ai-level.jsx  —  Single file, ~1885 lines, self-contained React component

Exports: default function AILevel()

Dependencies: React (useState, useEffect, useRef, useCallback)

CSS: Tailwind utility classes (assumes Tailwind is configured in your project)

## **2.2 Integration Steps**
1. Add ai-level.jsx to your React project
1. Ensure Tailwind CSS is configured with the gray-950, blue-500, emerald-500, amber-500 color ranges
1. Import and render: import AILevel from './ai-level'; <AILevel />
1. The component manages all state internally — no props required
1. Lead data is stored on window.\_\_aiLevelLead and intent on window.\_\_aiLevelIntent — wire these to your backend (see Section 6)

# **3. UI Review & Improvements Needed**

|Test every screen on a real phone (not just browser DevTools). The primary audience will be on mobile via WhatsApp/Instagram share links.|
| :- |

## **3.1 Landing Page**
Current state: dark background, gradient text headline, LearnTube badge with 3M+ users, single CTA. Looks good in artifact, needs real-device testing.

Check and improve:

- Load performance — the page should paint in under 1 second. No layout shifts.
- The gradient text (“Find your AI Level”) uses bg-clip-text. Verify it renders on Safari iOS, Samsung Internet, and Chrome Android. If it fails on any, fall back to solid white.
- The CTA button should be immediately visible without scrolling on all common phone sizes (iPhone SE through iPhone 15 Pro Max, common Android devices). If justify-center pushes it below the fold on smaller screens, switch to a top-padded layout.
- Tap target: the CTA should be at least 48px tall with generous padding. Currently py-4 + text-lg — verify.
- Consider adding a subtle animation or micro-interaction to the CTA to draw attention (pulse, gentle glow, etc.)

## **3.2 Lead Capture Screen (Phone Screen)**
This is the highest-stakes screen for conversion. Current design: level number at top, 3 locked teaser cards with blurred text, form with name + WhatsApp + optional email.

Critical checks:

- All elements must fit in one fold on mobile WITHOUT scrolling. If the form inputs are below the fold, users will not convert. Test on iPhone SE (smallest common viewport at 375x667).
- The +91 prefix is hardcoded. For now this is fine (India-first launch), but note it for internationalization later.
- autoFocus on the name field should trigger the keyboard. Verify the keyboard doesn’t push content off-screen.
- The blurred teaser cards use CSS blur(4px) and userSelect: none. Verify the blur renders on all target browsers. The FOMO should feel real — the blurred text should be tantalizingly almost-readable.
- The “Unlock my results →” button is disabled until name (2+ chars) and phone (10 digits) are filled. Make sure the disabled state is clearly visually distinct from the enabled state.
- Input validation: phone only accepts digits and caps at 10. Test paste behavior (should strip non-digits).

## **3.3 Item Screens (Questions 1–6)**
Each question is a scenario-based interaction. The reveals between questions teach the user something. These are well-tested in artifact form. Key things to verify:

- Text-area inputs (Items 5b and 6) should handle mobile keyboard well — the submit button should remain visible when keyboard is open.
- The progress bar at the top should be accurate across all 6 items.
- Transitions between screens (ScreenTransition component, 300ms fade) should feel smooth, not janky.

## **3.4 Reveal Screen**
This is the money screen. It has 4 zones designed for progressive disclosure:

1. Hero: Level number + name + tagline + tier/percentile + relationship status (inline) + one hook insight
1. Product cards: “Prove your level” and “Level up with a learning path” — both “Reserve my spot” CTAs
1. Share: thumbnail card preview + share button side by side
1. Layered depth: expandable sections for full insights, tips, level scale, relationship types

Check:

- The animated number counter (AnimatedNumber component) should feel satisfying. Timing: ~1.2s with per-digit steps.
- The product cards should be immediately visible after the hero (within one scroll). If the hero is too tall on small phones, compress the animated number size.
- The “Reserve my spot” buttons should transition to “✓ You’re on the list” on tap and stay that way (state: proveReserved / improveReserved).
- The expandable sections in Zone 4 use max-h-96 for open state. If content is taller than 24rem, it will be clipped. Verify with long content or increase max-h.

# **4. Scoring Logic Audit**
The scoring engine is in computeLevel() (line 24) and computeRelationshipStatus() (line 138). It has been audited across 11 test scenarios. Here is the logic you need to verify:

## **4.1 Level Computation**
The level is computed from a total score (sum of a1 through a5) plus three gatekeeper signals:

|**Signal**|**What It Tests**|**How It Gates**|
| :- | :- | :- |
|Item 3 (Artifact Effect)|Can you tell substance from polish?|Wrong answer caps at Level 2, regardless of total score|
|Item 4 (Conversation Fork)|Do you iterate on reasoning or format?|Choosing A or B caps at Level 2|
|Item 6 (Follow-up depth)|Do you challenge AI or just ask for more detail?|item6Level < 3 prevents reaching Level 4|

The full decision tree:

if total <= 4  →  Level 0 (Non-User)

if total <= 7  →  Level 1 (Experimenter)

if Item3 wrong OR Item4 is A/B  →  Level 2 (Functional User)

if total >= 18 AND Item6 depth >= 3  →  Level 4 (AI-Native Performer)

if Item3 correct AND Item4 is C/D  →  Level 3 (Effective Practitioner)

else  →  Level 2

## **4.2 Test Scenarios to Verify**
Run through each of these manually and confirm the output matches:

|**Scenario**|**Key Signals**|**Expected Level**|**Expected Relationship**|
| :- | :- | :- | :- |
|All wrong, low engagement|total=3, Item3 wrong, Item4=A|L0|Single|
|Low engagement|total=6, Item3 wrong, Item4=B|L1|Casual|
|Decent but fails Item 3|total=12, Item3 wrong, Item4=C|L2|Casual|
|Passes Item 3, picks B on Item 4|total=14, Item3 correct, Item4=B|L2|Committed|
|Passes all gatekeepers|total=15, Item3 correct, Item4=C|L3|Merged|
|Expert, all maxed|total=19, Item3 correct, Item4=D, Item6=4|L4|Merged|
|High total but fails Item 3|total=18, Item3 wrong, Item4=C|L2|Committed|

## **4.3 Score Accumulation Per Item**
Verify each handler accumulates scores correctly:

- handleItem1: a3 += 1 if correct (chose A = human)
- handleItem2: a1 = 0–3 based on calibration accuracy, b1 adjusted if finance is wrong
- handleItem3: a3 += 1–4 based on correctness + confidence. item3Correct flag set.
- handleItem4: a4 = { A:1, B:2, C:4, D:4 }. item4Choice stored.
- handleItem5a: a1 += restraintScore (0–2, based on saying “skip AI” for apology/allergy)
- handleItem5b: a2 = scorePromptFix(text) → 1–3
- handleItem6: a5 = { 1:1, 2:2, 3:4, 4:5 }[scoreFollowUp(text)]. item6Level stored.

# **5. Subjective Question Scoring — Needs Upgrade**

|This is the biggest technical improvement needed. Currently, Items 5b and 6 use keyword matching + text length to score free-text responses. This is a placeholder. It needs an LLM-based evaluation layer.|
| :- |

## **5.1 Current State (Placeholder Logic)**
Item 5b (scorePromptFix): the user rewrites a bad sales prompt. Currently scored by:

- Checking for L3 keywords (closing, close rate, diagnose, pipeline, etc.) and L2 keywords (experience, years, focus on, etc.)
- Falling back to text length: >120 chars → L3, >70 chars → L2, else L1

Item 6 (scoreFollowUp): the user writes a follow-up question to challenge AI’s analysis. Currently scored by:

- Checking for L4 keywords (bet against, opposite, disagree, abandon, same data)
- L3 keywords (assumption, what if, counterargument, wrong, reframe, challenge)
- L2 keywords (morale, specific, numbers, how much, break down)
- L1 keywords (bullet, shorter, detail, explain, format, summary) or very short text

## **5.2 What Needs To Be Built**

|The scoring for these two items needs to call an LLM (Claude or GPT) via API to evaluate the QUALITY of the user’s response, not just check for keywords.|
| :- |

Recommended architecture:
### **5.2.1 API Endpoint**
Create a lightweight serverless function (Vercel Edge Function, Supabase Edge Function, or Cloudflare Worker) that:

1. Receives the user’s text + the item context (which question it is)
1. Calls Claude API (claude-haiku for speed, ~200ms) with a scoring rubric prompt
1. Returns a score (1–4) with a brief rationale

### **5.2.2 Scoring Rubric for Item 5b (Prompt Rewrite)**
The LLM should evaluate the rewritten prompt against:

- Does it include context about who the user is? (role, experience level, industry)
- Does it specify the actual problem? (not just “get better at sales” but “close rate dropped from 22% to 14%”)
- Does it tell AI what kind of output to produce? (format, depth, constraints)
- Does it set up a diagnostic conversation vs. asking for a list of tips?

|**Score**|**Criteria**|
| :- | :- |
|1 (Basic)|Rephrased the question without adding context or specificity. Still a generic query.|
|2 (Contextual)|Added some context (role, experience, or situation) but still asking for generic advice.|
|3 (Strategic)|Provided specific context + a real problem + constraints. Sets AI up as a thinking partner, not a search engine.|

### **5.2.3 Scoring Rubric for Item 6 (Follow-up Question)**
The LLM should evaluate the follow-up question against:

- Does it just ask for more detail on what AI already said? (L1—format iteration)
- Does it probe a specific aspect more deeply? (L2—depth)
- Does it challenge an assumption in AI’s analysis? (L3—critical thinking)
- Does it reframe the problem or introduce a contradictory hypothesis? (L4—strategic reframe)

|**Score**|**Criteria**|
| :- | :- |
|1 (Format)|Asks for formatting changes: bullets, shorter, more detail, summary.|
|2 (Depth)|Asks a probing question about a specific point but accepts AI’s frame.|
|3 (Challenge)|Challenges an assumption or identifies a gap in the analysis.|
|4 (Reframe)|Rejects AI’s frame entirely, proposes an alternative hypothesis, or introduces contradictory evidence.|

### **5.2.4 Implementation Notes**
- Call should be async — show a brief “thinking” state on the Continue button while waiting
- Set a 3-second timeout. If the API doesn’t respond, fall back to the current keyword-based scoring. The test should never feel slow.
- Cache nothing — each response must be evaluated fresh
- The API key should be in an environment variable, never in client-side code. The call must go through your backend.
- Use claude-3-5-haiku for speed. Full prompt + response should be <500 tokens.

# **6. Sharing Functionality**
The share system generates a 1080x1080 PNG share card via Canvas API and uses the Web Share API with a three-tier fallback:

|**Tier**|**Method**|**When It Triggers**|
| :- | :- | :- |
|1|navigator.share() with PNG file attachment|Mobile browsers that support file sharing (most modern Android/iOS)|
|2|navigator.share() with text + URL only|Browsers that support share but not file sharing|
|3|Auto-download PNG + copy share text to clipboard|Desktop browsers or any environment without Web Share API|

## **6.1 What to Test**
1. On iPhone Safari: tap Share → iOS share sheet should appear with the image + pre-filled text. User should be able to share to WhatsApp, Instagram Stories, iMessage.
1. On Android Chrome: tap Share → Android share sheet with image + text. Test WhatsApp, Instagram, LinkedIn.
1. On Desktop Chrome: tap Share → should download the PNG and show “Image saved + text copied!” message. User can then paste the text into any platform.
1. The share text includes: AI Level, level name, relationship status emoji, percentile, and the URL ai-level.learntube.ai. Verify it reads well when pasted.
1. The share card (1080x1080 canvas) should render correctly: level number large and centered, level name below, relationship status section, percentile pill, LearnTube branding at the bottom. Verify text wrapping for longer taglines.

|The share URL is currently ai-level.learntube.ai. Make sure this domain/subdomain is set up and points to the test before going live. The share text is the primary viral mechanism — a dead link kills the loop.|
| :- |

# **7. Data Capture & Backend Wiring**
Currently, all data is stored on window globals. This needs to be wired to a real backend before launch.

## **7.1 Lead Capture Data**
On form submit, window.\_\_aiLevelLead is set to:

{ name, phone: "+91...", email: null|string, level, timestamp }

Wire this to your lead capture API. This should fire immediately on form submit (before transitioning to the reveal screen).

## **7.2 Product Intent Data**
When a user taps either “Reserve my spot” button on the reveal screen, window.\_\_aiLevelIntent is set to:

{ prove: true|undefined, improve: true|undefined, lead: {...}, level, relationshipStatus, timestamp }

Wire this to a separate intent tracking endpoint. This tells you which product the user is interested in.

## **7.3 Analytics Events to Track**
- test\_started — user taps “Take the test” on landing
- item\_completed — for each of the 6 items (with item number)
- lead\_captured — form submitted on capture screen
- reveal\_viewed — reveal screen loaded
- product\_reserved — either CTA tapped (with type: prove|improve)
- share\_initiated — share button tapped
- share\_completed — share API resolved (vs. user cancelled)

# **8. Priority Order**
Do these in order. Each one unblocks the next.

|**Priority**|**Task**|**Why**|
| :- | :- | :- |
|P0|Integrate into web project + test on real phones|Nothing else matters until it runs outside the artifact|
|P0|Wire lead capture to backend|Every test-taker without backend capture is a lost lead|
|P0|Set up ai-level.learntube.ai domain|Dead share link kills the viral loop|
|P1|Fix any mobile UI issues found in testing|Mobile is 90%+ of traffic|
|P1|Wire share functionality end-to-end|This is the growth engine|
|P1|Wire product intent capture to backend|Captures monetization intent|
|P2|Build LLM scoring endpoint for Items 5b and 6|Improves accuracy but keyword fallback works for launch|
|P2|Add analytics events|Needed for optimization but not for first live test|
|P3|Internationalize phone prefix|India-first is fine for pilot|

|When P0 and P1 are done, we are ready to push traffic to this. P2 items improve quality but should not block the first live test.|
| :- |

Confidential  |  Page 
