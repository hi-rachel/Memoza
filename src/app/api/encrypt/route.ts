import { NextRequest, NextResponse } from "next/server";
import { encrypt } from "@/lib/encryption-server";

/**
 * 암호화 API
 * POST /api/encrypt
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
      try {
        const encrypted = await Promise.all(
          data.map(async (text) => {
            try {
              return await encrypt(text || "");
            } catch (error) {
              console.error("배열 항목 암호화 실패:", error);
              throw error;
            }
          })
        );
        return NextResponse.json({ encrypted });
      } catch (error) {
        console.error("일괄 암호화 오류:", error);
        return NextResponse.json(
          {
            error: "암호화에 실패했습니다.",
            message: error instanceof Error ? error.message : String(error),
          },
          { status: 500 }
        );
      }
    } else {
      try {
        const encrypted = await encrypt(data);
        return NextResponse.json({ encrypted });
      } catch (error) {
        console.error("암호화 오류:", error);
        return NextResponse.json(
          {
            error: "암호화에 실패했습니다.",
            message: error instanceof Error ? error.message : String(error),
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("암호화 API 오류:", error);
    return NextResponse.json(
      {
        error: "암호화에 실패했습니다.",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
