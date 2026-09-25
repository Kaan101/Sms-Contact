import React from 'react';
import { ShieldCheck, MapPin, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export default function MainPage({ onGoToLogin }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      
      {/* DEKORATİF ARKA PLAN (CANLI, ÇİZGİSEL VE GEOMETRİK) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* İnce Çizgisel Topografik/Dalga deseni (SVG Base64 Data URI) */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100' fill='none' stroke='%23000' stroke-width='1'/%3E%3Cpath d='M0,150 C150,250 350,50 500,150 C650,250 850,50 1000,150' fill='none' stroke='%23000' stroke-width='1'/%3E%3Cpath d='M0,200 C150,300 350,100 500,200 C650,300 850,100 1000,200' fill='none' stroke='%23000' stroke-width='1'/%3E%3Cpath d='M0,250 C150,350 350,150 500,250 C650,350 850,150 1000,250' fill='none' stroke='%23000' stroke-width='1'/%3E%3Cpath d='M0,300 C150,400 350,200 500,300 C650,400 850,200 1000,300' fill='none' stroke='%23000' stroke-width='1'/%3E%3C/svg%3E\")", backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat' }}></div>
        
        {/* İnce Grid Sistemi */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        {/* Dinamik Geometrik Çizgiler (SVG) */}
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full border border-emerald-500/20 opacity-40"></div>
        <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] rounded-full border border-blue-500/20 opacity-30"></div>
        <div className="absolute bottom-[-15%] left-[-10%] w-[800px] h-[800px] rounded-full border border-blue-500/10 opacity-50"></div>
        
        {/* Hafif Renkli Glow Efektleri (Sadece köşe noktalarda, canlılık versin diye) */}
        <div className="absolute top-[0%] right-[0%] w-[40%] h-[40%] bg-emerald-400/10 blur-[140px] rounded-full"></div>
        <div className="absolute bottom-[0%] left-[0%] w-[40%] h-[40%] bg-blue-500/10 blur-[140px] rounded-full"></div>
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
            {/* Buton arkasında hafif vurgu */}
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