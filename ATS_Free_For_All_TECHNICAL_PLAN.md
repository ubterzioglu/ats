# ATS Free For All — Teknik Mimari ve Geliştirme Planı

**Versiyon:** 1.0 — MVP / Foundation Architecture  
**Öncelik:** Altyapı → ATS Engine → AI Agent → Basit UI → UI 2.0

---

## 1. Proje Özeti

ATS Free For All; kullanıcının CV'sini ve hedef iş ilanını analiz eden, ATS uyumluluğunu ölçen, CV–ilan eşleşmesini açıklayan ve uygulanabilir iyileştirmeler sunan ücretsiz bir platform olacaktır.

İlk aşamada görsel tasarım öncelikli değildir. Öncelik:

1. Güvenilir CV parsing
2. Job Description parsing
3. ATS format/parseability analizi
4. Skill ve keyword matching
5. Semantic matching
6. Deterministic ATS scoring
7. Açıklanabilir sonuçlar
8. Ücretsiz/local AI Agent
9. Test edilebilir ve ölçeklenebilir altyapı

### Temel mimari kararı

**ATS skorunu LLM hesaplamayacak.**

Skor; deterministic ATS Engine tarafından hesaplanacaktır.

AI Agent:

- skoru açıklayacak,
- eksikleri yorumlayacak,
- öneriler üretecek,
- CV bullet'larını iyileştirecek,
- kullanıcı sorularını cevaplayacak.

Bu ayrım kritik:

```text
CV + Job Description
        ↓
   ATS ENGINE
        ↓
Deterministic Score
        ↓
Structured JSON
        ↓
    AI AGENT
        ↓
Explanation / Advice / Rewrite
```

---

# 2. Ürün Hedefi

Kullanıcı:

```text
CV yükle
+
Job Description gir
        ↓
     ANALYZE
        ↓
ATS Score
+
Matched Skills
+
Missing Skills
+
Format Problems
+
Experience Match
+
Semantic Match
+
AI Recommendations
```

İlk sürümde sade UI yeterlidir.

Daha sonra:

- gelişmiş dashboard,
- grafikler,
- CV builder,
- CV versioning,
- job tracker,
- LinkedIn analysis,
- cover letter,
- gelişmiş AI agent,
- farklı ATS profilleri

eklenebilir.

---

# 3. Tasarım İlkeleri

1. AI skorun sahibi değildir.
2. Her puanın neden verildiği açıklanabilir olmalıdır.
3. Kullanıcının sahip olmadığı deneyim veya skill AI tarafından CV'ye eklenmemelidir.
4. Model/provider değiştiğinde temel ATS skoru mümkün olduğunca değişmemelidir.
5. Parsing ve scoring deterministic ve test edilebilir olmalıdır.
6. İlk UI sade tutulmalıdır.
7. Privacy-by-design uygulanmalıdır.
8. AI provider application'a hard-code edilmemelidir.
9. Tüm önemli algoritmalar versioned olmalıdır.
10. Her analysis run yeniden üretilebilir olmalıdır.

---

# 4. Sistem Mimarisi

```text
                         ┌─────────────────────────┐
                         │       SIMPLE UI         │
                         │ Next.js / React          │
                         └────────────┬────────────┘
                                      │ HTTPS
                         ┌────────────▼────────────┐
                         │       API / BFF         │
                         │ Auth • Upload • Jobs     │
                         └────────────┬────────────┘
                                      │
              ┌───────────────────────┼────────────────────────┐
              │                       │                        │
     ┌────────▼────────┐    ┌────────▼────────┐     ┌────────▼────────┐
     │ Document Parser │    │   ATS Engine     │     │   AI Agent      │
     │ PDF/DOCX → JSON │    │ deterministic    │     │ explanation      │
     └────────┬────────┘    └────────┬────────┘     └────────┬────────┘
              │                       │                       │
              └──────────────┬────────┴──────────────┬────────┘
                             │                       │
                    ┌────────▼────────┐     ┌───────▼────────┐
                    │ PostgreSQL      │     │ Embedding /    │
                    │ users/runs/data │     │ Vector Search  │
                    └─────────────────┘     └───────┬────────┘
                                                    │
                                             ┌──────▼───────┐
                                             │ Ollama /      │
                                             │ Local Models  │
                                             └──────────────┘
```

