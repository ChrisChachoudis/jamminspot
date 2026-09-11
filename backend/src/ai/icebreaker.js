import { generateText } from "./geminiClient.js";

const SYSTEM = `You write short opening messages for Jamminspot, a musician discovery and
collaboration app. Given both musicians' profiles, suggest one opener the sender could send.

Rules:
- 1-2 sentences, casual and specific to what these two profiles have in common
  or what the sender could offer the receiver.
- Never write generic openers like "Hi" or "Hey, how are you".
- No emojis, no hashtags.
- Write in English unless both profiles look Greek, then write in Greek.
- Output only the message text, nothing else.`;

function summarizeProfile(label, profile) {
  const parts = [
    profile.name && `name: ${profile.name}`,
    profile.specialties?.length && `specialties: ${profile.specialties.join(", ")}`,
    profile.instruments?.length && `instruments: ${profile.instruments.join(", ")}`,
    profile.genres?.length && `genres: ${profile.genres.join(", ")}`,
    profile.goals?.length && `goals: ${profile.goals.join(", ")}`,
    profile.bio && `bio: ${profile.bio}`,
  ].filter(Boolean);
  return `${label}:\n${parts.join("\n")}`;
}

export async function suggestIcebreaker(senderProfile, receiverProfile) {
  const prompt = [
    summarizeProfile("Sender", senderProfile),
    summarizeProfile("Receiver", receiverProfile),
  ].join("\n\n");

  return generateText({ system: SYSTEM, prompt });
}
