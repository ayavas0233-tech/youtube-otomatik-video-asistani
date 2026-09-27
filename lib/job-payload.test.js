const test = require('node:test');
const assert = require('node:assert/strict');

const { validateJobPayload } = require('./job-payload.ts');

test('validateJobPayload rejects invalid title type', () => {
  const error = validateJobPayload({ title: 123 });
  assert.equal(error, 'title geçersiz');
});

test('validateJobPayload rejects invalid privacyStatus', () => {
  const error = validateJobPayload({ privacyStatus: 'friends-only' });
  assert.equal(error, 'privacyStatus geçersiz');
});

test('validateJobPayload accepts valid payload', () => {
  const error = validateJobPayload({
    title: 'Başlık',
    topic: 'AI',
    audience: 'Genel',
    tone: 'Profesyonel',
    duration: '5 dakika',
    voice: 'Neutral Narrator',
    privacyStatus: 'private',
    uploadToYouTube: false,
  });
  assert.equal(error, null);
});
