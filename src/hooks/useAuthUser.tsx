"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // 현재 세션 가져오기
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (event === "SIGNED_IN") {
        router.push("/notes");
      } else if (event === "SIGNED_OUT") {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const signInWithGoogle = async () => {
    const supabase = createClient();

    // User-Agent 감지
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileWebView =
      /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
      );
    const isInAppBrowser = /fbav|instagram|line|wv|micromessenger/i.test(
      userAgent
    );

    // 모바일 웹뷰나 인앱 브라우저에서의 Google 로그인 제한 우회
    const options: {
      redirectTo: string;
      queryParams?: {
        prompt?: string;
        access_type?: string;
        response_type?: string;
        scope?: string;
        include_granted_scopes?: string;
      };
    } = {
      redirectTo: `${window.location.origin}/auth/callback`,
    };

    // 모바일 웹뷰나 인앱 브라우저인 경우 추가 옵션 설정
    if (isMobileWebView || isInAppBrowser) {
      options.queryParams = {
        prompt: "select_account",
        access_type: "offline",
        response_type: "code",
        scope: "openid email profile",
        include_granted_scopes: "true",
      };
    }

    // 모바일 웹뷰에서 추가 시도: 팝업 방식
    if (isMobileWebView || isInAppBrowser) {
      try {
        // 팝업 방식으로 시도
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            ...options,
            skipBrowserRedirect: true, // 팝업 방식
          },
        });

        if (!error) {
          return { error: null };
        }
      } catch {
        console.log("팝업 방식 실패, 리디렉션 방식으로 재시도");
      }
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options,
    });

    // 403 disallowed_useragent 에러 처리
    if (error?.message?.includes("disallowed_useragent")) {
      return {
        error: {
          message:
            "모바일 앱에서 Google 로그인이 제한됩니다. 브라우저에서 접속하거나 Kakao 또는 GitHub 로그인을 사용해주세요.",
        },
      };
    }

    return { error };
  };

  const signInWithGithub = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signInWithKakao = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  // 카카오 사용자 프로필 정보 가져오기
  const getKakaoProfile = async () => {
    if (!user || user.app_metadata?.provider !== "kakao") {
      return null;
    }

    try {
      // Supabase에서 세션 정보 가져오기
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.provider_token) {
        const response = await fetch("https://kapi.kakao.com/v2/user/me", {
          headers: {
            Authorization: `Bearer ${session.provider_token}`,
          },
        });

        if (response.ok) {
          const profile = await response.json();
          return {
            nickname: profile.properties?.nickname,
            profileImage: profile.properties?.profile_image,
            kakaoId: profile.id,
          };
        }
      }
    } catch (error) {
      console.error("카카오 프로필 가져오기 실패:", error);
    }

    return null;
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithGithub,
    signInWithKakao,
    getKakaoProfile,
    signOut,
  };
}
