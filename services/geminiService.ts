import { GoogleGenAI } from "@google/genai";
import { SYSTEM_META_PROTOCOL } from '../constants';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fallback generator if API fails
const fallbackPromptGenerator = (subject: string, source: string, pipeline: string) => {
  let style = "";
  if (pipeline === 'A') style = "Extreme facial close-up, emotional depth, rim light, rembrandt lighting, translucent visual echo overlay";
  if (pipeline === 'B') style = "Low-angle wide shot, action pose, motion trail, high contrast chiaroscuro, speed lines";
  if (pipeline === 'C') style = "Extreme wide shot, epic scale, volumetric fog, environmental atmosphere, colossal silhouette";

  return `/imagine prompt: ${subject} from ${source}, ${style}, hyper-realistic, 8k, Octane Render, cinematic lighting --ar 9:16 --style raw --s 750`;
};

/**
 * Generates the cinematic prompt using the "Protocol" system instruction.
 * Includes retry logic and fallback for network resilience.
 */
export const generateCinematicPrompt = async (
  subject: string,
  sourceMaterial: string,
  pipelineChoice: string
): Promise<string> => {
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const inputJson = JSON.stringify({
        subject,
        source_material: sourceMaterial,
        pipeline_choice: pipelineChoice
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Execute protocol for: ${inputJson}. Return ONLY the raw prompt string starting with /imagine prompt:`,
        config: {
          systemInstruction: SYSTEM_META_PROTOCOL,
          temperature: 0.8,
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from prompt engine");
      return text;

    } catch (error: any) {
      attempt++;
      console.warn(`Prompt Generation Attempt ${attempt} failed:`, error);

      if (attempt >= MAX_RETRIES) {
        console.error("All prompt generation attempts failed. Using fallback.");
        return fallbackPromptGenerator(subject, sourceMaterial, pipelineChoice);
      }

      // Exponential backoff
      await wait(1000 * Math.pow(2, attempt - 1));
    }
  }
  return fallbackPromptGenerator(subject, sourceMaterial, pipelineChoice);
};

/**
 * Generates an image using Gemini's image generation capabilities.
 * Uses Gemini 3 Pro exclusively for high quality 4K output.
 * Includes Retry logic for 429 Rate Limits.
 */
export const generateImage = async (
  prompt: string,
  aspectRatio: "9:16" | "16:9" | "3:4" | "1:1" | "21:9",
  modelId: string = 'gemini-3-pro-image-preview'
): Promise<string> => {
  const MAX_RETRIES = 3;
  let attempt = 0;

  // Clean the prompt
  let cleanPrompt = prompt.replace(/\/imagine prompt:/gi, '');
  cleanPrompt = cleanPrompt.replace(/--[a-zA-Z0-9]+\s+[a-zA-Z0-9.:]+/g, '');
  cleanPrompt = cleanPrompt.replace(/\+/g, ',');
  cleanPrompt = cleanPrompt.replace(/\s\s+/g, ' ').trim();
  const effectiveAspectRatio = aspectRatio === "21:9" ? "16:9" : aspectRatio;
  const imageConfig: any = {
    aspectRatio: effectiveAspectRatio,
    imageSize: "4K" // Always use 4K with Gemini 3 Pro
  };

  while (attempt < MAX_RETRIES) {
    try {
      console.log(`Generating Image (Attempt ${attempt + 1}) with Prompt: "${cleanPrompt.substring(0, 50)}..."`);

      const imageSystemInstruction = "You are a visual rendering engine. You DO NOT speak. You ONLY generate images based on the provided prompts. Do not offer descriptions or confirmations.";

      const response = await ai.models.generateContent({
        model: modelId,
        contents: { parts: [{ text: cleanPrompt }] },
        config: {
          imageConfig,
          systemInstruction: imageSystemInstruction
        }
      });

      const candidate = response.candidates?.[0];

      if (!candidate) throw new Error("API returned no candidates.");
      if (candidate.finishReason === 'SAFETY') throw new Error("Generation blocked by Safety Filters.");

      const parts = candidate.content?.parts || [];
      const imagePart = parts.find(part => part.inlineData);

      if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
        return `data:image/png;base64,${imagePart.inlineData.data}`;
      }

      const textPart = parts.find(part => part.text);
      if (textPart && textPart.text) {
        console.warn("Model response text without image:", textPart.text);
        throw new Error("Generation Failed: The model returned text instead of an image.");
      }

      throw new Error("No image data returned from API.");

    } catch (error: any) {
      // Safe logging
      const errMsg = error.message || error.status || 'Unknown error';
      console.error(`Image Gen Attempt ${attempt + 1} Error: ${errMsg}`);

      // CHECK FOR QUOTA LIMITS (429)
      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
        attempt++;
        if (attempt >= MAX_RETRIES) throw new Error("Daily Quota Exceeded. Please try again later.");

        const delay = 3000 * Math.pow(2, attempt); // 6s, 12s, 24s
        console.warn(`Rate limit hit. Retrying in ${delay}ms...`);
        await wait(delay);
        continue;
      }

      // Handle other known errors immediately
      if (error.message?.includes('SAFETY')) throw error;
      if (error.message?.includes('400')) throw new Error("Configuration Error: Model parameters mismatch.");

      // Retry generic errors slightly faster
      attempt++;
      if (attempt >= MAX_RETRIES) throw error;
      await wait(2000);
    }
  }
  throw new Error("Failed to generate image after retries.");
};

/**
 * Generates an atmospheric background using Image-to-Image (Img2Img).
 * Uses the original wallpaper as a reference to match lighting and colors.
 */
export const generateAtmosphericBackground = async (
  referenceImageBase64: string,
  scene: 'studio' | 'gaming' | 'office',
  modelId: string
): Promise<string> => {
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const base64Clean = referenceImageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

      // Strict JSON Prompt Construction for Product Stage
      // User Request: "Place it on a screen in the scene" -> Requires a clear surface.
      const promptStructure = {
        task: "Generate a realistic product photography background stage.",
        layout_requirement: "PERSPECTIVE VIEW. Bottom 40% MUST be a flat, solid, empty desk/table surface. Top 60% is the blurred room background.",
        scene_context: scene,
        lighting_match: "Match the color temperature and mood of the reference image.",
        constraints: [
          "DO NOT generate any devices, phones, or monitors.",
          "DO NOT generate text.",
          "The foreground surface must be clean and empty to allow for product placement.",
          "High quality 8k render, photorealistic, depth of field."
        ]
      };

      let sceneDescription = "";
      if (scene === 'gaming') {
        sceneDescription = "Foreground: A sleek, dark textured mousepad or carbon fiber desk surface. Background: A gamer's room with RGB strip lighting (cyan/magenta) matching the reference, heavily blurred bokeh.";
      } else if (scene === 'office') {
        sceneDescription = "Foreground: A clean, light oak or white minimalist desk surface. Background: A modern, sunlit architectural workspace with plants, soft shadows, heavily blurred.";
      } else {
        sceneDescription = "Foreground: A dark, non-reflective matte studio podium. Background: A smooth, dark gradient infinity curve with dramatic rim lighting matching the reference. Luxury product vibe.";
      }

      const prompt = `Strict Instruction: ${JSON.stringify(promptStructure)}. \n\n Visual Description: ${sceneDescription}`;

      console.log(`Generating Atmosphere (${scene}) with model ${modelId} (Attempt ${attempt + 1})`);

      const response = await ai.models.generateContent({
        model: modelId, // User selected model
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Clean } },
            { text: prompt }
          ]
        },
        config: {
          // Backgrounds for showcases are strictly 3:4 vertical to fit the canvas
          imageConfig: { aspectRatio: '3:4' },
          systemInstruction: "You are a specialized background generator. You create EMPTY stages for product placement. Never draw the product itself."
        }
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find(part => part.inlineData);

      if (imagePart?.inlineData?.data) {
        return `data:image/png;base64,${imagePart.inlineData.data}`;
      }

      throw new Error("No background image generated.");

    } catch (error: any) {
      // Avoid logging full error object if it causes issues with Response streams, just log message/status
      const errMsg = error.message || error.status || 'Unknown error';
      console.error(`Background Gen Attempt ${attempt + 1} Failed: ${errMsg}`);

      // Check for overload / 500 errors
      if (error.status === 503 || error.status === 500 || error.message?.includes('overloaded') || error.message?.includes('Internal')) {
        attempt++;
        if (attempt >= MAX_RETRIES) throw error; // Let the caller handle the final failure (fallback)

        const delay = 2000 * Math.pow(2, attempt); // 4s, 8s, 16s
        console.warn(`Background gen overloaded. Retrying in ${delay}ms...`);
        await wait(delay);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Background generation failed after retries.");
};

/**
 * Generates a showcase image using Image-to-Image (Img2Img).
 * Generic wrapper for any showcase type (Mockup, Desk, Note).
 */
export const generateShowcaseImage = async (
  referenceImageBase64: string,
  prompt: string,
  aspectRatio: "9:16" | "3:4",
  modelId: string = 'gemini-3-pro-image-preview'
): Promise<string> => {
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const base64Clean = referenceImageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

      console.log(`Generating Showcase (Attempt ${attempt + 1}) with Prompt: "${prompt.substring(0, 50)}..."`);

      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/png', data: base64Clean } },
            { text: prompt }
          ]
        },
        config: {
          imageConfig: { aspectRatio: aspectRatio },
          systemInstruction: "You are a professional product photographer and graphic designer. You generate high-fidelity product mockups and lifestyle shots based on the provided input image. Ensure the input image is clearly visible on the screens/surfaces as requested."
        }
      });

      const candidate = response.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find(part => part.inlineData);

      if (imagePart?.inlineData?.data) {
        return `data:image/png;base64,${imagePart.inlineData.data}`;
      }

      throw new Error("No showcase image generated.");

    } catch (error: any) {
      const errMsg = error.message || error.status || 'Unknown error';
      console.error(`Showcase Gen Attempt ${attempt + 1} Failed: ${errMsg}`);

      if (error.status === 503 || error.status === 500 || error.message?.includes('overloaded') || error.message?.includes('Internal') || error.status === 429) {
        attempt++;
        if (attempt >= MAX_RETRIES) throw error;

        const delay = 3000 * Math.pow(2, attempt);
        console.warn(`Showcase gen overloaded/rate-limited. Retrying in ${delay}ms...`);
        await wait(delay);
        continue;
      }
      throw error;
    }
  }
  throw new Error("Showcase generation failed after retries.");
};