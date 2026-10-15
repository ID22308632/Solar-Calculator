"use client";

import { useEffect, useReducer } from "react";
import {
  createAssessmentDraft,
  loadAssessmentDraft,
  saveAssessmentDraft,
  clearAssessmentDraft,
  type AssessmentDraft,
} from "@/lib/assessment-draft";

type State = {
  draft: AssessmentDraft;
  hydrated: boolean;
  restored: boolean;
  storageError: boolean;
};
type Action =
  | { type: "restore"; draft: AssessmentDraft | null }
  | { type: "update"; patch: Partial<AssessmentDraft> }
  | { type: "restart" }
  | { type: "storage"; failed: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "restore":
      return { ...state, draft: action.draft ?? createAssessmentDraft(), hydrated: true, restored: !!action.draft };
    case "update":
      return { ...state, draft: { ...state.draft, ...action.patch }, restored: false };
    case "restart":
      return { ...state, draft: createAssessmentDraft(), restored: false };
    case "storage":
      return state.storageError === action.failed ? state : { ...state, storageError: action.failed };
  }
}

export function useAssessment() {
  const [state, dispatch] = useReducer(reducer, {
    draft: createAssessmentDraft(), hydrated: false, restored: false, storageError: false,
  });

  useEffect(() => {
    try {
      dispatch({ type: "restore", draft: loadAssessmentDraft(window.sessionStorage) });
    } catch {
      dispatch({ type: "restore", draft: null });
      dispatch({ type: "storage", failed: true });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    try {
      const blank = JSON.stringify(state.draft) === JSON.stringify(createAssessmentDraft());
      const saved = blank
        ? clearAssessmentDraft(window.sessionStorage)
        : saveAssessmentDraft(window.sessionStorage, state.draft);
      dispatch({ type: "storage", failed: !saved });
    } catch {
      dispatch({ type: "storage", failed: true });
    }
  }, [state.draft, state.hydrated]);

  return {
    ...state,
    update: (patch: Partial<AssessmentDraft>) => dispatch({ type: "update", patch }),
    restart: () => dispatch({ type: "restart" }),
  };
}
