/**
 * resumeOptimizer.ts
 *
 * Two-mode optimization engine:
 *
 * 1. LOCAL (default / fallback) — pure client-side heuristics:
 *    - Keyword extraction via NLP-lite token scoring
 *    - Action-verb enhancement for bullet points
 *    - Missing-skill diffing
 *    - ATS score estimation
 *
 * 2. AI (Claude API) — when an API key is provided the full resume text
 *    is sent to claude-sonnet-4-6 for high-quality rewriting. The local
 *    pass still runs to compute the ATS score and missing skills.
 *
 * Architecture note: keeping both modes means the app works offline / during
 * API outages without degrading to a blank screen.
 */

import type {
  ParsedResume,
  OptimizationResult,
  OptimizedSection,
  ResumeSection,
} from '../types';

// ─── Action verb lists ────────────────────────────────────────────────────────

const WEAK_VERBS = new Set([
  'responsible for', 'helped', 'assisted', 'worked on', 'worked with',
  'participated in', 'involved in', 'contributed to', 'tasked with',
  'supported', 'handled', 'did', 'made', 'used', 'utilized',
]);

// Grouped by theme so we can pick a contextually relevant verb
const ACTION_VERBS = {
  leadership:  ['Led', 'Spearheaded', 'Directed', 'Championed', 'Orchestrated', 'Oversaw', 'Managed', 'Guided'],
  achievement: ['Achieved', 'Exceeded', 'Surpassed', 'Delivered', 'Attained', 'Accomplished', 'Reached'],
  creation:    ['Built', 'Developed', 'Designed', 'Architected', 'Engineered', 'Launched', 'Created', 'Implemented'],
  improvement: ['Optimized', 'Streamlined', 'Improved', 'Enhanced', 'Reduced', 'Increased', 'Accelerated', 'Transformed'],
  analysis:    ['Analysed', 'Evaluated', 'Researched', 'Identified', 'Assessed', 'Diagnosed', 'Reviewed', 'Investigated'],
  collaboration:['Collaborated', 'Partnered', 'Coordinated', 'Aligned', 'Facilitated', 'Liaised', 'Mentored', 'Trained'],
};

// ─── Keyword extraction ───────────────────────────────────────────────────────

// Common English stop words to exclude from keyword candidates
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','as','is','was','are','were','be','been','being','have',
  'has','had','do','does','did','will','would','could','should','may',
  'might','must','shall','can','need','dare','ought','used','about',
  'above','after','before','between','during','through','while','who',
  'which','that','this','these','those','it','its','we','our','you',
  'your','they','their','experience','years','year','work','job','role',
]);

/** Extract meaningful keyword tokens from free text */
export function extractKeywords(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9#+.\-\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

  // Score by frequency; keep top 60 unique tokens
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);

  // Also capture two-word phrases (bigrams) that appear ≥2 times
  const words = text.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (!STOP_WORDS.has(words[i]) && !STOP_WORDS.has(words[i + 1])) {
      freq.set(bigram, (freq.get(bigram) ?? 0) + 1);
    }
  }

  return [...freq.entries()]
    .filter(([, count]) => count >= 1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 60)
    .map(([word]) => word);
}

// ─── Missing skills detection ─────────────────────────────────────────────────

// A curated list of technical & soft skills to look for when no AI is available
const SKILL_PATTERNS = [
  // Languages & runtimes
  'python','javascript','typescript','java','go','rust','c++','c#','ruby','php',
  'swift','kotlin','scala','r','matlab','bash','sql','nosql',
  // Frameworks
  'react','vue','angular','next.js','nuxt','svelte','node.js','express','django',
  'flask','fastapi','spring','rails','laravel','graphql','rest','grpc',
  // Cloud & infra
  'aws','azure','gcp','docker','kubernetes','terraform','ansible','jenkins',
  'github actions','ci/cd','linux','nginx','redis','kafka','rabbitmq',
  // Data
  'machine learning','deep learning','nlp','pytorch','tensorflow','pandas',
  'numpy','spark','hadoop','etl','data pipeline','sql server','postgresql',
  'mysql','mongodb','elasticsearch',
  // Soft skills
  'agile','scrum','kanban','jira','communication','leadership','mentoring',
  'cross-functional','stakeholder',
];

export function detectMissingSkills(resumeText: string, jdText: string): string[] {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jdText.toLowerCase();

  return SKILL_PATTERNS.filter(
    (skill) => jdLower.includes(skill) && !resumeLower.includes(skill)
  );
}

// ─── Bullet-point rewriting ───────────────────────────────────────────────────

