/**
 * A gate, not a finding: before the engine spends a score on something that
 * is not a CV, it says so. The analyzer shows the warning and lets the user
 * score anyway - the judgement belongs to the person who uploaded the file.
 */

export interface DocumentKindAssessment {
  readonly confident: boolean;
  /** Empty when confident; otherwise one plain sentence for the UI. */
  readonly reason: string;
  readonly positiveSignals: number;
  readonly negativeSignals: number;
}

const POSITIVE_SIGNALS: readonly RegExp[] = [
  /\b(resume|resumé|curriculum vitae|cv|lebenslauf|özgeçmiş|ozgecmis)\b/i,
  /\b(experience|work history|employment|berufserfahrung|werdegang|deneyim|tecrübe|tecrube)\b/i,
  /\b(education|university|college|degree|bachelor|master|phd|ausbildung|studium|eğitim|egitim|öğrenim|universität|üniversite)\b/i,
  /\b(skills|proficiencies|technologies|competencies|kenntnisse|fähigkeiten|faehigkeiten|yetenekler|beceriler)\b/i,
  /\b(summary|objective|profile|profil|kurzprofil|hakkımda|hakkimda|özet|ozet)\b/i,
  /\b(certifications?|licenses?|zertifikate|sertifikalar?|sertifika)\b/i,
  /\b(projects?|portfolio|projekte|projeler)\b/i,
  /[\w.+-]+@[\w-]+\.[a-z]{2,}/i,
  /\+?\d[\d\s\-().]{8,}\d/,
  /\b(?:19|20)\d{2}\b[\s\S]*\b(present|current|heute|halen|devam)\b/i,
  /\b(managed|developed|designed|led|built|created|improved|achieved|automated|migrated|reduced|entwickelt|umgesetzt|geliştirdim|kurdum|yönettim)\b/i
];

const NEGATIVE_SIGNALS: readonly RegExp[] = [
  /\b(dear\s+\w+|to whom it may concern|sehr geehrte|sayın yetkili)\b/i,
  /\b(sincerely|kind regards|best regards|mit freundlichen grüßen|saygılarımla)\b/i,
  /\b(chapter|section \d+|paragraph|thesis|abstract|bibliography|dissertation)\b/i,
  /\b(invoice|total due|payment due|billing|subtotal|rechnung|fatura)\b/i,
  /\b(question \d+|answer:|response:|prompt:)\b/i,
  /\b(once upon a time|novel|fiction|short story)\b/i,
  /\b(recipe|ingredients|preheat|tablespoon|yemek tarifi|malzemeler)\b/i
];

const MIN_POSITIVE_SIGNALS = 3;

export function assessDocumentKind(text: string): DocumentKindAssessment {
  const positives = POSITIVE_SIGNALS.filter((signal) => signal.test(text)).length;
  const negatives = NEGATIVE_SIGNALS.filter((signal) => signal.test(text)).length;

  if (negatives >= 2) {
    return {
      confident: false,
      reason: "This document does not read like a CV - it looks like a letter, essay or other document type.",
      positiveSignals: positives,
      negativeSignals: negatives
    };
  }
  if (negatives === 1 && positives < MIN_POSITIVE_SIGNALS) {
    return {
      confident: false,
      reason: "This may not be a CV. Scores computed on other document types are not meaningful.",
      positiveSignals: positives,
      negativeSignals: negatives
    };
  }
  if (positives < MIN_POSITIVE_SIGNALS) {
    return {
      confident: false,
      reason: "None of the things a CV is made of were found: no sections, no contact data, no employment dates.",
      positiveSignals: positives,
      negativeSignals: negatives
    };
  }

  return { confident: true, reason: "", positiveSignals: positives, negativeSignals: negatives };
}
