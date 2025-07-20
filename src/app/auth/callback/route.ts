import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error) {
    console.error("Auth callback 오류:", { error, errorDescription });
    return NextResponse.redirect(
      new URL(
        `/login?error=${error}&error_description=${errorDescription}`,
        requestUrl.origin
      )
    );
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error("세션 교환 오류:", exchangeError);
        return NextResponse.redirect(
          new URL(
            `/login?error=session_exchange_failed&error_description=${exchangeError.message}`,
            requestUrl.origin
          )
        );
      }
    } catch (err) {
      console.error("Auth callback 처리 중 오류:", err);
      return NextResponse.redirect(
        new URL("/login?error=callback_processing_failed", requestUrl.origin)
      );
    }
  }

  return NextResponse.redirect(new URL("/notes", requestUrl.origin));
}
