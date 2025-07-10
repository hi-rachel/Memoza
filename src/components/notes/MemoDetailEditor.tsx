import React, { useRef, useEffect, useState } from "react";
import TagSelector from "@/components/tags/TagSelector";
import TagCreateModal from "@/components/tags/TagCreateModal";
import AlertModal from "@/components/ui/AlertModal";
import type { DocumentReference } from "firebase/firestore";

interface MemoDetailEditorProps {
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
  alertMsg: string;
  setAlertMsg: (msg: string) => void;
}

const MemoDetailEditor: React.FC<MemoDetailEditorProps> = ({
  title,
  setTitle,
  body,
  setBody,
  selectedTags,
  setSelectedTags,
  allTags,
  onSave,
  showTagModal,
  setShowTagModal,
  addTag,
  alertMsg,
  setAlertMsg,
}) => {
  const [editTitleMode, setEditTitleMode] = useState(false);
  const [editBodyMode, setEditBodyMode] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  // const [alertMsg, setAlertMsg] = useState("");
  const [pendingTagId, setPendingTagId] = useState<string | null>(null);

  useEffect(() => {
    if (editTitleMode && titleRef.current) {
      titleRef.current.focus();
      // 커서를 맨 끝으로 이동
      const len = titleRef.current.value.length;
      titleRef.current.setSelectionRange(len, len);
    }
  }, [editTitleMode]);

  useEffect(() => {
    if (editBodyMode && bodyRef.current) {
      // 최초 진입 시에만 body가 있으면 innerHTML을 동기화
      if (bodyRef.current.innerHTML === "" && body) {
        bodyRef.current.innerHTML = body;
      }
      // 그 외에는 절대 innerHTML을 덮어쓰지 않는다!
    }
  }, [editBodyMode]);

  // 커서 이동 useEffect는 그대로 유지
  useEffect(() => {
    if (editBodyMode && bodyRef.current) {
      setTimeout(() => {
        const el = bodyRef.current;
        if (!el) return;
        el.focus();
        if (el.innerText.length > 0) {
          const range = document.createRange();
          const sel = window.getSelection();
          range.selectNodeContents(el);
          range.collapse(false); // 맨 끝
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 0);
    }
  }, [editBodyMode, body]);

  // 저장 시 제목과 본문이 모두 비어있으면 alert
  const handleSave = async (tagsOverride?: string[]) => {
    if (!title.trim() && !body.trim()) {
      setAlertMsg("제목 또는 본문을 입력하세요");
      return;
    }
    await onSave(tagsOverride);
  };

  useEffect(() => {
    if (pendingTagId && allTags.some((t) => t.id === pendingTagId)) {
      setSelectedTags([pendingTagId]);
      setPendingTagId(null);
      onSave([pendingTagId]);
    }
  }, [allTags, pendingTagId, setSelectedTags, onSave]);

  const addTagWrapper = async (tag: { name: string; color: string }) => {
    const result = await addTag(tag);
    if (!result) throw new Error("태그 추가 실패");
    return result;
  };

  return (
    <div className="flex flex-col items-start justify-start w-full max-w-2xl mx-auto px-4 py-8 h-[calc(100vh-64px)]">
      {/* 태그 선택 */}
      <TagSelector
        tags={allTags}
        selected={selectedTags}
        onChange={(tags) => {
          setSelectedTags(tags);
          onSave(tags); // 태그 변경 시 최신값으로 저장
        }}
        onAddTag={() => setShowTagModal(true)}
        className="mb-2"
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
          const docRef = await addTagWrapper({ name, color });
          if (!docRef?.id) return;
          setPendingTagId(docRef.id);
        }}
      />
      {/* 제목 */}
      {!editTitleMode ? (
        <input
          ref={titleRef}
          className="w-full text-2xl font-bold mb-4 bg-transparent border-b border-gray-200 focus:outline-none focus:border-blue-400 text-left"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setEditTitleMode(true)}
          placeholder="제목 없음"
          style={{ wordBreak: "break-all" }}
          readOnly
        />
      ) : (
        <input
          ref={titleRef}
          className="w-full text-2xl font-bold mb-4 bg-transparent border-b border-gray-200 focus:outline-none focus:border-blue-400 text-left"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => handleSave()}
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              setEditTitleMode(false);
              await handleSave();
            }
          }}
          placeholder="제목 없음"
          style={{ wordBreak: "break-all" }}
        />
      )}
      {/* 본문 */}
      <div className="relative w-full flex-1 flex flex-col">
        {editBodyMode ? (
          <>
            <textarea
              ref={bodyRef as unknown as React.RefObject<HTMLTextAreaElement>}
              className="w-full flex-1 text-lg bg-transparent border-b border-gray-200 focus:outline-none focus:border-blue-400 text-left whitespace-pre-line cursor-text min-h-[200px] max-h-full overflow-y-auto"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="본문을 입력하세요"
              style={{
                flexGrow: 1,
                minHeight: 0,
                maxHeight: "100%",
                paddingBottom: 56,
                wordBreak: "break-all",
                background: "transparent",
                outline: "none",
                resize: "none",
                overflowY: "auto",
              }}
              onBlur={() => handleSave()}
            />
          </>
        ) : (
          <div
            ref={bodyRef}
            className="w-full text-lg whitespace-pre-line cursor-pointer text-left flex-1 min-h-[200px]"
            onClick={() => setEditBodyMode(true)}
            style={{ wordBreak: "break-all" }}
            dangerouslySetInnerHTML={{ __html: body }}
          />
        )}
      </div>
      <AlertModal
        open={!!alertMsg}
        title="알림"
        description={alertMsg}
        onClose={() => setAlertMsg("")}
      />
    </div>
  );
};

export default MemoDetailEditor;
