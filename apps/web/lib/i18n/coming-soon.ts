export type Locale = "en" | "de" | "tr";

export interface ComingSoonCopy {
  readonly status: string;
  readonly lead: string;
  readonly privacy: string;
  readonly caption: string;
  readonly contact: string;
  readonly title: string;
}

/**
 * Written rather than machine-translated: the copy rules ask for plain
 * statements that do not oversell, and that survives translation only when
 * each sentence is rebuilt in the target language.
 */
export const COMING_SOON_COPY: Readonly<Record<Locale, ComingSoonCopy>> = {
  en: {
    status: "Coming soon",
    lead: "An applicant tracking system reads your CV as text, not as a design. This shows you the text it actually gets, scores what survives, and lists what to fix.",
    privacy: "The CV is read and scored in your browser. When you analyze it, the file, its text and the result are stored on our server for 12 months and then deleted.",
    caption:
      "Below the line, the CV as it was designed. Above it, the same page after extraction: columns interleaved, the address broken apart, glyphs the font never embedded.",
    contact: "Questions",
    title: "ATS readability — see your CV the way the parser does"
  },
  de: {
    status: "Demnächst",
    lead: "Ein Bewerbermanagementsystem liest Ihren Lebenslauf als Text, nicht als Gestaltung. Hier sehen Sie den Text, der tatsächlich ankommt, wie viel davon übrig bleibt und was zu ändern ist.",
    privacy: "Ihr Lebenslauf wird in Ihrem Browser gelesen und bewertet. Wenn Sie ihn analysieren, werden die Datei, ihr Text und das Ergebnis 12 Monate auf unserem Server gespeichert und danach gelöscht.",
    caption:
      "Unter der Linie der Lebenslauf, wie er gestaltet wurde. Darüber dieselbe Seite nach der Extraktion: Spalten ineinander verschachtelt, die Adresse zerrissen, Zeichen, die die Schrift nie eingebettet hat.",
    contact: "Fragen",
    title: "ATS-Lesbarkeit — Ihr Lebenslauf, wie der Parser ihn liest"
  },
  tr: {
    status: "Yakında",
    lead: "Başvuru takip sistemleri CV'nizi tasarım olarak değil, metin olarak okur. Burada o metni görürsünüz: neyin okunabildiğini, ne kadarının kaybolduğunu ve neyi düzeltmeniz gerektiğini.",
    privacy: "CV'niz tarayıcınızda okunur ve puanlanır. Analiz ettiğinizde dosya, metni ve sonuç sunucumuzda 12 ay saklanır ve sonra silinir.",
    caption:
      "Çizginin altında CV'nin tasarlandığı hali. Üstünde aynı sayfanın metne dönüşmüş hali: sütunlar iç içe geçmiş, adres parçalanmış, yazı tipinin gömmediği karakterler kaybolmuş.",
    contact: "Sorular",
    title: "ATS okunabilirliği — CV'nizi ayrıştırıcının gördüğü gibi görün"
  }
};

export const LOCALE_LINKS: ReadonlyArray<{ readonly locale: Locale; readonly label: string; readonly href: string }> = [
  { locale: "en", label: "EN", href: "/" },
  { locale: "de", label: "DE", href: "/de" },
  { locale: "tr", label: "TR", href: "/tr" }
];
