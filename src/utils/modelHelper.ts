import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import * as jpeg from 'jpeg-js';

const IMG_SIZE = 640;

const CLASS_NAMES = [
  'lahmacun',
  'waffle',
  'pizza',
  'baklava',
  'kebap',
  'patates_kizartmasi',
  'sosisli',
  'köfte',
  'hamburger',
  'sutlac',
];

const MEAN = [0.0, 0.0, 0.0];
const STD  = [1.0, 1.0, 1.0];

export type FoodInferenceResult = {
  name:       string;
  areaCm2:    number;
  confidence: number;
};

export const runFoodInference = async (
  imageUri: string,
  session: InferenceSession | null
): Promise<FoodInferenceResult> => {

  if (!session) {
    return { name: 'Belirlenemedi', areaCm2: 0, confidence: 0 };
  }

  try {
    // 1. Resize → 640x640
    const resizedImage = await ImageResizer.createResizedImage(
      imageUri,
      IMG_SIZE,
      IMG_SIZE,
      'JPEG',
      100,
      0,
      undefined,
      false,
      { mode: 'stretch' }
    );

    // 2. Base64 → Buffer
    const base64Data = await RNFS.readFile(resizedImage.uri, 'base64');
    const fileBuffer  = Buffer.from(base64Data, 'base64');

    // 3. JPEG decode
    const rawImageData = jpeg.decode(fileBuffer, { useTArray: true });
    const data = rawImageData.data; // RGBA

    // 4. Float32 tensor [1, 3, 640, 640] — CHW format
    const float32Data = new Float32Array(3 * IMG_SIZE * IMG_SIZE);
    for (let i = 0; i < IMG_SIZE * IMG_SIZE; i++) {
      const off = i * 4;
      const r = (data[off]     || 0) / 255.0;
      const g = (data[off + 1] || 0) / 255.0;
      const b = (data[off + 2] || 0) / 255.0;
      float32Data[i]                           = (r - MEAN[0]) / STD[0];
      float32Data[i + IMG_SIZE * IMG_SIZE]     = (g - MEAN[1]) / STD[1];
      float32Data[i + 2 * IMG_SIZE * IMG_SIZE] = (b - MEAN[2]) / STD[2];
    }

    const inputTensor = new Tensor('float32', float32Data, [1, 3, IMG_SIZE, IMG_SIZE]);

    // 5. Inference
    const feeds: Record<string, Tensor> = {};
    feeds[session.inputNames[0]] = inputTensor;
    const outputData = await session.run(feeds);

    // 6. Output parse
    const outputTensor = outputData[session.outputNames[0]];
    const raw  = outputTensor.data as Float32Array;
    const dims = outputTensor.dims;

    console.log('Output dims:', dims);
    console.log('Output length:', raw.length);

    let classScores: number[];
    let bestScore    = -Infinity;
    let bestAnchorIdx = 0;

    if (dims.length === 2) {
      // [1, num_classes] — saf classification
      classScores = Array.from(raw);

    } else if (dims.length === 3) {
      // [1, 46, 8400] — YOLO segmentation: 4 bbox + 32 mask + 10 class
      const numAnchors = dims[2]; // 8400
      const CLASS_START = 4 + 32; // 36
      const numClasses  = dims[1] - CLASS_START; // 10

      for (let a = 0; a < numAnchors; a++) {
        let maxClassScore = -Infinity;
        for (let c = 0; c < numClasses; c++) {
          const score = raw[(CLASS_START + c) * numAnchors + a];
          if (score > maxClassScore) maxClassScore = score;
        }
        if (maxClassScore > bestScore) {
          bestScore     = maxClassScore;
          bestAnchorIdx = a;
        }
      }

      classScores = [];
      for (let c = 0; c < numClasses; c++) {
        classScores.push(raw[(CLASS_START + c) * numAnchors + bestAnchorIdx]);
      }

      console.log('bestScore:', bestScore);
      console.log('bestAnchorIdx:', bestAnchorIdx);
      console.log('classScores ham:', classScores);

    } else {
      classScores = Array.from(raw);
    }

    // 7. Softmax
    const maxVal = Math.max(...classScores);
    const expArr = classScores.map(v => Math.exp(v - maxVal));
    const expSum = expArr.reduce((a, b) => a + b, 0);
    const probs  = expArr.map(v => v / expSum);

    console.log('Probs:', probs.map((p, i) => `${CLASS_NAMES[i]}: ${(p * 100).toFixed(1)}%`));

    let maxIndex = 0;
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > probs[maxIndex]) maxIndex = i;
    }

    const predictedName = CLASS_NAMES[maxIndex] ?? 'Belirlenemedi';
    const confidence    = probs[maxIndex];

    console.log(`Tahmin: ${predictedName}, Güven: %${(confidence * 100).toFixed(1)}`);

    return {
      name:       predictedName,
      areaCm2:    0,
      confidence: confidence,
    };

  } catch (error: any) {
    console.error('Model Hatası:', error);
    return { name: 'Belirlenemedi', areaCm2: 0, confidence: 0 };
  }
};