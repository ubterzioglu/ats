export const THEME_STORAGE_KEY = "ats-theme";

export type ThemeChoice = "light" | "dark" | "system";

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * Runs before first paint, inline in the document head. Reading the stored
 * choice after hydration would show one frame of the wrong theme, which is the
 * flash this exists to prevent.
 *
 * Kept as a string because it is injected, not imported: it must not depend on
 * anything the bundle has not loaded yet. Storage can throw in private
 * browsing, so the whole thing is wrapped.
 */
export const THEME_SCRIPT = `(function(){try{var c=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY
)});if(c==="light"||c==="dark"){document.documentElement.setAttribute("data-theme",c)}}catch(e){}})()`;
