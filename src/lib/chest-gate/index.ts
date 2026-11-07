import { chestFeatures } from "./features";
import gate from "./weights.json";

export function chestProbability(features: Float32Array) {
  let logit = gate.outputBias;
  for (let unit = 0; unit < gate.hiddenBias.length; unit += 1) {
    let hidden = gate.hiddenBias[unit];
    for (let index = 0; index < features.length; index += 1) hidden += features[index] * gate.hiddenWeights[index][unit];
    logit += Math.max(0, hidden) * gate.outputWeights[unit];
  }
  return 1 / (1 + Math.exp(-logit));
}

/** Colour photos fail the colourfulness rule; greyscale non-X-rays fail the classifier. */
export function passesChestGate({ features, colourfulness }: ReturnType<typeof chestFeatures>) {
  return colourfulness <= gate.maxColourfulness && chestProbability(features) >= gate.threshold;
}

export function isChestXray(rgba: ArrayLike<number>, width: number, height: number) {
  return passesChestGate(chestFeatures(rgba, width, height));
}
