# ATS Free For All — Ürün Yol Haritası

**Sürüm:** 1.0 (Ekim 2026)
**Kapsam:** atsfreeforall.com için aday tarafı yeni özellikler
**İlişkili doküman:** [`ATS_Free_For_All_TECHNICAL_PLAN.md`](./ATS_Free_For_All_TECHNICAL_PLAN.md)

> Bu doküman, sitenin bugünkü halini (tarayıcıda çalışan, deterministik, 5 boyutlu skor) temel alır ve onu bir "ATS kontrol aracı"ndan adayın tüm iş arama döngüsünü yürütebileceği bir **Aday Kokpiti**'ne dönüştürmeyi planlar.

---

## İçindekiler

1. [Mevcut Durum](#1-mevcut-durum)
2. [Vizyon](#2-vizyon)
3. [Değişmez İlkeler](#3-değişmez-i̇lkeler)
4. [Yapay Zekâ Mimarisi: Dört Katman](#4-yapay-zekâ-mimarisi-dört-katman)
5. [Modüller](#5-modüller)
6. [Fazlar ve Teslimatlar](#6-fazlar-ve-teslimatlar)
7. [Başarı Metrikleri](#7-başarı-metrikleri)
8. [Riskler](#8-riskler)
9. [Teknik Plan ile Uyumlaştırma](#9-teknik-plan-ile-uyumlaştırma)
10. [İlham Alınan Açık Kaynak Projeler](#10-i̇lham-alınan-açık-kaynak-projeler)

---

## 1. Mevcut Durum

### Bugün sitede olanlar

- CV tarayıcıda okunur ve puanlanır, dosya sunucuya yüklenmez.
- ATS'nin çıkardığı metin kullanıcıya gösterilir.
- 100 puanlık deterministik skor, 5 boyut:

| Boyut | Puan | Ölçtüğü şey |
|---|---|---|
| Parseability | 25 | Metin katmanının çıkarılabilirliği: sütunlar, tablolar, ikon fontları, bozuk kodlama |
| Keyword match | 25 | İlandan çıkarılan terimlerin kapsanması, ilandaki merkeziliğe göre ağırlıklı |
| Impact | 20 | Ölçülebilir sonuçlar ve sahiplik fiilleri |
| Structure | 20 | Eşlenebilir başlıklar, ters kronolojik tarihli girdiler, madde işaretleri |
| Contact | 10 | İsim, e-posta, telefon, lokasyon, profil linki |

- Her boyut tam puanla başlar, yalnızca adı konmuş bir bulgu nedeniyle puan kaybeder.
- Düzeltmeler kazandıracakları puana göre sıralanır.
- Hesap yalnızca paylaşım linklerini saklar.

### Tespit edilen sorunlar

| # | Sorun | Etki | Öncelik |
|---|---|---|---|
| S1 | Ana sayfadaki "Analyze a CV" `/login`'e yönlendiriyor | "Free for all" vaadiyle çelişiyor, huninin en başında kullanıcı kaybı | **Kritik** |
| S2 | Teknik plan sunucu tarafı mimari (FastAPI + Ollama + gpt-oss-20b) ve 9 bileşenli skor öneriyor; canlı ürün tarayıcı tabanlı ve 5 bileşenli | Ekip içinde yön karmaşası; sunucu tarafı CV işleme "nothing is uploaded" vaadini bozar | Yüksek |
| S3 | Arayüz yalnızca İngilizce | Türkçe ve Almanca konuşan hedef kitle için engel | Orta |

---

## 2. Vizyon

Adayın iş arama döngüsünün tamamını tek yerde, verisi tarayıcısından çıkmadan yürütmek:

```
 CV oluştur ──► ATS'de test et ──► İlana göre uyarla ──► Başvur ve takip et ──► Mülakata hazırlan
     ▲                                                                                │
     └────────────────────────────── geri bildirim ◄─────────────────────────────────┘
```

### Konumlandırma

| Araç | Güçlü yanı | Eksik yanı |
|---|---|---|
| Reactive Resume | Kapsamlı CV oluşturucu | Ayrıştırma testi yok |
| OpenResume | Tarayıcı içi parser | İlana göre uyarlama yok |
| Resume-Matcher | Eşleştirme ve uyarlama | Docker/teknik kurulum gerekiyor |
| career-ops | Uçtan uca ajan akışı | Terminal ve kodlama CLI'ı gerekiyor |
| **ATS Free For All** | **Deterministik, açıklanabilir, tarayıcıda, kurulum yok** | Henüz döngünün yalnızca bir adımı |

Hedef: deterministik motoru merkeze alıp döngünün tüm adımlarını, kurulum gerektirmeden ve gizliliği bozmadan kapatmak.

---

## 3. Değişmez İlkeler

Her yeni özellik bu ilkelere göre değerlendirilir. Bir özellik bunlardan birini ihlal ediyorsa ya yeniden tasarlanır ya da yapılmaz.

1. **Skoru yalnızca deterministik motor üretir.** Yapay zekâ skoru açıklar, değiştirmez.
2. **CV varsayılan olarak tarayıcıdan çıkmaz.** Veriyi dışarı gönderen her özellik isteğe bağlıdır ve nereye gittiği açıkça yazılır.
3. **Uydurma yok.** Araç, adayda olmayan bir beceriyi, deneyimi veya sayıyı CV'ye eklemez. "AWS öğrenmeniz gerekebilir" denebilir; "AWS deneyiminizi ekledim" denemez.
4. **Her puan kaybı açıklanabilir.** Her bulgu kaynak satırı ve önerilen düzeltmeyi taşır.
5. **Satıcı adı ile skor verilmez.** Kontroller yaygın parser davranışlarına dayanan sezgisel yöntemlerdir; "Workday skoru" gibi bir iddia yapılmaz.
6. **Temel ürün yapay zekâsız tam çalışır.** Yapay zekâ katmanları üstüne eklenen kolaylıklardır.
7. **Her analiz yeniden üretilebilir.** Motor, skor yapılandırması ve taksonomi sürümlenir.

---

## 4. Yapay Zekâ Mimarisi: Dört Katman

```
┌───────────────────────────────────────────────────────────────┐
│ Katman 3 — BYOK (kullanıcının kendi API anahtarı)              │  CV seçilen sağlayıcıya gider
├───────────────────────────────────────────────────────────────┤
│ Katman 2 — Kullanıcının yerel Ollama'sı (localhost)            │  CV kullanıcının makinesinde kalır
├───────────────────────────────────────────────────────────────┤
│ Katman 1 — Tarayıcı içi model (embedding)                      │  CV tarayıcıda kalır
├───────────────────────────────────────────────────────────────┤
│ Katman 0 — Deterministik motor (mevcut)                        │  CV tarayıcıda kalır
└───────────────────────────────────────────────────────────────┘
```

| Katman | Çalışan işler | Gizlilik | Maliyet |
|---|---|---|---|
| 0 | Parse, skor, anahtar kelime, format kontrolleri | Tarayıcıda | Sıfır |
| 1 | Çok dilli embedding ile anlamsal eşleştirme (transformers.js + küçük çok dilli model, örn. multilingual-e5-small) | Tarayıcıda | Sıfır; ilk kullanımda model indirilir ve önbelleğe alınır |
| 2 | Madde yeniden yazma, açıklama, ön yazı, mülakat soruları | Kullanıcının makinesinde | Sıfır (kullanıcının donanımı) |
| 3 | Katman 2 ile aynı işler, daha güçlü modellerle | Kullanıcının seçtiği sağlayıcıya gider | Kullanıcı öder |

### Uygulama notları

- Teknik plandaki `LLMProvider` soyutlaması TypeScript'e taşınır ve tarayıcıda yaşar:

```ts
interface LLMProvider {
  id: "ollama" | "byok-anthropic" | "byok-openai-compatible";
  health(): Promise<boolean>;
  chat(messages: Message[], options?: ChatOptions): Promise<string>;
  structured<T>(schema: JSONSchema, input: string): Promise<T>; // çıktı şemaya göre doğrulanır
}
```

- **Katman 2 kurulumu:** Tarayıcının `http://localhost:11434`'e erişebilmesi için kullanıcının Ollama'da `OLLAMA_ORIGINS` değişkenine site adresini eklemesi gerekir. Tek sayfalık, ekran görüntülü bir kurulum rehberi ve "Bağlantıyı test et" düğmesi sağlanır.
- **Katman 3:** API anahtarı yalnızca tarayıcıda tutulur, sunucuya asla gönderilmez. Arayüzde "CV'niz şu sağlayıcıya gönderilecek: …" uyarısı her istekte görünür olmalıdır.
- **Model önerisi:** Katman 2 için orta sınıf bilgisayarlarda çalışabilen 7–8B civarı çok dilli modeller varsayılan önerilir; daha güçlü donanımda gpt-oss-20b gibi büyük modeller seçilebilir.
- Tüm LLM çıktıları JSON şemasıyla doğrulanır; şemaya uymayan çıktı kullanıcıya gösterilmez.

---

## 5. Modüller

Her modül için: amaç, kapsam, kabul kriterleri ve gereken yapay zekâ katmanı.

---

### Modül A — Ayrıştırma Görünümü 2.0

**İlham:** OpenResume parser
**Katman:** 0
**Amaç:** Adayın en çok sorduğu "ATS benim unvanımı, tarihlerimi doğru okudu mu?" sorusunu doğrudan yanıtlamak.

**Kapsam**
- Ham metin görünümünün yanına alan tablosu: isim, e-posta, telefon, lokasyon, linkler, her deneyim için unvan / şirket / tarih aralığı, eğitim, beceriler, diller.
- Her alan için durum: ✅ bulundu, ⚠️ şüpheli, ❌ bulunamadı.
- Bir alana tıklayınca ham metindeki kaynak satır vurgulanır.
- "Şüpheli" durumları için sebep: örn. "Tarih aralığı iki sütuna bölünmüş görünüyor".

**Kabul kriterleri**
- [ ] Test setindeki CV'lerde alan çıkarma sonuçları tabloya yansıyor
- [ ] Her ❌ ve ⚠️ alanı için okunabilir bir sebep gösteriliyor
- [ ] Alan ↔ kaynak satır vurgulaması masaüstü ve mobilde çalışıyor

---

### Modül B — ATS Profilleri (Simülasyon Modları)

**İlham:** ats-screener
**Katman:** 0 + 1
**Amaç:** Gerçek ATS'lerin farklı davrandığını adaya somut olarak göstermek.

**Kapsam**
- Aynı motor üç eşleştirme moduyla çalışır:
  - **Katı:** yalnızca birebir terim eşleşmesi
  - **Normalize:** eş anlamlılar, kısaltmalar, beceri taksonomisi ("JS" ↔ "JavaScript")
  - **Anlamsal:** Katman 1 embedding'leri ile kavramsal eşleşme
- Mod karşılaştırma özeti: "Katı modda 61, anlamsal modda 78. Fark şu 4 terimden geliyor: …"
- Profil kartlarında satıcı adı kullanılmaz; açıklama metni "bazı sistemler birebir eşleşme arar" düzeyinde kalır.

**Kabul kriterleri**
- [ ] Üç mod aynı CV + ilan için tutarlı biçimde farklı ve açıklanabilir sonuçlar veriyor
- [ ] Anlamsal mod tamamen tarayıcıda çalışıyor
- [ ] Anlamsal eşleşmeler "kesin beceri" olarak değil, "olası karşılık" olarak etiketleniyor

---

### Modül C — Düzeltme Modu

**Katman:** 0
**Amaç:** Puan değerine göre sıralanmış önerileri etkileşimli bir çalışma alanına dönüştürmek.

**Kapsam**
- Aday metni doğrudan düzenler veya bir öneriyi kabul eder; skor anında yeniden hesaplanır.
- Her değişiklik için önce/sonra farkı: "+4 puan · Keyword match".
- Oturum boyunca skor geçmişi grafiği.
- Düzenlenmiş metin, Modül E'deki oluşturucuya aktarılabilir.

**Kabul kriterleri**
- [ ] Yeniden hesaplama orta sınıf bir dizüstü bilgisayarda 300 ms altında
- [ ] Her puan değişikliği hangi bulgunun kapandığını gösteriyor

---

### Modül D — İlana Göre Uyarlama Atölyesi

**İlham:** Resume-Matcher, career-ops
**Katman:** 0 (temel), 2/3 (yeniden yazma)
**Amaç:** Her ilan için CV'nin dürüst, hedefli bir varyantını üretmek.

**Kapsam**
- CV **varyantları:** her varyant bir ilana bağlanır, ana CV'den türetilir.
- **Eksik terim kartları:**
  - Terimin ilanda nerede geçtiği ve ilan için ne kadar merkezi olduğu
  - CV'de önerilen yer (beceriler bölümü / ilgili deneyim maddesi)
  - **"Bu beceri bende var" onayı.** Onay olmadan hiçbir terim CV'ye eklenmez.
- **Madde yeniden yazma (Katman 2/3):**
  - Yalnızca mevcut maddeyi yeniden ifade eder
  - Sayı uydurmaz; ölçülebilir sonuç eksikse `[X%]`, `[N kişi]` gibi doldurulacak yer tutucular bırakır
  - Değişiklikler diff görünümünde, madde madde kabul/ret ile sunulur
- Varyant karşılaştırma: ana CV skoru ↔ uyarlanmış varyant skoru.

**Kabul kriterleri**
- [ ] Onaylanmamış hiçbir beceri CV'ye eklenemiyor (otomatik test ile doğrulanır)
- [ ] Yeniden yazma çıktısı, girdide olmayan sayı veya kurum adı içerdiğinde reddediliyor
- [ ] Varyantlar tarayıcıda (IndexedDB) saklanıyor

---

### Modül E — ATS Güvenli CV Oluşturucu (Kendi Kendini Doğrulayan)

**İlham:** Reactive Resume, RenderCV, Jake's Resume, JSON Resume
**Katman:** 0
**Amaç:** En güçlü farklılaştırıcı. Oluşturduğu her CV'nin ATS tarafından okunabildiğini garanti eden tek açık araç olmak.

**Kapsam**
- **Veri modeli:** JSON Resume şeması kanonik model olarak kullanılır (teknik plandaki `ResumeDocument` ile eşlenir). İçe ve dışa aktarma ekosistemiyle uyumluluk sağlar.
- **Şablonlar:** 3–4 tek sütunlu, standart başlıklı şablon (yoğun / sade / modern).
- **Çıktılar:** İstemci tarafında PDF üretimi ve DOCX.
- **Kapalı döngü doğrulama:** Dışa aktarılan her PDF otomatik olarak kendi parser'ımızdan geçirilir:
  > ✅ "Bu PDF'ten tüm alanlar doğru çıkarıldı. Parseability: 25/25"
- **İçe aktarma:** Mevcut PDF/DOCX CV parse edilip editöre doldurulur; çıkarılamayan alanlar işaretlenir ve aday elle tamamlar.
- JSON Resume dosyası olarak dışa/içe aktarma.

**Kabul kriterleri**
- [ ] Tüm şablonlar kapalı döngü testinde Parseability tam puan alıyor (CI'da regresyon testi)
- [ ] Türkçe ve Almanca karakterler PDF çıktısında bozulmadan çıkarılabiliyor
- [ ] DOCX çıktısı Word ve LibreOffice'te doğru açılıyor

---

### Modül F — İlan Analizörü

**İlham:** career-ops değerlendirme raporu
**Katman:** 0 (temel), 1 (benzerlik), 2/3 (özet)
**Amaç:** Adaya başvurmadan önce ilanı anlamayı ve önceliklendirmeyi sağlamak.

**Kapsam**
- İlan metni şu alanlara ayrıştırılır: zorunlu beceriler, tercih edilen beceriler, kıdem, dil şartları, lokasyon/uzaktan çalışma, maaş bilgisi (varsa).
- **Kırmızı bayraklar:** aşırı uzun beceri listesi, kıdemle çelişen yıl şartı, belirsiz rol tanımı vb.
- **Deterministik uygunluk kontrol listesi.**
- **Çoklu ilan karşılaştırma:**
  - Aday 5–10 ilan ekler, hangisine en uygun olduğunu görür
  - Hedef rolde en sık geçen eksik beceriler → **öğrenme önceliği listesi**
- *(Sonraki faz)* Hayalet ilan kontrolü: Greenhouse / Lever / Ashby'nin herkese açık iş panosu API'leri üzerinden ilanın hâlâ yayında olup olmadığı. Sunucu tarafı proxy gerektirir; CV içermediği için gizlilik ilkesini bozmaz.

**Kabul kriterleri**
- [ ] Zorunlu / tercih edilen ayrımı test ilan setinde makul doğrulukla çalışıyor
- [ ] Çoklu karşılaştırma 10 ilana kadar tarayıcıda çalışıyor

---

### Modül G — Başvuru Takipçisi

**İlham:** JobSync
**Katman:** 0
**Amaç:** Adayın geri dönme sebebi; döngüyü kapatan modül.

**Kapsam**
- Kanban: Kaydedildi → Başvuruldu → Mülakat → Teklif / Ret
- Her kart bağlar: ilan, kullanılan CV varyantı, başvuru anındaki skor, notlar, kişiler.
- Takip hatırlatıcıları (örn. "7 gündür yanıt yok").
- CSV / JSON dışa aktarma.
- **Depolama:** varsayılan olarak tarayıcıda (IndexedDB).
- **İsteğe bağlı senkronizasyon:** hesap açan kullanıcılar için uçtan uca şifreli; anahtar kullanıcının parolasından türetilir, sunucu veriyi okuyamaz.

**Kabul kriterleri**
- [ ] Hesap olmadan tam çalışıyor
- [ ] Şifreli senkronizasyonda sunucuda yalnızca şifreli blob saklanıyor (güvenlik incelemesi ile doğrulanır)
- [ ] Veri silme tek tıkla, hem yerelde hem sunucuda

---

### Modül H — Mülakat Hazırlığı

**Katman:** 0 (hikâye bankası, şablon sorular), 2/3 (ilana özel sorular)
**Amaç:** Başvurudan sonraki adıma hazırlık.

**Kapsam**
- İlandan muhtemel teknik ve davranışsal sorular (Katman 2/3).
- **STAR hikâye bankası:** CV'deki başarı maddelerinden Durum / Görev / Eylem / Sonuç kartları; kartlar sorulara eşlenir.
- Yapay zekâsız sürüm: yaygın soru şablonları + hikâye bankası formu.
- Pratik modu: soru gösterilir, aday cevabını yazar, hikâye bankasındaki ilgili kart önerilir.

**Kabul kriterleri**
- [ ] Hikâye bankası yapay zekâ olmadan kullanılabiliyor
- [ ] Üretilen sorular ilandaki terimlere referans veriyor

---

### Modül I — LinkedIn Tutarlılık Kontrolü

**Katman:** 0
**Amaç:** CV ile LinkedIn profili arasındaki tutarsızlıkları yakalamak, scraping yapmadan.

**Kapsam**
- Aday LinkedIn'in kendi "PDF olarak kaydet" çıktısını yükler.
- Karşılaştırma: tarih uyuşmazlıkları, farklı unvanlar, CV'de olup profilde olmayan beceriler, başlık (headline) ile hedef rol uyumu.
- **Scraping yapılmaz**; LinkedIn kullanım şartları riski taşınmaz.

**Kabul kriterleri**
- [ ] LinkedIn PDF çıktısı doğru ayrıştırılıyor
- [ ] Tutarsızlıklar madde madde ve kaynaklarıyla listeleniyor

---

### Modül J — Türkiye / DACH Yerelleştirmesi

**Katman:** 0
**Amaç:** Açık kaynak alanında karşılanmamış gerçek bir boşluğu doldurmak.

**Kapsam**
- **Dil işleme**
  - Türkçe: eklemeli yapı için kök bulma ("testlerini", "testler" → "test"); ı/i, İ/I büyük-küçük harf dönüşümünün yerel kurala göre yapılması
  - Almanca: bileşik kelime ayrıştırma ("Softwareentwicklung" → "Software" + "Entwicklung")
  - Dile göre stop-word listeleri
- **Karakter kodlaması kontrolü:** PDF'te ı, İ, ş, ğ, ç, ö, ü ve ä, ö, ü, ß karakterlerinin çıkarmada bozulup bozulmadığı ayrı bir Parseability bulgusu olarak raporlanır.
- **Tarih formatları:** "Oca 2022", "Ocak 2022", "01.2022", "Jan. 2022", "März 2022", "heute", "halen", "devam ediyor".
- **Pazar bazlı uyarılar:** Hedef pazar seçimine göre fotoğraf, doğum tarihi, medeni hal, askerlik durumu gibi alanlar için öneri (örn. ABD/İngiltere: kaldırılması önerilir; Almanya: isteğe bağlı).
- **Europass algılama** ve Europass düzenine özel uyarılar.
- **Arayüz dilleri:** Türkçe, Almanca, İngilizce.

**Kabul kriterleri**
- [ ] Türkçe ve Almanca test setinde anahtar kelime eşleşme oranı İngilizce ile karşılaştırılabilir düzeyde
- [ ] Bozuk Türkçe karakter içeren test PDF'leri doğru tespit ediliyor
- [ ] Tüm arayüz metinleri üç dilde

---

## 6. Fazlar ve Teslimatlar

| Faz | Tahmini süre | Teslimatlar | Gerekçe |
|---|---|---|---|
| **0 — Hızlı kazanımlar** | 1–2 hafta | S1 düzeltmesi (girişsiz analiz), Türkçe arayüz, önce/sonra skor farkı, PDF rapor dışa aktarma, teknik planın güncellenmesi (S2) | Huniyi açar, maliyeti sıfır |
| **1 — Motoru derinleştir** | 3–4 hafta | Modül A, Modül C, Modül J (dil işleme + karakter kontrolü + tarih formatları) | Mevcut güçlü yanı katlar, yapay zekâ gerektirmez |
| **2 — Anlamsal katman** | 2–3 hafta | Katman 1, Modül B, Modül F (çoklu ilan karşılaştırma dahil) | Tarayıcıda kalır, rakiplerden ayrıştırır |
| **3 — Oluşturucu** | 4–6 hafta | Modül E (JSON Resume, şablonlar, PDF/DOCX, kapalı döngü, içe aktarma) | En büyük kullanıcı değeri, geri dönüş sebebi |
| **4 — Yapay zekâ katmanları** | 3–4 hafta | Katman 2 + 3, `LLMProvider`, Modül D, ön yazı yardımcısı | Deterministik temel hazır olunca güvenle eklenir |
| **5 — Döngüyü kapat** | 4–5 hafta | Modül G (şifreli senkronizasyon dahil), Modül H, Modül I, hayalet ilan kontrolü | Kalıcı kullanım alışkanlığı oluşturur |

### Faz 0 görev listesi

- [ ] `/analyze` rotasından giriş zorunluluğunu kaldır; giriş yalnızca rapor kaydetme/paylaşma için istensin
- [ ] Ana sayfadaki "Sign in to save reports" metnini bu davranışla uyumlu tut
- [ ] i18n altyapısı (örn. `next-intl`) + Türkçe çeviriler
- [ ] Analiz sonucu ekranına "önceki analiz ile karşılaştır" (tarayıcıda saklanan son skor)
- [ ] Analiz raporunu PDF olarak indirme (istemci tarafında)
- [ ] `ATS_Free_For_All_TECHNICAL_PLAN.md`'yi canlı mimariyle uyumlaştır (bkz. [Bölüm 9](#9-teknik-plan-ile-uyumlaştırma))

### Faz bağımlılıkları

```
Faz 0 ──► Faz 1 ──► Faz 2 ──┬──► Faz 4 ──► Faz 5
                             │
                             └──► Faz 3 ───────┘
```

Faz 3 (oluşturucu) Faz 2'den sonra Faz 4 ile paralel yürütülebilir.

---

## 7. Başarı Metrikleri

Gizlilik ilkesi gereği **içerik izlenmez**; yalnızca anonim olay sayıları tutulur (örn. "analiz tamamlandı", "düzeltme kabul edildi"). CV metni, ilan metni veya kişisel veri hiçbir analitik olayına girmez.

| Metrik | Tanım | Hedef (Faz sonrası) |
|---|---|---|
| Analiz başlatma oranı | Ana sayfa ziyaretlerinin analize dönüşme oranı | Faz 0 sonrası belirgin artış |
| Ortalama puan artışı | Düzeltme modunda ilk ve son skor farkı | Faz 1 sonrası ölçülmeye başlanır |
| Geri dönüş oranı | Aynı tarayıcıdan 7 gün içinde ikinci analiz | Faz 3 ve 5 sonrası artış |
| Kapalı döngü başarı oranı | Oluşturucudan dışa aktarılan CV'lerin parse testini tam puanla geçme oranı | %100 (regresyon testiyle korunur) |
| Yapay zekâ katmanı kullanımı | Katman 2/3'ü etkinleştiren oturumların oranı | Bilgi amaçlı; ürün buna bağımlı olmamalı |

---

## 8. Riskler

| Risk | Etki | Önlem |
|---|---|---|
| Yapay zekânın skoru etkilemesi | Güvenilirlik kaybı; LLM skorlayıcılarda aynı CV'nin çok farklı puanlar alabildiği biliniyor | Skor yalnızca deterministik motordan; YZ çıktısı skor hesaplamasına girdi olamaz (mimari kural + test) |
| Uydurma içerik | Adayı gerçekte olmayan becerilerle başvurmaya itme, itibar kaybı | "Bu beceri bende var" onayı, yer tutucular, girdi-çıktı karşılaştırmalı doğrulama |
| Gizlilik vaadinin aşınması | Ürünün ana farklılaştırıcısının kaybı | Her yeni özellik için "veri nereye gidiyor?" kontrolü; sunucuya CV gönderen özellik eklenmez |
| Tarayıcı içi modellerin performansı | Düşük donanımlı cihazlarda yavaşlık | Katman 1 isteğe bağlı; model önbelleğe alınır; Web Worker içinde çalışır |
| Lisans ihlali | Hukuki risk | İlham alınan projelerden kod kopyalanmaz; kopyalanacaksa lisans kontrolü (özellikle AGPL lisanslı projeler) |
| Scraping kaynaklı riskler | Kullanım şartları ihlali | LinkedIn ve iş portalları scrape edilmez; yalnızca herkese açık resmi API'ler ve kullanıcı yüklemeleri |
| Senkronizasyonda KVKK / GDPR | Kişisel veri işleme yükümlülükleri | Uçtan uca şifreleme, veri minimizasyonu, tek tıkla silme |
| Kapsam kayması | Hiçbir modülün bitmemesi | Fazlar sırayla; her faz kendi başına yayınlanabilir değer üretir |

---

## 9. Teknik Plan ile Uyumlaştırma

`ATS_Free_For_All_TECHNICAL_PLAN.md` ile canlı ürün arasındaki farklar ve önerilen karar:

| Konu | Teknik plan | Canlı ürün | Öneri |
|---|---|---|---|
| Çalışma yeri | Sunucu (FastAPI + worker'lar) | Tarayıcı | **Tarayıcı öncelikli kalsın.** Sunucu yalnızca hesap, şifreli senkronizasyon ve CV içermeyen işler (ilan API proxy'si) için |
| Skor bileşenleri | 9 bileşen | 5 bileşen | 5 bileşen korunur; anlamsal eşleşme Keyword match içinde mod olarak (Modül B), deneyim/eğitim/dil eşleşmesi Modül F'de ayrı bir "uygunluk" raporu olarak |
| LLM | Sunucuda Ollama + gpt-oss-20b | Yok | Katman 2 (kullanıcının yerel Ollama'sı) + Katman 3 (BYOK); sunucuda LLM barındırılmaz |
| Embedding | Sunucuda Ollama + pgvector | Yok | Katman 1: tarayıcıda transformers.js |
| Veritabanı | PostgreSQL (CV, ilan, analiz kayıtları) | Yalnızca paylaşım linkleri | Sunucuda CV saklanmaz; tarayıcıda IndexedDB, isteğe bağlı şifreli senkronizasyon |
| Korunacak ilkeler | Deterministik skor, açıklanabilirlik, guardrail'ler, sürümleme, provider soyutlaması | — | **Aynen korunur** ve bu dokümanın [Bölüm 3](#3-değişmez-i̇lkeler)'üne taşınmıştır |

Teknik plandaki sunucu mimarisi, ileride kurumsal veya self-host bir sürüm için ayrı bir doküman olarak saklanabilir.

---

## 10. İlham Alınan Açık Kaynak Projeler

Bu projelerden **fikir** alınır; kod kopyalanmaz. Kod kullanılacaksa ilgili lisans ayrıca kontrol edilmelidir.

| Proje | Link | Lisans | İlham alınan modül |
|---|---|---|---|
| OpenResume | https://github.com/xitanggg/open-resume | AGPL-3.0 | A, E |
| ats-screener | https://github.com/sunnypatell/ats-screener | MIT | B |
| Resume-Matcher | https://github.com/srbhr/Resume-Matcher | Apache-2.0 | D |
| career-ops | https://github.com/career-ops-hq/career-ops | MIT | D, F, H |
| Reactive Resume | https://github.com/reactive-resume/reactive-resume | MIT | E |
| RenderCV | https://github.com/rendercv/rendercv | MIT | E |
| Jake's Resume | https://github.com/jakegut/resume | MIT | E (şablon tasarımı) |
| JSON Resume | https://github.com/jsonresume/jsonresume.org | MIT | E (veri modeli) |
| JobSync | https://github.com/Gsync/jobsync | MIT | G |
| tech-interview-handbook | https://github.com/yangshun/tech-interview-handbook | — | H |

---

*Bu yol haritası yaşayan bir dokümandır. Her faz sonunda metrikler ve kullanıcı geri bildirimleriyle güncellenmelidir.*
