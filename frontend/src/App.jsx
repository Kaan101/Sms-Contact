import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowRight, 
  CornerDownLeft, 
  Phone, 
  MessageSquare, 
  SlidersHorizontal, 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Sparkles,
  Command,
  HelpCircle,
  Building2,
  Clock,
  Layers
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('USER'); // 'USER' | 'ADMIN' | 'PROVIDERS'
  
  // Kullanıcı State'leri
  const [queryText, setQueryText] = useState('');
  const [disambiguationData, setDisambiguationData] = useState(null);
  const [selectedDisambiguation, setSelectedDisambiguation] = useState(null);
  const [contactValue, setContactValue] = useState('');
  const [preferredChannel, setPreferredChannel] = useState('PHONE');
  const [step, setStep] = useState('INPUT'); // 'INPUT' | 'DISAMBIGUATE' | 'CONTACT' | 'RESULT'
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Admin / CRUD State'leri
  const [pendingRequests, setPendingRequests] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedProviderMap, setSelectedProviderMap] = useState({});
  const [adminLoading, setAdminLoading] = useState(false);

  // Modal State'leri
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

  const fetchProviders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/providers`);
      setProviders(res.data.providers || []);
    } catch (err) {
      console.error(err);
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
      console.error(err);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ADMIN') fetchAdminData();
    if (activeTab === 'PROVIDERS') fetchProviders();
  }, [activeTab]);

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
        setStep('CONTACT');
      }
    } catch (err) {
      setStep('CONTACT');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!contactValue.trim()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post(`${API_BASE}/requests`, {
        rawText: queryText,
        disambiguationChoice: selectedDisambiguation,
        contactValue: contactValue.trim(),
        preferredChannel: preferredChannel
      });

      setResultData(response.data);
      setStep('RESULT');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Bir hata meydana geldi.');
    } finally {
      setLoading(false);
    }
  };

const handleAssignProvider = async (requestId) => {
    const providerId = selectedProviderMap[requestId];
    if (!providerId) {
      alert('Lütfen önce bir servis sağlayıcı seçin.');
      return;
    }

    try {
      await axios.post(`${API_BASE}/requests/assign`, {
        requestId: Number(requestId),
        providerId: Number(providerId)
      });
      fetchAdminData();
    } catch (err) {
      console.error(err);
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
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      serviceKeywords: keywordsArray,
      communicationChannels: formData.communicationChannels,
      priorityScore: Number(formData.priorityScore)
    };

    try {
      if (editingProviderId) {
        await axios.put(`${API_BASE}/providers/${editingProviderId}`, payload);
      } else {
        await axios.post(`${API_BASE}/providers`, payload);
      }
      setIsModalOpen(false);
      fetchProviders();
    } catch (err) {
      alert('Kayıt başarısız: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteProvider = async (id) => {
    if (!window.confirm('Bu servis sağlayıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API_BASE}/providers/${id}`);
      fetchProviders();
    } catch (err) {
      alert('Silme işlemi başarısız.');
    }
  };

  const handleReset = () => {
    setQueryText('');
    setDisambiguationData(null);
    setSelectedDisambiguation(null);
    setContactValue('');
    setPreferredChannel('PHONE');
    setResultData(null);
    setErrorMessage('');
    setStep('INPUT');
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-neutral-900 flex flex-col justify-between font-sans selection:bg-neutral-900 selection:text-white">
      
      {/* 🧭 NAVIGATION: Swiss Precision Navbar */}
      <header className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo / Brand Mark */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={handleReset}>
            <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center text-white shadow-sm font-mono text-sm font-semibold tracking-tighter">
              SC
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-base tracking-tight text-neutral-950">Sms-Contact</span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-medium">Protocol 1.0</span>
            </div>
          </div>

          {/* Swiss Segmented Tabs */}
          <div className="flex items-center bg-neutral-100/80 p-1 rounded-lg border border-neutral-200/60 text-xs font-medium">
            <button
              onClick={() => setActiveTab('USER')}
              className={`px-3.5 py-1.5 rounded-md transition-all duration-200 ${
                activeTab === 'USER' 
                  ? 'bg-white text-neutral-950 shadow-sm font-semibold' 
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Talep Motoru
            </button>
            <button
              onClick={() => setActiveTab('PROVIDERS')}
              className={`px-3.5 py-1.5 rounded-md transition-all duration-200 flex items-center space-x-1.5 ${
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
              className={`px-3.5 py-1.5 rounded-md transition-all duration-200 flex items-center space-x-1.5 ${
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
        </div>
      </header>

      {/* 🏛️ MAIN CONTENT AREA */}
      <main className="max-w-6xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        
        {errorMessage && (
          <div className="max-w-xl mx-auto w-full mb-6 p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl text-rose-800 text-xs font-medium flex items-center justify-between backdrop-blur-sm">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-700 ml-4">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ---------------- 1. KULLANICI ARAYÜZÜ (MINIMALIST & PSYCHOLOGICALLY FOCUSED) ---------------- */}
        {activeTab === 'USER' && (
          <div className="max-w-2xl mx-auto w-full">
            
            {/* STEP 1: INPUT */}
            {step === 'INPUT' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="text-center space-y-3">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-neutral-200 bg-white text-neutral-600 text-xs font-medium shadow-swiss-sm">
                    <Sparkles size={13} className="text-neutral-900" />
                    <span>Serbest Metin Eşleştirme Motoru</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-950">
                    Hangi hizmete ihtiyacınız var?
                  </h1>
                  <p className="text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
                    Kategori seçmeden, form doldurmadan. İstediğiniz hizmeti günlük dilde yazın, uygun sağlayıcıyla eşleştirelim.
                  </p>
                </div>

                <form onSubmit={handleInitialSubmit} className="space-y-4">
                  <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-swiss hover:border-neutral-300 transition-all p-3 focus-within:ring-2 focus-within:ring-neutral-950 focus-within:border-transparent">
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
                      className="w-full p-3 text-base text-neutral-900 placeholder:text-neutral-400 bg-transparent border-none outline-none resize-none"
                      required
                    />
                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100 px-2 text-xs text-neutral-400">
                      <span className="hidden sm:inline-flex items-center space-x-1 font-mono text-[11px]">
                        <CornerDownLeft size={11} />
                        <span>Göndermek için Enter'a basın</span>
                      </span>
                      <button
                        type="submit"
                        disabled={loading || !queryText.trim()}
                        className="ml-auto px-4 py-2 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-lg text-xs font-semibold tracking-wide transition-all shadow-sm flex items-center space-x-1.5"
                      >
                        {loading ? (
                          <span>Çözümleniyor...</span>
                        ) : (
                          <>
                            <span>Devam Et</span>
                            <ArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Micro Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-4 max-w-lg mx-auto text-center border-t border-neutral-200/50">
                  <div>
                    <p className="text-lg font-bold tracking-tight text-neutral-900">0s</p>
                    <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-mono">Form Süresi</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold tracking-tight text-neutral-900">%100</p>
                    <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-mono">Doğal Dil</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold tracking-tight text-neutral-900">Doğrudan</p>
                    <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-mono">Kanal Bağlantısı</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: DISAMBIGUATION (NİYET NETLEŞTİRME) */}
            {step === 'DISAMBIGUATE' && disambiguationData && (
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-swiss p-8 space-y-6 animate-fadeIn">
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
                      onClick={() => { setSelectedDisambiguation(option.text); setStep('CONTACT'); }}
                      className="w-full text-left p-4 rounded-xl border border-neutral-200/80 hover:border-neutral-950 hover:bg-neutral-50/50 transition-all duration-150 flex items-center justify-between group"
                    >
                      <span className="text-sm font-medium text-neutral-900 group-hover:text-neutral-950">{option.text}</span>
                      <ArrowRight size={15} className="text-neutral-300 group-hover:text-neutral-950 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                  <button
                    onClick={() => { setSelectedDisambiguation(null); setStep('CONTACT'); }}
                    className="w-full text-center p-3 rounded-xl border border-dashed border-neutral-200 hover:bg-neutral-50 text-neutral-400 hover:text-neutral-600 text-xs transition"
                  >
                    Orijinal ifademle devam et: <span className="font-medium italic">"{queryText}"</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CONTACT & CHANNEL SELECTION */}
            {step === 'CONTACT' && (
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-swiss p-8 space-y-6 animate-fadeIn">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold tracking-tight text-neutral-950">İletişim & Kanal Tercihi</h2>
                    <span className="text-[11px] font-mono text-neutral-400">Adım 2 / 2</span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Servis sağlayıcının size nasıl ulaşmasını istersiniz?</p>
                  
                  {selectedDisambiguation && (
                    <div className="mt-3 inline-flex items-center space-x-1.5 bg-neutral-100 text-neutral-800 text-xs px-3 py-1 rounded-md font-mono">
                      <span className="text-neutral-400 font-sans">Hedef:</span>
                      <span className="font-semibold">{selectedDisambiguation}</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleFinalSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2 font-mono">
                      Telefon Numaranız
                    </label>
                    <input
                      type="tel"
                      value={contactValue}
                      onChange={(e) => setContactValue(e.target.value)}
                      placeholder="+90 5XX XXX XX XX"
                      className="w-full p-3.5 rounded-xl border border-neutral-200 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 outline-none text-neutral-900 text-sm font-mono tracking-tight"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2 font-mono">
                      Tercih Edilen İletişim Kanalı
                    </label>
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
                          Hızlı ve doğrudan sesli görüşme
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
                          Yazılı bilgilendirme ve detay
                        </p>
                      </button>
                    </div>
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
                      disabled={loading || !contactValue.trim()}
                      className="w-2/3 py-3 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white font-semibold rounded-xl text-xs transition shadow-sm"
                    >
                      {loading ? 'İşleniyor...' : 'Talebi Onayla'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* STEP 4: RESULT */}
            {step === 'RESULT' && resultData && (
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-swiss p-8 text-center space-y-6 animate-fadeIn">
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
                      <h2 className="text-2xl font-bold tracking-tight text-neutral-950">Talebiniz Kaydedildi</h2>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto">{resultData.message}</p>
                    </div>
                    <span className="inline-block bg-neutral-100 text-neutral-700 text-[11px] font-mono px-3 py-1 rounded-full border border-neutral-200">
                      Operatör Koordinasyon Modu Aktif
                    </span>
                  </div>
                )}

                <button
                  onClick={handleReset}
                  className="inline-flex items-center space-x-2 py-2.5 px-5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition"
                >
                  <RotateCcw size={14} />
                  <span>Yeni Talep Başlat</span>
                </button>
              </div>
            )}

          </div>
        )}

        {/* ---------------- 2. OPERATÖR WOZ MODU (SWISS DATA DASHBOARD) ---------------- */}
        {activeTab === 'ADMIN' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950">Operatör Müdahale Havuzu</h2>
                <p className="text-xs text-neutral-500">Otomatik kural motorunun yetersiz kaldığı talepleri manuel koordine edin.</p>
              </div>
              <button
                onClick={fetchAdminData}
                className="text-xs font-semibold px-3 py-1.5 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-700 shadow-swiss-sm transition"
              >
                Yenile
              </button>
            </div>

            {adminLoading ? (
              <div className="text-center py-16 text-xs text-neutral-400 font-mono">Veriler sorgulanıyor...</div>
            ) : pendingRequests.length === 0 ? (
              <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center shadow-swiss-sm">
                <p className="text-sm font-semibold text-neutral-900">Bekleyen Talep Yok</p>
                <p className="text-xs text-neutral-400 mt-1 font-mono">Tüm gelen istekler başarıyla yönlendirildi.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="bg-white p-5 rounded-xl border border-neutral-200 shadow-swiss-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                        onChange={(e) => setSelectedProviderMap({ ...selectedProviderMap, [req.id]: e.target.value })}
                        className="text-xs p-2.5 border border-neutral-200 rounded-lg bg-neutral-50 outline-none focus:border-neutral-950 font-medium"
                        defaultValue=""
                      >
                        <option value="" disabled>Sağlayıcı Seç</option>
                        {providers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Öncelik: {p.priority_score})
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

        {/* ---------------- 3. SAĞLAYICI YÖNETİMİ (SWISS GRID CRUD) ---------------- */}
        {activeTab === 'PROVIDERS' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-neutral-950">Servis Sağlayıcı Dizini</h2>
                <p className="text-xs text-neutral-500">Sistemdeki aktif servis sağlayıcıların iletişim, skor ve anahtar kelimelerini yönetin.</p>
              </div>
              <button
                onClick={() => openModal()}
                className="px-3.5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-swiss-sm transition"
              >
                <Plus size={14} />
                <span>Yeni Sağlayıcı</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((prov) => (
                <div key={prov.id} className="bg-white p-5 rounded-xl border border-neutral-200 shadow-swiss-sm flex flex-col justify-between space-y-4 hover:border-neutral-300 transition">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-neutral-950 text-sm tracking-tight">{prov.name}</h3>
                        <p className="text-xs text-neutral-400 font-mono mt-0.5">
                          {prov.phone} {prov.email && `• ${prov.email}`}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 bg-neutral-100 text-neutral-800 rounded border border-neutral-200">
                        Skor: {prov.priority_score}
                      </span>
                    </div>

                    {/* Anahtar Kelimeler */}
                    <div className="flex flex-wrap gap-1">
                      {(prov.service_keywords || []).map((kw, i) => (
                        <span key={i} className="text-[11px] font-mono px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Alt İşlemler */}
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

        {/* ---------------- MODAL: SAĞLAYICI FORM (CLEAN DIALOG) ---------------- */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-swiss-lg border border-neutral-200 space-y-4">
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
                    className="w-full p-2.5 text-xs rounded-lg border border-neutral-200 focus:border-neutral-950 outline-none"
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
                      className="w-full p-2.5 text-xs font-mono rounded-lg border border-neutral-200 focus:border-neutral-950 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">E-posta</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="info@firma.com"
                      className="w-full p-2.5 text-xs rounded-lg border border-neutral-200 focus:border-neutral-950 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">
                    Anahtar Kelimeler (Virgülle ayırın) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.serviceKeywords}
                    onChange={(e) => setFormData({ ...formData, serviceKeywords: e.target.value })}
                    placeholder="bisiklet, lastik, tamir, moda"
                    className="w-full p-2.5 text-xs font-mono rounded-lg border border-neutral-200 focus:border-neutral-950 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1">Öncelik Skoru (1-200)</label>
                    <input
                      type="number"
                      value={formData.priorityScore}
                      onChange={(e) => setFormData({ ...formData, priorityScore: e.target.value })}
                      className="w-full p-2.5 text-xs font-mono rounded-lg border border-neutral-200 focus:border-neutral-950 outline-none"
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
                    className="px-3.5 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-600 rounded-lg text-xs font-semibold"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* 🇨🇭 FOOTER: Minimalist Swiss Meta Info */}
      <footer className="border-t border-neutral-200/80 bg-white py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-400 font-mono">
          <div>
            <span>Sms-Contact</span> • <span>İsviçre Tasarım & Doğal Dil Eşleştirme Mimarisi</span>
          </div>
          <div>
            <span>İTÜ Bilişim Enstitüsü © 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}