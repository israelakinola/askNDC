import 'dotenv/config';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { processQuestion } from '../src/chat.js';

const hasLLM = !!process.env.OPENROUTER_API_KEY;
const skipOrRun = hasLLM ? it : it.skip;

describe('chat', () => {
  describe('processQuestion', () => {
    skipOrRun('should process a simple English question', async () => {
      const result = await processQuestion('What are the core values of the NDC party?');

      assert.ok(typeof result === 'string');
      const parsed = JSON.parse(result);
      assert.ok(parsed.Title !== undefined);
      assert.ok(parsed.Body !== undefined);
      assert.ok(Array.isArray(parsed.References));
    });

    skipOrRun('should process a question in another language', async () => {
      const result = await processQuestion('Kíni àwọn ọ̀rọ̀ àdáni NDC?');

      assert.ok(typeof result === 'string');
      const parsed = JSON.parse(result);
      assert.ok(parsed.Title !== undefined);
    });

    it('should reject empty questions', async () => {
      await assert.rejects(
        () => processQuestion(''),
        /question is required/
      );
    });

    it('should reject non-string questions', async () => {
      await assert.rejects(
        () => processQuestion(null),
        /question is required/
      );
    });

    skipOrRun('should handle questions with no known answer', async () => {
      const result = await processQuestion('What is the secret launch code of the NDC?');

      const parsed = JSON.parse(result);
      assert.ok(parsed.Body.includes('contact') || parsed.References.length === 0);
    });

    skipOrRun('should include references when available', async () => {
      const result = await processQuestion('Who founded the NDC?');

      const parsed = JSON.parse(result);
      if (parsed.References.length > 0) {
        assert.ok(parsed.References[0].title);
        assert.ok(parsed.References[0].url);
      }
    });
  });
});