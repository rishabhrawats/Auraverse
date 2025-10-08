// Client-side encryption using Web Crypto API
export class ClientCrypto {
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  static async encrypt(plaintext: string, password: string): Promise<{ cipher: string; salt: string; iv: string }> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate random salt and IV
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Derive key from password
    const key = await this.deriveKey(password, salt);
    
    // Encrypt the data
    const encryptedData = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );
    
    // Convert to base64 for storage
    return {
      cipher: btoa(String.fromCharCode(...new Uint8Array(encryptedData))),
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv))
    };
  }

  static async decrypt(encryptedData: { cipher: string; salt: string; iv: string }, password: string): Promise<string> {
    const decoder = new TextDecoder();
    
    // Convert from base64
    const cipherBytes = new Uint8Array(atob(encryptedData.cipher).split('').map(c => c.charCodeAt(0)));
    const saltBytes = new Uint8Array(atob(encryptedData.salt).split('').map(c => c.charCodeAt(0)));
    const ivBytes = new Uint8Array(atob(encryptedData.iv).split('').map(c => c.charCodeAt(0)));
    
    // Derive key from password
    const key = await this.deriveKey(password, saltBytes);
    
    // Decrypt the data
    const decryptedData = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes },
      key,
      cipherBytes
    );
    
    return decoder.decode(decryptedData);
  }

  static async generateRandomPassword(): Promise<string> {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).slice(0, 32);
  }

  // Helper to store encryption key in localStorage (for demo purposes)
  // In production, this would be handled more securely
  static storeEncryptionKey(userId: string, key: string): void {
    localStorage.setItem(`aura_encryption_key_${userId}`, key);
  }

  static getEncryptionKey(userId: string): string | null {
    return localStorage.getItem(`aura_encryption_key_${userId}`);
  }
}

// Journal encryption helper
export async function encryptJournalEntry(content: string, title: string, userId: string): Promise<string> {
  let encryptionKey = ClientCrypto.getEncryptionKey(userId);
  
  if (!encryptionKey) {
    // Generate new key if none exists
    encryptionKey = await ClientCrypto.generateRandomPassword();
    ClientCrypto.storeEncryptionKey(userId, encryptionKey);
  }

  const journalData = JSON.stringify({ title, content, timestamp: new Date().toISOString() });
  const encrypted = await ClientCrypto.encrypt(journalData, encryptionKey);
  
  // Combine all encrypted data into a single string
  return JSON.stringify(encrypted);
}

export async function decryptJournalEntry(encryptedData: string, userId: string): Promise<{ title: string; content: string; timestamp: string }> {
  const encryptionKey = ClientCrypto.getEncryptionKey(userId);
  
  if (!encryptionKey) {
    throw new Error('Encryption key not found. Unable to decrypt journal entry.');
  }

  const encrypted = JSON.parse(encryptedData);
  const decrypted = await ClientCrypto.decrypt(encrypted, encryptionKey);
  
  return JSON.parse(decrypted);
}
