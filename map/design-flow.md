# Design Flow

## 1. Document Information

| Field | Value |
| --- | --- |
| Project name | ThoraxScan |
| Document purpose | Implementation-ready representation of the supplied student-side and professor-side UI/UX frames |
| Product type | Educational LMS with AI-assisted chest X-ray analysis |
| Supported platforms | Desktop/web prototype is evidenced; tablet and mobile behavior are not specified |
| Date generated | 2026-08-07 |
| Document status | Draft; confirmed, inferred, and missing information are separated |
| Unique linked frames | 27 |
| Known limitations | Routes, detailed professor controls, responsive behavior, backend states, permissions, and several error states are not defined |

### Sources reviewed

- [Lo-Fi-ThoraxScan Figma file](https://www.figma.com/design/trV0538sgRpPHXc6160ok2/Lo-Fi-ThoraxScan?node-id=473-1183&t=FYotPll44s7IrYNZ-4)
- Student frames: 473:1183, 485:1025, 651:882, 560:777, 653:797, 653:811, 473:514, 498:1412, 473:580, 657:1091, 657:1222, 473:633, 473:834, 473:914, 473:1045, 473:981
- Professor frames: 651:852, 667:960, 667:971, 667:982, 678:1015, 681:1448, 681:1577, 681:1754, 684:1934, 684:2126, 684:2268
- Shared settings frames: 473:834, 473:914, 473:1045, 473:981
- Previous derived flow: map/thoraxscan-app-flow.md
- User-provided master prompt: pasted-text.txt

The exact title of some linked frames was not exposed by the available Figma context. Those frames are named by role and sequence and marked Inferred or Needs confirmation.

## 2. Product Overview

ThoraxScan is an educational LMS for Radiologic Technology students. The landing frame describes an AI-Assisted Chest X-Ray Learning Platform for professor-guided practice, with SqueezeViT, ONNX Runtime Web, and Attention Heatmap XAI.

### Primary user goals

- Students complete guided chest X-ray interpretation activities.
- Students inspect model attention regions and use feedback for learning.
- Professors create, configure, preview, and publish activities.
- Professors review attempts, provide feedback, and monitor progress.
- Both roles manage profile, display, privacy, and data settings.

### Product constraints visible in the sources

- AI output is for guided learning and must not be used for clinical diagnosis or patient care.
- X-ray images are analyzed locally using ONNX Runtime Web.
- The privacy frame states that image data is not sent to external servers.

The central task is for a student to complete an assigned chest X-ray activity, review the Attention Heatmap, submit an interpretation, and learn from feedback. The professor authoring and review loop is inferred from the two supplied role sets.

## 3. User Roles

### Guest

- **Primary goal:** Understand ThoraxScan, log in, or register.
- **Default screen:** SCR-001, Landing.
- **Can access:** Public landing and authentication screens.
- **Cannot access:** Authenticated student or professor workspaces.
- **Authentication:** Not authenticated.
- **Permissions:** No learning or management permissions.

### Student

- **Primary goal:** Complete assigned chest X-ray learning activities.
- **Default screen:** Student workspace after successful login; exact frame title is not exposed.
- **Can access:** Activities, X-Ray Analysis, Attention Heatmap, Learning Mode, Attention Maps, and shared settings.
- **Cannot access:** Professor authoring, student management, and class analytics; restriction is inferred and needs confirmation.
- **Authentication:** Student login is explicitly shown in SCR-003.
- **Permissions:** Own learning data and assigned activities; exact data permissions need confirmation.

### Professor

- **Primary goal:** Manage students, author activities, review submissions, and monitor progress.
- **Default screen:** Professor workspace after authentication; exact frame title is not exposed.
- **Can access:** Student roster/detail, activity management, authoring, publishing, submission review, feedback, and analytics; inferred from professor frame sequence.
- **Cannot access:** Student-only actions are not defined.
- **Authentication:** A separate professor login frame is not supplied.
- **Permissions:** Student and activity management permissions are inferred and need confirmation.

## 4. Screen Inventory

Routes are not present in the sources. Route values are therefore Not defined. Suggested routes are in Section 15.

| ID | Screen or View | Role | Route if Known | Entry Point | Primary Purpose | Main Exit Points | Source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-001 | Figure 1 - Landing | Guest | Not defined | Application entry | Introduce product, show disclaimer, enter auth | Login; registration entry needs confirmation | 473:1183, Confirmed |
| SCR-002 | Figure 2.0 - Register | Guest | Not defined | Registration entry | Create account | Confirm; Back to home | 485:1025, Confirmed |
| SCR-003 | Figure 3.0 - Login - Student | Guest / Student | Not defined | Landing Login | Authenticate student | Confirm; Forget Password; Back to home | 651:882, Confirmed |
| SCR-004 | Figure 3.1 - Login - Forget Password Student | Guest / Student | Not defined | Forget Password | Start recovery | OTP; return to login | 560:777, Partially confirmed |
| SCR-005 | Figure 3.2 - Login - Forget Password Student 2 | Guest / Student | Not defined | Recovery start | Verify work-email OTP | Reset Password; Sign-in | 653:797, Confirmed |
| SCR-006 | Password recovery continuation | Guest / Student | Not defined | Successful OTP | Set replacement password | Login; error state | 653:811, Inferred |
| SCR-007 | Student workspace/dashboard | Student | Not defined | Student authentication | Entry point to student learning areas | Activities; Learning Mode; Attention Maps; Settings; Logout | 473:514, Inferred |
| SCR-008 | Student Activities | Student | Not defined | Student workspace | Browse assigned activities | Activity details; workspace | 498:1412, Inferred |
| SCR-009 | Activity details | Student | Not defined | Activities | Review activity before analysis | X-Ray Analysis; Activities | 473:580, Inferred |
| SCR-010 | X-Ray Analysis workspace | Student | Not defined | Activity details | Select/provide chest X-ray and run analysis | Attention Heatmap; retry | 657:1091, Inferred |
| SCR-011 | Attention Heatmap | Student | Not defined | Completed inference | Show model attention feedback | Response; saved maps | 657:1222, Inferred from product copy |
| SCR-012 | Interpretation and submission | Student | Not defined | Attention Heatmap | Enter and submit interpretation | AI feedback; continue practice | 473:633, Inferred |
| SCR-013 | Settings parent view | Student / Professor | Not defined | Authenticated sidebar | Navigate settings categories | Profile; Display; Privacy; Save; Logout | 473:834, Shared; title needs confirmation |
| SCR-014 | Settings - Profile | Student / Professor | Not defined | Settings | Manage profile | Save; Settings | 473:914, Shared; title needs confirmation |
| SCR-015 | Settings - Display | Student / Professor | Not defined | Settings | Manage display preferences | Save; Settings | 473:1045, Shared; title needs confirmation |
| SCR-016 | Figure 8.2 - Sub-Settings - Students 2 / Privacy and Data | Student / Professor | Not defined | Settings | Show privacy-first local processing | Save; Dashboard; Logout | 473:981, Confirmed |
| SCR-017 | Professor workspace/dashboard | Professor | Not defined | Professor authentication | Entry point to professor management | Roster; activities; review; analytics; settings | 651:852, Title inferred |
| SCR-018 | Student roster | Professor | Not defined | Professor workspace | Browse students/cohorts | Student detail; workspace | 667:960, Purpose inferred |
| SCR-019 | Student detail | Professor | Not defined | Student roster | Inspect individual progress | Submission review; roster | 667:971, Purpose inferred |
| SCR-020 | Activity management | Professor | Not defined | Professor workspace | Browse/manage authored activities | Create; edit; preview | 667:982, Purpose inferred |
| SCR-021 | Create activity | Professor | Not defined | Activity management | Start authoring | Case setup; rubric; preview | 678:1015, Purpose inferred |
| SCR-022 | X-Ray case setup | Professor | Not defined | Create activity | Configure case content | Rubric; preview | 681:1448, Purpose inferred |
| SCR-023 | Instructions and rubric | Professor | Not defined | Create activity | Define instructions and criteria | Preview; edit | 681:1577, Purpose inferred |
| SCR-024 | Activity preview | Professor | Not defined | Authoring steps | Review before publishing | Publish; edit | 681:1754, Purpose inferred |
| SCR-025 | Publish activity | Professor | Not defined | Activity preview | Make activity available | Activity management; student activities | 684:1934, Purpose inferred |
| SCR-026 | Submission review | Professor | Not defined | Workspace/student detail | Review attempt and feedback | Student detail; roster | 684:2126, Purpose inferred |
| SCR-027 | Class progress and analytics | Professor | Not defined | Professor workspace | Monitor learning progress | Student detail; workspace | 684:2268, Purpose inferred |

## 5. Global Navigation Structure

### Public navigation

- SCR-001 is the public entry point.
- Login is visibly available.
- Back to home is visible on registration and login.
- Registration is a supplied frame, but its exact trigger placement is not confirmed.
- The educational disclaimer is visible on the landing page.

### Authenticated navigation

The settings frame visibly exposes a sidebar with:

- Dashboard
- Activities
- Learning Mode
- Attention Maps
- Settings
- Logout

The same frame shows ThoraxScan branding, notification bell, reload control, date, breadcrumb, active AI model, and footer status text. Whether all items are available to both roles needs confirmation.

### Role-based navigation

Separate student and professor frame groups establish role-specific areas. The mechanism for role selection or detection is not shown.

### Navigation rules

- Breadcrumb visible in SCR-016: Home / X-Ray Analysis.
- Browser back, direct URL access, protected-route redirects, and session expiry are not specified.
- Unsaved-change behavior is not shown.
- Logout control is visible; destination/session invalidation is not specified.

~~~mermaid
flowchart TD
    landing["Landing"] --> login["Login"]
    landing -.->|"Registration entry needs confirmation"| register["Register"]
    login --> studentWorkspace["Student workspace"]
    login -.->|"Professor routing needs confirmation"| professorWorkspace["Professor workspace"]
    studentWorkspace --> activities["Activities"]
    studentWorkspace --> learningMode["Learning Mode"]
    studentWorkspace --> attentionMaps["Attention Maps"]
    studentWorkspace --> settings["Settings"]
    professorWorkspace --> roster["Student roster"]
    professorWorkspace --> activityManagement["Activity management"]
    professorWorkspace --> submissions["Submission review"]
    professorWorkspace --> analytics["Class analytics"]
    settings --> profile["Profile"]
    settings --> display["Display"]
    settings --> privacy["Privacy and Data"]
    settings --> logout["Logout"]
~~~

## 6. Master Application Flow

~~~mermaid
flowchart LR
    landing["Landing"]
    disclaimer["Educational disclaimer"]
    login["Login"]
    register["Register"]
    confirmRegistration["Confirm registration"]
    recovery["Forgot password"]
    otp["Verify OTP"]
    resetPassword["Reset password"]
    roleRouting{"Role-based routing"}
    studentWorkspace["Student workspace"]
    professorWorkspace["Professor workspace"]
    activity["Assigned activity"]
    analysis["X-Ray Analysis"]
    heatmap["Attention Heatmap"]
    response["Interpretation response"]
    submission["Submitted attempt"]
    studentFeedback["AI-assisted feedback"]
    authoring["Create and configure activity"]
    publish["Publish activity"]
    professorReview["Review submission and heatmap"]
    professorFeedback["Professor feedback"]
    settings["Settings"]
    logout(["Logout"])

    landing -.-> disclaimer
    landing --> login
    login -.->|"Registration entry needs confirmation"| register
    register --> confirmRegistration --> login
    login -->|"Use recovery"| recovery --> otp --> resetPassword --> login
    login --> roleRouting
    roleRouting -->|"Student"| studentWorkspace
    roleRouting -.->|"Professor route needs confirmation"| professorWorkspace
    studentWorkspace --> activity --> analysis --> heatmap --> response --> submission --> studentFeedback
    studentFeedback --> studentWorkspace
    professorWorkspace --> authoring --> publish
    publish -.->|"New assigned activity"| activity
    professorWorkspace --> professorReview --> professorFeedback
    professorFeedback -.->|"Feedback availability needs confirmation"| studentFeedback
    studentWorkspace --> settings
    professorWorkspace --> settings
    settings --> logout
~~~

## 7. Role-Based User Flows

### Student

Starting point: SCR-001 or SCR-003. Main task: complete an assigned activity and use attention-map feedback. Secondary tasks: Learning Mode, Attention Maps, Settings, and Logout.

~~~mermaid
flowchart TD
    login["Student Login"] --> auth{"Credentials accepted?"}
    auth -->|"No: error state needs confirmation"| login
    auth -->|"Yes"| dashboard["Student workspace"]
    dashboard --> activities["Activities"]
    activities --> details["Activity details"]
    details --> analysis["X-Ray Analysis"]
    analysis --> imageCheck{"Image accepted?"}
    imageCheck -->|"No: validation state needs confirmation"| analysis
    imageCheck -->|"Yes"| inference["Local SqueezeViT inference"]
    inference --> heatmap["Attention Heatmap"]
    heatmap --> response["Interpretation response"]
    response --> submit{"Submit attempt?"}
    submit -->|"Continue practicing"| response
    submit -->|"Submit"| feedback["AI-assisted feedback"]
    feedback --> dashboard
    dashboard --> settings["Settings"]
    settings --> dashboard
    dashboard --> logout["Logout"]
~~~

Student restrictions: professor authoring, student management, and class analytics are not shown in the student frames and need confirmation as restricted features.

### Professor

Starting point: professor workspace after authentication. A separate professor login frame is not supplied.

~~~mermaid
flowchart TD
    entry["Authenticated professor entry"] --> dashboard["Professor workspace"]
    dashboard --> roster["Student roster"]
    roster --> studentDetail["Student detail"]
    dashboard --> activityManagement["Activity management"]
    activityManagement --> createActivity["Create activity"]
    createActivity --> caseSetup["X-Ray case setup"]
    createActivity --> rubric["Instructions and rubric"]
    caseSetup --> preview["Activity preview"]
    rubric --> preview
    preview --> ready{"Ready to publish?"}
    ready -->|"No: edit"| createActivity
    ready -->|"Yes"| publish["Publish activity"]
    publish -.->|"New assigned activity"| studentActivity["Student Activities"]
    dashboard --> submissions["Submission review"]
    submissions --> attempt["Open student attempt"]
    attempt --> review["Review response and heatmap"]
    review --> feedback["Professor feedback"]
    dashboard --> analytics["Class progress and analytics"]
    dashboard --> settings["Settings"]
    settings --> dashboard
    dashboard --> logout["Logout"]
~~~

### Shared settings

~~~mermaid
flowchart TD
    workspace["Student or professor workspace"] --> settings["Settings"]
    settings --> profile["Profile"]
    settings --> display["Display"]
    settings --> privacy["Privacy and Data"]
    profile --> save["Save Changes"]
    display --> save
    privacy --> save
    save --> settings
    settings --> logout["Logout"]
~~~

## 8. Detailed Screen Specifications

The screen-by-screen specifications below use the same fields for every linked frame. Missing states and controls are explicitly marked Needs confirmation.

### SCR-001 — Figure 1 - Landing

**Role:** Guest  
**Route:** Not defined  
**Screen type:** Page  
**Source reference:** Figma 473:1183, Confirmed  
**Purpose:** Introduce ThoraxScan and direct visitors to authentication.  
**Entry points:** Application entry.  
**Exit points:** Login; registration entry needs confirmation.

**Main Interface Areas**

Brand header; AI-Assisted Chest X-Ray Learning Platform hero; product description; SqueezeViT, ONNX Runtime Web, and Attention Heatmap XAI line; chest X-ray visual; Login button; Educational Disclaimer banner.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Login | Visible in source | Opens authentication | SCR-003 |
| Register | Trigger placement not visible | Starts registration | SCR-002, Needs confirmation |

**Navigation Rules:** Public entry; no authenticated navigation. Browser-back and direct URL behavior need confirmation.  
**Data Requirements:** Static product content; no user input.  
**Interface States:** Default confirmed. Loading, error, offline, and accessibility-specific states need confirmation.  
**Responsive Behavior:** Desktop only; tablet/mobile needs confirmation.  
**Accessibility Requirements:** Readable disclaimer; labelled Login; meaningful or decorative X-ray alternative text; visible focus.

### SCR-002 — Figure 2.0 - Register

**Role:** Guest  
**Route:** Not defined  
**Screen type:** Page  
**Source reference:** Figma 485:1025, Confirmed  
**Purpose:** Create an account.  
**Entry points:** Registration entry; exact trigger needs confirmation.  
**Exit points:** Confirm; Back to home.

**Main Interface Areas**

Create Account heading; Register Credentials section; credential controls; visible Password and Confirm Password fields; Confirm; Back to home.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Confirm | Required data valid; rules not supplied | Submit registration | Success destination needs confirmation |
| Back to home | Visible | Leave registration | SCR-001 |

**Navigation Rules:** Back to home is confirmed. Unsaved-change warning is not shown.  
**Data Requirements:** Registration credentials; password and confirmation are visible; other fields need confirmation.  
**Interface States:** Default confirmed. Validation, duplicate account, loading, server error, and success states need confirmation.  
**Responsive Behavior:** Desktop only; tablet/mobile needs confirmation.  
**Accessibility Requirements:** Programmatic field labels; password mismatch announcement; duplicate-submit prevention.

### SCR-003 — Figure 3.0 - Login - Student

**Role:** Guest / Student  
**Route:** Not defined  
**Screen type:** Page  
**Source reference:** Figma 651:882, Confirmed  
**Purpose:** Authenticate a student.  
**Entry points:** Landing Login.  
**Exit points:** Confirm; Forget Password; Back to home.

**Main Interface Areas**

Welcome Back; Login Credentials; credential controls; Password; Remember me; Forget Password; Confirm; Back to home.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Confirm | Valid credentials; rules not supplied | Authenticate | Student workspace, exact frame needs confirmation |
| Forget Password | Visible | Start recovery | SCR-004 |
| Back to home | Visible | Leave login | SCR-001 |
| Remember me | User-selected | Session behavior needs confirmation | Same flow |

**Navigation Rules:** Invalid credentials should keep the user on login, but the error treatment is not supplied. Professor routing is not represented.  
**Data Requirements:** Credential field(s), password, remember-me preference. Exact identity field and validation need confirmation.  
**Interface States:** Default confirmed. Invalid credentials, locked/disabled account, loading, and server error need confirmation.  
**Responsive Behavior:** Desktop only; tablet/mobile needs confirmation.  
**Accessibility Requirements:** Labelled inputs; state-readable Remember me; associated error messages; visible focus.

### SCR-004 — Figure 3.1 - Login - Forget Password Student

**Role:** Guest / Student  
**Route:** Not defined  
**Screen type:** Page or auth state, exact type needs confirmation  
**Source reference:** Figma 560:777, recovery function name exposed  
**Purpose:** Begin password recovery.  
**Entry points:** SCR-003 Forget Password.  
**Exit points:** OTP verification or login; exact controls need confirmation.

**Main Interface Areas**

Recovery instruction and account identifier/email control are inferred; exact visible content was not exposed.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Start recovery | Valid identifier; rules need confirmation | Sends verification step | SCR-005, Inferred |
| Cancel/back | If present | Returns to login | SCR-003, Needs confirmation |

**Navigation Rules:** Part of the student recovery sequence. Direct access, retry, and back behavior need confirmation.  
**Data Requirements:** Account identifier or work email, inferred.  
**Interface States:** Invalid account, delivery failure, resend, rate limit, and loading need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Labelled recovery input; announced instructions/errors; logical focus.

### SCR-005 — Figure 3.2 - Login - Forget Password Student 2

**Role:** Guest / Student  
**Route:** Not defined  
**Screen type:** Page or auth state  
**Source reference:** Figma 653:797, Confirmed visible OTP/work-email content  
**Purpose:** Verify identity during recovery.  
**Entry points:** SCR-004.  
**Exit points:** Reset Password; Sign-in.

**Main Interface Areas**

OTP heading; work-email instruction; OTP control; Verify OTP; Sign-in; Reset Password label/action.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Verify OTP | Code valid; length/lifetime not supplied | Continue recovery | SCR-006, Inferred |
| Sign-in | Visible | Return to authentication | SCR-003 |

**Navigation Rules:** Work-email verification is confirmed; resend and expiration behavior need confirmation.  
**Data Requirements:** OTP and recovery email/context.  
**Interface States:** Invalid, expired, resend, rate limit, loading need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Labelled OTP input; error association; verification status not color-only.

### SCR-006 — Password recovery continuation

**Role:** Guest / Student  
**Route:** Not defined  
**Screen type:** Page or auth state  
**Source reference:** Figma 653:811, Inferred from recovery sequence  
**Purpose:** Set a replacement password after OTP verification.  
**Entry points:** Successful SCR-005.  
**Exit points:** Login after success.

**Main Interface Areas**

Replacement-password controls and confirmation action are inferred.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Set password | Password policy passes; policy needs confirmation | Update password | SCR-003, Inferred |
| Cancel/back | If present | Abandon reset | SCR-003, Needs confirmation |

**Navigation Rules:** Follows OTP in the supplied sequence.  
**Data Requirements:** New password and confirmation, inferred.  
**Interface States:** Mismatch, weak password, expired recovery session, success, and server error need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Text password requirements; associated errors; visible focus.

### SCR-007 — Student workspace/dashboard

**Role:** Student  
**Route:** Not defined  
**Screen type:** Page  
**Source reference:** Figma 473:514, Student frame; title not exposed  
**Purpose:** Student entry point to learning areas.  
**Entry points:** Successful student authentication.  
**Exit points:** Activities; Learning Mode; Attention Maps; Settings; Logout.

**Main Interface Areas**

Dashboard/workspace composition is not exposed; role and sequence are inferred.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Activities | Authenticated student | Browse activities | SCR-008 |
| Settings | Authenticated | Manage settings | SCR-013 |
| Logout | Authenticated | End session | Signed-out state, Needs confirmation |

**Navigation Rules:** Default student workspace is inferred.  
**Data Requirements:** Assigned activities and student context, inferred.  
**Interface States:** Loading, empty activities, error, session expired, permission denied need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Current navigation; accessible empty/error announcements.

### SCR-008 — Student Activities

**Role:** Student  
**Route:** Not defined  
**Screen type:** Page or workspace view  
**Source reference:** Figma 498:1412, Purpose inferred  
**Purpose:** Browse assigned learning activities.  
**Entry points:** SCR-007.  
**Exit points:** SCR-009; workspace navigation.

**Main Interface Areas**

Activity list/cards, status, and availability are inferred.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Open activity | Activity available | View details | SCR-009 |
| Return workspace | Authenticated | Return to workspace | SCR-007 |

**Navigation Rules:** Activity availability, search/filter, deleted activity behavior, and direct access need confirmation.  
**Data Requirements:** Assigned activities and status, inferred.  
**Interface States:** Loading, populated, empty, unavailable, and error need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Accessible activity names and text status; keyboard-operable cards.

### SCR-009 — Activity details

**Role:** Student  
**Route:** Not defined  
**Screen type:** Page or workspace view  
**Source reference:** Figma 473:580, Purpose inferred  
**Purpose:** Present a guided activity before analysis.  
**Entry points:** SCR-008.  
**Exit points:** SCR-010; Activities.

**Main Interface Areas**

Activity content/instructions and a start path into X-Ray Analysis are inferred.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Start activity | Activity available | Open analysis | SCR-010 |
| Back to activities | If present | Return to list | SCR-008 |

**Navigation Rules:** Publication relationship is inferred. Required instruction review and stale-activity behavior need confirmation.  
**Data Requirements:** Activity instructions, case data, availability, inferred.  
**Interface States:** Loading, missing, unavailable, error need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Readable instructions; labelled start/back actions; visible focus.

### SCR-010 — X-Ray Analysis workspace

**Role:** Student  
**Route:** Not defined  
**Screen type:** Page or workspace view  
**Source reference:** Figma 657:1091, Purpose inferred  
**Purpose:** Select/provide a chest X-ray and begin analysis.  
**Entry points:** SCR-009.  
**Exit points:** SCR-011; retry or return.

**Main Interface Areas**

Image input/selection, analysis action, and processing state are inferred. Local processing is confirmed as a product rule in SCR-016.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Select/upload image | Supported input; rules need confirmation | Prepare image | Validation/processing |
| Run analysis | Valid image and model available | Run local inference | SCR-011 |
| Retry | Failed/invalid state | Reopen input | Same screen, Needs confirmation |

**Navigation Rules:** Analysis is associated with an activity. Image replacement after processing needs confirmation.  
**Data Requirements:** X-ray, model availability, local runtime. File type/size/orientation rules need confirmation.  
**Interface States:** Default, selected, processing, complete, invalid input, failure, and offline need confirmation except local processing policy.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Labelled file input; announced processing; accessible image description.

### SCR-011 — Attention Heatmap

**Role:** Student  
**Route:** Not defined  
**Screen type:** Page or workspace view  
**Source reference:** Figma 657:1222; product copy confirms concept  
**Purpose:** Show model attention regions as learning feedback.  
**Entry points:** Completed local inference.  
**Exit points:** SCR-012; saved-map review.

**Main Interface Areas**

Chest X-ray visualization, attention overlay, and interpretation context are inferred.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Review heatmap | Inference complete | Inspect attention | Same screen |
| Continue response | Heatmap available | Open interpretation | SCR-012 |

**Navigation Rules:** The heatmap is assistive and non-diagnostic. Storage/revisit behavior needs confirmation.  
**Data Requirements:** X-ray, model attention output, inference status, model name.  
**Interface States:** Completed is supported; processing, unavailable model, failed inference, and no heatmap need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Do not rely on color alone; provide textual explanation; retain disclaimer.

### SCR-012 — Interpretation and submission

**Role:** Student  
**Route:** Not defined  
**Screen type:** Page or workspace view  
**Source reference:** Figma 473:633, Purpose inferred  
**Purpose:** Enter and submit an interpretation.  
**Entry points:** SCR-011.  
**Exit points:** AI-assisted feedback; continue practice; workspace.

**Main Interface Areas**

Response field, heatmap context, and Submit action are inferred.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Revise response | Before submission | Update draft | Same screen |
| Submit attempt | Required response valid; rules need confirmation | Store attempt and produce feedback | AI feedback, Inferred |
| Continue practicing | User chooses not to submit | Keep activity open | Same screen |

**Navigation Rules:** Unsaved response and duplicate submission rules need confirmation.  
**Data Requirements:** Response, activity, X-ray context, inferred.  
**Interface States:** Draft, validation error, submitting, submitted, processing, and failure need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Labelled response input; announced validation/result; submit loading state.

### SCR-013 — Settings parent view

**Role:** Student / Professor  
**Route:** Not defined  
**Screen type:** Authenticated page or settings view  
**Source reference:** Figma 473:834, Shared; title needs confirmation  
**Purpose:** Navigate settings categories.  
**Entry points:** Authenticated sidebar Settings.  
**Exit points:** SCR-014, SCR-015, SCR-016, Save, Logout.

**Main Interface Areas**

Settings category navigation is inferred; related sidebar is visible in SCR-016.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Profile | Authenticated | Open profile settings | SCR-014 |
| Display | Authenticated | Open display settings | SCR-015 |
| Privacy and Data | Authenticated | Open privacy settings | SCR-016 |
| Logout | Authenticated | End session | Signed-out state |

**Navigation Rules:** Shared role access is indicated by duplicate frame references. Unsaved-change behavior needs confirmation.  
**Data Requirements:** Account and configuration values.  
**Interface States:** Loading, save failure, session expired need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Current settings category; labelled logout; accessible focus order.

### SCR-014 — Settings - Profile

**Role:** Student / Professor  
**Route:** Not defined  
**Screen type:** Settings page/tab  
**Source reference:** Figma 473:914, Shared; title needs confirmation  
**Purpose:** Manage profile information.  
**Entry points:** SCR-013.  
**Exit points:** Save; Settings.

**Main Interface Areas**

Profile fields are inferred.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Edit profile | Authenticated | Update local state | Same screen |
| Save Changes | Valid fields; rules need confirmation | Persist settings | Same settings area |

**Navigation Rules:** Unsaved-change and role-specific fields need confirmation.  
**Data Requirements:** Profile fields; exact names/requiredness not exposed.  
**Interface States:** Default, dirty, saving, saved, validation error, save error need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Labelled inputs and associated errors.

### SCR-015 — Settings - Display

**Role:** Student / Professor  
**Route:** Not defined  
**Screen type:** Settings page/tab  
**Source reference:** Figma 473:1045, Shared; title needs confirmation  
**Purpose:** Manage display preferences.  
**Entry points:** SCR-013.  
**Exit points:** Save; Settings.

**Main Interface Areas**

Display controls are inferred.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Change preference | Authenticated | Update local state | Same screen |
| Save Changes | Valid settings | Persist preference | Same settings area |

**Navigation Rules:** Immediate versus save-on-submit behavior needs confirmation.  
**Data Requirements:** Display preference values; exact fields not exposed.  
**Interface States:** Default, dirty, saving, saved, save error need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Accessible control names and state announcements; preserve contrast/focus.

### SCR-016 — Figure 8.2 - Sub-Settings - Students 2 / Privacy and Data

**Role:** Student / Professor  
**Route:** Not defined  
**Screen type:** Authenticated settings page/tab  
**Source reference:** Figma 473:981, Confirmed visible content  
**Purpose:** Communicate privacy-first local processing and expose settings.

**Main Interface Areas**

Authenticated sidebar; Dashboard, Activities, Learning Mode, Attention Maps, Settings, Logout; Home / X-Ray Analysis breadcrumb; ThoraxScan header; notification and reload icons; date; Settings heading; Profile, Display, Privacy category navigation; Privacy and Data panel; Local Processing Enabled message; Save Changes; non-diagnostic footer; ONNX Runtime Web local inference; SqueezeViT; prototype version.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Dashboard | Authenticated | Open role workspace | SCR-007 or SCR-017, role-dependent |
| Activities | Authenticated | Open activities area | SCR-008 or professor activity management |
| Learning Mode | Student feature available | Open learning view | Exact frame needs confirmation |
| Attention Maps | Attention data exists | Open map view | SCR-011 or saved-map view |
| Profile | Authenticated | Open profile settings | SCR-014 |
| Display | Authenticated | Open display settings | SCR-015 |
| Save Changes | Valid settings | Persist configuration | Same screen |
| Logout | Authenticated | End session | Signed-out state |

**Navigation Rules:** Sidebar and categories are visible. X-ray images are stated to be analyzed on-device and not sent to external servers. Direct URL and role-specific sidebar differences need confirmation.  
**Data Requirements:** Local-processing status, privacy settings, active SqueezeViT model, system status, version.  
**Interface States:** Default and Local Processing Enabled confirmed. Model unavailable, save success/error, unsaved changes, and session expiry need confirmation.  
**Responsive Behavior:** Desktop sidebar/wide layout only; tablet/mobile needs confirmation.  
**Accessibility Requirements:** Readable privacy claims; programmatic current location; announced save result; labelled icons.

### SCR-017 — Professor workspace/dashboard

**Role:** Professor  
**Route:** Not defined  
**Screen type:** Page  
**Source reference:** Figma 651:852, professor grouping confirmed; title/details not exposed  
**Purpose:** Entry point to professor management.  
**Entry points:** Professor authentication route, inferred.  
**Exit points:** Roster, activities, review, analytics, settings, logout.

**Main Interface Areas**

Professor workspace composition is not exposed.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Manage students | Professor permission | Open roster | SCR-018 |
| Manage activities | Professor permission | Open activity management | SCR-020 |
| Review submissions | Attempts exist | Open review | SCR-026 |
| View analytics | Data exists | Open analytics | SCR-027 |

**Navigation Rules:** All destinations are inferred from the professor frame sequence.  
**Data Requirements:** Students, activities, submissions, progress, inferred.  
**Interface States:** Loading, empty roster, empty submissions, no analytics, error need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Accessible role navigation and text alternatives for metrics.

### SCR-018 — Student roster

**Role:** Professor  
**Route:** Not defined  
**Screen type:** Page or management view  
**Source reference:** Figma 667:960, Purpose inferred  
**Purpose:** Browse students/cohorts.  
**Entry points:** SCR-017.  
**Exit points:** SCR-019; workspace.

**Main Interface Areas**

Roster/list content is inferred; search/filter controls need confirmation.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Open student | Record exists | View detail | SCR-019 |
| Return workspace | Authenticated | Return to workspace | SCR-017 |

**Navigation Rules:** Visibility, search, and privacy scope need confirmation.  
**Data Requirements:** Student records and progress indicators, inferred.  
**Interface States:** Populated, empty, loading, error, restricted need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Table/list semantics; keyboard row actions; privacy-aware labels.

### SCR-019 — Student detail

**Role:** Professor  
**Route:** Not defined  
**Screen type:** Page or detail view  
**Source reference:** Figma 667:971, Purpose inferred  
**Purpose:** Inspect one student's learning record.  
**Entry points:** SCR-018.  
**Exit points:** SCR-026; roster; workspace.

**Main Interface Areas**

Student profile/progress content is inferred.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Review attempt | Attempt exists | Open submission review | SCR-026 |
| Return roster | Authenticated | Return to list | SCR-018 |

**Navigation Rules:** Professor data access is inferred; exact permissions need confirmation.  
**Data Requirements:** Student profile/progress, inferred.  
**Interface States:** Populated, no attempts, loading, deleted student, permission denied, error need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Sensitive data needs clear labels and privacy-aware presentation.

### SCR-020 — Activity management

**Role:** Professor  
**Route:** Not defined  
**Screen type:** Page or management view  
**Source reference:** Figma 667:982, Purpose inferred  
**Purpose:** Browse/manage authored activities.  
**Entry points:** SCR-017.  
**Exit points:** SCR-021; preview; workspace.

**Main Interface Areas**

Activity list and draft/published status are inferred.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Create activity | Professor permission | Start authoring | SCR-021 |
| Open activity | Activity exists | Edit/preview | SCR-021 or SCR-024, Needs confirmation |

**Navigation Rules:** Draft, edit, archive, delete, and publish lifecycle need confirmation.  
**Data Requirements:** Activity list/status, inferred.  
**Interface States:** Populated, empty, draft, published, loading, error need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Text status as well as color; keyboard actions.

### SCR-021 — Create activity

**Role:** Professor  
**Route:** Not defined  
**Screen type:** Page or authoring view  
**Source reference:** Figma 678:1015, Purpose inferred  
**Purpose:** Start authoring a guided activity.  
**Entry points:** SCR-020.  
**Exit points:** SCR-022; SCR-023; SCR-024; management.

**Main Interface Areas**

Authoring workspace is inferred; case setup and instructions/rubric are subsequent frames.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Configure case | Authoring started | Open case setup | SCR-022 |
| Define instructions | Authoring started | Open rubric setup | SCR-023 |
| Preview | Required content complete | Review activity | SCR-024 |
| Cancel/back | Any draft state | Return to management | SCR-020; warning needs confirmation |

**Navigation Rules:** Draft persistence and autosave are not shown.  
**Data Requirements:** Activity metadata, case, instructions, rubric, inferred.  
**Interface States:** Draft, incomplete, validation, saving, save error need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Labelled fields; accessible current step; keyboard controls.

### SCR-022 — X-Ray case setup

**Role:** Professor  
**Route:** Not defined  
**Screen type:** Page or authoring step  
**Source reference:** Figma 681:1448, Purpose inferred  
**Purpose:** Configure case content.  
**Entry points:** SCR-021.  
**Exit points:** SCR-023; SCR-024; editing.

**Main Interface Areas**

Case and image configuration are inferred; exact upload controls are not exposed.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Add case data | Required data valid | Update draft | Same step |
| Continue | Case data complete | Advance authoring | SCR-023 or SCR-024, Needs confirmation |

**Navigation Rules:** Upload, autosave, and unsaved changes need confirmation.  
**Data Requirements:** X-ray/case data, inferred; file rules need confirmation.  
**Interface States:** Empty, selected, uploading, invalid, failed, saved need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Labelled file input; image alternative; announced progress/errors.

### SCR-023 — Instructions and rubric

**Role:** Professor  
**Route:** Not defined  
**Screen type:** Page or authoring step  
**Source reference:** Figma 681:1577, Purpose inferred  
**Purpose:** Define instructions and evaluation criteria.  
**Entry points:** SCR-021.  
**Exit points:** SCR-024; edit.

**Main Interface Areas**

Instruction and rubric editing areas are inferred.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Edit instructions | Professor permission | Update draft | Same step |
| Edit rubric | Professor permission | Update draft | Same step |
| Preview | Required content complete | Open preview | SCR-024 |

**Navigation Rules:** Validation, drafts, and autosave are not specified.  
**Data Requirements:** Instructions, learning objective, rubric criteria, inferred.  
**Interface States:** Draft, incomplete, validation, saving, error need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Labelled text editing; logical rubric reading order.

### SCR-024 — Activity preview

**Role:** Professor  
**Route:** Not defined  
**Screen type:** Page or preview view  
**Source reference:** Figma 681:1754, Purpose inferred  
**Purpose:** Review activity before publishing.  
**Entry points:** SCR-021 to SCR-023.  
**Exit points:** Publish; edit.

**Main Interface Areas**

Student-facing preview with case, instructions, and rubric summary is inferred.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Edit | Professor wants changes | Return to authoring | SCR-021 to SCR-023 |
| Publish | Activity ready | Make available | SCR-025 |

**Navigation Rules:** Preview should not mutate content; not explicitly specified.  
**Data Requirements:** Complete activity draft.  
**Interface States:** Complete, incomplete, preview loading/error need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Preview must preserve headings, labels, and an accessible publish result.

### SCR-025 — Publish activity

**Role:** Professor  
**Route:** Not defined  
**Screen type:** Action state or confirmation view  
**Source reference:** Figma 684:1934, Purpose inferred  
**Purpose:** Make a completed activity available to students.  
**Entry points:** SCR-024.  
**Exit points:** Activity management; student Activities through inferred handoff.

**Main Interface Areas**

Publish action/result content is inferred.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Publish | Complete activity and permission | Publish | SCR-008 through cross-role handoff |
| Cancel/back | Before publish | Return to preview/edit | SCR-024, Needs confirmation |

**Navigation Rules:** Confirmation, edit-after-publish, archive, and delete are not shown.  
**Data Requirements:** Completed activity and target audience, inferred.  
**Interface States:** Ready, publishing, published, validation failure, publish failure need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Announce publication; confirm irreversible behavior if applicable.

### SCR-026 — Submission review

**Role:** Professor  
**Route:** Not defined  
**Screen type:** Page or review view  
**Source reference:** Figma 684:2126, Purpose inferred  
**Purpose:** Review attempts and provide feedback.  
**Entry points:** SCR-017, SCR-019, or review navigation.  
**Exit points:** Student detail; roster; workspace.

**Main Interface Areas**

Submission list/detail, student response, X-ray, attention heatmap, and feedback are inferred.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Open attempt | Submission exists | Inspect attempt | Same view/detail |
| Review heatmap | AI result exists | Inspect model feedback | Same view |
| Provide feedback | Professor permission | Save feedback | Student-visible feedback, needs confirmation |

**Navigation Rules:** Submission privacy, feedback visibility, and edit-after-save need confirmation.  
**Data Requirements:** Student response, activity, X-ray, heatmap, status, feedback, inferred.  
**Interface States:** Empty, loading, populated, processing, saved, error need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Accessible image/response labels; privacy-aware content; announced save status.

### SCR-027 — Class progress and analytics

**Role:** Professor  
**Route:** Not defined  
**Screen type:** Page or analytics view  
**Source reference:** Figma 684:2268, Purpose inferred  
**Purpose:** Monitor class-level progress.  
**Entry points:** SCR-017.  
**Exit points:** SCR-019; workspace.

**Main Interface Areas**

Progress metrics, charts, filters, and activity scope are inferred.

**Available Actions**

| Action | Condition | Result | Destination |
| --- | --- | --- | --- |
| Inspect progress | Data exists | Open student detail | SCR-019 |
| Change scope/filter | If control exists | Refresh analytics | Same screen, Needs confirmation |

**Navigation Rules:** Professor-only access and export/date-range behavior need confirmation.  
**Data Requirements:** Student, activity, and submission progress data, inferred.  
**Interface States:** Loading, populated, empty, no data, error, restricted need confirmation.  
**Responsive Behavior:** Not supplied.  
**Accessibility Requirements:** Every chart needs a text/table alternative; filter updates must be announced.

## 9. Core Task Flows

### Flow: Create an account

**Actor:** Guest  
**Goal:** Create a ThoraxScan account.  
**Starting screen:** SCR-001 or registration entry.  
**Success screen:** Not defined.  
**Preconditions:** Registration is available.  
**Postconditions:** Account is created if accepted.

**Main Success Path**

1. Open Register.
2. Enter registration credentials.
3. Enter Password and Confirm Password.
4. Select Confirm.
5. System validates and creates the account.
6. System routes to the next authentication step; destination needs confirmation.

**Alternative Paths:** Back to home returns to SCR-001.  
**Failure Paths:** Missing/invalid fields, mismatch, duplicate account, and server failure need confirmation.

~~~mermaid
flowchart TD
    landing["Landing"] --> register["Register"]
    register --> fields["Enter credentials"]
    fields --> valid{"Valid?"}
    valid -->|"No: state needs confirmation"| fields
    valid -->|"Yes"| confirm["Confirm"]
    confirm --> result["Account created; destination needs confirmation"]
~~~

### Flow: Log in

**Actor:** Guest / Student; professor path needs confirmation.  
**Goal:** Access a role-specific workspace.  
**Starting screen:** SCR-003.  
**Success screen:** Student workspace; professor destination not exposed.  
**Preconditions:** Valid account.  
**Postconditions:** Authenticated session if successful.

**Main Success Path**

1. Enter credentials.
2. Optionally select Remember me.
3. Select Confirm.
4. System authenticates.
5. System routes by role; mechanism needs confirmation.

**Alternative Paths:** Forget Password; Back to home.  
**Failure Paths:** Invalid credentials, disabled account, lockout, network failure, and rate limiting need confirmation.

~~~mermaid
flowchart TD
    login["Login"] --> submit["Confirm"]
    submit --> accepted{"Authentication successful?"}
    accepted -->|"No: error state needs confirmation"| login
    accepted -->|"Yes"| route{"Role route needs confirmation"}
    route -->|"Student"| student["Student workspace"]
    route -.->|"Professor"| professor["Professor workspace"]
    login --> recovery["Forgot Password"]
~~~

### Flow: Recover a password

**Actor:** Guest / Student  
**Goal:** Replace a forgotten password.  
**Starting screen:** SCR-003.  
**Success screen:** SCR-003 after reset, inferred.  
**Preconditions:** Account identifier and work-email verification are available.  
**Postconditions:** Password updated if successful.

**Main Success Path**

1. Select Forget Password.
2. Enter recovery identity.
3. Receive OTP step.
4. Enter OTP.
5. Verify OTP.
6. Set new password.
7. Return to login.

**Alternative Paths:** Sign-in from OTP returns to login; resend is not confirmed.  
**Failure Paths:** Unknown account, invalid/expired OTP, rate limit, policy failure, and service failure need confirmation.

~~~mermaid
flowchart TD
    login["Login"] --> forgot["Forgot Password"]
    forgot --> otp["Enter OTP"]
    otp --> verified{"OTP valid?"}
    verified -->|"No: error state needs confirmation"| otp
    verified -->|"Yes"| reset["Reset Password"]
    reset --> policy{"Password valid?"}
    policy -->|"No: validation state needs confirmation"| reset
    policy -->|"Yes"| loginAgain["Return to Login"]
~~~

### Flow: Complete a student activity

**Actor:** Student  
**Goal:** Complete and submit guided chest X-ray interpretation.  
**Starting screen:** SCR-008 or SCR-009.  
**Success screen:** AI-assisted feedback, inferred.  
**Preconditions:** Assigned activity and usable X-ray.  
**Postconditions:** Attempt and feedback available if processing succeeds.

**Main Success Path**

1. Open assigned activity.
2. Review activity details.
3. Select/provide chest X-ray.
4. System validates input.
5. SqueezeViT runs locally through ONNX Runtime Web.
6. Review Attention Heatmap.
7. Enter interpretation.
8. Submit attempt.
9. Receive AI-assisted feedback.

**Alternative Paths:** Continue practicing; revisit attention maps if implemented.  
**Failure Paths:** Unsupported image, failed inference, missing response, duplicate submission, refresh, and offline failure need confirmation.

~~~mermaid
flowchart TD
    activities["Activities"] --> details["Activity details"]
    details --> input["Select or provide X-ray"]
    input --> accepted{"Input accepted?"}
    accepted -->|"No: validation state needs confirmation"| input
    accepted -->|"Yes"| process["Local SqueezeViT inference"]
    process --> complete{"Inference completed?"}
    complete -->|"No: failure state needs confirmation"| process
    complete -->|"Yes"| heatmap["Attention Heatmap"]
    heatmap --> response["Enter interpretation"]
    response --> submit["Submit attempt"]
    submit --> feedback["AI-assisted feedback"]
~~~

### Flow: Create and publish an activity

**Actor:** Professor  
**Goal:** Create a guided activity and publish it.  
**Starting screen:** SCR-020.  
**Success screen:** Published activity state, not exposed.  
**Preconditions:** Authoring permission and required case content.  
**Postconditions:** Activity available to students, inferred.

**Main Success Path**

1. Open Activity management.
2. Start Create activity.
3. Configure X-ray case.
4. Define instructions and rubric.
5. Preview.
6. Publish.
7. Activity becomes available in student Activities; cross-role handoff is inferred.

**Alternative Paths:** Return from preview to edit; draft persistence needs confirmation.  
**Failure Paths:** Missing case data, invalid file, incomplete rubric, publish failure, duplicate activity, and permission failure need confirmation.

~~~mermaid
flowchart TD
    management["Activity management"] --> create["Create activity"]
    create --> caseData["X-Ray case setup"]
    create --> rubric["Instructions and rubric"]
    caseData --> preview["Preview"]
    rubric --> preview
    preview --> ready{"Ready to publish?"}
    ready -->|"No"| create
    ready -->|"Yes"| publish["Publish activity"]
    publish -.->|"Cross-role handoff"| assigned["Student Activities"]
~~~

### Flow: Review a student submission

**Actor:** Professor  
**Goal:** Inspect a student attempt and provide feedback.  
**Starting screen:** SCR-026 or SCR-019.  
**Success screen:** Feedback saved state, not exposed.  
**Preconditions:** Submission exists and professor has access.  
**Postconditions:** Feedback is available to student if implemented.

**Main Success Path**

1. Open Submission review.
2. Open student attempt.
3. Review response and attention heatmap.
4. Enter feedback.
5. Save feedback.

**Alternative Paths:** Return to roster/detail; view class analytics.  
**Failure Paths:** Missing submission, unavailable heatmap, restricted data, save failure, and concurrent edits need confirmation.

~~~mermaid
flowchart TD
    review["Submission review"] --> attempt["Open attempt"]
    attempt --> available{"Submission available?"}
    available -->|"No: empty/error state needs confirmation"| review
    available -->|"Yes"| inspect["Review response and heatmap"]
    inspect --> feedback["Enter professor feedback"]
    feedback --> save["Save feedback"]
    save --> result["Feedback saved; student visibility needs confirmation"]
~~~

### Flow: Update account settings

**Actor:** Student or Professor  
**Goal:** Update Profile, Display, or Privacy and Data.  
**Starting screen:** SCR-013 or SCR-016.  
**Success screen:** Saved settings state.  
**Preconditions:** Authenticated session.  
**Postconditions:** Settings persist if Save Changes succeeds.

**Main Success Path**

1. Open Settings.
2. Select a category.
3. Change a setting.
4. Select Save Changes.
5. System persists configuration.

**Alternative Paths:** Change category without saving; behavior needs confirmation.  
**Failure Paths:** Invalid value, save failure, local-processing unavailable, session expiry, permission failure need confirmation.

~~~mermaid
flowchart TD
    workspace["Authenticated workspace"] --> settings["Settings"]
    settings --> category{"Category"}
    category --> profile["Profile"]
    category --> display["Display"]
    category --> privacy["Privacy and Data"]
    profile --> save["Save Changes"]
    display --> save
    privacy --> save
    save --> saved["Saved state needs confirmation"]
~~~

### Flow: Log out

**Actor:** Student or Professor  
**Goal:** End authenticated session.  
**Starting screen:** Any authenticated screen with sidebar.  
**Success screen:** Signed-out state; exact screen not supplied.  
**Preconditions:** Authenticated session.  
**Postconditions:** Session invalidated if backend exists.

**Main Success Path**

1. Select Logout.
2. System ends the session.
3. System returns to signed-out or landing state.

**Alternative Paths:** Confirmation if unsaved work exists; Needs confirmation.  
**Failure Paths:** Logout service failure and token behavior need confirmation.

~~~mermaid
flowchart TD
    authenticated["Authenticated screen"] --> logout["Logout"]
    logout --> signedOut["Signed-out state"]
    logout -.->|"Confirmation if needed"| confirm["Confirm logout"]
    confirm --> signedOut
~~~

## 10. Authentication and Account Flow

| Capability | Evidence | Status |
| --- | --- | --- |
| Landing | SCR-001 | Confirmed |
| Registration | SCR-002 | Confirmed |
| Student login | SCR-003 | Confirmed |
| Password recovery | SCR-004 to SCR-006 | Partially confirmed |
| OTP/work-email verification | SCR-005 | Confirmed |
| Remember me | SCR-003 | Control confirmed; persistence needs confirmation |
| Logout | SCR-016 sidebar | Control confirmed; destination needs confirmation |
| Professor authentication | Professor frames only | Needs confirmation |
| Role routing | Separate frame groups | Needs confirmation |
| Session persistence/expiration | Remember me exists; no session states | Needs confirmation |
| Locked/disabled accounts | No source | Missing |
| Unauthorized routes | No source | Missing |
| Invitation codes | No source | Missing |

## 11. Forms and Validation Flow

| Form | Fields/controls | Requiredness | Submission | Missing states |
| --- | --- | --- | --- | --- |
| Registration | Credentials, Password, Confirm Password, Confirm | Password controls visible; other fields need confirmation | Create account | Invalid, mismatch, duplicate, loading, server error |
| Student login | Credential fields, Password, Remember me, Confirm | Identity/password visible; rules need confirmation | Authenticate | Invalid, locked, disabled, loading |
| Recovery | Account identifier/email inferred | Needs confirmation | Send OTP | Unknown account, delivery, resend, rate limit |
| OTP | OTP, Verify OTP | OTP visible | Verify identity | Invalid, expired, loading |
| Password reset | New password/confirmation inferred | Needs confirmation | Update password | Policy, mismatch, expired recovery |
| X-ray input | Image input inferred | Image required | Run local inference | Type/size, unsupported, processing failure |
| Student response | Interpretation and Submit inferred | Needs confirmation | Store attempt/feedback | Empty, duplicate, processing |
| Activity authoring | Case, instructions, rubric inferred | Needs confirmation | Save/preview/publish | Incomplete, upload, publish failure |
| Professor feedback | Feedback input inferred | Needs confirmation | Save feedback | Save failure, visibility |
| Settings | Profile, Display, Privacy/Data | Field rules not exposed | Save Changes | Validation, save failure, unsaved |

Implementation requirements: label every field, preserve recoverable input after validation errors, prevent duplicate submissions, and define unsaved-change behavior.

## 12. System Feedback and Status Flow

### Confirmed

- Educational Disclaimer on landing.
- Local Processing Enabled.
- X-ray images analyzed entirely on-device using ONNX Runtime Web.
- No image data sent to external servers.
- Assistive tool and non-diagnostic footer.
- Active model SqueezeViT.
- Prototype/version indicator.

### Needs confirmation

Loading, progress, validation, success, error, empty, permission-denied, upload-progress, processing-failure, session-expired, and duplicate-submission states are not designed.

| Situation | Required feedback | Status |
| --- | --- | --- |
| Login/registration processing | Disabled/loading state | Needs confirmation |
| Invalid credentials | Inline error/banner | Needs confirmation |
| OTP invalid/expired | Inline error/resend | Needs confirmation |
| X-ray upload/inference | Progress/failure | Needs confirmation |
| Student submission | Processing/duplicate prevention | Needs confirmation |
| Publishing | Confirmation/published status | Needs confirmation |
| Settings save | Saved/error state | Needs confirmation |
| Empty activities/submissions | Empty state | Needs confirmation |
| Restricted route | Permission state | Needs confirmation |

## 13. Modal, Dialog, and Overlay Flow

No dedicated modal, dialog, drawer, or overlay frames were supplied.

| Potential overlay | Trigger | Purpose | Close/result | Status |
| --- | --- | --- | --- | --- |
| Publish confirmation | Publish activity | Confirm publication | Cancel/confirm | Needs confirmation |
| Logout confirmation | Logout with unsaved work | Prevent loss | Cancel/confirm | Needs confirmation |
| Unsaved-changes dialog | Leave dirty form | Confirm discard | Stay/discard | Needs confirmation |
| Upload/error dialog | Invalid/failed image | Explain/retry | Close/retry | Needs confirmation |
| Session-expired dialog | Expired session | Re-authenticate | Sign in | Needs confirmation |

If implemented, overlays must trap focus, support appropriate Escape behavior, restore focus to the trigger, and have accessible labels.

## 14. Role and Permission Matrix

| Feature or Screen | Guest | Student | Professor | Notes |
| --- | --- | --- | --- | --- |
| Landing | Full | Full | Full | Public |
| Registration | Full | Needs confirmation | Needs confirmation | Authenticated entry rules not shown |
| Login | Full | Full | Needs confirmation | Student login supplied |
| Password recovery | Full | Full | Needs confirmation | Student-labelled sequence |
| Student workspace | No access | Full | Needs confirmation | Separate role areas implied |
| Activities | No access | Full | View/manage needs confirmation | Professor management separate |
| Learning Mode | No access | Full | Needs confirmation | Sidebar label visible |
| Attention Maps | No access | Full | Review needs confirmation | Cross-role use inferred |
| Student roster | No access | No access | Full | Professor grouping |
| Student detail | No access | Own data needs confirmation | Full/view needs confirmation | Sensitive data |
| Activity authoring | No access | No access | Create/Edit | Inferred |
| Activity publishing | No access | No access | Full | Inferred |
| Submission review | No access | Own only needs confirmation | Full | Inferred |
| Professor feedback | No access | View own needs confirmation | Create/Edit | Cross-role inference |
| Class analytics | No access | No access | View | Inferred |
| Shared settings | No access | Full | Full | Shared frame references |
| Logout | No access | Full | Full | Visible control |

## 15. Route Map

No implementation routes are supplied. All routes in this table are Suggested route — not confirmed.

| Route | Screen | Role | Authentication | Direct Access | Redirect Rule |
| --- | --- | --- | --- | --- | --- |
| / | Landing | Guest | Public | Suggested route | None defined |
| /register | Register | Guest | Public | Suggested route | Return to / after cancel |
| /login | Student Login | Guest/Student | Public | Suggested route | Role destination after success |
| /forgot-password | Password recovery | Guest/Student | Public | Suggested route | OTP after submit |
| /verify-otp | OTP verification | Guest/Student | Recovery | Suggested route | Reset after success |
| /reset-password | Password reset | Guest/Student | Recovery | Suggested route | Return to /login |
| /student | Student workspace | Student | Required | Suggested route | Unauthenticated to /login |
| /student/activities | Student Activities | Student | Required | Suggested route | Access rule needs confirmation |
| /student/activities/:activityId | Activity details | Student | Required | Suggested route | Missing activity behavior needs confirmation |
| /student/analysis/:activityId | X-Ray Analysis | Student | Required | Suggested route | Requires activity access |
| /student/analysis/:activityId/heatmap | Attention Heatmap | Student | Required | Suggested route | Requires inference |
| /student/settings | Settings | Student | Required | Suggested route | Access rule needs confirmation |
| /professor | Professor workspace | Professor | Required | Suggested route | Unauthenticated to /login |
| /professor/students | Student roster | Professor | Required | Suggested route | Permission state |
| /professor/students/:studentId | Student detail | Professor | Required | Suggested route | Missing/restricted state |
| /professor/activities | Activity management | Professor | Required | Suggested route | Permission state |
| /professor/activities/new | Create activity | Professor | Required | Suggested route | Draft behavior |
| /professor/activities/:activityId/preview | Activity preview | Professor | Required | Suggested route | Incomplete draft state |
| /professor/submissions | Submission review | Professor | Required | Suggested route | Permission state |
| /professor/analytics | Class analytics | Professor | Required | Suggested route | Empty-data state |

## 16. State Transition Rules

~~~mermaid
stateDiagram-v2
    [*] --> SignedOut
    SignedOut --> Login
    Login --> AuthenticatedStudent: valid student credentials
    Login --> AuthenticatedProfessor: professor routing needs confirmation
    Login --> LoginError: invalid credentials needs confirmation
    LoginError --> Login
    Login --> Recovery: forgot password
    Recovery --> OTP
    OTP --> PasswordReset: valid OTP
    OTP --> OTPError: invalid or expired OTP needs confirmation
    OTPError --> OTP
    PasswordReset --> Login: reset success
    AuthenticatedStudent --> ActivityDraft: open activity
    ActivityDraft --> Processing: submit X-ray
    Processing --> HeatmapAvailable: inference completed
    Processing --> ProcessingFailed: inference failure needs confirmation
    ProcessingFailed --> ActivityDraft
    HeatmapAvailable --> ResponseDraft
    ResponseDraft --> Submitted: submit attempt
    Submitted --> FeedbackAvailable: feedback completed
    AuthenticatedProfessor --> ActivityAuthoring
    ActivityAuthoring --> Published: publish activity
    Published --> AuthenticatedProfessor
    Submitted --> ProfessorReview: cross-role review needs confirmation
    ProfessorReview --> FeedbackAvailable: professor feedback needs confirmation
    AuthenticatedStudent --> SettingsDirty: change settings
    AuthenticatedProfessor --> SettingsDirty: change settings
    SettingsDirty --> SettingsSaved: Save Changes
    SettingsSaved --> AuthenticatedStudent
    SettingsSaved --> AuthenticatedProfessor
    AuthenticatedStudent --> SignedOut: Logout
    AuthenticatedProfessor --> SignedOut: Logout
~~~

The transitions involving local processing, submissions, publication, feedback visibility, and session handling are inferred where the frames do not show state screens.

## 17. Cross-Screen Consistency Rules

### Confirmed/source-supported

- Keep ThoraxScan branding consistent.
- Preserve educational and non-diagnostic disclaimer language.
- Preserve ONNX Runtime Web/local-processing privacy messaging.
- Keep SqueezeViT as the active model where shown.
- Keep sidebar labels consistent: Dashboard, Activities, Learning Mode, Attention Maps, Settings, Logout.
- Use Home / X-Ray Analysis breadcrumb context where applicable.
- Keep Save Changes treatment consistent across settings.

### Needs confirmation

- Button hierarchy and destructive-action behavior.
- Standard validation, loading, empty, success, and error patterns.
- Toast versus inline/banner/dialog feedback.
- Mobile navigation and responsive breakpoints.
- Date/time formatting.
- Notification and reload behavior.
- Whether Attention Maps and Learning Mode are full pages, tabs, or views.
- Naming consistency between ThoraxScan and Thorax Scan in the footer.

## 18. Edge Cases

### Supported or directly implied

- AI output is educational and not for clinical diagnosis.
- Local processing is a privacy requirement.
- Logout is available in authenticated navigation.
- Password recovery uses OTP/work-email verification.

### Recommended but not confirmed

- Connection loss during upload or inference.
- Refresh during processing or submission.
- Duplicate submission.
- Unsupported, corrupt, or oversized X-ray.
- No assigned activities.
- No professor submissions.
- Deleted/archived activity.
- Session expiration while editing.
- Restricted direct URL.
- Local model asset failure.
- Publishing incomplete activity.

These require confirmation before implementation.

## 19. Open Questions and Conflicts

| ID | Question or conflict | Affected flow | Impact | Recommended resolution |
| --- | --- | --- | --- | --- |
| OQ-001 | Where is Registration entered from? | SCR-001 to SCR-002 | Onboarding ambiguity | Confirm trigger placement |
| OQ-002 | Is professor login shared or separate? | SCR-003, SCR-017 | Auth architecture | Confirm auth model |
| OQ-003 | How is role detected or selected? | Login routing | Security boundary | Define backend role rule |
| OQ-004 | What are the real routes? | All screens | Protected navigation | Approve route map |
| OQ-005 | What are exact professor titles and controls? | SCR-017 to SCR-027 | Implementation accuracy | Annotate/export professor frames |
| OQ-006 | What are 473:834, 473:914, and 473:1045 exactly? | Shared settings | Inventory naming | Confirm frame names |
| OQ-007 | Is 653:811 the password reset screen? | Recovery | Recovery completeness | Confirm title/fields |
| OQ-008 | What fields are required on registration/login? | Forms | Schema/validation | Provide field requirements |
| OQ-009 | What are password/OTP/account-lock rules? | Auth | Security | Define policies |
| OQ-010 | What image types/sizes/validation apply? | X-ray input | Inference reliability | Define media rules |
| OQ-011 | What happens during local inference? | SCR-010/SCR-011 | User feedback | Design processing/failure states |
| OQ-012 | Are attention maps saved/revisitable? | SCR-011/sidebar | Data model | Confirm saved-map behavior |
| OQ-013 | What response/rubric fields apply? | SCR-012/SCR-023 | Submission validation | Define response schema |
| OQ-014 | Is professor feedback immediately visible? | SCR-026/student loop | Feedback UX | Define publication rule |
| OQ-015 | Can published activities be edited/archived/deleted? | SCR-020/SCR-025 | Lifecycle | Define permissions |
| OQ-016 | What student data can professors view? | SCR-018/SCR-019/SCR-027 | Privacy/security | Approve data scope |
| OQ-017 | What does Save Changes persist? | SCR-013 to SCR-016 | Settings API/UX | Define save semantics |
| OQ-018 | What happens to unsaved work? | Forms/logout | Data loss | Add unsaved-change rule |
| OQ-019 | What are mobile/tablet layouts? | All | Responsive build | Supply responsive specs |
| OQ-020 | What happens on expiration/unauthorized URL? | Authenticated screens | Protected routes | Define redirect behavior |

## 20. Source Traceability Matrix

| Design element | Type | Source | Status | Notes |
| --- | --- | --- | --- | --- |
| Landing and disclaimer | Screen | 473:1183 | Confirmed | Hero, Login, technology line, disclaimer |
| Registration | Screen | 485:1025 | Confirmed | Create Account, credentials, password, confirmation |
| Student login | Screen | 651:882 | Confirmed | Welcome Back, Remember me, Forget Password |
| Recovery start | Screen | 560:777 | Partially confirmed | Function name identifies recovery |
| OTP verification | Screen | 653:797 | Confirmed | OTP/work-email content |
| Password reset | Screen | 653:811 | Inferred | Sequence position; title not exposed |
| Student workspace/activities/details | Screens | 473:514, 498:1412, 473:580 | Partially confirmed | Frame grouping supplied; labels not exposed |
| X-Ray Analysis/heatmap/submission | Screens | 657:1091, 657:1222, 473:633 | Inferred | Purpose follows product flow |
| Shared settings | Screens | 473:834, 473:914, 473:1045, 473:981 | Partially confirmed | 473:981 visibly shows settings/privacy/sidebar |
| Professor workspace/management | Screens | 651:852, 667:960, 667:971, 667:982 | Inferred | Professor grouping supplied |
| Authoring/publish | Screens | 678:1015, 681:1448, 681:1577, 681:1754, 684:1934 | Inferred | Sequence inferred |
| Review/analytics | Screens | 684:2126, 684:2268 | Inferred | Sequence inferred |
| Local processing | Product rule | 473:981 | Confirmed | ONNX Runtime Web/no external transfer |
| Non-diagnostic use | Product rule | 473:1183, 473:981 | Confirmed | Disclaimer/footer |
| Professor-to-student activity loop | Cross-role flow | Both frame sets | Inferred | No explicit connector supplied |
| Feedback visibility | Cross-role flow | Both frame sets | Inferred | Timing/notification needs confirmation |

## 21. Implementation Handoff Checklist

- [x] 27 unique linked frames inventoried.
- [x] Guest, Student, and Professor roles mapped.
- [x] Public and authenticated navigation documented.
- [x] Registration, login, recovery, and logout documented.
- [x] Student analysis/submission flow documented.
- [x] Professor authoring/publishing/review/analytics flow documented as inferred where necessary.
- [x] Settings and privacy/local-processing behavior documented.
- [x] Suggested routes separated from confirmed implementation.
- [x] Loading, empty, error, success, and permission gaps listed.
- [x] Form validation gaps listed.
- [x] Permissions and responsive gaps listed.
- [x] Accessibility requirements listed.
- [x] Open questions and conflicts listed.
- [x] Source traceability matrix included.
- [x] Mermaid navigation, master, role, task, and state diagrams included.
- [ ] Confirm exact professor frame labels and controls.
- [ ] Confirm routes and protected-route behavior.
- [ ] Add responsive frames or requirements.
- [ ] Design missing system states.
- [ ] Validate Mermaid in the target renderer.

## 22. Final Flow Summary

- **Total identified screens:** 27 unique linked Figma frames.
- **Total identified roles:** 3: Guest, Student, Professor.
- **Total core workflows:** 8: registration, login, password recovery, student activity completion, professor authoring/publishing, professor submission review, settings update, and logout.
- **Main entry points:** Landing, Login, Register, Forgot Password.
- **Main completion points:** Account creation, password reset, student feedback, published activity, professor feedback, saved settings, and logout.
- **Critical unresolved questions:** Role-based authentication, routes, professor frame labels, form schemas, X-ray validation, inference states, rubric/submission rules, permissions, feedback visibility, and session behavior.
- **Highest-risk flow gaps:** Professor implementation detail, protected-route/security rules, missing system states, file validation, and unsaved-work behavior.
- **Recommended next step:** Annotate/export professor frames with exact titles, controls, and transitions, then define system-state designs for authentication, local inference, publication, submission processing, feedback, and settings persistence.

