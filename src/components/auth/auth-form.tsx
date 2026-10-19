"use client";

import {
  Turnstile,
  type TurnstileInstance,
} from "@marsidev/react-turnstile";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  resetPasswordAction,
} from "@/app/(auth)/actions";
import { primaryButtonBase, primaryButtonSkin } from "@/components/primary-button";
import { fieldErrorClass, fieldErrorText } from "@/components/field-error";
import { initialAuthState } from "@/lib/auth/types";
import {
  PRIVACY_POLICY_EFFECTIVE_DATE,
  PRIVACY_POLICY_VERSION,
  TERMS_EFFECTIVE_DATE,
  TERMS_VERSION,
} from "@/lib/legal/privacy";

export type AuthMode = "login" | "register" | "forgot" | "reset";

const actions = {
  login: loginAction,
  register: registerAction,
  forgot: forgotPasswordAction,
  reset: resetPasswordAction,
};

const submitLabels = {
  login: "Log in",
  register: "Create account",
  forgot: "Send reset link",
  reset: "Update password",
};

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const inputClass = "h-[53px] w-full rounded-[9px] border border-[rgb(153_191_240/38%)] bg-[rgb(7_18_39/56%)] px-3.5 text-foreground aria-invalid:border-[#ff6b6b]";
const fieldClass = "mt-4 flex flex-col [&>label]:mb-[6px] [&>label]:text-[16px] [&>label]:font-extrabold [&>label]:leading-5";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [state, formAction, pending] = useActionState(
    actions[mode],
    initialAuthState,
  );
  const showEmail = mode !== "reset";
  const showPasswordField = mode !== "forgot";
  const showConfirmation = mode === "register" || mode === "reset";
  const requiresCaptcha = mode !== "reset";
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    if (!requiresCaptcha || state.status === "idle") return;

    const resetTimer = window.setTimeout(() => {
      setCaptchaToken("");
      turnstileRef.current?.reset();
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [requiresCaptcha, state]);

  const captchaMessage = !turnstileSiteKey
    ? "Security verification is unavailable. Contact an administrator."
    : captchaError || (!captchaToken ? state.fieldErrors?.captchaToken : undefined);
  const captchaReady = !requiresCaptcha || Boolean(captchaToken);

  return (
    <form className="flex flex-col" action={formAction} noValidate>
      {mode === "login" && (
        <RoleSelector mode="login" error={state.fieldErrors?.expectedRole} />
      )}

      {mode === "register" && (
        <RoleSelector
          mode="register"
          error={state.fieldErrors?.expectedRole}
        />
      )}

      {mode === "register" && (
        <div className={fieldClass}>
          <label htmlFor="register-display-name">Display name</label>
          <input
            className={inputClass}
            id="register-display-name"
            name="displayName"
            type="text"
            autoComplete="name"
            maxLength={100}
            aria-invalid={Boolean(state.fieldErrors?.displayName)}
            aria-describedby={
              state.fieldErrors?.displayName
                ? "register-display-name-error"
                : undefined
            }
          />
          {state.fieldErrors?.displayName && (
            <p
              className={fieldErrorClass}
              id="register-display-name-error"
              role="alert"
            >
              {state.fieldErrors.displayName}
            </p>
          )}
        </div>
      )}

      {showEmail && (
        <div className={fieldClass}>
          <label htmlFor={`${mode}-email`}>Email address</label>
          <input
            className={inputClass}
            id={`${mode}-email`}
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={
              state.fieldErrors?.email ? `${mode}-email-error` : undefined
            }
          />
          {state.fieldErrors?.email && (
            <p
              className={fieldErrorClass}
              id={`${mode}-email-error`}
              role="alert"
            >
              {state.fieldErrors.email}
            </p>
          )}
        </div>
      )}

      {showPasswordField && (
        <div className={fieldClass}>
          <label htmlFor={`${mode}-password`}>
            {mode === "reset" ? "New password" : "Password"}
          </label>
          <div className="relative">
            <input
              className={`${inputClass} ${mode === "login" ? "pr-[54px]" : ""}`}
              id={`${mode}-password`}
              name="password"
              type={mode === "login" && passwordVisible ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "login" ? undefined : 8}
              aria-invalid={Boolean(state.fieldErrors?.password)}
              aria-describedby={
                state.fieldErrors?.password ? `${mode}-password-error` : undefined
              }
            />
            {mode === "login" && (
              <button
              className="absolute top-1/2 right-2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-[7px] border-0 bg-transparent text-(--text-secondary) hover:bg-[rgb(153_191_240/12%)] hover:text-(--text-primary)"
                type="button"
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                aria-pressed={passwordVisible}
                onClick={() => setPasswordVisible((visible) => !visible)}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {passwordVisible ? (
                    <>
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.7 4 10 8a12.8 12.8 0 0 1-3.1 5.1" />
                      <path d="M6.6 6.6C4.3 8.1 2.8 10.4 2 12c1.3 4 5 8 10 8a10.8 10.8 0 0 0 2.1-.2" />
                    </>
                  ) : (
                    <>
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            )}
          </div>
          {state.fieldErrors?.password && (
            <p
              className={fieldErrorClass}
              id={`${mode}-password-error`}
              role="alert"
            >
              {state.fieldErrors.password}
            </p>
          )}
        </div>
      )}

      {showConfirmation && (
        <div className={fieldClass}>
          <label htmlFor={`${mode}-confirm-password`}>Confirm password</label>
          <input
            className={inputClass}
            id={`${mode}-confirm-password`}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
            aria-describedby={
              state.fieldErrors?.confirmPassword
                ? `${mode}-confirm-password-error`
                : undefined
            }
          />
          {state.fieldErrors?.confirmPassword && (
            <p
              className={fieldErrorClass}
              id={`${mode}-confirm-password-error`}
              role="alert"
            >
              {state.fieldErrors.confirmPassword}
            </p>
          )}
        </div>
      )}

      {mode === "register" && (
        <>
          <div className={fieldClass}>
            <label htmlFor="register-age-band">Age group</label>
            <select
              className={inputClass}
              id="register-age-band"
              name="ageBand"
              defaultValue=""
              required
              aria-invalid={Boolean(state.fieldErrors?.ageBand)}
              aria-describedby={state.fieldErrors?.ageBand ? "register-age-band-help register-age-band-error" : "register-age-band-help"}
            >
              <option value="" disabled>Select an age group</option>
              <option value="adult">18 or older</option>
              <option value="minor">Under 18</option>
            </select>
            <small id="register-age-band-help">Under-18 research participation requires an approved guardian process.</small>
            {state.fieldErrors?.ageBand && <p className={fieldErrorClass} id="register-age-band-error" role="alert">{state.fieldErrors.ageBand}</p>}
          </div>

          <fieldset className="mt-5 grid gap-3 border-0 p-0 text-[13px] leading-[1.5] text-[#d6e1f0]">
            <legend className="sr-only">Terms, privacy and research choices</legend>
            <label className="flex items-start gap-2">
              <input className="mt-1 size-4 flex-none accent-[#4da5ff]" name="termsAccepted" type="checkbox" value="yes" required aria-invalid={Boolean(state.fieldErrors?.termsAccepted)} aria-describedby={state.fieldErrors?.termsAccepted ? "register-terms-error" : undefined} />
              <span>I agree to the <Link className="font-semibold text-[#9fd1ff] underline underline-offset-2" href="/terms">Terms and Conditions</Link> (version {TERMS_VERSION}, effective {TERMS_EFFECTIVE_DATE}).</span>
            </label>
            {state.fieldErrors?.termsAccepted && <p className={`${fieldErrorText} mt-[-6px] ml-6`} id="register-terms-error" role="alert">{state.fieldErrors.termsAccepted}</p>}
            <label className="flex items-start gap-2">
              <input className="mt-1 size-4 flex-none accent-[#4da5ff]" name="privacyNoticeAccepted" type="checkbox" value="yes" required aria-invalid={Boolean(state.fieldErrors?.privacyNoticeAccepted)} aria-describedby={state.fieldErrors?.privacyNoticeAccepted ? "register-privacy-error" : undefined} />
              <span>I have read the <Link className="font-semibold text-[#9fd1ff] underline underline-offset-2" href="/privacy-policy">Privacy Policy</Link> (version {PRIVACY_POLICY_VERSION}, effective {PRIVACY_POLICY_EFFECTIVE_DATE}).</span>
            </label>
            {state.fieldErrors?.privacyNoticeAccepted && <p className={`${fieldErrorText} mt-[-6px] ml-6`} id="register-privacy-error" role="alert">{state.fieldErrors.privacyNoticeAccepted}</p>}
            <label className="flex items-start gap-2">
              <input className="mt-1 size-4 flex-none accent-[#4da5ff]" name="researchConsent" type="checkbox" value="yes" aria-invalid={Boolean(state.fieldErrors?.researchConsent)} aria-describedby={state.fieldErrors?.researchConsent ? "register-research-error" : undefined} />
              <span>I voluntarily agree to participate in the ThoraxScan capstone research. This is separate from educational platform access. Under-18 participants need the approved guardian process.</span>
            </label>
            {state.fieldErrors?.researchConsent && <p className={`${fieldErrorText} mt-[-6px] ml-6`} id="register-research-error" role="alert">{state.fieldErrors.researchConsent}</p>}
          </fieldset>
        </>
      )}

      {mode === "login" && (
        <div className="mt-3 flex items-center justify-end text-[13px] leading-[1.5] text-[#d6e1f0] [&_a]:text-(--text-secondary) [&_a]:no-underline [&_a:hover]:text-(--brand-blue-text)">
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
      )}

      {requiresCaptcha && (
        <div
          className="mt-[22px] flex min-h-[65px] w-[300px] flex-col self-center"
          aria-describedby={captchaMessage ? `${mode}-captcha-error` : undefined}
        >
          <input name="captchaToken" type="hidden" value={captchaToken} />
          {turnstileSiteKey && (
            <Turnstile
              ref={turnstileRef}
              siteKey={turnstileSiteKey}
              onSuccess={(token) => {
                setCaptchaToken(token);
                setCaptchaError("");
              }}
              onExpire={() => {
                setCaptchaToken("");
                setCaptchaError(
                  "Security verification expired. Complete it again.",
                );
              }}
              onError={() => {
                setCaptchaToken("");
                setCaptchaError(
                  "Security verification failed to load. Refresh and try again.",
                );
              }}
              onTimeout={() => {
                setCaptchaToken("");
                setCaptchaError(
                  "Security verification timed out. Complete it again.",
                );
              }}
              onUnsupported={() => {
                setCaptchaToken("");
                setCaptchaError(
                  "This browser cannot run security verification. Try a current browser.",
                );
              }}
              options={{
                appearance: "always",
                refreshExpired: "auto",
                responseField: false,
                size: "normal",
                theme: "dark",
              }}
            />
          )}
          {captchaMessage && (
            <p
              className={`${fieldErrorText} mt-1.5 mb-0 text-center`}
              id={`${mode}-captcha-error`}
              role="alert"
            >
              {captchaMessage}
            </p>
          )}
        </div>
      )}

      <button
        className={`${primaryButtonBase} ${primaryButtonSkin} mt-[22px] h-[71px] w-full rounded-full text-[27px] leading-[34px] disabled:opacity-[0.72] ${pending ? "cursor-wait" : "disabled:cursor-not-allowed"}`}
        type="submit"
        disabled={pending || !captchaReady}
        aria-busy={pending}
      >
        {pending ? "Please wait…" : submitLabels[mode]}
      </button>

      {state.message && (
        <p
          className={`mt-4 border px-3 py-2.5 text-[13px] leading-[1.4] ${state.status === "error" ? "border-[#8b2929] bg-[rgba(160,32,32,0.2)] text-[#ffb4b4]" : "border-[#17643a] bg-[rgba(33,135,78,0.2)] text-[#b8f3ce]"}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      )}

      <AuthSwitch mode={mode} />
    </form>
  );
}

function RoleSelector({
  mode,
  error,
}: {
  mode: "login" | "register";
  error?: string;
}) {
  const descriptionId = `${mode}-role-description`;
  const errorId = `${mode}-role-error`;
  const fieldName = mode === "login" ? "expectedRole" : "requestedRole";

  return (
    <fieldset
      className={mode === "login" ? "m-0 mb-[22px] w-full border-0 p-0" : "m-0 mb-[22px] w-[min(507px,calc(100%+38px))] self-center border-0 p-0"}
      aria-describedby={error ? `${descriptionId} ${errorId}` : descriptionId}
    >
      <legend className="sr-only">Account type</legend>
      <div className={mode === "login" ? "grid grid-cols-3 gap-3" : "grid grid-cols-2 gap-[26px] max-[420px]:grid-cols-1 max-[420px]:gap-3"}>
        <div className="relative min-w-0">
          <input
            className="peer absolute m-[-1px] size-px overflow-hidden"
            id={`${mode}-role-student`}
            name={fieldName}
            type="radio"
            value="student"
            defaultChecked
          />
          <label className={`relative flex ${mode === "login" ? "h-32" : "h-[147px]"} cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[10px] border border-[rgb(153_191_240/32%)] bg-(--glass-inset) text-center text-(--text-primary) shadow-(--glass-inset-shadow) transition-[background-color,border-color,transform] duration-[160ms] hover:bg-[rgba(0,119,255,0.28)] peer-checked:border-[#0077ff] peer-checked:bg-[rgba(0,119,255,0.6)] peer-focus-visible:outline-3 peer-focus-visible:outline-white peer-active:[transform:translateY(1px)]`} htmlFor={`${mode}-role-student`}>
            <Image
              className={`absolute top-[7px] left-1/2 block h-[88px] w-[125px] [transform:translateX(-50%)_scaleX(-1)] ${mode === "login" ? "scale-[0.84] origin-top" : ""}`}
              src="/images/student-role.png"
              alt=""
              width={125}
              height={88}
              aria-hidden="true"
            />
            <span className={`absolute right-3 left-3 font-extrabold leading-[1.2] ${mode === "login" ? "bottom-6 text-[17px]" : "bottom-[27px] text-[20px]"}`}>Student</span>
            <span className={`absolute right-3 left-3 mx-auto max-w-[170px] leading-[1.3] text-[#d0d4e6] ${mode === "login" ? "bottom-[7px] text-[10px]" : "bottom-[9px] text-[12px]"}`}>Learning workspace</span>
          </label>
        </div>

        <div className="relative min-w-0">
          <input
            className="peer absolute m-[-1px] size-px overflow-hidden"
            id={`${mode}-role-professor`}
            name={fieldName}
            type="radio"
            value="professor"
          />
          <label className={`relative flex ${mode === "login" ? "h-32" : "h-[147px]"} cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[10px] border border-[rgb(153_191_240/32%)] bg-(--glass-inset) text-center text-(--text-primary) shadow-(--glass-inset-shadow) transition-[background-color,border-color,transform] duration-[160ms] hover:bg-[rgba(0,119,255,0.28)] peer-checked:border-[#0077ff] peer-checked:bg-[rgba(0,119,255,0.6)] peer-focus-visible:outline-3 peer-focus-visible:outline-white peer-focus-visible:outline-offset-4 peer-active:[transform:translateY(1px)]`} htmlFor={`${mode}-role-professor`}>
            <Image
              className="absolute top-[7px] left-1/2 block h-[83px] w-[86px] [transform:translateX(-50%)]"
              src="/images/professor-role.png"
              alt=""
              width={86}
              height={83}
              aria-hidden="true"
            />
            <span className={`absolute right-3 left-3 font-extrabold leading-[1.2] ${mode === "login" ? "bottom-6 text-[17px]" : "bottom-[27px] text-[20px]"}`}>Professor</span>
            <span className={`absolute right-3 left-3 mx-auto max-w-[170px] leading-[1.3] text-[#d0d4e6] ${mode === "login" ? "bottom-[7px] text-[10px]" : "bottom-[9px] text-[12px]"}`}>
              {mode === "register" ? "Approval required" : "Teaching workspace"}
            </span>
          </label>
        </div>

        {mode === "login" && (
          <div className="relative min-w-0">
            <input
              className="peer absolute m-[-1px] size-px overflow-hidden"
              id="login-role-administrator"
              name="expectedRole"
              type="radio"
              value="administrator"
            />
            <label className="relative flex h-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[10px] border border-[rgb(153_191_240/32%)] bg-(--glass-inset) text-center text-(--text-primary) shadow-(--glass-inset-shadow) transition-[background-color,border-color,transform] duration-[160ms] hover:bg-[rgba(0,119,255,0.28)] peer-checked:border-[#0077ff] peer-checked:bg-[rgba(0,119,255,0.6)] peer-focus-visible:outline-3 peer-focus-visible:outline-white peer-focus-visible:outline-offset-4 peer-active:[transform:translateY(1px)]" htmlFor="login-role-administrator">
              <span className="absolute top-[13px] grid size-[66px] place-items-center rounded-[18px] border-2 border-[#8bc9ff] text-[42px] leading-none text-[#d5edff]" aria-hidden="true">◇</span>
              <span className="absolute right-3 bottom-6 left-3 text-[17px] font-extrabold leading-[1.2]">Administrator</span>
              <span className="absolute right-3 bottom-[7px] left-3 mx-auto max-w-[170px] text-[10px] leading-[1.3] text-[#d0d4e6]">Professor approvals</span>
            </label>
          </div>
        )}
      </div>

      <p className="mx-1 mt-3 mb-0 text-center text-[13px] leading-[1.5] text-[#d6e1f0]" id={descriptionId}>
        {mode === "register"
          ? "Professor accounts remain pending until an administrator approves the application."
          : "Choose the portal assigned to your ThoraxScan account."}
      </p>
      {error && (
        <p className={`${fieldErrorText} mx-1 mt-2 mb-0 text-center`} id={errorId} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function AuthSwitch({ mode }: { mode: AuthMode }) {
  if (mode === "register") {
    return (
      <p className="mt-7 mb-0 text-center text-[13px] leading-[1.5] text-[#d6e1f0] [&_a]:font-extrabold [&_a]:text-(--brand-blue-text) [&_a]:transition-colors [&_a]:duration-160 [&_a:hover]:text-white">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    );
  }

  if (mode === "login") {
    return (
      <p className="mt-7 mb-0 text-center text-[13px] leading-[1.5] text-[#d6e1f0] [&_a]:font-extrabold [&_a]:text-(--brand-blue-text) [&_a]:transition-colors [&_a]:duration-160 [&_a:hover]:text-white">
        Need an account? <Link href="/register">Create an account</Link>
      </p>
    );
  }

  return (
    <p className="mt-7 mb-0 text-center text-[13px] leading-[1.5] text-[#d6e1f0] [&_a]:font-extrabold [&_a]:text-(--brand-blue-text) [&_a]:transition-colors [&_a]:duration-160 [&_a:hover]:text-white">
      <Link href="/login">Back to login</Link>
    </p>
  );
}

