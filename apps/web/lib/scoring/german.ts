/**
 * German compounds, split by dictionary.
 *
 * German welds domain words together: "Softwareentwicklung", "Testautomati-
 * sierung", "Qualitätssicherung". A literal filter that indexes the ad's
 * compound finds nothing in a CV that writes the same concept apart - or the
 * other way round, since ads and CVs disagree on the join constantly
 * ("Projekt Management" in a skills list, "Projektmanagement" in prose).
 *
 * The splitter segments a word into known components, allowing the Fugen
 * elements Germans glue between them (-s-, -n-, -e-, -er-). It is a matching
 * aid, not a parser: a split only ever adds surface forms to compare.
 */

/** Common components of German CV compounds, including transliterations. */
const COMPONENTS: ReadonlySet<string> = new Set(
  `software entwicklung entwicklungs entwickler test tests testing automation
   automatisierung qualität qualitaet sicherung sicherheit sicherheits daten
   datenbank datenbanken projekt projekte projekts management managements
   ingenieur ingenieure ingenieurwesen technik technische technologie
   technologien system systeme systems anwendung anwendungen anforderung
   anforderungen erfahrung kenntnis kenntnisse sprache sprachen team teams
   führung fuehrung mitarbeiter kunden kunde prozess prozesse prozessen
   optimierung integration betrieb betriebs wartung pflege beratung vertrieb
   einkauf lager produktion produktions konstruktion planung steuerung
   benutzer oberfläche oberflaeche schnittstelle schnittstellen unterstützung
   unterstuetzung zusammenarbeit lösung loesungen verantwortung gestaltung
   umsetzung betreuung auswertung dokumentation kommunikation koordination
   verwaltung ausbildung forschung analyse analysen migration migrationen
   konzept konzepte architektur infrastruktur netzwerk netzwerke plattform
   plattformen versicherung versicherungs bank produkt produkte produkts
   release releases pipeline pipelines skript skripte umgebung werkzeug
   werkzeuge framework frameworks suite regression regressions abdeckung
   berichtswesen reporting verbesserung weiterentwicklung ausbau
   frontend backend fullstack`
    .split(/\s+/)
    .filter(Boolean)
);

/** Linking elements between two components: Qualitäts-s-Sicherung. */
const FUGEN: readonly string[] = ["s", "n", "es", "en", "er", "e", "ns"];

const MIN_COMPONENT_LENGTH = 4;
const MIN_WORD_LENGTH = 9;
const MAX_DEPTH = 4;

interface SplitResult {
  readonly segments: readonly string[];
}

const splitCache = new Map<string, SplitResult | null>();
const SPLIT_CACHE_LIMIT = 500;

function search(word: string, depth: number): readonly string[] | null {
  if (word.length === 0) return [];
  if (depth === 0) return null;

  for (let length = word.length; length >= MIN_COMPONENT_LENGTH; length -= 1) {
    const prefix = word.slice(0, length);
    if (!COMPONENTS.has(prefix)) continue;

    const rest = word.slice(length);
    if (rest.length === 0) {
      // The whole word is one component; the recursion terminates here.
      return [prefix];
    }

    const direct = search(rest, depth - 1);
    if (direct !== null) return [prefix, ...direct];

    for (const fuge of FUGEN) {
      if (!rest.startsWith(fuge)) continue;
      const afterFuge = search(rest.slice(fuge.length), depth - 1);
      if (afterFuge !== null) return [prefix, ...afterFuge];
    }
  }
  return null;
}

/**
 * Segments a German compound into its components, or returns null when the
 * word is atomic, too short, or no full segmentation exists. Longest prefix
 * first, so "Datenbankanalyse" reads as Daten-Bank-Analyse, not Daten-Ba-nk.
 */
export function splitCompound(word: string): readonly string[] | null {
  if (word.length < MIN_WORD_LENGTH) return null;
  if (!/^[\p{L}]+$/u.test(word)) return null;
  if (COMPONENTS.has(word)) return null;

  const cached = splitCache.get(word);
  if (cached !== undefined) return cached ? cached.segments : null;

  const segments = search(word, MAX_DEPTH);
  const valid =
    segments !== null &&
    segments.length >= 2 &&
    segments.every((segment) => segment.length >= MIN_COMPONENT_LENGTH)
      ? segments
      : null;

  if (splitCache.size >= SPLIT_CACHE_LIMIT) splitCache.clear();
  splitCache.set(word, valid === null ? null : { segments: valid });
  return valid;
}

/**
 * Extra surface forms a German term is matched by: the compound of a spaced
 * or hyphenated term (with the Fugen variants Germans actually write), and
 * the spaced and hyphenated forms of a compound.
 */
export function germanVariants(term: string): string[] {
  const variants: string[] = [];

  if (term.includes(" ") || term.includes("-")) {
    const parts = term.split(/[\s-]+/).filter(Boolean);
    if (parts.length < 2) return variants;
    variants.push(parts.join(""));
    if (parts.length === 2) {
      const [first, second] = parts as [string, string];
      for (const fuge of FUGEN) variants.push(`${first}${fuge}${second}`);
    }
    return variants;
  }

  const segments = splitCompound(term);
  if (segments !== null) {
    variants.push(segments.join(" "));
    variants.push(segments.join("-"));
  }
  return variants;
}
