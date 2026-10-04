# Kalan işler — batch batch agent prompt'ları

Tüm batch'lerin kodu ve testleri tamamlandı. Kalan iş: tarayıcı doğrulaması ve deploy.

---

## ORTAK BAŞLIK (her prompt'un başına koy)

```
C:\temp_private\ats deposunda çalışıyorsun.

ÖNCE OKU
  AGENTS.md — mimari kuralları, puanlama değişmezi, gizlilik sözleşmesi, kod stili.
  apps/web/docs/handover-2026-10-04.md — bugün ne yapıldı, ne kaldı.
  MASTERPLAN.md bölüm 1 — mevcut durum.

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

# KALAN İŞLER

## D.4 ve D.5 — tarayıcı doğrulaması

Kod ve testler tamamlandı. Grounding uydurma sayı, teknoloji ve kurum adını reddediyor.
Her work item'ın kendi kabul/ret butonu var. Ama MASTERPLAN "ekran yolundan doğrulama
bekliyor" diyor.

Gerçek bir tarayıcıda:
1. Bir CV ve ilan ile analiz çalıştır.
2. Tailor görünümüne git.
3. Bir taslağı kabul et, diğerini ret et.
4. Metnin beklendiği gibi değiştiğini doğrula.
5. Uydurma sayı içeren bir taslağın reddedildiğini ve kullanıcının nedenini gördüğünü
   doğrula.

Sonra MASTERPLAN'de D.4 ve D.5'i ✅ yap.

## V.10 ve A.4 — tarayıcı doğrulaması

Terminalden kapanamaz. Gerçek bir telefonda ya da cihaz emülasyonunda:
- V.10: her çok sütunlu ızgara tek sütuna iniyor mu, yatay kaydırma var mı?
- A.4: parse görünümü kendini menzile kaydırıp işaretli satıra gidiyor mu?

Geri kalan V.10 maddeleri zaten testle korunuyor (kontrast, live rengi, azaltılmış
hareket, odak).

## Supabase migrasyonu

Uygulanmadı (`PGRST205 — public.ats_reports bulunamadı`). En kolayı: Supabase panelinde
SQL Editor'e `apps/web/supabase/migrations/0001_ats_reports.sql` içeriğini yapıştır, Run.
Dosya `if not exists` kullanıyor, tekrar çalıştırmak zararsız.

CLI yolu şu an kapalı: oturum başka bir hesapta (`plbssoycbtaalwwvhgbr` o hesapta görünmüyor)
ve veritabanı parolası hiçbir yerde kayıtlı değil.

## Deploy

Kod `origin/main`'de. Otomatik deploy çalışmıyor — Coolify'da **Redeploy**'a basılması
gerekiyor. İlk basışta canlı site "çok yakında" sayfasından gerçek ürüne döner.

Push'tan önce: `npx npm@10 ci --dry-run` (apps/web içinde) temiz çıksın. Yerel npm 11,
Docker'ın npm 10'u; ayrışırsa deploy kırılır.
