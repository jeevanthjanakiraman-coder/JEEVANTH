import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeInput,
  validateChatRequest,
  validateToolRequest,
  buildToolPrompt,
  generateSnippet,
  isValidTool,
  normalizeConversation,
} from './api-helpers';

test('sanitizeInput trims whitespace and enforces length', () => {
  assert.equal(sanitizeInput('  hello world  '), 'hello world');
  assert.equal(sanitizeInput('abc', 2), 'ab');
  assert.equal(sanitizeInput(null as unknown as string), '');
});

test('validateChatRequest accepts single message', () => {
  const result = validateChatRequest({ message: 'Hello AI' });
  assert.equal(result.valid, true);
  assert.equal(result.messages?.length, 1);
  assert.equal(result.messages?.[0].content, 'Hello AI');
});

test('validateChatRequest accepts messages array', () => {
  const result = validateChatRequest({
    messages: [
      { role: 'user', content: 'What is 2+2?' },
      { role: 'assistant', content: '4' },
      { role: 'user', content: 'And 4+4?' },
    ],
  });
  assert.equal(result.valid, true);
  assert.equal(result.messages?.length, 3);
});

test('validateChatRequest rejects empty requests', () => {
  assert.equal(validateChatRequest({}).valid, false);
  assert.equal(validateChatRequest({ message: '   ' }).valid, false);
  assert.equal(validateChatRequest({ messages: [] }).valid, false);
});

test('isValidTool checks known tools', () => {
  assert.equal(isValidTool('image'), true);
  assert.equal(isValidTool('writing'), true);
  assert.equal(isValidTool('code'), true);
  assert.equal(isValidTool('study'), true);
  assert.equal(isValidTool('translate'), true);
  assert.equal(isValidTool('summary'), true);
  assert.equal(isValidTool('unknown_tool'), false);
});

test('validateToolRequest validates tool types and inputs', () => {
  const valid = validateToolRequest('code', { input: 'Write quicksort in Python', codeLang: 'Python' });
  assert.equal(valid.valid, true);
  assert.equal(valid.tool, 'code');
  assert.equal(valid.options?.codeLang, 'Python');

  const invalidTool = validateToolRequest('invalid', { input: 'test' });
  assert.equal(invalidTool.valid, false);

  const missingInput = validateToolRequest('image', {});
  assert.equal(missingInput.valid, false);
});

test('buildToolPrompt formats prompts correctly for all tools', () => {
  const imagePrompt = buildToolPrompt('image', 'Cyberpunk car');
  assert.match(imagePrompt.systemInstruction, /Image Studio/);
  assert.match(imagePrompt.userPrompt, /Cyberpunk car/);

  const translatePrompt = buildToolPrompt('translate', 'Bonjour', { targetLang: 'Spanish' });
  assert.match(translatePrompt.systemInstruction, /Translator/);
  assert.match(translatePrompt.userPrompt, /Spanish/);
});

test('generateSnippet produces valid curl, js, and python requests', () => {
  const curl = generateSnippet('curl', '/api/chat', 'POST', { message: 'hi' });
  assert.match(curl, /curl -X POST/);
  assert.match(curl, /"message"/);
  assert.match(curl, /"hi"/);

  const js = generateSnippet('js', '/api/status', 'GET');
  assert.match(js, /await fetch/);

  const py = generateSnippet('python', '/api/chat', 'POST', { message: 'test' });
  assert.match(py, /requests\.post/);
});

test('normalizeConversation cleans errors and enforces alternating user/model turns', () => {
  const result = normalizeConversation([
    { role: 'assistant', content: 'Intro' }, // should be dropped (starts with assistant)
    { role: 'user', content: 'First question' },
    { role: 'assistant', content: 'First answer' },
    { role: 'assistant', content: '⚠️ API Error: timeout' }, // should be filtered out
    { role: 'user', content: 'Second question' },
    { role: 'user', content: 'Additional info' }, // should be merged with previous user message
  ]);

  assert.equal(result.length, 3);
  assert.equal(result[0].role, 'user');
  assert.equal(result[0].parts[0].text, 'First question');
  assert.equal(result[1].role, 'model');
  assert.equal(result[1].parts[0].text, 'First answer');
  assert.equal(result[2].role, 'user');
  assert.match(result[2].parts[0].text, /Second question/);
  assert.match(result[2].parts[0].text, /Additional info/);
});
