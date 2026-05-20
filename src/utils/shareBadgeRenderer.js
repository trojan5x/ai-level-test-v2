/**
 * Share badge canvas renderer — used on results page and WhatsApp report dispatch.
 */

const LEVEL_DATA = {
  0: { name: "Non-User", color: "#64748b", tier: "Explorer" },
  1: { name: "Experimenter", color: "#818cf8", tier: "Explorer" },
  2: { name: "Functional User", color: "#3b82f6", tier: "Practitioner" },
  3: { name: "Effective Practitioner", color: "#10b981", tier: "Operator" },
  4: { name: "AI-Native Performer", color: "#f59e0b", tier: "Strategist" },
  5: { name: "AI-Native Builder", color: "#f97316", tier: "Architect" },
  6: { name: "Frontier Contributor", color: "#ef4444", tier: "Pioneer" },
};

const RELATIONSHIP_DATA = {
  single: { status: "Single", tier: "Pre-Tool", emoji: "💤", color: "#94a3b8" },
  casual: { status: "Casual", tier: "Tool", emoji: "👋", color: "#a78bfa" },
  committed: { status: "Committed", tier: "Colleague", emoji: "🤝", color: "#60a5fa" },
  merged: { status: "Merged", tier: "Symbiont", emoji: "🧬", color: "#34d399" },
  complicated: { status: "It's Complicated", tier: "Mixed", emoji: "🌀", color: "#fbbf24" },
};

function getPercentile(level) {
  const map = { 0: 95, 1: 65, 2: 34, 3: 12, 4: 5, 5: 1, 6: 0.1 };
  return map[level] || 34;
}

const BADGE_GEM_TIERS = {
  0: { bg: ["#08090f","#0e1018"], gem: ["#5a657a","#7a869e","#95a0b8","#b0bcd0","#d0d8e8"], accent: "#95a0b8", sparkle: "#d0d8e8", name: "STEEL" },
  1: { bg: ["#08090f","#0e1018"], gem: ["#5a657a","#7a869e","#95a0b8","#b0bcd0","#d0d8e8"], accent: "#95a0b8", sparkle: "#d0d8e8", name: "STEEL" },
  2: { bg: ["#020e08","#041a0e"], gem: ["#047857","#059669","#10b981","#34d399","#6ee7b7"], accent: "#34d399", sparkle: "#a7f3d0", name: "EMERALD" },
  3: { bg: ["#020818","#06122d"], gem: ["#1e40af","#2563eb","#3b82f6","#60a5fa","#93c5fd"], accent: "#60a5fa", sparkle: "#bfdbfe", name: "SAPPHIRE" },
  4: { bg: ["#0a0318","#15082e"], gem: ["#6d28d9","#7c3aed","#8b5cf6","#a78bfa","#c4b5fd"], accent: "#a78bfa", sparkle: "#ddd6fe", name: "AMETHYST" },
  5: { bg: ["#140a00","#241600"], gem: ["#a16207","#ca8a04","#eab308","#fbbf24","#fde68a"], accent: "#fbbf24", sparkle: "#fef3c7", name: "GOLD" },
  6: { bg: ["#1a0000","#2d0505"], gem: ["#b91c1c","#dc2626","#ef4444","#f87171","#fca5a5"], accent: "#f87171", sparkle: "#fecaca", name: "RUBY" },
};

const BADGE_LOGOS = { lt: null, ix: null };
let badgeLogosPromise = null;

