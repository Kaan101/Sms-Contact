import React from 'react';
import { ShieldCheck, MapPin, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export default function MainPage({ onGoToLogin }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      
      {/* GARANTİLİ DEKORATİF ARKA PLAN */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        
        {/* 1. Belirgin Izgara (Grid) Sistemi */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000010_1px,transparent_1px),linear-gradient(to_bottom,#00000010_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        {/* 2. Canlı Geometrik Çizgiler (Saf SVG ile) */}
        <svg className="absolute top-0 right-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 100 C 20 0 50 0 100 100" fill="none" stroke="#10b981" strokeWidth="0.2" />
          <path d="M0 100 C 30 10 70 10 100 100" fill="none" stroke="#3b82f6" strokeWidth="0.2" />
          <path d="M0 100 C 40 20 80 20 100 100" fill="none" stroke="#10b981" strokeWidth="0.1" />
          <path d="M-20 50 C 30 -20 70 120 120 50" fill="none" stroke="#3b82f6" strokeWidth="0.1" />
        </svg>

        {/* 3. Dinamik Çemberler (Teknoloji Radarı Hissi) */}
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full border-[1px] border-emerald-500/20 opacity-60"></div>
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full border-[1px] border-blue-500/20 opacity-60"></div>
        <div className="absolute top-[0%] right-[0%] w-[400px] h-[400px] rounded-full border-[1px] border-emerald-500/30 opacity-60"></div>
        
        {/* 4. Alt kısımdaki çemberler */}
        <div className="absolute bottom-[-30%] left-[-20%] w-[1000px] h-[1000px] rounded-full border-[1px] border-blue-500/15 opacity-80"></div>
        <div className="absolute bottom-[-15%] left-[-10%] w-[700px] h-[700px] rounded-full border-[1px] border-emerald-500/15 opacity-80"></div>
        
        {/* Glow (Parlaklık) Efektleri - Köşelerde */}
        <div className="absolute top-[-5%] right-[10%] w-[30%] h-[30%] bg-emerald-400/15 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/15 blur-[120px] rounded-full"></div>
      </div>
      
      {/* HEADER / NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-xl flex items-center justify-center shadow-sm">
              <Zap size={16} className="text-white fill-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">Mobool</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-bold">
            <button onClick={onGoToLogin} className="text-slate-900 hover:text-black hover:underline underline-offset-4 transition cursor-pointer px-4 py-2">
              Giriş Yap
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-20 relative z-10">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest shadow-sm">
            <ShieldCheck size={16} />
            <span>%100 Gizlilik Odaklı Eşleşme</span>
          </div>
          
          <h1 className="text-6xl sm:text-7xl font-black tracking-tighter text-slate-900 leading-[1.05]">
            Hizmet bulmanın <br className="hidden sm:block" />
            <span className="text-blue-600">
              en güvenli ve hızlı
            </span> yolu.
          </h1>
          
          <p className="text-xl font-medium text-slate-600 max-w-2xl mx-auto leading-relaxed">
            İhtiyacınızı kendi kelimelerinizle anlatın, konumunuzu seçin. Mobool sizi en uygun uzmanlarla eşleştirsin. İletişim bilgileriniz sadece siz onayladığınızda paylaşılır.
          </p>

          <div className="flex items-center justify-center pt-8 relative">
            {/* Kalın Çerçeveli İçi Boş Yeşil Buton */}
            <button onClick={onGoToLogin} className="relative z-10 px-10 py-4 border-4 border-emerald-600 text-emerald-600 bg-white/50 backdrop-blur-sm rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-700 transition-all shadow-xl shadow-emerald-600/10 cursor-pointer transform hover:-translate-y-1">
              <span>Hemen Başla</span>
              <ArrowRight size={20} strokeWidth={3} />
            </button>
            {/* Buton arkasında sevdiğin vurgu */}
            <div className="absolute inset-0 bg-emerald-400/20 blur-xl rounded-full scale-[1.2] opacity-50 z-0 pointer-events-none"></div>
          </div>
        </div>

        {/* FEATURES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 relative z-10">
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <MapPin size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Akıllı Konum & NLP</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              Talebinizi doğal dille yazın. Sistem ihtiyacınızı anlar ve haritadaki konumunuza en yakın, en uygun uzmanları anında tarar.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Çift Taraflı Onay</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              Sıraya giren adaylar arasından seçiminizi yapın. Uzman işi kabul edene kadar iletişim bilgileriniz kesinlikle gizli kalır.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all group">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:bg-blue-600 transition-colors">
              <Zap size={28} />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">Anında Açık Havuz</h3>
            <p className="text-slate-600 font-medium leading-relaxed">
              Uzmanlar açık havuzdaki talepleri canlı olarak görür, uygun olanlara anında talip olur. Beklemek yok, zaman kaybı yok.
            </p>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="mt-40 mb-20 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Sistem Nasıl İşliyor?</h2>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center gap-10 md:gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-1 bg-slate-200 z-0"></div>

            <div className="flex-1 text-center relative z-10">
              <div className="w-20 h-20 bg-white border-4 border-blue-600 text-blue-600 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-md">1</div>
              <h4 className="text-xl font-black text-slate-900 mb-3">Talep Oluştur</h4>
              <p className="font-medium text-slate-500 px-4">İhtiyacını yaz, konumunu seç ve havaza gönder.</p>
            </div>
            
            <div className="flex-1 text-center relative z-10">
              <div className="w-20 h-20 bg-white border-4 border-emerald-500 text-emerald-500 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-md">2</div>
              <h4 className="text-xl font-black text-slate-900 mb-3">Uzmanını Seç</h4>
              <p className="font-medium text-slate-500 px-4">Talip olan uzmanları incele ve sana en uygun olanı seç.</p>
            </div>
            
            <div className="flex-1 text-center relative z-10">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md"><CheckCircle2 size={36} strokeWidth={3} /></div>
              <h4 className="text-xl font-black text-slate-900 mb-3">Güvenle Görüş</h4>
              <p className="font-medium text-slate-500 px-4">Uzman işi kabul ettiğinde maskeler kalkar, hizmet başlar.</p>
            </div>
          </div>
        </div>
      </main>
      
      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm py-10 relative z-10 mt-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-sm font-semibold text-slate-500">
          <p>© 2026 Mobool. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
}