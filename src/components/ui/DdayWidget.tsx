"use client";

import { useState } from "react";
import {
  FiCalendar,
  FiPlus,
  FiX,
  FiTag,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
} from "react-icons/fi";
import { useTags } from "@/hooks/useTags";
import { useDday } from "@/hooks/useDday";
import TagSelector from "@/components/tags/TagSelector";
import TagCreateModal from "@/components/tags/TagCreateModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import AlertModal from "@/components/ui/AlertModal";
import type { DdayEvent } from "@/types/dday";

export default function DdayWidget() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    tags: [] as string[],
  });
  const { tags: allTags, createTag } = useTags();
  const { events, loading, error, createEvent, updateEvent, deleteEvent } =
    useDday();
  const [showTagModal, setShowTagModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingEvent, setEditingEvent] = useState<DdayEvent | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  // D-Day 계산
  const calculateDday = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();

    // 시간을 00:00:00으로 설정하여 날짜만 비교
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "D-Day";
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
  };

  // 알림 표시
  const showAlertMessage = (message: string) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  // 이벤트 추가
  const addEvent = async () => {
    // 제목 검증
    if (!newEvent.title.trim()) {
      showAlertMessage("제목을 입력하세요.");
      return;
    }

    // 날짜 검증
    if (!newEvent.date) {
      showAlertMessage("날짜를 입력하세요.");
      return;
    }

    // 과거 날짜 검증 (선택사항)
    const selectedDate = new Date(newEvent.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      showAlertMessage("오늘 이후의 날짜를 선택하세요.");
      return;
    }

    try {
      await createEvent({
        title: newEvent.title.trim(),
        event_date: newEvent.date,
        tags: newEvent.tags,
      });

      setNewEvent({ title: "", date: "", tags: [] });
      setShowAddForm(false);
    } catch {
      showAlertMessage("이벤트 추가에 실패했습니다.");
    }
  };

  // 이벤트 삭제 확인
  const confirmDelete = (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteConfirm(true);
  };

  // 이벤트 삭제 실행
  const handleDeleteEvent = async () => {
    if (pendingDeleteId) {
      try {
        await deleteEvent(pendingDeleteId);
        setPendingDeleteId(null);
        setShowDeleteConfirm(false);
      } catch {
        showAlertMessage("이벤트 삭제에 실패했습니다.");
      }
    }
  };

  // 이벤트 편집 시작
  const startEdit = () => {
    if (events.length === 0) return;
    setEditingEvent(events[currentIndex]);
    setShowEditForm(true);
  };

  // 이벤트 편집 저장
  const saveEdit = async () => {
    if (!editingEvent) return;

    // 제목 검증
    if (!editingEvent.title.trim()) {
      showAlertMessage("제목을 입력하세요.");
      return;
    }

    // 날짜 검증
    if (!editingEvent.event_date) {
      showAlertMessage("날짜를 입력하세요.");
      return;
    }

    // 과거 날짜 검증 (선택사항)
    const selectedDate = new Date(editingEvent.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      showAlertMessage("오늘 이후의 날짜를 선택하세요.");
      return;
    }

    try {
      await updateEvent(editingEvent.id, {
        title: editingEvent.title.trim(),
        event_date: editingEvent.event_date,
        tags: editingEvent.tags,
      });

      setEditingEvent(null);
      setShowEditForm(false);
    } catch {
      showAlertMessage("이벤트 수정에 실패했습니다.");
    }
  };

  // 이벤트 편집 취소
  const cancelEdit = () => {
    setEditingEvent(null);
    setShowEditForm(false);
  };

  // 슬라이드 네비게이션
  const nextSlide = () => {
    if (events.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }
  };

  const prevSlide = () => {
    if (events.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
    }
  };

  // 태그 색상 가져오기 (첫 번째 태그 색상 사용, 없으면 기본색)
  const getEventColor = (event: DdayEvent) => {
    if (event.tags && event.tags.length > 0) {
      const firstTag = allTags.find((tag) => tag.id === event.tags[0]);
      return firstTag?.color || "#3B82F6";
    }
    return "#3B82F6"; // 기본색
  };

  // 에러 표시
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
        <div className="text-red-500 text-center">
          D-Day 로딩 중 오류가 발생했습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-gray-600" size={18} />
          <h3 className="font-semibold text-gray-800">D-Day</h3>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <FiPlus size={16} className="text-gray-600" />
        </button>
      </div>

      {/* D-Day 이벤트 슬라이드 */}
      <div className="relative">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">로딩 중...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">D-Day 이벤트를 추가해보세요</p>
          </div>
        ) : (
          <>
            {/* 현재 이벤트 */}
            <div className="flex items-center justify-between p-4 rounded-md bg-gray-50 min-h-[80px]">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: getEventColor(events[currentIndex]),
                  }}
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-800">
                    {events[currentIndex].title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(
                      events[currentIndex].event_date
                    ).toLocaleDateString("ko-KR")}
                  </div>
                  {/* 태그 표시 */}
                  {events[currentIndex].tags &&
                    events[currentIndex].tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {events[currentIndex].tags.map((tagId) => {
                          const tag = allTags.find((t) => t.id === tagId);
                          return tag ? (
                            <span
                              key={tagId}
                              className="px-1.5 py-0.5 text-xs rounded-full text-white"
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded text-sm font-bold text-white"
                  style={{
                    backgroundColor: getEventColor(events[currentIndex]),
                  }}
                >
                  {calculateDday(events[currentIndex].event_date)}
                </span>
                <button
                  onClick={startEdit}
                  className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                  title="편집"
                >
                  <FiEdit2 size={14} className="text-gray-500" />
                </button>
                <button
                  onClick={() => confirmDelete(events[currentIndex].id)}
                  className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                  title="삭제"
                >
                  <FiX size={14} className="text-gray-500" />
                </button>
              </div>
            </div>

            {/* 슬라이드 네비게이션 */}
            {events.length > 1 && (
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={prevSlide}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FiChevronLeft size={16} className="text-gray-600" />
                </button>

                {/* 인디케이터 */}
                <div className="flex gap-1">
                  {events.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentIndex ? "bg-gray-600" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextSlide}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FiChevronRight size={16} className="text-gray-600" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 이벤트 추가 폼 */}
      {showAddForm && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="이벤트 제목"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) =>
                setNewEvent({ ...newEvent, date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* 태그 선택 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FiTag className="text-gray-600" size={14} />
                <span className="text-sm text-gray-600">태그:</span>
              </div>
              <TagSelector
                tags={allTags}
                selected={newEvent.tags}
                onChange={(tags) => setNewEvent({ ...newEvent, tags })}
                onAddTag={() => setShowTagModal(true)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addEvent}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 태그 생성 모달 */}
      {showTagModal && (
        <TagCreateModal
          open={showTagModal}
          onClose={() => setShowTagModal(false)}
          onCreate={async (name: string, color: string) => {
            const result = await createTag(name, color);
            if (result.data) {
              // 새로 생성된 태그를 선택된 태그에 추가
              setNewEvent({
                ...newEvent,
                tags: [...newEvent.tags, result.data.id],
              });
            }
          }}
        />
      )}

      {/* 이벤트 편집 폼 */}
      {showEditForm && editingEvent && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <FiEdit2 className="text-gray-600" size={14} />
              <span className="text-sm font-semibold text-gray-700">
                이벤트 편집
              </span>
            </div>

            <input
              type="text"
              placeholder="이벤트 제목"
              value={editingEvent.title}
              onChange={(e) =>
                setEditingEvent({ ...editingEvent, title: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="date"
              value={editingEvent.event_date}
              onChange={(e) =>
                setEditingEvent({ ...editingEvent, event_date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* 태그 선택 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FiTag className="text-gray-600" size={14} />
                <span className="text-sm text-gray-600">태그:</span>
              </div>
              <TagSelector
                tags={allTags}
                selected={editingEvent.tags}
                onChange={(tags) => setEditingEvent({ ...editingEvent, tags })}
                onAddTag={() => setShowTagModal(true)}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
              >
                저장
              </button>
              <button
                onClick={cancelEdit}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        open={showDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setPendingDeleteId(null);
        }}
        onConfirm={handleDeleteEvent}
        title="D-Day 이벤트 삭제"
        description="정말로 이 D-Day 이벤트를 삭제하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
      />

      {/* 알림 모달 */}
      <AlertModal
        open={showAlert}
        onClose={() => setShowAlert(false)}
        description={alertMessage}
      />
    </div>
  );
}
