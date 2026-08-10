"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export type AuthMode = "login" | "register";

type FormErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AuthForm({ mode }: { mode: AuthMode }) {
  const isRegister = mode === "register";
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const nextErrors: FormErrors = {};

    if (!email) nextErrors.email = "Enter your email address.";
    else if (!validateEmail(email)) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Enter your password.";
    if (isRegister && !confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (isRegister && password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords must match.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setStatus(
        isRegister
          ? "Your details are valid. Account creation will be available when authentication is connected."
          : "Your details are valid. Sign-in will be available when authentication is connected.",
      );
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="auth-field-group">
        <label htmlFor={`${mode}-email`}>Email address</label>
        <input
          id={`${mode}-email`}
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? `${mode}-email-error` : undefined}
        />
        {errors.email && <p className="field-error" id={`${mode}-email-error`} role="alert">{errors.email}</p>}
      </div>

      <div className="auth-field-group">
        <label htmlFor={`${mode}-password`}>Password</label>
        <input
          id={`${mode}-password`}
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? `${mode}-password-error` : undefined}
        />
        {errors.password && <p className="field-error" id={`${mode}-password-error`} role="alert">{errors.password}</p>}
      </div>

      {isRegister && (
        <div className="auth-field-group">
          <label htmlFor="register-confirm-password">Confirm Password</label>
          <input
            id="register-confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "register-confirm-password-error" : undefined}
          />
          {errors.confirmPassword && <p className="field-error" id="register-confirm-password-error" role="alert">{errors.confirmPassword}</p>}
        </div>
      )}

      {!isRegister && (
        <div className="auth-options" aria-label="Sign-in options">
          <label className="remember-option">
            <input type="checkbox" name="remember" disabled />
            <span>Remember me</span>
          </label>
          <span className="disabled-auth-link" aria-disabled="true">Forgot password?</span>
        </div>
      )}

      <button className="primary-button auth-submit" type="submit">
        Confirm
      </button>

      {status && <p className="auth-status" role="status">{status}</p>}

      <p className="auth-switch">
        {isRegister ? "Already have an account?" : "Need an account?"}{" "}
        <Link href={isRegister ? "/login" : "/register"}>
          {isRegister ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
