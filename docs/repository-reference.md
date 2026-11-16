# ThoraxScan repository reference

[Start with the beginner guide](beginner-guide.md). This reference helps you find files after you understand the main concepts.

Inventory baseline: `a25613a`, reviewed 16 November 2026. It accounts for all 645 tracked files at that commit, plus the two files added by the answer-key commit `2f9a6d1` (updated 17 November 2026), for 647. It excludes generated/ignored files, the guide/reference themselves, and uncommitted work. Files added after `2f9a6d1` may be missing.

Export names below were extracted from source declarations at the baseline. They are navigation aids, not a complete function/API specification. Migration topics come from filenames; read the SQL and later replacements to establish actual behavior. Links open the current checkout, so declarations may differ after edits.

| Area | Tracked files at `2f9a6d1` |
|---|---:|
| [Root configuration and notes](#root-configuration-and-notes) | 17 |
| [Application routes and actions](#application-routes-and-actions) | 52 |
| [Interface components](#interface-components) | 59 |
| [Application libraries](#application-libraries) | 63 |
| [Request proxy](#request-proxy) | 1 |
| [Database migrations](#database-migrations) | 33 |
| [Database tests](#database-tests) | 16 |
| [Database configuration and supporting files](#database-configuration-and-supporting-files) | 10 |
| [Maintenance scripts](#maintenance-scripts) | 9 |
| [Offline model tooling](#offline-model-tooling) | 18 |
| [Public assets](#public-assets) | 259 |
| [Specialized documentation](#specialized-documentation) | 2 |
| [System map and planning documents](#system-map-and-planning-documents) | 91 |
| [Assistant tooling](#assistant-tooling) | 17 |

## Files created for this guide

- [beginner-guide.md](beginner-guide.md): beginner lessons, setup, architecture, feature traces, exercises, and verification.
- [repository-reference.md](repository-reference.md): this baseline inventory.

## Root configuration and notes

| File | Navigation notes |
|---|---|
| [.env.example](../.env.example) | Environment variable placeholders; not real credentials. |
| [.gitignore](../.gitignore) | Files excluded from normal Git tracking. |
| [AGENTS.md](../AGENTS.md) | Next.js instructions for coding assistants. |
| [CLAUDE.md](../CLAUDE.md) | Assistant entry point pointing to AGENTS.md and the system map. |
| [LICENSE](../LICENSE) | Application code license; check README for dataset/model exclusions. |
| [README.md](../README.md) | Project overview, setup, operations, and links. |
| [eslint.config.mjs](../eslint.config.mjs) | Default-exported configuration/module. |
| [manuscript-evaluation.md](../manuscript-evaluation.md) | Supporting manuscript notes; not application runtime code. |
| [manuscript-tech-stack-updates.md](../manuscript-tech-stack-updates.md) | Supporting manuscript notes; not application runtime code. |
| [manuscript-two-step-login-updates.md](../manuscript-two-step-login-updates.md) | Supporting manuscript notes; not application runtime code. |
| [next.config.ts](../next.config.ts) | Default-exported configuration/module. |
| [package-lock.json](../package-lock.json) | Resolved npm dependency lockfile. |
| [package.json](../package.json) | npm scripts and direct dependency declarations. |
| [postcss.config.mjs](../postcss.config.mjs) | Default-exported configuration/module. |
| [skills-lock.json](../skills-lock.json) | Assistant skill installation/version metadata. |
| [tsconfig.json](../tsconfig.json) | TypeScript compiler configuration and source alias. |
| [vitest.config.mts](../vitest.config.mts) | Default-exported configuration/module. |

## Application routes and actions

| File | Navigation notes |
|---|---|
| [src/app/(auth)/actions.test.ts](../src/app/%28auth%29/actions.test.ts) | Automated Node-project test. |
| [src/app/(auth)/actions.ts](../src/app/%28auth%29/actions.ts) | Server Actions; Declared exports: `registerAction`, `loginAction`, `verifyTwoStepAction`, `forgotPasswordAction`, `resetPasswordAction`. |
| [src/app/(auth)/forgot-password/page.tsx](../src/app/%28auth%29/forgot-password/page.tsx) | Declared exports: `metadata`, `ForgotPasswordPage`. |
| [src/app/(auth)/login/page.tsx](../src/app/%28auth%29/login/page.tsx) | Declared exports: `metadata`, `LoginPage`. |
| [src/app/(auth)/login/verify/page.tsx](../src/app/%28auth%29/login/verify/page.tsx) | Declared exports: `metadata`, `VerifyLoginPage`. |
| [src/app/(auth)/register/page.tsx](../src/app/%28auth%29/register/page.tsx) | Declared exports: `metadata`, `RegisterPage`. |
| [src/app/(auth)/reset-password/page.tsx](../src/app/%28auth%29/reset-password/page.tsx) | Declared exports: `metadata`, `ResetPasswordPage`. |
| [src/app/(protected)/actions.test.ts](../src/app/%28protected%29/actions.test.ts) | Automated Node-project test. |
| [src/app/(protected)/actions.ts](../src/app/%28protected%29/actions.ts) | Server Actions; Declared exports: `logoutAction`, `openNotificationAction`, `markAllNotificationsReadAction`, `saveLearningNoteAction`. |
| [src/app/(protected)/admin/accounts/page.tsx](../src/app/%28protected%29/admin/accounts/page.tsx) | Declared exports: `metadata`, `AdminAccountsPage`. |
| [src/app/(protected)/admin/actions.ts](../src/app/%28protected%29/admin/actions.ts) | Server Actions; Declared exports: `reviewProfessorApplicationAction`, `grantPlatformAdminAction`, `revokePlatformAdminAction`, `manageAccountAction`, `postNoticeAction`; more in source. |
| [src/app/(protected)/admin/applications/page.tsx](../src/app/%28protected%29/admin/applications/page.tsx) | Declared exports: `metadata`, `AdminApplicationsPage`. |
| [src/app/(protected)/admin/notices/page.tsx](../src/app/%28protected%29/admin/notices/page.tsx) | Declared exports: `metadata`, `AdminNoticesPage`. |
| [src/app/(protected)/admin/page.tsx](../src/app/%28protected%29/admin/page.tsx) | Declared exports: `metadata`, `AdminPage`. |
| [src/app/(protected)/admin/report/route.ts](../src/app/%28protected%29/admin/report/route.ts) | Declared exports: `GET`. |
| [src/app/(protected)/dashboard/page.tsx](../src/app/%28protected%29/dashboard/page.tsx) | Declared exports: `DashboardPage`. |
| [src/app/(protected)/professor/actions.ts](../src/app/%28protected%29/professor/actions.ts) | Server Actions; Declared exports: `createWorkspaceAction`, `renameWorkspaceAction`, `createInvitationAction`, `revokeInvitationAction`, `redeemInvitationAction`; more in source. |
| [src/app/(protected)/professor/activities/[activityId]/page.tsx](../src/app/%28protected%29/professor/activities/%5BactivityId%5D/page.tsx) | Declared exports: `metadata`, `ProfessorActivityPage`. |
| [src/app/(protected)/professor/activities/actions.ts](../src/app/%28protected%29/professor/activities/actions.ts) | Server Actions; Declared exports: `createActivityDraftAction`, `updateActivityAction`, `prepareCaseUploadAction`, `confirmCaseUploadAction`, `removeActivityCaseAction`; more in source. |
| [src/app/(protected)/professor/activities/case-removal.test.ts](../src/app/%28protected%29/professor/activities/case-removal.test.ts) | Automated Node-project test. |
| [src/app/(protected)/professor/activities/new/page.tsx](../src/app/%28protected%29/professor/activities/new/page.tsx) | Declared exports: `metadata`, `NewProfessorActivityPage`. |
| [src/app/(protected)/professor/activities/page.tsx](../src/app/%28protected%29/professor/activities/page.tsx) | Declared exports: `metadata`, `ProfessorActivitiesPage`. |
| [src/app/(protected)/professor/analytics/export/route.ts](../src/app/%28protected%29/professor/analytics/export/route.ts) | Declared exports: `GET`. |
| [src/app/(protected)/professor/analytics/page.tsx](../src/app/%28protected%29/professor/analytics/page.tsx) | Declared exports: `metadata`, `AnalyticsPage`. |
| [src/app/(protected)/professor/application/page.tsx](../src/app/%28protected%29/professor/application/page.tsx) | Declared exports: `metadata`, `ProfessorApplicationPage`. |
| [src/app/(protected)/professor/attention/page.tsx](../src/app/%28protected%29/professor/attention/page.tsx) | Declared exports: `metadata`, `ProfessorAttentionPage`. |
| [src/app/(protected)/professor/learning/page.tsx](../src/app/%28protected%29/professor/learning/page.tsx) | Declared exports: `metadata`, `ProfessorLearningPage`. |
| [src/app/(protected)/professor/page.tsx](../src/app/%28protected%29/professor/page.tsx) | Declared exports: `metadata`, `ProfessorPage`. |
| [src/app/(protected)/professor/settings/page.tsx](../src/app/%28protected%29/professor/settings/page.tsx) | Declared exports: `metadata`, `ProfessorSettingsPage`. |
| [src/app/(protected)/professor/submissions/[submissionId]/page.tsx](../src/app/%28protected%29/professor/submissions/%5BsubmissionId%5D/page.tsx) | Declared exports: `metadata`, `SubmissionPage`. |
| [src/app/(protected)/professor/submissions/actions.ts](../src/app/%28protected%29/professor/submissions/actions.ts) | Server Actions; Declared exports: `saveFacultyEvaluationAction`, `releaseFacultyEvaluationAction`. |
| [src/app/(protected)/professor/submissions/page.tsx](../src/app/%28protected%29/professor/submissions/page.tsx) | Declared exports: `metadata`, `SubmissionsPage`. |
| [src/app/(protected)/professor/workspaces/[workspaceId]/page.tsx](../src/app/%28protected%29/professor/workspaces/%5BworkspaceId%5D/page.tsx) | Declared exports: `metadata`, `ProfessorWorkspacePage`. |
| [src/app/(protected)/settings/actions.test.ts](../src/app/%28protected%29/settings/actions.test.ts) | Automated Node-project test. |
| [src/app/(protected)/settings/actions.ts](../src/app/%28protected%29/settings/actions.ts) | Server Actions; Declared exports: `updateAccountSettingsAction`, `changePasswordAction`, `changeEmailAction`, `twoStepAction`. |
| [src/app/(protected)/student/actions.ts](../src/app/%28protected%29/student/actions.ts) | Server Actions; Declared exports: `redeemInvitationAction`. |
| [src/app/(protected)/student/activities/[activityId]/page.tsx](../src/app/%28protected%29/student/activities/%5BactivityId%5D/page.tsx) | Declared exports: `metadata`, `StudentActivityPage`. |
| [src/app/(protected)/student/activities/actions.ts](../src/app/%28protected%29/student/activities/actions.ts) | Server Actions; Declared exports: `saveStudentSubmission`. |
| [src/app/(protected)/student/activities/page.tsx](../src/app/%28protected%29/student/activities/page.tsx) | Declared exports: `metadata`, `StudentActivitiesPage`. |
| [src/app/(protected)/student/attention/page.tsx](../src/app/%28protected%29/student/attention/page.tsx) | Declared exports: `metadata`, `StudentAttentionPage`. |
| [src/app/(protected)/student/learning/page.tsx](../src/app/%28protected%29/student/learning/page.tsx) | Declared exports: `metadata`, `StudentLearningPage`. |
| [src/app/(protected)/student/page.tsx](../src/app/%28protected%29/student/page.tsx) | Declared exports: `metadata`, `StudentPage`. |
| [src/app/(protected)/student/settings/page.tsx](../src/app/%28protected%29/student/settings/page.tsx) | Declared exports: `metadata`, `StudentSettingsPage`. |
| [src/app/(protected)/student/workspaces/[workspaceId]/page.tsx](../src/app/%28protected%29/student/workspaces/%5BworkspaceId%5D/page.tsx) | Declared exports: `metadata`, `StudentWorkspacePage`. |
| [src/app/auth/confirm/route.test.ts](../src/app/auth/confirm/route.test.ts) | Automated Node-project test. |
| [src/app/auth/confirm/route.ts](../src/app/auth/confirm/route.ts) | Declared exports: `GET`. |
| [src/app/favicon.ico](../src/app/favicon.ico) | Static ICO asset; inspect references to establish usage. |
| [src/app/globals.css](../src/app/globals.css) | Global styles and design tokens. |
| [src/app/layout.tsx](../src/app/layout.tsx) | Declared exports: `metadata`, `RootLayout`. |
| [src/app/page.tsx](../src/app/page.tsx) | Declared exports: `Home`. |
| [src/app/privacy-policy/page.tsx](../src/app/privacy-policy/page.tsx) | Declared exports: `metadata`, `PrivacyPolicyPage`. |
| [src/app/terms/page.tsx](../src/app/terms/page.tsx) | Declared exports: `metadata`, `TermsPage`. |

## Interface components

| File | Navigation notes |
|---|---|
| [src/components/activities/activity-ai-feedback.browser.test.tsx](../src/components/activities/activity-ai-feedback.browser.test.tsx) | Automated browser test. |
| [src/components/activities/activity-ai-feedback.tsx](../src/components/activities/activity-ai-feedback.tsx) | Client entry; Declared exports: `ActivityAIFeedback`. |
| [src/components/activities/activity-ai-status.tsx](../src/components/activities/activity-ai-status.tsx) | Client entry; Declared exports: `ActivityAIStatus`. |
| [src/components/activities/activity-form-styles.ts](../src/components/activities/activity-form-styles.ts) | Declared exports: `activityFormMessageClass`, `activityFormHeadingClass`, `activityFormHeadingIconClass`, `activityFormHeadingKickerClass`, `activityFormHeadingTitleClass`. |
| [src/components/activities/activity-ui.tsx](../src/components/activities/activity-ui.tsx) | Declared exports: `ActivityPanelTitle`, `activityLayoutClass`, `activityCaseColumnClass`, `activityConfigColumnClass`, `activitiesCtaClass`; more in source. |
| [src/components/activities/student-faculty-evaluation.tsx](../src/components/activities/student-faculty-evaluation.tsx) | Declared exports: `StudentFacultyEvaluationPanel`. |
| [src/components/activities/student-submission-form.browser.test.tsx](../src/components/activities/student-submission-form.browser.test.tsx) | Automated browser test. |
| [src/components/activities/student-submission-form.tsx](../src/components/activities/student-submission-form.tsx) | Client entry; Declared exports: `StudentSubmissionForm`. |
| [src/components/admin/admin-shell.tsx](../src/components/admin/admin-shell.tsx) | Declared exports: `AdminShell`. |
| [src/components/admin/administrator-forms.tsx](../src/components/admin/administrator-forms.tsx) | Client entry; Declared exports: `AddAdministratorForm`, `RemoveAdministratorForm`, `ManageAccountForms`, `PostNoticeForm`, `RemoveNoticeForm`. |
| [src/components/admin/application-review-form.browser.test.tsx](../src/components/admin/application-review-form.browser.test.tsx) | Automated browser test. |
| [src/components/admin/application-review-form.tsx](../src/components/admin/application-review-form.tsx) | Client entry; Declared exports: `ApplicationReviewForm`. |
| [src/components/admin/review-styles.ts](../src/components/admin/review-styles.ts) | Declared exports: `reviewPanelClass`, `rejectionReasonClass`. |
| [src/components/analysis-findings.tsx](../src/components/analysis-findings.tsx) | Client entry; Declared exports: `AnalysisFindings`. |
| [src/components/app-shell.tsx](../src/components/app-shell.tsx) | Declared exports: `NavItem`, `AppShell`. |
| [src/components/app-sidebar.tsx](../src/components/app-sidebar.tsx) | Client entry; Declared exports: `AppSidebar`. |
| [src/components/attention-heatmap.browser.test.tsx](../src/components/attention-heatmap.browser.test.tsx) | Automated browser test. |
| [src/components/attention-heatmap.tsx](../src/components/attention-heatmap.tsx) | Client entry; Declared exports: `AttentionHeatmap`. |
| [src/components/auth/auth-form.tsx](../src/components/auth/auth-form.tsx) | Client entry; Declared exports: `AuthMode`, `AuthForm`. |
| [src/components/auth/auth-layout.tsx](../src/components/auth/auth-layout.tsx) | Declared exports: `AuthLayout`. |
| [src/components/brand.tsx](../src/components/brand.tsx) | Declared exports: `Brand`. |
| [src/components/confirm-dialog.tsx](../src/components/confirm-dialog.tsx) | Client entry; Declared exports: `ConfirmDialog`. |
| [src/components/contact-emails.tsx](../src/components/contact-emails.tsx) | Declared exports: `ContactEmails`. |
| [src/components/controls.ts](../src/components/controls.ts) | Declared exports: `button`, `field`, `textarea`, `badgeClass`. |
| [src/components/dashboard-ui.tsx](../src/components/dashboard-ui.tsx) | Declared exports: `glassPanelClass`, `sectionKickerClass`, `countBadgeClass`, `backLinkClass`, `listEmptyClass`; more in source. |
| [src/components/docs-section.tsx](../src/components/docs-section.tsx) | Declared exports: `DocsSection`. |
| [src/components/empty-state.tsx](../src/components/empty-state.tsx) | Declared exports: `EmptyState`. |
| [src/components/field-error.ts](../src/components/field-error.ts) | Declared exports: `fieldErrorText`, `fieldErrorClass`, `authEyebrowClass`. |
| [src/components/filter-form.tsx](../src/components/filter-form.tsx) | Client entry; Declared exports: `FilterForm`. |
| [src/components/landing-ui.tsx](../src/components/landing-ui.tsx) | Declared exports: `sectionShell`, `sectionTitle`, `sectionLead`, `glassCard`, `secondaryPill`; more in source. |
| [src/components/learning/attention-maps-content.tsx](../src/components/learning/attention-maps-content.tsx) | Declared exports: `sampleHeatmap`, `sampleHeatmapLabels`, `AttentionMapsContent`. |
| [src/components/learning/learning-mode-analyzer.browser.test.tsx](../src/components/learning/learning-mode-analyzer.browser.test.tsx) | Automated browser test. |
| [src/components/learning/learning-mode-analyzer.tsx](../src/components/learning/learning-mode-analyzer.tsx) | Client entry; Declared exports: `LearningModeAnalyzer`. |
| [src/components/learning/learning-mode-content.tsx](../src/components/learning/learning-mode-content.tsx) | Declared exports: `LearningModeContent`. |
| [src/components/learning/learning-notes.tsx](../src/components/learning/learning-notes.tsx) | Client entry; Declared exports: `LearningNotes`. |
| [src/components/learning/sample-heatmap.json](../src/components/learning/sample-heatmap.json) | Bundled sample heatmap data; check its consumers. |
| [src/components/learning/xray-library.tsx](../src/components/learning/xray-library.tsx) | Client entry; Declared exports: `XrayLibrary`. |
| [src/components/notification-bell.tsx](../src/components/notification-bell.tsx) | Declared exports: `NotificationBellButton`, `NotificationPanel`. |
| [src/components/password-toggle.tsx](../src/components/password-toggle.tsx) | Declared exports: `PasswordToggle`. |
| [src/components/professor/activity-forms.tsx](../src/components/professor/activity-forms.tsx) | Client entry; Declared exports: `ActivityDetailsForm`, `CaseUploadForm`, `ActivityLifecycleControls`. |
| [src/components/professor/answer-key-form.tsx](../src/components/professor/answer-key-form.tsx) | Client entry; Declared exports: `AnswerKeyForm`, `LabelTags`. The Professor's answer-key validation; see the [guide's answer-key walkthrough](beginner-guide.md#the-answer-key). |
| [src/components/professor/activity-library.browser.test.tsx](../src/components/professor/activity-library.browser.test.tsx) | Automated browser test. |
| [src/components/professor/faculty-evaluation-form.browser.test.tsx](../src/components/professor/faculty-evaluation-form.browser.test.tsx) | Automated browser test. |
| [src/components/professor/faculty-evaluation-form.tsx](../src/components/professor/faculty-evaluation-form.tsx) | Client entry; Declared exports: `FacultyEvaluationForm`. |
| [src/components/professor/professor-application-shell.tsx](../src/components/professor/professor-application-shell.tsx) | Declared exports: `ProfessorApplicationShell`. |
| [src/components/professor/professor-forms.tsx](../src/components/professor/professor-forms.tsx) | Client entry; Declared exports: `CreateWorkspaceForm`, `ProfessorRedeemForm`, `RenameWorkspaceForm`, `InvitationCreateForm`, `RevokeInvitationButton`; more in source. |
| [src/components/professor/professor-shell.tsx](../src/components/professor/professor-shell.tsx) | Declared exports: `ProfessorShell`. |
| [src/components/professor/review-styles.ts](../src/components/professor/review-styles.ts) | Declared exports: `reviewSurfaceClass`, `reviewHeadingClass`, `reviewCardClass`, `reviewCardTitleClass`, `reviewFieldLabelClass`; more in source. |
| [src/components/result-dialog.tsx](../src/components/result-dialog.tsx) | Client entry; Declared exports: `ResultDialog`. |
| [src/components/reveal-on-scroll.tsx](../src/components/reveal-on-scroll.tsx) | Client entry; Declared exports: `RevealOnScroll`. |
| [src/components/settings/settings-form.browser.test.tsx](../src/components/settings/settings-form.browser.test.tsx) | Automated browser test. |
| [src/components/settings/settings-form.tsx](../src/components/settings/settings-form.tsx) | Client entry; Declared exports: `SettingsForm`. |
| [src/components/settings/settings-page.tsx](../src/components/settings/settings-page.tsx) | Declared exports: `RoleSettingsPage`. |
| [src/components/site-announcements.tsx](../src/components/site-announcements.tsx) | Declared exports: `SiteAnnouncements`. |
| [src/components/student/invitation-form.tsx](../src/components/student/invitation-form.tsx) | Client entry; Declared exports: `InvitationForm`. |
| [src/components/student/student-shell.tsx](../src/components/student/student-shell.tsx) | Declared exports: `StudentShell`. |
| [src/components/technical-overview.tsx](../src/components/technical-overview.tsx) | Declared exports: `TechnicalOverview`. |
| [src/components/theme-toggle.browser.test.tsx](../src/components/theme-toggle.browser.test.tsx) | Automated browser test. |
| [src/components/theme-toggle.tsx](../src/components/theme-toggle.tsx) | Client entry; Declared exports: `ThemeIconButton`. |

## Application libraries

| File | Navigation notes |
|---|---|
| [src/lib/activities/server.ts](../src/lib/activities/server.ts) | Declared exports: `getProfessorActivities`, `getProfessorActivity`, `getStudentActivities`, `getStudentActivity`. |
| [src/lib/activities/shrink-case-image.browser.test.ts](../src/lib/activities/shrink-case-image.browser.test.ts) | Automated browser test. |
| [src/lib/activities/shrink-case-image.ts](../src/lib/activities/shrink-case-image.ts) | Declared exports: `shrinkCaseImage`. |
| [src/lib/activities/types.ts](../src/lib/activities/types.ts) | Declared exports: `ActivityStatus`, `CaseUploadStatus`, `ProfessorActivitySummary`, `ProfessorActivityDetails`, `StudentActivitySummary`; more in source. |
| [src/lib/activity-ai/actions.ts](../src/lib/activity-ai/actions.ts) | Server Actions; Declared exports: `claimActivityAIAnalysis`, `completeActivityAIAnalysis`, `failActivityAIAnalysis`, `refreshActivityCaseUrl`. |
| [src/lib/activity-ai/adapter.test.ts](../src/lib/activity-ai/adapter.test.ts) | Automated Node-project test. |
| [src/lib/activity-ai/adapter.ts](../src/lib/activity-ai/adapter.ts) | Declared exports: `ActivityAIPersistencePayload`, `toActivityAIPersistencePayload`. |
| [src/lib/activity-ai/server.ts](../src/lib/activity-ai/server.ts) | Declared exports: `getStudentActivityAIFeedback`, `getProfessorActivityAIStatus`, `getProfessorActivityAIHeatmap`. |
| [src/lib/activity-ai/types.ts](../src/lib/activity-ai/types.ts) | Declared exports: `ACTIVITY_AI_LABELS`, `ActivityAILabel`, `ActivityAIProvider`, `ActivityAIStatus`, `ActivityAISafeErrorCode`; more in source. |
| [src/lib/admin/server.ts](../src/lib/admin/server.ts) | Declared exports: `getProfessorApplications`, `getPlatformAdmins`, `getAccounts`, `getPlatformStats`, `getProfessorReport`; more in source. |
| [src/lib/admin/types.ts](../src/lib/admin/types.ts) | Declared exports: `ProfessorApplicationProjection`, `AdminReviewActionState`, `PlatformAdminProjection`, `initialAdminReviewState`, `AccountProjection`; more in source. |
| [src/lib/analytics/server.ts](../src/lib/analytics/server.ts) | Declared exports: `getClassAnalytics`. |
| [src/lib/analytics/summary.test.ts](../src/lib/analytics/summary.test.ts) | Automated Node-project test. |
| [src/lib/analytics/summary.ts](../src/lib/analytics/summary.ts) | Declared exports: `AnalyticsStudent`, `AnalyticsActivity`, `AnalyticsSubmission`, `AICall`, `summarizeClass`; more in source. |
| [src/lib/auth/server.ts](../src/lib/auth/server.ts) | Declared exports: `getCurrentProfile`, `requireRole`, `requirePlatformAdmin`, `isPlatformAdmin`. |
| [src/lib/auth/types.ts](../src/lib/auth/types.ts) | Declared exports: `AppRole`, `LoginPortal`, `emailPattern`, `ProfessorApplicationStatus`, `AuthField`; more in source. |
| [src/lib/chest-gate/features.ts](../src/lib/chest-gate/features.ts) | Declared exports: `CHEST_FEATURE_SIZE`, `chestFeatures`. |
| [src/lib/chest-gate/index.test.ts](../src/lib/chest-gate/index.test.ts) | Automated Node-project test. |
| [src/lib/chest-gate/index.ts](../src/lib/chest-gate/index.ts) | Declared exports: `chestProbability`, `passesChestGate`, `isChestXray`. |
| [src/lib/chest-gate/server.ts](../src/lib/chest-gate/server.ts) | Declared exports: `chestFeaturesFile`. |
| [src/lib/chest-gate/weights.json](../src/lib/chest-gate/weights.json) | Parameters for the chest X-ray gate. |
| [src/lib/display-prefs.ts](../src/lib/display-prefs.ts) | Declared exports: `applySavedDisplayPrefs`. |
| [src/lib/evaluations/server.ts](../src/lib/evaluations/server.ts) | Declared exports: `getProfessorSubmissions`, `getProfessorSubmission`, `getStudentActivityFacultyEvaluation`. |
| [src/lib/evaluations/types.ts](../src/lib/evaluations/types.ts) | Declared exports: `ReviewStatus`, `ProfessorEvaluation`, `StudentFacultyEvaluation`, `EvaluationValues`, `EvaluationActionState`; more in source. |
| [src/lib/evaluations/validation.test.ts](../src/lib/evaluations/validation.test.ts) | Automated Node-project test. |
| [src/lib/evaluations/validation.ts](../src/lib/evaluations/validation.ts) | Declared exports: `normalizeEvaluation`, `validateEvaluation`, `evaluationActionResult`. |
| [src/lib/inference/attention.test.ts](../src/lib/inference/attention.test.ts) | Automated Node-project test. |
| [src/lib/inference/attention.ts](../src/lib/inference/attention.ts) | Declared exports: `CAM_GRID`, `CAM_CELLS`, `CAM_LABEL_COUNT`, `AttentionHeatmap`, `UNAVAILABLE_ATTENTION`; more in source. |
| [src/lib/inference/contract.test.ts](../src/lib/inference/contract.test.ts) | Automated Node-project test. |
| [src/lib/inference/contract.ts](../src/lib/inference/contract.ts) | Declared exports: `MODEL_SLOT`, `MODEL_BUCKET`, `MODEL_MAX_BYTES`, `MODEL_INPUT_SIZE`, `RESIZE_INTERPOLATIONS`; more in source. |
| [src/lib/inference/errors.ts](../src/lib/inference/errors.ts) | Declared exports: `InferenceErrorCode`, `InferenceError`, `asInferenceError`. |
| [src/lib/inference/index.ts](../src/lib/inference/index.ts) | Script or support module; read its imports and entry point. |
| [src/lib/inference/postprocess.test.ts](../src/lib/inference/postprocess.test.ts) | Automated Node-project test. |
| [src/lib/inference/postprocess.ts](../src/lib/inference/postprocess.ts) | Declared exports: `LabelPrediction`, `PostprocessedPrediction`, `sigmoid`, `postprocessLogits`, `AnalysisReport`; more in source. |
| [src/lib/inference/preprocess.browser.test.ts](../src/lib/inference/preprocess.browser.test.ts) | Automated browser test. |
| [src/lib/inference/preprocess.test.ts](../src/lib/inference/preprocess.test.ts) | Automated Node-project test. |
| [src/lib/inference/preprocess.ts](../src/lib/inference/preprocess.ts) | Declared exports: `trainingSize`, `preprocessRgba`, `decodeImage`, `preprocessImage`. |
| [src/lib/inference/runtime.test.ts](../src/lib/inference/runtime.test.ts) | Automated Node-project test. |
| [src/lib/inference/runtime.ts](../src/lib/inference/runtime.ts) | Declared exports: `InferenceResult`, `resolveActiveModel`, `fetchVerifiedModel`, `loadModelSession`, `acquireModelSession`; more in source. |
| [src/lib/inference/test-manifest.ts](../src/lib/inference/test-manifest.ts) | Declared exports: `createTestManifest`. |
| [src/lib/learning-notes/types.ts](../src/lib/learning-notes/types.ts) | Declared exports: `MAX_LEARNING_NOTE_LENGTH`, `LearningNoteActionState`, `initialLearningNoteActionState`. |
| [src/lib/legal/privacy.ts](../src/lib/legal/privacy.ts) | Declared exports: `PRIVACY_POLICY_VERSION`, `PRIVACY_POLICY_EFFECTIVE_DATE`, `TERMS_VERSION`, `TERMS_EFFECTIVE_DATE`, `PRIVACY_CONTROLLER_NAME`; more in source. |
| [src/lib/notifications/server.ts](../src/lib/notifications/server.ts) | Declared exports: `getNotifications`. |
| [src/lib/notifications/types.ts](../src/lib/notifications/types.ts) | Declared exports: `NotificationKind`, `AppNotification`, `NotificationsResult`, `notificationWindowMs`, `parseNotificationKey`; more in source. |
| [src/lib/settings/server.ts](../src/lib/settings/server.ts) | Declared exports: `getSettingsPageData`. |
| [src/lib/settings/types.ts](../src/lib/settings/types.ts) | Declared exports: `AccountSettings`, `SettingsField`, `SavedSettingsValues`, `SettingsActionState`, `PasswordField`; more in source. |
| [src/lib/settings/validation.test.ts](../src/lib/settings/validation.test.ts) | Automated Node-project test. |
| [src/lib/settings/validation.ts](../src/lib/settings/validation.ts) | Declared exports: `normalizeDisplayName`, `normalizeWorkPhone`, `validateDisplayName`, `validateWorkPhone`, `validateSettingsInput`. |
| [src/lib/submissions/types.ts](../src/lib/submissions/types.ts) | Declared exports: `SubmissionStatus`, `SubmissionValues`, `StudentSubmission`, `SubmissionFieldErrors`, `SubmissionActionState`; more in source. |
| [src/lib/submissions/validation.test.ts](../src/lib/submissions/validation.test.ts) | Automated Node-project test. |
| [src/lib/submissions/validation.ts](../src/lib/submissions/validation.ts) | Declared exports: `normalizeSubmission`, `validateSubmission`. |
| [src/lib/supabase/client.ts](../src/lib/supabase/client.ts) | Declared exports: `createClient`. |
| [src/lib/supabase/proxy.ts](../src/lib/supabase/proxy.ts) | Declared exports: `updateSession`. |
| [src/lib/supabase/server.ts](../src/lib/supabase/server.ts) | Declared exports: `createClient`. |
| [src/lib/view-detector/features.ts](../src/lib/view-detector/features.ts) | Declared exports: `VIEW_FEATURE_SIZE`, `viewFeatures`. |
| [src/lib/view-detector/index.test.ts](../src/lib/view-detector/index.test.ts) | Automated Node-project test. |
| [src/lib/view-detector/index.ts](../src/lib/view-detector/index.ts) | Declared exports: `lateralProbability`, `looksLateral`. |
| [src/lib/view-detector/weights.json](../src/lib/view-detector/weights.json) | Parameters for the frontal/lateral detector. |
| [src/lib/workspaces/server.ts](../src/lib/workspaces/server.ts) | Declared exports: `getStudentWorkspaces`, `getStudentWorkspace`, `getProfessorWorkspaces`, `getProfessorWorkspace`. |
| [src/lib/workspaces/types.ts](../src/lib/workspaces/types.ts) | Declared exports: `Workspace`, `WorkspaceMember`, `InvitationCode`, `StudentWorkspace`, `ProfessorWorkspace`; more in source. |
| [src/lib/xray-library/README.md](../src/lib/xray-library/README.md) | Documentation; read its scope, evidence, and date. |
| [src/lib/xray-library/cases.json](../src/lib/xray-library/cases.json) | Gallery metadata manifest; see the adjacent README. |
| [src/lib/xray-library/cases.test.ts](../src/lib/xray-library/cases.test.ts) | Automated Node-project test. |

## Request proxy

| File | Navigation notes |
|---|---|
| [src/proxy.ts](../src/proxy.ts) | Declared exports: `proxy`, `config`. |

## Database migrations

| File | Navigation notes |
|---|---|
| [supabase/migrations/20260810163915_auth_profiles.sql](../supabase/migrations/20260810163915_auth_profiles.sql) | Migration topic from filename: auth profiles. Read later migrations for replacements. |
| [supabase/migrations/20260817110952_workspace_membership_invitations.sql](../supabase/migrations/20260817110952_workspace_membership_invitations.sql) | Migration topic from filename: workspace membership invitations. Read later migrations for replacements. |
| [supabase/migrations/20260817111801_consolidate_profile_visibility_policy.sql](../supabase/migrations/20260817111801_consolidate_profile_visibility_policy.sql) | Migration topic from filename: consolidate profile visibility policy. Read later migrations for replacements. |
| [supabase/migrations/20260817124643_professor_approval_administration.sql](../supabase/migrations/20260817124643_professor_approval_administration.sql) | Migration topic from filename: professor approval administration. Read later migrations for replacements. |
| [supabase/migrations/20260820101401_activities_case_publication.sql](../supabase/migrations/20260820101401_activities_case_publication.sql) | Migration topic from filename: activities case publication. Read later migrations for replacements. |
| [supabase/migrations/20260824081329_replaceable_model_foundation.sql](../supabase/migrations/20260824081329_replaceable_model_foundation.sql) | Migration topic from filename: replaceable model foundation. Read later migrations for replacements. |
| [supabase/migrations/20260830121651_shared_account_settings.sql](../supabase/migrations/20260830121651_shared_account_settings.sql) | Migration topic from filename: shared account settings. Read later migrations for replacements. |
| [supabase/migrations/20260919160249_student_activity_submissions.sql](../supabase/migrations/20260919160249_student_activity_submissions.sql) | Migration topic from filename: student activity submissions. Read later migrations for replacements. |
| [supabase/migrations/20260920100000_activity_ai_analysis.sql](../supabase/migrations/20260920100000_activity_ai_analysis.sql) | Migration topic from filename: activity ai analysis. Read later migrations for replacements. |
| [supabase/migrations/20260920110000_fix_database_lint_warnings.sql](../supabase/migrations/20260920110000_fix_database_lint_warnings.sql) | Migration topic from filename: fix database lint warnings. Read later migrations for replacements. |
| [supabase/migrations/20260920161434_faculty_evaluations.sql](../supabase/migrations/20260920161434_faculty_evaluations.sql) | Migration topic from filename: faculty evaluations. Read later migrations for replacements. |
| [supabase/migrations/20260921154334_attention_heatmaps.sql](../supabase/migrations/20260921154334_attention_heatmaps.sql) | Migration topic from filename: attention heatmaps. Read later migrations for replacements. |
| [supabase/migrations/20260921155412_attention_registry_v2.sql](../supabase/migrations/20260921155412_attention_registry_v2.sql) | Migration topic from filename: attention registry v2. Read later migrations for replacements. |
| [supabase/migrations/20260922163225_attention_contract_hardening.sql](../supabase/migrations/20260922163225_attention_contract_hardening.sql) | Migration topic from filename: attention contract hardening. Read later migrations for replacements. |
| [supabase/migrations/20261010120000_privacy_consents.sql](../supabase/migrations/20261010120000_privacy_consents.sql) | Migration topic from filename: privacy consents. Read later migrations for replacements. |
| [supabase/migrations/20261017120000_activation_conflict_not_retryable.sql](../supabase/migrations/20261017120000_activation_conflict_not_retryable.sql) | Migration topic from filename: activation conflict not retryable. Read later migrations for replacements. |
| [supabase/migrations/20261021120000_drop_dark_image_background.sql](../supabase/migrations/20261021120000_drop_dark_image_background.sql) | Migration topic from filename: drop dark image background. Read later migrations for replacements. |
| [supabase/migrations/20261021130000_verify_own_password.sql](../supabase/migrations/20261021130000_verify_own_password.sql) | Migration topic from filename: verify own password. Read later migrations for replacements. |
| [supabase/migrations/20261022120000_drop_age_band_and_research_consent.sql](../supabase/migrations/20261022120000_drop_age_band_and_research_consent.sql) | Migration topic from filename: drop age band and research consent. Read later migrations for replacements. |
| [supabase/migrations/20261023120000_notification_reads.sql](../supabase/migrations/20261023120000_notification_reads.sql) | Migration topic from filename: notification reads. Read later migrations for replacements. |
| [supabase/migrations/20261024120000_list_professor_applications_reviewer.sql](../supabase/migrations/20261024120000_list_professor_applications_reviewer.sql) | Migration topic from filename: list professor applications reviewer. Read later migrations for replacements. |
| [supabase/migrations/20261024130000_platform_admin_management.sql](../supabase/migrations/20261024130000_platform_admin_management.sql) | Migration topic from filename: platform admin management. Read later migrations for replacements. |
| [supabase/migrations/20261025120000_activity_ai_possible_thresholds.sql](../supabase/migrations/20261025120000_activity_ai_possible_thresholds.sql) | Migration topic from filename: activity ai possible thresholds. Read later migrations for replacements. |
| [supabase/migrations/20261028120000_professor_workspace_ai_calls.sql](../supabase/migrations/20261028120000_professor_workspace_ai_calls.sql) | Migration topic from filename: professor workspace ai calls. Read later migrations for replacements. |
| [supabase/migrations/20261029120000_class_activation_maps.sql](../supabase/migrations/20261029120000_class_activation_maps.sql) | Migration topic from filename: class activation maps. Read later migrations for replacements. |
| [supabase/migrations/20261030120000_learning_case_notes.sql](../supabase/migrations/20261030120000_learning_case_notes.sql) | Migration topic from filename: learning case notes. Read later migrations for replacements. |
| [supabase/migrations/20261031120000_drop_pg_graphql.sql](../supabase/migrations/20261031120000_drop_pg_graphql.sql) | Migration topic from filename: drop pg graphql. Read later migrations for replacements. |
| [supabase/migrations/20261107120000_normal_submissions_without_findings.sql](../supabase/migrations/20261107120000_normal_submissions_without_findings.sql) | Migration topic from filename: normal submissions without findings. Read later migrations for replacements. |
| [supabase/migrations/20261111120000_admin_console.sql](../supabase/migrations/20261111120000_admin_console.sql) | Migration topic from filename: admin console. Read later migrations for replacements. |
| [supabase/migrations/20261111130000_notification_feedback.sql](../supabase/migrations/20261111130000_notification_feedback.sql) | Migration topic from filename: notification feedback. Read later migrations for replacements. |
| [supabase/migrations/20261114120000_professor_only_activity_ai_claim.sql](../supabase/migrations/20261114120000_professor_only_activity_ai_claim.sql) | Migration topic from filename: professor only activity ai claim. Read later migrations for replacements. |
| [supabase/migrations/20261115120000_two_step_login.sql](../supabase/migrations/20261115120000_two_step_login.sql) | Migration topic from filename: two step login. Read later migrations for replacements. |
| [supabase/migrations/20261116120000_professor_validated_answer_key.sql](../supabase/migrations/20261116120000_professor_validated_answer_key.sql) | Migration topic from filename: professor validated answer key. Adds the answer key, label submissions and scoring. Read later migrations for replacements. |

## Database tests

| File | Navigation notes |
|---|---|
| [supabase/tests/database/account_settings.test.sql](../supabase/tests/database/account_settings.test.sql) | Database test file: account settings. |
| [supabase/tests/database/activity_ai_analysis.test.sql](../supabase/tests/database/activity_ai_analysis.test.sql) | Database test file: activity ai analysis. |
| [supabase/tests/database/activity_ai_possible_thresholds.test.sql](../supabase/tests/database/activity_ai_possible_thresholds.test.sql) | Database test file: activity ai possible thresholds. |
| [supabase/tests/database/admin_account_management.test.sql](../supabase/tests/database/admin_account_management.test.sql) | Database test file: admin account management. |
| [supabase/tests/database/attention_behavior.test.sql](../supabase/tests/database/attention_behavior.test.sql) | Database test file: attention behavior. |
| [supabase/tests/database/class_activation_behavior.test.sql](../supabase/tests/database/class_activation_behavior.test.sql) | Database test file: class activation behavior. |
| [supabase/tests/database/faculty_evaluations.test.sql](../supabase/tests/database/faculty_evaluations.test.sql) | Database test file: faculty evaluations. |
| [supabase/tests/database/learning_case_notes.test.sql](../supabase/tests/database/learning_case_notes.test.sql) | Database test file: learning case notes. |
| [supabase/tests/database/legal_consents.test.sql](../supabase/tests/database/legal_consents.test.sql) | Database test file: legal consents. |
| [supabase/tests/database/model_registry.test.sql](../supabase/tests/database/model_registry.test.sql) | Database test file: model registry. |
| [supabase/tests/database/notification_reads.test.sql](../supabase/tests/database/notification_reads.test.sql) | Database test file: notification reads. |
| [supabase/tests/database/platform_admin_management.test.sql](../supabase/tests/database/platform_admin_management.test.sql) | Database test file: platform admin management. |
| [supabase/tests/database/professor_workspace_ai_calls.test.sql](../supabase/tests/database/professor_workspace_ai_calls.test.sql) | Database test file: professor workspace ai calls. |
| [supabase/tests/database/student_submissions.test.sql](../supabase/tests/database/student_submissions.test.sql) | Database test file: student submissions. |
| [supabase/tests/database/two_step_login.test.sql](../supabase/tests/database/two_step_login.test.sql) | Database test file: two step login. |
| [supabase/tests/database/verify_own_password.test.sql](../supabase/tests/database/verify_own_password.test.sql) | Database test file: verify own password. |

## Database configuration and supporting files

| File | Navigation notes |
|---|---|
| [supabase/.gitignore](../supabase/.gitignore) | Supporting configuration or resource; inspect source and consumers. |
| [supabase/README.md](../supabase/README.md) | Documentation; read its scope, evidence, and date. |
| [supabase/config.toml](../supabase/config.toml) | Local Supabase configuration. |
| [supabase/snippets/Untitled query 931.sql](../supabase/snippets/Untitled%20query%20931.sql) | Tracked SQL snippet, outside the migrations directory; do not assume it is applied automatically. |
| [supabase/templates/confirmation.html](../supabase/templates/confirmation.html) | Auth email template: confirmation. |
| [supabase/templates/email_change.html](../supabase/templates/email_change.html) | Auth email template: email change. |
| [supabase/templates/email_changed_notification.html](../supabase/templates/email_changed_notification.html) | Auth email template: email changed notification. |
| [supabase/templates/password_changed_notification.html](../supabase/templates/password_changed_notification.html) | Auth email template: password changed notification. |
| [supabase/templates/reauthentication.html](../supabase/templates/reauthentication.html) | Auth email template: reauthentication. |
| [supabase/templates/recovery.html](../supabase/templates/recovery.html) | Auth email template: recovery. |

## Maintenance scripts

| File | Navigation notes |
|---|---|
| [scripts/dump-chest-features.mts](../scripts/dump-chest-features.mts) | Script or support module; read its imports and entry point. |
| [scripts/dump-view-features.mts](../scripts/dump-view-features.mts) | Script or support module; read its imports and entry point. |
| [scripts/guides/attention-maps.html](../scripts/guides/attention-maps.html) | Printable attention-guide source. |
| [scripts/guides/footer.jpg](../scripts/guides/footer.jpg) | Static JPG asset; inspect references to establish usage. |
| [scripts/guides/header.jpg](../scripts/guides/header.jpg) | Static JPG asset; inspect references to establish usage. |
| [scripts/guides/render-attention-guide.mjs](../scripts/guides/render-attention-guide.mjs) | Script or support module; read its imports and entry point. |
| [scripts/import-chexpert-library.ps1](../scripts/import-chexpert-library.ps1) | Gallery dataset import script. |
| [scripts/model-release.ts](../scripts/model-release.ts) | Script or support module; read its imports and entry point. |
| [scripts/prepare-ort-assets.mjs](../scripts/prepare-ort-assets.mjs) | Script or support module; read its imports and entry point. |

## Offline model tooling

| File | Navigation notes |
|---|---|
| [model-export/README.md](../model-export/README.md) | Documentation; read its scope, evidence, and date. |
| [model-export/eval_localization.py](../model-export/eval_localization.py) | Python offline tool. Top-level definitions: `preprocess`, `peak`, `hit`, `main`. |
| [model-export/export_fastvit.py](../model-export/export_fastvit.py) | Python offline tool. Top-level definitions: `ExportModel`, `main`. |
| [model-export/export_squeezevit.py](../model-export/export_squeezevit.py) | Python offline tool. Top-level definitions: `rollout`, `ExportModel`, `assert_parity`, `main`. |
| [model-export/export_squeezevit_cam.py](../model-export/export_squeezevit_cam.py) | Python offline tool. Top-level definitions: `class_activation`, `ExportModel`, `main`. |
| [model-export/export_tinyvit_cam.py](../model-export/export_tinyvit_cam.py) | Python offline tool. Top-level definitions: `centred_features`, `ecm_rule`, `logit`, `ExportModel`. |
| [model-export/fastvit_thoraxscan.py](../model-export/fastvit_thoraxscan.py) | Python offline tool. Top-level definitions: `FastViTThoraxScan`, `attention_modules`. |
| [model-export/preprocessing_shortside320.py](../model-export/preprocessing_shortside320.py) | Python offline tool. Top-level definitions: `resize_bilinear`, `training_size`, `preprocess_rgb`, `preprocess_image`. |
| [model-export/requirements-lock.txt](../model-export/requirements-lock.txt) | Full Python environment dependency pins. |
| [model-export/requirements.txt](../model-export/requirements.txt) | Direct Python dependency pins. |
| [model-export/squeezevit.py](../model-export/squeezevit.py) | Python offline tool. Top-level definitions: `FireModule`, `TransformerEncoder`, `TranslutionBlock`, `SqueezeViT`. |
| [model-export/test_cam.py](../model-export/test_cam.py) | Python unittest checks; see model-export/README.md. |
| [model-export/test_fastvit_export.py](../model-export/test_fastvit_export.py) | Python unittest checks; see model-export/README.md. |
| [model-export/test_preprocessing.py](../model-export/test_preprocessing.py) | Python unittest checks; see model-export/README.md. |
| [model-export/test_rollout.py](../model-export/test_rollout.py) | Python unittest checks; see model-export/README.md. |
| [model-export/tinyvit_thoraxscan.py](../model-export/tinyvit_thoraxscan.py) | Python offline tool. Top-level definitions: `TinyViTThoraxScan`. |
| [model-export/train_chest_gate.py](../model-export/train_chest_gate.py) | Python offline tool. Top-level definitions: `load`, `report`, `main`. |
| [model-export/train_view_detector.py](../model-export/train_view_detector.py) | Python offline tool. Top-level definitions: `load`, `report`, `main`. |

## Public assets

| File | Navigation notes |
|---|---|
| [public/file.svg](../public/file.svg) | Static SVG asset; inspect references to establish usage. |
| [public/globe.svg](../public/globe.svg) | Static SVG asset; inspect references to establish usage. |
| [public/guides/attention-maps.pdf](../public/guides/attention-maps.pdf) | Static PDF asset; inspect references to establish usage. |
| [public/images/danger-triangle.svg](../public/images/danger-triangle.svg) | Static SVG asset; inspect references to establish usage. |
| [public/images/header-divider.svg](../public/images/header-divider.svg) | Static SVG asset; inspect references to establish usage. |
| [public/images/learning/book.svg](../public/images/learning/book.svg) | Static SVG asset; inspect references to establish usage. |
| [public/images/learning/eye.svg](../public/images/learning/eye.svg) | Static SVG asset; inspect references to establish usage. |
| [public/images/learning/plus.svg](../public/images/learning/plus.svg) | Static SVG asset; inspect references to establish usage. |
| [public/images/learning/scan.svg](../public/images/learning/scan.svg) | Static SVG asset; inspect references to establish usage. |
| [public/images/learning/warning.svg](../public/images/learning/warning.svg) | Static SVG asset; inspect references to establish usage. |
| [public/images/menu-icons/activities.png](../public/images/menu-icons/activities.png) | Static PNG asset; inspect references to establish usage. |
| [public/images/menu-icons/analytics.svg](../public/images/menu-icons/analytics.svg) | Static SVG asset; inspect references to establish usage. |
| [public/images/menu-icons/application.svg](../public/images/menu-icons/application.svg) | Static SVG asset; inspect references to establish usage. |
| [public/images/menu-icons/attention.png](../public/images/menu-icons/attention.png) | Static PNG asset; inspect references to establish usage. |
| [public/images/menu-icons/dashboard.png](../public/images/menu-icons/dashboard.png) | Static PNG asset; inspect references to establish usage. |
| [public/images/menu-icons/learning.png](../public/images/menu-icons/learning.png) | Static PNG asset; inspect references to establish usage. |
| [public/images/menu-icons/reviews.png](../public/images/menu-icons/reviews.png) | Static PNG asset; inspect references to establish usage. |
| [public/images/menu-icons/settings.png](../public/images/menu-icons/settings.png) | Static PNG asset; inspect references to establish usage. |
| [public/images/professor-role.png](../public/images/professor-role.png) | Static PNG asset; inspect references to establish usage. |
| [public/images/student-role.png](../public/images/student-role.png) | Static PNG asset; inspect references to establish usage. |
| [public/images/thoraxscan-logo.png](../public/images/thoraxscan-logo.png) | Static PNG asset; inspect references to establish usage. |
| [public/images/xray-sample.png](../public/images/xray-sample.png) | Static PNG asset; inspect references to establish usage. |
| [public/next.svg](../public/next.svg) | Static SVG asset; inspect references to establish usage. |
| [public/vercel.svg](../public/vercel.svg) | Static SVG asset; inspect references to establish usage. |
| [public/window.svg](../public/window.svg) | Static SVG asset; inspect references to establish usage. |

The 234 tracked gallery JPEGs are listed below. Their case metadata and dataset limitations are documented in [the library README](../src/lib/xray-library/README.md) and [cases.json](../src/lib/xray-library/cases.json). These are public static assets, separate from private uploaded cases.

<details>
<summary>Gallery image file list</summary>

- [public/images/chexpert/cxp-001.jpg](../public/images/chexpert/cxp-001.jpg)
- [public/images/chexpert/cxp-002.jpg](../public/images/chexpert/cxp-002.jpg)
- [public/images/chexpert/cxp-003.jpg](../public/images/chexpert/cxp-003.jpg)
- [public/images/chexpert/cxp-004.jpg](../public/images/chexpert/cxp-004.jpg)
- [public/images/chexpert/cxp-005.jpg](../public/images/chexpert/cxp-005.jpg)
- [public/images/chexpert/cxp-006.jpg](../public/images/chexpert/cxp-006.jpg)
- [public/images/chexpert/cxp-007.jpg](../public/images/chexpert/cxp-007.jpg)
- [public/images/chexpert/cxp-008.jpg](../public/images/chexpert/cxp-008.jpg)
- [public/images/chexpert/cxp-009.jpg](../public/images/chexpert/cxp-009.jpg)
- [public/images/chexpert/cxp-010.jpg](../public/images/chexpert/cxp-010.jpg)
- [public/images/chexpert/cxp-011.jpg](../public/images/chexpert/cxp-011.jpg)
- [public/images/chexpert/cxp-012.jpg](../public/images/chexpert/cxp-012.jpg)
- [public/images/chexpert/cxp-013.jpg](../public/images/chexpert/cxp-013.jpg)
- [public/images/chexpert/cxp-014.jpg](../public/images/chexpert/cxp-014.jpg)
- [public/images/chexpert/cxp-015.jpg](../public/images/chexpert/cxp-015.jpg)
- [public/images/chexpert/cxp-016.jpg](../public/images/chexpert/cxp-016.jpg)
- [public/images/chexpert/cxp-017.jpg](../public/images/chexpert/cxp-017.jpg)
- [public/images/chexpert/cxp-018.jpg](../public/images/chexpert/cxp-018.jpg)
- [public/images/chexpert/cxp-019.jpg](../public/images/chexpert/cxp-019.jpg)
- [public/images/chexpert/cxp-020.jpg](../public/images/chexpert/cxp-020.jpg)
- [public/images/chexpert/cxp-021.jpg](../public/images/chexpert/cxp-021.jpg)
- [public/images/chexpert/cxp-022.jpg](../public/images/chexpert/cxp-022.jpg)
- [public/images/chexpert/cxp-023.jpg](../public/images/chexpert/cxp-023.jpg)
- [public/images/chexpert/cxp-024.jpg](../public/images/chexpert/cxp-024.jpg)
- [public/images/chexpert/cxp-025.jpg](../public/images/chexpert/cxp-025.jpg)
- [public/images/chexpert/cxp-026.jpg](../public/images/chexpert/cxp-026.jpg)
- [public/images/chexpert/cxp-027.jpg](../public/images/chexpert/cxp-027.jpg)
- [public/images/chexpert/cxp-028.jpg](../public/images/chexpert/cxp-028.jpg)
- [public/images/chexpert/cxp-029.jpg](../public/images/chexpert/cxp-029.jpg)
- [public/images/chexpert/cxp-030.jpg](../public/images/chexpert/cxp-030.jpg)
- [public/images/chexpert/cxp-031.jpg](../public/images/chexpert/cxp-031.jpg)
- [public/images/chexpert/cxp-032.jpg](../public/images/chexpert/cxp-032.jpg)
- [public/images/chexpert/cxp-033.jpg](../public/images/chexpert/cxp-033.jpg)
- [public/images/chexpert/cxp-034.jpg](../public/images/chexpert/cxp-034.jpg)
- [public/images/chexpert/cxp-035.jpg](../public/images/chexpert/cxp-035.jpg)
- [public/images/chexpert/cxp-036.jpg](../public/images/chexpert/cxp-036.jpg)
- [public/images/chexpert/cxp-037.jpg](../public/images/chexpert/cxp-037.jpg)
- [public/images/chexpert/cxp-038.jpg](../public/images/chexpert/cxp-038.jpg)
- [public/images/chexpert/cxp-039.jpg](../public/images/chexpert/cxp-039.jpg)
- [public/images/chexpert/cxp-040.jpg](../public/images/chexpert/cxp-040.jpg)
- [public/images/chexpert/cxp-041.jpg](../public/images/chexpert/cxp-041.jpg)
- [public/images/chexpert/cxp-042.jpg](../public/images/chexpert/cxp-042.jpg)
- [public/images/chexpert/cxp-043.jpg](../public/images/chexpert/cxp-043.jpg)
- [public/images/chexpert/cxp-044.jpg](../public/images/chexpert/cxp-044.jpg)
- [public/images/chexpert/cxp-045.jpg](../public/images/chexpert/cxp-045.jpg)
- [public/images/chexpert/cxp-046.jpg](../public/images/chexpert/cxp-046.jpg)
- [public/images/chexpert/cxp-047.jpg](../public/images/chexpert/cxp-047.jpg)
- [public/images/chexpert/cxp-048.jpg](../public/images/chexpert/cxp-048.jpg)
- [public/images/chexpert/cxp-049.jpg](../public/images/chexpert/cxp-049.jpg)
- [public/images/chexpert/cxp-050.jpg](../public/images/chexpert/cxp-050.jpg)
- [public/images/chexpert/cxp-051.jpg](../public/images/chexpert/cxp-051.jpg)
- [public/images/chexpert/cxp-052.jpg](../public/images/chexpert/cxp-052.jpg)
- [public/images/chexpert/cxp-053.jpg](../public/images/chexpert/cxp-053.jpg)
- [public/images/chexpert/cxp-054.jpg](../public/images/chexpert/cxp-054.jpg)
- [public/images/chexpert/cxp-055.jpg](../public/images/chexpert/cxp-055.jpg)
- [public/images/chexpert/cxp-056.jpg](../public/images/chexpert/cxp-056.jpg)
- [public/images/chexpert/cxp-057.jpg](../public/images/chexpert/cxp-057.jpg)
- [public/images/chexpert/cxp-058.jpg](../public/images/chexpert/cxp-058.jpg)
- [public/images/chexpert/cxp-059.jpg](../public/images/chexpert/cxp-059.jpg)
- [public/images/chexpert/cxp-060.jpg](../public/images/chexpert/cxp-060.jpg)
- [public/images/chexpert/cxp-061.jpg](../public/images/chexpert/cxp-061.jpg)
- [public/images/chexpert/cxp-062.jpg](../public/images/chexpert/cxp-062.jpg)
- [public/images/chexpert/cxp-063.jpg](../public/images/chexpert/cxp-063.jpg)
- [public/images/chexpert/cxp-064.jpg](../public/images/chexpert/cxp-064.jpg)
- [public/images/chexpert/cxp-065.jpg](../public/images/chexpert/cxp-065.jpg)
- [public/images/chexpert/cxp-066.jpg](../public/images/chexpert/cxp-066.jpg)
- [public/images/chexpert/cxp-067.jpg](../public/images/chexpert/cxp-067.jpg)
- [public/images/chexpert/cxp-068.jpg](../public/images/chexpert/cxp-068.jpg)
- [public/images/chexpert/cxp-069.jpg](../public/images/chexpert/cxp-069.jpg)
- [public/images/chexpert/cxp-070.jpg](../public/images/chexpert/cxp-070.jpg)
- [public/images/chexpert/cxp-071.jpg](../public/images/chexpert/cxp-071.jpg)
- [public/images/chexpert/cxp-072.jpg](../public/images/chexpert/cxp-072.jpg)
- [public/images/chexpert/cxp-073.jpg](../public/images/chexpert/cxp-073.jpg)
- [public/images/chexpert/cxp-074.jpg](../public/images/chexpert/cxp-074.jpg)
- [public/images/chexpert/cxp-075.jpg](../public/images/chexpert/cxp-075.jpg)
- [public/images/chexpert/cxp-076.jpg](../public/images/chexpert/cxp-076.jpg)
- [public/images/chexpert/cxp-077.jpg](../public/images/chexpert/cxp-077.jpg)
- [public/images/chexpert/cxp-078.jpg](../public/images/chexpert/cxp-078.jpg)
- [public/images/chexpert/cxp-079.jpg](../public/images/chexpert/cxp-079.jpg)
- [public/images/chexpert/cxp-080.jpg](../public/images/chexpert/cxp-080.jpg)
- [public/images/chexpert/cxp-081.jpg](../public/images/chexpert/cxp-081.jpg)
- [public/images/chexpert/cxp-082.jpg](../public/images/chexpert/cxp-082.jpg)
- [public/images/chexpert/cxp-083.jpg](../public/images/chexpert/cxp-083.jpg)
- [public/images/chexpert/cxp-084.jpg](../public/images/chexpert/cxp-084.jpg)
- [public/images/chexpert/cxp-085.jpg](../public/images/chexpert/cxp-085.jpg)
- [public/images/chexpert/cxp-086.jpg](../public/images/chexpert/cxp-086.jpg)
- [public/images/chexpert/cxp-087.jpg](../public/images/chexpert/cxp-087.jpg)
- [public/images/chexpert/cxp-088.jpg](../public/images/chexpert/cxp-088.jpg)
- [public/images/chexpert/cxp-089.jpg](../public/images/chexpert/cxp-089.jpg)
- [public/images/chexpert/cxp-090.jpg](../public/images/chexpert/cxp-090.jpg)
- [public/images/chexpert/cxp-091.jpg](../public/images/chexpert/cxp-091.jpg)
- [public/images/chexpert/cxp-092.jpg](../public/images/chexpert/cxp-092.jpg)
- [public/images/chexpert/cxp-093.jpg](../public/images/chexpert/cxp-093.jpg)
- [public/images/chexpert/cxp-094.jpg](../public/images/chexpert/cxp-094.jpg)
- [public/images/chexpert/cxp-095.jpg](../public/images/chexpert/cxp-095.jpg)
- [public/images/chexpert/cxp-096.jpg](../public/images/chexpert/cxp-096.jpg)
- [public/images/chexpert/cxp-097.jpg](../public/images/chexpert/cxp-097.jpg)
- [public/images/chexpert/cxp-098.jpg](../public/images/chexpert/cxp-098.jpg)
- [public/images/chexpert/cxp-099.jpg](../public/images/chexpert/cxp-099.jpg)
- [public/images/chexpert/cxp-100.jpg](../public/images/chexpert/cxp-100.jpg)
- [public/images/chexpert/cxp-101.jpg](../public/images/chexpert/cxp-101.jpg)
- [public/images/chexpert/cxp-102.jpg](../public/images/chexpert/cxp-102.jpg)
- [public/images/chexpert/cxp-103.jpg](../public/images/chexpert/cxp-103.jpg)
- [public/images/chexpert/cxp-104.jpg](../public/images/chexpert/cxp-104.jpg)
- [public/images/chexpert/cxp-105.jpg](../public/images/chexpert/cxp-105.jpg)
- [public/images/chexpert/cxp-106.jpg](../public/images/chexpert/cxp-106.jpg)
- [public/images/chexpert/cxp-107.jpg](../public/images/chexpert/cxp-107.jpg)
- [public/images/chexpert/cxp-108.jpg](../public/images/chexpert/cxp-108.jpg)
- [public/images/chexpert/cxp-109.jpg](../public/images/chexpert/cxp-109.jpg)
- [public/images/chexpert/cxp-110.jpg](../public/images/chexpert/cxp-110.jpg)
- [public/images/chexpert/cxp-111.jpg](../public/images/chexpert/cxp-111.jpg)
- [public/images/chexpert/cxp-112.jpg](../public/images/chexpert/cxp-112.jpg)
- [public/images/chexpert/cxp-113.jpg](../public/images/chexpert/cxp-113.jpg)
- [public/images/chexpert/cxp-114.jpg](../public/images/chexpert/cxp-114.jpg)
- [public/images/chexpert/cxp-115.jpg](../public/images/chexpert/cxp-115.jpg)
- [public/images/chexpert/cxp-116.jpg](../public/images/chexpert/cxp-116.jpg)
- [public/images/chexpert/cxp-117.jpg](../public/images/chexpert/cxp-117.jpg)
- [public/images/chexpert/cxp-118.jpg](../public/images/chexpert/cxp-118.jpg)
- [public/images/chexpert/cxp-119.jpg](../public/images/chexpert/cxp-119.jpg)
- [public/images/chexpert/cxp-120.jpg](../public/images/chexpert/cxp-120.jpg)
- [public/images/chexpert/cxp-121.jpg](../public/images/chexpert/cxp-121.jpg)
- [public/images/chexpert/cxp-122.jpg](../public/images/chexpert/cxp-122.jpg)
- [public/images/chexpert/cxp-123.jpg](../public/images/chexpert/cxp-123.jpg)
- [public/images/chexpert/cxp-124.jpg](../public/images/chexpert/cxp-124.jpg)
- [public/images/chexpert/cxp-125.jpg](../public/images/chexpert/cxp-125.jpg)
- [public/images/chexpert/cxp-126.jpg](../public/images/chexpert/cxp-126.jpg)
- [public/images/chexpert/cxp-127.jpg](../public/images/chexpert/cxp-127.jpg)
- [public/images/chexpert/cxp-128.jpg](../public/images/chexpert/cxp-128.jpg)
- [public/images/chexpert/cxp-129.jpg](../public/images/chexpert/cxp-129.jpg)
- [public/images/chexpert/cxp-130.jpg](../public/images/chexpert/cxp-130.jpg)
- [public/images/chexpert/cxp-131.jpg](../public/images/chexpert/cxp-131.jpg)
- [public/images/chexpert/cxp-132.jpg](../public/images/chexpert/cxp-132.jpg)
- [public/images/chexpert/cxp-133.jpg](../public/images/chexpert/cxp-133.jpg)
- [public/images/chexpert/cxp-134.jpg](../public/images/chexpert/cxp-134.jpg)
- [public/images/chexpert/cxp-135.jpg](../public/images/chexpert/cxp-135.jpg)
- [public/images/chexpert/cxp-136.jpg](../public/images/chexpert/cxp-136.jpg)
- [public/images/chexpert/cxp-137.jpg](../public/images/chexpert/cxp-137.jpg)
- [public/images/chexpert/cxp-138.jpg](../public/images/chexpert/cxp-138.jpg)
- [public/images/chexpert/cxp-139.jpg](../public/images/chexpert/cxp-139.jpg)
- [public/images/chexpert/cxp-140.jpg](../public/images/chexpert/cxp-140.jpg)
- [public/images/chexpert/cxp-141.jpg](../public/images/chexpert/cxp-141.jpg)
- [public/images/chexpert/cxp-142.jpg](../public/images/chexpert/cxp-142.jpg)
- [public/images/chexpert/cxp-143.jpg](../public/images/chexpert/cxp-143.jpg)
- [public/images/chexpert/cxp-144.jpg](../public/images/chexpert/cxp-144.jpg)
- [public/images/chexpert/cxp-145.jpg](../public/images/chexpert/cxp-145.jpg)
- [public/images/chexpert/cxp-146.jpg](../public/images/chexpert/cxp-146.jpg)
- [public/images/chexpert/cxp-147.jpg](../public/images/chexpert/cxp-147.jpg)
- [public/images/chexpert/cxp-148.jpg](../public/images/chexpert/cxp-148.jpg)
- [public/images/chexpert/cxp-149.jpg](../public/images/chexpert/cxp-149.jpg)
- [public/images/chexpert/cxp-150.jpg](../public/images/chexpert/cxp-150.jpg)
- [public/images/chexpert/cxp-151.jpg](../public/images/chexpert/cxp-151.jpg)
- [public/images/chexpert/cxp-152.jpg](../public/images/chexpert/cxp-152.jpg)
- [public/images/chexpert/cxp-153.jpg](../public/images/chexpert/cxp-153.jpg)
- [public/images/chexpert/cxp-154.jpg](../public/images/chexpert/cxp-154.jpg)
- [public/images/chexpert/cxp-155.jpg](../public/images/chexpert/cxp-155.jpg)
- [public/images/chexpert/cxp-156.jpg](../public/images/chexpert/cxp-156.jpg)
- [public/images/chexpert/cxp-157.jpg](../public/images/chexpert/cxp-157.jpg)
- [public/images/chexpert/cxp-158.jpg](../public/images/chexpert/cxp-158.jpg)
- [public/images/chexpert/cxp-159.jpg](../public/images/chexpert/cxp-159.jpg)
- [public/images/chexpert/cxp-160.jpg](../public/images/chexpert/cxp-160.jpg)
- [public/images/chexpert/cxp-161.jpg](../public/images/chexpert/cxp-161.jpg)
- [public/images/chexpert/cxp-162.jpg](../public/images/chexpert/cxp-162.jpg)
- [public/images/chexpert/cxp-163.jpg](../public/images/chexpert/cxp-163.jpg)
- [public/images/chexpert/cxp-164.jpg](../public/images/chexpert/cxp-164.jpg)
- [public/images/chexpert/cxp-165.jpg](../public/images/chexpert/cxp-165.jpg)
- [public/images/chexpert/cxp-166.jpg](../public/images/chexpert/cxp-166.jpg)
- [public/images/chexpert/cxp-167.jpg](../public/images/chexpert/cxp-167.jpg)
- [public/images/chexpert/cxp-168.jpg](../public/images/chexpert/cxp-168.jpg)
- [public/images/chexpert/cxp-169.jpg](../public/images/chexpert/cxp-169.jpg)
- [public/images/chexpert/cxp-170.jpg](../public/images/chexpert/cxp-170.jpg)
- [public/images/chexpert/cxp-171.jpg](../public/images/chexpert/cxp-171.jpg)
- [public/images/chexpert/cxp-172.jpg](../public/images/chexpert/cxp-172.jpg)
- [public/images/chexpert/cxp-173.jpg](../public/images/chexpert/cxp-173.jpg)
- [public/images/chexpert/cxp-174.jpg](../public/images/chexpert/cxp-174.jpg)
- [public/images/chexpert/cxp-175.jpg](../public/images/chexpert/cxp-175.jpg)
- [public/images/chexpert/cxp-176.jpg](../public/images/chexpert/cxp-176.jpg)
- [public/images/chexpert/cxp-177.jpg](../public/images/chexpert/cxp-177.jpg)
- [public/images/chexpert/cxp-178.jpg](../public/images/chexpert/cxp-178.jpg)
- [public/images/chexpert/cxp-179.jpg](../public/images/chexpert/cxp-179.jpg)
- [public/images/chexpert/cxp-180.jpg](../public/images/chexpert/cxp-180.jpg)
- [public/images/chexpert/cxp-181.jpg](../public/images/chexpert/cxp-181.jpg)
- [public/images/chexpert/cxp-182.jpg](../public/images/chexpert/cxp-182.jpg)
- [public/images/chexpert/cxp-183.jpg](../public/images/chexpert/cxp-183.jpg)
- [public/images/chexpert/cxp-184.jpg](../public/images/chexpert/cxp-184.jpg)
- [public/images/chexpert/cxp-185.jpg](../public/images/chexpert/cxp-185.jpg)
- [public/images/chexpert/cxp-186.jpg](../public/images/chexpert/cxp-186.jpg)
- [public/images/chexpert/cxp-187.jpg](../public/images/chexpert/cxp-187.jpg)
- [public/images/chexpert/cxp-188.jpg](../public/images/chexpert/cxp-188.jpg)
- [public/images/chexpert/cxp-189.jpg](../public/images/chexpert/cxp-189.jpg)
- [public/images/chexpert/cxp-190.jpg](../public/images/chexpert/cxp-190.jpg)
- [public/images/chexpert/cxp-191.jpg](../public/images/chexpert/cxp-191.jpg)
- [public/images/chexpert/cxp-192.jpg](../public/images/chexpert/cxp-192.jpg)
- [public/images/chexpert/cxp-193.jpg](../public/images/chexpert/cxp-193.jpg)
- [public/images/chexpert/cxp-194.jpg](../public/images/chexpert/cxp-194.jpg)
- [public/images/chexpert/cxp-195.jpg](../public/images/chexpert/cxp-195.jpg)
- [public/images/chexpert/cxp-196.jpg](../public/images/chexpert/cxp-196.jpg)
- [public/images/chexpert/cxp-197.jpg](../public/images/chexpert/cxp-197.jpg)
- [public/images/chexpert/cxp-198.jpg](../public/images/chexpert/cxp-198.jpg)
- [public/images/chexpert/cxp-199.jpg](../public/images/chexpert/cxp-199.jpg)
- [public/images/chexpert/cxp-200.jpg](../public/images/chexpert/cxp-200.jpg)
- [public/images/chexpert/cxp-201.jpg](../public/images/chexpert/cxp-201.jpg)
- [public/images/chexpert/cxp-202.jpg](../public/images/chexpert/cxp-202.jpg)
- [public/images/chexpert/cxp-203.jpg](../public/images/chexpert/cxp-203.jpg)
- [public/images/chexpert/cxp-204.jpg](../public/images/chexpert/cxp-204.jpg)
- [public/images/chexpert/cxp-205.jpg](../public/images/chexpert/cxp-205.jpg)
- [public/images/chexpert/cxp-206.jpg](../public/images/chexpert/cxp-206.jpg)
- [public/images/chexpert/cxp-207.jpg](../public/images/chexpert/cxp-207.jpg)
- [public/images/chexpert/cxp-208.jpg](../public/images/chexpert/cxp-208.jpg)
- [public/images/chexpert/cxp-209.jpg](../public/images/chexpert/cxp-209.jpg)
- [public/images/chexpert/cxp-210.jpg](../public/images/chexpert/cxp-210.jpg)
- [public/images/chexpert/cxp-211.jpg](../public/images/chexpert/cxp-211.jpg)
- [public/images/chexpert/cxp-212.jpg](../public/images/chexpert/cxp-212.jpg)
- [public/images/chexpert/cxp-213.jpg](../public/images/chexpert/cxp-213.jpg)
- [public/images/chexpert/cxp-214.jpg](../public/images/chexpert/cxp-214.jpg)
- [public/images/chexpert/cxp-215.jpg](../public/images/chexpert/cxp-215.jpg)
- [public/images/chexpert/cxp-216.jpg](../public/images/chexpert/cxp-216.jpg)
- [public/images/chexpert/cxp-217.jpg](../public/images/chexpert/cxp-217.jpg)
- [public/images/chexpert/cxp-218.jpg](../public/images/chexpert/cxp-218.jpg)
- [public/images/chexpert/cxp-219.jpg](../public/images/chexpert/cxp-219.jpg)
- [public/images/chexpert/cxp-220.jpg](../public/images/chexpert/cxp-220.jpg)
- [public/images/chexpert/cxp-221.jpg](../public/images/chexpert/cxp-221.jpg)
- [public/images/chexpert/cxp-222.jpg](../public/images/chexpert/cxp-222.jpg)
- [public/images/chexpert/cxp-223.jpg](../public/images/chexpert/cxp-223.jpg)
- [public/images/chexpert/cxp-224.jpg](../public/images/chexpert/cxp-224.jpg)
- [public/images/chexpert/cxp-225.jpg](../public/images/chexpert/cxp-225.jpg)
- [public/images/chexpert/cxp-226.jpg](../public/images/chexpert/cxp-226.jpg)
- [public/images/chexpert/cxp-227.jpg](../public/images/chexpert/cxp-227.jpg)
- [public/images/chexpert/cxp-228.jpg](../public/images/chexpert/cxp-228.jpg)
- [public/images/chexpert/cxp-229.jpg](../public/images/chexpert/cxp-229.jpg)
- [public/images/chexpert/cxp-230.jpg](../public/images/chexpert/cxp-230.jpg)
- [public/images/chexpert/cxp-231.jpg](../public/images/chexpert/cxp-231.jpg)
- [public/images/chexpert/cxp-232.jpg](../public/images/chexpert/cxp-232.jpg)
- [public/images/chexpert/cxp-233.jpg](../public/images/chexpert/cxp-233.jpg)
- [public/images/chexpert/cxp-234.jpg](../public/images/chexpert/cxp-234.jpg)

</details>

## Specialized documentation

| File | Navigation notes |
|---|---|
| [docs/model-releases.md](../docs/model-releases.md) | Documentation; read its scope, evidence, and date. |
| [docs/models.md](../docs/models.md) | Documentation; read its scope, evidence, and date. |

## System map and planning documents

| File | Navigation notes |
|---|---|
| [map/AGENTS.md](../map/AGENTS.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/CAPSTONE_CURRENT_STATE.md](../map/CAPSTONE_CURRENT_STATE.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/CLAUDE.md](../map/CLAUDE.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/CONTEXT.md](../map/CONTEXT.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/DESIGN.md](../map/DESIGN.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/PRODUCT_REQUIREMENTS_DOCUMENT.md](../map/PRODUCT_REQUIREMENTS_DOCUMENT.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/TECHNICAL_DESIGN_DOCUMENT.md](../map/TECHNICAL_DESIGN_DOCUMENT.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/_meta/schema.md](../map/_meta/schema.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/_templates/object.md](../map/_templates/object.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/_templates/process.md](../map/_templates/process.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/design-flow.md](../map/design-flow.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/effects/CONTEXT.md](../map/effects/CONTEXT.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/CONTEXT.md](../map/objects/CONTEXT.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/_index.md](../map/objects/_index.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/identity/CONTEXT.md](../map/objects/identity/CONTEXT.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/identity/app-role.md](../map/objects/identity/app-role.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/identity/auth-session.md](../map/objects/identity/auth-session.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/identity/platform-administrator.md](../map/objects/identity/platform-administrator.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/identity/professor-application.md](../map/objects/identity/professor-application.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/identity/profile.md](../map/objects/identity/profile.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/inference/CONTEXT.md](../map/objects/inference/CONTEXT.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/inference/active-model-slot.md](../map/objects/inference/active-model-slot.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/inference/attention-heatmap.md](../map/objects/inference/attention-heatmap.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/inference/browser-inference-runtime.md](../map/objects/inference/browser-inference-runtime.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/inference/model-manifest-configuration.md](../map/objects/inference/model-manifest-configuration.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/inference/model-release.md](../map/objects/inference/model-release.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/inference/model-training.md](../map/objects/inference/model-training.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/inference/prediction-result.md](../map/objects/inference/prediction-result.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/inference/preprocessing-tensor.md](../map/objects/inference/preprocessing-tensor.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/CONTEXT.md](../map/objects/learning/CONTEXT.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/activity.md](../map/objects/learning/activity.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/ai-analysis.md](../map/objects/learning/ai-analysis.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/ai-feedback-release.md](../map/objects/learning/ai-feedback-release.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/analytics.md](../map/objects/learning/analytics.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/built-in-xray-library.md](../map/objects/learning/built-in-xray-library.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/chest-gate.md](../map/objects/learning/chest-gate.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/faculty-evaluation.md](../map/objects/learning/faculty-evaluation.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/invitation-code.md](../map/objects/learning/invitation-code.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/learning-case-note.md](../map/objects/learning/learning-case-note.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/local-learning-mode-image.md](../map/objects/learning/local-learning-mode-image.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/notification.md](../map/objects/learning/notification.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/role-workspace-surface.md](../map/objects/learning/role-workspace-surface.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/student-submission.md](../map/objects/learning/student-submission.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/view-detector.md](../map/objects/learning/view-detector.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/workspace-membership.md](../map/objects/learning/workspace-membership.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/workspace.md](../map/objects/learning/workspace.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/learning/xray-case.md](../map/objects/learning/xray-case.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/runtime/CONTEXT.md](../map/objects/runtime/CONTEXT.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/runtime/account-settings.md](../map/objects/runtime/account-settings.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/runtime/admin-action-log.md](../map/objects/runtime/admin-action-log.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/runtime/legal-consent.md](../map/objects/runtime/legal-consent.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/runtime/site-notice.md](../map/objects/runtime/site-notice.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/runtime/supabase-auth-boundary.md](../map/objects/runtime/supabase-auth-boundary.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/runtime/supabase-profile-schema.md](../map/objects/runtime/supabase-profile-schema.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/ui/CONTEXT.md](../map/objects/ui/CONTEXT.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/ui/administrator-approval-surface.md](../map/objects/ui/administrator-approval-surface.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/ui/attention-maps-surface.md](../map/objects/ui/attention-maps-surface.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/ui/auth-surface.md](../map/objects/ui/auth-surface.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/ui/design-tokens.md](../map/objects/ui/design-tokens.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/ui/landing-surface.md](../map/objects/ui/landing-surface.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/ui/privacy-policy.md](../map/objects/ui/privacy-policy.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/ui/shared-settings-surface.md](../map/objects/ui/shared-settings-surface.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/ui/student-learning-mode-surface.md](../map/objects/ui/student-learning-mode-surface.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/ui/terms.md](../map/objects/ui/terms.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/objects/ui/xray-sample-asset.md](../map/objects/ui/xray-sample-asset.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/CONTEXT.md](../map/processes/CONTEXT.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/account-settings-update.md](../map/processes/account-settings-update.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/activity-ai-analysis.md](../map/processes/activity-ai-analysis.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/activity-authoring-publication.md](../map/processes/activity-authoring-publication.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/browser-model-conformance.md](../map/processes/browser-model-conformance.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/confirmation-and-recovery.md](../map/processes/confirmation-and-recovery.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/faculty-evaluation.md](../map/processes/faculty-evaluation.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/invitation-redemption.md](../map/processes/invitation-redemption.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/login-and-role-routing.md](../map/processes/login-and-role-routing.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/logout.md](../map/processes/logout.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/membership-exit.md](../map/processes/membership-exit.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/model-activation.md](../map/processes/model-activation.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/model-rollback.md](../map/processes/model-rollback.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/model-staging.md](../map/processes/model-staging.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/model-validation.md](../map/processes/model-validation.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/privacy-consent-recording.md](../map/processes/privacy-consent-recording.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/professor-application-review.md](../map/processes/professor-application-review.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/registration.md](../map/processes/registration.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/roster-management.md](../map/processes/roster-management.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/session-protection.md](../map/processes/session-protection.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/student-activity-view.md](../map/processes/student-activity-view.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/student-learning-mode-inference.md](../map/processes/student-learning-mode-inference.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/student-submission.md](../map/processes/student-submission.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/processes/workspace-creation.md](../map/processes/workspace-creation.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/routing.md](../map/routing.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |
| [map/thoraxscan-app-flow.md](../map/thoraxscan-app-flow.md) | System-map or planning document; see its status and cited source before treating it as implemented behavior. |

## Assistant tooling

| File | Navigation notes |
|---|---|
| [.claude/launch.json](../.claude/launch.json) | Assistant dev-server launch configuration. |
| [.claude/settings.json](../.claude/settings.json) | Enabled assistant plugins. |
| [.claude/skills/icm-architect-main/LICENSE](../.claude/skills/icm-architect-main/LICENSE) | Vendored assistant skill resource; separate from application runtime. |
| [.claude/skills/icm-architect-main/README.md](../.claude/skills/icm-architect-main/README.md) | Vendored assistant skill resource; separate from application runtime. |
| [.claude/skills/icm-architect-main/SKILL.md](../.claude/skills/icm-architect-main/SKILL.md) | Vendored assistant skill resource; separate from application runtime. |
| [.claude/skills/icm-architect-main/assets/templates/CLAUDE.md](../.claude/skills/icm-architect-main/assets/templates/CLAUDE.md) | Vendored assistant skill resource; separate from application runtime. |
| [.claude/skills/icm-architect-main/assets/templates/CONTEXT.md](../.claude/skills/icm-architect-main/assets/templates/CONTEXT.md) | Vendored assistant skill resource; separate from application runtime. |
| [.claude/skills/icm-architect-main/assets/templates/node.md](../.claude/skills/icm-architect-main/assets/templates/node.md) | Vendored assistant skill resource; separate from application runtime. |
| [.claude/skills/icm-architect-main/assets/templates/object.md](../.claude/skills/icm-architect-main/assets/templates/object.md) | Vendored assistant skill resource; separate from application runtime. |
| [.claude/skills/icm-architect-main/assets/templates/process.md](../.claude/skills/icm-architect-main/assets/templates/process.md) | Vendored assistant skill resource; separate from application runtime. |
| [.claude/skills/icm-architect-main/assets/templates/questionnaire.md](../.claude/skills/icm-architect-main/assets/templates/questionnaire.md) | Vendored assistant skill resource; separate from application runtime. |
| [.claude/skills/icm-architect-main/assets/templates/schema.md](../.claude/skills/icm-architect-main/assets/templates/schema.md) | Vendored assistant skill resource; separate from application runtime. |
| [.claude/skills/icm-architect-main/assets/templates/stage-CONTEXT.md](../.claude/skills/icm-architect-main/assets/templates/stage-CONTEXT.md) | Vendored assistant skill resource; separate from application runtime. |
| [.claude/skills/icm-architect-main/references/core.md](../.claude/skills/icm-architect-main/references/core.md) | Vendored assistant skill resource; separate from application runtime. |
| [.claude/skills/icm-architect-main/references/forms.md](../.claude/skills/icm-architect-main/references/forms.md) | Vendored assistant skill resource; separate from application runtime. |
| [.claude/skills/icm-architect-main/references/reference-integrity.md](../.claude/skills/icm-architect-main/references/reference-integrity.md) | Vendored assistant skill resource; separate from application runtime. |
| [.claude/skills/icm-architect-main/references/system-map.md](../.claude/skills/icm-architect-main/references/system-map.md) | Vendored assistant skill resource; separate from application runtime. |

## Generated and local-only files

| Path | How to treat it |
|---|---|
| `node_modules/` | Installed packages. Reinstall through npm; do not implement app features inside them. |
| `.next/`, `out/`, `build/` | Generated build output, ignored by the repo. |
| `public/ort/1.27.0/` | Runtime assets copied by `prepare:ort`. |
| `.env`, `.env.local` and other real environment files | Local configuration; never include secrets in documentation or commits. |
| `model-input/<release-id>/` | Ignored release bundles with model artifacts and validation fixtures. |
| `coverage/`, `test-results/`, `playwright-report/` | Generated verification output. |
| `model-export/__pycache__/` and exported checkpoints/ONNX files | Local/generated model resources, not the tracked application code. |

Sources: [.gitignore](../.gitignore), [package.json](../package.json), [model release runbook](model-releases.md).

## Refreshing the inventory

Use `git ls-tree -r --name-only <commit>` to list a fixed revision, `git ls-files` for the index, and `git status --short` for working changes. Update this reference and its baseline together. Check link targets and source declarations again; copying an older count or export name does not verify it.
