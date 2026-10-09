import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

import { JsonLd } from "@/components/json-ld";
import { SiteCredit } from "@/components/site-credit";
import { type AppLocale } from "@/i18n/routing";
import { buildAiFaqJsonLd, pageAlternates } from "@/lib/seo";

const TITLE = "ATS Readability: full feature reference";
const DESCRIPTION =
  "Long-form description of every ATS Readability feature in Turkish, English and German, written for search and answer engines.";

interface AiFaqPageProps {
  readonly params: Promise<{ readonly locale: string }>;
}

export async function generateMetadata({ params }: AiFaqPageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: pageAlternates(locale as AppLocale, "/ai-faq")
  };
}

const SECTIONS = [
  { lang: "tr", id: "tr", name: "Türkçe" },
  { lang: "en", id: "en", name: "English" },
  { lang: "de", id: "de", name: "Deutsch" }
] as const;

export default async function AiFaqPage({ params }: AiFaqPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto w-full max-w-page px-4 py-8 sm:px-6">
      <JsonLd data={buildAiFaqJsonLd(locale as AppLocale, TITLE, DESCRIPTION, SECTIONS)} />
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-ink">{TITLE}</h1>
        <p className="mt-3 text-muted">{DESCRIPTION}</p>
        <nav aria-label="Language" className="mt-4 flex gap-4 text-sm">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`} hrefLang={section.lang} lang={section.lang}>
              {section.name}
            </a>
          ))}
        </nav>
      </header>
      {/* ===== TÜRKÇE ===== */}
      <article id="tr" lang="tr" className="prose prose-lg max-w-none">
        <h2>ATS Readability: Adayın İş Arama Sürecini Güçlendiren Özellikler</h2>

        <p>
          ATS Readability, iş arayan adayların CV&apos;lerini aday takip sistemlerinin (ATS) okuduğu
          şekilde görmelerini sağlayan ve iş arama sürecinin her aşamasında destek sunan kapsamlı
          bir platformdur. İşte adaylara sağladığı temel özellikler:
        </p>

        <h2>1. Detaylı CV Analizi ve Puanlama</h2>
        <p>Platform, CV&apos;nizi beş kritik boyutta 100 üzerinden puanlar:</p>
        <ul>
          <li>
            <strong>Okunabilirlik (25 puan):</strong> Metin katmanının çıkarılabilirliği. Sütunlar,
            tablolar, simge fontları ve bozuk kodlamalar bu boyutta değerlendirilir.
          </li>
          <li>
            <strong>Anahtar Kelime Eşleşmesi (25 puan):</strong> İş ilanından çıkarılan terimlerin
            CV&apos;deki kapsamı. Her terimin ilana olan merkeziyetine göre ağırlıklandırılır.
          </li>
          <li>
            <strong>Etki (20 puan):</strong> Sayısallaştırılmış sonuçlar ve sahiplenme fiilleri,
            sorumluluk doldurma metinlerine karşı ölçülür.
          </li>
          <li>
            <strong>Yapı (20 puan):</strong> Ayrıştırıcının alanlara eşleyebileceği başlıklar, ters
            sırada tarihli girişler, paragraflar yerine madde işaretleri.
          </li>
          <li>
            <strong>İletişim (10 puan):</strong> Ad, e-posta, telefon, konum ve profil bağlantısı.
          </li>
        </ul>
        <p>
          Her kaybedilen puan, hangi satırdan geldiğini ve yerine ne yazmanız gerektiğini söyleyen
          adlandırılmış bir bulguya bağlanır. Bulgular, en çok puan kazandıracak şekilde sıralanır.
        </p>

        <h2>2. Ayrıştırıcı Görünümü (Parser View)</h2>
        <p>
          CV&apos;nizin bir aday takip sistemi tarafından nasıl görüldüğünü gösterir. Bu özellik,
          adayların en çok merak ettiği soruları yanıtlar:
        </p>
        <ul>
          <li>Ayrıştırıcı başlığınızı ve tarihlerinizi doğru okudu mu?</li>
          <li>
            İsim, e-posta, telefon, konum ve bağlantılar gibi kimlik alanları bulundu mu, şüpheli
            mi yoksa eksik mi?
          </li>
          <li>Her deneyim girişi için pozisyon, şirket ve tarih aralığı nasıl görünüyor?</li>
          <li>Eğitim, beceriler ve diller doğru şekilde çıkarıldı mı?</li>
        </ul>
        <p>
          Her eksik veya şüpheli alan için okunabilir bir neden sunulur (örneğin, &quot;tarih
          aralığı iki sütuna bölünmüş görünüyor&quot;). Bir alana tıkladığınızda, ham metindeki
          ilgili satır vurgulanır.
        </p>

        <h2>3. İş İlanı Analizi</h2>
        <p>Bir iş ilanı eklediğinizde, platform ilanın kendisini de analiz eder:</p>
        <ul>
          <li>
            <strong>Gerekli ve tercih edilen beceriler:</strong> İlandaki becerilerin hangilerinin
            zorunlu, hangilerinin tercih edildiği ayrımı.
          </li>
          <li>
            <strong>Kıdem seviyesi:</strong> İlanın beklediği deneyim seviyesi.
          </li>
          <li>
            <strong>Dil gereksinimi:</strong> İlanın gerektirdiği diller.
          </li>
          <li>
            <strong>Konum/uzaktan çalışma:</strong> İşin çalışma modeli.
          </li>
          <li>
            <strong>Maaş bilgisi:</strong> Varsa maaş aralığı.
          </li>
          <li>
            <strong>Kırmızı bayraklar:</strong> Aşırı uzun beceri listeleri, kıdem seviyesiyle
            çelişen yıl gereksinimleri, belirsiz rol tanımı.
          </li>
          <li>
            <strong>Uygunluk kontrol listesi:</strong> Deterministik (AI olmadan) bir uygunluk
            kontrolü.
          </li>
          <li>
            <strong>Hayalet ilan kontrolü:</strong> İlanın gerçekten aktif olup olmadığını kontrol
            eder.
          </li>
        </ul>

        <h2>4. Çoklu Eşleştirme Modu</h2>
        <p>Aynı CV ve ilan için üç farklı eşleştirme modu sunar:</p>
        <ul>
          <li>
            <strong>Katı (Strict):</strong> Tam eşleşme, kelimesi kelimesine.
          </li>
          <li>
            <strong>Normalleştirilmiş (Normalized):</strong> Eşanlamlılar, kısaltmalar ve taksonomi
            kullanır.
          </li>
          <li>
            <strong>Anlamsal (Semantic):</strong> Tarayıcıda çalışan gömme (embedding) modeli ile
            anlamsal eşleşme.
          </li>
        </ul>
        <p>
          Her modun farklı sonuçlar ürettiğini ve bu farkın hangi terimlerden kaynaklandığını
          gösterir. Anlamsal eşleşmeler &quot;olası eşleşme&quot; olarak sunulur, kesin olarak değil.
        </p>

        <h2>5. Tailor Modu (CV Özelleştirme)</h2>
        <p>CV&apos;yi belirli bir iş ilanına göre özelleştirmek için kullanılır:</p>
        <ul>
          <li>
            <strong>Eksik terim kartları:</strong> İlanda geçen ancak CV&apos;de eksik olan
            terimler. Her kart, terimin ilanda nerede geçtiğini, ne kadar merkezi olduğunu ve
            CV&apos;de nereye eklenebileceğini gösterir.
          </li>
          <li>
            <strong>&quot;Bu beceriye sahibim&quot; kapısı:</strong> Hiçbir terim, adayın onayı
            olmadan CV&apos;ye eklenmez. Bu, platformun en önemli ilkelerinden biridir: adayın
            sahip olmadığı hiçbir beceri, deneyim veya sayı CV&apos;ye yazılmaz.
          </li>
          <li>
            <strong>Madde yeniden yazma:</strong> Mevcut madde işaretlerini yeniden ifade eder.
            Sayısal sonuçlar için yer tutucular (<code>[X%]</code>, <code>[N kişi]</code>) kullanır.
          </li>
          <li>
            <strong>Ön yazı yardımcısı:</strong> Aynı koruma kurallarıyla ön yazı taslağı oluşturur.
          </li>
          <li>
            <strong>Varyant karşılaştırması:</strong> Ana CV puanı ile özelleştirilmiş varyantın
            puanını yan yana gösterir.
          </li>
        </ul>

        <h2>6. Mülakat Hazırlığı</h2>
        <p>Mülakat aşamasına geçildiğinde kapsamlı bir hazırlık desteği sunar:</p>
        <ul>
          <li>
            <strong>STAR hikaye bankası:</strong> CV&apos;deki başarı maddelerinden Situation
            (Durum), Task (Görev), Action (Eylem), Result (Sonuç) kartları oluşturur. Hiçbir şey
            uydurulmaz, yalnızca CV&apos;de olan kullanılır.
          </li>
          <li>
            <strong>Şablon sorular:</strong> Yaygın mülakat soruları, hikaye kartlarıyla
            eşleştirilir. AI gerektirmez.
          </li>
          <li>
            <strong>İlana özel sorular:</strong> İlandan üretilen sorular (Layer 2/3 model
            gerektirir). Üretilen sorular, ilandaki terimlere atıfta bulunur.
          </li>
          <li>
            <strong>Pratik modu:</strong> Soru gösterilir, aday cevabını yazar ve sistem en uygun
            hikaye kartını önerir. Öneri, paylaşılan kelimelerle izlenebilir.
          </li>
        </ul>

        <h2>7. Başvuru Takibi (Kanban Panosu)</h2>
        <p>Her başvurunun nerede olduğunu takip etmek için bir Kanban panosu sunar:</p>
        <ul>
          <li>
            <strong>Aşamalar:</strong> Kaydedildi → Başvuruldu → Mülakat → Teklif/Reddedildi.
          </li>
          <li>
            <strong>Kart bağlantıları:</strong> İlan, kullanılan CV varyantı, başvuru anındaki
            puan, notlar ve iletişim bilgileri.
          </li>
          <li>
            <strong>Takip hatırlatmaları:</strong> Örneğin, &quot;7 gündür yanıt yok&quot;
            hatırlatmaları.
          </li>
          <li>
            <strong>CSV ve JSON dışa aktarma:</strong> Verilerinizi istediğiniz zaman dışa
            aktarabilirsiniz.
          </li>
          <li>
            <strong>Tek tıkla silme:</strong> Tüm verileri yerel olarak kaldırır.
          </li>
        </ul>
        <p>Pano cihazınızda durur ve hesabınızla senkronize edilir.</p>

        <h2>8. ATS Uyumlu CV Oluşturucu</h2>
        <p>Platform, yalnızca analiz yapmaz; aynı zamanda ATS uyumlu CV&apos;ler oluşturmanıza yardımcı olur:</p>
        <ul>
          <li>
            <strong>JSON Resume şeması:</strong> İçe ve dışa aktarma için standart bir format.
          </li>
          <li>
            <strong>Düzenleyici formu:</strong> Her alan düzenlenebilir.
          </li>
          <li>
            <strong>Şablonlar:</strong> Yoğun, sade ve modern PDF şablonları.
          </li>
          <li>
            <strong>Kapalı döngü doğrulama:</strong> Her dışa aktarım, kendi ayrıştırıcımızdan
            geçer ve sonuç kullanıcıya gösterilir. CI testleri, tüm şablonların Okunabilirlik
            25/25 puan aldığını doğrular.
          </li>
          <li>
            <strong>DOCX dışa aktarma:</strong> Word ve LibreOffice&apos;te doğru açılır.
          </li>
          <li>
            <strong>Mevcut CV&apos;yi içe aktar:</strong> PDF veya DOCX&apos;i düzenleyiciye
            aktarın; çıkarılamayan alanlar manuel tamamlama için işaretlenir, hiçbir zaman
            uydurulmaz.
          </li>
        </ul>

        <h2>9. LinkedIn Tutarlılık Kontrolü</h2>
        <p>
          LinkedIn&apos;in &quot;PDF olarak kaydet&quot; dışa aktarımını analiz eder ve CV ile
          LinkedIn profili arasındaki tutarsızlıkları raporlar:
        </p>
        <ul>
          <li>Tarih uyumsuzlukları.</li>
          <li>Farklı unvanlar.</li>
          <li>CV&apos;de olan ancak profilde olmayan beceriler.</li>
          <li>Hedef role karşı başlık kontrolü.</li>
        </ul>
        <p>Her tutarsızlık, her iki kaynağı da alıntılar.</p>

        <h2>10. Çoklu Dil Desteği</h2>
        <p>Platform, İngilizce, Türkçe ve Almanca dillerinde tam olarak çalışır:</p>
        <ul>
          <li>
            <strong>Türkçe kök alma (stemming):</strong> Anahtar kelime eşleştirmede Snowball
            Türkçe kök alıcı.
          </li>
          <li>
            <strong>Almanca bileşik bölme:</strong> &quot;Softwareentwicklung&quot; →
            &quot;Software&quot; + &quot;Entwicklung&quot;.
          </li>
          <li>
            <strong>Dile özgü durak sözcükler:</strong> Her dil için optimize edilmiş.
          </li>
          <li>
            <strong>Kodlama bozulması kontrolü:</strong> Bozuk{" "}
            <code>ı İ ş ğ ç ö ü ä ß</code> karakterleri Okunabilirlik bulgusu olarak raporlanır.
          </li>
          <li>
            <strong>Tarih formatları:</strong> &quot;Oca 2022&quot;, &quot;Ocak 2022&quot;,
            &quot;01.2022&quot;, &quot;Jan. 2022&quot;, &quot;März 2022&quot;, &quot;heute&quot;,
            &quot;halen&quot;, &quot;devam ediyor&quot;.
          </li>
          <li>
            <strong>Pazar bazlı tavsiyeler:</strong> Fotoğraf, doğum tarihi, medeni hal, askerlik
            durumu hedef pazara göre.
          </li>
          <li>
            <strong>Europass algılama:</strong> Europass düzenleri tanınır ve uyarılır.
          </li>
        </ul>

        <h2>11. AI Destekli Düzeltmeler</h2>
        <p>Platform, AI&apos;yı açıklayıcı ve önerici olarak kullanır, ancak puanlama tamamen deterministiktir:</p>
        <ul>
          <li>
            <strong>Yerel model (Layer 1):</strong> Tarayıcıda çalışan gömme modeli ile anlamsal
            eşleştirme.
          </li>
          <li>
            <strong>Kullanıcının kendi Ollama&apos;sı (Layer 2):</strong> Kullanıcının makinesinde
            çalışan model ile madde yeniden yazma, açıklama, ön yazı ve mülakat soruları.
          </li>
          <li>
            <strong>BYOK (Layer 3):</strong> Kullanıcının kendi API anahtarı ile daha güçlü
            modeller. API anahtarı tarayıcıda tutulur, sunucuya asla gönderilmez.
          </li>
          <li>
            <strong>Şema doğrulama:</strong> Tüm LLM çıktıları bir JSON şemasına karşı doğrulanır.
            Şemayı geçemeyen çıktı kullanıcıya gösterilmez.
          </li>
        </ul>
        <p>
          Her AI çıktısı, CV&apos;den uydurma sayı, teknoloji veya organizasyon içerip içermediğini
          kontrol eden bir grounding (dayanak) kontrolünden geçer.
        </p>

        <h2>12. Rapor Paylaşımı ve Dışa Aktarma</h2>
        <ul>
          <li>
            <strong>PDF raporu:</strong> Analiz raporunu PDF olarak indirebilirsiniz.
          </li>
          <li>
            <strong>Paylaşım bağlantıları:</strong> Puanları ve önerileri saklar, ancak CV&apos;den
            hiçbir satır içermez. Bağlantılar 30 gün sonra sona erer.
          </li>
          <li>
            <strong>Markdown raporu:</strong> Raporu Markdown formatında dışa aktarabilirsiniz.
          </li>
        </ul>

        <h2>13. Gizlilik ve Veri Saklama</h2>
        <p>Platform, gizliliği ciddiye alır:</p>
        <ul>
          <li>CV önce tarayıcınızda okunur ve puanlanır.</li>
          <li>Analiz ettiğinizde dosya, metni ve sonuç sunucuya gönderilir ve 12 ay saklanır.</li>
          <li>
            12 ay sonra dosya, çıkarılan metin ve analiz sonucu veritabanından, depolamadan ve
            Google Drive yedeğinden silinir.
          </li>
          <li>
            Paylaşım bağlantıları, kanıtları (evidence) çıkarılmış olarak saklanır, çünkü kanıtlar
            belgeden alınmış satırlar içerebilir.
          </li>
          <li>Veri talep formu ile silme talebinde bulunabilirsiniz.</li>
        </ul>

        <h2>14. Oturum Geçmişi ve İlerleme Takibi</h2>
        <ul>
          <li>
            <strong>Oturum puan geçmişi:</strong> Oturum boyunca puanın değişimini gösteren bir
            grafik.
          </li>
          <li>
            <strong>Değişiklik başına delta:</strong> Her değişiklik için &quot;+4 · Anahtar kelime
            eşleşmesi&quot; gibi hangi bulgunun kapatıldığını gösteren bir not.
          </li>
          <li>
            <strong>Önceki ziyaret karşılaştırması:</strong> İkinci bir ziyaret, önceki ziyarete
            göre değişimi gösterir.
          </li>
        </ul>

        <h2>15. Yardım Sistemi</h2>
        <ul>
          <li>
            <strong>Anahtar kelime tabanlı yardım:</strong> Site yardımcısı bir anahtar kelime
            bankasından yanıtlar, hiçbir zaman sunucuya veri göndermez, hiçbir şey saklamaz.
          </li>
          <li>
            <strong>Bağlam duyarlı yanıtlar:</strong> Yardım sistemi, mevcut analiz sonucuna göre
            yanıtlar verir.
          </li>
        </ul>

        <h2>Sonuç</h2>
        <p>ATS Readability, iş aramanın tüm döngüsünü tek bir yerde çalıştırır:</p>
        <pre>
          CV Oluştur ──► Ayrıştırıcıda Test Et ──► İlana Göre Özelleştir ──► Başvur ve Takip Et
          ──► Mülakata Hazırlan
          {"    "}▲{"                                                                                      "}│
          {"    "}└──────────────────────────────────── geri bildirim
          ◄──────────────────────────────────┘
        </pre>
        <p>
          Platform, adayın sahip olmadığı hiçbir beceriyi uydurmaz, her kaybedilen puanı açıklar ve
          deterministik motoru merkeze koyar. AI, açıklamak ve önermek için vardır; puanlamaya asla
          müdahale etmez. Bu, adayın hem CV&apos;sini iyileştirmesine hem de iş arama sürecini
          sistematik olarak yönetmesine yardımcı olur.
        </p>
      </article>

      <hr className="my-12 border-line" />

      {/* ===== ENGLISH ===== */}
      <article id="en" lang="en" className="prose prose-lg max-w-none">
        <h2>ATS Readability: Features That Empower Candidates in Their Job Search</h2>

        <p>
          ATS Readability is a comprehensive platform that helps job seekers see their CVs the way
          applicant tracking systems (ATS) read them, and supports every stage of the job search
          process. Here are the key features it provides for candidates:
        </p>

        <h2>1. Detailed CV Analysis and Scoring</h2>
        <p>The platform scores your CV across five critical dimensions out of 100:</p>
        <ul>
          <li>
            <strong>Parseability (25 points):</strong> Whether the text layer survives extraction.
            Columns, tables, icon fonts, and broken encodings are evaluated in this dimension.
          </li>
          <li>
            <strong>Keyword Match (25 points):</strong> Coverage of terms mined from the job ad.
            Each term is weighted by how central it is to the posting.
          </li>
          <li>
            <strong>Impact (20 points):</strong> Quantified results and ownership verbs, measured
            against responsibility filler text.
          </li>
          <li>
            <strong>Structure (20 points):</strong> Headings a parser can map to fields, dated
            entries in reverse order, bullets over paragraphs.
          </li>
          <li>
            <strong>Contact (10 points):</strong> Name, email, phone, location, and profile links.
          </li>
        </ul>
        <p>
          Every lost point is tied to a named finding that states which line it came from and what
          to write instead. Findings are ranked by the points they would recover.
        </p>

        <h2>2. Parser View</h2>
        <p>
          Shows how your CV is seen by an applicant tracking system. This feature answers the
          questions candidates ask most:
        </p>
        <ul>
          <li>Did the parser read your title and dates correctly?</li>
          <li>
            Were identity fields such as name, email, phone, location, and links found, suspect,
            or missing?
          </li>
          <li>How does each experience entry look — position, company, and date range?</li>
          <li>Were education, skills, and languages extracted correctly?</li>
        </ul>
        <p>
          Every missing or suspect field comes with a readable cause (e.g., &quot;the date range
          looks split across two columns&quot;). Clicking a field highlights its line in the raw
          text.
        </p>

        <h2>3. Job Ad Analysis</h2>
        <p>When you add a job ad, the platform analyses the ad itself:</p>
        <ul>
          <li>
            <strong>Required and preferred skills:</strong> Which skills are mandatory vs. nice to
            have.
          </li>
          <li>
            <strong>Seniority level:</strong> The experience level the posting expects.
          </li>
          <li>
            <strong>Language requirement:</strong> Languages the ad requires.
          </li>
          <li>
            <strong>Location / remote:</strong> The working model of the job.
          </li>
          <li>
            <strong>Salary info:</strong> Salary range if present.
          </li>
          <li>
            <strong>Red flags:</strong> Overly long skill lists, years-of-experience requirements
            that contradict the seniority, vague role definitions.
          </li>
          <li>
            <strong>Eligibility checklist:</strong> A deterministic (no AI) eligibility check.
          </li>
          <li>
            <strong>Ghost posting check:</strong> Verifies whether the ad is genuinely active.
          </li>
        </ul>

        <h2>4. Multi-Mode Matching</h2>
        <p>Three different matching modes for the same CV and ad:</p>
        <ul>
          <li>
            <strong>Strict:</strong> Exact, word-for-word matching.
          </li>
          <li>
            <strong>Normalized:</strong> Uses synonyms, abbreviations, and taxonomy.
          </li>
          <li>
            <strong>Semantic:</strong> Embedding-based semantic matching running in the browser.
          </li>
        </ul>
        <p>
          Shows how each mode produces different results and which terms account for the difference.
          Semantic hits are presented as &quot;possible match&quot;, never as confirmed.
        </p>

        <h2>5. Tailor Mode (CV Customisation)</h2>
        <p>Used to customise the CV for a specific job ad:</p>
        <ul>
          <li>
            <strong>Missing term cards:</strong> Terms in the ad that are absent from the CV. Each
            card shows where the term appears in the ad, how central it is, and where it could be
            added in the CV.
          </li>
          <li>
            <strong>&quot;I have this skill&quot; gate:</strong> No term enters the CV without
            the candidate&apos;s confirmation. This is one of the platform&apos;s core principles:
            no skill, experience, or number the candidate does not have may be written in.
          </li>
          <li>
            <strong>Bullet rewriting:</strong> Rephrases existing bullets only. Uses placeholders
            (<code>[X%]</code>, <code>[N people]</code>) where a measurable result is missing.
          </li>
          <li>
            <strong>Cover letter helper:</strong> Drafts a cover letter with the same guardrails.
          </li>
          <li>
            <strong>Variant comparison:</strong> Shows the master CV score alongside the tailored
            variant score.
          </li>
        </ul>

        <h2>6. Interview Preparation</h2>
        <p>When you reach the interview stage, comprehensive preparation support:</p>
        <ul>
          <li>
            <strong>STAR story bank:</strong> Situation, Task, Action, Result cards built from CV
            achievement bullets. Nothing is invented — only what is in the CV is used.
          </li>
          <li>
            <strong>Template questions:</strong> Common interview questions mapped to story cards.
            No AI required.
          </li>
          <li>
            <strong>Ad-specific questions:</strong> Questions generated from the ad (requires Layer
            2/3 model). Generated questions reference terms from the ad.
          </li>
          <li>
            <strong>Practice mode:</strong> A question is shown, the candidate writes an answer,
            and the system suggests the most relevant story card. The suggestion is traceable
            through shared words.
          </li>
        </ul>

        <h2>7. Application Tracker (Kanban Board)</h2>
        <p>A Kanban board to track where each application stands:</p>
        <ul>
          <li>
            <strong>Stages:</strong> Saved → Applied → Interview → Offer/Rejected.
          </li>
          <li>
            <strong>Card links:</strong> The ad, the CV variant used, the score at the time of
            applying, notes, and contact details.
          </li>
          <li>
            <strong>Follow-up reminders:</strong> E.g. &quot;no reply for 7 days&quot; reminders.
          </li>
          <li>
            <strong>CSV and JSON export:</strong> Export your data at any time.
          </li>
          <li>
            <strong>One-click deletion:</strong> Removes all data locally.
          </li>
        </ul>
        <p>The board lives on your device and syncs with your account.</p>

        <h2>8. ATS-Safe CV Builder</h2>
        <p>The platform doesn&apos;t just analyse — it also helps you build ATS-safe CVs:</p>
        <ul>
          <li>
            <strong>JSON Resume schema:</strong> A standard format for import and export.
          </li>
          <li>
            <strong>Editor form:</strong> Every field is editable.
          </li>
          <li>
            <strong>Templates:</strong> Dense, plain, and modern PDF templates.
          </li>
          <li>
            <strong>Closed-loop validation:</strong> Every export runs through our own parser and
            the result is shown to the user. CI tests assert all templates score Parseability
            25/25.
          </li>
          <li>
            <strong>DOCX export:</strong> Opens correctly in Word and LibreOffice.
          </li>
          <li>
            <strong>Import an existing CV:</strong> Parse a PDF or DOCX into the editor;
            unextractable fields are flagged for manual completion, never invented.
          </li>
        </ul>

        <h2>9. LinkedIn Consistency Check</h2>
        <p>
          Analyses the LinkedIn &quot;Save as PDF&quot; export and reports inconsistencies between
          the CV and the LinkedIn profile:
        </p>
        <ul>
          <li>Date mismatches.</li>
          <li>Differing titles.</li>
          <li>Skills in the CV but not on the profile.</li>
          <li>Headline checked against the target role.</li>
        </ul>
        <p>Each inconsistency cites both sources.</p>

        <h2>10. Multilingual Support</h2>
        <p>The platform works fully in English, Turkish, and German:</p>
        <ul>
          <li>
            <strong>Turkish stemming:</strong> Snowball Turkish stemmer in keyword matching.
          </li>
          <li>
            <strong>German compound splitting:</strong> &quot;Softwareentwicklung&quot; →
            &quot;Software&quot; + &quot;Entwicklung&quot;.
          </li>
          <li>
            <strong>Per-language stopwords:</strong> Optimised for each language.
          </li>
          <li>
            <strong>Encoding corruption check:</strong> Garbled{" "}
            <code>ı İ ş ğ ç ö ü ä ß</code> characters are reported as a Parseability finding.
          </li>
          <li>
            <strong>Date formats:</strong> &quot;Oca 2022&quot;, &quot;Ocak 2022&quot;,
            &quot;01.2022&quot;, &quot;Jan. 2022&quot;, &quot;März 2022&quot;, &quot;heute&quot;,
            &quot;halen&quot;, &quot;devam ediyor&quot;.
          </li>
          <li>
            <strong>Market-based advice:</strong> Photo, date of birth, marital status, military
            service — by target market.
          </li>
          <li>
            <strong>Europass detection:</strong> Europass layouts are recognised and warned about.
          </li>
        </ul>

        <h2>11. AI-Assisted Fixes</h2>
        <p>The platform uses AI as advisory, but scoring is fully deterministic:</p>
        <ul>
          <li>
            <strong>Local model (Layer 1):</strong> Embedding-based semantic matching running in
            the browser.
          </li>
          <li>
            <strong>User&apos;s own Ollama (Layer 2):</strong> Model running on the user&apos;s
            machine for bullet rewriting, explanation, cover letters, and interview questions.
          </li>
          <li>
            <strong>BYOK (Layer 3):</strong> Stronger models with the user&apos;s own API key. The
            key is held in the browser and never sent to our server.
          </li>
          <li>
            <strong>Schema validation:</strong> All LLM outputs are validated against a JSON
            schema. Output that fails its schema is never shown.
          </li>
        </ul>
        <p>
          Every AI output passes through a grounding check that verifies whether it contains
          invented numbers, technologies, or organisations not present in the CV.
        </p>

        <h2>12. Report Sharing and Export</h2>
        <ul>
          <li>
            <strong>PDF report:</strong> Download the analysis report as a PDF.
          </li>
          <li>
            <strong>Share links:</strong> Persist scores and recommendations but contain no lines
            from the CV. Links expire after 30 days.
          </li>
          <li>
            <strong>Markdown report:</strong> Export the report in Markdown format.
          </li>
        </ul>

        <h2>13. Privacy and Data Retention</h2>
        <p>The platform takes privacy seriously:</p>
        <ul>
          <li>The CV is first read and scored in the browser.</li>
          <li>When analysed, the file, its text, and the result are sent to the server and kept for 12 months.</li>
          <li>
            After 12 months the file, extracted text, and analysis result are deleted from the
            database, storage, and Google Drive backup.
          </li>
          <li>
            Share links persist scores and findings with evidence stripped, because evidence can
            contain lines lifted from the document.
          </li>
          <li>You can request deletion via the data request form.</li>
        </ul>

        <h2>14. Session History and Progress Tracking</h2>
        <ul>
          <li>
            <strong>Session score history:</strong> A plot of the score across the session.
          </li>
          <li>
            <strong>Per-change delta:</strong> A note for each change such as &quot;+4 · Keyword
            match&quot; showing which finding was closed.
          </li>
          <li>
            <strong>Previous visit comparison:</strong> A second visit shows the delta against the
            previous visit.
          </li>
        </ul>

        <h2>15. Help System</h2>
        <ul>
          <li>
            <strong>Keyword-based help:</strong> The site helper answers from a keyword bank, never
            sends data to a server, never stores anything.
          </li>
          <li>
            <strong>Context-aware answers:</strong> The help system responds based on the current
            analysis result.
          </li>
        </ul>

        <h2>Conclusion</h2>
        <p>ATS Readability runs the candidate&apos;s whole job-search loop in one place:</p>
        <pre>
          Build a CV ──► Test it against a parser ──► Tailor it to an ad ──► Apply and track ──►
          Prepare to interview
          {"    "}▲{"                                                                                      "}│
          {"    "}└──────────────────────────────────── feedback
          ◄──────────────────────────────────┘
        </pre>
        <p>
          The platform never invents a skill the candidate does not have, explains every lost
          point, and keeps the deterministic engine at the centre. AI is there to explain and
          suggest — it never touches the score. This helps the candidate both improve their CV and
          manage the job search process systematically.
        </p>
      </article>

      <hr className="my-12 border-line" />

      {/* ===== DEUTSCH ===== */}
      <article id="de" lang="de" className="prose prose-lg max-w-none">
        <h2>ATS Readability: Funktionen, die Bewerber im Jobsearch stärken</h2>

        <p>
          ATS Readability ist eine umfassende Plattform, die Bewerbern hilft, ihre Lebensläufe so
          zu sehen, wie Applicant Tracking Systems (ATS) sie lesen, und unterstützt jede Phase des
          Bewerbungsprozesses. Hier sind die wichtigsten Funktionen für Bewerber:
        </p>

        <h2>1. Detaillierte CV-Analyse und Bewertung</h2>
        <p>Die Plattform bewertet Ihren Lebenslauf in fünf kritischen Dimensionen mit insgesamt 100 Punkten:</p>
        <ul>
          <li>
            <strong>Lesbarkeit (25 Punkte):</strong> Ob die Textschicht die Extraktion übersteht.
            Spalten, Tabellen, Icon-Schriften und fehlerhafte Kodierungen werden in dieser
            Dimension bewertet.
          </li>
          <li>
            <strong>Keyword-Übereinstimmung (25 Punkte):</strong> Abdeckung der aus der
            Stellenanzeige extrahierten Begriffe. Jeder Begriff wird nach seiner Zentralität für
            die Anzeige gewichtet.
          </li>
          <li>
            <strong>Wirkung (20 Punkte):</strong> Quantifizierte Ergebnisse und
            Verantwortungs-Verben, gemessen an Fülltexten ohne Substanz.
          </li>
          <li>
            <strong>Struktur (20 Punkte):</strong> Überschriften, die ein Parser Feldern zuordnen
            kann, datierte Einträge in umgekehrter Reihenfolge, Aufzählungspunkte statt Absätze.
          </li>
          <li>
            <strong>Kontakt (10 Punkte):</strong> Name, E-Mail, Telefon, Standort und Profil-Links.
          </li>
        </ul>
        <p>
          Jeder verlorene Punkt ist an einen benannten Befund gebunden, der angibt, aus welcher
          Zeile er stammt und was stattdessen geschrieben werden soll. Befunde werden nach dem
          Punktenwert sortiert, den sie wiederherstellen würden.
        </p>

        <h2>2. Parser-Ansicht</h2>
        <p>
          Zeigt, wie Ihr Lebenslauf von einem Applicant Tracking System gesehen wird. Diese
          Funktion beantwortet die Fragen, die Bewerber am häufigsten stellen:
        </p>
        <ul>
          <li>Hat der Parser Ihre Überschrift und Daten korrekt gelesen?</li>
          <li>
            Wurden Identitätsfelder wie Name, E-Mail, Telefon, Standort und Links gefunden, sind
            sie verdächtig oder fehlen sie?
          </li>
          <li>Wie sieht jeder Erfahrungseintrag aus — Position, Unternehmen und Zeitraum?</li>
          <li>Wurden Ausbildung, Fähigkeiten und Sprachen korrekt extrahiert?</li>
        </ul>
        <p>
          Jedes fehlende oder verdächtige Feld enthält eine lesbare Ursache (z.&nbsp;B. &quot;der
          Zeitraum scheint über zwei Spalten aufgeteilt&quot;). Ein Klick auf ein Feld hebt seine
          Zeile im Rohtext hervor.
        </p>

        <h2>3. Stellenanzeigen-Analyse</h2>
        <p>Wenn Sie eine Stellenanzeige hinzufügen, analysiert die Plattform die Anzeige selbst:</p>
        <ul>
          <li>
            <strong>Erforderliche und bevorzugte Fähigkeiten:</strong> Welche Fähigkeiten
            obligatorisch sind und welche nice-to-have.
          </li>
          <li>
            <strong>Erfahrungsstufe:</strong> Das von der Anzeige erwartete Erfahrungslevel.
          </li>
          <li>
            <strong>Sprachanforderung:</strong> Von der Anzeige geforderte Sprachen.
          </li>
          <li>
            <strong>Standort / Remote:</strong> Das Arbeitsmodell der Stelle.
          </li>
          <li>
            <strong>Gehaltsinformation:</strong> Gehaltsspanne, falls vorhanden.
          </li>
          <li>
            <strong>Red Flags:</strong> Übermäßig lange Skill-Listen, Erfahrungsanforderungen, die
            der Seniorität widersprechen, vage Rollendefinitionen.
          </li>
          <li>
            <strong>Eignungs-Checkliste:</strong> Eine deterministische (ohne KI) Eignungsprüfung.
          </li>
          <li>
            <strong>Ghost-Posting-Prüfung:</strong> Überprüft, ob die Anzeige tatsächlich aktiv
            ist.
          </li>
        </ul>

        <h2>4. Multi-Mode-Matching</h2>
        <p>Drei verschiedene Matching-Modi für denselben Lebenslauf und dieselbe Anzeige:</p>
        <ul>
          <li>
            <strong>Strict:</strong> Exaktes, wortwörtliches Matching.
          </li>
          <li>
            <strong>Normalized:</strong> Verwendet Synonyme, Abkürzungen und Taxonomie.
          </li>
          <li>
            <strong>Semantic:</strong> Embedding-basiertes semantisches Matching, das im Browser
            läuft.
          </li>
        </ul>
        <p>
          Zeigt, wie jeder Modus unterschiedliche Ergebnisse produziert und welche Begriffe den
          Unterschied ausmachen. Semantische Treffer werden als &quot;mögliche Übereinstimmung&quot;
          dargestellt, niemals als bestätigt.
        </p>

        <h2>5. Tailor-Modus (CV-Anpassung)</h2>
        <p>Wird verwendet, um den Lebenslauf an eine bestimmte Stellenanzeige anzupassen:</p>
        <ul>
          <li>
            <strong>Fehlende-Begriff-Karten:</strong> Begriffe in der Anzeige, die im Lebenslauf
            fehlen. Jede Karte zeigt, wo der Begriff in der Anzeige vorkommt, wie zentral er ist
            und wo er im Lebenslauf hinzugefügt werden könnte.
          </li>
          <li>
            <strong>&quot;Ich habe diese Fähigkeit&quot;-Schranke:</strong> Kein Begriff gelangt
            ohne die Bestätigung des Bewerbers in den Lebenslauf. Dies ist eines der
            Kernprinzipien der Plattform: Keine Fähigkeit, Erfahrung oder Zahl, die der Bewerber
            nicht hat, darf eingetragen werden.
          </li>
          <li>
            <strong>Bullet-Rewriting:</strong> Formuliert bestehende Bulletpoints um. Verwendet
            Platzhalter (<code>[X%]</code>, <code>[N Personen]</code>), wo ein messbares Ergebnis
            fehlt.
          </li>
          <li>
            <strong>Anschreiben-Helfer:</strong> Erstellt ein Anschreiben mit denselben
            Schutzvorkehrungen.
          </li>
          <li>
            <strong>Variantenvergleich:</strong> Zeigt die Master-CV-Bewertung neben der Bewertung
            der angepassten Variante.
          </li>
        </ul>

        <h2>6. Vorstellungsgespräch-Vorbereitung</h2>
        <p>Wenn Sie die Interviewphase erreichen, umfassende Vorbereitungshilfe:</p>
        <ul>
          <li>
            <strong>STAR-Story-Bank:</strong> Situation-, Task-, Action-, Result-Karten aus den
            Erfolgs-Bulletpoints des Lebenslaufs. Nichts wird erfunden — es wird nur verwendet,
            was im Lebenslauf steht.
          </li>
          <li>
            <strong>Vorlagenfragen:</strong> Häufige Interviewfragen, die Story-Karten zugeordnet
            sind. Keine KI erforderlich.
          </li>
          <li>
            <strong>Anzeigenspezifische Fragen:</strong> Aus der Anzeige generierte Fragen
            (erfordert Layer-2/3-Modell). Generierte Fragen beziehen sich auf Begriffe aus der
            Anzeige.
          </li>
          <li>
            <strong>Übungsmodus:</strong> Eine Frage wird angezeigt, der Bewerber schreibt eine
            Antwort, und das System schlägt die passendste Story-Karte vor. Der Vorschlag ist über
            gemeinsame Wörter nachvollziehbar.
          </li>
        </ul>

        <h2>7. Bewerbungs-Tracker (Kanban-Board)</h2>
        <p>Ein Kanban-Board, um den Stand jeder Bewerbung zu verfolgen:</p>
        <ul>
          <li>
            <strong>Phasen:</strong> Gespeichert → Beworben → Interview → Angebot/Abgelehnt.
          </li>
          <li>
            <strong>Karten-Links:</strong> Die Anzeige, die verwendete CV-Variante, die Bewertung
            zum Zeitpunkt der Bewerbung, Notizen und Kontaktdaten.
          </li>
          <li>
            <strong>Follow-up-Erinnerungen:</strong> Z.&nbsp;B. &quot;seit 7 Tagen keine
            Antwort&quot;-Erinnerungen.
          </li>
          <li>
            <strong>CSV- und JSON-Export:</strong> Exportieren Sie Ihre Daten jederzeit.
          </li>
          <li>
            <strong>Ein-Klick-Löschung:</strong> Entfernt alle Daten lokal.
          </li>
        </ul>
        <p>Das Board lebt auf Ihrem Gerät und synchronisiert sich mit Ihrem Konto.</p>

        <h2>8. ATS-sicherer CV-Builder</h2>
        <p>Die Plattform analysiert nicht nur — sie hilft auch beim Erstellen ATS-sicherer Lebensläufe:</p>
        <ul>
          <li>
            <strong>JSON-Resume-Schema:</strong> Ein Standardformat für Import und Export.
          </li>
          <li>
            <strong>Editor-Formular:</strong> Jedes Feld ist bearbeitbar.
          </li>
          <li>
            <strong>Vorlagen:</strong> Dichte, einfache und moderne PDF-Vorlagen.
          </li>
          <li>
            <strong>Closed-Loop-Validierung:</strong> Jeder Export läuft durch unseren eigenen
            Parser und das Ergebnis wird dem Benutzer angezeigt. CI-Tests stellen sicher, dass
            alle Vorlagen Lesbarkeit 25/25 erreichen.
          </li>
          <li>
            <strong>DOCX-Export:</strong> Öffnet korrekt in Word und LibreOffice.
          </li>
          <li>
            <strong>Bestehenden CV importieren:</strong> PDF oder DOCX in den Editor parsen; nicht
            extrahierbare Felder werden zur manuellen Vervollständigung markiert, niemals erfunden.
          </li>
        </ul>

        <h2>9. LinkedIn-Konsistenzprüfung</h2>
        <p>
          Analysiert den LinkedIn-&quot;Als PDF speichern&quot;-Export und meldet
          Unstimmigkeiten zwischen Lebenslauf und LinkedIn-Profil:
        </p>
        <ul>
          <li>Datum-Unstimmigkeiten.</li>
          <li>Abweichende Titel.</li>
          <li>Fähigkeiten im Lebenslauf, aber nicht im Profil.</li>
          <li>Überschrift gegen die Zielrolle geprüft.</li>
        </ul>
        <p>Jede Unstimmigkeit zitiert beide Quellen.</p>

        <h2>10. Mehrsprachige Unterstützung</h2>
        <p>Die Plattform funktioniert vollständig auf Englisch, Türkisch und Deutsch:</p>
        <ul>
          <li>
            <strong>Türkisches Stemming:</strong> Snowball-Türkisch-Stemmer im Keyword-Matching.
          </li>
          <li>
            <strong>Deutsche Komposita-Zerlegung:</strong> &quot;Softwareentwicklung&quot; →
            &quot;Software&quot; + &quot;Entwicklung&quot;.
          </li>
          <li>
            <strong>Sprachspezifische Stoppwörter:</strong> Für jede Sprache optimiert.
          </li>
          <li>
            <strong>Kodierungs-Korruptionsprüfung:</strong> Fehlerhafte{" "}
            <code>ı İ ş ğ ç ö ü ä ß</code>-Zeichen werden als Lesbarkeits-Befund gemeldet.
          </li>
          <li>
            <strong>Datumsformate:</strong> &quot;Oca 2022&quot;, &quot;Ocak 2022&quot;,
            &quot;01.2022&quot;, &quot;Jan. 2022&quot;, &quot;März 2022&quot;, &quot;heute&quot;,
            &quot;halen&quot;, &quot;devam ediyor&quot;.
          </li>
          <li>
            <strong>Marktbasierte Beratung:</strong> Foto, Geburtsdatum, Familienstand,
            Militärdienst — nach Zielmarkt.
          </li>
          <li>
            <strong>Europass-Erkennung:</strong> Europass-Layouts werden erkannt und es wird
            gewarnt.
          </li>
        </ul>

        <h2>11. KI-gestützte Korrekturen</h2>
        <p>Die Plattform nutzt KI als Berater, aber die Bewertung ist vollständig deterministisch:</p>
        <ul>
          <li>
            <strong>Lokales Modell (Layer 1):</strong> Embedding-basiertes semantisches Matching,
            das im Browser läuft.
          </li>
          <li>
            <strong>Eigenes Ollama des Benutzers (Layer 2):</strong> Modell, das auf dem Rechner
            des Benutzers läuft, für Bullet-Rewriting, Erklärungen, Anschreiben und
            Interviewfragen.
          </li>
          <li>
            <strong>BYOK (Layer 3):</strong> Stärkere Modelle mit dem eigenen API-Schlüssel des
            Benutzers. Der Schlüssel wird im Browser gehalten und niemals an unseren Server
            gesendet.
          </li>
          <li>
            <strong>Schema-Validierung:</strong> Alle LLM-Ausgaben werden gegen ein JSON-Schema
            validiert. Ausgaben, die das Schema nicht erfüllen, werden niemals angezeigt.
          </li>
        </ul>
        <p>
          Jede KI-Ausgabe durchläuft eine Grounding-Prüfung, die überprüft, ob sie erfundene
          Zahlen, Technologien oder Organisationen enthält, die nicht im Lebenslauf vorhanden sind.
        </p>

        <h2>12. Berichts-Freigabe und Export</h2>
        <ul>
          <li>
            <strong>PDF-Bericht:</strong> Laden Sie den Analysebericht als PDF herunter.
          </li>
          <li>
            <strong>Freigabe-Links:</strong> Speichernen Bewertungen und Empfehlungen, enthalten
            aber keine Zeilen aus dem Lebenslauf. Links laufen nach 30 Tagen ab.
          </li>
          <li>
            <strong>Markdown-Bericht:</strong> Exportieren Sie den Bericht im Markdown-Format.
          </li>
        </ul>

        <h2>13. Datenschutz und Datenaufbewahrung</h2>
        <p>Die Plattform nimmt Datenschutz ernst:</p>
        <ul>
          <li>Der Lebenslauf wird zuerst im Browser gelesen und bewertet.</li>
          <li>Bei der Analyse werden Datei, Text und Ergebnis an den Server gesendet und 12 Monate aufbewahrt.</li>
          <li>
            Nach 12 Monaten werden Datei, extrahierter Text und Analyseergebnis aus der Datenbank,
            dem Speicher und dem Google-Drive-Backup gelöscht.
          </li>
          <li>
            Freigabe-Links speichernen Bewertungen und Befunde mit entfernten Nachweisen, da
            Nachweise Zeilen aus dem Dokument enthalten können.
          </li>
          <li>Sie können Löschung über das Datenanforderungsformular beantragen.</li>
        </ul>

        <h2>14. Sitzungsverlauf und Fortschrittsverfolgung</h2>
        <ul>
          <li>
            <strong>Sitzungs-Bewertungsverlauf:</strong> Ein Diagramm der Bewertung über die
            Sitzung.
          </li>
          <li>
            <strong>Delta pro Änderung:</strong> Eine Notiz für jede Änderung wie &quot;+4 ·
            Keyword-Übereinstimmung&quot;, die zeigt, welcher Befund geschlossen wurde.
          </li>
          <li>
            <strong>Vorheriger-Besuch-Vergleich:</strong> Ein zweiter Besuch zeigt das Delta zum
            vorherigen Besuch.
          </li>
        </ul>

        <h2>15. Hilfesystem</h2>
        <ul>
          <li>
            <strong>Keyword-basierte Hilfe:</strong> Der Site-Helper antwortet aus einer
            Keyword-Bank, sendet niemals Daten an einen Server, speichert nichts.
          </li>
          <li>
            <strong>Kontextbewusste Antworten:</strong> Das Hilfesystem antwortet basierend auf
            dem aktuellen Analyseergebnis.
          </li>
        </ul>

        <h2>Fazit</h2>
        <p>ATS Readability führt den gesamten Jobsearch-Zyklus des Bewerbers an einem Ort aus:</p>
        <pre>
          CV erstellen ──► Parser testen ──► An Anzeige anpassen ──► Bewerben und verfolgen ──►
          Interview vorbereiten
          {"    "}▲{"                                                                                      "}│
          {"    "}└──────────────────────────────────── Feedback
          ◄──────────────────────────────────┘
        </pre>
        <p>
          Die Plattform erfindet niemals eine Fähigkeit, die der Bewerber nicht hat, erklärt jeden
          verlorenen Punkt und hält die deterministische Engine im Zentrum. KI ist da, um zu
          erklären und vorzuschlagen — sie berührt niemals die Bewertung. Dies hilft dem Bewerber,
          sowohl den Lebenslauf zu verbessern als auch den Bewerbungsprozess systematisch zu
          verwalten.
        </p>
      </article>

      <footer className="mt-12 border-t border-line pt-8">
        <SiteCredit />
      </footer>
    </div>
  );
}
