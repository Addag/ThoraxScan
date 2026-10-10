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
import Link from "next/link";

const tabOrder = ["profile", "display", "privacy"] as const;
type SettingsTab = (typeof tabOrder)[number];

const panelClass = "border border-[#8d9199] rounded-[10px] [background:var(--glass-surface)] backdrop-blur-[18px] backdrop-saturate-[135%] shadow-(--glass-shadow)";
const panelHeadingClass = "mb-[26px] [&_h2]:m-0 [&_h2]:text-[20px] [&_h2]:capitalize [&_p]:m-0 [&_p]:mt-[3px] [&_p]:text-[13px] [&_p]:text-[#b4bac6]";
const fieldClass = "grid gap-[7px] text-[13px] text-[#f5f5f5] [&>span>small]:ml-[5px] [&>span>small]:text-[#8f96a3] [&>small:not([data-error])]:text-[10px] [&>small:not([data-error])]:leading-[1.4] [&>small:not([data-error])]:text-[#c4d0e0]";
const inputClass = "min-h-[38px] w-full rounded-[7px] border border-[rgba(255,255,255,0.49)] bg-[#05070c] px-[11px] py-[7px] text-white [&[readonly]]:bg-[#11151d] [&[readonly]]:text-[#b8beca]";
const iconClass = "size-6 fill-none stroke-current stroke-[1.6] [stroke-linecap:round] [stroke-linejoin:round]";
const messageBaseClass = "-mt-[9px] rounded-[6px] px-3 py-2.5 text-[12px]";

function SettingsIcon({ tab }: { tab: SettingsTab }) {
  if (tab === "profile") {
    return (
      <svg className={iconClass} aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="12" cy="7" r="3.5" />
        <path d="M5.5 20v-2.5a6.5 6.5 0 0 1 13 0V20Z" />
      </svg>
    );
  }
  if (tab === "display") {
    return (
      <svg className={iconClass} aria-hidden="true" viewBox="0 0 24 24">
        <rect x="2.5" y="3.5" width="19" height="14" rx="2.5" />
        <path d="M8 21h8M12 17.5V21" />
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
    <form action={formAction} className="grid gap-6" noValidate>
      <section className={`${panelClass} overflow-hidden after:block after:h-px after:-translate-y-[90px] after:bg-[rgba(151,151,151,0.39)] after:content-['']`} aria-label="Settings categories">
        <div className="grid gap-5 p-[18px_17px_22px] max-[600px]:gap-[9px] max-[600px]:p-[13px]" role="tablist" aria-label="Account settings">
          {tabOrder.map((tab, index) => (
            <button
              aria-controls={`settings-panel-${tab}`}
              aria-selected={activeTab === tab}
              className={`grid min-h-[67px] w-full cursor-pointer grid-cols-[36px_minmax(0,1fr)] items-center rounded-[10px] border px-[22px] text-left text-[20px] font-semibold text-white max-[600px]:min-h-[58px] max-[600px]:px-[14px] max-[600px]:text-[17px] ${activeTab === tab ? "border-[#21aaff] bg-[rgba(70,193,255,0.49)]" : "border-transparent bg-transparent"}`}
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
        <span className="relative mt-[17px] mb-5 ml-[26px] block size-[52px] rounded-full bg-[linear-gradient(180deg,#56c7ff_0%,#5557b8_100%)]" aria-hidden="true" />
      </section>

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
              <small data-error="true" className="text-[11px] text-[#ff8d95]" role="alert">{state.fieldErrors.displayName}</small>
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
                <small data-error="true" className="text-[11px] text-[#ff8d95]" role="alert">{state.fieldErrors.workPhone}</small>
              ) : null}
            </label>
          ) : null}
        </div>
      </section>

      <section
        aria-labelledby="settings-tab-display"
        className={`${panelClass} min-h-[247px] p-[25px] max-[600px]:p-5`}
        hidden={activeTab !== "display"}
        id="settings-panel-display"
        role="tabpanel"
        tabIndex={0}
      >
        <div className={panelHeadingClass}>
          <h2>Display</h2>
          <p>Choose how teaching-case images are framed in your activity views.</p>
        </div>
        <label className="grid cursor-pointer grid-cols-[minmax(0,1fr)_auto_54px] items-center gap-[13px] border-t border-t-[rgba(151,151,151,0.39)] py-[30px] pb-2.5">
          <span className="grid gap-1">
            <strong className="text-[18px]">Dark image background</strong>
            <small className="text-[12px] text-[#9ba3b3]">Use a dark neutral frame around chest X-ray previews.</small>
          </span>
          <input
            checked={darkImageBackground}
            disabled={pending}
            className="peer absolute size-px overflow-hidden opacity-0"
            name="darkImageBackground"
            onChange={(event) => setDarkImageBackground(event.target.checked)}
            role="switch"
            type="checkbox"
            value="true"
          />
          <span className="relative block h-[30px] w-[54px] rounded-full border border-[#737987] bg-[#6d7078] transition-colors after:absolute after:top-[3px] after:left-[3px] after:size-[22px] after:rounded-full after:bg-white after:transition-transform peer-checked:border-[#219eff] peer-checked:bg-[#0a65bd] peer-checked:after:translate-x-6 peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-white peer-focus-visible:outline-offset-4" aria-hidden="true" />
        </label>
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
              <strong className="text-[13px]">Private teaching-case storage</strong>
              <p className="m-0 mt-0.5 text-[12px] leading-[1.35] text-[#e2e9f2]">Approved, de-identified cases use private Supabase Storage with short-lived signed access for authorized activity pages.</p>
            </div>
          </article>
          <article className="grid min-h-[54px] grid-cols-[26px_minmax(0,1fr)] items-center gap-3 rounded-[5px] border border-[#0d5fc7] bg-[rgba(0,132,255,0.38)] px-3 py-2.5 max-[600px]:items-start">
            <span className="grid size-6 place-items-center rounded-full border border-current" aria-hidden="true">✓</span>
            <div>
              <strong className="text-[13px]">Browser inference foundation</strong>
              <p className="m-0 mt-0.5 text-[12px] leading-[1.35] text-[#e2e9f2]">Learning Mode can run the active ONNX release in this browser. Authorized activity analysis may persist model results and feedback according to the <Link className="font-semibold underline underline-offset-2" href="/privacy-policy">Privacy Policy</Link>.</p>
            </div>
          </article>
        </div>
      </section>

      {loadError ? <p className={`${messageBaseClass} bg-[rgba(255,55,69,0.12)] text-[#ff9da4]`}>{loadError}</p> : null}
      {state.message ? (
        <p
          aria-live="polite"
          className={`${messageBaseClass} ${state.status === "error" || state.status === "unauthorized" ? "bg-[rgba(255,55,69,0.12)] text-[#ff9da4]" : state.status === "success" ? "bg-[rgba(0,224,93,0.12)] text-[#8dffba]" : "bg-[rgba(0,119,255,0.14)] text-[#a8d5ff]"}`}
          role={state.status === "error" || state.status === "unauthorized" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button className="min-h-[42px] min-w-[135px] cursor-pointer rounded-[5px] border-0 bg-[linear-gradient(270deg,#4363ff_0%,#8397fe_100%)] px-[18px] text-[13px] font-extrabold text-[#050612] disabled:cursor-not-allowed disabled:opacity-50 max-[600px]:w-full" disabled={!isDirty || pending || Boolean(loadError)} type="submit">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
