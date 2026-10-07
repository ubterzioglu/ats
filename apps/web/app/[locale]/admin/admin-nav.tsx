import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

interface AdminNavProps {
  locale: string;
}

export async function AdminNav({ locale }: AdminNavProps) {
  const t = await getTranslations({ locale, namespace: "admin.nav" });

  return (
    <nav className="flex gap-4 border-b border-line pb-4">
      <Link href="/admin" className="text-sm font-medium text-ink hover:text-iris transition-colors">
        {t("overview")}
      </Link>
      <Link href="/admin/requests" className="text-sm font-medium text-muted hover:text-iris transition-colors">
        {t("requests")}
      </Link>
      <Link href="/admin/audit" className="text-sm font-medium text-muted hover:text-iris transition-colors">
        {t("audit")}
      </Link>
      <Link href="/admin/users" className="text-sm font-medium text-muted hover:text-iris transition-colors">
        {t("users")}
      </Link>
      <Link href="/admin/features" className="text-sm font-medium text-muted hover:text-iris transition-colors">
        Features
      </Link>
      <Link href="/admin/faq" className="text-sm font-medium text-muted hover:text-iris transition-colors">
        FAQ
      </Link>
    </nav>
  );
}
