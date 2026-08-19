const { pool } = require('./db');

const initial100Providers = [
  // 1. Su & Damacana Dağıtım (10 Adet)
  ["Erikli Su Kadıköy Bayi", "+905321010001", "kadikoy@eriklibayi.com", ["su", "damacana", "erikli", "su siparişi", "kadıköy", "damacana su", "içme suyu", "sucu"], ["PHONE", "SMS"], 105],
  ["Saka Su Moda Dağıtım", "+905321010002", "moda@sakabayisi.com", ["su", "damacana", "saka", "moda", "kadıköy", "su siparişi", "ph", "doğal kaynak suyu"], ["PHONE", "SMS"], 100],
  ["Hamidiye Su Üsküdar", "+905321010003", "uskudar@hamidiyesu.com", ["su", "damacana", "hamidiye", "üsküdar", "içme suyu", "cam damacana", "sucu"], ["PHONE", "SMS"], 98],
  ["Kuzeyden Su Ataşehir", "+905321010004", "atasehir@kuzeyden.com", ["su", "damacana", "kuzeyden", "ataşehir", "su siparişi", "damacana su", "cam şişe"], ["PHONE", "SMS"], 95],
  ["Pınar Su Beşiktaş", "+905321010005", "besiktas@pinarsu.com", ["su", "damacana", "pınar", "beşiktaş", "levent", "su siparişi", "sucu"], ["PHONE", "SMS"], 94],
  ["Sırma Su Şişli Bayi", "+905321010006", "sisli@sirmabayisi.com", ["su", "damacana", "sırma", "şişli", "mecidiyeköy", "maden suyu", "su siparişi"], ["PHONE", "SMS"], 92],
  ["Hayat Su Maltepe", "+905321010007", "maltepe@hayatsu.com", ["su", "damacana", "hayat", "maltepe", "kartal", "su siparişi", "damacana su"], ["PHONE", "SMS"], 90],
  ["Munzur Su Beyoğlu", "+905321010008", "beyoglu@munzursu.com", ["su", "damacana", "munzur", "beyoğlu", "taksim", "cihangir", "doğal su"], ["PHONE", "SMS"], 89],
  ["Abant Su Bakırköy", "+905321010009", "bakirkoy@abantsu.com", ["su", "damacana", "abant", "bakırköy", "ataköy", "su sipariş", "sucu"], ["PHONE", "SMS"], 88],
  ["Taşkesti Su Pendik", "+905321010010", "pendik@taskestisu.com", ["su", "damacana", "taşkesti", "pendik", "kurtköy", "su siparişi", "damacana su"], ["PHONE", "SMS"], 87],

  // 2. Sıhhi Tesisat & Su Tesisatçısı (10 Adet)
  ["Usta Tesisat Kadıköy", "+905321020001", "kadikoy@ustatesisat.com", ["tesisat", "tesisatçı", "su kaçağı", "boru", "musluk", "tıkanıklık", "klozet", "kadıköy", "su tesisatçısı", "gider açma"], ["PHONE", "SMS"], 108],
  ["Acil Tesisat Üsküdar", "+905321020002", "uskudar@tesisatustasi.com", ["tesisat", "tesisatçı", "su sızıntısı", "lavabo açma", "pimaş", "klozet tamiri", "üsküdar", "acil tesisatçı"], ["PHONE", "SMS"], 102],
  ["Kameralı Su Kaçağı Tespiti Beşiktaş", "+905321020003", "info@kameralikacak.com", ["tesisat", "su kaçağı", "kırmadan dökmeden", "kameralı tespit", "beşiktaş", "şişli", "kaçak tespiti", "boru patlağı"], ["PHONE", "SMS"], 100],
  ["Moda Sıhhi Tesisat", "+905321020004", "moda@sihhitesisat.com", ["tesisat", "musluk", "batarya", "duşakabin", "rezervuar", "moda", "kadıköy", "su ustası", "sifon tamiri"], ["PHONE", "SMS"], 96],
  ["Ataşehir Tıkanıklık Açma", "+905321020005", "atasehir@tikaniklik.com", ["tıkanıklık", "tuvalet açma", "lavabo", "pimaş açma", "robotla açma", "ataşehir", "tesisatçı"], ["PHONE", "SMS"], 94],
  ["Şişli Tesisat & Kalorifer", "+905321020006", "sisli@tesisatkalorifer.com", ["tesisat", "kalorifer", "radyatör", "petek temizleme", "şişli", "musluk montajı", "kombi borusu"], ["PHONE", "SMS"], 92],
  ["Bakırköy Su Tesisat Ustası", "+905321020007", "bakirkoy@sutesisati.com", ["tesisat", "tesisatçı", "su kaçağı", "musluk tamiri", "bakırköy", "florya", "klozet montajı"], ["PHONE", "SMS"], 90],
  ["Maltepe Acil Tesisat Servisi", "+905321020008", "maltepe@acilsu.com", ["tesisat", "acil tesisatçı", "gider borusu", "maltepe", "kartal", "su basması", "küvet tamiri"], ["PHONE", "SMS"], 89],
  ["Beyoğlu Cihangir Tesisatçısı", "+905321020009", "cihangir@tesisatci.com", ["tesisat", "musluk", "eski bina tesisatı", "beyoğlu", "cihangir", "karaköy", "su kaçağı"], ["PHONE", "SMS"], 88],
  ["Sarıyer Boğaz Tesisat", "+905321020010", "sariyer@bogaztesisat.com", ["tesisat", "tesisatçı", "hidrofor", "su deposu", "sarıyer", "tarabya", "yeniköy", "su ustası"], ["PHONE", "SMS"], 86],

  // 3. Çilingir & Kilit & Kapı Açma (10 Adet)
  ["7/24 Acil Çilingir Kadıköy", "+905321030001", "kadikoy@cilingir724.com", ["çilingir", "anahtar", "kilit", "kapı açma", "oto çilingir", "kale kilit", "kadıköy", "kilit değişimi", "çilingirci"], ["PHONE", "SMS"], 110],
  ["Moda & Caferağa Çilingir Servisi", "+905321030002", "moda@cilingir.com", ["çilingir", "anahtar", "çelik kapı", "kilit", "moda", "kadıköy", "anahtarcı", "kilit göbeği"], ["PHONE", "SMS"], 104],
  ["Beşiktaş Nöbetçi Çilingir", "+905321030003", "besiktas@nobetcicilingir.com", ["çilingir", "anahtarcı", "kapıda kaldım", "beşiktaş", "levent", "ortaköy", "kilit değiştirme"], ["PHONE", "SMS"], 102],
  ["Üsküdar Çilingir & Kasa Açma", "+905321030004", "uskudar@cilingirkasa.com", ["çilingir", "kasa açma", "çelik kasa", "üsküdar", "altunizade", "anahtar kopyalama", "kilit"], ["PHONE", "SMS"], 97],
  ["Ataşehir Acil Anahtarcı", "+905321030005", "atasehir@anahtarci.com", ["çilingir", "anahtarcı", "oto anahtar", "ataşehir", "batı ataşehir", "immobilizer", "kapı açma"], ["PHONE", "SMS"], 95],
  ["Şişli & Mecidiyeköy Çilingir", "+905321030006", "sisli@hizlicilingir.com", ["çilingir", "kilit", "göbek değişimi", "şişli", "mecidiyeköy", "nişantaşı", "çelik kapı kilidi"], ["PHONE", "SMS"], 93],
  ["Bakırköy Güven Çilingir", "+905321030007", "bakirkoy@guvencilingir.com", ["çilingir", "anahtar", "barel değişimi", "bakırköy", "yeşilköy", "ataköy", "hırsız kilidi"], ["PHONE", "SMS"], 91],
  ["Maltepe Gece Çilingiri", "+905321030008", "maltepe@gececilingir.com", ["çilingir", "gece açık çilingir", "kapı açma", "maltepe", "küçükyalı", "anahtar", "kilit"], ["PHONE", "SMS"], 90],
  ["Beyoğlu Taksim Çilingir", "+905321030009", "taksim@cilingirservisi.com", ["çilingir", "anahtarcı", "beyoğlu", "taksim", "galata", "kilit açma", "asma kilit"], ["PHONE", "SMS"], 89],
  ["Sarıyer Acil Oto & Ev Çilingir", "+905321030010", "sariyer@otocilingir.com", ["çilingir", "oto çilingir", "araba kapısı", "sarıyer", "maslak", "anahtarcı", "kilit"], ["PHONE", "SMS"], 88],

  // 4. Elektrik & Aydınlatma & Sigorta (10 Adet)
  ["Kadıköy Acil Elektrikçi", "+905321040001", "kadikoy@acilelektrik.com", ["elektrik", "elektrikçi", "sigorta", "kaçak akım", "şalter", "avize montajı", "kadıköy", "priz", "elektrik arıza"], ["PHONE", "SMS"], 107],
  ["Moda Aydınlatma & Elektrik Ustası", "+905321040002", "moda@elektrikustasi.com", ["elektrik", "elektrikçi", "led aydınlatma", "spot", "avize", "moda", "kadıköy", "kablo çekimi"], ["PHONE", "SMS"], 101],
  ["Beşiktaş 7/24 Elektrik Servisi", "+905321040003", "besiktas@724elektrik.com", ["elektrik", "elektrikçi", "elektrik kesintisi", "sigorta attı", "beşiktaş", "etiler", "kısa devre"], ["PHONE", "SMS"], 99],
  ["Üsküdar Elektrik & Tesisat", "+905321040004", "uskudar@elektriktesisat.com", ["elektrik", "elektrikçi", "şalter değişimi", "üsküdar", "kısıklı", "internet kablosu", "priz tamiri"], ["PHONE", "SMS"], 96],
  ["Ataşehir Elektrik & Akıllı Ev", "+905321040005", "atasehir@akilliev.com", ["elektrik", "akıllı ev", "otomasyon", "ataşehir", "led şerit", "pano arıza", "elektrikçi"], ["PHONE", "SMS"], 94],
  ["Şişli Acil Elektrik Arıza", "+905321040006", "sisli@elektrikariza.com", ["elektrik", "elektrikçi", "arıza", "sigorta panosu", "şişli", "fulya", "kablo arızası"], ["PHONE", "SMS"], 92],
  ["Bakırköy Uzman Elektrik", "+905321040007", "bakirkoy@uzmanelektrik.com", ["elektrik", "elektrikçi", "avize takma", "bakırköy", "incirli", "topraklama", "kısa devre"], ["PHONE", "SMS"], 90],
  ["Maltepe Elektrik & İnternet Tesisatı", "+905321040008", "maltepe@internettesisati.com", ["elektrik", "internet kablosu", "cat6", "modem kurulumu", "maltepe", "elektrikçi"], ["PHONE", "SMS"], 89],
  ["Beyoğlu Cihangir Elektrik Servisi", "+905321040009", "cihangir@elektrikservisi.com", ["elektrik", "elektrikçi", "eski bina kablolama", "beyoğlu", "cihangir", "avize montaj"], ["PHONE", "SMS"], 88],
  ["Sarıyer Maslak Elektrik Proje & Bakım", "+905321040010", "maslak@elektrikproje.com", ["elektrik", "elektrikçi", "ofis elektriği", "maslak", "sarıyer", "jeneratör", "ups"], ["PHONE", "SMS"], 87],

  // 5. Ev Temizliği & Halı & Koltuk Yıkama (10 Adet)
  ["Kadıköy Pırıl Ev Temizliği", "+905321050001", "kadikoy@piriltemizlik.com", ["temizlik", "ev temizliği", "gündelikçi", "ofis temizliği", "kadıköy", "derin temizlik", "boş ev temizliği"], ["PHONE", "SMS"], 106],
  ["Moda Koltuk & Yatak Yıkama", "+905321050002", "moda@koltukyikama.com", ["koltuk yıkama", "yatak yıkama", "buharlı yıkama", "moda", "kadıköy", "temizlik", "koltuk lekeleri"], ["PHONE", "SMS"], 101],
  ["Beşiktaş Profesyonel Halı Yıkama", "+905321050003", "besiktas@haliyikama.com", ["halı yıkama", "el dokuma halı", "kilim yıkama", "beşiktaş", "levent", "halı temizliği"], ["PHONE", "SMS"], 98],
  ["Üsküdar İnşaat Sonrası Temizlik", "+905321050004", "uskudar@insaatsonrasitemizlik.com", ["temizlik", "inşaat sonrası temizlik", "tadilat sonrası", "üsküdar", "cam temizliği", "ev temizliği"], ["PHONE", "SMS"], 95],
  ["Ataşehir Ofis & Villa Temizliği", "+905321050005", "atasehir@villatemizlik.com", ["temizlik", "ofis temizliği", "villa temizliği", "ataşehir", "dış cephe cam", "şirket temizliği"], ["PHONE", "SMS"], 93],
  ["Şişli Yardımcı & Ev İşleri", "+905321050006", "sisli@yardimcihizmetleri.com", ["temizlik", "gündelikçi", "ev işleri", "ütü", "şişli", "nişantaşı", "ev temizlik"], ["PHONE", "SMS"], 92],
  ["Bakırköy Buharlı Koltuk Yıkama", "+905321050007", "bakirkoy@buharlikoltuk.com", ["koltuk yıkama", "buharlı temizlik", "araç koltuk yıkama", "bakırköy", "yeşilyurt", "leke çıkarma"], ["PHONE", "SMS"], 90],
  ["Maltepe Halı & Perde Yıkama", "+905321050008", "maltepe@perdeyikama.com", ["halı yıkama", "stor perde yıkama", "zebra perde", "maltepe", "kartal", "perde temizleme"], ["PHONE", "SMS"], 89],
  ["Beyoğlu Dezenfeksiyon & Temizlik", "+905321050009", "beyoglu@dezenfeksiyon.com", ["temizlik", "dezenfeksiyon", "ilaçlama", "beyoğlu", "cihangir", "apartman temizliği"], ["PHONE", "SMS"], 88],
  ["Sarıyer Premium Ev & Rezidans Temizliği", "+905321050010", "sariyer@rezidanstemizlik.com", ["temizlik", "rezidans temizliği", "lüks ev temizliği", "sarıyer", "maslak", "tarabya"], ["PHONE", "SMS"], 87],

  // 6. Kombi, Klima & Beyaz Eşya Servisi (10 Adet)
  ["Kadıköy Yetkili Kombi & Klima Servisi", "+905321060001", "kadikoy@kombiklima.com", ["kombi", "klima", "kombi tamiri", "klima montajı", "petek temizliği", "kadıköy", "klima gazı", "bakım"], ["PHONE", "SMS"], 108],
  ["Moda Beyaz Eşya Tamir Servisi", "+905321060002", "moda@beyazesya.com", ["beyaz eşya", "çamaşır makinesi", "bulaşık makinesi", "buzdolabı", "moda", "kadıköy", "tamirci", "servis"], ["PHONE", "SMS"], 103],
  ["Beşiktaş Vaillant & Demirdöküm Kombi Servisi", "+905321060003", "besiktas@kombibakim.com", ["kombi", "vaillant", "demirdöküm", "baymak", "beşiktaş", "kombi arıza", "sıcak su arızası"], ["PHONE", "SMS"], 99],
  ["Üsküdar Klima Gaz Dolumu & Bakım", "+905321060004", "uskudar@klimaservis.com", ["klima", "klima gazı", "klima temizliği", "üsküdar", "inverter klima", "soğutmuyor", "klima tamiri"], ["PHONE", "SMS"], 96],
  ["Ataşehir Bosch & Siemens Beyaz Eşya Özel Servis", "+905321060005", "atasehir@beyazesyaozel.com", ["beyaz eşya", "bosch", "siemens", "profilo", "buzdolabı motoru", "ataşehir", "çamaşır makinesi tamiri"], ["PHONE", "SMS"], 94],
  ["Şişli Kombi Kart Tamiri & Servisi", "+905321060006", "sisli@kombikart.com", ["kombi", "elektronik kart", "ana kart tamiri", "şişli", "mecidiyeköy", "kombi ateşlemiyor"], ["PHONE", "SMS"], 92],
  ["Bakırköy Beko & Arçelik Servis Merkezi", "+905321060007", "bakirkoy@arcelikozel.com", ["beyaz eşya", "arçelik", "beko", "fırın tamiri", "ocak", "bakırköy", "bulaşık makinesi su akıtıyor"], ["PHONE", "SMS"], 91],
  ["Maltepe Klima Sökme & Takma", "+905321060008", "maltepe@klimamontaj.com", ["klima", "klima sökme", "klima taşıma", "montaj", "maltepe", "kartal", "klima ustası"], ["PHONE", "SMS"], 89],
  ["Beyoğlu Acil Kombi Tamircisi", "+905321060009", "beyoglu@acilkombi.com", ["kombi", "acil kombici", "petekler ısınmıyor", "beyoğlu", "taksim", "kombi su damlatıyor"], ["PHONE", "SMS"], 88],
  ["Sarıyer Daikin & Mitsubishi Klima Servisi", "+905321060010", "sariyer@daikinozel.com", ["klima", "daikin", "mitsubishi", "vrf klima", "sarıyer", "maslak", "klima arızası"], ["PHONE", "SMS"], 87],

  // 7. Nakliyat, Parça Eşya & Kurye (10 Adet)
  ["Kadıköy Hızlı Kurye & Moto Kurye", "+905321070001", "kadikoy@motokurye.com", ["kurye", "moto kurye", "acil kurye", "paket", "evrak", "kadıköy", "hızlı teslimat", "motorlu kurye"], ["PHONE", "SMS"], 107],
  ["Moda Parça Eşya & Kamyonet Nakliye", "+905321070002", "moda@parcanakliye.com", ["nakliye", "parça eşya", "kamyonet", "küçük nakliye", "moda", "kadıköy", "öğrenci evi taşıma", "koltuk taşıma"], ["PHONE", "SMS"], 102],
  ["Beşiktaş Evden Eve Nakliyat", "+905321070003", "besiktas@evdeneve.com", ["nakliyat", "evden eve", "asansörlü nakliyat", "beşiktaş", "levent", "eşya taşıma", "paketleme", "marangozlu nakliye"], ["PHONE", "SMS"], 99],
  ["Üsküdar Doblo Nakliye & Şehir İçi", "+905321070004", "uskudar@doblonakliye.com", ["nakliye", "doblo", "kamyonet", "parça eşya taşıma", "üsküdar", "ikea eşya taşıma"], ["PHONE", "SMS"], 96],
  ["Ataşehir VIP Ofis & Ev Taşıma", "+905321070005", "atasehir@viptasima.com", ["nakliyat", "ofis taşıma", "şirket taşıma", "ataşehir", "sigortalı nakliyat", "villa taşıma"], ["PHONE", "SMS"], 94],
  ["Şişli Gece & Gündüz Moto Kurye", "+905321070006", "sisli@gecekurye.com", ["kurye", "gece kurye", "nöbetçi kurye", "ilaç kurye", "şişli", "mecidiyeköy", "acil evrak"], ["PHONE", "SMS"], 92],
  ["Bakırköy Asansörlü Evden Eve", "+905321070007", "bakirkoy@asansorlutasima.com", ["nakliyat", "asansörlü", "yüksek kat nakliye", "bakırköy", "ataköy", "ev taşıma"], ["PHONE", "SMS"], 90],
  ["Maltepe Eşya Depolama & Nakliye", "+905321070008", "maltepe@esyadepolama.com", ["nakliyat", "eşya depolama", "kiralık depo", "maltepe", "kartal", "oda depo"], ["PHONE", "SMS"], 89],
  ["Beyoğlu Yük Taksi & Şehir İçi Nakliyat", "+905321070009", "beyoglu@yuktaksi.com", ["nakliye", "yük taksi", "kamyonet", "beyoğlu", "karaköy", "taksim", "hızlı taşıma"], ["PHONE", "SMS"], 88],
  ["Sarıyer Şehirlerarası Nakliyat", "+905321070010", "sariyer@sehirlerarasi.com", ["nakliyat", "şehirlerarası nakliye", "ankara izmir bodrum nakliyat", "sarıyer", "maslak"], ["PHONE", "SMS"], 87],

  // 8. Oto Kurtarma & Çekici & Lastikçi (10 Adet)
  ["Kadıköy 7/24 Oto Kurtarma & Çekici", "+905321080001", "kadikoy@otocikici.com", ["çekici", "oto kurtarma", "yol yardım", "akü takviye", "kadıköy", "e5 çekici", "araba arızası", "araç çekici"], ["PHONE", "SMS"], 110],
  ["Moda Mobil Lastikçi & Akü", "+905321080002", "moda@mobillastik.com", ["lastikçi", "mobil lastik", "yerinde lastik değişimi", "akü bitti", "moda", "kadıköy", "lastik patladı"], ["PHONE", "SMS"], 103],
  ["Beşiktaş Boğaz Çekici & Yol Yardım", "+905321080003", "besiktas@bogazcekici.com", ["çekici", "oto kurtarma", "beşiktaş", "barbaros", "ortaköy", "araba çekme", "kaza yardım"], ["PHONE", "SMS"], 99],
  ["Üsküdar & Avrasya Tüneli Çekici", "+905321080004", "uskudar@avrasyacekici.com", ["çekici", "oto kurtarma", "tünel çekici", "üsküdar", "harem", "yolda kaldım"], ["PHONE", "SMS"], 97],
  ["Ataşehir 7/24 Gezici Lastikçi", "+905321080005", "atasehir@geziciLastik.com", ["lastikçi", "gece lastikçi", "çıkma lastik", "ataşehir", "tem otoyolu", "lastik tamiri"], ["PHONE", "SMS"], 94],
  ["Şişli & E5 Hızlı Oto Çekici", "+905321080006", "sisli@hizlicekici.com", ["çekici", "oto kurtarma", "şişli", "mecidiyeköy", "çağlayan", "yol yardım", "kurtarıcı"], ["PHONE", "SMS"], 92],
  ["Bakırköy Sahil Çekici Servisi", "+905321080007", "bakirkoy@sahilcekici.com", ["çekici", "oto kurtarma", "sahil yolu", "bakırköy", "yeşilköy", "araba taşlama"], ["PHONE", "SMS"], 90],
  ["Maltepe E5 & Minibüs Yolu Çekici", "+905321080008", "maltepe@e5cekici.com", ["çekici", "oto kurtarıcı", "maltepe", "küçükyalı", "kartal", "akü takviyesi"], ["PHONE", "SMS"], 89],
  ["Beyoğlu & Haliç Acil Çekici", "+905321080009", "beyoglu@haliccekici.com", ["çekici", "kurtarma", "beyoğlu", "kasımpaşa", "haliç köprüsü", "araç kurtarma"], ["PHONE", "SMS"], 88],
  ["Sarıyer & Kuzey Marmara Çekici", "+905321080010", "sariyer@kuzeycekici.com", ["çekici", "kuzey marmara otoyolu çekici", "sarıyer", "maslak", "otoban yardım"], ["PHONE", "SMS"], 87],

  // 9. Boya Badana, Alçı & Ev Tadilatı (10 Adet)
  ["Kadıköy Usta Boyacı & Badana", "+905321090001", "kadikoy@ustaboyaci.com", ["boyacı", "boya badana", "ev boyama", "alçı", "jotun", "filli boya", "kadıköy", "tadilat", "badana ustası"], ["PHONE", "SMS"], 106],
  ["Moda İç Mimarlık & Tadilat", "+905321090002", "moda@evyenileme.com", ["tadilat", "ev yenileme", "mutfak dolabı", "banyo tadilatı", "moda", "kadıköy", "parke", "fayans"], ["PHONE", "SMS"], 102],
  ["Beşiktaş Temiz Boya & Alçıpan", "+905321090003", "besiktas@temizboya.com", ["boya", "badana", "alçıpan", "kartonpiyer", "beşiktaş", "levent", "1 günde boya"], ["PHONE", "SMS"], 98],
  ["Üsküdar Parke & Fayans Döşeme Ustası", "+905321090004", "uskudar@parkefayans.com", ["parke", "laminat", "fayans", "seramik", "üsküdar", "zemin kaplama", "kalebodur"], ["PHONE", "SMS"], 95],
  ["Ataşehir Komple Daire Tadilatı", "+905321090005", "atasehir@kompletadilat.com", ["tadilat", "anahtar teslim tadilat", "dekorasyon", "ataşehir", "kırma dökme", "duvar örme"], ["PHONE", "SMS"], 93],
  ["Şişli Duvar Kağıdı & İtalyan Boya", "+905321090006", "sisli@italyanboya.com", ["duvar kağıdı", "italyan boya", "dekoratif boya", "şişli", "nişantaşı", "boyacı"], ["PHONE", "SMS"], 91],
  ["Bakırköy Çatı & Su İzolasyonu", "+905321090007", "bakirkoy@izolasyon.com", ["izolasyon", "çatı tamiri", "su yalıtımı", "rutubet giderme", "bakırköy", "dış cephe"], ["PHONE", "SMS"], 90],
  ["Maltepe Marangoz & Mobilya Montajı", "+905321090008", "maltepe@mobilyamontaj.com", ["marangoz", "mobilya montajı", "ikea kurulum", "dolap tamiri", "maltepe", "kartal"], ["PHONE", "SMS"], 89],
  ["Beyoğlu Tarihi Eser & Ahşap Restorasyon", "+905321090009", "beyoglu@ahsaprestorasyon.com", ["marangoz", "ahşap tamiri", "panjur", "beyoğlu", "galata", "tarihi ahşap kapı"], ["PHONE", "SMS"], 88],
  ["Sarıyer Mutfak & Banyo Yenileme", "+905321090010", "sariyer@banyoyenileme.com", ["banyo tadilatı", "duşakabin montajı", "tezgah", "sarıyer", "zekeriyaköy", "seramik ustası"], ["PHONE", "SMS"], 87],

  // 10. Bilgisayar, Telefon & Elektronik Tamir (10 Adet)
  ["Kadıköy Apple & Mac Tamir Servisi", "+905321100001", "kadikoy@mactamir.com", ["bilgisayar", "telefon tamiri", "iphone", "macbook", "ekran değişimi", "batarya", "kadıköy", "format", "laptop tamiri"], ["PHONE", "SMS"], 108],
  ["Moda Bilişim & Laptop Onarım", "+905321100002", "moda@bilgisayaronarim.com", ["bilgisayar", "laptop", "ssd takma", "ram yükseltme", "format", "moda", "kadıköy", "pc arıza"], ["PHONE", "SMS"], 102],
  ["Beşiktaş Hızlı Telefon Ekran Değişimi", "+905321100003", "besiktas@telefontamir.com", ["telefon tamiri", "samsung", "iphone", "ekran kırıldı", "şarj soketi", "beşiktaş", "orijinal parça"], ["PHONE", "SMS"], 99],
  ["Üsküdar Tablet & iPad Tamir Merkezi", "+905321100004", "uskudar@tablettamir.com", ["tablet tamiri", "ipad", "dokunmatik cam", "üsküdar", "batarya değişimi", "anakart tamiri"], ["PHONE", "SMS"], 95],
  ["Ataşehir Veri Kurtarma & IT Destek", "+905321100005", "atasehir@verikurtarma.com", ["veri kurtarma", "harddisk tamiri", "silinen dosyalar", "it destek", "ataşehir", "şirket bilgisayar servisi"], ["PHONE", "SMS"], 94],
  ["Şişli & Mecidiyeköy Yazıcı & Kartuş Dolumu", "+905321100006", "sisli@yazicitamir.com", ["yazıcı tamiri", "toner dolumu", "kartuş", "şişli", "mecidiyeköy", "fotokopi arızası"], ["PHONE", "SMS"], 92],
  ["Bakırköy Playstation & Konsol Tamir", "+905321100007", "bakirkoy@konsoltamir.com", ["playstation", "ps5 tamiri", "kol tamiri", "xbox", "bakırköy", "hdmi soket"], ["PHONE", "SMS"], 90],
  ["Maltepe Kamera & Güvenlik Sistemleri", "+905321100008", "maltepe@guvenlikkamera.com", ["güvenlik kamerası", "cctv", "alarm sistemi", "maltepe", "kartal", "kamera kurulumu"], ["PHONE", "SMS"], 89],
  ["Beyoğlu Ses & Işık Sistemleri Onarımı", "+905321100009", "beyoglu@sessistemi.com", ["ses sistemi", "amfi tamiri", "hoparlör", "beyoğlu", "cihangir", "elektronik tamir"], ["PHONE", "SMS"], 88],
  ["Sarıyer Akıllı Telefon & Yazılım Servisi", "+905321100010", "sariyer@telefonservisi.com", ["telefon tamiri", "yazılım sıfırlama", "icloud", "maslak", "sarıyer", "ekran cam değişimi"], ["PHONE", "SMS"], 87]
];

