import type { ScoreContext } from "./context";
import { buildOutcome, type DimensionOutcome, type FindingDraft } from "./dimension";
import { countWords, ratio } from "./text";
import { hasTurkishVerbEnding } from "./turkish";
import { sectionRanges } from "./sections";

export const IMPACT_MAX = 20;

const ACTION_VERBS = [
  // English
  "led", "owned", "built", "designed", "implemented", "delivered", "launched",
  "migrated", "automated", "reduced", "increased", "improved", "optimized",
  "optimised", "scaled", "refactored", "introduced", "established", "drove",
  "coordinated", "mentored", "negotiated", "rolled", "cut", "saved", "shipped",
  "developed", "created", "maintained", "tested", "analysed", "analyzed",
  "managed", "architected", "spearheaded", "orchestrated", "pioneered",
  // German
  "entwickelt", "umgesetzt", "eingefuhrt", "eingeführt", "aufgebaut", "verbessert",
  "optimiert", "automatisiert", "reduziert", "gesteigert", "geleitet", "betreut",
  "verantwortet", "konzipiert", "migriert", "erstellt", "eingespart",
  "gemanagt", "architektonisch", "geleitet",
  // Turkish
  "gelistirdim", "geliştirdim", "kurdum", "tasarladim", "tasarladım", "uyguladim",
  "uyguladım", "otomatiklestirdim", "otomatikleştirdim", "azalttim", "azalttım",
  "artirdim", "artırdım", "iyilestirdim", "iyileştirdim", "yonettim", "yönettim",
  "olusturdum", "oluşturdum", "kurguladim", "kurguladım"
];

const ACTION_VERB_RX = new RegExp(`^(${ACTION_VERBS.join("|")})\\b`, "i");

/**
 * German CVs often open bullets with a noun describing the work rather than a
 * verb. These are legitimate openings and should not trigger weak-verbs.
 */
const GERMAN_NOUN_OPENINGS_RX =
  /^(entwicklung|einführung|einfuehrung|konzeption|aufbau|leitung|gestaltung|realisierung|umsetzung|planung|steuerung|analyse|optimierung|migration|automatisierung|test|erstellung|betreuung|verwaltung)\b/i;

const GENERIC_RX =
  /(responsible for|worked on|involved in|assisted with|helped with|duties included|tasks included|verantwortlich fur|verantwortlich für|zustandig fur|zuständig für|(mitgewirkt|unterstutzung bei|unterstützung bei)|sorumluydum|sorumlu oldum|gorev aldim|görev aldım|destek verdim|yer aldim|yer aldım)/gi;

const BUZZWORD_RX =
  /(team player|hard.?working|detail.?oriented|results.?driven|self.?starter|go.?getter|think outside the box|dynamic personality|motivated individual|teamfahig|teamfähig|belastbar|engagiert|zuverlassig|zuverlässig|dinamik|ozverili|özverili|takim oyuncusu|takım oyuncusu|calis?kan|çalışkan)/gi;

const HEDGING_RX =
  /(familiar with|exposed to|exposure to|some experience with|basic understanding of|working knowledge of|have used|have worked with|helped to|tried to|participated in|took part in|played a role in|had a hand in|got introduced to|contributed somewhat|grundkenntnisse|basiskenntnisse|erste erfahrungen|erste erfahrung|einblicke in|temel duzeyde|temel düzeyde|temel seviye|asinalik|aşinalık|bilgi sahibi)/i;

const INFLATED_RX =
  /(spearheaded|leveraged|utilized|utilised|harnessed|in order to|tasked with|due to the fact that|on a daily basis)/gi;

const FIRST_PERSON_RX = /\b(i|my|me|ich|mein|meine|meinen|ben|benim)\b/gi;

const QUANTIFIED_RX =
  /(\d+\s*%|%\s*\d+|[€$£]\s?\d|\d+\s*(k|mio|mn|m\b|million|milyon|tausend|bin)|\d+\s*(users?|kunden|müşteri|musteri|tests?|releases?|teams?|projects?|projekte|proje|sprints?|hours?|stunden|saat|days?|tage|gun|gün))/i;

const DATE_RANGE_RX = /\b(19|20)\d{2}\s*[-–]\s*(19|20)\d{2}\b|\b(19|20)\d{2}\s*[-/]\s*(19|20)\d{2}\b/g;

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

/**
 * Keyword matching gets a CV past the filter; this is what decides whether the
 * human on the other side keeps reading.
 */
