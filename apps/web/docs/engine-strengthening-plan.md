# ATS kontrol motorunu güçlendirme planı

## Context

Üç araştırma (kod denetimi, ATS parser web araştırması, açık kaynak ve AI araştırması) yapıldı. İki hedef var:

1. **Motoru doğru ve güvenilir yapmak.** Özellikle Türkçe ve Almanca CV'lerde sessiz puan kayıpları var.
2. **Kullanıcıya daha fazla veri vermek.** Ana özellik: **CV'nin güçlü ve zayıf yönleri.** Bugün rapor yalnızca kayıpları (finding) gösteriyor. "Neyi iyi yapıyorsun" hiçbir yerde yok. Ayrıca motorun hesapladığı birçok veri arayüze hiç ulaşmıyor.

Değişmez kurallar (AGENTS.md): `lib/scoring` saf kalır; skor yalnızca `max − Σcost`; her yeni check bir `FindingDraft` + test (tetikleyen ve tetiklemeyen fixture); AI skora girdi vermez; her değişiklik sonrası `npm run lint`, `npm run typecheck`, `npm test` temiz geçer.

Mimari not: Güçlü yönler **puanı değiştirmez**. Saf, bilgilendirici bir türetimdir.

---

## Faz 0: Zemin (önce yapılır, diğer her şeyin güvenliği)

### 0.1 Motor sürümü ve tek config dosyası
- Ne yapılır: `ENGINE_VERSION` sabiti, `AnalysisResult.engineVersion` alanı (opsiyonel), dağınık eşiklerin (`STUFFING_THRESHOLD`, `COVERAGE_TARGET`, sütun oranı 0.18, harf aralığı 0.16, kelime sınırları 150/260/280/1500, WORDS_PER_PAGE) tek `lib/scoring/config.ts` dosyasında toplanması.
- Dosyalar: `lib/scoring/index.ts`, `types/analysis.ts`, yeni `lib/scoring/config.ts`, `lib/report/restore.ts`.
- Ne sağlar: Ağırlıkları sonradan değiştirdiğimizde paylaşılmış eski raporların hangi motorla puanlandığı bilinir. Eşikler tek yerden kalibre edilir. Faz 3'teki ağırlık değişikliğinin ön koşulu.
- Test: `tests/shared-report-restore.test.ts` sürümü olmayan eski satırı tolere etmeli.

### 0.2 Eksik test paketi ve invariant genişletme
- Ne yapılır: Testi olmayan bulgu kimlikleri için tetikleyen + tetiklemeyen fixture: `contact.location/name/profile`, `structure.missing-experience|education|skills`, `no-bullets`, `too-long`, `chronology`, `parse.page-furniture/split-email/icon-font/table-markers/letter-spacing/no-line-structure`, `impact.first-person/buzzwords/long-bullets/no-numbers`. "Skor = max − Σcost" testi yalnızca `STRONG_CV` üzerinde; `tests/fixtures/resumes.ts` içindeki tüm fixture'lara genişletilir.
- Ne sağlar: Faz 1-3'teki değişikliklerin neyi bozduğunu gösteren emniyet ağı. Şu an bu bulguların hiçbiri korunmuyor.
- Boş belge testi (`tests/scoring.test.ts:121-125`, bugün `<35`) Faz 3'te sıkılaştırılır.

---

## Faz 1: Doğruluk düzeltmeleri (küçük, düşük riskli, yüksek etki)

### 1.1 NFC/NFKC normalizasyonu
- Ne yapılır: `normalizeDocument` başında `raw.normalize("NFC")`; ligatür tablosu `ﬅ ﬆ` ile genişletilir.
- Dosya: `lib/scoring/text.ts:22`.
- Ne sağlar: macOS ve Word'den gelen ayrışık Unicode metinde "Eğitim" eğitim bölümü olarak tanınır, "Geliştirdim" tek token kalır. Türkçe ve Almanca CV'lerde başlık, anahtar kelime ve fiil eşleşmesi geri gelir. Bugün bu CV'ler sessizce düşük puan alıyor ve kullanıcı nedenini göremiyor.
- Test: `tests/turkish.test.ts`: NFD "Eğitim" algılanmalı; NFC girdinin çıktısı değişmemeli.

