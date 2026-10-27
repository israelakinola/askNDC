import 'dotenv/config';
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { detectLanguage, translateToEnglish } from '../src/translate.js';

const hasLLM = !!process.env.OPENROUTER_API_KEY;

const skipOrRun = hasLLM ? it : it.skip;

describe('translate', () => {
  describe('detectLanguage', () => {
    skipOrRun('should detect English', async () => {
      const result = await detectLanguage('What are the NDC policies?');
      assert.equal(result.language, 'en');
    });

    skipOrRun('should detect Hausa', async () => {
      const result = await detectLanguage('Mene ne manufofin NDC?');
      assert.equal(result.language, 'ha');
    });

    skipOrRun('should detect Yoruba', async () => {
      const result = await detectLanguage('Kíni àwọn ètò ìmúlò NDC?');
      assert.equal(result.language, 'yo');
    });

    skipOrRun('should return "en" for short ambiguous input', async () => {
      const result = await detectLanguage('Hi');
      assert.equal(result.language, 'en');
    });
  });

  describe('translateToEnglish', () => {
    it('should return the same text if already English', async () => {
      const result = await translateToEnglish('NDC policies on education', 'en');
      assert.equal(result, 'NDC policies on education');
    });

    skipOrRun('should translate Hausa to English', async () => {
      const result = await translateToEnglish('Mene ne manufofin NDC?', 'ha');
      // Should return English text, not the original
      assert.notEqual(result, 'Mene ne manufofin NDC?');
      assert.ok(typeof result === 'string' && result.length > 0);
    });
  });
});