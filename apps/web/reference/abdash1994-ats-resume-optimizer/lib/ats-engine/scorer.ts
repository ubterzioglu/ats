import type {
  ResumeData,
  JobContext,
  ATSScore,
  ATSScoreDimension,
  ATSScoreItem,
  PerATSScore,
} from '@/types/resume';
import { analyzeJD } from '@/lib/jd-analyzer/extractor';
import { matchKeywords, buildResumeText } from './keyword-matcher';
import atsRulesData from '@/data/ats-rules.json';
import actionVerbsData from '@/data/action-verbs.json';

const actionVerbs = actionVerbsData as unknown as Record<string, string[]>;

function scoreKeywordMatch(
  resume: ResumeData,
  jdData: ReturnType<typeof analyzeJD>
): ATSScoreDimension {
  const matches = matchKeywords(jdData.requiredKeywords, jdData.preferredKeywords, resume);

  const requiredMatches = matches.filter(m => m.importance === 'required' && m.found);
  const preferredMatches = matches.filter(m => m.importance === 'preferred' && m.found);
  const totalRequired = matches.filter(m => m.importance === 'required').length;
  const totalPreferred = matches.filter(m => m.importance === 'preferred').length;

  const requiredRate = totalRequired > 0 ? requiredMatches.length / totalRequired : 0;
  const preferredRate = totalPreferred > 0 ? preferredMatches.length / totalPreferred : 0;

  const score = Math.round((requiredRate * 0.7 + preferredRate * 0.3) * 100);

  const items: ATSScoreItem[] = matches.slice(0, 15).map(m => ({
    id: `kw-${m.keyword}`,
    label: m.importance === 'required'
      ? `Required keyword: "${m.keyword}"`
      : `Preferred keyword: "${m.keyword}"`,
    passed: m.found,
    impact: m.importance === 'required' ? 'high' : 'medium',
    suggestion: m.found
      ? `Found ${m.frequency}x in ${m.locations.join(', ')}`
      : `Add "${m.keyword}" to your resume (from job description)`,
    autoFixable: false,
  }));

  return {
    name: 'Keyword Match',
    score,
    maxScore: 100,
    weight: 0.30,
    items,
  };
}

