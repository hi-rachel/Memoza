"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useTags } from "@/hooks/useTags";
import TagSelector from "@/components/tags/TagSelector";
import { FiChevronLeft, FiStar } from "react-icons/fi";

export interface Memo {
  id: string;
  title: string;
  content: string;
  tags: string[];
  is_starred: boolean;
  created_at: string;
  updated_at: string;
}

export default function MemoDetailPage() {
  const params = useParams();
  const memoId = params.id as string;
  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const router = useRouter();
  const { user } = useAuthUser();
  const { tags } = useTags();

  // 중요 태그 찾기
  const importantTag = tags.find((t) => t.is_important);

  const fetchMemo = async () => {
    if (!user) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("memos")
      .select("*")
      .eq("id", memoId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("메모 가져오기 오류:", error);
      router.push("/notes");
      return;
    }

    setMemo(data);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchMemo();
    }
  }, [user, memoId]);

  const saveMemo = async (updates: Partial<Memo>) => {
    if (!user || !memo) return;

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("memos")
      .update(updates)
      .eq("id", memo.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("메모 저장 오류:", error);
    } else {
      setMemo((prev) => (prev ? { ...prev, ...updates } : null));
    }
    setSaving(false);
  };

  const handleAutoSave = (updates: Partial<Memo>) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      saveMemo(updates);
    }, 1000);

    setAutoSaveTimeout(timeout);
  };

  const handleTitleChange = (title: string) => {
    if (!memo) return;

    const updatedMemo = { ...memo, title };
    setMemo(updatedMemo);
    handleAutoSave({ title });
  };

  const handleContentChange = (content: string) => {
    if (!memo) return;

    const updatedMemo = { ...memo, content };
    setMemo(updatedMemo);
    handleAutoSave({ content });
  };

  const handleTagsChange = (selectedTagIds: string[]) => {
    if (!memo) return;

    // 중요 태그가 있으면 유지
    const importantTagIds = memo.tags.filter((id) => {
      const tag = tags.find((t) => t.id === id);
      return tag && tag.is_important;
    });

    // 선택된 태그와 중요 태그를 합침
    const updatedTags = Array.from(
      new Set([...selectedTagIds, ...importantTagIds])
    );

    const updatedMemo = { ...memo, tags: updatedTags };
    setMemo(updatedMemo);
    saveMemo({ tags: updatedTags });
  };

  const toggleStar = async () => {
    if (!memo || !user) return;

    // 중요 태그 찾기
    const importantTag = tags.find((t) => t.is_important);
    if (!importantTag) {
      // 중요 태그가 없으면 생성
      const supabase = createClient();
      const { data: newTag } = await supabase
        .from("tags")
        .insert([
          {
            name: "중요",
            color: "#facc15",
            user_id: user.id,
            is_important: true,
            is_default: false,
            is_deletable: false,
          },
        ])
        .select()
        .single();

      if (!newTag) return;

      // 새로 생성된 중요 태그를 tags 배열에 추가
      const updatedTags = [...memo.tags, newTag.id];
      const updatedMemo = { ...memo, tags: updatedTags };
      setMemo(updatedMemo);
      saveMemo({ tags: updatedTags });
    } else {
      // 중요 태그가 있으면 토글
      const hasImportantTag = memo.tags.includes(importantTag.id);
      const updatedTags = hasImportantTag
        ? memo.tags.filter((id) => id !== importantTag.id)
        : [...memo.tags, importantTag.id];

      const updatedMemo = { ...memo, tags: updatedTags };
      setMemo(updatedMemo);
      saveMemo({ tags: updatedTags });
    }
  };

  const deleteMemo = async () => {
    if (!user || !memo) return;

    if (!confirm("정말로 이 메모를 삭제하시겠습니까?")) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("memos")
      .delete()
      .eq("id", memo.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("메모 삭제 오류:", error);
      return;
    }

    router.push("/notes");
  };

  const getTagNames = (tagIds: string[]) => {
    return tagIds
      .map((id) => tags.find((tag) => tag.id === id)?.name)
      .filter(Boolean);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!memo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">메모를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="h-[56px] flex items-center px-4 py-2 border-b border-gray-200 bg-white/80 sticky top-0 z-30">
        <button
          className="p-2 text-gray-400 hover:text-black"
          onClick={() => router.push("/notes")}
          aria-label="뒤로"
        >
          <FiChevronLeft size={22} />
        </button>
        <div className="flex-1 flex items-center justify-end gap-2">
          <button
            onClick={toggleStar}
            aria-label="중요 표시"
            className={
              memo.tags.includes(importantTag?.id || "")
                ? "text-yellow-400"
                : "text-gray-400 hover:text-yellow-400"
            }
          >
            <FiStar
              size={22}
              fill={
                memo.tags.includes(importantTag?.id || "") ? "#facc15" : "none"
              }
            />
          </button>
          <button
            onClick={deleteMemo}
            className="text-red-500 hover:text-red-700 px-2"
          >
            삭제
          </button>
        </div>
      </div>

      {/* 태그 선택 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <TagSelector
            tags={tags.filter((t) => !t.is_important)}
            selected={memo.tags.filter((id) => {
              const tag = tags.find((t) => t.id === id);
              return tag && !tag.is_important;
            })}
            onChange={handleTagsChange}
          />
          <span className="text-sm text-gray-500 ml-4">
            {saving ? "저장 중..." : "저장됨"}
          </span>
        </div>
      </div>

      {/* 메모 내용 */}
      <div className="p-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <input
            type="text"
            value={memo.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full text-2xl font-bold text-gray-900 border-none outline-none mb-4"
          />

          <textarea
            value={memo.content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="메모 내용을 입력하세요..."
            className="w-full h-96 text-gray-700 border-none outline-none resize-none"
          />

          {memo.tags && memo.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {getTagNames(memo.tags).map((tagName, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                  >
                    {tagName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
