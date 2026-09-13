import { generateText } from "./aiClient.js";

const SYSTEM = `You write short musician bios for Jamminspot, a musician discovery and
collaboration app. Given a free-text description of a musician, write a bio.

Rules:
- 2-3 sentences, first person, natural and specific — not generic marketing copy.
- Mention their instrument/role, main genres, and what they're looking for, if given.
- No hashtags, no emojis, no "passionate about music" filler.
- Match the language the user wrote in (Greek in -> Greek out, English in -> English out).
- Output only the bio text, nothing else.`;

export async function buildBio(freeText) {
  if (!freeText?.trim()) {
    throw new Error("freeText is required");
  }
  return generateText({
    system: SYSTEM,
    prompt: freeText.trim(),
  });
}
