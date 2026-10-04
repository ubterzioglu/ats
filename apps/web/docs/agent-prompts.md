# Kalan işler — batch batch agent prompt'ları

29 batch kaldı. Her biri için aşağıda hazır bir prompt var. Kullanımı: **ortak başlığı** kopyala,
altına ilgili batch bloğunu yapıştır, agent'a ver.

Dalgalar bağımlılığa göre sıralı. Aynı dalgadaki işler birbirinden bağımsızdır — paralel verilebilir.

---

## ORTAK BAŞLIK (her prompt'un başına koy)

```
C:\temp_private\ats deposunda çalışıyorsun.

ÖNCE OKU
  AGENTS.md — mimari kuralları, puanlama değişmezi, gizlilik sözleşmesi, kod stili.
  apps/web/docs/handover-2026-10-03.md — alınmış kararlar ve dosya sahipliği.
  MASTERPLAN.md bölüm 8 — batch tanımları ve bağımlılıklar.

DEĞİŞMEZLER — PAZARLIKSIZ
  1. lib/scoring/ saftır. DOM yok, ağ yok, React yok, I/O yok. lib/ai'den HİÇBİR ŞEY
     import etmez — tests/scoring-purity.test.ts bunu dosya dosya denetler.
  2. Puan = max - bulguların maliyet toplamı, [0,max] aralığına kırpılır. Puanı asla
     doğrudan oynatma; düşüş eklemek demek `cost` taşıyan bir FindingDraft eklemek demek.
  3. CV tarayıcıdan çıkmaz. Sunucuya CV metni gönderen her şey ön sayfadaki sözü bozar.
  4. Tarihler tek kaynaktan okunur: lib/scoring/experience.ts'teki extractPeriods.
     İkinci bir tarih ayrıştırıcı YAZMA.
  5. Terim karşılaştırması tek kaynaktan: lib/scoring/match.ts'teki matchTerms /
     countOccurrences. Kendi eşleştiricini yazma — eşanlamlıları, Türkçe gövdeleri ve
     Almanca bileşikleri kaçırır, puanla çelişirsin.
  6. "live" camgöbeği rengi yalnızca AI çıktısı gösteren yüzeylerde kullanılır.
     Yeni bir AI yüzeyi kendini gerekçesiyle AI_SURFACES'a ekler.
  7. Motorun kendi dili İngilizcedir. Bulgular, boyut etiketleri, bant adları çevrilmez.
     Arayüz üç dilde; motor değil.

BİTİRME KOŞULU
  apps/web dizininden `npm run lint`, `npm run typecheck`, `npm test` — üçü de temiz
  olmadan bitirme. Batch başına TEK commit: conventional subject, nedenini anlatan gövde,
  sonra trailer'lar: Constraint:, Rejected:, Confidence:, Scope-risk:, Directive:,
  Not-tested:. Not-tested: bir formalite değil — gerçek tarayıcıda sürmediğin her şeyi
  oraya yaz.
  `git add -A` KULLANMA, yolları tek tek stage'le. Başka agent'ların uçuşta işi olabilir.
  Bitirince MASTERPLAN.md'de kendi satırını ~~**X.N**~~ ✅ diye işaretle ve bölüm 1'deki
  sayacı güncelle.

YENİ MESAJ ANAHTARI
  Üç locale'i de doldur (en/de/tr). tests/messages.test.ts anahtar eşliğini, çevrilmemiş
  değerleri ve ICU yer tutucularını denetliyor. messages/*.json'da başka agent çalışıyorsa
  anahtarları commit mesajında listele, dosyaya dokunma.
```

---

# DALGA 1 — şimdi başlanabilir















---

# DALGA 2 — F.1 bitince

## F.2 — Kırmızı bayraklar `M`

```
MASTERPLAN'den F.2'yi uygula. F.1'in çıkardığı alanların üstüne kurulur.

İlandaki şüpheli şeyleri işaretle: aşırı uzun beceri listesi, kıdemle çelişen yıl
şartı ("junior" diyor ama 8 yıl istiyor), muğlak rol tanımı.

Kabul: her bayrak KANITINI adıyla söyler — ilanın hangi satırından çıktığını. F.1 her
alanda `source` satırını taşıyor, onu kullan. Gerekçesiz bayrak gösterme.
```

## F.3 — Deterministik uygunluk kontrol listesi `M`