### 1.2 Unicode-güvenli sınırlar
- Ne yapılır: `\b…\b` yerine `(?<![\p{L}\p{N}])…(?![\p{L}\p{N}])` + `u` bayrağı. PLACE kontrolü `caseFold` edilmiş metin üzerinde. Maaş kalıbına sözcük sınırı.
- Dosyalar: `lib/scoring/gate.ts:16-36`, `contact.ts:13`, `sections.ts`, `job-ad.ts:72-73,122,128,153`.
- Ne sağlar: Belge türü kapısı "Özgeçmiş, Üniversite, Öğrenim" sinyallerini görür (bugün 0). "İstanbul" ve "Österreich" konum sayılır (bugün "İstanbul" yanlış `contact.location` bulgusu veriyor). "industry" ve "title" kelimeleri sahte maaş (TRY/TL) üretmez.
- Test: `tests/document-gate.test.ts`, `tests/job-ad.test.ts`.

### 1.3 Telefon, isim, sütun, sayfa tekrarı yanlış pozitifleri
- Telefon (`contact.ts:10,38-39`): `matchAll` ile tüm adaylar taranır, tarih aralıkları ("2019-2022", "03/2021") elenir. Bugün tarihten sonra gelen geçerli numara yok sayılıyor, "2019-2022" telefon sayılıyor.
- İsim (`contact.ts:15-20`): "van", "von", unvan ve sonek ("M.Sc.") tolere edilir.
- Sütun (`parseability.ts:119-131`): boşluktan sonraki parça tarih aralığıysa sütun sayılmaz. Bugün tek sütunlu CV'deki sağa hizalı tarihler `parse.columns` (5 puan) tetikliyor.
- Sayfa tekrarı (`parseability.ts:67-76`): rakamlar `#` ile normalize ("Page # of #"); deneyim bölümündeki tekrarlayan şirket adı sayılmaz.
- Ne sağlar: Kullanıcıya doğru olmayan bulgu göstermemek. Güveni doğrudan etkileyen en görünür hata sınıfı.

### 1.4 Başlık sözlüğü + iki geçişli öncelik
- Ne yapılır: TR (`tecrübe`, `iş tecrübesi`, `deneyimler`, `staj`, `bilgisayar bilgisi`), DE (`berufliche erfahrung`, `bildungsweg`, `schulische ausbildung`, `edv-kenntnisse`, `fachkenntnisse`, `qualifikationen`, `praktika`), EN (`academic qualifications`, `technical proficiencies`, `internships`), harf aralıklı başlık. Önce satırın tamamı başlık olan eşleşmeler, sonra önek eşleşmeleri; böylece özet içindeki "Experience with Python…" satırı gerçek başlığı gölgelemez.
- Dosya: `lib/scoring/sections.ts:12-66,80-107`.
- Ne sağlar: Yalnızca başlık sözcüğü yüzünden Structure'dan giden 12/20 puan geri gelir. Yanlış deneyim aralığı okunması (kronoloji kontrolünü bozan hata) kapanır.
- Opsiyonel yeni bulgu: `structure.experience-unlabelled` (cost 2): başlık yok ama en az 2 tarih aralığı var. `missing-experience` (4) yerine geçer; daha adil ve daha açıklayıcı.

### 1.5 Türkçe büyük-küçük harf ve Latin kısaltmalar
- Ne yapılır: Eşleştirme metni `caseFold(raw)` ile üretilir; Türkçe kök yolu ek yol olarak korunur.
- Dosyalar: `lib/scoring/context.ts:52`, `match.ts:80-110`.
- Ne sağlar: Türkçe CV'de "AI Engineering" bugün `aı engineering` olup ilanla eşleşmiyor; "CI/CD" aynı şekilde. Düzelince Türkçe kullanıcıların keyword puanı haksız yere düşmez.

