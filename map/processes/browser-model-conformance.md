---
node_type: process
universe: live
status: verified
audited: 2026-08-24
snapshot: main @ 46c18c1 + working tree
---

# Browser model conformance

Version 1 input/evidence → real Chromium and ONNX Runtime Web checks → pass or closed failure.

## Steps

1. Vitest Browser Mode runs the browser image decode and preprocessing path in Chromium.
2. Release validation runs the supplied model and parity fixtures in ONNX Runtime Web WASM at the fixed tolerances.
3. Activation runs the remote artifact in headless Chromium after pointer read-back.

## Consumes

- [Browser inference runtime](../objects/inference/browser-inference-runtime.md)
- [Preprocessing tensor](../objects/inference/preprocessing-tensor.md)
- [Model manifest and configuration](../objects/inference/model-manifest-configuration.md)

## Produces

- Conformance evidence or a failure that prevents staging/keeps activation from remaining on the failed target.

## If you change this

### Hits

- Chromium dependency, preprocessing browser tests, release parity evidence, activation smoke, and rollout gates.

### Does not hit

- A deployed diagnostic route; none exists.

## See

[Browser smoke implementation](../../scripts/model-release.ts#L653)
