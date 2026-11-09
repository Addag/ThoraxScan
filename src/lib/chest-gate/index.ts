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

// Width / height. 7 of 5,000 held-out chest X-rays (about 1 in 700) are narrower than 0.72. Features squash every image square,
// so a tall crop of a foot or arm would otherwise fill the frame like a chest.
const MIN_ASPECT = 0.72;
const MAX_ASPECT = 1.6;

/** Odd shapes fail first, colour photos fail the colourfulness rule, greyscale non-X-rays fail the classifier. */
export function passesChestGate({ features, colourfulness, aspect }: ReturnType<typeof chestFeatures>) {
  return aspect >= MIN_ASPECT && aspect <= MAX_ASPECT && colourfulness <= gate.maxColourfulness && chestProbability(features) >= gate.threshold;
}

export function isChestXray(rgba: ArrayLike<number>, width: number, height: number) {
  return passesChestGate(chestFeatures(rgba, width, height));
}
