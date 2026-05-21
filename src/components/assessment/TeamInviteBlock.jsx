/**
 * TeamInviteBlock v3 — Compact, visual, milestone-driven with blur-locked report
 *
 * Shown when prioritizeTeamChallenge=true on LevelReveal results page.
 * Non-leaders keep the existing friend-challenge block.
 */

import React, { useState } from 'react';

// ─── Framework A Abilities (verified from scoring engine) ──────────
const STATUS_COLORS = {
  red: { bar: 'rgba(239,68,68,0.4)', icon: '#475569' },
  amber: { bar: 'rgba(245,158,11,0.4)', icon: '#475569' },
  green: { bar: 'rgba(34,197,94,0.4)', icon: '#475569' },
};

function getVisibleAbilities(level) {
  if (level >= 4) {
    return [
      { key: 'workflowDesign', label: 'Workflow Design', fill: 40, status: 'red' },
      { key: 'systemThinking', label: 'System Thinking', fill: 32, status: 'red' },
      { key: 'outputEval', label: 'Output Eval', fill: 65, status: 'green' },
      { key: 'iteration', label: 'Iteration', fill: 55, status: 'amber' },
    ];
  }
  if (level >= 2) {
    return [
      { key: 'outputEval', label: 'Output Eval', fill: 35, status: 'red' },
      { key: 'iteration', label: 'Iteration', fill: 58, status: 'amber' },
      { key: 'taskSelection', label: 'Task Selection', fill: 72, status: 'green' },
      { key: 'restraint', label: 'AI Restraint', fill: 50, status: 'amber' },
    ];
  }
  return [
    { key: 'taskSelection', label: 'Task Selection', fill: 28, status: 'red' },
    { key: 'outputEval', label: 'Output Eval', fill: 38, status: 'red' },
    { key: 'restraint', label: 'AI Restraint', fill: 55, status: 'amber' },
    { key: 'toolBreadth', label: 'Tool Breadth', fill: 22, status: 'red' },
  ];
}

function getHeader(level, company) {
  const name = company || 'your team';
  if (level <= 1) return `You're at Level ${level}. Where's ${name}?`;
  if (level <= 3) return `You're Level ${level}. Is ${name} keeping up?`;
  return `You're Level ${level}. Can ${name} keep up?`;
}

/** Pre-written share messages — exported for LevelReveal handler */
export function getTeamInviteMessages(level, levelName, shareUrl) {
  const isHigh = level >= 3;

  return {
    whatsapp: isHigh
      ? `Hey team — took this AI Level test, scored Level ${level} (${levelName}). Most people overestimate by 2 levels. Takes 10 min — want to see where we all land as a team.\n\n${shareUrl}`
      : `Hey team — took this AI Level test. Got a reality check on where I actually stand with AI. Takes 10 min, worth doing. If 5 of us take it we get a free team report.\n\n${shareUrl}`,
    copy: isHigh
      ? `AI Level test — I scored Level ${level} (${levelName}). Most people overestimate by 2 levels. Takes 10 min. If 5+ of us take it, we unlock a team diagnostic report: ${shareUrl}`
      : `AI Level test — quick reality check on where you stand with AI. 10 min. If 5+ of us take it, we unlock a team diagnostic report: ${shareUrl}`,
    email: {
      subject: `AI Level Assessment — let's see where the team stands`,
      body: `Hey —\n\nJust took this 10-minute AI proficiency test. Scored Level ${level} (${levelName}). Turns out most people overestimate by 2 levels.\n\nIf 5+ of us take it, we get a free Team Intelligence Report — shows our collective gaps across 8 AI abilities and the top fixes. 10+ unlocks a free strategy call.\n\nTakes 10 minutes: ${shareUrl}\n\nWorth doing this week.`,
    },
  };
}

const WhatsAppIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.24 0-4.318-.726-6.002-1.958l-.42-.318-3.198 1.072 1.072-3.198-.318-.42A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);

