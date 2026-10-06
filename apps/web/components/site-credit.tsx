import { cx } from "@/lib/ui";

interface SiteCreditProps {
  readonly className?: string;
}

export function SiteCredit({ className }: SiteCreditProps) {
  return (
    <div className="text-center">
      <p className={cx("credit-glow inline-block text-sm", className)}>
        Ats free for all ! AFFA &copy; 2026{" "}
        <a
          href="https://ubterzioglu.de"
          target="_blank"
          rel="noopener"
          className="underline underline-offset-4"
        >
          designed by UBT
        </a>
      </p>
    </div>
  );
}