function scoreFormatCompliance(resume: ResumeData): ATSScoreDimension {
  const items: ATSScoreItem[] = [];
  let deductions = 0;

  // Check contact info completeness
  const hasEmail = !!resume.contact.email;
  const hasPhone = !!resume.contact.phone;
  const hasLinkedIn = !!resume.contact.linkedin;
  const hasLocation = !!resume.contact.location;

  items.push({
    id: 'fmt-email',
    label: 'Professional email address present',
    passed: hasEmail,
    impact: 'high',
    suggestion: hasEmail ? undefined : 'Add a professional email address',
    autoFixable: false,
  });

  items.push({
    id: 'fmt-phone',
    label: 'Phone number present',
    passed: hasPhone,
    impact: 'high',
    suggestion: hasPhone ? undefined : 'Add your phone number',
    autoFixable: false,
  });

  items.push({
    id: 'fmt-linkedin',
    label: 'LinkedIn URL included',
    passed: hasLinkedIn,
    impact: 'medium',
    suggestion: hasLinkedIn ? undefined : 'Add your LinkedIn profile URL',
    autoFixable: false,
  });

  items.push({
    id: 'fmt-location',
    label: 'Location/city included',
    passed: hasLocation,
    impact: 'medium',
    suggestion: hasLocation ? undefined : 'Add City, State/Country to contact info',
    autoFixable: false,
  });

  if (!hasEmail) deductions += 15;
  if (!hasPhone) deductions += 10;
  if (!hasLinkedIn) deductions += 8;
  if (!hasLocation) deductions += 7;

  // Check date consistency
  const hasDates = resume.experience.every(exp => exp.startDate || exp.endDate);
  items.push({
    id: 'fmt-dates',
    label: 'All experience entries have dates',
    passed: hasDates,
    impact: 'high',
    suggestion: hasDates ? undefined : 'Add start/end dates to all work experience',
    autoFixable: false,
  });
  if (!hasDates) deductions += 10;

  // Check bullet points exist
  const hasBullets = resume.experience.some(exp => exp.bullets.length > 0);
  items.push({
    id: 'fmt-bullets',
    label: 'Work experience uses bullet points',
    passed: hasBullets,
    impact: 'high',
    suggestion: hasBullets ? undefined : 'Add bullet points describing your responsibilities and achievements',
    autoFixable: false,
  });
  if (!hasBullets) deductions += 10;

  // Check professional email (not AOL, hotmail, yahoo)
  const email = resume.contact.email;
  const isProEmail = email && !/(yahoo|hotmail|aol|msn|live)\.com/i.test(email);
  items.push({
    id: 'fmt-proemail',
    label: 'Professional email domain (not legacy)',
    passed: !!isProEmail,
    impact: 'medium',
    suggestion: isProEmail ? undefined : 'Use Gmail or professional domain email',
    autoFixable: false,
  });
  if (!isProEmail && email) deductions += 5;

  // Check summary exists
  const hasSummary = !!resume.summary && resume.summary.length > 50;
  items.push({
    id: 'fmt-summary',
    label: 'Professional summary/objective present',
    passed: hasSummary,
    impact: 'high',
    suggestion: hasSummary ? undefined : 'Add a 2-4 sentence professional summary with your top keywords',
    autoFixable: false,
  });
  if (!hasSummary) deductions += 10;

  const score = Math.max(0, 100 - deductions);

  return {
    name: 'ATS Format Compliance',
    score,
    maxScore: 100,
    weight: 0.25,
    items,
  };
}

function scoreSectionCompleteness(resume: ResumeData): ATSScoreDimension {
  const items: ATSScoreItem[] = [];
  let score = 100;

  const sections = [
    { key: 'contact', label: 'Contact Information', has: !!(resume.contact.name && resume.contact.email), impact: 'high' as const, points: 20 },
    { key: 'summary', label: 'Professional Summary', has: !!(resume.summary && resume.summary.length > 30), impact: 'high' as const, points: 15 },
    { key: 'experience', label: 'Work Experience', has: resume.experience.length > 0, impact: 'high' as const, points: 25 },
    { key: 'education', label: 'Education', has: resume.education.length > 0, impact: 'high' as const, points: 20 },
    { key: 'skills', label: 'Skills Section', has: resume.skills.length > 0, impact: 'high' as const, points: 20 },
  ];

  for (const section of sections) {
    items.push({
      id: `sec-${section.key}`,
      label: `${section.label} section present`,
      passed: section.has,
      impact: section.impact,
      suggestion: section.has ? undefined : `Add a ${section.label} section`,
      autoFixable: false,
    });
    if (!section.has) score -= section.points;
  }

  // Bonus checks
  const hasCerts = (resume.certifications || []).length > 0;
  items.push({
    id: 'sec-certs',
    label: 'Certifications section (if applicable)',
    passed: hasCerts,
    impact: 'low',
    suggestion: hasCerts ? undefined : 'Add relevant certifications to boost credibility',
    autoFixable: false,
  });

  const hasProjects = (resume.projects || []).length > 0;
  items.push({
    id: 'sec-projects',
    label: 'Projects section (strengthens application)',
    passed: hasProjects,
    impact: 'low',
    suggestion: hasProjects ? undefined : 'Add 2-3 relevant projects with technologies used',
    autoFixable: false,
  });

  return {
    name: 'Section Completeness',
    score: Math.max(0, score),
    maxScore: 100,
    weight: 0.20,
    items,
  };
}

