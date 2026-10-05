import "server-only";

import { createServiceClient } from "./client";

const BUCKET = "cv-files";

export type UploadOutcome =
  | { readonly ok: true; readonly path: string }
  | { readonly ok: false; readonly reason: "env-missing" | "error" };

export async function uploadCvFile(
  path: string,
  bytes: Uint8Array,
  mime: string
): Promise<UploadOutcome> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, reason: "env-missing" };

  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: mime, upsert: false });

    if (error) {
      console.error("[storage] upload failed", error.message);
      return { ok: false, reason: "error" };
    }

    return { ok: true, path };
  } catch (cause) {
    console.error("[storage] upload threw", cause);
    return { ok: false, reason: "error" };
  }
}

export type DownloadOutcome =
  | { readonly ok: true; readonly bytes: Uint8Array }
  | { readonly ok: false; readonly reason: "env-missing" | "not-found" | "error" };

export async function downloadCvFile(path: string): Promise<DownloadOutcome> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, reason: "env-missing" };

  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(path);

    if (error) {
      if (error.statusCode === "404") return { ok: false, reason: "not-found" };
      console.error("[storage] download failed", error.message);
      return { ok: false, reason: "error" };
    }

    const buffer = await data.arrayBuffer();
    return { ok: true, bytes: new Uint8Array(buffer) };
  } catch (cause) {
    console.error("[storage] download threw", cause);
    return { ok: false, reason: "error" };
  }
}

export async function createDownloadUrl(path: string, expiresInSeconds: number): Promise<string | null> {
  const supabase = createServiceClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      console.error("[storage] signed url failed", error.message);
      return null;
    }

    return data.signedUrl;
  } catch (cause) {
    console.error("[storage] signed url threw", cause);
    return null;
  }
}

export type RemoveOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "env-missing" | "error" };

export async function removeCvFile(path: string): Promise<RemoveOutcome> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, reason: "env-missing" };

  try {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);

    if (error) {
      console.error("[storage] remove failed", error.message);
      return { ok: false, reason: "error" };
    }

    return { ok: true };
  } catch (cause) {
    console.error("[storage] remove threw", cause);
    return { ok: false, reason: "error" };
  }
}
