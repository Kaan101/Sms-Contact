import React from 'react';
import { ShieldCheck, MapPin, Zap, User, Building2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function MainPage({ onGoToLogin }) {
  return (
    {/* Arka planı hafif sıcak bir gri tonunda bırakıyoruz ki vişne ve mürekkep öne çıksın */}
    <div className="min-h-screen bg-[#FDFDFC] font-sans selection:bg-rose-900 selection:text-white">
      
      {/* HEADER / NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo Kutusu: Vişne Çürüğü */}
            <div className="w-8 h-8 bg-rose-900 rounded-xl flex items-center justify-center shadow-sm">
              <Zap size={16} className="text-white fill-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-950">Mobool</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-bold">
            <button onClick={onGoToLogin} className="text-slate-500 hover:text-slate-950 transition cursor-pointer">Giriş Yap</button>
            {/* Kayıt Butonu: Mürekkep */}
            <button onClick={onGoToLogin} className="px-5 py-2 bg-slate-950 text-white rounded-lg hover:bg-slate-800 transition shadow-sm cursor-pointer">
              Kayıt Ol
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          {/* Badge: Vişne Çürüğü Tonları */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck size={14} />
            <span>%100 Gizlilik Odaklı Eşleşme</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.15]">
            Hizmet bulmanın <br className="hidden sm:block" />
            {/* Gradient: Mürekkepten Vişne Çürüğüne geçiş */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-950 to-rose-800">
              en güvenli ve hızlı
            </span> yolu.
          </h1>
          
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            İhtiyacınızı kendi kelimelerinizle anlatın, konumunuzu seçin. Mobool sizi en uygun uzmanlarla eşleştirsin. İletişim bilgileriniz sadece siz onayladığınızda paylaşılır.
          </p>

          <div className="flex items-center justify-center pt-8">
            {/* Ana Eylem Butonu: Vişne Çürüğü */}
            <button onClick={onGoToLogin} className="px-8 py-3.5 bg-rose-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-rose-950 transition-all shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5">
              <span>Hemen Başla</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-slate-50 text-slate-900 rounded-2xl flex items-center justify-center mb-6 border border-slate-200 group-hover:scale-110 transition-transform">
              <MapPin size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-950 mb-3">Akıllı Konum & NLP</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Talebinizi doğal dille yazın. Sistem ihtiyacınızı anlar ve haritadaki konumunuza en yakın, en uygun uzmanları anında tarar.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-rose-50 text-rose-800 rounded-2xl flex items-center justify-center mb-6 border border-rose-100 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-950 mb-3">Çift Taraflı Onay</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Sıraya giren adaylar arasından seçiminizi yapın. Uzman işi kabul edene kadar iletişim bilgileriniz kesinlikle gizli kalır.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
              <Zap size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-950 mb-3">Anında Açık Havuz</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Uzmanlar açık havuzdaki talepleri canlı olarak görür, uygun olanlara anında talip olur. Beklemek yok, zaman kaybı yok.
            </p>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="mt-32 mb-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-950 tracking-tight">Sistem Nasıl İşliyor?</h2>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-4 relative">
            <div className="flex-1 text-center relative z-10">
              {/* Mürekkep Renk */}
              <div className="w-16 h-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">1</div>
              <h4 className="font-bold text-slate-950 mb-2">Talep Oluştur</h4>
              <p className="text-xs text-slate-500 px-4">İhtiyacını yaz, konumunu seç ve havaza gönder.</p>
            </div>
            
            <div className="flex-1 text-center relative z-10">
              <div className="w-16 h-16 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-sm">2</div>
              <h4 className="font-bold text-slate-950 mb-2">Uzmanını Seç</h4>
              <p className="text-xs text-slate-500 px-4">Talip olan uzmanları incele ve sana en uygun olanı seç.</p>
            </div>
            
            <div className="flex-1 text-center relative z-10">
              {/* Vişne Çürüğü */}
              <div className="w-16 h-16 bg-rose-900 text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md"><CheckCircle2 size={32} /></div>
              <h4 className="font-bold text-slate-950 mb-2">Güvenle Görüş</h4>
              <p className="text-xs text-slate-500 px-4">Uzman işi kabul ettiğinde maskeler kalkar, hizmet başlar.</p>
            </div>
          </div>
        </div>
      </main>
      
      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs font-medium text-slate-500">
          <p>© 2026 Mobool. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}