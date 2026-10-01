import type { JobContext, RoleCategory, ExperienceLevel } from '@/types/resume';
import roleKeywordsData from '@/data/role-keywords.json';

const roleKeywords = roleKeywordsData as Record<string, Record<string, string[]>>;

// Comprehensive stop word list — generic words that are never useful as ATS keywords
const STOP_WORDS = new Set([
  // Articles, prepositions, conjunctions
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','up','about','into','through','during','before','after','above','below',
  'between','out','off','over','under','again','further','then','once',
  // Pronouns
  'i','me','my','we','our','you','your','he','his','she','her','it','its',
  'they','their','them','us','who','which','what','this','that','these','those',
  // Auxiliary verbs
  'is','are','was','were','be','been','being','have','has','had','do','does',
  'did','will','would','could','should','may','might','shall','can','cannot',
  'not','no','nor','so','yet','both','either','neither',
  // Common adjectives/adverbs that appear in JDs but aren't skills
  'strong','excellent','good','great','best','new','high','key','main','top',
  'very','highly','well','fast','quick','deep','wide','large','small','full',
  'clear','able','basic','core','real','own','free','open','hard','soft',
  // Common JD fluff words
  'ability','skill','skills','knowledge','understanding','familiarity','awareness',
  'experience','experiences','background','expertise','proficiency','proficient',
  'proven','demonstrated','working','work','works','worked','worked',
  'team','teams','company','companies','organization','organizations','firm',
  'business','businesses','startup','enterprise','environment','setting',
  'join','joining','seek','seeking','looking','apply','applying','candidate',
  'candidates','applicant','hire','hiring','ideal','opportunity','role','roles',
  'position','positions','job','jobs','required','requirement','requirements',
  'preferred','preference','nice','bonus','plus','benefit','benefits',
  'including','includes','include','across','within','outside','throughout',
  'such','like','also','both','either','however','therefore','thus','hence',
  'where','when','while','although','though','since','because','if','unless',
  'than','then','else','other','others','another','each','every','all','any',
  'some','most','more','many','much','few','less','own','new','old','various',
  'different','similar','related','relevant','applicable','appropriate',
  // Common nouns in JDs that aren't keywords
  'year','years','month','months','day','days','time','times','level','levels',
  'area','areas','field','fields','industry','industries','sector','sectors',
  'type','types','kind','kinds','set','sets','list','item','items','part',
  'parts','way','ways','use','uses','point','points','place','places','case',
  'cases','example','examples','people','person','member','members','group',
  'groups','cross','functional','based','driven','focused','oriented','ready',
  'friendly','savvy','native','first','second','third','etc','e.g','i.e',
  // Writing/communication generic
  'write','writing','written','communicate','communication','present','presentation',
  'verbal','communicate','report','reports','document','documentation','note','notes',
  // Generic verbs that aren't skills
  'build','builds','built','create','creates','created','make','makes','made',
  'help','helps','ensure','ensures','provide','provides','provided','support',
  'supports','supported','lead','leads','manage','manages','managed','handle',
  'handles','handled','work','works','worked','drive','drives','deliver','delivers',
  'own','owns','define','defines','identify','identifies','develop','develops',
  'client','clients','customer','customers','user','users','stakeholder',
  'stakeholders','partner','partners','internal','external',
  // Short/numeric
  '1','2','3','4','5','6','7','8','9','10','one','two','three','four','five',
  'six','seven','eight','nine','ten','plus','minus',
  // Location / geography words (appear in JD headers, not skills)
  'location','located','onsite','remote','hybrid','office','hq','headquarters',
  'bangalore','bengaluru','mumbai','delhi','hyderabad','chennai','pune','kolkata',
  'india','indian','us','usa','uk','united','states','kingdom','australia','canada',
  'singapore','dubai','uae','germany','france','europe','asia','apac',
  // Time expressions
  'week','weeks','weekly','daily','monthly','annually','hours','hour','per',
  // Job posting boilerplate
  'about','overview','summary','description','responsibilities','qualification',
  'qualifications','benefits','compensation','salary','range','package',
  'eoe','equal','opportunity','employer','diversity','inclusion','inclusive',
  'apply','now','today','immediately','urgent','openings','opening','vacancy',
]);

