"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FiChevronLeft, FiMoreVertical, FiStar } from "react-icons/fi";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuthUser } from "@/hooks/useAuthUser";
import { usePin } from "@/hooks/usePin";
import { useTags } from "@/hooks/useTags";
import {
  deriveEncryptionKey,
  decryptMemoWithKey,
  encryptMemoWithKey,
} from "@/lib/crypto";
import MemoDetailEditor from "@/components/notes/MemoDetailEditor";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function MemoDetail() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuthUser();
  const { pin } = usePin();
  const { tags: allTags, addTag } = useTags();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagModal, setShowTagModal] = useState(false);
  const [userSalt, setUserSalt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [star, setStar] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [pendingSelection, setPendingSelection] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  // 유저 salt 불러오기
  useEffect(() => {
    async function fetchSalt() {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserSalt(userSnap.data().userSalt || null);
      }
    }
    fetchSalt();
  }, [user]);

  // 메모 불러오기
  useEffect(() => {
    async function fetchMemo() {
      if (!user || !userSalt || !pin || !id) return;
      setLoading(true);
      setError("");
      try {
        const memoRef = doc(db, "memos", id as string);
        const memoSnap = await getDoc(memoRef);
        if (!memoSnap.exists()) {
          setError("메모를 찾을 수 없습니다.");
          setLoading(false);
          return;
        }
        const data = memoSnap.data();
        setStar(!!data.star);
        const encryptionKey = await deriveEncryptionKey(
          user.uid,
          userSalt,
          pin
        );
        let plain = "";
        try {
          plain = await decryptMemoWithKey(data.cipher, data.iv, encryptionKey);
        } catch {
          setError("복호화 실패");
          setLoading(false);
          return;
        }
        try {
          const parsed = JSON.parse(plain);
          setTitle(parsed.title ?? "");
          setBody(parsed.body ?? "");
          setSelectedTags(data.tags || []);
        } catch {
          const [first, ...rest] = plain.split("\n");
          setTitle(first);
          setBody(rest.join("\n"));
          setSelectedTags(data.tags || []);
        }
      } catch {
        setError("메모 불러오기 실패");
      }
      setLoading(false);
    }
    fetchMemo();
  }, [user, userSalt, pin, id]);

  // 제목/본문 수정 진입 시 포커스
  useEffect(() => {
    if (titleRef.current?.focus) titleRef.current?.focus();
    if (bodyRef.current?.focus) bodyRef.current?.focus();
  }, []);

  // 자동 저장
  async function saveMemo(newTitle: string, newBody: string, tags?: string[]) {
    if (!user || !userSalt || !pin || !id) return;
    try {
      const encryptionKey = await deriveEncryptionKey(user.uid, userSalt, pin);
      const { cipher, iv } = await encryptMemoWithKey(
        JSON.stringify({ title: newTitle, body: newBody }),
        encryptionKey
      );
      await updateDoc(doc(db, "memos", id as string), {
        cipher,
        iv,
        tags: tags ?? selectedTags,
      });
    } catch {
      setError("저장 실패");
    }
  }

  // 별 토글
  async function toggleStar() {
    if (!id) return;
    const importantTag = allTags.find((t) => t.name === "중요");
    if (!importantTag) return;
    const newStar = !star;
    setStar(newStar);
    let newTags = [...selectedTags];
    if (newStar) {
      // 중요 태그 추가 (중복 없이)
      if (!newTags.includes(importantTag.id)) newTags.unshift(importantTag.id);
    } else {
      // 중요 태그 제거
      newTags = newTags.filter((tid) => tid !== importantTag.id);
    }
    setSelectedTags(newTags);
    await updateDoc(doc(db, "memos", id as string), {
      star: newStar,
      tags: newTags,
    });
  }

  useEffect(() => {
    if (!pendingSelection || !bodyRef.current) return;
    bodyRef.current.focus();
    const el = bodyRef.current;
    const selection = window.getSelection();
    const range = document.createRange();
    let charIndex = 0;
    let startNode: Node | null = null;
    let endNode: Node | null = null;
    let startOffset = 0;
    let endOffset = 0;
    function findTextNode(node: Node, pending: { start: number; end: number }) {
      if (node.nodeType === Node.TEXT_NODE) {
        const len = (node.textContent || "").length;
        if (!startNode && charIndex + len >= pending.start) {
          startNode = node;
          startOffset = pending.start - charIndex;
        }
        if (!endNode && charIndex + len >= pending.end) {
          endNode = node;
          endOffset = pending.end - charIndex;
        }
        charIndex += len;
      } else {
        node.childNodes.forEach((child) => findTextNode(child, pending));
      }
    }
    findTextNode(el, pendingSelection);
    if (startNode && endNode && selection) {
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    setPendingSelection(null);
  }, [body, pendingSelection]);

  // editBodyMode 진입 시에만 body -> innerHTML 동기화
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.innerHTML = body;
    }
  }, [body]);
  // editBodyMode 종료 시 body -> innerHTML 동기화(보기 모드용)
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.innerHTML = body;
    }
  }, [body]);

  // MemoDetailEditor에 넘길 onSave 래퍼
  const handleSave = async (tagsOverride?: string[]) => {
    await saveMemo(title, body, tagsOverride ?? selectedTags);
  };
  // addTag를 MemoDetailEditor에 넘길 때 반환값을 무시하고 Promise<void>로 맞춘다
  const addTagWrapper = async (tag: { name: string; color: string }) => {
    const result = await addTag(tag);
    if (!result) throw new Error("태그 추가 실패");
    return result;
  };

  // 메모 삭제 함수
  async function handleDelete() {
    if (!id) return;
    await deleteDoc(doc(db, "memos", id as string)); // 완전 삭제
    router.push("/notes");
  }

  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트(페이지 이동) 시 마지막 저장
      saveMemo(title, body, selectedTags);
    };
  }, []);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      {/* 상단 바 */}
      <div className="h-[56px] flex items-center px-4 py-2 border-b border-gray-200 bg-white/80 sticky top-0 z-30">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-400 hover:text-black"
        >
          <FiChevronLeft size={22} />
        </button>
        <div className="flex-1 flex items-center justify-end gap-2">
          <button
            className={
              star ? "text-yellow-400" : "text-gray-400 hover:text-yellow-400"
            }
            onClick={toggleStar}
            aria-label="중요 표시"
          >
            <FiStar size={22} fill={star ? "#facc15" : "none"} />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-gray-700"
            onClick={() => setDeleteAlertOpen((v) => !v)}
            aria-label="더보기"
          >
            <FiMoreVertical size={22} />
          </button>
        </div>
      </div>
      {/* 본문 */}
      <MemoDetailEditor
        title={title}
        setTitle={setTitle}
        body={body}
        setBody={setBody}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        allTags={allTags}
        onSave={handleSave}
        loading={loading}
        showTagModal={showTagModal}
        setShowTagModal={setShowTagModal}
        addTag={addTagWrapper}
        alertMsg={alertMsg}
        setAlertMsg={setAlertMsg}
      />
      {/* 삭제 확인 모달 */}
      <ConfirmModal
        open={deleteAlertOpen}
        title="영구 삭제"
        description={
          "이 메모를 영구적으로 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다."
        }
        confirmText="삭제"
        cancelText="취소"
        onCancel={() => setDeleteAlertOpen(false)}
        onConfirm={async () => {
          setDeleteAlertOpen(false);
          await handleDelete();
        }}
      />
    </div>
  );
}
