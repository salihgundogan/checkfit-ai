import RNFS from 'react-native-fs';

const GEMINI_API_KEY = 'AIzaSyB4amFTiJn-LOofzFvlIghF6y7finUKTkw';

export interface FoodResult {
  name: string;
}

export async function recognizeFood(imageUri: string): Promise<FoodResult> {
  const base64 = await RNFS.readFile(imageUri.replace('file://', ''), 'base64');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64,
              },
            },
            {
              text: 'What food is in this image? Reply with ONLY the food name in English, nothing else. Example: "hamburger" or "pizza" or "rice".',
            },
          ],
        }],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }

  const data = await res.json();
  const name = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? 'Belirlenemedi';

  return { name };
}