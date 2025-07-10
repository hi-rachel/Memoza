"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  QueryDocumentSnapshot,
  DocumentData,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { useAuthUser } from "./useAuthUser";

export interface Tag {
  id: string; // Firestore 문서 ID
  name: string;
  color: string;
}

export function useTags() {
  const { user } = useAuthUser();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [defaultTagId, setDefaultTagId] = useState<string | null>(null);

  // Firestore에서 defaultTagId 읽기
  useEffect(() => {
    if (!user) return;
    const fetchDefaultTagId = async () => {
      const metaRef = doc(db, "users", user.uid, "meta", "defaultTagId");
      const metaSnap = await getDoc(metaRef);
      if (metaSnap.exists()) {
        setDefaultTagId(metaSnap.data().id);
      }
    };
    fetchDefaultTagId();
  }, [user]);

  // 태그 실시간 구독 및 defaultTagId 없으면 생성
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = collection(db, "users", user.uid, "tags");
    const unsub = onSnapshot(
      q,
      async (snap) => {
        const arr: Tag[] = [];
        snap.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
          const data = docSnap.data() as Omit<Tag, "id">;
          arr.push({ id: docSnap.id, ...data });
        });
        setTags(arr);
        // defaultTagId가 없으면 '기본' 태그를 최초 1회만 생성 및 meta에 저장
        if (!defaultTagId && user) {
          // 이미 태그가 하나도 없으면 새로 생성
          if (arr.length === 0) {
            const docRef = await addDoc(
              collection(db, "users", user.uid, "tags"),
              {
                name: "기본",
                color: "#2EE6D6",
              }
            );
            const metaRef = doc(db, "users", user.uid, "meta", "defaultTagId");
            await setDoc(metaRef, { id: docRef.id });
            setDefaultTagId(docRef.id);
          } else {
            // 태그가 하나라도 있으면 그 중 첫 번째 태그를 defaultTagId로 지정
            const firstTag = arr[0];
            const metaRef = doc(db, "users", user.uid, "meta", "defaultTagId");
            await setDoc(metaRef, { id: firstTag.id });
            setDefaultTagId(firstTag.id);
          }
        }
        setLoading(false);
      },
      () => {
        setError("태그 불러오기 실패");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user, defaultTagId]);

  // 태그 추가
  const addTag = useCallback(
    async (tag: Omit<Tag, "id">) => {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        const docRef = await addDoc(
          collection(db, "users", user.uid, "tags"),
          tag
        );
        setLoading(false);
        return docRef;
      } catch {
        setError("태그 추가 실패");
        setLoading(false);
        return undefined;
      }
    },
    [user]
  );

  // 태그 수정
  const updateTag = useCallback(
    async (id: string, tag: Partial<Omit<Tag, "id">>) => {
      if (!user) return;
      setLoading(true);
      setError("");
      try {
        await updateDoc(doc(db, "users", user.uid, "tags", id), tag);
      } catch {
        setError("태그 수정 실패");
      }
      setLoading(false);
    },
    [user]
  );

  // 태그 삭제
  const deleteTag = useCallback(
    async (id: string) => {
      if (!user) return;
      if (id === defaultTagId) return; // defaultTagId는 삭제 불가
      setLoading(true);
      setError("");
      try {
        await deleteDoc(doc(db, "users", user.uid, "tags", id));
      } catch {
        setError("태그 삭제 실패");
      }
      setLoading(false);
    },
    [user, defaultTagId]
  );

  return { tags, loading, error, addTag, updateTag, deleteTag, defaultTagId };
}
