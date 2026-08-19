import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowRight, 
  CornerDownLeft, 
  Phone, 
  PhoneCall,
  MessageSquare, 
  SlidersHorizontal, 
  Users, 
  CheckCircle2, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Sparkles, 
  HelpCircle, 
  Clock, 
  LogOut, 
  KeyRound, 
  History, 
  Building2, 
  SendHorizontal, 
  Check, 
  Ban, 
  ShieldCheck,
  SkipForward,
  Layers,
  Radio,
  User,
  Wrench,
  Shield,
  Save,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function App() {
  // --- 1. ROL VE AUTH STATE ---
  const [selectedRole, setSelectedRole] = useState('CUSTOMER');
  
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('sc_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authStep, setAuthStep] = useState('PHONE');
  const [inputPhone, setInputPhone] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [simulatedCode, setSimulatedCode] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // --- 2. MÜŞTERİ (CUSTOMER) STATE ---
  const [queryText, setQueryText] = useState('');
  const [disambiguationData, setDisambiguationData] = useState(null);
  const [selectedDisambiguation, setSelectedDisambiguation] = useState(null);
  const [preferredChannel, setPreferredChannel] = useState('PHONE');
  const [step, setStep] = useState('INPUT');
  const [loading, setLoading] = useState(false);
  const [myCustomerRequests, setMyCustomerRequests] = useState([]);
  const [showCandidatesMap, setShowCandidatesMap] = useState({});

  // --- 3. SAĞLAYICI (PROVIDER) STATE ---
  const [providerProfile, setProviderProfile] = useState(null);
  const [providerRequests, setProviderRequests] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [providerFormData, setProviderFormData] = useState({
    name: '',
    phone: '',
    email: '',
    serviceKeywords: '',
    communicationChannels: ['PHONE', 'SMS'],
    priorityScore: 100
  });

  // --- 4. ADMİN (ADMIN) STATE ---
  const [adminTab, setAdminTab] = useState('WOZ');
  const [matchedRequests, setMatchedRequests] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedProviderMap, setSelectedProviderMap] = useState({});
  const [adminLoading, setAdminLoading] = useState(false);

  // Admin Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState(null);
  const [modalFormData, setModalFormData] = useState({
    name: '',
    phone: '',
    email: '',
    serviceKeywords: '',
    communicationChannels: ['PHONE', 'SMS'],
    priorityScore: 100
  });

  // --- VERİ ÇEKME FONKSİYONLARI ---
  const fetchCustomerData = async () => {
    if (!session?.phone) return;
    try {
      const res = await axios.get(`${API_BASE}/requests/my-requests?phone=${encodeURIComponent(session.phone)}`);
      setMyCustomerRequests(res.data.requests || []);
    } catch (err) {
      console.error('Müşteri talepleri çekilemedi:', err);
    }
  };

  const fetchProviderData = async () => {
    if (!session?.phone) return;
    try {
      const pRes = await axios.get(`${API_BASE}/providers/by-phone?phone=${encodeURIComponent(session.phone)}`);
      const prov = pRes.data.provider;
      setProviderProfile(prov);
      setProviderFormData({
        name: prov.name,
        phone: prov.phone,
        email: prov.email || '',
        serviceKeywords: (prov.service_keywords || []).join(', '),
        communicationChannels: prov.communication_channels || ['PHONE'],
        priorityScore: prov.priority_score || 100
      });

      const rRes = await axios.get(`${API_BASE}/requests/provider-requests?providerId=${prov.id}&phone=${encodeURIComponent(session.phone)}`);
      setProviderRequests(rRes.data.requests || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setProviderProfile(null);
        try {
          const fallbackRes = await axios.get(`${API_BASE}/requests/provider-requests?phone=${encodeURIComponent(session.phone)}`);
          setProviderRequests(fallbackRes.data.requests || []);
        } catch {
          setProviderRequests([]);
        }
      }
    }
  };

  const fetchAdminData = async () => {
    setAdminLoading(true);
    try {
      const [reqRes, provRes, matchRes, logRes] = await Promise.all([
        axios.get(`${API_BASE}/requests/pending`),
        axios.get(`${API_BASE}/providers`),
        axios.get(`${API_BASE}/requests/matched`),
        axios.get(`${API_BASE}/notifications`)
      ]);
      setPendingRequests(reqRes.data.requests || []);
      setProviders(provRes.data.providers || []);
      setMatchedRequests(matchRes.data.requests || []);
      setSmsLogs(logRes.data.notifications || []);
    } catch (err) {
      console.error('Admin verileri çekilemedi:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      if (session.role === 'CUSTOMER') fetchCustomerData();
      if (session.role === 'PROVIDER') fetchProviderData();
      if (session.role === 'ADMIN') fetchAdminData();

      const interval = setInterval(() => {
        if (session.role === 'PROVIDER') fetchProviderData();
        if (session.role === 'CUSTOMER') fetchCustomerData();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [session]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!inputPhone.trim()) return;

    setAuthLoading(true);
    setErrorMessage('');
    try {
      const res = await axios.post(`${API_BASE}/auth/send-otp`, { phone: inputPhone.trim() });
      setSimulatedCode(res.data.simulatedOtp);
      setAuthStep('OTP');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'OTP gönderilemedi.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!inputOtp.trim()) return;

    setAuthLoading(true);
    setErrorMessage('');
    try {
      await axios.post(`${API_BASE}/auth/verify-otp`, {
        phone: inputPhone.trim(),
        otpCode: inputOtp.trim()
      });

      const newSession = {
        role: selectedRole,
        phone: inputPhone.trim(),
        authenticatedAt: new Date().toISOString()
      };

      setSession(newSession);
      localStorage.setItem('sc_session', JSON.stringify(newSession));
      setAuthStep('PHONE');
      setInputOtp('');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Doğrulama kodu hatalı.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sc_session');
    setSession(null);
    setProviderProfile(null);
    setIsProfileOpen(false);
    setMyCustomerRequests([]);
    setStep('INPUT');
  };

  const handleCustomerInitialSubmit = async (e) => {
    e?.preventDefault();
    if (!queryText.trim()) return;
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post(`${API_BASE}/disambiguate`, { queryText: queryText.trim() });
      if (response.data.status === 'ambiguous') {
        setDisambiguationData(response.data);
        setStep('DISAMBIGUATE');
      } else {
        setDisambiguationData(null);
        setSelectedDisambiguation(null);
        setStep('CONFIRM');
      }
    } catch {
      setStep('CONFIRM');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerFinalSubmit = async (e) => {
    e?.preventDefault();
    if (!session?.phone) return;
    setLoading(true);

    try {
      await axios.post(`${API_BASE}/requests`, {
        rawText: queryText,
        disambiguationChoice: selectedDisambiguation,
        contactValue: session.phone,
        preferredChannel: preferredChannel
      });
      setQueryText('');
      setSelectedDisambiguation(null);
      setStep('INPUT');
      await fetchCustomerData();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Talep oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerNextProvider = async (requestId) => {
    try {
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/next-provider`);
      await fetchCustomerData();
      if (session.role === 'PROVIDER') await fetchProviderData();
    } catch (err) {
      alert('İşlem başarısız: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCustomerSelectCandidate = async (requestId, providerId) => {
    try {
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/select-candidate`, {
        providerId: Number(providerId)
      });
      setShowCandidatesMap(prev => ({ ...prev, [requestId]: false }));
      await fetchCustomerData();
      if (session.role === 'PROVIDER') await fetchProviderData();
    } catch (err) {
      alert('Seçim başarısız: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/status`, { newStatus });
      if (session.role === 'CUSTOMER') await fetchCustomerData();
      if (session.role === 'PROVIDER') await fetchProviderData();
      if (session.role === 'ADMIN') await fetchAdminData();
    } catch (err) {
      alert('Durum güncellenemedi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Bu talebi kalıcı olarak silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API_BASE}/requests/${Number(requestId)}`);
      if (session.role === 'CUSTOMER') await fetchCustomerData();
      if (session.role === 'PROVIDER') await fetchProviderData();
      if (session.role === 'ADMIN') await fetchAdminData();
    } catch {
      alert('Silme başarısız.');
    }
  };

  const handleSaveProviderProfile = async (e) => {
    e.preventDefault();
    const keywordsArray = providerFormData.serviceKeywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      name: providerFormData.name.trim(),
      phone: session.phone,
      email: providerFormData.email ? providerFormData.email.trim() : null,
      serviceKeywords: keywordsArray,
      communicationChannels: providerFormData.communicationChannels,
      priorityScore: parseInt(providerFormData.priorityScore, 10) || 100
    };

    try {
      if (providerProfile) {
        await axios.put(`${API_BASE}/providers/${providerProfile.id}`, payload);
      } else {
        await axios.post(`${API_BASE}/providers`, payload);
      }
      setIsProfileOpen(false);
      await fetchProviderData();
    } catch (err) {
      alert('Kaydedilemedi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleAdminAssign = async (requestId) => {
    const pId = selectedProviderMap[requestId];
    if (!pId) return alert('Lütfen sağlayıcı seçin.');
    try {
      await axios.post(`${API_BASE}/requests/assign`, {
        requestId: parseInt(requestId, 10),
        providerId: parseInt(pId, 10)
      });
      await fetchAdminData();
    } catch {
      alert('Atama başarısız.');
    }
  };

  const handleAdminSaveProvider = async (e) => {
    e.preventDefault();
    const keywordsArray = modalFormData.serviceKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const payload = {
      name: modalFormData.name.trim(),
      phone: modalFormData.phone.trim(),
      email: modalFormData.email ? modalFormData.email.trim() : null,
      serviceKeywords: keywordsArray,
      communicationChannels: modalFormData.communicationChannels,
      priorityScore: parseInt(modalFormData.priorityScore, 10) || 100
    };

    try {
      if (editingProviderId) {
        await axios.put(`${API_BASE}/providers/${editingProviderId}`, payload);
      } else {
        await axios.post(`${API_BASE}/providers`, payload);
      }
      setIsModalOpen(false);
      await fetchAdminData();
    } catch {
      alert('Kayıt başarısız.');
    }
  };

  const handleAdminDeleteProvider = async (id) => {
    if (!window.confirm('Sağlayıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API_BASE}/providers/${id}`);
      await fetchAdminData();
    } catch {
      alert('Silinemedi.');
    }
  };

  const activeRequests = myCustomerRequests.filter(r => {
    const s = (r.status || '').toUpperCase();
    return s === 'MATCHED' || s === 'ACCEPTED' || s === 'MANUAL_INTERVENTION' || s === 'PENDING';
  });

  const pastRequests = myCustomerRequests.filter(r => {
    const s = (r.status || '').toUpperCase();
    return s === 'COMPLETED' || s === 'CANCELLED';
  });

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-neutral-900 flex flex-col justify-between font-sans selection:bg-neutral-900 selection:text-white">
      
      {/* 🧭 NAVIGATION */}
      <header className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setStep('INPUT')}>
            <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center text-white shadow-sm font-mono text-sm font-semibold tracking-tighter">
              SC
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-base tracking-tight text-neutral-950">Sms-Contact</span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-medium">Protocol 3.3</span>
            </div>
          </div>

          {session && (
            <div className="flex items-center space-x-3">
              <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase border ${
                session.role === 'CUSTOMER' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                session.role === 'PROVIDER' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                'bg-neutral-900 text-white border-neutral-900'
              }`}>
                {session.role === 'CUSTOMER' ? '👤 Müşteri' : session.role === 'PROVIDER' ? '🛠️ Sağlayıcı' : '⚙️ Admin'}
              </span>
              <span className="text-xs font-mono text-neutral-600 hidden sm:inline">{session.phone}</span>
              <button
                onClick={handleLogout}
                title="Çıkış Yap"
                className="p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 🏛️ MAIN CONTENT */}
      <main className="max-w-6xl w-full mx-auto px-6 py-10 flex-1 flex flex-col justify-start">
        
        {errorMessage && (
          <div className="max-w-2xl mx-auto w-full mb-6 p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl text-rose-800 text-xs font-medium flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-700 ml-4"><X size={14} /></button>
          </div>
        )}

        {/* ---------------- 🚪 1. GİRİŞ EKRANI ---------------- */}
        {!session ? (
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-8 max-w-lg mx-auto w-full space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-neutral-950 text-white rounded-2xl mx-auto flex items-center justify-center shadow-sm font-mono text-lg font-bold">
                <KeyRound size={22} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-neutral-950">Giriş Yapın</h2>
              <p className="text-xs text-neutral-500">Lütfen sisteme hangi rolde bağlanmak istediğinizi seçin.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100 rounded-xl border border-neutral-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setSelectedRole('CUSTOMER'); setAuthStep('PHONE'); }}
                className={`py-2.5 rounded-lg transition flex flex-col items-center space-y-1 ${
                  selectedRole === 'CUSTOMER' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <User size={16} />
                <span>Talep Eden</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedRole('PROVIDER'); setAuthStep('PHONE'); }}
                className={`py-2.5 rounded-lg transition flex flex-col items-center space-y-1 ${
                  selectedRole === 'PROVIDER' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Wrench size={16} />
                <span>Servis Veren</span>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedRole('ADMIN'); setAuthStep('PHONE'); }}
                className={`py-2.5 rounded-lg transition flex flex-col items-center space-y-1 ${
                  selectedRole === 'ADMIN' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Shield size={16} />
                <span>Yönetici</span>
              </button>
            </div>

            {authStep === 'PHONE' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1.5">
                    {selectedRole === 'PROVIDER' ? 'İşletme / Sağlayıcı Telefonu' : 'Telefon Numaranız'}
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    required
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    placeholder="+90 5XX XXX XX XX"
                    className="w-full p-3.5 text-sm font-mono rounded-xl border border-neutral-200 focus:border-neutral-950 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading || !inputPhone.trim()}
                  className="w-full py-3.5 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-xl text-xs font-semibold tracking-wide transition shadow-sm flex items-center justify-center space-x-2"
                >
                  {authLoading ? <span>Kod Gönderiliyor...</span> : <><span>Doğrulama Kodu İste</span><ArrowRight size={14} /></>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {simulatedCode && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-mono flex items-center justify-between">
                    <span>Simüle SMS Kodu:</span>
                    <span className="font-bold text-lg tracking-widest text-neutral-950">{simulatedCode}</span>
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1.5">
                    4 Haneli Doğrulama Kodu
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    maxLength={4}
                    value={inputOtp}
                    onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="w-full p-3.5 text-center text-2xl tracking-[0.4em] font-mono font-bold rounded-xl border border-neutral-200 focus:border-neutral-950 outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setAuthStep('PHONE')}
                    className="w-1/3 py-3 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-xl"
                  >
                    Değiştir
                  </button>
                  <button
                    type="submit"
                    disabled={authLoading || inputOtp.length < 4}
                    className="w-2/3 py-3 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white text-xs font-semibold rounded-xl transition"
                  >
                    {authLoading ? 'Doğrulanıyor...' : 'Giriş Yap'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (

          /* ---------------- 👤 2. SERVİS TALEP EDEN (MÜŞTERİ EKRANI) ---------------- */
          session.role === 'CUSTOMER' ? (
            <div className="max-w-3xl mx-auto w-full space-y-8">
              
              {/* AKTİF TALEPLER */}
              {activeRequests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-neutral-500 flex items-center space-x-1.5">
                    <Radio size={14} className="text-emerald-500 animate-pulse" />
                    <span>Aktif Talepleriniz ({activeRequests.length})</span>
                  </h3>

                  <div className="space-y-4">
                    {activeRequests.map((req) => (
                      <div key={req.id} className="bg-white rounded-2xl border-2 border-neutral-900/10 p-5 shadow-sm space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-mono text-neutral-400">#REQ-{req.id}</span>
                            <h4 className="text-base font-bold text-neutral-950 leading-snug">"{req.raw_text}"</h4>
                            {req.disambiguation_choice && (
                              <span className="inline-block px-2 py-0.5 bg-neutral-100 text-neutral-700 text-xs rounded font-medium mt-1">
                                Hedef: {req.disambiguation_choice}
                              </span>
                            )}
                          </div>
                          <div>
                            {req.status === 'MATCHED' && <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">Onay Bekliyor</span>}
                            {req.status === 'ACCEPTED' && <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">Kabul Edildi</span>}
                            {req.status === 'MANUAL_INTERVENTION' && <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200">Havuzda</span>}
                          </div>
                        </div>

                        {req.provider_name ? (
                          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div className="flex items-center space-x-2">
                                <Building2 size={15} className="text-neutral-700" />
                                <span className="font-bold text-neutral-950">{req.provider_name}</span>
                                <span className="font-mono text-neutral-500">({req.provider_phone})</span>
                              </div>
                              <span className="text-[11px] font-mono text-neutral-400">Kanal: <strong>{req.preferred_channel}</strong></span>
                            </div>

                            {req.status === 'ACCEPTED' && (
                              <div className="mt-2 p-2.5 bg-emerald-100/60 border border-emerald-200 rounded-lg text-xs text-emerald-950 flex items-center space-x-2">
                                <PhoneCall size={14} className="text-emerald-700 animate-bounce" />
                                <span>Sağlayıcı talebi kabul etti. İletişime geçiliyor.</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900">Operatör koordinasyonu devraldı.</div>
                        )}

                        {/* İlk 3 Aday Paneli */}
                        {showCandidatesMap[req.id] && req.topCandidates && req.topCandidates.length > 0 && (
                          <div className="p-4 bg-white rounded-xl border border-neutral-200 space-y-3 shadow-inner">
                            <p className="text-xs font-bold text-neutral-700 font-mono">En Uygun Eşleşen 3 Sağlayıcı:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {req.topCandidates.map((cand, idx) => (
                                <div key={cand.id} className="p-3 rounded-lg border text-xs flex flex-col justify-between space-y-2 bg-neutral-50">
                                  <div>
                                    <p className="font-bold">#{idx + 1} {cand.name}</p>
                                    <p className="text-[10px] font-mono text-neutral-400">Skor: {cand.priority_score}</p>
                                  </div>
                                  {cand.id !== req.matched_provider_id && (
                                    <button
                                      onClick={() => handleCustomerSelectCandidate(req.id, cand.id)}
                                      className="w-full py-1 bg-neutral-950 hover:bg-neutral-800 text-white rounded text-[11px] font-semibold transition"
                                    >
                                      Buna Yönlendir
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Aksiyon Butonları */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 text-xs">
                          <div className="flex items-center space-x-2">
                            {req.status === 'MATCHED' && (
                              <button
                                onClick={() => handleCustomerNextProvider(req.id)}
                                className="px-3 py-1.5 border hover:bg-neutral-100 rounded-lg font-semibold flex items-center space-x-1.5 transition"
                              >
                                <SkipForward size={13} />
                                <span>Sonraki Sağlayıcıya Geç</span>
                              </button>
                            )}
                            {req.topCandidates && req.topCandidates.length > 1 && (
                              <button
                                onClick={() => setShowCandidatesMap(prev => ({ ...prev, [req.id]: !prev[req.id] }))}
                                className="px-3 py-1.5 border hover:bg-neutral-100 rounded-lg font-semibold flex items-center space-x-1.5 transition"
                              >
                                <Layers size={13} />
                                <span>{showCandidatesMap[req.id] ? 'Adayları Gizle' : 'Alternatifleri Gör (3 Aday)'}</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 ml-auto">
                            <button
                              onClick={() => handleStatusChange(req.id, 'COMPLETED')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center space-x-1 transition shadow-sm"
                            >
                              <ShieldCheck size={14} />
                              <span>Hizmeti Tamamla</span>
                            </button>
                            <button
                              onClick={() => handleStatusChange(req.id, 'CANCELLED')}
                              className="px-2.5 py-1.5 border hover:bg-neutral-100 text-neutral-600 rounded-lg transition"
                              title="İptal Et"
                            >
                              <Ban size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(req.id)}
                              className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg transition"
                              title="Sil"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Yeni Talep Girişi */}
              {step === 'INPUT' && (
                <div className="space-y-4 pt-2">
                  <div className="text-center space-y-1.5">
                    <h2 className="text-2xl font-extrabold tracking-tight text-neutral-950">Yeni Bir Hizmet İsteyin</h2>
                    <p className="text-xs text-neutral-500">Doğal dil ile talebinizi yazın; en uygun sağlayıcıyla eşleştirelim.</p>
                  </div>

                  <form onSubmit={handleCustomerInitialSubmit} className="space-y-4">
                    <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-3 focus-within:ring-2 focus-within:ring-neutral-950">
                      <textarea
                        rows={3}
                        value={queryText}
                        onChange={(e) => setQueryText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCustomerInitialSubmit(); } }}
                        placeholder="Örn: Kadıköy'de erikli damacana su siparişi veya Moda'da bisiklet tamiri..."
                        className="w-full p-3 text-sm text-neutral-900 placeholder:text-neutral-400 bg-transparent border-none outline-none resize-none"
                        required
                      />
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100 px-2 text-xs text-neutral-400">
                        <span className="font-mono text-[11px]">Enter ile gönderin</span>
                        <button
                          type="submit"
                          disabled={loading || !queryText.trim()}
                          className="ml-auto px-4 py-2 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"
                        >
                          {loading ? 'Çözümleniyor...' : <><span>Eşleştir</span><ArrowRight size={13} /></>}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {step === 'DISAMBIGUATE' && disambiguationData && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-8 space-y-6">
                  <h3 className="font-semibold text-base text-neutral-950">Hizmet Amacını Netleştirelim</h3>
                  <div className="space-y-2.5">
                    {disambiguationData.options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => { setSelectedDisambiguation(option.text); setStep('CONFIRM'); }}
                        className="w-full text-left p-4 rounded-xl border hover:border-neutral-950 transition flex items-center justify-between"
                      >
                        <span className="text-sm font-medium">{option.text}</span>
                        <ArrowRight size={15} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 'CONFIRM' && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-8 space-y-6">
                  <h2 className="text-xl font-bold">İletişim Kanalı Tercihiniz</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPreferredChannel('PHONE')}
                      className={`p-3.5 rounded-xl border text-left ${preferredChannel === 'PHONE' ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white'}`}
                    >
                      <Phone size={16} />
                      <span className="text-xs font-semibold block mt-1">Telefon Araması</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredChannel('SMS')}
                      className={`p-3.5 rounded-xl border text-left ${preferredChannel === 'SMS' ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white'}`}
                    >
                      <MessageSquare size={16} />
                      <span className="text-xs font-semibold block mt-1">SMS / WhatsApp</span>
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => setStep('INPUT')} className="w-1/3 py-3 border rounded-xl text-xs font-semibold">Geri</button>
                    <button onClick={handleCustomerFinalSubmit} disabled={loading} className="w-2/3 py-3 bg-neutral-950 text-white rounded-xl text-xs font-semibold">
                      {loading ? 'Başlatılıyor...' : 'Talebi Başlat'}
                    </button>
                  </div>
                </div>
              )}

              {/* Geçmiş Talepler */}
              {pastRequests.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 space-y-3">
                  <h3 className="text-xs font-mono uppercase font-bold text-neutral-500 flex items-center space-x-1.5">
                    <History size={14} />
                    <span>Geçmiş Talepler ({pastRequests.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {pastRequests.map((req) => (
                      <div key={req.id} className="p-3 bg-neutral-50 rounded-xl border flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-neutral-800">"{req.raw_text}"</p>
                          <p className="text-[11px] text-neutral-400 font-mono">Sağlayıcı: {req.provider_name || 'Bilinmiyor'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-200 text-neutral-800">{req.status}</span>
                          <button onClick={() => handleDeleteRequest(req.id)} className="p-1 text-neutral-400 hover:text-rose-600"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) :

          /* ---------------- 🛠️ 3. SERVİS SAĞLAYICI (PROVIDER EKRANI) ---------------- */
          session.role === 'PROVIDER' ? (
            <div className="max-w-4xl mx-auto w-full space-y-6">
              
              {/* Profil Akordeonu */}
              <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm overflow-hidden transition">
                <div 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-50/60 select-none"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-800">
                      <Wrench size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-neutral-950">
                        {providerProfile ? providerProfile.name : 'Sağlayıcı Profilinizi Oluşturun'}
                      </h2>
                      <p className="text-xs text-neutral-500 font-mono">
                        {session.phone} {providerProfile ? `• Skor: ${providerProfile.priority_score}` : '• Profil Tanımlanmamış'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-neutral-500">
                      {isProfileOpen ? 'Profili Gizle' : 'Profili Düzenle'}
                    </span>
                    {isProfileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {isProfileOpen && (
                  <form onSubmit={handleSaveProviderProfile} className="p-6 pt-2 border-t border-neutral-100 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">İşletme Adı *</label>
                        <input
                          type="text"
                          required
                          value={providerFormData.name}
                          onChange={(e) => setProviderFormData({ ...providerFormData, name: e.target.value })}
                          placeholder="Örn: Erikli Su Kadıköy Bayi"
                          className="w-full p-2.5 text-xs rounded-lg border outline-none focus:border-neutral-950"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">E-posta</label>
                        <input
                          type="email"
                          value={providerFormData.email}
                          onChange={(e) => setProviderFormData({ ...providerFormData, email: e.target.value })}
                          placeholder="info@isletme.com"
                          className="w-full p-2.5 text-xs rounded-lg border outline-none focus:border-neutral-950"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">
                        Hizmet Anahtar Kelimeleri (Virgülle Ayırın) *
                      </label>
                      <input
                        type="text"
                        required
                        value={providerFormData.serviceKeywords}
                        onChange={(e) => setProviderFormData({ ...providerFormData, serviceKeywords: e.target.value })}
                        placeholder="su, damacana, erikli, kadıköy, moda"
                        className="w-full p-2.5 text-xs font-mono rounded-lg border outline-none focus:border-neutral-950"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-3 text-xs font-mono">
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={providerFormData.communicationChannels.includes('PHONE')}
                            onChange={(e) => {
                              const newCh = e.target.checked
                                ? [...providerFormData.communicationChannels, 'PHONE']
                                : providerFormData.communicationChannels.filter(c => c !== 'PHONE');
                              setProviderFormData({ ...providerFormData, communicationChannels: newCh });
                            }}
                          />
                          <span>PHONE</span>
                        </label>
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={providerFormData.communicationChannels.includes('SMS')}
                            onChange={(e) => {
                              const newCh = e.target.checked
                                ? [...providerFormData.communicationChannels, 'SMS']
                                : providerFormData.communicationChannels.filter(c => c !== 'SMS');
                              setProviderFormData({ ...providerFormData, communicationChannels: newCh });
                            }}
                          />
                          <span>SMS</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                      >
                        <Save size={13} />
                        <span>Profili Kaydet</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Gelen Canlı Talepler */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold tracking-tight text-neutral-950 flex items-center space-x-2">
                    <Radio size={16} className="text-emerald-500 animate-pulse" />
                    <span>Gelen İş Talepleri ({providerRequests.length})</span>
                  </h3>
                  <span className="text-[11px] font-mono text-neutral-400">Canlı Dinleniyor (2sn)</span>
                </div>

                {providerRequests.length === 0 ? (
                  <div className="bg-white rounded-2xl border p-12 text-center text-xs text-neutral-400">
                    Henüz anahtar kelimelerinizle eşleşen yeni bir talep bulunmuyor. Yeni talep yönlendirildiğinde ekran otomatik olarak güncellenecektir.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providerRequests.map((req) => (
                      <div key={req.id} className="bg-white p-5 rounded-xl border shadow-sm flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              req.status === 'MATCHED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              req.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-neutral-100 text-neutral-800'
                            }`}>
                              {req.status === 'MATCHED' ? 'YENİ TALEP / ONAY BEKLİYOR' : req.status}
                            </span>
                            <span className="text-[11px] font-mono text-neutral-400">#REQ-{req.id}</span>
                          </div>
                          <p className="text-sm font-semibold text-neutral-900">"{req.raw_text}"</p>
                          <p className="text-xs font-mono text-neutral-500">Müşteri Tel: <strong className="text-neutral-800">{req.contact_value}</strong> [{req.preferred_channel}]</p>
                        </div>

                        <div className="pt-3 border-t flex items-center justify-end space-x-2">
                          {req.status === 'MATCHED' && (
                            <>
                              <button
                                onClick={() => handleCustomerNextProvider(req.id)}
                                className="px-3 py-1.5 border hover:bg-neutral-100 text-neutral-700 rounded-lg text-xs font-semibold"
                              >
                                Pas Geç (Sıradakine Aktar)
                              </button>
                              <button
                                onClick={() => handleStatusChange(req.id, 'ACCEPTED')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-sm"
                              >
                                <Check size={13} />
                                <span>Talebi Kabul Et & SMS Gönder</span>
                              </button>
                            </>
                          )}
                          {req.status === 'ACCEPTED' && (
                            <button
                              onClick={() => handleStatusChange(req.id, 'COMPLETED')}
                              className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                            >
                              <ShieldCheck size={13} />
                              <span>İşi Tamamlandı Olarak İşaretle</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) :

          /* ---------------- ⚙️ 4. ADMİN EKRANI ---------------- */
          (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-neutral-950">Sistem Yönetim Paneli</h2>
                  <p className="text-xs text-neutral-500">Tüm sağlayıcılar, eşleşmeler, WoZ havuzu ve SMS logları.</p>
                </div>

                <div className="flex items-center space-x-1 bg-neutral-100 p-1 rounded-lg border text-xs font-semibold">
                  <button onClick={() => setAdminTab('WOZ')} className={`px-3 py-1.5 rounded-md ${adminTab === 'WOZ' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>
                    WoZ Havuzu ({pendingRequests.length})
                  </button>
                  <button onClick={() => setAdminTab('PROVIDERS')} className={`px-3 py-1.5 rounded-md ${adminTab === 'PROVIDERS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>
                    Sağlayıcılar ({providers.length})
                  </button>
                  <button onClick={() => setAdminTab('ALL_MATCHED')} className={`px-3 py-1.5 rounded-md ${adminTab === 'ALL_MATCHED' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>
                    Tüm Eşleşmeler ({matchedRequests.length})
                  </button>
                  <button onClick={() => setAdminTab('SMS_LOGS')} className={`px-3 py-1.5 rounded-md ${adminTab === 'SMS_LOGS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>
                    SMS Logları ({smsLogs.length})
                  </button>
                </div>
              </div>

              {/* 4.1 WoZ Havuzu */}
              {adminTab === 'WOZ' && (
                <div className="space-y-3">
                  {pendingRequests.length === 0 ? (
                    <div className="bg-white rounded-2xl border p-12 text-center text-xs text-neutral-400">Bekleyen talep yok.</div>
                  ) : (
                    pendingRequests.map((req) => (
                      <div key={req.id} className="bg-white p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">{req.status}</span>
                          <p className="text-sm font-semibold">"{req.raw_text}"</p>
                          <p className="text-xs text-neutral-500 font-mono">İletişim: {req.contact_value}</p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <select
                            value={selectedProviderMap[req.id] || ""}
                            onChange={(e) => setSelectedProviderMap({ ...selectedProviderMap, [req.id]: e.target.value })}
                            className="text-xs p-2.5 border rounded-lg bg-neutral-50 font-medium"
                          >
                            <option value="" disabled>Sağlayıcı Seç</option>
                            {providers.map((p) => (
                              <option key={p.id} value={String(p.id)}>{p.name} (Skor: {p.priority_score})</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAdminAssign(req.id)}
                            disabled={!selectedProviderMap[req.id]}
                            className="px-3.5 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-lg text-xs font-semibold"
                          >
                            Ata
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 4.2 Sağlayıcılar CRUD */}
              {adminTab === 'PROVIDERS' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <button
                      onClick={() => { setEditingProviderId(null); setModalFormData({ name: '', phone: '', email: '', serviceKeywords: '', communicationChannels: ['PHONE', 'SMS'], priorityScore: 100 }); setIsModalOpen(true); }}
                      className="px-3 py-1.5 bg-neutral-950 text-white text-xs font-semibold rounded-lg flex items-center space-x-1"
                    >
                      <Plus size={14} />
                      <span>Yeni Sağlayıcı</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providers.map((prov) => (
                      <div key={prov.id} className="bg-white p-5 rounded-xl border flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-start justify-between">
                            <h3 className="font-bold text-sm">{prov.name}</h3>
                            <span className="text-[11px] font-mono bg-neutral-100 px-2 py-0.5 rounded">Skor: {prov.priority_score}</span>
                          </div>
                          <p className="text-xs text-neutral-400 font-mono mt-0.5">{prov.phone}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(prov.service_keywords || []).map((kw, i) => (
                              <span key={i} className="text-[11px] font-mono px-2 py-0.5 bg-neutral-100 rounded">{kw}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end space-x-1 pt-2 border-t">
                          <button
                            onClick={() => {
                              setEditingProviderId(prov.id);
                              setModalFormData({
                                name: prov.name,
                                phone: prov.phone,
                                email: prov.email || '',
                                serviceKeywords: (prov.service_keywords || []).join(', '),
                                communicationChannels: prov.communication_channels || ['PHONE'],
                                priorityScore: prov.priority_score || 100
                              });
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-neutral-100 rounded"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button onClick={() => handleAdminDeleteProvider(prov.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4.3 Tüm Eşleşmeler */}
              {adminTab === 'ALL_MATCHED' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchedRequests.map((req) => (
                    <div key={req.id} className="bg-white p-4 rounded-xl border space-y-2 text-xs">
                      <div className="flex justify-between font-mono">
                        <span className="font-bold text-neutral-900">{req.status}</span>
                        <span className="text-neutral-400">#REQ-{req.id}</span>
                      </div>
                      <p className="font-semibold text-neutral-800">"{req.raw_text}"</p>
                      <p className="text-neutral-500 font-mono">Müşteri: {req.contact_value} • Sağlayıcı: {req.provider_name}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 4.4 SMS Logları */}
              {adminTab === 'SMS_LOGS' && (
                <div className="space-y-3">
                  {smsLogs.map((log) => (
                    <div key={log.id} className="bg-white p-4 rounded-xl border space-y-1.5">
                      <div className="flex items-center space-x-2 text-[10px] font-mono">
                        <span className="font-bold px-2 py-0.5 rounded bg-neutral-100">{log.recipient_type}</span>
                        <span>{log.recipient_phone}</span>
                      </div>
                      <p className="text-xs font-mono bg-neutral-50 p-2.5 rounded border leading-relaxed">{log.message_body}</p>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )
        )}

        {/* ADMIN MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 border space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <h3 className="font-bold text-base">{editingProviderId ? 'Sağlayıcı Düzenle' : 'Yeni Sağlayıcı'}</h3>
                <button onClick={() => setIsModalOpen(false)}><X size={16} /></button>
              </div>

              <form onSubmit={handleAdminSaveProvider} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">Firma Adı *</label>
                  <input type="text" required value={modalFormData.name} onChange={(e) => setModalFormData({ ...modalFormData, name: e.target.value })} className="w-full p-2.5 text-xs rounded-lg border outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">Telefon *</label>
                  <input type="tel" required value={modalFormData.phone} onChange={(e) => setModalFormData({ ...modalFormData, phone: e.target.value })} className="w-full p-2.5 text-xs font-mono rounded-lg border outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">Anahtar Kelimeler *</label>
                  <input type="text" required value={modalFormData.serviceKeywords} onChange={(e) => setModalFormData({ ...modalFormData, serviceKeywords: e.target.value })} placeholder="su, damacana" className="w-full p-2.5 text-xs font-mono rounded-lg border outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">Öncelik Skoru</label>
                  <input type="number" value={modalFormData.priorityScore} onChange={(e) => setModalFormData({ ...modalFormData, priorityScore: e.target.value })} className="w-full p-2.5 text-xs font-mono rounded-lg border outline-none" />
                </div>
                <div className="flex justify-end space-x-2 pt-3 border-t">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-3.5 py-1.5 border rounded-lg text-xs font-semibold">Vazgeç</button>
                  <button type="submit" className="px-3.5 py-1.5 bg-neutral-950 text-white rounded-lg text-xs font-semibold">Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* 🇨🇭 FOOTER */}
      <footer className="border-t border-neutral-200/80 bg-white py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400 font-mono">
          <div><span>Sms-Contact</span> • <span>Multi-Tenant & Asenkron Servis Platformu</span></div>
          <div><span>İTÜ Bilişim Enstitüsü © 2026</span></div>
        </div>
      </footer>
    </div>
  );
}