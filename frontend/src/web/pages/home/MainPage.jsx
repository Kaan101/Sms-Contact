import React, { useState, useEffect } from 'react';
import { 
  Phone, ShieldCheck, Zap, 
  MapPin, CheckCircle2, ArrowRight, Lock, 
  MessageCircle, Send, PhoneCall, PhoneIncoming, Compass, CheckCheck 
} from 'lucide-react';

export default function MainPage({ onGoToLogin }) {
  const [scenario, setScenario] = useState(1); // 1: Telefon, 2: Whatsapp/Sms
  const [typedText, setTypedText] = useState('');
  const [phase, setPhase] = useState('TYPING'); 
  
  // WhatsApp senaryosu alt fazları
  const [whatsappPhase, setWhatsappPhase] = useState('CHATTING'); // CHATTING, SUCCESS_MARK
  const [chatStep, setChatStep] = useState(0); 
  const [showSuccess, setShowSuccess] = useState(false); // Büyük yeşil onay işareti state'i

  const fullText = scenario === 1 ? "Tarabya'da 3+1 kiralık" : "Bosch servis";

  // 1. FAZ: Daktilo Efekti (Daha yumuşak bir başlama)
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
        // Yazma bittikten sonra seçeneklerin gelmesini biraz daha geciktirdik
        setTimeout(() => setPhase('SHOW_OPTIONS'), 1500); 
      }
    }, 150);

    return () => clearInterval(typingInterval);
  }, [scenario]);

  // 2. FAZ: Kontrollü ve Yavaşlatılmış Akış
  useEffect(() => {
    let t1, t2, t3, t4, t5;

    if (phase === 'SHOW_OPTIONS') {
      t1 = setTimeout(() => setPhase('CLICK_OPTION'), 1800); // Yavaşlatıldı
    } else if (phase === 'CLICK_OPTION') {
      t2 = setTimeout(() => setPhase('CLICK_SEND'), 1200); // Yavaşlatıldı
    } else if (phase === 'CLICK_SEND') {
      t3 = setTimeout(() => setPhase('MAP_SCANNING'), 1500); // Yavaşlatıldı
    } else if (phase === 'MAP_SCANNING') {
      t4 = setTimeout(() => setPhase('FINAL_ACTION'), 4500); // Harita taraması uzatıldı
    } else if (phase === 'FINAL_ACTION') {
      // Senaryo 1 (Telefon) 7 saniye sürer.
      // Senaryo 2 (WhatsApp) Chat (11sn) + Success Mark (4sn) = 15 saniye sürer.
      const delay = scenario === 1 ? 7000 : 16000; 
      
      t5 = setTimeout(() => {
        // Senaryo değişirken araya çok hafif bir yumuşaklık koymak için
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
    };
  }, [phase, scenario]);

  // 3. FAZ: WhatsApp Senaryosu (Chat ve Dev dev Yeşil Ok Geçişi)
  useEffect(() => {
    let timers = [];
    if (phase === 'FINAL_ACTION' && scenario === 2) {
      setWhatsappPhase('CHATTING');
      setShowSuccess(false);

      // Chat adımları
      const chatSteps = [
        { step: 1, delay: 1000 },  // Bosch servis yazmaya başlar
        { step: 2, delay: 3000 },  // Bosch servis ilk mesajı atar
        { step: 3, delay: 4500 },  // Mehmet Bey yazmaya başlar
        { step: 4, delay: 7000 },  // Mehmet Bey sorunu yazar
        { step: 5, delay: 8500 },  // Bosch servis cevap yazmaya başlar
        { step: 6, delay: 11000 }  // Bosch servis randevuyu onaylar
      ];
      chatSteps.forEach(s => timers.push(setTimeout(() => setChatStep(s.step), s.delay)));

      // Chat bittikten sonra ekran kararır ve BÜYÜK YEŞİL OK belirir
      timers.push(setTimeout(() => {
        setWhatsappPhase('SUCCESS_MARK');
        // Yeşil okun yavaşça fade-in olması için
        setTimeout(() => setShowSuccess(true), 100);
        // Yeşil okun kaybolup diğer senaryoya geçmesi için fade-out
        setTimeout(() => setShowSuccess(false), 3500); 
      }, 12500));
    }
    return () => timers.forEach(clearTimeout);
  }, [phase, scenario]);

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch relative flex-1">
                
                {/* SOL TARAF: MÜŞTERİ */}
                {phase === 'FINAL_ACTION' && scenario === 2 ? (
                  <div className="flex flex-col h-full relative overflow-hidden rounded-[2rem] border border-neutral-200 shadow-md bg-white">
                    
                    {/* Chat Ekranı */}
                    <div className={`flex flex-col h-[380px] bg-[#EFEAE2] border-[6px] border-neutral-900 rounded-[2rem] transition-opacity duration-1000 ${whatsappPhase === 'CHATTING' ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="bg-[#00A884] text-white px-4 py-3 flex items-center space-x-3 z-10 shadow-sm">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs shrink-0">MU</div>
                        <div className="leading-tight flex-1">
                          <div className="font-bold text-[13px] whitespace-nowrap">Murat Usta (Bosch)</div>
                          <div className="text-[10px] text-white/90 font-medium">
                            {(chatStep === 1 || chatStep === 5) ? 'yazıyor...' : 'çevrimiçi'}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 p-3 space-y-3 relative z-0 flex flex-col overflow-y-auto">
                        {chatStep >= 2 && (
                          <div className="bg-white text-neutral-900 p-2.5 rounded-xl rounded-tl-none text-[11px] font-medium self-start max-w-[85%] shadow-sm relative z-10 animate-in slide-in-from-left-2 fade-in duration-500">
                            Merhaba, Bosch yetkili servisinden Murat ben. Size nasıl yardımcı olabilirim?
                            <span className="text-[8px] text-neutral-400 float-right ml-2 mt-1.5">10:41</span>
                          </div>
                        )}
                        {chatStep >= 4 && (
                          <div className="bg-[#D9FDD3] text-neutral-900 p-2.5 rounded-xl rounded-tr-none text-[11px] font-medium self-end max-w-[85%] shadow-sm relative z-10 animate-in slide-in-from-right-2 fade-in duration-500">
                            Merhaba Murat Usta, makine su almıyor, E18 hatası veriyor. Bugün bakabilir misiniz?
                            <span className="text-[8px] text-neutral-500 float-right ml-2 mt-1.5 flex items-center"><CheckCheck size={10} className="text-blue-500 ml-0.5"/> 10:42</span>
                          </div>
                        )}
                        {chatStep >= 6 && (
                          <div className="bg-white text-neutral-900 p-2.5 rounded-xl rounded-tl-none text-[11px] font-medium self-start max-w-[85%] shadow-sm relative z-10 animate-in slide-in-from-left-2 fade-in duration-500">
                            Tabii, saat 14:00-16:00 arası bölgenizdeyiz. Ekip arkadaşlarımla gelip kontrol edeceğiz.
                            <span className="text-[8px] text-neutral-400 float-right ml-2 mt-1.5">10:43</span>
                          </div>
                        )}
                      </div>
                      <div className="bg-[#f0f2f5] p-2 flex items-center space-x-2 z-10 border-t border-neutral-200">
                        <div className="bg-white rounded-full flex-1 px-3 py-2 text-[11px] text-neutral-400 shadow-sm">
                          {chatStep === 3 ? 'Yazıyorsunuz...' : 'Mesaj yazın'}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Send size={12} className="-ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Büyük Yeşil Ok - Müşteri Tarafı */}
                    <div className={`absolute inset-0 bg-white/95 z-50 flex items-center justify-center transition-all duration-1000 ease-in-out ${showSuccess && whatsappPhase === 'SUCCESS_MARK' ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                       <div className="w-32 h-32 rounded-full bg-emerald-100 flex items-center justify-center animate-pulse">
                         <CheckCircle2 size={72} className="text-emerald-500" />
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-neutral-50/80 border border-neutral-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs h-full">
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
                        phase === 'MAP_SCANNING' || phase === 'FINAL_ACTION' 
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
                          <div className={`px-4 py-1.5 text-[10px] font-bold rounded-lg shadow-sm flex items-center space-x-1 transition-all duration-500 ${phase === 'CLICK_SEND' ? 'bg-neutral-700 text-white scale-95' : 'bg-neutral-950 text-white'}`}>
                            <span>Gönder</span><Send size={10} />
                          </div>
                        </div>
                      </div>

                      {phase === 'FINAL_ACTION' && scenario === 1 && (
                        <div className="animate-in fade-in zoom-in duration-1000">
                          <div className="bg-gradient-to-b from-emerald-600 to-emerald-800 text-white p-4 rounded-2xl shadow-xl space-y-4 text-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />
                            <div className="relative z-10 flex flex-col items-center space-y-1">
                              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1 animate-ping absolute top-3" />
                              <PhoneIncoming size={20} className="animate-bounce mb-1 text-emerald-200" />
                              <span className="text-[9px] uppercase tracking-widest font-mono text-emerald-200 font-bold">Gelen Telefon Araması</span>
                              <h5 className="text-sm font-extrabold tracking-tight mt-1">Emlakçı (Ayşe Hanım) arıyor.</h5>
                              <p className="text-[11px] text-emerald-100 font-mono">0532 555 44 33</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SAĞ TARAF: SAĞLAYICI */}
                {phase === 'FINAL_ACTION' && scenario === 2 ? (
                  <div className="flex flex-col h-full relative overflow-hidden rounded-[2rem] border border-neutral-200 shadow-md bg-white">
                    
                    {/* Chat Ekranı */}
                    <div className={`flex flex-col h-[380px] bg-[#EFEAE2] border-[6px] border-neutral-900 rounded-[2rem] transition-opacity duration-1000 delay-150 ${whatsappPhase === 'CHATTING' ? 'opacity-100' : 'opacity-0'}`}>
                      <div className="bg-[#00A884] text-white px-4 py-3 flex items-center space-x-3 z-10 shadow-sm">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs shrink-0">M</div>
                        <div className="leading-tight flex-1">
                          <div className="font-bold text-[13px]">Mehmet Bey</div>
                          <div className="text-[10px] text-white/90 font-medium">
                            {chatStep === 3 ? 'yazıyor...' : 'çevrimiçi'}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 p-3 space-y-3 relative z-0 flex flex-col overflow-y-auto">
                        {chatStep >= 2 && (
                          <div className="bg-[#D9FDD3] text-neutral-900 p-2.5 rounded-xl rounded-tr-none text-[11px] font-medium self-end max-w-[85%] shadow-sm relative z-10 animate-in slide-in-from-right-2 fade-in duration-500">
                            Merhaba, Bosch yetkili servisinden Murat ben. Size nasıl yardımcı olabilirim?
                            <span className="text-[8px] text-neutral-500 float-right ml-2 mt-1.5 flex items-center"><CheckCheck size={10} className="text-blue-500 ml-0.5"/> 10:41</span>
                          </div>
                        )}
                        {chatStep >= 4 && (
                          <div className="bg-white text-neutral-900 p-2.5 rounded-xl rounded-tl-none text-[11px] font-medium self-start max-w-[85%] shadow-sm relative z-10 animate-in slide-in-from-left-2 fade-in duration-500">
                            Merhaba Murat Usta, makine su almıyor, E18 hatası veriyor. Bugün bakabilir misiniz?
                            <span className="text-[8px] text-neutral-400 float-right ml-2 mt-1.5">10:42</span>
                          </div>
                        )}
                        {chatStep >= 6 && (
                          <div className="bg-[#D9FDD3] text-neutral-900 p-2.5 rounded-xl rounded-tr-none text-[11px] font-medium self-end max-w-[85%] shadow-sm relative z-10 animate-in slide-in-from-right-2 fade-in duration-500">
                            Tabii, saat 14:00-16:00 arası bölgenizdeyiz. Ekip arkadaşlarımla gelip kontrol edeceğiz.
                            <span className="text-[8px] text-neutral-500 float-right ml-2 mt-1.5 flex items-center"><CheckCheck size={10} className="text-blue-500 ml-0.5"/> 10:43</span>
                          </div>
                        )}
                      </div>
                      <div className="bg-[#f0f2f5] p-2 flex items-center space-x-2 z-10 border-t border-neutral-200">
                        <div className="bg-white rounded-full flex-1 px-3 py-2 text-[11px] text-neutral-400 shadow-sm">
                          {(chatStep === 1 || chatStep === 5) ? 'Yazıyorsunuz...' : 'Mesaj yazın'}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#00A884] text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Send size={12} className="-ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Büyük Yeşil Ok - Sağlayıcı Tarafı */}
                    <div className={`absolute inset-0 bg-white/95 z-50 flex items-center justify-center transition-all duration-1000 ease-in-out delay-150 ${showSuccess && whatsappPhase === 'SUCCESS_MARK' ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
                       <div className="w-32 h-32 rounded-full bg-emerald-100 flex items-center justify-center animate-pulse">
                         <CheckCircle2 size={72} className="text-emerald-500" />
                       </div>
                    </div>

                  </div>
                ) : (
                  <div className="bg-[#EAE6DF] border border-neutral-300 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden text-neutral-900 h-full">
                    <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />
                    <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-sky-100/50 via-transparent to-amber-100/40 pointer-events-none" />

                    <div className="relative z-10 flex items-center justify-between border-b border-neutral-300 pb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-neutral-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {scenario === 1 ? "A" : "M"}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900">
                            {scenario === 1 ? "Ayşe Hanım" : "Murat Usta"}
                          </h4>
                          <span className="text-[10px] text-neutral-600">
                            {scenario === 1 ? "Tarabya Emlak Uzmanı" : "Bosch Yetkili Servis"}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono transition-all duration-700 ${
                        phase === 'MAP_SCANNING' ? 'bg-neutral-200 text-neutral-700 border border-neutral-300 animate-pulse' : 
                        phase === 'FINAL_ACTION' ? 'bg-neutral-800 text-white border border-neutral-900' : 'bg-neutral-200 text-neutral-600'
                      }`}>
                        {phase === 'MAP_SCANNING' ? 'Harita Taranıyor...' : phase === 'FINAL_ACTION' ? 'Eşleşti' : 'Bekliyor'}
                      </span>
                    </div>

                    <div className="relative z-10 flex-1 min-h-[140px] flex flex-col items-center justify-center py-2">
                      {phase === 'MAP_SCANNING' || phase === 'FINAL_ACTION' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
                          <span className="text-[10px] font-mono text-neutral-800 font-bold uppercase tracking-wider flex items-center gap-1.5 bg-white/90 px-2.5 py-1 rounded-full border border-neutral-300 shadow-xs">
                            <Compass size={13} className="animate-spin text-neutral-600" /> Bölgedeki Alternatifler Analiz Ediliyor
                          </span>
                        </div>
                      ) : (
                        <div className="text-center text-neutral-600 text-xs font-mono bg-white/60 px-3 py-1.5 rounded-lg border border-neutral-300 shadow-xs">
                          Talep gönderildiğinde harita taranacak...
                        </div>
                      )}
                    </div>
                  </div>
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