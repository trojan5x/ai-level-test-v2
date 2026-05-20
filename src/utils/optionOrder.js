/**
 * Persisted option shuffle utilities for MCQ questions.
 */

export function hashSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export function shuffleArray(arr, seed) {
  const result = [...arr];
  const random = seededRandom(seed ?? Date.now());
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Read persisted order or create a new shuffled order for a question.
 * @returns {{ order: string[], isNew: boolean }}
 */
export function getOrCreateOptionOrder(state, questionKey, optionIds, sessionId) {
  const existing = state?.assessment?.optionOrder?.[questionKey];
  const validExisting =
    Array.isArray(existing) &&
    existing.length === optionIds.length &&
    optionIds.every((id) => existing.includes(id));

  if (validExisting) {
    return { order: existing, isNew: false };
  }

  const seed = hashSeed(`${sessionId}:${questionKey}`);
  const order = shuffleArray(optionIds, seed);
  return { order, isNew: true };
}

export function applyOptionOrderToState(state, questionKey, order) {
  return {
    ...state,
    assessment: {
      ...state.assessment,
      optionOrder: {
        ...(state.assessment?.optionOrder || {}),
        [questionKey]: order,
      },
    },
  };
}
