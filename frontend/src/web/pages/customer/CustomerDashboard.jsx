import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import { Phone, MessageSquare, Mail, MessageCircle, MapPin, Clock, Shield, Tag, Flame, ChevronDown, ChevronUp, Search, Navigation, Building2, AlertTriangle, ShieldCheck, PhoneCall, SkipForward, Ban, Sparkles, Star, History, Radio, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { safeArray, safeString, safeLower, safeUpper, extractAddress, extractGPS, extractCode, isCodeHiddenReq, cleanContact, extractPhoneForWa, safeDateTime } from '../../../core/utils/helpers';
import { UniversalMapController, SharedMapClickHandler } from '../../components/maps/MapComponents';
import L from 'leaflet';

export default function CustomerDashboard() {
  const { session, API_BASE } = useAuth();
  
  const mapIcons = useMemo(() => ({
    custom: new L.DivIcon({ html: `<div style="margin-top: -32px; margin-left: -16px; filter: drop-shadow(0px 4px 2px rgba(0,0,0,0.3));"><svg width="32" height="32" viewBox="0 0 24 24" fill="#171717" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>`, className: '', iconSize: [0, 0], iconAnchor: [0, 0] })
  }), []);

  const [step, setStep] = useState('INPUT');
  const [queryText, setQueryText] = useState('');
  const [disambiguationData, setDisambiguationData] = useState(null);
  const [preferredChannels, setPreferredChannels] = useState(['PHONE', 'SMS', 'WHATSAPP']);
  const [contactEmail, setContactEmail] = useState('');
  const [locationValue, setLocationValue] = useState('');
  const [coordinates, setCoordinates] = useState(''); 
  const [isUrgent, setIsUrgent] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59'); 
  const [isLocating, setIsLocating] = useState(false);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(true);
  const [isContactShared, setIsContactShared] = useState(false); 
  const [companyCode, setCompanyCode] = useState(() => localStorage.getItem('sc_company_code') || ''); 
  const [isCodeHidden, setIsCodeHidden] = useState(() => localStorage.getItem('sc_is_code_hidden') === 'true'); 
  const [mapPosition, setMapPosition] = useState(null);
  const [mapSearchText, setMapSearchText] = useState('');
  const [isMapSearching, setIsMapSearching] = useState(false);
  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [myCustomerRequests, setMyCustomerRequests] = useState([]);
  const [isActiveCustomerRequestsOpen, setIsActiveCustomerRequestsOpen] = useState(true);
  const [isPendingReviewsOpen, setIsPendingReviewsOpen] = useState(true);
  const [isCustomerHistoryOpen, setIsCustomerHistoryOpen] = useState(false);
  const [searchCustomerHistoryText, setSearchCustomerHistoryText] = useState(''); 
  const [expandedCustomerQueueReqId, setExpandedCustomerQueueReqId] = useState(null);
  const [reviewRatingMap, setReviewRatingMap] = useState({});
  const [reviewCommentMap, setReviewCommentMap] = useState({});
  const [reviewedRequestsMap, setReviewedRequestsMap] = useState({});

  const emailInputRef = useRef(null);
  const mapSearchInputRef = useRef(null);

  const fetchCustomerData = async () => {
    if (!session?.phone) return;
    try {
      const res = await axios.get(`${API_BASE}/requests/my-requests?phone=${encodeURIComponent(session.phone)}`);
      setMyCustomerRequests(safeArray(res?.data?.requests));
    } catch (err) {}
  };

  useEffect(() => {
    fetchCustomerData();
    const interval = setInterval(fetchCustomerData, 5000);
    return () => clearInterval(interval);
  }, [session]);

  const togglePreferredChannel = (channel) => {
    setPreferredChannels((prev) => {
      if (prev.includes(channel)) return prev.length === 1 ? prev : prev.filter((c) => c !== channel);
      return [...prev, channel];
    });
    setErrorMessage('');
  };

  const submitFinalRequest = async (disambiguationChoice) => {
    setLoading(true);
    const deadlineDatetimeISO = deadlineDate ? `${deadlineDate}T${deadlineTime || '23:59'}:00` : null;
    const finalContactValue = preferredChannels.includes('EMAIL') ? `${contactEmail.trim()} (Tel: ${session.phone})` : session.phone;
    const flaggedContactValue = `${finalContactValue}|${isContactShared ? 'SHARED' : 'HIDDEN'}`;
    const channelString = preferredChannels.join(', ');

    let fallbackLoc = 'İstanbul, Türkiye';
    let fallbackCoords = '41.008200, 28.978400';
    
    if (!locationValue) {
       const lastReq = safeArray(myCustomerRequests).find(r => r.location && !r.location.includes('Bilinmiyor') && !r.location.includes('Belirtilmedi'));
       if (lastReq) {
         fallbackLoc = extractAddress(lastReq.location) || fallbackLoc;
         const coords = extractGPS(lastReq.location);
         if (coords) fallbackCoords = `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`;
       }
    }

    let backendLocation = locationValue || fallbackLoc;
    if (coordinates) backendLocation += ` [GPS: ${coordinates}]`;
    else backendLocation += ` [GPS: ${fallbackCoords}]`;
    if (companyCode.trim()) backendLocation += isCodeHidden ? ` [HIDDENCODE: ${companyCode.trim()}]` : ` [CODE: ${companyCode.trim()}]`;

    try {
      await axios.post(`${API_BASE}/requests`, { rawText: queryText, disambiguationChoice, contactValue: flaggedContactValue, preferredChannel: channelString, location: backendLocation, isUrgent, deadlineDatetime: deadlineDatetimeISO });
      setQueryText(''); setSelectedDisambiguation(null); setDeadlineDate(''); setDeadlineTime('23:59'); setContactEmail(''); setLocationValue(''); setCoordinates(''); setPreferredChannels(['PHONE', 'SMS', 'WHATSAPP']); setStep('INPUT'); setIsDetailsCollapsed(true); setMapPosition(null); setMapSearchText(''); setIsUrgent(false); setErrorMessage(''); setIsContactShared(false);
      await fetchCustomerData();
    } catch (err) { setErrorMessage(err.response?.data?.message || 'Talep oluşturulamadı.'); } finally { setLoading(false); }
  };

  const handleCustomerCombinedSubmit = async (e) => {
    e.preventDefault(); if (!queryText.trim()) return;
    if (preferredChannels.includes('EMAIL') && !contactEmail.trim()) { setIsDetailsCollapsed(false); setTimeout(() => emailInputRef.current?.focus(), 100); return; }
    setLoading(true); setErrorMessage('');
    try {
      const response = await axios.post(`${API_BASE}/disambiguate`, { queryText: queryText.trim() });
      if (response?.data?.status === 'ambiguous') { setDisambiguationData(response.data); setStep('DISAMBIGUATE'); setLoading(false); } 
      else await submitFinalRequest(null);
    } catch { await submitFinalRequest(null); }
  };

  const handleStatusChange = async (requestId, newStatus) => { try { await axios.post(`${API_BASE}/requests/${Number(requestId)}/status`, { newStatus }); await fetchCustomerData(); } catch (err) {} };
  const handleCustomerNextProvider = async (requestId) => { try { await axios.post(`${API_BASE}/requests/${Number(requestId)}/next-provider`); await fetchCustomerData(); } catch (err) {} };
  const handleCustomerSelectCandidate = async (requestId, providerId) => { try { await axios.post(`${API_BASE}/requests/${Number(requestId)}/select-candidate`, { providerId: Number(providerId) }); setExpandedCustomerQueueReqId(null); await fetchCustomerData(); } catch (err) {} };
  const handleSendReview = async (requestId, reviewerType, isSkip = false) => { try { const rating = isSkip ? null : (reviewRatingMap[requestId] || 5); const comment = isSkip ? null : (reviewCommentMap[requestId] || ''); await axios.post(`${API_BASE}/reviews`, { requestId: Number(requestId), reviewerType, rating, comment }); setReviewedRequestsMap(prev => ({ ...prev, [`${requestId}_${reviewerType}`]: true })); await fetchCustomerData(); } catch (err) {} };

  const activeCustomerRequests = useMemo(() => safeArray(myCustomerRequests).filter(r => r && ['POOL', 'MATCHED', 'ACCEPTED', 'PROVIDER_COMPLETED', 'MANUAL_INTERVENTION', 'PENDING', 'PROVIDER_SKIPPED'].includes(safeUpper(r.status))), [myCustomerRequests]);
  const pendingReviewCustomerRequests = useMemo(() => safeArray(myCustomerRequests).filter(r => r && safeUpper(r.status) === 'COMPLETED' && !(r.customer_rating !== null || reviewedRequestsMap[`${r.id}_CUSTOMER`])), [myCustomerRequests, reviewedRequestsMap]);
  const pastCustomerRequests = useMemo(() => safeArray(myCustomerRequests).filter(r => r && (safeUpper(r.status) === 'CANCELLED' || (safeUpper(r.status) === 'COMPLETED' && (r.customer_rating !== null || reviewedRequestsMap[`${r.id}_CUSTOMER`])))), [myCustomerRequests, reviewedRequestsMap]);
  const filteredPastCustomerRequests = useMemo(() => safeArray(pastCustomerRequests).filter(req => { const q = safeLower(searchCustomerHistoryText).trim(); if (!q) return true; return safeLower(req.raw_text).includes(q) || safeLower(req.provider_name).includes(q) || safeLower(req.status).includes(q); }), [pastCustomerRequests, searchCustomerHistoryText]);

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      {errorMessage && <div className="w-full p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center justify-between mt-8"><span>{errorMessage}</span><button onClick={() => setErrorMessage('')}><X size={14} /></button></div>}

      {step === 'INPUT' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-3">
          <div className="text-center space-y-1 mb-2"><h2 className="text-xl font-extrabold tracking-tight text-neutral-950">Hangi Hizmete İhtiyacınız Var?</h2><p className="text-xs text-neutral-500">Doğal dil ile talebinizi yazın; açık havuzda en uygun sağlayıcılar sıraya girsin.</p></div>
          <form onSubmit={handleCustomerCombinedSubmit} className="space-y-4">
            <div className="bg-[#FAFBFD] rounded-xl border border-neutral-200 p-3 focus-within:ring-2 focus-within:ring-neutral-950 transition-all">
              <div className="flex gap-2">
                <textarea rows={2} value={queryText} onChange={(e) => setQueryText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleCustomerCombinedSubmit(e); }} placeholder="Örn: Tarabya'da 2+1 kiralık daire arıyorum..." className="w-full p-2 text-lg font-bold text-neutral-900 placeholder:text-neutral-400 bg-transparent border-none outline-none resize-none" required />
                <button type="button" onClick={() => setIsDetailsCollapsed(!isDetailsCollapsed)} className="p-1.5 mt-1 text-neutral-500 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg h-fit"><ChevronDown size={16} /></button>
              </div>
              <div className="flex flex-wrap items-start gap-4 px-2 pb-3 pt-1 text-[11px] font-mono text-neutral-500">
                <div className="flex flex-col leading-tight"><span className="flex items-center space-x-1"><MapPin size={12} className="text-neutral-700"/><span className="truncate max-w-[250px] font-semibold text-neutral-800">{locationValue || 'Konum Seçilmedi'}</span></span></div>
              </div>
              {!isDetailsCollapsed && (
                 <div className="mt-2 pt-5 border-t border-neutral-200/70 flex flex-col md:grid md:grid-cols-5 gap-6">
                    {/* Tüm Gelişmiş Ayarlar (Acil, Konum, İletişim Tercihi vs.) */}
                    <div className="md:col-span-2 space-y-5">
                       <label className={`flex items-center p-2.5 rounded-xl border cursor-pointer select-none transition ${isUrgent ? 'bg-rose-50 border-rose-300' : 'bg-white border-neutral-200'}`}>
                         <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="hidden" />
                         <span className="text-[10px] font-bold">Acil Durum İşaretle</span>
                       </label>
                    </div>
                    <div className="md:col-span-3 flex flex-col pt-4 md:pt-0 min-h-[350px]">
                       <div className="relative w-full h-[300px] flex-1 rounded-xl overflow-hidden border bg-neutral-50">
                         <MapContainer center={mapPosition || [41.0082, 28.9784]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                           <ZoomControl position="bottomleft" />
                           <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                           <UniversalMapController center={mapPosition || [41.0082, 28.9784]} />
                           <SharedMapClickHandler position={mapPosition} setPosition={setMapPosition} setLocationValue={setLocationValue} setCoordinates={setCoordinates} icon={mapIcons?.custom} />
                         </MapContainer>
                       </div>
                    </div>
                 </div>
              )}
              <div className="flex items-center justify-end pt-4 mt-2 border-t border-neutral-200/60 px-1">
                <button type="submit" disabled={loading || !queryText.trim()} className="px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5">{loading ? <span>Gönderiliyor...</span> : <><span>Talebi Gönder</span><ArrowRight size={14} /></>}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* DISAMBIGUATE EKRANI */}
      {step === 'DISAMBIGUATE' && disambiguationData && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
          <div className="text-center"><h3 className="font-extrabold text-lg text-neutral-950">Hizmet Amacını Netleştirelim</h3></div>
          <div className="space-y-2">{safeArray(disambiguationData.options).map((option) => (<button key={option.id} onClick={() => submitFinalRequest(option.text)} className="w-full text-left p-3.5 rounded-xl border hover:bg-neutral-50 text-xs font-semibold">{option.text}</button>))}</div>
        </div>
      )}

      {/* AKTİF TALEPLER */}
      {activeCustomerRequests.length > 0 && (
         <div className="mt-8 space-y-3">
             <div onClick={() => setIsActiveCustomerRequestsOpen(!isActiveCustomerRequestsOpen)} className="flex items-center justify-between cursor-pointer select-none">
                <h3 className="text-sm font-bold text-neutral-700 flex items-center space-x-1.5"><Radio size={16} className="text-emerald-500" /><span>Aktif Talepleriniz ({activeCustomerRequests.length})</span></h3>
             </div>
             {isActiveCustomerRequestsOpen && activeCustomerRequests.map((req) => (
                <div key={req.id} className="bg-[#FAFBFD] rounded-xl border p-4 shadow-sm">
                   <h4 className="text-sm font-bold mt-1.5">"{req.raw_text}"</h4>
                   <span className="text-[10px] font-bold px-2 py-0.5 mt-2 inline-block rounded bg-neutral-200">{req.status}</span>
                   {req.status === 'MATCHED' && <button onClick={() => handleStatusChange(req.id, 'ACCEPTED')} className="mt-3 px-3 py-1.5 bg-neutral-950 text-white text-xs rounded">İşi Onayla</button>}
                   {req.status === 'PROVIDER_COMPLETED' && <button onClick={() => handleStatusChange(req.id, 'COMPLETED')} className="mt-3 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded">Teslim Al</button>}
                </div>
             ))}
         </div>
      )}

      {/* DEĞERLENDİRME BEKLEYENLER & GEÇMİŞ (ÖZETLENDİ) */}
      {pendingReviewCustomerRequests.length > 0 && (
         <div className="mt-8 space-y-3">
             <h3 className="text-sm font-bold text-emerald-700 flex items-center space-x-1.5"><Sparkles size={16} className="text-amber-500" /><span>Değerlendirme Bekleyenler ({pendingReviewCustomerRequests.length})</span></h3>
             {pendingReviewCustomerRequests.map((req) => (
                 <div key={req.id} className="bg-emerald-50 rounded-xl border p-4 shadow-sm"><p className="text-sm font-bold">"{req.raw_text}"</p><button onClick={() => handleSendReview(req.id, 'CUSTOMER', false)} className="mt-3 px-3 py-1.5 bg-neutral-950 text-white text-xs rounded">Puanı Gönder</button></div>
             ))}
         </div>
      )}
    </div>
  );
}