# ThoraxScan: a beginner's guide to the repository

This guide is for groupmates who are new to coding. It explains what the project contains, how its parts work together, and how to start contributing.

**Source baseline:** commit `a25613a`, reviewed on 16 November 2026; the activity, submission, and grading sections were updated on 17 November 2026 for the Professor-validated answer key (commit `2f9a6d1`), then for written answers, Student heatmaps, Professor-only grading and the heatmap brush (commit `b074efb`), and on 18 November 2026 for review emails and live page updates (through commit `bfa95f9`). Links point to files in your checkout, which can change. I cannot confirm the deployed version, active hosted model, or whether these migrations have been applied to a hosted project. This is a source walkthrough, not a report that every setup step or feature was run successfully.

ThoraxScan is an educational application. Its README states that it has not been clinically validated and must not be used for patient care. Keep that limitation when explaining or changing AI result wording. [Source: project README](../README.md).

## Contents

1. [How to learn from this guide](#1-how-to-learn-from-this-guide)
2. [Basic vocabulary](#2-basic-vocabulary)
3. [What the application does](#3-what-the-application-does)
4. [Set up your computer](#4-set-up-your-computer)
5. [Understand the folders](#5-understand-the-folders)
6. [Read the code's syntax](#6-read-the-codes-syntax)
7. [Pages, components, and styling](#7-pages-components-and-styling)
8. [Sign-in and permissions](#8-sign-in-and-permissions)
9. [The database and stored files](#9-the-database-and-stored-files)
10. [Follow the main features](#10-follow-the-main-features)
11. [Understand the AI pipeline](#11-understand-the-ai-pipeline)
12. [Scripts, Python, assets, and project settings](#12-scripts-python-assets-and-project-settings)
13. [Make your first changes](#13-make-your-first-changes)
14. [Check your work and investigate errors](#14-check-your-work-and-investigate-errors)
15. [A teaching plan for the group](#15-a-teaching-plan-for-the-group)
16. [Keep the documentation useful](#16-keep-the-documentation-useful)

For a searchable inventory of tracked files, use the [repository reference](repository-reference.md). You do not need to read every file in order.

## 1. How to learn from this guide

Start with sections 2–7 and the first exercise in section 13. Next, trace a form from the screen to its Server Action and database function. Read AI export and release operations after you understand the application's ordinary forms.

Use two windows: the editor showing a source file and the browser showing the corresponding page. When learning a feature, answer these questions:

1. What does the user do?
2. Which component receives that input?
3. Which function handles it?
4. Where is it checked or saved?
5. How does the result get back to the screen?

Explanations below link to the source files that support them. Existing planning documents describe intentions; code and the complete migration sequence establish the implemented behavior. The [system map](../map/CLAUDE.md) explicitly distinguishes implemented objects from planned or legacy ones.

## 2. Basic vocabulary

| Term | Meaning in this project |
|---|---|
| Repository, or repo | The project files tracked by Git. The application repo is `thoraxscan-app`, inside the parent `ThoraxScan` folder. |
| Terminal | A place to type commands. On Windows, the examples here use PowerShell. |
| Command | An instruction such as `npm run dev`; press Enter to run it. |
| Source code | Files written to describe the application's behavior. |
| Frontend | The interface the user sees and interacts with. |
| Backend | Server and database work behind the interface. Here that includes Next.js server code and Supabase. |
| Browser and server | The browser runs on the user's device; server code runs in the app's server environment. |
| HTML | Elements describing page content, such as headings, buttons, and forms. |
| CSS | Rules describing appearance and layout. |
| JavaScript | The programming language used for application behavior. |
| TypeScript | JavaScript with descriptions of allowed data shapes and types. |
| React component | A function that describes a reusable part of the interface. |
| Next.js | The framework that organizes this React application, including pages and server functions. |
| Dependency | A package the project uses instead of writing that functionality itself. |
| npm | The package tool used to install dependencies and run project commands. |
| Database table, row, column | A collection of records, one record, and one field in that record. |
| ID / UUID | An identifier used to refer to a specific record. |
| API / RPC | A callable interface; an RPC here calls a named database function. |
| Authentication | Establishing who is signed in. |
| Authorization | Deciding what that account may access or change. |
| RLS | Row-level security: database policies controlling access to individual records. |
| Migration | A versioned SQL file changing the database. |
| Validation | Checking whether input meets rules before accepting it. |
| Inference | Running a trained model on an input to obtain outputs. |
| Test | Code checking an expected behavior. |
| Build | Preparing the application for production use. |
| Commit / branch | A saved Git revision / a named line of development. |

These are working definitions for reading the repo. The concrete tools and versions are listed in [package.json](../package.json).

## 3. What the application does

The main workflow is: a Professor creates a workspace, Students join it, the Professor publishes an X-ray activity, Students submit interpretations, and they receive AI feedback and separately released Professor feedback. Both roles can use Learning Mode. An administrator manages applications, accounts, and announcements. [Sources: README](../README.md), [route files](repository-reference.md#application-routes-and-actions).

Keep these concepts separate:

| Concept | What it represents | Where to start reading |
|---|---|---|
| Profile | The app's record of an account and Student/Professor role | [auth/types.ts](../src/lib/auth/types.ts) |
| Professor application | Approval state controlling Professor access | [auth/server.ts](../src/lib/auth/server.ts) |
| Administrator | An extra account capability, separate from the two app roles | [auth/server.ts](../src/lib/auth/server.ts) |
| Workspace | A Professor-managed class area | [workspaces/types.ts](../src/lib/workspaces/types.ts) |
| Membership | An account's relationship to a workspace | [workspace migration](../supabase/migrations/20260817110952_workspace_membership_invitations.sql) |
| Activity | An assignment with instructions and a case image | [activities/types.ts](../src/lib/activities/types.ts) |
| Submission | A Student's response to an activity | [submissions/types.ts](../src/lib/submissions/types.ts) |
| AI analysis | Model output and the release information used to produce it | [activity-ai/types.ts](../src/lib/activity-ai/types.ts) |
| Faculty evaluation | The Professor's feedback on a submission | [evaluations/types.ts](../src/lib/evaluations/types.ts) |

## 4. Set up your computer

### 4.1 Open the correct folder

Open `thoraxscan-app` in your editor. In its terminal, list the files:

```powershell
Get-Location
Get-ChildItem
```

You should see `package.json`, `src`, and `supabase`. If you see the parent folder's manuscript/review directories, enter the application folder:

```powershell
cd thoraxscan-app
```

### 4.2 Check the required tools

The README specifies Node.js 20.9 or newer and Docker for local Supabase. Install Git and a code editor as well. Python is for the offline model tools; it is not needed for your first interface edit. [Sources: setup instructions](../README.md#getting-started), [model export README](../model-export/README.md).

```powershell
node --version
npm --version
git --version
docker --version
```

If a command is unrecognized, install the relevant tool or fix its PATH, then reopen the terminal. Start Docker Desktop before starting local Supabase.

### 4.3 Install packages and configure local services

Run each command separately. Wait for it to finish before running the next one.

```powershell
npm install
```

Create a root file named `.env` containing the local CAPTCHA test secret shown in the [README's CAPTCHA instructions](../README.md#configure-captcha-protection). This file configures local Supabase Auth. Use the documented test credentials only for local development.

Start local Supabase:

```powershell
npx supabase start
```

On a fresh disposable local database, apply the migrations by resetting it:

```powershell
npx supabase db reset
```

**A reset deletes and rebuilds the local database.** Do not repeat it when you need to keep local work. Before a reset, inspect the migration folder for unfinished work: reset runs the files present in your checkout, including new local SQL files. If a teammate has unfinished migrations in the checkout, ask them for a coherent revision before using it for lessons.

Create `.env.local` only if it does not already exist:

```powershell
Copy-Item .env.example .env.local
npx supabase status
```

Edit `.env.local` with the local Supabase URL and publishable key from the status output. Set the local Turnstile test site key from the README and keep the site URL as `http://localhost:3000`. The example groups app, Auth, and operator variables together; you do not need model publisher credentials to edit pages. Keep the CAPTCHA secret in `.env`, and keep operator service-role credentials out of browser variables. `RESEND_API_KEY` and `EMAIL_FROM` are optional locally: without them, reviewing a Professor application still works but sends no email. [Sources: environment example](../.env.example), [Supabase operations](../supabase/README.md).

Do not share actual secrets in screenshots, commits, or chat messages. `NEXT_PUBLIC_` means the application can expose that variable to the browser; adding that prefix does not protect a value.

### 4.4 Start the application

```powershell
npm run dev
```

Open the local address printed by the terminal, normally `http://localhost:3000`. Keep that terminal open. Press Ctrl+C to stop the server. After changing environment variables, restart it.

The `predev` script first prepares ONNX Runtime assets. A fresh local database has no active AI model; this is separate from whether the web app starts. Model setup is an advanced task described in [model release operations](model-releases.md). A locally registered Professor also needs approval; the [administrator bootstrap instructions](../README.md#bootstrap-the-first-administrator) explain how the first administrator is established. Use a local test account for lessons.

## 5. Understand the folders

```text
thoraxscan-app/
  src/
    app/          Pages, Server Actions, and HTTP Route Handlers
    components/   Reusable interface pieces
    lib/          Data types, queries, validation, inference, and helpers
    proxy.ts      Session-update entry point
  supabase/       Database migrations, Auth settings, emails, SQL tests
  public/         Files served by URL: images, icons, and a PDF
  scripts/        Maintenance, model release, import, and guide tools
  model-export/   Offline Python model and export tools
  docs/           This guide and model documentation
  map/            Detailed system map and earlier planning documents
  .claude/        Assistant tooling and a bundled mapping skill
  package.json    Packages and named commands
```

The [repository reference](repository-reference.md) lists tracked files across these areas. Generated folders such as `node_modules` and `.next` are not places to make source edits. Local `model-input` bundles and environment files are intentionally ignored. [Source: .gitignore](../.gitignore).

## 6. Read the code's syntax

### 6.1 File extensions

| Extension | What to expect |
|---|---|
| `.ts` | TypeScript functions, types, and configuration |
| `.tsx` | TypeScript containing JSX: markup-like descriptions of React interfaces |
| `.css` | Styling rules |
| `.json` | Structured data or configuration |
| `.sql` | Database definitions, functions, policies, or tests |
| `.py` | Python model tooling |
| `.mjs`, `.mts` | JavaScript/TypeScript module scripts and configuration |
| `.ps1` | PowerShell script |
| `.md` | Markdown documentation |
| `.test.ts`, `.browser.test.tsx` | Test files; see section 14 for how they run |

### 6.2 Read a small function

This function appears in the [submission validation](../src/lib/submissions/validation.ts):

```ts
export function unpaintedFindings(map: readonly number[] | null, labels: readonly ActivityAILabel[]) {
  const painted = paintedLabels(map, labels);
  return labels.filter((label) => label !== "No Finding" && !painted.includes(label));
}
```

- `export` lets another file import the function.
- `function` declares a reusable operation.
- `unpaintedFindings` is its name.
- `map` and `labels` are the values passed in by the caller.
- `: readonly number[] | null` describes the expected input shape: a list of numbers the function will not change, or `null` when nothing was painted.
- `{ ... }` encloses the work the function performs.
- `const painted = ...` stores an intermediate result under a name.
- `labels.filter((label) => ...)` keeps only the labels for which the arrow function returns `true`; `&&` means "and", `!` means "not".

The same file has `normalizeLabels` (keeps known labels in the fixed order, without repeats), `labelsError` (at least one label; `No Finding` only on its own), `normalizeAnswers` (trims written answers and keeps them for selected labels only), `paintedLabels` (which selected findings have a cell above 0), `validateSubmission` (combines these checks into field errors), and `compareLabels` (correct, extra and missed labels against the key, without a score). The [tests](../src/lib/submissions/validation.test.ts) show examples of accepted and rejected values.

### 6.3 Recognize frequently used expressions

| Syntax | How to read it |
|---|---|
| `const value = ...` | Give this value a name. |
| `let value = ...` | Give a value a name that can later be reassigned. |
| `if (condition) ...` | Do this only when the condition holds. |
| `return result` | Finish this function with a result. |
| `===` | Compare values using strict equality. |
| `!value` | Negate a truth test. |
| `value?.field` | Read the field if the value is not null or undefined. |
| `value ?? fallback` | Use the fallback if the value is null or undefined. |
| `condition ? a : b` | Choose one of two expressions. |
| `items.map(...)` | Produce a transformed array. |
| `items.filter(...)` | Keep matching entries. |
| `{ ...old, status: "error" }` | Copy object properties, then set this status. |
| `async` / `await` | Work with an operation that completes asynchronously. |
| `Promise.all([...])` | Wait for several operations started together. |
| `try` / `catch` / `finally` | Handle success, thrown failures, and cleanup. |

Type checks help during development; they do not replace checks on submitted form values. For a concrete example, compare the TypeScript types with the validation and authentication checks in the [Student submission action](../src/app/%28protected%29/student/activities/actions.ts).

### 6.4 Imports, aliases, and components

An import such as `@/lib/auth/server` points into `src/lib/auth/server`; the `@/*` alias is configured in [tsconfig.json](../tsconfig.json).

In JSX, `<StudentShell>...</StudentShell>` calls a component. Values passed through attributes are **props**. Content between its tags is its **children**. In [Brand](../src/components/brand.tsx), the `variant` prop chooses landing, authentication, or sidebar styles.

In a client component, **state** stores changing UI values. The [Learning Mode analyzer](../src/components/learning/learning-mode-analyzer.tsx) uses state for the selected file, progress, result, and error. Calling a state setter asks React to render the updated interface. A `useEffect` handles work associated with component lifecycle or dependencies; read its cleanup function too.

## 7. Pages, components, and styling

### 7.1 How a URL finds its page

| Browser URL | Source |
|---|---|
| `/` | [app/page.tsx](../src/app/page.tsx) |
| `/login` | [login/page.tsx](../src/app/%28auth%29/login/page.tsx) |
| `/dashboard` | [dashboard/page.tsx](../src/app/%28protected%29/dashboard/page.tsx) |
| `/student/activities` | [Student activities page](../src/app/%28protected%29/student/activities/page.tsx) |
| `/student/activities/<id>` | [Student activity detail](../src/app/%28protected%29/student/activities/%5BactivityId%5D/page.tsx) |
| `/professor/activities/new` | [New activity page](../src/app/%28protected%29/professor/activities/new/page.tsx) |
| `/admin` | [Admin page](../src/app/%28protected%29/admin/page.tsx) |
| `/auth/confirm` | [Auth confirmation handler](../src/app/auth/confirm/route.ts) |

`(auth)` and `(protected)` organize files without appearing in URLs. `[activityId]` means a variable segment: the page receives the chosen ID. **The folder name `(protected)` does not itself enforce permissions.** Look for actual authentication and authorization checks.

A `page.tsx` renders a page; `layout.tsx` provides shared wrapping structure; `route.ts` handles HTTP requests, such as confirmation links and CSV exports. Many mutations here use Server Actions rather than a separate `/api` route. [Sources: route inventory](repository-reference.md#application-routes-and-actions), [root layout](../src/app/layout.tsx).

### 7.2 Where code executes

| Marker or file | Its role here |
|---|---|
| `"use client"` | Marks an entry point for interactive client code, such as state and event handlers. |
| `"use server"` | Marks server functions that forms/client code can invoke through the framework. |
| `import "server-only"` | Used in modules such as notifications to prevent client imports. |
| `src/lib/supabase/client.ts` | Creates a browser Supabase client. |
| `src/lib/supabase/server.ts` | Creates a Supabase client using server-side request cookies. |

Read [LearningNotes](../src/components/learning/learning-notes.tsx), the [shared actions](../src/app/%28protected%29/actions.ts), and the [Supabase client modules](../src/lib/supabase/server.ts) together. A function being callable from a form does not make its input trustworthy; the server still checks it.

### 7.3 How appearance is shared

Start with [globals.css](../src/app/globals.css) for theme tokens and global rules, [controls.ts](../src/components/controls.ts) for shared control classes, and [dashboard-ui.tsx](../src/components/dashboard-ui.tsx) for common page pieces. Many components also use Tailwind utility classes directly in `className`.

`app-shell.tsx` and `app-sidebar.tsx` provide shared app structure; Student, Professor, and Admin shells adapt that structure. [display-prefs.ts](../src/lib/display-prefs.ts) applies saved theme, text-size, and contrast preferences before first paint, through [layout.tsx](../src/app/layout.tsx). Its inline use requires it to stay self-contained.

For a visual change, check narrow and wide screens, light and dark themes, keyboard operation, and larger text. A shared style edit can affect several roles.

## 8. Sign-in and permissions

Follow the boundary in this order:

1. [Auth form](../src/components/auth/auth-form.tsx) collects input and CAPTCHA interaction.
2. [Authentication actions](../src/app/%28auth%29/actions.ts) handle registration, sign-in, recovery, and related requests.
3. [Confirmation Route Handler](../src/app/auth/confirm/route.ts) handles email confirmation/recovery callbacks.
4. [proxy.ts](../src/proxy.ts) delegates to [Supabase session update](../src/lib/supabase/proxy.ts) to keep cookie sessions refreshed.
5. [auth/server.ts](../src/lib/auth/server.ts) loads the profile and provides `requireRole` and `requirePlatformAdmin`.
6. [Dashboard routing](../src/app/%28protected%29/dashboard/page.tsx) sends the user to the appropriate role area or pending Professor application.
7. Database functions and policies enforce data access. Read the [migrations](repository-reference.md#database-migrations) for the underlying rules.

There are two app roles: `student` and `professor`. A Professor additionally needs an approved application. Administrator membership is separate. Hiding a button is a UI choice, not sufficient authorization. [Sources: auth types](../src/lib/auth/types.ts), [auth guards](../src/lib/auth/server.ts).

Two-step login uses authenticator-app codes, a `/login/verify` screen, profile settings, and database/Storage enforcement. The [two-step migration](../supabase/migrations/20261115120000_two_step_login.sql) and [settings actions](../src/app/%28protected%29/settings/actions.ts) are advanced reading. Do not remove a permission check merely to get a local test account past an error; establish the proper local account and approval instead.

## 9. The database and stored files

The database is part of the application logic. A form may look simple because a database function handles the complex rules.

### 9.1 Main data groups

The following tables are introduced by the [migration sequence](repository-reference.md#database-migrations). Later migrations modify their columns, policies, and functions, so the first file alone is not the final schema.

| Area | Tables | What to understand |
|---|---|---|
| Identity | `profiles`, `professor_applications`, `platform_admins`, `account_settings` | Accounts, role approval, administrator capability, saved settings |
| Classes | `workspaces`, `workspace_members`, `invitation_codes` | Classes, who belongs, and how people join |
| Activities | `activities`, `xray_cases`, `activity_reference_evaluations` | Assignments, private image metadata, Professor reference material |
| Student work | `student_submissions`, `faculty_evaluations` | Responses and Professor feedback |
| Activity AI | `ai_analyses`, `ai_feedback_releases` | Saved analysis, provenance, and release boundaries |
| Model registry | `model_releases`, `model_slots`, `model_activation_events` | Available releases, the active pointer, activation history |
| Other features | `legal_consents`, `notification_reads`, `learning_case_notes`, `admin_actions`, `site_announcements` | Consent, read state, private notes, audits, notices |

### 9.2 How the code asks for data

In the [Student submission action](../src/app/%28protected%29/student/activities/actions.ts), `supabase.rpc("save_student_activity_submission", ...)` calls a database function. In [auth/server.ts](../src/lib/auth/server.ts), `.from("profiles").select(...)` queries table fields.

Read both the returned `data` and `error`. A missing result is not proof that an object never existed: access restrictions or a failed request can also explain it. The UI usually translates these conditions into a safe message.

To understand a field, search its name through TypeScript and SQL. Check foreign keys, check constraints, grants, RLS policies, triggers, and the latest replacement of any function. A **trigger** runs automatically when a database event occurs; a **constraint** rejects data that breaks a rule. This project tests database behavior in [supabase/tests/database](repository-reference.md#database-tests).

### 9.3 Images and privacy

Professor activity images use the private `activity-cases` Storage bucket and signed access URLs; the [activity server module](../src/lib/activities/server.ts) and [upload actions](../src/app/%28protected%29/professor/activities/actions.ts) show the implementation. The database stores case metadata rather than placing image bytes in an ordinary text field.

The built-in gallery is different: its JPEGs are static files under `public/images/chexpert`, described by [cases.json](../src/lib/xray-library/cases.json). Files under `public` are served publicly. Do not put private uploads or credentials there. The [library README](../src/lib/xray-library/README.md) states that public redistribution permission for the dataset images cannot be confirmed from the supplied local agreement evidence.

### 9.4 Live updates (Realtime)

Most pages are rendered on the server, so they normally show new data only after navigation. **Supabase Realtime** keeps a connection open from the browser and announces database changes, so a page can call `router.refresh()` and render again with fresh data. Two small client components do this; neither displays anything.

| Listener | Mounted by | Listens for | Effect |
|---|---|---|---|
| [NotificationListener](../src/components/notification-listener.tsx) | [AppShell](../src/components/app-shell.tsx), wherever the bell appears | Inserts and updates on `activities` and `student_submissions`; a `feedback_released` broadcast on the user's private `notifications:<user id>` topic | Refreshes the page at most once a second, so the bell and an open activity page update |
| [ApplicationStatusListener](../src/components/professor/application-status-listener.tsx) | The [pending application page](../src/app/%28protected%29/professor/application/page.tsx) | Updates to the applicant's own `professor_applications` row, plus the tab regaining focus | Refreshes; an approved applicant is redirected to the Professor area |

Two kinds of message reach the browser:

- **Row changes.** A table joins the `supabase_realtime` publication, and Realtime applies that table's existing RLS, so each user only hears about rows they can already read. Only inserts and updates are subscribed, because Realtime does not apply RLS to deletes.
- **Empty broadcasts.** Students cannot read `faculty_evaluations` or `ai_feedback_releases`. Instead, a database trigger sends an empty `feedback_released` signal to the Student's own topic when an evaluation or their AI results are released, and the page refetches through its usual functions. A `realtime.messages` policy lets each user listen only on their own topic.

Read the [application](../supabase/migrations/20261118120000_professor_application_realtime.sql), [notification](../supabase/migrations/20261118130000_notification_realtime.sql), and [activity results](../supabase/migrations/20261118140000_live_activity_results.sql) migrations. **Local caveat:** the local Realtime server rejects the publishable key, so live updates fail silently on `localhost` and pages update on navigation instead. Live updates have been verified only on the hosted project. [Source: notification map card](../map/objects/learning/notification.md).

## 10. Follow the main features

### 10.1 Student submission: a complete form journey

Students answer by ticking labels from the model's 14 (for example `Cardiomegaly`, `Pleural Effusion`, or `No Finding`), optionally explaining each one in writing, and marking where each finding is on a heatmap. Answers are not scored automatically: the Professor grades them, using the answer key (section 10.2) as a guide.

```text
Activity page -> labels, written answers, heatmap brush -> Server Action -> validation
     -> save_student_activity_submission RPC -> database rules
     -> returned status -> refreshed pages, side-by-side feedback, Professor's grade
```

1. The [activity page](../src/app/%28protected%29/student/activities/%5BactivityId%5D/page.tsx) calls `requireRole("student")`, checks the ID, and loads activity/evaluation data.
2. It renders [StudentSubmissionForm](../src/components/activities/student-submission-form.tsx) and binds the activity ID to `saveStudentSubmission`. Under the checklist the form shows one optional text box per selected label and a [HeatmapPainter](../src/components/heatmap-painter.tsx) for the selected findings (see "The heatmap brush" below).
3. The [action](../src/app/%28protected%29/student/activities/actions.ts) checks the ID, authenticated user, Student profile, draft/final intent, and confirmation for a final submission. It reads the `answer:<label>` fields and the hidden `heatmap` field (2,744 numbers from 0 to 1, or empty), and asks the database whether this activity needs a heatmap (`activity_requires_student_heatmap`, true when the key has maps).
4. [Validation](../src/lib/submissions/validation.ts) keeps only known labels and requires at least one; `No Finding` cannot be combined with other labels. Written answers are trimmed and limited to 2,000 characters. A final submission needs at least one marked cell for every selected finding when the key has maps. In the form, `toggleLabel` enforces the label rule while the Student clicks, and `unpaintedFindings` blocks the confirmation dialog until every finding is marked.
5. `save_student_activity_submission` enforces the database workflow: membership, deadlines, finality, the same label rule (`private.valid_answer_labels`), that the activity has an answer key, and the heatmap rule (returning `heatmap_required`). It stores `selected_labels`, `label_answers` and `student_heatmap`, and computes no score. Read the [answers and heatmaps migration](../supabase/migrations/20261117120000_student_label_answers_and_heatmaps.sql), which replaced the label scoring of the [answer-key migration](../supabase/migrations/20261116120000_professor_validated_answer_key.sql).
6. The action translates returned statuses into messages and revalidates relevant paths so subsequent rendering reads updated data.
7. After a final submission, [AI feedback](../src/components/activities/activity-ai-feedback.tsx) shows the Professor-validated labels (selected, missed, extra) with the Student's written answers, and [HeatmapComparison](../src/components/heatmap-comparison.tsx) shows the Student's heatmap beside the key's for each finding. [Faculty evaluation](../src/components/activities/student-faculty-evaluation.tsx) appears once the Professor releases it; that grade is the only grade.

Activities published before answer keys existed accept no new answers. Older submissions keep what they stored; no special handling applies to them.

#### The heatmap brush

Both the Professor's answer key and the Student's answer use [HeatmapPainter](../src/components/heatmap-painter.tsx). It edits one 14×14 map per finding, the same grid as the AI's class activation maps, so all three maps can be compared directly. The maths lives in [heatmap-brush.ts](../src/lib/heatmap-brush.ts), as pure functions with [unit tests](../src/lib/heatmap-brush.test.ts):

- **Size** (1–8 cells), **Strength** (10–100%) and **Hardness** (0–100%) shape a round brush; Mark or Erase picks the direction.
- One stroke never goes past its strength, like opacity in an image editor; painting over the same area in a new stroke builds up. Painting computes `v + (1 − v) × mask`; erasing computes `v × (1 − mask)`.
- Values are rounded to 3 decimals, and anything below 0.01 becomes 0, so a faint speck does not count as "marked".
- Undo and Redo keep up to 50 steps. Shortcuts: `[` and `]` change the size, `B` marks, `E` erases, Ctrl+Z undoes, Ctrl+Shift+Z redoes. Keyboard users move a cell outline with the arrow keys and paint with Space or Enter.

Because painted cells can hold values between 0 and 1, code that asks "is this cell marked?" must check `> 0`, as `paintedLabels` does.

Practice explaining why a validation check in the browser cannot replace the database's deadline check. A user can send requests without following the intended screen sequence.

### 10.2 Professor activity and case upload

Start with [activity forms](../src/components/professor/activity-forms.tsx), then the [activity actions](../src/app/%28protected%29/professor/activities/actions.ts).

The Professor creates a draft, provides reference material, reserves a case, uploads it directly to private Storage with a signed upload token, confirms the upload, validates the AI's result into an answer key, and publishes. Server confirmation decodes the image with `sharp`, checks the chest gate and view detector, and calls `confirm_activity_case_upload`. Upload inputs require JPEG/PNG within the configured size limit and a de-identification/frontal-view attestation. A classifier check does not establish that identifying information has been removed.

The [ActivityAIStatus component](../src/components/activities/activity-ai-status.tsx) starts analysis from the Professor's browser as soon as a draft's case is ready, or can retry after interruption. It claims an attempt, runs inference, and records completion through [activity AI actions](../src/lib/activity-ai/actions.ts). This is not a server background queue.

#### The answer key

```text
Draft + ready case -> AI analysis -> AnswerKeyForm (tick labels, repaint heatmaps with the brush)
     -> saveAnswerKeyAction -> save_activity_answer_key RPC -> publish
```

1. [AnswerKeyForm](../src/components/professor/answer-key-form.tsx) starts with the AI's findings ticked. The Professor ticks the labels that are actually true and can repaint each finding's heatmap with the [heatmap brush](#the-heatmap-brush); "Reset to AI" restores a finding's AI map, and can itself be undone. Professors see the AI's finding labels but never its probabilities.
2. `saveAnswerKeyAction` in the [activity actions](../src/app/%28protected%29/professor/activities/actions.ts) calls `save_activity_answer_key`, which accepts the key only while the activity is a draft with a ready analysis. It stores `validated_labels`, `validated_heatmap`, and `validated_at` on `activity_reference_evaluations`.
3. Publishing requires the key. After publishing, the database rejects any change to it, and the form shows it read-only.
4. Replacing a draft's case or deleting the draft drops its AI result and key, so the Professor must validate again.

The form also shows how much of the key the AI found on its own (`aiAccuracy`, for example "2 of 3 (67%)"). That line compares the model with the Professor; it is not a clinical accuracy measure.

### 10.3 Other feature reading paths

| Feature | Read the interface, then the logic/data boundary |
|---|---|
| Workspace creation, invitation, roster | [Professor forms](../src/components/professor/professor-forms.tsx), [Professor actions](../src/app/%28protected%29/professor/actions.ts), [workspace data](../src/lib/workspaces/server.ts), workspace migrations |
| Join/leave workspace | [Invitation form](../src/components/student/invitation-form.tsx), [Student actions](../src/app/%28protected%29/student/actions.ts) |
| Professor application review | [Review form](../src/components/admin/application-review-form.tsx), [Admin actions](../src/app/%28protected%29/admin/actions.ts), [review email](../src/lib/email/server.ts) (a fresh approval or rejection emails the applicant through Resend; if the email fails, the review still saves), [live status listener](../src/components/professor/application-status-listener.tsx) |
| Account administration and announcements | [Admin pages](../src/app/%28protected%29/admin/page.tsx), [Admin data](../src/lib/admin/server.ts), [console migration](../supabase/migrations/20261111120000_admin_console.sql) |
| Professor evaluation | [Evaluation form](../src/components/professor/faculty-evaluation-form.tsx), [submission review actions](../src/app/%28protected%29/professor/submissions/actions.ts), [evaluation validation](../src/lib/evaluations/validation.ts), [evaluation data](../src/lib/evaluations/server.ts) |
| Class analytics and CSV | [Analytics page](../src/app/%28protected%29/professor/analytics/page.tsx), [summary](../src/lib/analytics/summary.ts), [queries](../src/lib/analytics/server.ts), [CSV handler](../src/app/%28protected%29/professor/analytics/export/route.ts) |
| Profile/security settings | [Settings form](../src/components/settings/settings-form.tsx), [settings actions](../src/app/%28protected%29/settings/actions.ts), [settings validation](../src/lib/settings/validation.ts) |
| Notification bell | [Bell](../src/components/notification-bell.tsx), [notification queries](../src/lib/notifications/server.ts), [shared actions](../src/app/%28protected%29/actions.ts), [live listener](../src/components/notification-listener.tsx) (section 9.4) |
| Private library notes | [LearningNotes](../src/components/learning/learning-notes.tsx), [shared actions](../src/app/%28protected%29/actions.ts), [notes migration](../supabase/migrations/20261030120000_learning_case_notes.sql) |
| Terms and privacy consent | [Terms page](../src/app/terms/page.tsx), [privacy page](../src/app/privacy-policy/page.tsx), [version constants](../src/lib/legal/privacy.ts), auth actions and consent migration |

A library note is persisted, even though the Learning Mode image analysis itself is transient. Avoid the blanket statement that nothing in Learning Mode is saved.

## 11. Understand the AI pipeline

### 11.1 First distinguish using a model from training one

The web application runs a prepared ONNX model. Offline Python tools define/export model architectures and train the small gate/detector classifiers. The main classifier's training history is documented in [models.md](models.md) and the [training map](../map/objects/inference/model-training.md); the complete main training dataset/checkpoints are not tracked application source. [Sources: model-export README](../model-export/README.md), [.gitignore](../.gitignore).

### 11.2 Follow a Learning Mode image

```text
Choose a local file or gallery case
  -> validate file -> decode -> chest X-ray gate
  -> prepare the image tensor
  -> resolve/download/verify the active model and run it
  -> convert logits to probabilities and apply thresholds
  -> display findings, report wording, and heatmaps
```

The diagram summarizes responsibilities; [runtime.ts](../src/lib/inference/runtime.ts) starts model resolution and image decoding together, and session loading happens when inference is requested.

| Stage | Source | Beginner explanation |
|---|---|---|
| User interaction | [learning-mode-analyzer.tsx](../src/components/learning/learning-mode-analyzer.tsx) | Stores file/progress/result/error state and starts analysis. |
| Model agreement | [contract.ts](../src/lib/inference/contract.ts) | Defines allowed model metadata, label order, input/output expectations, and validation. |
| Runtime | [runtime.ts](../src/lib/inference/runtime.ts) | Resolves the active release, verifies downloaded model bytes, manages sessions, and executes inference. |
| Image preparation | [preprocess.ts](../src/lib/inference/preprocess.ts) | Decodes and converts image values to the model's expected numeric array. |
| Output interpretation | [postprocess.ts](../src/lib/inference/postprocess.ts) | Applies sigmoid, thresholds, finding rules, and template-based report text. |
| Heatmap interpretation | [attention.ts](../src/lib/inference/attention.ts) | Checks and interprets supported map formats. |
| Presentation | [analysis-findings.tsx](../src/components/analysis-findings.tsx), [attention-heatmap.tsx](../src/components/attention-heatmap.tsx), [result-dialog.tsx](../src/components/result-dialog.tsx) | Displays the prepared result. |

The report is assembled from label scores and text templates in `postprocess.ts`; this path does not call a text-generating chat model.

### 11.3 The numerical terms

- A **tensor** is an array with a defined shape. The classifier input is float32 `[batch, 1, 224, 224]`: a batch of single-channel images with width and height 224.
- A **logit** is a raw model output. The code converts it with sigmoid: `p = 1 / (1 + exp(-logit))`. For a logit of zero, `p = 1 / (1 + 1) = 0.5`.
- A **threshold** is a per-label cutoff. This code includes equality: `probability >= threshold`.
- This is a multi-label result: probabilities are not required to add to one. Each label receives its own sigmoid.
- If an abnormal label passes its threshold, the displayed main findings suppress `No Finding`. If no main finding passes, the state is `no-threshold-match`.
- Optional lower thresholds produce a possible-finding tier. Consult the runtime, persistence adapter, and SQL when changing it; do not assume old release documentation covers every later migration.
- A **heatmap** visualizes model-derived values over the image. A map is not a clinical segmentation or a guarantee that a region is correctly identified.

[Sources: model contract](../src/lib/inference/contract.ts), [preprocessing](../src/lib/inference/preprocess.ts), [postprocessing](../src/lib/inference/postprocess.ts), [attention guide](../src/components/learning/attention-maps-content.tsx).

### 11.4 Providers and contract versions

ONNX Runtime Web can use WebGPU or WebAssembly (WASM). The runtime considers both browser capability and release configuration, and falls back to WASM on the handled WebGPU failures. Do not promise that a user's GPU will be used or that runtime speed is the same across devices. [Source: runtime](../src/lib/inference/runtime.ts).

| Model contract | Additional map behavior |
|---|---|
| V1 | Logits without an available heatmap |
| V2 | A global, class-agnostic 7 by 7 attention map |
| V3 | One 14 by 14 class activation map for each of 14 labels |

V3 contains `14 × 14 × 14 = 2,744` map values. Preserving the fixed label order matters: changing it can associate scores/maps with the wrong names. Model manifests, app parsing, export fixtures, and database checks must agree. [Sources: contract](../src/lib/inference/contract.ts), [release operations](model-releases.md), [V3 migration](../supabase/migrations/20261029120000_class_activation_maps.sql).

### 11.5 Two smaller classifiers

[chest-gate](../src/lib/chest-gate/index.ts) checks whether an image resembles a chest X-ray. Learning Mode requests this check in the browser; Professor upload confirmation runs a server version. [view-detector](../src/lib/view-detector/index.ts) checks for lateral images during Professor upload. Learning Mode accepts both views at its interface; that does not establish equivalent model performance for both views. See the [library caveat](../src/lib/xray-library/README.md).

Their `features.ts` modules prepare features, `weights.json` stores learned parameters, and Python training tools live in `model-export`. They are distinct from the 14-label disease classifier.

### 11.6 Model release operations are an advanced topic

A **release bundle** combines a model, manifest inputs, thresholds, fixtures (known inputs/outputs), and export evidence. **Stage** uploads/registers an inactive candidate. **Activate** changes the registry slot's active pointer using an expected revision. **Rollback** selects an earlier release. These operations are implemented by [scripts/model-release.ts](../scripts/model-release.ts) and database migrations, with the exact procedure in [model-releases.md](model-releases.md).

Do not run publisher commands against a hosted project as a beginner exercise. Use a local environment and the release runbook with a teammate who understands the credentials and revision checks. Changing a UI label does not require exporting or activating a new model.

## 12. Scripts, Python, assets, and project settings

### 12.1 Maintenance tools

| File/group | Purpose |
|---|---|
| [prepare-ort-assets.mjs](../scripts/prepare-ort-assets.mjs) | Copies the pinned ONNX Runtime assets into ignored `public/ort/1.27.0`; used automatically before dev/build/browser tests. |
| [model-release.ts](../scripts/model-release.ts) | Validates, stages, inspects, activates, and rolls back model releases. |
| [import-chexpert-library.ps1](../scripts/import-chexpert-library.ps1) | Imports gallery images and their manifest from the source dataset. Read the library README before use. |
| [dump-chest-features.mts](../scripts/dump-chest-features.mts), [dump-view-features.mts](../scripts/dump-view-features.mts) | Writes features/labels used by the small classifier training tools. |
| [scripts/guides](../scripts/guides/attention-maps.html) | HTML source, header/footer art, and a Playwright script rendering the attention guide PDF. |
| [model-export](../model-export/README.md) | TinyViT, SqueezeViT, and FastViT definitions/exporters; preprocessing/localization tools; gate/detector training; Python tests and dependency pins. |

The PDF renderer can be run as `node scripts/guides/render-attention-guide.mjs` after dependencies and Chromium are installed. It overwrites the generated `public/guides/attention-maps.pdf`, so inspect the output if you intentionally edit that guide. [Source: renderer](../scripts/guides/render-attention-guide.mjs).

### 12.2 Configuration and supporting files

| File/group | Why it exists |
|---|---|
| [package.json](../package.json) | Direct package versions and named npm scripts |
| [package-lock.json](../package-lock.json) | The resolved npm dependency tree; do not hand-edit it to fix application logic |
| [tsconfig.json](../tsconfig.json) | TypeScript checking, JSX support, and `@` path mapping |
| [next.config.ts](../next.config.ts) | Next.js configuration, including the `frame-ancestors 'none'` response header |
| [eslint.config.mjs](../eslint.config.mjs) | Lint rules and ignored generated paths |
| [postcss.config.mjs](../postcss.config.mjs) | Tailwind's PostCSS plugin |
| [vitest.config.mts](../vitest.config.mts) | Separate Node and real-browser test projects |
| [.env.example](../.env.example) | Variable names/placeholders; real environment files are local |
| [supabase/config.toml](../supabase/config.toml) | Local service configuration, including CAPTCHA and TOTP settings |
| [supabase/templates](../supabase/templates/confirmation.html) | Auth email HTML, distinct from application page components |
| [LICENSE](../LICENSE) | Code license; dataset/model rights are separately described in the README |
| [AGENTS.md](../AGENTS.md), [CLAUDE.md](../CLAUDE.md), `.claude`, [skills-lock.json](../skills-lock.json) | Coding-assistant instructions and tooling; these do not create app routes |
| [map](../map/CLAUDE.md) | Object/process/change-impact reference, plus historical product/design documents |
| `manuscript-*.md` | Supporting manuscript notes, outside the runtime application |

The complete [file reference](repository-reference.md) also accounts for icons, static images, vendored assistant resources, SQL snippets, and tests. A file existing in the repo does not prove that a live feature uses it; check imports or references before declaring it active.

## 13. Make your first changes

These are suggested lessons, not changes already made by this guide.

### Exercise A: change one visible sentence

1. Start the app locally and open the landing page.
2. Locate the sentence in [app/page.tsx](../src/app/page.tsx) or a component it imports. Use your editor's search.
3. Edit only the displayed text. Preserve JSX tags, quotation marks, and braces. Avoid legal or AI interpretation wording for this first lesson.
4. Save and confirm the intended sentence changes in the browser.
5. Check a narrow viewport and keyboard navigation around the changed content.
6. Run `git diff` and explain every changed line. Undo your own sentence edit in the editor if this is only practice.

Completion check: the learner can identify which file owns the text and describe what changed without copying someone else's explanation.

### Exercise B: understand a pure function through tests

Use the [submission validation tests](../src/lib/submissions/validation.test.ts). The painting cases are a good start: work out by hand which findings `paintedLabels` and `unpaintedFindings` report before running them. Then try the [brush tests](../src/lib/heatmap-brush.test.ts): with the formulas in section 10.1, predict the value after two 30% strokes.

1. Read one test name and its input object.
2. Predict the expected output before running it.
3. Read the corresponding validator and explain why it produces that result.
4. Run only that file:

```powershell
npm test -- src/lib/submissions/validation.test.ts
```

5. In a practice branch, add a meaningful input case you can explain. Run it and inspect the result.

Completion check: the learner can distinguish normalization, validation, and saving. They do not change database limits just to make a test pass.

### Exercise C: trace a saved form

Trace [LearningNotes](../src/components/learning/learning-notes.tsx) to `saveLearningNoteAction` in [shared actions](../src/app/%28protected%29/actions.ts), then the [notes migration](../supabase/migrations/20261030120000_learning_case_notes.sql).

Find the case ID field, body field, pending state, success/error message, authentication check, length rule, and ownership policy. With local accounts, save a note and verify that a second account cannot read it. An expected privacy result is as important as a successful save.

Completion check: the learner can draw the path from form input to database row and back to the screen.

### A small-change Git workflow

First inspect your working tree. Coordinate with teammates if it contains their unfinished edits; creating a branch in the same working tree does not isolate those edits.

```powershell
git status
git switch -c docs-or-practice/my-small-change
```

Make one understandable change, run the relevant checks, and inspect `git diff`. Stage only the files you intentionally changed, using `git add` followed by their paths. Inspect `git diff --staged` before committing. Share through your group's review process; do not merge or deploy an exercise to production merely because it runs on one computer.

## 14. Check your work and investigate errors

### 14.1 What the checks do

These commands are defined by [package.json](../package.json), [Vitest configuration](../vitest.config.mts), and the [Supabase/model export READMEs](../supabase/README.md).

| Command | Checks | What it does not establish by itself |
|---|---|---|
| `npm test` | Node-based unit/action tests selected by the unit project | Full browser interaction or live hosted database behavior |
| `npm run test:model:browser` | All browser-project tests, including components and preprocessing conformance | Every deployed user journey or parity of a real exported model |
| `npm run lint` | Static lint rules | That a feature works at runtime |
| `npm run build` | Production compilation/build | Correctness of every role's access and workflow |
| `npx tsc --noEmit` | Type checking using the project configuration | That untrusted runtime input is valid |
| `npx supabase test db` | pgTAP database behavior tests against the local stack | The state of a different hosted project |
| `python -m unittest discover -s model-export -p "test_*.py"` | Offline exporter/model utility checks | Application UI behavior; Python dependencies must be installed |

Install Chromium before browser tests:

```powershell
npx playwright install chromium
```

The [test manifest helper](../src/lib/inference/test-manifest.ts) supplies synthetic metadata for tests, and the [browser preprocessing tests](../src/lib/inference/preprocess.browser.test.ts) generate images with a canvas. Passing those checks does not validate a real trained release. Actual bundle evidence and provider parity belong to `model:validate`, described in the [release runbook](model-releases.md). No active local model and no local validation bundle are separate conditions; neither is repaired by changing a button component.

For a text edit, inspect the actual screen and run the relevant static checks. For behavior changes, run tests covering that behavior and demonstrate the successful and failure paths. For database permission changes, use database tests with accounts that should be allowed and accounts that should be denied.

### 14.2 A repeatable debugging method

1. Write down the exact action and expected result.
2. Reproduce the problem locally.
3. Read the first relevant terminal/browser error, including its file and line.
4. Identify the layer: rendering, form state, action, authentication, database, Storage, or model runtime.
5. Follow the data through that boundary. Check both input and returned error/status.
6. Make the smallest change supported by the evidence.
7. Repeat the original action and the relevant test. Confirm a neighboring behavior still works.

Do not paste passwords, tokens, private images, or service keys into error reports.

| Symptom | First places to inspect |
|---|---|
| `npm` command not found | Node installation and terminal PATH |
| `package.json` not found | Current terminal folder |
| Local Supabase will not start | Docker availability, command output, `.env`, and `config.toml` |
| Auth rejects CAPTCHA | Local test site key/secret pair and whether environment changes were restarted |
| Professor is redirected to application status | Approval state and `requireRole` |
| Data is unavailable | Auth/session, membership, RLS/RPC errors, and migration state |
| `two_step_required` | `/login/verify`, assurance level, and two-step database enforcement |
| AI says no active model | The local registry slot and model release setup |
| Runtime assets fail to load | `prepare:ort`, pinned package version, and `/ort/1.27.0` requests |
| A case image will not display | Signed URL, expiry, Storage access, and case upload state |
| Activity analysis remains pending | Professor-browser workflow (the draft page must stay open), claim lease, and stored safe error/status |
| Publish is refused | Whether the draft has a ready AI analysis and a saved answer key |
| Student cannot answer an activity | Older activities published without an answer key take no new answers |
| A page does not update live | Expected on `localhost` (section 9.4); on hosted, the browser console, the table's publication membership, and RLS |
| An applicant gets no review email | `RESEND_API_KEY` and `EMAIL_FROM` on the server, the administrator's success message, and Resend's dashboard |
| Build fails loading fonts | Root layout's `next/font/google` imports and the actual build/network error |

These are investigation starting points, not diagnoses. Confirm the cause before editing source.

## 15. A teaching plan for the group

This sequence is a suggested curriculum. Advance when the learner can demonstrate the outcome; it is not a promise about how quickly someone will learn.

| Lesson | Work together | Learner demonstrates |
|---|---|---|
| 1. Files and commands | Open the repo, identify folders, run local dev | Starts/stops the app and identifies the repo root |
| 2. HTML, CSS, JSX | Inspect one page and make Exercise A's text edit | Explains tags, props, and a style class |
| 3. TypeScript basics | Read objects, functions, conditionals, and a test | Predicts a function's result for a given input |
| 4. Components and state | Follow selection/progress/error state in Learning Mode | Explains why the screen changes after an event |
| 5. Saved forms | Trace notes or submission with Exercise C | Identifies client input, action checks, and persistence |
| 6. Accounts and data | Compare two local roles and workspace membership | Explains authentication versus authorization |
| 7. Tests and debugging | Reproduce a local error and verify a small fix | Connects evidence to the fix and shows the check |
| 8. AI overview | Trace preprocessing, runtime, and postprocessing | Distinguishes model inference, thresholds, and displayed wording |
| 9. Contribution | Complete one small reviewed change | Explains the diff, verification, and affected features |

During each lesson, let the learner operate the keyboard. Ask them to predict the next step, run it, and explain the result. If a section is too advanced, return to a smaller example; they do not need to understand ONNX export to contribute a page improvement.

Useful review questions:

- Which file owns this behavior, and how did you find it?
- Does this code execute in the browser, on the server, or in the database?
- What happens with missing input, an unauthorized account, or a failed request?
- Which values are temporary and which are saved?
- Which other screen uses this component or function?
- What evidence shows the change works?

## 16. Keep the documentation useful

The [README](../README.md) is the setup/overview entry point. This guide teaches the application. The [file reference](repository-reference.md) helps locate files. The [system map](../map/CLAUDE.md) records detailed objects, processes, and change impact. [models.md](models.md), [model-releases.md](model-releases.md), and the [export README](../model-export/README.md) cover specialized model work.

When behavior changes, update its walkthrough and source links in the same change. Refresh the file inventory when files are added or removed. Preserve the distinction between code evidence, historical documentation, and an actual deployed-state check.

Before using a guide for a demonstration, confirm the revision, checkout changes, environment, local migrations, and required model artifacts. If one of those is unavailable, state what cannot be confirmed instead of presenting the documented workflow as a successful live test.

Documentation verification for this edition checked local link targets, the contents anchors, code-fence pairs, and coverage of all tracked files at the baseline. Application tests, a fresh installation, and database resets were not run for this documentation change. An attempt to inspect Supabase CLI help failed because the sandbox denied its telemetry-file write outside the workspace; the setup commands above follow the existing repository runbooks, rather than a successful fresh CLI/setup execution here.
