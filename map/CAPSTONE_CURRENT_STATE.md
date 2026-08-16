# ThoraxScan Capstone: Current Project State

**Project:** ThoraxScan  
**Document status:** Working project record aligned with the pre-oral capstone document  
**Last updated:** 2026-08-10  
**Source:** `(LATEST)RadTech-ThoraxScan-Pre-Oral.docx`, project discussion, and reported experiment outputs

## 1. Project Summary

ThoraxScan is being developed as a web-based, professor-guided educational learning platform for Radiologic Pathology and BS Radiologic Technology students. Its purpose is to support structured chest X-ray interpretation practice through workspaces, learning activities, student submissions, AI-assisted learning feedback, and faculty evaluation.

ThoraxScan is **not** being presented as a standalone diagnostic system, a replacement for a radiologist, or a clinically validated decision-making tool.

The approved learning workflow is: a professor creates a private workspace and invites students; the professor uploads an approved, de-identified learning case and publishes an activity with a reference evaluation; a student submits an interpretation; the system releases AI-assisted learning feedback after the submission; and the professor reviews the work and records scores, remarks, or feedback.

The current technical direction is a browser-based application in which the trained model is exported to ONNX and inference is intended to occur through ONNX Runtime Web when the user’s browser supports the required execution provider. Local-only processing is a design goal for the browser inference path, not a verified deployed-system claim until network testing is complete.

## 2. Current Architecture

```text
Professor: workspace -> invitation -> approved case -> activity -> publish
Student: login -> assigned activity -> interpretation -> submit
        |
        +--> Browser AI path: grayscale -> 224 x 224 -> ONNX Runtime Web
        |                        -> probabilities -> thresholds -> learning feedback
        |
        +--> LMS data path: Supabase Auth, Postgres, Storage, and RLS
                                 -> submissions -> faculty evaluation -> feedback release
```

Authentication, role-based access, workspace membership, invitation control, activities, submissions, AI-feedback release, and faculty evaluation are core planned functions. Professor-uploaded cases are intentionally stored only as approved, de-identified teaching cases in controlled storage; the system is not a clinical record repository. The deployed application must be tested to verify the actual transfer and retention behavior for both the LMS case path and the browser-inference path.

## 3. Confirmed Technology Choices

| Area | Current choice | Status |
|---|---|---|
| Frontend | Next.js | Planned |
| Styling | Tailwind CSS | Planned |
| Backend endpoints | Next.js Route Handlers deployed as Vercel Serverless Functions | Planned core LMS support |
| Backend runtime | Node.js/TypeScript through the Next.js/Vercel runtime | Planned |
| Hosting | Vercel | Planned |
| Database | Supabase Postgres | Planned core LMS data layer |
| Authentication | Supabase Auth | Planned core role and session control |
| Storage | Supabase Storage for approved, de-identified teaching cases and authorized educational artifacts | Planned core LMS storage |
| Monitoring | Vercel Observability; Sentry is optional | Planned |
| CI/CD | GitHub with Vercel preview and production deployments; GitHub Actions is optional for checks | Planned |
| Model training | PyTorch | Completed for the current checkpoint |
| Model export | ONNX | Completed and verified for the working export path |
| Browser inference | ONNX Runtime Web using WebGPU/WASM as supported by the browser | Planned |
| Explainability | Attention heatmaps | Planned; Grad-CAM is not being used |

The project is better described as a **browser-inference LMS with supporting backend APIs**, not as an API-based AI product. The backend supports the required educational workflow and controlled records; the primary model inference is intended to occur in the browser.

## 4. Model and Dataset

### 4.1 Model

The current model is a custom SqueezeViT-based multi-label classifier defined in `squeezevit_thoraxScan.py`.

Current model contract:

```text
Input:  [batch, 1, 224, 224]
Output: [batch, 14] logits
```

The current architecture includes convolutional Fire modules and transformer encoder blocks. The transformer token feature map is based on a 7 x 7 grid, giving 49 tokens for the current input and patch configuration.

The approved capstone model and web workflow currently apply this contract to **frontal chest X-ray images** compatible with the documented preprocessing pipeline.

### 4.2 Preprocessing

The current evaluation and inference preprocessing is:

```text
Convert image to grayscale
Resize to 224 x 224
Convert to tensor
Normalize with mean = 0.5 and standard deviation = 0.25
```

