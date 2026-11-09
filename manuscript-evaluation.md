# Manuscript vs. system evaluation

- **Manuscript:** `(LATEST)RadTech-ThoraxScan-Pre-Oral.docx`, saved 2026-11-04. Text and all 52 images checked.
- **System:** `main` at 286a947 (2026-11-08), including the chest-gate retraining.
- **Status:** a list of changes only. Nothing in the manuscript or the app has been edited.

## Target structure

| Part | Contents |
|---|---|
| Chapters 1–3 | The defended pre-oral record. They stay SqueezeViT; nothing there is rewritten to match the live model. |
| **Chapter 4.0** | DFD, ERD, System Architecture, Screen Layout, Gantt Chart |
| **Chapter 5.0, Conclusion and Recommendation** | Two paragraphs of client-focused findings: how the system is used and how it benefits professors and students. Then the Conclusion, then the Recommendation. |
| **References** | Every entry ends with a period, like a sentence. |

**Moves this requires in the manuscript:**

- The DFDs, ERD and System Architecture currently sit in Chapter 3 (Design phase). Move them to Chapter 4.0. Chapter 3 can point to them in one sentence ("The DFDs, ERD and architecture are presented in Chapter 4").
- "4.0 RESULTS AND DISCUSSION" with its "User Interface" heading becomes "4.0", with "Screen Layout" as the last section.
- The Gantt chart (Figure 20.0) stays in Chapter 4, as its last section after Screen Layout.
- Renumber all figures and the Table of Contents after the moves.

## What changed since the last evaluation (27 Oct manuscript, 12bf774)

**Manuscript**

- One Introduction paragraph was reworded (paragraph 3). The new wording has grammar errors: "Though is it crucial for students to have a CXR interpretation…" and "traditional instructional methods still have its…". Suggested fix: "Although CXR interpretation is crucial in the BS RadTech curriculum, traditional instructional methods still have educational limitations."
- 19 new screenshots were added (taken 2026-11-04):
  - landing page
  - student: activity result, all four Settings tabs
  - professor: dashboard, Activities, New activity, activity detail, Student Reviews list and detail, Class Analytics, Learning Mode, Attention Maps, Settings
- The DFDs, ERD, architecture, lifecycle, Gantt and survey charts are unchanged.

**System (8 commits, all after the screenshots except the first)**

| Commit | Change | Effect on the manuscript |
|---|---|---|
| c2a9cb1 (11-04) | Signed-in users go to their dashboard, not the login pages | None |
| 8375993 (11-05) | Landing navigation wraps on phones | None |
| 902eae2 (11-07) | Case images over 6 MB are shrunk in the browser before upload | Upload screenshot hint text is outdated |
| 191bd04 (11-07) | AI results open with a written report, a probability bar chart and a possible-findings warning | Student AI feedback and Learning Mode screenshots no longer show the result layout |
| c16b0f6 (11-07) | Chest-X-ray gate: refuses images that aren't chest X-rays in Learning Mode and Professor uploads | New box for the architecture figure |
| b00530c (11-07) | "Normal" is a one-click answer; findings and region only for Abnormal | Student activity screenshot, plus the ERD and DFD submission fields |
| 9d4cd56 (11-07) | Terms v1.2, with a Data retention section | Supports the ethics paragraph (item 28) |
| 02cb367 (11-08) | Incomplete answers are caught before the submit confirmation | Minor |

**Follow-up commit 286a947 (11-08):** the chest gate was retrained with 64 hidden units and FracAtlas limb, hip and shoulder X-rays as negatives. Report this version (v2): it catches 5,653 of 5,761 non-chest images and wrongly refuses 5 of 5,000 chest X-rays.

---

## Chapter 4.0: DFD, ERD, System Architecture, Screen Layout

Chapter 4 presents the system as built, so its figures should match the live app.

**4.1 Data Flow Diagrams (Figures 2.0 and 3.0)**

