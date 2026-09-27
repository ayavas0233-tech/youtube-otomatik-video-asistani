const test = require('node:test');
const assert = require('node:assert/strict');

const { generateSpeechWithFallback } = require('./tts-fallback.ts');

test('falls back to OpenAI when ElevenLabs fails', async () => {
  const result = await generateSpeechWithFallback({
    text: 'Merhaba',
    hasElevenLabsKey: true,
    tryElevenLabs: async () => {
      throw new Error('eleven failed');
    },
    tryOpenAI: async () => Buffer.from('openai-audio'),
  });

  assert.equal(result.toString(), 'openai-audio');
});

test('uses ElevenLabs when available and successful', async () => {
  const result = await generateSpeechWithFallback({
    text: 'Merhaba',
    hasElevenLabsKey: true,
    tryElevenLabs: async () => Buffer.from('eleven-audio'),
    tryOpenAI: async () => Buffer.from('openai-audio'),
  });

  assert.equal(result.toString(), 'eleven-audio');
});
