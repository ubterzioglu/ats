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
  // backend / platform
  "node.js", "express", "nestjs", "spring", "spring boot", "django", "flask",
  "fastapi", "laravel", ".net", "asp.net", "rails", "microservices", "api design",
  "message queue", "kafka", "rabbitmq", "redis", "elasticsearch",
  // data
  "postgresql", "mysql", "mssql", "oracle", "mongodb", "dynamodb", "snowflake",
  "bigquery", "databricks", "spark", "hadoop", "airflow", "dbt", "etl", "data warehouse",
  "pandas", "numpy", "power bi", "tableau", "looker",
  // cloud / devops
  "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "helm", "terraform",
  "ansible", "jenkins", "github actions", "gitlab ci", "argocd", "ci/cd", "linux",
  "nginx", "prometheus", "grafana", "datadog", "observability", "sre",
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
  "customer success", "b2b", "b2c", "seo", "sem", "copywriting", "figma", "ux research"
];

export const SKILL_SET: ReadonlySet<string> = new Set(SKILL_TAXONOMY);

export const MULTI_WORD_SKILLS: readonly string[] = SKILL_TAXONOMY.filter((term) =>
  term.includes(" ")
);

export function isKnownSkill(term: string): boolean {
  return SKILL_SET.has(term);
}

/** Terms that ATS keyword matching treats as equivalent. */
export const SYNONYMS: Readonly<Record<string, readonly string[]>> = {
  "golang": ["go"],
  "node.js": ["nodejs", "node"],
  "next.js": ["nextjs"],
  "ci/cd": ["cicd", "ci", "cd"],
  "quality assurance": ["qa"],
  "test automation": ["automated testing", "testautomatisierung", "test otomasyonu"],
  "google cloud": ["gcp"],
  "postgresql": ["postgres"],
  "kubernetes": ["k8s"],
  "javascript": ["js"],
  "typescript": ["ts"],
  "machine learning": ["ml"],
  "continuous integration": ["ci"],
  "user experience": ["ux"],
  "spring boot": ["springboot"]
};

const REVERSE_SYNONYMS: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(SYNONYMS)) {
    for (const alias of aliases) {
      map.set(alias, canonical);
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
