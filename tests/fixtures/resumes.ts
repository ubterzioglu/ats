/**
 * Resume fixtures for the schema and round-trip tests, in the shape JSON
 * Resume documents export. Characters are deliberately Turkish and German:
 * the model must carry ş, ğ, İ, ä and ß through parse and export unchanged.
 */

export const FULL_RESUME = {
  $schema: "https://jsonresume.org/schema.json",
  basics: {
    name: "Umut Barış Terzioglu",
    label: "Senior QA Automation Engineer",
    image: "",
    email: "umut@example.com",
    phone: "+49 151 2345678",
    url: "https://example.com",
    summary:
      "Erfahrener Ingenieur für Testautomatisierung mit 9 Jahren auf der Straße zur Qualitätssicherung.",
    location: {
      address: "Musterstraße 12",
      postalCode: "10115",
      city: "Berlin",
      countryCode: "DE",
      region: "Berlin"
    },
    profiles: [
      {
        network: "LinkedIn",
        username: "example",
        url: "https://linkedin.com/in/example"
      }
    ]
  },
  work: [
    {
      name: "Adesso SE",
      position: "Senior QA Automation Engineer",
      url: "https://adesso.de",
      startDate: "2021-01",
      endDate: "",
      summary: "Owns the regression automation for an insurance platform.",
      highlights: [
        "420 senaryoluk Playwright regresyon paketi geliştirdim",
        "Reduced a 6 hour manual cycle to 35 minutes"
      ]
    },
    {
      name: "Beispiel GmbH",
      position: "QA Engineer",
      url: "",
      startDate: "2017-03",
      endDate: "2020-12",
      summary: "API test strategy across 12 services.",
      highlights: ["Introduced Xray reporting in Jira"]
    }
    ],
  volunteer: [
    {
      organization: "Kadın Yazılımcı",
      position: "Mentor",
      url: "https://example.org",
      startDate: "2019-01-01",
      endDate: "2020-01-01",
      summary: "Mentored juniors through their first automation jobs.",
      highlights: ["12 mentees, 9 placed"]
    }
  ],
  education: [
    {
      institution: "İstanbul Teknik Üniversitesi",
      url: "https://itu.edu.tr",
      area: "Computer Engineering",
      studyType: "BSc",
      startDate: "2011-09",
      endDate: "2015-06",
      score: "3.2",
      courses: ["Distributed systems", "Veri yapıları"]
    }
  ],
  awards: [
    {
      title: "Tester of the year",
      date: "2019-11-01",
      awarder: "Beispiel GmbH",
      summary: "Für herausragende Arbeit an der Regressionssuite."
    }
  ],
  publications: [
    {
      name: "Flaky tests in CI",
      publisher: "Testing Magazine",
      releaseDate: "2020-05-14",
      url: "https://example.com/flaky",
      summary: "A field guide to quarantining flakes."
    }
  ],
  skills: [
    {
      name: "Test automation",
      level: "Senior",
      keywords: ["Playwright", "Selenium", "TypeScript", "Testautomatisierung"]
    },
    {
      name: "CI/CD",
      level: "",
      keywords: ["GitLab CI", "Jenkins"]
    }
  ],
  languages: [
    { language: "Türkçe", fluency: "Ana dil" },
    { language: "Deutsch", fluency: "C1" },
    { language: "English", fluency: "C1" }
  ],
  interests: [
    { name: "Cycling", keywords: ["Gravel", "Straße"] }
  ],
  references: [
    { name: "Jane Doe", reference: "Available on request." }
  ],
  projects: [
    {
      name: "ats readability",
      isActive: true,
      description: "A CV analyzer that scores parseability.",
      highlights: ["Deterministic scoring engine"],
      keywords: ["TypeScript", "Next.js"],
      startDate: "2026-01",
      endDate: "",
      url: "https://example.com/ats",
      roles: ["Developer"],
      entity: "Personal",
      type: "application"
    }
  ],
  meta: {
    canonical: "https://raw.githubusercontent.com/jsonresume/resume-schema/master/resume.json",
    version: "v1.0.0",
    lastModified: "2026-09-30T12:00:00.000Z"
  }
} as const;

export const MINIMAL_RESUME = {} as const;

export const TURKISH_RESUME = {
  basics: {
    name: "Ayşe Yılmaz",
    label: "Kıdemli Test Otomasyon Mühendisi",
    email: "ayse@example.com",
    phone: "+90 532 000 00 00",
    summary: "Şubat 2015'ten beri İstanbul'da ışık hızında regresyon paketleri geliştiriyorum.",
    location: { city: "İstanbul", countryCode: "TR" }
  },
  work: [
    {
      name: "Örnek A.Ş.",
      position: "Test Mühendisi",
      startDate: "2020-08",
      endDate: "",
      highlights: ["Ağustos 2021'de 180 Selenium testini taşıdım", "Hata kaçış oranını %3'e düşürdüm"]
    }
  ],
  education: [
    {
      institution: "İstanbul Teknik Üniversitesi",
      area: "Bilgisayar Mühendisliği",
      studyType: "Lisans",
      startDate: "2011",
      endDate: "2015"
    }
  ],
  skills: [
    { name: "Test otomasyonu", keywords: ["Playwright", "geliştirme", "kalite güvencesi"] }
  ],
  languages: [
    { language: "Türkçe", fluency: "Ana dil" },
    { language: "Almanca", fluency: "B2" }
  ]
} as const;

export const UNKNOWN_KEYS_RESUME = {
  basics: {
    name: "Ayşe Yılmaz",
    pronouns: "she/her",
    location: { city: "İzmir", neighborhood: "Alsancak" }
  },
  work: [{ name: "Örnek A.Ş.", customField: 42, tags: ["remote"] }],
  social: [{ network: "Mastodon", url: "https://example.social/@ayse" }],
  meta: { canonical: "x", theme: "elegant" }
} as const;
