"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "./useAuthUser";
import type { BasicMemo, Memo, MemosByTagResult } from "@/types/memo";
import { encrypt, decryptBatch, decrypt } from "@/lib/encryption-client";

type MemoLite = BasicMemo & { tag_names?: string[] };

export function useMemos() {
  const [memos, setMemos] = useState<MemoLite[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthUser();

  const fetchMemos = useCallback(async () => {
    if (!user) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("memos")
      .select("id,title,content,tags,is_starred,created_at,updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("메모 가져오기 오류:", error);
      return;
    }

    const memosData = data || [];

    if (memosData.length === 0) {
      setMemos([]);
    } else {
      try {
        const titles = memosData.map((m) => m.title || "");
        const contents = memosData.map((m) => m.content || "");

        const [decryptedTitles, decryptedContents] = await Promise.all([
          decryptBatch(titles),
          decryptBatch(contents),
        ]);

        const decryptedMemos = memosData.map((memo, idx) => ({
          ...memo,
          title: decryptedTitles[idx] ?? memo.title ?? "",
          content: decryptedContents[idx] ?? memo.content ?? "",
        }));

        setMemos(decryptedMemos);
      } catch (decryptError) {
        console.error("메모 배치 복호화 실패, 원본 데이터 사용:", decryptError);
        setMemos(
          memosData.map((memo) => ({
            ...memo,
            title: memo.title || "",
            content: memo.content || "",
          }))
        );
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  const createMemo = async (memoData: {
    title: string;
    content: string;
    tags?: string[]; // 선택적으로 변경
    category?: string;
    priority?: "low" | "medium" | "high";
  }) => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const supabase = createClient();

    // 암호화 처리
    let encryptedTitle: string;
    let encryptedContent: string;

    try {
      encryptedTitle = memoData.title ? await encrypt(memoData.title) : "";
      encryptedContent = memoData.content
        ? await encrypt(memoData.content)
        : "";
    } catch (encryptError) {
      console.error("메모 생성 시 암호화 실패:", encryptError);
      return { error: "암호화에 실패했습니다." };
    }

    // 태그가 없으면 빈 배열로 설정 (트리거가 기본 태그를 자동 할당)
    const tags = memoData.tags || [];

    const { data, error } = await supabase
      .from("memos")
      .insert([
        {
          user_id: user.id,
          title: encryptedTitle,
          content: encryptedContent,
          tags: tags, // 빈 배열이면 트리거가 기본 태그 자동 할당
          category: memoData.category,
          priority: memoData.priority,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("메모 생성 오류:", error);
      return { error };
    }

    // 복호화된 데이터로 상태 업데이트
    const decryptedData = {
      ...data,
      title: memoData.title,
      content: memoData.content,
    };

    setMemos((prev) => [decryptedData, ...prev]);
    return { data: decryptedData };
  };

  const updateMemo = async (id: string, updates: Partial<Memo>) => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const supabase = createClient();

    // 텍스트가 변경된 경우 AI 관련 필드 재계산 및 암호화
    const processedUpdates: Partial<Memo> = { ...updates };
    if (updates.title || updates.content) {
      const currentMemo = memos.find((m) => m.id === id);
      if (currentMemo) {
        const newTitle = updates.title || currentMemo.title;
        const newContent = updates.content || currentMemo.content;

        // 암호화 처리
        try {
          if (updates.title !== undefined) {
            processedUpdates.title = newTitle ? await encrypt(newTitle) : "";
          }
          if (updates.content !== undefined) {
            processedUpdates.content = newContent
              ? await encrypt(newContent)
              : "";
          }
        } catch (encryptError) {
          console.error("메모 업데이트 시 암호화 실패:", encryptError);
          return { error: "암호화에 실패했습니다." };
        }
      }
    }

    const { data, error } = await supabase
      .from("memos")
      .update(processedUpdates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("메모 업데이트 오류:", error);
      return { error };
    }

    // 복호화된 데이터로 상태 업데이트
    const decryptedData = {
      ...data,
      title:
        updates.title !== undefined
          ? updates.title
          : data.title
          ? await decrypt(data.title)
          : data.title,
      content:
        updates.content !== undefined
          ? updates.content
          : data.content
          ? await decrypt(data.content)
          : data.content,
    };

    setMemos((prev) =>
      prev.map((memo) => (memo.id === id ? decryptedData : memo))
    );
    return { data: decryptedData };
  };

  const deleteMemo = async (id: string) => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const supabase = createClient();
    const { error } = await supabase
      .from("memos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("메모 삭제 오류:", error);
      return { error };
    }

    setMemos((prev) => prev.filter((memo) => memo.id !== id));
    return { success: true };
  };

  const toggleStar = async (id: string) => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const currentMemo = memos.find((m) => m.id === id);
    if (!currentMemo) return { error: "메모를 찾을 수 없습니다." };

    return await updateMemo(id, { is_starred: !currentMemo.is_starred });
  };

  const searchMemos = async (query: string) => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const supabase = createClient();
    const { data, error } = await supabase
      .from("memos")
      .select(
        "id,title,content,tags,is_starred,created_at,updated_at,keywords,language,sentiment,searchable_text"
      )
      .eq("user_id", user.id)
      .or(
        `title.ilike.%${query}%,content.ilike.%${query}%,searchable_text.ilike.%${query}%`
      )
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("메모 검색 오류:", error);
      return { error };
    }

    const memosData = data || [];

    if (memosData.length === 0) {
      return { data: [] };
    }

    try {
      const titles = memosData.map((m) => m.title || "");
      const contents = memosData.map((m) => m.content || "");

      const [decryptedTitles, decryptedContents] = await Promise.all([
        decryptBatch(titles),
        decryptBatch(contents),
      ]);

      const decryptedData = memosData.map((memo, idx) => ({
        ...memo,
        title: decryptedTitles[idx] ?? memo.title ?? "",
        content: decryptedContents[idx] ?? memo.content ?? "",
      }));

      return { data: decryptedData };
    } catch (decryptError) {
      console.error(
        "메모 검색 배치 복호화 실패, 원본 데이터 사용:",
        decryptError
      );
      return {
        data: memosData.map((memo) => ({
          ...memo,
          title: memo.title || "",
          content: memo.content || "",
        })),
      };
    }
  };

  // 태그별 메모 검색
  const getMemosByTag = async (
    tagName: string,
    limit: number = 50
  ): Promise<{ data?: MemosByTagResult[]; error?: string }> => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_memos_by_tag", {
      p_user_id: user.id,
      p_tag_name: tagName,
      p_limit: limit,
    });

    if (error) {
      console.error("태그별 메모 검색 오류:", error);
      return { error: error.message };
    }

    return { data };
  };

  // 태그별 메모 개수 조회
  const getMemoCountByTag = async (
    tagName: string
  ): Promise<{ data?: number; error?: string }> => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_memo_count_by_tag", {
      p_user_id: user.id,
      p_tag_name: tagName,
    });

    if (error) {
      console.error("태그별 메모 개수 조회 오류:", error);
      return { error: error.message };
    }

    return { data };
  };

  // 태그 이름으로 메모 필터링 (클라이언트 사이드)
  const filterMemosByTagName = (tagName: string): MemoLite[] => {
    return memos.filter(
      (memo) => memo.tag_names && memo.tag_names.includes(tagName)
    );
  };

  // 태그 ID로 메모 필터링 (클라이언트 사이드)
  const filterMemosByTagId = (tagId: string): MemoLite[] => {
    return memos.filter((memo) => memo.tags && memo.tags.includes(tagId));
  };

  // 태그 이름 부분 검색 (서버 사이드)
  const searchMemosByTagPartial = async (
    tagPattern: string,
    limit: number = 50
  ): Promise<{ data?: MemosByTagResult[]; error?: string }> => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const supabase = createClient();
    const { data, error } = await supabase.rpc("search_memos_by_tag_partial", {
      p_user_id: user.id,
      p_tag_pattern: tagPattern,
      p_limit: limit,
    });

    if (error) {
      console.error("태그 부분 검색 오류:", error);
      return { error: error.message };
    }

    return { data };
  };

  return {
    memos,
    loading,
    createMemo,
    updateMemo,
    deleteMemo,
    toggleStar,
    searchMemos,
    getMemosByTag,
    getMemoCountByTag,
    filterMemosByTagName,
    filterMemosByTagId,
    searchMemosByTagPartial,
    refetch: fetchMemos,
  };
}