```
MASTERPLAN'den F.3'ü uygula.

"Bu ilana başvurabilir misin" kontrol listesi: yıl şartı, dil şartı, lokasyon/çalışma
izni, zorunlu beceriler. Her madde geçti/kaldı/belirsiz.

Kabul: HİÇ AI yok. Tamamen deterministik, F.1'in okuduğu alanlar + CV'den okunan
gerçeklerle. Tarihler extractPeriods'tan, terimler matchTerms'ten gelir.
```

## F.6 — Hayalet ilan kontrolü `L`

```
MASTERPLAN'den F.6'yı uygula.

Greenhouse / Lever / Ashby'nin herkese açık iş panosu API'leri üzerinden ilanın hâlâ
yayında olup olmadığını kontrol et. Sunucu tarafı proxy üzerinden (CORS).

KRİTİK: proxy HİÇBİR aday verisi taşımaz — ne CV metni, ne isim, ne e-posta. Yalnızca
ilan kimliği gider. İlke 2 böyle korunur. Bunu bir testle kanıtla.

Kabul: proxy aday verisi taşımıyor.
```

## D.2 — Eksik terim kartları `M`

```
MASTERPLAN'den D.2'yi uygula.

CV'de eksik olan her ilan terimi için bir kart: terim ilanda nerede geçiyor, ne kadar
merkezi (F.1'in zorunlu/tercihen ayrımı + terimin ağırlığı), ve CV'de nereye girerdi.

Kabul: her kart ilandan ALINTI yapar. Alıntısı olmayan kart gösterilmez.
Eksik terimler matchTerms'ün `missing` listesinden gelir — kendi listeni çıkarma.
```

---

# DALGA 3

## D.3 — "Bu beceri bende var" onay kapısı `M` · D.2'den sonra

```
MASTERPLAN'den D.3'ü uygula.

Hiçbir terim, kullanıcı onaylamadan CV'ye giremez. Bu ürünün dürüstlük sözü: araç
kullanıcıya yalan söyletmez.

Kabul: ONAYLANMAMIŞ BİR BECERİNİN EKLENEMEYECEĞİNİ KANITLAYAN OTOMATİK BİR TEST.
Bu testi yazmadan batch bitmiş sayılmaz — kabul kriteri birebir bunu istiyor.
```

## F.4 — Çoklu ilan karşılaştırma `L` · F.3'ten sonra

```
MASTERPLAN'den F.4'ü uygula.

5–10 ilanı yan yana koy, en iyi uyumu göster. ST.1 ile ilanlar yerelde saklanır.
Kabul: on ilan tarayıcı içinde karşılaştırılıyor — sunucuya hiçbir şey gitmeden.
Karşılaştırma F.3'ün kontrol listesi ve matchTerms kapsaması üzerinden yürür.
```

## D.6 — Varyant karşılaştırma `M` · D.1'den sonra

```
MASTERPLAN'den D.6'yı uygula.
Ana CV'nin puanı ile uyarlanmış varyantın puanı yan yana. Kabul: iki puan birlikte
gösteriliyor. Fark neyden geliyor, boyut boyut okunabilsin.
```

## G.2 — Kart bağlantıları `M` · G.1 + D.1'den sonra

```
MASTERPLAN'den G.2'yi uygula.
Her kanban kartı şunlara bağlanır: ilan, kullanılan CV varyantı, BAŞVURU ANINDAKİ puan
(sonradan değişmez — o günün fotoğrafı), notlar, kişiler.
Kabul: her kart bağlı kayıtlarını çözebiliyor; kayıt silinmişse kart dürüstçe söylüyor.
```

## G.3 — Takip hatırlatmaları `M` · G.1'den sonra

```
MASTERPLAN'den G.3'ü uygula.
"7 gündür yanıt yok" türü hatırlatmalar. Tamamen YERELDE hesaplanır — sunucu yok,
bildirim servisi yok, e-posta yok. Kabul: hatırlatmalar yerel hesaplanıyor.
```

## G.4 — CSV ve JSON dışa aktarma `S` · G.1'den sonra

```
MASTERPLAN'den G.4'ü uygula.
Kanban verisini CSV ve JSON olarak dışa aktar. Kabul: round-trip — dışa aktarılan
dosya geri içe aktarıldığında aynı veriyi verir. Testle kanıtla.
Bu kullanıcının verisini rehin almadığımızın kanıtı; ciddiye al.
```

## G.5 — Tek tıkla silme `S` · G.1 + ST.3'ten sonra

