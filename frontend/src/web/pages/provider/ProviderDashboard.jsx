import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { Briefcase, Phone, Mail, Tag, Save, CheckCircle2, Clock, Trash2, X, AlertTriangle, ShieldCheck, PhoneCall, Loader2, MessageCircle, ChevronDown, ChevronUp, History, Timer, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { safeArray, safeString, safeLower, safeUpper, extractAddress, getProviderContactDisplay, extractPhoneForWa, safeDateTime, calculateRemainingTime } from '../../../core/utils/helpers';

const MAX_KEYWORD_CHARS = 1000;
const MAX_KEYWORD_COUNT = 50;

const fetcher = (url) => axios.get(url).then(res => res.data);

export default function ProviderDashboard() {
  const { session, API_BASE } = useAuth();
  
  const { data: rawSettings } = useSWR(`${API_BASE}/settings`, fetcher, { refreshInterval: 60000 });
  const systemSettings = rawSettings?.settings || { pool_lifespan_hours: 72, customer_selection_timeout_mins: 60, provider_completion_timeout_hours: 48, customer_approval_timeout_hours: 24 };

  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isActiveTasksOpen, setIsActiveTasksOpen] = useState(false);
  const [isPoolOpen, setIsPoolOpen] = useState(false);
  const [isPastTasksOpen, setIsPastTasksOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: session?.phone || '',
    email: '',
    serviceKeywords: '',
    communicationChannels: ['PHONE', 'SMS', 'WHATSAPP', 'EMAIL']
  });

  const providerPhoneQuery = session?.phone ? `phone=${encodeURIComponent(session.phone)}` : null;
  const { data: providerRes, mutate: mutateProvider } = useSWR(providerPhoneQuery ? `${API_BASE}/providers/by-phone?${providerPhoneQuery}` : null, fetcher);
  
  useEffect(() => {
     if (providerRes?.provider) {
         const prov = providerRes.provider;
         setProviderProfile(prov);
         setFormData(prev => ({
           ...prev,
           name: prov.name || prev.name,
           phone: prov.phone || prev.phone,
           email: prov.email || prev.email,
           serviceKeywords: safeArray(prov.service_keywords).join(', '),
           communicationChannels: safeArray(prov.communication_channels).length ? prov.communication_channels : ['PHONE', 'SMS', 'WHATSAPP', 'EMAIL']
         }));
     }
  }, [providerRes]);

  const providerIdQuery = providerProfile?.id ? `providerId=${providerProfile.id}` : null;
  
  const { data: providerReqsRes, mutate: mutateProviderReqs } = useSWR(
     providerIdQuery ? `${API_BASE}/requests/provider-requests?${providerIdQuery}&${providerPhoneQuery}` : null, 
     fetcher, 
     { refreshInterval: 5000 }
  );

  const { data: poolRequestsRes, mutate: mutatePoolReq } = useSWR(
     providerIdQuery ? `${API_BASE}/requests/pool?${providerIdQuery}` : null, 
     fetcher, 
     { refreshInterval: 5000 }
  );

  const allProviderReqs = useMemo(() => safeArray(providerReqsRes?.requests), [providerReqsRes]);
  
  const activeRequests = useMemo(() => 
     allProviderReqs.filter(r => r && ['MATCHED', 'ACCEPTED', 'PROVIDER_COMPLETED'].includes(safeUpper(r.status))), 
  [allProviderReqs]);

  const pastRequests = useMemo(() => {
     const past = allProviderReqs.filter(r => r && ['COMPLETED', 'CANCELLED', 'PROVIDER_SKIPPED'].includes(safeUpper(r.status)));
     return past.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [allProviderReqs]);

  const poolRequests = useMemo(() => safeArray(poolRequestsRes?.poolRequests), [poolRequestsRes]);


  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.serviceKeywords.trim()) return;
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
      await mutateProvider();
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = useCallback(async (requestId, newStatus) => {
    setActionLoadingId(requestId);
    try {
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/status`, { newStatus });
      await mutateProviderReqs(); await mutatePoolReq();
    } catch (err) {
    } finally {
      setActionLoadingId(null);
    }
  }, [API_BASE, mutateProviderReqs, mutatePoolReq]);

  const handleJoinPool = useCallback(async (requestId) => {
    if (!providerProfile) return;
    setActionLoadingId(requestId);
    try {
      await axios.post(`${API_BASE}/requests/${requestId}/join-pool`, { providerId: providerProfile.id });
      await mutateProviderReqs(); await mutatePoolReq();
    } catch (err) {
    } finally {
      setActionLoadingId(null);
    }
  }, [API_BASE, providerProfile, mutateProviderReqs, mutatePoolReq]);

  const handlePoolSkip = useCallback(async (requestId) => {
    setActionLoadingId(requestId);
    try {
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/status`, { newStatus: 'PROVIDER_SKIPPED' });
      await mutateProviderReqs(); await mutatePoolReq();
    } catch (err) {
    } finally {
      setActionLoadingId(null);
    }
  }, [API_BASE, mutateProviderReqs, mutatePoolReq]);

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
                </div>

                <button type="submit" disabled={loading || metrics.wordCount > MAX_KEYWORD_COUNT} className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50 transition">
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{providerProfile ? 'Profili Güncelle' : 'Profili Kaydet'}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="lg:col-span-7 space-y-6">
          
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
                      const reqStatus = safeUpper(req.status) || 'POOL';
                      const isActionLoading = actionLoadingId === req.id;
                      
                      const forceRevealContact = ['ACCEPTED', 'PROVIDER_COMPLETED'].includes(reqStatus); 
                      const rawContact = safeString(req.contact_value).replace(/\|HIDDEN/gi, '').replace(/\|SHARED/gi, '').trim();
                      const isHiddenPreference = safeString(req.contact_value).includes('HIDDEN');
                      
                      const displayContact = forceRevealContact 
                      ? rawContact 
                      : '*** ** ** (İşi Kabul Edince Açılacak)';
                      
                      const showWhatsApp = safeString(req.preferred_channel).includes('WHATSAPP') && (forceRevealContact || !isHiddenPreference);

                      let timerDisplay = null;
                      let isTimerCritical = false;
                      const refDate = req.updated_at || req.created_at || new Date().toISOString();

                      if (reqStatus === 'MATCHED') {
                          const selectLimit = Number(systemSettings?.customer_selection_timeout_mins) || 60;
                          const remaining = calculateRemainingTime(refDate, selectLimit, 'mins');
                          if (remaining) {
                              timerDisplay = `Seçim Bekleniyor: ${remaining}`;
                              isTimerCritical = remaining === "Süresi Doldu" || (parseInt(remaining) < 15 && remaining.includes("dk") && !remaining.includes("saat"));
                          }
                      } else if (reqStatus === 'ACCEPTED') {
                          const completionLimit = Number(systemSettings?.provider_completion_timeout_hours) || 48;
                          const remaining = calculateRemainingTime(refDate, completionLimit, 'hours');
                          if (remaining) {
                              timerDisplay = `Teslimat Kalan: ${remaining}`;
                              isTimerCritical = remaining === "Süresi Doldu" || (remaining.includes("dk") && !remaining.includes("saat"));
                          }
                      } else if (reqStatus === 'PROVIDER_COMPLETED') {
                          const approvalLimit = Number(systemSettings?.customer_approval_timeout_hours) || 24;
                          const remaining = calculateRemainingTime(refDate, approvalLimit, 'hours');
                          if (remaining) {
                             timerDisplay = `Müşteri Onayı: ${remaining}`;
                          }
                      }

                      return (
                        <div key={req.id} className="p-4 bg-neutral-50 rounded-xl border space-y-3 text-xs">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-mono text-neutral-400 font-bold">#REQ-{req.id}</span>
                                {req.created_at && <span className="text-[10px] font-mono text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-bold">⏰ {safeDateTime(req.created_at)}</span>}
                              </div>
                              <h4 className="font-bold text-neutral-950 text-sm mt-1">"{req.raw_text}"</h4>
                            </div>
                            
                            <div className="flex flex-col items-end space-y-1.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${reqStatus === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{reqStatus}</span>
                                {timerDisplay && (
                                   <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${isTimerCritical ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                      {isTimerCritical ? <AlertCircle size={10} /> : <Timer size={10} />}
                                      <span>{timerDisplay}</span>
                                   </div>
                                )}
                            </div>
                          </div>

                          <div className="bg-white border p-3 rounded-xl flex items-center justify-between shadow-xs">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-mono text-neutral-500 uppercase font-semibold">Müşteri İletişim</span>
                              <span className={`text-xs font-bold mt-0.5 ${forceRevealContact ? 'text-neutral-900' : 'text-neutral-400'}`}>{displayContact}</span>
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
                                <>
                                  <button disabled={isActionLoading} onClick={() => handleStatusChange(req.id, 'PROVIDER_COMPLETED')} className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 transition shadow-sm">
                                    {isActionLoading && <Loader2 size={13} className="animate-spin" />}
                                    <span>{isActionLoading ? 'İşleniyor...' : 'İşi Teslim Et'}</span>
                                  </button>
                                  <button disabled={isActionLoading} onClick={() => handleStatusChange(req.id, 'PROVIDER_SKIPPED')} className="px-4 py-2 border text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 flex items-center space-x-1 transition">
                                    {isActionLoading && <Loader2 size={13} className="animate-spin" />}
                                    <span>Pas Geç</span>
                                  </button>
                                </>
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
                      
                      // --- HAVUZ İÇİN SAYAÇ MANTIĞI EKLENDİ ---
                      let timerDisplay = null;
                      let isTimerCritical = false;
                      const poolLimit = Number(systemSettings?.pool_lifespan_hours) || 72;
                      const remaining = calculateRemainingTime(req.created_at, poolLimit, 'hours');
                      
                      if (remaining) {
                        timerDisplay = `Kapanış: ${remaining}`;
                        isTimerCritical = remaining === "Süresi Doldu" || (remaining.includes("dk") && !remaining.includes("saat"));
                      }

                      return (
                        <div key={req.id} className="p-4 bg-neutral-50 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-1.5 w-full sm:w-auto flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-mono text-neutral-400 font-bold">#REQ-{req.id}</span>
                              {req.created_at && <span className="text-[10px] font-mono text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-bold">⏰ {safeDateTime(req.created_at)}</span>}
                              
                              {/* EKLENEN SAYAÇ GÖRÜNÜMÜ */}
                              {timerDisplay && (
                                 <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${isTimerCritical ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                    {isTimerCritical ? <AlertCircle size={10} /> : <Timer size={10} />}
                                    <span>{timerDisplay}</span>
                                 </div>
                              )}
                            </div>
                            <h4 className="font-bold text-neutral-950 text-sm mt-0.5">"{req.raw_text}"</h4>
                            <span className="text-[10px] font-mono text-neutral-500 block">📍 {extractAddress(req.location)}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2 shrink-0 mt-2 sm:mt-0">
                            <button disabled={isActionLoading} onClick={() => handleJoinPool(req.id)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 transition">
                              {isActionLoading && <Loader2 size={12} className="animate-spin" />}
                              <span>Sıraya Gir</span>
                            </button>
                            <button disabled={isActionLoading} onClick={() => handlePoolSkip(req.id)} className="px-3.5 py-2 border text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 transition">
                              Pas Geç
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300">
            <div onClick={() => setIsPastTasksOpen(!isPastTasksOpen)} className="p-4 bg-neutral-50/70 border-b flex items-center justify-between cursor-pointer select-none hover:bg-neutral-100 transition">
              <h3 className="font-bold text-sm text-neutral-900 flex items-center space-x-2">
                <History size={16} className="text-neutral-600" />
                <span>Geçmiş Talepler ({pastRequests.length})</span>
              </h3>
              <div className="text-neutral-400">{isPastTasksOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
            </div>

            {isPastTasksOpen && (
              <div className="p-6 animate-in fade-in duration-200">
                {!providerProfile ? (
                  <div className="text-center text-xs text-neutral-400 py-6">Geçmiş talepleri görebilmek için önce profilinizi kaydetmelisiniz.</div>
                ) : pastRequests.length === 0 ? (
                  <div className="text-center text-xs text-neutral-400 py-6">Henüz geçmiş bir talebiniz bulunmuyor.</div>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {pastRequests.map((req) => {
                      const reqStatus = safeUpper(req.status);
                      return (
                        <div key={req.id} className="p-3.5 bg-neutral-50 rounded-xl border space-y-2 text-xs">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-mono text-neutral-400 font-bold">#REQ-{req.id}</span>
                                {req.created_at && <span className="text-[10px] font-mono text-neutral-500 bg-neutral-200 px-1.5 py-0.5 rounded font-semibold">⏰ {safeDateTime(req.created_at)}</span>}
                              </div>
                              <h4 className="font-semibold text-neutral-900 text-sm mt-1">"{req.raw_text}"</h4>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono ${reqStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : reqStatus === 'CANCELLED' ? 'bg-rose-100 text-rose-800' : 'bg-neutral-200 text-neutral-700'}`}>
                              {reqStatus === 'PROVIDER_SKIPPED' ? 'PAS GEÇİLDİ' : reqStatus}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-200">
                            <span>📍 {extractAddress(req.location)}</span>
                          </div>
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