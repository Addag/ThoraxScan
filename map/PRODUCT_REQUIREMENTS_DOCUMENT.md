# ThoraxScan Product Requirements Document

**Version:** 0.2  
**Status:** Working draft aligned with the pre-oral capstone document  
**Last updated:** 2026-08-10  
**Product:** ThoraxScan

## 1. Product Definition

ThoraxScan is a web-based educational learning platform for Radiologic Pathology and BS Radiologic Technology students. It supports professor-guided workspaces and activities, student interpretation submissions, multi-label AI-assisted learning feedback, attention heatmaps after implementation, and faculty evaluation.

ThoraxScan is not a standalone diagnostic product. It will not replace a radiologist, establish a clinical diagnosis, or claim that an attention heatmap confirms the location of a disease.

## 2. Problem Statement

The preliminary needs assessment identified reported difficulty among students in interpreting chest X-ray findings, distinguishing normal from abnormal images, distinguishing pathologies from one another, and learning without appropriate assistance or training. The reported survey percentages must be reconciled against the final response calculations before they are used as final claims in the paper.

The product should provide a structured learning workflow in which students submit their own interpretation before AI-assisted feedback is released, then compare it with model-supported findings and faculty evaluation while retaining responsibility for their own learning judgment.

## 3. Product Goals

### 3.1 Primary goals

1. Provide controlled, professor-guided chest X-ray interpretation activities for students.
2. Enable professors to create workspaces, invite students, upload approved de-identified teaching cases, publish activities, and evaluate submissions.
3. Enable students to submit their own interpretation before receiving AI-assisted learning feedback.
4. Run the trained SqueezeViT model using ONNX Runtime Web when supported by the user’s browser.
5. Display multi-label probabilities and thresholded predictions for 14 thoracic findings.
6. Apply per-label thresholds rather than a single threshold for every finding.
7. Provide attention heatmaps as a visual explanation of model attention after the attention-extraction work is completed.
8. Preserve the educational and non-diagnostic scope of the system.
9. Provide a reproducible technical workflow from the PyTorch checkpoint to browser inference.

### 3.2 Secondary goals

1. Provide Learning Mode for non-graded practice.
2. Provide enough authorized system records to evaluate usability and workflow behavior.
3. Support deployment through Vercel with a maintainable Next.js codebase.

## 4. Non-Goals

The following are outside the current product scope:

- Replacing radiologists or providing autonomous clinical diagnosis.
- Server-side GPU inference for the normal browser workflow.
- Clinical validation or proof of diagnostic equivalence.
- Confirmed disease localization from an attention heatmap.
- Training or retraining the model from the public website.
- Storing clinical patient records or any case that is not an approved, de-identified teaching case.
- Building a public model API as the primary product.
- Adding labels or findings that are not supported by the final model contract.

## 5. Target Users

### 5.1 Student

The primary user is a BS Radiologic Technology student studying radiologic pathology or chest radiograph interpretation. The student joins an authorized workspace, accesses assigned activities, submits an interpretation, reviews AI-assisted learning feedback, and reviews released faculty feedback.

### 5.2 Professor or instructor

A professor or instructor creates private workspaces, invites students, uploads approved de-identified teaching cases, creates activities and reference evaluations, reviews submissions, and provides scores, remarks, or feedback.

### 5.3 Evaluation participants

The research protocol may include students, healthcare professionals, or radiologists depending on the approved evaluation plan. The evaluation participant group and inclusion criteria must be finalized in the research documents before data collection.

## 6. User Workflows

### 6.1 Professor activity workflow

1. The professor authenticates and opens a private workspace.
2. The professor creates or manages invitation codes or links for student access.
3. The professor uploads an approved, de-identified frontal chest X-ray teaching case, enters activity details, and records a reference evaluation.
4. The professor publishes the activity to authorized workspace members.
5. The professor reviews submissions and records a score, remarks, or feedback.

### 6.2 Student activity workflow

1. The student authenticates and opens an assigned, published activity.
2. The student reviews the activity and case, then submits an interpretation.
3. After submission, the system releases AI-assisted learning feedback: probability output, thresholded learning-oriented output, and an attention heatmap when available.
4. The student views faculty feedback, scores, or remarks after the professor records and releases the evaluation.

### 6.3 Learning Mode

Learning Mode provides non-graded practice. A student may select a compatible local frontal image, view the non-diagnostic output, and reset the case. A local practice image must not be stored or transmitted by default; the deployed behavior must be verified through network and persistence testing.

