import React, { useState, useEffect } from 'react';
import { 
  Phone, MessageSquare, ShieldCheck, Zap, User, 
  MapPin, CheckCircle2, ArrowRight, Search, Lock, 
  Clock, Star, MessageCircle, Send 
} from 'lucide-react';

export default function MainPage() {
  const [scenario, setScenario] = useState(1);
  const [step, setStep] = useState(0);

  // Animasyon Döngüsü
  useEffect(() => {
    let timer;
    if (step === 0) timer = setTimeout(() => setStep(1), 2500); // Müşteri talebi yazdıktan 2.5s sonra butonlar çıkar
    else if (step === 1) timer = setTimeout(() => setStep(2), 2000); // Seçim yapıldıktan 2s sonra sağlayıcıya düşer
    else if (step === 2) timer = setTimeout(() => setStep(3), 2500); // Sağlayıcı kabul ettikten 2.5s sonra sonuç görünür
    else if (step === 3) {
      timer = setTimeout(() => {
        setStep(0);
        setScenario(prev => prev === 1 ? 2 : 1); // Senaryoyu değiştir ve başa sar
      }, 5000); // 5 saniye sonucu göster, sonra diğer senaryoya geç
    }
    return () => clearTimeout(timer);
  }, [step]);

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
            <button className="px-4 py-2 text-sm font-bold text-neutral-700 hover:text-neutral-950 transition">Giriş Yap</button>
            <button className="px-5 py-2 text-sm font-bold text-white bg-neutral-950 hover:bg-neutral-800 rounded-xl transition shadow-sm">Kayıt Ol</button>
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
              Numaranızı paylaşmak zorunda değilsiniz. Talebinizi oluşturun, çevrenizdeki en iyi uzmanlar anında görsün. Telefon mu, yoksa SMS mi? Karar sizin.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button className="w-full sm:w-auto px-8 py-4 bg-neutral-950 hover:bg-neutral-800 text-white rounded-2xl font-bold text-sm transition shadow-lg shadow-neutral-900/20 flex items-center justify-center space-x-2">
                <span>Hemen Talep Oluştur</span>
                <ArrowRight size={16} />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-neutral-50 text-neutral-950 border border-neutral-200 rounded-2xl font-bold text-sm transition shadow-sm flex items-center justify-center space-x-2">
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
                  <span className="text-[11px] font-mono font-bold text-neutral-400">Senaryo {scenario}/2 ({scenario === 1 ? "Telefon" : "SMS"})</span>
                  <div className="flex space-x-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${scenario === 1 ? 'w-4 bg-neutral-900' : 'bg-neutral-300'}`} />
                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${scenario === 2 ? 'w-4 bg-neutral-900' : 'bg-neutral-300'}`} />
                  </div>
                </div>
              </div>

              {/* ÇİFT SÜTUNLU YAPI (SOL: MÜŞTERİ | SAĞ: SAĞLAYICI) */}
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
                    
                    <div className="bg-white border p-3 rounded-xl shadow-xs">
                      <p className="text-xs font-medium text-neutral-800 leading-relaxed">
                        {scenario === 1 
                          ? "Tarabya'da 3+1 kiralık" 
                          : "Bosch servis"}
                      </p>
                    </div>
                  </div>

                  {/* Tercih Butonları */}
                  <div className={`space-y-1.5 transition-all duration-500 ${step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                    <span className="text-[9px] font-mono text-neutral-400 font-bold uppercase block">Tercih Edilen İletişim:</span>
                    <div className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border text-[11px] font-bold shadow-xs transition-all ${scenario === 1 ? 'bg-blue-600 text-white border-blue-600 scale-102' : 'bg-white text-neutral-400 border-neutral-200 opacity-40'}`}>
                      <Phone size={12} />
                      <span>Telefon</span>
                    </div>
                    <div className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl border text-[11px] font-bold shadow-xs transition-all ${scenario === 2 ? 'bg-emerald-600 text-white border-emerald-600 scale-102' : 'bg-white text-neutral-400 border-neutral-200 opacity-40'}`}>
                      <MessageCircle size={12} />
                      <span>SMS</span>
                    </div>
                  </div>
                </div>

                {/* SAĞ TARAF: SAĞLAYICI (AYŞE HANIM / MURAT USTA) */}
                <div className={`bg-white border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm transition-all duration-700 ${step >= 2 ? 'opacity-100 border-emerald-500 ring-2 ring-emerald-500/10' : 'opacity-40 border-neutral-200 pointer-events-none'}`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {scenario === 1 ? "A" : "M"}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900">
                            {scenario === 1 ? "Ayşe Hanım" : "Murat Usta"}
                          </h4>
                          <span className="text-[10px] text-neutral-500">
                            {scenario === 1 ? "Tarabya Emlak Uzmanı" : "Bosch Yetkili Servis"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">
                        {step >= 2 ? "Eşleşti" : "Bekliyor"}
                      </span>
                    </div>

                    <div className="bg-neutral-50 border p-3 rounded-xl text-xs font-medium text-neutral-700">
                      {scenario === 1 ? "Talep: Tarabya'da 3+1 kiralık" : "Talep: Bosch servis"}
                    </div>
                  </div>

                  {/* Sonuç Alanı */}
                  <div>
                    {step < 3 ? (
                      <button className="w-full py-2.5 bg-neutral-950 text-white text-xs font-bold rounded-xl animate-pulse">
                        İşi Kabul Et
                      </button>
                    ) : (
                      <div className="space-y-2.5 animate-in fade-in zoom-in duration-300">
                        
                        {/* Senaryo 1 Sonucu (Telefon) */}
                        {scenario === 1 && (
                          <>
                            <div className="flex items-center justify-between text-[11px] border-b pb-1.5">
                              <span className="text-neutral-400 font-bold uppercase text-[9px]">Müşteri No</span>
                              <span className="font-extrabold text-neutral-950 font-mono">0532 123 45 67</span>
                            </div>
                            <div className="flex items-center justify-center space-x-1.5 text-emerald-700 bg-emerald-50 p-2 rounded-xl text-[11px] font-bold">
                              <Phone size={12} className="animate-bounce" />
                              <span>Telefon Araması Başlatıldı</span>
                            </div>
                          </>
                        )}

                        {/* Senaryo 2 Sonucu (SMS) */}
                        {scenario === 2 && (
                          <>
                            <div className="flex items-center justify-between text-[11px] border-b pb-1.5">
                              <span className="text-neutral-400 font-bold uppercase text-[9px]">İletişim Kanalı</span>
                              <div className="flex items-center space-x-1 text-emerald-600 font-bold">
                                <MessageCircle size={11} />
                                <span className="text-[10px]">SMS</span>
                              </div>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-[11px] font-medium text-emerald-950 shadow-xs flex items-start space-x-2">
                              <Send size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                              <p>"Merhaba Mehmet Bey, Bosch yetkili servisiyim. Size nasıl yardımcı olabilirim?"</p>
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
              <p className="text-sm text-neutral-600 leading-relaxed">İster telefonla aranarak hızlı çözüm bulun, isterseniz SMS ile mesajlaşarak fiyat tekliflerini toplayın.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}