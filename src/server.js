import express from 'express';
import dotenv from 'dotenv';
import { z } from 'zod';
import { processQuestion } from './chat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Zod schemas
const ChatRequest = z.object({
  question: z.string().min(1).max(1000).trim(),
});

const ChatResponse = z.object({
  Title: z.string().min(1),
  Body: z.string().min(1),
  References: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
  })),
});

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
    // Validate request
    const parsed = ChatRequest.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'question is required and must be a non-empty string (max 1000 chars)',
      });
    }

    const answer = await processQuestion(parsed.data.question);
    const json = JSON.parse(answer);

    // Validate response shape
    const valid = ChatResponse.safeParse(json);
    if (!valid.success) {
      console.error('Invalid response shape:', valid.error.issues);
      return res.status(500).json({
        Title: 'Contact NDC',
        Body: 'We could not find reliable information to answer your question. Please contact the NDC through its official contact channels for assistance.',
        References: [],
      });
    }

    res.json(valid.data);
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({
      Title: 'Contact NDC',
      Body: 'We could not find reliable information to answer your question. Please contact the NDC through its official contact channels for assistance.',
      References: [],
    });
  }
});

// Start server (only when run directly, not imported)
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  app.listen(PORT, () => {
    console.log(`AskNDC server running on port ${PORT}`);
  });
}

export default app;