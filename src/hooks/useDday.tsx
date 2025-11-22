"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
import { encrypt, decrypt, decryptBatch } from "@/lib/encryption-client";
import type {
  DdayEvent,
  CreateDdayEventData,
  UpdateDdayEventData,
} from "@/types/dday";

export function useDday() {
  const [events, setEvents] = useState<DdayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthUser();

  const supabase = createClient();

  /** 이벤트를 event_date 기준으로 오름차순 정렬하는 헬퍼 함수 */
  const sortEventsByDate = (eventsList: DdayEvent[]): DdayEvent[] => {
    return [...eventsList].sort((a, b) => {
      const dateA = new Date(a.event_date).getTime();
      const dateB = new Date(b.event_date).getTime();
      return dateA - dateB;
    });
  };

  // D-day 이벤트 목록 가져오기
  const fetchEvents = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("dday_events")
        .select("id,user_id,title,event_date,tags,created_at,updated_at")
        .eq("user_id", user.id)
        .order("event_date", { ascending: true });

      if (error) {
        console.error("D-day 이벤트 가져오기 오류:", error);
        setError("D-day 이벤트를 가져오는데 실패했습니다.");
        return;
      }

      const eventsData = (data || []) as DdayEvent[];

      if (eventsData.length === 0) {
        setEvents([]);
        return;
      }

      try {
        const titles = eventsData.map((e) => e.title || "");
        const decryptedTitles = await decryptBatch(titles);

        const decryptedEvents: DdayEvent[] = eventsData.map((event, idx) => ({
          ...event,
          title: decryptedTitles[idx] ?? event.title ?? "",
        }));

        setEvents(sortEventsByDate(decryptedEvents));
      } catch (decryptError) {
        console.error(
          "D-day 이벤트 제목 복호화 실패, 원본 데이터 사용:",
          decryptError
        );
        setEvents(sortEventsByDate(eventsData));
      }
    } catch (err) {
      console.error("D-day 이벤트 가져오기 예외:", err);
      setError("D-day 이벤트를 가져오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // D-day 이벤트 생성
  const createEvent = async (eventData: CreateDdayEventData) => {
    if (!user) {
      throw new Error("사용자 인증이 필요합니다.");
    }

    try {
      // 제목 암호화
      let encryptedTitle: string;
      try {
        encryptedTitle = eventData.title ? await encrypt(eventData.title) : "";
      } catch (encryptError) {
        console.error("D-day 이벤트 제목 암호화 실패:", encryptError);
        throw new Error("D-day 이벤트 생성에 실패했습니다.");
      }

      const { data, error } = await supabase
        .from("dday_events")
        .insert([
          {
            user_id: user.id,
            title: encryptedTitle,
            event_date: eventData.event_date,
            tags: eventData.tags,
          },
        ])
        .select("id,user_id,title,event_date,tags,created_at,updated_at")
        .single();

      if (error) {
        console.error("D-day 이벤트 생성 오류:", error);
        throw new Error("D-day 이벤트 생성에 실패했습니다.");
      }

      // 상태에는 복호화된 제목으로 저장
      const decryptedEvent: DdayEvent = {
        ...(data as DdayEvent),
        title: eventData.title,
      };

      setEvents((prev) => sortEventsByDate([...prev, decryptedEvent]));
      return { data: decryptedEvent, error: null };
    } catch (err) {
      console.error("D-day 이벤트 생성 예외:", err);
      throw err;
    }
  };

  // D-day 이벤트 수정
  const updateEvent = async (id: string, eventData: UpdateDdayEventData) => {
    if (!user) {
      throw new Error("사용자 인증이 필요합니다.");
    }

    try {
      // 제목이 변경되는 경우 암호화해서 업데이트
      const processedUpdates: UpdateDdayEventData = { ...eventData };
      if (eventData.title !== undefined) {
        try {
          processedUpdates.title = eventData.title
            ? await encrypt(eventData.title)
            : "";
        } catch (encryptError) {
          console.error("D-day 이벤트 제목 암호화 실패:", encryptError);
          throw new Error("D-day 이벤트 수정에 실패했습니다.");
        }
      }

      const { data, error } = await supabase
        .from("dday_events")
        .update(processedUpdates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select("id,user_id,title,event_date,tags,created_at,updated_at")
        .single();

      if (error) {
        console.error("D-day 이벤트 수정 오류:", error);
        throw new Error("D-day 이벤트 수정에 실패했습니다.");
      }

      // 상태에는 복호화된 제목으로 저장
      const decryptedEvent: DdayEvent = {
        ...(data as DdayEvent),
        title:
          eventData.title !== undefined
            ? eventData.title
            : (data as DdayEvent).title,
      };

      setEvents((prev) =>
        sortEventsByDate(
          prev.map((event) => (event.id === id ? decryptedEvent : event))
        )
      );
      return { data: decryptedEvent, error: null };
    } catch (err) {
      console.error("D-day 이벤트 수정 예외:", err);
      throw err;
    }
  };

  // D-day 이벤트 삭제
  const deleteEvent = async (id: string) => {
    if (!user) {
      throw new Error("사용자 인증이 필요합니다.");
    }

    try {
      const { error } = await supabase
        .from("dday_events")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("D-day 이벤트 삭제 오류:", error);
        throw new Error("D-day 이벤트 삭제에 실패했습니다.");
      }

      setEvents((prev) => prev.filter((event) => event.id !== id));
      return { error: null };
    } catch (err) {
      console.error("D-day 이벤트 삭제 예외:", err);
      throw err;
    }
  };

  // 실시간 구독 설정
  useEffect(() => {
    if (!user) return;

    // 초기 데이터 로드
    fetchEvents();

    // 실시간 구독
    const channel = supabase
      .channel("dday_events_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dday_events",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newEvent = payload.new as DdayEvent;
            (async () => {
              try {
                const decryptedTitle = newEvent.title
                  ? await decrypt(newEvent.title)
                  : "";
                const decryptedEvent: DdayEvent = {
                  ...newEvent,
                  title: decryptedTitle,
                };
                setEvents((prev) =>
                  sortEventsByDate([...prev, decryptedEvent])
                );
              } catch (err) {
                console.error("실시간 D-day 이벤트 복호화 실패:", err);
                setEvents((prev) => sortEventsByDate([...prev, newEvent]));
              }
            })();
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as DdayEvent;
            (async () => {
              try {
                const decryptedTitle = updated.title
                  ? await decrypt(updated.title)
                  : "";
                const decryptedEvent: DdayEvent = {
                  ...updated,
                  title: decryptedTitle,
                };
                setEvents((prev) =>
                  sortEventsByDate(
                    prev.map((event) =>
                      event.id === updated.id ? decryptedEvent : event
                    )
                  )
                );
              } catch (err) {
                console.error("실시간 D-day 이벤트 복호화 실패:", err);
                setEvents((prev) =>
                  sortEventsByDate(
                    prev.map((event) =>
                      event.id === updated.id ? updated : event
                    )
                  )
                );
              }
            })();
          } else if (payload.eventType === "DELETE") {
            setEvents((prev) =>
              prev.filter((event) => event.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    fetchEvents,
  };
}
