import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';
import * as jpeg from 'jpeg-js';

const CLASS_NAMES = ['Hamburger', 'Pizza', 'Waffle'];
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

export const runFoodInference = async (
  imageUri: string,
  session: InferenceSession | null
): Promise<string> => {
  if (!session) return "HATA: Model Oturumu Hazır Değil";

  try {
    // 1. Resmi 224x224 yap
    const resizedImage = await ImageResizer.createResizedImage(
      imageUri,
      224,
      224,
      'JPEG',
      100,
      0,
      undefined,
      false,
      { mode: 'stretch' }
    );

    // 2. Base64 oku
    const base64Data = await RNFS.readFile(resizedImage.uri, 'base64');
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // 3. JPEG decode
    const rawImageData = jpeg.decode(fileBuffer, { useTArray: true });
    const data = rawImageData.data;

    // 4. Tensor oluştur
    const float32Data = new Float32Array(3 * 224 * 224);

    for (let i = 0; i < 224 * 224; i++) {
      const offset = i * 4;

      const r = (data[offset] || 0) / 255.0;
      const g = (data[offset + 1] || 0) / 255.0;
      const b = (data[offset + 2] || 0) / 255.0;

      float32Data[i] = (r - MEAN[0]) / STD[0];
      float32Data[i + 224 * 224] = (g - MEAN[1]) / STD[1];
      float32Data[i + 2 * 224 * 224] = (b - MEAN[2]) / STD[2];
    }

    const inputTensor = new Tensor('float32', float32Data, [1, 3, 224, 224]);

    // 5. Model çalıştır
    const inputName = session.inputNames[0];
    const feeds: Record<string, Tensor> = {};
    feeds[inputName] = inputTensor;

    const outputData = await session.run(feeds);

    // 6. Sonuç
    const outputName = session.outputNames[0];
    const output = outputData[outputName].data as Float32Array;

    let maxIndex = 0;
    let maxScore = output[0];

    for (let i = 1; i < output.length; i++) {
      if (output[i] > maxScore) {
        maxScore = output[i];
        maxIndex = i;
      }
    }

    const debugInfo = `SONUÇ: ${CLASS_NAMES[maxIndex]} `;

    console.log("Tahmin Başarılı:", debugInfo);
    return debugInfo;

  } catch (error: any) {
    console.error('Model Hatası:', error);
    return `SİSTEM HATASI: ${error.message}`;
  }
};