---

# 5. Teknoloji Stack

| Katman | Öneri | Amaç |
|---|---|---|
| Frontend | Next.js + TypeScript | MVP ve ileride gelişmiş UI |
| API | FastAPI | Python NLP/ML ekosistemi |
| Database | PostgreSQL | Ana veri tabanı |
| Vector | pgvector | İlk aşamada ayrı vector DB gerektirmemek |
| Queue | Redis | Async işler |
| Worker | Celery veya RQ | Parsing / embeddings / AI |
| Parser | Python | PDF/DOCX/NLP |
| AI runtime | Ollama | Local AI |
| LLM | gpt-oss-20b | AI Agent |
| Embeddings | embeddinggemma / qwen3-embedding / BGE-M3 | Semantic matching |
| Containers | Docker Compose | Local development |
| CI | GitHub Actions | Test/build |
| Logging | Structured JSON logs | Debugging |
| API documentation | OpenAPI | Contract |

---

# 6. Monorepo Yapısı

```text
atsfreeforall/
├── apps/
│   ├── web/
│   └── api/
│
├── services/
│   ├── parser/
│   │   ├── pdf/
│   │   ├── docx/
│   │   ├── sections/
│   │   └── ner/
│   │
│   ├── ats-engine/
│   │   ├── format/
│   │   ├── keywords/
│   │   ├── skills/
│   │   ├── experience/
│   │   ├── semantic/
│   │   └── scoring/
│   │
│   └── ai-agent/
│       ├── providers/
│       │   ├── ollama/
│       │   └── base.py
│       ├── tools/
│       ├── prompts/
│       ├── schemas/
│       └── orchestrator/
│
├── packages/
│   ├── schemas/
│   ├── skill-taxonomy/
│   └── shared/
│
├── data/
│   ├── skills/
│   ├── test-cvs/
│   └── test-jds/
│
├── infra/
│   ├── docker/
│   ├── postgres/
│   ├── redis/
│   └── ollama/
│
├── tests/
│   ├── parser/
│   ├── scoring/
│   ├── matching/
│   ├── agent/
│   └── e2e/
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

# 7. Açık Kaynak Repolardan Alınacak Fikirler

Amaç repoları körlemesine birleştirmek değil; iyi özellikleri kendi architecture'ımızda yeniden uygulamaktır.

Kod kopyalanacaksa her repository'nin lisansı ayrıca kontrol edilmelidir.

## 7.1 Open ATS

Repository:

https://github.com/jlynshue/open-ats

Alınacak fikirler:

- Transparent scoring
- Keyword scoring
- Formatting scoring
- Content quality
- Explainable components
- Configurable weights

Bizde:

```text
services/ats-engine/scoring/
```

---

## 7.2 Resume ATS Optimizer

Repository:

https://github.com/Budige/resume-ats-optimizer

Alınacak fikirler:

- NER
- Resume parsing
- Keyword matching
- Relevance
- Completeness
- Semantic similarity
- ATS optimization

Bizde:

```text
services/parser/
services/ats-engine/matching/
```

---

## 7.3 ATS Resume Optimizer

Repository:

https://github.com/abdash1994/ats-resume-optimizer

Alınacak fikirler:

- Offline/local yaklaşım
- ATS compatibility
- Keyword checks
- Privacy-oriented architecture

Bizde:

```text
services/ats-engine/format/
services/ai-agent/providers/ollama/
```

---

## 7.4 ATS Resume Improver

Repository:

https://github.com/simeononsecurity/ats-resume-improver

Alınacak fikirler:

- Ollama
- Local LLM
- CV improvement
- Local-first AI

Bizde:

```text
services/ai-agent/providers/ollama/
```

---

## 7.5 AgentATS

Repository:

https://github.com/shravangithub/AgentATS

Alınacak fikirler:

- Explainable scoring
- Çok kategorili scoring
- ATS workflow
- Candidate analysis

Bizde:

```text
services/ats-engine/scoring/
services/ai-agent/
```

---

# 8. Canonical Resume Model

Bütün parser'lar aynı canonical modele dönmelidir.

Parser değişse bile ATS Engine değişmemelidir.

```text
ResumeDocument
 ├── metadata
 ├── candidate
 ├── summary
 ├── experience[]
 │    ├── company
 │    ├── title
 │    ├── start_date
 │    ├── end_date
 │    ├── description
 │    ├── achievements[]
 │    └── skills[]
 ├── education[]
 ├── certifications[]
 ├── skills[]
 ├── languages[]
 ├── projects[]
 └── raw_text
