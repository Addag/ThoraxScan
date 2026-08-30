"use client";

import {
  type KeyboardEvent,
  useActionState,
  useCallback,
  useRef,
  useState,
} from "react";

import { updateAccountSettingsAction } from "@/app/(protected)/settings/actions";
import type { AppRole } from "@/lib/auth/types";
import {
  type AccountSettings,
  type SettingsActionState,
  initialSettingsActionState,
} from "@/lib/settings/types";

const tabOrder = ["profile", "display", "privacy"] as const;
type SettingsTab = (typeof tabOrder)[number];

function SettingsIcon({ tab }: { tab: SettingsTab }) {
  if (tab === "profile") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="7" r="3.5" />
        <path d="M5.5 20v-2.5a6.5 6.5 0 0 1 13 0V20Z" />
      </svg>
    );
  }
  if (tab === "display") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <rect x="2.5" y="3.5" width="19" height="14" rx="2.5" />
        <path d="M8 21h8M12 17.5V21" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
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
  const [darkImageBackground, setDarkImageBackground] = useState(
    initialSettings.darkImageBackground,
  );
  const [savedValues, setSavedValues] = useState({
    displayName: initialDisplayName,
    workPhone: initialSettings.workPhone ?? "",
    darkImageBackground: initialSettings.darkImageBackground,
  });
  const submitAction = useCallback(
    async (previousState: SettingsActionState, formData: FormData) => {
      const nextState = await updateAccountSettingsAction(previousState, formData);
      if (nextState.status === "success" && nextState.savedValues) {
        const nextValues = {
          displayName: nextState.savedValues.displayName,
          workPhone: nextState.savedValues.workPhone ?? "",
          darkImageBackground: nextState.savedValues.darkImageBackground,
        };
        setDisplayName(nextValues.displayName);
        setWorkPhone(nextValues.workPhone);
        setDarkImageBackground(nextValues.darkImageBackground);
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
    workPhone !== savedValues.workPhone ||
    darkImageBackground !== savedValues.darkImageBackground;

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
    <form action={formAction} className="settings-form" noValidate>
      <section className="settings-category-panel" aria-label="Settings categories">
        <div className="settings-tab-list" role="tablist" aria-label="Account settings">
          {tabOrder.map((tab, index) => (
            <button
              aria-controls={`settings-panel-${tab}`}
              aria-selected={activeTab === tab}
              className="settings-tab"
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
        <span className="settings-orb" aria-hidden="true" />
      </section>

      <section
        aria-labelledby="settings-tab-profile"
        className="settings-detail-panel"
        hidden={activeTab !== "profile"}
        id="settings-panel-profile"
        role="tabpanel"
        tabIndex={0}
      >
        <div className="settings-panel-heading">
          <h2>Profile information</h2>
          <p>Update the account details shown throughout your ThoraxScan workspace.</p>
        </div>
        <div className="settings-profile-grid">
          <label>
            <span>Full name</span>
            <input
              aria-invalid={Boolean(state.fieldErrors?.displayName)}
              disabled={pending}
              maxLength={100}
              name="displayName"
              onChange={(event) => setDisplayName(event.target.value)}
              required
              value={displayName}
            />
            {state.fieldErrors?.displayName ? (
              <small className="settings-field-error">{state.fieldErrors.displayName}</small>
            ) : null}
          </label>
          <label>
            <span>Email address</span>
            <input aria-readonly="true" readOnly type="email" value={email} />
            <small>Sign-in email changes are not available here.</small>
          </label>
          {role === "professor" ? (
            <label>
              <span>Work phone number <small>Optional</small></span>
              <input
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
                <small className="settings-field-error">{state.fieldErrors.workPhone}</small>
              ) : null}
            </label>
          ) : null}
        </div>
      </section>

      <section
        aria-labelledby="settings-tab-display"
        className="settings-detail-panel"
        hidden={activeTab !== "display"}
        id="settings-panel-display"
        role="tabpanel"
        tabIndex={0}
      >
        <div className="settings-panel-heading">
          <h2>Display</h2>
          <p>Choose how teaching-case images are framed in your activity views.</p>
        </div>
        <label className="settings-switch-row">
          <span>
            <strong>Dark image background</strong>
            <small>Use a dark neutral frame around chest X-ray previews.</small>
          </span>
          <input
            checked={darkImageBackground}
            disabled={pending}
            name="darkImageBackground"
            onChange={(event) => setDarkImageBackground(event.target.checked)}
            role="switch"
            type="checkbox"
            value="true"
          />
          <span className="settings-switch" aria-hidden="true" />
        </label>
      </section>

      <section
        aria-labelledby="settings-tab-privacy"
        className="settings-detail-panel"
        hidden={activeTab !== "privacy"}
        id="settings-panel-privacy"
        role="tabpanel"
        tabIndex={0}
      >
        <div className="settings-panel-heading">
          <h2>Privacy &amp; data</h2>
          <p>Current data handling based on the features that are implemented today.</p>
        </div>
        <div className="settings-status-list">
          <article className="settings-status settings-status--success">
            <SettingsIcon tab="privacy" />
            <div>
              <strong>Private teaching-case storage</strong>
              <p>Approved, de-identified cases use private Supabase Storage with short-lived signed access for authorized activity pages.</p>
            </div>
          </article>
          <article className="settings-status settings-status--info">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>Browser inference foundation</strong>
              <p>The app can verify an active ONNX release for local WebGPU or WASM execution. Product-facing activity analysis and feedback are not enabled yet.</p>
            </div>
          </article>
        </div>
      </section>

      {loadError ? <p className="settings-message settings-message--error">{loadError}</p> : null}
      {state.message ? (
        <p
          aria-live="polite"
          className={`settings-message settings-message--${state.status}`}
          role={state.status === "error" || state.status === "unauthorized" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
      <div className="settings-save-row">
        <button disabled={!isDirty || pending || Boolean(loadError)} type="submit">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
