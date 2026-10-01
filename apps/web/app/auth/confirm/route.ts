import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/analyze";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  } else if (token_hash && type) {
    // Verify the OTP/token and log the user in
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    });

    if (!error) {
      // Redirect successfully authenticated user
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(new URL("/login?message=Doğrulama bağlantısı geçersiz veya süresi dolmuş.", request.url));
}
