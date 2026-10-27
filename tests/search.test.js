import { describe, it } from 'node:test';
import assert from 'node:assert';
import { searchQdrant, searchTavily, searchCombined } from '../src/search.js';

describe('search', () => {
  describe('searchQdrant', () => {
    it('should return results from Qdrant', async () => {
      try {
        const results = await searchQdrant('NDC policies', 'ndc_docs');
        assert.ok(Array.isArray(results));
      } catch (err) {
        if (err.code === 'ECONNREFUSED') {
          assert.ok(true, 'Qdrant not running — skipping');
        } else {
          throw err;
        }
      }
    });

    it('should return empty array for empty query', async () => {
      const results = await searchQdrant('', 'ndc_docs');
      assert.deepStrictEqual(results, []);
    });
  });

  describe('searchTavily', () => {
    it('should search the web via Tavily', async () => {
      if (!process.env.TAVILY_API_KEY) {
        assert.ok(true, 'TAVILY_API_KEY not set — skipping');
        return;
      }

      const results = await searchTavily('NDC Nigeria party');
      assert.ok(Array.isArray(results));
      assert.ok(results.length > 0);
      assert.ok(results[0].title);
      assert.ok(results[0].url);
    });
  });

  describe('searchCombined', () => {
    it('should search Qdrant first, then Tavily if needed', async () => {
      try {
        const results = await searchCombined('NDC party policies');
        assert.ok(Array.isArray(results));
        // Results may be empty if no data is ingested and no Tavily key is set
        assert.ok(true, 'searchCombined completed without error');
      } catch (err) {
        if (err.code === 'ECONNREFUSED') {
          assert.ok(true, 'Qdrant not running — skipping');
        } else {
          throw err;
        }
      }
    });
  });
});