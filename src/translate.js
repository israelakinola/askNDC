/**
 * Language detection and translation module.
 * Uses OpenRouter (OpenAI-compatible) for detection and translation.
 */

import 'dotenv/config';

const LLM_MODEL = process.env.LLM_MODEL || 'openai/gpt-4o-mini';
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

async function llmChat(messages) {
  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

/**
 * Detect the language of the input text.
 * Returns ISO 639-1 code: 'en', 'ha', 'yo', 'ig', etc.
 */
export async function detectLanguage(text) {
  if (!text || text.trim().length === 0) return { language: 'en', confidence: 1.0 };

  const prompt = `Identify the language of this text. Reply with ONLY the ISO 639-1 code (e.g., en, ha, yo, ig, fr, pcm). Do not include any explanation. Text: "${text}"`;

  const lang = await llmChat([
    { role: 'system', content: 'You are a language detection tool. Reply with only the ISO 639-1 language code.' },
    { role: 'user', content: prompt },
  ]);

  return { language: lang.toLowerCase().trim() || 'en', confidence: 1.0 };
}

/**
 * Translate text to English.
 * If already English, return as-is.
 */
export async function translateToEnglish(text, sourceLang) {
  if (!text || sourceLang === 'en') return text;

  const prompt = `Translate the following text from ${sourceLang} to English. Reply with ONLY the English translation. Do not include any explanation or notes.\n\nText: "${text}"`;

  const translated = await llmChat([
    { role: 'system', content: 'You are a translator. Translate the given text to English. Reply with only the translation.' },
    { role: 'user', content: prompt },
  ]);

  return translated;
}