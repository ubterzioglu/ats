/**
 * googleDriveService.ts
 *
 * Wraps the Google Drive REST API v3.
 *
 * OAuth 2.0 is handled by @react-oauth/google (useGoogleLogin hook).
 * That library gives us a short-lived access token which we pass as a
 * Bearer header to every Drive request — no SDK needed on the client.
 *
 * Setup steps (documented in README):
 *  1. Create a Google Cloud project.
 *  2. Enable the Google Drive API.
 *  3. Create an OAuth 2.0 "Web application" credential.
 *  4. Add http://localhost:5173 to "Authorised JavaScript origins".
 *  5. Copy the Client ID into VITE_GOOGLE_CLIENT_ID in .env.
 */

import type { GoogleDriveFile } from '../types';

const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
const DRIVE_FILES_URL  = 'https://www.googleapis.com/drive/v3/files';

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Uploads a Blob to Google Drive and returns the created file metadata.
 *
 * Uses the multipart upload endpoint so we can set the filename and MIME type
 * in a single HTTP request (avoids the more complex resumable upload).
 */
export async function uploadToDrive(
  accessToken: string,
  blob: Blob,
  fileName: string,
  mimeType: string
): Promise<GoogleDriveFile> {
  const metadata = JSON.stringify({ name: fileName, mimeType });

  const form = new FormData();
  // Drive's multipart format: metadata part first, then file content part
  form.append('metadata', new Blob([metadata], { type: 'application/json' }));
  form.append('file', blob);

  const res = await fetch(DRIVE_UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`Google Drive upload failed: ${detail.error?.message ?? res.statusText}`);
  }

  const created = await res.json() as { id: string; name: string };

  // Fetch the webViewLink separately (not returned by default on upload)
  const viewLink = await getFileWebLink(accessToken, created.id);

  return { id: created.id, name: created.name, webViewLink: viewLink };
}

// ─── Metadata helpers ─────────────────────────────────────────────────────────

async function getFileWebLink(accessToken: string, fileId: string): Promise<string> {
  const res = await fetch(
    `${DRIVE_FILES_URL}/${fileId}?fields=webViewLink`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return `https://drive.google.com/file/d/${fileId}/view`;
  const data = await res.json() as { webViewLink?: string };
  return data.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`;
}

/** Lists the 10 most recently modified files in Drive (for a "recent files" panel). */
export async function listRecentFiles(accessToken: string): Promise<GoogleDriveFile[]> {
  const query = encodeURIComponent("mimeType!='application/vnd.google-apps.folder'");
  const fields = encodeURIComponent('files(id,name,webViewLink)');
  const res = await fetch(
    `${DRIVE_FILES_URL}?orderBy=modifiedTime desc&pageSize=10&q=${query}&fields=${fields}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error('Failed to list Google Drive files.');
  const data = await res.json() as { files: GoogleDriveFile[] };
  return data.files;
}
