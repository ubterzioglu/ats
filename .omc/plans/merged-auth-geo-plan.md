# Birleşik plan: zorunlu ücretsiz üyelik + GEO açık maddeleri

Kaynaklar (bu dosya ikisinin yerine geçer):
- Zorunlu ücretsiz üyelik planı: `C:\Users\baris-terzioglu\.claude\plans\insanlar-n-sitede-herhangi-bir-sprightly-chipmunk.md`
- GEO açık maddeleri: `.omc/plans/seo-geo-round4-plan.md` (GEO-ANALYSIS.md, 65/100)

`.omc/plans/platform-remaining-plan.md` (round 5) bu plana alınmadı: A, B, C ve D bölümlerinin her biri `main`'de aynı başlıklı bir commit olarak
duruyor (`694470f`, `65e18c8`, `e385339`/`17ac680`, `5e2e77a`). Aşağıdaki Faz 0 bunu kodda doğrular. Eksik çıkan madde olursa
o madde bu plana Faz 0 altında eklenir.

Repo `c:\temp_private\ats`, uygulama kökü `apps/web`. Next.js 15, next-intl `en/tr/de` (`localePrefix: "as-needed"`), Supabase `@supabase/ssr`.
AGENTS.md geçerli: lint + typecheck + test temiz, faz sonunda `main`'e conventional commit + push. `lib/scoring/` saf kalır; `lib/supabase/`
ve `lib/cv-submission/` server-only kalır. Kopya (copy) kuralı: abartma yok, düz konuş. Emoji yok.

## Önce karar notu

Bu plan `MASTERPLAN.md` P0.1'i ("login kapısını kaldır", tamamlandı) bilinçli olarak geri çevirir: araçlar tekrar girişe bağlanır. Kullanıcı
bunu istedi. Faz 7'de MASTERPLAN'a "P0.1 geri alındı, bkz. bu plan" notu düşülür.

## İki planın çakıştığı yerler (tek seferde çözülür)

