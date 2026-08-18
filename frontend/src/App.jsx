import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowRight, 
  CornerDownLeft, 
  Phone, 
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
  ChevronDown,
  ChevronUp,
  CheckCheck,
  History,
  Building2
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function App() {
  // --- AUTH STATE ---
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sc_user');
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

  // --- TAB & FLOW STATE ---
  const [activeTab, setActiveTab] = useState('USER'); // 'USER' | 'MATCHED' | 'ADMIN' | 'PROVIDERS'
  const [queryText, setQueryText] = useState('');
  const [disambiguationData, setDisambiguationData] = useState(null);
  const [selectedDisambiguation, setSelectedDisambiguation] = useState(null);
  const [preferredChannel, setPreferredChannel] = useState('PHONE');
  const [step, setStep] = useState('INPUT'); // 'INPUT' | 'DISAMBIGUATE' | 'CONFIRM' | 'RESULT'
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // --- KULLANICI TALEPLERİ (AKORDEON) ---
  const [myRequests, setMyRequests] = useState([]);
  const [isMyRequestsOpen, setIsMyRequestsOpen] = useState(true);
  const [myRequestsLoading, setMyRequestsLoading] = useState(false);

  // --- GENEL EŞLEŞMELER & WOZ STATE ---
  const [matchedRequests, setMatchedRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedProviderMap, setSelectedProviderMap] = useState({});
  const [adminLoading, setAdminLoading] = useState(false);

  // --- SAĞLAYICI CRUD MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    serviceKeywords: '',
    communicationChannels: ['PHONE', 'SMS'],
    priorityScore: 100
  });

  // Veri Çekme Fonksiyonları
  const fetchMyRequests = async () => {
    if (!user?.phone) return;
    setMyRequestsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/requests/my-requests?phone=${encodeURIComponent(user.phone)}`);
      setMyRequests(res.data.requests || []);
    } catch (err) {
      console.error('Kullanıcı talepleri hatası:', err);
    } finally {
      setMyRequestsLoading(false);
    }
  };

  const fetchMatchedRequests = async () => {
    setAdminLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/requests/matched`);
      setMatchedRequests(res.data.requests || []);
    } catch (err) {
      console.error('Eşleşen talepler hatası:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/providers`);
      setProviders(res.data.providers || []);
    } catch (err) {
      console.error('Sağlayıcılar hatası:', err);
    }
  };

  const fetchAdminData = async () => {
    setAdminLoading(true);
    try {
      const [reqRes, provRes] = await Promise.all([
        axios.get(`${API_BASE}/requests/pending`),
        axios.get(`${API_BASE}/providers`)
      ]);
      setPendingRequests(reqRes.data.requests || []);
      setProviders(provRes.data.providers || []);
    } catch (err) {
      console.error('Admin veri hatası:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'USER' && user) fetchMyRequests();
    if (activeTab === 'MATCHED') fetchMatchedRequests();
    if (activeTab === 'ADMIN') fetchAdminData();
    if (activeTab === 'PROVIDERS') fetchProviders();
  }, [activeTab, user]);

  // Auth Metodları
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
      setErrorMessage(err.response?.data?.message || 'Doğrulama kodu gönderilemedi.');
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
      const res = await axios.post(`${API_BASE}/auth/verify-otp`, {
        phone: inputPhone.trim(),
        otpCode: inputOtp.trim()
      });
      setUser(res.data.user);
      localStorage.setItem('sc_user', JSON.stringify(res.data.user));
      setAuthStep('PHONE');
      setInputOtp('');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Doğrulama kodu geçersiz.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sc_user');
    setUser(null);
    handleReset();
  };

  // Talep Gönderim Metodları
  const handleInitialSubmit = async (e) => {
    e?.preventDefault();
    if (!queryText.trim()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post(`${API_BASE}/disambiguate`, {
        queryText: queryText.trim()
      });

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

  const handleFinalSubmit = async (e) => {
    e?.preventDefault();
    if (!user?.phone) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post(`${API_BASE}/requests`, {
        rawText: queryText,
        disambiguationChoice: selectedDisambiguation,
        contactValue: user.phone,
        preferredChannel: preferredChannel
      });

      setResultData(response.data);
      setStep('RESULT');
      fetchMyRequests(); // Talebi hemen listeye yansıt
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Talep oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProvider = async (requestId) => {
    const selectedVal = selectedProviderMap[requestId];
    if (!selectedVal) {
      alert('Lütfen bir servis sağlayıcı seçin.');
      return;
    }

    try {
      await axios.post(`${API_BASE}/requests/assign`, {
        requestId: parseInt(requestId, 10),
        providerId: parseInt(selectedVal, 10)
      });
      await fetchAdminData();
    } catch (err) {
      alert('Atama işlemi başarısız: ' + (err.response?.data?.message || err.message));
    }
  };

  const openModal = (provider = null) => {
    if (provider) {
      setEditingProviderId(provider.id);
      setFormData({
        name: provider.name,
        phone: provider.phone,
        email: provider.email || '',
        serviceKeywords: (provider.service_keywords || []).join(', '),
        communicationChannels: provider.communication_channels || ['PHONE'],
        priorityScore: provider.priority_score || 100
      });
    } else {
      setEditingProviderId(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        serviceKeywords: '',
        communicationChannels: ['PHONE', 'SMS'],
        priorityScore: 100
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveProvider = async (e) => {
    e.preventDefault();
    const keywordsArray = formData.serviceKeywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email ? formData.email.trim() : null,
      serviceKeywords: keywordsArray,
      communicationChannels: formData.communicationChannels,
      priorityScore: parseInt(formData.priorityScore, 10) || 100
    };

    try {
      if (editingProviderId) {
        await axios.put(`${API_BASE}/providers/${editingProviderId}`, payload);
      } else {
        await axios.post(`${API_BASE}/providers`, payload);
      }
      setIsModalOpen(false);
      await Promise.all([fetchProviders(), fetchAdminData()]);
    } catch (err) {
      alert('Kayıt başarısız: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteProvider = async (id) => {
    if (!window.confirm('Bu servis sağlayıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API_BASE}/providers/${id}`);
      await Promise.all([fetchProviders(), fetchAdminData()]);
    } catch {
      alert('Silme işlemi başarısız.');
    }
  };

  const handleReset = () => {
    setQueryText('');
    setDisambiguationData(null);
    setSelectedDisambiguation(null);
    setPreferredChannel('PHONE');
    setResultData(null);
    setErrorMessage('');
    setStep('INPUT');
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-neutral-900 flex flex-col justify-between font-sans selection:bg-neutral-900 selection:text-white">
      
      {/* 🧭 NAVIGATION */}
      <header className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleReset}>
            <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center text-white shadow-sm font-mono text-sm font-semibold tracking-tighter">
              SC
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-base tracking-tight text-neutral-950">Sms-Contact</span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-medium hidden sm:inline">Protocol 1.0</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-neutral-100/80 p-1 rounded-lg border border-neutral-200/60 text-xs font-medium">
              <button
                onClick={() => setActiveTab('USER')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'USER' 
                    ? 'bg-white text-neutral-950 shadow-sm font-semibold' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Talep Motoru
              </button>
              <button
                onClick={() => setActiveTab('MATCHED')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                  activeTab === 'MATCHED' 
                    ? 'bg-white text-neutral-950 shadow-sm font-semibold' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <CheckCheck size={13} className="text-neutral-400" />
                <span>Eşleşmeler</span>
              </button>
              <button
                onClick={() => setActiveTab('PROVIDERS')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                  activeTab === 'PROVIDERS' 
                    ? 'bg-white text-neutral-950 shadow-sm font-semibold' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Users size={13} className="text-neutral-400" />
                <span>Sağlayıcılar</span>
              </button>
              <button
                onClick={() => setActiveTab('ADMIN')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                  activeTab === 'ADMIN' 
                    ? 'bg-white text-neutral-950 shadow-sm font-semibold' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <SlidersHorizontal size={13} className="text-neutral-400" />
                <span>WoZ Havuzu</span>
                {pendingRequests.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </button>
            </div>

            {user && (
              <div className="hidden md:flex items-center space-x-2 pl-2 border-l border-neutral-200 text-xs font-mono">
                <span className="px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-md border border-neutral-200">
                  {user.phone}
                </span>
                <button
                  onClick={handleLogout}
                  title="Çıkış Yap"
                  className="p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 🏛️ MAIN CONTENT */}
      <main className="max-w-6xl w-full mx-auto px-6 py-10 flex-1 flex flex-col justify-start">
        
        {errorMessage && (
          <div className="max-w-2xl mx-auto w-full mb-6 p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl text-rose-800 text-xs font-medium flex items-center justify-between backdrop-blur-sm">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-700 ml-4">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ----------------- 1. KULLANICI TALEP & GEÇMİŞ EKRANI ----------------- */}
        {activeTab === 'USER' && (
          <div className="max-w-2xl mx-auto w-full space-y-8">
            {!user ? (
              /* OTP GİRİŞ PANELİ */
              <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-8 max-w-md mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-neutral-950 text-white rounded-2xl mx-auto flex items-center justify-center shadow-sm font-mono text-lg font-bold">
                    <KeyRound size={22} />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-neutral-950">Hızlı Giriş Yapın</h2>
                  <p className="text-xs text-neutral-500">
                    Taleplerinizin eşleşmesi ve servis sağlayıcıyla bağlantı için telefonunuzu doğrulayın.
                  </p>
                </div>

                {authStep === 'PHONE' ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1.5">
                        Telefon Numaranız
                      </label>
                      <input
                        type="tel"
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
                        <span className="font-bold text-base tracking-widest text-neutral-950">{simulatedCode}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1.5">
                        6 Haneli Doğrulama Kodu
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={inputOtp}
                        onChange={(e) => setInputOtp(e.target.value)}
                        placeholder="123456"
                        className="w-full p-3.5 text-center text-lg tracking-widest font-mono rounded-xl border border-neutral-200 focus:border-neutral-950 outline-none"
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
                        {authLoading ? 'Doğrulanıyor...' : 'Girişi Tamamla'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* GİRİŞ YAPILMIŞ KULLANICI ALANI */
              <>
                {/* 1.1 TALEP GİRİŞ ADIMI */}
                {step === 'INPUT' && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-neutral-200 bg-white text-neutral-600 text-xs font-medium shadow-sm">
                        <Sparkles size={13} className="text-neutral-900" />
                        <span>Doğrulanmış Kullanıcı: <strong className="font-mono text-neutral-900">{user.phone}</strong></span>
                      </div>
                      <h1 className="text-3xl font-extrabold tracking-tight text-neutral-950">
                        Hangi hizmete ihtiyacınız var?
                      </h1>
                      <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
                        İhtiyacınızı günlük dilde yazın. Doğrulanmış profiliniz üzerinden en uygun sağlayıcıyla eşleştirelim.
                      </p>
                    </div>

                    <form onSubmit={handleInitialSubmit} className="space-y-4">
                      <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm hover:border-neutral-300 transition p-3 focus-within:ring-2 focus-within:ring-neutral-950">
                        <textarea
                          rows={3}
                          value={queryText}
                          onChange={(e) => setQueryText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleInitialSubmit();
                            }
                          }}
                          placeholder="Örn: Moda'da acil bisiklet lastik tamiri arıyorum veya Kadıköy'de buz pateni sahası kiralayalım..."
                          className="w-full p-3 text-sm text-neutral-900 placeholder:text-neutral-400 bg-transparent border-none outline-none resize-none"
                          required
                        />
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 px-2 text-xs text-neutral-400">
                          <span className="hidden sm:inline-flex items-center space-x-1 font-mono text-[11px]">
                            <CornerDownLeft size={11} />
                            <span>Enter ile devam edin</span>
                          </span>
                          <button
                            type="submit"
                            disabled={loading || !queryText.trim()}
                            className="ml-auto px-4 py-2 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
                          >
                            {loading ? <span>Çözümleniyor...</span> : <><span>Devam Et</span><ArrowRight size={13} /></>}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {/* 1.2 DİSAMBİGUATE */}
                {step === 'DISAMBIGUATE' && disambiguationData && (
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 space-y-6">
                    <div className="flex items-start space-x-3.5 pb-4 border-b border-neutral-100">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <HelpCircle size={18} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-neutral-950">Hizmet Amacını Netleştirelim</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">{disambiguationData.message}</p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {disambiguationData.options.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => { setSelectedDisambiguation(option.text); setStep('CONFIRM'); }}
                          className="w-full text-left p-4 rounded-xl border border-neutral-200 hover:border-neutral-950 hover:bg-neutral-50/50 transition flex items-center justify-between group"
                        >
                          <span className="text-sm font-medium text-neutral-900 group-hover:text-neutral-950">{option.text}</span>
                          <ArrowRight size={15} className="text-neutral-300 group-hover:text-neutral-950 transition" />
                        </button>
                      ))}
                      <button
                        onClick={() => { setSelectedDisambiguation(null); setStep('CONFIRM'); }}
                        className="w-full text-center p-3 rounded-xl border border-dashed border-neutral-200 hover:bg-neutral-50 text-neutral-400 hover:text-neutral-600 text-xs transition"
                      >
                        Orijinal ifademle devam et: <span className="font-medium italic">"{queryText}"</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 1.3 KANAL ONAY */}
                {step === 'CONFIRM' && (
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 space-y-6">
                    <div>
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold tracking-tight text-neutral-950">İletişim Kanalı Tercihiniz</h2>
                        <span className="text-[11px] font-mono px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded">
                          {user.phone}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">Servis sağlayıcının sizinle nasıl iletişime geçmesini tercih edersiniz?</p>
                      
                      {selectedDisambiguation && (
                        <div className="mt-3 inline-flex items-center space-x-1.5 bg-neutral-100 text-neutral-800 text-xs px-3 py-1 rounded-md font-mono">
                          <span className="text-neutral-400 font-sans">Hedef:</span>
                          <span className="font-semibold">{selectedDisambiguation}</span>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleFinalSubmit} className="space-y-5">
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPreferredChannel('PHONE')}
                          className={`p-3.5 rounded-xl border text-left transition-all ${
                            preferredChannel === 'PHONE'
                              ? 'border-neutral-950 bg-neutral-950 text-white shadow-sm'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <Phone size={16} />
                            <span className="text-xs font-semibold">Telefon Araması</span>
                          </div>
                          <p className={`text-[11px] mt-1 ${preferredChannel === 'PHONE' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                            Doğrudan sesli iletişim
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreferredChannel('SMS')}
                          className={`p-3.5 rounded-xl border text-left transition-all ${
                            preferredChannel === 'SMS'
                              ? 'border-neutral-950 bg-neutral-950 text-white shadow-sm'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <MessageSquare size={16} />
                            <span className="text-xs font-semibold">SMS / WhatsApp</span>
                          </div>
                          <p className={`text-[11px] mt-1 ${preferredChannel === 'SMS' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                            Yazılı mesaj ve detay
                          </p>
                        </button>
                      </div>

                      <div className="pt-2 flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => setStep('INPUT')}
                          className="w-1/3 py-3 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-semibold rounded-xl text-xs transition"
                        >
                          Geri
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-2/3 py-3 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white font-semibold rounded-xl text-xs transition shadow-sm"
                        >
                          {loading ? 'Eşleştiriliyor...' : 'Talebi Oluştur'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* 1.4 SONUÇ */}
                {step === 'RESULT' && resultData && (
                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 text-center space-y-6">
                    {resultData.matchedProvider ? (
                      <div className="space-y-4">
                        <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
                          <CheckCircle2 size={28} />
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-2xl font-bold tracking-tight text-neutral-950">Eşleşme Sağlandı</h2>
                          <p className="text-xs text-neutral-500 max-w-sm mx-auto">{resultData.message}</p>
                        </div>

                        <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-4 text-left text-xs space-y-2.5 font-mono">
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-400 font-sans">Servis Sağlayıcı:</span>
                            <span className="font-semibold text-neutral-950">{resultData.matchedProvider.name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-neutral-400 font-sans">Kanal:</span>
                            <span className="px-2 py-0.5 bg-neutral-200 text-neutral-800 rounded font-semibold text-[10px]">
                              {resultData.matchedProvider.channelUsed}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-14 h-14 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-2xl mx-auto flex items-center justify-center">
                          <Clock size={28} />
                        </div>
                        <div className="space-y-1">
                          <h2 className="text-2xl font-bold tracking-tight text-neutral-950">Talebiniz Alındı</h2>
                          <p className="text-xs text-neutral-500 max-w-sm mx-auto">{resultData.message}</p>
                        </div>
                        <span className="inline-block bg-neutral-100 text-neutral-700 text-[11px] font-mono px-3 py-1 rounded-full border border-neutral-200">
                          Operatör Havuzuna Yönlendirildi
                        </span>
                      </div>
                    )}

                    <button
                      onClick={handleReset}
                      className="inline-flex items-center space-x-2 py-2.5 px-5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition"
                    >
                      <RotateCcw size={14} />
                      <span>Yeni Talep Oluştur</span>
                    </button>
                  </div>
                )}

                {/* 1.5 KULLANICININ KENDİ GEÇMİŞ TALEPLERİ & EŞLEŞMELERİ (AKORDEON LİSTE) */}
                <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setIsMyRequestsOpen(!isMyRequestsOpen)}
                    className="w-full p-4 flex items-center justify-between hover:bg-neutral-50/60 transition text-left"
                  >
                    <div className="flex items-center space-x-2">
                      <History size={16} className="text-neutral-500" />
                      <span className="font-semibold text-xs tracking-tight text-neutral-900">
                        Taleplerim & Eşleşme Durumlarım ({myRequests.length})
                      </span>
                    </div>
                    {isMyRequestsOpen ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
                  </button>

                  {isMyRequestsOpen && (
                    <div className="p-4 pt-0 border-t border-neutral-100 space-y-3">
                      {myRequestsLoading ? (
                        <p className="text-xs text-neutral-400 py-4 text-center font-mono">Talepleriniz yükleniyor...</p>
                      ) : myRequests.length === 0 ? (
                        <p className="text-xs text-neutral-400 py-4 text-center">Henüz bir talep göndermediniz.</p>
                      ) : (
                        myRequests.map((req) => (
                          <div key={req.id} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/70 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-medium text-neutral-900 leading-snug">"{req.raw_text}"</p>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                                req.status === 'MATCHED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {req.status === 'MATCHED' ? 'EŞLEŞTİ' : 'HAVUZDA'}
                              </span>
                            </div>

                            {req.provider_name ? (
                              <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between text-[11px]">
                                <div className="flex items-center space-x-1.5 text-neutral-700">
                                  <Building2 size={13} className="text-emerald-600" />
                                  <span className="font-semibold">{req.provider_name}</span>
                                  <span className="text-neutral-400">({req.provider_phone})</span>
                                </div>
                                <span className="font-mono text-[10px] text-neutral-400 uppercase">
                                  Kanal: {req.preferred_channel}
                                </span>
                              </div>
                            ) : (
                              <p className="text-[11px] text-neutral-400 italic pt-1">
                                Operatör uygun sağlayıcı ile koordinasyonu sağlıyor...
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ----------------- 2. GENEL EŞLEŞEN TALEPLER SEKMESİ ----------------- */}
        {activeTab === 'MATCHED' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950">Eşleşen Tüm Talepler</h2>
                <p className="text-xs text-neutral-500">Sistemde kural tabanlı veya operatör eliyle eşleştirilmiş tüm istekler.</p>
              </div>
              <button
                onClick={fetchMatchedRequests}
                className="text-xs font-semibold px-3 py-1.5 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-700 transition"
              >
                Yenile
              </button>
            </div>

            {adminLoading ? (
              <div className="text-center py-16 text-xs text-neutral-400 font-mono">Eşleşmeler sorgulanıyor...</div>
            ) : matchedRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
                <p className="text-sm font-semibold text-neutral-900">Henüz Eşleşen Talep Yok</p>
                <p className="text-xs text-neutral-400 mt-1 font-mono">Otomatik veya manuel eşleşme sağlandıkça burada listelenecektir.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchedRequests.map((req) => (
                  <div key={req.id} className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          MATCHED #REQ-{req.id}
                        </span>
                        <span className="text-[11px] font-mono text-neutral-400">
                          {new Date(req.created_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-neutral-900">"{req.raw_text}"</p>
                      {req.disambiguation_choice && (
                        <p className="text-xs text-indigo-600 font-medium">Hedef: {req.disambiguation_choice}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-neutral-100 space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400 font-sans">Kullanıcı Telefon:</span>
                        <span className="font-semibold text-neutral-800">{req.contact_value}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400 font-sans">Atanan Sağlayıcı:</span>
                        <span className="font-semibold text-emerald-700">{req.provider_name || 'Bilinmiyor'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400 font-sans">Sağlayıcı İletişim:</span>
                        <span className="text-neutral-700">{req.provider_phone}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-400 font-sans">Kanal Tercihi:</span>
                        <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-700 rounded font-semibold text-[10px]">
                          {req.preferred_channel}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- 3. OPERATÖR WOZ MODU ----------------- */}
        {activeTab === 'ADMIN' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950">Operatör Müdahale Havuzu</h2>
                <p className="text-xs text-neutral-500">Otomatik eşleşmeyen talepleri servis verenlere manuel atayın.</p>
              </div>
              <button
                onClick={fetchAdminData}
                className="text-xs font-semibold px-3 py-1.5 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-700 transition"
              >
                Yenile
              </button>
            </div>

            {adminLoading ? (
              <div className="text-center py-16 text-xs text-neutral-400 font-mono">Veriler sorgulanıyor...</div>
            ) : pendingRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center">
                <p className="text-sm font-semibold text-neutral-900">Bekleyen Talep Yok</p>
                <p className="text-xs text-neutral-400 mt-1 font-mono">Tüm gelen istekler yönlendirildi.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {req.status}
                        </span>
                        <span className="text-xs font-mono text-neutral-400">#REQ-{req.id}</span>
                      </div>
                      <p className="text-sm font-semibold text-neutral-900">"{req.raw_text}"</p>
                      <p className="text-xs text-neutral-500 font-mono">
                        İletişim: <span className="font-semibold text-neutral-800">{req.contact_value}</span> • [{req.preferred_channel}]
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        value={selectedProviderMap[req.id] || ""}
                        onChange={(e) => setSelectedProviderMap({ ...selectedProviderMap, [req.id]: e.target.value })}
                        className="text-xs p-2.5 border border-neutral-200 rounded-lg bg-neutral-50 outline-none font-medium"
                      >
                        <option value="" disabled>Sağlayıcı Seç</option>
                        {providers.map((p) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.name} (ID: {p.id} - Skor: {p.priority_score})
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleAssignProvider(req.id)}
                        disabled={!selectedProviderMap[req.id]}
                        className="px-3.5 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-lg text-xs font-semibold transition"
                      >
                        Ata
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------- 4. SAĞLAYICI YÖNETİMİ (CRUD) ----------------- */}
        {activeTab === 'PROVIDERS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950">Servis Sağlayıcı Dizini</h2>
                <p className="text-xs text-neutral-500">Sistemdeki servis sağlayıcıları yönetin.</p>
              </div>
              <button
                onClick={() => openModal()}
                className="px-3.5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Plus size={14} />
                <span>Yeni Sağlayıcı</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((prov) => (
                <div key={prov.id} className="bg-white p-5 rounded-xl border border-neutral-200 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-neutral-950 text-sm">{prov.name}</h3>
                        <p className="text-xs text-neutral-400 font-mono mt-0.5">
                          {prov.phone} {prov.email && `• ${prov.email}`}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded border border-neutral-200">
                        Skor: {prov.priority_score}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(prov.service_keywords || []).map((kw, i) => (
                        <span key={i} className="text-[11px] font-mono px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
                    <div className="flex items-center space-x-1">
                      {(prov.communication_channels || []).map((ch, i) => (
                        <span key={i} className="text-[10px] font-mono uppercase font-bold text-neutral-400">
                          {ch}{i < prov.communication_channels.length - 1 ? ' / ' : ''}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openModal(prov)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteProvider(prov.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: SAĞLAYICI FORM */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-neutral-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h3 className="font-bold text-neutral-950 text-base">
                  {editingProviderId ? 'Sağlayıcıyı Düzenle' : 'Yeni Servis Sağlayıcı'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveProvider} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">Firma / Sağlayıcı Adı *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Moda Bisiklet Atölyesi"
                    className="w-full p-2.5 text-xs rounded-lg border border-neutral-200 outline-none focus:border-neutral-950"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">Telefon *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+90 5XX XXX XX XX"
                      className="w-full p-2.5 text-xs font-mono rounded-lg border border-neutral-200 outline-none focus:border-neutral-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">E-posta</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="info@firma.com"
                      className="w-full p-2.5 text-xs rounded-lg border border-neutral-200 outline-none focus:border-neutral-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">Anahtar Kelimeler *</label>
                  <input
                    type="text"
                    required
                    value={formData.serviceKeywords}
                    onChange={(e) => setFormData({ ...formData, serviceKeywords: e.target.value })}
                    placeholder="bisiklet, lastik, tamir, moda"
                    className="w-full p-2.5 text-xs font-mono rounded-lg border border-neutral-200 outline-none focus:border-neutral-950"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">Öncelik Skoru</label>
                    <input
                      type="number"
                      value={formData.priorityScore}
                      onChange={(e) => setFormData({ ...formData, priorityScore: e.target.value })}
                      className="w-full p-2.5 text-xs font-mono rounded-lg border border-neutral-200 outline-none focus:border-neutral-950"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">İletişim Kanalları</label>
                    <div className="flex items-center space-x-3 pt-2 text-xs font-mono">
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.communicationChannels.includes('PHONE')}
                          onChange={(e) => {
                            const newCh = e.target.checked
                              ? [...formData.communicationChannels, 'PHONE']
                              : formData.communicationChannels.filter(c => c !== 'PHONE');
                            setFormData({ ...formData, communicationChannels: newCh });
                          }}
                        />
                        <span>PHONE</span>
                      </label>
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.communicationChannels.includes('SMS')}
                          onChange={(e) => {
                            const newCh = e.target.checked
                              ? [...formData.communicationChannels, 'SMS']
                              : formData.communicationChannels.filter(c => c !== 'SMS');
                            setFormData({ ...formData, communicationChannels: newCh });
                          }}
                        />
                        <span>SMS</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-1.5 border border-neutral-200 text-neutral-600 rounded-lg text-xs font-semibold"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-neutral-950 text-white rounded-lg text-xs font-semibold"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* 🇨🇭 FOOTER */}
      <footer className="border-t border-neutral-200/80 bg-white py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400 font-mono">
          <div>
            <span>Sms-Contact</span> • <span>Doğal Dil Eşleştirme & Kimlik Doğrulama Sistemi</span>
          </div>
          <div>
            <span>İTÜ Bilişim Enstitüsü © 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}