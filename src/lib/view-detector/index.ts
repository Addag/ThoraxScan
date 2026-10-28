import { viewFeatures } from "./features";
import detector from "./weights.json";

export async function lateralProbability(image: Buffer | string) {
  const features = await viewFeatures(image);
  let logit = detector.outputBias;
  for (let unit = 0; unit < detector.hiddenBias.length; unit += 1) {
    let hidden = detector.hiddenBias[unit];
    for (let index = 0; index < features.length; index += 1) hidden += features[index] * detector.hiddenWeights[index][unit];
    logit += Math.max(0, hidden) * detector.outputWeights[unit];
  }
  return 1 / (1 + Math.exp(-logit));
}

// Only confident lateral calls are rejected; the Professor's attestation covers the rest.
export async function looksLateral(image: Buffer | string) {
  return (await lateralProbability(image)) >= detector.threshold;
}
