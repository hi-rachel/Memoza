"use client";

import { useAuthUser } from "@/hooks/useAuthUser";
import LogoutButton from "./LogoutButton";
import { FiSettings } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function UserInfoPanel() {
  const { user } = useAuthUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [menuOpen]);

  if (!user) return null;
  const name =
    user.user_metadata?.full_name || user.user_metadata?.name || "User";
  const email = user.email || "-";
  const photo = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const initial = name[0]?.toUpperCase() || "U";

  return (
    <div className="w-full flex flex-col border-t border-gray-100 relative">
      <div className="flex items-center w-full m-0">
        {photo ? (
          <Image
            width={32}
            height={32}
            src={photo}
            alt="프로필"
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-base font-bold text-gray-600 border border-gray-200">
            {initial}
          </div>
        )}
        <span className="text-sm font-semibold text-black truncate max-w-[90px] ml-2">
          {name}
        </span>
        <div className="relative ml-auto">
          <button
            className="p-1 text-gray-400 hover:text-black rounded-full focus:outline-none"
            aria-label="설정"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <FiSettings size={16} />
          </button>
          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-50 animate-fade-in"
            >
              <LogoutButton className="w-full text-left px-4 py-2 hover:bg-gray-100" />
            </div>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-500 truncate max-w-full mt-2 mb-1">
        {email}
      </div>
    </div>
  );
}
