/**
 * Semantic option definitions and scoring helpers for MCQ questions.
 * Display order is shuffled at runtime; correctness is keyed by semantic ID.
 */

export const BEHAVIORAL_PAIRS = [
  {
    id: 'iterate',
    options: [
      { id: 'accept_first', text: "I accept AI's first output if it looks reasonable" },
      { id: 'push_back', text: "I push back on AI's first output even when it looks good", mature: true },
    ],
  },
  {
    id: 'tools',
    options: [
      { id: 'single_tool', text: 'I use one AI tool for most things' },
      { id: 'multi_tool', text: 'I switch between tools depending on the task', mature: true },
    ],
  },
  {
    id: 'start',
    options: [
      { id: 'direct_start', text: 'I start working on tasks directly' },
      { id: 'ai_first', text: 'I first consider whether AI could handle part of it', mature: true },
    ],
  },
  {
    id: 'evaluate',
    options: [
      { id: 'surface_judge', text: 'I judge AI output by whether it looks right' },
      { id: 'substance_check', text: 'I check AI output against what I know, even when it looks polished', mature: true },
    ],
  },
];

export const ITEM3_OPTIONS = [
  {
    id: 'polished_trap',
    text: 'To boost team productivity, focus on three core pillars. First, optimize your workflow processes — streamline communication and reduce meeting overhead. Second, invest in the right tools — the tech stack matters more than most realize. Third, foster accountability. These levers create a multiplicative effect. Start by conducting a productivity audit.',
    rich: true,
  },
  {
    id: 'useful_response',
    text: "Before you change anything, find where time actually goes. Most teams assume meetings kill productivity, but they'll cut meetings and nothing changes. The real leak is usually async work — Slack threads that should be decisions, emails that should be syncs. Watch what your best performer does differently. Most productivity gains come from stopping something, not adding to your stack.",
    correct: true,
  },
];

export const ITEM3B_OPTIONS = [
  {
    id: 'yes_man',
    text: "You're right to not worry. Since you've had this feature for 6 months, you have a significant head start. Your users are already familiar with it, and your competitor is playing catch-up. Focus on staying ahead with your next innovation rather than looking backward. Your first-mover advantage is real.",
  },
  {
    id: 'challenge_assumption',
    text: "The question isn't whether they copied you — it's whether their version is better positioned. Having a feature first doesn't mean you own it. How are your retention numbers on that feature? If usage is flat after 6 months, their fresh launch with better marketing might actually leapfrog you. What does your usage data say?",
    correct: true,
  },
];

const BEHAVIORAL_MATURE_BY_PAIR = Object.fromEntries(
  BEHAVIORAL_PAIRS.map((pair) => [
    pair.id,
    pair.options.find((o) => o.mature)?.id,
  ])
);

const ALL_OPTIONS = {
  item3: Object.fromEntries(ITEM3_OPTIONS.map((o) => [o.id, o])),
  item3b: Object.fromEntries(ITEM3B_OPTIONS.map((o) => [o.id, o])),
};

/** @deprecated legacy letter answers from pre-1.1 sessions */
const LEGACY_ITEM3 = { A: 'polished_trap', B: 'useful_response' };
const LEGACY_ITEM3B = { A: 'yes_man', B: 'challenge_assumption' };
const LEGACY_BEHAVIORAL = { a: 'immature', b: 'mature' };

export function normalizeItem3Choice(choice) {
  if (!choice) return null;
  if (LEGACY_ITEM3[choice]) return LEGACY_ITEM3[choice];
  return choice;
}

export function normalizeItem3bChoice(choice) {
  if (!choice) return null;
  if (LEGACY_ITEM3B[choice]) return LEGACY_ITEM3B[choice];
  return choice;
}

export function normalizeBehavioralChoice(pairId, choice) {
  if (!choice) return null;
  const pair = BEHAVIORAL_PAIRS.find((p) => p.id === pairId);
  if (!pair) return choice;
  if (choice === 'a' || choice === 'b') {
    const idx = choice === 'a' ? 0 : 1;
    return pair.options[idx]?.id ?? choice;
  }
  return choice;
}

export function isItem3Correct(choice) {
  const id = normalizeItem3Choice(choice);
  return id === 'useful_response';
}

export function isItem3bCorrect(choice) {
  const id = normalizeItem3bChoice(choice);
  return id === 'challenge_assumption';
}

export function isBehavioralMature(pairId, choice) {
  const id = normalizeBehavioralChoice(pairId, choice);
  return id === BEHAVIORAL_MATURE_BY_PAIR[pairId];
}

export function scoreBehavioralFrequency(responses) {
  if (!responses || typeof responses !== 'object') return 0;
  let score = 0;
  for (const pair of BEHAVIORAL_PAIRS) {
    if (isBehavioralMature(pair.id, responses[pair.id])) score++;
  }
  return score;
}

export function getOptionById(questionId, optionId) {
  return ALL_OPTIONS[questionId]?.[optionId] ?? null;
}

export function getBehavioralPair(pairId) {
  return BEHAVIORAL_PAIRS.find((p) => p.id === pairId) ?? null;
}

export function displayLabel(index) {
  return String.fromCharCode(65 + index);
}

export function getBehavioralOptionOrderKey(pairId) {
  return `behavioralFreq.${pairId}`;
}