1. Replace "Verification code request", "Reset code" and "OTP / reset verification" with email *links*. The app sends confirmation and password-reset links, not codes.
2. Add an Administrator entity: an administrator approves Professor applications and manages other administrators.
3. Add Cloudflare Turnstile (CAPTCHA) to authentication.
4. Level 1, process 2.0 (AI screening): it runs in the browser after the first student's final submission (or on a professor retry), not when the professor creates the activity.
5. Level 1, D3: the store holds 14 probabilities, thresholds, findings and one heatmap per finding, not "confidence score + attention map".
6. Level 1, process 5.0: a Normal answer has no findings or region (b00530c).
7. Rewrite both DFD paragraphs to match.

**4.2 Entity-Relationship Diagram (Figure 5.0)**

8. Redraw it from the real tables (the current image is also too blurry to read):
   - USERS → Supabase Auth plus `profiles` (display name, role). No password hash is stored.
   - Invitation `code` → `code_hash`, with `invited_role`, `max_uses`, `uses_count`, `expires_at`.
   - Cases belong to the workspace, and each activity points to exactly one case (`activities.case_id`).
   - The reference answer lives in `activity_reference_evaluations`. There's no difficulty level, no open date and no late-submission flag.
   - AI analysis is one per activity: `probabilities`, `thresholds`, `findings`, model release and hashes, execution provider, and the per-finding maps.
   - Submissions: `visible_findings`, `classification`, `relevant_region`, `status`. There's no confidence level.
   - Feedback release: `status`, `released_at`. Viewing isn't tracked.
   - Faculty evaluation: `score`, `remarks`, `feedback`, `status`, `released_at`.
   - Add the missing tables: `professor_applications`, `platform_admins`, `model_releases`, `model_slots`, `model_activation_events`, `account_settings`, `legal_consents`, `notification_reads`, `learning_case_notes`.
9. Fix the paragraph: it says "Figure 5" for both the architecture and the ERD.

**4.3 System Architecture (Figure 4.0)**

