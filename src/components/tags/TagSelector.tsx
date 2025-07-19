"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import { Tag } from "@/types/memo";

interface TagSelectorProps {
  tags: Tag[];
  selected: string[];
  onChange: (tags: string[]) => void;
  onAddTag?: () => void;
  className?: string;
  hideDeleteFor?: string[];
}

export default function TagSelector({
  tags,
  selected,
  onChange,
  onAddTag,
  className,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedTag = tags.find((t) => t.id === (selected[0] || tags[0]?.id));

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className={`relative min-w-[140px] ${className || ""}`} ref={ref}>
      <button
        type="button"
        className={`inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-gray-400 min-w-[120px]${
          className ? ` ${className}` : ""
        }`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selectedTag && (
          <span
            className="flex items-center gap-1"
            style={
              {
                "--tag-color": selectedTag.color || "var(--color-tag-default",
              } as React.CSSProperties
            }
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full mr-1"
              style={{ backgroundColor: "var(--tag-color)" }}
            />
            <span className="truncate max-w-[80px] text-text">
              {selectedTag.name}
            </span>
          </span>
        )}
        <FiChevronDown className="ml-2" />
      </button>
      {open && (
        <ul
          className="absolute left-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-full animate-fade-in"
          role="listbox"
        >
          {tags.map((tag: Tag) => (
            <li
              key={tag.id}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer select-none text-sm text-text rounded transition ${
                selected[0] === tag.id ? "bg-gray-200" : "bg-white"
              } hover:bg-gray-100`}
              style={{
                ["--tag-color" as string]:
                  tag.color || "var(--color-tag-default)",
              }}
              onClick={() => {
                onChange([tag.id]);
                setOpen(false);
              }}
              role="option"
              aria-selected={selected[0] === tag.id}
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full mr-1"
                style={{ backgroundColor: "var(--tag-color)" }}
              />
              <span className="truncate max-w-[80px]">{tag.name}</span>
            </li>
          ))}
          <li className="h-px bg-gray-100 my-1" />
          <li
            className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none text-sm text-black hover:bg-gray-100 focus:bg-gray-200 rounded"
            onClick={() => {
              setOpen(false);
              if (onAddTag) onAddTag();
            }}
            role="option"
            aria-selected={false}
          >
            + 새 태그
          </li>
        </ul>
      )}
    </div>
  );
}
