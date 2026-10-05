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
 * Transparent on black, with no border and no blur. Once the page scrolls the
 * bar takes the same black as the canvas, so content passing underneath cannot
 * collide with the links; it is never a visible panel.
 *
 * The violet pill appears on the landing page only: an inner view already has
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
    <header className={cx("sticky top-0 z-50 w-full transition-colors", scrolled ? "bg-void" : "bg-transparent")}>
      <div className="mx-auto w-full max-w-page px-4 sm:px-6">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-0">
          <Link href="/" className="flex items-center gap-3 py-3 text-nav-label font-semibold text-bone">
            <Image
              src="/brand/affa-icon-square-rounded.svg"
              alt={brand("name")}
              width={32}
              height={32}
              unoptimized
              priority
              className="sm:hidden"
            />
            <Image
              src="/brand/affa-dark-tight.svg"
              alt={brand("name")}
              width={120}
              height={36}
              unoptimized
              priority
              className="hidden sm:block"
            />
          </Link>

          <nav
            aria-label={nav("label")}
            className="order-3 -ml-3 flex w-full items-center md:order-none md:ml-0 md:w-auto md:flex-1 md:justify-center"
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
      </div>
    </header>
  );
}
