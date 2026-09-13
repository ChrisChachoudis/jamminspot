import Groq from "groq-sdk";

let client = null;

function getClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set — get a free key at https://console.groq.com/keys");
  }
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

// Thin wrapper so the rest of the app depends on this function, not on the
// Groq SDK directly — swapping providers later means changing this file only.
export async function generateText({ system, prompt }) {
  const groq = getClient();

  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages,
  });

  return response.choices[0].message.content.trim();
}
