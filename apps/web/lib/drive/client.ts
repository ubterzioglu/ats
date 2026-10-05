import "server-only";

interface DriveEnv {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly refreshToken: string;
  readonly folderId: string;
}

function getDriveEnv(): DriveEnv | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!clientId || !clientSecret || !refreshToken || !folderId) return null;
  return { clientId, clientSecret, refreshToken, folderId };
}

interface CachedToken {
  readonly accessToken: string;
  readonly expiresAt: number;
}

let cachedToken: CachedToken | null = null;

async function getAccessToken(): Promise<string | null> {
  const env = getDriveEnv();
  if (!env) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.clientId,
        client_secret: env.clientSecret,
        refresh_token: env.refreshToken,
        grant_type: "refresh_token"
      })
    });

    if (!response.ok) {
      console.error("[drive] token request failed", response.status);
      return null;
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    cachedToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000
    };
    return data.access_token;
  } catch (cause) {
    console.error("[drive] token request threw", cause);
    return null;
  }
}

export type UploadToDriveInput = {
  readonly name: string;
  readonly mime: string;
  readonly bytes: Uint8Array;
};

export type UploadToDriveOutcome =
  | { readonly ok: true; readonly fileId: string }
  | { readonly ok: false; readonly reason: "env-missing" | "auth" | "error" };

export async function uploadToDrive(input: UploadToDriveInput): Promise<UploadToDriveOutcome> {
  const env = getDriveEnv();
  if (!env) return { ok: false, reason: "env-missing" };

  const accessToken = await getAccessToken();
  if (!accessToken) return { ok: false, reason: "auth" };

  const metadata = {
    name: input.name,
    parents: [env.folderId]
  };

  const boundary = "---------------" + Math.random().toString(36).slice(2);
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${input.mime}`,
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(input.bytes).toString("base64"),
    `--${boundary}--`
  ].join("\r\n");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`
        },
        body,
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      console.error("[drive] upload failed", response.status);
      return { ok: false, reason: "error" };
    }

    const data = (await response.json()) as { id: string };
    return { ok: true, fileId: data.id };
  } catch (cause) {
    console.error("[drive] upload threw", cause);
    return { ok: false, reason: "error" };
  }
}

export type DeleteFromDriveOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "env-missing" | "auth" | "not-found" | "error" };

export async function deleteFromDrive(fileId: string): Promise<DeleteFromDriveOutcome> {
  const env = getDriveEnv();
  if (!env) return { ok: false, reason: "env-missing" };

  const accessToken = await getAccessToken();
  if (!accessToken) return { ok: false, reason: "auth" };

  try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (response.status === 404) {
      return { ok: false, reason: "not-found" };
    }

    if (!response.ok) {
      console.error("[drive] delete failed", response.status);
      return { ok: false, reason: "error" };
    }

    return { ok: true };
  } catch (cause) {
    console.error("[drive] delete threw", cause);
    return { ok: false, reason: "error" };
  }
}
