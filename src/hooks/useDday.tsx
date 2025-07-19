"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthUser } from "@/hooks/useAuthUser";
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

  // D-day 이벤트 목록 가져오기
  const fetchEvents = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("dday_events")
        .select("*")
        .eq("user_id", user.id)
        .order("event_date", { ascending: true });

      if (error) {
        console.error("D-day 이벤트 가져오기 오류:", error);
        setError("D-day 이벤트를 가져오는데 실패했습니다.");
        return;
      }

      setEvents(data || []);
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
      const { data, error } = await supabase
        .from("dday_events")
        .insert([
          {
            user_id: user.id,
            title: eventData.title,
            event_date: eventData.event_date,
            tags: eventData.tags,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("D-day 이벤트 생성 오류:", error);
        throw new Error("D-day 이벤트 생성에 실패했습니다.");
      }

      setEvents((prev) => [...prev, data]);
      return { data, error: null };
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
      const { data, error } = await supabase
        .from("dday_events")
        .update(eventData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("D-day 이벤트 수정 오류:", error);
        throw new Error("D-day 이벤트 수정에 실패했습니다.");
      }

      setEvents((prev) =>
        prev.map((event) => (event.id === id ? data : event))
      );
      return { data, error: null };
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
            setEvents((prev) => [...prev, payload.new as DdayEvent]);
          } else if (payload.eventType === "UPDATE") {
            setEvents((prev) =>
              prev.map((event) =>
                event.id === payload.new.id ? (payload.new as DdayEvent) : event
              )
            );
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
