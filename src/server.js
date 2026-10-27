import express from 'express';
import dotenv from 'dotenv';
import { processQuestion } from './chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS — allow browser access
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (_req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Serve static files (chatbox UI)
app.use(express.static('public'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        error: 'question is required and must be a non-empty string',
      });
    }

    const answer = await processQuestion(question.trim());
    const parsed = JSON.parse(answer);
    res.json(parsed);
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server (only when run directly, not imported)
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  app.listen(PORT, () => {
    console.log(`AskNDC server running on port ${PORT}`);
  });
}

export default app;