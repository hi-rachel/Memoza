import type { Memo, TagInfo } from "@/types/memo";

// 키워드 추출 (간단한 버전)
export function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s가-힣]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 1);

  // 빈도수 기반 키워드 추출 (간단한 버전)
  const wordCount: { [key: string]: number } = {};
  words.forEach((word) => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

// 언어 감지 (간단한 버전)
export function detectLanguage(text: string): string {
  const koreanRegex = /[가-힣]/;
  const englishRegex = /[a-zA-Z]/;

  if (koreanRegex.test(text)) return "ko";
  if (englishRegex.test(text)) return "en";
  return "unknown";
}

// 감정 분석 (간단한 버전)
export function analyzeSentiment(
  text: string
): "positive" | "neutral" | "negative" {
  const positiveWords = [
    "좋다",
    "행복",
    "성공",
    "완료",
    "좋은",
    "훌륭",
    "감사",
    "사랑",
  ];
  const negativeWords = [
    "나쁘다",
    "실패",
    "어렵다",
    "힘들다",
    "슬프다",
    "화나다",
    "짜증",
  ];

  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach((word) => {
    if (lowerText.includes(word)) positiveCount++;
  });

  negativeWords.forEach((word) => {
    if (lowerText.includes(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

// 검색용 텍스트 생성
export function generateSearchableText(
  title: string,
  content: string,
  tags: TagInfo[]
): string {
  const tagNames = tags.map((tag) => tag.name).join(" ");
  return `${title} ${content} ${tagNames}`.toLowerCase();
}

// 메모 생성 시 기본값 설정
export function createMemoData(
  user_id: string,
  title: string,
  content: string,
  tags: string[] = []
): Omit<Memo, "id"> {
  const now = new Date().toISOString();
  const keywords = extractKeywords(`${title} ${content}`);
  const language = detectLanguage(`${title} ${content}`);
  const sentiment = analyzeSentiment(`${title} ${content}`);
  const searchableText = `${title} ${content}`.toLowerCase();

  return {
    user_id,
    title,
    content,
    tags,
    created_at: now,
    updated_at: now,
    keywords,
    language,
    sentiment,
    is_starred: false,
    view_count: 0,
    version: 1,
    previous_versions: [],
    searchable_text: searchableText,
  };
}

// 메모 업데이트 시 데이터 준비
export function updateMemoData(
  existingMemo: Memo,
  updates: Partial<
    Pick<
      Memo,
      "title" | "content" | "tags" | "category" | "priority" | "status"
    >
  >
): Partial<Memo> {
  const updatedData: Partial<Memo> = {
    ...updates,
    updated_at: new Date().toISOString(),
    version: existingMemo.version + 1,
  };

  // 텍스트가 변경된 경우 AI 관련 필드 재계산
  if (updates.title || updates.content) {
    const newTitle = updates.title || existingMemo.title;
    const newContent = updates.content || existingMemo.content;

    updatedData.keywords = extractKeywords(`${newTitle} ${newContent}`);
    updatedData.language = detectLanguage(`${newTitle} ${newContent}`);
    updatedData.sentiment = analyzeSentiment(`${newTitle} ${newContent}`);
    updatedData.searchable_text = `${newTitle} ${newContent}`.toLowerCase();
  }

  return updatedData;
}

// RAG AI를 위한 컨텍스트 생성
export function generateAIContext(memo: Memo): string {
  const context = [
    `제목: ${memo.title}`,
    `내용: ${memo.content}`,
    `태그: ${memo.tags.join(", ")}`,
    `카테고리: ${memo.category || "미분류"}`,
    `우선순위: ${memo.priority || "보통"}`,
    `상태: ${memo.status || "활성"}`,
    `키워드: ${memo.keywords.join(", ")}`,
    `감정: ${memo.sentiment || "중립"}`,
    `작성일: ${new Date(memo.created_at).toLocaleDateString()}`,
  ].join("\n");

  return context;
}

// 메모 검색 최적화
export function createSearchIndex(memo: Memo) {
  return {
    id: memo.id,
    user_id: memo.user_id,
    searchable_text: memo.searchable_text,
    keywords: memo.keywords,
    tags: memo.tags,
    category: memo.category,
    priority: memo.priority,
    status: memo.status,
    sentiment: memo.sentiment,
    language: memo.language,
    created_at: memo.created_at,
    updated_at: memo.updated_at,
    is_starred: memo.is_starred,
  };
}
