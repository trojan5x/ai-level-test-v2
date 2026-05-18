/**
 * LevelReveal Component - Final results screen
 * EXACT ORIGINAL extracted from App-old.jsx - NOT simplified!
 */

import React, { useState, useEffect, useRef } from 'react';
import ScreenTransition from '../ScreenTransition.jsx';
import FadeIn from '../FadeIn.jsx';
import Header from '../Header.jsx';
import { trackResultPageViewed, trackCTAClicked, identifyUser, trackLinkedInShareInitiated, trackLinkedInOAuthStarted, trackReferralLinkGenerated, trackLinkedInOAuthCompleted, trackLinkedInShareCompleted, trackLinkedInShareFailed, trackShareAttempted, trackShareCompleted, trackChallengeSent } from '../../mixpanel.js';
import { trackAnalyticsEvent, captureIntentData } from '../../supabase.js';
import { generateReferralId, createReferralLink } from '../../utils/referralGenerator.js';
import { generateLinkedInAuthUrl, linkedInSession, parseOAuthCallback, validateOAuthCallback, createLinkedInPostContent, getLinkedInRedirectUri } from '../../utils/linkedinAuth.js';
import { generateAIReportPDF } from '../../utils/pdfGenerator.js';
import { EnhancedScoring, mergeAssessmentScores, getAssessmentPrimaryTotal } from '../../utils/stateManager.js';

// ─── Level Data (EXACT ORIGINAL) ────────────────────────────
const LEVEL_DATA = {
  0: {
    name: "Non-User",
    tagline: "You haven't started yet — and that's fine. You're about to skip everyone else's mistakes.",
    color: "#64748b",
    tier: "Explorer",
  },
  1: {
    name: "Experimenter",
    tagline: "You've dipped your toes in. The gap between where you are and where AI could take you is bigger than you'd guess.",
    color: "#818cf8",
    tier: "Explorer",
  },
  2: {
    name: "Functional User",
    tagline: "You're getting real value from AI — but you're trusting the polish more than you should.",
    color: "#3b82f6",
    tier: "Practitioner",
  },
  3: {
    name: "Effective Practitioner",
    tagline: "You have judgment most people lack. You don't just use AI — you think with it.",
    color: "#10b981",
    tier: "Operator",
  },
  4: {
    name: "AI-Native Performer",
    tagline: "AI isn't a tool you use — it's how you work. Most people won't understand your workflow for another two years.",
    color: "#f59e0b",
    tier: "Strategist",
  },
  5: {
    name: "AI-Native Builder",
    tagline: "You don't just use AI — you build systems that make other people better at it.",
    color: "#f97316",
    tier: "Architect",
  },
  6: {
    name: "Frontier Contributor",
    tagline: "You're not just mastering the practice — you're advancing it. The frontier moves because of people like you.",
    color: "#ef4444",
    tier: "Pioneer",
  },
};

// ─── AI Relationship Status (EXACT ORIGINAL) ────────────────
const RELATIONSHIP_DATA = {
  single: {
    status: "Single",
    tier: "Pre-Tool",
    emoji: "💤",
    color: "#94a3b8",
    tagline: "You and AI haven't really met yet.",
    description: "No meaningful relationship with AI. You've heard of it, maybe tried it once, but it's not part of your life.",
  },
  casual: {
    status: "Casual",
    tier: "Tool",
    emoji: "👋",
    color: "#a78bfa",
    tagline: "You use AI when it's convenient — nothing serious.",
    description: "AI is a tool you pick up and put down. You get some value but haven't built a working relationship.",
  },
  committed: {
    status: "Committed",
    tier: "Colleague",
    emoji: "🤝",
    color: "#60a5fa",
    tagline: "You and AI have a real working relationship.",
    description: "You delegate, evaluate, and iterate with intention. AI has judgment you respect — and boundaries you enforce.",
  },
  merged: {
    status: "Merged",
    tier: "Symbiont",
    emoji: "🧬",
    color: "#34d399",
    tagline: "AI is part of how you think. The line is blurring.",
    description: "Your thinking and AI's are intertwined. You can't easily separate what you produce from what you co-produce.",
  },
  complicated: {
    status: "It's Complicated",
    tier: "Pet / Mixed",
    emoji: "🌀",
    color: "#fbbf24",
    tagline: "Your signals don't match. Something interesting is happening.",
    description: "You show signs of deep skill in some areas but dependency or blind spots in others. The gap is where the growth lives.",
  },
};

const LEVEL_SCALE = [
  { level: 0, name: "Non-User", short: "Haven't started", tier: "Explorer" },
  { level: 1, name: "Experimenter", short: "Dabbling", tier: "Explorer" },
  { level: 2, name: "Functional User", short: "Getting value", tier: "Practitioner" },
  { level: 3, name: "Effective Practitioner", short: "Real judgment", tier: "Operator" },
  { level: 4, name: "AI-Native Performer", short: "AI is how you work", tier: "Strategist" },
  { level: 5, name: "AI-Native Builder", short: "Builds AI systems", tier: "Architect" },
  { level: 6, name: "Frontier Contributor", short: "Advancing the field", tier: "Pioneer" },
];

const RELATIONSHIP_SCALE = [
  { key: "single", label: "Single", tierLabel: "Pre-Tool", short: "AI isn't part of your life yet" },
  { key: "casual", label: "Casual", tierLabel: "AI as Tool", short: "You pick it up and put it down" },
  { key: "committed", label: "Committed", tierLabel: "AI as Colleague", short: "Real working relationship" },
  { key: "merged", label: "Merged", tierLabel: "AI as Symbiont", short: "Thinking is intertwined" },
  { key: "complicated", label: "It's Complicated", tierLabel: "Mixed signals", short: "Strong in some areas, dependent in others" },
];

// ─── Helper Functions (EXACT ORIGINAL) ──────────────────────
function getPercentile(level) {
  const map = { 0: 95, 1: 65, 2: 34, 3: 12, 4: 5, 5: 1, 6: 0.1 };
  return map[level] || 34;
}

function getImprovementSuggestions(level, relationshipStatus) {
  const levelTips = {
    0: [
      "Try using AI for one real task this week — not a test, something you actually need done.",
      "Start with writing tasks: emails, summaries, brainstorms. AI is strongest where stakes are low and volume is high.",
    ],
    1: [
      "Give AI more context. Instead of 'help me with X,' tell it who you are, what you need, and what good looks like.",
      "After every AI response, ask yourself: 'Would I send this as-is?' If yes, you're probably not pushing hard enough.",
    ],
    2: [
      "When AI gives you something that looks good, pause and ask: 'Is this actually saying something specific?' That single question separates Level 2 from Level 3.",
      "Stop iterating on format. Start iterating on reasoning. Ask AI to justify its approach, not just polish its output.",
    ],
    3: [
      "Build your AI interactions into repeatable systems. The judgment you have should be encoded, not repeated manually each time.",
      "Start designing workflows where AI handles the right steps and you handle the rest — don't just add AI to existing processes.",
    ],
    4: [
      "You're at the frontier of individual performance. The next multiplier is helping others get here — teaching, building systems, sharing patterns.",
      "Challenge yourself: what would your work look like if AI could do 10x what it does today? Design for that future now.",
    ],
  };

  const relationshipTips = {
    single: "Your first step isn't learning prompts — it's finding one real problem AI can solve for you. The relationship starts with a real need.",
    casual: "You're treating AI like a search engine with extra steps. Try giving it a real problem and having a 5-turn conversation. See what happens when you push back on its first answer.",
    committed: "You've built a real working relationship. The next step is knowing when AI's judgment should override yours in specific domains — and when yours should override it.",
    merged: "Watch for cognitive dependency. Can you still do deep thinking without AI as a sounding board? The strongest position is 'merged by choice, independent by capability.'",
    complicated: "Your mixed signals are actually valuable data. The gap between your strong areas and weak areas tells you exactly what to work on. The fix isn't more AI — it's more deliberate AI.",
  };

  return {
    levelTips: levelTips[Math.min(level, 4)] || levelTips[4],
    relationshipTip: relationshipTips[relationshipStatus] || relationshipTips.casual,
  };
}

// Generate Insights (EXACT ORIGINAL)
function generateInsights(scores, level) {
  const edge = scores.item3Correct
    ? "You saw through the Artifact Effect when most people don't. You judge output by substance, not polish."
    : scores.item2Correct >= 3
      ? "You know AI's boundary — where it shines and where it breaks. That's rarer than it sounds."
      : "You're early in understanding what AI can and can't do. That's normal — and the fastest skill to build.";

  const instinct = !scores.item3Correct
    ? "You chose polish over substance. The Artifact Effect — trusting AI output because it looks professional — is the #1 thing keeping people at Level 2."
    : (scores.item4Choice === "B" || scores.item4Choice === "A")
      ? "When AI's output was 80% there, you focused on format instead of substance. The question isn't 'how does this look?' — it's 'is the reasoning right?'"
      : scores.restraintScore < 2
        ? "You're tempted to use AI everywhere. But knowing when NOT to use it is just as important as knowing when to."
        : "No major gaps in the quick assessment. The detailed breakdown would reveal the subtler patterns.";

  const bridges = {
    0: "Start by trying AI for one writing task this week. Just one. See what happens.",
    1: "Try giving ChatGPT more context — who you are, what you need, and what good looks like. That's the bridge.",
    2: "When AI gives you something that looks good, ask: 'Is this actually saying something specific?' That question changes everything.",
    3: "You have the judgment. Now build it into a system — workflows where AI handles the right steps and you handle the rest.",
    4: "You're at the frontier. The next step is building systems that uplift others — and pushing the boundary of what's possible.",
    5: "You build systems that make others better. The next step is advancing the practice itself.",
    6: "You're at the frontier. The practice evolves because people like you refuse to accept the current ceiling.",
  };

  return {
    edge,
    instinct,
    bridge: bridges[Math.min(level, 6)]
  };
}

