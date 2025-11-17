import type { Tag } from "@/types/memo";

/**
 * 태그를 일관된 순서로 정렬합니다:
 * 1. 중요 태그 (is_important=true)
 * 2. 기본 태그 (is_default=true)
 * 3. 나머지는 생성일 오름차순
 */
export function sortTags(tags: Tag[]): Tag[] {
  return [...tags].sort((a, b) => {
    // 1. 중요 태그 우선
    if (a.is_important && !b.is_important) return -1;
    if (!a.is_important && b.is_important) return 1;

    // 2. 기본 태그 우선 (중요 태그가 아닌 경우)
    if (!a.is_important && !b.is_important) {
      if (a.is_default && !b.is_default) return -1;
      if (!a.is_default && b.is_default) return 1;
    }

    // 3. 생성일 오름차순
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateA - dateB;
  });
}

export function getDisplayTags(tags: Tag[]) {
  return tags.filter((t) => !t.is_important);
}
