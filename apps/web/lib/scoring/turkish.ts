import { isKnownSkill } from "./taxonomy";

/**
 * Turkish-aware casing and stemming for keyword matching.
 *
 * Turkish casing changes word identity, not just appearance: "I" lowercases to
 * "ı" and "İ" lowercases to "i". A plain toLowerCase() turns "İ" into "i" plus
 * a combining dot, which splits the word in two for any tokenizer.
 *
 * The stemmer is a practical subset of the Snowball Turkish algorithm: suffix
 * templates instantiated under vowel harmony, stripped one per category per
 * pass. It is not a linguist's stemmer; it only has to map inflected forms of
 * one word onto a single key so an ad term and a CV word can be paired.
 */

const COMBINING_DOT_ABOVE = /\u0307/g;

/** Locale-correct lowercase for Turkish: I -> ı, İ -> i. */
export function trLowercase(text: string): string {
  return text
    .replace(/\u0130/g, "i")
    .replace(/I/g, "\u0131")
    .replace(COMBINING_DOT_ABOVE, "")
    .toLowerCase();
}

const DIACRITIC_FOLD: Readonly<Record<string, string>> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  â: "a",
  î: "i",
  û: "u"
};

/**
 * ASCII transliteration fold. CVs are often typed without diacritics while the
 * ad carries them, so "gelistirme" and "geliştirme" must land on one key.
 */
export function foldTurkishDiacritics(text: string): string {
  return text.replace(/[çğıöşüâîû]/g, (char) => DIACRITIC_FOLD[char] ?? char);
}

export function hasTurkishCharacters(text: string): boolean {
  return /[çğıöşüâîûÇĞİÖŞÜÂÎÛ]/.test(text);
}

const NARROW: Readonly<Record<string, string>> = {
  a: "ı", e: "i", ı: "ı", i: "i", o: "u", u: "u", ö: "ü", ü: "ü"
};

const WIDE: Readonly<Record<string, string>> = {
  a: "a", e: "e", ı: "a", i: "e", o: "a", u: "a", ö: "e", ü: "e"
};

const VOWELS: ReadonlySet<string> = new Set(Object.keys(NARROW));
const VOICELESS: ReadonlySet<string> = new Set(["ç", "f", "h", "k", "p", "s", "ş", "t"]);

/**
 * Real Turkish roots short enough that the general minimum-stem guard would
 * freeze them, so "işi" could never reach "iş".
 */
const SHORT_ROOTS: ReadonlySet<string> = new Set([
  "iş", "aş", "göz", "yaş", "dil", "yıl", "yol", "iç", "dış", "ön",
  "öz", "güç", "hal", "mal", "can", "kan", "kol", "uç", "su", "ay", "sel", "kul"
]);

/** One suffix character: a literal letter, or a harmony-driven marker. */
type SuffixElement = string | "I" | "A" | "D";

interface SuffixRule {
  /**
   * The suffix as one element per character: literal letters, or {I} for the
   * narrow vowel, {A} for the wide vowel and {D} for d/t, each chosen by vowel
   * harmony from the stem.
   */
  readonly template: string;
  readonly minStem: number;
  readonly elements: readonly SuffixElement[];
}

function parseTemplate(template: string): SuffixElement[] {
  const elements: SuffixElement[] = [];
  for (let index = 0; index < template.length; index += 1) {
    const char = template[index];
    if (char !== "{") {
      elements.push(char ?? "");
      continue;
    }
    const marker = template[index + 1];
    index += 2;
    if (marker !== "I" && marker !== "A" && marker !== "D") {
      throw new Error(`Unknown suffix marker in template "${template}"`);
    }
    elements.push(marker);
  }
  return elements;
}

function rule(template: string, minStem: number): SuffixRule {
  return { template, minStem, elements: parseTemplate(template) };
}

function lastVowel(word: string): string | undefined {
  for (let index = word.length - 1; index >= 0; index -= 1) {
    const char = word[index];
    if (char !== undefined && VOWELS.has(char)) return char;
  }
  return undefined;
}

function instantiate(elements: readonly SuffixElement[], stem: string): string | null {
  const vowel = lastVowel(stem);
  if (vowel === undefined) return null;
  const narrow = NARROW[vowel];
  const wide = WIDE[vowel];
  if (narrow === undefined || wide === undefined) return null;

  const lastChar = stem[stem.length - 1] ?? "";
  const fortis = !VOWELS.has(lastChar) && VOICELESS.has(lastChar);

  return elements
    .map((element) => {
      if (element === "I") return narrow;
      if (element === "A") return wide;
      if (element === "D") return fortis ? "t" : "d";
      return element;
    })
    .join("");
}

function tryStrip(word: string, suffixRule: SuffixRule): string | null {
  const stem = word.slice(0, word.length - suffixRule.elements.length);
  if (stem.length === 0) return null;
  if (stem.length < suffixRule.minStem && !SHORT_ROOTS.has(stem)) return null;
  const suffix = instantiate(suffixRule.elements, stem);
  if (suffix === null || !word.endsWith(suffix)) return null;
  return stem;
}

const PLURAL: readonly SuffixRule[] = [rule("l{A}r", 3)];

const DERIVATION: readonly SuffixRule[] = [
  rule("m{A}kt{A}", 4),
  rule("m{A}k", 4),
  rule("m{A}", 4),
  rule("l{I}k", 4),
  rule("c{I}", 4),
  rule("s{I}z", 4),
  rule("{I}l", 5),
  rule("l{A}ş", 4),
  rule("{D}{I}r", 4),
  rule("l{I}", 4),
  rule("l{A}", 4)
];

