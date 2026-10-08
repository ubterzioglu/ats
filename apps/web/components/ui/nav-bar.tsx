"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Fragment, useEffect, useState } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { withLocale } from "@/lib/auth/routes";
import { FEATURE_SLUGS, featurePath } from "@/lib/features";
import { getFeatureContent } from "@/lib/features/content";
import { cx } from "@/lib/ui";

import { LanguageSwitcher } from "../language-switcher";

import { GhostLink } from "./ghost-link";
import { PrimaryButton } from "./primary-button";

const LINKS = [
  { href: "/analyze", key: "analyze" },
  { href: "/builder", key: "builder" },
  { href: "/applications", key: "applications" },
  { href: "/features", key: "features" },
  { href: "/blog", key: "blog" },
  { href: "/about", key: "about" },
  { href: "/feedback", key: "feedback" }
] as const;

const PROTECTED_PATHS = new Set(["/analyze", "/builder", "/applications"]);

/**
 * A floating pill that sticks to the top. It is clear over the hero and takes
 * a black, blurred fill once the page scrolls, so content passing underneath
 * cannot collide with the links.
 *
 * The lime button appears on the landing page only: an inner view already has
 * its own primary action, and a view carries one filled button.
 */
export function NavBar() {
  const nav = useTranslations("nav");
  const common = useTranslations("common");
  const brand = useTranslations("brand");
  const pathname = usePathname();
  const locale = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // A full page load, not a router transition: a server action that signs out
  // and redirects re-renders the tree while this component is unmounting its
  // own form, and the client throws.
  async function signOut() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        await createBrowserClient(supabaseUrl, supabaseKey).auth.signOut();
      } catch {
        // Cookies are cleared below by the reload; the middleware re-checks the session.
      }
    }
    window.location.assign(withLocale("/", locale));
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createBrowserClient(supabaseUrl, supabaseKey);

    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();
        setUserEmail(data.session?.user?.email ?? null);
      } catch {
        setUserEmail(null);
      }
    }
    void checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const featureContent = getFeatureContent(locale as AppLocale);
  const onLanding = pathname === "/";
  const signedIn = userEmail !== null;

  return (
    <header className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-6">
      <div
        className={cx(
          "relative mx-auto flex w-full max-w-page flex-wrap items-center justify-between gap-x-4 rounded-[1.75rem] border-2 px-3 py-1.5 transition-[background-color,border-color,box-shadow] duration-300 sm:px-4",
          scrolled
            ? "nav-sheen border-lime/30 bg-void/95 shadow-[0_0_32px_-8px_rgb(var(--lime)/0.45)] backdrop-blur-md"
            : "border-transparent bg-transparent"
        )}
      >
        <Link href="/" className="flex items-center py-1">
          <Image
            src="/brand/affa-icon-square-tight.svg"
            alt={brand("name")}
            width={44}
            height={44}
            unoptimized
            priority
            className="sm:hidden"
          />
          <Image
            src="/brand/affa-logo-black.svg"
            alt={brand("name")}
            width={112}
            height={51}
            unoptimized
            priority
            className="hidden sm:block"
          />
        </Link>

        <nav
          aria-label={nav("label")}
          className="order-3 -ml-3 flex w-full items-center overflow-x-auto whitespace-nowrap md:order-none md:ml-0 md:w-auto md:flex-1 md:justify-center md:overflow-visible"
        >
          {LINKS.map((link, index) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const isProtected = PROTECTED_PATHS.has(link.href);
            const href = !signedIn && isProtected ? `/login?next=${encodeURIComponent(link.href)}` : link.href;
            const ghost = (
              <GhostLink href={href} active={active} className="px-2 lg:px-2.5">
                {link.key === "applications" ? common("applications") : nav(link.key)}
              </GhostLink>
            );
            return (
              <Fragment key={link.href}>
                {index > 0 ? <span aria-hidden="true" className="h-4 w-px shrink-0 bg-bone/20" /> : null}
                {link.key === "features" ? (
                  <div className="group relative shrink-0">
                    {ghost}
                    <ul className="invisible absolute left-0 top-full z-50 w-72 rounded-2xl border-2 border-lime/30 bg-void/95 p-2 opacity-0 shadow-[0_0_32px_-8px_rgb(var(--lime)/0.45)] backdrop-blur-md transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 max-md:hidden">
                      {FEATURE_SLUGS.map((slug) => (
                        <li key={slug}>
                          <GhostLink href={featurePath(slug)} className="block w-full px-3 py-1.5 text-left">
                            {featureContent[slug].title}
                          </GhostLink>
                        </li>
                      ))}
                      <li className="mt-1 border-t border-bone/15 pt-1">
                        <GhostLink href="/quick-test" className="block w-full px-3 py-1.5 text-left">
                          {nav("quickTest")}
                        </GhostLink>
                      </li>
                      <li>
                        <GhostLink href="/faq" className="block w-full px-3 py-1.5 text-left">
                          {nav("faq")}
                        </GhostLink>
                      </li>
                    </ul>
                  </div>
                ) : (
                  ghost
                )}
              </Fragment>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          {signedIn ? (
            <div className="flex items-center gap-2">
              <GhostLink href="/account" active={pathname === "/account"}>
                {nav("profile")}
              </GhostLink>
              <button type="button" className="btn-quiet" onClick={() => void signOut()}>
                {common("signOut")}
              </button>
            </div>
          ) : onLanding ? null : (
            <GhostLink href="/login">{common("signIn")}</GhostLink>
          )}
          {onLanding ? (
            <PrimaryButton href={signedIn ? "/analyze" : "/login?next=/analyze"}>
              {nav("cta")}
            </PrimaryButton>
          ) : null}
        </div>
      </div>
    </header>
  );
}
