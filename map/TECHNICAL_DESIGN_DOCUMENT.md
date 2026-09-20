# ThoraxScan Technical Design Document

**Version:** 0.2  
**Status:** Working technical design aligned with the pre-oral capstone document  
**Last updated:** 2026-08-10  
**Product:** ThoraxScan

## 1. Purpose and Scope

This document describes the current technical design for ThoraxScan, a browser-inference educational learning platform for chest X-ray interpretation. It covers the student/professor LMS workflow, trained model, ONNX export, browser inference plan, Supabase-backed records, data handling, testing, and unresolved implementation work.

The model training and ONNX verification work are available in the current project state. The web application, LMS persistence, role-based access, attention-heatmap implementation, and deployed privacy verification remain planned unless explicitly marked otherwise. ThoraxScan is not a clinical diagnostic or patient-record system.

## 2. Design Principles

1. Keep the primary inference path client-side to reduce unnecessary image transfer and server compute.
2. Reproduce the Python preprocessing pipeline exactly in the browser.
3. Treat the model as multi-label classification, not single-class classification.
4. Keep label order and threshold configuration versioned.
5. Treat attention heatmaps as explanatory visualizations, not validated localization.
6. Implement the capstone LMS workflow with controlled authentication, role-based access, workspaces, activities, submissions, AI-feedback release, and faculty evaluation.
7. Record enough version information to reproduce a displayed result.

## 3. System Context

```text
+-----------------------------------------+
| Guest / Student / Professor / Administrator |
+-------------------+---------------------+
                    |
                    v
+-----------------------------------------+
| Next.js + Tailwind application           |
| role dashboards, activities, results UI  |
+-------------------+---------------------+
                    |
      +-------------+-------------+
      |                           |
      v                           v
+-------------------------+   +--------------------------------+
| ONNX Runtime Web         |   | Route Handlers / Vercel        |
| WebGPU preferred; WASM   |   | Supabase Auth, Postgres,       |
| fallback                 |   | Storage, and RLS               |
+-------------+-----------+   +--------------------------------+
              |
              v
+-------------------------+
| SqueezeViT ONNX model   |
| 1 x 224 x 224 -> 14     |
| logits                  |
+-------------------------+
```

The application layer is required for the LMS workflow. The browser is intended to decode, preprocess, and run model inference; the server-side layer supports authentication, authorization, workspaces, cases, activities, submissions, feedback release, and faculty evaluation. Actual deployed network behavior must be tested before making a local-processing claim.

## 4. Component Design

### 4.1 Frontend

The frontend will use Next.js and Tailwind CSS.

Proposed responsibilities:

- File selection and image preview.
- Student and professor dashboards, workspace membership, and activity workflows.
- Student interpretation submission and post-submission AI-feedback presentation.
- Faculty review, score/remark/feedback entry, and controlled feedback release.
- Browser-side preprocessing.
- ONNX Runtime Web session initialization.
- Inference execution.
- Sigmoid and threshold post-processing.
- Results presentation.
- Attention heatmap overlay after heatmap support is implemented.
- Loading, error, reset, and non-diagnostic disclaimer states.

The exact component and route structure is not yet implemented. A reasonable first structure is:

```text
app/
  (public)/                # landing and authentication entry points
  (student)/               # assigned activities and Learning Mode
  (faculty)/               # workspaces, cases, activities, and reviews
  layout.tsx               # application shell
  api/                     # LMS Route Handlers
components/
  image-uploader.tsx
  prediction-results.tsx
  attention-heatmap.tsx
  disclaimer.tsx
lib/
  inference.ts
  preprocessing.ts
  thresholds.ts
  supabase/                # Auth, database, storage, and RLS helpers
public/
  models/
    squeezevit_thoraxscan_v1.onnx
  config/
    labels.json
    thresholds.json
```

This structure is a proposed implementation layout, not an existing file inventory.

### 4.2 Model training artifact

The trained PyTorch checkpoint is:

```text
custom_train_squeezevit_b128_e38_mean07729.pth
```

The model is defined by the custom SqueezeViT implementation. The checkpoint must be paired with the exact model source, label order, preprocessing constants, and threshold file.

### 4.3 ONNX model

The current working ONNX artifact is:

```text
squeezevit_thoraxscan_v1.onnx
```

Recommended export settings for the verified path:

```python
opset_version=17
dynamo=False
external_data=False
```

The model has this logical contract:

