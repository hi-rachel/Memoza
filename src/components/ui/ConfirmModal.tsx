import React from "react";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = "확인",
  description,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in"
      tabIndex={-1}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs flex flex-col gap-4 outline-none"
        tabIndex={0}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-lg font-bold text-gray-900">{title}</div>
        <div className="text-gray-600 text-sm whitespace-pre-line">
          {description}
        </div>
        <div className="flex gap-2 mt-2">
          <button
            className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className="flex-1 py-2 rounded-xl bg-black text-white font-semibold hover:bg-gray-900 transition"
            onClick={onConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
