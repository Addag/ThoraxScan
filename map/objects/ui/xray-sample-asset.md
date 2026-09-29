---
node_type: object
universe: live
status: verified
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# X-ray sample asset

public/images/xray-sample.png is a static illustrative image used by the landing and authentication surfaces.

## Why this shape

It provides visual product context without being part of a model-loading or inference pipeline.

## Shape

The asset is referenced by the landing page and auth layout through the public image path in [page.tsx](<../../../src/app/page.tsx:39>) and [auth-layout.tsx](<../../../src/components/auth/auth-layout.tsx:56>).

## Connected to

The [landing surface](landing-surface.md) and [authentication surface](auth-surface.md).

## If you change this

### Hits

- Landing and auth visual rendering, dimensions, and accessibility text.

### Does not hit

- Image input, preprocessing, model inference, or clinical data storage.
- The [Built-in X-ray library](../learning/built-in-xray-library.md), which uses its own `public/images/chexpert/` files.

## Surfaces

Static public asset and browser UI.

## See

[xray-sample.png](<../../../public/images/xray-sample.png>)
