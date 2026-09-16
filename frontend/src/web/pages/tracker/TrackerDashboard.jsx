import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Layers, Plus, Filter, X, Briefcase, Inbox, Clock, ShieldCheck, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { safeArray, safeString, safeLower, safeUpper, extractAddress, extractGPS, isCodeHiddenReq, extractCode, safeDateTime, getProviderContactDisplay, extractPhoneForWa } from '../../../core/utils/helpers';
import { UniversalMapController, SharedMapClickHandler } from '../../components/maps/MapComponents';

export default function TrackerDashboard() {
  const { session, API_BASE } = useAuth();

  const mapIcons = useMemo(() => ({
    custom: new L.DivIcon({ html: `<div style="margin-top: -32px; margin-left: -16px; filter: drop-shadow(0px 4px 2px rgba(0,0,0,0.3));"><svg width="32" height="32" viewBox="0 0 24 24" fill="#171717" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>`, className: '', iconSize: [0, 0], iconAnchor: [0, 0] }),
    urgent: new L.DivIcon({ html: `<div style="margin-top: -32px; margin-left: -16px; filter: drop-shadow(0px 4px 2px rgba(0,0,0,0.4));"><svg width="32" height="32" viewBox="0 0 24 24" fill="#e11d48" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>`, className: '', iconSize: [0, 0], iconAnchor: [0, 0] }),
    tracker: new L.DivIcon({ html: `<div style="margin-top: -32px; margin-left: -16px; filter: drop-shadow(0px 4px 2px rgba(0,0,0,0.4));"><svg width="32" height="32" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>`, className: '', iconSize: [0, 0], iconAnchor: [0, 0] })
  }), []);

  const trackerSearchInputRef = useRef(null);

  const [providerProfile, setProviderProfile] = useState(null);
  const [activeProviderRequests, setActiveProviderRequests] = useState([]);
  const [poolRequests, setPoolRequests] = useState([]);
  const [trackerRequests, setTrackerRequests] = useState([]);
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
  const [isTrackerProviderModalOpen, setIsTrackerProviderModalOpen] = useState(false);

  // WoZ State
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

  const fetchTrackerData = async () => {
    try {
      let pending = []; let matched = [];
      try { const reqRes = await axios.get(`${API_BASE}/requests/pending`); pending = safeArray(reqRes?.data?.requests); } catch (e) {}
      try { const matchRes = await axios.get(`${API_BASE}/requests/matched`); matched = safeArray(matchRes?.data?.requests); } catch (e) {}
      const allReqs = [...pending, ...matched];
      const uniqueReqsMap = new Map();
      allReqs.forEach(item => { if(item && item.id) uniqueReqsMap.set(item.id, item); });
      const uniqueReqs = Array.from(uniqueReqsMap.values()).sort((a, b) => b.id - a.id);
      setTrackerRequests(uniqueReqs);
    } catch (err) {}
  };

  const fetchProviderData = async () => {
    if (!session?.phone) return;
    try {
      const pRes = await axios.get(`${API_BASE}/providers/by-phone?phone=${encodeURIComponent(session.phone)}`);
      const prov = pRes?.data?.provider;
      if (!prov) return;
      setProviderProfile(prov);
      const rRes = await axios.get(`${API_BASE}/requests/provider-requests?providerId=${prov.id}&phone=${encodeURIComponent(session.phone)}`);
      setActiveProviderRequests(safeArray(rRes?.data?.requests).filter(r => r && ['MATCHED', 'ACCEPTED', 'PROVIDER_COMPLETED'].includes(safeUpper(r.status))));
      const poolRes = await axios.get(`${API_BASE}/requests/pool?providerId=${prov.id}`);
      setPoolRequests(safeArray(poolRes?.data?.poolRequests));
    } catch (err) {}
  };

  useEffect(() => {
    fetchTrackerData();
    fetchProviderData();
    const interval = setInterval(() => { fetchTrackerData(); fetchProviderData(); }, 5000);
    return () => clearInterval(interval);
  }, [session]);

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

  const handleStatusChange = async (requestId, newStatus) => { 
    try { await axios.post(`${API_BASE}/requests/${Number(requestId)}/status`, { newStatus }); await fetchTrackerData(); await fetchProviderData(); } catch (err) {} 
  };

  const handleProviderSkip = async (requestId) => {
    if (!window.confirm('Bu talebi pas geçmek istediğinize emin misiniz?')) return;
    try { await axios.post(`${API_BASE}/requests/${Number(requestId)}/status`, { newStatus: 'PROVIDER_SKIPPED' }); await fetchTrackerData(); await fetchProviderData(); } catch (err) { alert('İşlem başarısız oldu.'); }
  };

  const handleJoinPool = async (requestId) => { 
    if (!providerProfile) { alert("Önce profilinizi oluşturup kaydetmelisiniz!"); return; } 
    try { 
        await axios.post(`${API_BASE}/requests/${requestId}/join-pool`, { providerId: providerProfile.id }); 
        await fetchTrackerData(); await fetchProviderData();
        alert('Başarıyla sıraya girdiniz!');
    } catch (err) { alert(err.response?.data?.message || 'İşlem başarısız veya zaten sıradaydınız.'); } 
  };

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
      await fetchTrackerData(); alert("Talep başarıyla oluşturuldu.");
    } catch (err) { alert('Talep oluşturulamadı.'); } finally { setLoading(false); }
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
        
