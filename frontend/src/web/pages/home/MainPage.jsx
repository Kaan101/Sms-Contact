import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, Zap, CheckCircle2, ArrowRight, Search, Smartphone, Monitor, PhoneCall, User, Bell, UserCheck } from 'lucide-react';

export default function MainPage({ onGoToLogin }) {
  // Simülasyon Animasyon Durumu (0: Talep, 1: Harita Tarama, 2: Uzman Talebi Gördü, 3: Görüşme)
  const [step, setStep] = useState(0);
  const [typedText, setTypedText] = useState("");
  const fullText = '"Tarabya 2+1 kiralık daire."';

  // Adım değiştirici
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 4500); 
    return () => clearInterval(interval);
  }, []);

  // Harf harf yazma efekti
  useEffect(() => {
    if (step === 0) {
      setTypedText("");
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < fullText.length) {
          setTypedText(fullText.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, 60); 
      return () => clearInterval(typingInterval);
    } else {
      setTypedText(fullText);
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      
      {/* Özel Animasyonlar */}
      <style>{`
        @keyframes flow-right {
          0% { transform: translateX(-200%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(200%); opacity: 0; }
        }
        @keyframes flow-left {
          0% { transform: translateX(200%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(-200%); opacity: 0; }
        }
        @keyframes map-zoom {
          0% { transform: scale(1); }
          30% { transform: scale(1); }
          100% { transform: scale(1.7) translate(-5%, 5%); }
        }
        .animate-flow-right { animation: flow-right 1.2s linear infinite; }
        .animate-flow-left { animation: flow-left 1.2s linear infinite; }
        .animate-map-zoom { animation: map-zoom 3.5s ease-in-out forwards; }
      `}</style>

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

        {/* ÖZELLİKLER (AÇIKLAYICI BİLGİLER) GRİDİ */}
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
        <div className="mt-32 mb-20 relative z-10 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Sistem Nasıl İşliyor?</h2>
            <p className="text-lg font-medium text-slate-500 mt-4">Saniyeler süren canlı eşleşme hikayesi</p>
          </div>

          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-3 relative">
            
            {/* CANLI İLETİŞİM HATTI */}
            <div className="hidden md:flex absolute top-[180px] left-1/2 transform -translate-x-1/2 items-center justify-center w-10 h-4 z-20 overflow-hidden">
              <div className="w-full h-[2px] bg-slate-300/80 relative flex items-center justify-center rounded-full">
                {(step === 0 || step === 1 || step === 2) && (
                  <div className="w-4 h-1.5 bg-blue-500 rounded-full absolute animate-flow-right shadow-[0_0_8px_#3b82f6]"></div>
                )}
                {step === 3 && (
                  <div className="w-4 h-1.5 bg-emerald-500 rounded-full absolute animate-flow-left shadow-[0_0_8px_#10b981]"></div>
                )}
              </div>
            </div>

            {/* SOL: MÜŞTERİ EKRANI */}
            <div className="flex flex-col items-center gap-4 w-full max-w-[340px]">
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
                  <User size={24} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold">Mehmet Bey (Müşteri)</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Smartphone size={12}/> Mobilden arıyor</p>
                </div>
              </div>

              <div className={`w-full h-[420px] bg-slate-50 rounded-xl border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all duration-500 ${step === 3 ? 'ring-4 ring-emerald-400 ring-offset-4' : ''}`}>
                
                <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200">
                  <span className="text-[11px] text-slate-600 font-mono uppercase tracking-widest flex items-center gap-2 font-bold">
                    <Smartphone size={14} className="text-slate-400" /> Müşteri Ekranı
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-blue-600 font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Online
                  </span>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-center relative bg-white">
                  
                  {/* ADIM 0 VE 1: MÜŞTERİ BEKLEMEDE */}
                  {(step === 0 || step === 1) && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5 w-full">
                      <div className="bg-white border border-slate-300 text-slate-900 p-5 rounded-2xl rounded-tr-sm shadow-sm relative min-h-[80px]">
                        <p className="font-semibold text-[17px] leading-snug">
                          {typedText}
                          <span className="animate-pulse ml-0.5 border-r-2 border-slate-400 h-4 inline-block align-middle"></span>
                        </p>
                        <div className="absolute top-0 right-[-6px] w-3 h-3 bg-white border-r border-t border-slate-300 transform rotate-45 mt-2"></div>
                      </div>
                      
                      {typedText === fullText && (
                        <div className="flex items-center gap-2 text-blue-600 text-sm font-bold pl-2 bg-blue-50 py-2 px-3 rounded-xl w-max animate-in fade-in duration-300">
                          <Search size={16} className="animate-spin" /> Uzmanlara iletiliyor...
                        </div>
                      )}
                    </div>
                  )}

                  {/* ADIM 2: DANIŞMAN TALEBİ ALDI */}
                  {step === 2 && (
                    <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center h-full text-center space-y-3">
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-sm border border-blue-100">
                        <UserCheck size={32} className="animate-pulse" />
                      </div>
                      <p className="font-bold text-slate-800 text-xl">Emlak Danışmanı Talebi Aldı!</p>
                      <p className="text-sm font-medium text-slate-500">Uzman eşleşmeyi onaylıyor...</p>
                    </div>
                  )}

                  {/* ADIM 3: TELEFON GÖRÜŞMESİ */}
                  {step === 3 && (
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

            {/* SAĞ: SAĞLAYICI / EMLAKÇI EKRANI */}
            <div className="flex flex-col items-center gap-4 w-full max-w-[340px]">
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shadow-sm">
                  <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Ayse&backgroundColor=d1fae5" alt="Ayşe" className="w-10 h-10 rounded-full" />
                </div>
                <div>
                  <h4 className="font-bold">Ayşe Hanım (Danışman)</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1"><Monitor size={12}/> Ofiste bilgisayar başında</p>
                </div>
              </div>

              <div className={`w-full h-[420px] bg-slate-50 rounded-xl border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all duration-500 ${step === 3 ? 'ring-4 ring-emerald-400 ring-offset-4' : ''}`}>
                
                <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200">
                  <span className="text-[11px] text-slate-600 font-mono uppercase tracking-widest flex items-center gap-2 font-bold">
                    <Monitor size={14} className="text-slate-400" /> Sistem Paneli
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Aktif
                  </span>
                </div>
                
                <div className="p-6 flex-1 flex flex-col justify-center bg-white">
                  
                  {/* ADIM 0: BEKLEME */}
                  {step === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                      <Search size={40} className="animate-pulse text-slate-300" />
                      <p className="text-sm font-medium text-center px-4">Bölgenizdeki yeni talepler taranıyor...</p>
                    </div>
                  )}

                  {/* ADIM 1: HARİTA VE ODAKLANMA */}
                  {step === 1 && (
                     <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center h-full w-full space-y-4">
                     <div className="relative w-full h-48 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                       <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
                       
                       <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-emerald-400/50 rounded-full animate-ping -translate-x-1/2 -translate-y-1/2"></div>
                       
                       <div className="absolute inset-0 animate-map-zoom origin-center">
                         <div className="absolute top-[20%] left-[20%] animate-bounce text-slate-300 drop-shadow-sm delay-100">
                           <MapPin size={22} className="fill-white" />
                         </div>
                         <div className="absolute bottom-[20%] right-[20%] animate-bounce text-slate-300 drop-shadow-sm delay-300">
                           <MapPin size={22} className="fill-white" />
                         </div>
                         
                         <div className="absolute top-[55%] left-[55%] -translate-x-1/2 -translate-y-1/2 z-10 animate-in zoom-in duration-500 delay-500">
                           <div className="relative">
                             <MapPin size={32} className="text-emerald-500 fill-white drop-shadow-lg relative z-10" />
                             <span className="absolute top-1 right-1 flex h-3 w-3 -mt-1 -mr-1 z-20">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                             </span>
                           </div>
                         </div>
                       </div>
                     </div>
                     <div className="text-center">
                       <p className="font-bold text-slate-800">Sistem Tarıyor...</p>
                       <p className="text-xs font-semibold text-emerald-600 mt-1 animate-pulse">Yeni bir talep bölgenizde!</p>
                     </div>
                   </div>
                  )}

                  {/* ADIM 2: YENİ TALEP KARTI */}
                  {step === 2 && (
                    <div className="animate-in slide-in-from-right-8 duration-500 flex flex-col justify-center h-full">
                      <div className="bg-white p-5 rounded-2xl border-2 border-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-4 mt-1">
                          <Bell size={18} className="animate-[wiggle_1s_ease-in-out_infinite]" /> Yeni Talep!
                        </div>
                        <p className="text-slate-800 font-bold text-lg mb-6 leading-snug">"Tarabya 2+1 kiralık daire."</p>
                        
                        <div className="relative mt-2">
                          <div className="absolute inset-0 bg-emerald-500 rounded-xl animate-ping opacity-40"></div>
                          <button className="relative w-full py-3.5 bg-emerald-500 text-white font-black rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.4)] animate-[pulse_1.5s_ease-in-out_infinite] scale-105 transition-transform">
                            Hemen Kabul Et
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ADIM 3: TELEFON GÖRÜŞMESİ */}
                  {step === 3 && (
                    <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center h-full">
                       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 w-full text-center space-y-4">
                         <div className="inline-flex w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full items-center justify-center mb-2 shadow-inner">
                           <PhoneCall size={32} className="animate-pulse" />
                         </div>
                         <div>
                           <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Müşteri Numarası</p>
                           <p className="text-2xl font-mono font-bold text-slate-800">0555 123 4567</p>
                         </div>
                         <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold mt-2 border border-emerald-200">
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