# Setup Guide

## Option 1 — Deploy to Vercel (Recommended, Free)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/abdash1994/ats-resume-optimizer)

1. Click the button above
2. Connect your GitHub account
3. Click **Deploy**
4. Done — your instance is live in ~60 seconds

Auto-deploys on every `git push` to `main`. No environment variables needed.

---

## Option 2 — Run Locally

**Requirements:** Node.js 20+, npm

```bash
# Clone
git clone https://github.com/abdash1994/ats-resume-optimizer
cd ats-resume-optimizer

# Install (uses public npm registry)
npm install --registry https://registry.npmjs.org/

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Option 3 — Production Build Locally

```bash
npm run build
npm start
```

---

## Using the App

### Step 1 — Upload your resume
Drop any file onto the upload zone:
- `.pdf` — most common, parsed via Mozilla pdf.js
- `.docx` — Word document, parsed via mammoth
- `.html` — any HTML resume
- `.md` — Markdown resume
- `.png / .jpg / .jpeg` — photo of a resume (OCR via Tesseract.js, takes ~15 seconds)

### Step 2 — Enter job details
- **Job Title** — the exact role you're applying for
- **Role Category** — pick the closest match (Software Engineering, Product, Finance, etc.)
- **Experience Level** — Entry / Mid / Senior / Director / etc.
- **Years of Experience** — used to calibrate word count expectations
- **Job Description** — paste the full JD (more = better keyword extraction)

### Step 3 — Review your ATS score
The score panel shows:
- **Total score** (0–100) with letter grade
- **Per-dimension breakdown** — click any dimension to see specific issues
- **Per-ATS breakdown** — see your score against each of the 15+ systems
- **Keyword gap** — required keywords from the JD that are missing from your resume

### Step 4 — Fix issues
Use the **Editor** tab to update your resume:
- **Contact** — add LinkedIn URL, location, professional email
- **Summary** — write 2–4 sentences with top keywords woven in
- **Experience** — edit bullets, add quantified results
- **Skills** — click the orange keyword chips to add missing JD keywords instantly

Use the **Suggestions** tab for ranked fixes with one-click apply where available.

### Step 5 — Export
Go to the **Export** tab:
- **DOCX (recommended)** — best for Taleo, Workday, ADP, SAP
- **PDF (ATS-safe)** — single column, Arial font, no images
- **HTML** — for personal websites
- **Markdown** — for GitHub profiles

> **Important for Taleo users:** When filling in a Taleo application form, always copy-paste your resume text into the manual text field. Taleo often runs keyword matching against that field, not the uploaded file.

---

## Optional — Enable AI Features (Pro)

Add your own API key to unlock AI-powered bullet rewrites and summary generation.

In the app, scroll to **"Pro AI Features"** at the bottom of the editor panel.

Supported providers (all have free tiers):
- **Groq** — fastest, free tier at [console.groq.com](https://console.groq.com)
- **OpenAI** — GPT-4o, requires billing
- **Anthropic** — Claude, requires billing

Your key is stored only in your browser's `localStorage`. It is never sent to any server other than the AI provider you select.

---

## Install as PWA (Mobile / Desktop)

After opening the app in Chrome or Safari:
- **Android** — tap the browser menu → "Add to Home Screen"
- **iOS Safari** — tap Share → "Add to Home Screen"
- **Chrome Desktop** — click the install icon in the address bar

The app works fully offline once installed.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| OCR taking too long | Image parsing uses Tesseract.js WASM — wait up to 30s on first use |
| PDF not parsing correctly | Try exporting from Word as `.docx` and uploading that instead |
| Score not updating | Wait 1–2 seconds after typing — scoring is debounced |
| Export fails | Disable any browser ad-blockers for the site |
| Vercel deploy fails | Check that `vercel.json` has `installCommand` with `--registry https://registry.npmjs.org/` |

---

## Contributing

PRs welcome. Key areas:
- Additional ATS system rules (must be research-backed)
- Role keyword databases for more categories
- Improved text-parser accuracy for unusual resume formats
- Cover letter generator
- LinkedIn profile optimizer
