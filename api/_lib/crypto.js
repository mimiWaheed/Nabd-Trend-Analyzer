/* NABD — crypto helpers.
   - bcrypt password hashing
   - cryptographically secure random tokens / OTPs
   - OTP hashing (SHA-256) with per-email salt
   - AES-256-GCM encryption for secrets at rest (Facebook tokens) */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const ENC_PREFIX = 'enc:v1:';
const OTP_LEN = 6;
const OTP_TTL_MS = 10 * 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

function randomToken(bytes) {
  return crypto.randomBytes(bytes || 32).toString('hex');
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

function verifyPassword(password, hash) {
  if (!hash) return false;
  try { return bcrypt.compareSync(password, hash); } catch (e) { return false; }
}

/* 6-digit numeric OTP via crypto.randomInt (secure) */
function generateOtp() {
  return String(crypto.randomInt(0, 1000000)).padStart(OTP_LEN, '0');
}

function hashOtp(otp, email) {
  return crypto.createHash('sha256')
    .update(String(email).toLowerCase().trim() + ':' + otp)
    .digest('hex');
}

function verifyOtp(otp, email, otpHash) {
  if (!otpHash || !otp) return false;
  const a = Buffer.from(hashOtp(otp, email), 'hex');
  const b = Buffer.from(String(otpHash), 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/* ---- AES-256-GCM secret-at-rest encryption ----
   Key derived from AUTH_SECRET. Returns null when AUTH_SECRET is missing. */
function encryptionKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) return null;
  return crypto.scryptSync(secret, 'nabd-at-rest', 32);
}

function encryptSecret(plaintext) {
  if (plaintext == null || plaintext === '') return null;
  const key = encryptionKey();
  if (!key) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ENC_PREFIX + iv.toString('hex') + ':' + tag.toString('hex') + ':' + enc.toString('hex');
}

function decryptSecret(payload) {
  if (!payload || typeof payload !== 'string') return null;
  if (!payload.startsWith(ENC_PREFIX)) return null;
  const key = encryptionKey();
  if (!key) return null;
  const parts = payload.slice(ENC_PREFIX.length).split(':');
  if (parts.length !== 3) return null;
  const [ivHex, tagHex, dataHex] = parts;
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const out = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
    return out.toString('utf8');
  } catch (e) {
    return null;
  }
}

module.exports = {
  randomToken,
  nowIso,
  hashPassword,
  verifyPassword,
  generateOtp,
  hashOtp,
  verifyOtp,
  encryptSecret,
  decryptSecret,
  encryptionKey,
  OTP_LEN,
  OTP_TTL_MS
};