### 1.6 İlan ayrıştırma ve uygunluk düzeltmeleri
- Kıdem yalnızca başlık satırlarından okunur ("You will lead…" artık lead sayılmaz). Konum kalıpları Unicode ve "Standort/Ort/Lokasyon". Dil eşleşmesi `caseFold` + EN/DE/TR dil adı eşlemesi ("İngilizce", "Englisch"). Tarih okunamadıysa uygunluk deneyim durumu `unknown` olur ("Requires 5 years but parsed 0 years" demez). "Zorunlu" yalnızca `tier === "required"`. 120 karakterden kısa ilan analiz edilmez.
- Dosyalar: `lib/scoring/job-ad.ts`, `suitability.ts`, `index.ts:62`.
- Ne sağlar: Faz 4'te göstereceğimiz ilan verisinin (kıdem, maaş, dil, konum) yanlış olmasını önler. **Faz 4.3'ten önce bitmeli.**

---

## Faz 2: ANA ÖZELLİK. CV'nin güçlü ve zayıf yönleri

### Tasarım
- Yeni saf fonksiyon `deriveStrengths(context, outcomes, keywordReport)` → `lib/scoring/strengths.ts`. `analyzeCv` (`lib/scoring/index.ts:72-85`) sonuca opsiyonel `strengths` alanı olarak ekler. Skoru etkilemez.
- Her güçlü yön bir **kanıt** taşır: `{ id, dimension, params }`. Metin değil, kimlik + sayısal parametre. Böylece üç dilde yerelleştirilebilir (bkz. aşağıda).
- Güçlü yön kaynakları (hepsi zaten hesaplanıyor veya kolayca türetilir):
  - **Contact:** e-posta, telefon, profil linki, konum bulundu (hangileri).
  - **Parseability:** metin katmanı temiz, sütun/tablo/ikon fontu yok, kodlama sağlam.
  - **Structure:** çekirdek bölümler bulundu (Experience/Education/Skills), tarihler tutarlı ve ters kronolojik, madde imi kullanımı, uygun uzunluk (sayfa sayısı).
  - **Impact:** ölçülmüş madde oranı, aksiyon fiili oranı, ortalama madde uzunluğu (`stats.averageBulletWords`). `impact.ts:58-88` içindeki `quantified`/`verb` sayaçları ortak yardımcıya çıkarılır.
  - **Keywords:** eşleşen zorunlu terim sayısı, `coverage`, en güçlü eşleşen terimler (`keywords.matched`).
  - **Uygunluk (ilan varsa):** `status === "passed"` olan kontroller.
  - **Toplam kıdem:** `stats.experienceMonths`.
- Zayıf yönler **yeni veri değil**: mevcut `findings` en yüksek `cost` sırasıyla, boyut bazında gruplanmış. Panel her boyut için iki yüz gösterir.
- Eşik: güçlü yön yalnızca ilgili bulgu **tetiklenmediyse** ve pozitif kanıt varsa üretilir (boş belgede "güçlü yön" üretilmez).

### Arayüz
- Yeni `components/bench/strengths-panel.tsx`. Rapor görünümünde sol kolonda `WorkList` üstünde (`components/analyzer.tsx:566`). Paylaşılan sayfada da (`app/[locale]/r/[token]/page.tsx:55`). Tailor/compare/interview görünümlerine eklenmez.
- Boyut bazında iki sütun: **Güçlü** (kanıtla: "11 maddenin 7'si ölçülmüş") | **Geliştirilecek** (en pahalı 1-2 bulgu, kaç puan kazandıracağıyla).
- `lib/report/markdown.ts:9` ve `components/editor/export-panel.tsx:153` dışa aktarımına aynı bölüm.

### Yerelleştirme
- Mevcut finding metinleri İngilizce ham string. Güçlü yönler için bunu tekrarlamayız: kimlik + parametre → `messages/{en,de,tr}.json` altında yeni `strengths.*` namespace. `tests/messages.test.ts` üç dosyada aynı anahtar ve aynı placeholder'ı zorunlu kılar.

