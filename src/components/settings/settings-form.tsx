"use client";

import {
  type KeyboardEvent,
  useActionState,
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  changePasswordAction,
  updateAccountSettingsAction,
} from "@/app/(protected)/settings/actions";
import type { AppRole } from "@/lib/auth/types";
import {
  type AccountSettings,
  type PasswordActionState,
  type SettingsActionState,
  initialSettingsActionState,
} from "@/lib/settings/types";
import Link from "next/link";

const tabOrder = ["profile", "security", "privacy", "accessibility"] as const;
type SettingsTab = (typeof tabOrder)[number];

const panelClass = "border border-(--border-strong) rounded-[10px] [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow)";
const panelHeadingClass = "mb-[26px] [&_h2]:m-0 [&_h2]:text-[1.25rem] [&_h2]:capitalize [&_p]:m-0 [&_p]:mt-[3px] [&_p]:text-[0.8125rem] [&_p]:text-(--text-muted)";
const fieldClass = "grid gap-[7px] text-[0.8125rem] text-(--text-primary) [&>span>small]:ml-[5px] [&>span>small]:text-(--text-disabled) [&>small:not([data-error])]:text-[0.625rem] [&>small:not([data-error])]:leading-[1.4] [&>small:not([data-error])]:text-(--text-secondary)";
const inputClass = "min-h-[38px] w-full rounded-[7px] border border-(--border-field) bg-(--surface-input) px-[11px] py-[7px] text-(--text-primary) [&[readonly]]:bg-(--surface-input-readonly) [&[readonly]]:text-(--text-muted)";
const fieldErrorClass = "text-[0.6875rem] text-(--status-error-text)";
const iconClass = "size-6 fill-none stroke-current stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]";
const messageBaseClass = "-mt-[9px] rounded-[6px] px-3 py-2.5 text-[0.75rem]";
const submitButtonClass = "transition-[filter] duration-160 not-disabled:hover:brightness-115 min-h-[42px] min-w-[135px] cursor-pointer rounded-[5px] border-0 bg-[linear-gradient(270deg,#4363ff_0%,#8397fe_100%)] px-[18px] text-[0.8125rem] font-extrabold text-[#050612] disabled:cursor-not-allowed disabled:opacity-50 max-[600px]:w-full";

function statusMessageClass(status: SettingsActionState["status"]) {
  if (status === "error" || status === "unauthorized") return `${messageBaseClass} bg-[rgba(255,55,69,0.12)] text-(--status-error-text)`;
  if (status === "success") return `${messageBaseClass} bg-[rgba(0,224,93,0.12)] text-(--status-success-text)`;
  return `${messageBaseClass} bg-[rgba(0,119,255,0.14)] text-(--status-info-text)`;
}

function SettingsIcon({ tab }: { tab: SettingsTab }) {
  if (tab === "profile") {
    return (
      <svg className={iconClass} aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="7" r="3.5" />
        <path d="M5.5 20v-2.5a6.5 6.5 0 0 1 13 0V20Z" />
      </svg>
    );
  }
  if (tab === "security") {
    return (
      <svg className={iconClass} aria-hidden="true" viewBox="0 0 24 24">
        <rect x="5" y="10.5" width="14" height="10" rx="2" />
        <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
      </svg>
    );
  }
  if (tab === "accessibility") {
    return (
      <svg className={iconClass} aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9.5" />
        <circle cx="12" cy="7.5" r="1.25" />
        <path d="m7.5 10.5 4.5 1 4.5-1M12 11.5V15l-2.5 3.5M12 15l2.5 3.5" />
      </svg>
    );
  }
  return (
    <svg className={iconClass} aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 2.5 19 5v5.5c0 4.9-2.9 8.7-7 11-4.1-2.3-7-6.1-7-11V5Z" />
    </svg>
  );
}

