/**
 * Aliases that are also ordinary words. "go" appears in "go-live", "r" in
 * "R&D"; counting them unconditionally turns prose into skills. They only
 * count on a line that also carries technical context.
 *
 * Kept free of imports so scripts/build-skill-dictionary.mjs can load it and
 * apply the same guard at build time.
 */
export const AMBIGUOUS_TERMS: ReadonlySet<string> = new Set(["go", "r", "c"]);
