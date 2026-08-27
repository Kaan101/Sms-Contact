import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';

// Harita Kütüphaneleri
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import { 
  ArrowRight, Phone, PhoneCall, MessageSquare, Mail, Plus, Trash2, Edit3, X, Clock, LogOut, 
  KeyRound, History, Building2, Check, Ban, ShieldCheck, SkipForward, Layers, Radio, 
  User, Wrench, Shield, Save, ChevronDown, ChevronUp, FolderKanban, Calendar, Star, 
  Sparkles, MapPin, Flame, Sliders, CheckCircle2, Navigation, FileCheck2, Search, Filter,
  ExternalLink, LogIn, UserCheck, Tag, MessageCircle, Inbox, Users, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw,
  Settings, Timer, AlertTriangle, Link2, Map as MapIcon, Crosshair
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const MAX_KEYWORD_CHARS = 1000;
const MAX_KEYWORD_COUNT = 50;

// Harita İkonları
const customMarkerIcon = new L.DivIcon({
  html: `<div style="margin-top: -32px; margin-left: -16px; filter: drop-shadow(0px 4px 2px rgba(0,0,0,0.3));">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#171717" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>
         </div>`,
  className: '', iconSize: [0, 0], iconAnchor: [0, 0]
});

const urgentMarkerIcon = new L.DivIcon({
  html: `<div style="margin-top: -32px; margin-left: -16px; filter: drop-shadow(0px 4px 2px rgba(0,0,0,0.4));">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#e11d48" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>
         </div>`,
  className: '', iconSize: [0, 0], iconAnchor: [0, 0]
});

const trackerSelectionIcon = new L.DivIcon({
  html: `<div style="margin-top: -32px; margin-left: -16px; filter: drop-shadow(0px 4px 2px rgba(0,0,0,0.4));">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>
         </div>`,
  className: '', iconSize: [0, 0], iconAnchor: [0, 0]
});

// İzole Edilmiş Güvenli Harita Bileşenleri
function TrackerMapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

function SharedMapClickHandler({ position, setPosition, setLocationValue, setCoordinates, icon }) {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (setPosition) setPosition({ lat, lng });
      if (setCoordinates) setCoordinates(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      if (setLocationValue) setLocationValue('Adres aranıyor...');
      
      axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`)
        .then(res => {
           const addr = res.data.address;
           const str = [addr.amenity, addr.road, addr.suburb, addr.city || addr.town || addr.province].filter(Boolean).join(', ');
           if (setLocationValue) setLocationValue(str || 'Haritadan İşaretlendi');
        }).catch(() => {
           if (setLocationValue) setLocationValue('Haritadan İşaretlendi');
        });
    }
  });
  
  useEffect(() => {
    if (position && !isNaN(position.lat) && !isNaN(position.lng)) {
      map.flyTo(position, map.getZoom() > 14 ? map.getZoom() : 16);
    }
  }, [position, map]);

  return position ? (
    <Marker 
      position={position} 
      icon={icon || customMarkerIcon} 
      eventHandlers={{
        click: () => {
          if (setPosition) setPosition(null);
          if (setCoordinates) setCoordinates('');
          if (setLocationValue) setLocationValue('');
        }
      }}
    />
  ) : null;
}

// İzole Edilmiş Admin Tablo Başlığı
function SortableHeader({ label, sortKey, align = "left", sortConfig, handleRequestSort }) {
  if (!sortConfig) return null;
  const isActive = sortConfig.key === sortKey;
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  const justifyClass = align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';
  
  return (
    <th className={`px-4 py-3 font-semibold border-b border-neutral-200 cursor-pointer hover:bg-neutral-100 transition group select-none whitespace-nowrap ${alignClass}`} onClick={() => handleRequestSort(sortKey)}>
      <div className={`flex items-center space-x-1 ${justifyClass}`}>
        <span>{label}</span>
        <span className={`${isActive ? 'text-neutral-900' : 'text-neutral-300 group-hover:text-neutral-500'} transition`}>
          {isActive ? (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : (<ArrowUpDown size={12} />)}
        </span>
      </div>
    </th>
  );
}

// Güvenli GPS Çıkarıcılar
const extractGPS = (loc) => {
  if(!loc || typeof loc !== 'string') return null;
  const match = loc.match(/\[GPS:\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\]/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
  }
  return null;
};
const extractAddress = (loc) => {
  if(!loc || typeof loc !== 'string') return 'Bilinmiyor';
  return loc.replace(/\[GPS:.*?\]/g, '').trim();
};

export default function App() {
  const [selectedRole, setSelectedRole] = useState('CUSTOMER');
  
  const [session, setSession] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRole = urlParams.get('role');
      const urlPhone = urlParams.get('phone');

      if (urlRole && urlPhone) {
        const directSession = {
          role: urlRole.toUpperCase(),
          phone: decodeURIComponent(urlPhone),
          authenticatedAt: new Date().toISOString()
        };
        localStorage.setItem('sc_session', JSON.stringify(directSession));
        window.history.replaceState({}, document.title, window.location.pathname);
        return directSession;
      }
      const saved = localStorage.getItem('sc_session');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [authStep, setAuthStep] = useState('PHONE');
  const [inputPhone, setInputPhone] = useState(() => localStorage.getItem('sc_last_phone') || '');
  const [inputOtp, setInputOtp] = useState('');
  const [simulatedCode, setSimulatedCode] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const emailInputRef = useRef(null);
  const mapSearchInputRef = useRef(null);
  const trackerSearchInputRef = useRef(null);

  // Müşteri State
  const [queryText, setQueryText] = useState('');
  const [disambiguationData, setDisambiguationData] = useState(null);
  const [selectedDisambiguation, setSelectedDisambiguation] = useState(null);
  
  const [preferredChannels, setPreferredChannels] = useState(['PHONE']);
  const [contactEmail, setContactEmail] = useState('');
  const [locationValue, setLocationValue] = useState('');
  const [coordinates, setCoordinates] = useState(''); 
  const [isUrgent, setIsUrgent] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59'); 
  const [isLocating, setIsLocating] = useState(false);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(true);
  
  const [mapPosition, setMapPosition] = useState(null);
  const [mapSearchText, setMapSearchText] = useState('');
  const [isMapSearching, setIsMapSearching] = useState(false);
  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setMapPosition({ lat: latitude, lng: longitude });
        setCoordinates(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        try {
          const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`);
          const addr = geoRes.data.address;
          const district = addr.suburb || addr.district || addr.town || addr.city_district || '';
          const city = addr.city || addr.province || '';
          setLocationValue(`${district}, ${city}`.replace(/^,\s*/, ''));
        } catch {
          setLocationValue(`Haritadan İşaretlendi`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        console.warn('Konum alınamadı:', err.message);
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    if (!isDetailsCollapsed && !mapPosition && !isLocating) {
      fetchCurrentLocation();
    }
    // eslint-disable-next-line
  }, [isDetailsCollapsed]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (mapSearchText.length > 2) {
        setIsMapSearching(true);
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchText)}&limit=5&countrycodes=tr`);
          setMapSuggestions(res.data);
          if (mapSearchInputRef.current === document.activeElement) {
            setIsSuggestionsVisible(true);
          }
        } catch (err) {} finally { setIsMapSearching(false); }
      } else {
        setMapSuggestions([]);
        setIsSuggestionsVisible(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [mapSearchText]);

  const [step, setStep] = useState('INPUT');
  const [loading, setLoading] = useState(false);
  const [myCustomerRequests, setMyCustomerRequests] = useState([]);
  const [isCustomerHistoryOpen, setIsCustomerHistoryOpen] = useState(false);
  const [searchCustomerHistoryText, setSearchCustomerHistoryText] = useState(''); 
  const [expandedCustomerQueueReqId, setExpandedCustomerQueueReqId] = useState(null);

  // Sağlayıcı State
  const [providerProfile, setProviderProfile] = useState(null);
  const [providerRequests, setProviderRequests] = useState([]);
  const [poolRequests, setPoolRequests] = useState([]); 
  const [providerTab, setProviderTab] = useState('ACTIVE');
  const [isPoolOpen, setIsPoolOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProviderHistoryOpen, setIsProviderHistoryOpen] = useState(false);
  const [providerFormData, setProviderFormData] = useState({ 
    name: '', phone: '', email: '', serviceKeywords: '', communicationChannels: ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'], priorityScore: 100 
  });

  // Admin State
  const [adminTab, setAdminTab] = useState('WOZ');
  const [matchedRequests, setMatchedRequests] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [providers, setProviders] = useState([]);
  const [selectedProviderMap, setSelectedProviderMap] = useState({});
  const [systemSettings, setSystemSettings] = useState({ default_deadline_days: 10, timeout_matched_mins: 15, timeout_accepted_hours: 24 });
  const [settingsTab, setSettingsTab] = useState('GENERAL');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
  const [expandedQueueReqId, setExpandedQueueReqId] = useState(null);
  const [wozAssignModalReq, setWozAssignModalReq] = useState(null);
  const [wozProviderSearch, setWozProviderSearch] = useState('');
  const [searchProviderText, setSearchProviderText] = useState('');
  const [searchMatchText, setSearchMatchText] = useState('');
  const [matchStatusFilter, setMatchStatusFilter] = useState('ALL');
  const [searchSmsText, setSearchSmsText] = useState('');
  const [smsRecipientFilter, setSmsRecipientFilter] = useState('ALL');
  
  const [features, setFeatures] = useState([]);
  const [expandedFeatureId, setExpandedFeatureId] = useState(null);
  const [newFeature, setNewFeature] = useState({ title: '', description: '', targetDate: new Date().toISOString().split('T')[0], status: 'BEKLİYOR', priority: 'ORTA' });
  
  const [tests, setTests] = useState([]);
  const [expandedTestId, setExpandedTestId] = useState(null);
  const [newTest, setNewTest] = useState({ title: '', description: '', testerName: 'İTÜ Test Ekibi', testDate: new Date().toISOString().split('T')[0], status: 'BEKLİYOR' });
  
  const [reviewRatingMap, setReviewRatingMap] = useState({});
  const [reviewCommentMap, setReviewCommentMap] = useState({});
  const [reviewedRequestsMap, setReviewedRequestsMap] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState(null);
  const [modalFormData, setModalFormData] = useState({ name: '', phone: '', email: '', serviceKeywords: '', communicationChannels: ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'], priorityScore: 100 });

  // TRACKER State
  const [trackerRequests, setTrackerRequests] = useState([]);
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (trackerMapSearchText.length > 2) {
        setIsTrackerMapSearching(true);
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trackerMapSearchText)}&limit=5&countrycodes=tr`);
          setTrackerMapSuggestions(res.data);
          if (trackerSearchInputRef.current === document.activeElement) {
            setIsTrackerSuggestionsVisible(true);
          }
        } catch (err) {} finally { setIsTrackerMapSearching(false); }
      } else {
        setTrackerMapSuggestions([]);
        setIsTrackerSuggestionsVisible(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [trackerMapSearchText]);

  const togglePreferredChannel = (channel) => {
    setPreferredChannels((prev) => {
      if (prev.includes(channel)) {
        if (prev.length === 1) return prev;
        return prev.filter((c) => c !== channel);
      } else {
        return [...prev, channel];
      }
    });
    setErrorMessage('');
  };

  const fetchCustomerData = async () => {
    if (!session?.phone) return;
    try {
      const res = await axios.get(`${API_BASE}/requests/my-requests?phone=${encodeURIComponent(session.phone)}`);
      setMyCustomerRequests(res.data.requests || []);
    } catch (err) {}
  };

  const fetchProviderData = async (shouldUpdateForm = false) => {
    if (!session?.phone) return;
    try {
      const pRes = await axios.get(`${API_BASE}/providers/by-phone?phone=${encodeURIComponent(session.phone)}`);
      const prov = pRes.data.provider;
      setProviderProfile(prov);

      if (shouldUpdateForm) {
        setProviderFormData({
          name: prov.name || '', phone: prov.phone || '', email: prov.email || '',
          serviceKeywords: (prov.service_keywords || []).join(', '),
          communicationChannels: prov.communication_channels || ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'],
          priorityScore: prov.priority_score || 100
        });
      }

      const rRes = await axios.get(`${API_BASE}/requests/provider-requests?providerId=${prov.id}&phone=${encodeURIComponent(session.phone)}`);
      setProviderRequests(rRes.data.requests || []);

      const poolRes = await axios.get(`${API_BASE}/requests/pool?providerId=${prov.id}`);
      setPoolRequests(poolRes.data.poolRequests || []);
    } catch (err) {
      if (err.response?.status === 404) { setProviderProfile(null); setProviderRequests([]); setPoolRequests([]); }
    }
  };

  const fetchFeatures = async () => { try { const res = await axios.get(`${API_BASE}/features`); setFeatures(res.data.features || []); } catch (err) {} };
  const fetchTests = async () => { try { const res = await axios.get(`${API_BASE}/tests`); setTests(res.data.tests || []); } catch (err) {} };
  
  const fetchAdminData = async () => {
    try {
      const [reqRes, provRes, matchRes, logRes] = await Promise.all([
        axios.get(`${API_BASE}/requests/pending`), axios.get(`${API_BASE}/providers`),
        axios.get(`${API_BASE}/requests/matched`), axios.get(`${API_BASE}/notifications`)
      ]);
      setPendingRequests(reqRes.data.requests || []); 
      setProviders(provRes.data.providers || []);
      setMatchedRequests(matchRes.data.requests || []); 
      setSmsLogs(logRes.data.notifications || []);
      await fetchFeatures(); 
      await fetchTests();
      try { const setRes = await axios.get(`${API_BASE}/settings`); if (setRes.data.settings) setSystemSettings(setRes.data.settings); } catch (e) {}
    } catch (err) {}
  };

  const fetchTrackerData = async () => {
    try {
      let pending = []; let matched = [];
      try { const reqRes = await axios.get(`${API_BASE}/requests/pending`); pending = reqRes.data.requests || []; } catch (e) {}
      try { const matchRes = await axios.get(`${API_BASE}/requests/matched`); matched = matchRes.data.requests || []; } catch (e) {}
      
      const allReqs = [...pending, ...matched];
      const uniqueReqsMap = new Map();
      allReqs.forEach(item => uniqueReqsMap.set(item.id, item));
      const uniqueReqs = Array.from(uniqueReqsMap.values());
      uniqueReqs.sort((a, b) => b.id - a.id);
      setTrackerRequests(uniqueReqs);
    } catch (err) {}
  };

  useEffect(() => {
    if (session) {
      if (session.role === 'CUSTOMER') fetchCustomerData();
      if (session.role === 'PROVIDER') fetchProviderData(true);
      if (session.role === 'ADMIN') fetchAdminData();
      if (session.role === 'TRACKER') fetchTrackerData();

      const interval = setInterval(() => {
        if (session.role === 'PROVIDER') fetchProviderData(false);
        if (session.role === 'CUSTOMER') fetchCustomerData();
        if (session.role === 'ADMIN' && (adminTab === 'SMS_LOGS' || adminTab === 'ALL_MATCHED' || adminTab === 'WOZ')) fetchAdminData();
        if (session.role === 'TRACKER') fetchTrackerData();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [session, adminTab]);

  const handleSendOtp = async (e) => { 
    e.preventDefault(); if (!inputPhone.trim()) return; setAuthLoading(true); setErrorMessage(''); 
    try { 
      const res = await axios.post(`${API_BASE}/auth/send-otp`, { phone: inputPhone.trim() }); 
      setSimulatedCode(res.data.simulatedOtp); 
      setAuthStep('OTP'); 
      localStorage.setItem('sc_last_phone', inputPhone.trim());
    } catch (err) { setErrorMessage(err.response?.data?.message || 'OTP gönderilemedi.'); } 
    finally { setAuthLoading(false); } 
  };
  
  const handleVerifyOtp = async (e) => { 
    e.preventDefault(); if (!inputOtp.trim()) return; setAuthLoading(true); setErrorMessage(''); 
    try { 
      await axios.post(`${API_BASE}/auth/verify-otp`, { phone: inputPhone.trim(), otpCode: inputOtp.trim() }); 
      const newSession = { role: selectedRole, phone: inputPhone.trim(), authenticatedAt: new Date().toISOString() }; 
      setSession(newSession); localStorage.setItem('sc_session', JSON.stringify(newSession)); 
      setIsProfileOpen(false); setAuthStep('PHONE'); setInputOtp(''); 
    } catch (err) { setErrorMessage(err.response?.data?.message || 'Doğrulama kodu hatalı.'); } 
    finally { setAuthLoading(false); } 
  };
  
  const handleLogout = () => { 
    localStorage.removeItem('sc_session'); 
    setSession(null); setProviderProfile(null); setIsProfileOpen(false); setIsCustomerHistoryOpen(false); 
    setIsProviderHistoryOpen(false); setMyCustomerRequests([]); setStep('INPUT'); setAdminTab('WOZ');
  };

  const handleOpenProviderDirectSession = (provPhone) => {
    if (!provPhone) return;
    const cleanPhone = encodeURIComponent(provPhone.trim());
    const directUrl = `${window.location.origin}${window.location.pathname}?role=PROVIDER&phone=${cleanPhone}`;
    window.open(directUrl, '_blank');
  };

  const submitFinalRequest = async (disambiguationChoice, fromTracker = false) => {
    setLoading(true);
    const deadlineDatetimeISO = deadlineDate ? `${deadlineDate}T${deadlineTime || '23:59'}:00` : null;
    const finalContactValue = preferredChannels.includes('EMAIL') ? `${contactEmail.trim()} (Tel: ${session.phone})` : session.phone;
    const channelString = preferredChannels.join(', ');

    const backendLocation = coordinates ? `${locationValue || 'Belirtilmedi'} [GPS: ${coordinates}]` : (locationValue || 'Belirtilmedi');

    try {
      await axios.post(`${API_BASE}/requests`, {
        rawText: queryText, disambiguationChoice: disambiguationChoice, contactValue: finalContactValue,
        preferredChannel: channelString, location: backendLocation, isUrgent: isUrgent, deadlineDatetime: deadlineDatetimeISO
      });
      setQueryText(''); setSelectedDisambiguation(null); setDeadlineDate(''); setDeadlineTime('23:59'); setContactEmail(''); 
      setLocationValue(''); setCoordinates(''); setPreferredChannels(['PHONE']); setStep('INPUT'); setIsDetailsCollapsed(true); 
      setMapPosition(null); setMapSearchText(''); setIsUrgent(false); setErrorMessage('');
      
      if (fromTracker) {
        setIsTrackerAddModalOpen(false);
        setTrackerMapSelectedPos(null);
        setTrackerMapSelectedAddress('');
        setTrackerMapSearchText('');
        fetchTrackerData();
        alert("Talep başarıyla oluşturuldu ve haritaya eklendi.");
      } else {
        await fetchCustomerData();
      }
    } catch (err) { setErrorMessage(err.response?.data?.message || 'Talep oluşturulamadı.'); } 
    finally { setLoading(false); }
  };

  const handleCustomerCombinedSubmit = async (e, fromTracker = false) => {
    e?.preventDefault(); if (!queryText.trim()) return;
    if (preferredChannels.includes('EMAIL') && !contactEmail.trim()) { setIsDetailsCollapsed(false); setTimeout(() => { if (emailInputRef.current) emailInputRef.current.focus(); }, 100); return; }
    setLoading(true); setErrorMessage('');
    try {
      const response = await axios.post(`${API_BASE}/disambiguate`, { queryText: queryText.trim() });
      if (response.data.status === 'ambiguous') { setDisambiguationData(response.data); setStep('DISAMBIGUATE'); setLoading(false); } 
      else { await submitFinalRequest(null, fromTracker); }
    } catch { await submitFinalRequest(null, fromTracker); }
  };

  const handleRepeatRequest = (req) => { setQueryText(req.raw_text); if (req.location) setLocationValue(extractAddress(req.location)); setIsUrgent(req.is_urgent || false); setStep('INPUT'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleJoinPool = async (requestId) => { if (!providerProfile) { alert("Önce profilinizi oluşturup kaydetmelisiniz!"); setIsProfileOpen(true); return; } try { await axios.post(`${API_BASE}/requests/${requestId}/join-pool`, { providerId: providerProfile.id }); await fetchProviderData(false); setProviderTab('ACTIVE'); } catch (err) { alert('Hata oluştu.'); } };
  const handleCustomerNextProvider = async (requestId) => { try { await axios.post(`${API_BASE}/requests/${Number(requestId)}/next-provider`); await fetchCustomerData(); if (session.role === 'PROVIDER') await fetchProviderData(false); } catch (err) {} };
  const handleCustomerSelectCandidate = async (requestId, providerId) => { try { await axios.post(`${API_BASE}/requests/${Number(requestId)}/select-candidate`, { providerId: Number(providerId) }); setExpandedCustomerQueueReqId(null); await fetchCustomerData(); if (session.role === 'PROVIDER') await fetchProviderData(false); } catch (err) {} };
  const handleStatusChange = async (requestId, newStatus) => { try { await axios.post(`${API_BASE}/requests/${Number(requestId)}/status`, { newStatus }); if (session.role === 'CUSTOMER') await fetchCustomerData(); if (session.role === 'PROVIDER') await fetchProviderData(false); if (session.role === 'ADMIN') await fetchAdminData(); } catch (err) {} };
  const handleDeleteRequest = async (requestId) => { if (!window.confirm('Bu talebi silmek istediğinize emin misiniz?')) return; try { await axios.delete(`${API_BASE}/requests/${Number(requestId)}`); if (session.role === 'CUSTOMER') await fetchCustomerData(); if (session.role === 'PROVIDER') await fetchProviderData(false); if (session.role === 'ADMIN') await fetchAdminData(); if (session.role === 'TRACKER') await fetchTrackerData(); } catch {} };

  const handleSendReview = async (requestId, reviewerType, isSkip = false) => { try { const rating = isSkip ? null : (reviewRatingMap[requestId] || 5); const comment = isSkip ? null : (reviewCommentMap[requestId] || ''); await axios.post(`${API_BASE}/reviews`, { requestId: Number(requestId), reviewerType, rating, comment }); setReviewedRequestsMap(prev => ({ ...prev, [`${requestId}_${reviewerType}`]: true })); if (session.role === 'CUSTOMER') await fetchCustomerData(); if (session.role === 'PROVIDER') await fetchProviderData(false); } catch (err) {} };
  
  const handleCreateTest = async (e) => { e.preventDefault(); if (!newTest.title.trim()) return; try { await axios.post(`${API_BASE}/tests`, newTest); setNewTest({ title: '', description: '', testerName: 'İTÜ Test Ekibi', testDate: new Date().toISOString().split('T')[0], status: 'BEKLİYOR' }); await fetchTests(); } catch (err) {} };
  const handleUpdateTest = async (id, updatedFields) => { try { await axios.put(`${API_BASE}/tests/${id}`, updatedFields); await fetchTests(); } catch (err) {} };
  const handleDeleteTest = async (id) => { if (!window.confirm('Emin misiniz?')) return; try { await axios.delete(`${API_BASE}/tests/${id}`); await fetchTests(); } catch {} };
  
  const handleCreateFeature = async (e) => { e.preventDefault(); if (!newFeature.title.trim()) return; try { await axios.post(`${API_BASE}/features`, newFeature); setNewFeature({ title: '', description: '', targetDate: new Date().toISOString().split('T')[0], status: 'BEKLİYOR', priority: 'ORTA' }); await fetchFeatures(); } catch (err) {} };
  const handleUpdateFeature = async (id, updatedFields) => { try { await axios.put(`${API_BASE}/features/${id}`, updatedFields); await fetchFeatures(); } catch (err) {} };
  const handleDeleteFeature = async (id) => { if (!window.confirm('Emin misiniz?')) return; try { await axios.delete(`${API_BASE}/features/${id}`); await fetchFeatures(); } catch {} };
  
  const handleSaveProviderProfile = async (e) => { 
    e.preventDefault(); 
    const keywordsArray = providerFormData.serviceKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean); 
    const payload = { name: providerFormData.name.trim(), phone: session.phone, email: providerFormData.email ? providerFormData.email.trim() : null, serviceKeywords: keywordsArray.slice(0, MAX_KEYWORD_COUNT), communicationChannels: providerFormData.communicationChannels, priorityScore: parseInt(providerFormData.priorityScore, 10) || 100 }; 
    try { 
      if (providerProfile) await axios.put(`${API_BASE}/providers/${providerProfile.id}`, payload); 
      else await axios.post(`${API_BASE}/providers`, payload); 
      setIsProfileOpen(false); 
      await fetchProviderData(true); 
      alert("Profil başarıyla kaydedildi!");
    } catch (err) {
      alert(err.response?.data?.message || "Profil güncellenirken hata oluştu.");
    } 
  };
  
  const handleAdminAssign = async (requestId, providerId) => { const pId = providerId || selectedProviderMap[requestId]; if (!pId) return; try { await axios.post(`${API_BASE}/requests/assign`, { requestId: parseInt(requestId, 10), providerId: parseInt(pId, 10) }); setWozAssignModalReq(null); await fetchAdminData(); } catch {} };
  
  // 🌟 DÜZELTME: Sessiz hata (silent error) yakalama eklendi
  const handleAdminSaveProvider = async (e) => { 
    e.preventDefault(); 
    const keywordsArray = modalFormData.serviceKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean); 
    const payload = { name: modalFormData.name.trim(), phone: modalFormData.phone.trim(), email: modalFormData.email ? modalFormData.email.trim() : null, serviceKeywords: keywordsArray.slice(0, MAX_KEYWORD_COUNT), communicationChannels: modalFormData.communicationChannels, priorityScore: parseInt(modalFormData.priorityScore, 10) || 100 }; 
    try { 
      if (editingProviderId) await axios.put(`${API_BASE}/providers/${editingProviderId}`, payload); 
      else await axios.post(`${API_BASE}/providers`, payload); 
      setIsModalOpen(false); 
      await fetchAdminData(); 
      alert("Sağlayıcı başarıyla kaydedildi!");
    } catch (err) {
      alert(err.response?.data?.message || "Sağlayıcı kaydedilemedi. Telefon numarası zaten mevcut olabilir.");
    } 
  };
  
  const handleAdminDeleteProvider = async (id) => { 
    if (!window.confirm('Sağlayıcıyı silmek istediğinize emin misiniz?')) return; 
    try { 
      await axios.delete(`${API_BASE}/providers/${id}`); 
      await fetchAdminData(); 
      alert("Sağlayıcı başarıyla silindi.");
    } catch (err) {
      alert("Silme işlemi başarısız oldu.");
    } 
  };
  
  const handleSaveSystemSetting = async (key, value) => { try { await axios.put(`${API_BASE}/settings`, { key, value }); alert('Sistem parametresi başarıyla güncellendi!'); } catch (err) { alert('Hata: Yaptığınız ayar kaydedilemedi.'); } };

  // Filtrelemeler
  const activeCustomerRequests = myCustomerRequests.filter(r => ['POOL', 'MATCHED', 'ACCEPTED', 'PROVIDER_COMPLETED', 'MANUAL_INTERVENTION', 'PENDING'].includes((r.status || '').toUpperCase()));
  const pendingReviewCustomerRequests = myCustomerRequests.filter(r => (r.status || '').toUpperCase() === 'COMPLETED' && !(r.customer_rating !== null || reviewedRequestsMap[`${r.id}_CUSTOMER`]));
  const pastCustomerRequests = myCustomerRequests.filter(r => (r.status || '').toUpperCase() === 'CANCELLED' || ((r.status || '').toUpperCase() === 'COMPLETED' && (r.customer_rating !== null || reviewedRequestsMap[`${r.id}_CUSTOMER`])));
  const filteredPastCustomerRequests = pastCustomerRequests.filter(req => { const q = searchCustomerHistoryText.toLowerCase().trim(); if (!q) return true; return (req.raw_text || '').toLowerCase().includes(q) || (req.provider_name || '').toLowerCase().includes(q) || (req.status || '').toLowerCase().includes(q); });
  
  const activeProviderRequests = providerRequests.filter(r => ['MATCHED', 'ACCEPTED', 'PROVIDER_COMPLETED'].includes((r.status || '').toUpperCase()));
  const pastProviderRequests = providerRequests.filter(r => ['COMPLETED', 'CANCELLED'].includes((r.status || '').toUpperCase()));
  
  const filteredProviders = providers.filter(p => { const q = searchProviderText.toLowerCase().trim(); if (!q) return true; return (p.name || '').toLowerCase().includes(q) || (p.phone || '').toLowerCase().includes(q) || (p.service_keywords || []).some(k => k.toLowerCase().includes(q)); });
  const filteredMatchedRequests = matchedRequests.filter(r => { const q = searchMatchText.toLowerCase().trim(); const statusMatch = matchStatusFilter === 'ALL' || r.status === matchStatusFilter; if (!statusMatch) return false; if (!q) return true; return (r.raw_text || '').toLowerCase().includes(q) || (r.contact_value || '').toLowerCase().includes(q) || (r.provider_name || '').toLowerCase().includes(q) || (r.provider_phone || '').toLowerCase().includes(q) || String(r.id).includes(q); });
  
  const filteredTrackerRequests = trackerRequests.filter(r => {
    const q = trackerSearch.toLowerCase().trim();
    if (!q) return true;
    return (r.raw_text || '').toLowerCase().includes(q) || 
           (r.contact_value || '').toLowerCase().includes(q) || 
           (r.location || '').toLowerCase().includes(q) ||
           String(r.id).includes(q);
  });

  const handleRequestSort = (key) => { let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'; setSortConfig({ key, direction }); };
  
  const sortedMatchedRequests = useMemo(() => { 
    let sortableItems = [...filteredMatchedRequests]; 
    if (sortConfig !== null) { 
      sortableItems.sort((a, b) => { 
        let valA = a[sortConfig.key]; let valB = b[sortConfig.key]; 
        if (sortConfig.key === 'queue') { valA = a.queueList ? a.queueList.length : 0; valB = b.queueList ? b.queueList.length : 0; } 
        else if (sortConfig.key === 'provider_name') { valA = a.provider_name || ''; valB = b.provider_name || ''; } 
        else if (sortConfig.key === 'location') { valA = a.location || ''; valB = b.location || ''; } 
        else if (sortConfig.key === 'raw_text') { valA = a.raw_text || ''; valB = b.raw_text || ''; } 
        else if (sortConfig.key === 'contact_value') { valA = a.contact_value || ''; valB = b.contact_value || ''; } 
        else if (sortConfig.key === 'status') { valA = a.status || ''; valB = b.status || ''; } 
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1; 
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1; 
        return 0; 
      }); 
    } 
    return sortableItems; 
  }, [filteredMatchedRequests, sortConfig]);
  
  const filteredSmsLogs = smsLogs.filter(log => { const q = searchSmsText.toLowerCase().trim(); const recipientMatch = smsRecipientFilter === 'ALL' || log.recipient_type === smsRecipientFilter; if (!recipientMatch) return false; if (!q) return true; return (log.recipient_phone || '').toLowerCase().includes(q) || (log.message_body || '').toLowerCase().includes(q); });
  
  const filteredWozProviders = providers.filter(p => { 
    const q = wozProviderSearch.toLowerCase().trim(); 
    if (!q) return true; 
    return (p.name || '').toLowerCase().includes(q) || 
           (p.phone || '').toLowerCase().includes(q) || 
           (p.service_keywords || []).some(k => k.toLowerCase().includes(q)); 
  });
  
  const extractEmail = (text) => { const match = text?.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/); return match ? match[1] : null; };
  const extractPhone = (str) => { const match = str?.match(/(\+?\d[\d\s-]{8,})/); return match ? match[1].replace(/[^\d+]/g, '') : ''; };

  let mainContainerClass = "w-full mx-auto px-6 py-8 flex-1 flex flex-col justify-start transition-all duration-300 max-w-5xl";
  if (session?.role === 'ADMIN') mainContainerClass = "w-full mx-auto px-6 py-8 flex-1 flex flex-col justify-start transition-all duration-300 max-w-[100%]";
  if (session?.role === 'TRACKER') mainContainerClass = "w-full max-w-full p-0 m-0 relative flex-1 flex flex-col bg-neutral-100 overflow-hidden";

  return (
    <div className={`min-h-screen bg-[#FBFBFC] text-neutral-900 flex flex-col justify-between font-sans selection:bg-neutral-900 selection:text-white ${session?.role === 'TRACKER' ? 'overflow-hidden' : ''}`}>
      
      {/* 🧭 NAVIGATION */}
      <header className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-[500]">
        <div className={`${session?.role === 'ADMIN' || session?.role === 'TRACKER' ? 'w-full' : 'max-w-5xl'} mx-auto px-6 h-16 flex items-center justify-between transition-all duration-300`}>
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setStep('INPUT')}>
            <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center text-white shadow-sm font-mono text-sm font-semibold tracking-tighter">
              MB
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-base tracking-tight text-neutral-950">Mobool</span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-medium hidden sm:inline">Protocol 13.5 (Error Fallback)</span>
            </div>
          </div>

          {session && (
            <div className="flex items-center space-x-3">
              <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase border ${
                session.role === 'CUSTOMER' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                session.role === 'PROVIDER' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                session.role === 'TRACKER' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                'bg-neutral-900 text-white border-neutral-900'
              }`}>
                {session.role === 'CUSTOMER' ? '👤 Müşteri' : session.role === 'PROVIDER' ? '🛠️ Sağlayıcı' : session.role === 'TRACKER' ? '🗺️ Takip' : '⚙️ Admin'}
              </span>
              <span className="text-xs font-mono text-neutral-600 hidden sm:inline">{session.phone}</span>
              <button onClick={handleLogout} title="Çıkış Yap" className="p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition"><LogOut size={16} /></button>
            </div>
          )}
        </div>
      </header>

      {/* 🏛️ MAIN CONTENT */}
      <main className={mainContainerClass}>
        
        {/* Hata Mesajı */}
        {errorMessage && session?.role !== 'TRACKER' && (
          <div className="w-full mb-4 p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center justify-between mt-8">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-700 ml-4"><X size={14} /></button>
          </div>
        )}

        {/* ---------------- 1. GİRİŞ EKRANI ---------------- */}
        {!session && (
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-8 max-w-md mx-auto w-full space-y-6 mt-8">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-neutral-950 text-white rounded-2xl mx-auto flex items-center justify-center shadow-sm font-mono text-lg font-bold"><KeyRound size={22} /></div>
              <h2 className="text-2xl font-bold tracking-tight text-neutral-950">Giriş Yapın</h2>
              <p className="text-xs text-neutral-500">Lütfen sisteme hangi rolde bağlanmak istediğinizi seçin.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-neutral-100 rounded-xl border border-neutral-200 text-xs font-semibold">
              <button type="button" onClick={() => { setSelectedRole('CUSTOMER'); setAuthStep('PHONE'); }} className={`py-2.5 rounded-lg transition flex flex-col items-center space-y-1 ${selectedRole === 'CUSTOMER' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}><User size={16} /><span>Müşteri</span></button>
              <button type="button" onClick={() => { setSelectedRole('PROVIDER'); setAuthStep('PHONE'); }} className={`py-2.5 rounded-lg transition flex flex-col items-center space-y-1 ${selectedRole === 'PROVIDER' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}><Wrench size={16} /><span>Sağlayıcı</span></button>
              <button type="button" onClick={() => { setSelectedRole('ADMIN'); setAuthStep('PHONE'); }} className={`py-2.5 rounded-lg transition flex flex-col items-center space-y-1 ${selectedRole === 'ADMIN' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}><Shield size={16} /><span>Admin</span></button>
              <button type="button" onClick={() => { setSelectedRole('TRACKER'); setAuthStep('PHONE'); }} className={`py-2.5 rounded-lg transition flex flex-col items-center space-y-1 ${selectedRole === 'TRACKER' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}><MapIcon size={16} /><span>Takip</span></button>
            </div>

            {authStep === 'PHONE' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1.5">{selectedRole === 'PROVIDER' ? 'İşletme / Sağlayıcı Telefonu' : 'Telefon Numaranız'}</label>
                  <input type="tel" inputMode="tel" required value={inputPhone} onChange={(e) => setInputPhone(e.target.value)} placeholder="+90 5XX XXX XX XX" className="w-full p-3 text-sm font-mono rounded-xl border border-neutral-200 focus:border-neutral-950 outline-none" />
                </div>
                <button type="submit" disabled={authLoading || !inputPhone.trim()} className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white rounded-xl text-xs font-semibold tracking-wide transition shadow-sm flex items-center justify-center space-x-2">
                  {authLoading ? <span>Kod Gönderiliyor...</span> : <><span>Doğrulama Kodu İste</span><ArrowRight size={14} /></>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {simulatedCode && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-mono flex items-center justify-between">
                    <span>Simüle SMS Kodu:</span><span className="font-bold text-lg tracking-widest text-neutral-950">{simulatedCode}</span>
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1.5">4 Haneli Kod (Çift tıkla yapıştır)</label>
                  <input 
                    type="tel" 
                    inputMode="numeric" 
                    pattern="[0-9]*" 
                    required 
                    maxLength={4} 
                    value={inputOtp} 
                    onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))} 
                    onDoubleClick={() => { if(simulatedCode) setInputOtp(String(simulatedCode)); }}
                    placeholder="1234" 
                    className="w-full p-3 text-center text-2xl tracking-[0.4em] font-mono font-bold rounded-xl border border-neutral-200 focus:border-neutral-950 outline-none cursor-pointer" 
                    title="Simüle edilen kodu yapıştırmak için çift tıklayın"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button type="button" onClick={() => setAuthStep('PHONE')} className="w-1/3 py-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-xl">Değiştir</button>
                  <button type="submit" disabled={authLoading || inputOtp.length < 4} className="w-2/3 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white text-xs font-semibold rounded-xl transition">{authLoading ? 'Doğrulanıyor...' : 'Giriş Yap'}</button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ---------------- 2. MÜŞTERİ EKRANI ---------------- */}
        {session?.role === 'CUSTOMER' && (
          <div className="max-w-3xl mx-auto w-full space-y-6">
              
              {/* Aktif Talepler */}
              {activeCustomerRequests.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 space-y-3">
                  <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-neutral-500 flex items-center space-x-1.5">
                    <Radio size={14} className="text-emerald-500 animate-pulse" />
                    <span>Aktif Talepleriniz ({activeCustomerRequests.length})</span>
                  </h3>

                  <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
                    {activeCustomerRequests.map((req) => (
                      <div key={req.id} className="bg-[#FAFBFD] rounded-xl border border-neutral-200/90 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-neutral-400">#REQ-{req.id}</span>
                            <h4 className="text-sm font-bold text-neutral-950 leading-snug mt-0.5">"{req.raw_text}"</h4>
                            {req.disambiguation_choice && (
                              <span className="inline-block px-2 py-0.5 bg-neutral-200/70 text-neutral-700 text-[11px] rounded font-medium mt-1">Hedef: {req.disambiguation_choice}</span>
                            )}
                          </div>
                          <div>
                            {req.status === 'POOL' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">Açık Havuzda (Bekleniyor)</span>}
                            {req.status === 'MATCHED' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">Sağlayıcı Bulundu</span>}
                            {req.status === 'ACCEPTED' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">Kabul Edildi</span>}
                            {req.status === 'PROVIDER_COMPLETED' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">Sağlayıcı Teslim Etti</span>}
                          </div>
                        </div>

                        {/* Kuyruk Kontrolü */}
                        {(req.provider_name || (req.queuedProviders && req.queuedProviders.length > 0)) && (
                          <div className="mt-2 bg-white border border-emerald-200 rounded-lg shadow-sm overflow-hidden transition-all duration-300">
                            <div onClick={() => { if (req.queuedProviders && req.queuedProviders.length > 0 && !(req.provider_name && req.queuedProviders.length === 1)) { setExpandedCustomerQueueReqId(expandedCustomerQueueReqId === req.id ? null : req.id); } }} className={`p-3 flex items-center justify-between ${(req.queuedProviders && req.queuedProviders.length > 0 && !(req.provider_name && req.queuedProviders.length === 1)) ? 'cursor-pointer hover:bg-emerald-50/50 select-none' : ''}`}>
                              <div className="space-y-1.5 w-full">
                                <div className="text-[10px] font-mono font-bold text-emerald-700">{req.provider_name ? 'ŞU ANKİ AKTİF SAĞLAYICI' : 'AKTİF SAĞLAYICI YOK (HAVUZDA)'}</div>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center space-x-1.5">
                                    <Building2 size={14} className="text-neutral-700" />
                                    {req.provider_name ? (<><span className="font-bold text-neutral-950">{req.provider_name}</span><span className="font-mono text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">📞 {req.provider_phone}</span></>) : (<span className="font-bold text-neutral-500 italic">Sıradaki sağlayıcı bekleniyor...</span>)}
                                  </div>
                                  {req.queuedProviders && req.queuedProviders.length > 0 && !(req.provider_name && req.queuedProviders.length === 1) && (
                                    <div className="flex items-center space-x-1 text-neutral-400"><span className="text-[10px] font-bold">{req.provider_name ? `Diğer Adaylar (${req.queuedProviders.length - 1})` : `Tüm Adaylar (${req.queuedProviders.length})`}</span>{expandedCustomerQueueReqId === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                            {(req.status === 'ACCEPTED' || req.status === 'PROVIDER_COMPLETED') && !expandedCustomerQueueReqId && (
                              <div className="px-3 pb-3">
                                 <div className={`p-2 rounded text-[11px] flex items-center space-x-1.5 ${req.status === 'PROVIDER_COMPLETED' ? 'bg-purple-50 border border-purple-200 text-purple-950' : 'bg-emerald-50 border border-emerald-200 text-emerald-950'}`}>
                                   {req.status === 'PROVIDER_COMPLETED' ? <ShieldCheck size={13} className="text-purple-700" /> : <PhoneCall size={13} className="text-emerald-700 animate-bounce" />}
                                   <span>{req.status === 'PROVIDER_COMPLETED' ? <>Sağlayıcı işlemi tamamladığını bildirdi. Onayınız bekleniyor: <strong>{req.provider_phone}</strong></> : <>Sağlayıcı talebi aldı. İletişime geçiliyor: <strong>{req.provider_phone}</strong></>}</span>
                                 </div>
                              </div>
                            )}
                            {expandedCustomerQueueReqId === req.id && req.queuedProviders && req.queuedProviders.length > 0 && (
                              <div className="p-3 pt-1 border-t border-emerald-100 bg-neutral-50/50">
                                <div className="space-y-2">
                                  {req.queuedProviders.map((qProv, idx) => {
                                    const isCurrent = req.matched_provider_id === qProv.id;
                                    return (
                                      <div key={qProv.id} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${isCurrent ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-neutral-200 hover:border-neutral-300'}`}>
                                        <div>
                                          <p className="font-bold text-neutral-900 flex items-center space-x-1.5"><span>#{idx + 1} {qProv.name}</span>{isCurrent && <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono">ŞU AN AKTİF</span>}{qProv.interest_status === 'SKIPPED' && !isCurrent && <span className="text-[9px] bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded font-mono">PAS GEÇİLDİ</span>}{qProv.interest_status === 'WAITING' && !isCurrent && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-mono">BEKLİYOR</span>}</p>
                                          <p className="text-[10px] font-mono text-neutral-500 mt-1">📞 {qProv.phone}</p>
                                        </div>
                                        {!isCurrent && (<button onClick={(e) => { e.stopPropagation(); handleCustomerSelectCandidate(req.id, qProv.id); }} className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded text-[10px] font-bold shadow-sm transition flex items-center space-x-1"><Check size={10} /><span>Bunu Seç</span></button>)}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-100 mt-2">
                          <span>📍 {extractAddress(req.location)}</span>{req.is_urgent && <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold border border-rose-200">ACİL</span>}{req.deadline_datetime && <span>⏰ En Son: {new Date(req.deadline_datetime).toLocaleString('tr-TR')}</span>}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-xs">
                          <div className="flex items-center space-x-1.5">{(req.status === 'MATCHED' || req.status === 'PROVIDER_COMPLETED' || req.status === 'ACCEPTED') && req.queuedProviders && req.queuedProviders.length > 1 && (<button onClick={() => handleCustomerNextProvider(req.id)} className="px-2.5 py-1 border hover:bg-neutral-100 rounded text-[11px] font-semibold flex items-center space-x-1 text-neutral-700"><SkipForward size={11} /><span>Otomatik Sıradakine Geç</span></button>)}</div>
                          <div className="flex items-center space-x-1.5 ml-auto">{(req.status === 'MATCHED' || req.status === 'PROVIDER_COMPLETED') && (<button onClick={() => handleStatusChange(req.id, 'COMPLETED')} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center space-x-1 shadow-sm"><ShieldCheck size={12} /><span>{req.status === 'PROVIDER_COMPLETED' ? 'Onayla & Tamamla' : 'Hizmeti Tamamla'}</span></button>)}<button onClick={() => handleStatusChange(req.id, 'CANCELLED')} className="px-2 py-1 border hover:bg-neutral-100 text-neutral-600 rounded text-[11px]" title="Talebi İptal Et"><Ban size={12} /> İptal</button></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Değerlendirme */}
              {pendingReviewCustomerRequests.length > 0 && (
                <div className="bg-white rounded-2xl border-2 border-emerald-400/80 shadow-md p-5 space-y-4">
                  <div className="flex items-center space-x-2 text-emerald-800"><Sparkles size={18} className="text-amber-500" /><h3 className="text-xs font-mono uppercase font-bold tracking-wider">Hizmet Tamamlandı! Lütfen Değerlendirin ({pendingReviewCustomerRequests.length})</h3></div>
                  <div className="space-y-3">
                    {pendingReviewCustomerRequests.map((req) => (
                      <div key={req.id} className="bg-emerald-50/40 rounded-xl border border-emerald-200 p-4 space-y-3">
                        <div className="flex items-start justify-between"><div><span className="text-[10px] font-mono text-neutral-400">#REQ-{req.id}</span><p className="text-sm font-bold text-neutral-900">"{req.raw_text}"</p><p className="text-[11px] text-neutral-500 font-mono mt-0.5">Sağlayıcı: <strong className="text-neutral-800">{req.provider_name || 'Bilinmiyor'}</strong> {req.provider_phone && <span className="ml-1 text-neutral-600 font-mono">({req.provider_phone})</span>}</p></div><span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">ONAYLANDI</span></div>
                        <div className="p-3 bg-white rounded-lg border border-neutral-200/90 space-y-2.5">
                          <div className="flex items-center justify-between"><span className="font-bold text-neutral-800 text-xs">Hizmet Deneyiminizi Puanlayın:</span><div className="flex items-center space-x-1">{[1, 2, 3, 4, 5].map((star) => (<button key={star} type="button" onClick={() => setReviewRatingMap({ ...reviewRatingMap, [req.id]: star })} className={`p-0.5 transition ${star <= (reviewRatingMap[req.id] || 5) ? 'text-amber-500 fill-amber-500' : 'text-neutral-300'}`}><Star size={18} fill={star <= (reviewRatingMap[req.id] || 5) ? '#f59e0b' : 'none'} /></button>))}</div></div>
                          <input type="text" value={reviewCommentMap[req.id] || ''} onChange={(e) => setReviewCommentMap({ ...reviewCommentMap, [req.id]: e.target.value })} placeholder="Açıklama veya yorumunuzu yazın (opsiyonel)..." className="w-full p-2.5 text-xs rounded-lg border outline-none bg-neutral-50 focus:border-neutral-950" />
                          <div className="flex items-center justify-end space-x-2 pt-1"><button type="button" onClick={() => handleSendReview(req.id, 'CUSTOMER', true)} className="px-3 py-1.5 text-neutral-500 hover:bg-neutral-100 rounded-lg text-xs font-semibold">Yorum Yapmadan Geç</button><button type="button" onClick={() => handleSendReview(req.id, 'CUSTOMER', false)} className="px-4 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-sm">Puanı Gönder</button></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🌟 YENİ TALEP FORMU */}
              {step === 'INPUT' && (
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-3">
                  <div className="text-center space-y-1 mb-2">
                    <h2 className="text-xl font-extrabold tracking-tight text-neutral-950">Hangi Hizmete İhtiyacınız Var?</h2>
                    <p className="text-xs text-neutral-500">Doğal dil ile talebinizi yazın; açık havuzda en uygun sağlayıcılar sıraya girsin.</p>
                  </div>
                  
                  <form onSubmit={(e) => handleCustomerCombinedSubmit(e, false)} className="space-y-4">
                    <div className="bg-[#FAFBFD] rounded-xl border border-neutral-200 p-3 focus-within:ring-2 focus-within:ring-neutral-950 transition-all">
                      <div className="flex gap-2">
                        <textarea rows={2} value={queryText} onChange={(e) => setQueryText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCustomerCombinedSubmit(e, false); } }} placeholder="Örn: Tarabya'da 2+1 kiralık daire arıyorum..." className="w-full p-2 text-lg font-bold text-neutral-900 placeholder:text-neutral-400 placeholder:font-normal bg-transparent border-none outline-none resize-none" required />
                        <button type="button" onClick={() => setIsDetailsCollapsed(!isDetailsCollapsed)} className="p-1.5 mt-1 text-neutral-500 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg h-fit transition"><ChevronDown size={16} /></button>
                      </div>
                      
                      {/* Özet Satırı */}
                      <div className="flex flex-wrap items-start gap-4 px-2 pb-3 pt-1 text-[11px] font-mono text-neutral-500">
                        <div className="flex flex-col leading-tight">
                          <span className="flex items-center space-x-1">
                            <MapPin size={12} className="text-neutral-700"/>
                            <span className="truncate max-w-[250px] sm:max-w-[300px] font-semibold text-neutral-800">{locationValue || 'Konum Seçilmedi'}</span>
                          </span>
                          {coordinates && <span className="pl-4 text-[9.5px] mt-0.5 text-neutral-400 tracking-wide">{coordinates}</span>}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
                          {isUrgent && <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">ACİL</span>}
                          {deadlineDate && <span className="flex items-center space-x-1"><Clock size={12}/><span>{deadlineDate} {deadlineTime}</span></span>}
                          <div className="flex items-center space-x-2 border-l border-neutral-200 pl-2">
                            {preferredChannels.map((c, idx) => (
                              <React.Fragment key={c}>
                                <span className="flex items-center space-x-1">
                                  {c === 'PHONE' && <Phone size={11} />}
                                  {c === 'SMS' && <MessageSquare size={11} />}
                                  {c === 'EMAIL' && <Mail size={11} />}
                                  {c === 'WHATSAPP' && <MessageCircle size={11} />}
                                  <span>{c === 'PHONE' ? 'Telefon' : c === 'SMS' ? 'SMS' : c === 'EMAIL' ? 'E-posta' : 'WhatsApp'}</span>
                                </span>
                                {idx < preferredChannels.length - 1 && <span className="text-neutral-300">•</span>}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Gelişmiş Seçenekler Izgarası */}
                      {!isDetailsCollapsed && (
                        <div className="mt-2 pt-5 border-t border-neutral-200/70 flex flex-col md:grid md:grid-cols-5 gap-6">
                          
                          {/* SOL: 2/5 */}
                          <div className="md:col-span-2 space-y-5">
                            <div>
                                <label className="text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1.5 flex items-center justify-between">
                                  <span className="flex items-center space-x-1"><Calendar size={12} className="text-neutral-700"/><span>Zamanlama</span></span>
                                  {deadlineDate && <button type="button" onClick={() => {setDeadlineDate(''); setDeadlineTime('23:59');}} className="text-[10px] text-rose-500 hover:underline lowercase">temizle</button>}
                                </label>
                                <div className="flex items-center gap-2">
                                  <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} className="flex-1 min-w-0 p-2 text-xs font-mono rounded-lg border outline-none focus:border-neutral-950 transition" />
                                  <input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} className="w-20 p-2 text-xs font-mono rounded-lg border outline-none focus:border-neutral-950 text-center shrink-0 transition" title="En Son Saat" />
                                  <label className={`flex items-center justify-center px-2.5 h-[34px] rounded-lg border cursor-pointer select-none transition shrink-0 ${isUrgent ? 'bg-rose-50 border-rose-300' : 'bg-white border-neutral-200 hover:bg-neutral-50'}`}>
                                    <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="hidden" />
                                    <span className={`text-xs font-bold ${isUrgent ? 'text-rose-700' : 'text-neutral-700'}`}>ACİL</span>
                                  </label>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                              <label className="text-[11px] font-mono uppercase font-semibold text-neutral-500 block mb-1.5">İletişim Tercihi</label>
                              <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => togglePreferredChannel('PHONE')} className={`p-2 rounded-lg border text-xs flex items-center justify-center space-x-1.5 transition ${preferredChannels.includes('PHONE') ? 'border-neutral-950 bg-neutral-950 text-white' : 'bg-white hover:bg-neutral-50 text-neutral-700'}`}><Phone size={13} /><span>Telefon</span></button>
                                <button type="button" onClick={() => togglePreferredChannel('SMS')} className={`p-2 rounded-lg border text-xs flex items-center justify-center space-x-1.5 transition ${preferredChannels.includes('SMS') ? 'border-neutral-950 bg-neutral-950 text-white' : 'bg-white hover:bg-neutral-50 text-neutral-700'}`}><MessageSquare size={13} /><span>SMS</span></button>
                                <button type="button" onClick={() => togglePreferredChannel('EMAIL')} className={`p-2 rounded-lg border text-xs flex items-center justify-center space-x-1.5 transition ${preferredChannels.includes('EMAIL') ? 'border-neutral-950 bg-neutral-950 text-white' : 'bg-white hover:bg-neutral-50 text-neutral-700'}`}><Mail size={13} /><span>E-posta</span></button>
                                <button type="button" onClick={() => togglePreferredChannel('WHATSAPP')} className={`p-2 rounded-lg border text-xs flex items-center justify-center space-x-1.5 transition ${preferredChannels.includes('WHATSAPP') ? 'border-emerald-700 bg-emerald-700 text-white' : 'bg-white hover:bg-neutral-50 text-neutral-700'}`}><MessageCircle size={13} /><span>WhatsApp</span></button>
                              </div>
                              {preferredChannels.includes('EMAIL') && (
                                <div className="animate-in fade-in duration-150 pt-1">
                                  <input ref={emailInputRef} type="email" required value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); if (errorMessage) setErrorMessage(''); }} placeholder="E-posta Adresiniz..." className="w-full p-2 text-xs rounded-lg border border-neutral-200 outline-none bg-white focus:border-neutral-950 font-medium" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* SAĞ PARÇA: 3/5 */}
                          <div className="md:col-span-3 flex flex-col pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-neutral-100 md:pl-6 min-h-[350px]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-mono uppercase font-semibold text-neutral-500 flex items-center space-x-1"><MapPin size={12} className="text-neutral-700" /><span>Haritadan Konum Seçin</span></span>
                              <button type="button" onClick={fetchCurrentLocation} disabled={isLocating} className="text-[10px] font-mono text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 transition"><Navigation size={10} className={isLocating ? 'animate-spin' : ''} /> <span>Mevcut Konuma Git</span></button>
                            </div>
                            
                            <div className="relative w-full h-[300px] md:h-[400px] flex-1 rounded-xl overflow-hidden border border-neutral-300 z-0 bg-neutral-50 shadow-inner mt-1">
                               <div className="absolute top-2 left-2 right-2 z-[1000]">
                                  <div className="relative">
                                    <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
                                    <input 
                                      ref={mapSearchInputRef}
                                      type="text" 
                                      value={mapSearchText} 
                                      onChange={(e) => setMapSearchText(e.target.value)} 
                                      onDoubleClick={() => setMapSearchText('')} 
                                      onFocus={() => { if(mapSuggestions.length > 0) setIsSuggestionsVisible(true); }} 
                                      onBlur={() => setTimeout(() => setIsSuggestionsVisible(false), 200)} 
                                      placeholder="Haritada mekan veya adres ara..." 
                                      className="w-full pl-8 pr-8 py-2 text-xs rounded-lg border-none outline-none focus:ring-2 focus:ring-neutral-900 shadow-md bg-white/90 backdrop-blur-sm transition" 
                                    />
                                    {isMapSearching && <Navigation size={14} className="absolute right-3 top-2.5 animate-spin text-blue-500" />}
                                    
                                    {isSuggestionsVisible && mapSuggestions.length > 0 && (
                                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-48 overflow-y-auto z-[9999]">
                                        {mapSuggestions.map((sug, idx) => (
                                          <div key={idx} className="p-2.5 text-xs text-neutral-700 hover:bg-blue-50 cursor-pointer flex items-start space-x-2 transition" onMouseDown={(e) => { e.preventDefault(); const newPos = { lat: parseFloat(sug.lat), lng: parseFloat(sug.lon) }; setMapPosition(newPos); setCoordinates(`${newPos.lat.toFixed(6)}, ${newPos.lng.toFixed(6)}`); setLocationValue(sug.display_name); setMapSearchText(''); setIsSuggestionsVisible(false); }}>
                                            <MapPin size={12} className="text-neutral-400 mt-0.5 shrink-0" /><span>{sug.display_name}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                               </div>
                               
                               <MapContainer center={mapPosition || [41.0082, 28.9784]} zoom={mapPosition ? 15 : 12} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                 <ZoomControl position="bottomleft" />
                                 <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                                 <SharedMapClickHandler 
                                   position={mapPosition} 
                                   setPosition={setMapPosition} 
                                   setLocationValue={setLocationValue} 
                                   setCoordinates={setCoordinates} 
                                   icon={customMarkerIcon} 
                                 />
                               </MapContainer>
                            </div>
                          </div>

                        </div>
                      )}
                      <div className="flex items-center justify-end pt-4 mt-2 border-t border-neutral-200/60 px-1">
                        <button type="submit" disabled={loading || !queryText.trim()} className="px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5">
                           {loading ? <span>Gönderiliyor...</span> : <><span>Talebi Gönder</span><ArrowRight size={14} /></>}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* D. BELİRSİZLİK ÇÖZÜM EKRANI */}
              {step === 'DISAMBIGUATE' && disambiguationData && (
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4">
                  <div className="text-center"><h3 className="font-extrabold text-lg text-neutral-950">Hizmet Amacını Netleştirelim</h3></div>
                  <div className="space-y-2">{disambiguationData.options.map((option) => (<button key={option.id} onClick={() => { setSelectedDisambiguation(option.text); submitFinalRequest(option.text); }} className="w-full text-left p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-950 hover:bg-neutral-50 text-xs font-semibold">{option.text}</button>))}</div>
                </div>
              )}

              {/* Geçmiş Talepler */}
              {pastCustomerRequests.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm mt-8">
                  <div onClick={() => setIsCustomerHistoryOpen(!isCustomerHistoryOpen)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 select-none">
                    <h3 className="text-xs font-mono uppercase font-bold text-neutral-700">Geçmiş Talepler ({pastCustomerRequests.length})</h3>
                  </div>
                  {isCustomerHistoryOpen && (
                    <div className="p-4 pt-0 border-t border-neutral-100">
                      <div className="relative mb-3 mt-3">
                        <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
                        <input type="text" value={searchCustomerHistoryText} onChange={(e) => setSearchCustomerHistoryText(e.target.value)} onDoubleClick={() => setSearchCustomerHistoryText('')} placeholder="Geçmiş taleplerde ara (talep, sağlayıcı vs.)..." className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border outline-none bg-neutral-50 focus:border-neutral-950 font-medium" />
                        {searchCustomerHistoryText && <button onClick={() => setSearchCustomerHistoryText('')} className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700"><X size={13} /></button>}
                      </div>
                      <div className="space-y-3 mt-3 max-h-[350px] overflow-y-auto">
                        {filteredPastCustomerRequests.map((req) => (
                           <div key={req.id} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 text-xs">
                             <div className="flex items-start justify-between"><div><p className="font-semibold text-neutral-900">"{req.raw_text}"</p><p className="text-[10px] text-neutral-500 font-mono mt-0.5">{new Date(req.created_at).toLocaleDateString('tr-TR')}</p></div><span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-neutral-200">{req.status}</span></div>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

          </div>
        )}

        {/* ---------------- 3. SERVİS SAĞLAYICI EKRANI ---------------- */}
        {session?.role === 'PROVIDER' && (
          <div className="max-w-3xl mx-auto w-full space-y-5">
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 flex items-start justify-between">
                 <div>
                   <h2 className="text-xl font-extrabold text-neutral-950 tracking-tight">
                     {providerProfile?.name ? providerProfile.name : 'Sağlayıcı Paneli'}
                   </h2>
                   <div className="flex items-center space-x-1.5 text-xs text-neutral-500 font-mono mt-1">
                     <Phone size={12} /><span>{session.phone}</span>
                   </div>
                 </div>
                 <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="px-3.5 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-xl transition flex items-center space-x-1.5 shadow-sm">
                   <Edit3 size={13} /><span>Profili Düzenle</span>
                 </button>
              </div>

              {isProfileOpen && (
                <form onSubmit={handleSaveProviderProfile} className="bg-white p-5 rounded-2xl border shadow-sm space-y-3.5">
                  <input type="text" required value={providerFormData.name} onChange={(e) => setProviderFormData({ ...providerFormData, name: e.target.value })} placeholder="İşletme Adı" className="w-full p-2 text-xs rounded-lg border outline-none" />
                  <textarea rows={3} required value={providerFormData.serviceKeywords} onChange={(e) => setProviderFormData({ ...providerFormData, serviceKeywords: e.target.value })} placeholder="su, damacana..." className="w-full p-2 text-xs rounded-lg border outline-none" />
                  <button type="submit" className="px-4 py-2 bg-neutral-950 text-white rounded-xl text-xs font-semibold">Profili Kaydet</button>
                </form>
              )}

              <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
                <h3 className="text-xs font-mono uppercase font-bold text-neutral-950">Aktif İşlerim ({activeProviderRequests.length})</h3>
                <div className="space-y-3">
                  {activeProviderRequests.map((req) => (
                    <div key={req.id} className="bg-[#FAFBFD] p-4 rounded-xl border space-y-3">
                       <p className="text-sm font-semibold text-neutral-900">"{req.raw_text}" - <span className="text-[10px] bg-blue-100 text-blue-800 px-2 rounded">{req.status}</span></p>
                       <p className="text-xs text-neutral-700">Müşteri: {req.contact_value}</p>
                       {req.status === 'MATCHED' && <button onClick={() => handleStatusChange(req.id, 'ACCEPTED')} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold">Kabul Et</button>}
                       {req.status === 'ACCEPTED' && <button onClick={() => handleStatusChange(req.id, 'PROVIDER_COMPLETED')} className="px-3 py-1 bg-neutral-950 text-white rounded text-xs font-semibold">Teslim Et</button>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
                <h3 className="text-xs font-mono uppercase font-bold text-neutral-700">Açık Talep Havuzu ({poolRequests.length})</h3>
                <div className="space-y-3">
                  {poolRequests.map((req) => (
                    <div key={req.id} className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm space-y-3">
                      <p className="text-sm font-semibold text-neutral-900">"{req.raw_text}"</p>
                      <button onClick={() => handleJoinPool(req.id)} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">Sıraya Gir</button>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        )}

        {/* ---------------- 4. TRACKER (TAKİP) EKRANI ---------------- */}
        {session?.role === 'TRACKER' && (
          <div className="absolute inset-0 top-16 bg-neutral-100 overflow-hidden flex z-0">
              <div className="absolute top-4 left-4 z-[400] flex flex-col space-y-2">
                 <button onClick={() => setIsTrackerAddModalOpen(true)} className="flex items-center space-x-2 bg-neutral-950 text-white px-4 py-2.5 rounded-xl shadow-lg transition"><Plus size={16} /> <span className="font-semibold text-sm">Talep Ekle</span></button>
                 <button onClick={() => setIsTrackerListOpen(!isTrackerListOpen)} className="flex items-center space-x-2 bg-white text-neutral-900 border px-4 py-2.5 rounded-xl shadow-md transition"><Layers size={16} /> <span className="font-semibold text-sm">Görev Listesi</span></button>
              </div>

              {/* HARİTA ALANI */}
              <div className="flex-1 w-full h-full relative z-0">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] w-[90vw] sm:w-96 max-w-[400px]">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3.5 text-neutral-400" />
                    <input 
                      ref={trackerSearchInputRef}
                      type="text" 
                      value={trackerMapSearchText} 
                      onChange={(e) => setTrackerMapSearchText(e.target.value)} 
                      onDoubleClick={() => setTrackerMapSearchText('')}
                      onFocus={() => setIsTrackerSuggestionsVisible(true)} 
                      onBlur={() => setTimeout(() => setIsTrackerSuggestionsVisible(false), 200)} 
                      placeholder="Haritada adres ara ve git..." 
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl outline-none shadow-lg bg-white/90 backdrop-blur-sm transition" 
                    />
                  </div>
                  {isTrackerSuggestionsVisible && trackerMapSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl max-h-60 overflow-y-auto z-[9999]">
                      {trackerMapSuggestions.map((sug, idx) => (
                        <div 
                           key={idx} 
                           className="p-3 text-xs text-neutral-700 hover:bg-blue-50 cursor-pointer flex items-start space-x-2 transition" 
                           onMouseDown={(e) => { 
                             e.preventDefault(); 
                             const newPos = { lat: parseFloat(sug.lat), lng: parseFloat(sug.lon) }; 
                             setTrackerMapCenter([newPos.lat, newPos.lng]); 
                             setTrackerMapSelectedPos(newPos); 
                             setCoordinates(`${newPos.lat.toFixed(6)}, ${newPos.lng.toFixed(6)}`); 
                             setLocationValue(sug.display_name); // Form Location State
                             setTrackerMapSearchText(''); // Harita Search Temizlenir
                             setIsTrackerSuggestionsVisible(false); 
                           }}
                        >
                          <MapPin size={14} className="text-neutral-400 mt-0.5 shrink-0" /><span>{sug.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <MapContainer center={trackerMapCenter} zoom={12} style={{ height: '100%', width: '100%' }} className="z-0" zoomControl={false}>
                  <ZoomControl position="bottomleft" />
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <TrackerMapController center={trackerMapCenter} />
                  
                  <SharedMapClickHandler 
                     position={trackerMapSelectedPos} 
                     setPosition={setTrackerMapSelectedPos} 
                     setLocationValue={(val) => {
                        setLocationValue(val); 
                     }} 
                     setCoordinates={setCoordinates} 
                     icon={trackerSelectionIcon} 
                  />
                  
                  {filteredTrackerRequests.map(req => {
                    const coords = extractGPS(req.location);
                    if (coords) {
                      return (
                        <Marker position={coords} icon={req.is_urgent ? urgentMarkerIcon : customMarkerIcon} key={req.id}>
                          <Popup className="custom-popup">
                            <div className="w-48 p-1">
                               <div className="flex justify-between items-center mb-1"><span className="text-[10px] font-mono font-bold bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">#REQ-{req.id}</span><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${req.status === 'POOL' ? 'bg-blue-100 text-blue-800' : req.status === 'MATCHED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>{req.status}</span></div>
                               <p className="text-xs font-bold text-neutral-900 leading-tight mb-1.5">"{req.raw_text}"</p>
                               <div className="text-[10px] font-mono text-neutral-500 space-y-0.5"><p>👤 {req.contact_value}</p><p>📍 {extractAddress(req.location)}</p>{req.provider_name && <p>🏢 {req.provider_name}</p>}</div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    }
                    return null;
                  })}
                </MapContainer>
              </div>

              {/* SAĞ LİSTE PANELİ */}
              {isTrackerListOpen && (
                <div className="absolute top-0 right-0 w-[85vw] sm:w-[35vw] md:w-[30vw] min-w-[220px] max-w-[360px] h-full bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-[400] flex flex-col border-l border-neutral-200 animate-in slide-in-from-right duration-300">
                  <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col space-y-3">
                    <div className="flex items-center justify-between"><h3 className="font-bold text-sm text-neutral-900 truncate">Operasyon Listesi ({filteredTrackerRequests.length})</h3><button onClick={() => setIsTrackerListOpen(false)} className="text-neutral-400 hover:text-neutral-800 transition shrink-0"><X size={16}/></button></div>
                    <div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-neutral-400" /><input type="text" value={trackerSearch} onChange={(e) => setTrackerSearch(e.target.value)} onDoubleClick={() => setTrackerSearch('')} placeholder="Talep ara..." className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border outline-none bg-white focus:border-neutral-950 font-medium border-neutral-200 transition" /></div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-neutral-50 pb-20">
                    {filteredTrackerRequests.map(req => {
                      const coords = extractGPS(req.location);
                      return (
                        <div 
                           key={req.id} 
                           onClick={() => { 
                             if(coords) {
                               setTrackerMapCenter(coords); 
                               setTrackerMapSelectedPos(null); // 🌟 Seçimi Temizle
                               setTrackerMapSelectedAddress('');
                               setCoordinates('');
                             } 
                           }} 
                           className={`p-3 rounded-xl border bg-white shadow-sm transition group ${coords ? 'cursor-pointer hover:border-blue-400 hover:shadow-md' : 'opacity-70 cursor-not-allowed border-neutral-200'}`}
                        >
                          <div className="flex items-start justify-between mb-1"><span className="text-[10px] font-mono text-neutral-400">#REQ-{req.id}</span><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${req.status === 'POOL' ? 'bg-blue-50 text-blue-700 border border-blue-100' : req.status === 'MATCHED' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>{req.status}</span></div>
                          <h4 className="text-xs font-bold text-neutral-900 leading-snug line-clamp-2 mb-1.5">"{req.raw_text}"</h4>
                          <div className="space-y-1 text-[10px] font-mono text-neutral-500">
                             <p className="flex items-start space-x-1.5"><User size={10} className="shrink-0 mt-0.5 text-neutral-400"/> <span className="truncate">{req.contact_value}</span></p>
                             <p className="flex items-start space-x-1.5"><MapPin size={10} className="shrink-0 mt-0.5 text-neutral-400"/> <span className="line-clamp-2">{extractAddress(req.location)}</span></p>
                             {coords ? (<p className="flex items-center space-x-1.5 text-blue-600 mt-1 font-semibold group-hover:text-blue-800 transition"><Crosshair size={10}/> <span>Haritada Göster</span></p>) : (<p className="text-rose-400 mt-1 italic">Koordinat bulunamadı</p>)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* YENİ TALEP EKLEME MODALI */}
              {isTrackerAddModalOpen && (
                <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
                  <div className="bg-white rounded-2xl max-w-4xl w-full p-6 border border-neutral-200 shadow-xl max-h-[95vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
                       <div><h3 className="font-bold text-lg text-neutral-950">Manuel Operasyon Ekle</h3><p className="text-xs text-neutral-500 font-mono mt-0.5">Merkezden havuza yeni talep bırakın.</p></div>
                       <button onClick={() => setIsTrackerAddModalOpen(false)} className="p-1.5 text-neutral-400 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition"><X size={18}/></button>
                    </div>

                    <form onSubmit={(e) => handleCustomerCombinedSubmit(e, true)} className="space-y-4">
                      
                      <div className="bg-[#FAFBFD] rounded-xl border border-neutral-200 p-3 focus-within:ring-2 focus-within:ring-neutral-950 transition-all">
                        <textarea rows={2} value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Müşterinin talebini girin (Örn: Çekiciye ihtiyacım var)..." className="w-full p-2 text-base font-bold text-neutral-900 bg-transparent border-none outline-none resize-none" required />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                          {/* SOL: 2/5 */}
                          <div className="md:col-span-2 space-y-4">
                            <div>
                                <label className="text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1.5 flex items-center space-x-1"><Calendar size={12} className="text-neutral-700"/><span>Operasyon Zamanlaması</span></label>
                                <div className="flex items-center gap-2">
                                  <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} className="flex-1 min-w-0 p-2 text-xs font-mono rounded-lg border outline-none focus:border-neutral-950 transition" />
                                  <input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} className="w-20 p-2 text-xs font-mono rounded-lg border outline-none focus:border-neutral-950 text-center shrink-0 transition" title="En Son Saat" />
                                </div>
                            </div>
                            
                            <label className={`flex items-center justify-center p-3 rounded-xl border cursor-pointer select-none transition ${isUrgent ? 'bg-rose-50 border-rose-300' : 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100'}`}>
                                <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="hidden" />
                                <div className="flex items-center space-x-2 font-bold"><Flame size={16} className={isUrgent ? 'text-rose-600 animate-bounce' : 'text-neutral-400'} /><span className={isUrgent ? 'text-rose-700' : 'text-neutral-700'}>ACİL MÜDAHALE (KIRMIZI KOD)</span></div>
                            </label>
                          </div>

                          {/* SAĞ: 3/5 */}
                          <div className="md:col-span-3 space-y-3 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-neutral-100 md:pl-6">
                            <label className="text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1.5 flex items-center space-x-1"><MapPin size={12} className="text-neutral-700"/><span>Konum Verisi</span></label>
                            <div className="space-y-2">
                               <input type="text" value={locationValue} onChange={(e) => setLocationValue(e.target.value)} onDoubleClick={() => setLocationValue('')} placeholder="Açık adres veya konum adı..." className="w-full p-2.5 text-sm rounded-xl border outline-none bg-white focus:border-neutral-950 font-medium transition" />
                               <input type="text" value={coordinates} onChange={(e) => setCoordinates(e.target.value)} onDoubleClick={() => setCoordinates('')} placeholder="Koordinat (Örn: 40.123, 29.123)" className="w-full p-2.5 text-xs rounded-xl border outline-none bg-neutral-50 focus:bg-white focus:border-neutral-950 font-mono transition" />
                            </div>
                            <p className="text-[10px] text-neutral-400 font-mono leading-relaxed">Haritadan veya arama çubuğundan seçtiğiniz konum bilgileri buraya otomatik olarak yansıtılmıştır. Dilerseniz manuel düzeltebilirsiniz.</p>
                          </div>
                      </div>

                      <div className="flex items-center justify-end pt-4 mt-4 border-t border-neutral-200/60">
                        <button type="button" onClick={() => setIsTrackerAddModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold text-neutral-600 mr-2 hover:bg-neutral-50 transition">Vazgeç</button>
                        <button type="submit" disabled={loading || !queryText.trim()} className="px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-sm font-bold shadow-md transition flex items-center space-x-2">
                           {loading ? <span>Başlatılıyor...</span> : <><span>Operasyonu Başlat</span><ArrowRight size={16} /></>}
                        </button>
                      </div>

                    </form>
                  </div>
                </div>
              )}

          </div>
        )}

        {/* ---------------- 5. ADMİN EKRANI ---------------- */}
        {session?.role === 'ADMIN' && (
          <div className="w-full mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <h2 className="text-lg font-bold text-neutral-950">Sistem Yönetim Paneli</h2>

                <div className="flex flex-wrap items-center gap-1 bg-neutral-100 p-1 rounded-lg border text-xs font-semibold">
                  <button onClick={() => setAdminTab('WOZ')} className={`px-3 py-1 rounded-md ${adminTab === 'WOZ' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>WoZ Havuzu ({pendingRequests.length})</button>
                  <button onClick={() => setAdminTab('PROVIDERS')} className={`px-3 py-1 rounded-md ${adminTab === 'PROVIDERS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>Sağlayıcılar ({filteredProviders.length}/{providers.length})</button>
                  <button onClick={() => setAdminTab('ALL_MATCHED')} className={`px-3 py-1 rounded-md flex items-center space-x-1 ${adminTab === 'ALL_MATCHED' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}><Layers size={13} /><span>Tüm Eşleşmeler</span></button>
                  <button onClick={() => setAdminTab('SMS_LOGS')} className={`px-3 py-1 rounded-md ${adminTab === 'SMS_LOGS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>SMS Log ({filteredSmsLogs.length})</button>
                  <button onClick={() => setAdminTab('TESTS')} className={`px-3 py-1 rounded-md flex items-center space-x-1.5 ${adminTab === 'TESTS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}><FileCheck2 size={13} /><span>Test Senaryoları ({tests.length})</span></button>
                  <button onClick={() => setAdminTab('PROJECT')} className={`px-3 py-1 rounded-md flex items-center space-x-1.5 ${adminTab === 'PROJECT' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}><FolderKanban size={13} /><span>Yol Haritası ({features.length})</span></button>
                  <button onClick={() => setAdminTab('SETTINGS')} className={`px-3 py-1 rounded-md flex items-center space-x-1.5 ${adminTab === 'SETTINGS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}><Settings size={13} /><span>Ayarlar</span></button>
                </div>
              </div>

              {/* SİSTEM AYARLARI */}
              {adminTab === 'SETTINGS' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                      <Settings className="text-neutral-700" size={18} />
                      <h3 className="font-bold text-neutral-950">Sistem Ayarları ve Parametreler</h3>
                    </div>
                    <div className="overflow-x-auto w-full border rounded-xl">
                      <table className="w-full text-left text-xs table-auto">
                        <thead className="bg-neutral-50 text-[10px] font-mono uppercase text-neutral-500">
                          <tr><th className="px-4 py-3 w-1/4">Ayar Adı</th><th className="px-4 py-3 w-2/4">Açıklama</th><th className="px-4 py-3 w-32 text-center">Değer</th><th className="px-4 py-3 w-24 text-right">İşlem</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 bg-white">
                          <tr className="hover:bg-neutral-50">
                            <td className="px-4 py-3 font-bold text-neutral-900">Varsayılan Bitiş Süresi</td>
                            <td className="px-4 py-3 text-neutral-500">Müşteri özel bir son tarih belirlemezse, talep kaç gün sonra açık havuzdan otomatik düşsün?</td>
                            <td className="px-4 py-3 text-center"><input type="number" min="1" value={systemSettings.default_deadline_days || ''} onChange={(e) => setSystemSettings({...systemSettings, default_deadline_days: e.target.value})} className="w-16 p-1.5 text-xs font-mono font-bold text-center rounded border outline-none" /></td>
                            <td className="px-4 py-3 text-right"><button onClick={() => handleSaveSystemSetting('default_deadline_days', systemSettings.default_deadline_days)} className="px-3 py-1.5 bg-neutral-950 text-white rounded text-xs font-semibold">Kaydet</button></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* WOZ HAVUZU */}
              {adminTab === 'WOZ' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button type="button" onClick={() => { setEditingProviderId(null); setModalFormData({ name: '', phone: '', email: '', serviceKeywords: '', communicationChannels: ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'], priorityScore: 100 }); setIsModalOpen(true); }} className="px-3.5 py-1.5 bg-neutral-950 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-sm transition hover:bg-neutral-800">
                      <Plus size={13} /><span>Yeni Sağlayıcı Ekle</span>
                    </button>
                  </div>
                  <div className="bg-white rounded-2xl border p-4 max-h-[550px] overflow-y-auto space-y-3">
                    {pendingRequests.length === 0 ? (
                       <div className="text-center text-xs text-neutral-400 py-6">Havuzda bekleyen talep yok.</div>
                    ) : (
                      pendingRequests.map((req) => (
                        <div key={req.id} className="p-4 bg-neutral-50 rounded-xl border flex items-center justify-between gap-3 text-xs">
                          <div className="space-y-1">
                            <p className="font-semibold text-neutral-950 text-sm">"{req.raw_text}"</p>
                            <span className="text-[11px] text-neutral-500">👤 {req.contact_value} | 📍 {extractAddress(req.location)}</span>
                          </div>
                          <button onClick={() => { setWozAssignModalReq(req); setWozProviderSearch(''); }} className="px-3.5 py-2 bg-neutral-950 text-white rounded-xl text-xs font-semibold shadow-sm transition hover:bg-neutral-800">Sağlayıcı Seç & Ata</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SAĞLAYICILAR */}
              {adminTab === 'PROVIDERS' && (
                <div className="space-y-3">
                  <div className="bg-white rounded-xl border p-3 flex justify-between">
                     <div className="relative w-full sm:w-96">
                        <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
                        <input type="text" value={searchProviderText} onChange={(e) => setSearchProviderText(e.target.value)} onDoubleClick={() => setSearchProviderText('')} placeholder="Firma ara..." className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none bg-neutral-50" />
                     </div>
                     <button type="button" onClick={() => { setEditingProviderId(null); setModalFormData({ name: '', phone: '', email: '', serviceKeywords: '', communicationChannels: ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'], priorityScore: 100 }); setIsModalOpen(true); }} className="px-3.5 py-1.5 bg-neutral-950 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5">
                       <Plus size={13} /><span>Yeni Ekle</span>
                     </button>
                  </div>
                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 max-h-[550px] overflow-y-auto pr-1">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {filteredProviders.map((prov) => (
                          <div key={prov.id} className="p-3.5 bg-neutral-50 rounded-xl border shadow-xs">
                            <h3 className="font-bold text-neutral-900">{prov.name}</h3>
                            <p className="text-[11px] text-blue-700 font-mono mt-0.5">📞 {prov.phone}</p>
                            
                            <div className="mt-2 pt-2 border-t flex items-center justify-between">
                               <div className="flex space-x-2">
                                 <button onClick={() => { setEditingProviderId(prov.id); setModalFormData({ name: prov.name, phone: prov.phone, email: prov.email || '', serviceKeywords: (prov.service_keywords || []).join(', '), communicationChannels: prov.communication_channels || ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'], priorityScore: prov.priority_score || 100 }); setIsModalOpen(true); }} className="text-neutral-600 hover:text-neutral-900 text-xs font-semibold transition">Düzenle</button>
                                 <button onClick={() => handleAdminDeleteProvider(prov.id)} className="text-rose-600 hover:text-rose-800 text-xs font-semibold transition">Sil</button>
                               </div>
                               <button onClick={() => handleOpenProviderDirectSession(prov.phone)} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center space-x-1 transition" title="Bu sağlayıcı olarak giriş yap"><ExternalLink size={12} /><span>Bağlan</span></button>
                            </div>
                            
                          </div>
                        ))}
                      </div>
                  </div>
                </div>
              )}

              {/* TÜM EŞLEŞMELER & KUYRUK EKRANI */}
              {adminTab === 'ALL_MATCHED' && (
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm max-h-[650px] overflow-y-auto">
                    <table className="w-full text-left text-xs table-auto">
                      <thead className="bg-neutral-50 text-[10px] font-mono uppercase text-neutral-500 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <SortableHeader label="ID / Tarih" sortKey="id" sortConfig={sortConfig} handleRequestSort={handleRequestSort} />
                          <SortableHeader label="Durum" sortKey="status" sortConfig={sortConfig} handleRequestSort={handleRequestSort} />
                          <SortableHeader label="Talep Metni" sortKey="raw_text" sortConfig={sortConfig} handleRequestSort={handleRequestSort} />
                          <SortableHeader label="Müşteri" sortKey="contact_value" sortConfig={sortConfig} handleRequestSort={handleRequestSort} />
                          <SortableHeader label="Sağlayıcı" sortKey="provider_name" sortConfig={sortConfig} handleRequestSort={handleRequestSort} />
                          <SortableHeader label="Konum / Aciliyet" sortKey="location" sortConfig={sortConfig} handleRequestSort={handleRequestSort} />
                          <th className="px-4 py-3 font-semibold border-b border-neutral-200 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {sortedMatchedRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-neutral-50 transition">
                            <td className="px-4 py-3 font-mono font-bold text-neutral-900">#REQ-{req.id}</td>
                            <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[9px] font-bold bg-neutral-200">{req.status}</span></td>
                            <td className="px-4 py-3 font-semibold text-neutral-900">"{req.raw_text}"</td>
                            <td className="px-4 py-3 font-mono text-neutral-800">{req.contact_value}</td>
                            <td className="px-4 py-3">{req.provider_name ? <span className="font-bold text-neutral-900">{req.provider_name}</span> : <span className="text-neutral-400 italic text-[11px]">Atanmadı</span>}</td>
                            <td className="px-4 py-3 text-neutral-700">{extractAddress(req.location)}</td>
                            <td className="px-4 py-3 text-right"><button onClick={() => handleDeleteRequest(req.id)} className="p-1.5 text-neutral-400 hover:text-rose-600 rounded"><Trash2 size={14} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
              )}

              {/* SMS LOGLARI */}
              {adminTab === 'SMS_LOGS' && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-4 max-h-[550px] overflow-y-auto space-y-2.5">
                  {filteredSmsLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-neutral-50 rounded-xl border space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
                        <span className="font-semibold text-neutral-900">{log.recipient_phone}</span>
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">{log.sent_status}</span>
                      </div>
                      <p className="text-xs font-mono bg-white p-2 rounded border leading-relaxed text-neutral-800">{log.message_body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* TEST SENARYOLARI */}
              {adminTab === 'TESTS' && (
                <div className="space-y-4">
                  <form onSubmit={handleCreateTest} className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-mono uppercase font-bold text-neutral-700 flex items-center space-x-1.5"><Plus size={14} className="text-neutral-950" /><span>Yeni Test Senaryosu Ekle</span></h3>
                      <span className="text-[11px] font-mono text-neutral-400">Default: Bekliyor</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-5"><input type="text" required value={newTest.title} onChange={(e) => setNewTest({ ...newTest, title: e.target.value })} placeholder="Test Başlığı..." className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950" /></div>
                      <div className="sm:col-span-3"><input type="text" value={newTest.testerName} onChange={(e) => setNewTest({ ...newTest, testerName: e.target.value })} placeholder="Test Eden Kişi" className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950" /></div>
                      <div className="sm:col-span-2"><input type="date" value={newTest.testDate} onChange={(e) => setNewTest({ ...newTest, testDate: e.target.value })} className="w-full p-2 text-xs font-mono rounded-lg border outline-none focus:border-neutral-950" /></div>
                      <div className="sm:col-span-2"><button type="submit" className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 shadow-sm"><Plus size={13} /><span>Ekle</span></button></div>
                    </div>

                    <div><textarea rows={2} value={newTest.description} onChange={(e) => setNewTest({ ...newTest, description: e.target.value })} placeholder="Test adımları ve beklenen sonuç açıklaması..." className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950 resize-none bg-neutral-50" /></div>
                  </form>

                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 max-h-[550px] overflow-y-auto space-y-2.5 pr-1">
                    {tests.length === 0 ? (
                      <div className="p-8 text-center text-xs text-neutral-400">Henüz kayıtlı bir test senaryosu bulunmuyor.</div>
                    ) : (
                      tests.map((testItem) => {
                        const isExpanded = expandedTestId === testItem.id;
                        return (
                          <div key={testItem.id} className="bg-[#FAFBFD] rounded-xl border border-neutral-200 overflow-hidden transition">
                            <div onClick={() => setExpandedTestId(isExpanded ? null : testItem.id)} className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-neutral-100/60 select-none text-xs">
                              <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${testItem.status === 'BAŞARILI' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : testItem.status === 'BAŞARISIZ' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>{testItem.status}</span>
                                <p className="font-semibold text-neutral-900 truncate">{testItem.title}</p>
                              </div>
                              <div className="flex items-center space-x-3 text-neutral-400 shrink-0">
                                <span className="font-mono text-[11px] hidden sm:inline">👤 {testItem.tester_name || 'Tester'}</span>
                                <span className="font-mono text-[11px] flex items-center space-x-1 hidden sm:inline-flex"><Calendar size={12} /><span>{testItem.test_date ? new Date(testItem.test_date).toLocaleDateString('tr-TR') : '-'}</span></span>
                                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="p-4 pt-2 border-t border-neutral-200/80 bg-white space-y-3">
                                <div><label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Açıklama / Test Adımları</label><p className="text-xs text-neutral-700 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/70 font-mono leading-relaxed">{testItem.description || 'Açıklama belirtilmemiş.'}</p></div>
                                <div><label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Test Sonucu & Notlar</label><textarea rows={2} defaultValue={testItem.result_notes || ''} onBlur={(e) => handleUpdateTest(testItem.id, { resultNotes: e.target.value })} placeholder="Test sonucu, hata logu veya gözlemlerinizi yazın..." className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950 resize-none bg-neutral-50" /></div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                  <div>
                                    <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Test Durumu</label>
                                    <select value={testItem.status} onChange={(e) => handleUpdateTest(testItem.id, { status: e.target.value })} className="w-full p-2 rounded-lg border outline-none bg-neutral-50 font-semibold text-xs">
                                      <option value="BEKLİYOR">⏳ Bekliyor</option><option value="BAŞARILI">✅ Başarılı (Passed)</option><option value="BAŞARISIZ">❌ Başarısız (Failed)</option>
                                    </select>
                                  </div>
                                  <div><label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Test Eden</label><input type="text" defaultValue={testItem.tester_name || ''} onBlur={(e) => handleUpdateTest(testItem.id, { testerName: e.target.value })} className="w-full p-2 rounded-lg border outline-none bg-neutral-50 text-xs" /></div>
                                  <div><label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Test Tarihi</label><input type="date" defaultValue={testItem.test_date ? testItem.test_date.split('T')[0] : ''} onChange={(e) => handleUpdateTest(testItem.id, { testDate: e.target.value })} className="w-full p-2 rounded-lg border outline-none bg-neutral-50 font-mono text-xs" /></div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[11px] text-neutral-400">
                                  <span className="font-mono">Senaryo ID: #{testItem.id}</span>
                                  <button onClick={() => handleDeleteTest(testItem.id)} className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-1 font-semibold transition"><Trash2 size={12} /><span>Senaryoyu Sil</span></button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* YOL HARİTASI (PROJE) */}
              {adminTab === 'PROJECT' && (
                <div className="space-y-4">
                  <form onSubmit={handleCreateFeature} className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-mono uppercase font-bold text-neutral-700 flex items-center space-x-1.5"><Plus size={14} className="text-neutral-950" /><span>Yeni Özellik / Geliştirme Fikri Ekle</span></h3>
                      <span className="text-[11px] font-mono text-neutral-400">Default: Bekliyor / Orta</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-5"><input type="text" required value={newFeature.title} onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })} placeholder="Özellik Başlığı..." className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950" /></div>
                      <div className="sm:col-span-3"><input type="date" value={newFeature.targetDate} onChange={(e) => setNewFeature({ ...newFeature, targetDate: e.target.value })} className="w-full p-2 text-xs font-mono rounded-lg border outline-none focus:border-neutral-950" /></div>
                      <div className="sm:col-span-2">
                        <select value={newFeature.priority} onChange={(e) => setNewFeature({ ...newFeature, priority: e.target.value })} className="w-full p-2 text-xs rounded-lg border outline-none bg-neutral-50 font-medium">
                          <option value="DÜŞÜK">Düşük</option><option value="ORTA">Orta</option><option value="YÜKSEK">Yüksek</option><option value="KRİTİK">Kritik</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2"><button type="submit" className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1"><Plus size={13} /><span>Ekle</span></button></div>
                    </div>
                    <div><textarea rows={2} value={newFeature.description} onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })} placeholder="Özelliğin detaylı açıklaması (opsiyonel)..." className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950 resize-none" /></div>
                  </form>

                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 max-h-[500px] overflow-y-auto space-y-2.5 pr-1">
                    {features.length === 0 ? (
                      <div className="p-8 text-center text-xs text-neutral-400">Henüz kayıtlı bir proje özelliği veya fikir bulunmuyor.</div>
                    ) : (
                      features.map((feat) => {
                        const isExpanded = expandedFeatureId === feat.id;
                        return (
                          <div key={feat.id} className="bg-[#FAFBFD] rounded-xl border border-neutral-200 overflow-hidden transition">
                            <div onClick={() => setExpandedFeatureId(isExpanded ? null : feat.id)} className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-neutral-100/60 select-none text-xs">
                              <div className="flex items-center space-x-3 flex-1 min-w-0 pr-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${feat.priority === 'KRİTİK' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>{feat.priority}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${feat.status === 'TAMAMLANDI' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-neutral-100 text-neutral-700'}`}>{feat.status}</span>
                                <p className="font-semibold text-neutral-900 truncate">{feat.title}</p>
                              </div>
                              <div className="flex items-center space-x-3 text-neutral-400 shrink-0">
                                <span className="font-mono text-[11px] flex items-center space-x-1 hidden sm:inline-flex"><Calendar size={12} /><span>{feat.target_date ? new Date(feat.target_date).toLocaleDateString('tr-TR') : '-'}</span></span>
                                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="p-4 pt-2 border-t border-neutral-200/80 bg-white space-y-3">
                                <div><label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Açıklama / Notlar</label><textarea rows={2} defaultValue={feat.description || ''} onBlur={(e) => handleUpdateFeature(feat.id, { description: e.target.value })} placeholder="Detaylı açıklama ekleyin..." className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950 resize-none bg-neutral-50" /></div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                  <div>
                                    <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Durum</label>
                                    <select value={feat.status} onChange={(e) => handleUpdateFeature(feat.id, { status: e.target.value })} className="w-full p-2 rounded-lg border outline-none bg-neutral-50 font-semibold text-xs">
                                      <option value="BEKLİYOR">Bekliyor</option><option value="DEVAM EDİYOR">Devam Ediyor</option><option value="TAMAMLANDI">Tamamlandı</option><option value="İPTAL">İptal</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Öncelik</label>
                                    <select value={feat.priority} onChange={(e) => handleUpdateFeature(feat.id, { priority: e.target.value })} className="w-full p-2 rounded-lg border outline-none bg-neutral-50 font-semibold text-xs">
                                      <option value="DÜŞÜK">Düşük</option><option value="ORTA">Orta</option><option value="YÜKSEK">Yüksek</option><option value="KRİTİK">Kritik</option>
                                    </select>
                                  </div>
                                  <div><label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Hedef Tarih</label><input type="date" defaultValue={feat.target_date ? feat.target_date.split('T')[0] : ''} onChange={(e) => handleUpdateFeature(feat.id, { targetDate: e.target.value })} className="w-full p-2 rounded-lg border outline-none bg-neutral-50 font-mono text-xs" /></div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[11px] text-neutral-400">
                                  <span className="font-mono">Kayıt ID: #{feat.id}</span>
                                  <button onClick={() => handleDeleteFeature(feat.id)} className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-1 font-semibold transition"><Trash2 size={12} /><span>Özelliği Sil</span></button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

          </div>
        )}
      </main>

      {/* 🇨🇭 FOOTER */}
      {session?.role !== 'TRACKER' && (
        <footer className="border-t border-neutral-200/80 bg-white py-4 z-10">
          <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-neutral-400 font-mono">
            <div><span>Mobool</span> • <span>Multi-Tenant Servis Platformu</span></div>
            <div><span>İTÜ Bilişim Enstitüsü © 2026</span></div>
          </div>
        </footer>
      )}
    </div>
  );
}