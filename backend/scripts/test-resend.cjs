#!/usr/bin/env node
/**
 * Test Resend delivery without starting NestJS.
 * Usage (from backend/):
 *   node scripts/test-resend.cjs [recipient@email.com]
 *
 * Reads RESEND_API_KEY / SMTP_PASS and EMAIL_FROM from .env or environment.
 * Does NOT print the API key.
 */
require('dotenv').config();
const { Resend } = require('resend');

const key = (
  process.env.RESEND_API_KEY ||
  process.env.SMTP_PASS ||
  process.env.SMTP_PASSWORD ||
  ''
).trim();
const sandbox =
  process.env.RESEND_SANDBOX === '1' || process.env.RESEND_SANDBOX === 'true';
const emailFrom = (process.env.EMAIL_FROM || '').trim();
const from =
  sandbox || !emailFrom ? 'onboarding@resend.dev' : emailFrom;
const to = process.argv[2] || process.env.ADMIN_EMAIL || emailFrom || 'delivered@resend.dev';

console.log('Resend key:', key.startsWith('re_') ? `re_* (${key.length} chars)` : 'MISSING or invalid');
console.log('From:', from, sandbox ? '(sandbox)' : '');
console.log('To:', to);

if (!key.startsWith('re_')) {
  console.error('\nFix: set RESEND_API_KEY=re_... in Railway or backend/.env');
  process.exit(1);
}

const resend = new Resend(key);
(async () => {
  const { data, error } = await resend.emails.send({
    from: `Bio Vera <${from}>`,
    to,
    subject: `Bio Vera Resend test ${new Date().toISOString()}`,
    text: 'If you received this, Resend is configured correctly.',
  });
  if (error) {
    console.error('\nResend ERROR:', error.message || JSON.stringify(error));
    if (String(error.message || '').includes('domain') || String(error.message || '').includes('verified')) {
      console.error('Hint: set RESEND_SANDBOX=1 and EMAIL_FROM=onboarding@resend.dev until biovera.app is Verified.');
    }
    if (String(error.message || '').includes('invalid') || String(error.message || '').includes('API key')) {
      console.error('Hint: copy a fresh API key from https://resend.com/api-keys');
    }
    process.exit(1);
  }
  console.log('\nOK — email id:', data?.id);
  console.log('Check Resend dashboard → Emails, and the recipient inbox/spam.');
})();