### Kalıcılık ve paylaşım
- `lib/report/restore.ts:132-165` whitelist ile yeniden kuruyor: `restoreStrengths` eklenmezse yeni alan sessizce düşer. Eski satırlarda alan yoksa `[]` döner, panel boş durumu tolere eder.
- `lib/supabase/reports.ts` `stripEvidence` tüm sonucu yazıyor; strengths yalnızca kimlik+sayı taşıdığı için CV metni sızmaz (testle kanıtlanır).

### Test
- `tests/strengths.test.ts`: `STRONG_CV` çok güçlü yön üretir; zayıf fixture az üretir; boş belge hiç üretmez; skor `deriveStrengths` çağrısından bağımsız (aynı girdi, aynı skor).
- `tests/scoring-purity.test.ts` geçmeli (Date/random yok).
- `tests/shared-report-restore.test.ts`: round trip + eski satır.
- `tests/messages.test.ts`: üç dil.

### Ne sağlar
Kullanıcı "69/100, 11 hata" yerine "Şunları doğru yapıyorsun, ilk şunu düzeltirsen +8 puan" görür. Rakiplerin çoğu yalnızca eksikleri listeler. Bu hem motivasyon hem güven: kullanıcı neyi **değiştirmemesi** gerektiğini de öğrenir (iyi giden bir bölümü bozmaz).

---

## Faz 3: Ağırlık ve kapsam dengesi (Faz 0.1 ve 0.2 sonrası)

### 3.1 Impact: madde imi olmayan belgeler ve yıl sayımı
- `bullets.length < 4` ise deneyim bölümü satırları ölçüm kümesi olur. `QUANTIFIED_RX` yılları ve tarih aralıklarını saymaz. Fiil listesine managed, architected, spearheaded, DE isim açılışları (Entwicklung, Einführung, Konzeption, Aufbau, Leitung). `mitgewirkt` ve `unterstützung bei` yalnızca bir regex'te kalır (çift ceza).
- Dosyalar: `impact.ts:8-61`, `context.ts:28`.
- Ne sağlar: Bugün madde imi olmayan belgede Impact hiç ölçülmüyor; herhangi bir rakam varsa 20/20 veriyor. DOCX ve paragraf stilli CV'ler için büyük bir sistematik hata kapanır. Almanca isim üslubu artık "zayıf fiil" cezası almaz.

### 3.2 Keyword baskınlığı
- `keywords.coverage` (tek bulgu, 0-25) → `keywords.required-coverage` (en fazla 15) + `keywords.other-coverage` (en fazla 10). `thin-skill-inventory` en fazla ~10. Taxonomy'ye finans, sağlık, satış, lojistik terimleri (TR/DE eş anlamlılarıyla). AGENTS.md madde 4 gereği maliyetler yeniden dengelenir.
- Ne sağlar: Zorunlu ve isteğe bağlı terim kaybı ayrı görünür; tek bulgu bir boyutu silemez. Yazılım dışı mesleklerin CV'leri yapısal olarak cezalanmaz.
- **Risk:** Altın testler ve eski rapor puanları kayar. 0.1 (motor sürümü) önce gelmeli.

### 3.3 Boş ve çok kısa belge
- Yeni `impact.nothing-to-measure` (cost ~10). `parse.thin-text` ile `structure.too-short` aynı olguyu iki kez cezalandırmaz.
- Ne sağlar: Boş belge bugün 26/100 alıyor; makul bir tabana iner. Çift ceza kalkar.

---

## Faz 4: Çıkarım ve kullanıcıya yeni veri

### 4.1 DOCX yapısını koru
- `mammoth.extractRawText` → `convertToHtml`; `<li>` → `"- "`, tablo hücresi → `\t`. Header/footer okunmadığı uyarıda açıkça söylenir.
- Dosya: `lib/extract/index.ts:9-22`.
- Ne sağlar: DOCX'te madde imi sinyali geri gelir (`structure.no-bullets` ve Impact doğru çalışır); `parse.table-markers` ve `parse.columns` DOCX'te de tetiklenebilir. Kullanıcı DOCX'in neden farklı puan aldığını anlar.
- Test: `tests/docx-export.test.ts` desenindeki node mammoth fixture.

