# ATS Readability: Adayın İş Arama Sürecini Güçlendiren Özellikler

ATS Readability, iş arayan adayların CV'lerini aday takip sistemlerinin (ATS) okuduğu şekilde görmelerini sağlayan ve iş arama sürecinin her aşamasında destek sunan kapsamlı bir platformdur. İşte adaylara sağladığı temel özellikler:

## 1. Detaylı CV Analizi ve Puanlama

Platform, CV'nizi beş kritik boyutta 100 üzerinden puanlar:

- **Okunabilirlik (25 puan):** Metin katmanının çıkarılabilirliği. Sütunlar, tablolar, simge fontları ve bozuk kodlamalar bu boyutta değerlendirilir.
- **Anahtar Kelime Eşleşmesi (25 puan):** İş ilanından çıkarılan terimlerin CV'deki kapsamı. Her terimin ilana olan merkeziyetine göre ağırlıklandırılır.
- **Etki (20 puan):** Sayısallaştırılmış sonuçlar ve sahiplenme fiilleri, sorumluluk doldurma metinlerine karşı ölçülür.
- **Yapı (20 puan):** Ayrıştırıcının alanlara eşleyebileceği başlıklar, ters sırada tarihli girişler, paragraflar yerine madde işaretleri.
- **İletişim (10 puan):** Ad, e-posta, telefon, konum ve profil bağlantısı.

Her kaybedilen puan, hangi satırdan geldiğini ve yerine ne yazmanız gerektiğini söyleyen adlandırılmış bir bulguya bağlanır. Bulgular, en çok puan kazandıracak şekilde sıralanır.

## 2. Ayrıştırıcı Görünümü (Parser View)

CV'nizin bir aday takip sistemi tarafından nasıl görüldüğünü gösterir. Bu özellik, adayların en çok merak ettiği soruları yanıtlar:

- Ayrıştırıcı başlığınızı ve tarihlerinizi doğru okudu mu?
- İsim, e-posta, telefon, konum ve bağlantılar gibi kimlik alanları bulundu mu, şüpheli mi yoksa eksik mi?
- Her deneyim girişi için pozisyon, şirket ve tarih aralığı nasıl görünüyor?
- Eğitim, beceriler ve diller doğru şekilde çıkarıldı mı?

Her eksik veya şüpheli alan için okunabilir bir neden sunulur (örneğin, "tarih aralığı iki sütuna bölünmüş görünüyor"). Bir alana tıkladığınızda, ham metindeki ilgili satır vurgulanır.

## 3. İş İlanı Analizi

Bir iş ilanı eklediğinizde, platform ilanın kendisini de analiz eder:

- **Gerekli ve tercih edilen beceriler:** İlandaki becerilerin hangilerinin zorunlu, hangilerinin tercih edildiği ayrımı.
- **Kıdem seviyesi:** İlanın beklediği deneyim seviyesi.
- **Dil gereksinimi:** İlanın gerektirdiği diller.
- **Konum/uzaktan çalışma:** İşin çalışma modeli.
- **Maaş bilgisi:** Varsa maaş aralığı.
- **Kırmızı bayraklar:** Aşırı uzun beceri listeleri, kıdem seviyesiyle çelişen yıl gereksinimleri, belirsiz rol tanımı.
- **Uygunluk kontrol listesi:** Deterministik (AI olmadan) bir uygunluk kontrolü.
- **Hayalet ilan kontrolü:** İlanın gerçekten aktif olup olmadığını kontrol eder.

## 4. Çoklu Eşleştirme Modu

Aynı CV ve ilan için üç farklı eşleştirme modu sunar:

- **Katı (Strict):** Tam eşleşme, kelimesi kelimesine.
- **Normalleştirilmiş (Normalized):** Eşanlamlılar, kısaltmalar ve taksonomi kullanır.
- **Anlamsal (Semantic):** Tarayıcıda çalışan gömme (embedding) modeli ile anlamsal eşleşme.

Her modun farklı sonuçlar ürettiğini ve bu farkın hangi terimlerden kaynaklandığını gösterir. Anlamsal eşleşmeler "olası eşleşme" olarak sunulur, kesin olarak değil.

## 5. Tailor Modu (CV Özelleştirme)

CV'yi belirli bir iş ilanına göre özelleştirmek için kullanılır:

