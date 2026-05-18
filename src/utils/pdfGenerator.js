import { jsPDF } from 'jspdf';

// Level names + accent colors — exact match to LEVEL_DATA in LevelReveal.jsx
const LEVEL_METADATA = {
  0: { color: [100, 116, 139], name: "Non-User",               tier: "Explorer",     percentile: 95 },
  1: { color: [129, 140, 248], name: "Experimenter",           tier: "Explorer",     percentile: 65 },
  2: { color: [59,  130, 246], name: "Functional User",        tier: "Practitioner", percentile: 34 },
  3: { color: [16,  185, 129], name: "Effective Practitioner", tier: "Operator",     percentile: 12 },
  4: { color: [245, 158, 11],  name: "AI-Native Performer",    tier: "Strategist",   percentile: 5  },
  5: { color: [239, 68,  68],  name: "AI-Native Builder",      tier: "Architect",    percentile: 1  },
};

const PROFILE_TEXT = {
  0: "You haven't started yet — and that's fine. You're about to skip everyone else's mistakes. The gap between where you are and where AI could take you is massive, but more accessible than you'd think. Start with one real task this week.",
  1: "You've dipped your toes in. The gap between where you are and where AI could take you is bigger than you'd guess. You're using AI occasionally, but your mental model of what it can do is still forming. Push past your first response.",
  2: "You're getting real value from AI — but you're trusting the polish more than you should. You treat it like a search engine rather than a reasoning partner. Your next leap: systematic multi-prompt iteration and output evaluation.",
  3: "You have judgment most people lack. You don't just use AI — you think with it. You've crossed the threshold where you can evaluate output, not just consume it. Next: encode your judgment into repeatable workflow systems.",
  4: "AI isn't a tool you use — it's how you work. Most people won't understand your workflow for another two years. You engineer architectures and structure automated agents. Your edge: organizational leverage and custom pipelines.",
  5: "You operate at the absolute technological vanguard. You design agentic systems, manage data stores, and advance the practice itself. Your focus: multi-agent consensus, cognitive routing, and frameworks that outlast your involvement.",
};

const STRENGTH_CARDS = {
  0: { label: "You Showed Up",        text: "Taking this assessment puts you ahead of 95% of people who talk about AI but never measure it. Awareness is the first real step — most people never get here." },
  1: { label: "Calibration Instinct", text: "You understand where AI shines and where it breaks. That boundary awareness is rarer than it sounds and is the exact foundation for everything that follows." },
  2: { label: "Consistent Usage",     text: "Your day-to-day AI habits show maturity. You've moved past experimenting into consistent, intentional use. That alone puts you in the top third of users." },
  3: { label: "You See Through Polish", text: "You caught the Artifact Effect — AI's most common trap. Most people default to the professional-looking response. You evaluate substance. That separates L3 from L2." },
  4: { label: "Strategic Iterator",   text: "When AI gives you a framework, you push back on substance — not just format. That's the skill gap between L3 and L4, and you've decisively crossed it." },
  5: { label: "Pioneer Mindset",      text: "You build systems that make others better. You're not just using AI — you're advancing the practice and creating leverage that multiplies across entire teams." },
};

const BLINDSPOT_CARDS = {
  0: { label: "The Cold Start",       text: "The hardest part isn't learning AI — it's starting. Don't wait for the perfect use case. Pick one real task this week. The relationship starts with a genuine need, not a tutorial." },
  1: { label: "The Artifact Effect",  text: "You may be picking polished responses over useful ones. AI's formatting tricks your brain into trust. Before using any output, ask: 'Is this actually saying something specific?'" },
  2: { label: "Format Over Substance", text: "When AI output looks good, you might accept it as-is. The question isn't 'how does this look?' — it's 'is the reasoning right?' Challenge the logic before you use it." },
  3: { label: "The Agreement Trap",   text: "When AI agrees with you too easily, that's exactly when you should push hardest. It's trained to be agreeable. Your job is to be the skeptic, especially when you want confirmation." },
  4: { label: "The Ceiling Trap",     text: "You're at the frontier of individual performance. The risk: optimizing your own workflow while missing the real multiplier — helping others level up. Teaching is your next leverage." },
  5: { label: "Complexity Debt",      text: "At this level, you may build systems only you understand. The risk is fragility. The next frontier is building for legibility and resilience — systems that outlast your direct involvement." },
};

