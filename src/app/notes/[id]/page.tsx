"use client";

import { useState, useEffect } from "react";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useTags } from "@/hooks/useTags";
import type { BasicMemo } from "@/types/memo";
import { encrypt, decrypt } from "@/lib/encryption-client";
import TagSelector from "@/components/tags/TagSelector";
import TagCreateModal from "@/components/tags/TagCreateModal";
import AlertModal from "@/components/ui/AlertModal";
import Spinner from "@/components/ui/Spinner";
import { FiChevronLeft, FiStar } from "react-icons/fi";

export default function MemoDetailPage() {
  const params = useParams();
  const memoId = params?.id as string | undefined;
  const [memo, setMemo] = useState<BasicMemo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const router = useRouter();
  const { user } = useAuthUser();
  const { tags, createTag, ensureImportantTag } = useTags();
  const [showTagModal, setShowTagModal] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  // 중요 태그 찾기
  const importantTag = tags.find((t) => t.is_important);

  useEffect(() => {
    if (!memoId) {
      router.push("/notes");
      return;
    }

    if (!user) {
      setLoading(true);
      return;
    }

    const fetchMemo = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("memos")
        .select("id,title,content,tags,is_starred,created_at,updated_at")
        .eq("id", memoId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("메모 가져오기 오류:", error);
        router.push("/notes");
        return;
      }

      // 복호화 처리
      try {
        const decryptedTitle = data.title
          ? await decrypt(data.title)
          : data.title || "";
        const decryptedContent = data.content
          ? await decrypt(data.content)
          : data.content || "";

        const decryptedMemo = {
          ...data,
          title: decryptedTitle,
          content: decryptedContent,
        };

        setMemo(decryptedMemo);
      } catch (error) {
        console.error(`메모 ${memoId} 복호화 실패:`, error);
        // 복호화 실패 시 원본 반환 (decrypt 함수가 이미 원본을 반환하도록 수정됨)
        setMemo({
          ...data,
          title: data.title || "",
          content: data.content || "",
        });
      }
      setLoading(false);
    };

    fetchMemo();
  }, [user, memoId, router]);

  const saveMemo = async (updates: Partial<BasicMemo>) => {
    if (!user || !memo) return;

    setSaving(true);

    try {
      // 암호화 처리 (title과 content만)
      const encryptedUpdates: Partial<BasicMemo> = { ...updates };

      if (updates.title !== undefined) {
        try {
          encryptedUpdates.title = updates.title
            ? await encrypt(updates.title)
            : "";
        } catch (encryptError) {
          console.error("제목 암호화 실패:", encryptError);
          setSaving(false);
          return;
        }
      }

      if (updates.content !== undefined) {
        try {
          encryptedUpdates.content = updates.content
            ? await encrypt(updates.content)
            : "";
        } catch (encryptError) {
          console.error("본문 암호화 실패:", encryptError);
          setSaving(false);
          return;
        }
      }

      const supabase = createClient();
      const { error } = await supabase
        .from("memos")
        .update(encryptedUpdates)
        .eq("id", memo.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("메모 저장 오류:", error);
      } else {
        // 로컬 상태는 평문으로 유지 (복호화된 상태)
        setMemo((prev) => (prev ? { ...prev, ...updates } : null));
      }
    } catch (error) {
      console.error("저장 중 오류:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAutoSave = (updates: Partial<BasicMemo>) => {
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
    const { data: ensuredTag } = await ensureImportantTag();
    if (!ensuredTag) return;
    const hasImportantTag = memo.tags.includes(ensuredTag.id);
    const updatedTags = hasImportantTag
      ? memo.tags.filter((id) => id !== ensuredTag.id)
      : [...memo.tags, ensuredTag.id];
    const updatedMemo = { ...memo, tags: updatedTags };
    setMemo(updatedMemo);
    saveMemo({ tags: updatedTags });
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
      <div className="h-screen bg-gray-50">
        <Spinner fullScreen />
      </div>
    );
  }

  if (!memo) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">메모를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* 헤더 */}
      <div className="h-[56px] flex items-center px-4 py-2 border-b border-gray-200 bg-white/80 flex-shrink-0">
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
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <TagSelector
            tags={tags.filter((t) => !t.is_important)}
            selected={memo.tags.filter((id) => {
              const tag = tags.find((t) => t.id === id);
              return tag && !tag.is_important;
            })}
            onChange={handleTagsChange}
            onAddTag={() => setShowTagModal(true)}
          />
          <span className="text-sm text-gray-500 ml-4">
            {saving ? "저장 중..." : "저장됨"}
          </span>
        </div>
      </div>

      {/* 새 태그 만들기 모달 */}
      <TagCreateModal
        open={showTagModal}
        onClose={() => setShowTagModal(false)}
        onCreate={async (name, color) => {
          const normalized = name.trim().toLowerCase();
          const exists = tags.some(
            (t) => t.name.trim().toLowerCase() === normalized
          );
          if (exists) {
            setAlertMsg("이미 같은 이름의 태그가 있습니다.");
            return;
          }
          const result = await createTag(name, color);
          const newId = result.data?.id;
          if (!newId || !memo) return;
          // 중요 태그는 유지하고, 일반 태그는 새로 생성한 태그만 적용 (1개만)
          const importantTagIds = (memo.tags || []).filter((id) => {
            const tag = tags.find((t) => t.id === id);
            return tag && tag.is_important;
          });
          // 중요 태그 + 새로 생성한 태그만 적용
          const updated = Array.from(new Set([...importantTagIds, newId]));
          setMemo({ ...memo, tags: updated });
          await saveMemo({ tags: updated });
          setShowTagModal(false);
        }}
      />

      {/* 중복 태그명 등 알림 */}
      <AlertModal
        open={!!alertMsg}
        title="알림"
        description={alertMsg}
        onClose={() => setAlertMsg("")}
      />

      {/* 메모 내용 */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden min-h-0">
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex-1 flex flex-col overflow-hidden min-h-0">
          <input
            type="text"
            value={memo.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full text-2xl font-bold text-gray-900 border-none outline-none mb-4 flex-shrink-0"
          />

          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <textarea
              value={memo.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="메모 내용을 입력하세요..."
              className="w-full flex-1 text-gray-700 border-none outline-none resize-none overflow-y-auto min-h-0"
            />
          </div>

          {memo.tags && memo.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex-shrink-0">
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
