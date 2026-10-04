export type GhostPlatform = "greenhouse" | "lever" | "ashby";

export interface GhostCheckInput {
  readonly platform: GhostPlatform;
  readonly board: string;
  readonly jobId: string;
}

export type GhostCheckStatus = "live" | "gone" | "unknown";

export interface GhostCheckResult {
  readonly status: GhostCheckStatus;
}

const BOARD_RX = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const JOB_ID_RX = /^[a-z0-9][a-z0-9_-]{0,127}$/;

const MAX_RESPONSE_BYTES = 512 * 1024;
const TIMEOUT_MS = 8_000;

const PLATFORM_HOSTS: Readonly<Record<GhostPlatform, string>> = {
  greenhouse: "boards.greenhouse.io",
  lever: "api.lever.co",
  ashby: "api.ashbyhq.com"
};

function buildUrl(input: GhostCheckInput): string | null {
  if (!BOARD_RX.test(input.board)) return null;
  if (!JOB_ID_RX.test(input.jobId)) return null;

  const host = PLATFORM_HOSTS[input.platform];
  if (!host) return null;

  switch (input.platform) {
    case "greenhouse":
      return `https://${host}/${encodeURIComponent(input.board)}/embed.json`;
    case "lever":
      return `https://${host}/v0/postings/${encodeURIComponent(input.board)}?mode=json`;
    case "ashby":
      return `https://${host}/posting/${encodeURIComponent(input.board)}/${encodeURIComponent(input.jobId)}/json`;
  }
}

export function validateGhostInput(body: unknown): GhostCheckInput | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;

  const record = body as Record<string, unknown>;
  const allowedKeys = new Set(["platform", "board", "jobId"]);
  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) return null;
  }

  const { platform, board, jobId } = record;
  if (platform !== "greenhouse" && platform !== "lever" && platform !== "ashby") return null;
  if (typeof board !== "string" || !BOARD_RX.test(board)) return null;
  if (typeof jobId !== "string" || !JOB_ID_RX.test(jobId)) return null;

  return { platform, board, jobId };
}

export async function performGhostCheck(input: GhostCheckInput): Promise<GhostCheckResult> {
  const url = buildUrl(input);
  if (!url) return { status: "unknown" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "error",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 410) {
        return { status: "gone" };
      }
      return { status: "unknown" };
    }

    if (!response.body) return { status: "unknown" };

    const reader = response.body.getReader();
    let totalBytes = 0;
    let found = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_RESPONSE_BYTES) {
        reader.cancel().catch(() => {});
        return { status: "unknown" };
      }
      const chunk = new TextDecoder().decode(value);
      if (chunk.includes(input.jobId)) {
        found = true;
      }
    }

    return { status: found ? "live" : "gone" };
  } catch {
    return { status: "unknown" };
  } finally {
    clearTimeout(timer);
  }
}
