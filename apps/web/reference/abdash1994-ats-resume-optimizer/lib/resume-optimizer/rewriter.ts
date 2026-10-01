import type { ResumeData, JobContext } from '@/types/resume';

/**
 * Rule-based resume content generator.
 * Produces draft text the user can review and edit before applying.
 * No API key required. LLM rewrites can replace these when a pro key is set.
 */

// ─── Summary generator ────────────────────────────────────────────────────────

export function generateSummary(resume: ResumeData, jobContext: JobContext, missingKeywords: string[]): string {
  const { contact, experience, skills } = resume;
  const { role, experienceLevel, yearsOfExperience } = jobContext;

  const levelLabel =
    experienceLevel === 'entry' || experienceLevel === 'junior' ? 'motivated'
    : experienceLevel === 'senior' ? 'Senior'
    : experienceLevel === 'director' ? 'Director-level'
    : experienceLevel === 'vp' ? 'VP-level'
    : experienceLevel === 'c-suite' ? 'C-Suite'
    : 'experienced';

  const yearsStr = yearsOfExperience > 0 ? `${yearsOfExperience}+ years of` : 'proven';

  // Most recent role for context (must be declared before titleAlreadyHasLevel)
  const recentJob = experience.length > 0 ? experience[0] : null;
  const recentTitle = recentJob?.title || role;
  const recentCompany = recentJob?.company ? ` at ${recentJob.company}` : '';

  // Don't prepend levelLabel if the job title already starts with it (avoids "Senior Senior Engineer")
  const titleAlreadyHasLevel = recentTitle.toLowerCase().startsWith(levelLabel.toLowerCase());
  const titlePrefix = titleAlreadyHasLevel ? '' : `${levelLabel} `;

  // Pick top skills from what the candidate already has + top missing JD keywords
  const topSkills = [
    ...skills.slice(0, 4),
    ...missingKeywords.slice(0, 3).filter(k => !skills.includes(k)),
  ].slice(0, 5).join(', ');

  // Pick a quantified achievement if available
  const quantifiedBullet = experience
    .flatMap(e => e.bullets)
    .find(b => /\d+%|\$\d+|\d+[KMBx]/i.test(b));
  const achievementLine = quantifiedBullet
    ? ` Most recently ${quantifiedBullet.toLowerCase().replace(/^[A-Z]/, c => c.toLowerCase())}.`
    : '';

  return `${titlePrefix}${recentTitle}${recentCompany} with ${yearsStr} experience delivering impactful results across ${topSkills}.${achievementLine} Passionate about ${role.toLowerCase()} and driving measurable business outcomes.`.trim();
}

// ─── Bullet point improvement generator ──────────────────────────────────────

export interface BulletSuggestion {
  original: string;
  improved: string;
  reason: string;
}

const STRONG_ACTION_VERBS = [
  'Architected', 'Built', 'Delivered', 'Designed', 'Developed', 'Drove',
  'Engineered', 'Established', 'Grew', 'Implemented', 'Launched', 'Led',
  'Optimized', 'Reduced', 'Scaled', 'Shipped', 'Spearheaded', 'Streamlined',
  'Transformed', 'Increased', 'Decreased', 'Generated', 'Saved', 'Automated',
];

const WEAK_OPENERS = [
  'responsible for', 'worked on', 'helped with', 'assisted', 'participated in',
  'was involved in', 'duties included', 'tasks included', 'worked to', 'tried to',
];

function startsWithWeakOpener(bullet: string): string | null {
  const lower = bullet.toLowerCase();
  return WEAK_OPENERS.find(w => lower.startsWith(w)) || null;
}

function hasQuantifiedResult(bullet: string): boolean {
  return /\d+%|\$[\d,.]+|\d+[KMBx]|\d+[\s,]\d{3}|\d+ (million|billion|thousand|hundred)/i.test(bullet);
}

function strengthenBullet(bullet: string, index: number): BulletSuggestion | null {
  const weakOpener = startsWithWeakOpener(bullet);
  const hasNumbers = hasQuantifiedResult(bullet);
  const verb = STRONG_ACTION_VERBS[index % STRONG_ACTION_VERBS.length];

  if (weakOpener) {
    const rest = bullet.slice(weakOpener.length).trim();
    const improved = `${verb} ${rest}${!hasNumbers ? ' — resulting in [quantify: X% improvement / $X savings / N users impacted]' : ''}`;
    return {
      original: bullet,
      improved,
      reason: `Replaced weak opener "${weakOpener}" with strong action verb`,
    };
  }

  if (!hasNumbers && bullet.split(' ').length > 5) {
    const improved = `${bullet.replace(/\.$/, '')} — resulting in [quantify: X% improvement / $X savings / N users impacted]`;
    return {
      original: bullet,
      improved,
      reason: 'Added quantified result placeholder (fill in your actual numbers)',
    };
  }

  return null;
}

