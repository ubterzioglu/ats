import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function run() {
  const token = "test-token-123456";
  const expiresAt = new Date(Date.now() + 30 * 86_400_000).toISOString();

  const fakePayload = {
    total: 100,
    band: "excellent",
    language: "en",
    dimensions: [],
    findings: [],
    keywords: { matched: [], missing: [], overused: [], coverage: 1, source: "baseline" },
    sections: [],
    stats: { characters: 0, words: 0, lines: 0, bulletLines: 0, averageBulletWords: 0, estimatedPages: 1, years: [], experienceMonths: 0 },
    generatedAt: new Date().toISOString()
  };

  const { data, error } = await supabase.from("ats_reports").insert({
    token,
    total: 100,
    band: "excellent",
    language: "en",
    payload: fakePayload,
    expires_at: expiresAt
  });

  if (error) {
    console.error("Insert failed:");
    console.error(error);
  } else {
    console.log("Insert succeeded!");
    console.log(data);
    
    // cleanup
    await supabase.from("ats_reports").delete().eq("token", token);
  }
}

run();