## 7. Functional Requirements

Priority levels:

- **P0:** required for the first usable system
- **P1:** required for a complete capstone demonstration
- **P2:** optional improvement

| ID | Requirement | Priority | Status |
|---|---|---:|---|
| FR-001 | The system shall provide a public landing page and controlled account registration/login flow. | P0 | Planned |
| FR-002 | The system shall distinguish student and professor access through role-based authorization. | P0 | Planned |
| FR-003 | Professors shall create workspaces and invitation codes or links for student access. | P0 | Planned |
| FR-004 | Professors shall create, configure, publish, and manage frontal chest X-ray learning activities using approved de-identified teaching cases. | P0 | Planned |
| FR-005 | Students shall access only authorized assigned activities and submit their own interpretation. | P0 | Planned |
| FR-006 | The system shall preprocess compatible frontal images as grayscale, 224 x 224, mean 0.5, standard deviation 0.25. | P0 | Browser completed for contract v1 |
| FR-007 | The system shall load the ONNX model and run inference in the browser when ONNX Runtime Web is supported. | P0 | Completed for activity and Learning Mode paths |
| FR-008 | The system shall return 14 model outputs in the documented label order, convert logits with sigmoid, and apply configured per-label thresholds. | P0 | Completed for contract v1 |
| FR-009 | The system shall avoid displaying `No Finding` together with abnormal thresholded predictions. | P0 | Completed in runtime and database derivation |
| FR-010 | The system shall release AI-assisted learning feedback only after a student submits an activity response. | P0 | Completed with submission trigger and release RPC |
| FR-011 | Professors shall review submissions and provide scores, remarks, or feedback visible only to the authorized student. | P0 | Planned |
| FR-012 | The system shall display the probability for each output label or a documented selected subset. | P1 | Completed for released activity results |
| FR-013 | The system shall display an attention heatmap after attention extraction and heatmap generation are implemented. | P1 | Not implemented |
| FR-014 | The system shall provide Learning Mode for non-graded practice. | P1 | Planned |
| FR-015 | The system shall show clear loading, validation, failure, retry, reset, and non-diagnostic-disclaimer states. | P1 | Planned |
| FR-016 | The system shall retain traceable model, threshold, preprocessing, and application-version metadata for recorded AI results. | P1 | Completed for immutable activity analyses |
| FR-017 | The system shall store only approved de-identified teaching cases and authorized educational records, subject to the retention rule. | P0 | Planned |
| FR-018 | The system shall display the authorized activity case or a preview of a readable Learning Mode image and allow a Learning Mode case to be reset. | P0 | Planned |

## 8. Output Requirements

The model output order shall remain fixed:

```text
No Finding
Enlarged Cardiomediastinum
Cardiomegaly
Lung Opacity
Lung Lesion
Edema
Consolidation
Pneumonia
Atelectasis
Pneumothorax
Pleural Effusion
Pleural Other
Fracture
Support Devices
```

The user interface should distinguish among:

- Raw probability: the sigmoid output from the model.
- Thresholded prediction: whether the probability passed the configured label threshold.
- Explanation: the attention heatmap, if available.

The interface must not present a probability as a calibrated clinical risk unless calibration is separately evaluated and documented.

For an assigned activity, the output shall also present the student’s submitted interpretation and released faculty feedback, score, or remarks. AI feedback must remain unavailable until the submission is recorded.

## 9. Non-Functional Requirements

### 9.1 Privacy

- The system shall store only professor-approved, de-identified teaching cases and authorized educational records. It shall not act as a clinical patient-record system.
- The working retention rule is one academic term for approved cases, activity records, and student submissions, followed by review, deletion, or approved archival under the research protocol and institutional requirements.
- A local Learning Mode image should remain in browser memory and should not be uploaded or retained by default.
- Any saved record should exclude unnecessary identifying information.
- The local-only processing claim for Learning Mode must be verified with browser network inspection after deployment. Until verified, it is a design goal rather than a demonstrated property.

### 9.2 Performance

- The interface should provide a visible loading state during model initialization and inference.
- The model should be loaded once per session when practical.
- The application should function with a WASM fallback when WebGPU is unavailable, subject to browser support and acceptable performance.
- The final performance target must be measured on representative devices rather than invented in advance.

### 9.3 Usability