const POSSESSION: readonly SuffixRule[] = [
  rule("l{A}r{I}", 4),
  rule("{I}m{I}z", 4),
  rule("n{I}z", 4),
  rule("s{I}", 3),
  rule("{I}m", 4),
  rule("n", 5),
  rule("{I}n", 4),
  rule("{I}", 3)
];

const CASE: readonly SuffixRule[] = [
  rule("l{A}r{I}nd{A}", 5),
  rule("l{A}r{I}nd{A}n", 5),
  rule("s{I}nd{A}", 4),
  rule("s{I}nd{A}n", 4),
  rule("nd{A}", 4),
  rule("nd{A}n", 4),
  rule("{D}{A}n", 4),
  rule("{D}{A}", 4),
  rule("y{A}", 4),
  rule("n{I}n", 4)
];

const TENSE: readonly SuffixRule[] = [
  rule("{I}yor{I}m", 4),
  rule("{I}yors{I}n", 4),
  rule("{I}yoruz", 4),
  rule("{I}yor", 4),
  rule("{D}{I}m", 3),
  rule("{D}{I}n", 3),
  rule("{D}{I}k", 3),
  rule("{D}{I}l{A}r", 4),
  rule("m{I}şt{I}", 4),
  rule("m{I}ş", 4),
  rule("{A}c{A}kt{I}", 5),
  rule("{A}c{A}k", 4)
];

/**
 * Tense runs before possession and case: "geliştirdim" is a verb whose -dı-
 * must go before the noun reading eats it, while "projesini" is a noun chain
 * the later groups unwind correctly. Bare third-person -dı and aorist -ır are
 * deliberately absent: neither can be told from a noun ending ("testi" is
 * test-i, "mühendi" is mühendis-i), and CV prose carries them rarely enough
 * to accept the loss.
 */
const SUFFIX_GROUPS: readonly (readonly SuffixRule[])[] = [
  PLURAL,
  TENSE,
  DERIVATION,
  POSSESSION,
  CASE
];

const MAX_PASSES = 6;

const STOP_CONSONANTS: ReadonlySet<string> = new Set(["p", "ç", "t", "k", "b", "c", "d", "g"]);

function degeminate(stem: string): string {
  if (stem.length < 3) return stem;
  const last = stem[stem.length - 1];
  const before = stem[stem.length - 2];
  if (last === undefined || last !== before || VOWELS.has(last)) return stem;
  return stem.slice(0, -1);
}

/**
 * Reverses consonant softening: the stemmer lands on "yaptığ" or "ettiğ",
 * whose ğ is a softened k/t that only appears before a vowel suffix. The
 * matching key must be the hard form the other inflections carry, so the ğ
 * goes, and with it the past-tense syllable it was carrying ("yaptı" ->
 * "yap", "etti" -> "et").
 */
function resolveSoftening(stem: string): string {
  if (!stem.endsWith("ğ")) return stem;
  const base = stem.slice(0, -1);
  if (base.length < 3) return stem;
  const last = base[base.length - 1];
  const before = base[base.length - 2];
  if (last === undefined || before === undefined) return stem;
  if (VOWELS.has(last)) {
    const root = base.slice(0, -2);
    return root.length >= 2 ? degeminate(root) : stem;
  }
  if (STOP_CONSONANTS.has(last) && !VOWELS.has(before)) {
    return base.slice(0, -1);
  }
  return degeminate(base);
}

/**
 * Strips inflectional and derivational suffixes down to a stable key. Words
 * the skill taxonomy knows ("java", "spark") are returned untouched: they are
 * proper names, and Turkish suffix rules would eat English endings.
 */
export function stemTurkish(word: string): string {
  if (word.length < 4) return word;
  if (!/^[\p{L}]+$/u.test(word)) return word;
  if (isKnownSkill(word)) return word;

  let stem = trLowercase(word);

  for (let pass = 0; pass < MAX_PASSES; pass += 1) {
    let changed = false;
    for (const group of SUFFIX_GROUPS) {
      for (const candidate of group) {
        const next = tryStrip(stem, candidate);
        if (next !== null) {
          stem = next;
          changed = true;
          break;
        }
      }
    }
    if (!changed) break;
  }

  return resolveSoftening(degeminate(stem));
}

/**
 * Stems the greedy stripper over-reduces, mapped back onto the root the other
 * inflections of the same word reach. "Mühendisi" reads as "mühendi-si" and
 * lands on "mühen", while the title "mühendis" stands still; the merge closes
 * the gap. Keys and values are folded ASCII.
 */
const DOMAIN_STEM_MERGES: Readonly<Record<string, string>> = {
  muhen: "muhendis",
  muhend: "muhendis",
  tesi: "tesis",
  projes: "proje"
};

/**
 * The key two Turkish words are matched on: stem, transliteration fold and
 * the domain merge on top.
 */
export function matchKeyTurkish(word: string): string {
  const key = foldTurkishDiacritics(stemTurkish(word));
  return DOMAIN_STEM_MERGES[key] ?? key;
}

const VERB_ENDING =
  /(?:[dt][ıiuü][mnk]|[dt][ıiuü](?:lar|ler)?|yor(?:um|uz|sun|sunuz|lar)?|m[ıiuü]ş)$/;

/**
 * Turkish is verb-final: the ownership verb sits at the end of the bullet,
 * where the English-anchored action-verb check never looks.
 */
export function hasTurkishVerbEnding(bullet: string): boolean {
  return VERB_ENDING.test(bullet.replace(/[.!?]+$/g, ""));
}