// Minimum keyword length (single-word must be this long unless it's a known tech abbreviation)
const MIN_KEYWORD_LENGTH = 3;
const SHORT_TECH_TERMS = new Set([
  'sql','api','aws','gcp','ml','ai','ui','ux','qa','db','etl','bi','ci','cd',
  'git','ios','sdk','ide','orm','crm','erp','sso','jwt','css','html','xml',
  'go','c++','r','vim','gtm','kpi','okr','roi','mvp','prd','pod','sre','pm',
]);

export interface ExtractedJDData {
  requiredKeywords: string[];
  preferredKeywords: string[];
  allKeywords: string[];
  requiredYears?: number;
  detectedLevel: ExperienceLevel;
  detectedCategory: RoleCategory;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
}

function tokenize(text: string): string[] {
  return text
    .replace(/[^\w\s.#+\-\/]/g, ' ')  // Keep / for A/B, - for hyphenated terms
    .split(/\s+/)
    .map(w => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').trim())  // strip leading/trailing punct
    .filter(w => {
      if (!w) return false;
      const lower = w.toLowerCase();
      if (STOP_WORDS.has(lower)) return false;
      // Keep short known tech terms
      if (SHORT_TECH_TERMS.has(lower)) return true;
      // Skip single chars and very short words (unless acronym-like all-caps)
      if (w.length < MIN_KEYWORD_LENGTH) return false;
      // Skip pure numbers
      if (/^\d+$/.test(w)) return false;
      return true;
    });
}

function computeTFIDF(text: string): Map<string, number> {
  const words = tokenize(text);
  const freq = new Map<string, number>();
  for (const word of words) {
    const lower = word.toLowerCase();
    freq.set(lower, (freq.get(lower) || 0) + 1);
  }
  const maxFreq = Math.max(...freq.values(), 1);
  const tfidf = new Map<string, number>();
  for (const [word, count] of freq) {
    tfidf.set(word, count / maxFreq);
  }
  return tfidf;
}

// Multi-word technical terms — exhaustive list covering major roles
function extractMultiWordTerms(text: string): string[] {
  const patterns = [
    // Core tech
    /\b(machine learning|deep learning|natural language processing|computer vision|large language models?|generative ai|artificial intelligence)\b/gi,
    /\b(product management|project management|program management|change management|risk management|stakeholder management|vendor management|account management)\b/gi,
    /\b(user experience|user interface|user research|user testing|usability testing|design thinking)\b/gi,
    /\b(data analytics|data analysis|data science|data engineering|data modeling|data visualization|business intelligence|business analytics)\b/gi,
    /\b(product strategy|go.?to.?market|gtm strategy|market research|market analysis|competitive analysis|competitive intelligence)\b/gi,
    /\b(a\/b testing|ab testing|split testing|multivariate testing)\b/gi,
    /\b(agile methodology|agile development|scrum framework|kanban board|sprint planning|backlog refinement|backlog grooming)\b/gi,
    /\b(customer success|customer experience|customer journey|customer satisfaction|net promoter score|nps)\b/gi,
    /\b(software development|software engineering|full.?stack|front.?end|back.?end|web development|mobile development)\b/gi,
    /\b(cloud computing|cloud architecture|cloud infrastructure|cloud native)\b/gi,
    /\b(devops|site reliability|platform engineering|infrastructure as code)\b/gi,
    /\b(ci\/cd|continuous integration|continuous deployment|continuous delivery)\b/gi,
    /\b(system design|distributed systems|microservices architecture|event.?driven architecture|service.?oriented architecture)\b/gi,
    /\b(supply chain|operations management|process improvement|lean manufacturing|six sigma)\b/gi,
    /\b(financial modeling|financial analysis|financial planning|fp&a|profit.? loss)\b/gi,
    /\b(search engine optimization|search engine marketing|pay per click|content marketing|digital marketing|growth hacking|growth marketing)\b/gi,
    /\b(test automation|automated testing|unit testing|integration testing|end.?to.?end testing|quality assurance)\b/gi,
    /\b(object.?oriented programming|functional programming|test.?driven development|behavior.?driven development|domain.?driven design)\b/gi,
    /\b(restful api|rest api|graphql api|api design|api development|api integration)\b/gi,
    /\b(product roadmap|product vision|product discovery|product analytics|product led growth)\b/gi,
    /\b(okr framework|okr setting|key results|objectives.*key results)\b/gi,
    /\b(rice prioritization|moscow framework|kano model|jobs to be done|jtbd)\b/gi,
    /\b(cross.?functional|cross functional teams?)\b/gi,
    /\b(power bi|tableau desktop|google analytics|google ads|microsoft azure|google cloud|amazon web services)\b/gi,
    /\b(node\.?js|react\.?js|vue\.?js|angular\.?js|next\.?js|spring boot|django rest|ruby on rails)\b/gi,
    /\b(azure devops|github actions|jenkins pipeline|gitlab ci)\b/gi,
  ];

  const found: string[] = [];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      found.push(match[0].trim().toLowerCase().replace(/\s+/g, ' '));
    }
  }
  return [...new Set(found)];
}

function detectExperienceLevel(text: string): ExperienceLevel {
  const lower = text.toLowerCase();
  if (/chief|c-?suite|c.?level|vp of|vice president/.test(lower)) return 'c-suite';
  if (/\bvp\b|vice president/.test(lower)) return 'vp';
  if (/director of|director,|head of/.test(lower)) return 'director';
  if (/staff engineer|principal engineer|staff .* engineer/.test(lower)) return 'staff';
  if (/senior|sr\.|lead |tech lead|team lead/.test(lower)) return 'senior';
  if (/mid.?level|mid.?senior|3.{0,5}years|4.{0,5}years|5.{0,5}years/.test(lower)) return 'mid';
  if (/junior|entry.?level|associate|0.{0,5}years|1.{0,5}years|2.{0,5}years|new grad|graduate/.test(lower)) return 'junior';
  return 'mid';
}

function detectRoleCategory(text: string, role: string): RoleCategory {
  const combined = (text + ' ' + role).toLowerCase();
  if (/software|engineer|developer|devops|sre|backend|frontend|full.?stack|platform|mobile|ios|android/.test(combined)) return 'software-engineering';
  if (/data scientist|machine learning|ml engineer|ai engineer|data analyst|analytics|data engineer/.test(combined)) return 'data-science';
  if (/product manager|pm\b|product owner|po\b|product lead/.test(combined)) return 'product-management';
  if (/design|ux|ui|user experience|user interface|creative/.test(combined)) return 'design';
  if (/finance|accounting|financial|cfo|controller|analyst.*finance|fp&a/.test(combined)) return 'finance';
  if (/marketing|growth|seo|content|brand|demand gen|cmo/.test(combined)) return 'marketing';
  if (/sales|account executive|business development|bdr|sdr|ae\b|cro\b/.test(combined)) return 'sales';
  if (/hr\b|human resources|people|talent|recruiter|hrbp/.test(combined)) return 'hr';
  if (/legal|counsel|attorney|compliance|paralegal|lawyer/.test(combined)) return 'legal';
  if (/nurse|doctor|physician|clinical|medical|healthcare|health/.test(combined)) return 'healthcare';
  if (/operations|ops|supply chain|logistics|process|coo/.test(combined)) return 'operations';
  if (/customer success|csm|account manager|support|cx\b/.test(combined)) return 'customer-success';
  return 'other';
}

function extractYearsRequired(text: string): number | undefined {
  const match = text.match(/(\d+)\+?\s*(?:to\s*\d+)?\s*years?\s+(?:of\s+)?(?:experience|exp)/i);
  return match ? parseInt(match[1]) : undefined;
}

function splitRequiredVsPreferred(jdText: string): { required: string; preferred: string } {
  // Handle both inline format ("Required: X. Preferred: Y") and multiline format
  const PREFERRED_MARKERS = /\b(nice[\s-]to[\s-]have|preferred[:\s]|good[\s-]to[\s-]have|bonus[:\s]|desired[:\s]|optional[:\s])\b/i;
  const REQUIRED_MARKERS = /\b(required[:\s]|must[\s-]have[:\s]|qualifications[:\s]|requirements[:\s]|responsibilities[:\s]|what you.ll do|what we.re looking for)\b/i;

  // Try inline split first (single paragraph format)
  const preferredMatch = PREFERRED_MARKERS.exec(jdText);
  if (preferredMatch && preferredMatch.index > 50) {
    // JD has an inline "Preferred:" marker — split at that point
    const splitPoint = preferredMatch.index;
    return {
      required: jdText.slice(0, splitPoint),
      preferred: jdText.slice(splitPoint),
    };
  }

  // Fall back to line-by-line processing
  const lines = jdText.split('\n');
  let required = '';
  let preferred = '';
  let inPreferred = false;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (PREFERRED_MARKERS.test(lower)) {
      inPreferred = true;
    } else if (REQUIRED_MARKERS.test(lower)) {
      inPreferred = false;
    }
    if (inPreferred) preferred += line + '\n';
    else required += line + '\n';
  }

  // If nothing was classified as required (entire JD went to preferred due to early marker),
  // treat the full text as required — better to over-match than under-match
  if (!required.trim()) {
    return { required: jdText, preferred: '' };
  }

  return { required, preferred };
}

