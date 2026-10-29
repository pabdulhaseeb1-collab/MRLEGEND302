import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateNumericId,
  validateUsername,
  validateEmail,
  validatePassword,
  calculateRemainingUsage,
  isSubscriptionActive,
  formatPKR,
  DEFAULT_LIMITS,
} from './rules';

test('validateNumericId accepts only numbers between 3 and 12 digits', () => {
  assert.equal(validateNumericId('302').valid, true);
  assert.equal(validateNumericId('123456789').valid, true);
  assert.equal(validateNumericId('abc').valid, false);
  assert.equal(validateNumericId('12a45').valid, false);
  assert.equal(validateNumericId('12').valid, false); // too short
  assert.equal(validateNumericId('').valid, false);
});

test('validateUsername accepts alphanumeric with underscores between 3 and 20 chars', () => {
  assert.equal(validateUsername('mrlegend302').valid, true);
  assert.equal(validateUsername('vip_user').valid, true);
  assert.equal(validateUsername('ab').valid, false);
  assert.equal(validateUsername('user!name').valid, false);
});

test('validateEmail requires proper email formatting', () => {
  assert.equal(validateEmail('test@example.com').valid, true);
  assert.equal(validateEmail('user@pk.org').valid, true);
  assert.equal(validateEmail('notanemail').valid, false);
  assert.equal(validateEmail('missing@domain').valid, false);
});

test('validatePassword requires at least 6 characters', () => {
  assert.equal(validatePassword('123456').valid, true);
  assert.equal(validatePassword('securePass1!').valid, true);
  assert.equal(validatePassword('12345').valid, false);
});

test('calculateRemainingUsage accurately tracks Free vs Premium limits', () => {
  const freeUsage = calculateRemainingUsage('free', { messagesCount: 3, downloadsCount: 1 }, DEFAULT_LIMITS);
  assert.equal(freeUsage.isPremium, false);
  assert.equal(freeUsage.messagesRemaining, 7);
  assert.equal(freeUsage.downloadsRemaining, 1);
  assert.equal(freeUsage.callsRemainingSeconds, 60);

  const premiumUsage = calculateRemainingUsage('monthly', { messagesCount: 50 }, DEFAULT_LIMITS);
  assert.equal(premiumUsage.isPremium, true);
  assert.equal(premiumUsage.messagesRemaining, Infinity);
  assert.equal(premiumUsage.downloadsRemaining, Infinity);
});

test('isSubscriptionActive correctly evaluates lifetime, valid, and expired monthly plans', () => {
  assert.equal(isSubscriptionActive('lifetime'), true);
  assert.equal(isSubscriptionActive('free'), false);
  const futureDate = new Date(Date.now() + 86400000 * 10).toISOString();
  const pastDate = new Date(Date.now() - 86400000 * 10).toISOString();
  assert.equal(isSubscriptionActive('monthly', futureDate), true);
  assert.equal(isSubscriptionActive('monthly', pastDate), false);
});

test('formatPKR formats amount in Pakistani Rupees format', () => {
  assert.equal(formatPKR(500), 'Rs. 500');
  assert.equal(formatPKR(2500), 'Rs. 2,500');
});
