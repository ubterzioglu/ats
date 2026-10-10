"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function FiltersBar() {
  const t = useTranslations("admin.filters");
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex-1 min-w-[200px]">
        <label className="block text-sm text-muted mb-1">{t("search")}</label>
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          className="w-full bg-bed border border-line rounded px-3 py-2 text-ink text-sm"
          defaultValue={searchParams.get("q") ?? ""}
          onChange={(e) => updateFilter("q", e.target.value)}
        />
      </div>
      <div className="min-w-[150px]">
        <label className="block text-sm text-muted mb-1">{t("band")}</label>
        <select
          className="w-full bg-bed border border-line rounded px-3 py-2 text-ink text-sm"
          defaultValue={searchParams.get("band") ?? ""}
          onChange={(e) => updateFilter("band", e.target.value)}
        >
          <option value="">{t("allBands")}</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
        </select>
      </div>
      <div className="min-w-[150px]">
        <label className="block text-sm text-muted mb-1">{t("language")}</label>
        <select
          className="w-full bg-bed border border-line rounded px-3 py-2 text-ink text-sm"
          defaultValue={searchParams.get("language") ?? ""}
          onChange={(e) => updateFilter("language", e.target.value)}
        >
          <option value="">{t("allLanguages")}</option>
          <option value="en">English</option>
          <option value="tr">Türkçe</option>
          <option value="de">Deutsch</option>
        </select>
      </div>
    </div>
  );
}
