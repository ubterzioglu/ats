import type { HelpEntry } from "./types";

export const HELP_ENTRIES: readonly HelpEntry[] = [
  {
    id: "upload",
    keywords: {
      en: ["cv", "stored", "upload", "save", "data", "privacy", "file"],
      tr: ["cv", "saklanıyor", "yükle", "kayıt", "veri", "gizlilik", "dosya", "kvkk"],
      de: ["cv", "gespeichert", "hochladen", "daten", "datei", "datenschutz", "privatsphare"]
    },
    answerKey: "faq.items.upload.a"
  },
  {
    id: "score",
    keywords: {
      en: ["score", "calculated", "points", "dimension", "parseability", "keyword", "impact", "structure", "contact"],
      tr: ["puan", "hesaplaniyor", "hesaplanıyor", "nokta", "boyut", "okunabilirlik", "anahtar", "etki", "yapı", "iletişim"],
      de: ["punktzahl", "berechnet", "punkte", "dimension", "parsebarkeit", "keyword", "wirkung", "struktur", "kontakt"]
    },
    answerKey: "faq.items.score.a"
  },
  {
    id: "languages",
    keywords: {
      en: ["language", "recognised", "recognized", "english", "german", "turkish", "detected"],
      tr: ["dil", "tanınıyor", "taniniyor", "ingilizce", "almanca", "turkce", "türkçe", "algılanıyor"],
      de: ["sprache", "erkannt", "englisch", "deutsch", "turkisch", "erkannt"]
    },
    answerKey: "faq.items.languages.a"
  },
  {
    id: "shared",
    keywords: {
      en: ["shared", "share", "link", "report", "store", "expire"],
      tr: ["paylasim", "paylaşım", "link", "baglanti", "bağlantı", "rapor", "süre", "geçerlilik"],
      de: ["geteilt", "freigabe", "link", "bericht", "speichern", "ablauf"]
    },
    answerKey: "faq.items.shared.a"
  },
  {
    id: "guarantee",
    keywords: {
      en: ["guarantee", "invite", "interview", "hired", "score", "mean", "predict"],
      tr: ["garanti", "davet", "mulakat", "mülakat", "ise", "anlam", "tahmin"],
      de: ["garantie", "einladung", "vorstellungsgesprach", "vorstellungsgespräch", "eingestellt", "bedeuten", "vorhersagen"]
    },
    answerKey: "faq.items.guarantee.a"
  },
  {
    id: "noAd",
    keywords: {
      en: ["job", "ad", "description", "without", "missing", "keyword"],
      tr: ["is", "ilan", "ilanı", "olmadan", "eksik", "anahtar"],
      de: ["job", "anzeige", "stellenanzeige", "ohne", "fehlend", "keyword"]
    },
    answerKey: "faq.items.noAd.a"
  },
  {
    id: "formats",
    keywords: {
      en: ["format", "file", "pdf", "docx", "word", "text", "supported", "upload"],
      tr: ["format", "dosya", "pdf", "docx", "word", "metin", "desteklenen", "yükle"],
      de: ["format", "datei", "pdf", "docx", "word", "text", "unterstutzt", "unterstützt"]
    },
    answerKey: "faq.items.formats.a"
  },
  {
    id: "retention",
    keywords: {
      en: ["retention", "keep", "kept", "long", "delete", "data", "months", "12", "twelve"],
      tr: ["saklama", "saklanıyor", "ne kadar", "sure", "süre", "silinme", "veri", "ay", "12", "oniki"],
      de: ["aufbewahrung", "aufbewahrt", "wie lange", "loschen", "löschen", "daten", "monate", "12", "zwolf"]
    },
    answerKey: "faq.items.retention.a"
  },
  {
    id: "delete",
    keywords: {
      en: ["delete", "erase", "remove", "data", "request", "gdpr", "kvkk"],
      tr: ["sil", "silme", "silmek", "veri", "talep", "kvkk", "gdpr"],
      de: ["loschen", "löschen", "entfernen", "daten", "anfrage", "dsgvo", "gdpr"]
    },
    answerKey: "faq.items.delete.a"
  },
  {
    id: "accuracy",
    keywords: {
      en: ["accurate", "accuracy", "reliable", "score", "parser", "vendor"],
      tr: ["dogru", "doğru", "guvenilir", "güvenilir", "puan", "ayristirici", "ayrıstırıcı"],
      de: ["genau", "genauigkeit", "zuverlässig", "punktzahl", "parser", "anbieter"]
    },
    answerKey: "faq.items.accuracy.a"
  },
  {
    id: "free",
    keywords: {
      en: ["free", "cost", "price", "pay", "charge", "account"],
      tr: ["ucretsiz", "ücretsiz", "ucret", "ücret", "odeme", "ödeme", "hesap"],
      de: ["kostenlos", "gratis", "preis", "bezahlen", "kosten", "konto"]
    },
    answerKey: "help.answers.free"
  },
  {
    id: "account",
    keywords: {
      en: ["account", "sign", "login", "register", "need", "needed", "required"],
      tr: ["hesap", "giris", "giriş", "kayit", "kayıt", "gerekli", "lazim"],
      de: ["konto", "anmelden", "login", "registrieren", "brauche", "brauchen", "notwendig", "erforderlich"]
    },
    answerKey: "help.answers.account"
  },
  {
    id: "columns",
    keywords: {
      en: ["column", "table", "layout", "two column", "parse", "break"],
      tr: ["sütun", "tablo", "düzen", "iki sütun", "ayrıştırma", "bozul"],
      de: ["spalte", "tabelle", "layout", "zwei spalten", "parsen", "brechen"]
    },
    answerKey: "help.findings.columns"
  },
  {
    id: "encoding",
    keywords: {
      en: ["encoding", "garbled", "mojibake", "character", "broken", "special"],
      tr: ["kodlama", "bozuk", "karakter", "özel", "harf", "türkçe"],
      de: ["kodierung", "zeichen", "sonderzeichen", "kaputt", "falsch"]
    },
    answerKey: "help.findings.encoding"
  },
  {
    id: "quantify",
    keywords: {
      en: ["number", "quantify", "measure", "metric", "percent", "result"],
      tr: ["sayı", "ölç", "metrik", "yüzde", "sonuç", "sayısallaştır"],
      de: ["zahl", "quantifizieren", "messen", "metrik", "prozent", "ergebnis"]
    },
    answerKey: "help.findings.quantify"
  },
  {
    id: "verbs",
    keywords: {
      en: ["verb", "action", "start", "begin", "weak", "passive"],
      tr: ["fiil", "eylem", "başla", "zayıf", "edilgen"],
      de: ["verb", "aktion", "beginnen", "schwach", "passiv"]
    },
    answerKey: "help.findings.verbs"
  },
  {
    id: "contact",
    keywords: {
      en: ["email", "phone", "contact", "missing", "link", "linkedin"],
      tr: ["eposta", "telefon", "iletişim", "eksik", "bağlantı", "linkedin"],
      de: ["email", "telefon", "kontakt", "fehlend", "link", "linkedin"]
    },
    answerKey: "help.findings.contact"
  },
  {
    id: "sections",
    keywords: {
      en: ["section", "heading", "experience", "education", "skills", "missing"],
      tr: ["bölüm", "başlık", "deneyim", "eğitim", "beceri", "eksik"],
      de: ["abschnitt", "überschrift", "erfahrung", "bildung", "fähigkeiten", "fehlend"]
    },
    answerKey: "help.findings.sections"
  },
  {
    id: "parseColumns",
    keywords: {
      en: ["column", "table", "layout", "two column", "reading order", "mix"],
      tr: ["sütun", "tablo", "düzen", "iki sütun", "okuma sırası", "karış"],
      de: ["spalte", "tabelle", "layout", "zwei spalten", "lesereihenfolge", "mischen"]
    },
    answerKey: "help.findings.parseColumns"
  },
  {
    id: "parseEncoding",
    keywords: {
      en: ["encoding", "garbled", "mojibake", "character", "broken", "special", "turkish", "german"],
      tr: ["kodlama", "bozuk", "karakter", "özel", "harf", "türkçe", "almanca"],
      de: ["kodierung", "zeichen", "sonderzeichen", "kaputt", "falsch", "türkisch", "deutsch"]
    },
    answerKey: "help.findings.parseEncoding"
  },
  {
    id: "parseImageOnly",
    keywords: {
      en: ["image", "scan", "scanned", "ocr", "selectable", "text layer", "pdf"],
      tr: ["görüntü", "tarama", "taranmış", "ocr", "seçilebilir", "metin katmanı", "pdf"],
      de: ["bild", "scan", "gescannt", "ocr", "auswählbar", "textebene", "pdf"]
    },
    answerKey: "help.findings.parseImageOnly"
  },
  {
    id: "contactMissing",
    keywords: {
      en: ["contact", "email", "phone", "missing", "profile", "linkedin"],
      tr: ["iletişim", "eposta", "telefon", "eksik", "profil", "linkedin"],
      de: ["kontakt", "email", "telefon", "fehlend", "profil", "linkedin"]
    },
    answerKey: "help.findings.contactMissing"
  },
  {
    id: "impactWeak",
    keywords: {
      en: ["impact", "weak", "verb", "action", "quantify", "number", "metric", "result"],
      tr: ["etki", "zayıf", "fiil", "eylem", "sayısallaştır", "sayı", "metrik", "sonuç"],
      de: ["wirkung", "schwach", "verb", "aktion", "quantifizieren", "zahl", "metrik", "ergebnis"]
    },
    answerKey: "help.findings.impactWeak"
  },
  {
    id: "keywordsMissing",
    keywords: {
      en: ["keyword", "missing", "match", "ad", "job description", "coverage"],
      tr: ["anahtar kelime", "eksik", "eşleşme", "ilan", "iş tanımı", "kapsam"],
      de: ["keyword", "fehlend", "übereinstimmung", "anzeige", "stellenbeschreibung", "abdeckung"]
    },
    answerKey: "help.findings.keywordsMissing"
  },
  {
    id: "scoreDrop",
    keywords: {
      en: ["score", "drop", "decrease", "lower", "went down", "why"],
      tr: ["puan", "düştü", "azaldı", "düşük", "neden"],
      de: ["punktzahl", "sinken", "verringert", "niedriger", "warum", "gesunken"]
    },
    answerKey: "help.result.scoreDrop"
  },
  {
    id: "fixFirst",
    keywords: {
      en: ["fix", "first", "priority", "improve", "start", "where"],
      tr: ["düzelt", "önce", "öncelik", "iyileştir", "başla", "nereden"],
      de: ["beheben", "zuerst", "priorität", "verbessern", "beginnen", "wo"]
    },
    answerKey: "help.result.fixFirst"
  },
  {
    id: "tailor",
    keywords: {
      en: ["tailor", "customize", "job ad", "match", "keywords", "adapt"],
      tr: ["uyarla", "özelleştir", "iş ilanı", "eşleştir", "anahtar kelime", "uyum"],
      de: ["anpassen", "zuschneiden", "stellenanzeige", "übereinstimmung", "keywords", "adaptieren"]
    },
    answerKey: "help.features.tailor"
  },
  {
    id: "compare",
    keywords: {
      en: ["compare", "variants", "multiple", "ads", "versions", "differences"],
      tr: ["karşılaştır", "varyantlar", "çoklu", "ilanlar", "versiyonlar", "farklar"],
      de: ["vergleichen", "varianten", "mehrere", "anzeigen", "versionen", "unterschiede"]
    },
    answerKey: "help.features.compare"
  },
  {
    id: "interview",
    keywords: {
      en: ["interview", "prepare", "questions", "practice", "story", "star"],
      tr: ["mülakat", "hazırlan", "sorular", "pratik", "hikaye", "star"],
      de: ["vorstellungsgespräch", "vorbereiten", "fragen", "üben", "geschichte", "star"]
    },
    answerKey: "help.features.interview"
  },
  {
    id: "coverLetter",
    keywords: {
      en: ["cover letter", "motivation", "write", "draft", "generate"],
      tr: ["ön yazı", "motivasyon", "yaz", "taslak", "oluştur"],
      de: ["anschreiben", "motivation", "schreiben", "entwurf", "erstellen"]
    },
    answerKey: "help.features.coverLetter"
  },
  {
    id: "editor",
    keywords: {
      en: ["editor", "build", "create", "resume", "export", "pdf", "docx"],
      tr: ["editör", "oluştur", "yarat", "özgeçmiş", "dışa aktar", "pdf", "docx"],
      de: ["editor", "erstellen", "bauen", "lebenslauf", "exportieren", "pdf", "docx"]
    },
    answerKey: "help.features.editor"
  },
  {
    id: "atsFacts",
    keywords: {
      en: ["ats", "applicant tracking", "parser", "how works", "read", "extract"],
      tr: ["ats", "aday takip", "ayrıştırıcı", "nasıl çalışır", "okuma", "çıkarma"],
      de: ["ats", "bewerber tracking", "parser", "wie funktioniert", "lesen", "extrahieren"]
    },
    answerKey: "help.facts.ats"
  },
  {
    id: "personalData",
    keywords: {
      en: ["photo", "date of birth", "dob", "marital status", "personal", "required"],
      tr: ["fotoğraf", "doğum tarihi", "medenı durum", "kışisel", "gerekli"],
      de: ["foto", "geburtsdatum", "familienstand", "persönlich", "erforderlich"]
    },
    answerKey: "help.facts.personalData"
  }
] as const;
