import type { FeatureContent } from "./content-types";

export const FEATURES_TR: FeatureContent = {
  scoring: {
    title: "CV analizi ve puanlama",
    summary: "Beş boyut 100 puana tamamlanır ve kaybedilen her puan adlandırılmış bir bulguya bağlanır.",
    intro: "Platform CV'nizi beş boyutta 100 üzerinden puanlar:",
    points: [
      { label: "Okunabilirlik (25)", text: "Metin katmanının çıkarılabilirliği. Sütunlar, tablolar, simge fontları ve bozuk kodlamalar bu boyutta değerlendirilir." },
      { label: "Anahtar kelime eşleşmesi (25)", text: "İş ilanından çıkarılan terimlerin CV'deki kapsamı. Her terim ilana olan merkeziyetine göre ağırlıklandırılır." },
      { label: "Etki (20)", text: "Sayısallaştırılmış sonuçlar ve sahiplenme fiilleri, sorumluluk doldurma metinlerine karşı ölçülür." },
      { label: "Yapı (20)", text: "Ayrıştırıcının alanlara eşleyebileceği başlıklar, ters sırada tarihli girişler, paragraflar yerine madde işaretleri." },
      { label: "İletişim (10)", text: "Ad, e-posta, telefon, konum ve profil bağlantısı." }
    ],
    outro: "Kaybedilen her puan, hangi satırdan geldiğini ve yerine ne yazmanız gerektiğini söyleyen adlandırılmış bir bulguya bağlanır. Bulgular, en çok puan kazandıracak şekilde sıralanır."
  },
  "parser-view": {
    title: "Ayrıştırıcı görünümü",
    summary: "Bir aday takip sisteminin CV'nizi alan alan nasıl gördüğünü gösterir.",
    intro: "Bu görünüm adayların en çok sorduğu soruları yanıtlar:",
    points: [
      { text: "Ayrıştırıcı başlığınızı ve tarihlerinizi doğru okudu mu?" },
      { text: "İsim, e-posta, telefon, konum ve bağlantılar gibi kimlik alanları bulundu mu, şüpheli mi, yoksa eksik mi?" },
      { text: "Her deneyim girişi için pozisyon, şirket ve tarih aralığı nasıl görünüyor?" },
      { text: "Eğitim, beceriler ve diller doğru çıkarıldı mı?" }
    ],
    outro: "Eksik veya şüpheli her alan için okunabilir bir neden verilir, örneğin \"tarih aralığı iki sütuna bölünmüş görünüyor\". Bir alana tıkladığınızda ham metindeki satırı vurgulanır."
  },
  "job-ad": {
    title: "İş ilanı analizi",
    summary: "İlanın kendisi de analiz edilir: gerekli beceriler, kıdem, kırmızı bayraklar ve ilanın hâlâ açık olup olmadığı.",
    intro: "Bir iş ilanı eklediğinizde platform ilanı da okur:",
    points: [
      { label: "Gerekli ve tercih edilen beceriler", text: "Hangi beceriler zorunlu, hangileri tercih edilen." },
      { label: "Kıdem seviyesi", text: "İlanın beklediği deneyim seviyesi." },
      { label: "Dil gereksinimi", text: "İlanın gerektirdiği diller." },
      { label: "Konum ve uzaktan çalışma", text: "İşin çalışma modeli." },
      { label: "Maaş", text: "İlan belirtiyorsa maaş aralığı." },
      { label: "Kırmızı bayraklar", text: "Aşırı uzun beceri listeleri, kıdemle çelişen yıl gereksinimleri, belirsiz rol tanımları." },
      { label: "Uygunluk kontrol listesi", text: "Yapay zekâ kullanmayan, deterministik bir kontrol." },
      { label: "Hayalet ilan kontrolü", text: "İlanın gerçekten aktif olup olmadığına bakar." }
    ]
  },
  matching: {
    title: "Çoklu eşleştirme modu",
    summary: "Aynı CV ve ilan için katı, normalleştirilmiş ve anlamsal eşleştirme; farkın nedeni de gösterilir.",
    intro: "Aynı CV ve ilan üzerinde üç eşleştirme modu çalışır:",
    points: [
      { label: "Katı", text: "Tam, kelimesi kelimesine eşleşme." },
      { label: "Normalleştirilmiş", text: "Eşanlamlıları, kısaltmaları ve beceri taksonomisini kullanır." },
      { label: "Anlamsal", text: "Tarayıcınızda çalışan gömme (embedding) tabanlı eşleşme." }
    ],
    outro: "Her modun farklı sonuçlar ürettiğini ve farkın hangi terimlerden geldiğini görürsünüz. Anlamsal eşleşmeler \"olası eşleşme\" olarak gösterilir, kesin olarak değil."
  },
  tailor: {
    title: "Tailor modu",
    summary: "CV'yi tek bir ilana göre özelleştirir, sahip olmadığınız hiçbir şeyi yazmaz.",
    points: [
      { label: "Eksik terim kartları", text: "İlanda geçen ama CV'de olmayan terimler. Her kart terimin ilanda nerede geçtiğini, ne kadar merkezi olduğunu ve CV'de nereye eklenebileceğini gösterir." },
      { label: "\"Bu beceriye sahibim\" kapısı", text: "Hiçbir terim onayınız olmadan CV'ye girmez. Sahip olmadığınız beceri, deneyim ya da sayı yazılmaz." },
      { label: "Madde yeniden yazma", text: "Yalnızca mevcut maddeleri yeniden ifade eder; ölçülebilir sonuç eksikse [X%] ve [N kişi] gibi yer tutucular kullanır." },
      { label: "Ön yazı yardımcısı", text: "Aynı korumalarla ön yazı taslağı hazırlar." },
      { label: "Varyant karşılaştırması", text: "Ana CV puanını özelleştirilmiş varyantın puanıyla yan yana gösterir." }
    ]
  },
  interview: {
    title: "Mülakat hazırlığı",
    summary: "CV'nizden çıkarılan hikâye kartları, sık sorulan sorularla eşleşir; bir de pratik modu vardır.",
    points: [
      { label: "STAR hikâye bankası", text: "CV'deki başarı maddelerinden Durum, Görev, Eylem ve Sonuç kartları oluşturulur. Hiçbir şey uydurulmaz." },
      { label: "Şablon sorular", text: "Yaygın mülakat soruları hikâye kartlarıyla eşleştirilir. Yapay zekâ gerekmez." },
      { label: "İlana özel sorular", text: "İlandan üretilen sorular. Açtığınız Layer 2 veya 3 model gerekir ve sorular ilandaki terimlere atıfta bulunur." },
      { label: "Pratik modu", text: "Soru gösterilir, siz cevabınızı yazarsınız ve araç en uygun hikâye kartını önerir. Öneri paylaşılan kelimelerle izlenebilir." }
    ]
  },
  tracker: {
    title: "Başvuru takibi",
    summary: "Her başvurunun nerede olduğunu gösteren bir Kanban panosu.",
    points: [
      { label: "Aşamalar", text: "Kaydedildi, başvuruldu, mülakat, teklif veya reddedildi." },
      { label: "Kart bağlantıları", text: "İlan, kullanılan CV varyantı, başvuru anındaki puan, notlar ve iletişim bilgileri." },
      { label: "Takip hatırlatmaları", text: "Örneğin \"7 gündür yanıt yok\"." },
      { label: "CSV ve JSON dışa aktarma", text: "Verilerinizi istediğiniz zaman dışa aktarın." },
      { label: "Tek tıkla silme", text: "Tüm verileri yerel olarak kaldırır." }
    ],
    outro: "Pano cihazınızda durur ve hesabınızla senkronize edilir."
  },
  "cv-builder": {
    title: "ATS uyumlu CV oluşturucu",
    summary: "Her dışa aktarımı kendi ayrıştırıcımızdan geçen bir düzenleyicide CV hazırlayın.",
    points: [
      { label: "JSON Resume şeması", text: "İçe ve dışa aktarma için standart bir format." },
      { label: "Düzenleyici formu", text: "Her alan düzenlenebilir." },
      { label: "Şablonlar", text: "Yoğun, sade ve modern PDF şablonları." },
      { label: "Kapalı döngü doğrulama", text: "Her dışa aktarım kendi ayrıştırıcımızdan geçer ve sonuç size gösterilir. CI testleri tüm şablonların Okunabilirlikte 25/25 aldığını doğrular." },
      { label: "DOCX dışa aktarma", text: "Word ve LibreOffice'te doğru açılır." },
      { label: "Mevcut CV'yi içe aktarma", text: "PDF veya DOCX düzenleyiciye aktarılır. Çıkarılamayan alanlar elle tamamlanmak üzere işaretlenir, hiçbir zaman uydurulmaz." }
    ]
  },
  linkedin: {
    title: "LinkedIn tutarlılık kontrolü",
    summary: "CV'nizi LinkedIn \"PDF olarak kaydet\" dosyasıyla karşılaştırır ve her tutarsızlığın iki tarafını da alıntılar.",
    intro: "CV'nizi ve LinkedIn'den aldığınız PDF'yi yükleyin (Daha fazla, ardından PDF olarak kaydet). Kontrol şunları raporlar:",
    points: [
      { text: "CV'deki bir rolün tarihi ile profildeki aynı rolün tarihi arasındaki farklar." },
      { text: "Aynı rol için farklı unvanlar." },
      { text: "CV'de olup profilde hiç geçmeyen beceriler." },
      { text: "CV başlığından farklı bir role işaret eden profil başlığı." }
    ],
    outro: "İki dosya da tarayıcınızda okunur. Her tutarsızlık CV'yi ve profili yan yana alıntılar."
  },
  languages: {
    title: "Çoklu dil desteği",
    summary: "İngilizce, Türkçe ve Almanca aynı motorla işlenir; kök alma ve tarih biçimleri dahil.",
    points: [
      { label: "Türkçe kök alma", text: "Anahtar kelime eşleştirmede Snowball Türkçe kök alıcı." },
      { label: "Almanca bileşik bölme", text: "\"Softwareentwicklung\" ifadesi \"Software\" ve \"Entwicklung\" olur." },
      { label: "Dile özgü durak sözcükler", text: "Her dil için ayarlanmıştır." },
      { label: "Kodlama bozulması kontrolü", text: "Bozuk ı İ ş ğ ç ö ü ä ß karakterleri Okunabilirlik bulgusu olarak raporlanır." },
      { label: "Tarih biçimleri", text: "\"Oca 2022\", \"Ocak 2022\", \"01.2022\", \"Jan. 2022\", \"März 2022\", \"heute\", \"halen\", \"devam ediyor\"." },
      { label: "Pazara göre tavsiye", text: "Hedef pazara göre fotoğraf, doğum tarihi, medeni hal ve askerlik durumu." },
      { label: "Europass algılama", text: "Europass düzenleri tanınır ve işaretlenir." }
    ]
  },
  ai: {
    title: "Yapay zekâ destekli düzeltmeler",
    summary: "Yapay zekâ açıklar ve önerir. Puan deterministiktir, yapay zekâ ona asla dokunmaz.",
    points: [
      { label: "Yerel model (Layer 1)", text: "Tarayıcıda çalışan gömme tabanlı anlamsal eşleştirme." },
      { label: "Kendi Ollama'nız (Layer 2)", text: "Makinenizde çalışan bir model; madde yeniden yazma, açıklama, ön yazı ve mülakat soruları için." },
      { label: "BYOK (Layer 3)", text: "Kendi API anahtarınızla daha güçlü modeller. Anahtar tarayıcıda kalır, sunucumuza gönderilmez." },
      { label: "Şema doğrulama", text: "Her model çıktısı bir JSON şemasına karşı doğrulanır. Geçemeyen çıktı gösterilmez." }
    ],
    outro: "Her yapay zekâ çıktısı, CV'de olmayan uydurma sayı, teknoloji veya kuruluş arayan bir dayanak (grounding) kontrolünden geçer."
  },
  reports: {
    title: "Rapor paylaşımı ve dışa aktarma",
    summary: "PDF ya da Markdown raporu indirin veya CV'nizden hiçbir satır içermeyen bir bağlantı paylaşın.",
    points: [
      { label: "PDF raporu", text: "Analiz raporunu PDF olarak indirin." },
      { label: "Paylaşım bağlantıları", text: "Puanları ve önerileri saklar, CV'den hiçbir satır içermez. Bağlantılar 30 gün sonra sona erer." },
      { label: "Markdown raporu", text: "Raporu Markdown olarak dışa aktarın." }
    ]
  },
  privacy: {
    title: "Gizlilik ve veri saklama",
    summary: "Neyin nerede okunduğu, neyin saklandığı ve ne zaman silindiği.",
    points: [
      { text: "CV önce tarayıcınızda okunur ve puanlanır." },
      { text: "Analiz ettiğinizde dosya, metni ve sonuç sunucuya gönderilir ve 12 ay saklanır." },
      { text: "12 ay sonra dosya, çıkarılan metin ve sonuç veritabanından ve depolamadan silinir." },
      { text: "Paylaşım bağlantıları puanları ve bulguları kanıtlar çıkarılmış olarak saklar, çünkü kanıtlar belgeden alınmış satırlar içerebilir." },
      { text: "Veri talep formuyla silme talebinde bulunabilirsiniz." }
    ]
  },
  history: {
    title: "Oturum geçmişi ve ilerleme",
    summary: "Puanın oturum boyunca nasıl değiştiğini ve her değişikliğin hangi bulguyu kapattığını görün.",
    points: [
      { label: "Oturum puan geçmişi", text: "Oturum boyunca puanın grafiği." },
      { label: "Değişiklik başına fark", text: "Her değişiklik için \"+4 · Anahtar kelime eşleşmesi\" gibi, hangi bulgunun kapandığını gösteren bir not." },
      { label: "Önceki ziyaretle karşılaştırma", text: "İkinci bir ziyaret, öncekine göre değişimi gösterir." }
    ]
  },
  help: {
    title: "Yardım sistemi",
    summary: "Anahtar kelime bankasından yanıt veren, hiçbir şey göndermeyen ve saklamayan bir site yardımcısı.",
    points: [
      { label: "Anahtar kelime tabanlı yardım", text: "Yardımcı bir anahtar kelime bankasından yanıt verir, sunucuya veri göndermez ve hiçbir şey saklamaz." },
      { label: "Bağlama duyarlı yanıtlar", text: "Yanıtlar mevcut analiz sonucunu hesaba katar." }
    ]
  }
};
