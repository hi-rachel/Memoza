"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useTags } from "@/hooks/useTags";
import TagSelector from "@/components/tags/TagSelector";
import { getDisplayTags, sortTags } from "@/lib/tagDisplay";
import TagCreateModal from "@/components/tags/TagCreateModal";
import {
  FiEdit2,
  FiTag,
  FiStar,
  FiList,
  FiTrash2,
  FiPlus,
  FiChevronLeft,
} from "react-icons/fi";
import Header from "@/components/ui/Header";
import Link from "next/link";
import ConfirmModal from "@/components/ui/ConfirmModal";
import UserInfoPanel from "@/components/ui/UserInfoPanel";
import MemoWritePage from "@/components/notes/MemoWritePage";
import AlertModal from "@/components/ui/AlertModal";
import DdayWidget from "@/components/ui/DdayWidget";
import Skeleton from "@/components/ui/Skeleton";
import type { BasicMemo } from "@/types/memo";

export default function NotesHome() {
  const { user } = useAuthUser();
  // 입력 상태 분리
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [memos, setMemos] = useState<BasicMemo[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true); // 초기 로딩 상태를 true로 변경
  const [mounted, setMounted] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  // 수정 상태 분리
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [itemLoading, setItemLoading] = useState<string | null>(null); // 개별 메모 로딩
  const [showWrite, setShowWrite] = useState(false);
  const [search, setSearch] = useState("");
  const [tagSidebarOpen, setTagSidebarOpen] = useState(false);
  const [tagEditMode, setTagEditMode] = useState(false);
  const [colorPickerOpenId, setColorPickerOpenId] = useState<string | null>(
    null
  );
  const [editModal, setEditModal] = useState<{
    id: string;
    name: string;
    color: string;
  } | null>(null);

  // 커스텀 alert 상태
  const [alertMsg, setAlertMsg] = useState("");

  // Supabase에서 메모 불러오기
  const fetchMemos = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("memos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("메모 가져오기 오류:", error);
        setMemos([]);
      } else {
        setMemos(data || []);
      }
    } catch {
      setError("메모 불러오기 실패");
    }
    setLoading(false);
  };

  // 저장
  const handleSave = async (tags?: string[]) => {
    if (!user) {
      setError("오류가 발생했습니다. 다시 시도해 주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let tagsToSave = tags || selectedTags;

      // 태그가 없으면 기본 태그 자동 할당
      if (tagsToSave.length === 0) {
        const defaultTag = allTags.find((tag) => tag.is_default);
        if (defaultTag) {
          tagsToSave = [defaultTag.id];
        }
      }

      const supabase = createClient();
      await supabase.from("memos").insert([
        {
          user_id: user.id,
          title,
          content: body,
          tags: tagsToSave,
        },
      ]);
      setTitle("");
      setBody("");
      setSelectedTags([]);
      await fetchMemos();
    } catch {
      setError("저장 실패");
    }
    setLoading(false);
  };

  // 저장 후 오버레이 닫기
  const handleSaveAndClose = async () => {
    await handleSave();
    setShowWrite(false);
  };

  const handleDelete = async (id: string) => {
    setItemLoading(id);
    setError("");
    try {
      const supabase = createClient();
      await supabase
        .from("memos")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id);
      await fetchMemos();
    } catch {
      setError("삭제 실패");
    }
    setItemLoading(null);
  };

  // 메모 수정 취소
  const handleEditCancel = () => {
    setEditId(null);
    setEditTitle("");
    setEditBody("");
    setSelectedTags([]); // 수정 취소 시 태그 상태 초기화
  };

  // 메모 수정 저장
  const handleEditSave = async () => {
    if (!editId || !user) return;
    setItemLoading(editId);
    setError("");
    try {
      const supabase = createClient();
      await supabase
        .from("memos")
        .update({
          title: editTitle,
          content: editBody,
          tags: selectedTags,
        })
        .eq("id", editId)
        .eq("user_id", user.id);
      setEditId(null);
      setEditTitle("");
      setEditBody("");
      await fetchMemos();
    } catch {
      setError("수정 실패");
    }
    setItemLoading(null);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && mounted) fetchMemos();
  }, [user, mounted]);

  const {
    tags: allTags,
    loading: tagsLoading,
    createTag,
    updateTag,
    deleteTag,
    ensureImportantTag,
  } = useTags();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // 태그 필터 상태 추가
  const [filterTag, setFilterTag] = useState<string>("all");
  const [showTagModal, setShowTagModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteTagId, setPendingDeleteTagId] = useState<string | null>(
    null
  );
  const [pendingTagId, setPendingTagId] = useState<string | null>(null);

  // 중요 태그 id를 항상 정확히 찾음
  const importantTag = allTags.find((t) => t.is_important);

  // 필터링 로직에서 중요 태그 id로 필터
  const filteredMemos = memos.filter(
    (m) =>
      (filterTag === "all" ||
        (filterTag === importantTag?.id
          ? m.tags?.includes(importantTag.id)
          : m.tags?.includes(filterTag))) &&
      (!search ||
        m.title?.toLowerCase().includes(search.toLowerCase()) ||
        m.content?.toLowerCase().includes(search.toLowerCase()))
  );

  const addTagWrapper = async (tag: { name: string; color: string }) => {
    const result = await createTag(tag.name, tag.color);
    if (!result.data) throw new Error("태그 생성 실패");
    return result.data;
  };

  // 사이드바 닫힐 때 편집 상태 모두 초기화
  useEffect(() => {
    if (!tagSidebarOpen) {
      setTagEditMode(false);
      setColorPickerOpenId(null);
    }
  }, [tagSidebarOpen]);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedMemoIds, setSelectedMemoIds] = useState<string[]>([]);

  // ESC로 메모 선택 모드 취소
  useEffect(() => {
    if (!selectMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectMode(false);
        setSelectedMemoIds([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectMode]);

  useEffect(() => {
    if (pendingTagId && allTags.some((t) => t.id === pendingTagId)) {
      setSelectedTags([pendingTagId]);
      setPendingTagId(null);
    }
  }, [allTags, pendingTagId]);

  useEffect(() => {
    if (
      pendingTagId &&
      selectedTags.length === 1 &&
      selectedTags[0] === pendingTagId
    ) {
      setPendingTagId(null);
    }
  }, [selectedTags, pendingTagId]);

  return (
    <div className="w-full min-h-screen bg-bg text-text">
      {/* 태그 사이드바 */}
      {tagSidebarOpen && (
        <>
          {/* 오버레이 */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setTagSidebarOpen(false)}
          />
          <aside
            className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 flex flex-col transition-transform duration-300 p-4"
            style={{
              minWidth: 220,
              transform: tagSidebarOpen ? "translateX(0)" : "translateX(-100%)",
            }}
          >
            {tagEditMode ? (
              // 태그 편집 모드: 전체/중요/태그 헤더/목록 숨기고, 전용 편집 UI만
              <>
                <div className="flex items-center gap-2 pb-2">
                  <button
                    className="p-2 text-gray-400 hover:text-black"
                    onClick={() => setTagEditMode(false)}
                    aria-label="뒤로"
                  >
                    <FiChevronLeft size={22} />
                  </button>
                  <span className="font-bold text-lg">태그 편집</span>
                </div>
                {/* '기본' 태그 id를 별도 변수로 저장 */}
                {(() => {
                  // defaultTagId는 위에서 추적
                  return (
                    <ul className="flex-1 overflow-y-auto px-4">
                      {sortTags(allTags)
                        .filter((t) => !t.is_important)
                        .map((tag) => (
                          <li
                            key={tag.id}
                            className="flex items-center gap-2 py-2"
                          >
                            <button
                              type="button"
                              className="inline-block w-3 h-3 rounded-full mr-1 border border-gray-200 focus:outline-none"
                              style={{ backgroundColor: tag.color }}
                              onClick={() =>
                                setColorPickerOpenId(
                                  colorPickerOpenId === tag.id ? null : tag.id
                                )
                              }
                              tabIndex={-1}
                            />
                            <span className="text-sm text-gray-800 font-normal mr-1">
                              {tag.name}
                            </span>
                            <button
                              className="text-gray-400 hover:text-black p-1"
                              title="편짓"
                              onClick={() =>
                                setEditModal({
                                  id: tag.id,
                                  name: tag.name,
                                  color: tag.color,
                                })
                              }
                            >
                              <FiEdit2 size={15} />
                            </button>
                            {tag.is_default ? (
                              <button
                                className="ml-auto text-xs text-gray-300 cursor-not-allowed"
                                title="기본 태그는 삭제할 수 없습니다"
                                disabled
                              >
                                <FiTrash2 size={15} />
                              </button>
                            ) : (
                              <button
                                className="ml-auto text-xs text-gray-400 hover:text-red-500"
                                title="삭제"
                                onClick={() => {
                                  setPendingDeleteTagId(tag.id);
                                  setConfirmOpen(true);
                                }}
                              >
                                <FiTrash2 size={15} />
                              </button>
                            )}
                          </li>
                        ))}
                    </ul>
                  );
                })()}
                {/* 새 태그 추가 버튼: 목록 하단 */}
                <div className="px-4 mt-2">
                  <button
                    className="flex items-center gap-1 text-sm text-gray-700 font-semibold px-2 py-1 rounded hover:bg-gray-100 transition w-full justify-center"
                    onClick={() => setShowTagModal(true)}
                  >
                    <FiPlus size={16} />새 태그
                  </button>
                </div>
              </>
            ) : (
              <>
                <UserInfoPanel />
                <ul className="pt-2 pb-1">
                  <hr className="border-t border-gray-200 my-1" />
                  <li
                    className={`flex items-center gap-2 py-2 cursor-pointer ${
                      filterTag === "all"
                        ? "font-bold text-black"
                        : "text-gray-700"
                    }`}
                    onClick={() => {
                      setFilterTag("all");
                      if (!tagEditMode) setTagSidebarOpen(false);
                    }}
                  >
                    <FiList
                      size={16}
                      className="mr-1"
                      stroke={filterTag === "all" ? "#222" : "#A3A3A3"}
                      fill="none"
                    />
                    전체
                    <span className="ml-auto text-xs text-gray-400 font-normal pl-2 select-none">
                      {memos.length}
                    </span>
                  </li>
                  {importantTag && (
                    <li
                      className={`flex items-center gap-2 py-2 cursor-pointer ${
                        filterTag === importantTag.id
                          ? "font-bold text-black"
                          : "text-gray-700"
                      }`}
                      onClick={() => {
                        setFilterTag(importantTag.id);
                        if (!tagEditMode) setTagSidebarOpen(false);
                      }}
                    >
                      <FiStar
                        size={16}
                        className="mr-1"
                        fill="none"
                        stroke={
                          filterTag === importantTag.id ? "#222" : "#A3A3A3"
                        }
                      />
                      중요
                      <span className="ml-auto text-xs text-gray-400 font-normal pl-2 select-none">
                        {
                          memos.filter((m) => m.tags?.includes(importantTag.id))
                            .length
                        }
                      </span>
                    </li>
                  )}
                </ul>
                {/* 중요 밑에 수평선 */}
                <hr className="border-t border-gray-200 my-1" />
                {/* 태그 섹션 헤더 */}
                <div className="flex items-center py-2 gap-2">
                  <FiTag size={16} className="text-gray-500" />
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">태그</span>
                    <button
                      className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
                      onClick={() => setTagEditMode(true)}
                    >
                      편집
                    </button>
                  </div>
                </div>
                {/* 태그 목록 */}
                <ul className="flex-1 overflow-y-auto pb-2">
                  {allTags.filter((t) => !t.is_important).length === 0 && (
                    <li className="text-gray-400 py-2">태그 없음</li>
                  )}
                  {getDisplayTags(allTags).map((tag) => (
                    <li
                      key={tag.id}
                      className={`flex items-center gap-2 py-2 cursor-pointer transition ${
                        filterTag === tag.id
                          ? "font-bold text-black bg-gray-100"
                          : "text-gray-700 bg-white"
                      }`}
                      onClick={() => {
                        if (!tagEditMode) {
                          setFilterTag(tag.id);
                          setTagSidebarOpen(false);
                        }
                      }}
                    >
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-1"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex items-center">
                        <span>{tag.name}</span>
                      </span>
                      <span className="ml-auto text-xs text-gray-400 font-normal pl-2 select-none">
                        {memos.filter((m) => m.tags?.includes(tag.id)).length}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </aside>
        </>
      )}
      {/* 오른쪽 기존 메인 UI (왼쪽 nav만큼 margin) */}
      <div className="flex-1 flex flex-col">
        {editId ? (
          // 편집 모드 헤더
          <div className="h-[56px] flex items-center px-4 py-2 border-b border-gray-200 bg-white/80 sticky top-0 z-30">
            <button
              className="p-2 text-gray-400 hover:text-black"
              onClick={handleEditCancel}
              aria-label="뒤로"
            >
              <FiChevronLeft size={22} />
            </button>
            <div className="flex-1 flex items-center justify-end gap-2">
              <button
                onClick={async () => {
                  let tagId = importantTag?.id;
                  if (!tagId) {
                    const result = await ensureImportantTag();
                    tagId = result.data?.id;
                    if (!tagId) return;
                  }
                  if (selectedTags.includes(tagId)) {
                    setSelectedTags(selectedTags.filter((id) => id !== tagId));
                  } else {
                    setSelectedTags(
                      Array.from(new Set([...selectedTags, tagId]))
                    );
                  }
                }}
                aria-label="중요 표시"
                className={
                  importantTag && selectedTags.includes(importantTag.id)
                    ? "text-yellow-400"
                    : "text-gray-400 hover:text-yellow-400"
                }
              >
                <FiStar
                  size={22}
                  fill={
                    importantTag && selectedTags.includes(importantTag.id)
                      ? "#facc15"
                      : "none"
                  }
                />
              </button>
            </div>
          </div>
        ) : (
          // 일반 모드 헤더
          <Header
            search={search}
            setSearch={setSearch}
            onOpenSidebar={() => setTagSidebarOpen(true)}
            selectMode={selectMode}
            onToggleSelectMode={() => {
              setSelectMode((v) => !v);
              setSelectedMemoIds([]);
            }}
          />
        )}
        {!mounted ? null : (
          <div className="p-4 flex flex-col items-center min-h-screen bg-bg text-text">
            <div className="w-full flex justify-end pt-6 pb-2"></div>
            {/* D-Day 위젯 */}
            <div className="w-full max-w-5xl mx-auto mb-4">
              <DdayWidget />
            </div>

            {/* 입력창 하단에 태그 필터 UI 추가 */}
            {/* 태그 필터 버튼: 전체 → 중요 → 기본 → 나머지 */}
            <div className="w-full max-w-5xl mx-auto mb-2 pr-2">
              <div
                className="overflow-x-auto scrollbar-hide flex flex-nowrap gap-2 min-w-0 whitespace-nowrap"
                style={{ scrollBehavior: "smooth" }}
              >
                {tagsLoading ? (
                  <>
                    {/* 전체 버튼 스켈레톤 */}
                    <Skeleton
                      variant="rectangular"
                      width={60}
                      height={28}
                      className="rounded-sm shrink-0"
                    />
                    {/* 태그 버튼 스켈레톤들 */}
                    {[...Array(4)].map((_, index) => (
                      <Skeleton
                        key={index}
                        variant="rectangular"
                        width={60}
                        height={28}
                        className="rounded-sm shrink-0"
                      />
                    ))}
                  </>
                ) : (
                  <>
                    {/* 태그 버튼들 */}
                    <button
                      className={`px-3 py-1 rounded-sm text-sm font-semibold border transition-colors duration-150 shadow-sm border-border text-gray-600 shrink-0 max-w-[100px] truncate ${
                        filterTag === "all"
                          ? "bg-black text-white"
                          : "bg-bg hover:bg-gray-200 hover:text-black"
                      }`}
                      onClick={() => setFilterTag("all")}
                    >
                      전체
                    </button>
                    {/* 중요 태그 */}
                    {importantTag && (
                      <button
                        key={importantTag.id}
                        className={`px-3 py-1 rounded-sm text-sm font-semibold border transition-colors duration-150 shadow-sm border-border text-gray-600 shrink-0 max-w-[100px] truncate ${
                          filterTag === importantTag.id
                            ? "bg-black text-white"
                            : "bg-bg hover:bg-gray-200 hover:text-black"
                        }`}
                        onClick={() => setFilterTag(importantTag.id)}
                      >
                        {importantTag.name}
                      </button>
                    )}
                    {/* 나머지 태그 */}
                    {getDisplayTags(allTags).map((tag) => (
                      <button
                        key={tag.id}
                        className={`px-3 py-1 rounded-sm text-sm font-semibold border transition-colors duration-150 shadow-sm border-border text-gray-600  shrink-0 max-w-[100px] truncate ${
                          filterTag === tag.id
                            ? "bg-black text-white"
                            : "bg-bg hover:bg-gray-200 hover:text-black"
                        }`}
                        onClick={() => setFilterTag(tag.id)}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
            {error && (
              <div className="text-red-500 text-sm mb-2 w-full max-w-5xl mx-auto">
                {error}
              </div>
            )}
            {/* 메모 목록: 전체 화면 넓게 */}
            <div className="flex-1 w-full max-w-5xl mx-auto overflow-y-auto p-0 mt-2 custom-scrollbar">
              {loading ? (
                <ul className="space-y-3 w-full">
                  {[...Array(3)].map((_, index) => (
                    <li
                      key={index}
                      className="py-3 bg-gray-50 flex justify-between items-center transition w-full rounded-sm p-4"
                    >
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton variant="text" width="70%" height={20} />
                        <Skeleton variant="text" width="100%" height={16} />
                        <Skeleton variant="text" width="80%" height={16} />
                        <div className="flex items-center gap-2 mt-2">
                          <Skeleton
                            variant="rectangular"
                            width={60}
                            height={20}
                          />
                          <Skeleton variant="text" width={40} height={12} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : memos.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  메모가 없습니다.
                </div>
              ) : (
                <>
                  {selectMode && (
                    <div className="flex gap-2 mb-2">
                      <button
                        className="px-3 py-1 rounded bg-white text-gray-800 border border-gray-200 text-sm font-semibold hover:bg-gray-100 transition"
                        onClick={() => {
                          if (selectedMemoIds.length === filteredMemos.length) {
                            setSelectedMemoIds([]);
                          } else {
                            setSelectedMemoIds(filteredMemos.map((m) => m.id!));
                          }
                        }}
                      >
                        전체{" "}
                        {selectedMemoIds.length === filteredMemos.length
                          ? "해제"
                          : "선택"}
                      </button>
                      <button
                        className="px-3 py-1 rounded bg-white text-gray-800 border border-gray-200 text-sm font-semibold hover:bg-gray-100 transition disabled:opacity-50"
                        disabled={selectedMemoIds.length === 0}
                        onClick={async () => {
                          setMemos((prev) =>
                            prev.filter((m) => !selectedMemoIds.includes(m.id!))
                          );
                          const idsToDelete = [...selectedMemoIds];
                          setSelectedMemoIds([]);
                          await Promise.all(
                            idsToDelete.map((id) => handleDelete(id))
                          );
                          setSelectMode(false);
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                  <ul className="space-y-3 w-full">
                    {filteredMemos.map((m) => (
                      <li
                        key={m.id}
                        className={`py-3 bg-gray-50 flex justify-between items-center transition w-full rounded-sm p-4 ${
                          itemLoading === m.id ? "opacity-50" : ""
                        }`}
                      >
                        {selectMode && (
                          <input
                            type="checkbox"
                            className="mr-3 w-5 h-5 accent-gray-700"
                            checked={selectedMemoIds.includes(m.id!)}
                            onChange={() => {
                              setSelectedMemoIds((prev) =>
                                prev.includes(m.id!)
                                  ? prev.filter((id) => id !== m.id)
                                  : [...prev, m.id!]
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        {editId === m.id ? (
                          <div className="flex-1 flex flex-col gap-2">
                            <input
                              className="w-full border-2 border-blue-200 rounded-xl p-2 focus:outline-none focus:border-blue-400 transition bg-blue-50 resize-none mb-2"
                              placeholder="제목을 입력하세요"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              maxLength={60}
                              disabled={itemLoading === m.id}
                            />
                            <textarea
                              className="w-full border-2 border-blue-200 rounded-xl p-2 focus:outline-none focus:border-blue-400 transition bg-blue-50 resize-none"
                              rows={2}
                              placeholder="본문을 입력하세요"
                              value={editBody}
                              onChange={(e) => setEditBody(e.target.value)}
                              disabled={itemLoading === m.id}
                            />
                            <TagSelector
                              tags={allTags}
                              selected={selectedTags}
                              onChange={(tags) => {
                                setSelectedTags(tags);
                              }}
                              onAddTag={() => setShowTagModal(true)}
                            />
                            <div className="flex gap-2">
                              <button
                                className="flex-1 px-2 py-1 text-xs bg-gray-700 text-gray-100 rounded-xl font-semibold shadow-sm hover:bg-gray-800 transition"
                                onClick={handleEditSave}
                                disabled={
                                  itemLoading === m.id ||
                                  !editTitle.trim() ||
                                  !editBody.trim()
                                }
                              >
                                저장
                              </button>
                              <button
                                className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-xl font-bold shadow-none border border-gray-200 hover:bg-gray-200 transition"
                                onClick={handleEditCancel}
                                disabled={itemLoading === m.id}
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <Link
                            href={`/notes/${m.id}`}
                            className="flex w-full group cursor-pointer"
                          >
                            <div className="flex-1 min-w-0">
                              {m.title && (
                                <div className="font-bold text-lg text-text mb-1 truncate">
                                  {m.title}
                                </div>
                              )}
                              <div
                                className="text-gray-800 break-words whitespace-pre-line font-medium line-clamp-3"
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                                dangerouslySetInnerHTML={{
                                  __html: m.content ?? "",
                                }}
                              />
                              {/* 날짜와 태그 뱃지 flex-row, 태그가 왼쪽, 날짜가 오른쪽 */}
                              <div className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-row overflow-hidden whitespace-nowrap text-ellipsis max-w-full">
                                {m.tags?.map((tagId) => {
                                  const tag = allTags.find(
                                    (t) => t.id === tagId
                                  );
                                  // 중요 태그는 뱃지로 표시하지 않음
                                  if (!tag || tag.is_important) return null;
                                  return (
                                    <span
                                      key={tagId}
                                      className="px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 bg-bg border-border text-text"
                                    >
                                      <span
                                        className="inline-block w-2.5 h-2.5 rounded-full mr-1"
                                        style={{
                                          backgroundColor: tag.color,
                                        }}
                                      />
                                      {tag.name}
                                    </span>
                                  );
                                })}
                                {/* 중요 태그가 있으면 별 표시 */}
                                {importantTag &&
                                  m.tags?.includes(importantTag.id) && (
                                    <FiStar
                                      size={16}
                                      className="ml-1 text-yellow-400"
                                      fill="#facc15"
                                    />
                                  )}
                                {(() => {
                                  const date = new Date(m.updated_at);
                                  const mm = String(
                                    date.getMonth() + 1
                                  ).padStart(2, "0");
                                  const dd = String(date.getDate()).padStart(
                                    2,
                                    "0"
                                  );
                                  return `${mm}.${dd}`;
                                })()}
                              </div>
                            </div>
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            {/* 모바일: 플로팅 버튼+오버레이 */}
            <button
              className="fixed bottom-4 right-4 z-40 w-16 h-16 rounded-full bg-gray-800 text-white shadow-lg shadow-gray-300 flex items-center justify-center text-3xl hover:bg-gray-900 active:scale-95 transition"
              aria-label="메모 작성"
              onClick={() => {
                setTitle("");
                setBody("");
                // 기본 태그가 있으면 자동 선택
                const defaultTag = allTags.find((tag) => tag.is_default);
                setSelectedTags(defaultTag ? [defaultTag.id] : []);
                setShowWrite(true);
              }}
            >
              <FiEdit2 />
            </button>
            <MemoWritePage
              open={showWrite}
              onClose={() => {
                setShowWrite(false);
                setTitle("");
                setBody("");
                setSelectedTags([]);
              }}
              title={title}
              setTitle={setTitle}
              body={body}
              setBody={setBody}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              allTags={allTags}
              onSave={handleSaveAndClose}
              loading={loading}
              showTagModal={showTagModal}
              setShowTagModal={setShowTagModal}
              addTag={addTagWrapper}
              setAlertMsg={setAlertMsg}
            />
          </div>
        )}
      </div>
      <ConfirmModal
        open={confirmOpen}
        title="태그 삭제"
        description={
          "이 태그를 삭제하면 관련된 모든 메모도 함께 삭제됩니다. 정말 삭제하시겠습니까?"
        }
        confirmText="삭제"
        cancelText="취소"
        onCancel={() => {
          setConfirmOpen(false);
          setPendingDeleteTagId(null);
        }}
        onConfirm={async () => {
          if (pendingDeleteTagId) {
            // 1. 해당 태그가 달린 모든 메모 삭제
            const relatedMemos = memos.filter((m) =>
              m.tags?.includes(pendingDeleteTagId)
            );
            for (const memo of relatedMemos) {
              if (memo.id) {
                const supabase = createClient();
                await supabase
                  .from("memos")
                  .delete()
                  .eq("id", memo.id)
                  .eq("user_id", user?.id);
              }
            }
            // 2. 태그 자체 삭제
            await deleteTag(pendingDeleteTagId);
          }
          setConfirmOpen(false);
          setPendingDeleteTagId(null);
        }}
      />
      {/* 태그 수정 모달 */}
      {editModal && (
        <TagCreateModal
          open={true}
          onClose={() => setEditModal(null)}
          onCreate={async (name, color) => {
            // 태그 수정 시 같은 이름(공백제거, 대소문자 무시) 태그가(자기 자신 제외) 이미 있으면 수정 불가
            const normalized = name.trim().toLowerCase();
            const exists = allTags.some(
              (t) =>
                t.id !== editModal.id &&
                t.name.trim().toLowerCase() === normalized
            );
            if (exists) {
              setAlertMsg("이미 같은 이름의 태그가 있습니다.");
              return;
            }

            // 모든 태그는 이름과 색상 변경 가능 (기본 태그도 색상 변경 가능)
            await updateTag(editModal.id, { name, color });
            setEditModal(null);
          }}
          initialName={editModal.name}
          initialColor={editModal.color}
          mode="edit"
          editingTag={allTags.find((t) => t.id === editModal.id)}
        />
      )}
      {/* 새 태그 만들기 모달: 항상 전체 화면 중앙에 한 번만 표시 */}
      <TagCreateModal
        open={showTagModal}
        onClose={() => setShowTagModal(false)}
        onCreate={async (name, color) => {
          // 이미 같은 이름(공백제거, 대소문자 무시) 태그가 있으면 생성 불가
          const normalized = name.trim().toLowerCase();
          const exists = allTags.some(
            (t) => t.name.trim().toLowerCase() === normalized
          );
          if (exists) {
            setAlertMsg("이미 같은 이름의 태그가 있습니다.");
            return;
          }
          const result = await createTag(name, color);
          if (!result.data?.id) return;
          setPendingTagId(result.data.id);
        }}
      />
      {/* 중복 태그명 등 알림: AlertModal(확인만 있는 모달) */}
      <AlertModal
        open={!!alertMsg}
        title="알림"
        description={alertMsg}
        onClose={() => setAlertMsg("")}
      />
    </div>
  );
}
