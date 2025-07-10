// 6자리 PIN 기반 AES 암호화/복호화 유틸리티

// 브라우저용 PBKDF2 키 파생
export async function deriveEncryptionKey(
  uid: string,
  userSalt: string,
  pin: string
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const base = uid + userSalt;
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(base),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(pin),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true, // extractable: true (복구용 exportKey 지원)
    ["encrypt", "decrypt"]
  );
}

// 메모 암호화/복호화 (encryptionKey를 직접 받음)
export async function encryptMemoWithKey(
  plainText: string,
  encryptionKey: CryptoKey
): Promise<{ cipher: string; iv: string }> {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    encryptionKey,
    enc.encode(plainText)
  );
  return {
    cipher: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function decryptMemoWithKey(
  cipher: string,
  iv: string,
  encryptionKey: CryptoKey
): Promise<string> {
  const dec = new TextDecoder();
  const cipherBytes = Uint8Array.from(atob(cipher), (c) => c.charCodeAt(0));
  const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    encryptionKey,
    cipherBytes
  );
  return dec.decode(decrypted);
}
