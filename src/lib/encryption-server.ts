/**
 * 서버 사이드 암호화/복호화 유틸리티
 * API Route에서만 사용합니다.
 * 키는 서버에만 존재하며 클라이언트에 노출되지 않습니다.
 */

import { webcrypto } from "crypto";

// Node.js의 Web Crypto API 사용
const crypto = webcrypto as Crypto;

// 환경 변수에서 암호화 키 가져오기 (서버 사이드 전용)
const getEncryptionKey = async (): Promise<CryptoKey> => {
  // NEXT_PUBLIC_ 접두사 없이 서버 전용 환경 변수 사용
  const keyString = process.env.ENCRYPTION_KEY;

  // 키가 없으면 즉시 에러 발생 (조용히 기본 키를 쓰지 않음)
  if (!keyString) {
    console.error("⚠️  ENCRYPTION_KEY 환경 변수가 설정되지 않았습니다.");
    throw new Error("ENCRYPTION_KEY 환경 변수가 설정되지 않았습니다.");
  }

  // 키를 ArrayBuffer로 변환
  const keyData = new TextEncoder().encode(keyString);

  // PBKDF2를 사용하여 키를 파생
  const baseKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  // 실제 암호화 키 파생
  // 프로덕션에서는 사용자별 또는 데이터별 고유 salt 사용 권장
  const salt = new TextEncoder().encode("memoza-salt");
  const encryptionKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return encryptionKey;
};

/**
 * 텍스트가 이미 암호화되어 있는지 확인 (base64 패턴 기반)
 */
function isEncrypted(text: string): boolean {
  if (!text || typeof text !== "string") {
    return false;
  }

  // base64 형식이고 충분히 길면 암호화된 것으로 간주
  const isBase64Pattern = /^[A-Za-z0-9+/=]+$/.test(text);
  const isLongEnough = text.length >= 20;

  // 한글이나 특수문자가 포함되어 있으면 평문으로 간주
  const hasNonAscii = /[^\x00-\x7F]/.test(text);

  return isBase64Pattern && isLongEnough && !hasNonAscii;
}

/**
 * 텍스트를 암호화합니다. (서버 사이드 전용)
 * @param plaintext 암호화할 평문
 * @returns 암호화된 텍스트 (base64 인코딩된 iv + 암호문)
 */
export async function encrypt(plaintext: string): Promise<string> {
  // null, undefined, 빈 문자열 처리
  if (!plaintext || plaintext.trim() === "") {
    return plaintext || "";
  }

  // 이미 암호화된 데이터는 그대로 반환
  if (isEncrypted(plaintext)) {
    return plaintext;
  }

  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // 랜덤 IV 생성 (12바이트)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 암호화
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      data
    );

    // IV와 암호문을 결합하여 base64로 인코딩
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return Buffer.from(combined).toString("base64");
  } catch (error) {
    console.error("암호화 오류:", error);
    throw new Error(
      `암호화에 실패했습니다: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * 암호화된 텍스트를 복호화합니다. (서버 사이드 전용)
 * @param ciphertext 암호화된 텍스트 (base64 인코딩된 iv + 암호문) 또는 평문
 * @returns 복호화된 평문
 */
export async function decrypt(ciphertext: string): Promise<string> {
  // null, undefined, 빈 문자열 처리
  if (!ciphertext || ciphertext.trim() === "") {
    return ciphertext || "";
  }

  try {
    const key = await getEncryptionKey();

    // 양 끝 공백 제거 후 base64 시도
    const base64Data = ciphertext.trim();

    // base64 디코딩
    let combined: Uint8Array;
    try {
      combined = Uint8Array.from(Buffer.from(base64Data, "base64"));
    } catch (decodeError) {
      console.warn("base64 디코딩 실패, 평문으로 간주:", decodeError);
      // base64 디코딩 실패 시 평문으로 간주
      return ciphertext;
    }

    // 최소 길이 검증
    // AES-GCM은 인증 태그 16바이트가 추가되므로, IV(12) + 태그(16) = 최소 28바이트 이상이어야 정상 데이터
    if (combined.length < 28) {
      console.warn("암호화된 데이터가 너무 짧습니다:", combined.length);
      // 너무 짧으면 우리 형식의 암호문이 아니라고 보고 평문으로 간주
      return ciphertext;
    }

    // IV 추출 (처음 12바이트)
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    // 복호화
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    // 복호화 실패 시 에러만 기록하고, 실제 데이터 내용은 로그에 남기지 않음
    console.error(
      "복호화 실패:",
      error instanceof Error ? error.message : String(error)
    );
    console.error("암호화된 텍스트 길이:", ciphertext?.length);

    // ENCRYPTION_KEY 환경 변수 확인 (키 누락은 별도 경고)
    if (!process.env.ENCRYPTION_KEY) {
      console.error("⚠️  ENCRYPTION_KEY 환경 변수가 설정되지 않았습니다!");
    }

    // 복호화 실패 시 에러를 던져서 호출자가 처리할 수 있도록 함
    throw new Error(
      `복호화에 실패했습니다: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * 여러 텍스트를 일괄 암호화합니다.
 */
export async function encryptBatch(texts: string[]): Promise<string[]> {
  return Promise.all(texts.map((text) => encrypt(text)));
}

/**
 * 여러 텍스트를 일괄 복호화합니다.
 */
export async function decryptBatch(texts: string[]): Promise<string[]> {
  return Promise.all(texts.map((text) => decrypt(text)));
}
