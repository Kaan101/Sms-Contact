import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Briefcase, Phone, Mail, Tag, Save, CheckCircle2, Clock, Trash2, X, AlertTriangle, ShieldCheck, PhoneCall, Loader2, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { safeArray, safeString, safeLower, safeUpper, extractAddress, getProviderContactDisplay, extractPhoneForWa, safeDateTime } from '../../../core/utils/helpers';

const MAX_KEYWORD_CHARS = 1000;
const MAX_KEYWORD_COUNT = 50;

export default function ProviderDashboard() {
  const { session, API_BASE } = useAuth();
  
  const [providerProfile, setProviderProfile] = useState(null);
  const [activeRequests, setActiveRequests] = useState([]);
  const [poolRequests, setPoolRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // 🔥 Akordiyon (Açılır/Kapanır) State'leri (Varsayılan olarak açık)
  const [isProfileOpen, setIsProfileOpen] = useState(true);
  const [isActiveTasksOpen, setIsActiveTasksOpen] = useState(true);
  const [isPoolOpen, setIsPoolOpen] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: session?.phone || '',
    email: '',
    serviceKeywords: '',
    communicationChannels: ['PHONE', 'SMS', 'WHATSAPP', 'EMAIL']
  });

  const fetchProviderData = async () => {
    if (!session?.phone) return;
    try {
      const pRes = await axios.get(`${API_BASE}/providers/by-phone?phone=${encodeURIComponent(session.phone)}`);
      const prov = pRes?.data?.provider;
      if (prov) {
        setProviderProfile(prov);
        setFormData(prev => ({
          ...prev,
          name: prov.name || prev.name,
          phone: prov.phone || prev.phone,
          email: prov.email || prev.email,
          serviceKeywords: safeArray(prov.service_keywords).join(', '),
          communicationChannels: safeArray(prov.communication_channels).length ? prov.communication_channels : ['PHONE', 'SMS', 'WHATSAPP', 'EMAIL']
        }));
        
        const [rRes, poolRes] = await Promise.all([
          axios.get(`${API_BASE}/requests/provider-requests?providerId=${prov.id}&phone=${encodeURIComponent(session.phone)}`),
          axios.get(`${API_BASE}/requests/pool?providerId=${prov.id}`)
        ]);
        
        setActiveRequests(safeArray(rRes?.data?.requests));
        setPoolRequests(safeArray(poolRes?.data?.poolRequests));
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchProviderData();
    const interval = setInterval(fetchProviderData, 5000);
    return () => clearInterval(interval);
  }, [session]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.serviceKeywords.trim()) {
      alert("Lütfen firma adı, telefon ve anahtar kelimeleri doldurun.");
      return;
    }
    setLoading(true);
    const keywordsArray = safeString(formData.serviceKeywords).split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email ? formData.email.trim() : null,
      serviceKeywords: keywordsArray.slice(0, MAX_KEYWORD_COUNT),
      communicationChannels: formData.communicationChannels,
      priorityScore: 100
    };

    try {
      if (providerProfile) {
        await axios.put(`${API_BASE}/providers/${providerProfile.id}`, payload);
      } else {
        await axios.post(`${API_BASE}/providers`, payload);
      }
      await fetchProviderData();
      alert("Profil başarıyla kaydedildi!");
    } catch (err) {
      alert(err.response?.data?.message || "Profil kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    setActionLoadingId(requestId);
    try {
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/status`, { newStatus });
      await fetchProviderData();
    } catch (err) {
      alert("İşlem gerçekleştirilemedi.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleJoinPool = async (requestId) => {
    if (!providerProfile) { alert("Önce profilinizi kaydetmelisiniz!"); return; }
    setActionLoadingId(requestId);
    try {
      await axios.post(`${API_BASE}/requests/${requestId}/join-pool`, { providerId: providerProfile.id });
      await fetchProviderData();
      alert("Başarıyla sıraya girdiniz!");
    } catch (err) {
      alert(err.response?.data?.message || "Sıraya girilemedi.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getKeywordMetrics = (text) => {
    const words = safeString(text).split(',').map(w => w.trim()).filter(Boolean);
    return { wordCount: words.length, charCount: text.length };
  };

  const metrics = getKeywordMetrics(formData.serviceKeywords);

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-neutral-950">Sağlayıcı Paneli</h2>
          <p className="text-xs text-neutral-500 mt-0.5">Uzmanlık alanlarınıza göre eşleşen talepleri yönetin ve açık havuzdan iş alın.</p>
        </div>
        {providerProfile && (
          <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-1.5 shadow-xs w-fit">
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
            <span>Aktif Profil: {providerProfile.name}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PROFİL YÖNETİMİ AKORDİYON */}
        <div className="lg:col-span-5 bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300">
          <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="p-4 bg-neutral-50/70 border-b flex items-center justify-between cursor-pointer select-none hover:bg-neutral-100 transition">
            <h3 className="font-bold text-sm text-neutral-900 flex items-center space-x-2">
              <Briefcase size={16} className="text-neutral-700" />
              <span>Firma & Uzmanlık Profili</span>
            </h3>
            <div className="text-neutral-400">{isProfileOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
          </div>
          
          {isProfileOpen && (
            <div className="p-6 space-y-4 animate-in fade-in duration-200">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Firma / Sağlayıcı Adı *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Örn: Yıldız Tesisat" className="w-full p-3 text-xs rounded-xl border outline-none focus:border-neutral-950 bg-neutral-50 font-medium" />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">İletişim Telefonu *</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="0555..." className="w-full p-3 text-xs font-mono rounded-xl border outline-none focus:border-neutral-950 bg-neutral-50 font-medium" />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">E-posta</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="ornek@firma.com" className="w-full p-3 text-xs rounded-xl border outline-none focus:border-neutral-950 bg-neutral-50 font-medium" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-mono uppercase font-semibold text-neutral-500">Anahtar Kelimeler (Uzmanlıklar) *</label>
                    <span className={`text-[10px] font-mono ${metrics.wordCount > MAX_KEYWORD_COUNT ? 'text-rose-600 font-bold' : 'text-neutral-400'}`}>{metrics.wordCount} / {MAX_KEYWORD_COUNT}</span>
                  </div>
                  <textarea rows={4} maxLength={MAX_KEYWORD_CHARS} value={formData.serviceKeywords} onChange={(e) => setFormData({...formData, serviceKeywords: e.target.value})} placeholder="kombi, tamirat, nakliye, daire, tesisat..." className="w-full p-3 text-xs font-mono rounded-xl border outline-none focus:border-neutral-950 bg-neutral-50 resize-none font-medium leading-relaxed" />
                  <span className="text-[10px] text-neutral-400 block mt-1">Hizmet verdiğiniz anahtar kelimeleri virgülle ayırarak yazın.</span>
                </div>

                <button type="submit" disabled={loading || metrics.wordCount > MAX_KEYWORD_COUNT} className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 transition">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{providerProfile ? 'Profili Güncelle' : 'Profili Kaydet'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* TALEPLER VE UYGUN HAVUZ */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* AKTİF GÖREVLERİM AKORDİYON */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300">
            <div onClick={() => setIsActiveTasksOpen(!isActiveTasksOpen)} className="p-4 bg-neutral-50/70 border-b flex items-center justify-between cursor-pointer select-none hover:bg-neutral-100 transition">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center space-x-2">
                <Clock size={16} className="text-emerald-600" />
                <span>Üzerimdeki Görevler & Eşleşmeler ({activeRequests.length})</span>
              </h3>
              <div className="text-neutral-400">{isActiveTasksOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
            </div>

            {isActiveTasksOpen && (
              <div className="p-6 animate-in fade-in duration-200">
                {!providerProfile ? (
                  <div className="text-center text-xs text-neutral-400 py-6">Görevleri görebilmek için önce sol taraftan profilinizi oluşturmalısınız.</div>
                ) : activeRequests.length === 0 ? (
                  <div className="text-center text-xs text-neutral-400 py-6">Şu an üzerinizde aktif bir görev bulunmuyor.</div>
                ) : (
                  <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                    {activeRequests.map((req) => {
                      const reqStatus = safeUpper(req.status);
                      const isActionLoading = actionLoadingId === req.id;
                      const rawContact = safeString(req.contact_value).replace(/\|HIDDEN/gi, '').replace(/\|SHARED/gi, '').trim();
                      const showWhatsApp = safeString(req.preferred_channel).includes('WHATSAPP') && !safeString(req.contact_value).includes('HIDDEN');

                      return (
                        <div key={req.id} className="p-4 bg-neutral-50 rounded-xl border space-y-3 text-xs">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[10px] font-mono text-neutral-400 font-bold">#REQ-{req.id}</span>
                              <h4 className="font-bold text-neutral-950 text-sm mt-0.5">"{req.raw_text}"</h4>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${reqStatus === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{reqStatus}</span>
                          </div>

                          <div className="bg-white border p-3 rounded-xl flex items-center justify-between shadow-xs">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-mono text-neutral-500 uppercase font-semibold">Müşteri İletişim</span>
                              <span className="text-xs font-bold text-neutral-900 mt-0.5">{getProviderContactDisplay(req.contact_value)}</span>
                            </div>
                            {showWhatsApp && (
                               <a href={`https://wa.me/${extractPhoneForWa(rawContact)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold flex items-center space-x-1 shadow-sm transition shrink-0 cursor-pointer">
                                 <MessageCircle size={13} />
                                 <span>Yaz</span>
                               </a>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200">
                            <span className="text-[10px] font-mono text-neutral-500">📍 {extractAddress(req.location)}</span>
                            
                            <div className="flex items-center space-x-2">
                              {reqStatus === 'MATCHED' && (
                                <>
                                  <button disabled={isActionLoading} onClick={() => handleStatusChange(req.id, 'ACCEPTED')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center space-x-1 transition shadow-xs">
                                    {isActionLoading && <Loader2 size={12} className="animate-spin" />}
                                    <span>Kabul Et</span>
                                  </button>
                                  <button disabled={isActionLoading} onClick={() => handleStatusChange(req.id, 'PROVIDER_SKIPPED')} className="px-3.5 py-2 border text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 transition">
                                    Pas Geç
                                  </button>
                                </>
                              )}
                              {reqStatus === 'ACCEPTED' && (
                                <button disabled={isActionLoading} onClick={() => handleStatusChange(req.id, 'PROVIDER_COMPLETED')} className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 transition shadow-sm">
                                  {isActionLoading && <Loader2 size={13} className="animate-spin" />}
                                  <span>{isActionLoading ? 'İşleniyor...' : 'İşi Teslim Et'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* UYGUN HAVUZ AKORDİYON */}
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300">
            <div onClick={() => setIsPoolOpen(!isPoolOpen)} className="p-4 bg-neutral-50/70 border-b flex items-center justify-between cursor-pointer select-none hover:bg-neutral-100 transition">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center space-x-2">
                <Tag size={16} className="text-blue-600" />
                <span>Uzmanlığınıza Uygun Açık Havuz ({poolRequests.length})</span>
              </h3>
              <div className="text-neutral-400">{isPoolOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
            </div>

            {isPoolOpen && (
              <div className="p-6 animate-in fade-in duration-200">
                {!providerProfile ? (
                  <div className="text-center text-xs text-neutral-400 py-6">Uygun havuz işlerini görebilmek için önce profilinizi kaydetmelisiniz.</div>
                ) : poolRequests.length === 0 ? (
                  <div className="text-center text-xs text-neutral-400 py-6">Şu an anahtar kelimelerinizle eşleşen açık havuz talebi bulunmuyor.</div>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {poolRequests.map((req) => {
                      const isActionLoading = actionLoadingId === req.id;
                      return (
                        <div key={req.id} className="p-4 bg-neutral-50 rounded-xl border flex items-center justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-neutral-400 font-bold">#REQ-{req.id}</span>
                            <h4 className="font-bold text-neutral-950 text-sm">"{req.raw_text}"</h4>
                            <span className="text-[10px] font-mono text-neutral-500 block">📍 {extractAddress(req.location)}</span>
                          </div>
                          <button disabled={isActionLoading} onClick={() => handleJoinPool(req.id)} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50 shrink-0 flex items-center space-x-1.5 transition">
                            {isActionLoading && <Loader2 size={13} className="animate-spin" />}
                            <span>Sıraya Gir</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}