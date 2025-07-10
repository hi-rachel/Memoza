"use client";

import { PALETTE } from "@/constants/colors";
import React, { useEffect, useState } from "react";

interface TagCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
  initialName?: string;
  initialColor?: string;
  mode?: "edit" | "create";
}

export default function TagCreateModal({
  open,
  onClose,
  onCreate,
  initialName = "",
  initialColor = PALETTE[0],
  mode = "create",
}: TagCreateModalProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [error, setError] = useState("");

  // prop이 바뀔 때마다 값 동기화 (특히 수정 모달 재사용 시)
  useEffect(() => {
    setName(initialName);
    setColor(initialColor);
  }, [initialName, initialColor]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("태그 이름을 입력하세요");
      return;
    }
    if (name.length < 1 || name.length > 20) {
      setError("태그 이름은 1~20자여야 합니다");
      return;
    }
    onCreate(name.trim(), color);
    if (mode === "create") {
      setName("");
      setColor(PALETTE[0]);
      setError("");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center animate-fade-in">
      <form
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs flex flex-col gap-4"
        onSubmit={handleSubmit}
      >
        <div className="text-lg font-bold text-text">
          {mode === "edit" ? "태그 수정" : "새 태그 만들기"}
        </div>
        <input
          className="border-2 border-border rounded-xl p-2 focus:outline-none focus:border-mint transition bg-bg"
          placeholder="태그 이름 (1~20자)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
        />
        <div className="flex flex-wrap gap-2 items-center">
          {PALETTE.map((c) => (
            <button
              type="button"
              key={c}
              className={`w-7 h-7 rounded-full border-2 ${
                color === c ? "border-mint ring-2 ring-mint" : "border-border"
              }`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
          <label
            className="relative w-7 h-7 cursor-pointer"
            title="직접 색상 선택"
          >
            {/* 미리보기 원: 선택 전에는 그라데이션, 선택 후에는 해당 색상 */}
            {color === initialColor ? (
              <span
                className="absolute inset-0 w-full h-full rounded-full border-2 border-border pointer-events-none"
                style={{
                  background:
                    "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
                }}
                title="선택된 색상 미리보기"
              />
            ) : (
              <span
                className="absolute inset-0 w-full h-full rounded-full border-2 border-border pointer-events-none"
                style={{ backgroundColor: color }}
                title="선택된 색상 미리보기"
              />
            )}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {/* 그라데이션 원 아이콘 (아래에 살짝 보이도록 z-index 낮게) */}
            <span
              className="block w-7 h-7 rounded-full border-2 border-border"
              style={{
                background:
                  "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)",
                zIndex: 0,
              }}
            />
          </label>
        </div>
        {error && <div className="text-red-500 text-xs">{error}</div>}
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            className="flex-1 py-2 rounded-xl bg-gray-200 text-gray-700 font-bold shadow hover:bg-gray-300 transition"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 py-2 rounded-xl text-white font-semibold shadow hover:brightness-95 transition focus:ring-2 focus:ring-blue-400 bg-black"
          >
            {mode === "edit" ? "수정" : "생성"}
          </button>
        </div>
      </form>
    </div>
  );
}
