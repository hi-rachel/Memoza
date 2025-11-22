import { sortTags, getDisplayTags } from "../tagDisplay";
import type { Tag } from "@/types/memo";

describe("tagDisplay", () => {
  const baseTime = new Date("2024-01-01T00:00:00Z").toISOString();

  const createTag = (overrides: Partial<Tag>): Tag => ({
    id: overrides.id ?? "id",
    user_id: overrides.user_id ?? "user-1",
    name: overrides.name ?? "name",
    color: overrides.color ?? "#ffffff",
    created_at: overrides.created_at ?? baseTime,
    updated_at: overrides.updated_at ?? baseTime,
    is_default: overrides.is_default ?? false,
    is_deletable: overrides.is_deletable ?? true,
    is_important: overrides.is_important ?? false,
  });

  it("sortTags: 중요 태그를 가장 먼저 정렬한다", () => {
    const tags: Tag[] = [
      createTag({ id: "1", name: "일반", created_at: "2024-01-02T00:00:00Z" }),
      createTag({
        id: "2",
        name: "중요",
        is_important: true,
        created_at: "2024-01-03T00:00:00Z",
      }),
      createTag({
        id: "3",
        name: "기본",
        is_default: true,
        created_at: "2024-01-01T00:00:00Z",
      }),
    ];

    const sorted = sortTags(tags);

    expect(sorted[0].id).toBe("2"); // 중요
    expect(sorted[1].id).toBe("3"); // 기본
  });

  it("sortTags: 생성일이 빠른 순서로 정렬한다 (중요/기본 제외)", () => {
    const tags: Tag[] = [
      createTag({
        id: "1",
        name: "늦게 생성",
        created_at: "2024-01-03T00:00:00Z",
      }),
      createTag({
        id: "2",
        name: "먼저 생성",
        created_at: "2024-01-01T00:00:00Z",
      }),
      createTag({
        id: "3",
        name: "중간 생성",
        created_at: "2024-01-02T00:00:00Z",
      }),
    ];

    const sorted = sortTags(tags);

    expect(sorted.map((t) => t.id)).toEqual(["2", "3", "1"]);
  });

  it("getDisplayTags: 중요 태그를 제외한 태그만 반환한다", () => {
    const tags: Tag[] = [
      createTag({ id: "1", is_important: true }),
      createTag({ id: "2", is_important: false }),
    ];

    const displayTags = getDisplayTags(tags);

    expect(displayTags.map((t) => t.id)).toEqual(["2"]);
  });
});
