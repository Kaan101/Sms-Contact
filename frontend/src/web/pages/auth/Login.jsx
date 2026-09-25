import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Wrench, Shield, KeyRound, Map as MapIcon, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';

export default function Login() {
  const { setSession, API_BASE } = useAuth();
  
  // URL'yi okuyarak hangi niyetle gelindiğini belirliyoruz
  const getInitialState = () => {
    const hash = window.location.hash || '';
    const isProviderDirect = hash.includes('role=PROVIDER');
    const isCustomerDirect = hash.includes('role=CUSTOMER');
    
    let role = 'CUSTOMER';
    if (isProviderDirect) role = 'PROVIDER';
    else if (hash.includes('role=ADMIN')) role = 'ADMIN';
    else if (hash.includes('role=TRACKER')) role = 'TRACKER';

    return {
      role,
      isDirectAction: isProviderDirect || isCustomerDirect // Yalnızca bu iki butondan gelindiyse sekmeleri gizle
    };
  };

  const [selectedRole, setSelectedRole] = useState(getInitialState().role);
  const [isDirectAction, setIsDirectAction] = useState(getInitialState().isDirectAction);

  // Eğer tarayıcıda geri/ileri yapılırsa sayfayı canlı güncelle
  useEffect(() => {
    const handleHashChange = () => {
      const state = getInitialState();
      setSelectedRole(state.role);
      setIsDirectAction(state.isDirectAction);
    };
    
    window.addEventListener('popstate', handleHashChange);
    return () => window.removeEventListener('popstate', handleHashChange);
  }, []);

  const [authStep, setAuthStep] = useState('PHONE');
  const [inputPhone, setInputPhone] = useState(() => { try { return localStorage.getItem('sc_last_phone') || ''; } catch { return ''; }});
  const [inputOtp, setInputOtp] = useState('');
  const [simulatedCode, setSimulatedCode] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendOtp = async (e) => { 
    e.preventDefault(); if (!inputPhone.trim()) return; setAuthLoading(true); setErrorMessage(''); 
    try { 
      const res = await axios.post(`${API_BASE}/auth/send-otp`, { phone: inputPhone.trim() }); 
      setSimulatedCode(res.data?.simulatedOtp); 
      setAuthStep('OTP'); 
      localStorage.setItem('sc_last_phone', inputPhone.trim());
    } catch (err) { setErrorMessage(err.response?.data?.message || 'OTP gönderilemedi.'); } 
    finally { setAuthLoading(false); } 
  };
  
  const handleVerifyOtp = async (e) => { 
    e.preventDefault(); if (!inputOtp.trim()) return; setAuthLoading(true); setErrorMessage(''); 
    try { 
      await axios.post(`${API_BASE}/auth/verify-otp`, { phone: inputPhone.trim(), otpCode: inputOtp.trim() }); 
      const newSession = { role: selectedRole, phone: inputPhone.trim(), authenticatedAt: new Date().toISOString() }; 
      setSession(newSession); 
      localStorage.setItem('sc_session', JSON.stringify(newSession)); 
    } catch (err) { setErrorMessage(err.response?.data?.message || 'Doğrulama kodu hatalı.'); } 
    finally { setAuthLoading(false); } 
  };

  // Dinamik Başlık ve Açıklamalar
  let displayTitle = "Giriş Yapın";
  let displayDesc = "Lütfen sisteme hangi rolde bağlanmak istediğinizi seçin.";

  if (isDirectAction) {
    if (selectedRole === 'CUSTOMER') {
      displayTitle = "Talep Oluştur";
      displayDesc = "Hizmet talebi oluşturmak için telefon numaranızı doğrulayın.";
    } else if (selectedRole === 'PROVIDER') {
      displayTitle = "Hizmet Veren Ol";
      displayDesc = "Sistemde hizmet veren olarak yer almak için numaranızı doğrulayın.";
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-8 max-w-md mx-auto w-full space-y-6 mt-8">
      {errorMessage && (
        <div className="w-full p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium text-center">
          {errorMessage}
        </div>
      )}
      
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-neutral-950 text-white rounded-2xl mx-auto flex items-center justify-center shadow-sm font-mono text-lg font-bold"><KeyRound size={22} /></div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950">{displayTitle}</h2>
        <p className="text-xs text-neutral-500">{displayDesc}</p>
      </div>

      {/* SADECE "GİRİŞ YAP" BUTONUNDAN GELİNDİYSE (isDirectAction false ise) SEKME SEÇENEKLERİNİ GÖSTER */}
      {!isDirectAction && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-neutral-100 rounded-xl border border-neutral-200 text-xs font-semibold">
          <button type="button" onClick={() => { setSelectedRole('CUSTOMER'); setAuthStep('PHONE'); }} className={`py-2.5 rounded-lg transition flex flex-col items-center space-y-1 ${selectedRole === 'CUSTOMER' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}><User size={16} /><span>Müşteri</span></button>
          <button type="button" onClick={() => { setSelectedRole('PROVIDER'); setAuthStep('PHONE'); }} className={`py-2.5 rounded-lg transition flex flex-col items-center space-y-1 ${selectedRole === 'PROVIDER' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}><Wrench size={16} /><span>Sağlayıcı</span></button>
          <button type="button" onClick={() => { setSelectedRole('ADMIN'); setAuthStep('PHONE'); }} className={`py-2.5 rounded-lg transition flex flex-col items-center space-y-1 ${selectedRole === 'ADMIN' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}><Shield size={16} /><span>Admin</span></button>
          <button type="button" onClick={() => { setSelectedRole('TRACKER'); setAuthStep('PHONE'); }} className={`py-2.5 rounded-lg transition flex flex-col items-center space-y-1 ${selectedRole === 'TRACKER' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}><MapIcon size={16} /><span>Takip</span></button>
        </div>
      )}

      {authStep === 'PHONE' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1.5">{selectedRole === 'PROVIDER' ? 'İşletme / Sağlayıcı Telefonu' : 'Telefon Numaranız'}</label>
            <input type="tel" inputMode="tel" required value={inputPhone} onChange={(e) => setInputPhone(e.target.value)} placeholder="+90 5XX XXX XX XX" className="w-full p-3 text-sm font-mono rounded-xl border border-neutral-200 focus:border-neutral-950 outline-none" />
          </div>
          <button type="submit" disabled={authLoading || !inputPhone.trim()} className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-xl text-xs font-semibold tracking-wide transition shadow-sm flex items-center justify-center space-x-2">
            {authLoading ? <span>Kod Gönderiliyor...</span> : <><span>Doğrulama Kodu İste</span><ArrowRight size={14} /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          {simulatedCode && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-mono flex items-center justify-between">
              <span>Simüle SMS Kodu:</span><span className="font-bold text-lg tracking-widest text-neutral-950">{simulatedCode}</span>
            </div>
          )}
          <div>
            <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1.5">4 Haneli Kod (Çift tıkla yapıştır)</label>
            <input type="tel" inputMode="numeric" pattern="[0-9]*" required maxLength={4} value={inputOtp} onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))} onDoubleClick={() => { if(simulatedCode) setInputOtp(String(simulatedCode)); }} placeholder="1234" className="w-full p-3 text-center text-2xl tracking-[0.4em] font-mono font-bold rounded-xl border border-neutral-200 focus:border-neutral-950 outline-none cursor-pointer" title="Simüle edilen kodu yapıştırmak için çift tıklayın" />
          </div>
          <div className="flex items-center space-x-2">
            <button type="button" onClick={() => setAuthStep('PHONE')} className="w-1/3 py-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-xl cursor-pointer">Değiştir</button>
            <button type="submit" disabled={authLoading || inputOtp.length < 4} className="w-2/3 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white text-xs font-semibold rounded-xl transition cursor-pointer">{authLoading ? 'Doğrulanıyor...' : 'Giriş Yap'}</button>
          </div>
        </form>
      )}
    </div>
  );
}