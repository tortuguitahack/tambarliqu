import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const imagesDir = 'public/images';
  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpeg')).sort();
  
  const results = [];
  
  for (const file of files) {
    const filePath = `${imagesDir}/${file}`;
    const imageData = fs.readFileSync(filePath).toString('base64');
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: imageData, mimeType: 'image/jpeg' } },
            { text: 'Identify the alcohol brand and product name in this image. Give me only the brand and product name, nothing else.' }
          ]
        }
      });
      results.push({ file, name: response.text.trim().replace(/^"|"$/g, '') });
    } catch (e) {
      results.push({ file, name: 'Unknown Product' });
    }
  }
  
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
