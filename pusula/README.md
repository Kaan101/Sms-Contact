# Pusula — ilk çalışan sürüm

Bu sürüm örnek Hasar Yönetimi verileriyle başlar. Kurumsal veriler girilmeden önce süreç sahipleri örnek risk, kontrol ve prosedürleri kurumlarına göre değerlendirmelidir.

Giriş ChatGPT hesabıyla yapılır. İlk yönetici e-postası sunucuda OWNER_EMAIL ile belirlenir. Kullanıcı ilk girişte yönetici hesabını etkinleştirir; diğer üyeleri ve rolleri Sistem Yönetimi ekranından tanımlar. Sites erişimi ayrıca özel tutulur; uygulamada kullanıcı eklemek tek başına site paylaşımını açmaz.

Kapsam: süreç hiyerarşisi, harita/akış/ilişki görünümü, risk ısı haritası, kontrol/doküman/aksiyon kütüphaneleri, ek alanlar, arama, JSON dışa aktarım, kullanıcı/rol yönetimi, iki aşamalı onay, değişiklik geçmişi ve KRI kayıtları.

Sınırlar: AI önerileri, kurum SSO bağlantısı, e-posta bildirim gönderimi, belge dosyası yükleme ve dış sistemlerden otomatik KRI beslemesi henüz yoktur. Doküman içeriği ve bağlantısı kaydedilebilir. Risk trendi çok dönem verisi gerektirir. Standartlara uygunluk sertifikası veya denetim güvencesi sunulmaz. İlk sürüm verileri D1 üzerinde tek sürümlü çalışma alanı kaydında saklar; büyük kurum ölçeği için normalleştirilmiş veri modeli ve kapsamlı performans/güvenlik değerlendirmesi gerekir. Tarayıcı görsel testi ve WebMCP çalışma zamanı doğrulaması yapılmadı.

Doğrulama: üretim derlemesi, TypeScript kontrolü; yetkisiz giriş/düzenleme, rol tanımlama, ilk yönetici, risk değerleri, kendi talebini onaylama engeli, iki kişiyle onay, sürüm çakışması, hiyerarşi döngüsü, denetim izi ve örnek veri bütünlüğü davranış testleri.