const GROWTH_ROADMAPS = {
  0: [
    "Try AI for one real task this week — not a test. Something you actually need done. Start with writing: emails, summaries, brainstorms.",
    "Give AI more context. Instead of 'help me with X,' tell it who you are, what you need, and what good output looks like.",
    "Spend 15 min/week exploring one new AI tool. The goal isn't mastery — it's building a mental model of what's possible.",
  ],
  1: [
    "Don't settle for the first response. Re-prompt with specific feedback: 'make it more direct' or 'cut it by half and add an example.'",
    "Experiment where there's no single right answer — creative work, brainstorming, reframing problems. Low stakes, high learning.",
    "Verify crucial AI outputs against primary sources. Spotting hallucinations early builds the instinct that separates L2 from L1.",
  ],
  2: [
    "Before using any AI output, ask: 'Is this actually saying something specific?' That question alone closes the L2→L3 gap.",
    "Stop iterating on format. Start iterating on reasoning. Ask AI to justify its approach, then challenge it.",
    "Try AI as a research partner for one complex task — outlining a report, parsing a document, building a framework from scratch.",
  ],
  3: [
    "Build your best prompt interactions into repeatable templates. Your judgment should be encoded, not recreated manually each time.",
    "Design one workflow where AI handles specific steps and you handle the rest — don't just add AI to an existing process.",
    "Start a personal library of domain-specific prompts. Reusable, tested patterns are the compounding asset of L3→L4.",
  ],
  4: [
    "Build a specialized GPT or system-prompted agent for one routine team task. Share it. Measure the time saved.",
    "Explore one automation platform (Make.com, Zapier, n8n) to wire an AI step directly into a live workflow.",
    "Mentor one person on your AI approach. Explaining your system forces you to make it legible — which makes it better.",
  ],
  5: [
    "Fine-tune or build a domain-specific pipeline using open-weights models. The goal: something production-grade, not experimental.",
    "Formulate a team AI policy: what tasks AI owns, what it assists, and what stays human-only. Write it down. Ship it.",
    "Contribute to the practice — write, speak, or build something that advances how others think about AI systems design.",
  ],
};

/**
 * Load any image URL (including AVIF, SVG, PNG) into a PNG data URL via canvas.
 * Returns null on failure so callers can degrade gracefully.
 */
const loadImgDataUrl = (src) =>
  new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width  = img.naturalWidth  || img.width  || 200;
        c.height = img.naturalHeight || img.height || 60;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve({ dataUrl: c.toDataURL('image/png'), w: c.width, h: c.height });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

/**
 * Generates a premium dark-mode 2-page PDF.
 * Async because it pre-loads brand logos before rendering.
 */
