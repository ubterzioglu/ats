/**
 * Hand-labelled job ads for measuring keyword extraction.
 *
 * `expected` is what an ATS would index the ad by: a miss here is a recall
 * loss. `acceptable` are domain terms that are reasonable to extract but not
 * required. Anything extracted outside both lists counts against precision.
 * Terms use the engine's canonical spelling (see `canonicalize`).
 */
export interface GoldenJobAd {
  readonly id: string;
  readonly text: string;
  readonly expected: readonly string[];
  readonly acceptable: readonly string[];
  /** Terms that must never be extracted from this ad. */
  readonly forbidden: readonly string[];
}

export const GOLDEN_JOB_ADS: readonly GoldenJobAd[] = [
  {
    id: "backend-en",
    text: `Backend Engineer (Payments)

We are a fintech scale-up preparing the go-live of our new payments platform.

What you'll do
- Build and operate microservices in Go and Java
- Design REST and gRPC APIs consumed by our mobile apps
- Own PostgreSQL schemas and Kafka event streams
- Work with our R&D group on fraud detection

Requirements
- 4+ years of backend development
- Strong Go or Java, with Spring Boot experience
- PostgreSQL, Redis and Kafka in production
- Docker and Kubernetes on AWS
- CI/CD with GitHub Actions

Nice to have
- Terraform
- Observability with Prometheus and Grafana
`,
    expected: [
      "golang", "java", "spring boot", "postgresql", "redis", "kafka", "docker",
      "kubernetes", "aws", "ci/cd", "github actions", "microservices", "rest", "grpc"
    ],
    acceptable: [
      "terraform", "prometheus", "grafana", "observability", "payments", "backend",
      "apis", "event", "streams", "fraud", "detection", "platform", "production",
      "development", "schemas", "mobile", "fintech"
    ],
    forbidden: ["r"]
  },
  {
    id: "data-en",
    text: `Data Engineer

Join the analytics platform team that powers reporting across the group.

Responsibilities
- Build batch and streaming pipelines with Spark and Airflow
- Model the data warehouse in Snowflake using dbt
- Keep ETL jobs reliable and well tested
- Partner with analysts using Tableau and Power BI

Must have
- Python and SQL at a professional level
- 3+ years with Spark or Databricks
- Airflow orchestration
- Experience with Snowflake or BigQuery

Preferred
- Kafka
- Data quality tooling
`,
    expected: [
      "python", "sql", "spark", "airflow", "snowflake", "dbt", "etl", "data warehouse",
      "databricks", "bigquery", "tableau", "power bi"
    ],
    acceptable: [
      "kafka", "pipelines", "analytics", "streaming", "batch", "reporting", "data",
      "quality", "orchestration", "analysts", "platform", "tooling", "jobs"
    ],
    forbidden: []
  },
  {
    id: "qa-de",
    text: `Testautomatisierer (m/w/d)

Für unser Produktteam in München suchen wir Verstärkung im Bereich Qualitätssicherung.

Deine Aufgaben
- Aufbau und Pflege der Testautomatisierung mit Selenium und Java
- Entwicklung von API-Tests mit Postman und REST Assured
- Integration der Tests in Jenkins Pipelines
- Pflege der Testfälle in Jira und Xray

Dein Profil
- Mindestens 3 Jahre Erfahrung in der Testautomatisierung
- Sehr gute Kenntnisse in Java und TestNG
- Erfahrung mit Cucumber und BDD
- ISTQB Zertifizierung

Wünschenswert
- Erfahrung mit Playwright
- Grundkenntnisse in Docker
`,
    expected: [
      "test automation", "selenium", "java", "postman", "rest assured", "jenkins",
      "jira", "xray", "testng", "cucumber", "bdd", "istqb"
    ],
    acceptable: [
      "playwright", "docker", "api", "pipelines", "tests", "testfälle", "integration",
      "qualitätssicherung", "zertifizierung", "produktteam"
    ],
    forbidden: []
  },
  {
    id: "frontend-tr",
    text: `Kıdemli Frontend Geliştirici

İstanbul ofisimizde e-ticaret platformumuzu geliştirecek ekip arkadaşı arıyoruz.

Sorumluluklar
- React ve TypeScript ile kullanıcı arayüzleri geliştirmek
- Next.js ile sunucu taraflı render performansını iyileştirmek
- Tasarım ekibiyle Figma üzerinden çalışmak
- Jest ve Cypress ile test yazmak

Aranan nitelikler
- En az 5 yıl frontend deneyimi
- React, Redux ve TypeScript konusunda güçlü bilgi
- HTML, CSS ve Tailwind deneyimi
- Git ve code review kültürüne aşinalık

Tercihen
- GraphQL deneyimi
- Erişilebilirlik konusunda bilgi
`,
    expected: [
      "react", "typescript", "next.js", "figma", "jest", "cypress", "redux", "html",
      "css", "tailwind", "git", "code review"
    ],
    acceptable: [
      "graphql", "frontend", "performans", "performansını", "arayüzleri", "platform",
      "platformumuzu", "e-ticaret", "render", "test", "tasarım", "erişilebilirlik",
      "geliştirici", "kullanıcı", "sunucu"
    ],
    forbidden: []
  },
  {
    id: "devops-en",
    text: `Site Reliability Engineer

Our SRE team keeps a high-traffic marketplace available around the clock.

You will
- Run Kubernetes clusters on Google Cloud with Helm and ArgoCD
- Manage infrastructure as code with Terraform and Ansible
- Improve observability with Prometheus, Grafana and Datadog
- Lead incident response and postmortems

You bring
- 5+ years in SRE or platform engineering
- Linux internals and networking
- Scripting in Python or Bash
- Nginx and load balancing

Bonus
- Go
- Cost optimisation on cloud platforms
`,
    expected: [
      "sre", "kubernetes", "google cloud", "helm", "argocd", "terraform", "ansible",
      "prometheus", "grafana", "datadog", "observability", "linux", "python", "bash", "nginx"
    ],
    acceptable: [
      "golang", "infrastructure", "incident", "response", "postmortems", "platform",
      "engineering", "networking", "scripting", "clusters", "cloud", "marketplace",
      "reliability", "load", "balancing", "internals", "code", "optimisation", "cost"
    ],
    forbidden: []
  }
];
