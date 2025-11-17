"use client";

import { useState } from "react";
import { useTags } from "@/hooks/useTags";
import Spinner from "@/components/ui/Spinner";

export function DefaultTagManager() {
  const { tags, updateDefaultTagName, loading } = useTags();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [updating, setUpdating] = useState(false);

  const defaultTag = tags.find((tag) => tag.is_default);

  const handleEdit = () => {
    if (defaultTag) {
      setNewName(defaultTag.name);
      setEditing(true);
    }
  };

  const handleSave = async () => {
    if (!defaultTag || !newName.trim()) return;

    setUpdating(true);
    const result = await updateDefaultTagName(newName.trim());
    setUpdating(false);

    if (result.success) {
      setEditing(false);
    } else {
      alert(result.error || "이름 변경에 실패했습니다.");
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setNewName("");
  };

  if (loading) {
    return <Spinner size="sm" />;
  }

  if (!defaultTag) {
    return <div>기본 태그를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="border rounded-lg p-4 max-w-md">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
          기본 태그
        </span>
        <h3 className="font-semibold">기본 태그 관리</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: defaultTag.color }}
          />
          {editing ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={newName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewName(e.target.value)
                }
                placeholder="새 이름 입력"
                className="flex-1 px-3 py-1 border rounded"
              />
              <button
                onClick={handleSave}
                disabled={updating || !newName.trim()}
                className="px-3 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                저장
              </button>
              <button
                onClick={handleCancel}
                disabled={updating}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <span className="font-medium">{defaultTag.name}</span>
              <button
                onClick={handleEdit}
                className="ml-auto px-2 py-1 text-gray-500 hover:text-gray-700"
              >
                편집
              </button>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>• 모든 메모는 최소 하나의 태그를 가져야 합니다.</p>
          <p>• 태그를 지정하지 않으면 자동으로 이 태그가 할당됩니다.</p>
          <p>• 기본 태그는 삭제할 수 없지만 이름은 변경할 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
}