function extractBulletPoints(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.replace(/^[•\-\*\d+\.]\s+/, '').trim())
    .filter(l => l.length > 20);
}

export function analyzeJD(jdText: string, role: string): ExtractedJDData {
  const { required, preferred } = splitRequiredVsPreferred(jdText);
  const allText = jdText;

  const tfidfScores = computeTFIDF(allText);
  const multiWordTerms = extractMultiWordTerms(allText);

  const detectedCategory = detectRoleCategory(allText, role);
  const detectedLevel = detectExperienceLevel(allText);
  const requiredYears = extractYearsRequired(allText);

  // Get role-specific seed keywords to boost relevance
  const roleData = roleKeywords[detectedCategory];
  const levelKey = detectedLevel === 'junior' ? 'entry' : detectedLevel;
  const coreSkills = (roleData?.core_skills || []).map((s: string) => s.toLowerCase());
  const levelSkills = ((roleData as Record<string, string[]>)?.[levelKey] || []).map((s: string) => s.toLowerCase());

  // Score each keyword
  type ScoredKeyword = { keyword: string; score: number; section: 'required' | 'preferred' };
  const scored: ScoredKeyword[] = [];

  // Add multi-word terms first (highest quality)
  for (const term of multiWordTerms) {
    const inRequired = required.toLowerCase().includes(term);
    const inPreferred = preferred.toLowerCase().includes(term);
    if (inRequired || inPreferred) {
      scored.push({
        keyword: term,
        score: 3.0,  // Highest priority
        section: inRequired ? 'required' : 'preferred',
      });
    }
  }

  // Add single-word TF-IDF keywords, boosted by role relevance
  for (const [word, baseScore] of tfidfScores) {
    if (word.length < MIN_KEYWORD_LENGTH && !SHORT_TECH_TERMS.has(word)) continue;
    // Skip if already captured in a multi-word term
    if (multiWordTerms.some(t => t.includes(word))) continue;

    const inCore = coreSkills.some(s => s === word || s.includes(word));
    const inLevel = levelSkills.some(s => s === word || s.includes(word));
    const inRequired = required.toLowerCase().includes(word);
    const inPreferred = preferred.toLowerCase().includes(word);

    if (!inRequired && !inPreferred) continue;

    const finalScore = baseScore * (inCore ? 2.5 : 1) * (inLevel ? 2 : 1);
    scored.push({
      keyword: word,
      score: finalScore,
      section: inRequired ? 'required' : 'preferred',
    });
  }

  // Sort by score, deduplicate
  scored.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const deduped: ScoredKeyword[] = [];
  for (const k of scored) {
    if (!seen.has(k.keyword)) {
      seen.add(k.keyword);
      deduped.push(k);
    }
  }

  const requiredKeywords = deduped
    .filter(k => k.section === 'required')
    .map(k => k.keyword)
    .slice(0, 25);

  const preferredKeywords = deduped
    .filter(k => k.section === 'preferred')
    .map(k => k.keyword)
    .slice(0, 15);

  return {
    requiredKeywords,
    preferredKeywords,
    allKeywords: [...new Set([...requiredKeywords, ...preferredKeywords])],
    requiredYears,
    detectedLevel,
    detectedCategory,
    responsibilities: extractBulletPoints(required).slice(0, 10),
    requirements: extractBulletPoints(required).slice(0, 10),
    niceToHave: extractBulletPoints(preferred).slice(0, 8),
  };
}
