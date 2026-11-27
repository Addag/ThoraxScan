// Private Learning Mode notes, one per user and built-in library case. Mirrors learning_case_notes.
export const MAX_LEARNING_NOTE_LENGTH = 2000;

export type LearningNoteActionState = {
  status: "idle" | "error" | "success" | "unauthorized";
  message: string;
  caseId?: string;
  body?: string;
};

export const initialLearningNoteActionState: LearningNoteActionState = {
  status: "idle",
  message: "",
};
