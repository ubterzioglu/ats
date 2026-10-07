import { SiteCredit } from "@/components/site-credit";

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-page px-4 py-8 sm:px-6">
      {/* ===== TÜRKÇE ===== */}
      <section className="mb-12">
        <h1 className="mb-8 text-3xl font-bold text-ink">Sık Sorulan Sorular</h1>

        <div className="space-y-6">
          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">
              CV Analizi ve Puanlama
            </h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">CV&apos;mi nasıl puanlıyorsunuz?</p>
                <p className="mt-2 text-muted">
                  Platform, CV&apos;nizi beş kritik boyutta 100 üzerinden puanlar: Okunabilirlik
                  (25 puan), Anahtar Kelime Eşleşmesi (25 puan), Etki (20 puan), Yapı (20 puan) ve
                  İletişim (10 puan). Her kaybedilen puan, hangi satırdan geldiğini ve yerine ne
                  yazmanız gerektiğini söyleyen adlandırılmış bir bulguya bağlanır.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Okunabilirlik boyutu ne ölçer?</p>
                <p className="mt-2 text-muted">
                  Metin katmanının çıkarılabilirliğini ölçer. Sütunlar, tablolar, simge fontları ve
                  bozuk kodlamalar bu boyutta değerlendirilir. Bir ayrıştırıcının metninizi doğru
                  okuyup okuyamayacağını gösterir.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Anahtar kelime eşleşmesi nasıl çalışır?</p>
                <p className="mt-2 text-muted">
                  İş ilanından çıkarılan terimlerin CV&apos;nizdeki kapsamını ölçer. Her terim,
                  ilana olan merkeziyetine göre ağırlıklandırılır. İlan yoksa, genel bir beceri
                  listesi kullanılır.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Etki boyutu neye bakar?</p>
                <p className="mt-2 text-muted">
                  Sayısallaştırılmış sonuçları ve sahiplenme fiillerini ölçer. &quot;Satışları
                  artırdım&quot; yerine &quot;Satışları %20 artırdım&quot; gibi somut sonuçlar
                  yüksek puan alır. Sorumluluk doldurma metinleri düşük puan alır.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Yapı boyutu neyi kontrol eder?</p>
                <p className="mt-2 text-muted">
                  Ayrıştırıcının alanlara eşleyebileceği başlıkları, ters sırada tarihli girişleri
                  ve paragraflar yerine madde işaretlerini kontrol eder. Düzenli bir yapı,
                  ayrıştırıcının bilgilerinizi doğru okumasını sağlar.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Ayrıştırıcı Görünümü</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Ayrıştırıcı görünümü ne gösterir?</p>
                <p className="mt-2 text-muted">
                  CV&apos;nizin bir aday takip sistemi tarafından nasıl görüldüğünü gösterir.
                  İsim, e-posta, telefon, konum ve bağlantılar gibi kimlik alanlarının bulunduğunu,
                  şüpheli olduğunu veya eksik olduğunu gösterir.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">
                  Tarihlerim neden şüpheli görünüyor?
                </p>
                <p className="mt-2 text-muted">
                  Tarih aralığınız iki sütuna bölünmüş olabilir veya tarih formatı tanınmamış
                  olabilir. Her şüpheli alan için okunabilir bir neden sunulur ve ilgili satır
                  vurgulanır.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">İş İlanı Analizi</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">İş ilanını analiz etmek ne sağlar?</p>
                <p className="mt-2 text-muted">
                  İlandaki gerekli ve tercih edilen becerileri, kıdem seviyesini, dil gereksinimini,
                  konum/uzaktan çalışma modelini ve maaş bilgisini çıkarır. Ayrıca kırmızı
                  bayrakları ve hayalet ilanları tespit eder.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Hayalet ilan kontrolü nedir?</p>
                <p className="mt-2 text-muted">
                  İlanın gerçekten aktif olup olmadığını kontrol eder. Greenhouse, Lever ve Ashby
                  gibi platformların API&apos;lerini kullanarak ilanının hala açık olup olmadığını
                  doğrular.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Eşleştirme Modları</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Kaç eşleştirme modu var?</p>
                <p className="mt-2 text-muted">
                  Üç mod var: Katı (kelimesi kelimesine), Normalleştirilmiş (eşanlamlılar ve
                  kısaltmalar) ve Anlamsal (gömme modeli ile). Her mod farklı sonuçlar üretir ve
                  farkın hangi terimlerden kaynaklandığını gösterir.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Anlamsal eşleşme ne demek?</p>
                <p className="mt-2 text-muted">
                  Tarayıcıda çalışan bir gömme modeli kullanarak kelimelerin anlamını karşılaştırır.
                  &quot;Yazılım geliştirme&quot; ve &quot;kod yazma&quot; gibi farklı kelimeleri
                  eşleştirebilir. &quot;Olası eşleşme&quot; olarak sunulur, kesin olarak değil.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">CV Özelleştirme (Tailor)</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">CV&apos;mi ilana göre nasıl özelleştiririm?</p>
                <p className="mt-2 text-muted">
                  Tailor modu, ilanda geçen ancak CV&apos;nizde eksik olan terimleri gösterir. Her
                  terim için ilanda nerede geçtiğini, ne kadar merkezi olduğunu ve CV&apos;nizde
                  nereye eklenebileceğini gösterir.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">
                  CV&apos;me otomatik olarak beceri ekleniyor mu?
                </p>
                <p className="mt-2 text-muted">
                  Hayır. Hiçbir terim, sizin onayınız olmadan CV&apos;nize eklenmez. Bu,
                  platformun en önemli ilkelerinden biridir: sahip olmadığınız hiçbir beceri,
                  deneyim veya sayı CV&apos;nize yazılmaz.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Madde yeniden yazma nasıl çalışır?</p>
                <p className="mt-2 text-muted">
                  Mevcut madde işaretlerinizi yeniden ifade eder. Sayısal sonuçlar için yer
                  tutucular ([X%], [N kişi]) kullanır. Uydurma sayı, teknoloji veya organizasyon
                  içermez.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Mülakat Hazırlığı</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">STAR hikaye bankası nedir?</p>
                <p className="mt-2 text-muted">
                  CV&apos;nizdeki başarı maddelerinden Situation (Durum), Task (Görev), Action
                  (Eylem), Result (Sonuç) kartları oluşturur. Hiçbir şey uydurulmaz, yalnızca
                  CV&apos;nizde olan kullanılır.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Pratik modu nasıl çalışır?</p>
                <p className="mt-2 text-muted">
                  Soru gösterilir, cevabınızı yazarsınız ve sistem en uygun hikaye kartını önerir.
                  Öneri, paylaşılan kelimelerle izlenebilir. İlandan üretilen sorular için model
                  gerekir.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Başvuru Takibi</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Başvurularımı nasıl takip ederim?</p>
                <p className="mt-2 text-muted">
                  Kanban panosu ile başvurularınızı Kaydedildi → Başvuruldu → Mülakat →
                  Teklif/Reddedildi aşamalarında ilerletirsiniz. Her kart, ilanı, kullanılan CV
                  varyantını, başvuru anındaki puanı, notları ve iletişim bilgilerini içerir.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Takip hatırlatmaları nasıl çalışır?</p>
                <p className="mt-2 text-muted">
                  &quot;7 gündür yanıt yok&quot; gibi hatırlatmalar alırsınız. Hatırlatmalar
                  yerel olarak hesaplanır ve cihazınızda saklanır.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">CV Oluşturucu</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">CV oluşturucu ATS uyumlu mu?</p>
                <p className="mt-2 text-muted">
                  Evet. Her dışa aktarım, kendi ayrıştırıcımızdan geçer ve sonuç size gösterilir.
                  CI testleri, tüm şablonların Okunabilirlik 25/25 puan aldığını doğrular.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Hangi formatları destekliyorsunuz?</p>
                <p className="mt-2 text-muted">
                  PDF (yoğun, sade, modern), DOCX ve JSON Resume. Mevcut CV&apos;nizi PDF veya
                  DOCX olarak içe aktarabilirsiniz.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Çoklu Dil Desteği</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Hangi diller destekleniyor?</p>
                <p className="mt-2 text-muted">
                  İngilizce, Türkçe ve Almanca. Türkçe kök alma, Almanca bileşik bölme, dile özgü
                  durak sözcükler ve tarih formatları desteklenir.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Türkçe karakterler tanınıyor mu?</p>
                <p className="mt-2 text-muted">
                  Evet. ş, ğ, ı, İ, ç, ö, ü karakterleri tam olarak desteklenir. Bozuk karakterler
                  Okunabilirlik bulgusu olarak raporlanır.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">AI ve Gizlilik</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">AI puanlamayı etkiliyor mu?</p>
                <p className="mt-2 text-muted">
                  Hayır. Puanlama tamamen deterministiktir. AI yalnızca açıklama ve öneri için
                  kullanılır. Her AI çıktısı, CV&apos;den uydurma sayı, teknoloji veya organizasyon
                  içerip içermediğini kontrol eden bir grounding kontrolünden geçer.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">CV&apos;m nerede saklanıyor?</p>
                <p className="mt-2 text-muted">
                  CV önce tarayıcınızda okunur ve puanlanır. Analiz ettiğinizde dosya, metni ve
                  sonuç sunucuya gönderilir ve 12 ay saklanır. 12 ay sonra silinir.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">API anahtarım güvende mi?</p>
                <p className="mt-2 text-muted">
                  Evet. BYOK (Kendi API Anahtarınız) kullanıyorsanız, anahtar tarayıcınızda tutulur
                  ve sunucumuza asla gönderilmez.
                </p>
              </div>
            </div>
          </div>

          <div className="pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Raporlar ve Paylaşım</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Raporumu paylaşabilir miyim?</p>
                <p className="mt-2 text-muted">
                  Evet. Paylaşım bağlantıları puanları ve önerileri saklar, ancak CV&apos;nizden
                  hiçbir satır içermez. Bağlantılar 30 gün sonra sona erer.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Raporu hangi formatlarda indirebilirim?</p>
                <p className="mt-2 text-muted">
                  PDF ve Markdown formatlarında indirebilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="my-12 border-line" />

      {/* ===== ENGLISH ===== */}
      <section className="mb-12">
        <h1 className="mb-8 text-3xl font-bold text-ink">Frequently Asked Questions</h1>

        <div className="space-y-6">
          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">CV Analysis and Scoring</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">How do you score my CV?</p>
                <p className="mt-2 text-muted">
                  The platform scores your CV across five critical dimensions out of 100:
                  Parseability (25 points), Keyword Match (25 points), Impact (20 points), Structure
                  (20 points), and Contact (10 points). Every lost point is tied to a named finding
                  that states which line it came from and what to write instead.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">What does the Parseability dimension measure?</p>
                <p className="mt-2 text-muted">
                  It measures whether the text layer survives extraction. Columns, tables, icon
                  fonts, and broken encodings are evaluated in this dimension. It shows whether a
                  parser can read your text correctly.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">How does keyword matching work?</p>
                <p className="mt-2 text-muted">
                  It measures the coverage of terms mined from the job ad in your CV. Each term is
                  weighted by how central it is to the posting. If there&apos;s no ad, a general
                  skill list is used.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">What does the Impact dimension look at?</p>
                <p className="mt-2 text-muted">
                  It measures quantified results and ownership verbs. Concrete results like
                  &quot;Increased sales by 20%&quot; score higher than &quot;Increased sales&quot;.
                  Responsibility filler text scores low.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">What does the Structure dimension check?</p>
                <p className="mt-2 text-muted">
                  It checks headings a parser can map to fields, dated entries in reverse order, and
                  bullets over paragraphs. A well-structured CV helps the parser read your
                  information correctly.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Parser View</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">What does the parser view show?</p>
                <p className="mt-2 text-muted">
                  It shows how your CV is seen by an applicant tracking system. It shows whether
                  identity fields such as name, email, phone, location, and links were found, are
                  suspect, or are missing.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Why do my dates look suspect?</p>
                <p className="mt-2 text-muted">
                  Your date range might be split across two columns or the date format might not be
                  recognized. Every suspect field comes with a readable cause and the relevant line
                  is highlighted.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Job Ad Analysis</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">What does analysing a job ad provide?</p>
                <p className="mt-2 text-muted">
                  It extracts required and preferred skills, seniority level, language requirements,
                  location/remote model, and salary information from the ad. It also detects red
                  flags and ghost postings.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">What is ghost posting detection?</p>
                <p className="mt-2 text-muted">
                  It checks whether the ad is genuinely active. It uses APIs from platforms like
                  Greenhouse, Lever, and Ashby to verify whether the posting is still open.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Matching Modes</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">How many matching modes are there?</p>
                <p className="mt-2 text-muted">
                  There are three modes: Strict (word-for-word), Normalized (synonyms and
                  abbreviations), and Semantic (with embedding model). Each mode produces different
                  results and shows which terms account for the difference.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">What does semantic matching mean?</p>
                <p className="mt-2 text-muted">
                  It uses an embedding model running in the browser to compare the meaning of words.
                  It can match different words like &quot;software development&quot; and &quot;coding&quot;.
                  It&apos;s presented as &quot;possible match&quot;, not confirmed.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">CV Tailoring</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">How do I tailor my CV to a job ad?</p>
                <p className="mt-2 text-muted">
                  Tailor mode shows terms in the ad that are missing from your CV. For each term, it
                  shows where it appears in the ad, how central it is, and where it could be added
                  in your CV.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Are skills automatically added to my CV?</p>
                <p className="mt-2 text-muted">
                  No. No term enters your CV without your confirmation. This is one of the
                  platform&apos;s core principles: no skill, experience, or number you don&apos;t
                  have may be written in.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">How does bullet rewriting work?</p>
                <p className="mt-2 text-muted">
                  It rephrases your existing bullets. It uses placeholders ([X%], [N people]) where
                  a measurable result is missing. It doesn&apos;t contain invented numbers,
                  technologies, or organisations.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Interview Preparation</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">What is the STAR story bank?</p>
                <p className="mt-2 text-muted">
                  It creates Situation, Task, Action, Result cards from your CV achievement bullets.
                  Nothing is invented — only what&apos;s in your CV is used.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">How does practice mode work?</p>
                <p className="mt-2 text-muted">
                  A question is shown, you write your answer, and the system suggests the most
                  relevant story card. The suggestion is traceable through shared words. Ad-specific
                  questions require a model.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Application Tracking</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">How do I track my applications?</p>
                <p className="mt-2 text-muted">
                  With the Kanban board, you move your applications through Saved → Applied →
                  Interview → Offer/Rejected stages. Each card contains the ad, the CV variant
                  used, the score at the time of applying, notes, and contact details.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">How do follow-up reminders work?</p>
                <p className="mt-2 text-muted">
                  You get reminders like &quot;no reply for 7 days&quot;. Reminders are computed
                  locally and stored on your device.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">CV Builder</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Is the CV builder ATS-safe?</p>
                <p className="mt-2 text-muted">
                  Yes. Every export runs through our own parser and the result is shown to you. CI
                  tests assert all templates score Parseability 25/25.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">What formats do you support?</p>
                <p className="mt-2 text-muted">
                  PDF (dense, plain, modern), DOCX, and JSON Resume. You can import your existing
                  CV as PDF or DOCX.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Multilingual Support</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Which languages are supported?</p>
                <p className="mt-2 text-muted">
                  English, Turkish, and German. Turkish stemming, German compound splitting,
                  per-language stopwords, and date formats are supported.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Are Turkish characters recognized?</p>
                <p className="mt-2 text-muted">
                  Yes. ş, ğ, ı, İ, ç, ö, ü characters are fully supported. Garbled characters are
                  reported as a Parseability finding.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">AI and Privacy</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Does AI affect scoring?</p>
                <p className="mt-2 text-muted">
                  No. Scoring is fully deterministic. AI is only used for explanation and
                  suggestion. Every AI output passes through a grounding check that verifies whether
                  it contains invented numbers, technologies, or organisations not in the CV.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Where is my CV stored?</p>
                <p className="mt-2 text-muted">
                  The CV is first read and scored in your browser. When you analyse it, the file,
                  its text, and the result are sent to the server and kept for 12 months. After 12
                  months, it&apos;s deleted.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Is my API key safe?</p>
                <p className="mt-2 text-muted">
                  Yes. If you use BYOK (Bring Your Own Key), the key is held in your browser and
                  never sent to our server.
                </p>
              </div>
            </div>
          </div>

          <div className="pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Reports and Sharing</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Can I share my report?</p>
                <p className="mt-2 text-muted">
                  Yes. Share links persist scores and recommendations but contain no lines from your
                  CV. Links expire after 30 days.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">What formats can I download the report in?</p>
                <p className="mt-2 text-muted">
                  You can download it in PDF and Markdown formats.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="my-12 border-line" />

      {/* ===== DEUTSCH ===== */}
      <section className="mb-12">
        <h1 className="mb-8 text-3xl font-bold text-ink">Häufig gestellte Fragen</h1>

        <div className="space-y-6">
          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">CV-Analyse und Bewertung</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Wie bewerten Sie meinen Lebenslauf?</p>
                <p className="mt-2 text-muted">
                  Die Plattform bewertet Ihren Lebenslauf in fünf kritischen Dimensionen mit
                  insgesamt 100 Punkten: Lesbarkeit (25 Punkte), Keyword-Übereinstimmung (25
                  Punkte), Wirkung (20 Punkte), Struktur (20 Punkte) und Kontakt (10 Punkte). Jeder
                  verlorene Punkt ist an einen benannten Befund gebunden, der angibt, aus welcher
                  Zeile er stammt und was stattdessen geschrieben werden soll.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Was misst die Lesbarkeits-Dimension?</p>
                <p className="mt-2 text-muted">
                  Sie misst, ob die Textschicht die Extraktion übersteht. Spalten, Tabellen,
                  Icon-Schriften und fehlerhafte Kodierungen werden in dieser Dimension bewertet.
                  Sie zeigt, ob ein Parser Ihren Text korrekt lesen kann.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Wie funktioniert das Keyword-Matching?</p>
                <p className="mt-2 text-muted">
                  Es misst die Abdeckung der aus der Stellenanzeige extrahierten Begriffe in Ihrem
                  Lebenslauf. Jeder Begriff wird nach seiner Zentralität für die Anzeige gewichtet.
                  Wenn keine Anzeige vorhanden ist, wird eine allgemeine Skill-Liste verwendet.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Was betrachtet die Wirkungs-Dimension?</p>
                <p className="mt-2 text-muted">
                  Sie misst quantifizierte Ergebnisse und Verantwortungs-Verben. Konkrete Ergebnisse
                  wie &quot;Umsatz um 20% gesteigert&quot; erhalten höhere Punktzahlen als
                  &quot;Umsatz gesteigert&quot;. Fülltext ohne Substanz erhält niedrige Punktzahlen.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Was prüft die Struktur-Dimension?</p>
                <p className="mt-2 text-muted">
                  Sie prüft Überschriften, die ein Parser Feldern zuordnen kann, datierte Einträge
                  in umgekehrter Reihenfolge und Aufzählungspunkte statt Absätze. Eine gut
                  strukturierte CV hilft dem Parser, Ihre Informationen korrekt zu lesen.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Parser-Ansicht</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Was zeigt die Parser-Ansicht?</p>
                <p className="mt-2 text-muted">
                  Sie zeigt, wie Ihr Lebenslauf von einem Applicant Tracking System gesehen wird.
                  Sie zeigt, ob Identitätsfelder wie Name, E-Mail, Telefon, Standort und Links
                  gefunden wurden, verdächtig sind oder fehlen.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Warum sehen meine Daten verdächtig aus?</p>
                <p className="mt-2 text-muted">
                  Ihr Zeitraum könnte über zwei Spalten aufgeteilt sein oder das Datumsformat wird
                  möglicherweise nicht erkannt. Jedes verdächtige Feld enthält eine lesbare Ursache
                  und die relevante Zeile wird hervorgehoben.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Stellenanzeigen-Analyse</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Was bietet die Analyse einer Stellenanzeige?</p>
                <p className="mt-2 text-muted">
                  Sie extrahiert erforderliche und bevorzugte Fähigkeiten, Erfahrungsstufe,
                  Sprachanforderungen, Standort/Remote-Modell und Gehaltsinformationen aus der
                  Anzeige. Sie erkennt auch Red Flags und Ghost Postings.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Was ist die Ghost-Posting-Erkennung?</p>
                <p className="mt-2 text-muted">
                  Sie prüft, ob die Anzeige tatsächlich aktiv ist. Sie verwendet APIs von
                  Plattformen wie Greenhouse, Lever und Ashby, um zu überprüfen, ob die Stelle
                  noch offen ist.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Matching-Modi</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Wie viele Matching-Modi gibt es?</p>
                <p className="mt-2 text-muted">
                  Es gibt drei Modi: Strict (wortwörtlich), Normalized (Synonyme und Abkürzungen)
                  und Semantic (mit Embedding-Modell). Jeder Modus produziert unterschiedliche
                  Ergebnisse und zeigt, welche Begriffe den Unterschied ausmachen.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Was bedeutet semantisches Matching?</p>
                <p className="mt-2 text-muted">
                  Es verwendet ein Embedding-Modell, das im Browser läuft, um die Bedeutung von
                  Wörtern zu vergleichen. Es kann verschiedene Wörter wie
                  &quot;Softwareentwicklung&quot; und &quot;Programmieren&quot; matchen. Es wird als
                  &quot;mögliche Übereinstimmung&quot; dargestellt, nicht als bestätigt.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">CV-Anpassung</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Wie passe ich meinen Lebenslauf an eine Stellenanzeige an?</p>
                <p className="mt-2 text-muted">
                  Der Tailor-Modus zeigt Begriffe in der Anzeige, die in Ihrem Lebenslauf fehlen.
                  Für jeden Begriff zeigt er, wo er in der Anzeige vorkommt, wie zentral er ist und
                  wo er im Lebenslauf hinzugefügt werden könnte.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Werden Fähigkeiten automatisch zu meinem Lebenslauf hinzugefügt?</p>
                <p className="mt-2 text-muted">
                  Nein. Kein Begriff gelangt ohne Ihre Bestätigung in Ihren Lebenslauf. Dies ist
                  eines der Kernprinzipien der Plattform: Keine Fähigkeit, Erfahrung oder Zahl, die
                  Sie nicht haben, darf eingetragen werden.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Wie funktioniert das Bullet-Rewriting?</p>
                <p className="mt-2 text-muted">
                  Es formuliert Ihre bestehenden Bulletpoints um. Es verwendet Platzhalter ([X%],
                  [N Personen]), wo ein messbares Ergebnis fehlt. Es enthält keine erfundenen Zahlen,
                  Technologien oder Organisationen.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Vorstellungsgespräch-Vorbereitung</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Was ist die STAR-Story-Bank?</p>
                <p className="mt-2 text-muted">
                  Sie erstellt Situation-, Task-, Action-, Result-Karten aus Ihren
                  Erfolgs-Bulletpoints im Lebenslauf. Nichts wird erfunden — es wird nur verwendet,
                  was in Ihrem Lebenslauf steht.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Wie funktioniert der Übungsmodus?</p>
                <p className="mt-2 text-muted">
                  Eine Frage wird angezeigt, Sie schreiben Ihre Antwort, und das System schlägt die
                  passendste Story-Karte vor. Der Vorschlag ist über gemeinsame Wörter
                  nachvollziehbar. Anzeigenspezifische Fragen erfordern ein Modell.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Bewerbungs-Tracking</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Wie verfolge ich meine Bewerbungen?</p>
                <p className="mt-2 text-muted">
                  Mit dem Kanban-Board bewegen Sie Ihre Bewerbungen durch die Phasen Gespeichert →
                  Beworben → Interview → Angebot/Abgelehnt. Jede Karte enthält die Anzeige, die
                  verwendete CV-Variante, die Bewertung zum Zeitpunkt der Bewerbung, Notizen und
                  Kontaktdaten.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Wie funktionieren Follow-up-Erinnerungen?</p>
                <p className="mt-2 text-muted">
                  Sie erhalten Erinnerungen wie &quot;seit 7 Tagen keine Antwort&quot;.
                  Erinnerungen werden lokal berechnet und auf Ihrem Gerät gespeichert.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">CV-Builder</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Ist der CV-Builder ATS-sicher?</p>
                <p className="mt-2 text-muted">
                  Ja. Jeder Export läuft durch unseren eigenen Parser und das Ergebnis wird Ihnen
                  angezeigt. CI-Tests stellen sicher, dass alle Vorlagen Lesbarkeit 25/25 erreichen.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Welche Formate unterstützen Sie?</p>
                <p className="mt-2 text-muted">
                  PDF (dicht, einfach, modern), DOCX und JSON Resume. Sie können Ihren bestehenden
                  Lebenslauf als PDF oder DOCX importieren.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Mehrsprachige Unterstützung</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Welche Sprachen werden unterstützt?</p>
                <p className="mt-2 text-muted">
                  Englisch, Türkisch und Deutsch. Türkisches Stemming, deutsche Komposita-Zerlegung,
                  sprachspezifische Stoppwörter und Datumsformate werden unterstützt.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Werden türkische Zeichen erkannt?</p>
                <p className="mt-2 text-muted">
                  Ja. ş, ğ, ı, İ, ç, ö, ü Zeichen werden vollständig unterstützt. Fehlerhafte
                  Zeichen werden als Lesbarkeits-Befund gemeldet.
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-line pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">KI und Datenschutz</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Beeinflusst KI die Bewertung?</p>
                <p className="mt-2 text-muted">
                  Nein. Die Bewertung ist vollständig deterministisch. KI wird nur zur Erklärung und
                  Vorschlag verwendet. Jede KI-Ausgabe durchläuft eine Grounding-Prüfung, die
                  überprüft, ob sie erfundene Zahlen, Technologien oder Organisationen enthält, die
                  nicht im Lebenslauf vorhanden sind.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Wo wird mein Lebenslauf gespeichert?</p>
                <p className="mt-2 text-muted">
                  Der Lebenslauf wird zuerst in Ihrem Browser gelesen und bewertet. Wenn Sie ihn
                  analysieren, werden Datei, Text und Ergebnis an den Server gesendet und 12 Monate
                  aufbewahrt. Nach 12 Monaten werden sie gelöscht.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">Ist mein API-Schlüssel sicher?</p>
                <p className="mt-2 text-muted">
                  Ja. Wenn Sie BYOK (Bring Your Own Key) verwenden, wird der Schlüssel in Ihrem
                  Browser gehalten und niemals an unseren Server gesendet.
                </p>
              </div>
            </div>
          </div>

          <div className="pb-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">Berichte und Freigabe</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-ink">Kann ich meinen Bericht teilen?</p>
                <p className="mt-2 text-muted">
                  Ja. Freigabe-Links speichern Bewertungen und Empfehlungen, enthalten aber keine
                  Zeilen aus Ihrem Lebenslauf. Links laufen nach 30 Tagen ab.
                </p>
              </div>
              <div>
                <p className="font-medium text-ink">In welchen Formaten kann ich den Bericht herunterladen?</p>
                <p className="mt-2 text-muted">
                  Sie können ihn in PDF- und Markdown-Formaten herunterladen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-12 border-t border-line pt-8">
        <SiteCredit />
      </footer>
    </div>
  );
}