export function generateBulletImprovements(resume: ResumeData): BulletSuggestion[] {
  const suggestions: BulletSuggestion[] = [];
  let idx = 0;

  for (const exp of resume.experience) {
    for (const bullet of exp.bullets) {
      const suggestion = strengthenBullet(bullet, idx++);
      if (suggestion) suggestions.push(suggestion);
      if (suggestions.length >= 8) break;
    }
    if (suggestions.length >= 8) break;
  }

  return suggestions;
}

// ─── Skills gap filler ────────────────────────────────────────────────────────

export function generateSkillsAddition(
  currentSkills: string[],
  missingKeywords: string[],
  preferredKeywords: string[]
): string[] {
  const toAdd = [
    ...missingKeywords.filter(k => !currentSkills.map(s => s.toLowerCase()).includes(k.toLowerCase())),
    ...preferredKeywords.filter(k => !currentSkills.map(s => s.toLowerCase()).includes(k.toLowerCase())),
  ]
    .slice(0, 12)
    .map(k => k.charAt(0).toUpperCase() + k.slice(1));

  return [...new Set(toAdd)];
}

// ─── Missing bullets generator ───────────────────────────────────────────────

export function generateMissingBullets(resume: ResumeData, jobContext: JobContext): string {
  const expWithoutBullets = resume.experience.filter(e => e.bullets.length === 0);
  if (expWithoutBullets.length === 0) return '';

  const roleKeywords = jobContext.jobDescription
    .split(/\W+/)
    .filter(w => w.length > 4)
    .slice(0, 6)
    .join(', ');

  const lines: string[] = [
    `Add these bullets to your experience entries. Edit the [placeholders] with real numbers:\n`,
  ];

  for (const exp of expWithoutBullets) {
    lines.push(`━━ ${exp.title || 'Role'} at ${exp.company || 'Company'} ━━`);
    lines.push(`• [Led/Built/Drove] [key initiative] resulting in [X% improvement / $X savings / N users impacted]`);
    lines.push(`• Managed [product/feature/team] delivering [outcome] for [X stakeholders/users/clients]`);
    lines.push(`• Implemented [tool/process] reducing [pain point] by [X%] and improving [metric]`);
    lines.push(`• Collaborated with [teams/stakeholders] to [achieve goal], contributing to [business result]\n`);
  }

  lines.push(`💡 Tips for ATS bullet points:`);
  lines.push(`• Start with a strong action verb (Led, Built, Drove, Scaled, Reduced)`);
  lines.push(`• Add real numbers: %, $, time, users, team size`);
  lines.push(`• Include relevant keywords from the JD: ${roleKeywords}`);

  return lines.join('\n');
}

// ─── Pro LLM rewriter (when API key is available) ─────────────────────────────

export interface LLMRewriteRequest {
  type: 'summary' | 'bullet' | 'skills';
  context: string;
  existing?: string;
  keywords?: string[];
}

export async function rewriteWithLLM(
  request: LLMRewriteRequest,
  apiKey: string,
  provider: 'groq' | 'openai' | 'anthropic'
): Promise<string> {
  const systemPrompt = `You are an expert resume writer specializing in ATS optimization. 
Write clear, impactful, quantified content. Use strong action verbs. Keep it professional and concise.
Return ONLY the improved text, no explanations or preamble.`;

  let userPrompt = '';
  if (request.type === 'summary') {
    userPrompt = `Rewrite this professional summary to be more impactful and include these keywords naturally: ${(request.keywords || []).join(', ')}.
Context about candidate: ${request.context}
Current summary: "${request.existing || 'none'}"
Write a 2-4 sentence professional summary. Be specific and compelling.`;
  } else if (request.type === 'bullet') {
    userPrompt = `Improve this resume bullet point to be more impactful with quantified results.
Keywords to include if relevant: ${(request.keywords || []).join(', ')}
Current bullet: "${request.existing}"
Write 1 improved bullet starting with a strong action verb. Add a quantified result if possible.`;
  } else {
    userPrompt = `Add these missing skills to the existing skills list: ${(request.keywords || []).join(', ')}
Current skills: ${request.existing}
Return the complete updated skills list, comma-separated.`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let url = '';
  let body = {};

  if (provider === 'groq') {
    url = 'https://api.groq.com/openai/v1/chat/completions';
    headers['Authorization'] = `Bearer ${apiKey}`;
    body = {
      model: 'llama3-8b-8192',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      max_tokens: 300,
      temperature: 0.7,
    };
  } else if (provider === 'openai') {
    url = 'https://api.openai.com/v1/chat/completions';
    headers['Authorization'] = `Bearer ${apiKey}`;
    body = {
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      max_tokens: 300,
    };
  } else {
    url = 'https://api.anthropic.com/v1/messages';
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
    body = {
      model: 'claude-haiku-20240307',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    };
  }

  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`LLM API error: ${res.status} ${await res.text()}`);
  const data = await res.json();

  if (provider === 'anthropic') {
    return data.content[0].text.trim();
  }
  return data.choices[0].message.content.trim();
}
