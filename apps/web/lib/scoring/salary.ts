import type { SeniorityLevel, TargetMarket } from "@/types/analysis";

export interface SalaryRange {
  readonly min: number;
  readonly max: number;
  readonly currency: string;
  readonly period: "yearly" | "monthly";
}

export interface SalaryBand {
  readonly level: SeniorityLevel;
  readonly market: TargetMarket | "us" | "uk";
  readonly range: SalaryRange;
}

export interface NegotiationTip {
  readonly title: string;
  readonly description: string;
}

/**
 * Indicative benchmark salary bands compiled from open labor statistics and tech market reports.
 * Used for informational reference when job vacancy descriptions omit compensation data.
 */
export const BENCHMARK_SALARY_BANDS: readonly SalaryBand[] = [
  // Germany (EUR yearly)
  { level: "junior", market: "de", range: { min: 42000, max: 55000, currency: "EUR", period: "yearly" } },
  { level: "mid", market: "de", range: { min: 58000, max: 78000, currency: "EUR", period: "yearly" } },
  { level: "senior", market: "de", range: { min: 80000, max: 105000, currency: "EUR", period: "yearly" } },
  { level: "lead", market: "de", range: { min: 98000, max: 130000, currency: "EUR", period: "yearly" } },
  { level: "principal", market: "de", range: { min: 115000, max: 155000, currency: "EUR", period: "yearly" } },

  // Turkey (TRY monthly net equivalent estimates)
  { level: "junior", market: "tr", range: { min: 38000, max: 55000, currency: "TRY", period: "monthly" } },
  { level: "mid", market: "tr", range: { min: 58000, max: 95000, currency: "TRY", period: "monthly" } },
  { level: "senior", market: "tr", range: { min: 100000, max: 165000, currency: "TRY", period: "monthly" } },
  { level: "lead", market: "tr", range: { min: 150000, max: 230000, currency: "TRY", period: "monthly" } },
  { level: "principal", market: "tr", range: { min: 190000, max: 300000, currency: "TRY", period: "monthly" } },

  // Global / English / US baseline (USD yearly)
  { level: "junior", market: "en", range: { min: 65000, max: 88000, currency: "USD", period: "yearly" } },
  { level: "mid", market: "en", range: { min: 92000, max: 130000, currency: "USD", period: "yearly" } },
  { level: "senior", market: "en", range: { min: 135000, max: 185000, currency: "USD", period: "yearly" } },
  { level: "lead", market: "en", range: { min: 165000, max: 220000, currency: "USD", period: "yearly" } },
  { level: "principal", market: "en", range: { min: 195000, max: 275000, currency: "USD", period: "yearly" } }
];

export function resolveSalaryBand(
  level: SeniorityLevel | null,
  market: TargetMarket | "us" | "uk" = "en"
): SalaryBand | null {
  if (!level) return null;
  const match = BENCHMARK_SALARY_BANDS.find(
    (entry) => entry.level === level && entry.market === market
  );
  return match ?? BENCHMARK_SALARY_BANDS.find((entry) => entry.level === level && entry.market === "en") ?? null;
}

export const NEGOTIATION_TIPS: Readonly<Record<"en" | "de" | "tr", readonly NegotiationTip[]>> = {
  en: [
    {
      title: "Anchor with a tight bracket",
      description: "Provide a 10-15% target range where your acceptable minimum sits near the bottom."
    },
    {
      title: "Deflect early numbers",
      description: "When asked upfront, prioritize role alignment before committing to a hard compensation figure."
    },
    {
      title: "Evaluate total reward",
      description: "Consider pension match, equity/RSUs, bonus target and remote allowances alongside base salary."
    },
    {
      title: "Quantify past value",
      description: "Support your request with specific business outcomes and efficiency gains from past roles."
    },
    {
      title: "Counter with gratitude and enthusiasm",
      description: "Always validate positive feedback before presenting a reasoned counteroffer."
    }
  ],
  de: [
    {
      title: "Klaren Rahmen abstecken",
      description: "Nennen Sie einen realistischen Zielkorridor von 10-15%, dessen Untergrenze Ihrer Schmerzgrenze entspricht."
    },
    {
      title: "Gesamtpaket bewerten",
      description: "Berücksichtigen Sie Urlaubstage (üblich: 28-30), betriebliche Altersvorsorge und flexible Arbeitszeiten."
    },
    {
      title: "Erfolge belegen",
      description: "Untermauern Sie Ihre Gehaltsvorstellung mit messbaren Resultaten früherer Stationen."
    },
    {
      title: "Nicht zu früh festlegen",
      description: "Fragen Sie im Erstgespräch nach der Gehaltsspanne der Position, bevor Sie eine feste Zahl nennen."
    },
    {
      title: "Entwicklungsstufen vereinbaren",
      description: "Vereinbaren Sie bei Bedarf ein Gehalt mit automatischer Anpassung nach erfolgreicher Probezeit."
    }
  ],
  tr: [
    {
      title: "Net ve brüt ayrımını netleştirin",
      description: "Teklifin net mi yoksa brüt mü olduğunu, yan haklar ve prim politikasını baştan teyit edin."
    },
    {
      title: "Dar bir aralık verin",
      description: "Tek bir sayı yerine kabul edebileceğiniz taban rakamın alt sınırda olduğu %15'lik bir bant sunun."
    },
    {
      title: "Toplam paketi değerlendirin",
      description: "Yol/yemek, özel sağlık sigortası kapsamı ve uzaktan çalışma desteklerini toplam değer olarak hesaplayın."
    },
    {
      title: "Önce rol uyumuna odaklanın",
      description: "Erken aşamada net sayı yerine önce sorumluluk ve karşılıklı uyumu detaylandırmayı tercih edin."
    },
    {
      title: "Enflasyon ve ara zam periyotlarını öğrenin",
      description: "Şirketin yılda kaç kez ve hangi periyotlarda zam yaptığını mutlaka görüşün."
    }
  ]
};

export function getNegotiationTips(language: "en" | "de" | "tr" = "en"): readonly NegotiationTip[] {
  return NEGOTIATION_TIPS[language] ?? NEGOTIATION_TIPS.en;
}