- **Eksik terim kartları:** İlanda geçen ancak CV'de eksik olan terimler. Her kart, terimin ilanda nerede geçtiğini, ne kadar merkezi olduğunu ve CV'de nereye eklenebileceğini gösterir.
- **"Bu beceriye sahibim" kapısı:** Hiçbir terim, adayın onayı olmadan CV'ye eklenmez. Bu, platformun en önemli ilkelerinden biridir: adayın sahip olmadığı hiçbir beceri, deneyim veya sayı CV'ye yazılmaz.
- **Madde yeniden yazma:** Mevcut madde işaretlerini yeniden ifade eder. Sayısal sonuçlar için yer tutucular (`[X%]`, `[N kişi]`) kullanır.
- **Ön yazı yardımcısı:** Aynı koruma kurallarıyla ön yazı taslağı oluşturur.
- **Varyant karşılaştırması:** Ana CV puanı ile özelleştirilmiş varyantın puanını yan yana gösterir.

## 6. Mülakat Hazırlığı

Mülakat aşamasına geçildiğinde kapsamlı bir hazırlık desteği sunar:

- **STAR hikaye bankası:** CV'deki başarı maddelerinden Situation (Durum), Task (Görev), Action (Eylem), Result (Sonuç) kartları oluşturur. Hiçbir şey uydurulmaz, yalnızca CV'de olan kullanılır.
- **Şablon sorular:** Yaygın mülakat soruları, hikaye kartlarıyla eşleştirilir. AI gerektirmez.
- **İlana özel sorular:** İlandan üretilen sorular (Layer 2/3 model gerektirir). Üretilen sorular, ilandaki terimlere atıfta bulunur.
- **Pratik modu:** Soru gösterilir, aday cevabını yazar ve sistem en uygun hikaye kartını önerir. Öneri, paylaşılan kelimelerle izlenebilir.

## 7. Başvuru Takibi (Kanban Panosu)

Her başvurunun nerede olduğunu takip etmek için bir Kanban panosu sunar:

- **Aşamalar:** Kaydedildi → Başvuruldu → Mülakat → Teklif/Reddedildi.
- **Kart bağlantıları:** İlan, kullanılan CV varyantı, başvuru anındaki puan, notlar ve iletişim bilgileri.
- **Takip hatırlatmaları:** Örneğin, "7 gündür yanıt yok" hatırlatmaları.
- **CSV ve JSON dışa aktarma:** Verilerinizi istediğiniz zaman dışa aktarabilirsiniz.
- **Tek tıkla silme:** Tüm verileri yerel olarak kaldırır.

Pano cihazınızda durur ve hesabınızla senkronize edilir.

## 8. ATS Uyumlu CV Oluşturucu

Platform, yalnızca analiz yapmaz; aynı zamanda ATS uyumlu CV'ler oluşturmanıza yardımcı olur:

- **JSON Resume şeması:** İçe ve dışa aktarma için standart bir format.
- **Düzenleyici formu:** Her alan düzenlenebilir.
- **Şablonlar:** Yoğun, sade ve modern PDF şablonları.
- **Kapalı döngü doğrulama:** Her dışa aktarım, kendi ayrıştırıcımızdan geçer ve sonuç kullanıcıya gösterilir. CI testleri, tüm şablonların Okunabilirlik 25/25 puan aldığını doğrular.
- **DOCX dışa aktarma:** Word ve LibreOffice'te doğru açılır.
- **Mevcut CV'yi içe aktar:** PDF veya DOCX'i düzenleyiciye aktarın; çıkarılamayan alanlar manuel tamamlama için işaretlenir, hiçbir zaman uydurulmaz.

## 9. LinkedIn Tutarlılık Kontrolü

LinkedIn'in "PDF olarak kaydet" dışa aktarımını analiz eder ve CV ile LinkedIn profili arasındaki tutarsızlıkları raporlar:

- Tarih uyumsuzlukları.
- Farklı unvanlar.
- CV'de olan ancak profilde olmayan beceriler.
- Hedef role karşı başlık kontrolü.

Her tutarsızlık, her iki kaynağı da alıntılar.

## 10. Çoklu Dil Desteği

Platform, İngilizce, Türkçe ve Almanca dillerinde tam olarak çalışır:

