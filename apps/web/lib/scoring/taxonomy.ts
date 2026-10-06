/**
 * A curated skill vocabulary. It does two jobs:
 *  - terms found here get a weight bonus when keywords are mined from a job
 *    description, so "kubernetes" outranks "collaborate";
 *  - without a job description it provides the baseline coverage check.
 *
 * Multi-word entries are matched as phrases, single words as tokens.
 */
export const SKILL_TAXONOMY: readonly string[] = [
  // languages
  "javascript", "typescript", "python", "java", "kotlin", "swift", "go", "golang",
  "rust", "c#", "c++", "php", "ruby", "scala", "perl", "bash", "powershell", "sql",
  "pl/sql", "t-sql", "r", "matlab", "dart", "groovy", "abap",
  // web / frontend
  "react", "next.js", "vue", "nuxt", "angular", "svelte", "redux", "tailwind",
  "html", "css", "sass", "webpack", "vite", "graphql", "rest", "grpc", "websocket",
  "user interface", "user experience",
  // backend / platform
  "node.js", "express", "nestjs", "spring", "spring boot", "django", "flask",
  "fastapi", "laravel", ".net", "asp.net", "rails", "microservices", "api",
  "api design", "message queue", "kafka", "rabbitmq", "redis", "elasticsearch",
  "nosql", "oop",
  // data
  "postgresql", "mysql", "mssql", "oracle", "mongodb", "dynamodb", "snowflake",
  "bigquery", "databricks", "spark", "hadoop", "airflow", "dbt", "etl", "data warehouse",
  "pandas", "numpy", "power bi", "tableau", "looker", "business intelligence", "dba",
  // cloud / devops
  "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "helm", "terraform",
  "ansible", "jenkins", "github actions", "gitlab ci", "argocd", "ci/cd", "linux",
  "nginx", "prometheus", "grafana", "datadog", "observability", "sre", "devops",
  "infrastructure as code",
  // qa / testing
  "qa", "quality assurance", "test automation", "selenium", "playwright", "cypress",
  "appium", "ranorex", "testng", "junit", "pytest", "jest", "vitest", "cucumber",
  "bdd", "tdd", "rest assured", "postman", "soapui", "jmeter", "k6", "load testing",
  "performance testing", "regression testing", "smoke test", "test strategy",
  "test plan", "test case", "defect management", "istqb", "xray", "testrail", "zephyr",
  "accessibility testing", "api testing", "mobile testing", "cross-browser",
  // ai / ml
  "machine learning", "deep learning", "pytorch", "tensorflow", "scikit-learn",
  "nlp", "llm", "langchain", "rag", "prompt engineering", "computer vision", "mlops",
  "ai",
  // security
  "owasp", "penetration testing", "iso 27001", "gdpr", "soc 2", "threat modeling",
  "sast", "dast", "iam", "oauth", "saml", "zero trust",
  // ways of working
  "agile", "scrum", "kanban", "safe", "jira", "confluence", "git", "code review",
  "pair programming", "stakeholder management", "requirements engineering",
  "product owner", "scrum master", "roadmap", "okr", "kpi",
  // business / other
  "sap", "salesforce", "erp", "crm", "excel", "vba", "project management", "pmp",
  "prince2", "budgeting", "forecasting", "procurement", "supply chain", "logistics",
  "customer success", "b2b", "b2c", "seo", "sem", "copywriting", "figma", "ux research",
  "saas", "paas", "iaas", "mvp", "roi",
  // finance & accounting
  "accounting", "bookkeeping", "financial reporting", "financial analysis", "ifrs", "gaap",
  "hgb", "datev", "accounts payable", "accounts receivable", "audit", "cost accounting",
  // health care
  "patient care", "nursing", "ehr", "emr", "hipaa", "first aid", "bls", "acls", "triage",
  "wound care", "infection control", "medication administration", "phlebotomy", "icd-10",
  // sales
  "lead generation", "pipeline management", "quota attainment", "account management",
  "key account management", "business development", "cold calling", "negotiation",
  "upselling", "cross-selling", "hubspot",
  // logistics & operations
  "warehouse management", "wms", "inventory management", "incoterms", "freight forwarding",
  "customs clearance", "fleet management", "demand planning", "forklift", "lean management",
  "six sigma", "kaizen"
];

