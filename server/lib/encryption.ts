import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Server-side encryption (for sensitive data that shouldn't be client-encrypted)
export function encrypt(text: string, key: string): { encrypted: string; iv: string; tag: string } {
  const keyBuffer = Buffer.from(key.padEnd(KEY_LENGTH, '0').slice(0, KEY_LENGTH));
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipher(ALGORITHM, keyBuffer);
  cipher.setAAD(Buffer.from('auraverse-encryption'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decrypt(encryptedData: { encrypted: string; iv: string; tag: string }, key: string): string {
  const keyBuffer = Buffer.from(key.padEnd(KEY_LENGTH, '0').slice(0, KEY_LENGTH));
  const decipher = crypto.createDecipher(ALGORITHM, keyBuffer);
  
  decipher.setAAD(Buffer.from('auraverse-encryption'));
  decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Generate secure random key for client-side encryption
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Key derivation for client passwords (PBKDF2)
export function deriveKey(password: string, salt: string, iterations: number = 100000): string {
  return crypto.pbkdf2Sync(password, salt, iterations, KEY_LENGTH, 'sha256').toString('hex');
}

// Generate salt for key derivation
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Validate encrypted journal format (base64 encoded)
export function validateEncryptedData(data: string): boolean {
  try {
    const decoded = Buffer.from(data, 'base64');
    // Basic validation - should have minimum length for IV + tag + some data
    return decoded.length >= IV_LENGTH + TAG_LENGTH + 1;
  } catch {
    return false;
  }
}

// Safe comparison for sensitive data (timing-safe)
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// Generate session token
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Hash sensitive data for storage (one-way)
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
