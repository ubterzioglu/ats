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
  }
] as const;
