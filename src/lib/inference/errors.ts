export type InferenceErrorCode =
  | "NO_ACTIVE_MODEL"
  | "UNSUPPORTED_MANIFEST"
  | "ARTIFACT_INTEGRITY_FAILED"
  | "PREPROCESSING_FAILED"
  | "MODEL_LOAD_FAILED"
  | "INVALID_OUTPUT";

export class InferenceError extends Error {
  readonly code: InferenceErrorCode;
  readonly cause?: unknown;

  constructor(code: InferenceErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "InferenceError";
    this.code = code;
    this.cause = cause;
  }
}

export function asInferenceError(
  error: unknown,
  code: InferenceErrorCode,
  message: string,
) {
  return error instanceof InferenceError
    ? error
    : new InferenceError(code, message, error);
}
