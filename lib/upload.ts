import { randomUUID } from "node:crypto";
import path from "node:path";
import { MAX_IMAGE_SIZE_BYTES } from "@/lib/constants";
import { getStorageBucket, getSupabaseAdminClient } from "@/lib/supabase-storage";

const MIME_EXTENSIONS = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"]
]);

export function validateStoragePath(relativePath: string) {
  const normalizedRelativePath = path.posix.normalize(relativePath);
  if (
    normalizedRelativePath.startsWith("..") ||
    normalizedRelativePath.startsWith("/") ||
    path.win32.isAbsolute(normalizedRelativePath)
  ) {
    throw new Error("Invalid storage path.");
  }

  return normalizedRelativePath;
}

export async function saveItemImage(file: File | null) {
  if (!file || file.size === 0) {
    return null;
  }

  const extension = MIME_EXTENSIONS.get(file.type);
  if (!extension) {
    throw new Error("Upload a JPG, PNG, WEBP, or GIF image.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Item photo must be 4 MB or smaller.");
  }

  const filename = `${randomUUID()}${extension}`;
  const objectPath = path.posix.join("items", filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.storage
    .from(getStorageBucket())
    .upload(objectPath, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false
    });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  return objectPath;
}
