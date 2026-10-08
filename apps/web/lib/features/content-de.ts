import type { FeatureContent } from "./content-types";

export const FEATURES_DE: FeatureContent = {
  scoring: {
    title: "CV-Analyse und Bewertung",
    summary: "Fünf Dimensionen ergeben 100 Punkte, und jeder verlorene Punkt ist an einen benannten Befund gebunden.",
    intro: "Die Plattform bewertet Ihren Lebenslauf in fünf Dimensionen mit insgesamt 100 Punkten:",
    points: [
      { label: "Lesbarkeit (25)", text: "Ob die Textschicht die Extraktion übersteht. Spalten, Tabellen, Icon-Schriften und fehlerhafte Kodierungen werden hier bewertet." },
      { label: "Keyword-Übereinstimmung (25)", text: "Abdeckung der aus der Stellenanzeige extrahierten Begriffe, jeweils nach ihrer Zentralität für die Anzeige gewichtet." },
      { label: "Wirkung (20)", text: "Quantifizierte Ergebnisse und Verantwortungs-Verben, gemessen an Fülltexten ohne Substanz." },
      { label: "Struktur (20)", text: "Überschriften, die ein Parser Feldern zuordnen kann, datierte Einträge in umgekehrter Reihenfolge, Aufzählungspunkte statt Absätze." },
      { label: "Kontakt (10)", text: "Name, E-Mail, Telefon, Standort und Profil-Links." }
    ],
    outro: "Jeder verlorene Punkt ist an einen benannten Befund gebunden, der angibt, aus welcher Zeile er stammt und was stattdessen geschrieben werden soll. Befunde werden nach den Punkten sortiert, die sie zurückholen würden."
  },
  "parser-view": {
    title: "Parser-Ansicht",
    summary: "Zeigt Feld für Feld, wie ein Bewerbermanagementsystem Ihren Lebenslauf sieht.",
    intro: "Diese Ansicht beantwortet die Fragen, die Bewerber am häufigsten stellen:",
    points: [
      { text: "Hat der Parser Ihre Überschrift und Ihre Daten korrekt gelesen?" },
      { text: "Wurden Identitätsfelder wie Name, E-Mail, Telefon, Standort und Links gefunden, sind sie verdächtig oder fehlen sie?" },
      { text: "Wie sieht jeder Erfahrungseintrag aus: Position, Unternehmen und Zeitraum?" },
      { text: "Wurden Ausbildung, Fähigkeiten und Sprachen korrekt extrahiert?" }
    ],
    outro: "Jedes fehlende oder verdächtige Feld enthält eine lesbare Ursache, zum Beispiel \"der Zeitraum scheint über zwei Spalten aufgeteilt\". Ein Klick auf ein Feld hebt seine Zeile im Rohtext hervor."
  },
  "job-ad": {
    title: "Stellenanzeigen-Analyse",
    summary: "Auch die Anzeige wird analysiert: Anforderungen, Seniorität, Red Flags und ob sie noch aktiv ist.",
    intro: "Wenn Sie eine Stellenanzeige hinzufügen, liest die Plattform auch die Anzeige selbst:",
    points: [
      { label: "Erforderliche und bevorzugte Fähigkeiten", text: "Welche Fähigkeiten obligatorisch und welche wünschenswert sind." },
      { label: "Erfahrungsstufe", text: "Das von der Anzeige erwartete Erfahrungslevel." },
      { label: "Sprachanforderung", text: "Von der Anzeige geforderte Sprachen." },
      { label: "Standort und Remote", text: "Das Arbeitsmodell der Stelle." },
      { label: "Gehalt", text: "Die Gehaltsspanne, falls die Anzeige eine nennt." },
      { label: "Red Flags", text: "Übermäßig lange Skill-Listen, Erfahrungsanforderungen, die der Seniorität widersprechen, vage Rollendefinitionen." },
      { label: "Eignungs-Checkliste", text: "Eine deterministische Prüfung ohne KI." },
      { label: "Ghost-Posting-Prüfung", text: "Prüft, ob die Anzeige tatsächlich aktiv ist." }
    ]
  },
  matching: {
    title: "Multi-Mode-Matching",
    summary: "Striktes, normalisiertes und semantisches Matching für denselben Lebenslauf und dieselbe Anzeige, mit erklärtem Unterschied.",
    intro: "Drei Matching-Modi laufen über denselben Lebenslauf und dieselbe Anzeige:",
    points: [
      { label: "Strict", text: "Exaktes, wortwörtliches Matching." },
      { label: "Normalized", text: "Verwendet Synonyme, Abkürzungen und eine Skill-Taxonomie." },
      { label: "Semantic", text: "Embedding-basiertes Matching, das in Ihrem Browser läuft." }
    ],
    outro: "Sie sehen, wie jeder Modus andere Ergebnisse liefert und welche Begriffe den Unterschied ausmachen. Semantische Treffer erscheinen als \"mögliche Übereinstimmung\", nie als bestätigt."
  },
  tailor: {
    title: "Tailor-Modus",
    summary: "Passt den Lebenslauf an eine Anzeige an, ohne etwas einzutragen, das Sie nicht haben.",
    points: [
      { label: "Karten für fehlende Begriffe", text: "Begriffe aus der Anzeige, die im Lebenslauf fehlen. Jede Karte zeigt, wo der Begriff vorkommt, wie zentral er ist und wo er im Lebenslauf stehen könnte." },
      { label: "\"Ich habe diese Fähigkeit\"-Schranke", text: "Kein Begriff gelangt ohne Ihre Bestätigung in den Lebenslauf. Keine Fähigkeit, Erfahrung oder Zahl, die Sie nicht haben, wird eingetragen." },
      { label: "Bullet-Rewriting", text: "Formuliert nur bestehende Bulletpoints um, mit Platzhaltern wie [X%] und [N Personen], wo ein messbares Ergebnis fehlt." },
      { label: "Anschreiben-Helfer", text: "Erstellt ein Anschreiben mit denselben Schutzvorkehrungen." },
      { label: "Variantenvergleich", text: "Zeigt die Bewertung des Master-Lebenslaufs neben der angepassten Variante." }
    ]
  },
  interview: {
    title: "Vorbereitung auf das Vorstellungsgespräch",
    summary: "Story-Karten aus Ihrem Lebenslauf, gängigen Fragen zugeordnet, mit Übungsmodus.",
    points: [
      { label: "STAR-Story-Bank", text: "Situation-, Task-, Action- und Result-Karten aus den Erfolgs-Bulletpoints Ihres Lebenslaufs. Nichts wird erfunden." },
      { label: "Vorlagenfragen", text: "Häufige Interviewfragen, Story-Karten zugeordnet. Keine KI erforderlich." },
      { label: "Anzeigenspezifische Fragen", text: "Aus der Anzeige abgeleitete Fragen. Sie brauchen ein von Ihnen aktiviertes Layer-2- oder Layer-3-Modell, und die Fragen beziehen sich auf Begriffe der Anzeige." },
      { label: "Übungsmodus", text: "Eine Frage wird angezeigt, Sie schreiben eine Antwort, und das Tool schlägt die passendste Story-Karte vor. Der Vorschlag ist über gemeinsame Wörter nachvollziehbar." }
    ]
  },
  tracker: {
    title: "Bewerbungs-Tracker",
    summary: "Ein Kanban-Board, das zeigt, wo jede Bewerbung steht.",
    points: [
      { label: "Phasen", text: "Gespeichert, beworben, Interview, Angebot oder abgelehnt." },
      { label: "Karten-Links", text: "Die Anzeige, die verwendete CV-Variante, die Bewertung zum Zeitpunkt der Bewerbung, Notizen und Kontaktdaten." },
      { label: "Follow-up-Erinnerungen", text: "Zum Beispiel \"seit 7 Tagen keine Antwort\"." },
      { label: "CSV- und JSON-Export", text: "Exportieren Sie Ihre Daten jederzeit." },
      { label: "Ein-Klick-Löschung", text: "Entfernt alle Daten lokal." }
    ],
    outro: "Das Board lebt auf Ihrem Gerät und synchronisiert sich mit Ihrem Konto."
  },
  "cv-builder": {
    title: "ATS-sicherer CV-Builder",
    summary: "Erstellen Sie einen Lebenslauf in einem Editor, dessen Export jedes Mal von unserem eigenen Parser geprüft wird.",
    points: [
      { label: "JSON-Resume-Schema", text: "Ein Standardformat für Import und Export." },
      { label: "Editor-Formular", text: "Jedes Feld ist bearbeitbar." },
      { label: "Vorlagen", text: "Dichte, einfache und moderne PDF-Vorlagen." },
      { label: "Closed-Loop-Validierung", text: "Jeder Export läuft durch unseren eigenen Parser, und das Ergebnis wird Ihnen angezeigt. CI-Tests stellen sicher, dass alle Vorlagen bei der Lesbarkeit 25/25 erreichen." },
      { label: "DOCX-Export", text: "Öffnet korrekt in Word und LibreOffice." },
      { label: "Bestehenden Lebenslauf importieren", text: "PDF oder DOCX wird in den Editor eingelesen. Nicht extrahierbare Felder werden zur manuellen Ergänzung markiert, nie erfunden." }
    ]
  },
  linkedin: {
    title: "LinkedIn-Konsistenzprüfung",
    summary: "Vergleicht Ihren Lebenslauf mit dem LinkedIn-Export \"Als PDF speichern\" und zitiert bei jeder Abweichung beide Seiten.",
    intro: "Laden Sie Ihren Lebenslauf und das PDF von LinkedIn hoch (Mehr, dann Als PDF speichern). Die Prüfung meldet:",
    points: [
      { text: "Datumsabweichungen zwischen einer Rolle im Lebenslauf und derselben Rolle im Profil." },
      { text: "Unterschiedliche Titel für dieselbe Rolle." },
      { text: "Fähigkeiten im Lebenslauf, die das Profil nie erwähnt." },
      { text: "Eine Profilüberschrift, die auf eine andere Rolle zeigt als die Überschrift im Lebenslauf." }
    ],
    outro: "Beide Dateien werden in Ihrem Browser gelesen. Jede Unstimmigkeit zitiert Lebenslauf und Profil nebeneinander."
  },
  languages: {
    title: "Mehrsprachige Unterstützung",
    summary: "Englisch, Türkisch und Deutsch laufen über dieselbe Engine, einschließlich Stemming und Datumsformaten.",
    points: [
      { label: "Türkisches Stemming", text: "Ein Snowball-Türkisch-Stemmer im Keyword-Matching." },
      { label: "Deutsche Komposita-Zerlegung", text: "\"Softwareentwicklung\" wird zu \"Software\" und \"Entwicklung\"." },
      { label: "Sprachspezifische Stoppwörter", text: "Für jede Sprache abgestimmt." },
      { label: "Kodierungsprüfung", text: "Fehlerhafte ı İ ş ğ ç ö ü ä ß-Zeichen werden als Lesbarkeits-Befund gemeldet." },
      { label: "Datumsformate", text: "\"Oca 2022\", \"Ocak 2022\", \"01.2022\", \"Jan. 2022\", \"März 2022\", \"heute\", \"halen\", \"devam ediyor\"." },
      { label: "Marktbasierte Beratung", text: "Foto, Geburtsdatum, Familienstand und Militärdienst, je nach Zielmarkt." },
      { label: "Europass-Erkennung", text: "Europass-Layouts werden erkannt und markiert." }
    ]
  },
  ai: {
    title: "KI-gestützte Korrekturen",
    summary: "KI erklärt und schlägt vor. Die Bewertung ist deterministisch, und KI berührt sie nie.",
    points: [
      { label: "Lokales Modell (Layer 1)", text: "Embedding-basiertes semantisches Matching, das im Browser läuft." },
      { label: "Ihr eigenes Ollama (Layer 2)", text: "Ein Modell auf Ihrem Rechner für Bullet-Rewriting, Erklärungen, Anschreiben und Interviewfragen." },
      { label: "BYOK (Layer 3)", text: "Stärkere Modelle mit Ihrem eigenen API-Schlüssel. Der Schlüssel bleibt im Browser und wird nie an unseren Server gesendet." },
      { label: "Schema-Validierung", text: "Jede Modellausgabe wird gegen ein JSON-Schema geprüft. Ausgaben, die durchfallen, werden nie angezeigt." }
    ],
    outro: "Jede KI-Ausgabe durchläuft eine Grounding-Prüfung, die nach erfundenen Zahlen, Technologien oder Organisationen sucht, die nicht im Lebenslauf stehen."
  },
  reports: {
    title: "Berichts-Freigabe und Export",
    summary: "Laden Sie einen PDF- oder Markdown-Bericht herunter oder teilen Sie einen Link ohne Zeilen aus Ihrem Lebenslauf.",
    points: [
      { label: "PDF-Bericht", text: "Laden Sie den Analysebericht als PDF herunter." },
      { label: "Freigabe-Links", text: "Speichern Bewertungen und Empfehlungen, enthalten aber keine Zeilen aus dem Lebenslauf. Links laufen nach 30 Tagen ab." },
      { label: "Markdown-Bericht", text: "Exportieren Sie den Bericht als Markdown." }
    ]
  },
  privacy: {
    title: "Datenschutz und Datenaufbewahrung",
    summary: "Was wo gelesen wird, was gespeichert wird und wann es gelöscht wird.",
    points: [
      { text: "Der Lebenslauf wird zuerst in Ihrem Browser gelesen und bewertet." },
      { text: "Bei der Analyse werden Datei, Text und Ergebnis an den Server gesendet und 12 Monate aufbewahrt." },
      { text: "Nach 12 Monaten werden Datei, extrahierter Text und Ergebnis aus Datenbank, Speicher und Google-Drive-Backup gelöscht." },
      { text: "Freigabe-Links speichern Bewertungen und Befunde ohne Nachweise, da Nachweise Zeilen aus dem Dokument enthalten können." },
      { text: "Über das Datenanforderungsformular können Sie die Löschung beantragen." }
    ]
  },
  history: {
    title: "Sitzungsverlauf und Fortschritt",
    summary: "Sehen Sie, wie sich die Bewertung in einer Sitzung bewegt hat und welchen Befund jede Änderung geschlossen hat.",
    points: [
      { label: "Sitzungs-Bewertungsverlauf", text: "Ein Diagramm der Bewertung über die Sitzung." },
      { label: "Delta pro Änderung", text: "Eine Notiz für jede Änderung, etwa \"+4 · Keyword-Übereinstimmung\", die zeigt, welcher Befund geschlossen wurde." },
      { label: "Vergleich mit dem letzten Besuch", text: "Ein zweiter Besuch zeigt die Veränderung gegenüber dem vorherigen." }
    ]
  },
  help: {
    title: "Hilfesystem",
    summary: "Ein Site-Helper, der aus einer Keyword-Bank antwortet und nichts sendet oder speichert.",
    points: [
      { label: "Keyword-basierte Hilfe", text: "Der Helper antwortet aus einer Keyword-Bank, sendet keine Daten an einen Server und speichert nichts." },
      { label: "Kontextbewusste Antworten", text: "Antworten berücksichtigen das aktuelle Analyseergebnis." }
    ]
  }
};
