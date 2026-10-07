export type ActionVerbCategory =
  | "leadership"
  | "analysis"
  | "implementation"
  | "optimization"
  | "communication";

export interface ActionVerb {
  readonly verb: string;
  readonly category: ActionVerbCategory;
  readonly language: "en" | "de" | "tr";
}

export const ACTION_VERB_LIBRARY: readonly ActionVerb[] = [
  // English - Leadership
  { verb: "led", category: "leadership", language: "en" },
  { verb: "directed", category: "leadership", language: "en" },
  { verb: "spearheaded", category: "leadership", language: "en" },
  { verb: "orchestrated", category: "leadership", language: "en" },
  { verb: "championed", category: "leadership", language: "en" },
  { verb: "mentored", category: "leadership", language: "en" },
  { verb: "supervised", category: "leadership", language: "en" },
  { verb: "founded", category: "leadership", language: "en" },
  { verb: "empowered", category: "leadership", language: "en" },
  { verb: "guided", category: "leadership", language: "en" },

  // English - Implementation
  { verb: "built", category: "implementation", language: "en" },
  { verb: "developed", category: "implementation", language: "en" },
  { verb: "engineered", category: "implementation", language: "en" },
  { verb: "designed", category: "implementation", language: "en" },
  { verb: "architected", category: "implementation", language: "en" },
  { verb: "implemented", category: "implementation", language: "en" },
  { verb: "deployed", category: "implementation", language: "en" },
  { verb: "configured", category: "implementation", language: "en" },
  { verb: "constructed", category: "implementation", language: "en" },
  { verb: "launched", category: "implementation", language: "en" },
  { verb: "shipped", category: "implementation", language: "en" },
  { verb: "programmed", category: "implementation", language: "en" },

  // English - Optimization
  { verb: "optimized", category: "optimization", language: "en" },
  { verb: "automated", category: "optimization", language: "en" },
  { verb: "streamlined", category: "optimization", language: "en" },
  { verb: "reduced", category: "optimization", language: "en" },
  { verb: "accelerated", category: "optimization", language: "en" },
  { verb: "refactored", category: "optimization", language: "en" },
  { verb: "scaled", category: "optimization", language: "en" },
  { verb: "modernized", category: "optimization", language: "en" },
  { verb: "overhauled", category: "optimization", language: "en" },
  { verb: "consolidated", category: "optimization", language: "en" },

  // English - Analysis
  { verb: "analyzed", category: "analysis", language: "en" },
  { verb: "evaluated", category: "analysis", language: "en" },
  { verb: "assessed", category: "analysis", language: "en" },
  { verb: "diagnosed", category: "analysis", language: "en" },
  { verb: "audited", category: "analysis", language: "en" },
  { verb: "investigated", category: "analysis", language: "en" },
  { verb: "benchmarked", category: "analysis", language: "en" },
  { verb: "identified", category: "analysis", language: "en" },

  // English - Communication
  { verb: "negotiated", category: "communication", language: "en" },
  { verb: "presented", category: "communication", language: "en" },
  { verb: "partnered", category: "communication", language: "en" },
  { verb: "facilitated", category: "communication", language: "en" },
  { verb: "published", category: "communication", language: "en" },
  { verb: "collaborated", category: "communication", language: "en" },

  // German - Führung (Leadership)
  { verb: "geleitet", category: "leadership", language: "de" },
  { verb: "geführt", category: "leadership", language: "de" },
  { verb: "gesteuert", category: "leadership", language: "de" },
  { verb: "verantwortet", category: "leadership", language: "de" },
  { verb: "koordiniert", category: "leadership", language: "de" },
  { verb: "betreut", category: "leadership", language: "de" },

  // German - Umsetzung (Implementation)
  { verb: "entwickelt", category: "implementation", language: "de" },
  { verb: "umgesetzt", category: "implementation", language: "de" },
  { verb: "eingeführt", category: "implementation", language: "de" },
  { verb: "aufgebaut", category: "implementation", language: "de" },
  { verb: "konzipiert", category: "implementation", language: "de" },
  { verb: "erstellt", category: "implementation", language: "de" },
  { verb: "implementiert", category: "implementation", language: "de" },
  { verb: "bereitgestellt", category: "implementation", language: "de" },

  // German - Optimierung (Optimization)
  { verb: "optimiert", category: "optimization", language: "de" },
  { verb: "automatisiert", category: "optimization", language: "de" },
  { verb: "verbessert", category: "optimization", language: "de" },
  { verb: "reduziert", category: "optimization", language: "de" },
  { verb: "beschleunigt", category: "optimization", language: "de" },
  { verb: "skaliert", category: "optimization", language: "de" },
  { verb: "eingespart", category: "optimization", language: "de" },
  { verb: "migriert", category: "optimization", language: "de" },

  // German - Analyse (Analysis)
  { verb: "analysiert", category: "analysis", language: "de" },
  { verb: "evaluiert", category: "analysis", language: "de" },
  { verb: "geprüft", category: "analysis", language: "de" },
  { verb: "untersucht", category: "analysis", language: "de" },
  { verb: "identifiziert", category: "analysis", language: "de" },

  // Turkish - Liderlik (Leadership)
  { verb: "yönettim", category: "leadership", language: "tr" },
  { verb: "yönetti", category: "leadership", language: "tr" },
  { verb: "koordine ettim", category: "leadership", language: "tr" },
  { verb: "koordine etti", category: "leadership", language: "tr" },
  { verb: "liderlik ettim", category: "leadership", language: "tr" },
  { verb: "liderlik etti", category: "leadership", language: "tr" },
  { verb: "yürüttüm", category: "leadership", language: "tr" },
  { verb: "yürüttü", category: "leadership", language: "tr" },
  { verb: "mentörlük yaptım", category: "leadership", language: "tr" },

  // Turkish - Uygulama (Implementation)
  { verb: "geliştirdim", category: "implementation", language: "tr" },
  { verb: "geliştirdi", category: "implementation", language: "tr" },
  { verb: "tasarladım", category: "implementation", language: "tr" },
  { verb: "tasarladı", category: "implementation", language: "tr" },
  { verb: "kurdum", category: "implementation", language: "tr" },
  { verb: "kurdu", category: "implementation", language: "tr" },
  { verb: "oluşturdum", category: "implementation", language: "tr" },
  { verb: "oluşturdu", category: "implementation", language: "tr" },
  { verb: "inşa ettim", category: "implementation", language: "tr" },
  { verb: "kodladım", category: "implementation", language: "tr" },
  { verb: "kurguladım", category: "implementation", language: "tr" },
  { verb: "kurguladı", category: "implementation", language: "tr" },
  { verb: "tamamladım", category: "implementation", language: "tr" },
  { verb: "tamamladı", category: "implementation", language: "tr" },

  // Turkish - Optimizasyon (Optimization)
  { verb: "iyileştirdim", category: "optimization", language: "tr" },
  { verb: "iyileştirdi", category: "optimization", language: "tr" },
  { verb: "otomatikleştirdim", category: "optimization", language: "tr" },
  { verb: "otomatikleştirdi", category: "optimization", language: "tr" },
  { verb: "optimize ettim", category: "optimization", language: "tr" },
  { verb: "optimize etti", category: "optimization", language: "tr" },
  { verb: "hızlandırdım", category: "optimization", language: "tr" },
  { verb: "artırdım", category: "optimization", language: "tr" },
  { verb: "artırdı", category: "optimization", language: "tr" },
  { verb: "azalttım", category: "optimization", language: "tr" },
  { verb: "azalttı", category: "optimization", language: "tr" },
  { verb: "ölçeklendirdim", category: "optimization", language: "tr" },

  // Turkish - Analiz (Analysis)
  { verb: "analiz ettim", category: "analysis", language: "tr" },
  { verb: "analiz etti", category: "analysis", language: "tr" },
  { verb: "değerlendirdim", category: "analysis", language: "tr" },
  { verb: "değerlendirdi", category: "analysis", language: "tr" },
  { verb: "inceledim", category: "analysis", language: "tr" },
  { verb: "denetledim", category: "analysis", language: "tr" },
  { verb: "tespit ettim", category: "analysis", language: "tr" }
];
