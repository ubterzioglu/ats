# Prompt: ATS research for another agent

Copy everything below the line into another agent. It is self-contained.

---

Rol: ATS (Applicant Tracking System) okunabilirlik analizi konusunda araştırmacı + yazılım mimarısın.

Bağlam:
"ats readability" adlı bir CV analiz aracını geliştiriyoruz. CV, tarayıcıda okunur ve puanlanır. Puanlama deterministik ve saf (pure) kalmak zorunda: DOM, ağ veya AI girdisi puanı etkileyemez. AI yalnızca yardımcıdır (tarayıcıda yerel çalışır, model ağırlıkları kullanıcı onayıyla iner).
Teknoloji: Next.js 15, React 19, TypeScript strict, Tailwind. Diller: EN, DE, TR.
Skor 100 üzerinden 5 boyuttan oluşur: Parseability 25, Keyword match 25, Impact 20, Structure 20, Contact 10. Her puan kaybı adlandırılmış bir finding'e bağlıdır.
Mevcut kontroller:
- contact: email, location, market-*, name, phone, profile
- impact: buzzwords, few-numbers, first-person, generic-phrasing, hedging, inflated-language, long-bullets, no-numbers, weak-verbs
- keywords: acronym-pair, coverage, experience-gap, listed-only, stuffing, thin-skill-inventory
- parse: columns, decorative-bullets, encoding, garbled-text, icon-font, letter-spacing, mojibake, no-line-structure, page-furniture, split-email, table-markers, thin-text, too-little-text
- structure: chronology, date-format, europass, missing-summary, mixed-date-formats, no-bullets, no-dates, nonstandard-present, reversed-dates, too-long, too-short

Görev (internet + GitHub + akademik kaynaklar):
1. Gerçek ATS'lerin (Workday, Greenhouse, Lever, iCIMS, Taleo, SmartRecruiters, SuccessFactors, Personio, Softgarden) CV'yi nasıl ayrıştırdığını araştır: sütun, tablo, header/footer, metin kutusu, ikon, görsel, PDF ve DOCX farkları. Her iddiayı "doğrulanmış / satıcı pazarlaması / söylenti" olarak etiketle.
2. Rakipleri (Jobscan, Resume Worded, Teal, Enhancv, Rezi, SkillSyncer) incele: hangi kontrolleri yapıyor, kullanıcıya hangi veriyi gösteriyor? Bizde olmayan neler var?
3. Bizim listede olmayan kontrol önerileri çıkar (ör. taranmış PDF tespiti, header/footer içindeki iletişim bilgisi, okuma sırası bozulması, gömülü link kaybı, ligature bozulması, boşluk/örtüşen tarih, dealbreaker şartlar, sertifika/sürüm eşleşmesi).
4. Kullanıcıya gösterebileceğimiz ek veri öner (ör. "ATS'in gördüğü ham metin", bölüm bazlı okunabilirlik, anahtar kelimenin geçtiği bölüm, tarih zaman çizelgesi, farklı parser'larla karşılaştırma).
5. Açık kaynak kod araştır (gh search repos/code, npm, PyPI): CV parser'lar, skill taxonomy'leri (ESCO, O*NET, Lightcast), PDF/DOCX çıkarım kütüphaneleri, tarayıcıda OCR, tarayıcıda çalışan küçük embedding/NER/LLM modelleri (boyutları MB cinsinden), halka açık CV ve ilan veri setleri. Her biri için URL, yıldız, son commit tarihi, LİSANS ver. GPL/AGPL/ticari kullanıma kapalı olanları "uyumsuz" olarak işaretle.
6. AI'ı deterministikliği bozmadan nasıl kullanırız? Örnekler: AI öneri üretir ama puanı kural belirler; LLM'i yalnızca test fixture üretmek veya kalibrasyon için çevrimdışı kullanmak; eş anlamlı sözlük madenciliği.

Kurallar:
- Her bulguya kaynak URL ve tarih ekle. Uydurma kaynak veya istatistik yazma. Emin değilsen "doğrulanamadı" de.
- "ATS puanı işe alım sonucunu tahmin eder" tarzı iddiaları destekleme. Arayüz dürüst kalmalı.
- Gizlilik sözleşmesi: CV metni üçüncü taraf model sağlayıcıya gönderilmez. Önerilerin bununla uyumlu olması gerekir.

Çıktı (Türkçe):
A) Güçlü ve zayıf yönler tablosu (mevcut kontrol listesine göre)
B) Yeni kontrol önerileri: ad, ne tespit eder, nasıl tespit edilir, tahmini maliyet (puan), diller, etki ve efor (S/M/L)
C) Kullanıcıya gösterilecek yeni veri noktaları
D) Kullanılabilir repo ve kütüphane listesi (lisans, boyut, verdict: kullan / fikri al / yoksay)
E) AI kullanım önerileri (deterministik kalma kısıtıyla)
F) Önceliklendirilmiş yol haritası (ilk 10 madde)