function loadBadgeLogo(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function preloadBadgeLogos() {
  if (!badgeLogosPromise) {
    badgeLogosPromise = Promise.all([
      loadBadgeLogo('/learntube-report-logo.png'),
      loadBadgeLogo('/imaginxt-logo.avif'),
    ]).then(([lt, ix]) => {
      BADGE_LOGOS.lt = lt;
      BADGE_LOGOS.ix = ix;
    });
  }
  return badgeLogosPromise;
}

function drawScaledLogo(ctx, img, anchorX, centerY, maxHeight, align = 'left') {
  const h = maxHeight;
  const w = (img.naturalWidth / img.naturalHeight) * h;
  const x = align === 'right' ? anchorX - w : anchorX;
  ctx.drawImage(img, x, centerY - h / 2, w, h);
}

export function renderShareCard(canvas, level, levelData, relationshipData, percentile, referralLink = null, selfSelectedLevel = null) {
  const ctx = canvas.getContext("2d");
  const S = 1080;
  canvas.width = S;
  canvas.height = S;

  const t = BADGE_GEM_TIERS[Math.min(level, 6)] || BADGE_GEM_TIERS[0];
  const cx = S / 2;
  const levelDisplay = level >= 5 ? "5+" : String(level);

  let _seed = level * 1000 + 42;
  function rand() { _seed = (_seed * 16807) % 2147483647; return _seed / 2147483647; }

  const REL_WORDS = { "Merged": "MERGED", "Committed": "COMMITTED", "It's Complicated": "IT’S COMPLICATED", "Casual": "CASUAL" };
  const relWord = relationshipData.status !== "Single" ? (REL_WORDS[relationshipData.status] || null) : null;

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

  const topY = 48;
  const marginX = 60;
  const ltLogoH = 48;
  const ixLogoH = 43;
  ctx.textBaseline = "middle";

  if (BADGE_LOGOS.lt) {
    drawScaledLogo(ctx, BADGE_LOGOS.lt, marginX, topY, ltLogoH, 'left');
  } else {
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "600 14px system-ui, -apple-system, sans-serif";
    let ltx = marginX;
    for (const ch of "LEARNTUBE") { ctx.fillText(ch, ltx, topY); ltx += ctx.measureText(ch).width + 3; }
  }

  if (BADGE_LOGOS.ix) {
    drawScaledLogo(ctx, BADGE_LOGOS.ix, S - marginX, topY, ixLogoH, 'right');
  } else {
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "700 13px system-ui, -apple-system, sans-serif";
    ctx.fillText("IMAGINEXT", S - marginX, topY);
  }

  ctx.strokeStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.1)`;
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(60, 70); ctx.lineTo(S - 60, 70); ctx.stroke();

  const gemCy = 280, gemR = 200;

  const glowGrad = ctx.createRadialGradient(cx, gemCy + 20, 0, cx, gemCy + 20, gemR * 1.5);
  glowGrad.addColorStop(0, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.3)`);
  glowGrad.addColorStop(0.3, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.1)`);
  glowGrad.addColorStop(0.7, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.03)`);
  glowGrad.addColorStop(1, "transparent");
  ctx.fillStyle = glowGrad; ctx.fillRect(0, 0, S, S);

  const outerPts = hexPts(cx, gemCy, gemR);
  const center = { x: cx, y: gemCy };

  drawHex(outerPts);
  const gemBodyGrad = ctx.createLinearGradient(cx - gemR, gemCy - gemR, cx + gemR, gemCy + gemR);
  gemBodyGrad.addColorStop(0, t.gem[0]); gemBodyGrad.addColorStop(0.5, t.gem[1]); gemBodyGrad.addColorStop(1, t.gem[0]);
  ctx.fillStyle = gemBodyGrad; ctx.fill();

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

  const innerPts = hexPts(cx, gemCy, gemR * 0.55);
  drawHex(innerPts);
  const innerGrad = ctx.createRadialGradient(cx - 40, gemCy - 40, 0, cx, gemCy, gemR * 0.55);
  innerGrad.addColorStop(0, t.gem[3]); innerGrad.addColorStop(0.5, t.gem[2]); innerGrad.addColorStop(1, t.gem[1]);
  ctx.fillStyle = innerGrad; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;

  ctx.strokeStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.2)`; ctx.lineWidth = 0.8;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(innerPts[i].x, innerPts[i].y); ctx.lineTo(outerPts[i].x, outerPts[i].y); ctx.stroke(); }
  ctx.strokeStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.25)`; ctx.lineWidth = 1;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(center.x, center.y); ctx.lineTo(outerPts[i].x, outerPts[i].y); ctx.stroke(); }

  ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(outerPts[4].x, outerPts[4].y); ctx.lineTo(outerPts[5].x, outerPts[5].y); ctx.lineTo(outerPts[0].x, outerPts[0].y); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(outerPts[0].x, outerPts[0].y); ctx.lineTo(outerPts[1].x, outerPts[1].y); ctx.stroke();

  drawHex(outerPts);
  ctx.strokeStyle = `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.4)`; ctx.lineWidth = 1.5; ctx.stroke();

  const reflY = gemCy + gemR + 12;
  const lineGr = ctx.createLinearGradient(cx - 200, 0, cx + 200, 0);
  lineGr.addColorStop(0, "transparent"); lineGr.addColorStop(0.3, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.12)`);
  lineGr.addColorStop(0.5, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.2)`); lineGr.addColorStop(0.7, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.12)`);
  lineGr.addColorStop(1, "transparent");
  ctx.strokeStyle = lineGr; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(cx - 260, reflY); ctx.lineTo(cx + 260, reflY); ctx.stroke();

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

  ctx.textAlign = "center";
  const levelNames = ["Non-User","Experimenter","Functional User","Effective Practitioner","AI-Native Performer","AI-Native Builder","Frontier Contributor"];
  const nameY = gemCy + gemR + 40;
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "500 20px system-ui, -apple-system, sans-serif";
  spacedText((levelNames[level] || levelNames[0]).toUpperCase(), cx, nameY, 3);

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

    ctx.save();
    const tg = ctx.createRadialGradient(cx, relWordY, 0, cx, relWordY, 180);
    tg.addColorStop(0, `rgba(${accentRgb.r},${accentRgb.g},${accentRgb.b},0.06)`); tg.addColorStop(1, "transparent");
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = tg; ctx.fillRect(cx - 180, relWordY - 50, 360, 100);
    ctx.restore();
  }

  const pctDisplay = percentile || [95, 65, 34, 12, 5, 1][level] || 50;
  const pctY = relWord ? (nameY + 46 + 56 + 52) : (nameY + 60);
  ctx.font = "700 20px system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#ffffff";
  if (level <= 1) {
    ctx.fillText("Now I know where I stand — growth starts here", cx, pctY);
  } else {
    ctx.fillText(`Top ${pctDisplay}% of professionals assessed`, cx, pctY);
  }

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

  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = "700 22px system-ui, -apple-system, sans-serif";
  ctx.fillText("What’s your AI Level?", cx, S - 82);

  ctx.fillStyle = t.accent;
  ctx.font = "800 19px system-ui, -apple-system, sans-serif";

  const displayUrl = referralLink ?
    referralLink.replace(/https?:\/\//, '') :
    (typeof window !== 'undefined' ? window.location.host : "ai-level.learntube.ai");
  ctx.fillText(`Visit: ${displayUrl}`, cx, S - 52);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "500 14px system-ui, -apple-system, sans-serif";
  ctx.fillText("Free  ·  Under 10 min  ·  4M+ assessed", cx, S - 26);

  void levelData;
  void selfSelectedLevel;
}

/**
 * Generate share badge PNG blob for WhatsApp / LinkedIn uploads.
 */
export async function generateShareBadgeBlob({
  level,
  relationshipStatus,
  referralLink = null,
  selfSelectedLevel = null,
}) {
  await preloadBadgeLogos();

  const levelData = LEVEL_DATA[level] || LEVEL_DATA[4];
  const relationshipData = RELATIONSHIP_DATA[relationshipStatus] || RELATIONSHIP_DATA.casual;
  const percentile = getPercentile(level);

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    renderShareCard(
      canvas,
      level,
      levelData,
      relationshipData,
      percentile,
      referralLink,
      selfSelectedLevel,
    );

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create badge blob'));
    }, 'image/png');
  });
}

/** Base64 PNG (no data: prefix) for LinkedIn share flow. */
export async function generateShareBadgeBase64(options) {
  const blob = await generateShareBadgeBlob(options);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
