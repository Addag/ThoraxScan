---
node_type: object
universe: live
status: verified
audited: 2026-09-29
snapshot: main @ 6af6c16
---

# Preprocessing tensor

A transient float32 NCHW tensor produced from a decoded non-alpha JPEG or PNG for the version 1 model input.

## Why this shape

Deterministic browser preprocessing is part of the model compatibility contract and is checked byte-for-byte against release evidence.

## Shape

The pure transform uses Rec. 601 luma, center-aligned bilinear resize to 224 by 224, clamped edges, and `(pixel - 0.5) / 0.25` after conversion to the zero-to-one range.

## Connected to

Configured by [Model manifest and configuration](model-manifest-configuration.md) and consumed by [Browser inference runtime](browser-inference-runtime.md).

## If you change this

### Hits

- Manifest version, Python reference evidence, expected tensor fixture, validator, unit/browser tests, and every compatible model export.

### Does not hit

- Direct database writes and Storage persistence; the tensor is produced in the browser from a local, built-in-library, or signed private activity-case image supplied by a caller.

## Surfaces

Browser decode path, pure testable transform, and operator validation.

## See

[Preprocessing implementation](../../../src/lib/inference/preprocess.ts#L12)
