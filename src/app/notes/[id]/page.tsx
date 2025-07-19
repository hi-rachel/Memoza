"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useTags } from "@/hooks/useTags";
import TagSelector from "@/components/tags/TagSelector";

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

    const updatedMemo = { ...memo, tags: selectedTagIds };
    setMemo(updatedMemo);
    saveMemo({ tags: selectedTagIds });
  };

  const toggleStar = async () => {
    if (!memo) return;

    const updatedMemo = { ...memo, is_starred: !memo.is_starred };
    setMemo(updatedMemo);
    saveMemo({ is_starred: !memo.is_starred });
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
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/notes")}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 뒤로
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleStar}
                className="text-yellow-500 hover:text-yellow-600"
              >
                {memo.is_starred ? "★" : "☆"}
              </button>
              <span className="text-sm text-gray-500">
                {saving ? "저장 중..." : "저장됨"}
              </span>
            </div>
          </div>
          <button
            onClick={deleteMemo}
            className="text-red-500 hover:text-red-700"
          >
            삭제
          </button>
        </div>
      </div>

      {/* 태그 선택 */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <TagSelector
          tags={tags}
          selected={memo.tags}
          onChange={handleTagsChange}
        />
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
