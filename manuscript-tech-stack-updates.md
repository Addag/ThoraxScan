# Manuscript updates: hardware, software and dependencies

Proposed changes to `(LATEST)RadTech-ThoraxScan-Pre-Oral.docx`, as of November 12, 2026.
**Applied on November 12, 2026** (items 2 and 3; item 1 needed no change). The user confirmed the
workstation below is the one the model was trained on. Appendix F starts on page 122.

## What the manuscript says now

- **Chapter 3, Planning Phase** (the paragraph beginning "The project resources were identified", and the
  five-item list "The following tools and technologies were organized according to their role"): Python,
  PyTorch, torchvision, pandas, scikit-learn, ONNX, ONNX Runtime Web, Next.js, Tailwind CSS, Supabase, and
  serverless functions.
- **Chapter 3, Implementation and Testing phases**: PyTorch, ONNX, ONNX Runtime Web with WebGPU and WebAssembly,
  and the CPU and GPU parity checks.
- **Chapter 4, System Architecture**: Next.js, React, ONNX Runtime Web, Vercel, Supabase, Cloudflare
  Turnstile, and Resend.
- **No hardware is mentioned anywhere**, and there is no hardware or software specification table.

## Proposed changes

### 1. Chapter 3: leave as is

The tool list describes what was selected at planning, and every tool on it was used. It also names
SqueezeViT, which stays as defended at pre-oral. The as-built tools go in Chapter 4 and Appendix F instead.

### 2. Chapter 4, System Architecture: one new paragraph

**Where:** Chapter 4, System Architecture, after the paragraph beginning "Supabase. Supabase provides
authentication", before the numbered "Graded activity" steps.

**Add:**

> Hardware. The model was trained, exported to ONNX, and checked against its PyTorch version on a
> workstation with an AMD Ryzen 7 7800X3D processor, 32 GB of memory, and an NVIDIA GeForce RTX 5070 Ti
> graphics card with 16 GB of memory, running Windows 11 Pro. The deployed system needs no AI server and no
> installation. Students and professors use any device with a current web browser, which downloads the
> model of about 43 MB once and runs it on the device's graphics processor through WebGPU or on its
> processor through WebAssembly, so the analysis speed depends on the device. The hardware, software, and
> libraries used are listed in Appendix F.

[Confirm that this PC is the one the model was trained on. If training ran on another machine, give its
processor, memory and graphics card instead.]

### 3. New Appendix F: Hardware and Software Specifications

An appendix avoids renumbering the tables in Chapters 4 and 5.

**Table of Appendices:** add a row: Appendix F, Hardware and Software Specifications, [page].

**Appendix F text:**

> APPENDIX F
>
> Hardware and Software Specifications
>
> This appendix lists the hardware, software, and libraries used to develop, train, and deploy ThoraxScan.
> Versions are those used at the time of writing.

**Table F1. Hardware**

| Component | Specification | Used for |
|---|---|---|
| Development and training workstation | AMD Ryzen 7 7800X3D, 32 GB memory, NVIDIA GeForce RTX 5070 Ti (16 GB), Windows 11 Pro | Model training, ONNX export, parity checks, and web development |
| User device | Any computer, tablet, or phone with a current web browser | Using the system and running the model in the browser |
| Application hosting | Vercel cloud platform | Delivering the web application and running its server functions |
| Database and storage | Supabase cloud platform | Accounts, database, and file storage |

**Table F2. Software and services**

| Software | Version | Used for |
|---|---|---|
| Next.js | 16.4 | Web application framework |
| React | 19.2 | User interface |
| TypeScript | 5.9 | Programming language of the web application |
| Tailwind CSS | 4.3 | Page styling |
| Node.js | 24 | Running the web application during development |
| Supabase (PostgreSQL 17, Auth, Storage) | Hosted | Database, accounts, and file storage |
| Vercel | Hosted | Hosting and deployment |
| Cloudflare Turnstile | Hosted | CAPTCHA on registration, login, and password recovery |
| Resend | Hosted | Confirmation and password-reset emails |
| ONNX Runtime Web | 1.27.0 | Running the model in the browser through WebGPU or WebAssembly |
| sharp | 0.35 | Checking uploaded X-ray images on the server |
| Vitest and Playwright | 4.1 and 1.62 | Automated tests, including the model tests in a browser |
| Python | 3.14.7 | Model training and export |
| PyTorch and torchvision | 2.11.0 and 0.26.0 (CUDA 12.8) | Model training |
| timm | 1.0.27 | TinyViT and FastViT model definitions and pretrained weights |
| NumPy, pandas, scikit-learn, SciPy | 2.4.6, 3.0.3, 1.8.0, 1.17.1 | Data handling and evaluation metrics |
| Pillow and OpenCV | 12.2.0 and 4.13.0 | Image loading and preprocessing |
| Matplotlib | 3.10.9 | Charts for evaluation |
| ONNX and ONNX Runtime GPU | 1.21.0 and 1.26.0 | Model export and PyTorch-to-ONNX parity checks |

The web packages are given as major.minor versions, so the table stays correct after the pending patch
updates (for example, Next.js 16.4.2 to 16.4.6).

## Not proposed

- **Minimum device requirements** (for example, the slowest device that runs the model acceptably): the
  project has not measured this, so the paper should not state one. It could be a recommendation in
  Chapter 5 instead.