```

Örnek:

```json
{
  "candidate": {
    "name": "John Doe",
    "email": "john@example.com",
    "location": "Berlin, Germany"
  },
  "summary": "...",
  "experience": [
    {
      "company": "Example GmbH",
      "title": "Senior QA Engineer",
      "start_date": "2022-01",
      "end_date": null,
      "description": "...",
      "achievements": [
        "Automated 1200 regression tests"
      ],
      "skills": [
        "Selenium",
        "Java",
        "Jenkins"
      ]
    }
  ],
  "skills": [
    "Selenium",
    "Java",
    "Jenkins"
  ],
  "education": [],
  "certifications": [],
  "languages": []
}
```

---

# 9. Database Model

Önerilen tablolar:

```text
users
resumes
job_descriptions
analysis_runs
score_components
skills
skill_relations
ai_runs
feedback
```

## users

```text
id
email
created_at
updated_at
```

## resumes

```text
id
user_id
filename
version
parsed_json
raw_text
checksum
created_at
```

## job_descriptions

```text
id
user_id
raw_text
parsed_json
created_at
```

## analysis_runs

```text
id
resume_id
job_description_id
engine_version
scoring_config_version
skill_taxonomy_version
embedding_model
llm_provider
llm_model
prompt_version
status
created_at
completed_at
```

## score_components

```text
id
analysis_run_id
component
score
max_score
evidence_json
created_at
```

## skills

```text
id
canonical_name
category
aliases_json
created_at
```

## skill_relations

```text
skill_id
related_skill_id
relation_type
```

Örnek relation:

```text
Selenium
 ├── alias → Selenium WebDriver
 ├── related → WebDriver
 └── related → Selenium Grid
```

---

# 10. CV Parsing Pipeline

```text
Upload
  ↓
File validation
  ↓
MIME / size / security check
  ↓
PDF or DOCX extraction
  ↓
Layout detection
  ↓
Section detection
  ↓
NER / rules
  ↓
Canonical Resume JSON
  ↓
Validation
  ↓
Persist
  ↓
ATS analysis
```

Çıkarılacak alanlar:

- Name
- Email
- Phone
- Location
- Summary
- Job titles
- Companies
- Dates
- Responsibilities
- Achievements
- Technical skills
- Soft skills
- Education
- Certifications
- Languages
- Projects
- Links

---

# 11. ATS Format / Parseability Engine

ATS format engine aşağıdaki kontrolleri yapmalıdır:

| Kontrol | Örnek |
|---|---|
| Text extractability | PDF'den gerçek text çıkıyor mu? |
| Tables | Experience tablo içinde mi? |
| Columns | Reading order bozuluyor mu? |
| Text boxes | İçerik extraction'da kayboluyor mu? |
| Headers | Kritik bilgi header'da mı? |
| Footers | Kritik bilgi footer'da mı? |
| Icons | Telefon/email sadece icon ile mi? |
| Images | Bilgi sadece görselde mi? |
| Section headings | Standart başlıklar var mı? |
| Font encoding | Karakterler bozuluyor mu? |
| Contact extraction | Mail/phone doğru okunuyor mu? |

Önemli:

Bir CV görsel olarak güzel olabilir ama parser tarafından kötü okunabilir.

Bu nedenle:

```text
Visual quality != ATS compatibility
```

---

# 12. Job Description Engine

Job Description da canonical JSON'a dönüştürülmelidir.

```text
JobDescription
 ├── title
 ├── company
 ├── location
 ├── seniority
 ├── employment_type
 ├── required_skills[]
 ├── preferred_skills[]
 ├── responsibilities[]
 ├── education_requirements[]
 ├── certification_requirements[]
 ├── language_requirements[]
 ├── experience_requirements[]
 └── raw_text
```

---

# 13. Skill Taxonomy

Sadece string matching yapılmamalıdır.

Kötü:

```text
if "Java" in cv:
    +1
