import type { FeatureContent } from "./content-types";

export const FEATURES_EN: FeatureContent = {
  scoring: {
    title: "CV analysis and scoring",
    summary: "Five dimensions add up to 100, and every lost point is tied to a named finding.",
    intro: "The platform scores your CV across five dimensions out of 100:",
    points: [
      { label: "Parseability (25)", text: "Whether the text layer survives extraction. Columns, tables, icon fonts and broken encodings are judged here." },
      { label: "Keyword match (25)", text: "Coverage of terms mined from the job ad, each weighted by how central it is to the posting." },
      { label: "Impact (20)", text: "Quantified results and ownership verbs, measured against responsibility filler text." },
      { label: "Structure (20)", text: "Headings a parser can map to fields, dated entries in reverse order, bullets over paragraphs." },
      { label: "Contact (10)", text: "Name, email, phone, location and profile links." }
    ],
    outro: "Every lost point is tied to a named finding that states which line it came from and what to write instead. Findings are ranked by the points they would recover."
  },
  "parser-view": {
    title: "Parser view",
    summary: "Shows how an applicant tracking system sees your CV, field by field.",
    intro: "This view answers the questions candidates ask most:",
    points: [
      { text: "Did the parser read your title and dates correctly?" },
      { text: "Were identity fields such as name, email, phone, location and links found, suspect or missing?" },
      { text: "How does each experience entry look: position, company and date range?" },
      { text: "Were education, skills and languages extracted correctly?" }
    ],
    outro: "Every missing or suspect field comes with a readable cause, for example \"the date range looks split across two columns\". Clicking a field highlights its line in the raw text."
  },
  "job-ad": {
    title: "Job ad analysis",
    summary: "The ad is analysed too: required skills, seniority, red flags and whether it is still live.",
    intro: "When you add a job ad, the platform reads the ad itself:",
    points: [
      { label: "Required and preferred skills", text: "Which skills are mandatory and which are nice to have." },
      { label: "Seniority level", text: "The experience level the posting expects." },
      { label: "Language requirement", text: "Languages the ad requires." },
      { label: "Location and remote", text: "The working model of the job." },
      { label: "Salary", text: "The salary range, if the ad states one." },
      { label: "Red flags", text: "Overly long skill lists, years of experience that contradict the seniority, vague role definitions." },
      { label: "Eligibility checklist", text: "A deterministic check, no AI involved." },
      { label: "Ghost posting check", text: "Looks at whether the ad is genuinely active." }
    ]
  },
  matching: {
    title: "Multi-mode matching",
    summary: "Strict, normalized and semantic matching for the same CV and ad, with the difference explained.",
    intro: "Three matching modes run over the same CV and ad:",
    points: [
      { label: "Strict", text: "Exact, word-for-word matching." },
      { label: "Normalized", text: "Uses synonyms, abbreviations and a skill taxonomy." },
      { label: "Semantic", text: "Embedding-based matching that runs in your browser." }
    ],
    outro: "You see how each mode produces different results and which terms account for the difference. Semantic hits are shown as \"possible match\", never as confirmed."
  },
  tailor: {
    title: "Tailor mode",
    summary: "Customise the CV for one job ad without writing in anything you do not have.",
    points: [
      { label: "Missing term cards", text: "Terms in the ad that are absent from the CV. Each card shows where the term appears, how central it is and where it could go in the CV." },
      { label: "\"I have this skill\" gate", text: "No term enters the CV without your confirmation. No skill, experience or number you do not have is written in." },
      { label: "Bullet rewriting", text: "Rephrases existing bullets only, with placeholders such as [X%] and [N people] where a measurable result is missing." },
      { label: "Cover letter helper", text: "Drafts a cover letter with the same guardrails." },
      { label: "Variant comparison", text: "Shows the master CV score next to the tailored variant." }
    ]
  },
  interview: {
    title: "Interview preparation",
    summary: "Story cards cut from your CV, mapped to common questions, with a practice mode.",
    points: [
      { label: "STAR story bank", text: "Situation, Task, Action and Result cards built from the achievement bullets in your CV. Nothing is invented." },
      { label: "Template questions", text: "Common interview questions mapped to story cards. No AI required." },
      { label: "Ad-specific questions", text: "Questions drawn from the ad. These need a Layer 2 or 3 model that you turn on, and they refer to terms in the ad." },
      { label: "Practice mode", text: "A question is shown, you write an answer, and the tool suggests the story card that fits best. The suggestion can be traced through shared words." }
    ]
  },
  tracker: {
    title: "Application tracker",
    summary: "A Kanban board that shows where each application stands.",
    points: [
      { label: "Stages", text: "Saved, applied, interview, offer or rejected." },
      { label: "Card links", text: "The ad, the CV variant used, the score at the time of applying, notes and contact details." },
      { label: "Follow-up reminders", text: "For example \"no reply for 7 days\"." },
      { label: "CSV and JSON export", text: "Export your data at any time." },
      { label: "One-click deletion", text: "Removes all data locally." }
    ],
    outro: "The board lives on your device and syncs with your account."
  },
  "cv-builder": {
    title: "ATS-safe CV builder",
    summary: "Build a CV in an editor whose every export is checked by our own parser.",
    points: [
      { label: "JSON Resume schema", text: "A standard format for import and export." },
      { label: "Editor form", text: "Every field is editable." },
      { label: "Templates", text: "Dense, plain and modern PDF templates." },
      { label: "Closed-loop validation", text: "Every export runs through our own parser and the result is shown to you. CI tests assert that all templates score Parseability 25/25." },
      { label: "DOCX export", text: "Opens correctly in Word and LibreOffice." },
      { label: "Import an existing CV", text: "Parse a PDF or DOCX into the editor. Fields that cannot be extracted are flagged for manual completion, never invented." }
    ]
  },
  linkedin: {
    title: "LinkedIn consistency check",
    summary: "Compares your CV with your LinkedIn \"Save to PDF\" export and cites both sides of every mismatch.",
    intro: "Upload your CV and the PDF you get from LinkedIn (More, then Save to PDF). The check reports:",
    points: [
      { text: "Date mismatches between a role in the CV and the same role on the profile." },
      { text: "Different titles for the same role." },
      { text: "Skills listed in the CV that the profile never mentions." },
      { text: "A profile headline that points at a different role from the CV headline." }
    ],
    outro: "Both files are read in your browser. Every inconsistency quotes the CV and the profile side by side."
  },
  languages: {
    title: "Multilingual support",
    summary: "English, Turkish and German are handled by the same engine, including stemming and date formats.",
    points: [
      { label: "Turkish stemming", text: "A Snowball Turkish stemmer in keyword matching." },
      { label: "German compound splitting", text: "\"Softwareentwicklung\" becomes \"Software\" and \"Entwicklung\"." },
      { label: "Per-language stopwords", text: "Tuned for each language." },
      { label: "Encoding corruption check", text: "Garbled ı İ ş ğ ç ö ü ä ß characters are reported as a Parseability finding." },
      { label: "Date formats", text: "\"Oca 2022\", \"Ocak 2022\", \"01.2022\", \"Jan. 2022\", \"März 2022\", \"heute\", \"halen\", \"devam ediyor\"." },
      { label: "Market-based advice", text: "Photo, date of birth, marital status and military service, depending on the target market." },
      { label: "Europass detection", text: "Europass layouts are recognised and flagged." }
    ]
  },
  ai: {
    title: "AI-assisted fixes",
    summary: "AI explains and suggests. The score is deterministic and AI never touches it.",
    points: [
      { label: "Local model (Layer 1)", text: "Embedding-based semantic matching that runs in the browser." },
      { label: "Your own Ollama (Layer 2)", text: "A model on your machine for bullet rewriting, explanations, cover letters and interview questions." },
      { label: "BYOK (Layer 3)", text: "Stronger models with your own API key. The key stays in the browser and is never sent to our server." },
      { label: "Schema validation", text: "Every model output is checked against a JSON schema. Output that fails is never shown." }
    ],
    outro: "Every AI output passes a grounding check that looks for invented numbers, technologies or organisations that are not in the CV."
  },
  reports: {
    title: "Report sharing and export",
    summary: "Download a PDF or Markdown report, or share a link that carries no lines from your CV.",
    points: [
      { label: "PDF report", text: "Download the analysis report as a PDF." },
      { label: "Share links", text: "Persist scores and recommendations but contain no lines from the CV. Links expire after 30 days." },
      { label: "Markdown report", text: "Export the report in Markdown." }
    ]
  },
  privacy: {
    title: "Privacy and data retention",
    summary: "What is read where, what is stored, and when it is deleted.",
    points: [
      { text: "The CV is first read and scored in your browser." },
      { text: "When you analyse it, the file, its text and the result are sent to the server and kept for 12 months." },
      { text: "After 12 months the file, extracted text and result are deleted from the database, storage and the Google Drive backup." },
      { text: "Share links keep scores and findings with evidence stripped, because evidence can contain lines lifted from the document." },
      { text: "You can request deletion through the data request form." }
    ]
  },
  history: {
    title: "Session history and progress",
    summary: "See how the score moved during a session and which finding each change closed.",
    points: [
      { label: "Session score history", text: "A plot of the score across the session." },
      { label: "Per-change delta", text: "A note for each change, such as \"+4 · Keyword match\", showing which finding was closed." },
      { label: "Previous visit comparison", text: "A second visit shows the change against the previous one." }
    ]
  },
  help: {
    title: "Help system",
    summary: "A site helper that answers from a keyword bank and never sends or stores anything.",
    points: [
      { label: "Keyword-based help", text: "The helper answers from a keyword bank, sends no data to a server and stores nothing." },
      { label: "Context-aware answers", text: "Answers take the current analysis result into account." }
    ]
  }
};
