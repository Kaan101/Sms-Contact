import React, { useState, useEffect } from 'react';
import { 
  Phone, ShieldCheck, Zap, 
  MapPin, CheckCircle2, ArrowRight, Lock, 
  MessageCircle, Send, Compass, CheckCheck, User, Wrench
} from 'lucide-react';

export default function MainPage({ onGoToLogin }) {
  const [scenario, setScenario] = useState(1); // 1: Telefon, 2: Whatsapp/Sms
  const [typedText, setTypedText] = useState('');
  
  // Fazlar: MOBOOL_INTRO -> TYPING -> SHOW_OPTIONS -> CLICK_OPTION -> CLICK_SEND -> MAP_SCANNING -> MATCH_FOUND -> FINAL_ACTION -> MOBOOL_OUTRO
  const [phase, setPhase] = useState('MOBOOL_INTRO'); 
  
  const [whatsappPhase, setWhatsappPhase] = useState('CHATTING'); 
  const [chatStep, setChatStep] = useState(0); 
  const [showSuccess, setShowSuccess] = useState(false);

  const fullText = scenario === 1 ? "Tarabya'da 3+1 kiralık" : "Bosch servis";

  // 1. FAZ: Daktilo ve Intro/Outro Yönetimi
  useEffect(() => {
    if (phase === 'MOBOOL_INTRO') {
      const t = setTimeout(() => setPhase('TYPING'), 2500);
      return () => clearTimeout(t);
    }
    
    if (phase === 'TYPING') {
      setTypedText('');
      setChatStep(0);
      setShowSuccess(false);
      let idx = 0;
      const t = setInterval(() => {
        if (idx <= fullText.length) {
          setTypedText(fullText.slice(0, idx));
          idx++;
        } else {
          clearInterval(t);
          setTimeout(() => setPhase('SHOW_OPTIONS'), 1200);
        }
      }, 100);
      return () => clearInterval(t);
    }
  }, [phase, fullText]);

  // 2. FAZ: Kusursuz Zamanlanmış Durum Makinesi (State Machine)
  useEffect(() => {
    let t1;
    switch(phase) {
      case 'SHOW_OPTIONS': 
        t1 = setTimeout(() => setPhase('CLICK_OPTION'), 2000); 
        break;
      case 'CLICK_OPTION': 
        t1 = setTimeout(() => setPhase('CLICK_SEND'), 1500); 
        break;
      case 'CLICK_SEND': 
        t1 = setTimeout(() => setPhase('MAP_SCANNING'), 1000); 
        break;
      case 'MAP_SCANNING': 
        t1 = setTimeout(() => setPhase('MATCH_FOUND'), 4000); 
        break;
      case 'MATCH_FOUND': 
        t1 = setTimeout(() => setPhase('FINAL_ACTION'), 3500); 
        break;
      case 'FINAL_ACTION': 
        const delay = scenario === 1 ? 7000 : 15000;
        t1 = setTimeout(() => setPhase('MOBOOL_OUTRO'), delay); 
        break;
      case 'MOBOOL_OUTRO':
        t1 = setTimeout(() => {
          // Döngü başa sarıyor
          setScenario(prev => prev === 1 ? 2 : 1);
          setPhase('MOBOOL_INTRO');
        }, 3500);
        break;
      default: break;
    }
    return () => clearTimeout(t1);
  }, [phase, scenario]);

  // 3. FAZ: WhatsApp Chat Adımları
  useEffect(() => {
    let timers = [];
    if (phase === 'FINAL_ACTION' && scenario === 2) {
      setWhatsappPhase('CHATTING');
      setShowSuccess(false);

      const chatSteps = [
        { step: 1, delay: 1500 },
        { step: 2, delay: 3500 },
        { step: 3, delay: 5000 },
        { step: 4, delay: 7500 },
        { step: 5, delay: 9000 },
        { step: 6, delay: 12000 }
      ];
      chatSteps.forEach(s => timers.push(setTimeout(() => setChatStep(s.step), s.delay)));

      timers.push(setTimeout(() => {
        setWhatsappPhase('SUCCESS_MARK');
        setTimeout(() => setShowSuccess(true), 100);
        setTimeout(() => setShowSuccess(false), 2000); 
      }, 12500));
    }
    return () => timers.forEach(clearTimeout);
  }, [phase, scenario]);

  const mapBackgroundImage = `url('/images/map_bg.png')`;

  return (
    <div className="min-h-screen bg-neutral-50 font-sans selection:bg-neutral-900 selection:text-white overflow-x-hidden">
      
      {/* HEADER */}
      <header className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="text-xl font-extrabold tracking-tight text-neutral-950 flex items-center space-x-2">
            <div className="w-8 h-8 bg-neutral-950 rounded-lg flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span>SMS KONTAK</span>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => onGoToLogin('LOGIN')} className="px-6 py-2.5 text-sm font-bold text-white bg-neutral-950 hover:bg-neutral-800 rounded-xl transition shadow-sm cursor-pointer">
              Giriş Yap
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-500">Şartları Siz Belirleyin.</span>
            </h1>
            <p className="text-lg text-neutral-600 mb-8 leading-relaxed font-medium">
              Numaranızı paylaşmak zorunda değilsiniz. Talebinizi oluşturun, çevrenizdeki en iyi uzmanlar anında görsün. Telefon arama mı, yoksa Whatsapp/Sms mi? Karar sizin.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button onClick={() => onGoToLogin('CUSTOMER')} className="w-full sm:w-auto px-8 py-4 bg-neutral-950 hover:bg-neutral-800 text-white rounded-2xl font-bold text-sm transition shadow-lg flex items-center justify-center space-x-2 cursor-pointer">
                <span>Hemen Talep Oluştur</span><ArrowRight size={16} />
              </button>
              <button onClick={() => onGoToLogin('PROVIDER')} className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-neutral-50 text-neutral-950 border border-neutral-200 rounded-2xl font-bold text-sm transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer">
                <ShieldCheck size={16} className="text-neutral-500" /><span>Hizmet Veren Olun</span>
              </button>
            </div>
          </div>

          {/* Sağ Taraf: Simülasyon */}
          <div className="lg:col-span-7 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-neutral-100 to-white rounded-[2rem] transform rotate-1 scale-105 border border-neutral-200 shadow-xl" />
            
            <div className="relative bg-white rounded-[2rem] border border-neutral-200 shadow-2xl p-6 lg:p-8 flex flex-col min-h-[480px] overflow-hidden">
              
              {/* MOBOOL INTRO/OUTRO EKRANI */}
              <div className={`absolute inset-0 z-[60] bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-1000 ease-in-out ${
                phase === 'MOBOOL_INTRO' || phase === 'MOBOOL_OUTRO' ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
              }`}>
                <div className="w-20 h-20 bg-neutral-950 rounded-3xl flex items-center justify-center shadow-2xl mb-6">
                  <Zap size={40} className="text-white" />
                </div>
                <h2 className="text-4xl font-extrabold text-neutral-950 mb-3 tracking-tight">MOBOOL</h2>
                <p className="text-base font-medium text-neutral-500 text-center px-8 leading-relaxed max-w-sm">
                  {scenario === 1 ? 'Evinizin rahatlığında siz isteyin, en iyi uzmanlar anında size ulaşsın.' : 'Sorunlarınızı yazın, işin ehli ustalar kapınıza kadar gelsin.'}
                </p>
              </div>

              {/* Simülasyon Başlığı */}
              <div className="flex items-center justify-between border-b pb-4 mb-6 relative z-40">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Canlı Akış Simülasyonu</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono font-bold text-neutral-400">Senaryo {scenario}/2 ({scenario === 1 ? "Telefon" : "Whatsapp/Sms"})</span>
                  <div className="flex space-x-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${scenario === 1 ? 'w-4 bg-neutral-900' : 'bg-neutral-300'}`} />
                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-700 ${scenario === 2 ? 'w-4 bg-neutral-900' : 'bg-neutral-300'}`} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch relative flex-1">
                
                {/* 1. SOL EKRAN (Müşteri - TAMAMEN SABİT) */}
                <div className="bg-neutral-50/80 border border-neutral-200/80 rounded-2xl p-5 flex flex-col h-full shadow-xs relative z-10">
                  
                  {/* Kullanıcı Profili ve Mesaj */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2.5 mb-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">M</div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900">Mehmet Bey</h4>
                        <span className="text-[10px] text-neutral-500 flex items-center"><MapPin size={10} className="mr-0.5" /> Tarabya, İstanbul</span>
                      </div>
                    </div>
                    
                    {/* Büyütülmüş Daktilo Metni */}
                    <div className="bg-white border border-neutral-200/80 p-4 rounded-xl shadow-xs min-h-[64px] flex items-center">
                      <p className="text-[13px] font-semibold text-neutral-800 leading-relaxed font-mono">
                        {typedText}
                        {(phase === 'TYPING') && <span className="inline-block w-1.5 h-3.5 bg-neutral-900 ml-0.5 animate-pulse" />}
                      </p>
                    </div>
                  </div>

                  {/* Seçenekler (Mesajın hemen altına kaydırıldı) */}
                  <div className="mb-auto mt-2">
                    <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase block mb-2">İletişim Tercihinizi Seçin:</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`flex items-center justify-center space-x-1.5 py-3 px-2 rounded-xl text-[11px] font-bold shadow-sm transition-all duration-300 ${
                        scenario === 1 && phase !== 'TYPING' && phase !== 'SHOW_OPTIONS'
                          ? 'bg-neutral-100 text-neutral-900 border-2 border-neutral-800 border-solid shadow-inner scale-95' 
                          : 'bg-white text-neutral-500 border border-neutral-300'
                      }`}>
                        <Phone size={14} /><span>Telefon</span>
                      </div>

                      <div className={`flex items-center justify-center space-x-1.5 py-3 px-2 rounded-xl text-[11px] font-bold shadow-sm transition-all duration-300 ${
                        scenario === 2 && phase !== 'TYPING' && phase !== 'SHOW_OPTIONS'
                          ? 'bg-neutral-100 text-neutral-900 border-2 border-neutral-800 border-solid shadow-inner scale-95' 
                          : 'bg-white text-neutral-500 border border-neutral-300'
                      }`}>
                        <MessageCircle size={14} /><span>Whatsapp/Sms</span>
                      </div>
                    </div>
                  </div>

                  {/* Gönder Butonu (Boşluk artırıldı, CTA büyütüldü) */}
                  <div className="mt-8 pt-4 flex justify-end border-t border-neutral-200/60">
                    <div className={`px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 transition-all duration-500 ${
                      (phase === 'MAP_SCANNING' || phase === 'MATCH_FOUND' || phase === 'FINAL_ACTION') 
                        ? 'bg-neutral-700 text-white scale-95 opacity-90' 
                        : 'bg-neutral-950 text-white transform hover:scale-105'
                    }`}>
                      <span className="text-xs font-extrabold tracking-wide uppercase">
                        {(phase === 'MAP_SCANNING' || phase === 'MATCH_FOUND' || phase === 'FINAL_ACTION') ? 'Gönderildi' : 'Gönder'}
                      </span>
                      {(phase === 'MAP_SCANNING' || phase === 'MATCH_FOUND' || phase === 'FINAL_ACTION') ? <CheckCircle2 size={16} /> : <Send size={16} />}
                    </div>
                  </div>
                </div>

                {/* 2. SAĞ EKRAN (Aksiyon Merkezi: Harita / Telefon / WhatsApp) */}
                <div 
                  className="bg-white border border-neutral-300 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden text-neutral-900 h-full"
                  style={{ backgroundImage: mapBackgroundImage, backgroundSize: 'cover', backgroundPosition: 'center' }}
                >
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] pointer-events-none z-0" />

                  {/* Sağ Ekran Üst Bar */}
                  <div className="relative z-10 flex items-center justify-between border-b border-neutral-300/50 pb-3 bg-white/95 p-3 rounded-t-2xl shadow-sm">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {phase === 'FINAL_ACTION' || phase === 'MATCH_FOUND' ? (scenario === 1 ? "A" : "M") : "?"}
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
                            : (phase === 'MAP_SCANNING' ? "Veritabanı kontrol ediliyor" : "Talep bekleniyor...")}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded font-mono transition-all duration-700 ${
                      phase === 'MAP_SCANNING' ? 'bg-amber-100 text-amber-700 border border-amber-300 animate-pulse' : 
                      phase === 'FINAL_ACTION' || phase === 'MATCH_FOUND' ? 'bg-neutral-800 text-white border border-neutral-900' : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {phase === 'MAP_SCANNING' ? 'Taranıyor' : (phase === 'FINAL_ACTION' || phase === 'MATCH_FOUND') ? 'Bulundu' : 'Bekliyor'}
                    </span>
                  </div>

                  {/* Harita Taraması Orta Alan */}
                  <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
                    {phase === 'MAP_SCANNING' ? (
                      <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-neutral-200 flex flex-col items-center space-y-3 animate-in fade-in zoom-in duration-500">
                        <Compass size={32} className="animate-spin text-emerald-500" /> 
                        <span className="text-xs font-extrabold text-center text-neutral-800 tracking-wide">
                          {scenario === 1 ? (
                            <>En Uygun <span className="text-emerald-600">Emlakçı</span> Aranıyor...</>
                          ) : (
                            <>En Uygun <span className="text-emerald-600">Servis</span> Aranıyor...</>
                          )}
                        </span>
                      </div>
                    ) : (phase !== 'FINAL_ACTION' && phase !== 'MATCH_FOUND') ? (
                      <div className="text-center text-neutral-600 text-xs font-mono bg-white/95 px-4 py-2 rounded-lg border border-neutral-300 shadow-md">
                        Talep gönderildiğinde harita taranacak...
                      </div>
                    ) : null}
                  </div>

                  {/* MATCH FOUND OVERLAY (Sadece Sağ Ekranda) */}
                  {phase === 'MATCH_FOUND' && (
                    <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500 p-6">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 text-white shadow-xl ${scenario === 1 ? 'bg-rose-500' : 'bg-blue-600'}`}>
                        {scenario === 1 ? <User size={40} /> : <Wrench size={40} />}
                      </div>
                      <h2 className="font-extrabold text-2xl text-neutral-900 mb-2">
                        {scenario === 1 ? 'Emlakçı Bulundu!' : 'Servis Bulundu!'}
                      </h2>
                      <div className="flex items-center space-x-2 mt-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-full border border-neutral-200 shadow-sm">
                        {scenario === 1 ? <User size={14} /> : <Wrench size={14} />}
                        <span className="text-xs font-bold">
                          {scenario === 1 ? 'Ayşe Hanım - Tarabya Emlak' : 'Murat Usta - Bosch Servis'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TELEFON ARAMASI (Senaryo 1) OVERLAY (Sadece Sağ Ekranda) */}
                  {phase === 'FINAL_ACTION' && scenario === 1 && (
                    <div className="absolute inset-0 z-40 bg-gradient-to-b from-emerald-600 to-emerald-800 text-white p-6 rounded-2xl shadow-2xl flex flex-col justify-between animate-in slide-in-from-bottom-8 duration-700">
                      <div className="flex flex-col items-center pt-6">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
                            <User size={24} className="text-emerald-600" />
                          </div>
                        </div>
                        <h5 className="text-xl font-medium tracking-tight mb-1">Ayşe Hanım</h5>
                        <p className="text-sm text-emerald-100">Tarabya Emlak Uzmanı</p>
                      </div>

                      <div className="text-center text-base font-bold text-white mb-4 animate-pulse tracking-wide">
                        Gelen Arama...
                      </div>

                      <div className="flex justify-between items-center px-4 pb-4 w-full max-w-[240px] mx-auto">
                        <div className="flex flex-col items-center space-y-2">
                          <button className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-white transition transform hover:scale-105 shadow-lg shadow-rose-500/40">
                            <Phone size={28} className="rotate-[135deg]" />
                          </button>
                          <span className="text-xs font-medium text-emerald-50">Reddet</span>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                          <button className="w-16 h-16 rounded-full bg-emerald-500 border-[3px] border-emerald-400 hover:bg-emerald-400 flex items-center justify-center text-white transition transform hover:scale-105 shadow-lg shadow-emerald-900/50 animate-bounce">
                            <Phone size={28} />
                          </button>
                          <span className="text-xs font-bold text-white">Kabul Et</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* WHATSAPP CHAT (Senaryo 2) OVERLAY (Sadece Sağ Ekranda) */}
                  {phase === 'FINAL_ACTION' && scenario === 2 && (
                    <div className="absolute inset-0 z-40 bg-[#EFEAE2] flex flex-col rounded-2xl border-[6px] border-neutral-900 overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                      
                      <div className="bg-[#00A884] text-white px-4 py-3 flex items-center justify-between z-10 shadow-sm">
                        <div className="flex items-center space-x-3">
                           <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm shrink-0">B</div>
                           <div className="leading-tight overflow-hidden">
                             <div className="font-bold text-sm whitespace-nowrap truncate">Bosch Servis İletişim</div>
                             <div className="text-[11px] text-white/90 font-medium">
                               {chatStep === 1 || chatStep === 5 ? 'Murat Usta yazıyor...' : chatStep === 3 ? 'Siz yazıyorsunuz...' : 'çevrimiçi'}
                             </div>
                           </div>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0">
                           <Phone size={18} className="text-white/90" />
                        </div>
                      </div>
                      
                      {/* Büyütülmüş Fontlu Chat Alanı */}
                      <div className="flex-1 p-3 space-y-3 relative z-0 flex flex-col overflow-y-auto overflow-x-hidden w-full">
                        {chatStep >= 2 && (
                          <div className="self-start max-w-[85%] animate-in slide-in-from-left-2 fade-in duration-500 mt-2">
                            <span className="text-[10px] font-bold text-neutral-500/80 mb-1 ml-1 block tracking-wider uppercase">Murat Usta</span>
                            <div className="bg-white text-neutral-900 p-3 rounded-xl rounded-tl-none text-xs leading-relaxed shadow-sm relative flex flex-col">
                              <span className="break-words whitespace-normal">Merhaba, Bosch yetkili servisinden Murat ben. Size nasıl yardımcı olabilirim?</span>
                              <span className="text-[9px] text-neutral-400 self-end mt-1 shrink-0">10:41</span>
                            </div>
                          </div>
                        )}
                        
                        {chatStep >= 4 && (
                          <div className="self-end max-w-[85%] animate-in slide-in-from-right-2 fade-in duration-500">
                            <span className="text-[10px] font-bold text-neutral-500/80 mb-1 mr-1 block text-right tracking-wider uppercase">Mehmet Bey (Siz)</span>
                            <div className="bg-[#D9FDD3] text-neutral-900 p-3 rounded-xl rounded-tr-none text-xs leading-relaxed shadow-sm relative flex flex-col">
                              <span className="break-words whitespace-normal">Merhaba Murat Usta, makine su almıyor, E18 hatası veriyor. Bugün bakabilir misiniz?</span>
                              <div className="flex items-center justify-end mt-1 shrink-0">
                                <span className="text-[9px] text-neutral-500">10:42</span>
                                <CheckCheck size={12} className="text-blue-500 ml-1"/> 
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {chatStep >= 6 && (
                          <div className="self-start max-w-[85%] animate-in slide-in-from-left-2 fade-in duration-500">
                             <span className="text-[10px] font-bold text-neutral-500/80 mb-1 ml-1 block tracking-wider uppercase">Murat Usta</span>
                            <div className="bg-white text-neutral-900 p-3 rounded-xl rounded-tl-none text-xs leading-relaxed shadow-sm relative flex flex-col">
                              <span className="break-words whitespace-normal">Tabii, saat 14:00-16:00 arası bölgenizdeyiz. Ekip arkadaşlarımla gelip kontrol edeceğiz.</span>
                              <span className="text-[9px] text-neutral-400 self-end mt-1 shrink-0">10:43</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-[#f0f2f5] p-3 flex items-center space-x-3 z-10 border-t border-neutral-200 w-full shrink-0">
                        <div className="bg-white rounded-full flex-1 px-4 py-2.5 text-xs text-neutral-400 shadow-sm flex items-center space-x-2 overflow-hidden">
                          <MessageCircle size={16} className="text-neutral-400 shrink-0" />
                          <span className="truncate">Mesaj yazın</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Send size={14} className="-ml-0.5" />
                        </div>
                      </div>

                      {/* WhatsApp İçi Dev Yeşil Onay Overlay */}
                      <div className={`absolute inset-0 z-50 flex items-center justify-center transition-all duration-1000 ease-in-out ${showSuccess && whatsappPhase === 'SUCCESS_MARK' ? 'opacity-100 bg-white/70 backdrop-blur-sm scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                        <div className="w-32 h-32 rounded-full bg-emerald-100 flex items-center justify-center shadow-2xl">
                          <CheckCircle2 size={72} className="text-emerald-500" />
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ÖZELLİKLER BÖLÜMÜ */}
      <section className="py-20 bg-white border-t border-neutral-100">
        {/* ... Properties section remains the same ... */}
      </section>

    </div>
  );
}