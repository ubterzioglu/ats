/**
 * The source article carries each comparison table in English only. These are
 * the Turkish and German versions, keyed by section number. Footnote markers
 * are written as `[^n]` and match the English table cell for cell.
 */

type TranslatedLocale = "tr" | "de";

export const ARTICLE_TABLES: Readonly<Record<number, Readonly<Record<TranslatedLocale, string>>>> = {
  1: {
    tr: [
      "| Özgeçmiş Öğesi | İnsan Gözüyle Yorum | Algoritmik (ATS) Çıkarım Sonucu | Hatanın Sonucu |",
      "| :---- | :---- | :---- | :---- |",
      "| **Beceri İlerleme Çubukları** | Python'da %90 yeterlilik | Tamamen atlanır ya da rastgele sembollere dönüşür | Aday teknik beceri filtrelerine takılır[^2] |",
      "| **Profil Fotoğrafları** | Yüksek kaliteli, profesyonel görünüm | Yok sayılır; yanındaki metin yer değiştirir | Ayrıştırma için anlamsız; önyargı oluşturma riski[^2] |",
      "| **Canva/Figma PDF'leri** | Renk bloklarıyla net ayrılmış bölümler | Bozuk metin çıktısı; katmanlar öngörülemez biçimde çöker | Boş veri alanları nedeniyle anında ret[^1] |",
    ].join("\n"),
    de: [
      "| Lebenslauf-Element | Visuelle Deutung durch Menschen | Ergebnis der algorithmischen (ATS-)Extraktion | Folge des Fehlers |",
      "| :---- | :---- | :---- | :---- |",
      "| **Fortschrittsbalken für Fähigkeiten** | 90 % Kompetenz in Python | Wird komplett ausgelassen oder als beliebige Symbole extrahiert | Kandidat scheitert an den Filtern für technische Fähigkeiten[^2] |",
      "| **Profilfotos** | Hochwertige, professionelle Ästhetik | Wird ignoriert; benachbarter Text verschiebt sich räumlich | Für das Parsing irrelevant; mögliche Voreingenommenheit[^2] |",
      "| **Canva-/Figma-PDFs** | Klar getrennte Abschnitte durch Farbblöcke | Verstümmelte Textausgabe; Ebenen brechen unvorhersehbar zusammen | Sofortige Ablehnung wegen leerer Datenfelder[^1] |",
    ].join("\n"),
  },
  2: {
    tr: [
      "| Çıkarım Mekanizması | Tek Kolonlu Format | İki Kolonlu Format (Yan Panel) | Veri Bütünlüğüne Etkisi |",
      "| :---- | :---- | :---- | :---- |",
      "| **Y Ekseni Koordinat Sıralaması** | Kronolojik blokları kusursuz okur | İlgisiz bölümlerin metnini birleştirir[^10] | Aşırı veri bozulması |",
      "| **Alan Eşleme** | 'Unvan', 'Şirket', 'Tarih' alanlarını sırayla eşler | Tarihleri tamamen atar ya da yan panel metnine atar[^4] | 'Eksik' deneyim nedeniyle elenme |",
    ].join("\n"),
    de: [
      "| Extraktionsmechanismus | Einspaltiges Format | Zweispaltiges Format (Seitenleiste) | Auswirkung auf die Datenintegrität |",
      "| :---- | :---- | :---- | :---- |",
      "| **Sortierung nach Y-Achsen-Koordinaten** | Liest chronologische Blöcke einwandfrei | Verschmilzt Text aus nicht zusammengehörigen Abschnitten[^10] | Extreme Datenverfälschung |",
      "| **Feldzuordnung** | Ordnet 'Titel', 'Unternehmen', 'Datum' der Reihe nach zu | Lässt Datumsangaben komplett weg oder ordnet sie dem Text der Seitenleiste zu[^4] | Disqualifikation wegen 'fehlender' Berufserfahrung |",
    ].join("\n"),
  },
  3: {
    tr: [
      "| Karakter/Yazı Tipi Sorunu | PDF Üretimindeki Kök Neden | ATS Yorumu | Önleme Stratejisi |",
      "| :---- | :---- | :---- | :---- |",
      "| **İkon Fontları** | Glifler PUA Unicode alanına eşlenir[^14] | Boş kutular, düşen alanlar | Düz metin etiketleri kullanın (ör. \"Telefon:\") |",
      "| **Tipografik Bağlaçlar (Ligatür)** | \"fi\", \"fl\" harfleri U+FB01 glifinde birleşir[^16] | Eksik harfler (ör. \"profit\" yerine \"pro t\") | Word/dışa aktarma ayarlarında ligatürleri kapatın[^19] |",
    ].join("\n"),
    de: [
      "| Zeichen-/Schriftproblem | Ursache bei der PDF-Erstellung | ATS-Interpretation | Vermeidungsstrategie |",
      "| :---- | :---- | :---- | :---- |",
      "| **Icon-Schriften** | Glyphen werden auf PUA-Unicode abgebildet[^14] | Leere Kästchen, verlorene Felder | Klartext-Beschriftungen verwenden (z. B. \"Telefon:\") |",
      "| **Typografische Ligaturen** | \"fi\", \"fl\" werden zum Glyph U+FB01 verschmolzen[^16] | Fehlende Buchstaben (z. B. \"pro t\" statt \"profit\") | Ligaturen in Word/beim Export deaktivieren[^19] |",
    ].join("\n"),
  },
  10: {
    tr: [
      "| 5 Dakikalık Kontrol Listesi Maddesi | Uygulama Hedefi | Teknik Doğrulama |",
      "| :---- | :---- | :---- |",
      "| **1. Yerleşim** | Tek kolonlu, doğrusal akış | Yan yana duran içerik bloğu yok[^2] |",
      "| **2. Metin Çıkarımı** | Temiz kopyala-yapıştır çıktısı | Not Defteri'nde metin sırayla görünür[^32] |",
      "| **3. Başlıklar** | Sektör standardı terimler | Birebir ifadeler: \"İş Deneyimi\", \"Eğitim\"[^2] |",
      "| **4. Grafikler** | Yalnızca metne dayalı yapı | Sıfır tablo, ilerleme çubuğu veya ikon[^1] |",
      "| **5. Üstveri Katmanı** | İletişim bilgileri belge gövdesinde | Üst/alt bilgi alanları tamamen boş[^2] |",
    ].join("\n"),
    de: [
      "| Punkt der 5-Minuten-Checkliste | Umsetzungsziel | Technische Überprüfung |",
      "| :---- | :---- | :---- |",
      "| **1. Layout** | Einspaltiger, linearer Aufbau | Keine nebeneinanderliegenden Inhaltsblöcke[^2] |",
      "| **2. Extraktion** | Saubere Copy-and-paste-Ausgabe | Text erscheint im Editor in der richtigen Reihenfolge[^32] |",
      "| **3. Überschriften** | Branchenübliche Begriffe | Exakte Bezeichnungen: \"Berufserfahrung\", \"Ausbildung\"[^2] |",
      "| **4. Grafiken** | Reine Textarchitektur | Keine Tabellen, Fortschrittsbalken oder Icons[^1] |",
      "| **5. Metadaten-Ebene** | Kontaktdaten im Dokumentkörper | Kopf- und Fußzeilen sind vollständig leer[^2] |",
    ].join("\n"),
  },
};
