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
      en: ["account", "sign", "login", "register", "needed", "required"],
      tr: ["hesap", "giris", "giriş", "kayit", "kayıt", "gerekli", "lazim"],
      de: ["konto", "anmelden", "login", "registrieren", "notwendig", "erforderlich"]
    },
    answerKey: "help.answers.account"
  }
] as const;
