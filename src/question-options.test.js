/**
 * Unit tests for questionOptions and optionOrder utilities.
 * Run: node src/question-options.test.js
 */

import assert from 'node:assert/strict';
import {
  isItem3Correct,
  isItem3bCorrect,
  scoreBehavioralFrequency,
  isBehavioralMature,
} from './utils/questionOptions.js';
import { shuffleArray, getOrCreateOptionOrder, hashSeed } from './utils/optionOrder.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

console.log('question-options tests\n');

test('isItem3Correct accepts semantic ID', () => {
  assert.equal(isItem3Correct('useful_response'), true);
  assert.equal(isItem3Correct('polished_trap'), false);
});

test('isItem3Correct accepts legacy letters', () => {
  assert.equal(isItem3Correct('B'), true);
  assert.equal(isItem3Correct('A'), false);
});

test('isItem3bCorrect accepts semantic ID', () => {
  assert.equal(isItem3bCorrect('challenge_assumption'), true);
  assert.equal(isItem3bCorrect('yes_man'), false);
});

test('isItem3bCorrect accepts legacy letters', () => {
  assert.equal(isItem3bCorrect('B'), true);
  assert.equal(isItem3bCorrect('A'), false);
});

test('scoreBehavioralFrequency perfect mature answers', () => {
  const score = scoreBehavioralFrequency({
    iterate: 'push_back',
    tools: 'multi_tool',
    start: 'ai_first',
    evaluate: 'substance_check',
  });
  assert.equal(score, 4);
});

test('scoreBehavioralFrequency immature answers', () => {
  const score = scoreBehavioralFrequency({
    iterate: 'accept_first',
    tools: 'single_tool',
    start: 'direct_start',
    evaluate: 'surface_judge',
  });
  assert.equal(score, 0);
});

test('scoreBehavioralFrequency legacy b answers', () => {
  const score = scoreBehavioralFrequency({
    iterate: 'b',
    tools: 'b',
    start: 'b',
    evaluate: 'b',
  });
  assert.equal(score, 4);
});

test('isBehavioralMature with semantic IDs', () => {
  assert.equal(isBehavioralMature('iterate', 'push_back'), true);
  assert.equal(isBehavioralMature('iterate', 'accept_first'), false);
});

test('shuffleArray is stable for same seed', () => {
  const a = shuffleArray(['a', 'b', 'c', 'd'], 12345);
  const b = shuffleArray(['a', 'b', 'c', 'd'], 12345);
  assert.deepEqual(a, b);
});

test('shuffleArray differs for different seeds', () => {
  const ids = ['polished_trap', 'useful_response'];
  let sawReversed = false;
  for (let i = 0; i < 50; i++) {
    const order = shuffleArray(ids, hashSeed(`session-${i}:item3`));
    if (order[0] === 'useful_response') sawReversed = true;
  }
  assert.equal(sawReversed, true, 'shuffle should produce useful_response first sometimes');
});

test('getOrCreateOptionOrder persists existing order', () => {
  const state = {
    assessment: {
      optionOrder: {
        item3: ['useful_response', 'polished_trap'],
      },
    },
  };
  const { order, isNew } = getOrCreateOptionOrder(
    state,
    'item3',
    ['polished_trap', 'useful_response'],
    'session-abc'
  );
  assert.deepEqual(order, ['useful_response', 'polished_trap']);
  assert.equal(isNew, false);
});

test('getOrCreateOptionOrder creates new order when missing', () => {
  const state = { assessment: { optionOrder: {} } };
  const { order, isNew } = getOrCreateOptionOrder(
    state,
    'item3',
    ['polished_trap', 'useful_response'],
    'session-xyz'
  );
  assert.equal(order.length, 2);
  assert.equal(isNew, true);
  assert.ok(order.includes('polished_trap'));
  assert.ok(order.includes('useful_response'));
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