The browser implementation must reproduce these steps exactly. A different preprocessing pipeline can change the model outputs even when the ONNX model is correct.

### 4.3 Labels

The model has 14 output labels:

1. No Finding
2. Enlarged Cardiomediastinum
3. Cardiomegaly
4. Lung Opacity
5. Lung Lesion
6. Edema
7. Consolidation
8. Pneumonia
9. Atelectasis
10. Pneumothorax
11. Pleural Effusion
12. Pleural Other
13. Fracture
14. Support Devices

The classifier uses sigmoid probabilities because the task is multi-label rather than mutually exclusive single-class classification.

## 5. Work Completed So Far

### 5.1 Preliminary needs assessment

A preliminary survey was conducted to establish whether students experienced a real learning need related to chest X-ray interpretation. The pre-oral capstone document reports 31 first- and second-year respondents, while the provided response matrix contained 30 respondent rows. This discrepancy must be reconciled against the final raw response record before publication. The survey used a four-point Likert scale:

| Response | Code |
|---|---:|
| Strongly Disagree | 1 |
| Disagree | 2 |
| Agree | 3 |
| Strongly Agree | 4 |

The survey covered confidence, disease identification, theoretical knowledge, normal-versus-abnormal distinction, recognition of anatomy and abnormalities, perceived need for advanced expertise, and the possible usefulness of technological assistance.

The following percentages were previously reported in the project discussion and should be reconciled against the final survey calculations before publication:

- 71% reported difficulty distinguishing normal and abnormal findings.
- 74.2% reported difficulty distinguishing abnormalities or pathologies from one another.
- 51.6% agreed that interpretation is challenging without technological assistance or proper training.
- 58.1% believed that additional tools could improve X-ray analysis.

The survey supports the planning rationale for an educational teaching aid. It does not establish model accuracy or clinical effectiveness.

### 5.2 Model training

The custom SqueezeViT model was trained using a batch size of 128. The best reported custom validation training result was:

```text
Best validation mean AUC: 0.7728847801505602
Epoch: 38
```

The associated checkpoint was identified as:

```text
custom_train_squeezevit_b128_e38_mean07729.pth
```

### 5.3 Full custom-validation evaluation

A separate full custom-validation evaluation was reported on 19,206 frontal images. Its reported results were:

```text
Mean AUC across all evaluable labels: 0.7582
Primary AUC across stable labels:     0.7582
Competition AUC:                      0.7680
```

These values must be reported with their exact split, checkpoint, preprocessing, and evaluation script. The 0.7728847801505602 training-log value and the 0.7582 full-evaluation value should not be presented as the same measurement unless the experiment logs confirm that they use the same data and metric calculation.

Reported per-label AUC values:

| Label | AUC | Positives | Negatives |
|---|---:|---:|---:|
| No Finding | 0.868057 | 1,748 | 17,458 |
| Enlarged Cardiomediastinum | 0.677648 | 937 | 18,269 |
| Cardiomegaly | 0.846615 | 2,292 | 16,914 |
| Lung Opacity | 0.693936 | 9,427 | 9,779 |
| Lung Lesion | 0.755785 | 731 | 18,475 |
| Edema | 0.803714 | 4,872 | 14,334 |
| Consolidation | 0.719696 | 1,309 | 17,897 |
| Pneumonia | 0.722771 | 477 | 18,729 |
| Atelectasis | 0.644747 | 2,974 | 16,232 |
| Pneumothorax | 0.798017 | 1,830 | 17,376 |
| Pleural Effusion | 0.825140 | 7,914 | 11,292 |
| Pleural Other | 0.774094 | 247 | 18,959 |
| Fracture | 0.725140 | 718 | 18,488 |
| Support Devices | 0.758793 | 10,944 | 8,262 |

### 5.4 Threshold tuning

Per-label thresholds were tuned rather than using 0.50 for every label. The current threshold file was identified as:

```text
squeezevit_thresholds.csv
```

Current thresholds:

| Label | Threshold | F1 |
|---|---:|---:|
| No Finding | 0.76 | 0.4779 |
| Enlarged Cardiomediastinum | 0.63 | 0.1839 |
| Cardiomegaly | 0.74 | 0.5067 |
| Lung Opacity | 0.37 | 0.7031 |
| Lung Lesion | 0.58 | 0.1915 |
| Edema | 0.54 | 0.5896 |
| Consolidation | 0.61 | 0.2249 |
| Pneumonia | 0.49 | 0.1409 |
| Atelectasis | 0.52 | 0.3432 |
| Pneumothorax | 0.72 | 0.4373 |
| Pleural Effusion | 0.47 | 0.7439 |
| Pleural Other | 0.43 | 0.1083 |
| Fracture | 0.60 | 0.2039 |
| Support Devices | 0.24 | 0.7920 |