```text
Input name:  input
Input shape: [batch, 1, 224, 224]
Output name: logits
Output shape: [batch, 14]
```

If external data is produced, the `.onnx` file and its `.onnx.data` file form one model artifact and must be deployed together. A model-loader test must be run after copying the artifact into the web project.

## 5. Data and Preprocessing Design

### 5.1 Input handling

The capstone model and web workflow are currently limited to **frontal chest X-ray images** compatible with the trained model. The browser will accept a compatible image, decode it, and create a canvas or equivalent pixel buffer. The implementation must define behavior for unsupported file types, unreadable files, excessively large files, and images with an alpha channel. PNG and JPEG are the planned initial supported formats; DICOM is deferred.

For an assigned activity, the case is retrieved from authorized controlled storage as an approved, de-identified teaching case. For Learning Mode, the selected local image is intended to remain in browser memory and not be sent to a backend by default. Network and persistence behavior must be verified after deployment for both paths.

### 5.2 Preprocessing contract

The browser must reproduce the current Python path:

```text
1. Decode image.
2. Convert to one grayscale channel.
3. Resize to exactly 224 x 224.
4. Convert pixels to the tensor data type used by ONNX Runtime Web.
5. Apply (pixel - 0.5) / 0.25.
6. Arrange tensor data as [1, 1, 224, 224].
```

The reference normalization is:

```text
mean = 0.5
standard deviation = 0.25
```

The browser implementation should have a parity test using one or more fixed images and a saved tensor checksum or representative tensor values.

### 5.3 Label and threshold configuration

The label order must be kept in one versioned configuration file. Thresholds must be kept in a separate versioned configuration or a single versioned model configuration object.

The current threshold values are:

```json
{
  "No Finding": 0.76,
  "Enlarged Cardiomediastinum": 0.63,
  "Cardiomegaly": 0.74,
  "Lung Opacity": 0.37,
  "Lung Lesion": 0.58,
  "Edema": 0.54,
  "Consolidation": 0.61,
  "Pneumonia": 0.49,
  "Atelectasis": 0.52,
  "Pneumothorax": 0.72,
  "Pleural Effusion": 0.47,
  "Pleural Other": 0.43,
  "Fracture": 0.60,
  "Support Devices": 0.24
}
```

These thresholds were tuned using F1-based results previously reported in the project. They must be rechecked and locked against the final validation protocol before being called final.

## 6. Inference Design

### 6.1 Inference sequence

```text
ImageData
  -> grayscale tensor
  -> [1, 1, 224, 224]
  -> ONNX session.run({ input: tensor })
  -> logits[14]
  -> sigmoid(logits)
  -> threshold comparison
  -> conflict handling
  -> UI result object
```

### 6.2 Post-processing pseudocode

```typescript
const probabilities = logits.map((logit) => 1 / (1 + Math.exp(-logit)));

const thresholdPredictions = labels
  .map((label, index) => ({
    label,
    probability: probabilities[index],
    threshold: thresholds[label],
    predicted: probabilities[index] >= thresholds[label],
  }))
  .filter((item) => item.predicted);

const abnormalPredictions = thresholdPredictions.filter(
  (item) => item.label !== "No Finding",
);

const finalPredictions = abnormalPredictions.length > 0
  ? abnormalPredictions
  : thresholdPredictions.filter((item) => item.label === "No Finding");
```

The production implementation should also define what happens when no label passes its threshold. The interface should display an uncertainty or no-threshold-match state rather than silently presenting a diagnosis.

### 6.3 Model session lifecycle

1. Load the ONNX model once when the analysis page initializes or when the user starts the first analysis.
2. Select WebGPU if supported and verified for the deployed model.
3. Fall back to WASM when WebGPU is unavailable or fails to initialize.
4. Display the active execution provider and a loading state where useful for evaluation.
5. Release the session when the page lifecycle requires it.

The final provider selection and browser support matrix are still open implementation decisions.

## 7. Attention Heatmap Design

### 7.1 Current limitation

The existing transformer block does not retain attention weights. It currently uses an attention call equivalent to:

```python
attn_out, _ = self.attn(x, x, x)
```

As a result, the current logits-only ONNX model does not provide enough information for an attention heatmap.

### 7.2 Planned model and export change

The planned implementation direction is to replace the current logits-only ONNX artifact with one expanded ONNX artifact that returns both logits and the attention data required for heatmap generation. The current artifact has not yet been replaced.