```

Daha iyi:

```text
Java
├── Java 8
├── Java 11
├── Java 17
├── Java 21
├── JVM
├── Spring
└── Spring Boot
```

Benzer şekilde:

```text
Selenium
├── Selenium WebDriver
├── Selenium Grid
└── WebDriver
```

Skill sistemi:

```text
Canonical skill
Aliases
Related skills
Parent skill
Child skill
Category
Technology
Version
Confidence
```

---

# 14. Matching Engine

Üç katman kullanılmalıdır.

## Layer 1 — Exact Match

```text
"Selenium" ↔ "Selenium"
```

## Layer 2 — Normalized / Taxonomy Match

```text
"WebDriver"
↔
"Selenium WebDriver"
```

## Layer 3 — Semantic Match

```text
"automated UI regression testing"
             ↕
"web application test automation"
```

Semantic matching için embedding kullanılabilir.

İlk aşamada pgvector kullanılabilir.

---

# 15. Embedding Architecture

```text
CV experience/skills
       ↓
Embedding model
       ↓
Vector
       ↓
PostgreSQL + pgvector

JD requirements
       ↓
Embedding model
       ↓
Vector
       ↓
Similarity search
```

Ollama üzerinden local embedding kullanılabilir.

Değerlendirilecek modeller:

- embeddinggemma
- qwen3-embedding
- BGE-M3
- başka multilingual embedding modelleri

Türkçe + Almanca + İngilizce CV/JD senaryosu nedeniyle multilingual performans benchmark edilmelidir.

---

# 16. Deterministic ATS Scoring Engine

Önerilen başlangıç skoru:

| Bileşen | Puan |
|---|---:|
| ATS Parseability | 15 |
| Required Keywords/Skills | 25 |
| Preferred Keywords/Skills | 10 |
| Experience Match | 15 |
| Semantic Job Match | 10 |
| Achievements / Quantification | 10 |
| Completeness | 5 |
| Education / Certification | 5 |
| Language / Location | 5 |
| **TOTAL** | **100** |

Bu ağırlıklar ilk versiyonda config dosyasında tutulmalıdır.

Örnek:

```yaml
scoring:
  parseability: 15
  required_skills: 25
  preferred_skills: 10
  experience: 15
  semantic: 10
  achievements: 10
  completeness: 5
  education: 5
  language_location: 5
```

---

# 17. Score Output

Örnek:

```json
{
  "overall": 82,
  "components": [
    {
      "name": "required_skills",
      "score": 19,
      "max": 25,
      "matched": [
        "Selenium",
        "Jenkins"
      ],
      "missing": [
        "AWS",
        "Playwright"
      ],
      "evidence": [
        "Selenium appears in Skills section",
        "Jenkins appears in QA Engineer role"
      ]
    }
  ]
}
```

Her component evidence taşımalıdır.

Kullanıcı:

```text
ATS Score: 82/100

Required Skills: 19/25
Experience: 14/15
Semantic Match: 9/10
Format: 14/15
...
```

görebilmelidir.

---

# 18. AI Agent

AI Agent'ın görevi:

```text
ATS Engine
     ↓
Structured Analysis JSON
     ↓
AI Agent
     ↓
Explanation
+
Recommendations
+
Rewrite
+
Questions
```

AI Agent skor üretmez.

---

# 19. AI Agent Tools

İlk sürümde:

```text
get_resume()
get_job()
get_score()
get_skill_definition()
find_evidence()
rewrite_bullet()
```

Sonraki sürüm:

```text
compare_versions()
analyze_career_gap()
generate_cover_letter()
analyze_linkedin()
```

İlk sürümde web search agent'a verilmemelidir.

CV analizi için web gerekli değildir.

---

# 20. AI Provider Abstraction

AI provider application'a hard-code edilmemelidir.

```python
class LLMProvider:
    def chat(self, messages, options):
        pass

    def structured_output(self, schema, input):
        pass

    def health(self):
        pass
```

Implementasyon:

```text
LLMProvider
    │
    ├── OllamaProvider
    ├── FutureProviderA
    └── FutureProviderB
```

Environment:

```env
AI_PROVIDER=ollama
AI_MODEL=gpt-oss:20b
```

Böylece provider değiştiğinde ATS Engine değişmez.

---

# 21. Ücretsiz AI Modeli

Önerilen local architecture:

```text
ATS Free For All
        ↓
Ollama
        ↓
