/**
 * 클라이언트 사이드 암호화/복호화 유틸리티
 * API Route를 통해 서버 사이드 암호화를 호출합니다.
 */

/**
 * 텍스트를 암호화합니다. (API를 통해 서버에서 암호화)
 * @param plaintext 암호화할 평문
 * @returns 암호화된 텍스트 (base64...)
 */
export async function encrypt(plaintext: string): Promise<string> {
  // null, undefined, 빈 문자열 처리
  if (
    !plaintext ||
    (typeof plaintext === "string" && plaintext.trim() === "")
  ) {
    return plaintext || "";
  }

  try {
    const response = await fetch("/api/encrypt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: plaintext }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `암호화 API 오류: ${response.status}`;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        // JSON 파싱 실패 시 원본 에러 텍스트 사용
      }

      console.error(`암호화 API 오류 (${response.status}):`, errorText);
      throw new Error(errorMessage);
    }

    const result = await response.json();

    if (result.encrypted === undefined || result.encrypted === null) {
      console.error("암호화 결과가 없습니다:", result);
      throw new Error("암호화 결과가 없습니다.");
    }

    return result.encrypted || "";
  } catch (error) {
    console.error("암호화 오류:", error);
    // 에러를 다시 던져서 호출자가 처리할 수 있도록 함
    throw error instanceof Error ? error : new Error("암호화에 실패했습니다.");
  }
}

/**
 * 암호화된 텍스트를 복호화합니다. (API를 통해 서버에서 복호화)
 * @param ciphertext 암호화된 텍스트 (base64...) 또는 평문
 * @returns 복호화된 평문
 */
export async function decrypt(ciphertext: string): Promise<string> {
  // null, undefined, 빈 문자열 처리
  if (
    !ciphertext ||
    (typeof ciphertext === "string" && ciphertext.trim() === "")
  ) {
    return ciphertext || "";
  }

  try {
    const response = await fetch("/api/decrypt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: ciphertext }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`복호화 API 오류 (${response.status}):`, errorText);

      // API 에러 시 복호화 실패 메시지 반환
      console.warn("복호화 API 실패");
      return "[복호화 실패]";
    }

    const result = await response.json();

    // 복호화 결과 검증
    if (result.decrypted === undefined || result.decrypted === null) {
      console.warn("복호화 결과가 없습니다:", result);
      return "[복호화 실패]";
    }

    // 복호화 성공
    return result.decrypted || "";
  } catch (error) {
    // 복호화 실패 시 에러만 기록하고, 실제 데이터 내용은 로그에 남기지 않음
    console.error(
      "복호화 실패:",
      error instanceof Error ? error.message : String(error)
    );

    // 네트워크 에러나 기타 에러인 경우 복호화 실패 메시지 반환
    return "[복호화 실패]";
  }
}

/**
 * 여러 텍스트를 일괄 암호화합니다.
 */
export async function encryptBatch(texts: string[]): Promise<string[]> {
  try {
    const response = await fetch("/api/encrypt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: texts }),
    });

    if (!response.ok) {
      throw new Error(`암호화 API 오류: ${response.status}`);
    }

    const result = await response.json();
    return result.encrypted;
  } catch (error) {
    console.error("일괄 암호화 오류:", error);
    throw error;
  }
}

/**
 * 여러 텍스트를 일괄 복호화합니다.
 */
export async function decryptBatch(texts: string[]): Promise<string[]> {
  try {
    const response = await fetch("/api/decrypt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: texts }),
    });

    if (!response.ok) {
      throw new Error(`복호화 API 오류: ${response.status}`);
    }

    const result = await response.json();
    return result.decrypted;
  } catch (error) {
    console.error(
      "일괄 복호화 오류:",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}