| Konu | Üyelik planı | GEO planı | Birleşik karar |
|---|---|---|---|
| `middleware.ts` | kapı + `decideAccess` | matcher'a `manifest\.json` | tek düzenleme, tek test dosyası (`middleware-matcher.test.ts`) |
| `messages/{en,tr,de}.json` | hesap verisi, consent, login metinleri | `metadata.description`, `privacyTag`, `aiConsent`, `byok`, yeni description/skip-link anahtarları | Faz 5'te tek geçiş; `tests/messages.test.ts` her fazda yeşil |
| Sitemap / llms.txt / ai/*.json | `/analyze`, `/builder`, `/applications` çıkarılır, noindex | llms.txt anahtar eşlemesi, storage cümlesi, `ai/faq.json` | Faz 6'da birlikte |
| Landing (`[locale]/page.tsx`) | CTA'lar login'e gider | `<main>` -> `<div>`, HowTo yerelleştirme | Faz 3 ve Faz 6 aynı dosyayı sırayla düzenler |
| Doğrulama (curl botları) | - | `/analyze` head kontrolü | Artık `/analyze` girişe yönlendirir; head kontrolü `/`, `/about`, `/privacy`, `/kvkk`, `/data-request` üzerinde yapılır |
| Gizlilik metni | hesap verisi eklenir | "Scored in your browser" tek başına yanlış | Tek cümle: tarayıcıda puanlanır, dosya ve sonuç hesaba bağlı olarak 12 ay saklanır |

## Faz 0 - Ön kontrol (kod yazmadan)
1. `git status --short --branch`, `git log --oneline -15`; çalışma ağacında ilgisiz değişiklik varsa dokunma, yalnızca bu planın dosyalarını stage et.
2. round 5 maddelerini kodda doğrula: `storage_path` kaydı (A1), `deleteSubmissionRow` (A2), 413 guard (A3), salt yokken 503 (A4), cron
   `timingSafeEqual` (A6), data-request honeypot (A7), `/admin/submissions/[id]`, `/admin/requests`, `/admin/audit`, `lib/admin/audit.ts`,
   `lib/consent.ts`, `grep -rn "FILL_ME" apps/web supabase` boş. Eksik olanı raporla; üyelik işine başlamadan önce kullanıcıya sor.
3. Mevcut `npm run lint && npm run typecheck && npm test` taban çizgisini kaydet.

## Faz 1 - Auth çekirdeği ve kapı
Tasarım: kapı middleware'de, sayfa bazında dağınık kontrol yok.
- `lib/auth/routes.ts` (saf): `PROTECTED_PREFIXES`, `isProtectedPath(pathname)` (locale önekini `routing.locales` ile soyar), `safeNext(value, locale)`
  (yalnızca tek `/` ile başlayan iç yol; `//`, şema, `\` yok; aksi halde `/analyze`), `withLocale(path, locale)`.
- `decideAccess({ pathname, user, authConfigured })` saf fonksiyon. Sonuçlar: allow / redirect-to-login. Middleware ince sarmalayıcı.
- `lib/supabase/middleware.ts`: `updateSession` `{ response, user }` döndürür; env yoksa `user: null` ve kapı devre dışı (opsiyonel kalıcılık
  kuralı: Supabase yapılandırılmamışsa site açık çalışır; kodda tek satır yorum).
- `middleware.ts`: korumalı yol ve (`!user` veya `!user.email_confirmed_at`) ise `/{locale}/login?next=...` (en için önek yok); `updateSession`
  çerezlerini redirect cevabına taşı. Aynı düzenlemede matcher'a `manifest\.json` ekle (GEO Adım 4) ve `tests/middleware-matcher.test.ts`'e case ekle;
  matcher'ın `api/`, `auth/` dışlamasına dokunma.
- `lib/auth/require-user.ts` (server-only): `requireUser()`, API için `getApiUser()`.
- Açık kalanlar: `/`, `/about`, `/privacy`, `/kvkk`, `/data-request` (KVKK/GDPR hakkı üyeliğe bağlanamaz), `/login`, `/forgot-password`,
  `/reset-password`, `/r/[token]`, `/auth/*`, SEO/AI dosyaları, `/api/data-request`. Kapalı: `/analyze`, `/builder`, `/applications`, `/api/cv`,
  `/api/ghost-check`, `createShareLink`.
- Testler: `tests/auth-routes.test.ts` (`isProtectedPath` en/tr/de önekleriyle; `safeNext`: `//evil.com`, `https://x`, `\\x`, boş, `/admin`, `/tr/admin`),
  `decideAccess` (user yok / doğrulanmamış / doğrulanmış / env yok).
Commit: `feat(auth): gate tools behind a verified account`.

## Faz 2 - Giriş akışı
- `login/actions.ts`: `login` başarıdan sonra `safeNext(next)`'e yönlenir (hidden input `next`); `signup` `emailRedirectTo`'ya `next` ekler; yönlendirmeler
  `@/i18n/navigation` `redirect` ile locale-aware. (Bu aynı zamanda round 5 A8'in eksik yarısını kapatır: admin login sonrası `/admin`'e döner.)
- `signInWithGoogle` server action: `signInWithOAuth({ provider: "google", options: { redirectTo: ${SITE_URL}/auth/confirm?next=... } })`, dönen URL'ye redirect.
  `app/auth/confirm/route.ts` redirect'i locale-aware olur, `next` temizleme `safeNext` ile birleşir.
- Şifre sıfırlama: `forgot-password/page.tsx` (`resetPasswordForEmail`, `redirectTo` -> `/auth/confirm?next=/reset-password`), `reset-password/page.tsx`
  (`updateUser({ password })`). Hata metinleri `login/messages.ts` beyaz liste desenine uyar; ham hata metni gösterilmez.
- `login/page.tsx`: "Google ile devam et", "Şifremi unuttum", `next` taşıma. Giriş yapmış kullanıcı `/login`'e gelirse `next`'e gider.
- `requireAdmin` yönlendirmesi locale-aware; `email_confirmed_at` kontrolü KALKMAZ.
Commit: `feat(auth): Google sign-in, password reset and safe next redirects`.

## Faz 3 - Nav, çıkış, landing CTA
- `components/ui/nav-bar.tsx`: tarayıcı client'ı `ANON_KEY` ile `PUBLISHABLE_KEY` fallback'li okur (ortak `lib/supabase/env-keys.ts`, yalnızca public env,
  server-only DEĞİL); `onAuthStateChange`. Giriş yoksa "Giriş yap" ve korumalı linkler `next` ile login'e; varsa kısaltılmış e-posta + "Çıkış".
  Admin linki yalnızca sunucuda hesaplanır (round 5 B7 korunur).
- Çıkış: form `logout` server action'ına bağlanır; var olmayan `/auth/logout` hedefi kalkar.
- Landing CTA'ları anonim kullanıcıyı `/login?next=/analyze`'a götürür; metin "ücretsiz üyelik gerekir" der. Layout dinamik yapılmaz (statik render
  korunur), kullanıcı bilgisi istemcide.
Commit: `feat(auth): nav sign-in state, logout action, landing CTAs`.

## Faz 4 - Veri bağlama ve hesap silme
- `app/api/cv/route.ts` ve `app/api/ghost-check/route.ts`: `getApiUser()`, yoksa 401 `{ error: "auth-required" }`. `HandleSubmissionInput.userId?: string`
  (`insertSubmission` zaten destekliyor). `components/analyzer.tsx` 401'de login'e yönlendiren net mesaj gösterir.
- Migration `supabase/migrations/0005_ats_reports_user_id.sql`: `ats_reports.user_id uuid references auth.users(id) on delete set null` + index; RLS politikası
  EKLEME (tüm tablolar service-role). `createShareLink` -> `saveReport` kullanıcı id'sini geçirir. `supabase/verify-rls.sql`'e `admin_users` eklenir.
- Hesap silme: `app/[locale]/account/page.tsx` (korumalı) + `deleteAccount` action: kullanıcının `cv_submissions`/`ats_reports` satırları ve storage dosyaları,
  sonra `auth.admin.deleteUser`. Silme için mevcut ortak yardımcıyı yeniden kullan (`lib/admin/delete-submission.ts`, Drive -> Storage -> satır sırası);
  yeni silme kodu yazma. Drive silinemezse `data_requests`'e kayıt düş ve kullanıcıya düz metinle söyle.
- Testler: `handleSubmission` `userId` geçirme (ports enjeksiyonu), API 401.
Commit: `feat(auth): bind submissions and reports to the account, account deletion`.

## Faz 5 - Metin, yasal ve storage doğruluğu (tek geçiş, üç dil birlikte)
Hesap tarafı:
- `lib/legal-entity.ts` `LEGAL_VERSION` artırılır (yeniden onay beklenen davranış).
- `privacy` ve `kvkk`: hesap verisi (e-posta, şifre hash'i Supabase Auth'ta, Google ile girişte e-posta/ad), amaç, alıcılar (Supabase Auth, Google OAuth),
  saklama (hesap ömrü + silme hakkı), zorunlu oturum çerezleri, CV'nin hesaba bağlı olması. `consent` banner "yalnızca analitik çerezi" diyor; oturum
  çerezlerinin zorunlu olduğu eklenir.
- `apps/web/docs/adr-0001-cv-storage.md` sonuna "Addendum: accounts" (kimlik artık `user_id`; `client_hash` yalnızca hız sınırı). Hukuki inceleme notu kalır.
GEO tarafı:
- `metadata.description` ve `home.privacyTag`: "Scored in your browser" tek başına kalmaz; storage cümlesi eklenir (örn. "...; the file and result are stored for 12 months").
  Bu anahtar layout meta, llms.txt, ai.txt, summary.json, feed, About ve JSON-LD'yi besler. `about.privacy` ve `lib/i18n/coming-soon.ts` ile aynı ifade.
- `aiConsent.lede`, `byok.intro`: "never sent anywhere" -> "is not sent to any model provider" (model kapsamıyla sınırlı, doğru kalır).
- Kalan "never uploaded / nothing is uploaded / never leaves / asla yüklenmez / nie hochgeladen / hiçbir şey yüklenmez" taraması; her isabet raporda açıklanır.
- Yeni anahtarlar üç dilde birlikte (`tests/messages.test.ts` eşitliği zorluyor). `tests/byok-privacy.test.ts`, `tests/d4-d5-surface.test.ts` niyetini korur.
Commit: `feat(legal): account data, storage truth in every summary`.

## Faz 6 - SEO / GEO (girişli dünyaya uyumlu)
Önce `Grep`: "sign up|account|no login|no sign-up|giriş|üyelik" (FAQ, home, `llms.txt`, JSON-LD, `ai/*.json`) ve yanlış kalan iddiaları düzelt.
1. Sitemap ve erişim: `app/sitemap.ts`'ten `/analyze`, `/builder`, `/applications` çıkar; bu sayfalara `robots: noindex`; `llms.txt` ve `ai/*.json` yalnızca
   açık sayfaları listeler. `/admin` zaten sitemap ve llms.txt dışında kalmaya devam eder.
2. `app/llms.txt/route.ts`: anahtarları açıkça eşle (`/privacy`->`nav.privacy`, `/kvkk`->`nav.kvkk`, `/data-request`->`nav.dataRequest`), üç sabit
   yinelenen satırı sil, `/#faq` kalsın. `.well-known/ai.txt`'e bir gizlilik satırı. Yeni `tests/llms.test.ts`: `nav.` yok, `[/` etiketi yok, URL'ler benzersiz, storage cümlesi var.
3. Legal sayfalar: `app/[locale]/{privacy,kvkk,data-request}/page.tsx` `generateMetadata` (title mevcut `*.title`, description yeni kısa `*.description`),
   `setRequestLocale`, `JsonLd` + `buildBreadcrumbJsonLd`, sayfa başına `openGraph` title/description. `about/page.tsx` için `about.description`.
   `lib/seo.ts` `pageAlternates`: `types: {"application/atom+xml": "/feed.xml"}`.
4. İç içe `<main>`: layout'taki `<main id="main-content">` tek landmark; sayfaların kendi `<main>`'i `<div>` olur (`[locale]/page.tsx`, `analyze`, `builder`,
   `about`, ayrıca login, applications, admin, `r/[token]`, not-found için `Grep`). `next.config.ts`: `htmlLimitedBots` RegExp (Googlebot, bingbot, GPTBot,
   OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, CCBot, Applebot, Google-Extended). Skip-link metni `common.skipToContent` x3.
5. Manifest ve OG: layout metadata'ya `manifest: "/manifest.json"`. OG 307 yönlendirmesi: önce canlıda `curl -sI` ile `/en/opengraph-image` ve home `og:image`
   URL'sini doğrula, sonra matcher'dan hariç tut veya doğrudan `openGraph.images` ver. `app/ai/faq.json/route.ts`: `buildFaqJsonLd(faqs)` döndürür.
   NOT: round 5 D1 bu dosyayı `faqs` şekline çevirmişti; hangisinin geçerli olduğunu mevcut koda ve `GEO-ANALYSIS.md`'ye bakarak belirle, ikisini birden
   bozma (araç `faqs` bekliyorsa `{ faqs, ...FAQPage }` birleşik şekli düşün) ve testi güncelle.
6. JSON-LD (`lib/seo.ts`): `potentialAction`/SearchAction kaldır; WebApplication'a `@id`, `offers {price:"0", priceCurrency:"USD"}` (üyelik ücretsiz, doğru),
   `featureList`; `founder` yalnızca ad `/privacy`'de zaten açıksa ve sahibi onaylarsa. `buildHowToJsonLd` ve `[locale]/page.tsx` HowTo adımları messages'tan
   (tr/de yerelleşir). `tests/seo.test.ts` güncellenir (SearchAction assertion, 3 düğüm kontrolü). LinkedIn `sameAs` ancak sahibi sayfayı yayınlayınca.
Bilinçle atlananlar: ana sayfa canonical sonundaki `/`, Atom feed girdi tarihleri/locale, `screenshot` özelliği.
Commit: `fix(seo): storage-aware metadata, llms.txt, single main landmark, gated-page noindex`.

## Faz 7 - Dokümantasyon
- `apps/web/README.md` ve `.env.example`: Google OAuth, `NEXT_PUBLIC_SUPABASE_ANON_KEY` zorunlu. README'deki "Everything works without it (Supabase)" ->
  "Supabase yapılandırılmamışsa kapı devre dışıdır (yerel geliştirme)".
- `AGENTS.md` Privacy contract: hesap bağlantısı. `MASTERPLAN.md`: P0.1 geri alındı notu.
Commit: `docs: accounts and gated tools`.

## Elle yapılacak dış kurulum (kod değil)
1. Supabase Dashboard -> Auth -> Providers -> Google: Client ID/Secret (Google Cloud Console OAuth client; yetkili yönlendirme URI'si `https://<proje>.supabase.co/auth/v1/callback`).
2. Auth -> URL Configuration: Site URL = `NEXT_PUBLIC_SITE_URL`; Redirect URLs'e `.../auth/confirm` ve `http://localhost:3000/auth/confirm`.
3. Auth -> "Confirm email" AÇIK kalsın (admin güvenliği buna dayanıyor); parola politikası min 8-10; Bot protection (CAPTCHA) açılması önerilir.
4. Üretimde `0005` migration'ı çalıştır.
5. GEO dış kurulum (sahibe ait, kod dışı): GitHub homepage/description, LinkedIn, YouTube, Show HN/Reddit.

## Doğrulama
1. `npm run lint && npm run typecheck && npm test && npm run build` (apps/web) temiz; test sayısını raporla.
2. Çıkışlı tarayıcı: `/analyze` -> `/login?next=/analyze`; `/de/builder` -> `/de/login?next=/de/builder`; `/`, `/about`, `/privacy`, `/kvkk`, `/data-request`, `/r/<token>` açık.
3. E-posta+şifre kayıt -> doğrulama maili -> `/auth/confirm` -> `next`'e iner; doğrulanmamış hesapla `/analyze` kapalı. Google ile uçtan uca; çıkış nav'dan çalışır; şifre sıfırlama çalışır.
4. `curl -X POST /api/cv` oturumsuz -> 401; oturumlu yükleme `cv_submissions.user_id` dolu. Supabase env yokken site açık.
5. `/admin` yalnızca doğrulanmış admin e-postasına açık (regresyon); admin login sonrası `/admin`'e döner.
6. Hesap silme: satırlar, storage dosyası, auth kullanıcısı gitti.
7. Build + serve (`NEXT_PUBLIC_SITE_URL=https://atsfreeforall.com`), Googlebot ve GPTBot UA ile `/`, `/about`, `/privacy`, `/kvkk`, `/data-request`: title/description/canonical `<head>`
   içinde, sayfada tek `<main>`; `/llms.txt` içinde `nav.` yok, yinelenen URL yok, storage cümlesi var; `/manifest.json` 200; `/ai/faq.json` beklenen şekilde; og:image doğrudan 200;
   `/sitemap.xml` ve `llms.txt` içinde kapalı araç sayfaları yok.
8. Dağıtım sonrası seo-geo analizini yeniden çalıştır, 65 ile karşılaştır (Authority off-site iş yapılana kadar düşük kalır). Her faz için ayrı `code-reviewer` geçişi, commit'ten önce.

## Riskler
- Açık kayıt spam/bot kaydı getirir; CAPTCHA önerilir (kapsam dışı).
- `LEGAL_VERSION` artışı mevcut herkesten yeniden onay ister.
- Hukuki inceleme (ADR'de beklemede) hesap verisi için de gerekir.
- Araçlar girişe bağlanınca organik girişlerin dönüşümü düşebilir; bu P0.1'in geri alınmasının bilinen bedeli.
- Faz 6 madde 5'teki `ai/faq.json` şekli round 5 D1 ile çelişebilir; kodda doğrulanmadan değiştirme.
