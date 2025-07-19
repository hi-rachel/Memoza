export interface DdayEvent {
  id: string;
  user_id: string;
  title: string;
  event_date: string; // YYYY-MM-DD 형식
  tags: string[]; // 태그 ID 배열
  created_at: string;
  updated_at: string;
}

export interface CreateDdayEventData {
  title: string;
  event_date: string;
  tags: string[];
}

export interface UpdateDdayEventData {
  title?: string;
  event_date?: string;
  tags?: string[];
}
