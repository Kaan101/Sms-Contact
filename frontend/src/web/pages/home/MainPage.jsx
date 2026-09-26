import React, { useState, useEffect } from 'react';
import { 
  Phone, ShieldCheck, Zap, 
  MapPin, CheckCircle2, ArrowRight, Lock, 
  MessageCircle, Send, PhoneCall, PhoneIncoming, Compass, CheckCheck, User, Wrench, X
} from 'lucide-react';

export default function MainPage({ onGoToLogin }) {
  const [scenario, setScenario] = useState(1); // 1: Telefon, 2: Whatsapp/Sms
  const [typedText, setTypedText] = useState('');
  
  // Fazlar: TYPING -> SHOW_OPTIONS -> CLICK_OPTION -> CLICK_SEND -> MAP_SCANNING -> MATCH_FOUND -> FINAL_ACTION
  const [phase, setPhase] = useState('TYPING'); 
  
  const [whatsappPhase, setWhatsappPhase] = useState('CHATTING'); 
  const [chatStep, setChatStep] = useState(0); 
  const [showSuccess, setShowSuccess] = useState(false);

  const fullText = scenario === 1 ? "Tarabya'da 3+1 kiralık" : "Bosch servis";

  // 1. FAZ: Daktilo Efekti
  useEffect(() => {
    setTypedText('');
    setPhase('TYPING');
    setWhatsappPhase('CHATTING');
    setShowSuccess(false);
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => setPhase('SHOW_OPTIONS'), 1500); 
      }
    }, 150);

    return () => clearInterval(typingInterval);
  }, [scenario]);

  // 2. FAZ: Kontrollü ve Yavaşlatılmış Akış
  useEffect(() => {
    let t1, t2, t3, t4, t5, t6;

    if (phase === 'SHOW_OPTIONS') {
      t1 = setTimeout(() => setPhase('CLICK_OPTION'), 1800); 
    } else if (phase === 'CLICK_OPTION') {
      t2 = setTimeout(() => setPhase('CLICK_SEND'), 1200); 
    } else if (phase === 'CLICK_SEND') {
      t3 = setTimeout(() => setPhase('MAP_SCANNING'), 1500); 
    } else if (phase === 'MAP_SCANNING') {
      t4 = setTimeout(() => setPhase('MATCH_FOUND'), 4000); 
    } else if (phase === 'MATCH_FOUND') {
      t5 = setTimeout(() => setPhase('FINAL_ACTION'), 3500); 
    } else if (phase === 'FINAL_ACTION') {
      const delay = scenario === 1 ? 7000 : 15000; 
      
      t6 = setTimeout(() => {
        setPhase('TYPING'); 
        setScenario(prev => prev === 1 ? 2 : 1);
        setChatStep(0);
        setShowSuccess(false);
      }, delay);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [phase, scenario]);

  // 3. FAZ: WhatsApp Chat Adımları
  useEffect(() => {
    let timers = [];
    if (phase === 'FINAL_ACTION' && scenario === 2) {
      setWhatsappPhase('CHATTING');
      setShowSuccess(false);

      const chatSteps = [
        { step: 1, delay: 1000 },
        { step: 2, delay: 3000 },
        { step: 3, delay: 4500 },
        { step: 4, delay: 7000 },
        { step: 5, delay: 8500 },
        { step: 6, delay: 11000 }
      ];
      chatSteps.forEach(s => timers.push(setTimeout(() => setChatStep(s.step), s.delay)));

      timers.push(setTimeout(() => {
        setWhatsappPhase('SUCCESS_MARK');
        setTimeout(() => setShowSuccess(true), 100);
        setTimeout(() => setShowSuccess(false), 3500); 
      }, 12000));
    }
    return () => timers.forEach(clearTimeout);
  }, [phase, scenario]);

  const mapBackgroundImage = `url('/images/map_bg.png')`;

  return (
    <div className="min-h-screen bg-neutral-50 font-sans selection:bg-neutral-900 selection:text-white overflow-x-hidden">
      
      {/* HEADER / NAVBAR */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="text-xl font-extrabold tracking-tight text-neutral-950 flex items-center space-x-2">
            <div className="w-8 h-8 bg-neutral-950 rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span>SMS KONTAK</span>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onGoToLogin('LOGIN')} 
              className="px-6 py-2.5 text-sm font-bold text-white bg-neutral-950 hover:bg-neutral-800 rounded-xl transition shadow-sm cursor-pointer"
            >
              Giriş Yap
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION & SİMÜLASYON */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-100/40 blur-3xl" />
          <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-100/40 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Sol Taraf: Metinler */}
          <div className="lg:col-span-5 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white border border-neutral-200 shadow-sm mb-6">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-bold tracking-wide uppercase text-neutral-700">İletişim Kontrolü Sizde</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-neutral-950 leading-[1.15] tracking-tight mb-6">
              İhtiyacınızı Yazın, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-500">
                Şartları Siz Belirleyin.
              </span>
            </h1>
            <p className="text-lg text-neutral-600 mb-8 leading-relaxed font-medium">
              Numaranızı paylaşmak zorunda değilsiniz. Talebinizi oluşturun, çevrenizdeki en iyi uzmanlar anında görsün. Telefon arama mı, yoksa Whatsapp/Sms mi? Karar sizin.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={() => onGoToLogin('CUSTOMER')} 
                className="w-full sm:w-auto px-8 py-4 bg-neutral-950 hover:bg-neutral-800 text-white rounded-2xl font-bold text-sm transition shadow-lg shadow-neutral-900/20 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Hemen Talep Oluştur</span>
                <ArrowRight size={16} />
              </button>
              <button 
                onClick={() => onGoToLogin('PROVIDER')} 
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-neutral-50 text-neutral-950 border border-neutral-200 rounded-2xl font-bold text-sm transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                <ShieldCheck size={16} className="text-neutral-500" />
                <span>Hizmet Veren Olun</span>
              </button>
            </div>
          </div>

          {/* Sağ Taraf: Simülasyon */}
          <div className="lg:col-span-7 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-neutral-100 to-white rounded-[2rem] transform rotate-1 scale-105 border border-neutral-200 shadow-xl" />
            
            <div className="relative bg-white rounded-[2rem] border border-neutral-200 shadow-2xl p-6 lg:p-8 flex flex-col space-y-6 min-h-[460px]">
              
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Canlı Akış Simülasyonu</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono font-bold text-neutral-400">Senaryo {scenario}/2 ({scenario === 1 ? "Telefon arama" : "Whatsapp/Sms"})</span>
                  <div className="flex space-x-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${scenario === 1 ? 'w-4 bg-neutral-900' : 'bg-neutral-300'}`} />
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${scenario === 2 ? 'w-4 bg-neutral-900' : 'bg-neutral-300'}`} />
                  </div>
                </div>
              </div>

              <div className={`grid items-stretch relative flex-1 ${
                  (phase === 'FINAL_ACTION' && scenario === 2) 
                    ? 'grid-cols-1 max-w-sm mx-auto w-full' 
                    : 'grid-cols-1 md:grid-cols-2 gap-6'
                }`}>
                
                <div className={`absolute inset-0 z-50 flex items-center justify-center transition-all duration-1000 ease-in-out rounded-[2rem] ${showSuccess && whatsappPhase === 'SUCCESS_MARK' ? 'opacity-100 bg-white/70 backdrop-blur-sm scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                  <div className="w-32 h-32 rounded-full bg-emerald-100 flex items-center justify-center shadow-2xl">
                    <CheckCircle2 size={72} className="text-emerald-500" />
                  </div>
                </div>

                {/* SENARYO 2 FINAL: WHATSAPP TEK EKRAN */}
                {(phase === 'FINAL_ACTION' && scenario === 2) ? (
                  <div className="flex flex-col h-[400px] w-full relative overflow-hidden rounded-[2rem] border border-neutral-200 shadow-xl bg-white mx-auto">
                    <div className="flex flex-col h-full w-full bg-[#EFEAE2] border-[6px] border-neutral-900 rounded-[2rem] overflow-hidden transition-opacity duration-1000">
                      
                      <div className="bg-[#00A884] text-white px-4 py-3 flex items-center justify-between z-10 shadow-sm">
                        <div className="flex items-center space-x-3">
                           <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs shrink-0">B</div>
                           <div className="leading-tight overflow-hidden">
                             <div className="font-bold text-[13px] whitespace-nowrap truncate">Bosch Servis İletişim</div>
                             <div className="text-[10px] text-white/90 font-medium">
                               {chatStep === 1 || chatStep === 5 ? 'Murat Usta yazıyor...' : chatStep === 3 ? 'Siz yazıyorsunuz...' : 'çevrimiçi'}
                             </div>
                           </div>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                           <Phone size={14} className="text-white/90" />
                        </div>
                      </div>
                      
                      <div className="flex-1 p-3 space-y-3 relative z-0 flex flex-col overflow-y-auto overflow-x-hidden w-full">
                        {/* Bilgi Balonu Kaldırıldı */}

                        {chatStep >= 2 && (
                          <div className="self-start max-w-[85%] animate-in slide-in-from-left-2 fade-in duration-500 mt-2">
                            <span className="text-[9px] font-bold text-neutral-500/80 mb-0.5 ml-1 block">Murat Usta</span>
                            <div className="bg-white text-neutral-900 p-2.5 rounded-xl rounded-tl-none text-[11px] font-medium shadow-sm relative flex flex-col">
                              <span className="break-words whitespace-normal">Merhaba, Bosch yetkili servisinden Murat ben. Size nasıl yardımcı olabilirim?</span>
                              <span className="text-[8px] text-neutral-400 self-end mt-1 shrink-0">10:41</span>
                            </div>
                          </div>
                        )}
                        {chatStep >= 4 && (
                          <div className="self-end max-w-[85%] animate-in slide-in-from-right-2 fade-in duration-500">
                            <span className="text-[9px] font-bold text-neutral-500/80 mb-0.5 mr-1 block text-right">Mehmet Bey (Siz)</span>
                            <div className="bg-[#D9FDD3] text-neutral-900 p-2.5 rounded-xl rounded-tr-none text-[11px] font-medium shadow-sm relative flex flex-col">
                              <span className="break-words whitespace-normal">Merhaba Murat Usta, makine su almıyor, E18 hatası veriyor. Bugün bakabilir misiniz?</span>
                              <div className="flex items-center justify-end mt-1 shrink-0">
                                <span className="text-[8px] text-neutral-500">10:42</span>
                                <CheckCheck size={12} className="text-blue-500 ml-1"/> 
                              </div>
                            </div>
                          </div>
                        )}
                        {chatStep >= 6 && (
                          <div className="self-start max-w-[85%] animate-in slide-in-from-left-2 fade-in duration-500">
                             <span className="text-[9px] font-bold text-neutral-500/80 mb-0.5 ml-1 block">Murat Usta</span>
                            <div className="bg-white text-neutral-900 p-2.5 rounded-xl rounded-tl-none text-[11px] font-medium shadow-sm relative flex flex-col">
                              <span className="break-words whitespace-normal">Tabii, saat 14:00-16:00 arası bölgenizdeyiz. Ekip arkadaşlarımla gelip kontrol edeceğiz.</span>
                              <span className="text-[8px] text-neutral-400 self-end mt-1 shrink-0">10:43</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-[#f0f2f5] p-2 flex items-center space-x-2 z-10 border-t border-neutral-200 w-full shrink-0">
                        <div className="bg-white rounded-full flex-1 px-3 py-2 text-[11px] text-neutral-400 shadow-sm flex items-center space-x-2 overflow-hidden">
                          <MessageCircle size={14} className="text-neutral-400 shrink-0" />
                          <span className="truncate">Mesaj yazın</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Send size={12} className="-ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* NORMAL DURUM SOL TARAF (Müşteri) */}
                    <div className="bg-neutral-50/80 border border-neutral-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs h-full relative">
                      
                      <div>
                        <div className="flex items-center space-x-2.5 mb-3">
                          <div className="w-7 h-7 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0">M</div>
                          <div>
                            <h4 className="text-xs font-bold text-neutral-900">Mehmet Bey</h4>
                            <span className="text-[10px] text-neutral-500 flex items-center"><MapPin size={9} className="mr-0.5" /> Tarabya, İstanbul</span>
                          </div>
                        </div>
                        
                        <div className="bg-white border p-3 rounded-xl shadow-xs min-h-[46px] flex items-center">
                          <p className="text-xs font-medium text-neutral-800 leading-relaxed font-mono">
                            {typedText}
                            {(phase === 'TYPING') && (
                              <span className="inline-block w-1.5 h-3 bg-neutral-900 ml-0.5 animate-pulse" />
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className={`space-y-2 transition-all duration-1000 transform ${
                          phase === 'FINAL_ACTION' 
                            ? 'opacity-0 scale-95 pointer-events-none h-0 overflow-hidden m-0' 
                            : 'opacity-100 scale-100'
                        }`}>
                          <span className="text-[9px] font-mono text-neutral-500 font-bold uppercase block">İletişim Tercihinizi Seçin:</span>
                          
                          <div className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-[11px] font-bold shadow-xs transition-all duration-500 ${
                            scenario === 1 ? ((phase === 'CLICK_OPTION' || phase === 'CLICK_SEND') ? 'bg-neutral-100 text-neutral-800 border-2 border-neutral-600 border-solid scale-98 shadow-inner' : 'bg-transparent text-neutral-500 border border-neutral-400 border-dashed') : 'bg-transparent text-neutral-400 border border-neutral-300 border-dashed opacity-70'
                          }`}><Phone size={12} /><span>Telefon arama</span></div>

                          <div className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-[11px] font-bold shadow-xs transition-all duration-500 ${
                            scenario === 2 ? ((phase === 'CLICK_OPTION' || phase === 'CLICK_SEND') ? 'bg-neutral-100 text-neutral-800 border-2 border-neutral-600 border-solid scale-98 shadow-inner' : 'bg-transparent text-neutral-500 border border-neutral-400 border-dashed') : 'bg-transparent text-neutral-400 border border-neutral-300 border-dashed opacity-70'
                          }`}><MessageCircle size={12} /><span>Whatsapp/Sms</span></div>

                          <div className="pt-1 flex justify-end">
                            <div className={`px-4 py-1.5 text-[10px] font-bold rounded-lg shadow-sm flex items-center space-x-1 transition-all duration-500 ${(phase === 'CLICK_SEND' || phase === 'MAP_SCANNING' || phase === 'MATCH_FOUND') ? 'bg-neutral-700 text-white scale-95' : 'bg-neutral-950 text-white'}`}>
                              <span>Gönder</span><Send size={10} />
                            </div>
                          </div>
                        </div>

                        {phase === 'FINAL_ACTION' && scenario === 1 && (
                          <div className="animate-in fade-in zoom-in duration-1000">
                            {/* GERÇEKÇİ ARAMA EKRANI (Senaryo 1) */}
                            <div className="bg-gradient-to-b from-neutral-800 to-neutral-900 text-white p-5 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col justify-between h-[280px]">
                              
                              <div className="flex flex-col items-center pt-2">
                                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3">
                                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                                    <User size={20} className="text-white" />
                                  </div>
                                </div>
                                <h5 className="text-lg font-medium tracking-tight mb-1">Ayşe Hanım</h5>
                                <p className="text-xs text-neutral-400">Tarabya Emlak Uzmanı</p>
                              </div>

                              <div className="text-center text-sm font-medium text-emerald-400 mb-2 animate-pulse">
                                Gelen Arama...
                              </div>

                              <div className="flex justify-between items-center px-4 pb-2 w-full max-w-[200px] mx-auto">
                                <div className="flex flex-col items-center">
                                  <button className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-white transition transform hover:scale-105 shadow-lg shadow-rose-500/30">
                                    <Phone size={24} className="rotate-[135deg]" />
                                  </button>
                                </div>
                                <div className="flex flex-col items-center">
                                  <button className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white transition transform hover:scale-105 shadow-lg shadow-emerald-500/30 animate-bounce">
                                    <Phone size={24} />
                                  </button>
                                </div>
                              </div>

                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* NORMAL DURUM SAĞ TARAF (Sağlayıcı ve Harita) */}
                    <div 
                      className="bg-white border border-neutral-300 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden text-neutral-900 h-full"
                      style={{ 
                        backgroundImage: mapBackgroundImage, 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center' 
                      }}
                    >
                      <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] pointer-events-none" />

                      {/* MATCH FOUND EKRANI */}
                      {phase === 'MATCH_FOUND' && (
                        <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500 p-6">
                          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 text-white shadow-xl ${scenario === 1 ? 'bg-rose-500' : 'bg-blue-600'}`}>
                            {scenario === 1 ? <User size={40} /> : <Wrench size={40} />}
                          </div>
                          <h2 className="font-extrabold text-2xl text-neutral-900 mb-2">
                            {scenario === 1 ? 'Emlakçı Bulundu!' : 'Servis Bulundu!'}
                          </h2>
                          <div className="flex items-center space-x-2 mt-2 px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-full border border-neutral-200">
                            {scenario === 1 ? <User size={14} /> : <Wrench size={14} />}
                            <span className="text-xs font-bold">
                              {scenario === 1 ? 'Ayşe Hanım - Tarabya Emlak' : 'Murat Usta - Bosch Servis'}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="relative z-10 flex items-center justify-between border-b border-neutral-300/50 pb-3 bg-white/95 p-2 rounded-xl shadow-md">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-neutral-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {phase === 'FINAL_ACTION' ? (scenario === 1 ? "A" : "M") : "?"}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-neutral-900">
                              {phase === 'FINAL_ACTION' || phase === 'MATCH_FOUND'
                                ? (scenario === 1 ? "Ayşe Hanım" : "Murat Usta") 
                                : (phase === 'MAP_SCANNING' ? "Sistem Taranıyor..." : "Sistem Hazır")}
                            </h4>
                            <span className="text-[10px] text-neutral-600">
                              {phase === 'FINAL_ACTION' || phase === 'MATCH_FOUND'
                                ? (scenario === 1 ? "Tarabya Emlak Uzmanı" : "Bosch Yetkili Servis") 
                                : (phase === 'MAP_SCANNING' 
                                    ? "Veritabanı kontrol ediliyor" 
                                    : "Talep bekleniyor...")}
                            </span>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono transition-all duration-700 ${
                          phase === 'MAP_SCANNING' ? 'bg-amber-100 text-amber-700 border border-amber-300 animate-pulse' : 
                          phase === 'FINAL_ACTION' || phase === 'MATCH_FOUND' ? 'bg-neutral-800 text-white border border-neutral-900' : 'bg-neutral-200 text-neutral-600'
                        }`}>
                          {phase === 'MAP_SCANNING' ? 'Taranıyor' : (phase === 'FINAL_ACTION' || phase === 'MATCH_FOUND') ? 'Bulundu' : 'Bekliyor'}
                        </span>
                      </div>

                      <div className="relative z-10 flex-1 min-h-[140px] flex flex-col items-center justify-center py-2">
                        {phase === 'MAP_SCANNING' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                            <div className="animate-bounce bg-neutral-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex flex-col items-center space-y-2">
                              <Compass size={24} className="animate-spin text-emerald-400" /> 
                              <span className="text-xs font-bold text-center tracking-wide leading-relaxed">
                                {scenario === 1 ? (
                                  <>En Uygun <span className="text-emerald-400">Emlakçı</span><br/>Aranıyor...</>
                                ) : (
                                  <>En Uygun <span className="text-emerald-400">Servis</span><br/>Aranıyor...</>
                                )}
                              </span>
                            </div>
                          </div>
                        ) : (phase !== 'FINAL_ACTION' && phase !== 'MATCH_FOUND') ? (
                          <div className="text-center text-neutral-600 text-xs font-mono bg-white/95 px-3 py-1.5 rounded-lg border border-neutral-300 shadow-md">
                            Talep gönderildiğinde harita taranacak...
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ÖZELLİKLER BÖLÜMÜ */}
      <section className="py-20 bg-white border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-neutral-950 mb-4">Neden SMS KONTAK?</h2>
            <p className="text-neutral-600">Geleneksel ilan sitelerinin aksine, ihtiyaçlarınıza anında ve güvenle çözüm bulmanız için tasarlandı.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border flex items-center justify-center text-neutral-900 mb-4">
                <Lock size={20} />
              </div>
              <h3 className="text-lg font-bold text-neutral-950 mb-2">Tam Gizlilik</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Siz izin vermedikçe kimse telefon numaranızı göremez. Güvenmediğiniz kişilerle iletişimi anında kesebilirsiniz.</p>
            </div>
            <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border flex items-center justify-center text-neutral-900 mb-4">
                <Zap size={20} />
              </div>
              <h3 className="text-lg font-bold text-neutral-950 mb-2">Anında Eşleşme</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">Talebiniz, seçtiğiniz kelimelere göre saniyeler içinde bölgenizdeki en uygun uzmanların ekranına düşer.</p>
            </div>
            <div className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border flex items-center justify-center text-neutral-900 mb-4">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-lg font-bold text-neutral-950 mb-2">Seçim Özgürlüğü</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">İster telefon arama ile hızlı çözüm bulun, isterseniz Whatsapp/Sms ile mesajlaşarak fiyat tekliflerini toplayın.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}