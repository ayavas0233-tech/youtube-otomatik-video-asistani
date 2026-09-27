const test = require('node:test');
const assert = require('node:assert/strict');

const { createSrt } = require('./subtitles.ts');

test('createSrt formats single subtitle block', () => {
  const result = createSrt([{ start: 0, end: 2.345, text: 'Merhaba' }]);
  assert.match(result, /1\n00:00:00,000 --> 00:00:02,345\nMerhaba\n/);
});

test('createSrt keeps item separation and rounds milliseconds', () => {
  const result = createSrt([
    { start: 1.2344, end: 2.9996, text: 'Satır 1' },
    { start: 3, end: 4.001, text: 'Satır 2' },
  ]);

  assert.match(result, /00:00:01,234 --> 00:00:03,000/);
  assert.match(result, /\n\n2\n00:00:03,000 --> 00:00:04,001\nSatır 2\n?$/);
});
