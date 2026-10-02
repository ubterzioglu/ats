import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware replacements for next/link and next/navigation. Importing the
 * originals in a page would drop the locale on the first click.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
