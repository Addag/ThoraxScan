# Manuscript vs. system evaluation

- **Manuscript:** `(LATEST)RadTech-ThoraxScan-Pre-Oral.docx`, saved 2026-11-04. Text and all 52 images checked.
- **System:** `main` at 02cb367 (2026-11-08), plus uncommitted chest-gate retraining.
- **Status:** a list of changes only. Nothing in the manuscript or the app has been edited.

**Ground rule.** Chapters 1–3 are the defended pre-oral record. They stay SqueezeViT, and nothing there is rewritten to match the live model. Everything that changed after pre-oral (and after testing with the professor) is reported in Results and Discussion. The manuscript currently labels that chapter "4.0"; you called it Chapter 5. Confirm which number to use.

## What changed since the last evaluation (27 Oct manuscript, 12bf774)

**Manuscript**

- One Introduction paragraph was reworded (paragraph 3). The new wording has grammar errors: "Though is it crucial for students to have a CXR interpretation…" and "traditional instructional methods still have its…". Suggested fix: "Although CXR interpretation is crucial in the BS RadTech curriculum, traditional instructional methods still have educational limitations."
- 19 new screenshots were added to User Interface (taken 2026-11-04):
  - landing page
  - student: activity result, all four Settings tabs
  - professor: dashboard, Activities, New activity, activity detail, Student Reviews list and detail, Class Analytics, Learning Mode, Attention Maps, Settings
- The Attention Maps screenshot now shows the class activation map explanation. This resolves the old "7×7 rollout" screenshot problem on the professor side; the student-side image (21) is still the old one.
- The DFDs, ERD, architecture, lifecycle, Gantt and survey charts are unchanged.

**System (8 commits, all after the screenshots except the first)**

| Commit | Change | Effect on the manuscript |
|---|---|---|
| c2a9cb1 (11-04) | Signed-in users go to their dashboard, not the login pages | None |
| 8375993 (11-05) | Landing navigation wraps on phones | None |
| 902eae2 (11-07) | Case images over 6 MB are shrunk in the browser before upload | New activity / upload screenshot hint text is outdated |
| 191bd04 (11-07) | AI results open with a written report, a probability bar chart and a possible-findings warning | Student AI feedback and Learning Mode screenshots no longer show the result layout; a new Results feature to describe |
| c16b0f6 (11-07) | Chest-X-ray gate: refuses images that aren't chest X-rays in Learning Mode and Professor uploads | A third model to report |
| b00530c (11-07) | "Normal" is a one-click answer; findings and region only for Abnormal | Student activity screenshot (17) and ERD/DFD submission fields are outdated |
| 9d4cd56 (11-07) | Terms v1.2, with a Data retention section | Support for the ethics/data paragraph |
| 02cb367 (11-08) | Incomplete answers are caught before the submit confirmation | Minor; screenshot of submit flow |

**Uncommitted work:** the chest gate was retrained with 64 hidden units and FracAtlas limb X-rays as negatives. If you report the gate's numbers, use the version you commit: v2 catches 5,653 of 5,761 non-chest images and wrongly refuses 5 of 5,000 chest X-rays.

---

## A. Leave in Chapters 1–3 as defended, then explain the change in Results and Discussion

Each of these is what the pre-oral chapters say versus what the live system does:

1. **Architecture:** SqueezeViT with 0.54M parameters → TinyViT-11M, 10.6M parameters, ImageNet-22k pretrained.
2. **Data:** CheXpert v1.0-small only → CheXpert + NIH ChestX-ray14 (287,516 images). NIH has no ECM, Fracture or Support Devices labels, so those are left out of the loss for NIH rows.
3. **Training:** knowledge distillation from a FastViT-SA12 (v4) teacher is never described as the method used.
4. **Uncertain labels:** U-Zero → a per-label policy: uncertain Atelectasis and Edema count as positive, uncertain Cardiomegaly is ignored, the rest count as negative. Evaluation still uses U-Zero.
5. **Preprocessing:** 224×224 resize → short side 320 first, then 224 (matches how CheXpert-small was made).
6. **Heatmaps:** SqueezeViT self-attention per Chefer et al. (2020) → one 14×14 class activation map per finding (Zhou et al., 2016). The earlier releases used attention rollout (Abnar & Zuidema, 2020), never Chefer.
7. **Display thresholds:** binary F1 thresholds → F1 thresholds plus three additions:
   - Cardiomegaly fixed at 0.50
   - a "possible" tier at 85% sensitivity for the five competition labels
   - the ECM rule: Enlarged Cardiomediastinum is flagged when Cardiomegaly is.
