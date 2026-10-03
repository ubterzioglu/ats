import type { StoryTopic } from "@/types/interview";

/**
 * The interview module's vocabulary: achievement verbs, result verbs, metric
 * shapes, purpose markers, topic rules and the heading words to step over
 * when looking for a role line. Three languages, deliberately curated rather
 * than learned - this is the rule half of "a rule before a model", and a
 * rule a reviewer can read is a rule a candidate can trust.
 *
 * Word boundaries use Unicode lookarounds, not \b: \b only knows ASCII word
 * characters, and a Turkish verb ending in "ı" has no \b after it.
 */

const NOT_WORD = String.raw`(?<![\p{L}\p{N}])`;
const NOT_WORD_AHEAD = String.raw`(?![\p{L}\p{N}])`;

const ACHIEVEMENT_VERBS = [
  // English, past and present tense as CVs write them
  "built", "created", "developed", "designed", "introduced", "implemented",
  "automated", "migrated", "reduced", "increased", "improved", "cut", "saved",
  "delivered", "launched", "led", "owned", "mentored", "trained", "coached",
  "consolidated", "replaced", "shortened", "streamlined", "established",
  "shipped", "scaled", "optimised", "optimized", "refactored", "modernised",
  "modernized", "drove", "set up", "rolled out", "halved", "doubled",
  // German
  "entwickelte", "automatisierte", "migrierte", "reduzierte", "senkte",
  "verbesserte", "steigerte", "verkürzte", "ersetzte", "implementierte",
  "etablierte", "führte", "leitete", "baute", "verantwortete", "betreute",
  "schulte", "optimierte", "entwarf", "beschleunigte", "halbierte",
  "verdoppelte", "lieferte",
  // Turkish
  "geliştirdim", "geliştirdik", "geliştirdi", "kurdum", "kurduk", "kurdu",
  "tasarladım", "tasarladık", "otomatikleştirdim", "otomatikleştirdik",
  "taşıdım", "taşıdık", "azalttım", "azalttık", "azalttı", "artırdım",
  "arttırdım", "indirdim", "düşürdüm", "düşürdük", "hızlandırdım",
  "yönettim", "iyileştirdim", "sağladım", "oluşturdum", "sundum",
  "kısalttım", "entegre ettim", "devreye aldım", "devreye aldık",
  "mentörlük", "mentorluk", "eğitim verdim", "geçiş yaptım"
] as const;

export const ACHIEVEMENT_VERB_RX = new RegExp(
  `${NOT_WORD}(?:${ACHIEVEMENT_VERBS.map((verb) => verb.replace(/\s+/g, String.raw`\s+`)).join(
    "|"
  )})${NOT_WORD_AHEAD}`,
  "iu"
);

/**
 * Verbs that mark a clause as an outcome rather than an activity. Turkish and
 * German entries are stems on purpose: "azalttım", "azaltarak" and
 * "reduzierte" all start with theirs, and no \b-style tail can enumerate the
 * agglutinated forms.
 */
const RESULT_VERBS = [
  "reducing", "cutting", "saving", "lowering", "shortening", "improving",
  "increasing", "halving", "doubling", "reduziert", "senkte", "senkt",
  "sparte", "verbessert", "verbesserte", "verkürzt", "verkürzte", "azalt",
  "düşür", "indirdi", "kısalt", "hızlandır", "artır", "arttır", "sağlandı",
  "kazandır"
] as const;

export const RESULT_CLAUSE_RX = new RegExp(
  `${NOT_WORD}(?:${RESULT_VERBS.join("|")})[^\\n]*`,
  "iu"
);

/** A quantified outcome: percentages, multipliers, amounts with units, from-to ranges. */
export const METRIC_RX = new RegExp(
  [
    String.raw`\d+(?:[.,]\d+)?\s?%`,
    String.raw`%\s?\d+(?:[.,]\d+)?`,
    String.raw`\b\d+(?:[.,]\d+)?\s?[x×]\b`,
    String.raw`\b\d{1,6}\s+(?:hours?|minutes?|mins?|seconds?|days?|weeks?|months?|years?|people|juniors?|testers?|users?|services?|cases?|tests?|releases?|products?|tools?|Stunden|Minuten|Sekunden|Tagen?|Wochen|Monaten?|Jahren?|Personen|Mitarbeitern?|Benutzern?|Diensten?|Fällen?|Tests?|Releases?)\b`,
    // Turkish units take suffixes ("6 saatlik", "35 dakikaya"), so no tail
    // boundary: the number plus the unit stem is the signal.
    String.raw`\b\d{1,6}\s+(?:saat|dakika|saniye|gün|hafta|ay|yıl|kişi|kullanıcı|servis|senaryo|test|sürüm|ürün|araç|junior|uzman)`,
    String.raw`\b(?:from|von)\s+\d+(?:[.,]\d+)?\s?%?\s+(?:to|bis|auf)\s+\d+(?:[.,]\d+)?\s?%?`,
    String.raw`\b\d+(?:[.,]\d+)?\s?(?:€|\$|£)\b`,
    String.raw`\b\d+(?:[.,]\d+)?\s?(?:m|k|mn)\b`
  ].join("|"),
  "iu"
);

