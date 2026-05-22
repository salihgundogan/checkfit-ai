

// utils/foodRecognition.ts (dosya adını da değiştirebilirsiniz)
import RNFS from 'react-native-fs';

const CLARIFAI_PAT = 'fdb1166a69e0412ca55e97d442026b60';

export interface FoodResult {
  name: string;
}

export async function recognizeFood(imageUri: string): Promise<FoodResult> {
  const base64 = await RNFS.readFile(imageUri.replace('file://', ''), 'base64');

  const res = await fetch(
    'https://api.clarifai.com/v2/models/bd367be194cf45149e75f01d59f77ba7/outputs',
    {
      method: 'POST',
      headers: {
        Authorization: `Key ${CLARIFAI_PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [{
          data: {
            image: { base64 }
          }
        }]
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Clarifai ${res.status}: ${err}`);
  }

  const data = await res.json();
  const topConcept = data.outputs?.[0]?.data?.concepts?.[0];
  
  return {
    name: topConcept?.name ?? 'Belirlenemedi',
  };
}