The model implementation must request and retain attention weights, preserve the existing 14-logit output, expose the attention data through ONNX export, aggregate the relevant 49-token representation into a 7 x 7 map, and upscale it to the displayed image dimensions. The artifact contract, model source, label order, preprocessing, and threshold file must be versioned together.

### 7.3 UI and wording constraints

The UI should label the output as an attention heatmap and state that it represents model attention or internal focus. It must not state that the heatmap confirms a lesion, proves disease location, or replaces expert interpretation.

The heatmap should be rendered as an overlay with an opacity control or a clearly visible legend. The original grayscale image must remain inspectable beneath the overlay.

## 8. Backend and Supabase Design

### 8.1 Backend role

The backend will use Next.js Route Handlers deployed as Vercel Serverless Functions. It will use the Node.js/TypeScript runtime through the Next.js/Vercel deployment.

The backend is required to support:

- authentication/session checks;
- role and workspace-membership checks;
- invitation creation and redemption;
- approved case and activity metadata;
- student submissions, AI-feedback releases, and faculty evaluations;
- authorized storage operations for approved de-identified teaching cases and required artifacts;
- administrative operations protected by authorization.

The backend is not intended to run the normal model inference path. It handles controlled LMS records and storage. Learning Mode images should not be sent to the backend by default; this is a design goal until deployment testing verifies it.

### 8.2 Proposed routes

These routes are proposed and are not yet implemented:

```text
GET/POST /api/workspaces
POST     /api/invitations
GET/POST /api/cases
GET/POST /api/activities
GET/POST /api/submissions
GET/POST /api/feedback-releases
GET/POST /api/faculty-evaluations
```

The exact routes should be reduced to the minimum required by the approved product scope.

### 8.3 Proposed data records

The capstone ERD requires the following planned records. This is a conceptual schema, not an implemented migration.

| Record | Core fields and constraints | Purpose |
|---|---|---|
| `profiles` | `id` (references the authenticated user), `display_name`, `role`, `created_at`, `updated_at`; role constrained to the supported platform roles | Identifies an authorized user without storing unnecessary profile data. |
| `workspaces` | `id`, `name`, `owner_id`, `created_at`, `updated_at` | Defines a professor-managed private learning space. |
| `workspace_members` | `workspace_id`, `user_id`, `member_role`, `joined_at`; unique membership per workspace/user | Links authorized students and professors to a workspace. |
| `invitation_codes` | `id`, `workspace_id`, `created_by`, `code_hash`, `expires_at`, `max_uses`, `uses_count`, `is_active`, `created_at` | Controls student entry without storing invitation codes in plaintext. |
| `xray_cases` | `id`, `workspace_id`, `storage_path`, `title`, `view`, `uploaded_by`, `approved_by`, `approved_at`, `de_identified_at`, `retention_until`, `status`, timestamps | Registers only approved, de-identified teaching cases; no patient-record fields or public storage URL. |
| `activities` | `id`, `workspace_id`, `case_id`, `created_by`, `title`, `instructions`, `reference_evaluation`, `status`, `published_at`, `due_at`, timestamps | Publishes a case as a learning activity and stores the reference evaluation. |
| `ai_analyses` | `activity_id` (unique), `pending | ready | failed`, leased attempt fields, active model release/provenance, fixed 14-probability vector, derived thresholds/findings, `attention_status = unavailable`, timestamps | Captures one immutable reproducible browser inference result per activity. **Implemented in `20260920100000_activity_ai_analysis.sql`.** |
| `student_submissions` | `id`, `activity_id`, `student_id`, `interpretation`, `submitted_at`, `status`; one active submission per student/activity unless a future attempt policy changes it | Stores the student’s interpretation before AI feedback is released. |
| `ai_feedback_releases` | `id`, `submission_id`, `activity_id`, `student_id`, `ai_analysis_id`, `released_at`, `status`; unique release per submission | Records database-enforced student visibility after final submission and successful analysis. **Implemented in `20260920100000_activity_ai_analysis.sql`.** |
| `faculty_evaluations` | `id`, `submission_id`, `professor_id`, `score`, `remarks`, `feedback`, `status`, `released_at`, timestamps | Stores faculty scores, remarks, or feedback for the student submission. |

All foreign-key columns must be indexed as part of the implementation, and uniqueness/check constraints must protect relationships and valid states. Row Level Security must be enabled on every user-, workspace-, case-, activity-, submission-, release-, and evaluation-facing table. Students may read only their membership, assigned published activities, their own submissions, and released feedback; professors may read/write only records in workspaces they manage; administrative access must be explicit and minimal.

