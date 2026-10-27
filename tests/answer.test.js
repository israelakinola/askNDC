import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatAnswer } from '../src/answer.js';

describe('answer', () => {
  describe('formatAnswer', () => {
    it('should return valid JSON with required fields', () => {
      const result = formatAnswer('NDC Education Policy', 'The NDC supports free education.', [
        { title: 'NDC Manifesto', url: 'https://ndc.org/manifesto' },
      ]);

      const parsed = JSON.parse(result);
      assert.equal(parsed.Title, 'NDC Education Policy');
      assert.equal(parsed.Body, 'The NDC supports free education.');
      assert.deepStrictEqual(parsed.References, [
        { title: 'NDC Manifesto', url: 'https://ndc.org/manifesto' },
      ]);
    });

    it('should return contact message when no answer is available', () => {
      const result = formatAnswer(null, null, []);

      const parsed = JSON.parse(result);
      assert.ok(parsed.Title.length > 0);
      assert.ok(parsed.Body.includes('contact'));
      assert.deepStrictEqual(parsed.References, []);
    });

    it('should handle empty references', () => {
      const result = formatAnswer('Title', 'Body', []);

      const parsed = JSON.parse(result);
      assert.deepStrictEqual(parsed.References, []);
    });

    it('should filter out references with missing title or url', () => {
      const result = formatAnswer('T', 'B', [
        { title: 'Good', url: 'https://a.com' },
        { title: '', url: 'https://b.com' },
        { title: 'Bad', url: '' },
        {},
      ]);

      const parsed = JSON.parse(result);
      assert.equal(parsed.References.length, 1);
      assert.equal(parsed.References[0].title, 'Good');
    });

    it('should always produce parseable JSON', () => {
      const result = formatAnswer('T', 'B', null);
      JSON.parse(result); // should not throw
      assert.ok(true);
    });
  });
});