const initDatabase = async () => {
  try {
    // 1. service_providers tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_providers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        service_keywords TEXT[] NOT NULL,
        communication_channels TEXT[] NOT NULL DEFAULT ARRAY['PHONE'],
        priority_score INTEGER DEFAULT 100,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. requests tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        raw_text TEXT NOT NULL,
        disambiguation_choice TEXT,
        keywords TEXT[],
        contact_value VARCHAR(100) NOT NULL,
        location VARCHAR(255) DEFAULT 'İstanbul, Türkiye',
        is_urgent BOOLEAN DEFAULT FALSE,
        deadline_datetime TIMESTAMP WITH TIME ZONE,
        preferred_channel VARCHAR(50) NOT NULL DEFAULT 'PHONE',
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        matched_provider_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE requests ADD COLUMN IF NOT EXISTS location VARCHAR(255) DEFAULT 'İstanbul, Türkiye';
      ALTER TABLE requests ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT FALSE;
      ALTER TABLE requests ADD COLUMN IF NOT EXISTS deadline_datetime TIMESTAMP WITH TIME ZONE;
      ALTER TABLE requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_status_check;
      ALTER TABLE requests DROP CONSTRAINT IF EXISTS check_status;
    `);

    // 3. Foreign key onarımı
    await pool.query(`
      ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_matched_provider_id_fkey;
      ALTER TABLE requests 
      ADD CONSTRAINT requests_matched_provider_id_fkey 
      FOREIGN KEY (matched_provider_id) 
      REFERENCES service_providers(id) 
      ON DELETE SET NULL;
    `);

    // 4. Giden SMS Bildirim Log Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS outbound_notifications (
        id SERIAL PRIMARY KEY,
        request_id INTEGER,
        recipient_type VARCHAR(20) NOT NULL,
        recipient_phone VARCHAR(50) NOT NULL,
        channel VARCHAR(20) NOT NULL DEFAULT 'SMS',
        message_body TEXT NOT NULL,
        sent_status VARCHAR(20) DEFAULT 'DELIVERED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. OTP Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(50) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Proje Özellikleri Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS project_features (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        target_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'BEKLİYOR',
        priority VARCHAR(50) NOT NULL DEFAULT 'ORTA',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Değerlendirme & Yorum Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        request_id INTEGER NOT NULL,
        reviewer_type VARCHAR(20) NOT NULL,
        rating INTEGER,
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_req_reviewer ON reviews (request_id, reviewer_type);
    `);

    // 8. Test Senaryoları Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_cases (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        tester_name VARCHAR(100) DEFAULT 'Admin/Tester',
        test_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(50) DEFAULT 'BEKLİYOR',
        result_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 🌟 100 ADET SAĞLAYICIYI VERİTABANINA YÜKLE (Eğer tablo boşsa veya az kayıt varsa)
    const { rowCount: providerCount } = await pool.query('SELECT id FROM service_providers LIMIT 10;');
    if (providerCount < 10) {
      console.log('📦 100 Adet Servis Sağlayıcı Veritabanına Yükleniyor...');
      for (const prov of initial100Providers) {
        await pool.query(`
          INSERT INTO service_providers (name, phone, email, service_keywords, communication_channels, priority_score, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, TRUE)
          ON CONFLICT DO NOTHING;
        `, prov);
      }
      console.log('✅ 100 Sağlayıcı Başarıyla Eklendi!');
    }

    // Sequence Eşitlemeleri
    await pool.query(`
      SELECT setval(pg_get_serial_sequence('service_providers', 'id'), COALESCE((SELECT MAX(id) FROM service_providers), 1), true);
      SELECT setval(pg_get_serial_sequence('requests', 'id'), COALESCE((SELECT MAX(id) FROM requests), 1), true);
      SELECT setval(pg_get_serial_sequence('project_features', 'id'), COALESCE((SELECT MAX(id) FROM project_features), 1), true);
      SELECT setval(pg_get_serial_sequence('reviews', 'id'), COALESCE((SELECT MAX(id) FROM reviews), 1), true);
      SELECT setval(pg_get_serial_sequence('test_cases', 'id'), COALESCE((SELECT MAX(id) FROM test_cases), 1), true);
    `);

    console.log('✅ Veritabanı ve 100 Sağlayıcı Havuzu tamamen hazırlandı.');
  } catch (error) {
    console.error('❌ Tablo başlatma hatası:', error.message);
  }
};

module.exports = initDatabase;