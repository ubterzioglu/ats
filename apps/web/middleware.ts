import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";
import { requestOrigin } from "@/lib/auth/origin";
import { canonicalHostRedirect } from "@/lib/canonical-host";
import { decideAccess } from "@/lib/auth/routes";
import { updateSession } from "@/lib/supabase/middleware";

const handleLocale = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const canonical = canonicalHostRedirect({
    host: request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL
  });
  if (canonical) return NextResponse.redirect(canonical, 308);

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
    const redirectResponse = NextResponse.redirect(new URL(decision.to, requestOrigin(request)));
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
