import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";
import { decideAccess } from "@/lib/auth/routes";
import { updateSession } from "@/lib/supabase/middleware";

const handleLocale = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const localeResponse = handleLocale(request);
  const { response, user } = await updateSession(request, localeResponse);

  const authConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  );

  const decision = decideAccess({
    pathname: request.nextUrl.pathname,
    user,
    authConfigured
  });

  if (decision.action === "redirect") {
    const redirectResponse = NextResponse.redirect(new URL(decision.to, request.url));
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    }
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Every path except static assets, `/api` and `/auth`. Route handlers
     * and the email confirmation handler have no page and no locale, and
     * rewriting them to a locale segment routes them to a 404.
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|llms\\.txt|feed\\.xml|manifest\\.json|ai/|\\.well-known/|auth/|vendor/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
