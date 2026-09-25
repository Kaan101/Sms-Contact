import React, { useState, useEffect } from 'react';
import { 
  Phone, ShieldCheck, Zap, User, 
  MapPin, CheckCircle2, ArrowRight, Lock, 
  MessageCircle, Send, PhoneCall, BellRing, PhoneIncoming, Compass, Navigation 
} from 'lucide-react';

export default function MainPage({ onGoToLogin }) {
  const [scenario, setScenario] = useState(1); // 1: Telefon, 2: Whatsapp/Sms
  const [typedText, setTypedText] = useState('');
  const [phase, setPhase] = useState('TYPING'); 

  const fullText = scenario === 1 ? "Tarabya'da 3+1 kiralık" : "Bosch servis";

  // 1. FAZ: Daktilo Efekti
  useEffect(() => {
    setTypedText('');
    setPhase('TYPING');
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => setPhase('SHOW_OPTIONS'), 1000);
      }
    }, 150);

    return () => clearInterval(typingInterval);
  }, [scenario]);

  // 2. FAZ: Kontrollü Akış
  useEffect(() => {
    let t1, t2, t3, t4, t5;

    if (phase === 'SHOW_OPTIONS') {
      t1 = setTimeout(() => setPhase('CLICK_OPTION'), 1500);
    } else if (phase === 'CLICK_OPTION') {
      t2 = setTimeout(() => setPhase('CLICK_SEND'), 1000);
    } else if (phase === 'CLICK_SEND') {
      t3 = setTimeout(() => setPhase('MAP_SCANNING'), 1200);
    } else if (phase === 'MAP_SCANNING') {
      t4 = setTimeout(() => setPhase('FINAL_ACTION'), 4000);
    } else if (phase === 'FINAL_ACTION') {
      t5 = setTimeout(() => setScenario(prev => prev === 1 ? 2 : 1), 6000);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [phase]);

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
          <div className="hidden md:flex items-center space-x-8 text-sm font-semibold text-neutral-600">
            <a href="#" className="hover:text-neutral-950 transition">Nasıl Çalışır?</a>
            <a href="#" className="hover:text-neutral-950 transition">Hizmet Alanlar</a>
            <a href="#" className="hover:text-neutral-950 transition">Sağlayıcılar</a>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => onGoToLogin('CUSTOMER')} 
              className="px-4 py-2 text-sm font-bold text-neutral-700 hover:text-neutral-950 transition"
            >
              Giriş Yap
            </button>
            <button 
              onClick={() => onGoToLogin('CUSTOMER')}
              className="px-5 py-2 text-sm font-bold text-white bg-neutral-950 hover:bg-neutral-800 rounded-xl transition shadow-sm"
            >
              Kayıt Ol
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
          
          {/* Sol Taraf: Metinler (5 Kolon) */}
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
            
            {/* ROL YÖNLENDİRMELİ BUTONLAR */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={() => onGoToLogin('CUSTOMER')} 
                className="w-full sm:w-auto px-8 py-4 bg-neutral-950 hover:bg-neutral-800 text-white rounded-2xl font-bold text-sm transition shadow-lg shadow-neutral-900/20 flex items-center justify-center space-x-2"
              >
                <span>Hemen Talep Oluştur</span>
                <ArrowRight size={16} />
              </button>
              <button 
                onClick={() => onGoToLogin('PROVIDER')} 
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-neutral-50 text-neutral-950 border border-neutral-200 rounded-2xl font-bold text-sm transition shadow-sm flex items-center justify-center space-x-2"
              >
                <ShieldCheck size={16} className="text-neutral-500" />
                <span>Hizmet Veren Olun</span>
              </button>
            </div>
            
            <div className="mt-10 flex items-center space-x-6 text-sm font-semibold text-neutral-500">
              <div className="flex items-center space-x-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>Ücretsiz</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span>%100 Gizlilik Odaklı</span>
              </div>
            </div>
          </div>

          {/* Sağ Taraf: İki Sütunlu Yan Yana Simülasyon (7 Kolon) */}
          <div className="lg:col-span-7 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-neutral-100 to-white rounded-[2rem] transform rotate-1 scale-105 border border-neutral-200 shadow-xl" />
            
            <div className="relative bg-white rounded-[2rem] border border-neutral-200 shadow-2xl p-6 lg:p-8 flex flex-col space-y-6">
              
              {/* Üst Bilgi */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Canlı Akış Simülasyonu</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-mono font-bold text-neutral-400">Senaryo {scenario}/2 ({scenario === 1 ? "Telefon arama" : "Whatsapp/Sms"})</span>
                  <div className="flex space-x-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${scenario === 1 ? 'w-4 bg-neutral-900' : 'bg-neutral-300'}`} />
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${scenario === 2 ? 'w-4 bg-neutral-900' : 'bg-neutral-300'}`} />
                  </div>
                </div>
              </div>

              {/* ÇİFT SÜTUNLU YAPI (SOL: MÜŞTERİ | SAĞ: AÇIK RENKLİ HARİTA) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch relative">
                
                {/* SOL TARAF: MÜŞTERİ (MEHMET BEY) */}
                <div className="bg-neutral-50/80 border border-neutral-200/80 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
                  <div>
                    <div className="flex items-center space-x-2.5 mb-3">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">M</div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900">Mehmet Bey</h4>
                        <span className="text-[10px] text-neutral-500 flex items-center"><MapPin size={9} className="mr-0.5" /> Tarabya, İstanbul</span>
                      </div>
                    </div>
                    
                    {/* Harf Harf Yazılan Canlı Mesaj Kutusu */}
                    <div className="bg-white border p-3 rounded-xl shadow-xs min-h-[46px] flex items-center">
                      <p className="text-xs font-medium text-neutral-800 leading-relaxed font-mono">
                        {typedText}
                        {(phase === 'TYPING') && (
                          <span className="inline-block w-1.5 h-3 bg-neutral-900 ml-0.5 animate-pulse" />
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Seçenekler, Gönder Tuşu ve Aksiyonlar */}
                  <div className="space-y-3">
                    
                    {/* SEÇENEKLER VE GÖNDER TUŞU */}
                    <div className={`space-y-2 transition-all duration-700 transform ${
                      phase === 'MAP_SCANNING' || phase === 'FINAL_ACTION' 
                        ? 'opacity-0 scale-95 pointer-events-none h-0 overflow-hidden m-0' 
                        : 'opacity-100 scale-100'
                    }`}>
                      <span className="text-[9px] font-mono text-neutral-500 font-bold uppercase block">İletişim Tercihinizi Seçin:</span>
                      
                      {/* Telefon Arama Düğmesi */}
                      <div className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border text-[11px] font-bold shadow-xs transition-all duration-300 ${
                        scenario === 1 
                          ? ((phase === 'CLICK_OPTION' || phase === 'CLICK_SEND') 
                              ? 'bg-sky-500 text-white border-sky-500 scale-98 shadow-inner' 
                              : 'bg-transparent text-neutral-950 border-neutral-950 border-dashed') 
                          : 'bg-transparent text-neutral-700 border-neutral-400 border-dashed'
                      }`}>
                        <Phone size={12} />
                        <span>Telefon arama</span>
                      </div>

                      {/* Whatsapp/Sms Düğmesi */}
                      <div className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border text-[11px] font-bold shadow-xs transition-all duration-300 ${
                        scenario === 2 
                          ? ((phase === 'CLICK_OPTION' || phase === 'CLICK_SEND') 
                              ? 'bg-emerald-600 text-white border-emerald-600 scale-98 shadow-inner' 
                              : 'bg-transparent text-neutral-950 border-neutral-950 border-dashed') 
                          : 'bg-transparent text-neutral-700 border-neutral-400 border-dashed'
                      }`}>
                        <MessageCircle size={12} />
                        <span>Whatsapp/Sms</span>
                      </div>

                      {/* Gönder Tuşu */}
                      <div className="pt-1 flex justify-end">
                        <div className={`px-4 py-1.5 text-[10px] font-bold rounded-lg shadow-sm flex items-center space-x-1 transition-all ${
                          phase === 'CLICK_SEND' ? 'bg-emerald-700 text-white scale-95' : 'bg-neutral-950 text-white'
                        }`}>
                          <span>Gönder</span>
                          <Send size={10} />
                        </div>
                      </div>
                    </div>

                    {/* FİNAL AKSİYONLARI (MÜŞTERİ EKRANI) */}
                    {phase === 'FINAL_ACTION' && (
                      <div className="animate-in fade-in zoom-in duration-500">
                        {scenario === 1 && (
                          <div className="bg-gradient-to-b from-emerald-600 to-emerald-800 text-white p-4 rounded-2xl shadow-xl space-y-4 text-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />
                            <div className="relative z-10 flex flex-col items-center space-y-1">
                              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-1 animate-ping absolute top-3" />
                              <PhoneIncoming size={20} className="animate-bounce mb-1 text-emerald-200" />
                              <span className="text-[9px] uppercase tracking-widest font-mono text-emerald-200 font-bold">Gelen Telefon Araması</span>
                              <h5 className="text-sm font-extrabold tracking-tight mt-1">Ayşe Hanım (Tarabya Emlak)</h5>
                              <p className="text-[11px] text-emerald-100 font-mono">0532 555 44 33</p>
                            </div>
                            <div className="relative z-10 flex items-center justify-center space-x-8 pt-2">
                              <div className="flex flex-col items-center space-y-1">
                                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-md">
                                  <Phone size={14} className="rotate-[135deg]" />
                                </div>
                                <span className="text-[8px] opacity-80">Reddet</span>
                              </div>
                              <div className="flex flex-col items-center space-y-1">
                                <div className="w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center text-neutral-950 shadow-md animate-pulse">
                                  <Phone size={14} />
                                </div>
                                <span className="text-[8px] opacity-80 font-bold">Yanıtla</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {scenario === 2 && (
                          <div className="bg-white border border-neutral-300 p-3.5 rounded-2xl shadow-sm space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-neutral-900 font-bold">
                              <span className="flex items-center gap-1"><BellRing size={11} className="text-neutral-950" /> Whatsapp / SMS Mesajı</span>
                              <span className="text-neutral-400 font-normal">Şimdi</span>
                            </div>
                            <p className="font-medium text-[11px] text-neutral-800 leading-tight">"Merhaba Mehmet Bey, Bosch servisiyim. Size nasıl yardımcı olabilirim?"</p>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

                {/* SAĞ TARAF: AÇIK RENKLİ GERÇEKÇİ HARİTA (GOOGLE MAPS TARZI) VE 3 PİN SİSTEMİ */}
                <div className="bg-[#EAE6DF] border border-neutral-300 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden text-neutral-900">
                  
                  {/* Harita Sokak Yolları Izgarası (Açık Tema) */}
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]" />
                  <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-sky-100/50 via-transparent to-amber-100/40 pointer-events-none" />

                  {/* Üst Bilgi / Sağlayıcı Durumu */}
                  <div className="relative z-10 flex items-center justify-between border-b border-neutral-300 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
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
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono transition-all ${
                      phase === 'MAP_SCANNING' ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' : 
                      phase === 'FINAL_ACTION' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-neutral-200 text-neutral-600'
                    }`}>
                      {phase === 'MAP_SCANNING' ? 'Harita Taranıyor...' : phase === 'FINAL_ACTION' ? 'Eşleşti' : 'Bekliyor'}
                    </span>
                  </div>

                  {/* ORTADAKİ AÇIK RENKLİ HARİTA VE 3 PİN GÖRSELİ */}
                  <div className="relative z-10 flex-1 min-h-[140px] flex flex-col items-center justify-center py-2">
                    {phase === 'MAP_SCANNING' || phase === 'FINAL_ACTION' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center space-y-3">
                        <span className="text-[10px] font-mono text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1.5 bg-white/90 px-2.5 py-1 rounded-full border border-emerald-300 shadow-xs">
                          <Compass size={13} className="animate-spin text-emerald-600" /> Bölgedeki Alternatifler Analiz Ediliyor
                        </span>
                        
                        {/* Harita Üzerindeki 3 Pin Konumu */}
                        <div className="flex items-center justify-center space-x-8 relative my-2 w-full">
                          {/* Pin 1 */}
                          <div className={`flex flex-col items-center transition-all duration-500 ${phase === 'FINAL_ACTION' ? 'opacity-40 scale-90' : 'opacity-70'}`}>
                            <div className="w-6 h-6 rounded-full bg-white border border-neutral-400 flex items-center justify-center text-[10px] text-neutral-700 font-bold shadow-xs">1</div>
                            <span className="text-[9px] text-neutral-600 mt-1">Alternatif</span>
                          </div>

                          {/* Pin 2 (Aktif / Seçilen Uzman) */}
                          <div className="flex flex-col items-center transform scale-110">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-lg transition-all duration-700 ${
                              phase === 'FINAL_ACTION' 
                                ? 'bg-emerald-600 text-white ring-4 ring-emerald-600/30 scale-125' 
                                : 'bg-amber-500 text-white animate-bounce ring-2 ring-amber-500/50'
                            }`}>
                              <MapPin size={16} />
                            </div>
                            <span className="text-[10px] text-emerald-900 font-extrabold mt-1 bg-white px-2 py-0.5 rounded border border-emerald-300 shadow-xs">
                              {scenario === 1 ? "Ayşe H." : "Murat U."}
                            </span>
                          </div>

                          {/* Pin 3 */}
                          <div className={`flex flex-col items-center transition-all duration-500 ${phase === 'FINAL_ACTION' ? 'opacity-40 scale-90' : 'opacity-70'}`}>
                            <div className="w-6 h-6 rounded-full bg-white border border-neutral-400 flex items-center justify-center text-[10px] text-neutral-700 font-bold shadow-xs">3</div>
                            <span className="text-[9px] text-neutral-600 mt-1">Alternatif</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-neutral-600 text-xs font-mono bg-white/60 px-3 py-1.5 rounded-lg border border-neutral-300 shadow-xs">
                        Talep gönderildiğinde harita taranacak...
                      </div>
                    )}
                  </div>

                  {/* Sağlayıcı Alt Sonuç Paneli */}
                  <div className="relative z-10 pt-2 border-t border-neutral-300">
                    {phase !== 'FINAL_ACTION' ? (
                      <div className="text-center text-[11px] text-neutral-700 font-medium py-1">
                        {phase === 'MAP_SCANNING' ? 'En yakın uzman haritada işaretleniyor...' : 'Müşteri tercihi bekleniyor...'}
                      </div>
                    ) : (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        {scenario === 1 && (
                          <>
                            <div className="flex items-center justify-between text-[11px] border-b border-neutral-300 pb-1">
                              <span className="text-neutral-600 font-bold uppercase text-[9px]">Müşteri No</span>
                              <span className="font-extrabold text-neutral-950 font-mono">0532 123 45 67</span>
                            </div>
                            <div className="flex items-center justify-center space-x-1.5 text-emerald-800 bg-emerald-100 border border-emerald-300 p-2 rounded-xl text-[11px] font-bold shadow-xs">
                              <PhoneCall size={12} className="animate-bounce" />
                              <span>Telefon Araması Başlatıldı</span>
                            </div>
                          </>
                        )}

                        {scenario === 2 && (
                          <>
                            <div className="flex items-center justify-between text-[11px] border-b border-neutral-300 pb-1">
                              <span className="text-neutral-600 font-bold uppercase text-[9px]">İletişim Kanalı</span>
                              <div className="flex items-center space-x-1 text-emerald-800 font-bold">
                                <MessageCircle size={11} />
                                <span className="text-[10px]">Whatsapp/Sms</span>
                              </div>
                            </div>
                            <div className="bg-emerald-100 border border-emerald-300 p-2 rounded-xl text-[11px] font-medium text-emerald-950 flex items-start space-x-1.5 shadow-xs">
                              <Send size={12} className="text-emerald-700 shrink-0 mt-0.5" />
                              <p>"Merhaba Mehmet Bey, Bosch servisiyim. Size nasıl yardımcı olabilirim?"</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                </div>

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