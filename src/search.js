import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'ndc_docs';
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';
const VECTOR_SIZE = 1536;

/**
 * Simple embedding function matching ingest.js.
 * In production, both should use the same embedding API.
 */
function simpleEmbed(text) {
  const seeds = text.toLowerCase().split(/\s+/).slice(0, VECTOR_SIZE);
  const vec = new Array(VECTOR_SIZE).fill(0);

  for (let i = 0; i < seeds.length; i++) {
    let hash = 0;
    for (let j = 0; j < seeds[i].length; j++) {
      hash = (hash * 31 + seeds[i].charCodeAt(j)) & 0xffffffff;
    }
    vec[i % VECTOR_SIZE] = (hash / 0xffffffff) * 2 - 1;
  }

  const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return vec.map((v) => v / (mag || 1));
}

/**
 * Search Qdrant for relevant documents.
 * Returns an array of { text, title, source, score }.
 */
export async function searchQdrant(query, collection = QDRANT_COLLECTION) {
  if (!query || query.trim().length === 0) return [];

  const opts = { url: QDRANT_URL, checkCompatibility: false };
  if (QDRANT_API_KEY) opts.apiKey = QDRANT_API_KEY;
  const client = new QdrantClient(opts);
  const vector = simpleEmbed(query);

  try {
    const result = await client.query(collection, {
      query: vector,
      limit: 5,
      score_threshold: 0.3,
      with_payload: true,
    });

    const points = result.points || result;
    return points.map((hit) => ({
      text: hit.payload?.text || '',
      title: hit.payload?.title || '',
      source: hit.payload?.source || '',
      score: hit.score,
    }));
  } catch (err) {
    console.error('Qdrant search error:', err.message);
    return [];
  }
}

/**
 * Search the web via Tavily.
 * Returns an array of { title, url, content, score }.
 */
export async function searchTavily(query) {
  if (!TAVILY_API_KEY) {
    console.warn('TAVILY_API_KEY not set — skipping web search');
    return [];
  }

  // Always disambiguate: NDC = Nigeria Democratic Congress, not Ghana's NDC
  const disambiguatedQuery = query.includes('Nigeria') ? query : `${query} Nigeria`;

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: disambiguatedQuery,
        search_depth: 'basic',
        max_results: 5,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Tavily error: ${res.status} ${text}`);
    }

    const data = await res.json();

    // Filter out Ghana-related results
    const GHANA_KEYWORDS = ['ghana', 'accra', 'ndc ghana', 'national democratic congress ghana'];
    const results = (data.results || []).filter((r) => {
      const text = `${r.title || ''} ${r.content || ''} ${r.url || ''}`.toLowerCase();
      return !GHANA_KEYWORDS.some((kw) => text.includes(kw));
    });

    return results.map((r) => ({
      title: r.title || '',
      url: r.url || '',
      content: r.content || '',
      score: r.score || 0.5,
    }));
  } catch (err) {
    console.error('Tavily search error:', err.message);
    return [];
  }
}

/**
 * Combined search: Qdrant first, Tavily fallback.
 */
export async function searchCombined(query) {
  const qdrantResults = await searchQdrant(query);

  if (qdrantResults.length > 0) {
    return qdrantResults;
  }

  const tavilyResults = await searchTavily(query);
  return tavilyResults;
}