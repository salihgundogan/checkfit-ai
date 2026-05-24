import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import * as jpeg from 'jpeg-js';

const IMG_SIZE = 640;

const CLASS_NAMES: Record<number, string> = {
  0: 'baklava',
  1: 'hamburger',
  2: 'kebap',
  3: 'köfte',
  4: 'lahmacun',
  5: 'patates_kizartmasi',
  6: 'pizza',
  7: 'sosisli',
  8: 'sutlac',
  9: 'waffle',
};

// YOLO seg output layout: [1, 4+32+numClasses, 8400]
// bbox coords : rows 0–3
// mask coeffs : rows 4–35
// class logits: rows 36–45  (for 10 classes)
const BBOX_OFFSET  = 0;   // unused here but documented
const MASK_OFFSET  = 4;
const CLASS_OFFSET = 36;  // MASK_OFFSET + 32
const NUM_CLASSES  = 10;

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

export type FoodInferenceResult = {
  name:       string;
  areaCm2:    number;
  confidence: number;
};

export const runFoodInference = async (
  imageUri: string,
  session: InferenceSession | null,
): Promise<FoodInferenceResult> => {
  if (!session) {
    return { name: 'Belirlenemedi', areaCm2: 0, confidence: 0 };
  }

  try {
    // ── 1. Resize → 640×640 ──────────────────────────────────────────────────
    const resizedImage = await ImageResizer.createResizedImage(
      imageUri,
      IMG_SIZE,
      IMG_SIZE,
      'JPEG',
      100,
      0,
      undefined,
      false,
      { mode: 'stretch' },
    );

    // ── 2. Base64 → Buffer ───────────────────────────────────────────────────
    const base64Data = await RNFS.readFile(resizedImage.uri, 'base64');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // ── 3. JPEG decode (RGBA) ────────────────────────────────────────────────
    const rawImageData = jpeg.decode(fileBuffer, { useTArray: true });
    const rgba = rawImageData.data;

    // ── 4. Float32 tensor [1, 3, 640, 640] CHW, normalised 0–1 ──────────────
    const float32Data = new Float32Array(3 * IMG_SIZE * IMG_SIZE);
    const planeSize   = IMG_SIZE * IMG_SIZE;

    for (let i = 0; i < planeSize; i++) {
      const off = i * 4;
      float32Data[i]               = (rgba[off]     || 0) / 255.0; // R
      float32Data[i + planeSize]   = (rgba[off + 1] || 0) / 255.0; // G
      float32Data[i + 2 * planeSize] = (rgba[off + 2] || 0) / 255.0; // B
    }

    const inputTensor = new Tensor('float32', float32Data, [1, 3, IMG_SIZE, IMG_SIZE]);

    // ── 5. Inference ─────────────────────────────────────────────────────────
    const feeds: Record<string, Tensor> = {};
    feeds[session.inputNames[0]] = inputTensor;
    const outputData = await session.run(feeds);

    // ── 6. Parse output ──────────────────────────────────────────────────────
    const outputTensor = outputData[session.outputNames[0]];
    const raw  = outputTensor.data as Float32Array;
    const dims = outputTensor.dims;

    console.log('Output dims:', dims);
    console.log('Output length:', raw.length);

    let predictedName = 'Belirlenemedi';
    let confidence    = 0;

    // ── 6a. YOLO-seg: [1, 46, 8400] ─────────────────────────────────────────
    if (dims.length === 3) {
      const numAnchors   = dims[2]; // 8400
      const numRows      = dims[1]; // should be 46 (4 bbox + 32 mask + 10 class)
      const classStart   = numRows - NUM_CLASSES; // dynamic, equals CLASS_OFFSET

      let bestScore     = -Infinity;
      let bestClassIdx  = 0;
      let bestAnchorIdx = 0;

      // Iterate every anchor × every class to find the single highest logit
      for (let a = 0; a < numAnchors; a++) {
        for (let c = 0; c < NUM_CLASSES; c++) {
          // Layout: raw[row * numAnchors + anchorIdx]
          const logit = raw[(classStart + c) * numAnchors + a];
          if (logit > bestScore) {
            bestScore     = logit;
            bestClassIdx  = c;
            bestAnchorIdx = a;
          }
        }
      }

      confidence    = sigmoid(bestScore);
      predictedName = CLASS_NAMES[bestClassIdx] ?? 'Belirlenemedi';

      console.log(`Best anchor: ${bestAnchorIdx}, class idx: ${bestClassIdx}`);
      console.log(`Raw logit: ${bestScore.toFixed(4)}, sigmoid confidence: ${(confidence * 100).toFixed(1)}%`);

    // ── 6b. Pure classification: [1, num_classes] ───────────────────────────
    } else if (dims.length === 2) {
      const logits = Array.from(raw);

      // Softmax is valid here because the head is a classification head
      const maxVal = Math.max(...logits);
      const expArr = logits.map(v => Math.exp(v - maxVal));
      const expSum = expArr.reduce((a, b) => a + b, 0);
      const probs  = expArr.map(v => v / expSum);

      let maxIdx = 0;
      for (let i = 1; i < probs.length; i++) {
        if (probs[i] > probs[maxIdx]) maxIdx = i;
      }

      confidence    = probs[maxIdx];
      predictedName = CLASS_NAMES[maxIdx] ?? 'Belirlenemedi';

      console.log('Probs:', probs.map((p, i) => `${CLASS_NAMES[i]}: ${(p * 100).toFixed(1)}%`));

    // ── 6c. Fallback: flat array, treat as logits ────────────────────────────
    } else {
      const logits = Array.from(raw);
      let maxIdx   = 0;
      for (let i = 1; i < logits.length; i++) {
        if (logits[i] > logits[maxIdx]) maxIdx = i;
      }
      confidence    = sigmoid(logits[maxIdx]);
      predictedName = CLASS_NAMES[maxIdx] ?? 'Belirlenemedi';
    }

    console.log(`Tahmin: ${predictedName}, Güven: %${(confidence * 100).toFixed(1)}`);

    return { name: predictedName, areaCm2: 0, confidence };

  } catch (error: any) {
    console.error('Model Hatası:', error);
    return { name: 'Belirlenemedi', areaCm2: 0, confidence: 0 };
  }
};