function scoreAchievementQuality(resume: ResumeData): ATSScoreDimension {
  const items: ATSScoreItem[] = [];
  let score = 0;
  const bullets = resume.experience.flatMap(exp => exp.bullets);

  if (bullets.length === 0) {
    return {
      name: 'Achievement Quality',
      score: 0,
      maxScore: 100,
      weight: 0.15,
      items: [{
        id: 'ach-no-bullets',
        label: 'No bullet points found',
        passed: false,
        impact: 'high',
        suggestion: 'Add bullet points to each work experience entry',
        autoFixable: false,
      }],
    };
  }

  // Check for quantified achievements
  const quantifiedBullets = bullets.filter(b =>
    /\d+%|\$\d+|\d+[KMBx]|\d+ (million|billion|thousand)|increased|decreased|reduced|improved.*\d|grew.*\d/i.test(b)
  );
  const quantifiedRate = quantifiedBullets.length / bullets.length;

  items.push({
    id: 'ach-quantified',
    label: `Quantified achievements (${quantifiedBullets.length}/${bullets.length} bullets)`,
    passed: quantifiedRate >= 0.5,
    impact: 'high',
    suggestion: quantifiedRate >= 0.5
      ? 'Great use of quantified results!'
      : 'Add numbers, percentages, or dollar amounts to at least 50% of your bullet points',
    autoFixable: false,
  });
  score += quantifiedRate * 40;

  // Check for action verbs
  const allActionVerbs = Object.values(actionVerbs)
    .flat()
    .filter((v): v is string => typeof v === 'string')
    .map(v => v.toLowerCase());
  const bulletsWithActionVerbs = bullets.filter(b => {
    const firstWord = b.split(' ')[0]?.toLowerCase().replace(/[.,]/, '');
    return allActionVerbs.includes(firstWord);
  });
  const actionVerbRate = bulletsWithActionVerbs.length / bullets.length;

  items.push({
    id: 'ach-action-verbs',
    label: `Strong action verbs (${bulletsWithActionVerbs.length}/${bullets.length} bullets)`,
    passed: actionVerbRate >= 0.7,
    impact: 'high',
    suggestion: actionVerbRate >= 0.7
      ? 'Strong use of action verbs!'
      : 'Start each bullet with a strong action verb (Led, Built, Increased, Reduced, Designed...)',
    autoFixable: false,
  });
  score += actionVerbRate * 30;

  // Check bullet length (not too short or long)
  const wellSizedBullets = bullets.filter(b => {
    const wordCount = b.split(' ').length;
    return wordCount >= 8 && wordCount <= 30;
  });
  const sizeRate = wellSizedBullets.length / bullets.length;

  items.push({
    id: 'ach-length',
    label: 'Bullet points appropriate length (8-30 words)',
    passed: sizeRate >= 0.7,
    impact: 'medium',
    suggestion: sizeRate >= 0.7
      ? 'Good bullet point length!'
      : 'Aim for 8-30 words per bullet point — concise but descriptive',
    autoFixable: false,
  });
  score += sizeRate * 20;

  // Check for impact language
  const impactWords = /increased|decreased|reduced|improved|grew|generated|saved|achieved|delivered|launched|built|drove|led|managed|scaled/i;
  const impactBullets = bullets.filter(b => impactWords.test(b));
  const impactRate = impactBullets.length / bullets.length;

  items.push({
    id: 'ach-impact',
    label: 'Impact-focused language used',
    passed: impactRate >= 0.6,
    impact: 'medium',
    suggestion: impactRate >= 0.6
      ? 'Good focus on impact!'
      : 'Use impact-focused verbs (Reduced costs by..., Grew revenue by..., Built system that...)',
    autoFixable: false,
  });
  score += impactRate * 10;

  return {
    name: 'Achievement Quality',
    score: Math.min(100, Math.round(score)),
    maxScore: 100,
    weight: 0.15,
    items,
  };
}