- A first-time student should be able to select an image and obtain results without technical instructions.
- Prediction results, thresholds, and heatmap labels should be visually distinguishable.
- The interface should use terminology appropriate for an educational radiologic pathology workflow.
- A heuristic review should assess visibility of system status, error prevention, consistency, and explainability presentation.

### 9.4 Accessibility

- Controls should be keyboard accessible.
- Text and status indicators should have adequate contrast.
- The heatmap should not be the only way to communicate a result.
- Color should not be the only means of distinguishing prediction states.

### 9.5 Security

- Supabase credentials must be separated into public client configuration and server-only secrets.
- Row-level security shall be enabled for workspace, case, activity, submission, feedback, and evaluation records.
- The application must not expose service-role keys in client-side code.
- Stored teaching cases must be subject to file type, size, de-identification, workspace access, and retention controls.

### 9.6 Maintainability

- The model, label order, preprocessing constants, and threshold version should be stored as versioned artifacts.
- The deployed application must identify the model version used for an output.
- Changes to the checkpoint or threshold file should trigger a reproducibility review.

## 10. Product Success Measures

The following are evaluation measures, not claims that have already been achieved:

1. Full validation AUC per label and mean AUC using a locked evaluation protocol.
2. Precision, recall, and F1 at the locked per-label thresholds.
3. Agreement between Python PyTorch and ONNX Runtime outputs within a documented numerical tolerance.
4. Successful completion of the primary image-analysis workflow.
5. System Usability Scale results if SUS is included in the approved protocol.
6. Heuristic evaluation findings and resolved usability issues.
7. Successful network verification of the intended image-processing behavior.
8. Qualitative feedback about educational usefulness and explanation clarity.

The existing reported baseline results are recorded in `CAPSTONE_CURRENT_STATE.md`. The best training-log mean AUC of 0.7728847801505602 after 38 epochs and the separate full-validation mean AUC of 0.7582 must be reported with their exact data split and calculation method.

## 11. Constraints and Risks

| Risk or constraint | Impact | Mitigation |
|---|---|---|
| CheXpert weak labels | Labels may be uncertain or incomplete. | State the limitation and report per-label metrics. |
| Class imbalance | Low-prevalence labels may have unstable estimates. | Report positive/negative counts and avoid overclaiming. |
| Different Python/browser preprocessing | Browser results may differ from validation results. | Create a cross-runtime parity test. |
| Browser WebGPU differences | Inference speed and numerical output may vary by device. | Provide WASM fallback and document test devices. |
| Attention heatmap interpretation | Users may mistake attention for lesion localization. | Add explicit explanatory wording and review the UI. |
| Storage of teaching cases | Creates privacy, de-identification, access, and retention obligations. | Store only approved de-identified cases; apply workspace RLS and the retention rule. |
| LMS implementation | Authentication, roles, activities, submissions, and evaluations are required capstone scope. | Implement the minimum complete workflow before nonessential enhancements. |

## 12. Release Scope

### Minimum viable capstone demonstration

- Controlled authentication and student/professor roles
- Workspace membership and invitation-controlled access
- Professor case/activity/reference-evaluation workflow using approved de-identified teaching cases
- Student interpretation submission
- Post-submission AI-assisted feedback
- Faculty evaluation with score, remarks, or feedback
- Browser preprocessing, ONNX Runtime Web inference, 14-label probability display, and per-label threshold display
- `No Finding` conflict handling, non-diagnostic disclaimer, loading, and error states
- Verified browser output against the Python/ONNX reference

### Extended demonstration

- Attention heatmap
- Learning Mode enhancements
- Authorized progress/history views
- Heuristic evaluation and usability instrumentation

## 13. Open Product Decisions

1. The exact route and screen structure for the student and professor dashboards.
2. Whether the final application will display all 14 labels or emphasize a smaller educational subset while retaining the complete model output.
3. The final browser support matrix and minimum device requirements.
4. The approved procedure for deletion or archival after the one-academic-term retention period.
5. The final model artifact and attention-data contract used for the heatmap implementation.

## 14. Product References

- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- ONNX Runtime Web: https://onnxruntime.ai/docs/tutorials/web/
- Vercel Functions: https://vercel.com/docs/functions
- Supabase Storage: https://supabase.com/docs/guides/storage
- Maurya et al. (2026), Efficient SqueezeViT: https://doi.org/10.1038/s41598-026-47918-4
- van Dort et al. (2025), heuristic evaluation of explainable AI dashboards: https://doi.org/10.3233/SHTI250341
