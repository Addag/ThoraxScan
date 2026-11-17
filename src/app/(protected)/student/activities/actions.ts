"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SubmissionActionState } from "@/lib/submissions/types";
import { HEATMAP_LENGTH, normalizeAnswers, normalizeLabels, validateSubmission } from "@/lib/submissions/validation";

/** The painted map from the form: 2744 numbers between 0 and 1, null when nothing was marked, undefined when malformed. */
function readHeatmap(value: FormDataEntryValue | null): number[] | null | undefined {
  if (typeof value !== "string" || !value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length === HEATMAP_LENGTH && parsed.every((cell) => typeof cell === "number" && cell >= 0 && cell <= 1)) {
      return parsed.some((cell) => cell > 0) ? parsed : null;
    }
  } catch {}
  return undefined;
}

export async function saveStudentSubmission(activityId: string, _previous: SubmissionActionState, formData: FormData): Promise<SubmissionActionState> {
  const unauthorized: SubmissionActionState = { status: "unauthorized", message: "You are not permitted to submit to this activity. Sign in with an authorized Student account." };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(activityId)) return { status: "unavailable", message: "This activity is unavailable." };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return unauthorized;
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "student") return unauthorized;
  const intent = formData.get("intent");
  if (intent !== "draft" && intent !== "final") return { status: "error", message: "Choose Save draft or Submit final evaluation." };
  const finalize = intent === "final";
  if (finalize && formData.get("confirmed") !== "yes") return { status: "error", message: "Confirm that your final submission cannot be edited." };
  const heatmap = readHeatmap(formData.get("heatmap"));
  if (heatmap === undefined) return { status: "error", message: "Your heatmap could not be read. Reload and try again.", fieldErrors: { heatmap: "Your heatmap could not be read." } };
  const labels = normalizeLabels(formData.getAll("labels"));
  const answers = normalizeAnswers(Object.fromEntries(labels.map((label) => [label, formData.get(`answer:${label}`)])), labels);
  const { data: heatmapRequired } = await supabase.rpc("activity_requires_student_heatmap", { target_activity_id: activityId });
  const fieldErrors = validateSubmission({ labels, answers, heatmap }, finalize, heatmapRequired === true);
  if (Object.keys(fieldErrors).length) return { status: "error", message: "Check your answer.", fieldErrors };
  const { data, error } = await supabase.rpc("save_student_activity_submission", {
    target_activity_id: activityId, input_labels: labels, input_answers: answers, input_heatmap: heatmap, finalize,
  });
  if (error) return { status: "error", message: "Your response could not be saved. Please try again." };
  if (data === "heatmap_required") return { status: "error", message: "Check your answer.", fieldErrors: { heatmap: "Mark where each selected finding is on the heatmap before submitting." } };
  const messages = {
    draft_saved: "Draft saved. It has not been submitted.", submitted: "Final evaluation submitted. It can no longer be edited.",
    already_submitted: "This evaluation has already been submitted and cannot be edited. Reload to view the saved response.",
    deadline_passed: "The deadline has passed. Your draft is not submitted and can no longer be edited.",
    unavailable: "This activity is unavailable or the response could not be accepted.", unauthorized: unauthorized.message,
  };
  if (typeof data !== "string" || !Object.hasOwn(messages, data)) return { status: "error", message: "Your response could not be saved. Please reload and try again." };
  const status = data as keyof typeof messages;
  revalidatePath(`/student/activities/${activityId}`);
  revalidatePath("/student/activities");
  revalidatePath("/student");
  return { status, message: messages[status] };
}
