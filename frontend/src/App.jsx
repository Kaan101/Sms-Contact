import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquareText, 
  Phone, 
  MessageCircle, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  PlusCircle,
  Inbox
} from 'lucide-react';

// .env.production varsa oradaki adresi, yoksa localhost:5000'i kullanır
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('USER'); // 'USER' | 'ADMIN'
  
  // Kullanıcı State'leri
  const [queryText, setQueryText] = useState('');
  const [disambiguationData, setDisambiguationData] = useState(null);
  const [selectedDisambiguation, setSelectedDisambiguation] = useState(null);
  const [contactValue, setContactValue] = useState('');
  const [preferredChannel, setPreferredChannel] = useState('PHONE');
  const [step, setStep] = useState('INPUT');
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Admin / Operatör State'leri
  const [pendingRequests, setPendingRequests] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedProviderMap, setSelectedProviderMap] = useState({});
  const [adminLoading, setAdminLoading] = useState(false);

  // Admin Verilerini Çek
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
      console.error('Admin veri çekme hatası:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ADMIN') {
      fetchAdminData();
    }
  }, [activeTab]);

  // Niyet Kontrolü
  const handleInitialSubmit = async (e) => {
    e.preventDefault();
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

  // Talep Gönderimi
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
      setErrorMessage(err.response?.data?.message || 'Talep oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  // Manuel Eşleştirme Yap
  const handleAssignProvider = async (requestId) => {
    const providerId = selectedProviderMap[requestId];
    if (!providerId) return;

    try {
      await axios.post(`${API_BASE}/requests/assign`, {
        requestId,
        providerId
      });
      fetchAdminData();
    } catch (err) {
      alert('Atama işlemi başarısız oldu.');
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-3 px-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <MessageSquareText size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800">Sms-Contact</h1>
              <p className="text-xs text-slate-500 font-medium">Doğal Dil ile Hizmet Eşleştirme</p>
            </div>
          </div>

          {/* Görünüm Değiştirici */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('USER')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'USER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kullanıcı Modu
            </button>
            <button
              onClick={() => setActiveTab('ADMIN')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                activeTab === 'ADMIN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck size={14} />
              <span>Operatör Havuzu (WoZ)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto px-4 py-8">
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-rose-500 hover:text-rose-700 font-bold ml-4">✕</button>
          </div>
        )}

        {/* ----------------- KULLANICI MODU ----------------- */}
        {activeTab === 'USER' && (
          <div className="max-w-2xl mx-auto">
            {step === 'INPUT' && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Ne tür bir hizmet arıyorsunuz?</h2>
                  <p className="text-sm text-slate-600">
                    Form doldurmaya gerek yok. İhtiyacınızı günlük konuşma dilinizle yazın.
                  </p>
                </div>

                <form onSubmit={handleInitialSubmit} className="space-y-4">
                  <textarea
                    rows={4}
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder="Örn: Kadıköy'de acil buz pateni sahası kiralamak istiyorum veya Tarabya'da sıcak pizza siparişi verelim..."
                    className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-800 text-base resize-none"
                    required
                  />

                  <button
                    type="submit"
                    disabled={loading || !queryText.trim()}
                    className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl transition shadow-sm flex items-center justify-center space-x-2"
                  >
                    {loading ? <span>Analiz Ediliyor...</span> : <><span>Devam Et</span><ArrowRight size={18} /></>}
                  </button>
                </form>
              </div>
            )}

            {step === 'DISAMBIGUATE' && disambiguationData && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center space-x-3 text-amber-600 mb-4 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <HelpCircle size={24} className="flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm">Hizmet Netleştirme</h3>
                    <p className="text-xs text-amber-700 mt-0.5">{disambiguationData.message}</p>
                  </div>
                </div>

                <div className="space-y-3 my-6">
                  {disambiguationData.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => { setSelectedDisambiguation(option.text); setStep('CONTACT'); }}
                      className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition flex items-center justify-between group"
                    >
                      <span className="text-slate-800 font-medium group-hover:text-indigo-900">{option.text}</span>
                      <ArrowRight size={18} className="text-slate-400 group-hover:text-indigo-600" />
                    </button>
                  ))}
                  <button
                    onClick={() => { setSelectedDisambiguation(null); setStep('CONTACT'); }}
                    className="w-full text-left p-3 rounded-xl border border-dashed border-slate-300 hover:bg-slate-50 text-slate-500 text-xs transition text-center"
                  >
                    Yazdığım gibi devam et ("{queryText}")
                  </button>
                </div>
              </div>
            )}

            {step === 'CONTACT' && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-1">İletişim Tercihiniz</h2>
                  <p className="text-xs text-slate-500">Servis sağlayıcının sizinle nasıl iletişime geçmesini istersiniz?</p>
                </div>

                <form onSubmit={handleFinalSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Telefon Numaranız</label>
                    <input
                      type="tel"
                      value={contactValue}
                      onChange={(e) => setContactValue(e.target.value)}
                      placeholder="+90 5XX XXX XX XX"
                      className="w-full p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Kanal Tercihi</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPreferredChannel('PHONE')}
                        className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-sm font-medium transition ${
                          preferredChannel === 'PHONE' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <Phone size={18} />
                        <span>Telefon Araması</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreferredChannel('SMS')}
                        className={`p-3 rounded-xl border flex items-center justify-center space-x-2 text-sm font-medium transition ${
                          preferredChannel === 'SMS' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <MessageCircle size={18} />
                        <span>SMS / WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setStep('INPUT')}
                      className="w-1/3 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl text-sm"
                    >
                      Geri
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !contactValue.trim()}
                      className="w-2/3 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl text-sm"
                    >
                      {loading ? 'Gönderiliyor...' : 'Talebi Tamamla'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 'RESULT' && resultData && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
                {resultData.matchedProvider ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
                      <CheckCircle2 size={36} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Eşleşme Sağlandı!</h2>
                    <p className="text-sm text-slate-600 max-w-md mx-auto">{resultData.message}</p>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-sm mt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Servis Sağlayıcı:</span>
                        <span className="font-semibold text-slate-800">{resultData.matchedProvider.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">İletişim Kanalı:</span>
                        <span className="font-semibold text-slate-800">{resultData.matchedProvider.channelUsed}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl mx-auto flex items-center justify-center">
                      <Clock size={36} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Talebiniz Alındı</h2>
                    <p className="text-sm text-slate-600 max-w-md mx-auto">{resultData.message}</p>
                    <div className="inline-block bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-200">
                      Operatör Havuzuna Aktarıldı (Wizard of Oz)
                    </div>
                  </div>
                )}

                <button
                  onClick={handleReset}
                  className="mt-6 inline-flex items-center space-x-2 py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition"
                >
                  <RotateCcw size={16} />
                  <span>Yeni Talep</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ----------------- OPERATÖR / WIZARD OF OZ MODU ----------------- */}
        {activeTab === 'ADMIN' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Operatör Müdahale Havuzu</h2>
                <p className="text-xs text-slate-500">Otomatik eşleşmeyen talepleri servis verenlere manuel yönlendirin.</p>
              </div>
              <button
                onClick={fetchAdminData}
                className="text-xs font-semibold px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700"
              >
                Yenile
              </button>
            </div>

            {adminLoading ? (
              <div className="text-center py-12 text-sm text-slate-500">Kayıtlar yükleniyor...</div>
            ) : pendingRequests.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                <Inbox size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">Bekleyen veya müdahale gerektiren talep yok.</p>
                <p className="text-xs text-slate-400 mt-1">Tüm talepler otomatik olarak eşleştirildi!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          {req.status}
                        </span>
                        <span className="text-xs text-slate-400">Talep #{req.id}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">"{req.raw_text}"</p>
                      <p className="text-xs text-slate-500">
                        İletişim: <span className="font-medium text-slate-700">{req.contact_value}</span> ({req.preferred_channel})
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        onChange={(e) => setSelectedProviderMap({ ...selectedProviderMap, [req.id]: e.target.value })}
                        className="text-xs p-2 border border-slate-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                        defaultValue=""
                      >
                        <option value="" disabled>Servis Veren Seç</option>
                        {providers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Öncelik: {p.priority_score})
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleAssignProvider(req.id)}
                        disabled={!selectedProviderMap[req.id]}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
                      >
                        <UserCheck size={14} />
                        <span>Ata</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        Sms-Contact Platformu © 2026 • MVP Architecture
      </footer>
    </div>
  );
}