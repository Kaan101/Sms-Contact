import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useSWR from 'swr';
import { Search, MapPin, Layers, Plus, Filter, X, Briefcase, Inbox, Clock, ShieldCheck, Check, MessageCircle, Loader2, Timer, AlertCircle, FileText, Bell } from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { safeArray, safeString, safeLower, safeUpper, extractAddress, extractGPS, isCodeHiddenReq, extractCode, safeDateTime, extractPhoneForWa, calculateRemainingTime } from '../../../core/utils/helpers';
import { UniversalMapController, SharedMapClickHandler } from '../../components/maps/MapComponents';

// --- SWR İÇİN GLOBAL FETCHER FONKSİYONU ---
const fetcher = (url) => axios.get(url).then(res => res.data);

// --- PERFORMANS OPTİMİZASYONU: MEMO'LANMIŞ GÖREV KARTI (TaskCard) ---
const TaskCard = React.memo(({ 
  req, providerProfile, activeProviderRequests, poolRequests, expandedTrackerReqId, 
  actionLoadingId, setTrackerMapCenter, setTrackerMapSelectedPos, setCoordinates, 
  setIsTrackerListOpen, setExpandedTrackerReqId, handleJoinPool, setHiddenPoolRequests, 
  handleStatusChange, handleProviderSkip, handleCustomerSelectCandidate, systemSettings 
}) => {
  const coords = extractGPS(req.location);
  const isExpanded = expandedTrackerReqId === req.id;
  const isMyTask = providerProfile ? activeProviderRequests.some(pr => Number(pr?.id) === Number(req.id)) : false;
  const hasJoined = providerProfile && (safeArray(req.queuedProviders).some(qp => Number(qp?.id) === Number(providerProfile?.id)) || safeArray(req.queueList).some(qp => Number(qp?.id) === Number(providerProfile?.id)) || isMyTask);
  const isMatch = providerProfile ? poolRequests.some(pr => Number(pr?.id) === Number(req.id)) : false;
  
  const reqStatus = safeUpper(req.status);
  const canExpand = !providerProfile || isMatch || hasJoined || isMyTask;
  const isActionLoading = actionLoadingId === req.id;

  const forceRevealContact = isMyTask && ['ACCEPTED', 'PROVIDER_COMPLETED'].includes(reqStatus); 
  const rawContact = safeString(req.contact_value).replace(/\|HIDDEN/gi, '').replace(/\|SHARED/gi, '').trim();
  
  const displayContact = forceRevealContact ? rawContact : 'Gizli (Kabul Edince Açılacak)';
  const showWhatsApp = forceRevealContact && safeString(req.preferred_channel).includes('WHATSAPP');

// --- SAYAÇ (TIMER) MANTIĞI (Hata Toleranslı Güncelleme) ---
  let timerDisplay = null;
  let isTimerCritical = false;
  
  // 1. Veritabanında status boşsa bile varsayılan olarak POOL kabul edelim
  const currentStatus = reqStatus || 'POOL';
  
  // 2. Eğer veride tarih yoksa çökmek yerine şimdiki zamanı baz alalım (test verileri için)
  const refDate = req.updated_at || req.created_at || new Date().toISOString();

  if (currentStatus === 'POOL' || currentStatus === 'PENDING') {
     const poolLimit = Number(systemSettings?.pool_lifespan_hours) || 72;
     const remaining = calculateRemainingTime(refDate, poolLimit, 'hours');
     if (remaining) {
       timerDisplay = `Kapanış: ${remaining}`;
       isTimerCritical = remaining === "Süresi Doldu" || (remaining.includes("dk") && !remaining.includes("saat"));
     }
  } else if (currentStatus === 'MATCHED') {
     const selectLimit = Number(systemSettings?.customer_selection_timeout_mins) || 60;
     const remaining = calculateRemainingTime(refDate, selectLimit, 'mins');
     if (remaining) {
       timerDisplay = `Kalan: ${remaining}`;
       isTimerCritical = remaining === "Süresi Doldu" || (parseInt(remaining) < 15 && remaining.includes("dk") && !remaining.includes("saat"));
     }
  } else if (currentStatus === 'ACCEPTED') {
     const completionLimit = Number(systemSettings?.provider_completion_timeout_hours) || 48;
     const remaining = calculateRemainingTime(refDate, completionLimit, 'hours');
     if (remaining) {
       timerDisplay = `Teslimat: ${remaining}`;
       isTimerCritical = remaining === "Süresi Doldu" || (remaining.includes("dk") && !remaining.includes("saat"));
     }
  } else if (currentStatus === 'PROVIDER_COMPLETED') {
     const approvalLimit = Number(systemSettings?.customer_approval_timeout_hours) || 24;
     const remaining = calculateRemainingTime(refDate, approvalLimit, 'hours');
     if (remaining) {
       timerDisplay = `Onay: ${remaining}`;
     }
  }

  return (
    <div onClick={() => { 
        if(coords) { 
            setTrackerMapCenter(coords); 
            setTrackerMapSelectedPos(null); 
            setCoordinates(''); 
            if (window.innerWidth < 640) setIsTrackerListOpen(false); 
        } 
        if (canExpand) {
            setExpandedTrackerReqId(prev => prev === req.id ? null : req.id); 
        }
    }} className={`p-3 rounded-xl border bg-white shadow-sm transition group cursor-pointer hover:border-blue-400 ${isExpanded ? 'border-blue-400 shadow-md ring-1 ring-blue-100' : ''}`}>
      <div className="flex items-start justify-between mb-1.5 flex-wrap gap-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
           <span className="text-[10px] font-mono text-neutral-400 font-bold">#REQ-{req.id}</span>
           
           {/* YENİ: KAYIT TÜRÜ ROZETİ EKLENDİ */}
           {req.request_type === 'BILDIRIM' ? (
             <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 border border-amber-200 text-amber-700"><Bell size={10} /> BİLDİRİM</span>
           ) : (
             <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 border border-blue-200 text-blue-700"><FileText size={10} /> TALEP</span>
           )}

           <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${reqStatus === 'POOL' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>{reqStatus || 'POOL'}</span>
        </div>
        
        {timerDisplay && (
           <div className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${isTimerCritical ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              {isTimerCritical ? <AlertCircle size={10} /> : <Timer size={10} />}
              <span>{timerDisplay}</span>
           </div>
        )}

        {providerProfile && hasJoined && !isMyTask && <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Sıradayınız</span>}
        {providerProfile && isMyTask && <span className="text-[9px] font-bold text-white bg-emerald-600 px-1.5 py-0.5 rounded shadow-sm">Benim İşim</span>}
      </div>
      <h4 className="text-xs font-bold text-neutral-900 leading-snug line-clamp-2">"{req.raw_text}"</h4>
      
      <div className="flex flex-col gap-1 mt-2 mb-1 text-[10px] text-neutral-500 font-mono">
          {req.created_at && (
              <div className="flex items-center gap-1.5">
                  <Clock size={11} className="text-blue-500 shrink-0" />
                  <span>{safeDateTime(req.created_at)}</span>
              </div>
          )}
          {req.location && (
              <div className="flex items-start gap-1.5">
                  <MapPin size={11} className="text-rose-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{extractAddress(req.location)}</span>
              </div>
          )}
      </div>
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-col gap-2 cursor-default" onClick={(e) => e.stopPropagation()}>
           
           {providerProfile && ['POOL', 'PENDING', 'MATCHED', 'ACCEPTED', 'PROVIDER_SKIPPED', 'PROVIDER_COMPLETED'].includes(reqStatus) && !hasJoined && !isMyTask && (
              <div className="flex gap-2">
                <button disabled={isActionLoading} onClick={(e) => { e.stopPropagation(); handleJoinPool(req.id); setExpandedTrackerReqId(null); }} className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1">
                  {isActionLoading && <Loader2 size={12} className="animate-spin" />}
                  <span>Sıraya Gir</span>
                </button>
                <button disabled={isActionLoading} onClick={(e) => { e.stopPropagation(); setHiddenPoolRequests(prev => [...prev, req.id]); setExpandedTrackerReqId(null); }} className="px-3 py-1.5 border text-neutral-500 rounded-lg text-xs hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer disabled:opacity-50">
                  Kaldır
                </button>
              </div>
           )}
           
           {providerProfile && isMyTask && (
             <div className="flex flex-col gap-2">
               <div className="bg-neutral-50 border border-neutral-200 p-2.5 rounded-lg flex items-center justify-between mb-1">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-mono text-neutral-500 uppercase font-semibold">Müşteri İletişim</span>
                   <span className={`text-xs font-bold mt-0.5 ${forceRevealContact ? 'text-neutral-900' : 'text-neutral-400'}`}>{displayContact}</span>
                 </div>
                 {showWhatsApp && (
                    <a href={`https://wa.me/${extractPhoneForWa(rawContact)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-bold flex items-center space-x-1 shadow-sm transition shrink-0 cursor-pointer">
                      <MessageCircle size={12} />
                      <span>Yaz</span>
                    </a>
                 )}
               </div>

               {reqStatus === 'MATCHED' && (
                 <div className="flex gap-2">
                   <button disabled={isActionLoading} onClick={(e) => { e.stopPropagation(); handleStatusChange(req.id, 'ACCEPTED'); }} className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1">
                     {isActionLoading && <Loader2 size={12} className="animate-spin" />}
                     <span>İşi Kabul Et</span>
                   </button>
                   <button disabled={isActionLoading} onClick={(e) => { e.stopPropagation(); handleProviderSkip(req.id); }} className="px-3 py-1.5 border text-rose-600 rounded-lg text-[11px] hover:bg-rose-50 transition cursor-pointer disabled:opacity-50">
                     Pas Geç
                   </button>
                 </div>
               )}
               
               {reqStatus === 'ACCEPTED' && (
                 <div className="flex gap-2">
                   <button disabled={isActionLoading} onClick={(e) => { e.stopPropagation(); handleStatusChange(req.id, 'PROVIDER_COMPLETED'); }} className="flex-1 py-2 bg-neutral-950 text-white rounded-lg text-[11px] font-semibold hover:bg-neutral-800 transition cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1.5 shadow-sm">
                     {isActionLoading && <Loader2 size={13} className="animate-spin" />}
                     <span>{isActionLoading ? 'İşleniyor...' : 'İşi Teslim Et'}</span>
                   </button>
                   <button disabled={isActionLoading} onClick={(e) => { e.stopPropagation(); handleProviderSkip(req.id); }} className="px-3 py-2 border text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-1">
                     {isActionLoading && <Loader2 size={13} className="animate-spin" />}
                     <span>Pas Geç</span>
                   </button>
                 </div>
               )}
             </div>
           )}

           {/* DEFANSİF KUYRUK LİSTESİ */}
           {expandedTrackerReqId === req.id && (
              <div className="p-3 pt-1 border-t border-emerald-100 bg-neutral-50/50 mt-1">
                <div className="space-y-2">
                  {(() => {
                     const queueData = req.queuedProviders || req.queueList || [];
                     const safeQueue = safeArray(queueData);
                     
                     if (safeQueue.length === 0) {
                       return <div className="text-center text-[10px] text-neutral-500 py-2">Henüz sıraya giren sağlayıcı yok.</div>;
                     }

                     return safeQueue.map((qProv, idx) => {
                        if (!qProv || !qProv.id) return null;
                        const isCurrent = String(req.matched_provider_id) === String(qProv.id);
                        const isSkippedByThis = isCurrent && reqStatus === 'PROVIDER_SKIPPED';
                        
                        return (
                          <div key={`qprov-${qProv.id}-${idx}`} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${isCurrent ? (isSkippedByThis ? 'bg-rose-50 border-rose-200 shadow-sm' : 'bg-emerald-50 border-emerald-200 shadow-sm') : 'bg-white border-neutral-200'}`}>
                            <div>
                              <p className="font-bold text-neutral-900 flex items-center space-x-1.5">
                                <span>#{idx + 1} {qProv.name || 'İsimsiz Sağlayıcı'}</span>
                                {isSkippedByThis && <span className="text-[9px] bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded font-mono">PAS GEÇTİ</span>}
                                {isCurrent && !isSkippedByThis && <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono">ŞU AN AKTİF</span>}
                              </p>
                              <p className="text-[10px] font-mono text-neutral-500 mt-1">
                                📞 { (isCurrent && ['ACCEPTED', 'PROVIDER_COMPLETED'].includes(reqStatus)) ? qProv.phone : '*** ** ** (Gizli)' }
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                {isCurrent && !isSkippedByThis && reqStatus === 'MATCHED' && (<button disabled={isActionLoading} onClick={(e) => { e.stopPropagation(); handleStatusChange(req.id, 'ACCEPTED'); }} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer disabled:opacity-50"><ShieldCheck size={10} /><span>Onayla</span></button>)}
                                {!isCurrent && (
                                    <div className="flex items-center">
                                        {qProv.interest_status === 'SKIPPED' && <span className="text-[11px] font-extrabold text-rose-400/70 mr-2 uppercase tracking-wider">Pas</span>}
                                        <button disabled={isActionLoading} onClick={(e) => { e.stopPropagation(); handleCustomerSelectCandidate(req.id, qProv.id); }} className="px-3 py-1.5 bg-neutral-950 text-white rounded text-[10px] font-bold flex items-center space-x-1 cursor-pointer disabled:opacity-50"><Check size={10} /><span>Bunu Seç</span></button>
                                    </div>
                                )}
                            </div>
                          </div>
                        );
                     });
                  })()}
                </div>
              </div>
           )}
        </div>
      )}
    </div>
  );
});