// ─── Advanced Insight Engine for Beat 2 ──────────────────────────
function getStrengthInsight(scores, level) {
  if (scores.item3Correct && scores.item3bCorrect) return { icon: "🎯", label: "Double vision", text: "You saw through both the Artifact Effect and the Agreement Trap. That combination puts you ahead of 80%+ of test-takers." };
  if (scores.item3Correct) return { icon: "👁", label: "You see through polish", text: "You caught the Artifact Effect — AI's most common trick. Most people default to the professional-looking response. You didn't." };
  if (scores.item4Choice === "C" || scores.item4Choice === "D") return { icon: "🧠", label: "Strategic iterator", text: "When AI gave you a generic framework, you pushed back on the substance — not just the format. That's the skill gap between L2 and L3." };
  if (scores.restraintScore >= 2) return { icon: "🛡", label: "Restraint is a skill", text: "You knew when NOT to use AI. Apologies need your voice. Allergies need verified safety. You got both." };
  if (scores.item2Correct >= 3) return { icon: "🔬", label: "Calibration instinct", text: "You understand where AI shines and where it breaks. That boundary awareness is rarer than it sounds." };
  if (scores.behavFreqScore >= 3) return { icon: "🔄", label: "Mature habits", text: "Your day-to-day AI habits show maturity. You've moved past experimenting into consistent, intentional use." };
  return { icon: "✦", label: "You showed up", text: "Taking this assessment puts you ahead of 95% of people who talk about AI but never measure it." };
}

function getBlindSpotInsight(scores, level) {
  if (!scores.item3Correct && scores.item4Choice === "A") return { icon: "⚠", label: "The polish-and-accept trap", text: "AI fooled you with polish (Artifact Effect), and when its output was 80% there, you accepted it as-is. The fix: before using any AI output, ask 'is this actually saying something specific?'" };
  if (!scores.item3Correct) return { icon: "⚠", label: "The Artifact Effect got you", text: "You picked the polished response over the useful one. AI's formatting tricks your brain into trusting it. This is the #1 skill gap between L2 and L3." };
  if (scores.item3bCorrect === false && scores.item3Correct) return { icon: "⚠", label: "The yes-man slipped past", text: "You caught the Artifact Effect but missed the Agreement Trap. When AI agrees with you too easily, that's exactly when you should push hardest." };
  if (scores.item4Choice === "A" || scores.item4Choice === "B") return { icon: "⚠", label: "Format over substance", text: "When AI gave you an 80% draft, you polished the container instead of challenging the reasoning. The question isn't 'how does this look?' — it's 'is the logic right?'" };
  if (scores.restraintScore < 2) return { icon: "⚠", label: "No restraint boundary", text: "You'd use AI for an apology and for allergy recipes. Some tasks need your real voice. Others need verified safety. Knowing when to say 'not this one' is an underrated skill." };
  if (scores.item6Level <= 2) return { icon: "⚠", label: "Surface-level follow-up", text: "When AI gave you a generic analysis, your follow-up stayed surface-level. The high-value move: challenge the analysis itself, not just ask for more detail." };
  return { icon: "💡", label: "Room to explore", text: "Your assessment didn't flag major blind spots — but the quick test only covers 5 of 8 abilities. The full certification reveals the subtler patterns." };
}

function getGapDescription(level) {
  const gaps = {
    0: { you: "Haven't started using AI", next: "Can identify generic vs. specific AI output. Gives context in prompts. Building an AI vocabulary.", nextLevel: 1 },
    1: { you: "Experimenting, finding your footing", next: "Gets consistent daily value. Picks the right tool for the job. Iterates on outputs instead of accepting the first draft.", nextLevel: 2 },
    2: { you: "Getting real value from AI tools", next: "Sees through polished output. Challenges AI reasoning. Knows when AI should NOT be used. Evaluation instinct.", nextLevel: 3 },
    3: { you: "Real judgment with AI", next: "Designs workflows where AI handles the right steps. Builds reusable patterns.", nextLevel: 4 },
    4: { you: "AI is how you work", next: "Builds systems others use. Creates automation pipelines and team workflows.", nextLevel: 5 },
    5: { you: "Builds AI systems", next: "Advancing the practice itself — pushing the frontier of what's possible. L6 isn't reachable in this assessment.", nextLevel: 6 },
    6: { you: "Pioneer — advancing the frontier", next: null, nextLevel: null },
  };
  return gaps[Math.min(level, 6)];
}

// ─── Badge Tier Color System (Faceted Gem design) ───
const BADGE_GEM_TIERS = {
  0: { bg: ["#08090f","#0e1018"], gem: ["#5a657a","#7a869e","#95a0b8","#b0bcd0","#d0d8e8"], accent: "#95a0b8", sparkle: "#d0d8e8", name: "STEEL" },
  1: { bg: ["#08090f","#0e1018"], gem: ["#5a657a","#7a869e","#95a0b8","#b0bcd0","#d0d8e8"], accent: "#95a0b8", sparkle: "#d0d8e8", name: "STEEL" },
  2: { bg: ["#020e08","#041a0e"], gem: ["#047857","#059669","#10b981","#34d399","#6ee7b7"], accent: "#34d399", sparkle: "#a7f3d0", name: "EMERALD" },
  3: { bg: ["#020818","#06122d"], gem: ["#1e40af","#2563eb","#3b82f6","#60a5fa","#93c5fd"], accent: "#60a5fa", sparkle: "#bfdbfe", name: "SAPPHIRE" },
  4: { bg: ["#0a0318","#15082e"], gem: ["#6d28d9","#7c3aed","#8b5cf6","#a78bfa","#c4b5fd"], accent: "#a78bfa", sparkle: "#ddd6fe", name: "AMETHYST" },
  5: { bg: ["#140a00","#241600"], gem: ["#a16207","#ca8a04","#eab308","#fbbf24","#fde68a"], accent: "#fbbf24", sparkle: "#fef3c7", name: "GOLD" },
  6: { bg: ["#1a0000","#2d0505"], gem: ["#b91c1c","#dc2626","#ef4444","#f87171","#fca5a5"], accent: "#f87171", sparkle: "#fecaca", name: "RUBY" },
};