export function scoreImpact(context: ScoreContext): DimensionOutcome {
  const { bullets, raw, stats, lines } = context;
  const drafts: FindingDraft[] = [];

  const quantified = bullets.filter((bullet) => QUANTIFIED_RX.test(bullet) && !DATE_RANGE_RX.test(bullet));
  const quantifiedRatio = ratio(quantified.length, bullets.length);

  if (bullets.length >= 4) {
    if (quantifiedRatio < 0.15) {
      drafts.push({
        id: "impact.no-numbers",
        severity: "high",
        title: "Almost no measurable results",
        detail: `${quantified.length} of ${bullets.length} bullets contain a number. Claims without a figure read as job descriptions rather than achievements.`,
        fix: "Add scale or outcome to at least a third of the bullets: runtime cut from 40 to 12 minutes, 15 testers onboarded, coverage raised to 80%.",
        cost: 6
      });
    } else if (quantifiedRatio < 0.35) {
      drafts.push({
        id: "impact.few-numbers",
        severity: "medium",
        title: "Thin on measurable results",
        detail: `Only ${Math.round(quantifiedRatio * 100)}% of bullets carry a figure.`,
        fix: "Quantify the outcomes you remember best; an estimate with a unit beats no number at all.",
        cost: 3
      });
    }

    // Turkish is verb-final: the ownership verb closes the bullet, so the
    // English-anchored check would score every Turkish bullet as verbless.
    // German CVs often open with a noun (Entwicklung, Einführung, etc.)
    // rather than a verb; these are legitimate openings.
    const turkish = context.language === "tr";
    const german = context.language === "de";
    const withVerb = bullets.filter(
      (bullet) =>
        ACTION_VERB_RX.test(bullet) ||
        (turkish && hasTurkishVerbEnding(bullet)) ||
        (german && GERMAN_NOUN_OPENINGS_RX.test(bullet))
    );
    const verbRatio = ratio(withVerb.length, bullets.length);
    if (verbRatio < 0.35) {
      drafts.push({
        id: "impact.weak-verbs",
        severity: "medium",
        title: "Bullets do not open with an action",
        detail: `${Math.round(verbRatio * 100)}% of bullets start with an ownership verb. The rest open with nouns or filler.`,
        fix: "Start each bullet with what you did: built, migrated, automated, reduced.",
        cost: 4
      });
    }

    const hedged = bullets.filter((bullet) => HEDGING_RX.test(bullet));
    if (ratio(hedged.length, bullets.length) >= 0.15) {
      drafts.push({
        id: "impact.hedging",
        severity: "low",
        title: "Bullets hedge instead of claiming the work",
        detail: `${hedged.length} of ${bullets.length} bullets qualify your contribution with phrases like "familiar with" or "Grundkenntnisse". A hedged claim reads as no claim at all.`,
        fix: "Rewrite each one as something you did: the action, the tool and the part you owned.",
        cost: 2,
        evidence: hedged.slice(0, 3).map((bullet) => bullet.slice(0, 120))
      });
    }

    const longBullets = bullets.filter((bullet) => countWords(bullet) > 38);
    if (longBullets.length > Math.max(2, bullets.length * 0.25)) {
      drafts.push({
        id: "impact.long-bullets",
        severity: "low",
        title: "Bullets run into paragraphs",
        detail: `${longBullets.length} bullets are longer than 38 words, which buries the result at the end.`,
        fix: "Keep a bullet to one action and one outcome, under two lines.",
        cost: 2,
        evidence: longBullets.slice(0, 2).map((bullet) => `${bullet.slice(0, 120)}...`)
      });
    }
  } else {
    // Fewer than 4 bullets: measure experience section lines instead
    const ranges = sectionRanges(context.sections, lines.length);
    const experienceRange = ranges.find(r => r.id === "experience");
    const experienceContent = experienceRange
      ? lines.slice(experienceRange.start + 1, experienceRange.end).filter((line) => line.length > 0)
      : [];

    // No bullet and no experience line means every check in this dimension
    // ran on nothing. Without this finding an empty document kept most of
    // Impact simply because there was no claim to fault. A CV with a few
    // bullets, or with prose under an experience heading, never reaches it.
    if (bullets.length === 0 && experienceContent.length === 0) {
      drafts.push({
        id: "impact.nothing-to-measure",
        severity: "high",
        title: "No work described that could show results",
        detail: "The document has no bullets and no lines under an experience heading, so there is no achievement to read.",
        fix: "Add an experience section and describe each role in a few bullets: what you did and what came of it.",
        cost: 10
      });
    }

    if (experienceRange) {
      const nonEmptyLines = experienceContent;
      const quantifiedLines = nonEmptyLines.filter(l => QUANTIFIED_RX.test(l) && !DATE_RANGE_RX.test(l));
      
      if (nonEmptyLines.length > 0 && ratio(quantifiedLines.length, nonEmptyLines.length) < 0.15) {
        drafts.push({
          id: "impact.no-numbers",
          severity: "high",
          title: "Almost no measurable results",
          detail: `Few bullets and little quantification in the experience section. Claims without a figure read as job descriptions rather than achievements.`,
          fix: "Add scale or outcome to at least a third of the lines: runtime cut from 40 to 12 minutes, 15 testers onboarded, coverage raised to 80%.",
          cost: 6
        });
      }

      const withVerb = nonEmptyLines.filter(
        (line) =>
          ACTION_VERB_RX.test(line) ||
          (context.language === "tr" && hasTurkishVerbEnding(line)) ||
          (context.language === "de" && GERMAN_NOUN_OPENINGS_RX.test(line))
      );
      if (nonEmptyLines.length >= 3 && ratio(withVerb.length, nonEmptyLines.length) < 0.35) {
        drafts.push({
          id: "impact.weak-verbs",
          severity: "medium",
          title: "Experience lines do not open with an action",
          detail: `Few lines in the experience section start with an ownership verb or action noun.`,
          fix: "Start each line with what you did: built, migrated, automated, reduced.",
          cost: 4
        });
      }
    } else if (!/\d/.test(raw)) {
      drafts.push({
        id: "impact.no-numbers-at-all",
        severity: "high",
        title: "No figures anywhere in the document",
        detail: "Nothing in the text quantifies scope, scale or outcome.",
        fix: "Add team sizes, volumes, durations and before/after numbers to the recent roles.",
        cost: 6
      });
    }
  }

  const generic = countMatches(raw, GENERIC_RX);
  if (generic >= 3) {
    drafts.push({
      id: "impact.generic-phrasing",
      severity: "medium",
      title: "Responsibility phrasing instead of results",
      detail: `"Responsible for" and its variants appear ${generic} times. They describe a job title, not your contribution.`,
      fix: "Rewrite each one as an action plus an outcome.",
      cost: 3
    });
  } else if (generic > 0) {
    drafts.push({
      id: "impact.some-generic-phrasing",
      severity: "low",
      title: "Some responsibility phrasing left",
      detail: `${generic} bullet(s) still open with a responsibility phrase.`,
      fix: "Swap them for an action verb.",
      cost: 1
    });
  }

  const inflated = [...new Set((raw.match(INFLATED_RX) ?? []).map((match) => match.toLowerCase()))];
  if (inflated.length > 0) {
    drafts.push({
      id: "impact.inflated-language",
      severity: "low",
      title: "Inflated verbs and filler padding",
      detail: `${inflated.join(", ")} add words without adding facts. Plain verbs read as more credible, and shorter bullets survive the six-second scan.`,
      fix: 'Swap each one for the plain verb: "led", "used", "to". Delete the filler outright.',
      cost: 1,
      evidence: inflated.slice(0, 5)
    });
  }

  const buzzwords = countMatches(raw, BUZZWORD_RX);
  if (buzzwords >= 3) {
    drafts.push({
      id: "impact.buzzwords",
      severity: "low",
      title: "Unsupported character claims",
      detail: `${buzzwords} generic self-descriptions such as "team player" appear. They carry no keyword value and no evidence.`,
      fix: "Replace them with a situation that demonstrates the trait.",
      cost: 2
    });
  }

  const pronouns = countMatches(raw, FIRST_PERSON_RX);
  if (stats.words > 200 && ratio(pronouns, stats.words) > 0.035) {
    drafts.push({
      id: "impact.first-person",
      severity: "low",
      title: "Heavy first-person narration",
      detail: "CV bullets conventionally drop the pronoun; it costs space and reads as a cover letter.",
      fix: 'Cut "I" and start from the verb.',
      cost: 2
    });
  }

  return buildOutcome("impact", "Impact", IMPACT_MAX, drafts, (score) =>
    score >= 17
      ? "Concrete, quantified, written as achievements."
      : score >= 11
        ? "Readable, but the results behind the work stay implicit."
        : "Reads as a task list rather than a record of results."
  );
}