export default function TrackerDashboard() {
  const { session, API_BASE } = useAuth();

  const mapIcons = useMemo(() => ({
    custom: new L.DivIcon({ html: `<div style="margin-top: -32px; margin-left: -16px; filter: drop-shadow(0px 4px 2px rgba(0,0,0,0.3));"><svg width="32" height="32" viewBox="0 0 24 24" fill="#171717" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>`, className: '', iconSize: [0, 0], iconAnchor: [0, 0] }),
    urgent: new L.DivIcon({ html: `<div style="margin-top: -32px; margin-left: -16px; filter: drop-shadow(0px 4px 2px rgba(0,0,0,0.4));"><svg width="32" height="32" viewBox="0 0 24 24" fill="#e11d48" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>`, className: '', iconSize: [0, 0], iconAnchor: [0, 0] }),
    tracker: new L.DivIcon({ html: `<div style="margin-top: -32px; margin-left: -16px; filter: drop-shadow(0px 4px 2px rgba(0,0,0,0.4));"><svg width="32" height="32" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>`, className: '', iconSize: [0, 0], iconAnchor: [0, 0] })
  }), []);

  const trackerSearchInputRef = useRef(null);

  // --- SWR VERİ ÇEKME HOOK'LARI ---
  const { data: rawSettings } = useSWR(`${API_BASE}/settings`, fetcher, { refreshInterval: 60000 });
  const systemSettings = rawSettings?.settings || { pool_lifespan_hours: 72, customer_selection_timeout_mins: 60, provider_completion_timeout_hours: 48, customer_approval_timeout_hours: 24 };

  const { data: rawPendingRequests, mutate: mutatePending } = useSWR(`${API_BASE}/requests/pending`, fetcher, { refreshInterval: 5000 });
  const { data: rawMatchedRequests, mutate: mutateMatched } = useSWR(`${API_BASE}/requests/matched`, fetcher, { refreshInterval: 5000 });
  
  const providerPhoneQuery = session?.phone ? `phone=${encodeURIComponent(session.phone)}` : null;
  const { data: providerRes } = useSWR(providerPhoneQuery ? `${API_BASE}/providers/by-phone?${providerPhoneQuery}` : null, fetcher);
  const providerProfile = providerRes?.provider || null;

  const providerIdQuery = providerProfile?.id ? `providerId=${providerProfile.id}` : null;
  const { data: activeRequestsRes, mutate: mutateActiveReq } = useSWR(providerIdQuery ? `${API_BASE}/requests/provider-requests?${providerIdQuery}&${providerPhoneQuery}` : null, fetcher, { refreshInterval: 5000 });
  const { data: poolRequestsRes, mutate: mutatePoolReq } = useSWR(providerIdQuery ? `${API_BASE}/requests/pool?${providerIdQuery}` : null, fetcher, { refreshInterval: 5000 });

  // Verileri Düzenleme
  const trackerRequests = useMemo(() => {
    const pending = safeArray(rawPendingRequests?.requests);
    const matched = safeArray(rawMatchedRequests?.requests);
    const allReqs = [...pending, ...matched];
    const uniqueReqsMap = new Map();
    allReqs.forEach(item => { if(item && item.id) uniqueReqsMap.set(item.id, item); });
    return Array.from(uniqueReqsMap.values()).sort((a, b) => b.id - a.id);
  }, [rawPendingRequests, rawMatchedRequests]);

  const activeProviderRequests = useMemo(() => safeArray(activeRequestsRes?.requests).filter(r => r && ['MATCHED', 'ACCEPTED', 'PROVIDER_COMPLETED'].includes(safeUpper(r.status))), [activeRequestsRes]);
  const poolRequests = useMemo(() => safeArray(poolRequestsRes?.poolRequests), [poolRequestsRes]);

  const [hiddenPoolRequests, setHiddenPoolRequests] = useState([]); 

  const [trackerSearch, setTrackerSearch] = useState('');
  const [trackerMapCenter, setTrackerMapCenter] = useState([41.0082, 28.9784]); 
  const [isTrackerListOpen, setIsTrackerListOpen] = useState(true);
  const [isTrackerAddModalOpen, setIsTrackerAddModalOpen] = useState(false);
  const [trackerMapSelectedPos, setTrackerMapSelectedPos] = useState(null);
  const [trackerMapSelectedAddress, setTrackerMapSelectedAddress] = useState('');
  const [trackerMapSearchText, setTrackerMapSearchText] = useState('');
  const [isTrackerMapSearching, setIsTrackerMapSearching] = useState(false);
  const [trackerMapSuggestions, setTrackerMapSuggestions] = useState([]);
  const [isTrackerSuggestionsVisible, setIsTrackerSuggestionsVisible] = useState(false);
  const [isTrackerFilterOpen, setIsTrackerFilterOpen] = useState(false);
  const [trackerFilter, setTrackerFilter] = useState({ city: '', district: '', zip: '', code: '' });
  
  const [isTrackerPoolFilterActive, setIsTrackerPoolFilterActive] = useState(false);
  const [showMyTrackerTasks, setShowMyTrackerTasks] = useState(false);
  const [expandedTrackerReqId, setExpandedTrackerReqId] = useState(null);

  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [queryText, setQueryText] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59'); 
  const [isUrgent, setIsUrgent] = useState(false);
  const [isContactShared, setIsContactShared] = useState(false); 
  const [isCodeHidden, setIsCodeHidden] = useState(false);
  const [companyCode, setCompanyCode] = useState('');
  const [locationValue, setLocationValue] = useState('');
  const [coordinates, setCoordinates] = useState(''); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (trackerMapSearchText.length > 2) {
        setIsTrackerMapSearching(true);
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trackerMapSearchText)}&limit=5&countrycodes=tr`);
          setTrackerMapSuggestions(safeArray(res?.data));
          if (trackerSearchInputRef.current === document.activeElement) setIsTrackerSuggestionsVisible(true);
        } catch (err) {} finally { setIsTrackerMapSearching(false); }
      } else {
        setTrackerMapSuggestions([]); setIsTrackerSuggestionsVisible(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [trackerMapSearchText]);


  // --- useCallback İLE SARILMIŞ İŞLEM FONKSİYONLARI ---
  const handleStatusChange = useCallback(async (requestId, newStatus) => { 
    setActionLoadingId(requestId);
    try { 
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/status`, { newStatus }); 
      await mutatePending(); await mutateMatched(); await mutateActiveReq(); await mutatePoolReq();
    } catch (err) {
    } finally {
      setActionLoadingId(null);
    }
  }, [API_BASE, mutatePending, mutateMatched, mutateActiveReq, mutatePoolReq]);

  const handleProviderSkip = useCallback(async (requestId) => {
    setActionLoadingId(requestId);
    try { 
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/status`, { newStatus: 'PROVIDER_SKIPPED' }); 
      await mutatePending(); await mutateMatched(); await mutateActiveReq(); await mutatePoolReq();
    } catch (err) { 
    } finally {
      setActionLoadingId(null);
    }
  }, [API_BASE, mutatePending, mutateMatched, mutateActiveReq, mutatePoolReq]);

  const handleJoinPool = useCallback(async (requestId) => { 
    if (!providerProfile) return;
    setActionLoadingId(requestId);
    try { 
        await axios.post(`${API_BASE}/requests/${requestId}/join-pool`, { providerId: providerProfile.id }); 
        await mutatePending(); await mutateMatched(); await mutateActiveReq(); await mutatePoolReq();
    } catch (err) { 
    } finally {
      setActionLoadingId(null);
    }
  }, [API_BASE, providerProfile, mutatePending, mutateMatched, mutateActiveReq, mutatePoolReq]);

  const handleCustomerSelectCandidate = useCallback(async (requestId, providerId) => { 
    setActionLoadingId(requestId);
    try { 
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/select-candidate`, { providerId: Number(providerId) }); 
      setExpandedTrackerReqId(null); 
      await mutatePending(); await mutateMatched();
    } catch (err) {
    } finally {
      setActionLoadingId(null);
    }
  }, [API_BASE, mutatePending, mutateMatched]);


  const submitWoZRequest = async (e) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    setLoading(true);
    const deadlineDatetimeISO = deadlineDate ? `${deadlineDate}T${deadlineTime || '23:59'}:00` : null;
    const flaggedContactValue = `${session.phone}|${isContactShared ? 'SHARED' : 'HIDDEN'}`;
    
    let backendLocation = locationValue || 'İstanbul, Türkiye';
    if (coordinates) backendLocation += ` [GPS: ${coordinates}]`;
    if (companyCode.trim()) backendLocation += isCodeHidden ? ` [HIDDENCODE: ${companyCode.trim()}]` : ` [CODE: ${companyCode.trim()}]`;

    try {
      await axios.post(`${API_BASE}/requests`, { rawText: queryText, contactValue: flaggedContactValue, preferredChannel: 'PHONE, SMS', location: backendLocation, isUrgent: isUrgent, deadlineDatetime: deadlineDatetimeISO });
      setQueryText(''); setIsTrackerAddModalOpen(false); setLocationValue(''); setCoordinates('');
      await mutatePending(); await mutateMatched();
    } catch (err) { } finally { setLoading(false); }
  };


  const filteredTrackerRequests = useMemo(() => 
    safeArray(trackerRequests).filter(r => {
      if(!r) return false;
      if (hiddenPoolRequests.includes(r.id)) return false;
      const status = safeUpper(r.status);
      
      if (status === 'COMPLETED' || status === 'CANCELLED') return false;

      const reqCode = safeLower(extractCode(r.location));
      const isHiddenReq = isCodeHiddenReq(r.location);
      const filterCode = safeLower(trackerFilter.code).trim();

      if (isHiddenReq) { if (!filterCode || reqCode !== filterCode) return false; } 
      else { if (filterCode && reqCode !== filterCode) return false; }
      
      if (showMyTrackerTasks && providerProfile) {
          if (!activeProviderRequests.some(pr => Number(pr?.id) === Number(r.id))) return false;
      } else if (isTrackerPoolFilterActive && providerProfile) {
          if (!poolRequests.some(pr => Number(pr?.id) === Number(r.id))) return false;
      }

      const q = safeLower(trackerSearch).trim();
      const matchesSearch = !q || safeLower(r.raw_text).includes(q) || safeLower(r.contact_value).includes(q) || safeLower(r.location).includes(q) || String(r.id).includes(q);
      if (!matchesSearch) return false;

      const locLow = safeLower(r.location);
      if (trackerFilter.city && !locLow.includes(safeLower(trackerFilter.city).trim())) return false;
      if (trackerFilter.district && !locLow.includes(safeLower(trackerFilter.district).trim())) return false;
      if (trackerFilter.zip && !locLow.includes(safeLower(trackerFilter.zip).trim())) return false;

      return true;
    }),
  [trackerRequests, hiddenPoolRequests, trackerFilter, showMyTrackerTasks, providerProfile, activeProviderRequests, isTrackerPoolFilterActive, poolRequests, trackerSearch]);

  const hasActiveFilters = trackerFilter.city || trackerFilter.district || trackerFilter.zip || trackerFilter.code || isTrackerPoolFilterActive || showMyTrackerTasks;

  return (
    <div className="absolute inset-0 pt-16 bg-neutral-100 overflow-hidden flex flex-col z-0">
        
        <div className="absolute top-32 left-4 z-[400] flex flex-col space-y-2 items-start pointer-events-auto">
           {providerProfile && (
             <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-200/50 shadow-sm mb-1 pointer-events-none">
               <span className="text-[9px] font-mono text-neutral-500 block uppercase tracking-wider mb-0.5">Aktif Sağlayıcı</span>
               <span className="text-sm font-bold text-neutral-900 leading-tight">{providerProfile.name}</span>
             </div>
           )}
           <button onClick={() => setIsTrackerAddModalOpen(true)} className="flex items-center space-x-2 bg-neutral-950 text-white px-4 py-2.5 rounded-xl shadow-lg transition w-full sm:w-auto hover:bg-neutral-800 cursor-pointer"><Plus size={16} /> <span className="font-semibold text-sm">Talep Ekle</span></button>
           <button onClick={() => setIsTrackerListOpen(!isTrackerListOpen)} className="flex items-center space-x-2 bg-white text-neutral-900 border px-4 py-2.5 rounded-xl shadow-md transition w-full sm:w-auto hover:bg-neutral-50 cursor-pointer"><Layers size={16} /> <span className="font-semibold text-sm">Görev Listesi</span></button>
        </div>

        <div className="flex-1 w-full h-full relative z-0">
          
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] w-[90vw] sm:w-96 max-w-[400px]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3.5 text-neutral-400" />
              <input ref={trackerSearchInputRef} type="text" value={trackerMapSearchText} onChange={(e) => setTrackerMapSearchText(e.target.value)} onFocus={() => setIsTrackerSuggestionsVisible(true)} onBlur={() => setTimeout(() => setIsTrackerSuggestionsVisible(false), 200)} placeholder="Haritada adres ara ve git..." className="w-full pl-10 pr-4 py-3 text-sm rounded-xl outline-none shadow-lg bg-white/90 backdrop-blur-sm transition focus:ring-2 focus:ring-neutral-900" />
            </div>
            
            {isTrackerSuggestionsVisible && trackerMapSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl max-h-60 overflow-y-auto z-[9999]">
                {trackerMapSuggestions.map((sug, idx) => (
                  <div key={idx} className="p-3 text-xs text-neutral-700 hover:bg-blue-50 cursor-pointer flex items-start space-x-2 border-b border-neutral-100 last:border-0" onMouseDown={(e) => { e.preventDefault(); const newPos = { lat: parseFloat(sug.lat), lng: parseFloat(sug.lon) }; setTrackerMapCenter([newPos.lat, newPos.lng]); setTrackerMapSelectedPos(newPos); setCoordinates(`${newPos.lat.toFixed(6)}, ${newPos.lng.toFixed(6)}`); setLocationValue(sug.display_name); setTrackerMapSearchText(''); setIsTrackerSuggestionsVisible(false); }}><MapPin size={14} className="text-neutral-400 mt-0.5 shrink-0" /><span>{sug.display_name}</span></div>
                ))}
              </div>
            )}
          </div>

          <div className="absolute inset-0 z-0">
            <MapContainer center={trackerMapCenter} zoom={12} style={{ height: '100%', width: '100%' }} className="z-0" zoomControl={false}>
              <ZoomControl position="bottomleft" />
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <UniversalMapController center={trackerMapCenter} />
              <SharedMapClickHandler position={trackerMapSelectedPos} setPosition={setTrackerMapSelectedPos} setLocationValue={setLocationValue} setCoordinates={setCoordinates} icon={mapIcons?.tracker} />
              {filteredTrackerRequests.map(req => {
                const coords = extractGPS(req.location);
                const reqStatus = safeUpper(req.status);
                
                if (coords && mapIcons) {
                  return (
                    <Marker position={coords} icon={req.is_urgent ? mapIcons.urgent : mapIcons.custom} key={req.id}>
                      <Popup className="custom-popup">
                        <div className="w-48 p-1">
                          <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                            <div className="flex items-center gap-1">
                               <span className="text-[10px] font-mono font-bold bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">#REQ-{req.id}</span>
                               {req.request_type === 'BILDIRIM' ? (
                                  <span className="text-[8px] font-bold bg-amber-100 text-amber-800 px-1 rounded flex items-center gap-0.5"><Bell size={8} /> BİLDİRİM</span>
                               ) : (
                                  <span className="text-[8px] font-bold bg-blue-100 text-blue-800 px-1 rounded flex items-center gap-0.5"><FileText size={8} /> TALEP</span>
                               )}
                            </div>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${reqStatus === 'POOL' ? 'bg-blue-100 text-blue-800' : reqStatus === 'MATCHED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{reqStatus || 'POOL'}</span>
                          </div>
                          <p className="text-xs font-bold text-neutral-900 leading-tight mb-1.5">"{req.raw_text}"</p>
                          <div className="text-[10px] font-mono text-neutral-500 space-y-0.5">
                            {req.created_at && <p>⏰ {safeDateTime(req.created_at)}</p>}
                            <p>📍 {extractAddress(req.location)}</p>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
                return null;
              })}
            </MapContainer>
          </div>
        </div>

        {isTrackerListOpen && (
          <div className="absolute top-16 right-0 w-[70vw] sm:w-[240px] md:w-[260px] min-w-[200px] max-w-[290px] h-[calc(100vh-64px)] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-[400] flex flex-col border-l border-neutral-200 animate-in slide-in-from-right duration-300">
             <div className="p-3 border-b border-neutral-100 bg-neutral-50/50 flex flex-col space-y-3">
                <div className="flex items-center justify-between"><h3 className="font-bold text-xs text-neutral-900 truncate pr-1">Operasyon Listesi ({filteredTrackerRequests.length})</h3><button onClick={() => setIsTrackerListOpen(false)} className="text-neutral-400 hover:text-neutral-800 p-1 cursor-pointer"><X size={14}/></button></div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1"><Search size={14} className="absolute left-2.5 top-2.5 text-neutral-400" /><input type="text" value={trackerSearch} onChange={(e) => setTrackerSearch(e.target.value)} placeholder="Talep ara..." className="w-full pl-8 pr-2 py-2 text-[11px] rounded-lg border outline-none bg-white focus:border-neutral-950 font-medium" /></div>
                    <button onClick={() => setIsTrackerFilterOpen(true)} className={`p-2 rounded-lg border transition shrink-0 flex items-center justify-center cursor-pointer ${hasActiveFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white hover:bg-neutral-50 text-neutral-600'}`}><Filter size={15} /></button>
                  </div>
                  {providerProfile && (
                    <div className="grid grid-cols-2 gap-2 mt-0.5">
                      <label className={`flex items-center justify-center py-2 px-2 rounded-lg border cursor-pointer select-none shadow-sm text-[10px] font-bold ${showMyTrackerTasks ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white hover:bg-neutral-50'}`}><input type="checkbox" checked={showMyTrackerTasks} onChange={(e) => { setShowMyTrackerTasks(e.target.checked); if (e.target.checked) setIsTrackerPoolFilterActive(false); }} className="hidden" /><Briefcase size={12} className="mr-1.5"/> İşlerim</label>
                      <label className={`flex items-center justify-center py-2 px-2 rounded-lg border cursor-pointer select-none shadow-sm text-[10px] font-bold ${isTrackerPoolFilterActive ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-white hover:bg-neutral-50'}`}><input type="checkbox" checked={isTrackerPoolFilterActive} onChange={(e) => { setIsTrackerPoolFilterActive(e.target.checked); if (e.target.checked) setShowMyTrackerTasks(false); }} className="hidden" /><Inbox size={12} className="mr-1.5"/> Uygun Havuz</label>
                    </div>
                  )}
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-2.5 space-y-2 bg-neutral-50 pb-20">
               {filteredTrackerRequests.map(req => (
                  <TaskCard 
                     key={req.id}
                     req={req}
                     systemSettings={systemSettings}
                     providerProfile={providerProfile}
                     activeProviderRequests={activeProviderRequests}
                     poolRequests={poolRequests}
                     expandedTrackerReqId={expandedTrackerReqId}
                     actionLoadingId={actionLoadingId}
                     setTrackerMapCenter={setTrackerMapCenter}
                     setTrackerMapSelectedPos={setTrackerMapSelectedPos}
                     setCoordinates={setCoordinates}
                     setIsTrackerListOpen={setIsTrackerListOpen}
                     setExpandedTrackerReqId={setExpandedTrackerReqId}
                     handleJoinPool={handleJoinPool}
                     setHiddenPoolRequests={setHiddenPoolRequests}
                     handleStatusChange={handleStatusChange}
                     handleProviderSkip={handleProviderSkip}
                     handleCustomerSelectCandidate={handleCustomerSelectCandidate}
                  />
               ))}
             </div>
          </div>
        )}

        {/* Modal: Tracker WoZ (Yeni Talep) */}
        {isTrackerAddModalOpen && (
           <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
             <div className="bg-white rounded-2xl max-w-lg w-full p-6 border shadow-xl">
                <div className="flex justify-between items-center mb-4 border-b pb-3"><h3 className="font-bold text-lg">Yeni Talep</h3><button onClick={() => setIsTrackerAddModalOpen(false)} className="hover:text-rose-600 transition cursor-pointer"><X size={18}/></button></div>
                <form onSubmit={submitWoZRequest} className="space-y-4">
                  <textarea rows={2} required value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Talebi girin..." className="w-full p-3 border rounded-xl outline-none focus:border-neutral-900" />
                  
                  <div className="space-y-2">
                     <input type="text" value={locationValue} onChange={(e) => setLocationValue(e.target.value)} placeholder="Konum adı veya açık adres..." className="w-full p-2.5 border rounded-xl outline-none focus:border-neutral-900 text-sm" />
                     <input type="text" value={coordinates} onChange={(e) => setCoordinates(e.target.value)} placeholder="Koordinat (Haritadan seçin veya girin)" className="w-full p-2.5 border rounded-xl outline-none focus:border-neutral-900 text-xs font-mono bg-neutral-50 text-neutral-600" />
                  </div>

                  <button type="submit" disabled={loading || !queryText.trim()} className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 transition text-white rounded-xl font-bold cursor-pointer disabled:opacity-50">Gönder</button>
                </form>
             </div>
           </div>
        )}

        {/* Modal: Tracker Gelişmiş Filtre */}
        {isTrackerFilterOpen && (
           <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
             <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl border">
               <div className="flex justify-between items-center border-b pb-3"><h3 className="font-bold text-sm">Gelişmiş Filtreleme</h3><button onClick={() => setIsTrackerFilterOpen(false)} className="hover:text-rose-600 transition cursor-pointer"><X size={16}/></button></div>
               <div className="space-y-3 mt-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">İl (Şehir)</label>
                    <input type="text" value={trackerFilter.city} onChange={(e) => setTrackerFilter({...trackerFilter, city: e.target.value})} placeholder="Örn: İstanbul" className="w-full p-2 text-xs border rounded-lg outline-none focus:border-neutral-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">İlçe</label>
                    <input type="text" value={trackerFilter.district} onChange={(e) => setTrackerFilter({...trackerFilter, district: e.target.value})} placeholder="Örn: Kadıköy" className="w-full p-2 text-xs border rounded-lg outline-none focus:border-neutral-900" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Posta Kodu</label>
                    <input type="text" value={trackerFilter.zip} onChange={(e) => setTrackerFilter({...trackerFilter, zip: e.target.value})} placeholder="Örn: 34744" className="w-full p-2 text-xs font-mono border rounded-lg outline-none focus:border-neutral-900" />
                  </div>
                  <div className="pt-2 border-t border-neutral-100 mt-2">
                    <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1.5">Kurum / Grup Kodu</label>
                    <input type="text" value={trackerFilter.code} onChange={(e) => setTrackerFilter({...trackerFilter, code: e.target.value.toUpperCase()})} placeholder="Örn: MOB-2026" className="w-full p-2 text-xs font-mono border rounded-lg outline-none focus:border-neutral-900 uppercase" />
                  </div>
               </div>
               
               <div className="flex justify-between items-center space-x-2 pt-4 mt-4 border-t border-neutral-100">
                  <button onClick={() => { setTrackerFilter({city:'', district:'', zip:'', code:''}); setIsTrackerFilterOpen(false); }} className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition cursor-pointer">Filtreyi Temizle</button>
                  <button onClick={() => setIsTrackerFilterOpen(false)} className="px-5 py-1.5 bg-neutral-950 hover:bg-neutral-800 transition text-white rounded-lg text-xs font-bold cursor-pointer">Uygula</button>
               </div>
             </div>
           </div>
        )}
    </div>
  );
}