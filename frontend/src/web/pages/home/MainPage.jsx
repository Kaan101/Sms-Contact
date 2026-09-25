import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Zap, CheckCircle2, ArrowRight, Search, Smartphone, Monitor, PhoneCall, User, Bell } from 'lucide-react';

export default function MainPage({ onGoToLogin }) {
  // Simülasyon Animasyon Durumu (0: Talep Gönderiliyor, 1: Uzman Kabul Ediyor, 2: Telefonla Görüşülüyor)
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 4000); // Her adım 4 saniye sürer
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      
      {/* DEKORATİF ARKA PLAN */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000010_1px,transparent_1px),linear-gradient(to_bottom,#00000010_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <svg className="absolute top-0 right-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 100 C 20 0 50 0 100 100" fill="none" stroke="#10b981" strokeWidth="0.2" />
          <path d="M0 100 C 30 10 70 10 100 100" fill="none" stroke="#3b82f6" strokeWidth="0.2" />
        </svg>
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full border-[1px] border-emerald-500/20 opacity-60"></div>
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full border-[1px] border-blue-500/20 opacity-60"></div>
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
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-widest shadow-sm">
            <ShieldCheck size={16} />
            <span>%100 Gizlilik Odaklı Eşleşme</span>
          </div>
          
          <h1 className="text-6xl sm:text-7xl font-black tracking-tighter text-slate-900 leading-[1.05]">
            Hizmet bulmanın <br className="hidden sm:block" />
            <span className="text-blue-600">en güvenli ve hızlı</span> yolu.
          </h1>
          
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

        {/* CANLI SENARYO SİMÜLASYONU */}
        <div className="mt-32 mb-20 relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Sistem Nasıl İşliyor?</h2>
            <p className="text-lg font-medium text-slate-500 mt-4">Saniyeler süren canlı eşleşme hikayesi</p>
          </div>

          {/* grid içine place-items-center ekleyerek çerçeveleri mükemmel hizaladık */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 relative place-items-center">
            
            {/* Bağlantı Oku */}
            <div className="hidden md:flex absolute top-[150px] left-1/2 transform -translate-x-1/2 items-center justify-center w-16 h-8 z-20">
              <div className="w-full h-1 bg-slate-300 relative overflow-hidden">
                <div className={`absolute h-full bg-blue-500 transition-all duration-1000 ${step >= 1 ? 'w-full' : 'w-0'}`}></div>
              </div>
            </div>

            {/* SOL: MÜŞTERİ (Telefon Ekranı) */}
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Karakter İkonu */}
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
                  <User size={24} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold">Müşteri</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Smartphone size={12}/> Mobilden arıyor</p>
                </div>
              </div>

              {/* Ekran - SABİT EN VE BOY */}
              <div className={`w-full max-w-[340px] h-[420px] bg-white rounded-[2.5rem] border-[8px] border-slate-900 shadow-xl overflow-hidden flex flex-col transition-all duration-500 ${step === 2 ? 'ring-4 ring-emerald-400 ring-offset-4' : ''}`}>
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-center">
                  <div className="w-1/3 h-1.5 bg-slate-300 rounded-full"></div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-center">
                  {step === 0 && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
                      {/* GÜNCELLENEN MESAJ: Mavi arka plan kalktı, hafif çizgi içinde siyah yazı */}
                      <div className="bg-white border border-slate-300 text-slate-900 p-5 rounded-2xl rounded-tr-sm shadow-sm relative">
                        <p className="font-semibold text-[17px] leading-snug">"Tarabya 2+1 kiralık daire."</p>
                        {/* Mesaj kuyruğu detayı */}
                        <div className="absolute top-0 right-[-6px] w-3 h-3 bg-white border-r border-t border-slate-300 transform rotate-45 mt-2"></div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-blue-600 text-sm font-bold pl-2 bg-blue-50 py-2 px-3 rounded-xl w-max">
                        <Search size={16} className="animate-spin" /> Uzmanlara iletiliyor...
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center h-full text-center space-y-3">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 size={32} />
                      </div>
                      <p className="font-bold text-slate-800 text-lg">Eşleşme Sağlandı!</p>
                      <p className="text-sm text-slate-500">Uzman iletişim bilgilerini aldı.</p>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="animate-in zoom-in duration-500 flex flex-col items-center justify-center h-full text-center space-y-4">
                      <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center animate-bounce shadow-xl shadow-emerald-500/40">
                        <PhoneCall size={40} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-2xl mb-1">Aranıyorsunuz...</p>
                        <p className="text-sm font-bold text-emerald-600">Ayşe Yılmaz (Emlak Danışmanı)</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SAĞ: SAĞLAYICI / EMLAKÇI (Bilgisayar Ekranı) */}
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Karakter İkonu */}
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shadow-sm">
                  <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Ayse&backgroundColor=d1fae5" alt="Ayşe" className="w-10 h-10 rounded-full" />
                </div>
                <div>
                  <h4 className="font-bold">Ayşe Hanım (Danışman)</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Monitor size={12}/> Ofiste bilgisayar başında</p>
                </div>
              </div>

              {/* Ekran - SABİT EN VE BOY (Diğeriyle Birebir Aynı) */}
              <div className={`w-full max-w-[340px] h-[420px] bg-slate-900 rounded-xl border-[8px] border-slate-700 shadow-2xl overflow-hidden flex flex-col transition-all duration-500 ${step === 2 ? 'ring-4 ring-emerald-400 ring-offset-4' : ''}`}>
                <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono ml-4 uppercase tracking-widest">Mobool Sistem</span>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-center">
                  {step === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 opacity-60">
                      <Search size={40} className="animate-pulse" />
                      <p className="text-sm font-medium text-center px-4">Bölgenizdeki yeni talepler taranıyor...</p>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="animate-in slide-in-from-right-8 duration-500 flex flex-col justify-center h-full">
                      <div className="bg-slate-800 p-5 rounded-2xl border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-4">
                          <Bell size={18} className="animate-[wiggle_1s_ease-in-out_infinite]" /> Yeni Talep Düştü!
                        </div>
                        <p className="text-white font-medium text-lg mb-6 leading-snug">"Tarabya 2+1 kiralık daire."</p>
                        
                        {/* DAHA CANLI KABUL ET BUTONU */}
                        <div className="relative mt-2">
                          {/* Butonun arkasındaki yayılma/dalga efekti (Ripple) */}
                          <div className="absolute inset-0 bg-emerald-500 rounded-xl animate-ping opacity-75"></div>
                          
                          <button className="relative w-full py-3.5 bg-emerald-500 text-slate-900 font-black rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.6)] animate-[pulse_1.5s_ease-in-out_infinite] scale-105 hover:scale-110 transition-transform">
                            Hemen Kabul Et
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center h-full">
                       <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 w-full text-center space-y-4">
                         <div className="inline-flex w-20 h-20 bg-slate-700 text-emerald-400 rounded-full items-center justify-center mb-2 shadow-inner">
                           <PhoneCall size={32} className="animate-pulse" />
                         </div>
                         <div>
                           <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-2">Müşteri Numarası</p>
                           <p className="text-2xl font-mono font-bold text-white">0555 123 4567</p>
                         </div>
                         <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-bold mt-2">
                           <CheckCircle2 size={16} /> Görüşme Başladı
                         </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>
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