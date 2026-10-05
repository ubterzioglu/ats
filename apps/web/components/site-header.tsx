"use client";

import { usePathname } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

export function SiteHeader() {
  const t = useTranslations("common");
  const brand = useTranslations("brand");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        if (!supabaseUrl || !supabaseKey) return;
        const supabase = createBrowserClient(supabaseUrl, supabaseKey);
        const { data } = await supabase.auth.getSession();
        setSignedIn(data.session !== null);
      } catch (err) {
        setSignedIn(false);
      }
    };
    void checkSession();
  }, []);

  const navLinks = [
    { href: "/analyze", label: "Analyze CV" },
    { href: "/builder", label: "Builder" },
    { href: "/applications", label: "Tracker" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-bed/70 backdrop-blur-md shadow-[0_1px_12px_rgba(0,0,0,0.05)] border-b border-line"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2 font-mono text-base font-semibold tracking-tight transition-transform hover:scale-105"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-ink to-action text-bed shadow-md transition-shadow group-hover:shadow-lg">
              A
            </div>
            <span className="bg-gradient-to-r from-ink to-action bg-clip-text text-transparent">
              {brand("name")}
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1 rounded-full bg-bench-sunk/50 px-2 py-1 backdrop-blur-sm border border-line">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-bed text-ink shadow-sm"
                      : "text-muted hover:text-ink hover:bg-bench"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            
            <div className="hidden sm:block w-px h-5 bg-line mx-1"></div>

            {signedIn ? (
              <form action="/auth/logout" method="POST">
                <button className="text-sm font-medium text-muted transition-colors hover:text-ink">
                  {t("signOut")}
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="rounded-control bg-ink px-4 py-2 text-sm font-medium text-bed shadow-sm transition-all hover:opacity-90 hover:shadow-md hover:-translate-y-0.5"
              >
                {t("signInToSave")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