// ─── Share Card Rendering ─────────────────
function renderShareCard(canvas, level, levelData, relationshipData, percentile, referralLink = null, selfSelectedLevel = null) {
  const ctx = canvas.getContext("2d");
  const S = 1080;
  canvas.width = S;
  canvas.height = S;

  const t = BADGE_GEM_TIERS[Math.min(level, 6)] || BADGE_GEM_TIERS[0];
  const cx = S / 2;
  const levelDisplay = level >= 4 ? "4+" : String(level);

  let _seed = level * 1000 + 42;
  function rand() { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; }

  // Resolve relationship
  const REL_WORDS = { "Merged": "MERGED", "Committed": "COMMITTED", "It's Complicated": "IT’S COMPLICATED", "Casual": "CASUAL" };
  const relWord = relationshipData.status !== "Single" ? (REL_WORDS[relationshipData.status] || null) : null;

  // Helpers
  function hexToRgb(hex) { return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) }; }
  const accentRgb = hexToRgb(t.accent);
  const sparkleRgb = hexToRgb(t.sparkle);
  function hexPts(hcx, hcy, r) {
    const pts = [];
    for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i - Math.PI / 2; pts.push({ x: hcx + r * Math.cos(a), y: hcy + r * Math.sin(a) }); }
    return pts;
  }
  function drawHex(pts) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.closePath(); }
  function spacedText(text, x, y, sp) {
    let tw = 0; for (const ch of text) tw += ctx.measureText(ch).width + sp;
    let sx = x - tw / 2;
    for (const ch of text) { ctx.fillText(ch, sx + ctx.measureText(ch).width / 2, y); sx += ctx.measureText(ch).width + sp; }
  }

  // ═══ 1. BACKGROUND — Luxe radial + streaks + grain ═══
  const bgGrad = ctx.createRadialGradient(cx, 290, 50, cx, 290, 700);
  bgGrad.addColorStop(0, t.bg[1]); bgGrad.addColorStop(0.4, t.bg[0]); bgGrad.addColorStop(1, "#000000");
  ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, S, S);

  for (let i = 0; i < 8; i++) {
    const y = 80 + rand() * 500, alpha = 0.015 + rand() * 0.02;
    const sg = ctx.createLinearGradient(0, y, S, y);
    sg.addColorStop(0, "transparent");
    sg.addColorStop(0.3, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${alpha})`);
    sg.addColorStop(0.5, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${alpha * 1.5})`);
    sg.addColorStop(0.7, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},${alpha})`);
    sg.addColorStop(1, "transparent");
    ctx.fillStyle = sg; ctx.fillRect(0, y - 1, S, 2 + rand() * 3);
  }
  for (let i = 0; i < 10000; i++) { ctx.fillStyle = `rgba(255,255,255,${rand() * 0.04})`; ctx.fillRect(rand() * S, rand() * S, 1, 1); }

  // ═══ 2. TOP BAR ═══
  ctx.textBaseline = "middle"; ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "600 14px system-ui, -apple-system, sans-serif";
  let ltx = 60;
  for (const ch of "LEARNTUBE") { ctx.fillText(ch, ltx, 48); ltx += ctx.measureText(ch).width + 3; }

  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 12px system-ui, -apple-system, sans-serif";
  const rLabel = "AI PROFICIENCY SCORE";
  let rlx = S - 60;
  for (let i = rLabel.length - 1; i >= 0; i--) { const ch = rLabel[i], cw = ctx.measureText(ch).width; ctx.fillText(ch, rlx - cw / 2, 48); rlx -= cw + 2.5; }

  ctx.strokeStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.1)`;
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(60, 70); ctx.lineTo(S - 60, 70); ctx.stroke();

  // ═══ 3. GEM ═══
  const gemCy = 280, gemR = 200;

  // Glow behind gem
  const glowGrad = ctx.createRadialGradient(cx, gemCy + 20, 0, cx, gemCy + 20, gemR * 1.5);
  glowGrad.addColorStop(0, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.3)`);
  glowGrad.addColorStop(0.3, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.1)`);
  glowGrad.addColorStop(0.7, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.03)`);
  glowGrad.addColorStop(1, "transparent");
  ctx.fillStyle = glowGrad; ctx.fillRect(0, 0, S, S);

  const outerPts = hexPts(cx, gemCy, gemR);
  const center = { x: cx, y: gemCy };

  // Gem body
  drawHex(outerPts);
  const gemBodyGrad = ctx.createLinearGradient(cx - gemR, gemCy - gemR, cx + gemR, gemCy + gemR);
  gemBodyGrad.addColorStop(0, t.gem[0]); gemBodyGrad.addColorStop(0.5, t.gem[1]); gemBodyGrad.addColorStop(1, t.gem[0]);
  ctx.fillStyle = gemBodyGrad; ctx.fill();

  // Facets with lighting
  for (let i = 0; i < 6; i++) {
    const p1 = outerPts[i], p2 = outerPts[(i + 1) % 6];
    ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.closePath();
    const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
    const fg = ctx.createLinearGradient(center.x, center.y, midX, midY);
    if (i === 0 || i === 5) { fg.addColorStop(0, t.gem[2]); fg.addColorStop(0.5, t.gem[3]); fg.addColorStop(1, t.gem[4]); ctx.globalAlpha = 0.85; }
    else if (i === 1) { fg.addColorStop(0, t.gem[1]); fg.addColorStop(1, t.gem[3]); ctx.globalAlpha = 0.7; }
    else if (i === 2 || i === 3) { fg.addColorStop(0, t.gem[0]); fg.addColorStop(1, t.gem[1]); ctx.globalAlpha = 0.6; }
    else { fg.addColorStop(0, t.gem[1]); fg.addColorStop(1, t.gem[2]); ctx.globalAlpha = 0.65; }
    ctx.fillStyle = fg; ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Inner hex for depth
  const innerPts = hexPts(cx, gemCy, gemR * 0.55);
  drawHex(innerPts);
  const innerGrad = ctx.createRadialGradient(cx - 40, gemCy - 40, 0, cx, gemCy, gemR * 0.55);
  innerGrad.addColorStop(0, t.gem[3]); innerGrad.addColorStop(0.5, t.gem[2]); innerGrad.addColorStop(1, t.gem[1]);
  ctx.fillStyle = innerGrad; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;

  // Facet lines
  ctx.strokeStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.2)`; ctx.lineWidth = 0.8;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(innerPts[i].x, innerPts[i].y); ctx.lineTo(outerPts[i].x, outerPts[i].y); ctx.stroke(); }
  ctx.strokeStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.25)`; ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(outerPts[i].x, outerPts[i].y); ctx.stroke(); }

  // Rim light
  ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(outerPts[4].x, outerPts[4].y); ctx.lineTo(outerPts[5].x, outerPts[5].y); ctx.lineTo(outerPts[0].x, outerPts[0].y); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(outerPts[0].x, outerPts[0].y); ctx.lineTo(outerPts[1].x, outerPts[1].y); ctx.stroke();

  // Outer border
  drawHex(outerPts);
  ctx.strokeStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.4)`; ctx.lineWidth = 1.5; ctx.stroke();

  // Reflection line
  const reflY = gemCy + gemR + 12;
  const lineGr = ctx.createLinearGradient(cx - 200, 0, cx + 200, 0);
  lineGr.addColorStop(0, "transparent"); lineGr.addColorStop(0.3, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.12)`);
  lineGr.addColorStop(0.5, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.2)`); lineGr.addColorStop(0.7, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.12)`);
  lineGr.addColorStop(1, "transparent");
  ctx.strokeStyle = lineGr; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(cx - 260, reflY); ctx.lineTo(cx + 260, reflY); ctx.stroke();

  // Sparkles
  _seed = level * 1000 + 42;
  const numSparkles = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < numSparkles; i++) {
    const sa = -Math.PI * 0.8 + rand() * Math.PI * 1.2, sd = gemR * 0.5 + rand() * gemR * 0.7;
    const sx = cx + Math.cos(sa) * sd, sy = gemCy + Math.sin(sa) * sd * 0.7, ssz = 8 + rand() * 14;
    ctx.save(); ctx.globalAlpha = 0.7 + rand() * 0.3;
    const spG = ctx.createRadialGradient(sx, sy, 0, sx, sy, ssz * 2);
    spG.addColorStop(0, "rgba(255,255,255,0.6)"); spG.addColorStop(0.3, `rgba(${sparkleRgb.r},${sparkleRgb.g},${sparkleRgb.b},0.3)`); spG.addColorStop(1, "transparent");
    ctx.fillStyle = spG; ctx.fillRect(sx - ssz * 2, sy - ssz * 2, ssz * 4, ssz * 4);
    ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sx, sy - ssz); ctx.lineTo(sx, sy + ssz); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx - ssz, sy); ctx.lineTo(sx + ssz, sy); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ═══ 4. CONTENT ON GEM — number + /6 ═══
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 20; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 4;
  ctx.font = "900 170px system-ui, -apple-system, sans-serif";
  const levelMetrics = ctx.measureText(levelDisplay);
  const levelX = cx - 12;
  ctx.fillText(levelDisplay, levelX, gemCy + 20);

  ctx.font = "400 60px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.textAlign = "left";
  ctx.fillText("/ 6", levelX + levelMetrics.width / 2 + 10, gemCy + 18);

  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;

  // ═══ 5. BELOW GEM: Level name → Relationship → Stats ═══
  ctx.textAlign = "center";
  const levelNames = ["Non-User","Experimenter","Functional User","Effective Practitioner","AI-Native Performer","AI-Native Builder","Frontier Contributor"];
  const nameY = gemCy + gemR + 40;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "500 20px system-ui, -apple-system, sans-serif";
  spacedText((levelNames[level] || levelNames[0]).toUpperCase(), cx, nameY, 3);

  // Relationship — bold identity hook
  if (relWord) {
    const relLabelY = nameY + 46;
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "500 13px system-ui, -apple-system, sans-serif";
    spacedText("MY AI RELATIONSHIP", cx, relLabelY, 4);

    const relFontSize = relWord.length > 12 ? 56 : 64;
    ctx.font = `900 ${relFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = t.accent;
    const relWordY = relLabelY + 56;
    ctx.fillText(relWord, cx, relWordY);

    // Subtle glow behind word
    ctx.save();
    const tg = ctx.createRadialGradient(cx, relWordY, 0, cx, relWordY, 180);
    tg.addColorStop(0, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.06)`); tg.addColorStop(1, "transparent");
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = tg; ctx.fillRect(cx - 180, relWordY - 50, 360, 100);
    ctx.restore();
  }

  // Percentile / positioning line
  const pctDisplay = percentile || [95, 65, 34, 12, 5, 1][level] || 50;
  const pctY = relWord ? (nameY + 46 + 56 + 52) : (nameY + 60);
  ctx.font = "700 20px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#ffffff";
  if (level <= 1) {
    ctx.fillText("Now I know where I stand — growth starts here", cx, pctY);
  } else {
    ctx.fillText(`Top ${pctDisplay}% of professionals assessed`, cx, pctY);
  }

  // Credibility zone
  const divY = pctY + 26;
  ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(cx - 220, divY); ctx.lineTo(cx + 220, divY); ctx.stroke();

  const resY = divY + 24;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "400 13px system-ui, -apple-system, sans-serif";
  ctx.fillText("Assessment built on research from", cx, resY);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "700 17px system-ui, -apple-system, sans-serif";
  ctx.fillText("BCG  ·  Anthropic  ·  MIT", cx, resY + 24);

  const compY = resY + 56;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "400 12px system-ui, -apple-system, sans-serif";
  ctx.fillText("Professionals assessed from", cx, compY);
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "600 14px system-ui, -apple-system, sans-serif";
  ctx.fillText("Meta  ·  Amazon  ·  TCS  ·  Deloitte  ·  Infosys  ·  and more", cx, compY + 20);

  // ═══ 6. BOTTOM — curiosity nudge + URL ═══
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "700 22px system-ui, -apple-system, sans-serif";
  ctx.fillText("What’s your AI Level?", cx, S - 82);

  ctx.fillStyle = t.accent;
  ctx.font = "800 19px system-ui, -apple-system, sans-serif";
  
  // Use referral link if provided, otherwise use current origin
  const displayUrl = referralLink ? 
    referralLink.replace(/https?:\/\//, '') : 
    (typeof window !== 'undefined' ? window.location.host : "ai-level.learntube.ai");
  ctx.fillText(`Visit: ${displayUrl}`, cx, S - 52);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "500 14px system-ui, -apple-system, sans-serif";
  ctx.fillText("Free  ·  Under 10 min  ·  4M+ assessed", cx, S - 26);
}

// ─── Animated Components (EXACT ORIGINAL) ──────────────────
function AnimatedNumber({ target, color, duration = 1200 }) {
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const display = target >= 4 ? "4+" : String(target);

  useEffect(() => {
    if (target === 0) { setDone(true); return; }
    const steps = Math.min(target, 4);
    const interval = duration / steps;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setCurrent(i);
      if (i >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          setDone(true);
          setTimeout(() => setShowGlow(true), 200);
        }, 100);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Perfect circular background glow */}
      {done && showGlow && (
        <>
          <div
            className="absolute w-32 h-32 rounded-full blur-3xl opacity-20 animate-glow-bubble"
            style={{ backgroundColor: color }}
          />
          <div
            className="absolute w-40 h-40 rounded-full blur-xl opacity-10 animate-glow-bubble-delayed"
            style={{ backgroundColor: color }}
          />
        </>
      )}

      {/* Perfect circular border ring */}
      {done && (
        <div
          className="absolute w-36 h-36 border-2 rounded-full opacity-0 animate-[scaleIn_1s_ease-out_0.5s_forwards] pointer-events-none"
          style={{ borderColor: `${color}40` }}
        />
      )}

      <span
        className={`text-8xl font-extrabold transition-all duration-500 relative z-10 ${done
            ? "scale-100 drop-shadow-2xl"
            : "scale-110 animate-pulse-smooth"
          }`}
        style={{
          color,
          filter: showGlow ? `drop-shadow(0 0 20px ${color}40)` : 'none',
          textShadow: showGlow ? `0 0 30px ${color}60` : 'none'
        }}
      >
        {done ? display : current}
      </span>

    </div>
  );
}

function AnimatedPercentile({ target, duration = 1200 }) {
  const [current, setCurrent] = useState(100);

  useEffect(() => {
    const steps = 100 - target;
    if (steps <= 0) {
      setCurrent(target);
      return;
    }
    const interval = duration / steps;
    let i = 100;
    const timer = setInterval(() => {
      i--;
      setCurrent(i);
      if (i <= target) {
        clearInterval(timer);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [target, duration]);

  return current;
}

// ─── MAIN LEVELREVEAL COMPONENT (EXACT ORIGINAL) ───────────
function LevelReveal({ assessmentContext }) {
  const { state } = assessmentContext;
  
  const mergedScores = mergeAssessmentScores(state.assessment);
  const path = state.navigation?.assessmentPath || "B";
  const responses = state.assessment.responses || {};

  const level =
    state.results.level !== null && state.results.level !== undefined
      ? state.results.level
      : EnhancedScoring.computeLevel(mergedScores, path, responses);

  const scores = mergedScores;

  const totalScore =
    state.results.score !== undefined && state.results.score !== null
      ? state.results.score
      : getAssessmentPrimaryTotal(mergedScores);

  const leadData = state.user.leadData;
  const relationshipStatus =
    leadData?.relationshipStatus || state.results?.relationshipStatus || 'casual';
  
  // Perception gap analysis - compare self-selected vs actual level
  const selfSelectedLevel = state.assessment.calibration.selfSelectedLevel;
  const perceptionGap = selfSelectedLevel !== null ? selfSelectedLevel - level : null;
  
  // Generate insights from scores and level (like original)
  const insights = generateInsights(scores, level);
  
  // Advanced insights for Beat 2: The Mirror
  const strength = getStrengthInsight(scores, level);
  const blindSpot = getBlindSpotInsight(scores, level);
  const gapData = getGapDescription(level);
  
  const [stage, setStage] = useState(0);
  const [shareState, setShareState] = useState("idle"); // idle | sharing | shared | fallback
  const [linkedinState, setLinkedinState] = useState("idle"); // idle | generating | redirecting | shared | error
  const [linkedinModal, setLinkedinModal] = useState({
    isOpen: false,
    status: 'idle', // 'processing', 'success', 'error'
    message: '',
    error: null
  });
  const [proveReserved, setProveReserved] = useState(false);
  const [improveReserved, setImproveReserved] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [referralId, setReferralId] = useState(null);
  const [challengeSent, setChallengeSent] = useState(false);
  const [challengeLink, setChallengeLink] = useState(false);
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const data = LEVEL_DATA[level] || LEVEL_DATA[4];
  const relData = RELATIONSHIP_DATA[relationshipStatus] || RELATIONSHIP_DATA.casual;
  const percentile = getPercentile(level);
  const suggestions = getImprovementSuggestions(level, relationshipStatus);

  // Manager detection and context data
  const role = leadData?.role || '';
  const company = leadData?.company || '';
  const isManager = role && /\b(lead|manager|manag|director|head|vp|chief|founder|ceo|cto)\b/i.test(role);

  // Temporary button handler to download generated PDF for testing
  const handleTestPDFDownload = async () => {
    try {
      const mockLead = leadData || {
        name: "Test Candidate",
        phone: "+919876543210",
        email: "test@learntube.ai",
        level: level,
        relationshipStatus: relationshipStatus,
        scores: scores,
        referralId: referralId || "TEST_REF_123",
        timestamp: Date.now()
      };
      console.log("🧪 Simulating PDF generation and download for testing...", mockLead);
      const pdfBlob = await generateAIReportPDF(mockLead);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-level-test-report-${(mockLead.name || 'candidate').replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("⚠️ PDF download failed:", err);
    }
  };

  useEffect(() => {
    // Track Mixpanel result page viewed
    trackResultPageViewed({ score: totalScore, level: level });

    // Track reveal viewed (existing analytics)
    trackAnalyticsEvent('reveal_viewed', { level, relationshipStatus });

    const t1 = setTimeout(() => setStage(1), 800);
    const t2 = setTimeout(() => setStage(2), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [level, relationshipStatus, totalScore]);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 300);
    const t2 = setTimeout(() => setStage(2), 1000);
    const t3 = setTimeout(() => setStage(3), 1800);
    const t4 = setTimeout(() => setStage(4), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  // Render share card when share section appears
  useEffect(() => {
    if (stage >= 3 && previewRef.current) {
      renderShareCard(previewRef.current, level, data, relData, percentile, null, selfSelectedLevel);
    }
  }, [stage, level, data, relData, percentile]);

  // Handle LinkedIn OAuth callback parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (code || error) {
      // We have LinkedIn OAuth callback parameters
      setLinkedinModal({
        isOpen: true,
        status: 'processing',
        message: 'Processing LinkedIn authorization...',
        error: null
      });

      handleLinkedInCallback(code, state, error);
      
      // Clean URL parameters after handling
      const cleanUrl = window.location.pathname;
      window.history.replaceState(null, '', cleanUrl);
    }
  }, []);

  const shareText = `I'm AI Level ${level >= 4 ? "4+" : level} — ${data.name} ${relData.emoji}\nMy AI Relationship Status: ${relData.status}\n\nTop ${percentile}% of test-takers.\nWhat's yours? → ${window.location.origin}?utm_source=user_share`;

  const handleShare = async () => {
    setShareState("sharing");

    // Track Mixpanel CTA clicked for share
    trackCTAClicked("share", shareButtonText, "secondary", { score: totalScore, level: level });

    // Track share initiated (existing analytics)
    trackAnalyticsEvent('share_initiated', { level, relationshipStatus });

    const canvas = canvasRef.current;
    if (!canvas) return;
    renderShareCard(canvas, level, data, relData, percentile, null, selfSelectedLevel);

    if (navigator.share && navigator.canShare) {
      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
        const file = new File([blob], `ai-level-${level}.png`, { type: "image/png" });
        const shareData = { text: shareText, files: [file] };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          setShareState("shared");
          trackAnalyticsEvent('share_completed', { method: 'native_files', level, relationshipStatus });
          setTimeout(() => setShareState("idle"), 3000);
          return;
        }
      } catch (e) {
        if (e.name === "AbortError") {
          setShareState("idle");
          trackAnalyticsEvent('share_cancelled', { method: 'native_files', level, relationshipStatus });
          return;
        }
      }
    }
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: `${window.location.origin}?utm_source=user_share` });
        setShareState("shared");
        trackAnalyticsEvent('share_completed', { method: 'native_text', level, relationshipStatus });
        setTimeout(() => setShareState("idle"), 3000);
        return;
      } catch (e) {
        if (e.name === "AbortError") {
          setShareState("idle");
          trackAnalyticsEvent('share_cancelled', { method: 'native_text', level, relationshipStatus });
          return;
        }
      }
    }
    const link = document.createElement("a");
    link.download = `ai-level-${level >= 4 ? "4plus" : level}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
    }
    setShareState("fallback");
    trackAnalyticsEvent('share_completed', { method: 'fallback_download', level, relationshipStatus });
    setTimeout(() => setShareState("idle"), 4000);
  };

  // Challenge functionality for Beat 3
  const handleChallenge = (method) => {
    trackChallengeSent({
      challenge_channel: method,
      assessment_score: totalScore,
      assessment_level: level,
      relationship_status: relationshipStatus,
      is_manager: isManager,
    });

    const fullUrl = `${window.location.origin}?utm_source=challenge`;
    const text = isManager
      ? (level >= 3
          ? `I just tested my AI skills — scored Level ${level} (${data.name}). How does our team compare? Take it: ${fullUrl}`
          : `I tested my team's AI readiness starting with myself. Interesting results. Take the 5-min test: ${fullUrl}`)
      : (level >= 3
          ? `I'm AI Level ${level} (Top ${percentile}%). Think you can beat me? → ${fullUrl}`
          : `Just found out my real AI level. Not what I expected. What's yours? → ${fullUrl}`);

    if (method === "copy") {
      try { 
        if (navigator.clipboard) {
          navigator.clipboard.writeText(text);
        }
      } catch (_) {}
      setChallengeLink(true);
      setTimeout(() => setChallengeLink(false), 3000);
    } else if (method === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      setChallengeSent(true);
      setTimeout(() => setChallengeSent(false), 5000);
    } else if (method === "linkedin") {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`, "_blank");
      setChallengeSent(true);
      setTimeout(() => setChallengeSent(false), 5000);
    } else if (method === "email") {
      const subject = isManager ? `AI Level Assessment — Team Challenge` : `Can you beat my AI Level?`;
      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`, "_blank");
      setChallengeSent(true);
      setTimeout(() => setChallengeSent(false), 5000);
    }
  };

  // Waitlist/reservation functionality for Beat 4
  const handleReserve = async (type) => {
    const lead = leadData || {};
    if (type === "prove") setProveReserved(true);
    if (type === "improve") setImproveReserved(true);
    
    // Track CTA clicked event
    trackCTAClicked(type, type === "prove" ? "Get certified" : "Level up", "primary", { 
      score: totalScore, 
      level: level 
    });

    // Track product reservation (existing analytics)
    trackAnalyticsEvent('product_reserved', { type, level, relationshipStatus });

    // Capture intent to Supabase
    const intentData = {
      [type]: true,
      level,
      relationshipStatus,
      timestamp: Date.now()
    };

    await captureIntentData(intentData);
    
    // Store intent for backward compatibility
    window.__aiLevelIntent = { 
      ...(window.__aiLevelIntent || {}), 
      [type]: true, 
      lead, 
      level, 
      relationshipStatus, 
      timestamp: Date.now() 
    };
  };

  const shareLabel = {
    idle: "Share my AI Level",
    sharing: "Preparing...",
    shared: "Shared!",
    fallback: "Image saved + text copied!",
  }[shareState];

  // LinkedIn sharing functionality
  const handleLinkedInShare = async () => {
    setLinkedinState("generating");
    
    // Open modal immediately
    setLinkedinModal({
      isOpen: true,
      status: 'processing',
      message: 'Preparing LinkedIn sharing...',
      error: null
    });
    
    try {
      const userLead = leadData;
      if (!userLead || !userLead.name) {
        throw new Error('User information not available. Please complete the assessment first.');
      }

      // Generate referral ID
      const newReferralId = generateReferralId(userLead.name);
      setReferralId(newReferralId);

      trackShareAttempted({
        referral_id: newReferralId,
        assessment_score: totalScore,
        assessment_level: level,
        relationship_status: relationshipStatus,
        is_manager: isManager,
      });

      // Track referral link generation
      trackReferralLinkGenerated(newReferralId, {
        level,
        score: totalScore,
        relationshipStatus
      });

      // Track LinkedIn share initiation
      trackLinkedInShareInitiated(newReferralId, {
        level,
        score: totalScore,
        relationshipStatus
      });

      // Create referral link
      const referralLink = createReferralLink(newReferralId);

      // Store sharing data in session for OAuth callback
      const sharingData = {
        level,
        levelData: data,
        relationshipData: relData,
        percentile,
        scores,
        coreScores: state.assessment.scores,
        selfSelectedLevel,
        referralId: newReferralId,
        userName: userLead.name,
        userEmail: userLead.email || userLead.phone,
        referralLink,
        timestamp: Date.now()
      };

      linkedInSession.store(sharingData);

      setLinkedinState("redirecting");
      setLinkedinModal({
        isOpen: true,
        status: 'processing',
        message: 'Redirecting to LinkedIn...',
        error: null
      });

      // Generate LinkedIn OAuth URL
      const linkedInAuthUrl = generateLinkedInAuthUrl(newReferralId);
      
      // Track OAuth redirect
      trackLinkedInOAuthStarted(newReferralId, linkedInAuthUrl);

      // Redirect to LinkedIn OAuth
      setTimeout(() => {
        window.location.href = linkedInAuthUrl;
      }, 500);

    } catch (error) {
      console.error('LinkedIn sharing error:', error);
      setLinkedinState("error");
      setLinkedinModal({
        isOpen: true,
        status: 'error',
        message: 'Failed to start LinkedIn sharing',
        error: error.message
      });
    }
  };

  // Handle LinkedIn OAuth callback
  const handleLinkedInCallback = async (code, state, error) => {
    try {
      // Step 1: Parse OAuth callback parameters
      const callbackData = { code, state, error, error_description: null };
      console.log('📱 LinkedIn OAuth callback received:', callbackData);

      // Step 2: Validate OAuth response
      const validation = validateOAuthCallback(callbackData);
      
      if (!validation.success) {
        throw new Error(validation.message);
      }

      const { code: authCode, state: authState } = validation;

      // Step 3: Retrieve sharing data from session storage
      const sharingData = linkedInSession.retrieve();
      
      if (!sharingData) {
        throw new Error('Sharing session expired. Please try sharing again.');
      }

      console.log('📱 Retrieved sharing data:', sharingData);

      // Step 4: Verify state parameter matches referral ID
      if (authState !== sharingData.referralId) {
        throw new Error('Security validation failed. Please try sharing again.');
      }

      // Track successful OAuth completion
      trackLinkedInOAuthCompleted(sharingData.referralId);

      setLinkedinModal({
        isOpen: true,
        status: 'processing',
        message: 'Generating your personalized badge...',
        error: null
      });

      // Step 5: Generate referral link
      const referralLink = createReferralLink(sharingData.referralId);
      
      // Step 6: Create LinkedIn post content
      const postContent = createLinkedInPostContent({
        level: sharingData.level,
        levelData: sharingData.levelData,
        relationshipData: sharingData.relationshipData,
        percentile: sharingData.percentile
      }, referralLink);

      // Step 7: Generate badge with referral link
      const badgeImageBase64 = await generateBadgeWithReferral(sharingData, referralLink);

      setLinkedinModal({
        isOpen: true,
        status: 'processing',
        message: 'Sharing to LinkedIn...',
        error: null
      });

      // Step 8: Prepare and send API request
      const apiPayload = {
        authorizationCode: authCode,
        redirect_uri: getLinkedInRedirectUri(),
        postText: postContent,
        badgeImageBase64,
        userInfo: {
          name: sharingData.userName,
          email: sharingData.userEmail
        },
        level: sharingData.level,
        relationshipStatus: sharingData.relationshipData?.status?.toLowerCase() || 'casual',
        referralId: sharingData.referralId
      };

      const result = await shareToLinkedIn(apiPayload);
      
      if (result.success) {
        setLinkedinModal({
          isOpen: true,
          status: 'success',
          message: 'Successfully shared to LinkedIn!',
          error: null
        });
        
        // Track successful sharing
        const shareCompletionPayload = {
          level: sharingData.level,
          score: Object.values(sharingData.coreScores || {})
            .filter(score => typeof score === 'number')
            .reduce((sum, score) => sum + score, 0),
          relationshipStatus: sharingData.relationshipStatus,
          post_url: result.data?.post_url || null,
          post_id: result.data?.post_id || null
        };
        trackLinkedInShareCompleted(sharingData.referralId, shareCompletionPayload);
        trackShareCompleted(sharingData.referralId, shareCompletionPayload);
        
        // Auto-close success modal after 3 seconds
        setTimeout(() => {
          setLinkedinModal({
            isOpen: false,
            status: 'idle',
            message: '',
            error: null
          });
          // Update LinkedIn state to show shared status
          setLinkedinState("shared");
        }, 3000);
      } else {
        throw new Error(result.message || 'Failed to share to LinkedIn');
      }

    } catch (err) {
      console.error('❌ LinkedIn sharing error:', err);
      setLinkedinModal({
        isOpen: true,
        status: 'error',
        message: 'Failed to share to LinkedIn',
        error: err.message
      });
      
      // Track sharing failure
      const sharingData = linkedInSession.retrieve();
      trackLinkedInShareFailed(sharingData?.referralId || 'unknown', {
        error: err.name || 'unknown',
        message: err.message,
        stage: 'oauth',
        shouldRetry: !err.message.includes('cancelled') && !err.message.includes('denied')
      });
    } finally {
      // Clean up session data
      linkedInSession.clear();
    }
  };

  // Generate badge with referral link (high-fidelity version using renderShareCard)
  const generateBadgeWithReferral = async (sharingData, referralLink) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const levelData = LEVEL_DATA[sharingData.level] || LEVEL_DATA[4];
      const relationshipData = RELATIONSHIP_DATA[sharingData.relationshipStatus] || RELATIONSHIP_DATA.casual;
      const percentile = sharingData.percentile || getPercentile(sharingData.level);
      const selfSelected = sharingData.selfSelectedLevel !== undefined ? sharingData.selfSelectedLevel : selfSelectedLevel;

      // Render the high-fidelity badge using the new design!
      renderShareCard(canvas, sharingData.level, levelData, relationshipData, percentile, referralLink, selfSelected);

      // Convert to base64
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      }, 'image/png');
    });
  };

  // Share to LinkedIn API
  const shareToLinkedIn = async (payload) => {
    try {
      // Use your specific LinkedIn API endpoint
      const API_ENDPOINT = 'https://xgfy-czuw-092q.m2.xano.io/api:UpsZVD6L/linkedin/ai-levels/share_image_post';
      
      // Convert image data to File object for proper multipart upload
      const base64Data = payload.badgeImageBase64;
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const imageBlob = new Blob([byteArray], { type: 'image/png' });
      
      // Prepare FormData for multipart upload
      const formData = new FormData();
      formData.append('code', payload.authorizationCode);
      formData.append('redirect_uri', payload.redirect_uri);
      formData.append('post_comment', payload.postText);
      formData.append('source', 'ai-levels');
      formData.append('extra_details', JSON.stringify({
        user_name: payload.userInfo.name,
        user_email: payload.userInfo.email,
        level: payload.level,
        relationship_status: payload.relationshipStatus,
        referral_id: payload.referralId
      }));
      formData.append('image_file', imageBlob, 'ai-level-badge.png');
      
      console.log('📤 Sending to LinkedIn API:', {
        code: payload.authorizationCode,
        redirect_uri: payload.redirect_uri,
        post_comment: payload.postText.substring(0, 100) + '...',
        source: 'ai-levels',
        extra_details: 'user info and level data',
        image_file: 'AI Level Badge PNG'
      });

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: formData // Using FormData instead of JSON for file upload
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📥 LinkedIn API response:', result);

      return {
        success: true, // Assuming success if we get a valid response
        message: result.message || 'Successfully shared to LinkedIn',
        data: result.data || result
      };

    } catch (error) {
      console.error('LinkedIn API error:', error);
      return {
        success: false,
        message: error.message
      };
    }
  };

  const linkedinLabel = {
    idle: "Share to LinkedIn",
    generating: "Generating link...",
    redirecting: "Redirecting to LinkedIn...",
    shared: "Shared to LinkedIn!",
    error: "Try again"
  }[linkedinState];

  // Fix shareButtonText reference
  const shareButtonText = shareLabel;

  return (
    <ScreenTransition>
      <div className="min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden">
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <Header />

        {/* Enhanced background glow with multiple layers */}
        <div
          className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-[2000ms] ease-out pointer-events-none"
          style={{
            backgroundColor: data.color,
            opacity: stage >= 1 ? 0.12 : 0,
            transform: `translateX(-50%) ${stage >= 1 ? 'scale(1.2)' : 'scale(0.8)'}`
          }}
        />
        {/* Secondary glow */}
        <div
          className="absolute top-30 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full blur-[80px] transition-all duration-[2500ms] ease-out delay-300 pointer-events-none"
          style={{
            backgroundColor: data.color,
            opacity: stage >= 1 ? 0.08 : 0,
            transform: `translateX(-50%) ${stage >= 1 ? 'scale(1)' : 'scale(0.6)'}`
          }}
        />

        <div className="flex-1 flex flex-col items-center px-5 py-8 pb-12">
          <div className="max-w-sm w-full relative z-10">

            {/* ═══════════════════════════════════════════════════
                 ZONE 1: COMPRESSED HERO — fits in one mobile fold
               ═══════════════════════════════════════════════════ */}

            {/* Level number + name — with proper spacing */}
            <div className={`text-center transition-all duration-700 py-2 ${stage >= 1 ? "opacity-100 scale-100" : "opacity-0 scale-75"}`}>
              <p className="text-gray-400 text-xs font-bold tracking-[0.2em] mb-10">YOUR AI LEVEL</p>
              <div className="py-2 flex flex-col items-center justify-center w-full relative">
                {stage >= 1 && <AnimatedNumber target={level} color={data.color} />}

                <div className={`mt-8 transition-all duration-700 delay-[600ms] ${stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  {stage >= 2 && (
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-900/80 px-2.5 py-0.5 rounded-full border border-gray-800/80 shadow-[0_0_15px_rgba(0,0,0,0.5)] inline-flex items-center gap-1 uppercase tracking-wider backdrop-blur-sm">
                      Top <span className="text-white text-[11px]"><AnimatedPercentile target={percentile} />%</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className={`text-center transition-all duration-700 mt-2 w-full ${stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <div className="text-xl font-bold text-white mb-1">{data.name}</div>
              <p className="text-gray-400 text-[11px] leading-relaxed mb-4 max-w-xs mx-auto px-4">{data.tagline}</p>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 mb-5">
                <span className="text-[10px] font-bold bg-transparent border px-3 py-1.5 rounded-full tracking-wider uppercase" style={{ color: data.color, borderColor: `${data.color}40`, backgroundColor: `${data.color}10` }}>
                  {data.tier}
                </span>
                <span className="text-[11px] font-medium bg-gray-900/60 border border-gray-800/80 text-gray-200 px-3 py-1 rounded-full flex items-center gap-1.5 tracking-wide shadow-sm">
                  <span className="text-sm -mt-0.5 drop-shadow-sm">{relData.emoji}</span>
                  <span>{relData.status}</span>
                </span>
              </div>

              {/* PDF download available via handleTestPDFDownload() */}

              {/* Inline Details Expander */}
              <button
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className="text-[10px] font-medium text-gray-400 hover:text-white bg-gray-900/30 border border-gray-800/60 hover:border-gray-700 hover:bg-gray-800/50 transition-all rounded-full px-4 py-1.5 flex items-center gap-1.5 mx-auto mb-2 pointer-events-auto shadow-sm tracking-wide"
              >
                See more details
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-300 ${isDetailsExpanded ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
              </button>

              {/* EXPANDABLE INLINE ACCORDION */}
              <div className={`overflow-hidden transition-all duration-500 ease-in-out px-1 ${isDetailsExpanded ? 'max-h-[1000px] opacity-100 mt-4 mb-4' : 'max-h-0 opacity-0 mt-0 mb-0'}`}>
                <div className="bg-gray-950/80 rounded-2xl border border-gray-800 flex flex-col overflow-hidden text-left shadow-2xl divide-y divide-gray-800/60 backdrop-blur-md">
                  {/* Level Scale */}
                  <div className="p-4 bg-gray-900/20">
                    <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-3 ml-1">All 7 Levels</h4>
                    <div className="space-y-1">
                      {LEVEL_SCALE.map((l) => (
                        <div key={l.level} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${l.level === level ? "bg-blue-500/10 border border-blue-500/30 shadow-[inset_0_0_15px_rgba(59,130,246,0.05)]" : "hover:bg-gray-900/40"}`}>
                          <span className={`text-[11px] font-bold w-4 text-center ${l.level === level ? "text-blue-400" : "text-gray-600"}`}>{l.level}</span>
                          <div className="flex-1">
                            <p className={`text-[11px] flex items-center gap-2 ${l.level === level ? "text-white font-bold" : "text-gray-300 font-medium"}`}>
                              {l.name}
                              {l.level === level && <span className="text-[8px] font-bold text-blue-300 px-1.5 py-0.5 bg-blue-500/25 rounded-md uppercase tracking-wider">You</span>}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{l.short}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Relationship Scale */}
                  <div className="p-4 bg-gray-900/20">
                    <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-3 ml-1">Relationship Types</h4>
                    <div className="space-y-1">
                      {RELATIONSHIP_SCALE.map((r) => (
                        <div key={r.key} className={`flex gap-3 px-3 py-2 rounded-xl transition-colors ${r.key === relationshipStatus ? "bg-emerald-500/10 border border-emerald-500/30 shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]" : "hover:bg-gray-900/40"}`}>
                          <span className="text-lg flex-shrink-0 pt-0.5 drop-shadow-sm">{RELATIONSHIP_DATA[r.key].emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[11px] ${r.key === relationshipStatus ? "text-white font-bold" : "text-gray-300 font-medium"}`}>{r.label}</span>
                              <span className="text-gray-600 text-[10px]">·</span>
                              <span className="text-[9px] font-medium" style={r.key === relationshipStatus ? { color: relData.color } : { color: '#6b7280' }}>{r.tierLabel}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 leading-tight">{r.short}</p>
                          </div>
                          {r.key === relationshipStatus && <span className="text-[8px] font-bold text-emerald-300 px-1.5 py-0.5 bg-emerald-500/25 rounded-md uppercase tracking-wider self-start mt-1">You</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════
                  PERCEPTION GAP ANALYSIS — THE MOST SHAREABLE MOMENT
               ═══════════════════════════════════════════════════ */}
              {perceptionGap !== null && (
                <div className={`transition-all duration-700 mt-6 mb-4 ${stage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                  <div className={`rounded-2xl px-5 py-4 mb-4 border ${
                    perceptionGap > 0
                      ? "bg-amber-500/5 border-amber-500/20"
                      : perceptionGap === 0
                        ? "bg-blue-500/5 border-blue-500/20"
                        : "bg-emerald-500/5 border-emerald-500/20"
                  }`}>
                    {perceptionGap !== 0 ? (
                      <>
                        <div className="flex items-center justify-center gap-5 mb-2">
                          <div className="text-center">
                            <p className="text-gray-600 text-[11px] uppercase tracking-wider mb-0.5">You said</p>
                            <p className="text-xl font-medium text-gray-600">L{selfSelectedLevel}</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className={`text-2xl ${perceptionGap > 0 ? "text-amber-400" : "text-emerald-400"}`}>→</span>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600 text-[11px] uppercase tracking-wider mb-0.5">Actual</p>
                            <p className="text-3xl font-extrabold" style={{ color: data.color }}>L{level}</p>
                          </div>
                        </div>
                        <p className={`text-xs font-medium text-center ${perceptionGap > 0 ? "text-amber-400/90" : "text-emerald-400/90"}`}>
                          {perceptionGap > 0
                            ? `${perceptionGap}-level gap — ${perceptionGap >= 2 ? "most people overestimate by 2+ levels" : "slightly optimistic"}`
                            : `${Math.abs(perceptionGap)} level${Math.abs(perceptionGap) > 1 ? "s" : ""} better than you thought`}
                        </p>
                      </>
                    ) : (
                      <div className="text-center">
                        <p className="text-blue-400 text-xs font-bold mb-0.5">🎯 Perfect calibration</p>
                        <p className="text-gray-400 text-[11px]">You said L{selfSelectedLevel} — and that's exactly right. Only 12% of people nail this.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════
                 LINKEDIN SHARE SECTION
               ═══════════════════════════════════════════════════ */}
              <div className={`transition-all duration-700 pt-4 pb-6 ${stage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                {/* Card row: thumbnail left, action right */}
                <div className="flex items-start gap-4 bg-gray-900/40 border border-gray-800/60 rounded-2xl p-4 backdrop-blur-sm">
                  {/* Thumbnail — always shows expand icon badge */}
                  <button
                    onClick={() => {
                      if (canvasRef.current) {
                        // Render the full-res share card first, then capture
                        renderShareCard(canvasRef.current, level, data, relData, percentile, null, selfSelectedLevel);
                        setPreviewDataUrl(canvasRef.current.toDataURL());
                      }
                      setIsPreviewExpanded(true);
                    }}
                    className="flex-shrink-0 relative rounded-xl overflow-hidden border border-gray-700/50 shadow-lg active:scale-95 transition-transform"
                    style={{ width: 80, height: 80 }}
                  >
                    <canvas
                      ref={previewRef}
                      className="rounded-xl"
                      style={{ width: 80, height: 80 }}
                    />
                    {/* Always-visible expand badge */}
                    <div className="absolute bottom-1 right-1 bg-gray-950/80 backdrop-blur-sm rounded-md p-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                    </div>
                  </button>

                  {/* Right: description + share button */}
                  <div className="flex-1 flex flex-col gap-3">
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      Share your <span className="text-white font-semibold">AI Level {level >= 4 ? "4+" : level}</span> card — a custom image with your score.
                    </p>

                    {/* LinkedIn Share Button */}
                    <button
                      onClick={handleLinkedInShare}
                      disabled={linkedinState === "generating" || linkedinState === "redirecting"}
                      className={`w-full font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors duration-200 ${
                        linkedinState === "shared" ? 
                          "bg-emerald-500 text-white" : 
                          linkedinState === "error" ?
                            "bg-red-500 hover:bg-red-600 text-white" :
                            "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {linkedinState === "shared" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                      ) : linkedinState === "generating" || linkedinState === "redirecting" ? (
                        <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : linkedinState === "error" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      )}
                      {linkedinLabel}
                    </button>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════
                  BEAT 2: THE MIRROR — STRENGTH, BLIND SPOT, GAP
               ═══════════════════════════════════════════════════ */}
              <div className={`transition-all duration-700 mt-8 text-left ${stage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-gray-800/40" />
                  <span className="text-gray-500 text-xs tracking-[0.2em] uppercase font-medium">Your profile</span>
                  <div className="flex-1 h-px bg-gray-800/40" />
                </div>

                {/* Strength card */}
                <div className="rounded-2xl bg-teal-500/5 border border-teal-500/15 px-5 py-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{strength.icon}</span>
                    <span className="text-teal-400 text-[11px] font-bold tracking-wide uppercase">{strength.label}</span>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed text-left">{strength.text}</p>
                </div>

                {/* Blind spot card */}
                <div className="rounded-2xl bg-amber-500/5 border border-amber-500/15 px-5 py-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{blindSpot.icon}</span>
                    <span className="text-amber-400 text-[11px] font-bold tracking-wide uppercase">{blindSpot.label}</span>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed text-left">{blindSpot.text}</p>
                </div>

                {/* Gap comparison card — two columns */}
                {level < 6 && gapData && gapData.nextLevel && (
                  <div className="rounded-2xl border border-gray-800/30 overflow-hidden mb-3">
                    <div className="bg-gray-900/60 px-5 py-3 border-b border-gray-800/20">
                      <p className="text-gray-400 text-[11px] font-semibold tracking-wider uppercase text-left">The gap to L{gapData.nextLevel}</p>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-gray-800/20">
                      <div className="px-4 py-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                          <span className="text-gray-500 text-[11px] font-semibold uppercase">You (L{level})</span>
                        </div>
                        <p className="text-gray-400 text-xs leading-relaxed text-left">{gapData.you}</p>
                      </div>
                      <div className="px-4 py-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: LEVEL_DATA[gapData.nextLevel]?.color || "#60a5fa" }} />
                          <span className="text-[11px] font-semibold uppercase" style={{ color: LEVEL_DATA[gapData.nextLevel]?.color || "#60a5fa" }}>L{gapData.nextLevel} can</span>
                        </div>
                        <p className="text-gray-300 text-xs leading-relaxed text-left">{gapData.next}</p>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════
                 THE "MEAT": STREAMLINED INSIGHTS
               ═══════════════════════════════════════════════════ */}
            <div className={`transition-all duration-700 w-full mb-8 ${stage >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>

              {/* ═══════════════════════════════════════════════════
                  BEAT 3: THE CHALLENGE — SOCIAL COMPARISON & COMPETITION
               ═══════════════════════════════════════════════════ */}
              <div className={`transition-all duration-700 mt-8 text-left ${stage >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-gray-800/40" />
                  <span className="text-gray-500 text-xs tracking-[0.2em] uppercase font-medium">Challenge</span>
                  <div className="flex-1 h-px bg-gray-800/40" />
                </div>

                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-5 pt-5 pb-4 mb-3">
                  {/* Challenge card visual */}
                  <div className="flex items-center justify-center gap-4 mb-4">
                    {/* Your score */}
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1.5" style={{ backgroundColor: `${data.color}15`, border: `2px solid ${data.color}40` }}>
                        <span className="text-2xl font-extrabold" style={{ color: data.color }}>L{level}</span>
                      </div>
                      <p className="text-gray-400 text-[10px]">You</p>
                    </div>
                    {/* VS */}
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-gray-600 text-lg font-bold">vs</span>
                    </div>
                    {/* Empty challenger slot */}
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-600 flex items-center justify-center mb-1.5 bg-gray-900/40 animate-pulse">
                        <span className="text-gray-500 text-xl">?</span>
                      </div>
                      <p className="text-gray-500 text-[10px]">
                        {isManager ? "Your team" : "A friend"}
                      </p>
                    </div>
                  </div>

                  {/* Context-adaptive headline */}
                  <p className="text-white text-sm font-bold text-center mb-1">
                    {isManager && company
                      ? `Where does ${company} stand?`
                      : isManager
                        ? "How AI-ready is your team?"
                      : level >= 4
                        ? `Only ${percentile}% score this high.`
                      : level >= 2
                        ? "How do you compare to your circle?"
                        : "Find out who's actually ahead."
                    }
                  </p>
                  <p className="text-gray-400 text-xs text-center mb-4 leading-relaxed">
                    {isManager
                      ? (level >= 4
                          ? "You're ahead of most. Find out if your team is keeping up."
                          : "Most teams overestimate their AI skills by 2 levels. Send the test and see the real data.")
                      : level >= 3
                        ? `You scored top ${percentile}%. Most people you know probably overestimate by 2 levels.`
                        : "Most people think they're better than they are. Send this and find out."}
                  </p>

                  {/* Share methods — horizontal buttons */}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <button
                      onClick={() => handleChallenge("whatsapp")}
                      className="py-3 rounded-xl bg-emerald-500/15 text-emerald-400 text-xs font-semibold transition-all hover:bg-emerald-500/25 active:scale-[0.97]"
                      aria-label="Challenge via WhatsApp"
                    >
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleChallenge("linkedin")}
                      className="py-3 rounded-xl bg-blue-500/15 text-blue-400 text-xs font-semibold transition-all hover:bg-blue-500/25 active:scale-[0.97]"
                      aria-label="Challenge via LinkedIn"
                    >
                      LinkedIn
                    </button>
                    <button
                      onClick={() => handleChallenge("email")}
                      className="py-3 rounded-xl bg-purple-500/15 text-purple-400 text-xs font-semibold transition-all hover:bg-purple-500/25 active:scale-[0.97]"
                      aria-label="Challenge via Email"
                    >
                      Email
                    </button>
                  </div>
                  <button
                    onClick={() => handleChallenge("copy")}
                    aria-label="Copy challenge link to clipboard"
                    className={`w-full py-2.5 rounded-xl text-xs font-medium transition-all ${
                      challengeLink
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-gray-800/40 text-gray-500 hover:text-gray-300 hover:bg-gray-800/60"
                    }`}
                  >
                    {challengeLink ? "Link copied!" : "Copy challenge link"}
                  </button>
                  {challengeSent && (
                    <p className="text-emerald-400/70 text-[10px] text-center mt-2 animate-pulse">Challenge sent! See who beats you when they share back.</p>
                  )}
                </div>

                {/* Manager-specific team report preview */}
                {isManager && (
                  <div className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.03] overflow-hidden mb-3 mt-3">
                    {/* Locked team report preview */}
                    <div className="px-4 pt-4 pb-3">
                      <p className="text-[10px] uppercase tracking-widest text-blue-400/70 font-semibold mb-3 text-center">Team AI Report — Preview</p>
                      {/* Blurred/locked report mockup */}
                      <div className="relative rounded-xl border border-gray-800/30 bg-gray-900/60 p-3 overflow-hidden">
                        <div className="absolute inset-0 backdrop-blur-[2px] bg-gray-950/30 z-10 flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-lg">🔒</span>
                            <p className="text-white text-[11px] font-semibold mt-1">Unlocks when 3+ team members complete</p>
                          </div>
                        </div>
                        {/* Fake report content (visible but blurred behind) */}
                        <div className="opacity-50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 text-[10px]">Team avg: L—</span>
                            <span className="text-gray-500 text-[10px]">You: L{level}</span>
                          </div>
                          <div className="flex gap-1 mb-2">
                            {[1,2,3,4,5].map(i => (
                              <div key={i} className="flex-1 h-6 rounded bg-gray-800/60" />
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-[10px]">Perception gaps</span>
                            <span className="text-gray-600 text-[10px]">Skill distribution</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-400 text-[11px] text-center mt-3 leading-relaxed">
                        {level >= 4
                          ? "See who's keeping up with you — and who needs support."
                          : "See how your team compares to you — and to each other."}
                      </p>
                    </div>
                    <button
                      onClick={() => handleChallenge("copy")}
                      className="w-full py-3 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/15 transition-all active:scale-[0.98]"
                    >
                      Send your team the assessment →
                    </button>

                    {/* Enterprise consulting — gated booking */}
                    <div className="border-t border-gray-800/20 px-4 py-3">
                      <p className="text-gray-500 text-[11px] text-center leading-relaxed">
                        Want a full org-wide AI readiness program?{" "}
                        <button
                          onClick={() => {
                            const teamSize = prompt("How many people on your team?");
                            if (!teamSize) return;
                            const goal = prompt("What would you use a team AI report for? (e.g., training budget, hiring, upskilling)");
                            if (!goal) return;
                            const bookingUrl = `https://calendly.com/shronit/ai-readiness?name=${encodeURIComponent(leadData?.name || "")}&email=${encodeURIComponent(leadData?.email || "")}&a1=${encodeURIComponent(company || "")}&a2=${encodeURIComponent(teamSize)}&a3=${encodeURIComponent(goal)}`;
                            window.open(bookingUrl, "_blank");
                          }}
                          className="text-blue-400 font-semibold underline underline-offset-2"
                        >
                          Book a strategy slot →
                        </button>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════
                  BEAT 4: THE PATH FORWARD — CERTIFICATION & LEARNING
               ═══════════════════════════════════════════════════ */}
              <div className="flex items-center gap-3 mb-5 mt-6">
                <div className="flex-1 h-px bg-gray-800/40" />
                <span className="text-gray-500 text-xs tracking-[0.2em] uppercase font-medium">What's next</span>
                <div className="flex-1 h-px bg-gray-800/40" />
              </div>

              {/* Certification CTA — the ONE hero action */}
              <div className="rounded-2xl border overflow-hidden mb-4 text-left" style={{ borderColor: `${data.color}30`, background: `linear-gradient(135deg, ${data.color}08, transparent)` }}>
                <div className="p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${data.color}15` }}>
                      <span className="text-xl">🏆</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold">Get your certified AI Level</p>
                      <p className="text-gray-600 text-[10px]">Full 8-ability assessment + LinkedIn badge</p>
                    </div>
                  </div>

                  {/* Mini certificate preview */}
                  <div className="rounded-xl border border-gray-800/30 bg-gray-900/60 p-3 mb-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${data.color}15`, border: `1px solid ${data.color}30` }}>
                      <span className="text-lg font-extrabold" style={{ color: data.color }}>L{level}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-300 text-[11px] font-semibold truncate">Certified AI Level {level} — {data.name}</p>
                      <p className="text-gray-600 text-[11px]">LearnTube · Verified Assessment · 2026</p>
                      <p className="text-[11px] mt-0.5" style={{ color: data.color }}>This is how it looks on LinkedIn →</p>
                    </div>
                  </div>

                  <p className="text-gray-400 text-xs leading-relaxed mb-3 text-left">
                    {level === 0
                      ? <>This quick test gives you a baseline. The full certification <span className="text-white font-medium">maps exactly where to start</span> — so you build the right skills from day one, not random ones.</>
                    : level <= 2
                      ? <>This quick test covered 5 of 8 abilities. The full certification <span className="text-white font-medium">proves you're building the right skills</span> — before your company asks who's AI-ready and who isn't.</>
                    : level <= 3
                      ? <>The quick test flagged a pattern. The full assessment <span className="text-white font-medium">maps all 8 abilities</span> so you know exactly where your judgment is sharp — and where it's not.</>
                    : level <= 5
                      ? <>You scored high here. The full assessment <span className="text-white font-medium">unlocks L4–L5 depth scoring</span> — the quick test can't measure system design or frontier contribution.</>
                      : <>You hit the ceiling on the quick test. The full assessment <span className="text-white font-medium">verifies L5 across all 8 abilities</span> — and gives you a credential that proves it.</>
                    }
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-amber-400 text-[10px] font-semibold">Waitlist open — filling fast</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleReserve("prove")}
                  disabled={proveReserved}
                  className={`w-full py-3.5 text-sm font-bold transition-all duration-300 ${
                    proveReserved
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "hover:brightness-110 active:scale-[0.98]"
                  }`}
                  style={!proveReserved ? { backgroundColor: `${data.color}20`, color: data.color } : {}}
                >
                  {proveReserved ? "✓ You're on the list" : "Get certified →"}
                </button>
              </div>

              {/* Learning path — compact secondary tile */}
              <div className={`rounded-xl border overflow-hidden mb-4 transition-all duration-300 text-left ${
                improveReserved ? "border-emerald-500/20 bg-emerald-500/5" : "border-gray-800/30 bg-gray-900/40 hover:border-gray-700/40"
              }`}>
                <button
                  onClick={() => handleReserve("improve")}
                  disabled={improveReserved}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 flex-shrink-0">
                    <span className="text-sm">{level >= 6 ? "⚡" : "🚀"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold mb-0.5 ${improveReserved ? "text-emerald-400" : "text-white"}`}>
                      {improveReserved ? "✓ You're on the list" : level >= 6 ? "Frontier track — advanced applications" : `Go from L${level} → L${Math.min(level + 1, 6)}`}
                    </p>
                    <p className="text-gray-500 text-[11px] leading-snug">
                      {improveReserved
                        ? "We'll notify you when it launches"
                        : level === 0
                          ? "Start from zero — learn what AI can actually do for your work"
                        : level <= 2
                          ? "Guided exercises built from your assessment results"
                        : level <= 3
                          ? `Target your ${blindSpot.label.toLowerCase()} with project-based learning`
                        : level <= 5
                          ? "System-building track — from individual skill to team impact"
                          : "Multi-agent orchestration, custom tooling, and frontier research applications"
                      }
                    </p>
                  </div>
                  {!improveReserved && <span className="text-emerald-400/60 text-xs flex-shrink-0">→</span>}
                </button>
              </div>

              {/* ─── Footer ─── */}
              <div className="pt-5 mt-4 border-t border-gray-800/20 text-center">
                <div className="flex items-center justify-center gap-2 mb-2.5">
                  <span className="text-blue-400 text-[10px] font-bold tracking-wider">LEARNTUBE</span>
                  <span className="text-gray-700 text-[10px]">|</span>
                  <span className="text-gray-500 text-[10px]">AI Level Assessment</span>
                </div>
                <p className="text-gray-600 text-[10px] leading-relaxed max-w-xs mx-auto px-2">
                  AI Level & AI Relationship Status — LearnTube frameworks built on research from BCG, Anthropic & MIT Media Lab.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Fullscreen Image Preview Lightbox */}
      {isPreviewExpanded && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-gray-950 animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setIsPreviewExpanded(false)}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 z-10" onClick={e => e.stopPropagation()}>
            <p className="text-gray-400 text-sm font-medium">Your AI Level Card</p>
            <button
              onClick={() => setIsPreviewExpanded(false)}
              className="text-gray-400 hover:text-white transition-colors bg-gray-900 p-2 rounded-full"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Image — fills remaining space */}
          <div className="flex-1 flex items-center justify-center px-6 overflow-hidden" onClick={e => e.stopPropagation()}>
            {previewDataUrl ? (
              <img
                src={previewDataUrl}
                alt="Your AI Level Share Card"
                className="w-full max-w-sm rounded-2xl shadow-2xl ring-1 ring-white/10 animate-[scaleIn_0.25s_ease-out]"
              />
            ) : (
              <div className="w-full max-w-sm aspect-square rounded-2xl bg-gray-900 flex items-center justify-center">
                <p className="text-gray-600 text-sm">Loading preview…</p>
              </div>
            )}
          </div>

          {/* Bottom: share button */}
          <div className="px-6 pb-10 pt-4 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => {
                handleLinkedInShare();
                setIsPreviewExpanded(false);
              }}
              disabled={linkedinState === "generating" || linkedinState === "redirecting"}
              className={`w-full font-bold py-4 rounded-xl text-base flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer ${
                linkedinState === "shared" ? 
                  "bg-emerald-500 hover:bg-emerald-600 text-white" : 
                  linkedinState === "error" ?
                    "bg-red-500 hover:bg-red-600 text-white" :
                    "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
              }`}
            >
              {linkedinState === "shared" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              ) : linkedinState === "generating" || linkedinState === "redirecting" ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : linkedinState === "error" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              )}
              {linkedinLabel}
            </button>
            <p className="text-gray-600 text-xs text-center">Tap outside or press ✕ to dismiss</p>
          </div>
        </div>
      )}

      {/* LinkedIn Sharing Modal */}
      {linkedinModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-md animate-[fadeIn_0.25s_ease-out] p-4">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes rotate-orbital {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes pulse-sphere {
              0%, 100% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.08); opacity: 1; filter: drop-shadow(0 0 15px rgba(59,130,246,0.5)); }
            }
            @keyframes success-pop {
              0% { transform: scale(0.85); opacity: 0; }
              50% { transform: scale(1.12); }
              100% { transform: scale(1); opacity: 1; filter: drop-shadow(0 0 20px rgba(16,185,129,0.4)); }
            }
            @keyframes error-shake {
              0%, 100% { transform: translateX(0); }
              20%, 60% { transform: translateX(-5px); }
              40%, 80% { transform: translateX(5px); }
            }
            @keyframes sweep {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            .orbital-spinner {
              animation: rotate-orbital 2.5s linear infinite;
            }
            .pulsing-sphere {
              animation: pulse-sphere 2s ease-in-out infinite;
            }
            .success-anim {
              animation: success-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            .error-anim {
              animation: error-shake 0.4s ease-in-out;
            }
            .glow-panel-blue {
              box-shadow: 0 0 40px rgba(59, 130, 246, 0.15);
            }
            .glow-panel-green {
              box-shadow: 0 0 40px rgba(16, 185, 129, 0.15);
            }
            .glow-panel-red {
              box-shadow: 0 0 40px rgba(239, 68, 68, 0.15);
            }
          `}} />
          
          <div className={`bg-gray-900/90 border border-gray-800 rounded-3xl p-8 max-w-xs w-full mx-4 shadow-2xl backdrop-blur-xl relative overflow-hidden transition-all duration-300 ${
            linkedinModal.status === 'processing' ? 'glow-panel-blue border-blue-500/20' :
            linkedinModal.status === 'success' ? 'glow-panel-green border-emerald-500/20' :
            'glow-panel-red border-red-500/20'
          }`}>
            
            {/* Ambient Background Glow Spot */}
            <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full filter blur-3xl opacity-20 pointer-events-none transition-all duration-500 ${
              linkedinModal.status === 'processing' ? 'bg-blue-500' :
              linkedinModal.status === 'success' ? 'bg-emerald-500' :
              'bg-red-500'
            }`} />

            {/* Content Body */}
            <div className="flex flex-col items-center text-center relative z-10">
              
              {/* Graphic Loading/Success/Error States */}
              <div className="h-28 flex items-center justify-center mb-4">
                
                {/* Processing State: Glowing orbital loader with LinkedIn glyph inside */}
                {linkedinModal.status === 'processing' && (
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full orbital-spinner absolute" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="4" fill="none" />
                      <circle cx="50" cy="50" r="42" stroke="url(#blue-gradient)" strokeWidth="4" strokeDasharray="60 120" strokeLinecap="round" fill="none" />
                      <defs>
                        <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>
                      </defs>
                    </svg>
                    {/* Inner glowing sphere containing LinkedIn Logo */}
                    <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center pulsing-sphere shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                  </div>
                )}

                {/* Success State: Expanding glowing green ring + checkmark */}
                {linkedinModal.status === 'success' && (
                  <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center success-anim shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}

                {/* Error State: Glowing shaking red warning */}
                {linkedinModal.status === 'error' && (
                  <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center error-anim shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <svg className="w-10 h-10 text-red-400 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                )}

              </div>

              {/* Title & Status Message */}
              <h2 className="text-white text-base font-bold tracking-wide mb-1">
                {linkedinModal.status === 'processing' && 'Sharing...'}
                {linkedinModal.status === 'success' && 'Shared!'}
                {linkedinModal.status === 'error' && 'Failed'}
              </h2>

              <p className="text-gray-400 text-xs font-medium leading-relaxed max-w-sm mb-5">
                {linkedinModal.message}
              </p>

              {/* Error Details Panel */}
              {linkedinModal.status === 'error' && linkedinModal.error && (
                <div className="w-full text-left mb-5 bg-red-950/20 border border-red-900/40 rounded-2xl p-4 animate-[fadeIn_0.2s_ease-out] backdrop-blur-sm">
                  <span className="text-[9px] font-bold text-red-400 tracking-wider uppercase mb-1 block">Diagnostics</span>
                  <p className="text-red-300/90 text-xs leading-relaxed font-mono break-words">
                    {linkedinModal.error}
                  </p>
                </div>
              )}

              {/* Processing Progress Bar */}
              {linkedinModal.status === 'processing' && (
                <div className="w-full bg-gray-950/60 border border-gray-800 rounded-full h-1.5 mb-5 overflow-hidden relative">
                  <div className="absolute inset-0 bg-blue-500/10 rounded-full" />
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full absolute left-0 top-0 w-3/4 animate-pulse" 
                    style={{
                      boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)'
                    }}
                  />
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="w-full space-y-3 mt-1">
                {linkedinModal.status === 'error' && (
                  <button
                    onClick={() => {
                      setLinkedinModal({ isOpen: false, status: 'idle', message: '', error: null });
                      handleLinkedInShare();
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/15 text-sm"
                  >
                    Try Again
                  </button>
                )}
                
                {linkedinModal.status === 'error' && (
                  <button
                    onClick={() => setLinkedinModal({ isOpen: false, status: 'idle', message: '', error: null })}
                    className="w-full bg-gray-950/40 border border-gray-800 hover:bg-gray-800/40 text-gray-400 hover:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 cursor-pointer text-sm"
                  >
                    Dismiss
                  </button>
                )}

                {/* Processing/Success Context Notice */}
                {linkedinModal.status === 'success' && (
                  <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-2xl py-2 px-3 flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span className="text-emerald-400/90 text-[11px] font-semibold">
                      Closing in 3s
                    </span>
                  </div>
                )}

                {linkedinModal.status === 'processing' && (
                  <p className="text-[9px] text-gray-500 font-medium tracking-wide">
                    Do not close or reload this window
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      </div>
    </ScreenTransition>
  );
}

export default LevelReveal;