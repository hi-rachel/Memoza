import React, { useRef, useEffect, useState } from "react";
import TagSelector from "@/components/tags/TagSelector";
import TagCreateModal from "@/components/tags/TagCreateModal";
import { FiStar, FiChevronLeft } from "react-icons/fi";
import type { DocumentReference } from "firebase/firestore";

interface MemoWritePageProps {
  open: boolean;
  onClose: () => void;
  title: string;
  setTitle: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  selectedTags: string[];
  setSelectedTags: (v: string[]) => void;
  allTags: { id: string; name: string; color: string }[];
  onSave: (tags?: string[]) => Promise<void>;
  loading: boolean;
  showTagModal: boolean;
  setShowTagModal: (v: boolean) => void;
  addTag: (tag: { name: string; color: string }) => Promise<DocumentReference>;
  setAlertMsg: (msg: string) => void;
}

const MemoWritePage: React.FC<MemoWritePageProps> = ({
  open,
  onClose,
  title,
  setTitle,
  body,
  setBody,
  selectedTags,
  setSelectedTags,
  allTags,
  onSave,
  loading,
  showTagModal,
  setShowTagModal,
  addTag,
  setAlertMsg,
}) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [pendingTagId, setPendingTagId] = useState<string | null>(null);
  const [star, setStar] = useState(false);

  // 중요 태그 id 찾기
  const importantTag = allTags.find((t) => t.name === "중요");

  // 별(중요) 토글 핸들러
  const handleToggleStar = async () => {
    let tagId = importantTag?.id;
    // 중요 태그가 없으면 생성
    if (!tagId) {
      const docRef = await addTag({ name: "중요", color: "#facc15" });
      tagId = docRef?.id;
      if (!tagId) return;
    }
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId));
      setStar(false);
    } else {
      setSelectedTags([tagId, ...selectedTags]);
      setStar(true);
    }
  };

  // 별 상태 동기화 (selectedTags 변경 시)
  useEffect(() => {
    if (importantTag && selectedTags.includes(importantTag.id)) {
      setStar(true);
    } else {
      setStar(false);
    }
  }, [selectedTags, importantTag]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        titleRef.current?.focus();
      }, 100);
    }
  }, [open]);

  useEffect(() => {
    if (pendingTagId && allTags.some((t) => t.id === pendingTagId)) {
      setSelectedTags([pendingTagId]);
      setPendingTagId(null);
      onSave([pendingTagId]);
    }
  }, [allTags, pendingTagId, setSelectedTags, onSave]);

  if (!open) return null;

  return (
    <div className="w-full h-full min-h-screen bg-white flex flex-col fixed inset-0 z-50">
      {/* 상단 바: 닫기/별 */}
      <div className="h-[56px] flex items-center px-4 py-2 border-b border-gray-200 bg-white/80 sticky top-0 z-30">
        <button
          className="p-2 text-gray-400 hover:text-black"
          onClick={onClose}
          aria-label="뒤로"
        >
          <FiChevronLeft size={22} />
        </button>
        <div className="flex-1 flex items-center justify-end gap-2">
          <button
            onClick={handleToggleStar}
            aria-label="중요 표시"
            className={
              star ? "text-yellow-400" : "text-gray-400 hover:text-yellow-400"
            }
          >
            <FiStar size={22} fill={star ? "#facc15" : "none"} />
          </button>
          {/* 점세개 버튼 필요시 아래 주석 해제 */}
          {/* <button className="p-2 text-gray-400 hover:text-gray-700" aria-label="더보기">
            <FiMoreVertical size={22} />
          </button> */}
        </div>
      </div>
      {/* 내용 영역: 스크롤 */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto w-full px-4 pb-0">
        <div className="w-full max-w-2xl flex flex-col gap-4 mt-4 flex-1">
          {/* 태그 선택 */}
          <TagSelector
            tags={allTags}
            selected={selectedTags}
            onChange={setSelectedTags}
            onAddTag={() => setShowTagModal(true)}
          />
          <TagCreateModal
            open={showTagModal}
            onClose={() => setShowTagModal(false)}
            onCreate={async (name, color) => {
              const normalized = name.trim().toLowerCase();
              const exists = allTags.some(
                (t) => t.name.trim().toLowerCase() === normalized
              );
              if (exists) {
                setAlertMsg("이미 같은 이름의 태그가 있습니다.");
                return;
              }
              const docRef = await addTag({ name, color });
              if (!docRef?.id) return;
              setPendingTagId(docRef.id);
            }}
          />
          {/* 제목 */}
          <input
            ref={titleRef}
            className="w-full text-2xl font-bold mb-4 bg-transparent border-b border-gray-200 focus:outline-none focus:border-blue-400 text-left"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목 없음"
            style={{ wordBreak: "break-all" }}
          />
          {/* 본문 */}
          <textarea
            ref={bodyRef}
            className="w-full text-lg bg-transparent border-b border-gray-200 focus:outline-none focus:border-blue-400 text-left flex-1 whitespace-pre-line cursor-text min-h-[200px] max-h-[60vh] resize-none"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="본문을 입력하세요"
            style={{
              wordBreak: "break-all",
              background: "transparent",
              outline: "none",
              overflowY: "auto",
            }}
          />
        </div>
      </div>
      {/* 저장/취소 버튼: 항상 하단 고정 */}
      <div className="sticky bottom-0 left-0 right-0 w-full bg-white border-t border-gray-100 shadow-[0_-2px_8px_0_rgba(0,0,0,0.03)] z-20 flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-2xl flex gap-2">
          <button
            className="flex-1 px-2 py-2 text-sm bg-gray-100 text-gray-700 font-bold shadow-none hover:bg-gray-200 transition"
            onClick={onClose}
            disabled={loading}
          >
            취소
          </button>
          <button
            className="flex-1 px-2 py-2 text-sm bg-black text-white rounded-xl font-semibold shadow-sm hover:bg-gray-900 transition"
            onClick={async () => {
              if (!title.trim() && !body.trim()) {
                setAlertMsg("제목 또는 본문을 입력하세요");
                return;
              }
              await onSave();
              onClose();
            }}
            disabled={loading}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemoWritePage;
