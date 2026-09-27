import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useSWR from 'swr';
import { 
  Phone, MessageSquare, Mail, MessageCircle, MapPin, Clock, Shield, Tag, 
  Flame, ChevronDown, ChevronUp, Search, Navigation, Building2, AlertTriangle, 
  ShieldCheck, PhoneCall, SkipForward, Ban, Sparkles, Star, History, Radio, 
  ArrowRight, X, Check, Calendar, Loader2, Timer, AlertCircle,
  FileText, Bell
} from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { 
  safeArray, safeString, safeLower, safeUpper, extractAddress, extractGPS, 
  extractCode, isCodeHiddenReq, cleanContact, extractPhoneForWa, safeDateTime, calculateRemainingTime 
} from '../../../core/utils/helpers';
import { UniversalMapController, SharedMapClickHandler } from '../../components/maps/MapComponents';

const fetcher = (url) => axios.get(url).then(res => res.data);

export default function CustomerDashboard() {
  const { session, API_BASE } = useAuth();
  
  const { data: rawSettings } = useSWR(`${API_BASE}/settings`, fetcher, { refreshInterval: 60000 });
  const systemSettings = rawSettings?.settings || { pool_lifespan_hours: 72, customer_selection_timeout_mins: 60, provider_completion_timeout_hours: 48, customer_approval_timeout_hours: 24 };

  const mapIcons = useMemo(() => ({
    custom: new L.DivIcon({ html: `<div style="margin-top: -32px; margin-left: -16px; filter: drop-shadow(0px 4px 2px rgba(0,0,0,0.3));"><svg width="32" height="32" viewBox="0 0 24 24" fill="#171717" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>`, className: '', iconSize: [0, 0], iconAnchor: [0, 0] })
  }), []);

  const [step, setStep] = useState('INPUT');
  const [queryText, setQueryText] = useState('');
  const [disambiguationData, setDisambiguationData] = useState(null);
  
  const [requestType, setRequestType] = useState('TALEP');
  
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
  
  const [companyCode, setCompanyCode] = useState(() => { try { return localStorage.getItem('sc_company_code') || ''; } catch { return ''; }}); 
  const [isCodeHidden, setIsCodeHidden] = useState(() => { try { return localStorage.getItem('sc_is_code_hidden') === 'true'; } catch { return false; }}); 

  useEffect(() => { localStorage.setItem('sc_company_code', companyCode); }, [companyCode]);
  useEffect(() => { localStorage.setItem('sc_is_code_hidden', isCodeHidden); }, [isCodeHidden]);

  const [mapPosition, setMapPosition] = useState(null);
  const [mapSearchText, setMapSearchText] = useState('');
  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
  const [isActiveCustomerRequestsOpen, setIsActiveCustomerRequestsOpen] = useState(true);
  const [isPendingReviewsOpen, setIsPendingReviewsOpen] = useState(true);
  const [isCustomerHistoryOpen, setIsCustomerHistoryOpen] = useState(false);
  
  const [searchCustomerHistoryText, setSearchCustomerHistoryText] = useState(''); 
  const [expandedCustomerQueueReqId, setExpandedCustomerQueueReqId] = useState(null);
  const [expandedProviderReviewId, setExpandedProviderReviewId] = useState(null); 

  const [reviewRatingsMap, setReviewRatingsMap] = useState({});
  const [reviewCommentMap, setReviewCommentMap] = useState({});
  const [reviewedRequestsMap, setReviewedRequestsMap] = useState({});

 
  const emailInputRef = useRef(null);
  const mapSearchInputRef = useRef(null);

  const customerPhoneQuery = session?.phone ? `phone=${encodeURIComponent(session.phone)}` : null;
  const { data: customerRequestsRes, mutate: mutateCustomerReqs } = useSWR(
     customerPhoneQuery ? `${API_BASE}/requests/my-requests?${customerPhoneQuery}` : null, 
     fetcher, 
     { refreshInterval: 5000 }
  );
  
  const myCustomerRequests = useMemo(() => safeArray(customerRequestsRes?.requests), [customerRequestsRes]);

  const applyFallbackLocation = (pastRequests) => {
    const validReq = safeArray(pastRequests).find(r => r.location && !r.location.includes('Bilinmiyor') && !r.location.includes('Belirtilmedi'));
    if (validReq) {
      setLocationValue(extractAddress(validReq.location) || 'İstanbul, Türkiye');
      const coords = extractGPS(validReq.location);
      if (coords) {
        setMapPosition({ lat: coords[0], lng: coords[1] });
        setCoordinates(`${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`);
      } else {
        setMapPosition({ lat: 41.0082, lng: 28.9784 });
        setCoordinates('41.008200, 28.978400');
      }
    } else {
      setLocationValue('İstanbul, Türkiye');
      setMapPosition({ lat: 41.0082, lng: 28.9784 });
      setCoordinates('41.008200, 28.978400');
    }
    setIsLocating(false);
  };

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) { applyFallbackLocation(myCustomerRequests); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          setMapPosition({ lat: latitude, lng: longitude });
          setCoordinates(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`);
          const addr = geoRes?.data?.address || {};
          const district = addr.suburb || addr.district || addr.town || addr.city_district || '';
          const city = addr.city || addr.province || '';
          setLocationValue(`${district}, ${city}`.replace(/^,\s*/, ''));
        } catch { setLocationValue(`Haritadan İşaretlendi`); } finally { setIsLocating(false); }
      },
      (err) => { applyFallbackLocation(myCustomerRequests); },
      { timeout: 6000 }
    );
  };

  useEffect(() => {
    if (step === 'INPUT' && !mapPosition && !isLocating) fetchCurrentLocation();
  }, [step]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (mapSearchText.length > 2) {
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchText)}&limit=5&countrycodes=tr`);
          setMapSuggestions(safeArray(res?.data));
          if (mapSearchInputRef.current === document.activeElement) setIsSuggestionsVisible(true);
        } catch (err) {}
      } else {
        setMapSuggestions([]); setIsSuggestionsVisible(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [mapSearchText]);

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
      await axios.post(`${API_BASE}/requests`, { rawText: queryText, disambiguationChoice, contactValue: flaggedContactValue, preferredChannel: channelString, location: backendLocation, isUrgent, deadlineDatetime: deadlineDatetimeISO, requestType });
      
      setQueryText(''); setDeadlineDate(''); setDeadlineTime('23:59'); setContactEmail(''); setLocationValue(''); setCoordinates(''); setPreferredChannels(['PHONE', 'SMS', 'WHATSAPP']); setStep('INPUT'); setIsDetailsCollapsed(true); setMapPosition(null); setMapSearchText(''); setIsUrgent(false); setErrorMessage(''); setIsContactShared(false); setRequestType('TALEP');
      await mutateCustomerReqs();
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

  const handleStatusChange = async (requestId, newStatus) => { 
    setActionLoadingId(requestId);
    try { 
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/status`, { newStatus }); 
      await mutateCustomerReqs(); 
    } catch (err) {
      alert('İşlem gerçekleştirilemedi.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCustomerNextProvider = async (requestId) => { 
    setActionLoadingId(requestId);
    try { 
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/next-provider`); 
      await mutateCustomerReqs(); 
    } catch (err) {
      alert('İşlem gerçekleştirilemedi.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCustomerSelectCandidate = async (requestId, providerId) => { 
    setActionLoadingId(requestId);
    try { 
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/select-candidate`, { providerId: Number(providerId) }); 
      setExpandedCustomerQueueReqId(null); 
      await mutateCustomerReqs(); 
    } catch (err) {
      alert('İşlem gerçekleştirilemedi.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteRequest = async (requestId) => { 
    if (!window.confirm('Bu talebi iptal etmek istediğinize emin misiniz?')) return;
    setActionLoadingId(requestId);
    try { 
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/status`, { newStatus: 'CANCELLED' }); 
      await mutateCustomerReqs(); 
    } catch (err) {
      alert('İşlem gerçekleştirilemedi.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSendReview = async (requestId, reviewerType, isSkip = false) => { 
    setActionLoadingId(requestId);
    try { 
      const currentRatings = isSkip ? null : (reviewRatingsMap[requestId] || { knowledge: 5, communication: 5, timing: 5, cost: 5 }); 
      const comment = isSkip ? null : (reviewCommentMap[requestId] || ''); 
      await axios.post(`${API_BASE}/reviews`, { requestId: Number(requestId), reviewerType, ratings: currentRatings, comment }); 
      setReviewedRequestsMap(prev => ({ ...prev, [`${requestId}_${reviewerType}`]: true })); 
      await mutateCustomerReqs(); 
    } catch (err) {
      alert('Değerlendirme gönderilemedi.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getRatingsForReq = (id) => reviewRatingsMap[id] || { knowledge: 5, communication: 5, timing: 5, cost: 5 };
  const updateSpecificRating = (id, field, value) => {
      setReviewRatingsMap(prev => ({ ...prev, [id]: { ...getRatingsForReq(id), [field]: value } }));
  };

  const activeCustomerRequests = useMemo(() => safeArray(myCustomerRequests).filter(r => r && ['POOL', 'MATCHED', 'ACCEPTED', 'PROVIDER_COMPLETED', 'MANUAL_INTERVENTION', 'PENDING', 'PROVIDER_SKIPPED'].includes(safeUpper(r.status))), [myCustomerRequests]);
  const pendingReviewCustomerRequests = useMemo(() => safeArray(myCustomerRequests).filter(r => r && safeUpper(r.status) === 'COMPLETED' && !(r.customer_rating !== null || reviewedRequestsMap[`${r.id}_CUSTOMER`])), [myCustomerRequests, reviewedRequestsMap]);
  const pastCustomerRequests = useMemo(() => safeArray(myCustomerRequests).filter(r => r && (safeUpper(r.status) === 'CANCELLED' || (safeUpper(r.status) === 'COMPLETED' && (r.customer_rating !== null || reviewedRequestsMap[`${r.id}_CUSTOMER`])))), [myCustomerRequests, reviewedRequestsMap]);
  const filteredPastCustomerRequests = useMemo(() => safeArray(pastCustomerRequests).filter(req => { const q = safeLower(searchCustomerHistoryText).trim(); if (!q) return true; return safeLower(req.raw_text).includes(q) || safeLower(req.provider_name).includes(q) || safeLower(req.status).includes(q); }), [pastCustomerRequests, searchCustomerHistoryText]);

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 px-6 py-8">
      {errorMessage && <div className="w-full p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center justify-between mt-8"><span>{errorMessage}</span><button onClick={() => setErrorMessage('')} className="cursor-pointer"><X size={14} /></button></div>}

      {/* YENİ TALEP FORMU */}
      {step === 'INPUT' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-3">
          <div className="text-center space-y-1 mb-2"><h2 className="text-xl font-extrabold tracking-tight text-neutral-950">Hangi Hizmete İhtiyacınız Var?</h2><p className="text-xs text-neutral-500">Doğal dil ile talebinizi yazın; açık havuzda en uygun sağlayıcılar sıraya girsin.</p></div>
          <form onSubmit={handleCustomerCombinedSubmit} className="space-y-4">
            <div className="bg-[#FAFBFD] rounded-xl border border-neutral-200 p-3 focus-within:ring-2 focus-within:ring-neutral-950 transition-all">
              
              <div className="flex gap-2">
                <textarea rows={2} value={queryText} onChange={(e) => setQueryText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleCustomerCombinedSubmit(e); }} placeholder="Örn: Tarabya'da 2+1 kiralık daire arıyorum..." className="w-full p-2 text-lg font-bold text-neutral-900 placeholder:text-neutral-400 bg-transparent border-none outline-none resize-none" required />
                <button type="button" onClick={() => setIsDetailsCollapsed(!isDetailsCollapsed)} className="p-1.5 mt-1 text-neutral-500 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg h-fit cursor-pointer"><ChevronDown size={16} /></button>
              </div>
              
              <div className="flex flex-wrap items-start gap-4 px-2 pb-3 pt-1 text-[11px] font-mono text-neutral-500">
                <div className="flex flex-col leading-tight"><span className="flex items-center space-x-1"><MapPin size={12} className="text-neutral-700"/><span className="truncate max-w-[250px] sm:max-w-[300px] font-semibold text-neutral-800">{locationValue || 'Konum Seçilmedi'}</span></span>{coordinates && <span className="pl-4 text-[9.5px] mt-0.5 text-neutral-400 tracking-wide">{coordinates}</span>}</div>
                <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
                  
                  <span className="font-bold px-2 py-0.5 rounded border flex items-center gap-1 bg-white shadow-sm text-neutral-800 border-neutral-200">
                    {requestType === 'TALEP' ? <FileText size={11} className="text-blue-600" /> : <Bell size={11} className="text-amber-500" />}
                    {requestType === 'TALEP' ? 'Talep' : 'Bildirim'}
                  </span>
                  
                  {isUrgent && <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">ACİL</span>}
                  {deadlineDate && <span className="flex items-center space-x-1"><Clock size={12}/><span>{deadlineDate} {deadlineTime}</span></span>}
                  {companyCode && (<span className={`font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${isCodeHidden ? 'bg-neutral-100 text-neutral-600 border-neutral-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>{isCodeHidden ? <Shield size={10}/> : <Tag size={10}/>} KOD: {companyCode} {isCodeHidden ? '(Gizli)' : ''}</span>)}
                  <div className="flex items-center space-x-2 border-l border-neutral-200 pl-2">
                    {preferredChannels.map((c, idx) => (
                      <React.Fragment key={c}>
                        <span className="flex items-center space-x-1">{c === 'PHONE' && <Phone size={11} />}{c === 'SMS' && <MessageSquare size={11} />}{c === 'EMAIL' && <Mail size={11} />}{c === 'WHATSAPP' && <MessageCircle size={11} />}<span>{c === 'PHONE' ? 'Telefon' : c === 'SMS' ? 'SMS' : c === 'EMAIL' ? 'E-posta' : 'WhatsApp'}</span></span>
                        {idx < preferredChannels.length - 1 && <span className="text-neutral-300">•</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end pt-1 pb-1 px-1 relative z-10">
                <button type="submit" disabled={loading || !queryText.trim()} className="px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50">{loading ? <><span>Gönderiliyor...</span><Loader2 size={14} className="animate-spin" /></> : <><span>Talebi Gönder</span><ArrowRight size={14} /></>}</button>
              </div>

              {!isDetailsCollapsed && (
                 <div className="mt-3 pt-5 border-t border-neutral-200/70 flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-5/12 space-y-5">
                       
                       <div className="space-y-2">
                         <label className="text-[11px] font-mono uppercase font-semibold text-neutral-500 block mb-1.5">Kayıt Türü</label>
                         <div className="flex bg-neutral-100/80 p-1 rounded-xl border border-neutral-200/60">
                           {[
                             { id: 'TALEP', label: 'Talep', icon: FileText },
                             { id: 'BILDIRIM', label: 'Bildirim', icon: Bell }
                           ].map(item => (
                             <button
                               key={item.id}
                               type="button"
                               onClick={() => setRequestType(item.id)}
                               className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${requestType === item.id ? 'bg-white text-neutral-950 shadow-sm border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-700'}`}
                             >
                               <item.icon size={14} className={requestType === item.id ? (item.id === 'TALEP' ? 'text-blue-600' : 'text-amber-500') : ''} />
                               <span>{item.label}</span>
                             </button>
                           ))}
                         </div>
                       </div>

                       <div>
                           <label className="text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1.5 flex items-center justify-between"><span className="flex items-center space-x-1"><Calendar size={12} className="text-neutral-700"/><span>Zamanlama</span></span>{deadlineDate && <button type="button" onClick={() => {setDeadlineDate(''); setDeadlineTime('23:59');}} className="text-[10px] text-rose-500 hover:underline lowercase cursor-pointer">temizle</button>}</label>
                           <div className="flex items-center gap-2"><input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} className="flex-1 min-w-0 p-2 text-xs font-mono rounded-lg border outline-none focus:border-neutral-950 transition" /><input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} className="w-20 p-2 text-xs font-mono rounded-lg border outline-none focus:border-neutral-950 text-center shrink-0 transition" title="En Son Saat" /></div>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[11px] font-mono uppercase font-semibold text-neutral-500 block mb-1.5">İletişim Tercihi</label>
                         <div className="grid grid-cols-2 gap-2">
                           <button type="button" onClick={() => togglePreferredChannel('PHONE')} className={`p-2 rounded-lg border text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${preferredChannels.includes('PHONE') ? 'border-neutral-950 bg-neutral-950 text-white' : 'bg-white hover:bg-neutral-50 text-neutral-700'}`}><Phone size={13} /><span>Telefon</span></button>
                           <button type="button" onClick={() => togglePreferredChannel('SMS')} className={`p-2 rounded-lg border text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${preferredChannels.includes('SMS') ? 'border-neutral-950 bg-neutral-950 text-white' : 'bg-white hover:bg-neutral-50 text-neutral-700'}`}><MessageSquare size={13} /><span>SMS</span></button>
                           <button type="button" onClick={() => togglePreferredChannel('EMAIL')} className={`p-2 rounded-lg border text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${preferredChannels.includes('EMAIL') ? 'border-neutral-950 bg-neutral-950 text-white' : 'bg-white hover:bg-neutral-50 text-neutral-700'}`}><Mail size={13} /><span>E-posta</span></button>
                           <button type="button" onClick={() => togglePreferredChannel('WHATSAPP')} className={`p-2 rounded-lg border text-xs flex items-center justify-center space-x-1.5 transition cursor-pointer ${preferredChannels.includes('WHATSAPP') ? 'border-emerald-700 bg-emerald-700 text-white' : 'bg-white hover:bg-neutral-50 text-neutral-700'}`}><MessageCircle size={13} /><span>WhatsApp</span></button>
                         </div>
                         {preferredChannels.includes('EMAIL') && (<div className="animate-in fade-in duration-150 pt-1"><input ref={emailInputRef} type="email" required value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); if (errorMessage) setErrorMessage(''); }} placeholder="E-posta Adresiniz..." className="w-full p-2 text-xs rounded-lg border border-neutral-200 outline-none bg-white focus:border-neutral-950 font-medium" /></div>)}
                       </div>
                       <div className="grid grid-cols-2 gap-3 pt-2">
                         <label className={`flex items-center p-2.5 rounded-xl border cursor-pointer select-none transition ${isContactShared ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'}`}><input type="checkbox" checked={isContactShared} onChange={(e) => setIsContactShared(e.target.checked)} className="hidden" /><div className="flex items-center space-x-2"><Shield size={16} className={`shrink-0 ${isContactShared ? 'text-blue-600' : 'text-neutral-400'}`} /><div className="flex flex-col"><span className={`text-[10px] font-bold leading-tight ${isContactShared ? 'text-blue-800' : 'text-neutral-700'}`}>Hemen Paylaş</span><span className="text-[8px] text-neutral-500 font-mono mt-0.5 leading-tight">Gizli Mod Kapalı</span></div></div></label>
                         <label className={`flex items-center p-2.5 rounded-xl border cursor-pointer select-none transition ${isUrgent ? 'bg-rose-50 border-rose-300 shadow-sm' : 'bg-white border-neutral-200 hover:bg-neutral-50'}`}><input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="hidden" /><div className="flex items-center space-x-2 w-full justify-center"><Flame size={18} className={isUrgent ? 'text-rose-600 animate-bounce shrink-0' : 'text-neutral-400 shrink-0'} /><div className="flex flex-col text-center"><span className={`text-[10px] font-bold leading-tight ${isUrgent ? 'text-rose-700' : 'text-neutral-700'}`}>ACİL DURUM</span><span className={`text-[8px] font-mono mt-0.5 leading-tight ${isUrgent ? 'text-rose-600 font-semibold' : 'text-neutral-500'}`}>Kırmızı Kod</span></div></div></label>
                       </div>
                       <div className="pt-1">
                          <label className="text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1.5 flex items-center justify-between"><span>Grup / Kurum Kodu (Opsiyonel)</span><label className="flex items-center space-x-1 cursor-pointer"><input type="checkbox" checked={isCodeHidden} onChange={e => setIsCodeHidden(e.target.checked)} className="rounded text-neutral-900" /><span className="text-[10px] font-bold text-neutral-700 normal-case">Gizli Tut</span></label></label>
                          <div className="relative"><Tag size={14} className="absolute left-3 top-2.5 text-neutral-400" /><input type="text" value={companyCode} onChange={e => setCompanyCode(e.target.value.toUpperCase())} placeholder="Örn: MOB-2026" className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-neutral-200 outline-none bg-white focus:border-neutral-950 font-medium transition uppercase" /></div>
                       </div>
                    </div>
                    
                    <div className="w-full md:w-7/12 flex flex-col pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-neutral-100 md:pl-6 min-h-[350px]">
                       <div className="flex items-center justify-between mb-2"><span className="text-[11px] font-mono uppercase font-semibold text-neutral-500 flex items-center space-x-1"><MapPin size={12} className="text-neutral-700" /><span>Haritadan Konum Seçin</span></span><button type="button" onClick={fetchCurrentLocation} disabled={isLocating} className="text-[10px] font-mono text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 transition cursor-pointer"><Navigation size={10} className={isLocating ? 'animate-spin' : ''} /> <span>Mevcut Konuma Git</span></button></div>
                       
                       <div className="relative w-full h-[350px] md:h-full md:min-h-[350px] rounded-xl overflow-hidden border border-neutral-300 z-0 bg-neutral-50 shadow-inner mt-1">
                          <div className="absolute top-2 left-2 right-2 z-[1000]">
                             <div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-neutral-400" /><input ref={mapSearchInputRef} type="text" value={mapSearchText} onChange={(e) => setMapSearchText(e.target.value)} onFocus={() => { if(mapSuggestions.length > 0) setIsSuggestionsVisible(true); }} onBlur={() => setTimeout(() => setIsSuggestionsVisible(false), 200)} placeholder="Haritada mekan veya adres ara..." className="w-full pl-8 pr-8 py-2 text-xs rounded-lg border-none outline-none focus:ring-2 focus:ring-neutral-900 shadow-md bg-white/90 backdrop-blur-sm transition" /></div>
                             {mapSuggestions.length > 0 && (
                               <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-[9999]">
                                  {mapSuggestions.map((sug, idx) => (<div key={idx} className="p-2.5 text-xs text-neutral-700 hover:bg-blue-50 cursor-pointer flex items-start space-x-2 transition" onMouseDown={(e) => { e.preventDefault(); const newPos = { lat: parseFloat(sug.lat), lng: parseFloat(sug.lon) }; setMapPosition(newPos); setCoordinates(`${newPos.lat.toFixed(6)}, ${newPos.lng.toFixed(6)}`); setLocationValue(sug.display_name); setMapSearchText(''); }}><MapPin size={12} className="text-neutral-400 mt-0.5 shrink-0" /><span>{sug.display_name}</span></div>))}
                               </div>
                             )}
                          </div>
                          
                          <div className="absolute inset-0 z-0">
                            <MapContainer center={mapPosition || [41.0082, 28.9784]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                              <ZoomControl position="bottomleft" />
                              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                              <UniversalMapController center={mapPosition || [41.0082, 28.9784]} />
                              <SharedMapClickHandler position={mapPosition} setPosition={setMapPosition} setLocationValue={setLocationValue} setCoordinates={setCoordinates} icon={mapIcons?.custom} />
                            </MapContainer>
                          </div>
                       </div>
                    </div>
                 </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* DISAMBIGUATE EKRANI */}
      {step === 'DISAMBIGUATE' && disambiguationData && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
          <div className="text-center"><h3 className="font-extrabold text-lg text-neutral-950">Hizmet Amacını Netleştirelim</h3></div>
          <div className="space-y-2">{safeArray(disambiguationData.options).map((option) => (<button key={option.id} onClick={() => submitFinalRequest(option.text)} className="w-full text-left p-3.5 rounded-xl border hover:bg-neutral-50 text-xs font-semibold cursor-pointer">{option.text}</button>))}</div>
        </div>
      )}

      {/* AKTİF TALEPLER VE KUYRUK YÖNETİMİ */}
      {activeCustomerRequests.length > 0 && (
         <div className="mt-8 space-y-3 transition-all duration-300">
             <div onClick={() => setIsActiveCustomerRequestsOpen(!isActiveCustomerRequestsOpen)} className="flex items-center justify-between cursor-pointer select-none">
                <h3 className="text-sm font-bold text-neutral-700 flex items-center space-x-1.5"><Radio size={16} className="text-emerald-500 animate-pulse" /><span>Aktif Talepleriniz ({activeCustomerRequests.length})</span></h3>
                <div className="text-neutral-400">{isActiveCustomerRequestsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
             </div>
             {isActiveCustomerRequestsOpen && (
               <div className="space-y-3">
                 {activeCustomerRequests.map((req) => {
                    const reqStatus = safeUpper(req.status) || 'POOL';
                    const reqCode = extractCode(req.location);
                    const isHidden = isCodeHiddenReq(req.location);
                    const isActionLoading = actionLoadingId === req.id;
                    
                    let timerDisplay = null;
                    let isTimerCritical = false;
                    const refDate = req.updated_at || req.created_at || new Date().toISOString();

                    if (reqStatus === 'POOL' || reqStatus === 'PENDING') {
                       const poolLimit = Number(systemSettings?.pool_lifespan_hours) || 72;
                       const remaining = calculateRemainingTime(req.created_at, poolLimit, 'hours');
                       if (remaining) {
                         timerDisplay = `Havuz: ${remaining}`;
                         isTimerCritical = remaining === "Süresi Doldu" || (remaining.includes("dk") && !remaining.includes("saat"));
                       }
                    } else if (reqStatus === 'MATCHED') {
                       const selectLimit = Number(systemSettings?.customer_selection_timeout_mins) || 60;
                       const remaining = calculateRemainingTime(refDate, selectLimit, 'mins');
                       if (remaining) {
                         timerDisplay = `Onay Süreniz: ${remaining}`;
                         isTimerCritical = remaining === "Süresi Doldu" || (parseInt(remaining) < 15 && remaining.includes("dk") && !remaining.includes("saat"));
                       }
                    } else if (reqStatus === 'PROVIDER_COMPLETED') {
                       const approvalLimit = Number(systemSettings?.customer_approval_timeout_hours) || 24;
                       const remaining = calculateRemainingTime(refDate, approvalLimit, 'hours');
                       if (remaining) {
                         timerDisplay = `Kalan Onay: ${remaining}`;
                         isTimerCritical = remaining === "Süresi Doldu" || (remaining.includes("dk") && !remaining.includes("saat"));
                       }
                    }

                    return (
                      <div key={req.id} className="bg-[#FAFBFD] rounded-xl border border-neutral-200/90 p-4 shadow-sm space-y-3">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-mono text-neutral-400 font-bold">#REQ-{req.id}</span>
                              {req.created_at && (<span className="text-[10px] font-mono text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><Clock size={10} /> {safeDateTime(req.created_at)}</span>)}
                              {reqCode && (<span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold border flex items-center gap-1 ${isHidden ? 'bg-neutral-100 text-neutral-600 border-neutral-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}><Tag size={10}/> KOD: {reqCode} {isHidden ? '(Gizli)' : ''}</span>)}
                              {req.is_urgent && <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold border border-rose-200 text-[10px]">ACİL</span>}
                            </div>
                            <h4 className="text-sm font-bold text-neutral-950 leading-snug mt-1.5">"{req.raw_text}"</h4>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1.5">
                            {reqStatus === 'POOL' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">Açık Havuzda</span>}
                            {reqStatus === 'MATCHED' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">Sağlayıcı Bulundu</span>}
                            {reqStatus === 'PROVIDER_SKIPPED' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">Pas Geçti</span>}
                            {reqStatus === 'ACCEPTED' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">Kabul Edildi</span>}
                            {reqStatus === 'PROVIDER_COMPLETED' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">Teslim Etti</span>}
                            
                            {timerDisplay && (
                               <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${isTimerCritical ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                  {isTimerCritical ? <AlertCircle size={10} /> : <Timer size={10} />}
                                  <span>{timerDisplay}</span>
                               </div>
                            )}
                          </div>
                        </div>

                        {/* YENİ: Akordiyonlu Müşteri Eşleştirme Kuyruğu */}
                {/* Akordiyonlu Müşteri Eşleştirme Kuyruğu */}
                {(req.provider_name || safeArray(req.queuedProviders).length > 0) && (
                  <div className="mt-2 bg-white border border-emerald-200 rounded-lg shadow-sm overflow-hidden transition-all duration-300">
                    
                    <div className="p-3 flex items-center justify-between border-b border-emerald-100/50">
                      <div className="text-[10px] font-mono font-bold text-emerald-700">
                        {reqStatus === 'PROVIDER_SKIPPED' ? <span className="text-rose-600">PAS GEÇEN SAĞLAYICI</span> : (req.provider_name ? 'ŞU ANKİ AKTİF SAĞLAYICI' : 'SİRAYA GİREN SAĞLAYICILAR')}
                      </div>
                    </div>

                    <div className="bg-neutral-50/30">
                      {safeArray(req.queuedProviders).map((qProv, idx) => {
                        const isCurrent = String(req.matched_provider_id) === String(qProv.id);
                        const isSkippedByThis = isCurrent && reqStatus === 'PROVIDER_SKIPPED';
                        // Hangi sağlayıcının akordiyonu açık?
                        const isProvExpanded = expandedProviderReviewId === `${req.id}_${qProv.id}`;
                        
                        return (
                          <div key={qProv.id} className={`border-b border-neutral-100 last:border-b-0 text-xs flex flex-col transition overflow-hidden shadow-sm ${isCurrent ? (isSkippedByThis ? 'bg-rose-50' : 'bg-emerald-50') : 'bg-white'}`}>
                            
                            {/* Tıklanabilir Header Satırı */}
                            <div 
                              onClick={() => setExpandedProviderReviewId(isProvExpanded ? null : `${req.id}_${qProv.id}`)}
                              className="p-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50"
                            >
                              <div>
                                <p className="font-bold text-neutral-900 flex items-center space-x-1.5">
                                  <span>#{idx + 1} {qProv.name}</span>
                                  {isSkippedByThis && <span className="text-[9px] bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded font-mono">PAS GEÇTİ</span>}
                                  {isCurrent && !isSkippedByThis && <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono">ŞU AN AKTİF</span>}
                                  {qProv.interest_status === 'SKIPPED' && !isCurrent && <span className="text-[9px] bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded font-mono">PAS GEÇİLDİ</span>}
                                </p>
                                <div className="flex items-center space-x-2 mt-1.5">
                                  <span className="text-[10px] font-mono text-neutral-500">📞 {qProv.phone}</span>
                                  
                                  {/* ÖZET: Sağlayıcı Ortalama Puanı ve Skoru */}
{qProv.avg_rating && (
  <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
    <Star size={8} fill="#f59e0b" /> {Number(parseFloat(qProv.avg_rating).toFixed(2))} ({qProv.review_count} Yorum)
  </span>
)}
{qProv.avg_score && (
  <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-bold">
    Sistem Skoru: {Number(parseFloat(qProv.avg_score).toFixed(2))}/100
  </span>
)}
                                </div>
                              </div>
                              
                              {/* Eylem Butonları */}
                              <div className="flex items-center space-x-2 shrink-0 ml-2">
                                  {isCurrent && !isSkippedByThis && reqStatus === 'MATCHED' && (
                                      <button disabled={isActionLoading} onClick={(e) => { e.stopPropagation(); handleStatusChange(req.id, 'ACCEPTED'); }} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer disabled:opacity-50 transition shadow-sm"><ShieldCheck size={10} className="mr-1 inline-block"/>Onayla</button>
                                  )}
                                  {!isCurrent && (
                                      <button disabled={isActionLoading} onClick={(e) => { e.stopPropagation(); handleCustomerSelectCandidate(req.id, qProv.id); }} className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded text-[10px] font-bold cursor-pointer disabled:opacity-50 transition shadow-sm"><Check size={10} className="mr-1 inline-block"/>Bunu Seç</button>
                                  )}
                                  <div className="text-neutral-400 p-1 bg-white border border-neutral-200 rounded ml-1 transition hover:bg-neutral-50 shadow-xs">
                                      {isProvExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                  </div>
                              </div>
                            </div>

                            {/* AKORDİYON İÇERİĞİ: Tüm Detaylı Yorumlar */}
                            {isProvExpanded && (
                              <div className="border-t border-neutral-100 bg-neutral-50/50 p-3 max-h-56 overflow-y-auto cursor-default">
                                {safeArray(qProv.reviews).length > 0 ? (
                                  <div className="space-y-2.5">
                                      {qProv.reviews.map((rev, revIdx) => (
                                        <div key={revIdx} className="bg-white p-2.5 rounded-lg border border-neutral-200 shadow-xs hover:border-blue-200 transition">
                                          <div className="flex justify-between items-center mb-1.5">
                            <div className="flex items-center gap-1.5 text-amber-500">
  <Star size={11} fill="#f59e0b" /> <span className="font-bold text-[11px]">{Number(parseFloat(rev.rating).toFixed(2))}</span>
  {rev.score && <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-mono ml-1 font-bold">Skor: {Number(parseFloat(rev.score).toFixed(2))}</span>}
</div>
                                            <span className="text-[9px] text-neutral-400 font-mono">{safeDateTime(rev.rating_date)}</span>
                                          </div>
                                          
                                          {/* AÇIKLAMA (COMMENT) ALANI: Sadece varsa ve boş değilse görünür */}
                                          {rev.comment && rev.comment.trim() !== '' && (
                                            <div className="mb-2.5 bg-neutral-50 p-2 rounded border border-neutral-100">
                                              <p className="text-[11px] text-neutral-700 italic leading-relaxed">
                                                "{rev.comment}"
                                              </p>
                                            </div>
                                          )}
                                          
<div className="grid grid-cols-4 gap-1 text-[8px] text-neutral-500 font-bold uppercase text-center mt-1 border-t border-neutral-100 pt-2">
  <div className="flex flex-col gap-0.5"><span className="text-neutral-400">Uzmanlık</span><span className="text-neutral-800 text-[10px]">{parseFloat(rev.rating_knowledge)}/5</span></div>
  <div className="flex flex-col gap-0.5"><span className="text-neutral-400">İletişim</span><span className="text-neutral-800 text-[10px]">{parseFloat(rev.rating_communication)}/5</span></div>
  <div className="flex flex-col gap-0.5"><span className="text-neutral-400">Hız</span><span className="text-neutral-800 text-[10px]">{parseFloat(rev.rating_timing)}/5</span></div>
  <div className="flex flex-col gap-0.5"><span className="text-neutral-400">Fiyat</span><span className="text-neutral-800 text-[10px]">{parseFloat(rev.rating_cost)}/5</span></div>
</div>
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <div className="text-center text-[10px] text-neutral-400 py-3 italic bg-white border border-neutral-100 rounded-lg">Bu sağlayıcı için henüz geçmiş bir müşteri değerlendirmesi bulunmuyor.</div>
                                )}
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}


                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-100 mt-2"><span>📍 {extractAddress(req.location)}</span>{req.deadline_datetime && <span>⏰ En Son: {safeDateTime(req.deadline_datetime)}</span>}</div>
                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-xs">
                          <div className="flex items-center space-x-1.5">{(['MATCHED', 'PROVIDER_COMPLETED', 'ACCEPTED', 'PROVIDER_SKIPPED'].includes(reqStatus)) && safeArray(req.queuedProviders).length > 1 && (<button disabled={isActionLoading} onClick={() => handleCustomerNextProvider(req.id)} className="px-2.5 py-1 border hover:bg-neutral-100 rounded text-[11px] font-semibold flex items-center space-x-1 text-neutral-700 cursor-pointer disabled:opacity-50"><SkipForward size={11} /><span>Sıradakine Geç</span></button>)}</div>
                          <div className="flex items-center space-x-1.5 ml-auto">
                            {(reqStatus === 'MATCHED' || reqStatus === 'PROVIDER_COMPLETED') && (
                              <button disabled={isActionLoading} onClick={() => handleStatusChange(req.id, 'COMPLETED')} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center space-x-1 shadow-sm cursor-pointer disabled:opacity-50">
                                {isActionLoading && <Loader2 size={11} className="animate-spin" />}
                                <span>{reqStatus === 'PROVIDER_COMPLETED' ? 'Onayla & Tamamla' : 'Hizmeti Tamamla'}</span>
                              </button>
                            )}
                            <button disabled={isActionLoading} onClick={() => handleDeleteRequest(req.id)} className="px-2 py-1 border hover:bg-neutral-100 text-neutral-600 rounded text-[11px] cursor-pointer disabled:opacity-50" title="Talebi İptal Et"><Ban size={12} /> İptal</button>
                          </div>
                        </div>
                      </div>
                    );
                 })}
               </div>
             )}
         </div>
      )}

      {/* DETAYLI DEĞERLENDİRME EKRANI */}
      {pendingReviewCustomerRequests.length > 0 && (
         <div className="mt-8 space-y-3 transition-all duration-300">
             <div onClick={() => setIsPendingReviewsOpen(!isPendingReviewsOpen)} className="flex items-center justify-between cursor-pointer select-none">
                <h3 className="text-sm font-bold text-emerald-700 flex items-center space-x-1.5"><Sparkles size={16} className="text-amber-500" /><span>Değerlendirme Bekleyenler ({pendingReviewCustomerRequests.length})</span></h3>
                <div className="text-neutral-400">{isPendingReviewsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
             </div>
             {isPendingReviewsOpen && (
               <div className="space-y-4">
                 {pendingReviewCustomerRequests.map((req) => {
                    const isActionLoading = actionLoadingId === req.id;
                    const ratings = getRatingsForReq(req.id);
                    const avg = ((ratings.knowledge + ratings.communication + ratings.timing + ratings.cost) / 4).toFixed(1);
                    
                    const ratingCriteria = [
                      { id: 'knowledge', label: 'Uzmanlık ve Bilgi' },
                      { id: 'communication', label: 'İletişim ve Nezaket' },
                      { id: 'timing', label: 'Hız ve Zamanlama' },
                      { id: 'cost', label: 'Fiyat / Performans' }
                    ];

                    return (
                      <div key={req.id} className="bg-emerald-50/40 rounded-xl border border-emerald-200 p-4 shadow-sm space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-neutral-400">#REQ-{req.id}</span>
                            <p className="text-sm font-bold text-neutral-900">"{req.raw_text}"</p>
                            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">Sağlayıcı: <strong className="text-neutral-800">{req.provider_name || 'Bilinmiyor'}</strong> {req.provider_phone && <span className="ml-1 text-neutral-600 font-mono">({req.provider_phone})</span>}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">ONAYLANDI</span>
                        </div>
                        
                        <div className="p-4 bg-white rounded-xl border border-neutral-200/90 shadow-xs space-y-4">
                          
                          <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                              <span className="font-extrabold text-neutral-900 text-xs uppercase tracking-wide">Hizmet Deneyimini Puanla</span>
                              <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                                <span className="text-[10px] font-bold text-emerald-800">Genel Ortalama:</span>
                                <span className="text-xs font-black text-emerald-700">{avg}</span>
                              </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                            {ratingCriteria.map(criteria => (
                              <div key={criteria.id} className="flex flex-col space-y-1 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                                <span className="text-[10px] font-bold text-neutral-600 uppercase">{criteria.label}</span>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button 
                                        key={star} 
                                        type="button" 
                                        onClick={() => updateSpecificRating(req.id, criteria.id, star)} 
                                        className={`p-1 transition cursor-pointer hover:scale-110 ${star <= ratings[criteria.id] ? 'text-amber-500 fill-amber-500' : 'text-neutral-300'}`}
                                      >
                                        <Star size={16} fill={star <= ratings[criteria.id] ? '#f59e0b' : 'none'} />
                                      </button>
                                    ))}
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-neutral-400">{ratings[criteria.id]}/5</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2">
                             <input type="text" value={reviewCommentMap[req.id] || ''} onChange={(e) => setReviewCommentMap({ ...reviewCommentMap, [req.id]: e.target.value })} placeholder="Bu deneyiminizle ilgili eklemek istediğiniz yorumunuz (opsiyonel)..." className="w-full p-3 text-xs rounded-xl border border-neutral-200 outline-none bg-neutral-50 focus:bg-white focus:border-neutral-950 transition" />
                          </div>

                          <div className="flex items-center justify-end space-x-3 pt-2">
                            <button disabled={isActionLoading} type="button" onClick={() => handleSendReview(req.id, 'CUSTOMER', true)} className="px-3 py-2 text-neutral-500 hover:bg-neutral-100 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 transition">Yorum Yapmadan Geç</button>
                            <button disabled={isActionLoading} type="button" onClick={() => handleSendReview(req.id, 'CUSTOMER', false)} className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50 flex items-center space-x-1.5 transition">
                              {isActionLoading && <Loader2 size={13} className="animate-spin" />}
                              <span>Değerlendirmeyi Gönder</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                 })}
               </div>
             )}
         </div>
      )}

      {/* GEÇMİŞ TALEPLER */}
      {pastCustomerRequests.length > 0 && (
         <div className="mt-8 space-y-3 transition-all duration-300">
             <div onClick={() => setIsCustomerHistoryOpen(!isCustomerHistoryOpen)} className="flex items-center justify-between cursor-pointer select-none">
                <h3 className="text-sm font-bold text-neutral-700 flex items-center space-x-1.5"><History size={16} className="text-neutral-500" /><span>Geçmiş Talepler ({pastCustomerRequests.length})</span></h3>
                <div className="text-neutral-400">{isCustomerHistoryOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
             </div>
             {isCustomerHistoryOpen && (
               <div className="space-y-3">
                 <div className="relative mb-3"><Search size={14} className="absolute left-3 top-2.5 text-neutral-400" /><input type="text" value={searchCustomerHistoryText} onChange={(e) => setSearchCustomerHistoryText(e.target.value)} placeholder="Geçmiş taleplerde ara..." className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border outline-none bg-white focus:border-neutral-950 font-medium shadow-sm" /></div>
                 <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                   {filteredPastCustomerRequests.map((req) => (
                      <div key={req.id} className="p-3.5 bg-white rounded-xl border border-neutral-200 shadow-sm space-y-2 text-xs">
                        <div className="flex items-start justify-between"><div><p className="font-semibold text-neutral-900">"{req.raw_text}"</p><p className="text-[10px] text-neutral-500 font-mono mt-0.5">{safeDateTime(req.created_at)}</p></div><span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-neutral-100 border text-neutral-700">{req.status}</span></div>
                      </div>
                   ))}
                 </div>
               </div>
             )}
         </div>
      )}
    </div>
  );
}