/**
 * Explicit purpose markers. A bare English "to" is a direction far more often
 * than a purpose ("migrated to Playwright"), so only "in order to" and "so
 * that" count; Turkish stops at the marker itself, which is where the purpose
 * phrase ends.
 */
export const PURPOSE_RX =
  /(?:\bin order to\s+[^,;.]+|\bso that\s+[^,;.]+|\bum\s+[^,;.]*\bzu\b[^,;.]*|[^,;.]*?\b(?:amacıyla|üzere|için)\b)/iu;

interface TopicRule {
  readonly topic: StoryTopic;
  readonly pattern: RegExp;
}

const TOPIC_RULES: readonly TopicRule[] = [
  { topic: "automation", pattern: /automatis|otomasyon|automat|roboter|scripting|skript/iu },
  { topic: "testing", pattern: /\btests?\b|test[sui]|regression|regresyon|playwright|selenium|cypress|coverage|kapsam|qualitätssicherung|quality assurance|\bqa\b|istqb|rest assured|postman|xray|testng|cucumber/iu },
  { topic: "migration", pattern: /migrat|umzug|legacy|eski|taş[ıi]d|geçiş|modernis|moderniz|replace|ersetz/iu },
  { topic: "leadership", pattern: /\bled\b|lead|leadership|geleitet|leitete|yönet|verantwort|sorumlu|owner|sahiplen|team lead|tech lead/iu },
  { topic: "mentoring", pattern: /mentor|mentör|coached?|schulte?|trained|eğitim ver|junior|onboard/iu },
  { topic: "process", pattern: /process|prozess|süreç|workflow|pipeline|ci\/cd|gitlab ci|jenkins|release process|sprint|agile|scrum|çevik/iu },
  { topic: "quality", pattern: /quality|qualität|kalite|defect|hata|escape|kaçış|flaky|stabil|reliab/iu },
  { topic: "speed", pattern: /minutes?|hours?|days?|faster|speed|dakika|saat|gün|hız|schneller|minuten|stunden|verkürz|kısalt|cycle time|manual cycle|manuel/iu },
  { topic: "cost", pattern: /\bcost\b|kosten|maliyet|budget|bütçe|saved|tasarruf|license|lisans/iu },
  { topic: "collaboration", pattern: /cross[- ]team|stakeholder|teams?|ekip|zusammenarbeit|iş birliği|product owner|release manager|sürüm yönet/iu },
  { topic: "delivery", pattern: /release|delivery|delivered|launch|shipped|sürüm|auslieferung|deploy|production|canlı/iu },
  { topic: "incident", pattern: /incident|störung|outage|arıza|kesinti|production issue|hotfix|on[- ]call/iu }
];

/** Topics a bullet touches, in the stable order the rules are declared. */
export function topicsOf(text: string): StoryTopic[] {
  const topics: StoryTopic[] = [];
  for (const rule of TOPIC_RULES) {
    if (rule.pattern.test(text)) topics.push(rule.topic);
  }
  return topics;
}

/** Section-heading words a situation search must step over, case-folded. */
const HEADING_WORDS: ReadonlySet<string> = new Set([
  "summary", "profile", "about me", "özet", "profil", "hakkımda", "hakkimda",
  "zusammenfassung", "experience", "work experience", "professional experience",
  "employment", "iş deneyimi", "is deneyimi", "deneyim", "mesleki deneyim",
  "çalışma geçmişi", "calisma gecmisi", "berufserfahrung", "werdegang",
  "education", "eğitim", "egitim", "ausbildung", "studium",
  "skills", "beceriler", "yetenekler", "kenntnisse", "fähigkeiten", "faehigkeiten",
  "certifications", "certificates", "sertifikalar", "zertifikate",
  "languages", "diller", "sprachen", "projects", "projeler", "projekte",
  "awards", "ödüller", "oduller", "auszeichnungen", "publications",
  "yayınlar", "publikationen", "volunteer", "gönüllülük", "gonulluluk",
  "ehrenamt", "interests", "ilgi alanları", "hobbies", "hobbys", "referenzen",
  "references", "referanslar"
]);

export function isHeadingLine(line: string): boolean {
  return HEADING_WORDS.has(line.trim().replace(/[:：]+$/g, "").toLowerCase());
}

/**
 * A line that is nothing but a date range ("01/2021 - present", "März 2020 -
 * heute", "Oca 2022 - halen"). Role lines carry the situation; date lines do
 * not and are stepped over when searching upward for one.
 */
export const DATE_LINE_RX =
  /^\s*(?:[\p{L}]{3,12}\.?\s+)?(?:(?:0?[1-9]|1[0-2])\s*[./-]\s*)?(?:19|20)\d{2}\s*(?:[-–—]|to|bis|ile|als)\s*(?:(?:[\p{L}]{3,12}\.?\s+)?(?:(?:0?[1-9]|1[0-2])\s*[./-]\s*)?(?:19|20)\d{2}|present|current|today|now|heute|aktuell|laufend|bis heute|halen|devam(?:\s+ediyor)?|şimdi|simdilerde)\s*$/iu;