8. **Parity testing:** PyTorch GPU vs ONNX GPU → what was actually done:
   - PyTorch vs ONNX Runtime on CPU
   - browser WASM and WebGPU outputs against saved reference outputs.
9. **"Within 8 GB consumer RAM":** never measured. Measure it or drop the claim in Results.
10. **Tense:** "planned to use ONNX Runtime Web", "will be implemented" are now facts. In Results, state what was built and deployed (thoraxscan.com).

## B. Add to Results and Discussion

**B1. Why the model changed** (the narrative for item A)

- SqueezeViT runs v1→v6, the FastViT teacher (v4), then TinyViT v7 passing the comparison gate:

  | | SqueezeViT v6 | TinyViT v7 |
  |---|---|---|
  | Competition AUC, official 234 | 0.877 | 0.880 |
  | Mean AUC, official 234 | 0.775 | 0.834 |
  | NIH test competition AUC | 0.809 | 0.823 |
  | Lung Lesion AUC | 0.12 | 0.75 |
  | Heatmap pointing game (NIH boxes) | 35.5% | 47.9% |

- v8 (TinyViT at 320 px) failed the gate, so the 224 px contract stayed.
- **The professor-testing findings that triggered the switch.** The repository doesn't record these; they must come from you.

**B2. Model results**

- Per-label AUC for v7.
- Live error profile (likely tier, 13 abnormal labels):
  - official 234: 68% of findings caught, 7.9% of absent findings flagged
  - 668-image radiologist test set: 75% caught, 9.3% flagged
- The ECM rule cut official misses from 246 to 208.
- The short-side-320 resize raised radiologist-set competition AUC from 0.887 to 0.897.
- Evaluation sets used:
  - official 234 (radiologist labels)
  - held-out 22,422 (checkpoint and threshold selection)
  - NIH test 25,596
  - 668-image CheXpert test set

  Because thresholds are tuned on the held-out split and reported elsewhere, the Chapter 1 "optimistic thresholds" caveat can be answered here.
- Source: `docs/models.md`.

**B3. Supporting models added after pre-oral**

- **View detector:** a server-side model that rejects lateral images in Professor uploads. 32×32 → 32 → 1 MLP.
  - Held-out: catches 99.5% of laterals and wrongly rejects 0.09% of frontals.
  - Official 234: catches 32 of 32 laterals.
- **Chest-X-ray gate (new, c16b0f6):** refuses photos, documents, other scans and limb X-rays in Learning Mode and Professor uploads (numbers above).

**B4. As-built system features not in Chapters 1–3**

- Administrator role and Professor application/approval
- co-professor invitations
- Class Analytics with CSV export
- notifications
- the built-in CheXpert case library (234 images) with private notes
- the Attention Maps guide and PDF
- the written AI report and probability chart (191bd04)
- one-click Normal answers (b00530c)
- automatic image shrinking (902eae2)
- Turnstile CAPTCHA
- the Terms and Privacy pages (Terms v1.2)

**B5. As-built design vs the Chapter 3 diagrams**

Default: keep the Chapter 3 figures and describe the differences here. Tell me if you would rather update the figures.

- **Level 0 / Level 1 DFD:**
  - The app sends confirmation and reset *links*, not "verification codes" or "reset codes".
  - There's no Administrator entity.
  - AI screening (process 2.0) runs in the browser after the first final submission (or on a professor retry), not when the activity is created.
  - D3 stores 14 probabilities, thresholds and findings plus per-finding maps, not "confidence score + attention map".
- **ERD vs the real tables:**
  - USERS → Supabase Auth + `profiles`; no password hash is stored.
  - Invitation `code` → `code_hash`.
  - One case per activity; cases belong to the workspace.
  - Reference answer → `activity_reference_evaluations`. There's no difficulty level, no open date and no late flag.
  - AI analysis is per activity: `probabilities`, `thresholds`, `findings` and provenance.
  - Submission fields → `visible_findings`, `classification`, `relevant_region`. Findings and region are now only for Abnormal; there's no confidence level.
  - Feedback release → `status`, `released_at`; viewing isn't tracked.
  - Faculty evaluation → `score`, `remarks`, `feedback`, `status`, `released_at`.
  - Missing tables: `professor_applications`, `platform_admins`, `model_releases`, `model_slots`, `model_activation_events`, `account_settings`, `legal_consents`, `notification_reads`, `learning_case_notes`.
- **Architecture figure:**
  - "SqueezeViT Model" → TinyViT. "Attention Map Generator" → class activation maps.
  - Missing boxes: view detector, chest gate, Turnstile, Learning Mode, analytics, model registry.

## C. Fix now (not about the model; allowed in any chapter)

**Survey**

