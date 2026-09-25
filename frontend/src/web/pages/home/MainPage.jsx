import React from 'react';
import { ShieldCheck, MapPin, Zap, User, Building2, CheckCircle2 } from 'lucide-react';

export default function MainPage({ onGoToLogin }) {
  return (
    <div className="min-h-screen bg-[#FAFBFD] font-sans selection:bg-neutral-900 selection:text-white">
      
      {/* HEADER / NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-950 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white fill-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-neutral-950">Mobool</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-bold">
            <button onClick={onGoToLogin} className="text-neutral-500 hover:text-neutral-900 transition cursor-pointer">Giriş Yap</button>
            <button onClick={onGoToLogin} className="px-4 py-2 bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition shadow-sm cursor-pointer">Kayıt Ol</button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck size={14} />
            <span>%100 Gizlilik Odaklı Eşleşme</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-neutral-950 leading-[1.1]">
            Hizmet bulmanın <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-500">en güvenli ve hızlı</span> yolu.
          </h1>
          
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            İhtiyacınızı kendi kelimelerinizle anlatın, konumunuzu seçin. Mobool sizi en uygun uzmanlarla eşleştirsin. İletişim bilgileriniz sadece siz onayladığınızda paylaşılır.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <button onClick={onGoToLogin} className="w-full sm:w-auto px-8 py-3.5 bg-neutral-950 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition shadow-sm cursor-pointer">
              <User size={18} />
              Hizmet Almak İstiyorum
            </button>
            <button onClick={onGoToLogin} className="w-full sm:w-auto px-8 py-3.5 bg-white border border-neutral-200 text-neutral-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-50 transition shadow-sm cursor-pointer">
              <Building2 size={18} />
              Hizmet Vermek İstiyorum
            </button>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
          <div className="bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
              <MapPin size={24} />
            </div>
            <h3 className="text-lg font-bold text-neutral-950 mb-3">Akıllı Konum & NLP</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Talebinizi doğal dille yazın. Sistem ihtiyacınızı anlar ve haritadaki konumunuza en yakın, en uygun uzmanları anında tarar.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-neutral-950 mb-3">Çift Taraflı Onay</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Sıraya giren adaylar arasından seçiminizi yapın. Uzman işi kabul edene kadar iletişim bilgileriniz kesinlikle gizli kalır.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 border border-amber-100">
              <Zap size={24} />
            </div>
            <h3 className="text-lg font-bold text-neutral-950 mb-3">Anında Açık Havuz</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Uzmanlar açık havuzdaki talepleri canlı olarak görür, uygun olanlara anında talip olur. Beklemek yok, zaman kaybı yok.
            </p>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="mt-32 mb-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-neutral-950 tracking-tight">Sistem Nasıl İşliyor?</h2>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-4 relative">
            <div className="flex-1 text-center relative z-10">
              <div className="w-16 h-16 bg-neutral-950 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">1</div>
              <h4 className="font-bold text-neutral-950 mb-2">Talep Oluştur</h4>
              <p className="text-xs text-neutral-500 px-4">İhtiyacını yaz, konumunu seç ve havaza gönder.</p>
            </div>
            
            <div className="flex-1 text-center relative z-10">
              <div className="w-16 h-16 bg-white border-2 border-neutral-950 text-neutral-950 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-sm">2</div>
              <h4 className="font-bold text-neutral-950 mb-2">Uzmanını Seç</h4>
              <p className="text-xs text-neutral-500 px-4">Talip olan uzmanları incele ve sana en uygun olanı seç.</p>
            </div>
            
            <div className="flex-1 text-center relative z-10">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md"><CheckCircle2 size={32} /></div>
              <h4 className="font-bold text-neutral-950 mb-2">Güvenle Görüş</h4>
              <p className="text-xs text-neutral-500 px-4">Uzman işi kabul ettiğinde maskeler kalkar, hizmet başlar.</p>
            </div>
          </div>
        </div>
      </main>
      
      {/* FOOTER */}
      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs font-medium text-neutral-500">
          <p>© 2026 Mobool. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}