export const SKILL_SET: ReadonlySet<string> = new Set(SKILL_TAXONOMY);

export const MULTI_WORD_SKILLS: readonly string[] = SKILL_TAXONOMY.filter((term) =>
  term.includes(" ")
);

export function isKnownSkill(term: string): boolean {
  return SKILL_SET.has(term);
}

/**
 * Terms that ATS keyword matching treats as equivalent: acronym <-> expansion,
 * spelling variants and established translations. Only true synonyms belong
 * here; "agile" and "scrum" are related, not equivalent, and stay separate.
 * Every key must be a member of SKILL_TAXONOMY (tests/taxonomy-synonyms.test.ts
 * enforces it), and no alias may serve two keys.
 */
export const SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  // languages & runtimes
  "golang": ["go"],
  "c#": ["csharp", "c sharp"],
  "c++": ["cplusplus", "c plus plus"],
  "javascript": ["js"],
  "typescript": ["ts"],
  "node.js": ["nodejs", "node"],
  ".net": ["dotnet", "dot net"],
  // web & frontend
  "react": ["reactjs", "react.js"],
  "vue": ["vuejs", "vue.js"],
  "next.js": ["nextjs"],
  "express": ["expressjs", "express.js"],
  "nestjs": ["nest.js"],
  "fastapi": ["fast api"],
  "html": ["html5", "hypertext markup language"],
  "css": ["css3", "cascading style sheets"],
  "user interface": ["ui", "benutzeroberfläche", "kullanıcı arayüzü"],
  "user experience": ["ux", "kullanıcı deneyimi"],
  // backend & platform
  "api": ["apis", "application programming interface"],
  "microservices": ["micro-services", "microservice", "mikroservis"],
  "spring boot": ["springboot", "spring-boot"],
  "rabbitmq": ["rabbit mq"],
  "mongodb": ["mongo"],
  "mssql": ["sql server", "microsoft sql server"],
  "sql": ["structured query language"],
  "nosql": ["no-sql", "non-relational database"],
  "elasticsearch": ["elastic search", "elastic-search"],
  "oop": ["object oriented programming", "object-oriented programming"],
  // data
  "postgresql": ["postgres"],
  "etl": ["extract transform load", "extract-transform-load"],
  "data warehouse": ["data warehousing", "data-warehouse", "veri ambarı"],
  "kafka": ["apache kafka"],
  "spark": ["apache spark"],
  "airflow": ["apache airflow"],
  "hadoop": ["apache hadoop"],
  "bigquery": ["big query"],
  "dynamodb": ["dynamo db"],
  "power bi": ["powerbi", "microsoft power bi"],
  "business intelligence": ["bi", "iş zekası"],
  "scikit-learn": ["sklearn", "scikit learn"],
  "dba": ["database administrator", "database administration"],
  // cloud & devops
  "aws": ["amazon web services"],
  "azure": ["microsoft azure"],
  "google cloud": ["gcp", "google cloud platform"],
  "kubernetes": ["k8s", "k8"],
  "terraform": ["hashicorp terraform"],
  "argocd": ["argo cd", "argo-cd"],
  "gitlab ci": ["gitlab-ci", "gitlab ci/cd"],
  "ci/cd": ["cicd", "ci", "continuous integration", "continuous delivery", "continuous deployment"],
  "devops": ["dev ops", "dev-ops", "development operations"],
  "sre": ["site reliability engineering"],
  "infrastructure as code": ["iac"],
  "observability": ["gözlemlenebilirlik"],
  // qa & testing
  "quality assurance": ["qa", "qualitätssicherung", "kalite güvencesi"],
  "test automation": ["automated testing", "testautomatisierung", "test otomasyonu"],
  "tdd": ["test driven development", "test-driven development"],
  "bdd": ["behavior driven development", "behaviour driven development", "behavior-driven development"],
  "regression testing": ["regressionstest", "regresyon testi"],
  "load testing": ["lasttest", "yük testi"],
  "performance testing": ["leistungstest", "performans testi"],
  "penetration testing": ["pentest", "pentesting", "pen testing"],
  "smoke test": ["smoke testing"],
  "test case": ["test cases", "testfall"],
  "test plan": ["test plans"],
  "soapui": ["soap ui"],
  "cross-browser": ["cross browser"],
  // ai & ml
  "ai": ["artificial intelligence", "künstliche intelligenz", "yapay zeka"],
  "machine learning": ["ml", "maschinelles lernen", "makine öğrenmesi"],
  "deep learning": ["deeplearning", "deep-learning"],
  "nlp": ["natural language processing", "doğal dil işleme"],
  "llm": ["large language model", "large language models"],
  "rag": ["retrieval augmented generation", "retrieval-augmented generation"],
  "mlops": ["machine learning operations"],
  // security
  "gdpr": ["dsgvo", "general data protection regulation"],
  "soc 2": ["soc2", "soc 2 type ii"],
  "iso 27001": ["iso27001"],
  "sast": ["static application security testing"],
  "dast": ["dynamic application security testing"],
  "iam": ["identity and access management"],
  "zero trust": ["zero-trust"],
  "threat modeling": ["threat modelling"],
  // ways of working
  "agile": ["agil", "çevik"],
  "scrum master": ["scrummaster"],
  "product owner": ["product-owner"],
  "code review": ["code-review", "kod incelemesi"],
  "pair programming": ["pair-programming"],
  "project management": ["projektmanagement", "proje yönetimi"],
  "pmp": ["project management professional"],
  "okr": ["objectives and key results"],
  "kpi": ["key performance indicator", "key performance indicators"],
  "jira": ["atlassian jira"],
  "confluence": ["atlassian confluence"],
  // business
  "saas": ["software as a service"],
  "paas": ["platform as a service"],
  "iaas": ["infrastructure as a service"],
  "crm": [
    "customer relationship management",
    "kundenbeziehungsmanagement",
    "müşteri ilişkileri yönetimi"
  ],
  "erp": ["enterprise resource planning"],
  "mvp": ["minimum viable product"],
  "roi": ["return on investment"],
  "b2b": ["business to business"],
  "b2c": ["business to consumer"],
  "seo": ["search engine optimization", "search engine optimisation"],
  "sem": ["search engine marketing"],
  "salesforce": ["sales force"],
  "excel": ["microsoft excel", "ms excel"],
  "vba": ["visual basic for applications"],
  "supply chain": [
    "supply-chain",
    "supply chain management",
    "tedarik zinciri",
    "tedarik zinciri yönetimi",
    "lieferkette",
    "lieferkettenmanagement"
  ],
  "procurement": ["satın alma", "purchasing", "einkauf", "beschaffung"],
  "budgeting": ["budgetierung", "budgetplanung", "bütçeleme", "bütçe planlama"],
  "forecasting": ["forecast", "tahminleme"],
  "logistics": ["logistik", "lojistik"],
  // finance & accounting
  "accounting": ["buchhaltung", "rechnungswesen", "finanzbuchhaltung", "muhasebe"],
  "bookkeeping": ["ön muhasebe"],
  "financial reporting": ["finanzberichterstattung", "finansal raporlama"],
  "financial analysis": ["finanzanalyse", "finansal analiz"],
  "ifrs": ["international financial reporting standards"],
  "gaap": ["us gaap", "us-gaap", "generally accepted accounting principles"],
  "accounts payable": ["kreditorenbuchhaltung"],
  "accounts receivable": ["debitorenbuchhaltung"],
  "audit": ["auditing", "wirtschaftsprüfung", "denetim"],
  "cost accounting": ["kostenrechnung", "maliyet muhasebesi"],
  // health care
  "patient care": ["patientenversorgung", "patientenbetreuung", "hasta bakımı"],
  "nursing": ["krankenpflege", "hemşirelik"],
  "ehr": ["electronic health record", "electronic health records", "elektronische patientenakte"],
  "emr": ["electronic medical record", "electronic medical records"],
  "first aid": ["erste hilfe", "ilk yardım"],
  "bls": ["basic life support"],
  "acls": ["advanced cardiovascular life support"],
  "triage": ["triyaj"],
  "wound care": ["wundversorgung", "yara bakımı"],
  "infection control": ["infektionsprävention", "enfeksiyon kontrolü"],
  "medication administration": ["medikamentengabe"],
  "phlebotomy": ["blutentnahme"],
  "icd-10": ["icd10", "icd 10"],
  // sales
  "lead generation": ["leadgenerierung", "lead-generierung"],
  "pipeline management": ["pipeline-management"],
  "quota attainment": ["quota achievement"],
  "account management": ["accountmanagement"],
  "key account management": ["key-account-management"],
  "business development": ["geschäftsentwicklung", "iş geliştirme"],
  "cold calling": ["kaltakquise", "soğuk arama"],
  "negotiation": ["verhandlungsführung", "müzakere"],
  "cross-selling": ["cross selling"],
  // logistics & operations
  "warehouse management": ["lagerverwaltung", "lagerwirtschaft", "depo yönetimi"],
  "wms": ["warehouse management system", "lagerverwaltungssystem", "depo yönetim sistemi"],
  "inventory management": ["bestandsmanagement", "bestandsführung", "stok yönetimi"],
  "freight forwarding": ["spedition"],
  "customs clearance": ["zollabfertigung", "gümrükleme"],
  "fleet management": ["fuhrparkmanagement", "filo yönetimi"],
  "demand planning": ["bedarfsplanung", "talep planlaması"],
  "forklift": ["gabelstapler"],
  "lean management": ["lean-management"]
};