export function SettingsForm({
  email,
  initialDisplayName,
  initialSettings,
  loadError,
  role,
}: {
  email: string;
  initialDisplayName: string;
  initialSettings: AccountSettings;
  loadError: string | null;
  role: AppRole;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [workPhone, setWorkPhone] = useState(initialSettings.workPhone ?? "");
  const [savedValues, setSavedValues] = useState({
    displayName: initialDisplayName,
    workPhone: initialSettings.workPhone ?? "",
  });
  const submitAction = useCallback(
    async (previousState: SettingsActionState, formData: FormData) => {
      const nextState = await updateAccountSettingsAction(previousState, formData);
      if (nextState.status === "success" && nextState.savedValues) {
        const nextValues = {
          displayName: nextState.savedValues.displayName,
          workPhone: nextState.savedValues.workPhone ?? "",
        };
        setDisplayName(nextValues.displayName);
        setWorkPhone(nextValues.workPhone);
        setSavedValues(nextValues);
      }
      return nextState;
    },
    [],
  );
  const [state, formAction, pending] = useActionState(
    submitAction,
    initialSettingsActionState,
  );
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const isDirty =
    displayName !== savedValues.displayName ||
    workPhone !== savedValues.workPhone;

  function selectTab(tab: SettingsTab, index: number) {
    setActiveTab(tab);
    tabRefs.current[index]?.focus();
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabOrder.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabOrder.length) % tabOrder.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabOrder.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    selectTab(tabOrder[nextIndex], nextIndex);
  }

  return (
    <div className="grid gap-6">
      <section className={`${panelClass} overflow-hidden`} aria-label="User profile categories">
        <div className="grid gap-5 p-[18px_17px_22px] max-[600px]:gap-[9px] max-[600px]:p-[13px]" role="tablist" aria-label="Account settings">
          {tabOrder.map((tab, index) => (
            <button
              aria-controls={`settings-panel-${tab}`}
              aria-selected={activeTab === tab}
              className={`transition-colors duration-160 grid min-h-[67px] w-full cursor-pointer grid-cols-[36px_minmax(0,1fr)] items-center rounded-[10px] border px-[22px] text-left text-[1.25rem] font-semibold text-(--text-primary) max-[600px]:min-h-[58px] max-[600px]:px-[14px] max-[600px]:text-[1.0625rem] ${activeTab === tab ? "border-[#21aaff] bg-[rgba(70,193,255,0.49)]" : "border-transparent bg-transparent hover:bg-(--hover-overlay)"}`}
              id={`settings-tab-${tab}`}
              key={tab}
              onClick={() => setActiveTab(tab)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              role="tab"
              tabIndex={activeTab === tab ? 0 : -1}
              type="button"
            >
              <SettingsIcon tab={tab} />
              <span>{tab[0].toUpperCase() + tab.slice(1)}</span>
            </button>
          ))}
        </div>
      </section>

      <PasswordPanel hidden={activeTab !== "security"} />

      <AccessibilityPanel hidden={activeTab !== "accessibility"} />

      <form action={formAction} className="grid gap-6" hidden={activeTab === "security" || activeTab === "accessibility"} noValidate>
        <section
          aria-labelledby="settings-tab-profile"
          className={`${panelClass} min-h-[247px] p-[25px] max-[600px]:p-5`}
          hidden={activeTab !== "profile"}
          id="settings-panel-profile"
          role="tabpanel"
          tabIndex={0}
        >
          <div className={panelHeadingClass}>
            <h2>Profile information</h2>
            <p>Update the account details shown throughout your ThoraxScan workspace.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-[84px] gap-y-[26px] max-[600px]:grid-cols-1 max-[600px]:gap-y-5">
            <label className={fieldClass}>
              <span>Full name</span>
              <input
                className={inputClass}
                aria-invalid={Boolean(state.fieldErrors?.displayName)}
                disabled={pending}
                maxLength={100}
                name="displayName"
                onChange={(event) => setDisplayName(event.target.value)}
                required
                value={displayName}
              />
              {state.fieldErrors?.displayName ? (
                <small data-error="true" className={fieldErrorClass} role="alert">{state.fieldErrors.displayName}</small>
              ) : null}
            </label>
            <label className={fieldClass}>
              <span>Email address</span>
              <input className={inputClass} aria-readonly="true" readOnly type="email" value={email} />
              <small>Sign-in email changes are not available here.</small>
            </label>
            {role === "professor" ? (
              <label className={fieldClass}>
                <span>Work phone number <small>Optional</small></span>
                <input
                  className={inputClass}
                  aria-invalid={Boolean(state.fieldErrors?.workPhone)}
                  autoComplete="tel"
                  disabled={pending}
                  inputMode="tel"
                  maxLength={32}
                  name="workPhone"
                  onChange={(event) => setWorkPhone(event.target.value)}
                  placeholder="+63 2 8123 4567"
                  value={workPhone}
                />
                {state.fieldErrors?.workPhone ? (
                  <small data-error="true" className={fieldErrorClass} role="alert">{state.fieldErrors.workPhone}</small>
                ) : null}
              </label>
            ) : null}
          </div>
        </section>

        <section
          aria-labelledby="settings-tab-privacy"
          className={`${panelClass} min-h-[247px] p-[25px] max-[600px]:p-5`}
          hidden={activeTab !== "privacy"}
          id="settings-panel-privacy"
          role="tabpanel"
          tabIndex={0}
        >
          <div className={panelHeadingClass}>
            <h2>Privacy &amp; data</h2>
            <p>Current data handling based on the features that are implemented today.</p>
          </div>
          <div className="grid gap-3.5">
            <article className="grid min-h-[54px] grid-cols-[26px_minmax(0,1fr)] items-center gap-3 rounded-[5px] border border-[#007623] bg-[rgba(0,224,93,0.32)] px-3 py-2.5 max-[600px]:items-start">
              <SettingsIcon tab="privacy" />
              <div>
                <strong className="text-[0.8125rem]">Private teaching-case storage</strong>
                <p className="m-0 mt-0.5 text-[0.75rem] leading-[1.35] text-(--text-secondary)">Approved, de-identified cases use private Supabase Storage with short-lived signed access for authorized activity pages.</p>
              </div>
            </article>
            <article className="grid min-h-[54px] grid-cols-[26px_minmax(0,1fr)] items-center gap-3 rounded-[5px] border border-[#0d5fc7] bg-[rgba(0,132,255,0.38)] px-3 py-2.5 max-[600px]:items-start">
              <span className="grid size-6 place-items-center rounded-full border border-current" aria-hidden="true">✓</span>
              <div>
                <strong className="text-[0.8125rem]">Browser inference foundation</strong>
                <p className="m-0 mt-0.5 text-[0.75rem] leading-[1.35] text-(--text-secondary)">Learning Mode can run the active ONNX release in this browser. Authorized activity analysis may persist model results and feedback according to the <Link className="font-semibold underline underline-offset-2" href="/privacy-policy">Privacy Policy</Link>.</p>
              </div>
            </article>
          </div>
        </section>

        {loadError ? <p className={`${messageBaseClass} bg-[rgba(255,55,69,0.12)] text-(--status-error-text)`}>{loadError}</p> : null}
        {state.message ? (
          <p
            aria-live="polite"
            className={statusMessageClass(state.status)}
            role={state.status === "error" || state.status === "unauthorized" ? "alert" : "status"}
          >
            {state.message}
          </p>
        ) : null}
        <div className="flex justify-end">
          <button className={submitButtonClass} disabled={!isDirty || pending || Boolean(loadError)} type="submit">
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

const textSizes = [
  { value: "default", label: "Default" },
  { value: "large", label: "Large" },
  { value: "larger", label: "Larger" },
] as const;

// The <html> attributes set before paint by app/layout.tsx are the source of truth, so the panel reads them as an external store.
function subscribeToRootPrefs(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-text-size", "data-contrast"] });
  return () => observer.disconnect();
}

function saveDisplayPref(key: "text-size" | "contrast", value: string, isDefault: boolean) {
  const root = document.documentElement;
  if (isDefault) root.removeAttribute(`data-${key}`);
  else root.setAttribute(`data-${key}`, value);
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function AccessibilityPanel({ hidden }: { hidden: boolean }) {
  const textSize = useSyncExternalStore(
    subscribeToRootPrefs,
    () => document.documentElement.getAttribute("data-text-size") ?? "default",
    () => "default",
  );
  const highContrast = useSyncExternalStore(
    subscribeToRootPrefs,
    () => document.documentElement.getAttribute("data-contrast") === "high",
    () => false,
  );

  return (
    <section
      aria-labelledby="settings-tab-accessibility"
      className={`${panelClass} min-h-[247px] p-[25px] max-[600px]:p-5`}
      hidden={hidden}
      id="settings-panel-accessibility"
      role="tabpanel"
      tabIndex={0}
    >
      <div className={panelHeadingClass}>
        <h2>Accessibility</h2>
        <p>Changes apply right away and are saved in this browser only.</p>
      </div>
      <div className="grid gap-[26px]">
        <fieldset className="m-0 grid gap-[7px] border-0 p-0">
          <legend className="mb-[7px] p-0 text-[0.8125rem] text-(--text-primary)">Text size</legend>
          <div className="flex flex-wrap gap-2.5">
            {textSizes.map((size) => (
              <label
                className="transition-colors duration-160 flex min-h-[38px] cursor-pointer items-center gap-2 rounded-[7px] border border-(--border-field) px-3.5 text-[0.8125rem] text-(--text-primary) hover:bg-(--hover-overlay) has-checked:border-[#21aaff] has-checked:bg-[rgba(70,193,255,0.25)]"
                key={size.value}
              >
                <input
                  checked={textSize === size.value}
                  className="size-4 accent-(--brand-blue)"
                  name="textSize"
                  onChange={() => saveDisplayPref("text-size", size.value, size.value === "default")}
                  type="radio"
                  value={size.value}
                />
                {size.label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="grid cursor-pointer grid-cols-[16px_minmax(0,1fr)] items-start gap-3">
          <input
            checked={highContrast}
            className="mt-0.5 size-4 accent-(--brand-blue)"
            onChange={(event) => saveDisplayPref("contrast", event.target.checked ? "high" : "normal", !event.target.checked)}
            type="checkbox"
          />
          <span className="grid gap-0.5">
            <span className="text-[0.8125rem] text-(--text-primary)">High contrast</span>
            <small className="text-[0.6875rem] leading-[1.4] text-(--text-secondary)">Solid panels, stronger borders and brighter secondary text.</small>
          </span>
        </label>
      </div>
    </section>
  );
}

const passwordFields = [
  { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
  { name: "newPassword", label: "New password", autoComplete: "new-password", hint: "Use at least 8 characters." },
  { name: "confirmPassword", label: "Confirm new password", autoComplete: "new-password" },
] as const;

function PasswordPanel({ hidden }: { hidden: boolean }) {
  // React resets this uncontrolled form after each submission, so passwords never linger.
  const [state, formAction, pending] = useActionState<PasswordActionState, FormData>(
    changePasswordAction,
    { status: "idle", message: "" },
  );

  return (
    <form action={formAction} className="grid gap-6" hidden={hidden} noValidate>
      <section
        aria-labelledby="settings-tab-security"
        className={`${panelClass} min-h-[247px] p-[25px] max-[600px]:p-5`}
        id="settings-panel-security"
        role="tabpanel"
        tabIndex={0}
      >
        <div className={panelHeadingClass}>
          <h2>Change password</h2>
          <p>Enter your current password, then choose a new one. Other signed-in devices will be logged out.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-[84px] gap-y-[26px] max-[600px]:grid-cols-1 max-[600px]:gap-y-5">
          {passwordFields.map((field) => (
            <label className={`${fieldClass} content-start ${field.name === "newPassword" ? "col-start-1" : ""}`} key={field.name}>
              <span>{field.label}</span>
              <input
                className={inputClass}
                aria-invalid={Boolean(state.fieldErrors?.[field.name])}
                autoComplete={field.autoComplete}
                disabled={pending}
                name={field.name}
                required
                type="password"
              />
              {state.fieldErrors?.[field.name] ? (
                <small data-error="true" className={fieldErrorClass} role="alert">{state.fieldErrors[field.name]}</small>
              ) : "hint" in field ? (
                <small>{field.hint}</small>
              ) : null}
            </label>
          ))}
        </div>
      </section>
      {state.message ? (
        <p
          aria-live="polite"
          className={statusMessageClass(state.status)}
          role={state.status === "error" || state.status === "unauthorized" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button className={submitButtonClass} disabled={pending} type="submit">
          {pending ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}
