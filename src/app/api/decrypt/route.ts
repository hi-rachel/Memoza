import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/encryption-server";

/**
 * 복호화 API
 * POST /api/decrypt
 * Body: { data: string | string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data } = body;

    if (data === undefined || data === null) {
      return NextResponse.json(
        { error: "data 필드가 필요합니다." },
        { status: 400 }
      );
    }

    // 단일 문자열 또는 배열 처리
    if (Array.isArray(data)) {
      const decrypted = await Promise.all(
        data.map(async (text) => {
          try {
            return await decrypt(text || "");
          } catch (error) {
            console.error("배열 항목 복호화 실패:", error);
            // 복호화 실패 시 원본 반환 (decrypt 함수가 이미 처리하지만 안전장치)
            return text || "";
          }
        })
      );
      return NextResponse.json({ decrypted });
    } else {
      try {
        const decrypted = await decrypt(data);
        return NextResponse.json({ decrypted });
      } catch (error) {
        // 에러 로그에 실제 데이터 내용은 남기지 않음
        console.error(
          "복호화 실패:",
          error instanceof Error ? error.message : String(error)
        );

        // 복호화 실패 시 500 에러로 내려서 클라이언트가 명확히 인지하도록 함
        return NextResponse.json(
          {
            error: "복호화에 실패했습니다.",
            message: error instanceof Error ? error.message : String(error),
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("복호화 API 오류:", error);
    return NextResponse.json(
      {
        error: "복호화에 실패했습니다.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
