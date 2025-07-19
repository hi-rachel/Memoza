"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "./useAuthUser";
import type { Tag } from "@/types/memo";

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthUser();

  const fetchTags = async () => {
    if (!user) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false }) // 기본 태그를 먼저 표시
      .order("created_at", { ascending: false });

    if (error) {
      console.error("태그 가져오기 오류:", error);
      return;
    }

    setTags(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTags();
  }, [user]);

  const createTag = async (name: string, color: string = "#2EE6D6") => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const supabase = createClient();
    const { data, error } = await supabase
      .from("tags")
      .insert([
        {
          user_id: user.id,
          name,
          color,
          is_default: false,
          is_deletable: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("태그 생성 오류:", error);
      return { error };
    }

    setTags((prev) => [data, ...prev]);
    return { data };
  };

  const updateTag = async (id: string, updates: Partial<Tag>) => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    // 기본 태그의 is_default, is_deletable 변경 방지
    const tag = tags.find((t) => t.id === id);
    if (tag?.is_default) {
      if (updates.is_default === false || updates.is_deletable === true) {
        return { error: "기본 태그의 설정을 변경할 수 없습니다." };
      }
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("tags")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("태그 업데이트 오류:", error);
      return { error };
    }

    setTags((prev) => prev.map((tag) => (tag.id === id ? data : tag)));
    return { data };
  };

  const deleteTag = async (id: string) => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    // 기본 태그 삭제 방지
    const tag = tags.find((t) => t.id === id);
    if (tag?.is_default) {
      return { error: "기본 태그는 삭제할 수 없습니다." };
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("태그 삭제 오류:", error);
      return { error };
    }

    setTags((prev) => prev.filter((tag) => tag.id !== id));
    return { success: true };
  };

  // 기본 태그 가져오기
  const getDefaultTag = async () => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_default_tag", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("기본 태그 가져오기 오류:", error);
      return { error };
    }

    return { data: data?.[0] };
  };

  // 기본 태그 이름 변경
  const updateDefaultTagName = async (newName: string) => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const supabase = createClient();
    const { data, error } = await supabase.rpc("update_default_tag_name", {
      p_user_id: user.id,
      p_new_name: newName,
    });

    if (error) {
      console.error("기본 태그 이름 변경 오류:", error);
      return { error };
    }

    // 로컬 상태 업데이트
    await fetchTags();
    return { success: data };
  };

  // 기본 태그 생성 (없는 경우)
  const ensureDefaultTag = async () => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const { data: defaultTag } = await getDefaultTag();
    if (defaultTag) {
      return { data: defaultTag };
    }

    // 기본 태그가 없으면 생성
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tags")
      .insert([
        {
          user_id: user.id,
          name: "스크랩",
          color: "#2EE6D6",
          is_default: true,
          is_deletable: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("기본 태그 생성 오류:", error);
      return { error };
    }

    setTags((prev) => [data, ...prev]);
    return { data };
  };

  return {
    tags,
    loading,
    createTag,
    updateTag,
    deleteTag,
    getDefaultTag,
    updateDefaultTagName,
    ensureDefaultTag,
    refetch: fetchTags,
  };
}