/**
 * Aliases that are also ordinary words. "go" appears in "go-live", "r" in
 * "R&D"; counting them unconditionally turns prose into skills. They only
 * count on a line that also carries technical context.
 */
export const AMBIGUOUS_TERMS: ReadonlySet<string> = new Set(["go", "r", "c"]);

const TECH_CONTEXT_RX =
  /\b(api|apis|backend|back-end|service|services|microservice|microservices|server|golang|cloud|docker|kubernetes|container|containers|deploy|deployment|pipeline|pipelines|programming|program|programmer|language|developer|development|software|engineer|engineering|script|scripting|scripts|compiler|build|builds|tool|tools|ggplot|ggplot2|cran|tidyverse|dplyr|shiny|statistic|statistics|statistical|data|model|models|modeling|modelling|etl|analytics|ci\/cd)\b|\bggplot/i;

export function isAmbiguousTerm(term: string): boolean {
  return AMBIGUOUS_TERMS.has(term);
}

export function hasTechContext(line: string): boolean {
  return TECH_CONTEXT_RX.test(line);
}

const REVERSE_SYNONYMS: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(SYNONYMS)) {
    for (const alias of aliases) {
      // First registration wins, so an alias shared by two entries resolves
      // deterministically to whichever canonical term is listed first.
      if (!map.has(alias)) map.set(alias, canonical);
    }
  }
  return map;
})();

export function canonicalize(term: string): string {
  return REVERSE_SYNONYMS.get(term) ?? term;
}

export function variantsOf(term: string): string[] {
  const aliases = SYNONYMS[term] ?? [];
  return [term, ...aliases];
}
