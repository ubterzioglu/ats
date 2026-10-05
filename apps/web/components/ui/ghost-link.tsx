import type { ComponentProps } from "react";

import { Link } from "@/i18n/navigation";
import { cx } from "@/lib/ui";

type GhostLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  readonly className?: string;
  /** Active reads white; everything else is ash. */
  readonly active?: boolean;
};

export function GhostLink({ className, active = false, ...props }: GhostLinkProps) {
  return (
    <Link
      {...props}
      aria-current={active ? "page" : undefined}
      className={cx("btn-quiet", active && "text-bone", className)}
    />
  );
}
