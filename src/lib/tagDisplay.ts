import type { Tag } from "@/types/memo";

export function getDisplayTags(tags: Tag[]) {
  return tags.filter((t) => !t.is_important);
}