- **Türkçe kök alma (stemming):** Anahtar kelime eşleştirmede Snowball Türkçe kök alıcı.
- **Almanca bileşik bölme:** "Softwareentwicklung" → "Software" + "Entwicklung".
- **Dile özgü durak sözcükler:** Her dil için optimize edilmiş.
- **Kodlama bozulması kontrolü:** Bozuk `ı İ ş ğ ç ö ü ä ß` karakterleri Okunabilirlik bulgusu olarak raporlanır.
- **Tarih formatları:** "Oca 2022", "Ocak 2022", "01.2022", "Jan. 2022", "März 2022", "heute", "halen", "devam ediyor".
- **Pazar bazlı tavsiyeler:** Fotoğraf, doğum tarihi, medeni hal, askerlik durumu hedef pazara göre.
- **Europass algılama:** Europass düzenleri tanınır ve uyarılır.

## 11. AI Destekli Düzeltmeler

Platform, AI'yı açıklayıcı ve önerici olarak kullanır, ancak puanlama tamamen deterministiktir:

- **Yerel model (Layer 1):** Tarayıcıda çalışan gömme modeli ile anlamsal eşleştirme.
- **Kullanıcının kendi Ollama'sı (Layer 2):** Kullanıcının makinesinde çalışan model ile madde yeniden yazma, açıklama, ön yazı ve mülakat soruları.
- **BYOK (Layer 3):** Kullanıcının kendi API anahtarı ile daha güçlü modeller. API anahtarı tarayıcıda tutulur, sunucuya asla gönderilmez.
- **Şema doğrulama:** Tüm LLM çıktıları bir JSON şemasına karşı doğrulanır. Şemayı geçemeyen çıktı kullanıcıya gösterilmez.

Her AI çıktısı, CV'den uydurma sayı, teknoloji veya organizasyon içerip içermediğini kontrol eden bir grounding (dayanak) kontrolünden geçer.

## 12. Rapor Paylaşımı ve Dışa Aktarma

- **PDF raporu:** Analiz raporunu PDF olarak indirebilirsiniz.
- **Paylaşım bağlantıları:** Puanları ve önerileri saklar, ancak CV'den hiçbir satır içermez. Bağlantılar 30 gün sonra sona erer.
- **Markdown raporu:** Raporu Markdown formatında dışa aktarabilirsiniz.

## 13. Gizlilik ve Veri Saklama

Platform, gizliliği ciddiye alır:

- CV önce tarayıcınızda okunur ve puanlanır.
- Analiz ettiğinizde dosya, metni ve sonuç sunucuya gönderilir ve 12 ay saklanır.
- 12 ay sonra dosya, çıkarılan metin ve analiz sonucu veritabanından ve depolamadan silinir.
- Paylaşım bağlantıları, kanıtları (evidence) çıkarılmış olarak saklanır, çünkü kanıtlar belgeden alınmış satırlar içerebilir.
- Veri talep formu ile silme talebinde bulunabilirsiniz.

## 14. Oturum Geçmişi ve İlerleme Takibi

- **Oturum puan geçmişi:** Oturum boyunca puanın değişimini gösteren bir grafik.
- **Değişiklik başına delta:** Her değişiklik için "+4 · Anahtar kelime eşleşmesi" gibi hangi bulgunun kapatıldığını gösteren bir not.
- **Önceki ziyaret karşılaştırması:** İkinci bir ziyaret, önceki ziyarete göre değişimi gösterir.

## 15. Yardım Sistemi

- **Anahtar kelime tabanlı yardım:** Site yardımcısı bir anahtar kelime bankasından yanıtlar, hiçbir zaman sunucuya veri göndermez, hiçbir şey saklamaz.
- **Bağlam duyarlı yanıtlar:** Yardım sistemi, mevcut analiz sonucuna göre yanıtlar verir.

## Sonuç

ATS Readability, iş aramanın tüm döngüsünü tek bir yerde çalıştırır:

```
CV Oluştur ──► Ayrıştırıcıda Test Et ──► İlana Göre Özelleştir ──► Başvur ve Takip Et ──► Mülakata Hazırlan
    ▲                                                                                      │
    └──────────────────────────────────── geri bildirim ◄──────────────────────────────────┘
```

Platform, adayın sahip olmadığı hiçbir beceriyi uydurmaz, her kaybedilen puanı açıklar ve deterministik motoru merkeze koyar. AI, açıklamak ve önermek için vardır; puanlamaya asla müdahale etmez. Bu, adayın hem CV'sini iyileştirmesine hem de iş arama sürecini sistematik olarak yönetmesine yardımcı olur.
