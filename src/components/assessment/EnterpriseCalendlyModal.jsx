/**
 * Modal form for enterprise Calendly booking — replaces browser prompt() dialogs.
 */

import React, { useEffect, useState } from 'react';

function EnterpriseCalendlyModal({ isOpen, onClose, onSubmit, company, phone }) {
  const [teamSize, setTeamSize] = useState('');
  const [goal, setGoal] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTeamSize('');
      setGoal('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canSubmit = teamSize.trim().length > 0 && goal.trim().length >= 3;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ teamSize: teamSize.trim(), goal: goal.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-gray-950/90 backdrop-blur-md animate-[fadeIn_0.25s_ease-out] p-0 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="enterprise-modal-title"
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-800/60">
          <div>
            <h2 id="enterprise-modal-title" className="text-white text-base font-bold tracking-wide">
              Book a strategy slot
            </h2>
            <p className="text-gray-500 text-[11px] mt-0.5">
              {company ? `Tell us about ${company}'s team` : 'Tell us about your team'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-2 -mr-2"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {phone && (
            <div>
              <label htmlFor="enterprise-phone" className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider block mb-1.5">
                Phone number
              </label>
              <input
                id="enterprise-phone"
                type="tel"
                value={phone}
                readOnly
                className="mp-sensitive w-full rounded-xl border border-gray-700/60 bg-gray-900/40 px-3 py-3 text-gray-400 text-sm cursor-not-allowed"
              />
              <p className="text-gray-600 text-[10px] mt-1">From your assessment signup — sent to Calendly automatically.</p>
            </div>
          )}

          <div>
            <label htmlFor="enterprise-team-size" className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider block mb-1.5">
              Team size
            </label>
            <input
              id="enterprise-team-size"
              type="text"
              inputMode="numeric"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              placeholder="e.g. 25"
              className="mp-sensitive w-full rounded-xl border border-gray-700/60 bg-gray-900/60 px-3 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="enterprise-goal" className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider block mb-1.5">
              What would you use a team AI report for?
            </label>
            <textarea
              id="enterprise-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. training budget, hiring, upskilling"
              rows={3}
              className="mp-sensitive w-full rounded-xl border border-gray-700/60 bg-gray-900/60 px-3 py-3 text-white text-sm placeholder:text-gray-600 resize-none focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
            />
          </div>

          <div
            className="flex flex-col-reverse sm:flex-row gap-2 pt-1"
            style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 py-3 rounded-xl text-sm font-medium text-gray-400 bg-gray-800/40 hover:bg-gray-800/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full sm:flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/15"
            >
              Continue to Calendly →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EnterpriseCalendlyModal;
