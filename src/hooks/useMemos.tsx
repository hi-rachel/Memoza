"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "./useAuthUser";
import type { Memo, MemosByTagResult } from "@/types/memo";
import {
  extractKeywords,
  detectLanguage,
  analyzeSentiment,
} from "@/lib/memoUtils";

export function useMemos() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthUser();

  const fetchMemos = async () => {
    if (!user) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("memos")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("메모 가져오기 오류:", error);
      return;
    }

    setMemos(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMemos();
  }, [user]);

  const createMemo = async (memoData: {
    title: string;
    content: string;
    tags?: string[]; // 선택적으로 변경
    category?: string;
    priority?: "low" | "medium" | "high";
  }) => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const supabase = createClient();

    // AI 관련 필드 자동 생성
    const keywords = extractKeywords(`${memoData.title} ${memoData.content}`);
    const language = detectLanguage(`${memoData.title} ${memoData.content}`);
    const sentiment = analyzeSentiment(`${memoData.title} ${memoData.content}`);
    const searchableText =
      `${memoData.title} ${memoData.content}`.toLowerCase();

    // 태그가 없으면 빈 배열로 설정 (트리거가 기본 태그를 자동 할당)
    const tags = memoData.tags || [];

    const { data, error } = await supabase
      .from("memos")
      .insert([
        {
          user_id: user.id,
          title: memoData.title,
          content: memoData.content,
          tags: tags, // 빈 배열이면 트리거가 기본 태그 자동 할당
          category: memoData.category,
          priority: memoData.priority,
          keywords,
          language,
          sentiment,
          searchable_text: searchableText,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("메모 생성 오류:", error);
      return { error };
    }

    setMemos((prev) => [data, ...prev]);
    return { data };
  };

  const updateMemo = async (id: string, updates: Partial<Memo>) => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const supabase = createClient();

    // 텍스트가 변경된 경우 AI 관련 필드 재계산
    const processedUpdates = { ...updates };
    if (updates.title || updates.content) {
      const currentMemo = memos.find((m) => m.id === id);
      if (currentMemo) {
        const newTitle = updates.title || currentMemo.title;
        const newContent = updates.content || currentMemo.content;

        processedUpdates.keywords = extractKeywords(
          `${newTitle} ${newContent}`
        );
        processedUpdates.language = detectLanguage(`${newTitle} ${newContent}`);
        processedUpdates.sentiment = analyzeSentiment(
          `${newTitle} ${newContent}`
        );
        processedUpdates.searchable_text =
          `${newTitle} ${newContent}`.toLowerCase();
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

    setMemos((prev) => prev.map((memo) => (memo.id === id ? data : memo)));
    return { data };
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
      .select("*")
      .eq("user_id", user.id)
      .or(
        `title.ilike.%${query}%,content.ilike.%${query}%,searchable_text.ilike.%${query}%`
      )
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("메모 검색 오류:", error);
      return { error };
    }

    return { data };
  };

  // 🎯 태그별 메모 검색 (새로운 기능!)
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
  const filterMemosByTagName = (tagName: string): Memo[] => {
    return memos.filter(
      (memo) => memo.tag_names && memo.tag_names.includes(tagName)
    );
  };

  // 태그 ID로 메모 필터링 (클라이언트 사이드)
  const filterMemosByTagId = (tagId: string): Memo[] => {
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
    getMemosByTag, // 🎯 새로운 기능!
    getMemoCountByTag, // 🎯 새로운 기능!
    filterMemosByTagName, // 🎯 새로운 기능!
    filterMemosByTagId, // 🎯 새로운 기능!
    searchMemosByTagPartial, // 🎯 새로운 기능!
    refetch: fetchMemos,
  };
}