gpt-oss-20b
```

gpt-oss açık ağırlıklı ve Apache 2.0 lisanslıdır.

Repository:

https://github.com/openai/gpt-oss

OpenAI açıklaması:

https://help.openai.com/en/articles/11870455-openai-open-weight-models

Ollama:

https://ollama.com/

Local AI'ın avantajları:

- API key gerektirmeyebilir
- CV dışarı çıkmadan analiz yapılabilir
- Kullanıcı başına API maliyeti oluşmaz
- Provider bağımlılığı azalır
- Self-hosting mümkündür

---

# 22. AI Agent Guardrails

Agent:

- CV'de olmayan deneyimi eklememeli.
- Kullanıcının sahip olmadığı skill'i gerçekmiş gibi yazmamalı.
- Semantic match'i kesin skill olarak sunmamalı.
- Score component'lerini değiştirmemeli.
- Yeni başarı sayıları uydurmamalı.
- Evidence olmadan güçlü iddia üretmemeli.
- Gereksiz kişisel veriyi prompt'a koymamalı.
- JSON schema ile validate edilmelidir.

Örneğin:

Kullanıcı:

```text
CV'de AWS yok.
```

Agent:

```text
AWS öğrenmeniz gerekebilir.
```

diyebilir.

Ama:

```text
AWS deneyiminizi CV'ye ekledim.
```

diyemez.

---

# 23. API

Önerilen endpointler:

```text
POST /api/v1/resumes
POST /api/v1/jobs
POST /api/v1/analyze

GET  /api/v1/analysis/{id}
GET  /api/v1/analysis/{id}/report

POST /api/v1/analysis/{id}/ask
POST /api/v1/analysis/{id}/improve

GET /api/v1/skills/search?q=

GET /api/v1/health
```

---

# 24. Asenkron İş Akışı

Parsing + embeddings + LLM request-response içinde tutulmamalıdır.

```text
POST /analyze
      ↓
analysis_run = QUEUED
      ↓
Redis Queue
      ↓
Worker
      ↓
Parse
      ↓
Normalize
      ↓
Score
      ↓
Embedding
      ↓
AI Agent
      ↓
analysis_run = COMPLETED
```

Frontend:

```text
GET /analysis/{id}
```

ile status kontrol edebilir.

Sonraki aşamada SSE/WebSocket kullanılabilir.

---

# 25. Security

Mutlaka:

- MIME validation
- File size limit
- PDF/DOCX security checks
- Private object storage
- Signed URLs
- Rate limiting
- Input validation
- Prompt injection protection
- LLM output schema validation
- PII-safe logging
- Data deletion
- Retention policy

uygulanmalıdır.

CV dosyaları public URL ile servis edilmemelidir.

---

# 26. Privacy

Önerilen iki mod:

## Local Mode

```text
CV
 ↓
Local Parser
 ↓
Local ATS Engine
 ↓
Ollama
```

CV makineden çıkmaz.

## Cloud Mode

```text
CV
 ↓
Server
 ↓
Parser
 ↓
ATS
 ↓
AI Provider
```

Cloud mode'da kullanıcıya hangi AI provider'ın kullanıldığı açıkça belirtilmelidir.

---

# 27. Test Stratejisi

## Parser

50–100 gerçek/anonim CV benchmark.

Ölç:

- Name extraction
- Experience extraction
- Dates
- Skills
- Sections
- Contact info

## Format

Farklı:

- tek kolon
- iki kolon
- tablo
- icon
- image
- header/footer
- PDF
- DOCX

testleri.

## Matching

Gold dataset:

```text
CV + JD + expected matches
```

Precision / recall ölçülmeli.

## Scoring

Aynı input:

```text
CV X
+
JD Y
+
Engine version 1.0
```

her zaman aynı sonucu üretmelidir.

## Agent

Golden prompts kullanılmalı.

Kontrol:

- factuality
- JSON schema
- hallucination
- unsupported claims

---

# 28. Versioning

Her analysis run şunları saklamalıdır:

```text
engine_version
scoring_config_version
skill_taxonomy_version
parser_version
embedding_model
llm_provider
llm_model
prompt_version
```

Örnek:

```json
{
  "engine_version": "1.0.0",
  "scoring_config_version": "2026-01",
  "skill_taxonomy_version": "1.2.0",
  "embedding_model": "bge-m3",
  "llm_provider": "ollama",
  "llm_model": "gpt-oss:20b",
  "prompt_version": "3"
}
```

Bu sayede skorun neden değiştiği daha sonra açıklanabilir.

---

# 29. İlk UI

İlk UI çok basit olacak.

## Home

```text
ATS FREE FOR ALL

