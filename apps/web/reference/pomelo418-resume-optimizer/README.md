# Resume Optimizer

An AI-powered resume tailoring tool built with React 18, TypeScript, and Vite.
Upload your resume, paste a job description, and get an ATS-optimised version in seconds.

---

## Features

| Feature | Detail |
|---|---|
| **File upload** | PDF, DOCX, TXT — up to 5 MB, parsed entirely in the browser |
| **Local optimisation** | Keyword extraction, action-verb rewriting, missing-skill detection, ATS scoring — no API key required |
| **AI optimisation** | Full Claude-powered rewrite when you provide an Anthropic API key |
| **Comparison view** | Side-by-side diff with highlighted matched keywords |
| **Edit mode** | Per-section editing, auto-saved to localStorage |
| **Export** | Download PDF (jsPDF), Download DOCX (docx.js), or Save to Google Drive |
| **Google Drive** | OAuth 2.0 via `@react-oauth/google` — no backend needed |

---

## Quick start

```bash
# 1. Clone / enter the project
cd resume-optimizer

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# → edit .env and add your keys (optional — see below)

# 4. Start the dev server
npm run dev
# → opens at http://localhost:5173
```

---

## Environment variables

All variables are prefixed with `VITE_` so Vite exposes them to client code.

```
VITE_ANTHROPIC_API_KEY=sk-ant-…        # optional — enables AI mode
VITE_GOOGLE_CLIENT_ID=123….apps.googleusercontent.com  # optional — enables Drive export
```

> **Security note:** API keys injected via `VITE_` end up in the browser bundle. This is acceptable for local / personal tools. For a public deployment, proxy API calls through your own backend instead.

---

## Google Drive setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (e.g. "Resume Optimizer").
3. Go to **APIs & Services → Library**, search for **Google Drive API**, and enable it.
4. Go to **APIs & Services → Credentials → Create credentials → OAuth 2.0 Client ID**.
5. Application type: **Web application**.
6. Add `http://localhost:5173` to **Authorised JavaScript origins**.
7. Copy the **Client ID** and paste it into `VITE_GOOGLE_CLIENT_ID` in your `.env`.

---

## Project structure

```
src/
├── components/
│   ├── Header/           ← Tab nav + "Start over" button
│   ├── FileUpload/       ← Drag-and-drop file picker
│   ├── JobDescription/   ← JD textarea + API key input + Optimise button
│   ├── ComparisonView/   ← Side-by-side diff + ATS score + keyword chips
│   ├── ResumeEditor/     ← Per-section textareas with revert
│   ├── ExportOptions/    ← PDF / DOCX / Google Drive export
│   ├── ProgressIndicator/← Modal overlay with step progress
│   └── Toast/            ← Notification stack (top-right)
├── context/
│   └── ResumeContext.tsx ← Global state via useReducer
├── hooks/
│   ├── useResumeOptimizer.ts  ← Orchestrates parse → optimise pipeline
│   └── useGoogleDrive.ts      ← OAuth token + Drive upload
├── services/
│   ├── resumeParser.ts        ← PDF/DOCX/TXT → ParsedResume
│   ├── resumeOptimizer.ts     ← Local heuristics + Claude API
│   └── googleDriveService.ts  ← Drive REST API wrapper
└── types/
    └── index.ts               ← Shared TypeScript interfaces
```

---

## Architectural decisions

### Why React Context instead of Zustand?
Context + `useReducer` adds zero dependencies and makes the data-flow explicit in code. For this app (one main flow, ~5 shared state fields) it's the right fit. If you add multi-tab sync or optimistic updates, migrate the store to Zustand — the context API surface is compatible.

### Why client-side only?
Resumes contain personal data. Keeping all parsing and optimisation in the browser means the user's data never leaves their machine (except when they explicitly call the AI API or Drive). This is a deliberate privacy trade-off.

### Why jsPDF over react-pdf/renderer?
react-pdf/renderer is excellent for complex layouts but requires a separate font-bundling step. jsPDF is simpler for plain-text documents and its bundle impact is comparable.

### PDF worker (pdfjs-dist)
The worker URL is loaded from the Cloudflare CDN in `resumeParser.ts`. This avoids Vite's Web Worker bundling complexity. If you need to work offline, copy `node_modules/pdfjs-dist/build/pdf.worker.min.js` into `/public/` and change the `workerSrc` to `/pdf.worker.min.js`.

---

## Scripts

```bash
npm run dev      # Vite dev server with HMR
npm run build    # TypeScript compile + Vite production build
npm run preview  # Preview the production build locally
npm run lint     # ESLint
```

---

## Extending the AI integration

The optimiser in `src/services/resumeOptimizer.ts` exposes two functions:

- `optimizeLocally(resume, jd)` — runs entirely in the browser, no API key.
- `optimizeWithAI(resume, jd, apiKey)` — calls `claude-sonnet-4-6`.

To swap in a different model or provider, replace the `fetch` call in `optimizeWithAI`.
The function signature and return type stay the same, so nothing else needs to change.
