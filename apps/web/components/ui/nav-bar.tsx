"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Link, usePathname } from "@/i18n/navigation";
import { cx } from "@/lib/ui";

import { LanguageSwitcher } from "../language-switcher";

import { GhostLink } from "./ghost-link";
import { PrimaryButton } from "./primary-button";

const LINKS = [
  { href: "/analyze", key: "analyze" },
  { href: "/builder", key: "builder" },
  { href: "/applications", key: "applications" },
  { href: "/about", key: "about" }
] as const;

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
  const [scrolled, setScrolled] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    async function checkSession() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        if (!supabaseUrl || !supabaseKey) return;
        const supabase = createBrowserClient(supabaseUrl, supabaseKey);
        const { data } = await supabase.auth.getSession();
        setSignedIn(data.session !== null);
      } catch {
        setSignedIn(false);
      }
    }
    void checkSession();
  }, []);

  const onLanding = pathname === "/";

  return (
    <header className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-6">
      <div
        className={cx(
          "mx-auto flex w-full max-w-page flex-wrap items-center justify-between gap-x-4 rounded-[1.75rem] border-2 px-3 py-1.5 transition-colors sm:px-4",
          scrolled ? "border-bone/20 bg-void/95 backdrop-blur-md" : "border-transparent bg-transparent"
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
          {LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <GhostLink key={link.href} href={link.href} active={active}>
                {link.key === "applications" ? common("applications") : nav(link.key)}
              </GhostLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          {signedIn ? (
            <form action="/auth/logout" method="POST">
              <button type="submit" className="btn-quiet">
                {common("signOut")}
              </button>
            </form>
          ) : onLanding ? null : (
            <GhostLink href="/login">{common("signIn")}</GhostLink>
          )}
          {onLanding ? <PrimaryButton href="/analyze">{nav("cta")}</PrimaryButton> : null}
        </div>
      </div>
    </header>
  );
}
