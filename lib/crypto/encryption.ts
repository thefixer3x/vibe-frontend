import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Get encryption key from environment or generate one
function getEncryptionKey(): Buffer {
  const keyFromEnv = process.env.ENCRYPTION_KEY;
  if (keyFromEnv) {
    return Buffer.from(keyFromEnv, 'hex');
  }
  
  // In production, this should always come from environment
  // For development, we'll generate a consistent key
  const defaultKey = process.env.AUTH_SECRET || 'fallback-secret-key';
  return crypto.scryptSync(defaultKey, 'salt', KEY_LENGTH);
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

export function encryptData(text: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = (cipher as any).getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}

export function decryptData(encryptedData: EncryptedData): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const tag = Buffer.from(encryptedData.tag, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  (decipher as any).setAuthTag(tag);
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export function encryptValue(value: string): string {
  const encrypted = encryptData(value);
  return JSON.stringify(encrypted);
}

export function decryptValue(encryptedValue: string): string {
  const encrypted: EncryptedData = JSON.parse(encryptedValue);
  return decryptData(encrypted);
}