import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || '';
const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'ndc_docs';
const VECTOR_SIZE = 1536; // OpenAI ada-002 embedding size

let client = null;

function getClient() {
  if (!client) {
    const opts = { url: QDRANT_URL, checkCompatibility: false };
    if (QDRANT_API_KEY) opts.apiKey = QDRANT_API_KEY;
    client = new QdrantClient(opts);
  }
  return client;
}

/**
 * Ensure a collection exists in Qdrant.
 * Creates it with the default vector config if it doesn't.
 */
export async function ensureCollection(name = COLLECTION_NAME) {
  const qdrant = getClient();
  const { collections } = await qdrant.getCollections();

  if (!collections.find((c) => c.name === name)) {
    await qdrant.createCollection(name, {
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine',
      },
    });
  }
  return name;
}

/**
 * Generate a simple embedding for text.
 * Uses a local hash-based approach as a stand-in; in production,
 * this would call an embedding API (OpenAI, etc.).
 */
function simpleEmbed(text) {
  // Deterministic embedding from text — placeholder for real embeddings
  const seeds = text.toLowerCase().split(/\s+/).slice(0, VECTOR_SIZE);
  const vec = new Array(VECTOR_SIZE).fill(0);

  for (let i = 0; i < seeds.length; i++) {
    let hash = 0;
    for (let j = 0; j < seeds[i].length; j++) {
      hash = (hash * 31 + seeds[i].charCodeAt(j)) & 0xffffffff;
    }
    vec[i % VECTOR_SIZE] = (hash / 0xffffffff) * 2 - 1;
  }

  // Normalize
  const mag = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return vec.map((v) => v / (mag || 1));
}

/**
 * Convert a string ID to a numeric hash for Qdrant compatibility.
 */
function toPointId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  }
  return hash;
}

/**
 * Ingest a document into Qdrant.
 * @param {string} collection - Collection name.
 * @param {{ id: string, text: string, title: string, source?: string }} doc
 */
export async function ingestDocument(collection, doc) {
  if (!doc.id) throw new Error('Document id is required');
  if (!doc.text) throw new Error('Document text is required');

  const qdrant = getClient();
  await ensureCollection(collection);

  const vector = simpleEmbed(doc.text);

  await qdrant.upsert(collection, {
    points: [
      {
        id: toPointId(doc.id),
        vector,
        payload: {
          text: doc.text,
          title: doc.title || '',
          source: doc.source || '',
        },
      },
    ],
  });

  return { status: 'completed', id: doc.id };
}

/**
 * Batch ingest multiple documents from a JSON array or file path.
 */
export async function ingestBatch(collection, documents) {
  const results = [];
  for (const doc of documents) {
    const result = await ingestDocument(collection, doc);
    results.push(result);
  }
  return results;
}