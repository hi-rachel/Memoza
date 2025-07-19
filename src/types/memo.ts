export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_default: boolean; // 기본 태그 여부
  is_important: boolean; // 중요 태그 여부
  is_deletable: boolean; // 삭제 가능 여부
  created_at: string;
  updated_at: string;
}

export interface Memo {
  // 기본 정보
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[]; // 태그 ID 배열
  tag_names?: string[]; // 태그 이름 배열 (검색 최적화) - 선택적 필드

  // 메타데이터
  category?: string;
  priority?: "low" | "medium" | "high";
  status?: "draft" | "active" | "archived";

  // 시간 정보
  created_at: string;
  updated_at: string;

  // AI/검색 최적화 (기본)
  keywords: string[];
  sentiment?: "positive" | "neutral" | "negative";
  language: string;

  // 사용자 인터랙션
  is_starred: boolean;
  view_count: number;
  last_viewed?: string;

  // 버전 관리
  version: number;
  previous_versions: string[];

  // 검색용 텍스트
  searchable_text?: string;
}

export interface TagInfo {
  id: string;
  name: string;
  color: string;
}

export interface MemoSearchFilters {
  tags?: string[];
  tagNames?: string[]; // 태그 이름으로 필터링
  category?: string;
  priority?: string;
  status?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  keywords?: string[];
  sentiment?: string;
}

export interface MemoAnalytics {
  totalMemos: number;
  totalWords: number;
  averageWordsPerMemo: number;
  mostUsedTags: Array<{ tag: TagInfo; count: number }>;
  categoryDistribution: Array<{ category: string; count: number }>;
  sentimentDistribution: Array<{ sentiment: string; count: number }>;
  activityTrend: Array<{ date: string; count: number }>;
}

// 태그별 메모 검색 결과
export interface MemosByTagResult {
  id: string;
  title: string;
  content: string;
  tags: string[];
  tag_names: string[];
  created_at: string;
  updated_at: string;
  is_starred: boolean;
}
