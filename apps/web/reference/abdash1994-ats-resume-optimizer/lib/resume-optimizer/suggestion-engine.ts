import type { ATSScore, OptimizationSuggestion, ResumeData, JobContext } from '@/types/resume';

export function generateSuggestions(
  score: ATSScore,
  resume: ResumeData,
  jobContext: JobContext
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Missing required keywords (highest impact)
  for (const kw of score.missingKeywords.slice(0, 8)) {
    suggestions.push({
      id: `kw-missing-${kw}`,
      priority: 'critical',
      category: 'keyword',
      title: `Add missing keyword: "${kw}"`,
      description: `The job description requires "${kw}" but it's not found in your resume. Add it naturally to your summary, experience bullets, or skills section.`,
      autoFixable: resume.skills.length > 0,
      impact: 6,
    });
  }

  // Missing summary
  if (!resume.summary || resume.summary.length < 50) {
    suggestions.push({
      id: 'add-summary',
      priority: 'critical',
      category: 'section',
      title: 'Add Professional Summary',
      description: `A 2-4 sentence summary is one of the highest-impact ATS additions. Click "Generate & Review" to get a draft based on your resume + job description.`,
      autoFixable: true,
      impact: 12,
    });
  }

  // Missing LinkedIn
  if (!resume.contact.linkedin) {
    suggestions.push({
      id: 'add-linkedin',
      priority: 'high',
      category: 'contact',
      title: 'Add LinkedIn Profile URL',
      description: 'Most ATS systems boost candidates with LinkedIn URLs. Add your full LinkedIn URL (linkedin.com/in/yourname) to your contact information.',
      autoFixable: false,
      impact: 5,
    });
  }

  // Missing location
  if (!resume.contact.location) {
    suggestions.push({
      id: 'add-location',
      priority: 'high',
      category: 'contact',
      title: 'Add City & Country/State',
      description: 'Location is a required field in most ATS systems. Add "City, State" or "City, Country" to your contact info.',
      autoFixable: false,
      impact: 4,
    });
  }

  // Low quantified bullets
  const bullets = resume.experience.flatMap(e => e.bullets);
  const quantifiedBullets = bullets.filter(b =>
    /\d+%|\$\d+|\d+[KMBx]|\d+ (million|billion|thousand)/i.test(b)
  );
  if (bullets.length > 0 && quantifiedBullets.length / bullets.length < 0.5) {
    suggestions.push({
      id: 'quantify-bullets',
      priority: 'high',
      category: 'achievement',
      title: 'Strengthen your bullet points',
      description: `Only ${quantifiedBullets.length} of ${bullets.length} bullets have quantified results. Click "Generate & Review" to see suggested improvements with placeholders for your real numbers.`,
      autoFixable: true,
      impact: 10,
    });
  }

  // Missing skills section
  if (resume.skills.length === 0) {
    suggestions.push({
      id: 'add-skills',
      priority: 'critical',
      category: 'section',
      title: 'Add a Skills Section',
      description: 'A dedicated skills section is parsed by virtually every ATS. Add your top technical and professional skills matching the job description.',
      autoFixable: false,
      impact: 15,
    });
  } else if (resume.skills.length < 8) {
    suggestions.push({
      id: 'expand-skills',
      priority: 'high',
      category: 'keyword',
      title: `Expand skills section (currently ${resume.skills.length} skills)`,
      description: `Add more relevant skills from the job description. Aim for 12-20 targeted skills. Missing keywords can be added directly to skills.`,
      autoFixable: true,
      impact: 8,
    });
  }

  // Keyword density in summary
  if (resume.summary && score.missingKeywords.length > 0) {
    const topMissing = score.missingKeywords.slice(0, 3).join('", "');
    suggestions.push({
      id: 'summary-keywords',
      priority: 'high',
      category: 'keyword',
      title: 'Strengthen summary with key terms',
      description: `Your summary is missing key JD terms: "${topMissing}". Click "Generate & Review" to get a rewritten summary with these keywords woven in naturally.`,
      autoFixable: true,
      impact: 7,
    });
  }

  // Experience missing bullets
  const expWithoutBullets = resume.experience.filter(e => e.bullets.length === 0);
  if (expWithoutBullets.length > 0) {
    suggestions.push({
      id: 'add-bullets',
      priority: 'critical',
      category: 'achievement',
      title: `Add bullets to ${expWithoutBullets.length} experience entries`,
      description: `${expWithoutBullets.map(e => (e.title || 'Role') + ' at ' + (e.company || 'Company')).join(', ')} have no bullet points. Click "Generate & Review" to get ATS-optimized bullet templates.`,
      autoFixable: true,
      impact: 12,
    });
  }

  // Missing certifications if job requires them
  const jdLower = jobContext.jobDescription.toLowerCase();
  const certKeywords = ['certified', 'certification', 'certificate', 'license', 'pmp', 'aws certified', 'google certified'];
  const jdNeedsCerts = certKeywords.some(k => jdLower.includes(k));
  if (jdNeedsCerts && (!resume.certifications || resume.certifications.length === 0)) {
    suggestions.push({
      id: 'add-certs',
      priority: 'high',
      category: 'section',
      title: 'Add Certifications section',
      description: 'The job description mentions certifications. If you have relevant certifications, add a Certifications section. If not, consider pursuing the mentioned certification.',
      autoFixable: false,
      impact: 6,
    });
  }

  // ATS-hostile formatting warning
  suggestions.push({
    id: 'format-check',
    priority: 'medium',
    category: 'format',
    title: 'Verify ATS-safe formatting before uploading',
    description: 'When downloading, use the "ATS-Safe" PDF or DOCX option. Avoid tables, columns, text boxes, or graphics in the version you upload to ATS. Use the "Visual" version only for human review.',
    autoFixable: false,
    impact: 8,
  });

  // Taleo paste-field tip
  suggestions.push({
    id: 'taleo-paste',
    priority: 'medium',
    category: 'format',
    title: 'Taleo tip: always fill the paste-text field',
    description: 'If applying via Taleo (Oracle), many companies run keyword matching against the manually-pasted text box — not the uploaded file. Always paste your full resume text into that field. Taleo has a 41% parse error rate on complex PDFs.',
    autoFixable: false,
    impact: 5,
  });

  // Greenhouse tip
  suggestions.push({
    id: 'greenhouse-human',
    priority: 'low',
    category: 'format',
    title: 'Greenhouse: humans review, not algorithms',
    description: 'Greenhouse uses human scorecards, not automated keyword scoring. If applying through Greenhouse, prioritize readability and clear achievements over keyword density. A compelling narrative matters more than keyword count.',
    autoFixable: false,
    impact: 3,
  });

  // Employment gap warning if detected
  const hasGaps = resume.experience.length > 1 && resume.experience.some((exp, i) => {
    if (i === 0) return false;
    const prevEnd = resume.experience[i - 1]?.endDate?.toLowerCase();
    if (prevEnd === 'present' || prevEnd === 'current') return false;
    return true; // simplified check
  });

  if (!resume.summary || resume.summary.length < 100) {
    suggestions.push({
      id: 'coherence-summary',
      priority: 'high',
      category: 'achievement',
      title: 'Write a coherence-bridging summary',
      description: 'Enterprise ATS systems (Workday, SAP, Oracle) run "experience coherence scoring" that penalizes employment gaps >6 months (-3 to -4 pts) and unexplained career moves. A strong professional summary that frames your career arc can offset these penalties.',
      autoFixable: false,
      impact: 7,
    });
  }

  // Sort by impact
  return suggestions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.impact - a.impact;
  });
}
