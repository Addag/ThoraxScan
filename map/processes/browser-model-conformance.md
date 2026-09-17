---
node_type: process
universe: live
status: verified
audited: 2026-09-17
snapshot: main @ a96a291
---

# Browser model conformance

Version 1 input/evidence → real Chromium and ONNX Runtime Web checks → pass or closed failure.

## Steps

1. Vitest Browser Mode runs the browser image decode and preprocessing path in Chromium ([browser preprocessing test](../../src/lib/inference/preprocess.browser.test.ts#L17)).
2. Release validation loads the ONNX Runtime Web browser bundle and runs the supplied model and parity fixtures in WASM at the fixed tolerances, attempting WebGPU only to determine whether that release may enable it ([browser provider validation](../../scripts/model-release.ts#L234)).
3. Activation runs the remote artifact in headless Chromium before and after the pointer change, including after pointer read-back ([browser smoke](../../scripts/model-release.ts#L660), [activation flow](../../scripts/model-release.ts#L818)).

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

[Browser provider validation](../../scripts/model-release.ts#L234)
