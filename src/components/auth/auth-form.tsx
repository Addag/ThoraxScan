"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";

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

export function AuthForm({ mode }: { mode: AuthMode }) {
  const [state, formAction, pending] = useActionState(
    actions[mode],
    initialAuthState,
  );
  const showEmail = mode !== "reset";
  const showPassword = mode !== "forgot";
  const showConfirmation = mode === "register" || mode === "reset";

  return (
    <form className="auth-form" action={formAction} noValidate>
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

      {showPassword && (
        <div className="auth-field-group">
          <label htmlFor={`${mode}-password`}>
            {mode === "reset" ? "New password" : "Password"}
          </label>
          <input
            id={`${mode}-password`}
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={mode === "login" ? undefined : 8}
            aria-invalid={Boolean(state.fieldErrors?.password)}
            aria-describedby={
              state.fieldErrors?.password ? `${mode}-password-error` : undefined
            }
          />
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

      <button
        className="primary-button auth-submit"
        type="submit"
        disabled={pending}
      >
        {pending ? "Please wait…" : submitLabels[mode]}
      </button>

      {(mode === "login" || mode === "register") && (
        <RoleSelector
          mode={mode}
          error={state.fieldErrors?.expectedRole}
        />
      )}

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
  const professorDisabled = mode === "register";
  const descriptionId = `${mode}-role-description`;
  const errorId = `${mode}-role-error`;

  return (
    <fieldset
      className="role-selector"
      aria-describedby={error ? `${descriptionId} ${errorId}` : descriptionId}
    >
      <legend className="sr-only">Account type</legend>
      <div className="role-selector__cards">
        <div className="role-option">
          <input
            className="role-option__input"
            id={`${mode}-role-student`}
            name={mode === "login" ? "expectedRole" : undefined}
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
            name={mode === "login" ? "expectedRole" : undefined}
            type="radio"
            value="professor"
            disabled={professorDisabled}
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
              {professorDisabled ? "Approval required" : "Teaching workspace"}
            </span>
          </label>
        </div>
      </div>

      <p className="role-selector__description" id={descriptionId}>
        {professorDisabled
          ? "Public registration creates Student accounts. Professor access is assigned by an administrator."
          : "Choose the account type assigned to your ThoraxScan profile."}
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