10. "SqueezeViT Model" → TinyViT. "Attention Map Generator" → Class Activation Map (one per finding). Add a short note that TinyViT replaced the SqueezeViT proposed in Chapter 3 after testing (the reason goes in Chapter 5's findings).
11. Add the missing boxes: chest-X-ray gate, view detector (lateral images), Turnstile, Learning Mode, Class Analytics, the model registry and activation, and the written AI report.
12. Fix the paragraph's "Figure 5" (it is Figure 4.0).

**4.4 Screen Layout**

13. Caption every screenshot and make the List of Figures match. Right now the list (6.0–19.2) doesn't match the 19 images:
    - no register page
    - four "Login Page" entries per role
    - "Settings: Display" should be Security / Privacy / Accessibility
    - missing: the Administrator page and the Professor application status
    - add a one- or two-sentence description under each screen.
14. Retake the screenshots made outdated by the 11-07 commits:
    - student activity: Normal is one click, and findings/region appear only for Abnormal
    - student AI feedback: the result opens with the written report and chart
    - Learning Mode: only the empty state is shown; add a result with the report, chart and heatmap
    - the Professor upload screen.
15. Replace test data before retaking:
    - activity titles "Bagsak kayo lahat sakin" and "Play Apex at school"
    - findings "asdasdasdaawdsddfgdf" and "I refer this with TB trust"
    - reference evaluation "bbb"
    - a raw student UUID
    - real personal emails in the Settings screenshots
16. The Student Reviews detail and activity detail screenshots show analyses from the old FastViT v3 release ("Legacy global attention", "Application build: development"). Use activities analysed by the live TinyViT release.
17. The student Attention Maps screenshot still explains the old "7×7 attention rollout". Use the current class activation map page, like the professor one.
18. The Class Analytics screenshot shows an empty workspace (0 submissions). Use one with data.

**4.5 Gantt Chart (Figure 20.0)**

19. The chart ends at the 31 May pre-oral submission, and its paragraph says January to June 2026. Extend both through November to cover development, the model runs and deployment, the professor testing, the IT expert review (7 November) and final submission. The source is `ThoraxScan_Gantt_Chart_2026.xlsx` in the Oral Paper folder.

## Chapter 5.0: Conclusion and Recommendation

**Findings (first two paragraphs, client-focused)**

These should describe how professors and students use ThoraxScan and what it gives them over the current method (slides, textbook diagrams and classroom discussion), not model numbers. The system offers:

- **Professors:**
  - private workspaces with invitation codes
  - activities from their own uploads or the 234-image CheXpert library
  - one place to compare each student's answer with their own reference and the AI output
  - score, remarks and feedback release
  - Class Analytics with CSV export
  - automatic refusal of non-chest and lateral images.
- **Students:**
  - answer first, then get AI feedback: a written report, a probability chart, and a heatmap per finding showing where to look
  - the professor's evaluation
  - unlimited private practice in Learning Mode.
- **Both:** it runs in the browser, so no installation or GPU server is needed, and uploaded practice images stay in the browser.
- **The model change, in client terms:** TinyViT gave students more reliable feedback than the SqueezeViT in Chapter 3. Use numbers only if your adviser wants them:

  | | SqueezeViT v6 | TinyViT v7 |
  |---|---|---|
  | Competition AUC | 0.877 | 0.880 |
  | Mean AUC | 0.775 | 0.834 |
  | Heatmap pointing game | 35.5% | 47.9% |

  It also gives a heatmap per finding instead of one general map. Add what the professor's testing showed; the repository doesn't record that.

**IT expert review and the changes it led to (Chapter 5 findings)**

An IT expert reviewed the application, and every item was addressed in the 7 November 2026 commits, with two follow-ups on 8 November. Present it as review → problem or request → what was changed, so the findings show the system improved in response to evaluation.

| Expert's item | What was changed | Commit |
|---|---|---|
| Tweak: remove "select region" when the answer is Normal (activity) | Choosing Normal is now a one-click answer. The region field appears only after Abnormal is chosen. | b00530c |
| Tweak: show the findings text box only when Abnormal (activity) | Findings and region appear only for Abnormal, and a final Abnormal answer needs both. A Normal answer stores neither. Follow-up: an incomplete answer is caught before the submit confirmation opens. | b00530c, 02cb367 |
| Tweak: add a conclusion | Each AI result now opens with a written report in radiographic-report form: exam, interpretation, and an impression (the conclusion). | 191bd04 |
| Tweak: give a visual (e.g. bar graph) to the result | A bar chart shows every finding's probability, with its threshold marked. | 191bd04 |
| Tweak: always make clear that it is AI | Every result opens with the banner "AI-generated result. Not a diagnosis; it should not guide medical decisions." The heatmap is titled "AI finding heatmap". | 191bd04 |
| Tweak: put data retention in the Terms and Conditions | Terms section 8, "Data retention": account records are kept until deletion; teaching cases, activities, submissions, evaluations and AI results for one academic term; Learning Mode images are never uploaded. Terms became version 1.2, effective 7 Nov 2026. | 9d4cd56 |
| Problem: the AI gives results even for images that aren't chest X-rays | Solution as the expert suggested: a second AI filter, the chest-X-ray gate. A small neural network checks each image first and refuses non-chest images in Learning Mode and in Professor uploads. The first version (7 Nov) caught 4,709 of 4,955 non-chest images (photos, documents, CT, ultrasound, fundus) on held-out data. It was retrained on 8 Nov to also catch limb, hip and shoulder X-rays: it now catches 5,653 of 5,761 non-chest images and wrongly refuses 5 of 5,000 chest X-rays. | c16b0f6, 286a947 |
| Emphasize: a pop-up for possible findings | When a result has possible findings, a pop-up opens once per result with the warning: "Below the likely threshold but above a lower, more sensitive one. Check these against the image yourself; many will be false alarms." The same text stays on the result as a warning box. | 191bd04 |

For Chapter 5:

- **Writing:** one paragraph can summarize the review, and the table can go in Chapter 5 or an appendix, whichever your adviser prefers.
- **Screenshots:** before/after screens of the activity form, AI result and pop-up make the changes visible. The current screenshots (taken 4 Nov) show the "before" state.

**Conclusion**

20. Answer each Chapter 1 objective in turn:
    - **Objective 1:** a browser-based classifier across 14 labels was built and deployed. Say it is TinyViT, not SqueezeViT, and why.
    - **Objective 2:** an XAI heatmap module was built. Say it uses class activation maps, not self-attention weights.
    - **Objective 3:** SUS usability. Report the result if the evaluation has been run, otherwise state its status.

**Recommendation**

21. Candidates from the project's known limitations:
    - Run the SUS and heuristic evaluation with BSRT students if not done yet.
    - Improve the weak Enlarged Cardiomediastinum label.
    - Evaluate lateral views properly (only 32 official images).
    - Validate on local Philippine radiographs.
    - Confirm redistribution permission for the CheXpert library images.
    - Add a professor override for the roughly 1 in 1,000 chest X-rays the gate refuses.

## References

22. End every entry with a period, like a sentence. Several entries currently end with a bare DOI or URL and no period; that is APA 7 style, so confirm your adviser wants the period. Example: `…https://doi.org/10.2147/amep.s514876.`
23. Brooke (1996) is cited but missing from the list.
24. Ribeiro et al. 2025, Sloan 2025, Xie 2025, Yanar 2025 and DTI NAISR are listed but never cited. Cite or remove them. Ribeiro (an AI chest X-ray training tool for radiographers) is the closest related work.
25. Add the sources for what Chapters 4 and 5 now describe:
    - TinyViT (Wu et al., 2022)
    - FastViT (Vasu et al., 2023)
    - CAM (Zhou et al., 2016)
    - NIH ChestX-ray14 (Wang et al., 2017)
    - CheXpert (Irvin et al., 2019)
    - FracAtlas (Abedeen et al., 2023), if the chest gate is described.

## Other fixes (any chapter)

**Survey**

26. The paper reports only the "Agree" slice, which understates the need:

    | Item | Paper | Agree + Strongly Agree (Appendix C charts) |
    |---|---|---|
    | Q4 | 71% | 83.9% |
    | Q8 | 58.1% | 96.8% |
    | Q9 | 74.2% | 87.1% |
    | Q10 | 51.6% | 96.8% |

    Update the Introduction, the Planning phase and the C.2 table.
27. The C.3 raw table doesn't match the charts (Q8: the raw table has 16 Strongly Agree and 11 Agree, the chart has 12 and 18). Re-export it from Google Forms, and replace the 31 respondent emails with R1–R31, as the survey's Data Privacy Notice promises.

**Ethics and data**

28. Add how SUS participants give informed consent, and institutional approval. The app now says the evaluation asks for its own consent and no longer collects age or research consent.

**Text and front matter**

29. Fix the grammar in the reworded Introduction paragraph (see above).
30. Title mismatch: the cover says "Web-based Learning Tool for Teaching…", while the approval sheet, abstract title and survey letter say "Web-based application for Detection of…".
31. "Novermber 2026"; the abstract is empty; the Acknowledgement and Dedication are filler; the approval sheet says both "Multimedia Technology" and "Multimedia Technologies".
32. Rewrite the leftover AI-assistant wording:
    - "Therefore, I cannot confirm from these sources…"
    - "the uploaded studies do not confirm…"
    - "the manuscript reports that 71%…"
    - the fragment "To organize the technologies…"
    - "ozf transformers"
    - "the authors also warns"
    - "Based on the study about SqueezeViT, it directly supports…"
33. Fix the TOC page numbers (Introduction 10, Objectives 5) and Appendix E's D.1–D.4 numbering.

## Still open for you

- What the professor's testing found that led to TinyViT (Chapter 5 findings).
- Whether the SUS evaluation has been run (Conclusion, Objective 3).