### 8.4 Storage

Supabase Storage is intended for approved, de-identified teaching cases and authorized derived artifacts only. Objects must be private, addressed by a storage path rather than a public URL, and authorized through workspace-aware controls. The working retention rule is one academic term for cases, activity records, and student submissions, followed by review, deletion, or approved archival under the research protocol and institutional requirements. The platform must not store clinical patient images or act as a patient-record system.

## 9. Deployment Design

### 9.1 Hosting

The planned deployment is:

```text
GitHub repository
        |
        v
Vercel preview deployment
        |
        v
Vercel production deployment
```

The ONNX model and configuration files should be treated as versioned deployment artifacts. The deployment process must verify that the browser can load the model and that the model’s input/output names match the inference code.

### 9.2 Environment variables

Expected server/client configuration may include:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   # server only, if required
```

The service-role key must never be included in client-side bundles. The exact variables should be added only when Supabase integration is implemented.

### 9.3 Cost control

The client-side inference architecture limits normal server compute because the model is intended to run in the browser. Cost risks remain for model downloads, serverless calls, database usage, controlled case storage, and bandwidth. The deployed project should use usage alerts or limits where available and should retain only approved educational assets according to the defined policy.

## 10. Testing Design

### 10.1 Model evaluation

The final model evaluation should report:

- per-label ROC AUC;
- mean AUC calculation rule;
- positive and negative counts;
- thresholded precision, recall, and F1;
- the exact checkpoint and evaluation split;
- the label preprocessing policy;
- the hardware and software environment.

The previously reported full custom-validation result was based on 19,206 frontal images and reported a mean AUC of 0.7582 and competition AUC of 0.7680. The separate training-log result reported a best validation mean AUC of 0.7728847801505602 after 38 epochs. These values require separate labels in the final paper unless the experiment logs show they are the same evaluation.

### 10.2 PyTorch-to-ONNX parity

The current verified export path produced very small CPU output differences:

```text
Maximum logit difference:       approximately 0.0000033
Maximum probability difference: approximately 0.0000007
```

The parity test should be rerun after any model, exporter, opset, or preprocessing change.

### 10.3 Browser-to-reference parity

The browser test should use the same fixed images as the Python reference and compare:

1. Preprocessed tensor values or a deterministic summary.
2. ONNX logits.
3. Sigmoid probabilities.
4. Thresholded labels.

The test should record the browser, execution provider, model version, and maximum absolute difference.

### 10.4 Functional tests

At minimum, test:

- valid image selection;
- invalid or unreadable file;
- large image dimensions;
- reset workflow;
- model loading failure;
- WebGPU unavailable and WASM fallback;
- one abnormal prediction;
- `No Finding` without abnormal predictions;
- abnormal predictions suppressing `No Finding`;
- no label passing a threshold;
- attention heatmap unavailable or loading;
- authentication failure and protected-route behavior;
- workspace invitation, membership, and activity-publication behavior;
- unauthorized case, submission, workspace, and faculty-evaluation access denial;
- student submission before AI-feedback release;
- faculty evaluation, score/remark storage, and authorized student feedback visibility.

### 10.5 Network and privacy test

After deployment, browser developer tools should be used to inspect network traffic for both Learning Mode and an authenticated activity. The test should document whether a local Learning Mode image is sent to a backend, which secured case assets are requested for an assigned activity, whether inference sends image bytes to a backend, and what records or image data are persisted. This test is evidence for the implemented behavior; it should not be described as complete until it is performed on the deployed application.

### 10.6 Usability and heuristic evaluation

Nielsen’s usability heuristics may be used as a formative checklist for the interface. A heuristic review assesses interface issues; it does not establish clinical accuracy. SUS, contextual inquiry, shadowing, or expert review should be conducted only according to the approved research protocol.

## 11. Observability and CI/CD

### 11.1 Monitoring

The initial monitoring plan is Vercel Observability for deployment and web behavior. Sentry may be added for client-side exception reporting if the capstone requires detailed error traces.

Logs must not contain original X-ray bytes or unnecessary identifying information. Errors should identify model/version and workflow stage without exposing sensitive input data.

### 11.2 Continuous integration and deployment

The minimum deployment workflow is:

```text
Push branch
  -> Vercel preview deployment
  -> manual review
  -> merge to main
  -> Vercel production deployment
