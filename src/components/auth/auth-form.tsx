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
import { initialAuthState } from "@/lib/auth/types";

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
    <form className="auth-form" action={formAction} noValidate>
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
        <div className="auth-field-group">
          <label htmlFor="register-display-name">Display name</label>
          <input
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
              className="field-error"
              id="register-display-name-error"
              role="alert"
            >
              {state.fieldErrors.displayName}
            </p>
          )}
        </div>
      )}

      {showEmail && (
        <div className="auth-field-group">
          <label htmlFor={`${mode}-email`}>Email address</label>
          <input
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
              className="field-error"
              id={`${mode}-email-error`}
              role="alert"
            >
              {state.fieldErrors.email}
            </p>
          )}
        </div>
      )}

      {showPasswordField && (
        <div className="auth-field-group">
          <label htmlFor={`${mode}-password`}>
            {mode === "reset" ? "New password" : "Password"}
          </label>
          <div className="auth-password-control">
            <input
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
                className="auth-password-toggle"
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
              className="field-error"
              id={`${mode}-password-error`}
              role="alert"
            >
              {state.fieldErrors.password}
            </p>
          )}
        </div>
      )}

      {showConfirmation && (
        <div className="auth-field-group">
          <label htmlFor={`${mode}-confirm-password`}>Confirm password</label>
          <input
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
              className="field-error"
              id={`${mode}-confirm-password-error`}
              role="alert"
            >
              {state.fieldErrors.confirmPassword}
            </p>
          )}
        </div>
      )}

      {mode === "login" && (
        <div className="auth-options">
          <Link href="/forgot-password">Forgot password?</Link>
        </div>
      )}

      {requiresCaptcha && (
        <div
          className="auth-captcha"
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
              className="field-error auth-captcha__error"
              id={`${mode}-captcha-error`}
              role="alert"
            >
              {captchaMessage}
            </p>
          )}
        </div>
      )}

      <button
        className="primary-button auth-submit"
        type="submit"
        disabled={pending || !captchaReady}
        aria-busy={pending}
      >
        {pending ? "Please wait…" : submitLabels[mode]}
      </button>

      {state.message && (
        <p
          className={`auth-status auth-status--${state.status}`}
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
      className={`role-selector role-selector--${mode}`}
      aria-describedby={error ? `${descriptionId} ${errorId}` : descriptionId}
    >
      <legend className="sr-only">Account type</legend>
      <div className="role-selector__cards">
        <div className="role-option">
          <input
            className="role-option__input"
            id={`${mode}-role-student`}
            name={fieldName}
            type="radio"
            value="student"
            defaultChecked
          />
          <label className="role-option__card" htmlFor={`${mode}-role-student`}>
            <Image
              className="role-option__image role-option__image--student"
              src="/images/student-role.png"
              alt=""
              width={125}
              height={88}
              aria-hidden="true"
            />
            <span className="role-option__title">Student</span>
            <span className="role-option__copy">Learning workspace</span>
          </label>
        </div>

        <div className="role-option">
          <input
            className="role-option__input"
            id={`${mode}-role-professor`}
            name={fieldName}
            type="radio"
            value="professor"
          />
          <label className="role-option__card" htmlFor={`${mode}-role-professor`}>
            <Image
              className="role-option__image role-option__image--professor"
              src="/images/professor-role.png"
              alt=""
              width={86}
              height={83}
              aria-hidden="true"
            />
            <span className="role-option__title">Professor</span>
            <span className="role-option__copy">
              {mode === "register" ? "Approval required" : "Teaching workspace"}
            </span>
          </label>
        </div>

        {mode === "login" && (
          <div className="role-option">
            <input
              className="role-option__input"
              id="login-role-administrator"
              name="expectedRole"
              type="radio"
              value="administrator"
            />
            <label className="role-option__card" htmlFor="login-role-administrator">
              <span className="role-option__admin-icon" aria-hidden="true">◇</span>
              <span className="role-option__title">Administrator</span>
              <span className="role-option__copy">Professor approvals</span>
            </label>
          </div>
        )}
      </div>

      <p className="role-selector__description" id={descriptionId}>
        {mode === "register"
          ? "Professor accounts remain pending until an administrator approves the application."
          : "Choose the portal assigned to your ThoraxScan account."}
      </p>
      {error && (
        <p className="field-error role-selector__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function AuthSwitch({ mode }: { mode: AuthMode }) {
  if (mode === "register") {
    return (
      <p className="auth-switch">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    );
  }

  if (mode === "login") {
    return (
      <p className="auth-switch">
        Need an account? <Link href="/register">Create an account</Link>
      </p>
    );
  }

  return (
    <p className="auth-switch">
      <Link href="/login">Back to login</Link>
    </p>
  );
}
