/**
 * Hook for shuffled MCQ options with persisted order in assessment state.
 */

import { useEffect, useMemo, useState } from 'react';
import { getOrCreateOptionOrder, applyOptionOrderToState } from '../utils/optionOrder.js';
import { displayLabel } from '../utils/questionOptions.js';
import { saveAssessmentState, getSessionId } from '../utils/stateManager.js';

export default function useQuestionOptions({
  assessmentContext,
  questionKey,
  optionDefs,
  previousChoice = null,
}) {
  const state = assessmentContext?.state;
  const optionIds = useMemo(() => optionDefs.map((o) => o.id), [optionDefs]);

  const { order, isNew } = useMemo(
    () => getOrCreateOptionOrder(state, questionKey, optionIds, getSessionId()),
    [state, questionKey, optionIds]
  );

  useEffect(() => {
    if (!isNew || !assessmentContext?.setState) return;
    const updated = applyOptionOrderToState(state, questionKey, order);
    assessmentContext.setState(updated);
    saveAssessmentState(updated);
  }, [isNew, questionKey, order, state, assessmentContext]);

  const orderedOptions = useMemo(
    () => order.map((id) => optionDefs.find((o) => o.id === id)).filter(Boolean),
    [order, optionDefs]
  );

  const [selectedId, setSelectedId] = useState(previousChoice || null);

  useEffect(() => {
    if (previousChoice) setSelectedId(previousChoice);
  }, [previousChoice]);

  return {
    orderedOptions,
    selectedId,
    setSelectedId,
    displayLabel,
    optionOrder: order,
  };
}