```

Optional GitHub Actions checks:

```text
npm install
npm run lint
npm run build
```

Additional model-artifact checks should verify that the ONNX model, labels, thresholds, and frontend configuration agree.

## 12. Failure Handling

| Failure | Required behavior |
|---|---|
| Unsupported image | Show a clear file-format or decoding error. |
| Model cannot load | Show an actionable initialization error and do not display fabricated results. |
| WebGPU unavailable | Try WASM if supported and show the active fallback state. |
| Inference failure | Preserve the image preview, show the failure, and allow retry/reset. |
| Missing threshold | Block thresholded display or use a clearly documented fallback; do not silently assume 0.50 for a missing final threshold. |
| Heatmap unavailable | Display model predictions with an explanation that the heatmap is unavailable. |
| Supabase unavailable | Explain that LMS activities and records are unavailable; Learning Mode may work only if its local assets and model are already available. |
| Network unavailable | Explain that authenticated activities cannot load; Learning Mode may run only if the application and model assets are already available. |

## 13. Security and Privacy Boundaries

### Client boundary

The client handles image decoding, preprocessing, inference, prediction display, and heatmap rendering. The client must not contain server-only Supabase credentials.

### Server boundary

Serverless functions handle authorized LMS operations. They must validate authentication, role, workspace membership, request shape, and any data before writing to Supabase.

### Data boundary

The intended data boundary is:

```text
Assigned teaching case: private authorized storage -> browser activity session
Learning Mode image: browser memory only by design goal
LMS metadata, submissions, and released feedback: authorized Supabase records
AI result metadata: authorized Supabase record with version metadata
Model and threshold files: deployed static artifacts
User account data: Supabase Auth
```

This boundary is a design target until validated in the deployed application.

## 14. Versioning Requirements

Every saved or reported result should be traceable to:

```text
model version/checkpoint
ONNX artifact version
label-order version
threshold version
preprocessing version
application version
```

At minimum, the project should record these values in a reproducibility log even if the initial UI does not show all of them to the student.

## 15. Implementation Sequence

1. Freeze the current PyTorch checkpoint and reference preprocessing.
2. Rerun and save the full validation metrics from that checkpoint.
3. Freeze the label order and threshold file.
4. Create the Next.js application shell, authentication entry points, and student/professor routes.
5. Implement Supabase Auth, roles, workspaces, membership, invitations, and RLS before exposing case data.
6. Implement controlled case storage, activities, reference evaluations, submissions, prediction-only feedback releases, and faculty evaluations.
7. Implement JavaScript preprocessing and compare it with the Python reference.
8. Load the ONNX model through ONNX Runtime Web and implement sigmoid, thresholds, and `No Finding` conflict handling.
9. Add loading, error, reset, and non-diagnostic disclaimer states.
10. Replace the logits-only export with the planned expanded ONNX artifact, then implement attention extraction and heatmap rendering. **The current milestone intentionally leaves this deferred.**
11. Compare browser outputs against the Python/ONNX reference and test the complete LMS workflow.
12. Add deployment checks, network/persistence inspection, heuristic review, and usability evaluation.

## 16. Open Technical Decisions

1. The exact attention-output names and tensor shape of the planned expanded ONNX artifact.
2. Whether WebGPU will be the preferred provider with WASM fallback in the first release.
3. Whether the ONNX model is self-contained or requires an external `.onnx.data` file.
4. The exact faculty-feedback release/editing lifecycle after a professor records an evaluation.
5. The minimum browser/device support matrix.
6. The approved deletion or archival procedure after the one-academic-term retention period.
7. The exact model artifact and threshold version used for final paper claims.

## 17. Technical References

- PyTorch ONNX export: https://docs.pytorch.org/docs/stable/onnx.html
- ONNX Runtime Web: https://onnxruntime.ai/docs/tutorials/web/
- ONNX Runtime WebGPU: https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html
- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers
- Vercel Functions: https://vercel.com/docs/functions
- Supabase Storage: https://supabase.com/docs/guides/storage
- Maurya et al. (2026), Efficient SqueezeViT: https://doi.org/10.1038/s41598-026-47918-4
- Sloan et al. (2025), Clinically-aligned Multi-modal Chest X-ray Classification: https://arxiv.org/abs/2511.09581
- van Dort et al. (2025), heuristic evaluation of explainable AI dashboards: https://doi.org/10.3233/SHTI250341