```
MASTERPLAN'den G.5'i uygula.
Her şeyi tek tıkla sil, yerelden. ST.3 (veri kontrolleri, neyin gideceğini sayan onay)
zaten var — onun üstüne kur, ikinci bir silme yolu açma.
Kabul: her şeyi siliyor ve ne sildiğini söylüyor.
```

## H.4 — Pratik modu `M` · H.3'ten sonra

```
MASTERPLAN'den H.4'ü uygula.
Soru gösterilir, aday cevabını yazar, ilgili STAR hikâye kartı önerilir.
Kabul: öneri bir karta kadar İZLENEBİLİR — "bunu şu deneyiminden anlatabilirsin"
derken hangi kart olduğu görünür. Sihirli öneri yok.
```

---

# DALGA 4

## D.4 — Madde yeniden yazımı `L` · L.4 + D.3'ten sonra

```
MASTERPLAN'den D.4'ü uygula. Bu modülün en riskli batch'i.

YALNIZCA var olan maddeleri yeniden ifade eder. Uydurulmuş sayı YOK. Ölçülebilir bir
sonuç eksikse yer tutucu bırakılır: [X%], [N kişi].

lib/ai/tasks/rewrite.ts ve lib/ai/grounding.ts üstüne kur — ikisi de hazır.
Kabul: GİRDİDE OLMAYAN bir sayı ya da kurum adı içeren çıktı REDDEDİLİR. Bu bir
tercih değil, kapı. Reddi testle kanıtla, hem sayı hem kurum adı için.

Önce kural, sonra model (karar 6): deterministik bir yeniden yazım kuralı varsa onu
kullan, modeli yalnızca kural yoksa çağır. Anında, indirme yok, uyduramaz.
```

---

# DALGA 5

## D.5 — Madde madde kabul/ret `M` · D.4'ten sonra

```
MASTERPLAN'den D.5'i uygula.
Her değişiklik ayrı ayrı kabul veya reddedilebilir. Toplu "hepsini uygula" tek yol
olmasın — kullanıcı neyi kabul ettiğini görmeden kabul etmemeli.
Kabul: her değişiklik bağımsız kabul edilebilir.
```

## D.7 — Ön yazı yardımcısı `M` · D.4'ten sonra

```
MASTERPLAN'den D.7'yi uygula.
Ön yazı taslağı. D.4'ün AYNI korumaları geçerli: CV'de olmayan hiçbir iddia, hiçbir
sayı, hiçbir kurum adı üretilmez. Uydurulmuş iddia reddedilir.
Kabul: uydurulmuş iddia yok — testle kanıtlı.
```

---

# KOD DIŞI İŞLER

## P0.3 — Reddedilen sunucu ağacını sil

Agent'a verilmez, izin kilidine takılıyor. Elle:

```
cd C:\temp_private\ats
git rm -r apps/api services packages docker-compose
git commit -m "chore: delete the rejected server tree"
```

`infra/` ve `data/` boş, takipli değil. `apps/web`'den sıfır referans var — doğrulandı.
Sonra MASTERPLAN'de P0.3'ü ◐ yerine ✅ yap.

## Supabase migrasyonu

Uygulanmadı (`PGRST205 — public.ats_reports bulunamadı`). En kolayı: Supabase panelinde
SQL Editor'e `apps/web/supabase/migrations/0001_ats_reports.sql` içeriğini yapıştır, Run.
Dosya `if not exists` kullanıyor, tekrar çalıştırmak zararsız.
CLI yolu şu an kapalı: oturum başka bir hesapta (`plbssoycbtaalwwvhgbr` o hesapta görünmüyor)
ve veritabanı parolası hiçbir yerde kayıtlı değil.

## V.10 ve A.4 — tarayıcı doğrulaması

Terminalden kapanamaz. Gerçek bir telefonda ya da cihaz emülasyonunda:
- V.10: her çok sütunlu ızgara tek sütuna iniyor mu, yatay kaydırma var mı?
- A.4: parse görünümü kendini menzile kaydırıp işaretli satıra gidiyor mu?

Geri kalan V.10 maddeleri zaten testle korunuyor (kontrast, live rengi, azaltılmış
hareket, odak).

## Deploy

Kod `origin/main`'de. Otomatik deploy çalışmıyor — Coolify'da **Redeploy**'a basılması
gerekiyor. İlk basışta canlı site "çok yakında" sayfasından gerçek ürüne döner.
