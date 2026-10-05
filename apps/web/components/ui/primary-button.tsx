import type { ComponentProps } from "react";

import { Link } from "@/i18n/navigation";
import { cx } from "@/lib/ui";

type PrimaryButtonProps = Omit<ComponentProps<typeof Link>, "className"> & {
  readonly className?: string;
};

/**
 * The filled violet pill. A view carries one of these; every other action is a
 * GhostLink. Styling lives in `.btn` so a plain <button> in a form matches.
 */
export function PrimaryButton({ className, ...props }: PrimaryButtonProps) {
  return <Link {...props} className={cx("btn", className)} />;
}
