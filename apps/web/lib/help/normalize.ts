import type { DocumentLanguage } from "@/types/analysis";

const DIACRITICS = /[\u0300-\u036f]/g;

const TURKISH_FOLDS: ReadonlyArray<readonly [string, string]> = [
  ["İ", "i"],
  ["ı", "i"],
  ["İ", "i"],
  ["I", "i"]
];

const GERMAN_FOLDS: ReadonlyArray<readonly [string, string]> = [
  ["ä", "a"],
  ["ö", "o"],
  ["ü", "u"],
  ["ß", "ss"],
  ["Ä", "a"],
  ["Ö", "o"],
  ["Ü", "u"]
];

function foldLocale(text: string, language: DocumentLanguage): string {
  let result = text;
  const folds = language === "tr" ? TURKISH_FOLDS : language === "de" ? GERMAN_FOLDS : [];
  for (const [from, to] of folds) {
    result = result.split(from).join(to);
  }
  return result;
}

export function normalizeQuestion(text: string, language: DocumentLanguage): string {
  const folded = foldLocale(text, language);
  return folded
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenise(text: string): string[] {
  return text.split(/\s+/).filter((token) => token.length > 0);
}

const STOPWORDS: Readonly<Record<DocumentLanguage, ReadonlySet<string>>> = {
  en: new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "to", "of", "in", "for",
    "on", "with", "at", "by", "from", "as", "into", "through", "during",
    "before", "after", "above", "below", "between", "under", "again",
    "further", "then", "once", "here", "there", "when", "where", "why",
    "how", "all", "both", "each", "few", "more", "most", "other", "some",
    "such", "no", "not", "only", "own", "same", "so", "than", "too",
    "very", "just", "because", "but", "and", "or", "if", "while", "about",
    "what", "which", "who", "whom", "this", "that", "these", "those", "i",
    "me", "my", "we", "our", "you", "your", "he", "him", "his", "she",
    "her", "it", "its", "they", "them", "their", "am"
  ]),
  tr: new Set([
    "bir", "bu", "su", "o", "ve", "ile", "icin", "gibi", "kadar", "ama",
    "fakat", "lakin", "ancak", "ya", "hem", "ne", "ki", "acaba", "belki",
    "ise", "gore", "karshi", "dogru", "beri", "de", "da", "mi", "mu",
    "ben", "sen", "biz", "siz", "onlar", "bana", "sana", "bize", "size",
    "ona", "beni", "seni", "bizi", "siz", "onu", "benim", "senin",
    "bizim", "sizin", "onlarin", "ama", "ama", "nedir", "nasil", "nerede",
    "ne", "neden", "niye", "kim", "hangi", "nasil", "var", "yok", "mu",
    "mi", "da", "de"
  ]),
  de: new Set([
    "der", "die", "das", "den", "dem", "des", "ein", "eine", "einem",
    "einen", "eines", "und", "oder", "aber", "doch", "noch", "dann",
    "wann", "wenn", "als", "weil", "dass", "damit", "ob", "ich", "du",
    "er", "sie", "es", "wir", "ihr", "mich", "dich", "sich", "uns",
    "euch", "mein", "dein", "sein", "unser", "euer", "ist", "sind",
    "war", "waren", "hat", "haben", "wird", "werden", "kann", "darf",
    "soll", "muss", "will", "mag", "mochte", "zu", "von", "mit", "bei",
    "aus", "nach", "seit", "vor", "uber", "unter", "fur", "gegen", "ohne",
    "um", "an", "auf", "in", "nicht", "so", "wie", "was", "wer", "wo",
    "warum", "welche", "welcher", "welches", "dieser", "diese", "dieses",
    "da", "dort", "hier", "ja", "nein", "auch", "nur", "sehr", "mal"
  ])
};

export function removeStopwords(tokens: readonly string[], language: DocumentLanguage): string[] {
  const stops = STOPWORDS[language];
  return tokens.filter((token) => !stops.has(token));
}