### 4.2 PDF çıkarımı zenginleştirme
- Satır toleransı font yüksekliğine göre (`transform[3]`, `hasEOL`); `getAnnotations()` ile bağlantılar; sayfa sınırı için `\f` işareti; metin katmanı olmayan sayfa sayısı. `AnalysisInput.extraction?: { pages, emptyPages, links }` (saf veri, saflık kuralı bozulmaz).
- Yeni bulgular: `parse.image-page` (karma PDF'de görüntü sayfası, cost 4), `contact.hidden-link` (bağlantı yalnızca annotation'da, cost 2; `contact.profile` ile dengelenir). Header/footer'da iletişim bilgisi kontrolü artık yapılabilir.
- Dosyalar: `lib/extract/pdf.ts`, `lib/extract/types.ts`, `types/analysis.ts`, `parseability.ts`, `contact.ts`.
- Ne sağlar: Web araştırmasında tek tutarlı resmi sinyal "metin seçilebilir olmalı". Bugün yalnızca toplam metin <200 karakter ise uyarı var; tek sayfası görüntü olan PDF fark edilmiyor. Gizli LinkedIn linki "var ama görünmüyor" diye kanıtlanır.
- **Tutarlılık notu:** Yalnızca yapıştırılan metinle analizde bu bulgular çıkmaz; arayüzde belgelenir.