Upload your CV
[ Choose PDF/DOCX ]

Paste Job Description
[                         ]
[                         ]

[ ANALYZE ]
```

## Processing

```text
Analyzing...

✓ CV parsed
✓ Job description analyzed
✓ Skills extracted
● Matching
○ AI analysis
```

## Result

```text
ATS SCORE

82 / 100

ATS Compatibility     14/15
Required Skills       19/25
Experience Match      14/15
Semantic Match          9/10
...
```

Altında:

```text
MATCHED SKILLS
✓ Selenium
✓ Jenkins
✓ Java

MISSING
✗ AWS
✗ Playwright

FORMAT WARNINGS
⚠ Two-column layout
⚠ Important information in footer

AI RECOMMENDATIONS
1. Add measurable achievement to...
2. Mention Jenkins in experience...
3. ...
```

UI daha sonra tamamen değiştirilebilir.

Backend API contract değişmemelidir.

---

# 30. İlk Sprint

İlk sprintte UI süslenmeyecek.

Hedef:

> Geliştirici tek komutla bütün altyapıyı çalıştırabilsin.

Görevler:

1. GitHub repository oluştur.
2. Monorepo yapısını oluştur.
3. Docker Compose oluştur.
4. PostgreSQL ekle.
5. Redis ekle.
6. FastAPI oluştur.
7. Next.js oluştur.
8. Ollama ekle.
9. Environment variables.
10. Database migrations.
11. Structured logging.
12. Health endpoints.
13. GitHub Actions.
14. Basic API contract.
15. Basic upload endpoint.
16. AnalysisRun state machine.

---

# 31. İlk Vertical Slice

İlk gerçek milestone:

```text
1. PDF yükle
2. JD yapıştır
3. AnalysisRun oluştur
4. PDF parse et
5. CV JSON oluştur
6. JD JSON oluştur
7. Required skills çıkar
8. Exact matching yap
9. Format kontrollerini çalıştır
10. 100 üzerinden score üret
11. JSON response döndür
12. Basit UI'da göster
```

Bu çalışmadan:

- landing page
- animasyon
- dashboard
- branding
- karmaşık UI

yapılmamalıdır.

---

# 32. MVP Fazları

## Phase 0 — Foundation

- Repo
- Docker
- DB
- Redis
- API
- CI
- logging

## Phase 1 — Parser

- PDF
- DOCX
- sections
- NER
- canonical JSON

## Phase 2 — JD

- Job title
- requirements
- skills
- responsibilities
- seniority

## Phase 3 — ATS Engine

- format
- keyword
- completeness
- scoring

## Phase 4 — Matching

- taxonomy
- aliases
- semantic matching
- embeddings

## Phase 5 — AI Agent

- Ollama
- gpt-oss
- tools
- prompts
- structured output

## Phase 6 — Report

- score
- evidence
- recommendations
- missing skills

## Phase 7 — UI

- simple upload
- processing
- result page

## Phase 8 — Hardening

- security
- rate limiting
- tests
- performance
- privacy

## Phase 9 — UI 2.0

- branding
- charts
- animations
- dashboard
- responsive design

---

# 33. Maliyet Modeli

Hedef:

> Kullanıcıdan ücret almadan mümkün olduğunca fazla özelliği çalıştırabilmek.

Local architecture:

```text
LLM       → Ollama
Embedding → Ollama
Vector    → pgvector
DB        → PostgreSQL
Queue     → Redis
Parser    → Python
Frontend  → Next.js
```

Bu modelde zorunlu per-user AI API maliyeti yoktur.

Cloud deployment için hosting maliyeti olabilir.

Bu nedenle ürün:

```text
FREE
LOCAL
SELF-HOSTABLE
OPEN SOURCE FRIENDLY
```

olarak tasarlanmalıdır.

---

# 34. Sonraki Özellikler

MVP'den sonra:

1. CV versioning
2. Before/after score
3. Multiple CVs
4. Multiple jobs
5. Skill graph
6. Occupation taxonomy
7. ATS simulator profiles
8. CV builder
9. Cover letter generator
10. LinkedIn analysis
11. Job application tracker
12. Anonymous benchmark statistics
13. Browser extension
14. Desktop/offline package

---

# 35. Önemli Teknik Riskler

| Risk | Çözüm |
|---|---|
| ATS sistemleri birbirinin aynısı değil | Universal score yerine compatibility score |
| LLM hallucination | Deterministic engine + evidence |
| PDF parsing sorunları | Parser benchmark |
| Skill synonym karmaşası | Versioned taxonomy |
| Semantic false positive | Exact + taxonomy + embedding |
| AI maliyeti | Ollama + provider abstraction |
| Uzun işlemler | Redis + worker |
| PII | Local mode + retention |
| Model değişimi | LLM scoring'den ayrılmalı |
| Skor değişimi | Engine/config versioning |

---

# 36. MVP Definition of Done

MVP tamamlanmış sayılabilmesi için:

- [ ] PDF CV kabul ediliyor.
- [ ] DOCX CV kabul ediliyor.
- [ ] CV canonical JSON'a dönüyor.
- [ ] JD canonical JSON'a dönüyor.
- [ ] ATS format kontrolleri çalışıyor.
- [ ] Required skill matching çalışıyor.
- [ ] Preferred skill matching çalışıyor.
- [ ] Semantic matching çalışıyor.
- [ ] Deterministic 0–100 score üretiliyor.
- [ ] Score component evidence taşıyor.
- [ ] Missing skills gösteriliyor.
- [ ] AI Agent sonucu açıklıyor.
- [ ] AI Agent deneyim uydurmuyor.
- [ ] Ollama local mode çalışıyor.
- [ ] AI provider abstraction mevcut.
- [ ] Analysis run version bilgileriyle saklanıyor.
- [ ] Scoring regression tests mevcut.
- [ ] API integration tests mevcut.
- [ ] Basic UI uçtan uca çalışıyor.
- [ ] Docker Compose ile sistem ayağa kalkıyor.

---

# 37. Son Mimari Özet

Nihai sistem:

```text
                         ATS FREE FOR ALL
                                │
                    ┌───────────▼───────────┐
                    │       NEXT.JS         │
                    │       SIMPLE UI       │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │       FASTAPI         │
                    │          API           │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼──────────────────┐
              │                 │                  │
              ▼                 ▼                  ▼
          PARSER          ATS ENGINE          AI AGENT
              │                 │                  │
              ▼                 ▼                  ▼
        Resume JSON       Score 0–100        Ollama/gpt-oss
              │                 │                  │
              └─────────────────┼──────────────────┘
                                │
                       ┌────────▼────────┐
                       │   PostgreSQL    │
                       │   + pgvector    │
                       └─────────────────┘
                                │
                       ┌────────▼────────┐
                       │      Redis      │
                       │     Workers     │
                       └─────────────────┘