{/* SOL ÜST BUTONLAR */}
        <div className="absolute top-32 left-4 z-[400] flex flex-col space-y-2 items-start pointer-events-auto">
           {providerProfile && (
             <div className="bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-200/50 shadow-sm mb-1 pointer-events-none">
                           <span className="text-sm font-bold text-neutral-900 leading-tight">{providerProfile.name}</span>
                              <span className="text-[9px] font-mono text-neutral-500 block uppercase tracking-wider mb-0.5">Aktif Sağlayıcı</span>
             </div>
           )}
           <button onClick={() => setIsTrackerAddModalOpen(true)} className="flex items-center space-x-2 bg-neutral-950 text-white px-4 py-2.5 rounded-xl shadow-lg transition w-full sm:w-auto hover:bg-neutral-800"><Plus size={16} /> <span className="font-semibold text-sm">Talep Ekle</span></button>
           <button onClick={() => setIsTrackerListOpen(!isTrackerListOpen)} className="flex items-center space-x-2 bg-white text-neutral-900 border px-4 py-2.5 rounded-xl shadow-md transition w-full sm:w-auto hover:bg-neutral-50"><Layers size={16} /> <span className="font-semibold text-sm">Görev Listesi</span></button>
           {/* İşlerim butonu buradan kaldırıldı */}
        </div>


        {/* ANA HARİTA ALANI */}
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
                      <Popup className="custom-popup"><div className="w-48 p-1"><div className="flex justify-between items-center mb-1"><span className="text-[10px] font-mono font-bold bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">#REQ-{req.id}</span><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${reqStatus === 'POOL' ? 'bg-blue-100 text-blue-800' : reqStatus === 'MATCHED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{reqStatus || 'POOL'}</span></div><p className="text-xs font-bold text-neutral-900 leading-tight mb-1.5">"{req.raw_text}"</p><div className="text-[10px] font-mono text-neutral-500 space-y-0.5">{req.created_at && <p>⏰ {safeDateTime(req.created_at)}</p>}<p>📍 {extractAddress(req.location)}</p></div></div></Popup>
                    </Marker>
                  );
                }
                return null;
              })}
            </MapContainer>
          </div>
        </div>

        {/* SAĞ PANEL: LİSTE */}
        {isTrackerListOpen && (
          <div className="absolute top-16 right-0 w-[70vw] sm:w-[240px] md:w-[260px] min-w-[200px] max-w-[290px] h-[calc(100vh-64px)] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-[400] flex flex-col border-l border-neutral-200 animate-in slide-in-from-right duration-300">
             <div className="p-3 border-b border-neutral-100 bg-neutral-50/50 flex flex-col space-y-3">
                <div className="flex items-center justify-between"><h3 className="font-bold text-xs text-neutral-900 truncate pr-1">Operasyon Listesi ({filteredTrackerRequests.length})</h3><button onClick={() => setIsTrackerListOpen(false)} className="text-neutral-400 hover:text-neutral-800 p-1"><X size={14}/></button></div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1"><Search size={14} className="absolute left-2.5 top-2.5 text-neutral-400" /><input type="text" value={trackerSearch} onChange={(e) => setTrackerSearch(e.target.value)} placeholder="Talep ara..." className="w-full pl-8 pr-2 py-2 text-[11px] rounded-lg border outline-none bg-white focus:border-neutral-950 font-medium" /></div>
                    <button onClick={() => setIsTrackerFilterOpen(true)} className={`p-2 rounded-lg border transition shrink-0 flex items-center justify-center ${hasActiveFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white hover:bg-neutral-50 text-neutral-600'}`}><Filter size={15} /></button>
                  </div>
                  {providerProfile && (
                    <div className="grid grid-cols-2 gap-2 mt-0.5">
                      <label className={`flex items-center justify-center py-2 px-2 rounded-lg border cursor-pointer select-none shadow-sm text-[10px] font-bold ${showMyTrackerTasks ? 'bg-emerald-600 border-emerald-700 text-white' : 'bg-white'}`}><input type="checkbox" checked={showMyTrackerTasks} onChange={(e) => { setShowMyTrackerTasks(e.target.checked); if (e.target.checked) setIsTrackerPoolFilterActive(false); }} className="hidden" /><Briefcase size={12} className="mr-1.5"/> İşlerim</label>
                      <label className={`flex items-center justify-center py-2 px-2 rounded-lg border cursor-pointer select-none shadow-sm text-[10px] font-bold ${isTrackerPoolFilterActive ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-white'}`}><input type="checkbox" checked={isTrackerPoolFilterActive} onChange={(e) => { setIsTrackerPoolFilterActive(e.target.checked); if (e.target.checked) setShowMyTrackerTasks(false); }} className="hidden" /><Inbox size={12} className="mr-1.5"/> Uygun Havuz</label>
                    </div>
                  )}
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto p-2.5 space-y-2 bg-neutral-50 pb-20">
               {filteredTrackerRequests.map(req => {
                  const coords = extractGPS(req.location);
                  const isExpanded = expandedTrackerReqId === req.id;
                  const isMyTask = providerProfile ? activeProviderRequests.some(pr => Number(pr?.id) === Number(req.id)) : false;
                  const hasJoined = providerProfile && (safeArray(req.queuedProviders).some(qp => Number(qp?.id) === Number(providerProfile?.id)) || safeArray(req.queueList).some(qp => Number(qp?.id) === Number(providerProfile?.id)) || isMyTask);
                  const isMatch = providerProfile ? poolRequests.some(pr => Number(pr?.id) === Number(req.id)) : false;
                  
 const reqStatus = safeUpper(req.status);
                  
                  // 🔥 YENİ KURAL: Profil yoksa (gözlemci), eşleşme varsa, ya da zaten işe katılmışsa açılabilir.
                  const canExpand = !providerProfile || isMatch || hasJoined || isMyTask;

                  return (
                    <div key={req.id} onClick={() => { 
                        if(coords) { 
                            setTrackerMapCenter(coords); 
                            setTrackerMapSelectedPos(null); 
                            setCoordinates(''); 
                            if (window.innerWidth < 640) setIsTrackerListOpen(false); 
                        } 
                        // SADECE İZİNLİYSE GENİŞLET
                        if (canExpand) {
                            setExpandedTrackerReqId(prev => prev === req.id ? null : req.id); 
                        }
                    }} className={`p-3 rounded-xl border bg-white shadow-sm transition group cursor-pointer hover:border-blue-400 ${isExpanded ? 'border-blue-400 shadow-md ring-1 ring-blue-100' : ''}`}>
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-1.5"><span className="text-[10px] font-mono text-neutral-400 font-bold">#REQ-{req.id}</span><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${reqStatus === 'POOL' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>{reqStatus || 'POOL'}</span></div>
                        {providerProfile && hasJoined && !isMyTask && <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Sıradayınız</span>}
                        {providerProfile && isMyTask && <span className="text-[9px] font-bold text-white bg-emerald-600 px-1.5 py-0.5 rounded shadow-sm">Benim İşim</span>}
                      </div>
                      <h4 className="text-xs font-bold text-neutral-900 leading-snug line-clamp-2 mb-1.5">"{req.raw_text}"</h4>
                      
  {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-col gap-2 cursor-default" onClick={(e) => e.stopPropagation()}>
                           
                           {/* Eşleşmeyenler açılamadığı için uyarı yazısını sildik, sadece butonlar kaldı */}
                           {providerProfile && (reqStatus === 'POOL' || reqStatus === 'PENDING' || reqStatus === 'MATCHED') && !hasJoined && !isMyTask && (
                              <div className="flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); handleJoinPool(req.id); setExpandedTrackerReqId(null); }} className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition">
                                  Sıraya Gir
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setHiddenPoolRequests(prev => [...prev, req.id]); setExpandedTrackerReqId(null); }} className="px-3 py-1.5 border text-neutral-500 rounded-lg text-xs hover:bg-rose-50 hover:text-rose-600 transition">
                                  Kaldır
                                </button>
                              </div>
                           )}
                           
                           {/* 🔥 WhatsApp BUTONU EKLENDİ */}
                           {providerProfile && isMyTask && (
                             <div className="flex flex-col gap-2">
                               {/* Müşteri İletişim Bilgisi Gösterimi */}
                               <div className="bg-neutral-50 border border-neutral-200 p-2.5 rounded-lg flex items-center justify-between mb-1">
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-mono text-neutral-500 uppercase font-semibold">Müşteri İletişim</span>
                                    <span className="text-xs font-bold text-neutral-900 mt-0.5">{getProviderContactDisplay(req.contact_value)}</span>
                                  </div>
                                  {/* Eğer WhatsApp izni varsa ve numara gizli değilse butonu göster */}
                                  {safeString(req.preferred_channel).includes('WHATSAPP') && !safeString(req.contact_value).includes('HIDDEN') && (
                                     <a href={`https://wa.me/${extractPhoneForWa(req.contact_value)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-bold flex items-center space-x-1 shadow-sm transition shrink-0">
                                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                       <span>Yaz</span>
                                     </a>
                                  )}
                               </div>

                               {reqStatus === 'MATCHED' && <div className="flex gap-2"><button onClick={(e) => { e.stopPropagation(); handleStatusChange(req.id, 'ACCEPTED'); }} className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-700 transition">İşi Kabul Et</button><button onClick={(e) => { e.stopPropagation(); handleProviderSkip(req.id); }} className="px-3 py-1.5 border text-rose-600 rounded-lg text-[11px] hover:bg-rose-50 transition">Pas Geç</button></div>}
                               {reqStatus === 'ACCEPTED' && <button onClick={(e) => { e.stopPropagation(); handleStatusChange(req.id, 'PROVIDER_COMPLETED'); }} className="w-full py-2 bg-neutral-950 text-white rounded-lg text-[11px] font-semibold hover:bg-neutral-800 transition">İşi Teslim Et</button>}
                             </div>
                           )}

                           {/* DEFANSİF KUYRUK LİSTESİ ÇİZİMİ */}
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
                                                {qProv.interest_status === 'SKIPPED' && !isCurrent && <span className="text-[9px] bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded font-mono">PAS GEÇİLDİ</span>}
                                              </p>
                                              <p className="text-[10px] font-mono text-neutral-500 mt-1">📞 {qProv.phone || 'Gizli'}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {isCurrent && !isSkippedByThis && reqStatus === 'MATCHED' && (<button onClick={(e) => { e.stopPropagation(); handleStatusChange(req.id, 'ACCEPTED'); }} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-[10px] font-bold"><ShieldCheck size={10} /><span>Onayla</span></button>)}
                                                {!isCurrent && (<button onClick={(e) => { e.stopPropagation(); handleCustomerSelectCandidate(req.id, qProv.id); }} className="px-3 py-1.5 bg-neutral-950 text-white rounded text-[10px] font-bold flex items-center space-x-1"><Check size={10} /><span>Bunu Seç</span></button>)}
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



               })}
             </div>
          </div>
        )}

        {/* Modal: Tracker WoZ (Yeni Talep) */}
        {isTrackerAddModalOpen && (
           <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
             <div className="bg-white rounded-2xl max-w-lg w-full p-6 border shadow-xl">
                <div className="flex justify-between items-center mb-4 border-b pb-3"><h3 className="font-bold text-lg">Yeni Operasyon Ekle</h3><button onClick={() => setIsTrackerAddModalOpen(false)} className="hover:text-rose-600 transition"><X size={18}/></button></div>
                <form onSubmit={submitWoZRequest} className="space-y-4">
                  <textarea rows={2} required value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Talebi girin..." className="w-full p-3 border rounded-xl outline-none focus:border-neutral-900" />
                  
                  <div className="space-y-2">
                     <input type="text" value={locationValue} onChange={(e) => setLocationValue(e.target.value)} placeholder="Konum adı veya açık adres..." className="w-full p-2.5 border rounded-xl outline-none focus:border-neutral-900 text-sm" />
                     <input type="text" value={coordinates} onChange={(e) => setCoordinates(e.target.value)} placeholder="Koordinat (Haritadan seçin veya girin)" className="w-full p-2.5 border rounded-xl outline-none focus:border-neutral-900 text-xs font-mono bg-neutral-50 text-neutral-600" />
                  </div>

                  <button type="submit" disabled={loading || !queryText.trim()} className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 transition text-white rounded-xl font-bold">Operasyonu Başlat</button>
                </form>
             </div>
           </div>
        )}

        {/* Modal: Tracker Gelişmiş Filtre */}
        {isTrackerFilterOpen && (
           <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
             <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl border">
               <div className="flex justify-between items-center border-b pb-3"><h3 className="font-bold text-sm">Gelişmiş Filtreleme</h3><button onClick={() => setIsTrackerFilterOpen(false)} className="hover:text-rose-600 transition"><X size={16}/></button></div>
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
                  <button onClick={() => { setTrackerFilter({city:'', district:'', zip:'', code:''}); setIsTrackerFilterOpen(false); }} className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition">Filtreyi Temizle</button>
                  <button onClick={() => setIsTrackerFilterOpen(false)} className="px-5 py-1.5 bg-neutral-950 hover:bg-neutral-800 transition text-white rounded-lg text-xs font-bold">Uygula</button>
               </div>
             </div>
           </div>
        )}
    </div>
  );
}