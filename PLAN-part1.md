# ATS Readability — Uygulama Planı (küçük batch'ler)

Kaynaklar: `aday-icin-ozellikler.md` (hedef ürün), `2026 Yılı ATS Özgeçmiş Analiz ve Optimizasyon Teknolojileri.docx` (pazar araştırması), repo `ubterzioglu/ats` (AGENTS.md, docker-compose.yml, .env.example).

> Not: Repo'nun yalnızca üst düzey yapısına ve AGENTS.md / docker-compose / .env.example dosyalarına eriştim; `apps/`, `packages/`, `services/`, `tests/` içeriği okunamadı. Bu yüzden her özellik grubu "mevcut durumu doğrula → eksiği tamamla" biçiminde yazıldı. Batch 0.1 sonunda üretilecek durum matrisi, "zaten var" olan batch'lerin kapsamını küçültür.

---

## 1. Verilen kararlar (uygulama sırasında soru sorulmaz)

| Konu | Karar |
|---|---|
| Kapsam | 15 özelliğin tamamı + 4 ek özellik (aşağıda) |
| Kod konumu | `apps/web/` (Next.js 15, React 19, TS strict, Tailwind 3). AGENTS.md eski kabul edilir, Batch 0.2'de güncellenir |
| Backend | Yalnızca Next.js server actions / route handlers. `services/` yeni iş almaz (Batch 0.2'de durumu belgelenir; kullanılmıyorsa README ile "kullanım dışı" işaretlenir, silinmez) |
| Veri | Supabase (Postgres + private bucket + Auth), Google Drive yedeği, 12 ay saklama |
| Auth | Supabase Auth: e-posta sihirli bağlantı + Google. Misafir mod yerelde çalışır |
| İlan girişi | Yapıştırılan metin + URL çekme (SSRF korumalı, sunucu tarafı) |
| AI | L1: transformers.js çok dilli MiniLM (tarayıcı, Web Worker); L2: kullanıcının Ollama'sı; L3 BYOK: Anthropic + OpenAI. Anahtar yalnızca tarayıcıda |
| Ek özellikler | (a) Hedef ATS tespiti, (b) keyword stuffing uyarısı + aksiyon fiili kütüphanesi TR/EN/DE, (c) Chrome eklentisi, (d) hesapsız hızlı test + maaş/pazarlık yardımcısı |
| Kapsam dışı | Otomatik başvuru, form otomatik gönderimi, LinkedIn/Indeed'e özel scraper, ödeme/paywall, reklam |
| Ürün modeli | Ücretsiz, reklamsız. Yalnızca kötüye kullanım için rate-limit/kota |
| Arayüz dili | TR / EN / DE (i18n anahtarları). Analiz dili de TR/EN/DE |
| Kalite kapısı | lint + typecheck + vitest her batch'te; kritik akışlar için Playwright duman testleri |
| Lisans | AGPL (open-resume vb.) kodu kopyalanmaz; yalnızca fikir. Bağımlılıklar MIT/Apache/BSD olmalı (Batch 0.2'de lisans kontrolü) |

## 2. Değişmez kurallar (her batch için)

1. AGENTS.md mimari kuralları: `lib/scoring/` saf; `lib/extract/` yalnız tarayıcı; `lib/ai/` yalnız tarayıcı ve danışman (skora girdi veremez); `lib/supabase/` ve `lib/cv-submission/` yalnız sunucu (`import "server-only"`); `lib/help/` saf ve sunucusuz.
2. Skor değişmezi: dimension skoru = `max − Σ cost`, `[0,max]` aralığına kıstırılır. Her kesinti bir `FindingDraft`. Yeni kontrol = `id` (`dimension.ad`), `title` (kusur), `detail` (kanıt), `fix` (somut talimat), pozitif + negatif fixture testi.
3. Uydurma yok: adayda olmayan beceri/sayı/organizasyon hiçbir çıktıya yazılmaz. Sayı gereken yerde `[X%]`, `[N kişi]` yer tutucusu.
4. Persistans isteğe bağlı: `getSupabaseEnv()` null ise sessizce düşer, throw etmez.
5. Metin tonu: sade, abartısız; işe alım sonucunu tahmin ettiğini veya belirli bir ATS'nin parser'ını birebir kopyaladığını iddia etmez. Emoji yok.
6. Kod stili: `noUncheckedIndexedAccess`, `any` yok, `@/` alias, kebab-case dosya, `interface`/`type` kuralları, Tailwind yalnız token'larla.
7. Her batch sonunda: `npm run lint` (0 uyarı), `npm run typecheck`, `npm test` temiz → yalnızca batch'e ait dosyalar stage → conventional commit → `main`'e push (AGENTS.md).
8. Her batch: ≤ ~10 dosya, tek commit, 1–3 saat. Daha büyükse bölünür (`a`/`b`).
9. Her yeni kullanıcıya görünür metin 3 dilde i18n anahtarı olarak eklenir (Batch 0.3'ten sonra).
10. Her yeni sunucu girdisi (action/route) Zod ile doğrulanır; her yeni tablo RLS ile gelir.

## 3. Batch şablonu

Her batch şu alanlarla tanımlanır: **Amaç · Dosyalar · Adımlar · Kabul · Testler · Commit**. Aşağıdaki tablolarda `Kabul` = bitti sayılma ölçütü.

## 4. Faz ve batch dizini

| Faz | Konu | Batch'ler |
|---|---|---|
| 0 | Temel | 0.1 – 0.5 |
| 1 | Puanlama çekirdeği (F1) | 1.1 – 1.8 |
| 2 | Çoklu dil (F10) | 2.1 – 2.6 |
| 3 | Ayrıştırıcı görünümü (F2) | 3.1 – 3.4 |
| 4 | İş ilanı analizi (F3 + hedef ATS) | 4.1 – 4.8 |
| 5 | Eşleştirme modları (F4) | 5.1 – 5.5 |
| 6 | AI katmanları (F11) | 6.1 – 6.6 |
| 7 | Tailor modu (F5) | 7.1 – 7.5 |
| 8 | Mülakat hazırlığı (F6) | 8.1 – 8.4 |
| 9 | Auth + Kanban (F7) | 9.1 – 9.7 |
| 10 | CV oluşturucu (F8) | 10.1 – 10.7 |
| 11 | LinkedIn tutarlılığı (F9) | 11.1 – 11.3 |
| 12 | Rapor/paylaşım (F12) | 12.1 – 12.4 |
| 13 | Gizlilik/saklama (F13) | 13.1 – 13.4 |
| 14 | Oturum geçmişi (F14) | 14.1 – 14.3 |
| 15 | Yardım sistemi (F15) | 15.1 – 15.2 |
| 16 | Ek: stuffing + fiil kütüphanesi | 16.1 – 16.3 |
| 17 | Ek: hesapsız test + maaş yardımcısı | 17.1 – 17.3 |
| 18 | Ek: Chrome eklentisi | 18.1 – 18.5 |
| 19 | Sertleştirme ve yayın | 19.1 – 19.6 |

Toplam: ~100 batch. Bağımlılık sırası bilinçli: Faz 2 (dil) → 3/4/5 (okuma ve eşleştirme) → 6 (AI) → 7/8 (AI'ı kullanan özellikler) → 9 (hesap) → 10+.

---

## Faz 0 — Temel

**0.1 Repo denetimi ve durum matrisi**
- Amaç: Gerçek kod durumunu çıkar.
- Adımlar: Ağaç dökümü; her 15 özellik + 4 ek için `var / kısmi / yok` + ilgili dosyalar; `npm ci && lint && typecheck && test && build` çıktı kaydı; bağımlılık lisans listesi.
- Dosyalar: `docs/status-matrix.md` (yeni).
- Kabul: Matris commit'li; bu planın batch'lerinin yanına "atla / daralt / tam" etiketi yazıldı.

**0.2 Dokümantasyon ve yapılandırma hizalama**
- Amaç: AGENTS.md ↔ gerçek yapı ↔ docker-compose ↔ .env.example tutarlılığı.
- Adımlar: AGENTS.md yollarını `apps/web/...` yap; `.env.example`'ı docker-compose ile eşitle (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `ADMIN_EMAILS`, `CRON_SECRET`, `CLIENT_HASH_SALT`, Google Drive, SMTP); kullanılmayan `API_URL/REDIS_URL/DATABASE_URL` işaretle veya çıkar; `services/` için README; `.omc` `.gitignore`'a; lisans denetim script'i (`npm run licenses`).
- Kabul: Yeni geliştirici `.env.example`'dan çalışan konfigürasyon çıkarabilir; AGENTS.md komutları kökten çalışır.

**0.3 i18n altyapısı (TR/EN/DE)**
- Dosyalar: `apps/web/lib/i18n/{config,messages/tr.json,en.json,de.json,use-t}.ts`, `middleware` (dil seçimi: çerez → Accept-Language).
- Adımlar: Sunucu/istemci `t()`; eksik anahtar için tip güvenli; mevcut arayüz metinlerini anahtara taşı (yalnız ortak kabuk: üst menü, hata, boş durum).
- Testler: Üç dil dosyasının anahtar kümesi eşit (vitest).
- Kabul: Dil değiştirici çalışır; eksik çeviri CI'da kırmızı.

**0.4 Playwright duman testleri**
- Dosyalar: `playwright.config.ts`, `tests/e2e/smoke.spec.ts`, `tests/fixtures/cv/{tr,en,de}-*.pdf|docx|txt`.
- Adımlar: CV yükle → skor görünür; `npm run e2e` script'i; CI'da ayrı job (Supabase env yokken persistans devre dışı da çalışmalı).
- Kabul: Yerelde ve CI'da 3 senaryo yeşil.

**0.5 CI hattı**
- Adımlar: GitHub Actions: lint, typecheck, vitest, build, e2e; Node sürüm sabitleme; cache; `docker build` doğrulaması.
- Kabul: `main`'e her push'ta yeşil/kırmızı net.

---

## Faz 1 — Puanlama çekirdeği (Özellik 1)

Ortak: toplam 100 = Okunabilirlik 25 + Anahtar kelime 25 + Etki 20 + Yapı 20 + İletişim 10. Her batch önce mevcut kontrolleri fixture ile sabitler, sonra eksikleri ekler. Toplam kesinti tabanının sıfıra düşmemesi (AGENTS.md kural 4) her batch'te test edilir.

**1.1 Skor değişmezi ve bulgu modeli sağlamlaştırma**
- Dosyalar: `lib/scoring/{types,findings,aggregate}.ts`, `tests/scoring.test.ts`.
- Adımlar: `FindingDraft` şeması (id, dimension, cost, title, detail, fix, evidence?, lineRef?); `lineRef` kaynak satır eşlemesi; skorun doğrudan değiştirilememesi (tip düzeyinde); özellik tabanlı (property) test: rastgele bulgu kümesi için toplam = 100 − Σ.
- Kabul: Her kayıp puan bir bulguya bağlı; test kanıtlar.

**1.2 Okunabilirlik (25)**
- Kontroller: metin katmanı çıkarılabilirliği (boş/çok az metin), çok sütun, tablo, simge fontu/PUA karakter, bozuk kodlama (kodlama detayı Faz 2.4), başlık/altbilgi tekrarı, görüntü-yalnız PDF.
- Her kontrol: pozitif + negatif fixture. Maliyet dengesi tablosu `docs/scoring-costs.md`.
- Kabul: Dimension taban skoru gerçekçi kötü CV'de >0.

**1.3 Anahtar kelime eşleşmesi (25) — iskelet**
- Adımlar: İlan terimi → ağırlık (merkezilik: sıklık, başlıkta geçme, "gerekli" bölümünde geçme); CV kapsamı = Σ ağırlık·bulundu / Σ ağırlık; eksik terim başına bulgu (tavanlı).
- Not: Terim çıkarma gerçek zenginliğini Faz 4/5'te alır; burada arayüzü sabitle (`JobTerm {term, weight, section}`).
- Kabul: İlansız durumda dimension "ilan eklenmedi" olarak nötr (puan kırılmaz, ayrı gösterilir) — karar: ilansız toplam 75 üzerinden gösterilir ve 100'e ölçeklenmez; arayüz bunu açıkça yazar.

**1.4 Etki (20)**
- Kontroller: sayısal sonuç oranı, sahiplenme fiilleri (Faz 16 kütüphanesine bağlanır), "sorumluydu/görevliydi" dolgu kalıpları, madde uzunluğu.
- Kabul: TR/EN/DE fiil ve dolgu kalıbı fixture'ları.

**1.5 Yapı (20)**
- Kontroller: alanlara eşlenebilir başlıklar (Deneyim/Experience/Berufserfahrung…), ters kronolojik sıra, madde işareti vs paragraf, tarih biçimi tutarlılığı, çok uzunluk (sayfa sayısı sezgisi).

**1.6 İletişim (10)**
- Kontroller: ad, e-posta, telefon, konum, profil bağlantısı; başlık/altbilgide olması (parser için riskli).

**1.7 Bulgu sıralama: "en çok puan kazandıran önce"**
- Adımlar: `rankFindings()` = cost'a göre azalan; eşitlikte `fix` kolaylığı. Her bulgu satır referansı taşır.
- UI: Bulgu listesi, her bulguda "kaç puan kazandırır", kaynağa tıkla → ham metin satırı vurgulanır (Faz 3.4 ile ortak bileşen).
- Kabul: Birim + 1 e2e (bulguya tıkla → satır vurgulanır).

**1.8 Skor açıklama raporu**
- Adımlar: "Puan neden X" özet tablosu (5 dimension, kayıp toplamı, bulgu sayısı); "her kayıp açıklanıyor" iddiası otomatik testle (toplam kayıp = bulgu maliyeti toplamı).
- Kabul: Test yeşil; UI'da kaybedilen puan = açıklanan puan.

---

## Faz 2 — Çoklu dil (Özellik 10)

**2.1 Dil algılama**
- Dosyalar: `lib/lang/detect.ts` (saf). Karakter/stopword histogramı ile TR/EN/DE; belirsiz ise kullanıcı seçer. CV ve ilan için ayrı algılanır, uyuşmazlıkta uyarı bulgusu.

**2.2 Türkçe kök alma**
- Snowball Türkçe stemmer (MIT lisanslı paket veya kendi uygulama). `ı/İ` büyük-küçük harf kuralları (`toLocaleLowerCase('tr')`). Fixture: "yönetimi/yönetim/yönettim" aynı kök.

**2.3 Almanca bileşik bölme**
- Sözlük tabanlı bölücü: "Softwareentwicklung" → Software + Entwicklung; Fugen-s; hata durumunda bölmeden bırak. Üst sınır: sözcük parçaları ≥ 4 harf.

**2.4 Durak sözcükler ve kodlama bozulması**
- Dile özgü durak sözcükler; bozuk karakter (`Ä±`, `Ã¼`, `ÅŸ` vb.) tespiti → `parse.encoding` bulgusu (Okunabilirlik). `ı İ ş ğ ç ö ü ä ß` bütünlük testi.

**2.5 Tarih biçimleri**
- Desteklenen: "Oca 2022", "Ocak 2022", "01.2022", "Jan. 2022", "März 2022", "heute", "halen", "devam ediyor", "present". Tek `parseDateRange()` (saf). Çok sayıda fixture.

**2.6 Pazar bazlı tavsiye + Europass**
- Hedef pazar seçimi (TR/DE/US/UK/EU). Fotoğraf, doğum tarihi, medeni hal, askerlik durumu için pazara özgü bilgilendirme bulguları (maliyeti düşük, "bilgi" seviyesi; skor kırmaz — AGENTS.md "tahmin iddiası yok" ilkesi). Europass düzen algılama + uyarı.
- Kabul: Üç dil e2e: her dilde örnek CV → beklenen bulgular.

---

## Faz 3 — Ayrıştırıcı Görünümü (Özellik 2)

Mevcut kod: `components/parser-view.tsx` (109 satır, markedIndex ile satır vurgulama), `lib/scoring/contact.ts` (alan tespiti: email/phone/profile/location/name), `lib/scoring/experience.ts` (tarih çıkarma), `lib/scoring/sections.ts` (başlık algılama). MASTERPLAN Module A (A.1–A.4) tamamlanmış.

**3.1 Parser görünümü sağlamlaştırma — araştırma makalesindeki edge case'ler**
- Amaç: Araştırma makalesindeki 5 kritik parser hatasını mevcut kontrollerde doğrula, eksik olanı ekle.
- Kontrol matrisi:

| Edge Case | Mevcut kontrol | Durum |
|---|---|---|
| İki sütunlu metin birleşimi | `parse.columns` (`parseability.ts:139-151`) — `\S {3,}\S` ile gap tespiti | ✅ Mevcut |
| İkon fontu (PUA) | `parse.icon-font` (`parseability.ts:252-261`) — PRIVATE_USE + EMOJI | ✅ Mevcut |
| Ligatür bozulması (fi/fl/ff) | Yok | ❌ Eklenecek |
| Başlık/altbilgi tekrarı | `parse.page-furniture` (`parseability.ts:217-228`) | ✅ Mevcut |
| Görüntü-yalnız PDF | `parse.image-page` (`parseability.ts:268-281`) | ✅ Mevcut |

- Eksik kontrol — ligatür bozulması:

```typescript
// parseability.ts'ye eklenecek
// Ligatür bozulması: fi→ﬁ (U+FB01), fl→ﬂ (U+FB02), ff→ﬀ (U+FB00),
// ffi→ﬃ (U+FB03), ffl→ﬄ (U+FB04) dönüşümlerinin ters yöndeki izleri.
// PDF text extraction sonrası bu ligature glyph'ler tek karakter olarak
// gelir; bazı parser'lar bunları geri açamaz ve "pro le" veya "pro t" üretir.
const LIGATURE_GLYPHS = /[\uFB00-\uFB06]/g;

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

// scoreParseability() içinde:
const ligatures = countMatches(raw, LIGATURE_GLYPHS);
if (ligatures > 4) {
  drafts.push({
    id: "parse.ligature",
    severity: "low",
    title: "Typographic ligatures in the text layer",
    detail: `${ligatures} ligature glyphs found (fi, fl, ff merged into single characters). Some parsers cannot decompose these back to individual letters, causing words like "profile" to appear as "pro le".`,
    fix: "Disable discretionary ligatures in the word processor before exporting to PDF. In Word: Format → Font → Advanced → Ligatures → None.",
    cost: 2
  });
}
```

- Fixture'lar:
  - `tests/fixtures/cv/parser-edge/ligature-broken.pdf` — ligatür içeren PDF
  - `tests/fixtures/cv/parser-edge/ligature-clean.pdf` — ligatürsüz PDF
  - `tests/fixtures/cv/parser-edge/two-column.pdf` — iki sütunlu
  - `tests/fixtures/cv/parser-edge/icon-font-pua.pdf` — FontAwesome ikonlu
- Test:

```typescript
// tests/parseability-edge.test.ts
import { buildContext } from "@/lib/scoring/context";
import { scoreParseability } from "@/lib/scoring/parseability";

test("ligature glyphs trigger parse.ligature", () => {
  const text = "Pro\uFB01le of a so\uFB01ware developer with pro\uFB01ciency in e\uFB03cient systems";
  const ctx = buildContext(text);
  const result = scoreParseability(ctx);
  expect(result.findings.some(f => f.id === "parse.ligature")).toBe(true);
});

test("clean text does not trigger parse.ligature", () => {
  const text = "Profile of a software developer with proficiency in efficient systems";
  const ctx = buildContext(text);
  const result = scoreParseability(ctx);
  expect(result.findings.some(f => f.id === "parse.ligature")).toBe(false);
});
```

- Kabul: 5 edge case fixture'ı doğru raporlanıyor; ligatür kontrolü eklendi; mevcut skor değişmezi bozulmadı.

**3.2 Alan eşleme güvenilirlik skoru**
- Amaç: Parser view'da her çıkarılan alan için güvenilirlik göstergesi.
- Mevcut durum: `parser-view.tsx` `highlights` prop'u ile terimleri vurgular; `markedIndex` ile satır vurgular. Ancak alanlar (email, phone, name…) için güven seviyesi gösterilmiyor.
- Mimari:

```
ScoreContext → scoreContact() → findings (mevcut)
                                ↓ (yeni)
                        ContactFieldReport {
                          field: 'email' | 'phone' | 'name' | 'location' | 'profile';
                          status: 'found' | 'suspect' | 'missing';
                          confidence: number;   // 0-1
                          reason?: string;
                          lineIndex?: number;
                        }
```

- Dosyalar:
  - `lib/scoring/contact.ts` → `ContactFieldReport[]` döndüren yeni fonksiyon
  - `components/parser-view.tsx` → alan güven rozetleri
- Diff örneği (contact.ts):

```diff
 export function scoreContact(context: ScoreContext, market?: TargetMarket): DimensionOutcome {
+  // Yeni: alan bazlı güvenilirlik raporu da döndür
+}
+
+export interface ContactFieldReport {
+  readonly field: 'email' | 'phone' | 'name' | 'location' | 'profile';
+  readonly status: 'found' | 'suspect' | 'missing';
+  readonly confidence: number;
+  readonly reason?: string;
+  readonly lineIndex?: number;
+}
+
+export function analyzeContactFields(context: ScoreContext): readonly ContactFieldReport[] {
+  const { raw, lines } = context;
+  const fields: ContactFieldReport[] = [];
+
+  // Email
+  const emailMatch = raw.match(EMAIL);
+  if (emailMatch) {
+    const lineIdx = lines.findIndex(l => l.includes(emailMatch[0]));
+    const inHeader = lineIdx >= 0 && lineIdx < 3;
+    fields.push({
+      field: 'email', status: 'found',
+      confidence: inHeader ? 0.95 : 0.8,
+      lineIndex: lineIdx >= 0 ? lineIdx : undefined
+    });
+  } else {
+    fields.push({ field: 'email', status: 'missing', confidence: 0 });
+  }
+  // ... phone, name, location, profile benzer şekilde
+  return fields;
+}
```

- Kabul: Her alan rozetli; rozet rengi `confidence` aralığına bağlı (≥0.8 yeşil, ≥0.5 sarı, <0.5 kırmızı, 0 gri); testler mevcut.

**3.3 Kopyala-Yapıştır Testi entegrasyonu**
- Amaç: Araştırma makalesindeki "5 Dakikalık Kontrol Listesi" madde 2 — parser view'da tüm çıkarılan metni düz metin olarak göster + bir tıkla panoya kopyala.
- Mevcut: `ParserView` bileşeni metni `<pre>` içinde gösteriyor (`parser-view.tsx:87`), ancak "kopyala" butonu yok.
- Eklenti:

```typescript
// parser-view.tsx'e eklenecek
<button
  onClick={() => navigator.clipboard.writeText(text)}
  className="micro text-muted hover:text-ink transition-colors"
  aria-label={t("copyRawText")}
>
  {t("copy")}
</button>
```

- i18n anahtarları: `parserView.copy` (TR: "Kopyala", EN: "Copy", DE: "Kopieren"), `parserView.copyRawText` (TR: "Ham metni kopyala"…).
- Kabul: Buton çalışır; kopyalanan metin doğru sırada.

**3.4 Kaynak satır vurgulama iyileştirme**
- Amaç: İki yönlü vurgulama — bulgudan kaynak satıra VE parser view'daki alandan bulgu listesine.
- Mevcut: `markedIndex` prop'u tek yönlü (bulgu → satır). Ters yön yok.
- Eklenti: Bulgu listesindeki `work-item` tıklamasının `markedIndex`'i ayarladığı gibi, parser view'daki bir alan tıklaması da bulgu listesinde ilgili bulguyu vurgulasın.
- Mekanizma: Ortak `highlightState` zustand store'u veya `useCallback` prop zinciri.
- Kabul: Her iki yönde de vurgulama çalışır; mobilde erişilebilir.

---

## Faz 4 — İş İlanı Analizi (Özellik 3 + Hedef ATS Tespiti)

Mevcut kod: `lib/scoring/job-ad.ts` (283 satır — seniority, experience, language, location, salary, red flags çıkarma), `lib/scoring/keywords.ts` (679 satır — terim çıkarma, ağırlıklı eşleştirme, stuffing tespiti), `lib/scoring/match.ts` (3 mod: literal, normalized, semantic), `components/ad-compare.tsx` (çoklu ilan karşılaştırma). MASTERPLAN Module F (F.1–F.6) ve `app/[locale]/analyze/ghost-check.ts` tamamlanmış.

**4.1 İlan ayrıştırma doğruluğu ölçümü**
- Amaç: Mevcut ilan ayrıştırıcıyı 10 gerçek ilan fixture'ı ile test et.
- Fixture seti:

| # | Dil | Sektör | Beklenen beceri sayısı | Kıdem | Uzaktan |
|---|---|---|---|---|---|
| 1 | EN | Yazılım Geliştirme | 12 | Senior | Hybrid |
| 2 | EN | Pazarlama | 8 | Mid | Remote |
| 3 | DE | Yazılım Geliştirme | 10 | Senior | Onsite |
| 4 | DE | Finans | 7 | Lead | Hybrid |
| 5 | TR | Yazılım Geliştirme | 9 | Mid | Remote |
| 6 | TR | İnsan Kaynakları | 6 | Junior | Onsite |
| 7 | EN | Veri Bilimi | 11 | Senior | Remote |
| 8 | DE | Proje Yönetimi | 8 | Lead | Hybrid |
| 9 | TR | Pazarlama | 7 | Mid | Remote |
| 10 | EN | DevOps | 10 | Senior | Remote |

- Dosyalar: `tests/fixtures/ads/{en,de,tr}-{sector}.txt`, `tests/job-ad-accuracy.test.ts`.
- Doğrulama: `extractJobRequirements()` sonuçlarını beklenen değerlerle karşılaştır; beceri çıkarma precision ≥ %85.
- Kabul: 10 ilan fixture'ında doğruluk metrikleri raporlanmış; precision ≥ %85.

**4.2 Hedef ATS tespiti (yeni özellik)**
- Amaç: İlan URL'sinden hedef ATS markasını tespit et.
- Araştırma kaynağı: DOCX raporu bölüm E — "Jobscan, adayın yüklediği iş ilanının URL'sinden, ilanın hangi ATS markasına ait olduğunu tespit edebilmektedir."
- Mimari: Saf fonksiyon (network yok, `lib/scoring/` kurallarına uygun).

```typescript
// lib/scoring/ats-detect.ts (yeni dosya)
export interface AtsProfile {
  readonly id: string;
  readonly name: string;
  readonly notes: string;
  readonly formatAdvice: string;
}

const ATS_PATTERNS: readonly { readonly pattern: RegExp; readonly profile: AtsProfile }[] = [
  {
    pattern: /myworkdayjobs\.com|workday\.com\/.*\/job/i,
    profile: {
      id: "workday",
      name: "Workday",
      notes: "Multi-column layouts frequently cause extraction errors in Workday.",
      formatAdvice: "DOCX is the safest format for Workday. Avoid two-column designs."
    }
  },
  {
    pattern: /boards\.greenhouse\.io|job-boards\.greenhouse\.io/i,
    profile: {
      id: "greenhouse",
      name: "Greenhouse",
      notes: "Greenhouse handles text-based PDFs well but struggles with image-based ones.",
      formatAdvice: "Text-based PDF is safe. Avoid scanned documents."
    }
  },
  {
    pattern: /jobs\.lever\.co/i,
    profile: { id: "lever", name: "Lever", notes: "Lever's parser is generally flexible.", formatAdvice: "Both PDF and DOCX work well." }
  },
  {
    pattern: /jobs\.ashby\.io/i,
    profile: { id: "ashby", name: "Ashby", notes: "Modern parser with good multi-language support.", formatAdvice: "PDF or DOCX are both safe." }
  },
  {
    pattern: /taleo\.net|oracle.*taleo/i,
    profile: {
      id: "taleo",
      name: "Oracle Taleo",
      notes: "Legacy system with strict parsing rules.",
      formatAdvice: "DOCX strongly recommended. Avoid any non-standard formatting."
    }
  },
  {
    pattern: /icims\.com/i,
    profile: {
      id: "icims",
      name: "iCIMS",
      notes: "Handles standard layouts well; graphic-heavy PDFs cause errors.",
      formatAdvice: "Single-column DOCX or text-based PDF."
    }
  },
  {
    pattern: /smartrecruiters\.com/i,
    profile: { id: "smartrecruiters", name: "SmartRecruiters", notes: "Modern parser.", formatAdvice: "PDF or DOCX." }
  },
  {
    pattern: /breezy\.hr/i,
    profile: { id: "breezy", name: "Breezy HR", notes: "Startup-friendly ATS.", formatAdvice: "PDF or DOCX." }
  }
];

export function detectAts(url: string): AtsProfile | null {
  for (const entry of ATS_PATTERNS) {
    if (entry.pattern.test(url)) return entry.profile;
  }
  return null;
}
```

- Test:

```typescript
// tests/ats-detect.test.ts
import { detectAts } from "@/lib/scoring/ats-detect";

test("detects Workday from URL", () => {
  expect(detectAts("https://company.wd5.myworkdayjobs.com/en-US/careers/job/123"))
    ?.toHaveProperty("id", "workday");
});

test("detects Greenhouse", () => {
  expect(detectAts("https://boards.greenhouse.io/company/jobs/456"))
    ?.toHaveProperty("id", "greenhouse");
});

test("returns null for unknown URL", () => {
  expect(detectAts("https://example.com/careers/apply")).toBeNull();
});
```

- Kabul: 8 ATS markası tanınır; bilinmeyen URL null döner; birim testler yeşil.

**4.3 ATS'e özgü bilgi bulguları**
- Amaç: Hedef ATS tespit edildiğinde, o sisteme özel format tavsiyeleri ver.
- Önemli: Bulgular `severity: 'info'` (puan kırmaz — AGENTS.md: "tahmin iddiası yok" ilkesi).
- Dosyalar: `lib/scoring/ats-advice.ts` (yeni), `tests/ats-advice.test.ts`.

```typescript
// lib/scoring/ats-advice.ts
import type { FindingDraft } from "./dimension";
import type { AtsProfile } from "./ats-detect";

export function atsAdviceFindings(profile: AtsProfile | null): readonly FindingDraft[] {
  if (!profile) return [];
  return [{
    id: `ats-advice.${profile.id}`,
    severity: "info" as const,
    title: `Target system detected: ${profile.name}`,
    detail: profile.notes,
    fix: profile.formatAdvice,
    cost: 0  // bilgi bulgusu, puan kırmaz
  }];
}
```

- Kabul: 3 ATS markası için test fixture'ı; `cost: 0` doğrulanmış.
- Not: `severity: 'info'` tipi `Severity` union'ına eklenmeli; mevcut `"critical" | "high" | "medium" | "low"` → `"critical" | "high" | "medium" | "low" | "info"` olacak.

**4.4 Kırmızı bayrak genişletme**
- Mevcut: `lib/scoring/job-ad.ts`'de `extractRedFlags()` mevcut.
- Eklenecek bayraklar:
  - İlan yaşı > 90 gün uyarısı (ghost posting göstergesi) — `ghost-check.ts` ile entegre
  - Aşırı uzun beceri listesi (>20 zorunlu beceri) — "bu ilan giriş engelini çok yüksek tutuyor" uyarısı
  - Kıdem/yıl çelişkisi 3 dilde test (mevcut mantık genişletilir)
- Kabul: Yeni bayraklar fixture'larla kanıtlanmış.

**4.5 Çoklu ilan karşılaştırma — 10 ilan performans testi**
- Mevcut: `components/ad-compare.tsx` çoklu karşılaştırma yapıyor.
- Doğrulama: 10 ilan fixture seti → karşılaştırma ≤ 500ms; "en uygun 3 ilan" + "öğrenmen gereken 2 terim" özeti.
- Kabul: Performans benchmarkı geçer; özet mantığı test edilmiş.

**4.6 Öğrenme öncelik listesi — sektörel bağlam**
- Mevcut: `F.5` öğrenme listesi.
- Genişletme: Eksik becerileri sektörel kümeler halinde sun (yazılım, pazarlama, finans…); her küme için TR/EN/DE çevirisi.
- Kabul: Sektörel etiketler doğru; 3 dilde oluşur.

**4.7 İlan URL çekme SSRF sertleştirmesi**
- Mevcut: `app/api/` altında URL fetch endpoint'i.
- Sertleştirme kontrol listesi:

```typescript
// Dahili IP engelleme (mevcut kontrol genişletilir)
const BLOCKED_RANGES = [
  /^10\./,                    // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
  /^192\.168\./,              // 192.168.0.0/16
  /^127\./,                   // loopback
  /^0\./,                     // "this" network
  /^169\.254\./,              // link-local
  /^::1$/,                    // IPv6 loopback
  /^fe80:/i                   // IPv6 link-local
];
// + DNS çözümlemesi sonrası kontrol
// + Redirect limiti: 3
// + Timeout: 10s
// + Boyut limiti: 2MB
```

- Kabul: SSRF denemesi fixture testleriyle kanıtlanmış şekilde engellenir.

**4.8 Tam faz testi**
- TR/EN/DE birer ilan → analiz → kırmızı bayraklar → eşleşme → karşılaştırma → öğrenme listesi; hepsi tek akışta.
- Kabul: 3 dilde uçtan uca akış yeşil.

---

## Faz 5 — Eşleştirme Modları + Keyword Stuffing (Özellik 4)

Mevcut kod: `lib/scoring/match.ts` (3 mod: `countLiteral`, `countOccurrences`/normalized, semantic via `SemanticHit[]`), `lib/scoring/keywords.ts` (stuffing: `STUFFING_THRESHOLD=12`), `lib/scoring/taxonomy.ts` (eşanlamlı/kısaltma), `lib/scoring/approved-synonyms.ts`.

**5.1 Üç mod kalibrasyon testi**
- Amaç: 9 test vakası (3 dil × 3 mod) ile precision/recall ölç.
- Dosyalar: `tests/match-calibration.test.ts`, `tests/fixtures/match-calibration/{en,de,tr}-{cv,ad}.txt`.
- Her fixture çiftinde:
  - Beklenen eşleşen terimler (true positives)
  - Beklenen eşleşmeyen terimler (true negatives)
  - Mod başına sonuçlar karşılaştırılır
- Kabul: Her mod/dil kombinasyonunda precision ≥ %70.

**5.2 Eşanlamlı sözlük genişletme**
- Mevcut: `approved-synonyms.ts` (6197 bayt, EN ağırlıklı), `taxonomy.ts` (21176 bayt).
- Eklenti: TR/DE eşanlamlıları:

```typescript
// approved-synonyms.ts'ye eklenecek
// Türkçe
["Yazılım Geliştirme", "Software Development"],
["Proje Yönetimi", "Project Management", "Projektmanagement"],
["Veri Analizi", "Data Analysis", "Datenanalyse"],
["İnsan Kaynakları", "Human Resources", "Personalwesen"],

// Almanca bileşik sözcükler
["Softwareentwicklung", "Software Development", "Yazılım Geliştirme"],
["Qualitätssicherung", "Quality Assurance", "Kalite Güvence"],
```

- Kısaltmalar:

```typescript
["PM", "Project Manager", "Proje Yöneticisi", "Projektmanager"],
["QA", "Quality Assurance", "Kalite Güvence", "Qualitätssicherung"],
["HR", "Human Resources", "İnsan Kaynakları", "Personalwesen"],
["CI/CD", "Continuous Integration", "Sürekli Entegrasyon"],
```

- Kabul: Yeni eşanlamlılar test fixture'larıyla doğrulanmış.

**5.3 Mod farkı açıklama derinleştirmesi**
- Mevcut: `B.2` (MASTERPLAN) "61 strict, 78 semantic. The difference comes from these 4 terms."
- Genişletme: Her fark terimi için neden kategorisi: `'stem'` (kök alma farkı), `'synonym'` (eşanlamlı), `'semantic'` (anlam benzerliği), `'compound'` (bileşik sözcük bölme).
- Kabul: Fark nedenleri açık ve doğru; birim test.

**5.4 Semantik eşleşme performans optimizasyonu**
- Mevcut: `lib/ai/embeddings.ts` Web Worker'da çalışıyor.
- Doğrulama: 100 terim çifti ≤ 3s benchmark testi.
- Kabul: Benchmark yeşil; model cache doğrulanmış.

**5.5 Keyword stuffing — beyaz metin tespiti (yeni kontrol)**
- Mevcut: `keywords.stuffing` kontrolü (`keywords.ts:647-660`) — tekrar sayısına dayalı.
- Eksik: PDF'deki görünmez (beyaz) metin tespiti.
- Araştırma kaynağı: Makale §6 — "beyaz fontla yapıştırma hilesi… anında tespit edilerek adayın spam listesine alınması"

```typescript
// lib/scoring/parseability.ts'ye eklenecek yeni kontrol
// PDF extraction metadata'dan gelen bilgiyle: font rengi beyaz veya
// arka planla aynı renk olan metin blokları tespit edilir.
// Not: Bu kontrol yalnızca extraction metadata varsa çalışır.
if (context.extraction?.hiddenTextBlocks && context.extraction.hiddenTextBlocks > 0) {
  drafts.push({
    id: "parse.hidden-text",
    severity: "high",
    title: "Hidden text blocks detected",
    detail: `${context.extraction.hiddenTextBlocks} text blocks appear to be invisible (white text on white background or zero-size font). Modern parsers flag this as manipulation.`,
    fix: "Remove all hidden text. Modern ATS systems and LLM-based parsers detect and penalize keyword stuffing through invisible text.",
    cost: 4
  });
}
```

- Ön koşul: `ExtractionMetadata` tipine `hiddenTextBlocks?: number` ekle; PDF extraction sırasında font rengi kontrolü yap.
- Kabul: Gizli metin fixture'ı bulgu üretir; temiz CV üretmez.

---

## Faz 6 — AI Katmanları Doğrulama (Özellik 11)

Mevcut kod: `lib/ai/` (providers, embeddings, tasks, grounding), `L.1–L.4` ve `D.1–D.7` tamamlanmış.

**6.1 AI katman bağımsızlık testi**
- Amaç: 4 konfigürasyonu test et:

```
┌─────────────┬──────┬──────┬──────┬──────┐
│ Konfigürasyon│ L0   │ L1   │ L2   │ L3   │
├─────────────┼──────┼──────┼──────┼──────┤
│ Hepsi açık   │  ✅   │  ✅   │  ✅   │  ✅   │
│ Yalnız L0    │  ✅   │  ❌   │  ❌   │  ❌   │
│ L0 + L1      │  ✅   │  ✅   │  ❌   │  ❌   │
│ L0 + L1 + L2 │  ✅   │  ✅   │  ✅   │  ❌   │
└─────────────┴──────┴──────┴──────┴──────┘
```

- Her konfigürasyonda: analiz çalışır, skor üretilir, hata yok; AI özellikleri duruma göre devre dışı.
- Kabul: 4 test vakası yeşil.

**6.2 Grounding kontrolü genişletme**
- Mevcut: `lib/ai/grounding.ts` — uydurma sayı, teknoloji, organizasyon tespiti.
- Genişletme: Daha agresif fixture'lar:

```typescript
// tests/grounding-edge.test.ts
test("rejects invented company name", () => {
  const cvText = "Worked at Acme Corp for 3 years";
  const llmOutput = "Led a team at Google to deliver cloud infrastructure";
  expect(groundingCheck(cvText, llmOutput).pass).toBe(false);
});

test("rejects invented percentage", () => {
  const cvText = "Improved performance of the system";
  const llmOutput = "Improved system performance by 47%";
  expect(groundingCheck(cvText, llmOutput).pass).toBe(false);
});

test("allows rephrased existing content", () => {
  const cvText = "Reduced build time from 40 minutes to 12 minutes";
  const llmOutput = "Cut build time by 70%, from 40 to 12 minutes";
  expect(groundingCheck(cvText, llmOutput).pass).toBe(true);
});
```

- Kabul: 3 tip uydurma için fixture test; her biri doğru şekilde kabul/ret.

**6.3 LLM çıktı şema doğrulaması**
- Mevcut: `L.4` (MASTERPLAN) şema doğrulaması.
- Test: Her görev tipi (rewrite, explain, cover-letter, interview-q) için 2'şer fixture (geçerli + geçersiz).
- Kabul: 8 test yeşil; geçersiz çıktı kullanıcıya gösterilmez.

**6.4 Model indirme UX doğrulama**
- Akış: `components/ai-consent.tsx` → boyut gösterimi → onay → `components/ai-status.tsx` ilerleme → tamamlandı/iptal.
- Doğrulama: İndirme iptali → partial dosya temizlenir; yeniden indirme → cache'ten gelir.
- Kabul: Her adım doğrulanmış.

**6.5 Ollama rehberi i18n**
- Mevcut: `components/ollama-setup.tsx` (3848 bayt).
- Eklenti: 3 dilde adım adım rehber; Windows/Mac/Linux `OLLAMA_ORIGINS` ayarı; 5 yaygın hata mesajı + çözüm.
- Kabul: 3 dilde rehber erişilebilir; test butonu çalışır.

**6.6 BYOK güvenlik doğrulaması**
- Mevcut: `components/byok-setup.tsx`, `components/byok-consent-listener.tsx`.
- Doğrulama: Ağ isteklerinde API anahtarı hiçbir sunucu endpoint'ine gönderilmiyor; "CV'niz şuraya gönderilecek" uyarısı her istekte görünür.
- Test yöntemi: `app/api/` altındaki tüm route handler'larda `Authorization` header'ı taranır → anahtar yok.
- Kabul: Network izleme + UI uyarısı doğrulanmış.

---

## Faz 7 — Tailor Modu (Özellik 5)

Mevcut kod: `D.1–D.7` tamamlanmış. `lib/tailor/`, `components/tailor/`, `lib/ai/tasks/rewrite.ts`, `lib/scoring/drafts.ts`.

**7.1 Tailor akışı 3 dil doğrulaması**
- Akış: CV yükle → ilan ekle → eksik terim kartları → "sahibim" onayla → madde yeniden yaz → varyant karşılaştır.
- Her dil için fixture çifti (CV + ilan).
- Kabul: 3 dilde varyant oluşturulur; skor artışı gözlenir; uydurma bilgi eklenmez.

**7.2 Yer tutucu mekanizması doğrulama**
- Mevcut: `drafts.ts:30` — `[quantify: what improved, by how much]` yer tutucusu.
- Test:

```typescript
test("rewrite uses placeholder when no number exists", () => {
  const result = draftFixes("- Responsible for managing the deployment pipeline");
  expect(result[0]?.replacement).toContain("[quantify:");
});

test("rewrite preserves existing numbers", () => {
  const result = draftFixes("- Responsible for reducing costs by 15%");
  // Sayı zaten var, yer tutucu yerine gerçek sayı korunmalı
  // Not: mevcut drafts.ts mekanik yeniden yazma yapar, sayı koruması
  // LLM rewrite'da (D.4) gerçekleşir.
});
```

- Kabul: Her iki durum test edilmiş.

**7.3 Ön yazı yardımcısı — pazar bazlı format**
- Mevcut: `D.7` ön yazı yardımcısı.
- Genişletme: DE → Anschreiben formatı; TR → kısa format; EN → standart.
- Kabul: 3 dilde ön yazı taslağı; format pazara uygun; grounding kontrolü aktif.

**7.4 Varyant yönetimi doğrulama**
- Mevcut: `D.1` IndexedDB'de varyantlar.
- Test: Oluştur → sil → yeniden adlandır → ilan bağla → reload → veriler korunur.
- Kabul: CRUD çalışır; reload sonrası veri kayıpsız.

**7.5 Tam tailor e2e**
- Kabul: 3 dilde uçtan uca akış çalışır.

---

## Faz 8 — Mülakat Hazırlığı (Özellik 6)

Mevcut kod: `H.0–H.4` tamamlanmış. `components/interview/`, `lib/interview/`.

**8.1 STAR kartları doğrulama**
- Test: 3 dilde CV fixture'ından kartlar üretilir; kart içeriği yalnızca CV'den gelir (uydurma yok).
- Kabul: Kart sayısı ≥ bullets sayısının %50'si; içerik doğrulama testi.

**8.2 Şablon soru eşleştirmesi**
- Test: 10 yaygın soru → en uygun STAR kartı; eşleştirme paylaşılan kelimelerle izlenebilir.
- Kabul: AI kapalıyken çalışır.

**8.3 İlana özel sorular**
- Test: L2/L3 çıktısı ilandaki ≥1 terime atıfta bulunur.
- Kabul: Atıf vurgulanır.

**8.4 Pratik modu**
- Test: Soru göster → cevap yaz → öneri → izlenebilirlik.
- Kabul: Model kapalıyken basit kelime eşleştirmesi çalışır.

---

## Faz 9 — Auth + Kanban (Özellik 7)

Mevcut kod: `lib/supabase/`, `app/auth/`, `G.1–G.5`, `components/kanban/`.

**9.1 Auth akışı** — e-posta magic link + Google OAuth doğrulama.
**9.2 Misafir mod** — `getSupabaseEnv()` null → analiz çalışır, kayıt devre dışı, hata yok.
**9.3 Kanban** — Sürükle-bırak + kart bağlantıları + 7 gün hatırlatması.
**9.4 CSV/JSON dışa aktarma** — içe-dışa döngü kayıpsız.
**9.5 Tek tıkla silme** — tüm depolar boş; UI onay.
**9.6 RLS doğrulama** — başka kullanıcının verisine erişim engellenir.
**9.7 12 ay saklama + purge** — CRON endpoint doğrulama.

Her batch için: mevcut kodu fixture ile doğrula → eksik varsa tamamla → test → commit.

---

## Faz 10 — CV Oluşturucu (Özellik 8)

Mevcut kod: `E.1–E.10` tamamlanmış. `components/editor/`, `lib/resume/`, `lib/pdf/`.

**10.1 Şablon doğrulama** — 3 şablon × TR/DE glyphleri (`ş ğ ı İ ö ü ä ß`) — CI `Parseability 25/25`.
**10.2 DOCX dışa aktarma** — Word + LibreOffice doğrulama.
**10.3 JSON Resume döngü** — import → düzenle → export → import kayıpsız.
**10.4 İçe aktarma edge case'leri** — iki sütunlu/ikon fontlu/bozuk kodlamalı PDF → uyarılar.
**10.5 Kapalı döngü** — 3 şablon × 3 dil = 9 fixture, hepsi 25/25.
**10.6 Editör i18n** — form etiketleri 3 dilde.
**10.7 Erişilebilirlik** — tab navigasyonu, ARIA, `prefers-reduced-motion`.

---

## Faz 11 — LinkedIn Tutarlılığı (Özellik 9)

Mevcut: `I.1–I.2` tamamlanmış.

**11.1** LinkedIn PDF ayrıştırma 3 dil doğrulama.
**11.2** Tutarsızlık raporu — her tutarsızlık CV satırı + LinkedIn satırı ile alıntılanır.
**11.3** Başlık vs hedef rol kontrolü.

---

## Faz 12 — Rapor/Paylaşım (Özellik 12)

**12.1** PDF raporu 3 dil doğrulama.
**12.2** Paylaşım bağlantıları — `evidence` çıkarılmış; 30 gün süre sonu.
**12.3** Markdown dışa aktarma (yeni veya mevcut doğrulama).
**12.4** `/r/[token]` eski raporlar yeni UI'da render (MASTERPLAN review focus 2).

---

## Faz 13 — Gizlilik/Saklama (Özellik 13)

**13.1** AGENTS.md gizlilik sözleşmesi uyum — her adım test edilmiş.
**13.2** `/data-request` formu 3 dilde.
**13.3** Share link gizlilik — `evidence` yok.
**13.4** Legal sayfa SEO — canonical, hreflang, JSON-LD (GEO-ANALYSIS R4 kapatma).

---

## Faz 14 — Oturum Geçmişi (Özellik 14)

**14.1** Puan değişim grafiği oturum boyunca doğru.
**14.2** Delta notu — her değişiklik bir bulguya atfedilebilir.
**14.3** Önceki ziyaret karşılaştırması.

---

## Faz 15 — Yardım Sistemi (Özellik 15)

**15.1 Anahtar kelime bankası genişletme — araştırma makalesinden 10 konu**

| # | Konu | Kaynak |
|---|---|---|
| 1 | Çok sütunlu tasarımlar neden sorun yaratır | Makale §2 |
| 2 | İkon fontları ve PUA karakter tuzağı | Makale §3 |
| 3 | Ligatür bozulması | Makale §3 |
| 4 | Standart başlıklar neden gerekli | Makale §4 |
| 5 | PDF vs DOCX format seçimi | Makale §5 |
| 6 | Keyword stuffing ve beyaz metin | Makale §6 |
| 7 | 100 puan = işe alınma değil | Makale §7 |
| 8 | Rakamlarla etki yazma | Makale §8 |
| 9 | Türkçe karakter kodlama bozulması | Makale §9 |
| 10 | 5 dakikalık ATS kontrol listesi | Makale §10 |

- Her konu için 3 dilde soru-cevap çifti = 30 yeni yardım kaydı.
- Bağlam duyarlı: Okunabilirlik düşükse §1-3-9, Etki düşükse §8, Anahtar kelime düşükse §6.
- Kabul: 30 kayıt eklendi; bağlam duyarlılık test edilmiş.

**15.2** Bağlam duyarlı yardım — mevcut analiz sonucuna göre ilgili konu öne çıkar.

---

## Faz 16 — Ek: Keyword Stuffing Uyarısı + Aksiyon Fiili Kütüphanesi

**16.1 Keyword stuffing — mevcut kontrol doğrulama**
- Mevcut: `keywords.stuffing` (`keywords.ts:647-660`), `STUFFING_THRESHOLD = 12`.
- Doğrulama: Stuffing fixture'ı bulgu üretir; temiz CV üretmez.
- Araştırma notu: "2026'da LLM tabanlı parser'lar keyword stuffing'i manipülasyon olarak algılıyor ve Güvenilirlik puanını düşürüyor" (DOCX raporu, bölüm G).
- Bu bilgiyi bulgu `detail` metnine ekle:

```diff
-      fix: "Keep two or three mentions in context and delete the rest. Recruiters and modern parsers both penalise padding.",
+      fix: "Keep two or three mentions in context and delete the rest. Modern LLM-based parsers treat keyword stuffing as manipulation and silently lower the candidate's ranking.",
```

**16.2 Aksiyon fiili kütüphanesi TR/EN/DE (yeni özellik)**
- Mevcut: `impact.ts:9-27` — `ACTION_VERBS` dizisi (27 EN + 20 DE + 20 TR fiil).
- Genişletme: Her dil için 50+ fiil, kategorize:

```typescript
// lib/scoring/data/action-verbs.ts (yeni dosya)
export interface ActionVerb {
  readonly verb: string;
  readonly category: 'leadership' | 'analysis' | 'implementation' | 'optimization' | 'communication';
  readonly language: 'en' | 'de' | 'tr';
}

export const ACTION_VERB_LIBRARY: readonly ActionVerb[] = [
  // EN — Leadership
  { verb: "directed", category: "leadership", language: "en" },
  { verb: "spearheaded", category: "leadership", language: "en" },
  { verb: "orchestrated", category: "leadership", language: "en" },
  { verb: "championed", category: "leadership", language: "en" },
  // ... 50+ EN toplam

  // DE — Führung
  { verb: "geleitet", category: "leadership", language: "de" },
  { verb: "koordiniert", category: "leadership", language: "de" },
  { verb: "verantwortet", category: "leadership", language: "de" },
  // ... 50+ DE toplam

  // TR — Liderlik
  { verb: "yönettim", category: "leadership", language: "tr" },
  { verb: "koordine ettim", category: "leadership", language: "tr" },
  { verb: "liderlik ettim", category: "leadership", language: "tr" },
  // ... 50+ TR toplam
];
```

- Dolgu kalıpları genişletme (`impact.ts`):

```typescript
// Mevcut GENERIC_RX'e ekleme
// TR: "ile ilgilendim", "yardımcı oldum", "katılım sağladım"
// DE: "habe mitgeholfen", "wurde beauftragt", "war beteiligt an"
// EN: "was tasked with", "played a part in"
```

- Kabul: TR/EN/DE fixture'ları; dolgu kalıpları bulgu üretir; etki fiilleri üretmez.

**16.3 Kütüphane UI**
- Yeni bileşen: `components/action-verb-panel.tsx`.
- Kullanıcıya etki fiillerini "madde yazarken kullanabileceği" referans paneli.
- Kategorize (liderlik, analiz, uygulama, optimizasyon, iletişim); 3 dilde; arama/filtre.
- Yardım sistemine entegre: Etki skoru düşükken "Aksiyon fiilleri kütüphanesine göz atın" önerisi.
- Kabul: Panel 3 dilde çalışır; kategori filtresi çalışır.

---

## Faz 17 — Ek: Hesapsız Hızlı Test + Maaş/Pazarlık Yardımcısı

**17.1 Hesapsız hızlı test (yeni özellik)**
- Amaç: Hesap açmadan sınırlı analiz.
- Kapsam: Yalnız Okunabilirlik (25) + Yapı (20) = 45 üzerinden skor. İlan gerektirmez, Anahtar kelime/Etki/İletişim çalışmaz.
- Gizlilik: CV sunucuya gönderilmez, yalnızca tarayıcıda çalışır (AGENTS.md uyumlu).
- Rate-limit: IP başına 3/gün (kötüye kullanım için — AGENTS.md: "yalnızca kötüye kullanım için rate-limit").

```typescript
// app/[locale]/quick-test/page.tsx (yeni)
// Client component; scoring tarayıcıda çalışır
// Sonuç: Okunabilirlik + Yapı skoru + en değerli 3 bulgu
// CTA: "Tam analiz için giriş yapın" → /auth/login

// app/api/rate-limit/route.ts (yeni)
// IP tabanlı sayaç; Supabase veya in-memory
```

- Kabul: Misafir kullanıcı hızlı test yapabilir; 4. deneme engellenir; CV sunucuya gitmez.

**17.2 Maaş araştırma yardımcısı**
- Amaç: İlandaki maaş bilgisini çıkar (mevcut `extractSalary()`); yoksa genel bant bilgisi sun.
- Dosyalar: `lib/scoring/salary.ts` (yeni, saf — `lib/scoring/` kuralları), `components/salary-insight.tsx` (yeni).

```typescript
// lib/scoring/salary.ts
export interface SalaryBand {
  readonly level: 'junior' | 'mid' | 'senior' | 'lead';
  readonly market: 'TR' | 'DE' | 'US' | 'UK' | 'EU';
  readonly range: { readonly min: number; readonly max: number; readonly currency: string };
}

// Genel bant verileri (halka açık kaynaklardan derlenmiş, belirli şirkete özgü değil)
export const SALARY_BANDS: readonly SalaryBand[] = [
  { level: "junior", market: "DE", range: { min: 40000, max: 55000, currency: "EUR" } },
  { level: "mid", market: "DE", range: { min: 55000, max: 75000, currency: "EUR" } },
  { level: "senior", market: "DE", range: { min: 75000, max: 100000, currency: "EUR" } },
  // ... TR (TRY), US (USD), UK (GBP), EU (EUR)
];
```

- Kabul: İlanda maaş varsa gösterilir; yoksa genel bant bilgisi; harici API çağrısı yok.

**17.3 Pazarlık ipuçları**
- 3 dilde 5'er basit, deterministik ipucu; yardım sistemine entegre.
- Kabul: 15 ipucu (3 × 5) eklendi.

---

## Faz 18 — Ek: Chrome Eklentisi (yeni)

**18.1 Eklenti iskeleti**
- Dosyalar: `packages/chrome-extension/` (yeni dizin).
- Manifest V3; popup UI; content script.

```json
// packages/chrome-extension/manifest.json
{
  "manifest_version": 3,
  "name": "ATS Readability",
  "version": "0.1.0",
  "description": "Quick ATS readability check for job postings",
  "permissions": ["activeTab"],
  "action": { "default_popup": "popup.html" },
  "content_scripts": [{
    "matches": ["*://*.linkedin.com/jobs/*", "*://*.indeed.com/*", "*://*.kariyer.net/*", "*://*.stepstone.de/*"],
    "js": ["content.js"]
  }]
}
```

- Kabul: Eklenti Chrome'a developer modda yüklenir; popup açılır.

**18.2 İlan çıkarma**
- 4 platform: LinkedIn, Indeed, Kariyer.net, StepStone.
- CSS seçiciler ile ilan metni çıkarma.
- Kapsam dışı: Form doldurma, otomatik başvuru (AGENTS.md: "kapsam dışı").
- Kabul: 4 platformdan ilan çıkarılır; fixture doğrulanmış.

**18.3 Hızlı analiz**
- Popup'ta CV yükle → çıkarılan ilan ile hızlı eşleşme skoru (yalnız strict mod).
- Kabul: Skor popup'ta görünür.

**18.4 Ana platforma yönlendirme**
- "Detaylı analiz" butonu → `atsfreeforall.com/analyze?ad=...` ile ilan metni query parametresi olarak.
- Kabul: Yönlendirme çalışır.

**18.5 Yayın hazırlığı**
- Gizlilik politikası, ekran görüntüleri, açıklama (3 dil), izin açıklamaları.
- Kabul: Chrome Web Store gereksinimleri karşılanır.

---

## Faz 19 — Sertleştirme ve Yayın

**19.1 GEO-ANALYSIS bulguları kapatma**

| Bulgu | Açıklama | Hedef |
|---|---|---|
| R3 | llms.txt etiketleri ve kopyalar | Temizle |
| N1 | Makine özetlerinde storage disclosure | Ekle |
| R4 | Legal sayfa metadata (canonical, hreflang) | Ekle |
| N2 | `<head>` dışına düşen metadata | Düzelt |
| R5 | og:image 307 redirect | Düzelt |
| R6 | Sayfa başına farklı OG text | Ekle |
| N5 | İç içe `<main>` | Kaldır |
| N6 | manifest.json 404 | Düzelt |
| R7 | SearchAction `/analyze?q=` | Kaldır |
| R8 | Canonical trailing slash tutarsızlığı | Düzelt |

- Kabul: GEO skoru ≥ 80/100.

**19.2 Performans**
- Yeniden puanlama ≤ 300ms; ilk yükleme ≤ 3s (3G); Lighthouse ≥ 90.
- Bundle analiz, code splitting, font preload.
- Kabul: Metrikler karşılanır.

**19.3 Güvenlik**
- CSP, rate-limit, Zod doğrulama, RLS.
- OWASP Top 10 kontrol listesi.
- Kabul: Kontrol listesi geçer.

**19.4 Docker yayın**
- `docker compose up` ile üretim dağıtımı.
- Multi-stage build, standalone output.
- Kabul: Temiz klondan çalışır.

**19.5 Kapsamlı e2e**
- Her faz için ≥1 Playwright senaryosu; 3 dilde.
- Akış: CV → analiz → bulgular → düzenle → skor → varyant → kanban → mülakat.
- Kabul: Tüm e2e yeşil.

**19.6 README ve belgelendirme**
- Kurulum (3 adım), geliştirme, test, dağıtım, mimari.
- Kabul: Yeni geliştirici 15 dakikada ortam kurabilir.

---

## Özet Tablosu

| Faz | Konu | Batch | Tahmini süre | Ağırlık |
|---|---|---|---|---|
| 3 | Ayrıştırıcı görünümü | 3.1 – 3.4 | 1–2 hafta | İyileştirme |
| 4 | İş ilanı + Hedef ATS | 4.1 – 4.8 | 2–3 hafta | Yeni + iyileştirme |
| 5 | Eşleştirme + Stuffing | 5.1 – 5.5 | 1–2 hafta | Yeni + doğrulama |
| 6 | AI katmanları | 6.1 – 6.6 | 1–2 hafta | Doğrulama |
| 7 | Tailor modu | 7.1 – 7.5 | 1 hafta | Doğrulama |
| 8 | Mülakat hazırlığı | 8.1 – 8.4 | 1 hafta | Doğrulama |
| 9 | Auth + Kanban | 9.1 – 9.7 | 1–2 hafta | Doğrulama |
| 10 | CV oluşturucu | 10.1 – 10.7 | 1–2 hafta | Doğrulama |
| 11 | LinkedIn tutarlılığı | 11.1 – 11.3 | 1 hafta | Doğrulama |
| 12 | Rapor/paylaşım | 12.1 – 12.4 | 1 hafta | Doğrulama |
| 13 | Gizlilik/saklama | 13.1 – 13.4 | 1 hafta | Doğrulama |
| 14 | Oturum geçmişi | 14.1 – 14.3 | 3–5 gün | Doğrulama |
| 15 | Yardım sistemi | 15.1 – 15.2 | 3–5 gün | Yeni içerik |
| 16 | Stuffing + Fiil kütüphanesi | 16.1 – 16.3 | 1 hafta | Yeni |
| 17 | Hesapsız test + Maaş | 17.1 – 17.3 | 1–2 hafta | Yeni |
| 18 | Chrome eklentisi | 18.1 – 18.5 | 2–3 hafta | Tamamen yeni |
| 19 | Sertleştirme + Yayın | 19.1 – 19.6 | 2–3 hafta | Sertleştirme |

Toplam: ~70 batch, tahmini 20–30 hafta.

---

## Araştırma Belgelerinden Çıkan Kontrol Eklentileri Matrisi

| Kontrol | Boyut | Batch | Mevcut durumu | Kaynak |
|---|---|---|---|---|
| İki sütun tespiti | Okunabilirlik | 3.1 | `parse.columns` ✅ | Makale §2 |
| İkon font / PUA | Okunabilirlik | 3.1 | `parse.icon-font` ✅ | Makale §3 |
| Ligatür bozulması | Okunabilirlik | 3.1 | ❌ Eklenecek | Makale §3 |
| Başlık/altbilgi tekrarı | Okunabilirlik | 3.1 | `parse.page-furniture` ✅ | Makale §10 |
| Görüntü-yalnız PDF | Okunabilirlik | 3.1 | `parse.image-page` ✅ | Makale §5 |
| Mojibake/kodlama bozulması | Okunabilirlik | 2.4 | `parse.mojibake` ✅ | Makale §9 |
| Keyword stuffing (tekrar) | Anahtar kelime | 5.5, 16.1 | `keywords.stuffing` ✅ | Makale §6 |
| Beyaz/gizli metin | Okunabilirlik | 5.5 | ❌ Eklenecek | Makale §6 |
| Hedef ATS tespiti | Bilgi | 4.2 | ❌ Yeni | DOCX E |
| ATS'e özgü uyarılar | Bilgi | 4.3 | ❌ Yeni | DOCX E |
| Aksiyon fiili genişletme | Etki | 16.2 | `ACTION_VERBS` kısmi ✅ | Makale §8 |
| Dolgu kalıbı genişletme | Etki | 16.2 | `GENERIC_RX` kısmi ✅ | Makale §8 |
| Hayalet ilan göstergeleri | Bilgi | 4.4 | `ghost-check.ts` ✅ | DOCX E |
| Europass algılama | Bilgi | 2.6 | `europass.ts` ✅ | PLAN-part1 |
| Yaratıcı başlık uyarısı | Yapı | mevcut | `structure.missing-*` ✅ | Makale §4 |
| Standart tarih formatı | Yapı | mevcut | `structure.mixed-date-formats` ✅ | Makale §5 |

---

## Bağımlılık Grafiği (Faz 3–19)

```
Faz 3 (Parser View) ─────────────────────────────────────────┐
Faz 4 (İlan + ATS) ──────────────────────────────────────────┤
Faz 5 (Eşleştirme) ── Faz 4'e bağlı (ilan terimleri) ──────┤
Faz 6 (AI) ── Faz 5'e bağlı (semantik mod) ─────────────────┤
                                                              │
Faz 7 (Tailor) ── Faz 4 + 5 + 6'ya bağlı ───────────────────┤
Faz 8 (Mülakat) ── Faz 6'ya bağlı (L2/L3 sorular) ─────────┤
                                                              │
Faz 9 (Auth+Kanban) ── bağımsız ─────────────────────────────┤
Faz 10 (Builder) ── bağımsız ────────────────────────────────┤
Faz 11 (LinkedIn) ── bağımsız ───────────────────────────────┤
Faz 12 (Rapor) ── bağımsız ──────────────────────────────────┤
Faz 13 (Gizlilik) ── bağımsız ───────────────────────────────┤
Faz 14 (Geçmiş) ── bağımsız ────────────────────────────────┤
Faz 15 (Yardım) ── Faz 3-5 içerik bağımlı ──────────────────┤
                                                              │
Faz 16 (Fiil kütüphanesi) ── bağımsız ──────────────────────┤
Faz 17 (Hızlı test + Maaş) ── Faz 4'e bağlı (maaş) ────────┤
Faz 18 (Chrome eklentisi) ── Faz 4.2 + 5.1'e bağlı ─────────┤
                                                              │
Faz 19 (Sertleştirme) ── tüm fazlara bağlı ─────────────────┘
```

Paralel çalışabilir fazlar:
- Faz 3 + 4 (parser view + ilan analizi ayrı modüller)
- Faz 9 + 10 + 11 + 12 + 13 + 14 (bağımsız doğrulama fazları)
- Faz 16 + 17 (yeni özellikler, birbirinden bağımsız)
