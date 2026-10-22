import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

const otpTypes = new Set<EmailOtpType>([
  "email",
  "signup",
  "recovery",
  "invite",
  "email_change",
]);

function safeDestination(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const code = searchParams.get("code");
  const next = safeDestination(searchParams.get("next"));
  const supabase = await createClient();
  let error: Error | null = null;

  if (tokenHash && rawType && otpTypes.has(rawType as EmailOtpType)) {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: rawType as EmailOtpType,
    });
    error = result.error;
  } else if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  } else {
    error = new Error("Missing confirmation credentials.");
  }

  if (!error) {
    const { data: confirmedUser } = await supabase.auth.getUser();
    const metadata = confirmedUser.user?.user_metadata as Record<string, unknown> | undefined;
    const policyVersion = metadata?.privacy_policy_version;
    if (typeof policyVersion === "string") {
      await supabase.rpc("record_registration_consents", {
        input_policy_version: policyVersion,
      });
    }
    return NextResponse.redirect(new URL(next, origin));
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set(
    "error",
    "That confirmation link is invalid or expired. Request a new one.",
  );
  return NextResponse.redirect(loginUrl);
}
