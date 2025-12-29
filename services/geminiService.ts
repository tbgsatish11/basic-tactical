import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL, SYSTEM_INSTRUCTION_CHAT, SYSTEM_INSTRUCTION_VISION } from '../constants';

// Initialize the Gemini AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const sendChatMessage = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[]
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: GEMINI_MODEL,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_CHAT,
        temperature: 0.7,
      },
      history: history,
    });

    const response = await chat.sendMessage({ message });
    return response.text || "Communication disrupted. Retrying...";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Connection to Command failed. Check network status.";
  }
};

export const analyzeImage = async (base64Image: string, prompt: string): Promise<string> => {
  try {
    // Determine MIME type (assuming PNG/JPEG from typical file inputs)
    // The base64 string usually includes the data URI prefix "data:image/xyz;base64,"
    // We need to strip that for the API if we were passing raw bytes, but inlineData helper handles it mostly.
    // However, @google/genai expects pure base64 for data.

    const cleanBase64 = base64Image.split(',')[1];
    const mimeType = base64Image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          {
            text: prompt || "Analyze this image for tactical intelligence.",
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_VISION,
        temperature: 0.4,
      },
    });

    return response.text || "Image analysis inconclusive.";
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return "Unable to process reconnaissance data.";
  }
};