The application logic suppresses `No Finding` when one or more abnormal labels pass their thresholds. This prevents the interface from displaying `No Finding` simultaneously with abnormal findings.

Thresholds should be tuned on a calibration/validation set and then locked before final test evaluation. They should not be repeatedly optimized on the final test set.

### 5.5 ONNX export and verification

The ONNX model was exported from the trained PyTorch checkpoint. The recommended export path uses:

```python
dynamo=False
opset_version=17
external_data=False
```

The working artifact was identified as:

```text
squeezevit_thoraxscan_v1.onnx
```

The CPU PyTorch-versus-ONNX verification reported:

```text
Maximum logit difference:       approximately 0.0000033
Maximum probability difference: approximately 0.0000007
```

The PyTorch GPU-versus-ONNX Runtime GPU verification reported:

```text
Maximum logit difference:       0.00511086
Maximum probability difference: 0.0010094047
```

The GPU test used the NVIDIA CUDA execution provider and reported successful verification. These differences should be documented as numerical differences between execution environments, not as a new accuracy measurement.

### 5.6 ONNX exporter issue identified

When `dynamo=True` was used without the required dependency, export failed because `onnxscript` was missing. After `onnxscript` was available, export produced warnings because:

- `dynamic_axes` is not the preferred dynamic-shape argument for the newer exporter path.
- PyTorch used opset 18 internally while the script requested opset 17.
- Conversion from opset 18 to opset 17 failed for the `Resize` operator.

The newer exporter path should use `opset_version=18` and `dynamic_shapes` if it is tested again. It is not required for the current deployment because the `dynamo=False` artifact was already verified.

An additional `.onnx.data` file may be generated when ONNX stores tensor weights as external data. The website must receive both files if the exported model references external data, or the model should be re-exported as a self-contained ONNX file when possible.

## 6. Explainability Status

The project will use attention heatmaps, not Grad-CAM.

The current transformer implementation discards attention weights using a pattern equivalent to:

```python
attn_out, _ = self.attn(x, x, x)
```

Therefore, a heatmap cannot be produced from the current model output alone. The transformer block must be changed to retain attention weights, for example by requesting non-averaged attention weights. The attention information can then be aggregated over heads and tokens, reshaped from the 49-token representation to a 7 x 7 map, upsampled to the image size, and overlaid on the X-ray.

The heatmap must be described as a visualization of model attention or internal focus. It must not be described as confirmed disease localization or proof that a specific region contains a lesion.

## 7. Paper and Methodology Status

The paper structure being used is:

```text
Research Design
Lifecycle
  Planning Phase
    System Architecture and Tools
    Data Collection Methods and Analysis
  Analysis Phase
  Design Phase
    ERD and DFDs
  Implementation Phase
  Testing and Iteration Phase
  Maintenance Phase
```

The intended tense convention is:

- Planning, Analysis, and Design: past tense, because these decisions and analyses have already been completed.
- Implementation, Testing and Iteration, and Maintenance: future tense when describing the remaining system-development activities.

The paper’s current methodological position is that ThoraxScan is a developmental, mixed-methods educational system. The preliminary needs assessment supports the planning rationale. Model AUC, threshold metrics, and ONNX verification support technical evaluation. Heuristic evaluation, usability testing, SUS, contextual inquiry, and attention-heatmap review are intended for system evaluation; they do not replace clinical validation.

The capstone design specifies a professor-guided LMS with Users, Workspaces, Workspace Members, Invitation Codes, Activities, X-ray Cases, AI Analyses, Student Submissions, AI Feedback Releases, and Faculty Evaluations. Those records and their access controls are planned implementation work, not completed functionality.

References discussed for the paper include:

- Sloan, P., Simpson, E., & Mirmehdi, M. (2025). *Clinically-aligned Multi-modal Chest X-ray Classification*. https://arxiv.org/abs/2511.09581
- Maurya, A., Lohia, A., Chirag, Yadav, J., Panjwani, B., & Mohan, V. (2026). *Efficient SqueezeViT: A lightweight vision transformer framework for chest X-ray image classification*. https://doi.org/10.1038/s41598-026-47918-4
- van Dort, B. A., López Cañizares, J., Marcilly, R., Peute, L., & Sent, D. (2025). *Enhancing Clinical Decision Support: A Heuristic Evaluation of Explainable AI in Healthcare Dashboards*. https://doi.org/10.3233/SHTI250341

Nielsen’s usability heuristics may be used as a formative interface-review checklist. The five-user rule should not be used as evidence that the AI model is clinically accurate or educationally effective.

## 8. Remaining Work

The following items are not yet confirmed as completed:

1. Freeze the final model checkpoint, preprocessing definition, label policy, thresholds, and evaluation split.
2. Rerun the full validation evaluation from the exact final checkpoint and save the complete metric table.
3. Clearly separate pilot/subset evaluation from the full 19,206-image evaluation in the paper.
4. Decide whether `Fracture` will remain an application output. It is evaluable in the full validation result, but it was undefined in an earlier 202-image subset because that subset contained zero positive examples.
5. Implement attention-weight extraction and attention heatmap generation.
6. Create the Next.js and Tailwind CSS application shell.
7. Add the ONNX model and threshold data to the web application.
8. Reproduce Python preprocessing in JavaScript.
9. Compare browser predictions against the verified Python/ONNX predictions using identical images.
10. Implement the prediction interface and heatmap display.
11. Implement Supabase authentication, student/professor roles, workspace membership, invitation control, and row-level access rules.
12. Implement professor case/activity creation, reference evaluations, controlled storage of approved de-identified teaching cases, student submissions, AI-feedback release, and faculty evaluation.
13. Define and test the one-academic-term retention rule for approved cases and student-submission records, subject to the approved research protocol and institutional requirements.
14. Test browser network traffic and persistence behavior for the local practice-image path and the controlled course-case path.
15. Conduct heuristic review, usability evaluation, and qualitative feedback collection according to the approved research protocol.
16. Add GitHub-based deployment checks and document the production deployment.

## 9. Current Limitations

- CheXpert labels are weak labels and may contain uncertainty or incomplete annotations.
- Several labels are imbalanced, and low-prevalence labels require cautious interpretation.
- AUC measures ranking ability; it does not establish clinical usefulness or diagnostic safety.
- Threshold tuning changes precision and recall but does not improve the underlying model’s learned representation.
- Attention heatmaps are explanatory visualizations, not validated lesion-localization maps.
- Browser inference performance depends on the user’s device, browser, and available WebGPU/WASM support.
- The current project has not established clinical effectiveness or diagnostic equivalence.
- The privacy claim about local-only processing must be verified in the deployed website before it is stated as a demonstrated system property.
- The LMS, role-based access, controlled case storage, activity workflow, submission workflow, and faculty-evaluation workflow remain planned until implemented and tested.

## 10. Recommended Final System Description

> ThoraxScan is a web-based educational learning platform for BS Radiologic Technology students studying chest X-ray interpretation. Professors create controlled learning activities using approved, de-identified teaching cases; students submit their own interpretation before receiving AI-assisted learning feedback; and professors review submissions and provide scores, remarks, or feedback. The system uses a custom SqueezeViT-based model trained with PyTorch and exported to ONNX for intended browser inference through ONNX Runtime Web. It produces multi-label outputs for the 14 CheXpert observations, applies per-label thresholds, and will present attention heatmaps as an explanatory aid after implementation. Next.js and Tailwind CSS will provide the frontend, while Vercel serverless functions and Supabase will support role-based LMS records and controlled storage. ThoraxScan supports learning and interpretation practice; it does not replace professional radiologic diagnosis.

## 11. Reproducibility Checklist

Before claiming final performance, record all of the following in one experiment log:

```text
Checkpoint filename and hash
Training dataset/split
Validation dataset/split
Number of frontal images
Approved image-view scope
Label preprocessing and -1 policy
Image preprocessing
Image size
Batch size
Number of epochs
Random seed, if used
Model output order
Threshold file and threshold-selection rule
Per-label positives and negatives
Per-label AUC
Mean-AUC calculation rule
ONNX opset and exporter settings
PyTorch and ONNX Runtime versions
Hardware and execution provider
Workspace, activity, and feedback-release rule version
Storage-access and retention-rule version
```

This record is required to distinguish the best training-log result from the final full-validation performance claim.
