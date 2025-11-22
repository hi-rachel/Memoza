"use client";

import { useState, useRef, useEffect } from "react";
import { FiSearch, FiChevronLeft, FiMenu } from "react-icons/fi";
import { HiOutlineDotsVertical } from "react-icons/hi";

export default function Header({
  search,
  setSearch,
  onOpenSidebar,
  selectMode,
  onToggleSelectMode,
}: {
  search: string;
  setSearch: (v: string) => void;
  onOpenSidebar?: () => void;
  selectMode?: boolean;
  onToggleSelectMode?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
    // ESC 키로 닫기
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearch("");
      }
    }
    // 헤더 바깥 클릭 시 닫기
    function handleClickOutside(e: MouseEvent) {
      if (
        searchOpen &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
        setSearch("");
      }
    }
    if (searchOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchOpen, setSearch]);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="w-full flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 h-[56px]">
      {searchOpen ? (
        <div className="flex items-center w-full h-full gap-2 animate-fade-in">
          <button
            className="p-2 text-gray-400 hover:text-gray-700"
            onClick={() => {
              setSearchOpen(false);
              setSearch("");
            }}
            aria-label="검색 닫기"
          >
            <FiChevronLeft size={22} />
          </button>
          <input
            ref={inputRef}
            className="flex-1 h-10 px-4 py-2 text-base border-none outline-none bg-white rounded-lg shadow-sm"
            placeholder="제목 또는 본문 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 0 }}
          />
        </div>
      ) : (
        <>
          {/* 좌측: 햄버거 메뉴 */}
          <div className="flex items-center flex-1">
            {onOpenSidebar && (
              <button
                className="p-2 mr-2 rounded-full hover:bg-gray-100 focus:outline-none"
                aria-label="메뉴 열기"
                onClick={onOpenSidebar}
              >
                <FiMenu size={22} />
              </button>
            )}
          </div>
          {/* 우측: 검색, 점세개 메뉴 또는 삭제모드 취소 */}
          <div className="flex-1 flex items-center justify-end gap-2">
            {selectMode ? (
              <button
                className="px-3 py-1 rounded bg-white text-gray-800 border border-gray-200 text-sm font-semibold hover:bg-gray-100 transition"
                onClick={onToggleSelectMode}
              >
                취소
              </button>
            ) : (
              <>
                <button
                  aria-label="검색"
                  className="p-2 text-gray-400 hover:text-gray-700"
                  onClick={() => setSearchOpen(true)}
                >
                  <FiSearch size={22} />
                </button>
                <div className="relative" ref={menuRef}>
                  <button
                    aria-label="더보기"
                    className="p-2 text-gray-400 hover:text-gray-700"
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    <HiOutlineDotsVertical size={22} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-50">
                      <button
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                        onClick={() => {
                          if (onToggleSelectMode) onToggleSelectMode();
                          setMenuOpen(false);
                        }}
                      >
                        {selectMode ? "선택 해제" : "메모 선택"}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </header>
  );
}
