import React, { Suspense, lazy, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from './core/context/AuthContext';
// IMPORT YOLUNU DÜZELTTİK:
import MainPage from './web/pages/home/MainPage'; 

// SADECE GEREKTİĞİNDE YÜKLENECEK BİLEŞENLER (LAZY LOADING)
const Login = lazy(() => import('./web/pages/auth/Login'));
const CustomerDashboard = lazy(() => import('./web/pages/customer/CustomerDashboard'));
const ProviderDashboard = lazy(() => import('./web/pages/provider/ProviderDashboard'));
const TrackerDashboard = lazy(() => import('./web/pages/tracker/TrackerDashboard'));
const AdminDashboard = lazy(() => import('./web/pages/admin/AdminDashboard'));

const FallbackLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#FBFBFC]">
     <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 bg-neutral-950 text-white rounded-2xl flex items-center justify-center font-mono font-bold animate-pulse">MB</div>
        <span className="text-xs font-mono text-neutral-500 font-semibold tracking-widest uppercase">Modül Yükleniyor...</span>
     </div>
  </div>
);

export default function App() {
  const { session, handleLogout } = useAuth();
  
  // ANA SAYFADAN GİRİŞ EKRANINA GEÇİŞ İÇİN KONTROL:
  const [showLogin, setShowLogin] = useState(false);

  const renderDashboard = () => {
    switch (session.role) {
      case 'CUSTOMER': return <CustomerDashboard />;
      case 'PROVIDER': return <ProviderDashboard />;
      case 'TRACKER': return <TrackerDashboard />;
      case 'ADMIN': return <AdminDashboard />;
      default: return <Login />;
    }
  };

  // Eğer oturum yoksa ve kullanıcı henüz Giriş Yap'a basmadıysa Ana Sayfayı göster
  if (!session && !showLogin) {
    return <MainPage onGoToLogin={() => setShowLogin(true)} />;
  }

  return (
    <div className={`min-h-screen bg-[#FBFBFC] text-neutral-900 flex flex-col font-sans ${session?.role === 'TRACKER' ? 'overflow-hidden' : ''}`}>
      
      <header className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-[500]">
        <div className={`${session?.role === 'ADMIN' || session?.role === 'TRACKER' ? 'w-full' : 'max-w-5xl'} mx-auto px-6 h-16 flex items-center justify-between transition-all duration-300`}>
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { if(session) handleLogout(); setShowLogin(false); }}>
            <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center text-white shadow-sm font-mono text-sm font-semibold tracking-tighter">MB</div>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-base tracking-tight text-neutral-950">Mobool</span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-medium hidden sm:inline">v19.0.0 (Modüler Çekirdek)</span>
            </div>
          </div>

          {session && (
            <div className="flex items-center space-x-3">
              <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase border ${
                session.role === 'CUSTOMER' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                session.role === 'PROVIDER' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                session.role === 'TRACKER' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                'bg-neutral-900 text-white border-neutral-900'
              }`}>
                {session.role === 'CUSTOMER' ? '👤 Müşteri' : session.role === 'PROVIDER' ? '🛠️ Sağlayıcı' : session.role === 'TRACKER' ? '🗺️ Takip' : '⚙️ Admin'}
              </span>
              <span className="text-xs font-mono text-neutral-600 hidden sm:inline">{session.phone}</span>
              <button onClick={() => { handleLogout(); setShowLogin(false); }} title="Çıkış Yap" className="p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition"><LogOut size={16} /></button>
            </div>
          )}
        </div>
      </header>

      <Suspense fallback={<FallbackLoader />}>
        {session ? renderDashboard() : <Login />}
      </Suspense>

    </div>
  );
}