function scoreContactMeta(resume: ResumeData): ATSScoreDimension {
  const items: ATSScoreItem[] = [];
  let score = 100;

  const checks = [
    { id: 'meta-name', label: 'Full name present', has: !!resume.contact.name, deduct: 30 },
    { id: 'meta-email', label: 'Email address', has: !!resume.contact.email, deduct: 25 },
    { id: 'meta-phone', label: 'Phone number', has: !!resume.contact.phone, deduct: 20 },
    { id: 'meta-location', label: 'Location (City, State/Country)', has: !!resume.contact.location, deduct: 15 },
    { id: 'meta-linkedin', label: 'LinkedIn URL', has: !!resume.contact.linkedin, deduct: 10 },
  ];

  for (const check of checks) {
    items.push({
      id: check.id,
      label: check.label,
      passed: check.has,
      impact: check.deduct >= 20 ? 'high' : 'medium',
      suggestion: check.has ? undefined : `Add ${check.label.toLowerCase()} to contact info`,
      autoFixable: false,
    });
    if (!check.has) score -= check.deduct;
  }

  return {
    name: 'Contact & Meta',
    score: Math.max(0, score),
    maxScore: 100,
    weight: 0.05,
    items,
  };
}

function scoreLengthDensity(resume: ResumeData, jobContext: JobContext): ATSScoreDimension {
  const items: ATSScoreItem[] = [];
  const resumeText = buildResumeText(resume);
  const wordCount = resumeText.split(/\s+/).length;
  const bulletCount = resume.experience.flatMap(e => e.bullets).length;

  // Ideal page count based on experience
  const yearsExp = jobContext.yearsOfExperience || 0;
  const idealMinWords = yearsExp <= 2 ? 400 : yearsExp <= 7 ? 600 : 800;
  const idealMaxWords = yearsExp <= 2 ? 800 : yearsExp <= 7 ? 1200 : 1800;

  const goodLength = wordCount >= idealMinWords && wordCount <= idealMaxWords;
  items.push({
    id: 'len-words',
    label: `Word count: ${wordCount} (ideal: ${idealMinWords}-${idealMaxWords})`,
    passed: goodLength,
    impact: 'medium',
    suggestion: goodLength
      ? 'Resume length is appropriate!'
      : wordCount < idealMinWords
        ? `Add more detail — aim for ${idealMinWords}+ words for your experience level`
        : `Consider condensing — ATS may truncate beyond ${idealMaxWords} words`,
    autoFixable: false,
  });

  const goodBullets = bulletCount >= 8;
  items.push({
    id: 'len-bullets',
    label: `Total bullet points: ${bulletCount} (aim for 8+)`,
    passed: goodBullets,
    impact: 'medium',
    suggestion: goodBullets
      ? 'Good number of bullet points!'
      : 'Add more bullet points to describe your experience in detail',
    autoFixable: false,
  });

  const skillCount = resume.skills.length;
  const goodSkills = skillCount >= 8 && skillCount <= 30;
  items.push({
    id: 'len-skills',
    label: `Skills count: ${skillCount} (ideal: 8-30)`,
    passed: goodSkills,
    impact: 'medium',
    suggestion: goodSkills
      ? 'Good number of skills listed!'
      : skillCount < 8
        ? 'Add more relevant skills (aim for 8-30)'
        : 'Consider trimming skills list to the most relevant 20-30',
    autoFixable: false,
  });

  let score = 0;
  if (goodLength) score += 40;
  else if (wordCount >= idealMinWords * 0.7 && wordCount <= idealMaxWords * 1.3) score += 20;
  if (goodBullets) score += 30;
  if (goodSkills) score += 30;

  return {
    name: 'Length & Density',
    score,
    maxScore: 100,
    weight: 0.05,
    items,
  };
}

