import fs from 'node:fs';
import path from 'node:path';

// Use Render's persistent disk when available (mounted at /opt/render/project/src/data)
const DATA_DIR = fs.existsSync('/opt/render/project/src/data')
  ? '/opt/render/project/src/data'
  : path.resolve('data');

const LOG_FILE = path.join(DATA_DIR, 'questions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Save a question and its answer to the JSON log file.
 * @param {{ question: string, answer: object, timestamp: string }} entry
 */
export function saveQuestion(entry) {
  const record = {
    question: entry.question,
    answer: entry.answer,
    timestamp: entry.timestamp || new Date().toISOString(),
  };

  let records = [];
  try {
    if (fs.existsSync(LOG_FILE)) {
      const raw = fs.readFileSync(LOG_FILE, 'utf-8');
      records = raw.trim() ? JSON.parse(raw) : [];
    }
  } catch {
    records = [];
  }

  records.push(record);
  fs.writeFileSync(LOG_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

/**
 * Read all saved questions.
 * @returns {Array}
 */
export function getQuestions() {
  try {
    if (!fs.existsSync(LOG_FILE)) return [];
    const raw = fs.readFileSync(LOG_FILE, 'utf-8');
    return raw.trim() ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}