```

En kritik prensip:

```text
            ATS ENGINE
               │
        "WHAT IS THE SCORE?"
               │
               ▼
        Deterministic Logic


             AI AGENT
               │
      "WHY IS THE SCORE THIS?"
               │
               ▼
        Explanation + Advice
```

Bu ayrım korunmalıdır.

---

# 38. Teknik Referanslar

- OpenAI gpt-oss: https://github.com/openai/gpt-oss
- OpenAI open-weight models: https://help.openai.com/en/articles/11870455-openai-open-weight-models
- Ollama: https://ollama.com/
- Open ATS: https://github.com/jlynshue/open-ats
- Resume ATS Optimizer: https://github.com/Budige/resume-ats-optimizer
- ATS Resume Optimizer: https://github.com/abdash1994/ats-resume-optimizer
- ATS Resume Improver: https://github.com/simeononsecurity/ats-resume-improver
- AgentATS: https://github.com/shravangithub/AgentATS
- BGE-M3: https://huggingface.co/BAAI/bge-m3
- Qdrant: https://github.com/qdrant/qdrant
- Ollama API: https://github.com/ollama/ollama/blob/main/docs/api/introduction.mdx
- Ollama Embeddings: https://github.com/ollama/ollama/blob/main/docs/capabilities/embeddings.mdx