function scorePerATS(resume: ResumeData, jdData: ReturnType<typeof analyzeJD>): PerATSScore[] {
  const results: PerATSScore[] = [];
  const systems = atsRulesData.systems;

  for (const system of systems) {
    const issues: string[] = [];
    let score = 85; // start high, deduct for issues

    // Check critical rules
    for (const rule of system.critical_rules) {
      switch (rule) {
        case 'single_column_only':
          // We can't detect columns in parsed text, assume pass
          break;
        case 'no_tables':
          // Assume clean if we parsed it successfully
          break;
        case 'standard_section_names':
          // Already handled in section detection
          break;
        case 'skills_section_required':
          if (resume.skills.length === 0) {
            issues.push('Missing skills section');
            score -= 15;
          }
          break;
        case 'github_url_required_for_engineering':
          if (!resume.contact.github) {
            issues.push('No GitHub URL (important for this ATS)');
            score -= 10;
          }
          break;
        case 'linkedin_url_valued':
          if (!resume.contact.linkedin) {
            issues.push('Missing LinkedIn URL (valued by this ATS)');
            score -= 8;
          }
          break;
        case 'portfolio_url_valued':
          if (!resume.contact.portfolio) {
            issues.push('Missing portfolio URL (valued by this ATS)');
            score -= 5;
          }
          break;
      }
    }

    // Check required sections
    for (const reqSection of system.required_sections) {
      switch (reqSection) {
        case 'summary':
          if (!resume.summary) {
            issues.push('Missing professional summary');
            score -= 8;
          }
          break;
        case 'experience':
          if (resume.experience.length === 0) {
            issues.push('No work experience listed');
            score -= 20;
          }
          break;
        case 'education':
          if (resume.education.length === 0) {
            issues.push('No education listed');
            score -= 10;
          }
          break;
        case 'skills':
          if (resume.skills.length === 0) {
            issues.push('No skills listed');
            score -= 15;
          }
          break;
      }
    }

    // Keyword match impact
    const resumeText = buildResumeText(resume);
    const keywordMatches = jdData.requiredKeywords.filter(kw =>
      resumeText.toLowerCase().includes(kw.toLowerCase())
    ).length;
    const keywordRate = jdData.requiredKeywords.length > 0
      ? keywordMatches / jdData.requiredKeywords.length
      : 0;

    score = Math.round(score * (0.5 + keywordRate * 0.5));
    score = Math.min(100, Math.max(0, score));

    results.push({
      atsName: system.name,
      score,
      criticalIssues: issues,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

function calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export function scoreResume(resume: ResumeData, jobContext: JobContext): ATSScore {
  const jdData = analyzeJD(jobContext.jobDescription, jobContext.role);

  const keywordDim = scoreKeywordMatch(resume, jdData);
  const formatDim = scoreFormatCompliance(resume);
  const sectionDim = scoreSectionCompleteness(resume);
  const achievementDim = scoreAchievementQuality(resume);
  const contactDim = scoreContactMeta(resume);
  const lengthDim = scoreLengthDensity(resume, jobContext);

  const total = Math.round(
    keywordDim.score * keywordDim.weight +
    formatDim.score * formatDim.weight +
    sectionDim.score * sectionDim.weight +
    achievementDim.score * achievementDim.weight +
    contactDim.score * contactDim.weight +
    lengthDim.score * lengthDim.weight
  );

  const allMatches = matchKeywords(jdData.requiredKeywords, jdData.preferredKeywords, resume);
  const missingKeywords = allMatches
    .filter(m => !m.found && m.importance === 'required')
    .map(m => m.keyword);

  return {
    total,
    grade: calculateGrade(total),
    dimensions: {
      keywordMatch: keywordDim,
      formatCompliance: formatDim,
      sectionCompleteness: sectionDim,
      achievementQuality: achievementDim,
      contactMeta: contactDim,
      lengthDensity: lengthDim,
    },
    perATS: scorePerATS(resume, jdData),
    extractedKeywords: allMatches,
    missingKeywords,
  };
}