export const generateAIReportPDF = async (leadData) => {
  const { name, phone, email, level, relationshipStatus, scores, referralId } = leadData;
  const lvl  = Math.max(0, Math.min(5, parseInt(level) || 0));
  const meta  = LEVEL_METADATA[lvl];
  const ac    = meta.color;

  // Pre-load logos — all three in parallel; failures are silently ignored
  const [ltLogo, googleLogo, imaginxtLogo] = await Promise.all([
    loadImgDataUrl('/learntube-logo.png'),
    loadImgDataUrl('/backed-by-google.png'),
    loadImgDataUrl('/imaginxt-logo.avif'),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297, P = 14;
  const CW = W - P * 2;

  // ── Palette ──
  const BG   = [9,   9,  11];
  const SURF = [17, 24,  39];
  const BRD  = [31, 41,  55];
  const G500 = [107,114, 128];
  const G400 = [156,163, 175];
  const G300 = [209,213, 219];
  const WHT  = [255,255, 255];
  const TEAL = [45, 212, 191];
  const AMB  = [251,191,  36];

  // ── Helpers ──
  const fill   = (rgb) => doc.setFillColor(...rgb);
  const stroke = (rgb) => doc.setDrawColor(...rgb);
  const color  = (rgb) => doc.setTextColor(...rgb);
  const bold   = (sz)  => { doc.setFont('helvetica','bold');   doc.setFontSize(sz); };
  const reg    = (sz)  => { doc.setFont('helvetica','normal'); doc.setFontSize(sz); };

  const card = (x, y, w, h, fillClr, strokeClr, radius = 2.5) => {
    fill(fillClr); stroke(strokeClr);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, w, h, radius, radius, 'DF');
  };

  const divider = (y, label) => {
    const lw = (CW - label.length * 2.1 - 6) / 2;
    stroke(BRD); doc.setLineWidth(0.25);
    doc.line(P, y + 2, P + lw, y + 2);
    doc.line(W - P - lw, y + 2, W - P, y + 2);
    bold(6); color(G500);
    doc.text(label, W / 2, y + 3, { align: 'center' });
    return y + 8;
  };

  // ── Place a logo image, preserving aspect ratio, centered in a bounding box ──
  const placeImg = (imgInfo, cx, cy, maxW, maxH) => {
    if (!imgInfo) return;
    const ratio = imgInfo.w / imgInfo.h;
    let w = maxW, h = maxW / ratio;
    if (h > maxH) { h = maxH; w = maxH * ratio; }
    doc.addImage(imgInfo.dataUrl, 'PNG', cx - w / 2, cy - h / 2, w, h);
  };

  // ── Page chrome: background, border, footer ──
  const chrome = (pg) => {
    fill(BG); doc.rect(0, 0, W, H, 'F');
    stroke(BRD); doc.setLineWidth(0.2);
    doc.rect(5, 5, W - 10, H - 10);
    // Footer
    stroke(BRD); doc.setLineWidth(0.2);
    doc.line(P, H - 12, W - P, H - 12);
    reg(5.5); color(G500);
    doc.text(`REF: ${referralId || 'SYSTEM'}  ·  ${new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase()}`, P, H - 7.5);
    doc.text(`${pg} / 2`, W - P, H - 7.5, { align: 'right' });
  };

  // ── Branded header strip (page 1 only) ──
  const brandHeader = () => {
    // Dark strip background
    fill(SURF); stroke(BRD); doc.setLineWidth(0.2);
    doc.roundedRect(P, 8, CW, 16, 1.5, 1.5, 'DF');

    // Left: LearnTube logo
    if (ltLogo) {
      placeImg(ltLogo, P + 22, 16, 32, 9);
    } else {
      bold(7); color(WHT); doc.text('LEARNTUBE.AI', P + 5, 17.5);
    }

    // Vertical separator 1
    stroke(BRD); doc.setLineWidth(0.2);
    doc.line(W / 2 - 22, 10.5, W / 2 - 22, 21.5);

    // Center: Backed by Google
    if (googleLogo) {
      placeImg(googleLogo, W / 2, 16, 32, 8);
    } else {
      reg(6); color(G400); doc.text('BACKED BY GOOGLE', W / 2, 17, { align: 'center' });
    }

    // Vertical separator 2
    stroke(BRD); doc.setLineWidth(0.2);
    doc.line(W / 2 + 22, 10.5, W / 2 + 22, 21.5);

    // Right: Imaginext logo with "In partnership with" label
    reg(5); color(G500);
    doc.text('IN PARTNERSHIP WITH', W - P - 22, 12.5, { align: 'center' });
    if (imaginxtLogo) {
      placeImg(imaginxtLogo, W - P - 22, 18, 30, 7);
    } else {
      bold(6.5); color(WHT); doc.text('IMAGINEXT', W - P - 22, 19, { align: 'center' });
    }
  };

  // ══════════════════════════════════════════
  // PAGE 1
  // ══════════════════════════════════════════
  chrome(1);
  brandHeader();
  let y = 29;

  // ── Accent glow strip behind hero ──
  const acDim = ac.map(c => Math.round(c * 0.08 + BG[0] * 0.92));
  fill(acDim);
  doc.roundedRect(P, y, CW, 56, 3, 3, 'F');

  // Top accent line
  fill(ac); doc.rect(P, y, CW, 1.2, 'F');

  // "YOUR AI LEVEL" label
  y += 7;
  bold(6.5); color(G400);
  doc.text('YOUR AI LEVEL', W / 2, y, { align: 'center' });
  y += 2;

  // Giant level number
  const display = lvl >= 5 ? '5+' : String(lvl);
  bold(60); color(ac);
  doc.text(display, W / 2, y + 22, { align: 'center' });
  y += 25;

  // TOP X% badge
  const pct = meta.percentile;
  fill(SURF); stroke(BRD); doc.setLineWidth(0.2);
  doc.roundedRect(W / 2 - 16, y, 32, 7, 3.5, 3.5, 'DF');
  bold(6.5); color(G400);
  doc.text(`TOP ${pct}% OF USERS`, W / 2, y + 4.8, { align: 'center' });
  y += 12;

  // Level name
  bold(14); color(WHT);
  doc.text(meta.name.toUpperCase(), W / 2, y + 5, { align: 'center' });
  y += 11;

  // Tier pill + Relationship pill
  const tierText = meta.tier.toUpperCase();
  const rel = (relationshipStatus || 'casual');
  const relLabel = rel.charAt(0).toUpperCase() + rel.slice(1);

  const acPill = ac.map(c => Math.round(c * 0.15 + BG[0] * 0.85));
  fill(acPill); stroke(ac); doc.setLineWidth(0.3);
  doc.roundedRect(W / 2 - 36, y, 34, 7, 3.5, 3.5, 'DF');
  bold(7); color(ac);
  doc.text(tierText, W / 2 - 19, y + 5, { align: 'center' });

  fill(SURF); stroke(BRD); doc.setLineWidth(0.2);
  doc.roundedRect(W / 2 + 2, y, 34, 7, 3.5, 3.5, 'DF');
  reg(7); color(G300);
  doc.text(relLabel, W / 2 + 19, y + 5, { align: 'center' });
  y += 14;

  // ── CANDIDATE PROFILE ──
  y = divider(y, 'CANDIDATE PROFILE');
  card(P, y, CW, 24, SURF, BRD);
  fill(ac); doc.rect(P, y, CW, 1.2, 'F');

  const col2 = W / 2 + 2;
  bold(6); color(G500); doc.text('NAME',     P + 4, y + 8);
  bold(6); color(G500); doc.text('PHONE',    P + 4, y + 16);
  bold(6); color(G500); doc.text('EMAIL',    col2,  y + 8);
  bold(6); color(G500); doc.text('REF CODE', col2,  y + 16);

  reg(8); color(WHT);
  doc.text((name  || 'N/A').substring(0, 26),        P + 20, y + 8);
  doc.text((phone || 'N/A').substring(0, 22),        P + 20, y + 16);
  doc.text((email || 'Not provided').substring(0, 20), col2 + 18, y + 8);
  doc.text((referralId || 'N/A').substring(0, 16),    col2 + 18, y + 16);
  y += 30;

  // ── COGNITIVE METRICS ──
  y = divider(y, 'COGNITIVE METRICS');
  const hw = (CW - 4) / 2;

  card(P, y, hw, 30, SURF, BRD);
  fill(ac); doc.rect(P, y, hw, 1.5, 'F');
  bold(6); color(G500); doc.text('AI RELATIONSHIP LEVEL', P + 4, y + 9);
  bold(28); color(ac);  doc.text(`${lvl}/5`, P + 5, y + 23);
  bold(8);  color(WHT); doc.text(meta.name,   P + 4, y + 28);

  card(P + hw + 4, y, hw, 30, SURF, BRD);
  fill(G400); doc.rect(P + hw + 4, y, hw, 1.5, 'F');
  bold(6); color(G500); doc.text('RELATIONSHIP STATUS',  P + hw + 8, y + 9);
  bold(14); color(WHT); doc.text(relLabel.toUpperCase(), P + hw + 8, y + 21);
  reg(7);   color(G400); doc.text('Behavioral integration depth', P + hw + 8, y + 27);
  y += 36;

  // ── SKILL DIMENSIONS ──
  y = divider(y, 'SKILL DIMENSIONS');
  const dims = [
    { key: 'diet',      label: 'AI Diet & Variety' },
    { key: 'context',   label: 'Context Depth' },
    { key: 'frequency', label: 'Behavioral Frequency' },
    { key: 'workflow',  label: 'Workflow Integration' },
    { key: 'system',    label: 'System Architecture' },
  ];
  dims.forEach((d) => {
    const val = Math.min(scores?.[d.key] ?? 0, 6);
    const pct2 = val / 6;
    reg(7.5); color(G300); doc.text(d.label, P, y);
    bold(7.5); color(ac);  doc.text(`${val}/6`, W - P, y, { align: 'right' });
    fill(BRD); doc.roundedRect(P, y + 2, CW, 2.5, 1.25, 1.25, 'F');
    if (pct2 > 0) { fill(ac); doc.roundedRect(P, y + 2, CW * pct2, 2.5, 1.25, 1.25, 'F'); }
    y += 11;
  });

  // ══════════════════════════════════════════
  // PAGE 2
  // ══════════════════════════════════════════
  doc.addPage();
  chrome(2);

  // Compact page 2 brand strip
  fill(SURF); stroke(BRD); doc.setLineWidth(0.15);
  doc.roundedRect(P, 8, CW, 10, 1.5, 1.5, 'DF');
  bold(6); color(G500);
  doc.text('LEARNTUBE.AI  ×  IMAGINEXT', W / 2, 14.5, { align: 'center' });
  reg(5.5); color(G500);
  doc.text('AI COGNITIVE BLUEPRINT  ·  CONFIDENTIAL', W - P - 2, 14.5, { align: 'right' });
  y = 24;

  // ── YOUR PROFILE ──
  y = divider(y, 'YOUR PROFILE');
  card(P, y, CW, 36, SURF, BRD);
  fill(ac); doc.rect(P, y + 3, 2.5, 30, 'F');
  reg(8); color(G300);
  const profileSplit = doc.splitTextToSize(PROFILE_TEXT[lvl], CW - 12);
  doc.text(profileSplit, P + 7, y + 8);
  y += 42;

  // ── WHAT'S WORKING (teal) ──
  y = divider(y, "WHAT'S WORKING");
  const str = STRENGTH_CARDS[lvl];
  fill([8, 35, 32]); stroke([20, 90, 78]); doc.setLineWidth(0.3);
  doc.roundedRect(P, y, CW, 30, 2.5, 2.5, 'DF');
  fill(TEAL); doc.rect(P, y, 2.5, 30, 'F');
  bold(7.5); color(TEAL);
  doc.text(str.label.toUpperCase(), P + 7, y + 8);
  reg(8); color(G300);
  doc.text(doc.splitTextToSize(str.text, CW - 10), P + 7, y + 15);
  y += 36;

  // ── WATCH OUT FOR (amber) ──
  y = divider(y, 'WATCH OUT FOR');
  const blind = BLINDSPOT_CARDS[lvl];
  fill([35, 18, 4]); stroke([110, 65, 10]); doc.setLineWidth(0.3);
  doc.roundedRect(P, y, CW, 30, 2.5, 2.5, 'DF');
  fill(AMB); doc.rect(P, y, 2.5, 30, 'F');
  bold(7.5); color(AMB);
  doc.text(blind.label.toUpperCase(), P + 7, y + 8);
  reg(8); color(G300);
  doc.text(doc.splitTextToSize(blind.text, CW - 10), P + 7, y + 15);
  y += 36;

  // ── GROWTH ROADMAP ──
  y = divider(y, 'GROWTH ROADMAP');
  const steps = GROWTH_ROADMAPS[lvl] || GROWTH_ROADMAPS[4];
  steps.forEach((step, i) => {
    // Numbered accent circle
    fill(ac); doc.ellipse(P + 4, y + 3.5, 3.5, 3.5, 'F');
    bold(7.5); color(BG); doc.text(`${i + 1}`, P + 4, y + 4, { align: 'center' });
    // Step text
    bold(8.5); color(WHT); doc.text(`Step ${i + 1}`, P + 12, y + 2.5);
    reg(7.5); color(G300);
    const lines = doc.splitTextToSize(step, CW - 16);
    doc.text(lines, P + 12, y + 8);
    y += 8 + lines.length * 4.2 + 4;
  });

  return doc.output('blob');
};

const REPORT_SEND_API =
  'https://xgfy-czuw-092q.m2.xano.io/api:GzVKKOQ4/aireadiness/report/send';

/**
 * Fire-and-forget WhatsApp PDF dispatcher (Xano multipart upload).
 * Mirrors LinkedIn share_image_post: FormData + File blob attachment.
 */
export const dispatchPDFReportToWhatsApp = (phone, pdfBlob, leadData = {}) => {
  const endpoint = window.WHATSAPP_PDF_API_URL || REPORT_SEND_API;
  const lvl = Math.max(0, Math.min(5, parseInt(leadData.level, 10) || 0));
  const levelTitle = LEVEL_METADATA[lvl]?.name || 'Unknown';
  const relationshipStatus = leadData.relationshipStatus || 'casual';

  const safeName = (leadData.name || 'candidate').replace(/[^\w\s-]/g, '').trim() || 'candidate';
  const pdfFile = new File(
    [pdfBlob],
    `${safeName}.pdf`,
    { type: 'application/pdf' }
  );

  const formData = new FormData();
  formData.append('phone', phone);
  formData.append('name', leadData.name || '');
  formData.append('level', String(lvl));
  formData.append('level_title', levelTitle);
  formData.append('relationship_status', relationshipStatus);
  formData.append('pdf_file', pdfFile);

  fetch(endpoint, { method: 'POST', body: formData })
    .then(async (r) => {
      if (!r.ok) {
        const errText = await r.text();
        throw new Error(`${r.status} ${r.statusText} - ${errText}`);
      }
      return r.json();
    })
    .then((d) => console.log('✅ Report send OK', d))
    .catch((e) => console.warn('⚠️ Report send skipped:', e));
};
