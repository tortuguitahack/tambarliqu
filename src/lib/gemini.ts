import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const LATEST_IMAGE_MODEL = 'gemini-3-pro-image-preview';
const LATEST_PRO_MODEL = 'gemini-3.1-pro-preview';
const LATEST_FLASH_MODEL = 'gemini-3.1-flash-preview';
const FALLBACK_IMAGE_MODEL = 'gemini-2.5-flash-image';

export async function generateBottleImage(prompt: string, id: string, aspectRatio: string = "3:4") {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const getFallback = (id: string) => {
    const fallbacks: Record<string, string> = {
      '1': 'https://images.unsplash.com/photo-1569158062127-99a9d388f441?q=80&w=800&auto=format&fit=crop', // Baileys/Cream
      '2': 'https://images.unsplash.com/photo-1527281405159-35d5b9a9c171?q=80&w=800&auto=format&fit=crop', // Whisky Blue
      '3': 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?q=80&w=800&auto=format&fit=crop', // Whisky Gold
      '4': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop', // Whisky Green
      '5': 'https://images.unsplash.com/photo-1516535794938-6063878f08cc?q=80&w=800&auto=format&fit=crop', // Tequila
      '6': 'https://images.unsplash.com/photo-1556855810-ac404aa91f85?q=80&w=800&auto=format&fit=crop', // Gin
      '7': 'https://images.unsplash.com/photo-1550985543-f47f38aee65e?q=80&w=800&auto=format&fit=crop', // Vodka
      '8': 'https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?q=80&w=800&auto=format&fit=crop', // Ron
    };
    return fallbacks[id] || `https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=800&auto=format&fit=crop`;
  };

  try {
    const response = await ai.models.generateContent({
      model: LATEST_IMAGE_MODEL,
      contents: {
        parts: [
          {
            text: `(Elite Mastery 2026) Ultra-realistic, high-end luxury product photography of a premium, bespoke ${prompt}. The bottle features exquisite craftsmanship, intricate glass details, and premium labeling. Studio lighting with soft rim highlights, deep shadows, elegant dark minimalist background. 8k resolution, cinematic composition, professional advertising quality, sharp focus on the liquid and glass textures, hyper-detailed.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: "4K"
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        const base64Data = part.inlineData.data;
        if (base64Data.length > 100) {
          return `data:image/png;base64,${base64Data}`;
        }
      }
    }
    
    console.warn("No valid image data found in Gemini response, using fallback.");
    return getFallback(id);

  } catch (error: any) {
    if (error?.status === 403 || error?.message?.includes('403') || error?.message?.includes('PERMISSION_DENIED')) {
      console.warn(`Permission Denied for ${LATEST_IMAGE_MODEL}. Falling back to ${FALLBACK_IMAGE_MODEL}.`);
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: FALLBACK_IMAGE_MODEL,
          contents: {
            parts: [
              {
                text: `Ultra-realistic, high-end luxury product photography of a premium, bespoke ${prompt}. The bottle features exquisite craftsmanship, intricate glass details, and premium labeling. Studio lighting with soft rim highlights, deep shadows, elegant dark minimalist background. 8k resolution, cinematic composition, professional advertising quality, sharp focus on the liquid and glass textures, hyper-detailed.`,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
            },
          },
        });
        for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData?.data) {
            const base64Data = part.inlineData.data;
            if (base64Data.length > 100) {
              return `data:image/png;base64,${base64Data}`;
            }
          }
        }
      } catch (fallbackError) {
        console.error("Fallback image generation also failed:", fallbackError);
      }
    } else if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("Gemini Image Quota exhausted, using premium fallback.");
    } else {
      console.error("Error generating image:", error);
    }
    
    return getFallback(id);
  }
}

export async function generateProductGallery(prompt: string, id: string): Promise<string[]> {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const getFallback = (id: string) => {
    const fallbacks: Record<string, string> = {
      '1': 'https://images.unsplash.com/photo-1569158062127-99a9d388f441?q=80&w=800&auto=format&fit=crop',
      '2': 'https://images.unsplash.com/photo-1527281405159-35d5b9a9c171?q=80&w=800&auto=format&fit=crop',
      '3': 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?q=80&w=800&auto=format&fit=crop',
      '4': 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop',
      '5': 'https://images.unsplash.com/photo-1516535794938-6063878f08cc?q=80&w=800&auto=format&fit=crop',
      '6': 'https://images.unsplash.com/photo-1556855810-ac404aa91f85?q=80&w=800&auto=format&fit=crop',
      '7': 'https://images.unsplash.com/photo-1550985543-f47f38aee65e?q=80&w=800&auto=format&fit=crop',
      '8': 'https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?q=80&w=800&auto=format&fit=crop',
    };
    return fallbacks[id] || `https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=800&auto=format&fit=crop`;
  };

  const prompts = [
    `Ultra-realistic, high-end luxury product photography of a premium, bespoke ${prompt}. The bottle features exquisite craftsmanship, intricate glass details, and premium labeling. Studio lighting with soft rim highlights, deep shadows, elegant dark minimalist background. 8k resolution, cinematic composition, professional advertising quality, sharp focus on the liquid and glass textures, hyper-detailed.`,
    `Close-up macro shot of a premium ${prompt} bottle, focusing on the intricate label details, condensation, and glass texture. Dramatic lighting, luxurious atmosphere, 8k resolution, photorealistic.`,
    `Lifestyle shot of a glass of ${prompt} poured over ice, resting on a dark mahogany bar counter. The bottle is slightly out of focus in the background. Warm amber lighting, luxurious, high-end, photorealistic.`,
    `A wide-angle artistic shot of the ${prompt} bottle in a high-end luxury wine cellar. Moody atmosphere, soft glowing lights, elegant wooden shelves, 8k resolution, cinematic.`
  ];

  const promises = prompts.map(async (p) => {
    try {
      const response = await ai.models.generateContent({
        model: LATEST_IMAGE_MODEL,
        contents: { parts: [{ text: p }] },
        config: { 
          imageConfig: { 
            aspectRatio: "3:4",
            imageSize: "4K"
          } 
        },
      });
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData?.data && part.inlineData.data.length > 100) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return getFallback(id);
    } catch (error: any) {
      if (error?.status === 403 || error?.message?.includes('403') || error?.message?.includes('PERMISSION_DENIED')) {
        console.warn(`Permission Denied for ${LATEST_IMAGE_MODEL}. Falling back to ${FALLBACK_IMAGE_MODEL}.`);
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: FALLBACK_IMAGE_MODEL,
            contents: { parts: [{ text: p }] },
            config: { 
              imageConfig: { 
                aspectRatio: "3:4"
              } 
            },
          });
          for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData?.data && part.inlineData.data.length > 100) {
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        } catch (fallbackError) {
          console.error("Fallback gallery image generation failed:", fallbackError);
        }
      } else {
        console.warn("Gallery image generation failed, using fallback:", error?.message);
      }
      return getFallback(id);
    }
  });

  return Promise.all(promises);
}

export async function generateHeroImage(aspectRatio: string = "16:9") {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: LATEST_IMAGE_MODEL,
      contents: {
        parts: [
          {
            text: '(Masterpiece 2026) A photorealistic, high-end luxury wine cellar and exclusive liquor collection. Dramatic, moody studio lighting, dark mahogany wood, glowing amber bottles, cinematic composition, 8k resolution, highly detailed, luxurious atmosphere.',
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: "4K"
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        const base64Data = part.inlineData.data;
        if (base64Data.length > 100) {
          return `data:image/jpeg;base64,${base64Data}`;
        }
      }
    }
    
    return "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop";

  } catch (error: any) {
    if (error?.status === 403 || error?.message?.includes('403') || error?.message?.includes('PERMISSION_DENIED')) {
      console.warn(`Permission Denied for ${LATEST_IMAGE_MODEL}. Falling back to ${FALLBACK_IMAGE_MODEL}.`);
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: FALLBACK_IMAGE_MODEL,
          contents: {
            parts: [
              {
                text: 'A photorealistic, high-end luxury wine cellar and exclusive liquor collection. Dramatic, moody studio lighting, dark mahogany wood, glowing amber bottles, cinematic composition, 8k resolution, highly detailed, luxurious atmosphere.',
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
            },
          },
        });
        for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData?.data) {
            const base64Data = part.inlineData.data;
            if (base64Data.length > 100) {
              return `data:image/jpeg;base64,${base64Data}`;
            }
          }
        }
      } catch (fallbackError) {
        console.error("Fallback hero image generation failed:", fallbackError);
      }
      return "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop";
    } else if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("Gemini Image Quota exhausted, using premium fallback.");
      return "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop";
    } else {
      console.error("Error generating hero image:", error);
      return "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop";
    }
  }
}

export async function generateSommelierImage() {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: LATEST_IMAGE_MODEL,
      contents: {
        parts: [
          {
            text: '(Expert Mastery 2026) A stunningly beautiful, elegant woman with sophisticated haute couture attire, gracefully savoring a crystal glass of amber whisky. She is elegantly presenting a luxury Johnnie Walker Blue Label bottle. High-end private members club setting, dramatic moody lighting with golden rim highlights, cinematic composition, professional luxury advertising photography, 8k resolution, hyper-detailed, sophisticated atmosphere.',
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "4K"
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        const base64Data = part.inlineData.data;
        if (base64Data.length > 100) {
          return `data:image/jpeg;base64,${base64Data}`;
        }
      }
    }
    
    return "https://images.unsplash.com/photo-1594498653385-d5172c532c00?q=80&w=2000&auto=format&fit=crop";

  } catch (error) {
    console.error("Error generating sommelier image:", error);
    return "https://images.unsplash.com/photo-1594498653385-d5172c532c00?q=80&w=2000&auto=format&fit=crop";
  }
}

export async function getSommelierResponse(message: string, history: any[], imageUrl?: string) {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const parts: any[] = [];
  if (message) parts.push({ text: message });
  if (imageUrl) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageUrl.split(',')[1]
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: LATEST_PRO_MODEL,
      contents: [...history, { role: 'user', parts }],
      config: {
        systemInstruction: "You are an expert sommelier and luxury spirits consultant for TAMBAR. You provide sophisticated, knowledgeable advice on whiskies, tequilas, and other premium liquors. Your tone is elegant, professional, and exclusive. Use Spanish as the primary language but maintain an international luxury vibe. Provide detailed tasting notes, history of the brands, and expert food pairings. You also possess deep knowledge about the historical significance and cultural impact of different spirit categories (e.g., Scotch whisky, Japanese whisky, Cognac, aged rums). If an image is provided, analyze it to identify the bottle, brand, or type of spirit and provide relevant information. IMPORTANT: You must always provide exactly 3 suggested follow-up questions or actions that the user might want to take next, based on the current context.",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "The main response text from the sommelier." },
            suggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Exactly 3 short follow-up suggestions or questions."
            }
          },
          required: ["text", "suggestions"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error: any) {
    if (error?.status === 403 || error?.message?.includes('403') || error?.message?.includes('PERMISSION_DENIED')) {
      console.warn(`Permission Denied for ${LATEST_PRO_MODEL}. Falling back to ${LATEST_FLASH_MODEL}.`);
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: LATEST_FLASH_MODEL,
          contents: [...history, { role: 'user', parts }],
          config: {
            systemInstruction: "You are an expert sommelier and luxury spirits consultant for TAMBAR. You provide sophisticated, knowledgeable advice on whiskies, tequilas, and other premium liquors. Your tone is elegant, professional, and exclusive. Use Spanish as the primary language but maintain an international luxury vibe. Provide detailed tasting notes, history of the brands, and expert food pairings. You also possess deep knowledge about the historical significance and cultural impact of different spirit categories (e.g., Scotch whisky, Japanese whisky, Cognac, aged rums). If an image is provided, analyze it to identify the bottle, brand, or type of spirit and provide relevant information. IMPORTANT: You must always provide exactly 3 suggested follow-up questions or actions that the user might want to take next, based on the current context.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING, description: "The main response text from the sommelier." },
                suggestions: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "Exactly 3 short follow-up suggestions or questions."
                }
              },
              required: ["text", "suggestions"]
            }
          }
        });
        return JSON.parse(fallbackResponse.text);
      } catch (fallbackError) {
        console.error("Fallback sommelier response failed:", fallbackError);
        return "ERROR_PERMISSION_DENIED";
      }
    }
    throw error;
  }
}

export async function getStoreLocations(query: string, lat?: number, lng?: number) {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: LATEST_FLASH_MODEL,
      contents: `Find luxury liquor stores or exclusive bars near: ${query}`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: lat && lng ? { latitude: lat, longitude: lng } : undefined
          }
        }
      }
    });

    return {
      text: response.text,
      grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("Error fetching store locations:", error);
    return null;
  }
}

export async function analyzeFlavorSignature(productName: string, description: string) {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: LATEST_FLASH_MODEL,
      contents: `Analyze the flavor profile of ${productName} (${description}) and provide a numeric score from 0 to 100 for each of these 5 dimensions: Sweetness (Dulzor), Complexity (Complejidad), Intensity (Intensidad), Oak (Roble), and Finish (Final). Return only JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sweetness: { type: Type.NUMBER },
            complexity: { type: Type.NUMBER },
            intensity: { type: Type.NUMBER },
            oak: { type: Type.NUMBER },
            finish: { type: Type.NUMBER }
          },
          required: ["sweetness", "complexity", "intensity", "oak", "finish"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Flavor analysis failed:", error);
    return { sweetness: 50, complexity: 50, intensity: 50, oak: 50, finish: 50 };
  }
}

export async function getProductNarrative(productName: string, category: string, origin: string, notes: string) {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: LATEST_FLASH_MODEL,
      contents: `Eres el Sommelier de Élite de TAMBAR. Crea una narrativa cautivadora para un producto exclusivo: ${productName}. 
      Categoría: ${category}. Origen: ${origin}. Notas principales: ${notes}.
      
      Escribe un relato de unos 3-4 párrafos que transporte al cliente a su lugar de origen, narre la historia detrás de su creación y describa los procesos únicos de destilación o añejamiento que lo hacen una joya para coleccionistas. El tono debe ser extremadamente lujoso, poético y experto.`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });

    return response.text;
  } catch (error) {
    console.error("Narrative generation failed:", error);
    return null;
  }
}
