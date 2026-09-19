"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SubmissionActionState } from "@/lib/submissions/types";
import { normalizeSubmission, validateSubmission } from "@/lib/submissions/validation";

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
  const read = (name: string) => { const value = formData.get(name); return typeof value === "string" ? value : ""; };
  const values = normalizeSubmission({ visibleFindings: read("visibleFindings"), classification: read("classification"), relevantRegion: read("relevantRegion") });
  const fieldErrors = validateSubmission(values, finalize);
  if (Object.keys(fieldErrors).length) return { status: "error", message: "Check your response fields.", fieldErrors };
  const { data, error } = await supabase.rpc("save_student_activity_submission", {
    target_activity_id: activityId, input_visible_findings: values.visibleFindings,
    input_classification: values.classification, input_relevant_region: values.relevantRegion, finalize,
  });
  if (error) return { status: "error", message: "Your response could not be saved. Please try again." };
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