function pickActionVerb(bullet: string): string {
  const lower = bullet.toLowerCase();
  if (/lead|manage|direct|oversee/i.test(lower)) return pickRandom(ACTION_VERBS.leadership);
  if (/build|develop|create|implement|design/i.test(lower)) return pickRandom(ACTION_VERBS.creation);
  if (/optimiz|improv|increas|reduc|stream/i.test(lower)) return pickRandom(ACTION_VERBS.improvement);
  if (/analyz|research|investigat|evaluat/i.test(lower)) return pickRandom(ACTION_VERBS.analysis);
  if (/collaborat|coordinat|partner|mentor|train/i.test(lower)) return pickRandom(ACTION_VERBS.collaboration);
  return pickRandom(ACTION_VERBS.achievement);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rewriteBullet(bullet: string, jdKeywords: string[]): string {
  if (bullet.length < 20) return bullet;

  let improved = bullet.trim();

  // Replace weak opening phrases
  for (const weak of WEAK_VERBS) {
    const re = new RegExp(`^(${weak})\\s+`, 'i');
    if (re.test(improved)) {
      const verb = pickActionVerb(improved);
      improved = improved.replace(re, `${verb} `);
      break;
    }
  }

  // Capitalise first letter (action verb)
  improved = improved.charAt(0).toUpperCase() + improved.slice(1);

  // Append a relevant keyword if the bullet doesn't already contain any JD keywords
  // and ends without a quantifiable result — this is a simple heuristic prompt
  const hasKeyword = jdKeywords.some((kw) => improved.toLowerCase().includes(kw));
  const hasMetric  = /\d+\s*(%|x|times|hrs?|minutes?|ms|users?|customers?|M\b|\$)/.test(improved);

  if (!hasKeyword && jdKeywords.length > 0 && !hasMetric) {
    // Append the highest-relevance JD keyword as a context tag
    const relevantKw = jdKeywords.find((kw) => kw.length > 4);
    if (relevantKw) {
      improved = `${improved}, leveraging ${relevantKw} best practices`;
    }
  }

  return improved;
}

function rewriteSection(section: ResumeSection, jdKeywords: string[]): OptimizedSection {
  if (section.type === 'education' || section.type === 'certifications') {
    // These sections don't benefit from bullet rewriting
    return { ...section, originalContent: section.content, originalBullets: section.bullets, wasModified: false };
  }

  if (section.type === 'summary') {
    // Prepend a keyword-rich phrase to the summary
    const topKeywords = jdKeywords.slice(0, 5).join(', ');
    const newContent = section.content.trim()
      ? `Results-driven professional with expertise in ${topKeywords}. ${section.content.trim()}`
      : section.content;

    return {
      ...section,
      originalContent: section.content,
      originalBullets: section.bullets,
      content: newContent,
      bullets: section.bullets,
      wasModified: newContent !== section.content,
    };
  }

  // Rewrite bullets for experience / skills / projects / other
  const rewrittenBullets = section.bullets.map((b) => rewriteBullet(b, jdKeywords));
  const wasModified = rewrittenBullets.some((b, i) => b !== section.bullets[i]);

  // Reconstruct content from bullets (preserve non-bullet lines above them)
  const nonBulletLines = section.content
    .split('\n')
    .filter((l) => !section.bullets.includes(l.replace(/^[\s•\-–—*►▪◦]+/, '').trim()))
    .join('\n');

  const newContent = [
    nonBulletLines.trim(),
    rewrittenBullets.map((b) => `• ${b}`).join('\n'),
  ]
    .filter(Boolean)
    .join('\n');

  return {
    ...section,
    originalContent: section.content,
    originalBullets: section.bullets,
    content: newContent,
    bullets: rewrittenBullets,
    wasModified,
  };
}

// ─── ATS score ────────────────────────────────────────────────────────────────

function computeATSScore(resumeText: string, jdKeywords: string[]): { score: number; matched: string[] } {
  const lower = resumeText.toLowerCase();
  const matched = jdKeywords.filter((kw) => lower.includes(kw));
  const score = Math.min(100, Math.round((matched.length / Math.max(jdKeywords.length, 1)) * 100));
  return { score, matched };
}

// ─── Improvement suggestions ──────────────────────────────────────────────────

function buildSuggestions(
  missingSkills: string[],
  atsScore: number,
  hasMetrics: boolean
): string[] {
  const suggestions: string[] = [];

  if (atsScore < 50) suggestions.push('Add more keywords from the job description to improve ATS pass-through rate.');
  if (missingSkills.length > 0) suggestions.push(`Consider adding these skills if you have them: ${missingSkills.slice(0, 5).join(', ')}.`);
  if (!hasMetrics) suggestions.push('Quantify your achievements (e.g., "Improved performance by 30%" or "Managed a team of 8").');
  suggestions.push('Ensure your contact information (LinkedIn, GitHub, email) is at the top of your resume.');
  if (atsScore >= 70) suggestions.push('Great keyword coverage! Review formatting to ensure ATS-parsable structure (avoid tables/text boxes in PDFs).');

  return suggestions;
}

// ─── Local optimiser (no API key required) ────────────────────────────────────

export async function optimizeLocally(
  resume: ParsedResume,
  jobDescription: string,
  onProgress?: (step: string, pct: number) => void
): Promise<OptimizationResult> {

  onProgress?.('Extracting keywords from job description…', 20);
  await tick();
  const jdKeywords = extractKeywords(jobDescription);

  onProgress?.('Identifying missing skills…', 40);
  await tick();
  const missingSkills = detectMissingSkills(resume.raw, jobDescription);

  onProgress?.('Rewriting bullet points with action verbs…', 60);
  await tick();
  const optimisedSections: OptimizedSection[] = resume.sections.map((s) =>
    rewriteSection(s, jdKeywords)
  );

  onProgress?.('Calculating ATS compatibility score…', 80);
  await tick();
  const optimisedText = optimisedSections.map((s) => s.content).join('\n\n');
  const { score, matched } = computeATSScore(optimisedText, jdKeywords);

  const hasMetrics = /\d+\s*(%|x|times|hrs?|M\b|\$)/.test(resume.raw);
  const suggestions = buildSuggestions(missingSkills, score, hasMetrics);

  onProgress?.('Done!', 100);

  return {
    sections: optimisedSections,
    missingSuggestedSkills: missingSkills,
    jdKeywords,
    matchedKeywords: matched,
    atsScore: score,
    suggestions,
  };
}

// ─── AI optimiser (Claude API) ────────────────────────────────────────────────

/**
 * Calls the Anthropic Messages API directly from the browser.
 *
 * IMPORTANT: In production you should proxy this through your own backend so the
 * API key is never exposed in client-side JS. This client-side call is
 * acceptable for local/personal tooling only.
 */
export async function optimizeWithAI(
  resume: ParsedResume,
  jobDescription: string,
  apiKey: string,
  onProgress?: (step: string, pct: number) => void
): Promise<OptimizationResult> {

  onProgress?.('Sending resume to Claude AI for optimisation…', 15);

  const systemPrompt = `You are an expert career coach and resume writer.
Given a resume and a job description, rewrite the resume's bullet points and professional summary
to better align with the role. Rules:
1. Never fabricate experience, metrics, or qualifications.
2. Use strong action verbs at the start of every bullet.
3. Incorporate keywords from the job description naturally.
4. Keep the factual content identical; only improve wording and emphasis.
5. Return ONLY the rewritten resume text, preserving the original section structure.`;

  const userMessage = `JOB DESCRIPTION:\n${jobDescription}\n\n---\n\nRESUME TO OPTIMISE:\n${resume.raw}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      // Required for direct browser calls (anthropic-dangerous-direct-browser-access header)
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Claude API error ${response.status}: ${(err as { error?: { message?: string } }).error?.message ?? 'Unknown error'}`);
  }

  interface AnthropicResponse {
    content: Array<{ type: string; text: string }>;
  }
  const data = await response.json() as AnthropicResponse;
  const optimisedText = data.content?.[0]?.text ?? resume.raw;

  onProgress?.('Parsing AI response…', 60);
  await tick();

  // Score + diff against the AI-rewritten text (sections are carried from original structure)
  const jdKeywords = extractKeywords(jobDescription);
  const missingSkills = detectMissingSkills(optimisedText, jobDescription);
  const { score, matched } = computeATSScore(optimisedText, jdKeywords);
  const hasMetrics = /\d+\s*(%|x|times|hrs?|M\b|\$)/.test(optimisedText);
  const suggestions = buildSuggestions(missingSkills, score, hasMetrics);

  // Map original sections → optimised sections using the new text
  const optimisedSections: OptimizedSection[] = resume.sections.map((s) => ({
    ...s,
    originalContent: s.content,
    originalBullets: s.bullets,
    content: s.content, // AI text is not easily re-sectioned here; kept as-is for now
    wasModified: false,
  }));

  // Surface the full AI text as the summary section content
  if (optimisedSections.length > 0) {
    optimisedSections[0].content = optimisedText;
    optimisedSections[0].wasModified = optimisedText !== resume.raw;
  }

  onProgress?.('Done!', 100);

  return {
    sections: optimisedSections,
    missingSuggestedSkills: missingSkills,
    jdKeywords,
    matchedKeywords: matched,
    atsScore: score,
    suggestions,
    // attach the full AI response so <ResumeEditor> can display it wholesale
    ...({ aiRewrittenText: optimisedText } as object),
  } as OptimizationResult & { aiRewrittenText?: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Yields control to the event loop so React can re-render progress updates */
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