function TeamInviteBlock({
  level,
  data,
  company,
  shareUrl,
  onShare,
  onRequestOffering,
  scores: _scores,
}) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [sentVia, setSentVia] = useState(null);
  const [offeringRequested, setOfferingRequested] = useState(false);

  const headline = getHeader(level, company);
  const abilities = getVisibleAbilities(level);

  const borderColor = `${data.color}25`;
  const bgColor = `${data.color}08`;

  const handleShareClick = (method) => {
    onShare(method);
    if (method === 'copy') {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } else {
      setSentVia(method);
      setTimeout(() => setSentVia(null), 5000);
    }
  };

  const handleOfferingClick = async () => {
    const result = await onRequestOffering();
    if (result?.success !== false) {
      setOfferingRequested(true);
    }
  };

  return (
    <>
      {/* Section divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-gray-800/40" />
        <span className="text-gray-500 text-xs tracking-[0.2em] uppercase font-medium">Your Team</span>
        <div className="flex-1 h-px bg-gray-800/40" />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${borderColor}`, background: bgColor }}>

        {/* Hook */}
        <div className="px-4 pt-4 pb-3">
          <p className="text-white text-[14px] font-bold leading-snug mb-1">{headline}</p>
          <p className="text-gray-400 text-[11px]">Get your team assessed. See the gaps. Get the fixes.</p>
        </div>

        {/* Milestone Progress Bar — TODO: dynamic fill from team completion API */}
        <div className="px-4 pb-1.5">
          <div className="relative pt-2">
            <div className="h-1.5 rounded-full bg-white/[0.04] relative">
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{ width: '10%', background: `linear-gradient(90deg, ${data.color}80, ${data.color})` }}
              />
              <div
                className="absolute top-1/2 w-2.5 h-2.5 rounded-full z-10"
                style={{ left: '10%', transform: 'translate(-50%, -50%)', background: data.color, border: '2px solid #0f172a' }}
              />
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ background: '#0f172a', border: '2px solid rgba(59,130,246,0.3)' }}
              >
                <span className="text-[7px]">📊</span>
              </div>
              <div
                className="absolute top-1/2 right-0 -translate-y-1/2 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                style={{ background: '#0f172a', border: '2px solid rgba(245,158,11,0.3)' }}
              >
                <span className="text-[7px]">📞</span>
              </div>
            </div>
            <div className="relative mt-2.5 h-7">
              <div className="absolute text-center" style={{ left: '10%', transform: 'translateX(-50%)' }}>
                <span className="text-[9px] font-semibold" style={{ color: data.color }}>You</span>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap">
                <span className="text-gray-400 text-[9px] font-medium">5 members</span>
                <br />
                <span className="text-gray-600 text-[8px]">Team Report</span>
              </div>
              <div className="absolute right-0 text-center whitespace-nowrap" style={{ transform: 'translateX(2px)' }}>
                <span className="text-amber-400 text-[9px] font-medium">10 members</span>
                <br />
                <span className="text-gray-600 text-[8px]">Strategy Call</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mini Report Preview (blur locked) */}
        <div className="mx-3 mb-3 rounded-xl bg-slate-900/50 border border-white/[0.04] p-3 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2.5 relative z-10">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]">📊</span>
              <span className="text-gray-200 text-[10.5px] font-semibold">Team Intelligence Report</span>
            </div>
            <span className="text-[8px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-full">🔒 Locked</span>
          </div>

          <div style={{ filter: 'blur(1.8px)', opacity: 0.7, pointerEvents: 'none' }}>
            <div className="space-y-1.5 mb-2.5">
              {abilities.map((a) => {
                const colors = STATUS_COLORS[a.status];
                return (
                  <div key={a.key} className="flex items-center gap-2">
                    <span className="text-gray-400 text-[9.5px] w-[90px] flex-shrink-0">{a.label}</span>
                    <div className="flex-1 h-[5px] rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${a.fill}%`, background: colors.bar }} />
                    </div>
                    <span className="text-[8px] w-3 text-right" style={{ color: colors.icon }}>🔒</span>
                  </div>
                );
              })}
              <span className="text-gray-600 text-[9px] pl-0.5">+4 more abilities</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className="text-[8.5px] text-gray-400 bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded-full">🏆 Team vs. industry rank</span>
              <span className="text-[8.5px] text-gray-400 bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded-full">⚡ Top 3 quick fixes</span>
              <span className="text-[8.5px] text-gray-400 bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded-full">📈 Gap analysis</span>
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center z-[5]" style={{ pointerEvents: 'none' }}>
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(4px)' }}
              >
                <span className="text-[16px]">🔒</span>
              </div>
              <span className="text-gray-500 text-[9px] font-semibold tracking-wide">5 members to unlock</span>
            </div>
          </div>
        </div>

        {/* Share buttons */}
        <div className="px-3 pb-2.5">
          <div className="grid grid-cols-3 gap-1.5 mb-1.5">
            <button
              onClick={() => handleShareClick('whatsapp')}
              className="py-3 rounded-xl text-emerald-400 text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-all hover:bg-emerald-500/25 active:scale-[0.97]"
              style={{ background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.25)' }}
              aria-label="Share via WhatsApp"
            >
              <WhatsAppIcon /> WhatsApp
            </button>
            <button
              onClick={() => handleShareClick('linkedin')}
              className="py-3 rounded-xl text-blue-400 text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-all hover:bg-blue-500/25 active:scale-[0.97]"
              style={{ background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.25)' }}
              aria-label="Share via LinkedIn"
            >
              <LinkedInIcon /> LinkedIn
            </button>
            <button
              onClick={() => handleShareClick('email')}
              className="py-3 rounded-xl text-purple-400 text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-all hover:bg-purple-500/25 active:scale-[0.97]"
              style={{ background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.25)' }}
              aria-label="Share via Email"
            >
              <EmailIcon /> Email
            </button>
          </div>
          <button
            onClick={() => handleShareClick('copy')}
            className={`w-full py-2.5 rounded-xl text-[10.5px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
              linkCopied
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/[0.03] text-gray-500 border border-white/[0.06] hover:text-gray-400'
            }`}
          >
            <CopyIcon />
            {linkCopied ? 'Message + link copied!' : 'Copy message + link'}
          </button>
          {sentVia && (
            <p className="text-emerald-400/70 text-[10px] text-center mt-1.5 animate-pulse">
              Sent! 4 more to unlock your Team Report.
            </p>
          )}
        </div>

        {/* Footer — TODO: real-time counter from API */}
        <div className="border-t border-white/[0.03] px-4 py-2 flex items-center justify-between">
          <span className="text-gray-600 text-[9px]">
            <span className="text-gray-500 font-medium" id="team-counter">23</span> teams started today
          </span>
          {offeringRequested ? (
            <span className="text-[9px] font-semibold text-emerald-400/80">
              ✓ Added to waitlist
            </span>
          ) : (
            <button
              onClick={handleOfferingClick}
              className="text-[9.5px] font-semibold border-b border-dashed transition-all hover:opacity-80"
              style={{ color: data.color, borderColor: data.color, background: 'none', padding: 0, cursor: 'pointer' }}
            >
              Request Custom Offering
            </button>
          )}
        </div>

      </div>
    </>
  );
}

export default TeamInviteBlock;