### 4.3 Hesaplanan ama gösterilmeyen verileri göster
- `market` seçimini UI'dan `analyzeCv`'ye geçir (`components/analyzer.tsx:144`); bugün hiç geçmiyor, J.6 pazar tavsiyeleri fiilen çalışmıyor.
- Rail'e: toplam kıdem (`experienceMonths`), çakışan dönemler, tahmini sayfa sayısı, madde sayısı ve ortalama madde uzunluğu.
- İlan paneline: kıdem, istenen deneyim yılı, dil, konum, maaş (**Faz 1.6'dan sonra**).
- `EntriesTable`: `periods` sonuca taşınır, ikinci ayrıştırıcı (`lib/bench/entries.ts:74`) kaldırılır; iki ayrıştırıcı birbirinden sapabilir.
- `keywords.overused` taban modda da gösterilir; Europass işaretçi sayısı; dil tespiti güveni; `projects` bölümü.
- Ne sağlar: Yeni hesaplama gerektirmeyen, hazır veri; düşük risk, görünür fayda.

### 4.4 "ATS ne gördü?" alan tablosu
- Ad, e-posta, telefon, son unvan, işveren, tarih aralığı, okul: çıkarılabildi / çıkarılamadı, kanıt satırıyla. Lever, Workday ve softgarden'in gerçekten eşlediği alanlar bunlar.
- Ne sağlar: Skordan daha dürüst veri: "ATS profilinde şunu görür". Rakiplerde nadir, tamamen yerel çalışır. `IdentityTable` ve `ParserView` mevcut bileşenler üzerine kurulur.

### 4.5 Dürüst metin ve pazar notları
- Puanın altına: "Kural tabanlı okunabilirlik tahmini; belirli bir ATS'in parser'ı veya işe alım sonucu hakkında iddia değildir."
- softgarden/Textkernel e-postayı bilerek okumaz: `parse.split-email` ve `contact.email` mesajları "ATS e-postayı okumadı" demez, "e-posta bölünmüş/okunamaz" der.
- Kişisel veri ipuçları (TC kimlik no, medeni hal, din) öneri düzeyinde, TR ve DE profiline göre (`cost: 0`).
- Kaçınılacak ifadeler: "ATS %75'i eler", "sütunlar kesin bozar".

---

## Faz 5: AI ve açık kaynak (puanı etkilemeden)

| Madde | Ne yapılır | Ne sağlar | Risk |
|---|---|---|---|
| 5.1 Sentetik çok dilli fixture + altın küme | LLM ile TR/DE/EN CV ve ilan çiftleri üret, dondurulmuş metin olarak depoya al (üretici, prompt, tarih meta verisiyle). `resume-parsing-vision` (CC-BY-4.0, atıf) ve SkillSpan (CC-BY-4.0) değerlendirme için | Kalibrasyon ve regresyon güvenliği; Türkçe için açık veri seti yok | Düşük |
| 5.2 Statik beceri sözlüğü | ESCO (DE/EN) ve O*NET'ten derleme zamanında JSON; Türkçe elle; arayüzde atıf | `thin-skill-inventory` ve eşleşme kapsamı genişler | Düşük (atıf şart) |
| 5.3 Çevrimdışı eşanlam madenciliği | Geliştirici makinesinde e5/bge-m3 ile aday eşanlamlılar; insan onayı; statik sözlüğe | Runtime'da model yok, puan hâlâ saf | Düşük |
| 5.4 LLM-as-judge kalibrasyonu | Çevrimdışı; maliyet ağırlıklarını gözden geçirir, sonuç belgelenir | Ağırlık kararları kanıta dayanır | Düşük |
| 5.5 İsteğe bağlı OCR | tesseract.js (Apache-2.0), dil verisi onay + boyut + ilerleme + iptal ile; ayrı bulgu "OCR gerekti" | Taranmış PDF'lerde sonuç | Orta (boyut, gizlilik metni) |
| 5.6 Bilgilendirici embedding önerisi | multilingual-e5-small int8 (~118 MB); `lib/ai/semantic-match.ts:19` eşiği (0.55) gerçek modelle ölçülüp terim başına göreli eşiğe | "CV'de X var, ilanda Y; benzer" ipucu, puan değişmez | Orta |
| 5.7 Bağımlılık güncellemeleri | `@huggingface/transformers` 3.8→4.x, `pdfjs-dist` 5→6 (ayrı PR) | Güncel parser davranışı | Orta (kırıcı değişiklik) |

**Kullanılmayacaklar:** open-resume (AGPL), pyresparser (GPL), mupdf ve scribe.js-ocr (AGPL), Lightcast Open Skills (ticari yasak), kaynağı belirsiz gerçek CV veri setleri. Hazır kullanılabilir bir TS CV-parser kütüphanesi bulunamadı; mevcut `lib/extract` + `lib/scoring` incelenen repoların çoğundan ileride.

---

## Karar gerektiren konu (planın dışında, önce netleşmeli)

AGENTS.md: CV analizde sunucuya gönderilir, Supabase ve Google Drive'a yedeklenir, 12 ay saklanır. MASTERPLAN.md: "dosya hiç yüklenmez". Arayüzde "gizlilik öncelikli" benzeri ifade varsa hangisinin doğru olduğu netleşmeli.

---

## Sıralama ve bağımlılıklar

```
0.1, 0.2  →  1.1-1.6  →  2 (ana özellik)  →  3.x  →  4.x  →  5.x
              (1.6, 4.3'ten önce)   (3.2, 0.1'den sonra)   (5.1, 3.2 kalibrasyonundan önce olabilir)
```

Her faz ayrı commit(ler)le ilerler; her adımda lint, typecheck, test temiz olmalı.

## Doğrulama (uçtan uca)

1. `npm run lint`, `npm run typecheck`, `npm test` her adımdan sonra temiz.
2. Faz 1: `tests/fixtures/resumes.ts` içindeki `TURKISH_RESUME` ve `LOOP_RESUME_DE` için NFD ve NFC varyantı; puan farkı sıfır olmalı.
3. Faz 2: `npm run dev`, `STRONG_CV` ve zayıf bir CV yükle; Güçlü/Geliştirilecek panelini üç dilde (en/de/tr) kontrol et; paylaşım linki oluştur ve `/r/[token]` sayfasında panelin geldiğini, eski bir satırda boş durumun çökmediğini doğrula.
4. Faz 3: Madde imsiz bir DOCX/paragraf CV ve boş belge; puan öncesi/sonrası farkını rapor et (motor sürümü karşılaştırması).
5. Faz 4: Karma (metin + görüntü sayfalı) PDF fixture'ı ve bağlantılı PDF; `tests/helpers/pdf-templates.ts` ile.
6. `npm run build` (standalone) son kontrol.
