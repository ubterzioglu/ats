# DeepL ile çeviri (blog + arayüz katalogları) — plan

## Context
`.env.local` içine DeepL API anahtarı eklendi. İki hedef var:
- **A. Blog:** `blog_posts` yazılarını (locale = en/tr/de) DeepL ile diğer dillere çevirmek.
- **B. Katalog:** `apps/web/messages/en.json` kaynak alınarak `tr.json` ve `de.json` dosyalarını DeepL ile üretmek/güncellemek.

Mevcut durum:
- Blog: her yazı tek dilde, çeviri bağlantısı yok (`0006_blog_posts.sql`: `unique (locale, slug)`). `lib/supabase/blog.ts` içinde `savePost` var; blog için admin arayüzü kodda henüz yok. Kökteki `blog.md` (~48 KB) karışık dilli, elle çevrilmiş içerik; bu plan onu otomatik işlemez.
- Katalog: next-intl v4, üç dosya (`en` 46 KB, `tr` 49 KB, `de` 52 KB). `tests/messages.test.ts` üç dosyanın anahtar paritesini zorunlu kılar (`EVERY_LOCALE` / `VERBATIM` izin listeleriyle).
- Gizlilik: DeepL yalnızca site içeriği için kullanılır. CV metni, `evidence` ve kullanıcı verisi DeepL'e GİTMEZ (AGENTS.md gizlilik sözleşmesi, ADR-0001). Her iki hedef de bu kurala uyar.

## Ortak temel (Faz 0)
1. **Env**: `DEEPL_API_KEY` (+ opsiyonel `DEEPL_API_URL`; `:fx` ile biten anahtar = free → `https://api-free.deepl.com`, aksi halde `https://api.deepl.com`).
   - `apps/web/.env.example` ve `docker-compose.yml` `environment:` listesine `DEEPL_API_KEY=${DEEPL_API_KEY:-}` ekle. Katalog scripti yerelde çalıştığı için Dockerfile'a gerek yok.
2. **Saf API çekirdeği** `apps/web/lib/deepl/api.ts` (`server-only` DEĞİL, I/O yok sayılacak kadar ince: `fetch` + parametreler):
   - `deeplBaseUrl(apiKey)`, `toDeeplLang(locale)` (en→`EN-US`, tr→`TR`, de→`DE`), `translateBatch({ apiKey, baseUrl, texts, source, target, tagHandling, ignoreTags })`.
   - Sonuç tipi `{ ok: true, texts } | { ok: false, reason: "quota" | "auth" | "failed" }`. Hata mesajında anahtar sızdırma yok. 50 metinlik toplu istek limiti ve 429 için üstel geri çekilme.
3. **Sunucu sarmalayıcı** `apps/web/lib/deepl/client.ts` (`import "server-only"`): `getDeeplEnv(): {apiKey, baseUrl} | null` (`getSupabaseEnv()` / `getDriveEnv()` kalıbı; anahtar yoksa `null`, asla throw yok) ve blog için kullanılan `translateTexts`.

## Faz 1 — Blog çevirisi (A)
4. `apps/web/lib/blog/translate.ts`: bir `BlogPost`'u hedef dile çevirir (`title`, `description`, `body_md`), slug'ı çevrilmiş başlıktan `slugify` ile üretir (`lib/blog/schema.ts`), `status: "draft"` olarak `savePost` ile kaydeder. Hedef dilde aynı slug varsa `slug-taken` döner, üzerine yazmaz.
   - Markdown'ı bozmamak için gövde bloklara bölünür; kod blokları ve link URL'leri çevrilmez.
