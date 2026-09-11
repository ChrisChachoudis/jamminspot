import { GoogleGenAI } from "@google/genai";

let client = null;

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set — get a free key at https://aistudio.google.com/apikey");
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

// Thin wrapper so the rest of the app depends on this function, not on the
// Gemini SDK directly — swapping providers later means changing this file only.
export async function generateText({ system, prompt }) {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: system ? { systemInstruction: system } : undefined,
  });

  return response.text.trim();
}
