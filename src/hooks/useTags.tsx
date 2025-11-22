"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "./useAuthUser";
import { sortTags } from "@/lib/tagDisplay";
import type { Tag } from "@/types/memo";
import { encrypt, decryptBatch, decrypt } from "@/lib/encryption-client";

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthUser();

  const fetchTags = async () => {
    if (!user) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("tags")
      .select(
        "id,name,color,created_at,updated_at,is_default,is_deletable,is_important"
      )
      .eq("user_id", user.id)
      .order("is_default", { ascending: false }) // 기본 태그를 먼저 표시
      .order("created_at", { ascending: true });

    if (error) {
      console.error("태그 가져오기 오류:", error);
      return;
    }

    const tagsData = data || [];

    if (tagsData.length === 0) {
      setTags([]);
      setLoading(false);
      return;
    }

    try {
      const encryptedNames = tagsData.map((t) => t.name || "");
      const decryptedNames = await decryptBatch(encryptedNames);

      const decryptedTags: Tag[] = tagsData.map((tag, idx) => ({
        ...(tag as Tag),
        name: decryptedNames[idx] ?? tag.name ?? "",
      }));

      // 클라이언트 측에서도 정렬하여 일관성 유지
      setTags(sortTags(decryptedTags));
    } catch (decryptError) {
      console.error("태그 이름 복호화 실패, 원본 데이터 사용:", decryptError);
      setTags(sortTags(tagsData as Tag[]));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTags();
  }, [user]);

  const createTag = async (name: string, color: string = "#2EE6D6") => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    // 태그 이름 암호화
    let encryptedName: string;
    try {
      encryptedName = name ? await encrypt(name) : "";
    } catch (encryptError) {
      console.error("태그 이름 암호화 실패:", encryptError);
      return { error: "태그 이름 암호화에 실패했습니다." };
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from("tags")
      .insert([
        {
          user_id: user.id,
          name: encryptedName,
          color,
          is_default: false,
          is_important: false,
          is_deletable: true,
        },
      ])
      .select(
        "id,name,color,created_at,updated_at,is_default,is_deletable,is_important"
      )
      .single();

    if (error) {
      console.error("태그 생성 오류:", error);
      return { error };
    }

    // 상태에는 복호화된 이름으로 저장
    const decryptedTag: Tag = {
      ...(data as Tag),
      name,
    };

    setTags((prev) => sortTags([...prev, decryptedTag]));
    return { data: decryptedTag };
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

    // 중요 태그의 is_important, is_deletable 변경 방지
    if (tag?.is_important) {
      if (updates.is_important === false || updates.is_deletable === true) {
        return { error: "중요 태그의 설정을 변경할 수 없습니다." };
      }
    }

    const supabase = createClient();

    // 이름이 변경되는 경우 암호화해서 업데이트
    const processedUpdates: Partial<Tag> = { ...updates };
    if (updates.name !== undefined) {
      try {
        processedUpdates.name = updates.name ? await encrypt(updates.name) : "";
      } catch (encryptError) {
        console.error("태그 이름 암호화 실패:", encryptError);
        return { error: "태그 이름 암호화에 실패했습니다." };
      }
    }

    const { data, error } = await supabase
      .from("tags")
      .update(processedUpdates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select(
        "id,name,color,created_at,updated_at,is_default,is_deletable,is_important"
      )
      .single();

    if (error) {
      console.error("태그 업데이트 오류:", error);
      return { error };
    }

    // 상태에는 복호화된 이름으로 저장
    const decryptedTag: Tag = {
      ...(data as Tag),
      name:
        updates.name !== undefined
          ? updates.name
          : data.name
          ? await decrypt(data.name)
          : data.name,
    };

    setTags((prev) =>
      sortTags(prev.map((tag) => (tag.id === id ? decryptedTag : tag)))
    );
    return { data: decryptedTag };
  };

  const deleteTag = async (id: string) => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    // 기본 태그 삭제 방지
    const tag = tags.find((t) => t.id === id);
    if (tag?.is_default) {
      return { error: "기본 태그는 삭제할 수 없습니다." };
    }

    // 중요 태그 삭제 방지
    if (tag?.is_important) {
      return { error: "중요 태그는 삭제할 수 없습니다." };
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

  // 중요 태그 가져오기
  const getImportantTag = async () => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const supabase = createClient();
    const { data, error } = await supabase
      .from("tags")
      .select(
        "id,name,color,created_at,updated_at,is_default,is_deletable,is_important"
      )
      .eq("user_id", user.id)
      .eq("is_important", true)
      .single();

    if (error) {
      console.error("중요 태그 가져오기 오류:", error);
      return { error };
    }

    // 호출자에게는 복호화된 이름으로 전달
    const decryptedTag: Tag = {
      ...(data as Tag),
      name: data.name ? await decrypt(data.name) : "",
    };

    return { data: decryptedTag };
  };

  // 중요 태그 생성 (없는 경우)
  const ensureImportantTag = async () => {
    if (!user) return { error: "사용자가 로그인되지 않았습니다." };

    const { data: importantTag } = await getImportantTag();
    if (importantTag) {
      return { data: importantTag };
    }

    // 중요 태그가 없으면 생성
    const supabase = createClient();

    let encryptedName: string;
    try {
      encryptedName = await encrypt("중요");
    } catch (encryptError) {
      console.error("중요 태그 이름 암호화 실패:", encryptError);
      return { error: "중요 태그 이름 암호화에 실패했습니다." };
    }

    const { data, error } = await supabase
      .from("tags")
      .insert([
        {
          user_id: user.id,
          name: encryptedName,
          color: "#facc15",
          is_default: false,
          is_important: true,
          is_deletable: false,
        },
      ])
      .select(
        "id,name,color,created_at,updated_at,is_default,is_deletable,is_important"
      )
      .single();

    if (error) {
      console.error("중요 태그 생성 오류:", error);
      return { error };
    }

    const decryptedTag: Tag = {
      ...(data as Tag),
      name: "중요",
    };

    setTags((prev) => sortTags([...prev, decryptedTag]));
    return { data: decryptedTag };
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

    let encryptedName: string;
    try {
      encryptedName = await encrypt("스크랩");
    } catch (encryptError) {
      console.error("기본 태그 이름 암호화 실패:", encryptError);
      return { error: "기본 태그 이름 암호화에 실패했습니다." };
    }

    const { data, error } = await supabase
      .from("tags")
      .insert([
        {
          user_id: user.id,
          name: encryptedName,
          color: "#2EE6D6",
          is_default: true,
          is_deletable: false,
        },
      ])
      .select(
        "id,name,color,created_at,updated_at,is_default,is_deletable,is_important"
      )
      .single();

    if (error) {
      console.error("기본 태그 생성 오류:", error);
      return { error };
    }

    const decryptedTag: Tag = {
      ...(data as Tag),
      name: "스크랩",
    };

    setTags((prev) => sortTags([...prev, decryptedTag]));
    return { data: decryptedTag };
  };

  return {
    tags,
    loading,
    createTag,
    updateTag,
    deleteTag,
    getDefaultTag,
    getImportantTag,
    ensureImportantTag,
    updateDefaultTagName,
    ensureDefaultTag,
    refetch: fetchTags,
  };
}
