# ATS Readability — Next-Gen CV Analyzer & Job Match Engine

> **A deterministic CV analyzer that scores how well an applicant tracking system reads a document and lists fixes in order of value.**
> Built with Next.js 15 (App Router), React 19, TypeScript strict (`noUncheckedIndexedAccess`), Tailwind CSS, optional Supabase persistence, and a Manifest V3 Chrome Extension.

---

## 🎯 What it does

Modern ATS systems (Workday, Taleo, Greenhouse, Lever, Ashby, iCIMS) parse resumes to plain text layers before indexing keywords and ranking candidates. Design embellishments, multi-column tables, unexpanded ligatures, tiny fonts, and weak ownership phrasing silently drop candidate rankings.

**ATS Readability solves this through:**

1. **Deterministic 100-Point Scoring Engine**:
   - **Parseability (25 pts)**: Multi-column splits, broken encodings, ligature corruption (`ﬁ`, `ﬂ`), unmapped icon fonts / PUA glyphs, hidden zero-font text blocks, zero-width spaces.
   - **Keyword Match (25 pts)**: Strict, normalized, and local semantic matching against job requirements, tiered by mandatory vs. preferred skills.
   - **Structure (20 pts)**: Standard section headings, chronological consistency, date parsing, bullet point brevity, document length.
   - **Impact (20 pts)**: Ownership action verbs (90+ curated verbs across EN/DE/TR), quantified business metrics, passive responsibility filler detection, keyword stuffing penalties.
   - **Contact Reachability (10 pts)**: Name, email, telephone, location, and professional portfolio link detection.

2. **Reverse ATS Engineering & Vendor Advisory**:
   - Automatically detects target ATS vendor from job posting URLs or text (Workday, Greenhouse, Lever, Ashby, Oracle Taleo, iCIMS, SmartRecruiters, Breezy HR, SAP SuccessFactors, Recruitee).
   - Provides vendor-specific formatting advisories (e.g. Workday multi-column cautions, Taleo DOCX preferences).

3. **Multi-Language Support (EN, DE, TR)**:
   - Full localization across all UI surfaces, analysis catalogs, error messages, and action verb libraries.
   - Market-specific norm advisories (e.g. photos, birth dates, military status).

4. **Salary Benchmarking & Negotiation Playbook**:
   - Resolves market compensation benchmarks for detected seniority levels across Germany (EUR), Turkey (TRY), and Global/US (USD).
   - Offers market-tailored, tactical negotiation playbooks.

5. **Quick Readability Test (`/quick-test`)**:
   - Zero-signup, 100% browser-based instant 45-point technical readability check.

6. **Chrome Extension (Manifest V3)**:
   - 1-Click vacancy extraction directly from LinkedIn, Indeed, Kariyer.net, StepStone, and custom career pages into the ATS analyzer.

7. **Candidate Toolkit**:
   - **Parser View**: Live raw text layer inspection with 1-click clipboard copy.
   - **CV Tailor Mode**: Review missing terms and accept verified skills.
   - **CV Builder**: Build standard ATS-friendly CVs with PDF/JSON Resume export.
   - **Interview Prep**: Targeted interview questions based on CV gaps and job requirements.
   - **Application Kanban**: Track job applications with interview stages.

---

## 🔒 Privacy & Architecture Contract

- **`lib/scoring/` is pure**: Zero DOM, zero network, zero React, zero I/O. Everything is unit-testable.
- **Scoring Invariant**: A dimension's score is strictly `max - sum(cost of findings)`, clamped to `[0, max]`. Lost points are always backed by an explicit finding draft with evidence and fix instructions.
- **Browser-First Extraction**: The CV is read and scored in the client browser.
- **Client-Side AI is Advisory**: Local WebGPU/WASM models (Transformers.js / WebLLM) download only with explicit consent and never alter deterministic scoring.
- **Storage & Retention**: Optional Supabase persistence. CV submissions are retained 12 months, then automatically purged. Right to deletion via `/data-request`.

---

## 🚀 Quickstart

### Prerequisites
- Node.js 20+
- npm 10+

### 1. Install & Dev Server
```bash
git clone https://github.com/ubterzioglu/ats.git
cd ats/apps/web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Quality Gates
```bash
npm run lint        # ESLint, zero warnings allowed
npm run typecheck   # tsc --noEmit (strict typecheck)
npm test            # Vitest (120+ test suites, 1260+ unit tests)
npm run build       # Next.js standalone production build
```

---

## 🧩 Chrome Extension Setup

1. Open Google Chrome and go to `chrome://extensions`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the folder `apps/extension`.
4. Open any job vacancy on LinkedIn, Indeed, Kariyer.net, or StepStone, click the extension icon, and select **Analyze with my CV**.

---

## 🐳 Docker Deployment

The project is configured for multi-stage Docker deployment with standalone Next.js output:

```bash
docker compose up -d --build
```
Runs the web container exposed on port 3000.

---

## 📜 Disclaimer

The checks implemented are heuristics derived from mainstream ATS parsing behavior and tech recruitment standards, not an endorsement or exact reproduction of any proprietary vendor software. A 100/100 score indicates optimal machine readability and keyword alignment; it does not guarantee hiring decisions.
