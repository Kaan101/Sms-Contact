import React from 'react';
import { ShieldCheck, MapPin, Zap, CheckCircle2, ArrowRight, MessageSquare, Bell, Search, Home } from 'lucide-react';

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
      <main className="max-w-6xl mx-auto px-6 pt-28 pb-10 relative z-10">
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
          
          {/* GÜNCELLENEN HIZ VE AKSİYON ODAKLI MESAJ */}
          <p className="text-xl font-medium text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Sen sadece talebini gir ve gerisine karışma. Mobool, ihtiyacını en iyi anlayan uzmanları anında bulsun; <strong className="text-slate-900 font-black">saniyeler içinde hizmet veren seni arasın.</strong>
          </p>

          <div className="flex items-center justify-center pt-8 relative">
            <button onClick={onGoToLogin} className="relative z-10 px-10 py-4 border-4 border-emerald-600 text-emerald-600 bg-white/50 backdrop-blur-sm rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-700 transition-all shadow-xl shadow-emerald-600/10 cursor-pointer transform hover:-translate-y-1">
              <span>Hemen Başla</span>
              <ArrowRight size={20} strokeWidth={3} />
            </button>
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

        {/* CANLI SENARYO SİMÜLASYONU */}
        <div className="mt-40 mb-20 relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Anında Etkileşim</h2>
            <p className="text-lg font-medium text-slate-500 mt-4">Talebiniz uzmanlara nasıl ulaşıyor?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 relative">
            
            {/* Masaüstü için iki ekranı bağlayan bağlantı oku */}
            <div className="hidden md:flex absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center justify-center w-16 h-16 z-20">
              <div className="w-full h-1 bg-slate-300 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 border-t-[3px] border-r-[3px] border-slate-300 rotate-45 transform origin-center translate-x-[4px]"></div>
                {/* Animasyonlu ışık topu */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6] animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
              </div>
            </div>

            {/* SOL: Müşteri Ekranı */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col relative z-10">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Müşteri</h4>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Talep Oluşturma</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative">
                  <div className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-slate-400">İhtiyaç Detayı</div>
                  <p className="text-slate-700 font-medium leading-relaxed mt-2">
                    "Tarabya'da 2+1 kiralık daire arıyorum. Bütçem aylık maksimum 45.000 TL. Temiz ve taşınmaya hazır olmalı."
                  </p>
                </div>

                <div className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                    <span className="text-sm font-bold text-blue-700">Uzmanlar Taranıyor...</span>
                  </div>
                  <Search size={18} className="text-blue-500 animate-pulse" />
                </div>
              </div>
            </div>

            {/* SAĞ: Sağlayıcı (Emlakçı) Ekranı */}
            <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl overflow-hidden flex flex-col relative z-10">
              <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                    <Home size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Emlak Danışmanı</h4>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Açık Havuz</p>
                  </div>
                </div>
                <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
                  YENİ
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col gap-4">
                {/* Havuzdaki yeni iş kartı */}
                <div className="bg-slate-800 p-5 rounded-2xl border border-emerald-500/30 relative shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <Bell size={16} />
                      Yeni Müşteri Talebi
                    </div>
                    <span className="text-xs font-mono text-slate-400">Şimdi</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <MapPin size={14} className="text-slate-500" /> Tarabya, Sarıyer
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Home size={14} className="text-slate-500" /> Kiralık 2+1 Daire
                    </div>
                    <div className="text-sm font-semibold text-white bg-slate-900/50 px-3 py-2 rounded-lg inline-block mt-2">
                      Bütçe: 45.000 TL
                    </div>
                  </div>

                  <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black rounded-xl transition-colors shadow-lg shadow-emerald-500/20">
                    İşi Kabul Et
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="mt-40 mb-20 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Adım Adım Eşleşme</h2>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center gap-10 md:gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-1 bg-slate-200 z-0"></div>

            <div className="flex-1 text-center relative z-10">
              <div className="w-20 h-20 bg-white border-4 border-blue-600 text-blue-600 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-md">1</div>
              <h4 className="text-xl font-black text-slate-900 mb-3">Talep Oluştur</h4>
              <p className="font-medium text-slate-500 px-4">İhtiyacını yaz, konumunu seç ve havuza gönder.</p>
            </div>
            
            <div className="flex-1 text-center relative z-10">
              <div className="w-20 h-20 bg-white border-4 border-emerald-500 text-emerald-500 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-md">2</div>
              <h4 className="text-xl font-black text-slate-900 mb-3">Uzmanını Seç</h4>
              <p className="font-medium text-slate-500 px-4">Talip olan uzmanları incele ve sana en uygun olanı seç.</p>
            </div>
            
            <div className="flex-1 text-center relative z-10">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md"><CheckCircle2 size={36} strokeWidth={3} /></div>
              <h4 className="text-xl font-black text-slate-900 mb-3">Güvenle Görüş</h4>
              <p className="font-medium text-slate-500 px-4">Uzman işi kabul ettiğinde maskeler kalkar, iletişim başlar.</p>
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