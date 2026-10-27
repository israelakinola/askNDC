import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { ingestDocument, ensureCollection } from '../src/ingest.js';

describe('ingest', () => {
  describe('ensureCollection', () => {
    it('should create a collection if it does not exist', async () => {
      // This is an integration test — skipped when Qdrant is unavailable
      try {
        await ensureCollection('test_collection');
        assert.ok(true, 'collection created or existed');
      } catch (err) {
        if (err.code === 'ECONNREFUSED') {
          assert.ok(true, 'Qdrant not running — skipping');
        } else {
          throw err;
        }
      }
    });
  });

  describe('ingestDocument', () => {
    it('should ingest a document into Qdrant', async () => {
      const doc = {
        id: 'test-doc-1',
        text: 'The NDC party is committed to good governance in Nigeria.',
        title: 'NDC Manifesto',
        source: 'ndc-official.org',
      };

      try {
        const result = await ingestDocument('test_collection', doc);
        assert.equal(result.status, 'completed');
      } catch (err) {
        if (err.code === 'ECONNREFUSED') {
          assert.ok(true, 'Qdrant not running — skipping');
        } else {
          throw err;
        }
      }
    });

    it('should throw for a document without id', async () => {
      const doc = { text: 'no id', title: 'test' };
      await assert.rejects(
        () => ingestDocument('test_collection', doc),
        /id is required/
      );
    });

    it('should throw for a document without text', async () => {
      const doc = { id: 'x', title: 'test' };
      await assert.rejects(
        () => ingestDocument('test_collection', doc),
        /text is required/
      );
    });
  });
});