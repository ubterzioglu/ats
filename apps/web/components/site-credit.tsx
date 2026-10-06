import { cx } from "@/lib/ui";

interface SiteCreditProps {
  readonly className?: string;
}

export function SiteCredit({ className }: SiteCreditProps) {
  return (
    <p className={cx("text-sm text-muted", className)}>
      &copy; 2026{" "}
      <a
        href="https://ubterzioglu.de"
        target="_blank"
        rel="noopener"
        className="underline underline-offset-4 hover:text-ink"
      >
        designed by UBT
      </a>
    </p>
  );
}
