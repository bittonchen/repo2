import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private config: ConfigService) {
    const encryptionKey = this.config.get<string>('ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    // Key must be 32 bytes for AES-256
    this.key = Buffer.from(encryptionKey, 'hex');
    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
  }

  encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;
    const iv = randomBytes(12);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    // Format: iv:authTag:encrypted (all base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
  }

  decrypt(ciphertext: string): string {
    if (!ciphertext) return ciphertext;
    // If not encrypted (no colons), return as-is for backward compatibility
    if (!ciphertext.includes(':')) return ciphertext;
    try {
      const [ivB64, authTagB64, encryptedB64] = ciphertext.split(':');
      const iv = Buffer.from(ivB64, 'base64');
      const authTag = Buffer.from(authTagB64, 'base64');
      const encrypted = Buffer.from(encryptedB64, 'base64');
      const decipher = createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    } catch {
      // If decryption fails, return as-is (unencrypted legacy data)
      return ciphertext;
    }
  }
}