11. The paper reports only the "Agree" slice, which understates the need:

    | Item | Paper | Agree + Strongly Agree (the Appendix C charts) |
    |---|---|---|
    | Q4 | 71% | 83.9% |
    | Q8 | 58.1% | 96.8% |
    | Q9 | 74.2% | 87.1% |
    | Q10 | 51.6% | 96.8% |

    Update the Introduction, the Planning phase and the C.2 table.
12. The C.3 raw response table doesn't match the Google Forms charts. For example, on Q8 the raw table has 16 Strongly Agree and 11 Agree, while the chart shows 12 and 18. Re-export it from Google Forms.
13. C.3 lists all 31 respondents' email addresses, which breaks the survey's own Data Privacy Notice. Replace them with R1–R31.

**Screenshots** (19 new ones added, but several need retaking)

14. Retake the screenshots made outdated by the 11-07 commits:
    - student activity (17): Normal is now one-click and the findings/region fields hide
    - student AI feedback (19): the result now opens with the report and chart
    - Learning Mode (20, 33): only the empty state is shown; add a result showing the report, chart and heatmap
    - the Professor upload screen.
15. Several screenshots show test data that doesn't belong in a capstone paper. Re-seed with clean demo data before retaking:
    - activity titles "Bagsak kayo lahat sakin" and "Play Apex at school" (27)
    - findings text "asdasdasdaawdsddfgdf" and "I refer this with TB trust"
    - reference evaluation "bbb" (29, 31)
    - a raw student UUID (31)
    - real personal emails in the Settings screenshots (22, 35)
16. Screenshots 29 and 31 show analyses from the old FastViT v3 release with "Legacy global attention" and "Application build: development". Use activities analysed by the live v7 release, or caption them as historical.
17. Student screenshot 21 still shows the old "7×7 attention rollout" page. Replace it with the current class activation map page (like 34).
18. The new screenshots have no captions, and the List of Figures (6.0–19.2) doesn't match what's there:
    - No register page; four "Login Page" entries per role.
    - "Settings: Display" should be Security / Privacy / Accessibility.
    - Missing: Administrator page and Professor application status.
    - Caption every image and renumber.
19. The Class Analytics screenshot (32) shows an empty workspace (0 submissions). Use a workspace with data.

**Text and front matter**

20. Fix the grammar in the reworded Introduction paragraph (see above).
21. Title mismatch: the cover says "Web-based Learning Tool for Teaching…", while the approval sheet, abstract title and survey letter say "Web-based application for Detection of…".
22. "Novermber 2026"; the abstract is empty; the Acknowledgement and Dedication are filler text; the approval sheet says both "Multimedia Technology" and "Multimedia Technologies".
23. Rewrite the leftover AI-assistant wording:
    - "Therefore, I cannot confirm from these sources…" (AI-Assisted section)
    - "the uploaded studies do not confirm…" (CAD section)
    - "the manuscript reports that 71%…" (Planning phase)
    - the fragment "To organize the technologies…"
    - "ozf transformers"
    - "the authors also warns"
    - "Based on the study about SqueezeViT, it directly supports…"
24. Numbering:
    - The architecture and ERD paragraphs both say "Figure 5"; architecture is 4.0.
    - The TOC page numbers are wrong (Introduction 10, Objectives 5).
    - Appendix E numbers the CVs D.1–D.4.
25. Citations:
    - Brooke (1996) is cited but not listed in the references.
    - Ribeiro et al. 2025, Sloan 2025, Xie 2025, Yanar 2025 and DTI NAISR are listed but never cited. Ribeiro (an AI chest X-ray training tool for radiographers) is the closest related work and should be discussed.
    - For Results, add: TinyViT (Wu et al., 2022), FastViT (Vasu et al., 2023), CAM (Zhou et al., 2016), NIH ChestX-ray14 (Wang et al., 2017), CheXpert (Irvin et al., 2019), FracAtlas (Abedeen et al., 2023).
26. Gantt chart: it ends at the 31 May pre-oral submission. Extend it through November to show development, model runs and deployment.

**Ethics and data**

27. No paragraph explains how SUS participants give informed consent, or covers institutional approval. The app now says the evaluation asks for its own consent, and the app no longer collects age or research consent. Add this to the evaluation procedure.
28. The built-in library serves CheXpert images publicly, but redistribution permission is unconfirmed. Address this under the dataset terms (see `src/lib/xray-library/README.md`).

## Still open for you

- Results and Discussion: chapter "4.0" or "5"?
- DFD/ERD/architecture: keep the pre-oral figures and explain the differences in Results (default), or update the figures?
- The professor-testing findings behind the TinyViT switch (B1).
