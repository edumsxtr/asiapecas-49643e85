import defaultPartImage from "@/assets/asia-box-default.png";

/** Fallback image used across the catalog when a part has no image_url. */
export const DEFAULT_PART_IMAGE = defaultPartImage;

export function partImage(url?: string | null): string {
  return url && url.trim() ? url : DEFAULT_PART_IMAGE;
}
