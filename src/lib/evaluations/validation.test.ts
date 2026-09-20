import { describe, expect, it } from "vitest";
import { evaluationActionResult, normalizeEvaluation, validateEvaluation } from "./validation";

describe("faculty evaluation validation", () => {
  it("trims drafts and permits empty remarks", () => {
    const values = normalizeEvaluation({ score: " 98.5 ", remarks: " ", feedback: " Useful feedback " });
    expect(values).toEqual({ score: "98.5", remarks: "", feedback: "Useful feedback" });
    expect(validateEvaluation(values, true)).toEqual({});
  });
  it("requires release score and feedback and rejects invalid score", () => {
    expect(validateEvaluation({ score: "101", remarks: "", feedback: "" }, true)).toMatchObject({ score: expect.any(String), feedback: expect.any(String) });
    expect(validateEvaluation({ score: "", remarks: "", feedback: "" }, false)).toHaveProperty("feedback");
  });
  it("maps stable RPC outcomes", () => {
    expect(evaluationActionResult("released").status).toBe("released");
    expect(evaluationActionResult("already_released").message).toMatch(/cannot be edited/);
  });
});
