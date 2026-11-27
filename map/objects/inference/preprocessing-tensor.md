---
node_type: object
universe: live
status: verified
audited: 2026-10-30
snapshot: main @ 26c41bb + working tree
---

# Preprocessing tensor

A transient float32 NCHW tensor produced from a decoded non-alpha JPEG or PNG for the version 1 model input.

## Why this shape

Deterministic browser preprocessing is part of the model compatibility contract and is checked byte-for-byte against release evidence.

## Shape

The pure transform uses Rec. 601 luma, center-aligned bilinear resize to 224 by 224 without an antialias filter, clamped edges, and `(pixel - 0.5) / 0.25` after conversion to the zero-to-one range.

The release's `preprocessing.resize.interpolation` picks the resize, so each release keeps the behavior it was validated with:

- `bilinear-center`: one resize straight to 224 (every release before 2026-10-30).
- `shortside320-bilinear-center`: images whose short side exceeds 320 first go to short side 320 (long side floored) with the same math, as Stanford made CheXpert-small (cv2 `INTER_LINEAR`, the closest of 7 filters measured against the small copies). Built-in library images are already at short side 320, so only full-size uploads change. Intermediates stay float64 so the default path is byte-identical to before.

The runtime decodes the image in parallel with resolving the active release, then builds the tensor with that release's mode. Python reference: [preprocessing_shortside320.py](../../../model-export/preprocessing_shortside320.py).

## Connected to

Configured by [Model manifest and configuration](model-manifest-configuration.md) and consumed by [Browser inference runtime](browser-inference-runtime.md).

## If you change this

### Hits

- Manifest version (or a new `resize.interpolation` value in [contract.ts](../../../src/lib/inference/contract.ts)), Python reference evidence, expected tensor fixture, validator, unit/browser tests, and every compatible model export.
- App builds older than a new interpolation value reject manifests that use it: deploy the app before activating such a release.

### Does not hit

- Direct database writes and Storage persistence; the tensor is produced in the browser from a local, built-in-library, or signed private activity-case image supplied by a caller.

## Surfaces

Browser decode path, pure testable transform, and operator validation.

## See

[Preprocessing implementation](../../../src/lib/inference/preprocess.ts#L12)
