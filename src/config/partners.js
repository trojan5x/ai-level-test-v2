/**
 * Partner branding registry
 *
 * The main site (/) is white-label: no partner block anywhere.
 * Each partner gets a landing route at /<slug> (generated from this registry
 * in App.jsx); the slug is persisted for the rest of the flow so the header,
 * PDF report, share badge, and LinkedIn copy stay branded.
 *
 * To add a partner: add an entry here and drop its logo in /public.
 */

export const PARTNER_STORAGE_KEY = 'ai-level-partner';

export const PARTNER_REGISTRY = {
  default: {
    slug: 'default',
    name: null,
    headerLogo: null,
    reportLogo: null,
    badgeLogo: null,
    partnershipLabel: null,
    logoAlt: null,
    logoFallbackText: null,
    linkedin: {
      hashtags: '#LearnTubeAI',
      attribution: "Took the AI-Readiness Test by LearnTube.ai, India's only AI-powered skilling platform.",
    },
  },
  imaginxt: {
    slug: 'imaginxt',
    name: 'ImagiNxt',
    headerLogo: '/imaginxt-2026-logo.png',
    reportLogo: '/imaginxt-2026-logo.png',
    badgeLogo: '/imaginxt-2026-logo.png',
    partnershipLabel: 'In partnership with',
    logoAlt: 'ImagiNxt',
    logoFallbackText: 'IMAGINEXT',
    linkedin: {
      hashtags: '#LearnTubeAI #ImagiNxt2026\n#MumbaiAIReadinessReport',
      attribution: "Took the AI-Readiness Test, by LearnTube.ai, India's only AI-powered skilling platform, and ImagiNxt, India's Festival of Technology and Innovation.",
    },
  },
};

export function getPartnerConfig(slug) {
  return PARTNER_REGISTRY[slug] || PARTNER_REGISTRY.default;
}

/**
 * Persist the active partner slug (dual-save like assessment state).
 * Called from Landing on mount, so visiting any landing URL overwrites
 * the previous partner — "/" resets to default.
 */
export function setActivePartner(slug) {
  const validSlug = PARTNER_REGISTRY[slug] ? slug : 'default';
  try {
    localStorage.setItem(PARTNER_STORAGE_KEY, validSlug);
    sessionStorage.setItem(PARTNER_STORAGE_KEY, validSlug);
  } catch (error) {
    console.warn('Failed to persist partner slug:', error);
  }
}

/**
 * Read the active partner config. Falls back to default when the key is
 * missing or the stored slug is no longer in the registry.
 */
export function getActivePartner() {
  let slug = null;
  try {
    slug = localStorage.getItem(PARTNER_STORAGE_KEY) || sessionStorage.getItem(PARTNER_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to read partner slug:', error);
  }
  return getPartnerConfig(slug);
}

/**
 * Hook form for components. A plain read is enough — the slug only changes
 * on landing-page mount, before any branded screen renders.
 */
export function usePartner() {
  return getActivePartner();
}
