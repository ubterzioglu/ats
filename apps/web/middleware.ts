import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const handleLocale = createMiddleware(routing);

// No route is gated here. Analysis runs for anyone; sign-in is required only
// where a report is written to the server, which `createShareLink` enforces.
export async function middleware(request: NextRequest) {
  return updateSession(request, handleLocale(request));
}

export const config = {
  matcher: [
    /*
     * Every path except static assets, `/api` and `/auth`. Route handlers
     * and the email confirmation handler have no page and no locale, and
     * rewriting them to a locale segment routes them to a 404.
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|llms\\.txt|auth/|vendor/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
