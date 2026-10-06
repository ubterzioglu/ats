import { NextResponse } from "next/server";

import { performGhostCheck, validateGhostInput } from "@/lib/ghost-check";
import { getApiUser } from "@/lib/auth/require-user";

export async function POST(request: Request) {
  const user = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "auth-required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const input = validateGhostInput(body);
  if (!input) {
    return NextResponse.json(
      { error: "expected {platform, board, jobId} with no extra fields" },
      { status: 400 }
    );
  }

  const result = await performGhostCheck(input);
  return NextResponse.json(result);
}
