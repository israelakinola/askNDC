import { detectLanguage, translateToEnglish } from './translate.js';
import { searchCombined } from './search.js';
import { buildAnswer } from './answer.js';

/**
 * Process a user question through the full pipeline:
 * 1. Validate input
 * 2. Detect language
 * 3. Translate to English if needed
 * 4. Search Qdrant + Tavily
 * 5. Build and return JSON answer
 *
 * @param {string} question - The user's question.
 * @param {Array<{role: string, content: string}>} [history] - Previous conversation turns.
 * @returns {Promise<string>} JSON formatted answer.
 */
export async function processQuestion(question, history = []) {
  // Validate
  if (question === null || question === undefined) throw new Error('question is required');
  if (typeof question !== 'string') throw new Error('question must be a string');
  if (question.trim().length === 0) throw new Error('question is required');

  // Detect language
  let { language } = await detectLanguage(question);

  // Translate if not English
  let englishQuestion = question;
  if (language !== 'en') {
    englishQuestion = await translateToEnglish(question, language);
  }

  // Search
  const searchResults = await searchCombined(englishQuestion);

  // Build answer with history for context
  const answer = await buildAnswer(englishQuestion, searchResults, history);

  return answer;
}