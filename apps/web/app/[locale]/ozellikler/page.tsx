import { SiteCredit } from "@/components/site-credit";

export default function OzelliklerPage() {
  return (
    <div className="mx-auto w-full max-w-page px-4 py-8 sm:px-6">
      <article className="prose prose-lg max-w-none">
        <h1>ATS Readability: Adayın İş Arama Sürecini Güçlendiren Özellikler</h1>

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

      <footer className="mt-12 border-t border-line pt-8">
        <SiteCredit />
      </footer>
    </div>
  );
}