5. **Tetikleyici**: admin korumalı (`lib/admin/guard.ts`) `translatePostAction(postId, targetLocales)` sunucu eylemi. İstenirse yerine tek seferlik CLI script.
   - Audit log: `admin_audit_log` action kontrol listesine `blog_translate` eklemek için `0007_*.sql` (0006'daki constraint kalıbı).

## Faz 2 — Katalog çevirisi (B)
6. **Script** `apps/web/scripts/translate-messages.mjs`, `npm run translate:messages`. Yalnızca geliştirici makinesinde çalışır; sitede çalışırken DeepL çağrısı olmaz. `.env.local`'dan `DEEPL_API_KEY` okur. Önerilen ikinci dosya: saf mantık `scripts/translate-messages-core.mjs` (vitest ile test edilir).
7. **Çalışma biçimi**:
   - `en.json` düzleştirilir (`a.b.c` anahtarları); hedef dosyayla karşılaştırılır.
   - Varsayılan **dry-run**: ne çevrileceğini (eksik anahtarlar, değişen kaynaklar) listeler. `--write` ile yazar.
   - **Varsayılan olarak yalnızca eksik anahtarları** çevirir; elle yazılmış mevcut çevirilere dokunmaz. Kaynak (en) metni değişmiş anahtarlar için `messages/.deepl-state.json` içinde kaynak özeti (hash) tutulur ve bu anahtarlar "değişti, gözden geçir" diye raporlanır; yalnızca `--retranslate <anahtar>` veya `--retranslate-changed` ile üzerine yazılır.
   - `--locale tr` / `--locale de` ile tek dil, `--keys prefix.` ile alt küme.
8. **Metin güvenliği** (next-intl / ICU):
   - `{name}` gibi yer tutucular ve `<b>…</b>` gibi zengin metin etiketleri DeepL'e `tag_handling=xml` + yer tutucuları `<x>{name}</x>` ile sarıp `ignore_tags=x` vererek korunur; dönüşte doğrulanır (yer tutucu kümesi kaynakla birebir aynı olmalı, değilse o anahtar yazılmaz ve raporlanır).
   - `plural` / `select` içeren ICU mesajları otomatik çevrilmez; listelenir ve elle çevrilir.
   - Marka ve terimler (ATS, ürün adı vb.) için çevirmeme listesi (veya DeepL sözlüğü).
   - Yazım: arayüz tonu AGENTS.md "Copy" kuralına uymalı (düz, abartısız); bu yüzden yazılan çeviriler commit öncesi diff olarak gözden geçirilir.
9. **Dokunulmayanlar**: `lib/i18n/coming-soon.ts` bilerek elle yazılmıştır; `lib/help/bank.ts` anahtar sözcükleri ve `login/messages.ts` kapsam dışı. `VERBATIM` listesindeki anahtarlar çevrilmez.

## Test (`tests/`, vitest; `vi.stubGlobal("fetch")`)
- `deepl-api.test.ts`: dil kodu eşleme, base URL seçimi (`:fx`), 429/456/403 durumları, anahtarın loglarda geçmemesi.
- `deepl-client.test.ts`: env yoksa `null`, asla throw yok.
- `blog-translate.test.ts`: draft olarak kaydeder, slug çakışmasında üzerine yazmaz, kod bloğu/URL korunur.
- `translate-messages-core.test.ts`: düzleştirme, eksik/değişen anahtar tespiti, yer tutucu korunumu ve doğrulaması, plural'ı atlama, mevcut çeviriyi ezmeme, dry-run'ın dosya yazmaması.
- `tests/messages.test.ts` mevcut haliyle yeşil kalmalı (script sonrası parite).

## Kritik dosyalar
- Yeni: `apps/web/lib/deepl/api.ts`, `apps/web/lib/deepl/client.ts`, `apps/web/lib/blog/translate.ts`, `apps/web/scripts/translate-messages.mjs` (+ core), `apps/web/messages/.deepl-state.json`, `apps/web/supabase/migrations/0007_*.sql`, ilgili testler.
- Değişen: `apps/web/.env.example`, `docker-compose.yml`, `apps/web/package.json` (script), admin eylem dosyası.
- Yeniden kullanılan: `lib/blog/schema.ts` (`slugify`, `BLOG_LOCALES`), `lib/supabase/blog.ts` (`savePost`), `lib/admin/guard.ts`, `i18n/routing.ts` (`routing.locales`).

## Doğrulama
- `npm run lint`, `npm run typecheck`, `npm test` temiz.
- Katalog: `en.json`'a deneme anahtarı ekle → `npm run translate:messages` (dry-run listeler) → `--write` ile tr/de'ye yazıldığını, yer tutucuların korunduğunu ve `tests/messages.test.ts`'in geçtiğini doğrula; deneme anahtarını geri al.
- Blog: bir taslak yazıyı tr→de çevir; DB'de `draft` olarak oluştuğunu ve Markdown yapısının (başlık, liste, link, kod) korunduğunu kontrol et.
- Anahtar yokken hem eylem hem script anlaşılır biçimde `env-missing` bildirir, çökmez.

## Açık sorular
- Blog'da tetikleyici: admin eylemi mi, CLI script mi?
- `blog.md` / elde hazır çevrilmiş bloglar veritabanına nasıl yüklenecek? (bu planın dışında)
- Çevirmeme listesi: marka/terim listesi nedir?
