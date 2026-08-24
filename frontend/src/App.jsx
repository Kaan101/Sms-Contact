import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { 
  ArrowRight, Phone, PhoneCall, MessageSquare, Mail, Plus, Trash2, Edit3, X, Clock, LogOut, 
  KeyRound, History, Building2, Check, Ban, ShieldCheck, SkipForward, Layers, Radio, 
  User, Wrench, Shield, Save, ChevronDown, ChevronUp, FolderKanban, Calendar, Star, 
  Sparkles, MapPin, Flame, Sliders, CheckCircle2, Navigation, FileCheck2, Search, Filter,
  ExternalLink, LogIn, UserCheck, Tag, MessageCircle, Inbox, Users, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw,
  Settings, Timer, AlertTriangle, Link2
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const MAX_KEYWORD_CHARS = 1000;
const MAX_KEYWORD_COUNT = 50;

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
    } catch {
      return null;
    }
  });

  const [authStep, setAuthStep] = useState('PHONE');
  const [inputPhone, setInputPhone] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [simulatedCode, setSimulatedCode] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const emailInputRef = useRef(null);

  // Müşteri State
  const [queryText, setQueryText] = useState('');
  const [disambiguationData, setDisambiguationData] = useState(null);
  const [selectedDisambiguation, setSelectedDisambiguation] = useState(null);
  
  const [preferredChannels, setPreferredChannels] = useState(['PHONE']);
  const [contactEmail, setContactEmail] = useState('');
  const [locationValue, setLocationValue] = useState('İstanbul, Türkiye');
  const [isUrgent, setIsUrgent] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isDetailsCollapsed, setIsDetailsCollapsed] = useState(true);

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
  
  const [systemSettings, setSystemSettings] = useState({ 
    default_deadline_days: 10,
    timeout_matched_mins: 15,
    timeout_accepted_hours: 24
  });
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

  const fetchCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`);
          const addr = geoRes.data.address;
          const district = addr.suburb || addr.district || addr.town || addr.city_district || 'Kadıköy';
          const city = addr.city || addr.province || 'İstanbul';
          setLocationValue(`${district}, ${city}`);
        } catch {
          setLocationValue(`${latitude.toFixed(3)}, ${longitude.toFixed(3)} (Konum Alındı)`);
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

  const fetchCustomerData = async () => {
    if (!session?.phone) return;
    try {
      const res = await axios.get(`${API_BASE}/requests/my-requests?phone=${encodeURIComponent(session.phone)}`);
      setMyCustomerRequests(res.data.requests || []);
    } catch (err) {
      console.error('Müşteri talepleri çekilemedi:', err);
    }
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
      if (err.response?.status === 404) {
        setProviderProfile(null);
        setProviderRequests([]);
        setPoolRequests([]);
      }
    }
  };

  const fetchFeatures = async () => {
    try {
      const res = await axios.get(`${API_BASE}/features`);
      setFeatures(res.data.features || []);
    } catch (err) { console.error('Özellikler yüklenemedi:', err); }
  };

  const fetchTests = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tests`);
      setTests(res.data.tests || []);
    } catch (err) { console.error('Testler yüklenemedi:', err); }
  };

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
      await fetchFeatures(); await fetchTests();

      try {
        const setRes = await axios.get(`${API_BASE}/settings`);
        if (setRes.data.settings) setSystemSettings(setRes.data.settings);
      } catch (e) {
        console.warn('Sistem ayarları API bağlantısı henüz aktif olmayabilir.');
      }

    } catch (err) { console.error('Admin verileri çekilemedi:', err); }
  };

  useEffect(() => {
    if (session) {
      if (session.role === 'CUSTOMER') { fetchCustomerData(); fetchCurrentLocation(); }
      if (session.role === 'PROVIDER') fetchProviderData(true);
      if (session.role === 'ADMIN') fetchAdminData();

      const interval = setInterval(() => {
        if (session.role === 'PROVIDER') fetchProviderData(false);
        if (session.role === 'CUSTOMER') fetchCustomerData();
        if (session.role === 'ADMIN' && (adminTab === 'SMS_LOGS' || adminTab === 'ALL_MATCHED' || adminTab === 'WOZ')) fetchAdminData();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [session, adminTab]);

  const handleSendOtp = async (e) => {
    e.preventDefault(); if (!inputPhone.trim()) return; setAuthLoading(true); setErrorMessage('');
    try {
      const res = await axios.post(`${API_BASE}/auth/send-otp`, { phone: inputPhone.trim() });
      setSimulatedCode(res.data.simulatedOtp); setAuthStep('OTP');
    } catch (err) { setErrorMessage(err.response?.data?.message || 'OTP gönderilemedi.'); } finally { setAuthLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); if (!inputOtp.trim()) return; setAuthLoading(true); setErrorMessage('');
    try {
      await axios.post(`${API_BASE}/auth/verify-otp`, { phone: inputPhone.trim(), otpCode: inputOtp.trim() });
      const newSession = { role: selectedRole, phone: inputPhone.trim(), authenticatedAt: new Date().toISOString() };
      setSession(newSession); localStorage.setItem('sc_session', JSON.stringify(newSession));
      setIsProfileOpen(false); setAuthStep('PHONE'); setInputOtp('');
    } catch (err) { setErrorMessage(err.response?.data?.message || 'Doğrulama kodu hatalı.'); } finally { setAuthLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('sc_session');
    setSession(null); setProviderProfile(null); setIsProfileOpen(false); setIsCustomerHistoryOpen(false); setIsProviderHistoryOpen(false); setMyCustomerRequests([]); setStep('INPUT');
  };

  const handleOpenProviderDirectSession = (provPhone) => {
    if (!provPhone) return;
    const cleanPhone = encodeURIComponent(provPhone.trim());
    const directUrl = `${window.location.origin}${window.location.pathname}?role=PROVIDER&phone=${cleanPhone}`;
    window.open(directUrl, '_blank');
  };

  const submitFinalRequest = async (disambiguationChoice) => {
    setLoading(true);
    const deadlineDatetimeISO = deadlineDate ? `${deadlineDate}T${deadlineTime || '23:59'}:00` : null;
    const finalContactValue = preferredChannels.includes('EMAIL') ? `${contactEmail.trim()} (Tel: ${session.phone})` : session.phone;
    const channelString = preferredChannels.join(', ');

    try {
      await axios.post(`${API_BASE}/requests`, {
        rawText: queryText, 
        disambiguationChoice: disambiguationChoice, 
        contactValue: finalContactValue,
        preferredChannel: channelString, 
        location: locationValue, 
        isUrgent: isUrgent, 
        deadlineDatetime: deadlineDatetimeISO
      });
      setQueryText(''); 
      setSelectedDisambiguation(null); 
      setDeadlineDate(''); 
      setDeadlineTime(''); 
      setContactEmail(''); 
      setPreferredChannels(['PHONE']); 
      setStep('INPUT'); 
      setIsDetailsCollapsed(true); 
      setIsUrgent(false); 
      setErrorMessage('');
      await fetchCustomerData();
    } catch (err) { 
      setErrorMessage(err.response?.data?.message || 'Talep oluşturulamadı.'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleCustomerCombinedSubmit = async (e) => {
    e?.preventDefault();
    if (!queryText.trim()) return;
    if (preferredChannels.includes('EMAIL') && !contactEmail.trim()) {
      setIsDetailsCollapsed(false); 
      setTimeout(() => { if (emailInputRef.current) emailInputRef.current.focus(); }, 100);
      return;
    }
    
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await axios.post(`${API_BASE}/disambiguate`, { queryText: queryText.trim() });
      if (response.data.status === 'ambiguous') {
        setDisambiguationData(response.data);
        setStep('DISAMBIGUATE');
        setLoading(false);
      } else {
        await submitFinalRequest(null);
      }
    } catch { 
      await submitFinalRequest(null); 
    }
  };

  const handleRepeatRequest = (req) => {
    setQueryText(req.raw_text);
    if (req.location) setLocationValue(req.location);
    setIsUrgent(req.is_urgent || false);
    setStep('INPUT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJoinPool = async (requestId) => {
    if (!providerProfile) {
      alert("Önce profilinizi oluşturup kaydetmelisiniz!"); setIsProfileOpen(true); return;
    }
    try {
      await axios.post(`${API_BASE}/requests/${requestId}/join-pool`, { providerId: providerProfile.id });
      await fetchProviderData(false); setProviderTab('ACTIVE'); 
    } catch (err) { console.error('Havuza katılma hatası:', err); alert('Havuza katılırken bir hata oluştu.'); }
  };

  const handleCustomerNextProvider = async (requestId) => {
    try {
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/next-provider`);
      await fetchCustomerData();
      if (session.role === 'PROVIDER') await fetchProviderData(false);
    } catch (err) { console.error('İşlem başarısız:', err); }
  };

  const handleCustomerSelectCandidate = async (requestId, providerId) => {
    try {
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/select-candidate`, { providerId: Number(providerId) });
      setExpandedCustomerQueueReqId(null);
      await fetchCustomerData();
      if (session.role === 'PROVIDER') await fetchProviderData(false);
    } catch (err) { console.error('Seçim başarısız:', err); }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await axios.post(`${API_BASE}/requests/${Number(requestId)}/status`, { newStatus });
      if (session.role === 'CUSTOMER') await fetchCustomerData();
      if (session.role === 'PROVIDER') await fetchProviderData(false);
      if (session.role === 'ADMIN') await fetchAdminData();
    } catch (err) { console.error('Durum güncellenemedi:', err); }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Bu talebi silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API_BASE}/requests/${Number(requestId)}`);
      if (session.role === 'CUSTOMER') await fetchCustomerData();
      if (session.role === 'PROVIDER') await fetchProviderData(false);
      if (session.role === 'ADMIN') await fetchAdminData();
    } catch { console.error('Silme başarısız.'); }
  };

  const handleSendReview = async (requestId, reviewerType, isSkip = false) => {
    try {
      const rating = isSkip ? null : (reviewRatingMap[requestId] || 5);
      const comment = isSkip ? null : (reviewCommentMap[requestId] || '');
      await axios.post(`${API_BASE}/reviews`, { requestId: Number(requestId), reviewerType, rating, comment });
      setReviewedRequestsMap(prev => ({ ...prev, [`${requestId}_${reviewerType}`]: true }));
      if (session.role === 'CUSTOMER') await fetchCustomerData();
      if (session.role === 'PROVIDER') await fetchProviderData(false);
    } catch (err) { console.error('Değerlendirme kaydedilemedi:', err); }
  };

  const handleCreateTest = async (e) => { e.preventDefault(); if (!newTest.title.trim()) return; try { await axios.post(`${API_BASE}/tests`, newTest); setNewTest({ title: '', description: '', testerName: 'İTÜ Test Ekibi', testDate: new Date().toISOString().split('T')[0], status: 'BEKLİYOR' }); await fetchTests(); } catch (err) { alert('Hata'); } };
  const handleUpdateTest = async (id, updatedFields) => { try { await axios.put(`${API_BASE}/tests/${id}`, updatedFields); await fetchTests(); } catch (err) { alert('Hata'); } };
  const handleDeleteTest = async (id) => { if (!window.confirm('Emin misiniz?')) return; try { await axios.delete(`${API_BASE}/tests/${id}`); await fetchTests(); } catch { alert('Silme başarısız.'); } };
  
  const handleCreateFeature = async (e) => { e.preventDefault(); if (!newFeature.title.trim()) return; try { await axios.post(`${API_BASE}/features`, newFeature); setNewFeature({ title: '', description: '', targetDate: new Date().toISOString().split('T')[0], status: 'BEKLİYOR', priority: 'ORTA' }); await fetchFeatures(); } catch (err) { alert('Hata'); } };
  const handleUpdateFeature = async (id, updatedFields) => { try { await axios.put(`${API_BASE}/features/${id}`, updatedFields); await fetchFeatures(); } catch (err) { alert('Hata'); } };
  const handleDeleteFeature = async (id) => { if (!window.confirm('Emin misiniz?')) return; try { await axios.delete(`${API_BASE}/features/${id}`); await fetchFeatures(); } catch { alert('Silme başarısız.'); } };

  const handleSaveProviderProfile = async (e) => {
    e.preventDefault();
    const keywordsArray = providerFormData.serviceKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const payload = {
      name: providerFormData.name.trim(), phone: session.phone, email: providerFormData.email ? providerFormData.email.trim() : null,
      serviceKeywords: keywordsArray.slice(0, MAX_KEYWORD_COUNT), communicationChannels: providerFormData.communicationChannels, priorityScore: parseInt(providerFormData.priorityScore, 10) || 100
    };
    try {
      if (providerProfile) await axios.put(`${API_BASE}/providers/${providerProfile.id}`, payload);
      else await axios.post(`${API_BASE}/providers`, payload);
      setIsProfileOpen(false); await fetchProviderData(true);
    } catch (err) { console.error('Kaydedilemedi:', err); }
  };

  const handleAdminAssign = async (requestId, providerId) => {
    const pId = providerId || selectedProviderMap[requestId];
    if (!pId) return;
    try {
      await axios.post(`${API_BASE}/requests/assign`, { requestId: parseInt(requestId, 10), providerId: parseInt(pId, 10) });
      setWozAssignModalReq(null); await fetchAdminData();
    } catch { console.error('Atama başarısız.'); }
  };

  const handleAdminSaveProvider = async (e) => {
    e.preventDefault();
    const keywordsArray = modalFormData.serviceKeywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const payload = {
      name: modalFormData.name.trim(), phone: modalFormData.phone.trim(), email: modalFormData.email ? modalFormData.email.trim() : null,
      serviceKeywords: keywordsArray.slice(0, MAX_KEYWORD_COUNT), communicationChannels: modalFormData.communicationChannels, priorityScore: parseInt(modalFormData.priorityScore, 10) || 100
    };
    try {
      if (editingProviderId) await axios.put(`${API_BASE}/providers/${editingProviderId}`, payload);
      else await axios.post(`${API_BASE}/providers`, payload);
      setIsModalOpen(false); await fetchAdminData();
    } catch { console.error('Kayıt başarısız.'); }
  };

  const handleAdminDeleteProvider = async (id) => {
    if (!window.confirm('Sağlayıcıyı silmek istediğinize emin misiniz?')) return;
    try { await axios.delete(`${API_BASE}/providers/${id}`); await fetchAdminData(); } catch { console.error('Silinemedi.'); }
  };

  const handleSaveSystemSetting = async (key, value) => {
    try {
      await axios.put(`${API_BASE}/settings`, { key, value });
      alert('Sistem parametresi başarıyla güncellendi!');
    } catch (err) {
      console.error('Ayar güncellenirken hata:', err);
      alert('Hata: Yaptığınız ayar kaydedilemedi.');
    }
  };

  const activeCustomerRequests = myCustomerRequests.filter(r => ['POOL', 'MATCHED', 'ACCEPTED', 'PROVIDER_COMPLETED', 'MANUAL_INTERVENTION', 'PENDING'].includes((r.status || '').toUpperCase()));
  const pendingReviewCustomerRequests = myCustomerRequests.filter(r => (r.status || '').toUpperCase() === 'COMPLETED' && !(r.customer_rating !== null || reviewedRequestsMap[`${r.id}_CUSTOMER`]));
  const pastCustomerRequests = myCustomerRequests.filter(r => (r.status || '').toUpperCase() === 'CANCELLED' || ((r.status || '').toUpperCase() === 'COMPLETED' && (r.customer_rating !== null || reviewedRequestsMap[`${r.id}_CUSTOMER`])));

  const filteredPastCustomerRequests = pastCustomerRequests.filter(req => {
    const q = searchCustomerHistoryText.toLowerCase().trim();
    if (!q) return true;
    return (
      (req.raw_text || '').toLowerCase().includes(q) ||
      (req.provider_name || '').toLowerCase().includes(q) ||
      (req.status || '').toLowerCase().includes(q)
    );
  });

  const activeProviderRequests = providerRequests.filter(r => ['MATCHED', 'ACCEPTED', 'PROVIDER_COMPLETED'].includes((r.status || '').toUpperCase()));
  const pastProviderRequests = providerRequests.filter(r => ['COMPLETED', 'CANCELLED'].includes((r.status || '').toUpperCase()));

  const filteredProviders = providers.filter(p => {
    const q = searchProviderText.toLowerCase().trim();
    if (!q) return true;
    return (p.name || '').toLowerCase().includes(q) || (p.phone || '').toLowerCase().includes(q) || (p.service_keywords || []).some(k => k.toLowerCase().includes(q));
  });

  const filteredMatchedRequests = matchedRequests.filter(r => {
    const q = searchMatchText.toLowerCase().trim();
    const statusMatch = matchStatusFilter === 'ALL' || r.status === matchStatusFilter;
    if (!statusMatch) return false;
    if (!q) return true;
    return (r.raw_text || '').toLowerCase().includes(q) || (r.contact_value || '').toLowerCase().includes(q) || (r.provider_name || '').toLowerCase().includes(q) || (r.provider_phone || '').toLowerCase().includes(q) || String(r.id).includes(q);
  });

  const handleRequestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedMatchedRequests = useMemo(() => {
    let sortableItems = [...filteredMatchedRequests];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        if (sortConfig.key === 'queue') {
          valA = a.queueList ? a.queueList.length : 0;
          valB = b.queueList ? b.queueList.length : 0;
        } else if (sortConfig.key === 'provider_name') {
          valA = a.provider_name || ''; valB = b.provider_name || '';
        } else if (sortConfig.key === 'location') {
          valA = a.location || ''; valB = b.location || '';
        } else if (sortConfig.key === 'raw_text') {
          valA = a.raw_text || ''; valB = b.raw_text || '';
        } else if (sortConfig.key === 'contact_value') {
          valA = a.contact_value || ''; valB = b.contact_value || '';
        } else if (sortConfig.key === 'status') {
          valA = a.status || ''; valB = b.status || '';
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredMatchedRequests, sortConfig]);

  const filteredSmsLogs = smsLogs.filter(log => {
    const q = searchSmsText.toLowerCase().trim();
    const recipientMatch = smsRecipientFilter === 'ALL' || log.recipient_type === smsRecipientFilter;
    if (!recipientMatch) return false;
    if (!q) return true;
    return (log.recipient_phone || '').toLowerCase().includes(q) || (log.message_body || '').toLowerCase().includes(q);
  });

  const filteredWozProviders = providers.filter(p => {
    const q = wozProviderSearch.toLowerCase().trim();
    if (!q) return true;
    return (p.name || '').toLowerCase().includes(q) || (p.phone || '').toLowerCase().includes(q) || (p.service_keywords || []).some(k => k.toLowerCase().includes(q));
  });

  const extractEmail = (text) => {
    if (!text) return null;
    const match = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const extractPhone = (str) => {
    if (!str) return '';
    const match = str.match(/(\+?\d[\d\s-]{8,})/);
    return match ? match[1].replace(/[^\d+]/g, '') : '';
  };

  const getKeywordMetrics = (text) => {
    const str = text || '';
    return { charCount: str.length, wordCount: str.split(',').map(k => k.trim()).filter(Boolean).length };
  };

  const providerKwMetrics = getKeywordMetrics(providerFormData.serviceKeywords);
  const modalKwMetrics = getKeywordMetrics(modalFormData.serviceKeywords);

  const SortableHeader = ({ label, sortKey, align = "left" }) => {
    const isActive = sortConfig.key === sortKey;
    return (
      <th className={`px-4 py-3 font-semibold border-b border-neutral-200 cursor-pointer hover:bg-neutral-100 transition group select-none whitespace-nowrap text-${align}`} onClick={() => handleRequestSort(sortKey)}>
        <div className={`flex items-center space-x-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span>{label}</span>
          <span className={`${isActive ? 'text-neutral-900' : 'text-neutral-300 group-hover:text-neutral-500'} transition`}>
            {isActive ? (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : (<ArrowUpDown size={12} />)}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] text-neutral-900 flex flex-col justify-between font-sans selection:bg-neutral-900 selection:text-white">
      
      {/* 🧭 NAVIGATION */}
      <header className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className={`${session?.role === 'ADMIN' ? 'w-full' : 'max-w-5xl'} mx-auto px-6 h-16 flex items-center justify-between transition-all duration-300`}>
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setStep('INPUT')}>
            <div className="w-8 h-8 rounded-lg bg-neutral-950 flex items-center justify-center text-white shadow-sm font-mono text-sm font-semibold tracking-tighter">
              MB
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-base tracking-tight text-neutral-950">Mobool</span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400 font-medium">Protocol 9.4</span>
            </div>
          </div>

          {session && (
            <div className="flex items-center space-x-3">
              <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold uppercase border ${
                session.role === 'CUSTOMER' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                session.role === 'PROVIDER' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                'bg-neutral-900 text-white border-neutral-900'
              }`}>
                {session.role === 'CUSTOMER' ? '👤 Müşteri' : session.role === 'PROVIDER' ? '🛠️ Sağlayıcı' : '⚙️ Admin'}
              </span>
              <span className="text-xs font-mono text-neutral-600 hidden sm:inline">{session.phone}</span>
              <button onClick={handleLogout} title="Çıkış Yap" className="p-1.5 text-neutral-400 hover:text-neutral-950 hover:bg-neutral-100 rounded-md transition"><LogOut size={16} /></button>
            </div>
          )}
        </div>
      </header>

      {/* 🏛️ MAIN CONTENT */}
      <main className={`w-full mx-auto px-6 py-8 flex-1 flex flex-col justify-start transition-all duration-300 ${session?.role === 'ADMIN' ? 'max-w-[100%]' : 'max-w-5xl'}`}>
        
        {errorMessage && (
          <div className="w-full mb-4 p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="text-rose-400 hover:text-rose-700 ml-4"><X size={14} /></button>
          </div>
        )}

        {/* ---------------- 🚪 1. GİRİŞ EKRANI ---------------- */}
        {!session ? (
          <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-sm p-8 max-w-md mx-auto w-full space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-neutral-950 text-white rounded-2xl mx-auto flex items-center justify-center shadow-sm font-mono text-lg font-bold"><KeyRound size={22} /></div>
              <h2 className="text-2xl font-bold tracking-tight text-neutral-950">Giriş Yapın</h2>
              <p className="text-xs text-neutral-500">Lütfen sisteme hangi rolde bağlanmak istediğinizi seçin.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 p-1 bg-neutral-100 rounded-xl border border-neutral-200 text-xs font-semibold">
              <button type="button" onClick={() => { setSelectedRole('CUSTOMER'); setAuthStep('PHONE'); }} className={`py-2.5 rounded-lg transition flex flex-col items-center space-y-1 ${selectedRole === 'CUSTOMER' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}><User size={16} /><span>Müşteri</span></button>
              <button type="button" onClick={() => { setSelectedRole('PROVIDER'); setAuthStep('PHONE'); }} className={`py-2.5 rounded-lg transition flex flex-col items-center space-y-1 ${selectedRole === 'PROVIDER' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}><Wrench size={16} /><span>Sağlayıcı</span></button>
              <button type="button" onClick={() => { setSelectedRole('ADMIN'); setAuthStep('PHONE'); }} className={`py-2.5 rounded-lg transition flex flex-col items-center space-y-1 ${selectedRole === 'ADMIN' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'}`}><Shield size={16} /><span>Admin</span></button>
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
                  <label className="block text-[11px] font-mono uppercase font-semibold text-neutral-500 mb-1.5">4 Haneli Kod</label>
                  <input type="tel" inputMode="numeric" pattern="[0-9]*" required maxLength={4} value={inputOtp} onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))} placeholder="1234" className="w-full p-3 text-center text-2xl tracking-[0.4em] font-mono font-bold rounded-xl border border-neutral-200 focus:border-neutral-950 outline-none" />
                </div>
                <div className="flex items-center space-x-2">
                  <button type="button" onClick={() => setAuthStep('PHONE')} className="w-1/3 py-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold rounded-xl">Değiştir</button>
                  <button type="submit" disabled={authLoading || inputOtp.length < 4} className="w-2/3 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-200 text-white text-xs font-semibold rounded-xl transition">{authLoading ? 'Doğrulanıyor...' : 'Giriş Yap'}</button>
                </div>
              </form>
            )}
          </div>
        ) : (

          /* ---------------- 👤 2. SERVİS TALEP EDEN (MÜŞTERİ EKRANI) ---------------- */
          session.role === 'CUSTOMER' ? (
            <div className="max-w-2xl mx-auto w-full space-y-6">
              
              {/* A. AKTİF TALEPLER */}
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

                        {/* MÜŞTERİ AKTİF SAĞLAYICI VE AÇILIR KAPANIR KUYRUK */}
                        {(req.provider_name || (req.queuedProviders && req.queuedProviders.length > 0)) && (
                          <div className="mt-2 bg-white border border-emerald-200 rounded-lg shadow-sm overflow-hidden transition-all duration-300">
                            
                            <div 
                              onClick={() => {
                                if (req.queuedProviders && req.queuedProviders.length > 0 && !(req.provider_name && req.queuedProviders.length === 1)) {
                                  setExpandedCustomerQueueReqId(expandedCustomerQueueReqId === req.id ? null : req.id);
                                }
                              }}
                              className={`p-3 flex items-center justify-between ${(req.queuedProviders && req.queuedProviders.length > 0 && !(req.provider_name && req.queuedProviders.length === 1)) ? 'cursor-pointer hover:bg-emerald-50/50 select-none' : ''}`}
                            >
                              <div className="space-y-1.5 w-full">
                                <div className="text-[10px] font-mono font-bold text-emerald-700">
                                  {req.provider_name ? 'ŞU ANKİ AKTİF SAĞLAYICI' : 'AKTİF SAĞLAYICI YOK (HAVUZDA)'}
                                </div>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center space-x-1.5">
                                    <Building2 size={14} className="text-neutral-700" />
                                    {req.provider_name ? (
                                      <>
                                        <span className="font-bold text-neutral-950">{req.provider_name}</span>
                                        <span className="font-mono text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">📞 {req.provider_phone}</span>
                                      </>
                                    ) : (
                                      <span className="font-bold text-neutral-500 italic">Sıradaki sağlayıcı bekleniyor...</span>
                                    )}
                                  </div>
                                  
                                  {req.queuedProviders && req.queuedProviders.length > 0 && !(req.provider_name && req.queuedProviders.length === 1) && (
                                    <div className="flex items-center space-x-1 text-neutral-400">
                                      <span className="text-[10px] font-bold">
                                        {req.provider_name ? `Diğer Adaylar (${req.queuedProviders.length - 1})` : `Tüm Adaylar (${req.queuedProviders.length})`}
                                      </span>
                                      {expandedCustomerQueueReqId === req.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {(req.status === 'ACCEPTED' || req.status === 'PROVIDER_COMPLETED') && !expandedCustomerQueueReqId && (
                              <div className="px-3 pb-3">
                                 <div className={`p-2 rounded text-[11px] flex items-center space-x-1.5 ${req.status === 'PROVIDER_COMPLETED' ? 'bg-purple-50 border border-purple-200 text-purple-950' : 'bg-emerald-50 border border-emerald-200 text-emerald-950'}`}>
                                   {req.status === 'PROVIDER_COMPLETED' ? <ShieldCheck size={13} className="text-purple-700" /> : <PhoneCall size={13} className="text-emerald-700 animate-bounce" />}
                                   <span>
                                     {req.status === 'PROVIDER_COMPLETED' 
                                       ? <>Sağlayıcı işlemi tamamladığını bildirdi. Onayınız bekleniyor: <strong>{req.provider_phone}</strong></> 
                                       : <>Sağlayıcı talebi kabul etti. İletişime geçiliyor: <strong>{req.provider_phone}</strong></>}
                                   </span>
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
                                          <p className="font-bold text-neutral-900 flex items-center space-x-1.5">
                                            <span>#{idx + 1} {qProv.name}</span>
                                            {isCurrent && <span className="text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono">ŞU AN AKTİF</span>}
                                            {qProv.interest_status === 'SKIPPED' && !isCurrent && <span className="text-[9px] bg-neutral-200 text-neutral-600 px-1.5 py-0.5 rounded font-mono">PAS GEÇİLDİ</span>}
                                            {qProv.interest_status === 'WAITING' && !isCurrent && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-mono">BEKLİYOR</span>}
                                          </p>
                                          <p className="text-[10px] font-mono text-neutral-500 mt-1">📞 {qProv.phone}</p>
                                        </div>
                                        {!isCurrent && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleCustomerSelectCandidate(req.id, qProv.id); }}
                                            className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded text-[10px] font-bold shadow-sm transition flex items-center space-x-1"
                                          >
                                            <Check size={10} /><span>Bunu Seç</span>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-100 mt-2">
                          <span>📍 {req.location || 'Mevcut Konum'}</span>
                          {req.is_urgent && <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold border border-rose-200">ACİL</span>}
                          {req.deadline_datetime && <span>⏰ En Son: {new Date(req.deadline_datetime).toLocaleString('tr-TR')}</span>}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-xs">
                          <div className="flex items-center space-x-1.5">
                            {(req.status === 'MATCHED' || req.status === 'PROVIDER_COMPLETED' || req.status === 'ACCEPTED') && req.queuedProviders && req.queuedProviders.length > 1 && (
                              <button onClick={() => handleCustomerNextProvider(req.id)} className="px-2.5 py-1 border hover:bg-neutral-100 rounded text-[11px] font-semibold flex items-center space-x-1 text-neutral-700">
                                <SkipForward size={11} /><span>Otomatik Sıradakine Geç</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center space-x-1.5 ml-auto">
                            {(req.status === 'MATCHED' || req.status === 'PROVIDER_COMPLETED') && (
                              <button onClick={() => handleStatusChange(req.id, 'COMPLETED')} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center space-x-1 shadow-sm">
                                <ShieldCheck size={12} /><span>{req.status === 'PROVIDER_COMPLETED' ? 'Onayla & Tamamla' : 'Hizmeti Tamamla'}</span>
                              </button>
                            )}
                            <button onClick={() => handleStatusChange(req.id, 'CANCELLED')} className="px-2 py-1 border hover:bg-neutral-100 text-neutral-600 rounded text-[11px]" title="Talebi İptal Et">
                              <Ban size={12} /> İptal
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* B. DEĞERLENDİRME ALANI */}
              {pendingReviewCustomerRequests.length > 0 && (
                <div className="bg-white rounded-2xl border-2 border-emerald-400/80 shadow-md p-5 space-y-4">
                  <div className="flex items-center space-x-2 text-emerald-800">
                    <Sparkles size={18} className="text-amber-500" />
                    <h3 className="text-xs font-mono uppercase font-bold tracking-wider">Hizmet Tamamlandı! Lütfen Değerlendirin ({pendingReviewCustomerRequests.length})</h3>
                  </div>

                  <div className="space-y-3">
                    {pendingReviewCustomerRequests.map((req) => (
                      <div key={req.id} className="bg-emerald-50/40 rounded-xl border border-emerald-200 p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono text-neutral-400">#REQ-{req.id}</span>
                            <p className="text-sm font-bold text-neutral-900">"{req.raw_text}"</p>
                            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">Sağlayıcı: <strong className="text-neutral-800">{req.provider_name || 'Bilinmiyor'}</strong> {req.provider_phone && <span className="ml-1 text-neutral-600 font-mono">({req.provider_phone})</span>}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">ONAYLANDI</span>
                        </div>

                        <div className="p-3 bg-white rounded-lg border border-neutral-200/90 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-neutral-800 text-xs">Hizmet Deneyiminizi Puanlayın:</span>
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} type="button" onClick={() => setReviewRatingMap({ ...reviewRatingMap, [req.id]: star })} className={`p-0.5 transition ${star <= (reviewRatingMap[req.id] || 5) ? 'text-amber-500 fill-amber-500' : 'text-neutral-300'}`}>
                                  <Star size={18} fill={star <= (reviewRatingMap[req.id] || 5) ? '#f59e0b' : 'none'} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <input type="text" value={reviewCommentMap[req.id] || ''} onChange={(e) => setReviewCommentMap({ ...reviewCommentMap, [req.id]: e.target.value })} placeholder="Açıklama veya yorumunuzu yazın (opsiyonel)..." className="w-full p-2.5 text-xs rounded-lg border outline-none bg-neutral-50 focus:border-neutral-950" />
                          <div className="flex items-center justify-end space-x-2 pt-1">
                            <button type="button" onClick={() => handleSendReview(req.id, 'CUSTOMER', true)} className="px-3 py-1.5 text-neutral-500 hover:bg-neutral-100 rounded-lg text-xs font-semibold">Yorum Yapmadan Geç</button>
                            <button type="button" onClick={() => handleSendReview(req.id, 'CUSTOMER', false)} className="px-4 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow-sm">Puanı Gönder</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🌟 C. YENİ TALEP GİRİŞ FORMU (TEK ADIMLI & ÖZET GÖRÜNÜMLÜ YAPI) */}
              {step === 'INPUT' && (
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 space-y-3">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-extrabold tracking-tight text-neutral-950">Hangi Hizmete İhtiyacınız Var?</h2>
                    <p className="text-xs text-neutral-500">Doğal dil ile talebinizi yazın; açık havuzda en uygun sağlayıcılar sıraya girsin.</p>
                  </div>
                  
                  <form onSubmit={handleCustomerCombinedSubmit} className="space-y-3">
                    <div className="bg-[#FAFBFD] rounded-xl border border-neutral-200 p-2.5 focus-within:ring-2 focus-within:ring-neutral-950 transition-all">
                      
                      <div className="flex gap-2">
                        <textarea 
                          rows={2} 
                          value={queryText} 
                          onChange={(e) => setQueryText(e.target.value)} 
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCustomerCombinedSubmit(); } }} 
                          placeholder="Örn: Tarabya'da 2+1 kiralık daire arıyorum..." 
                          className="w-full p-2 text-lg font-bold text-neutral-900 placeholder:text-neutral-400 placeholder:font-normal bg-transparent border-none outline-none resize-none" 
                          required 
                        />
                        <button 
                          type="button" 
                          onClick={() => setIsDetailsCollapsed(!isDetailsCollapsed)} 
                          className="p-1.5 mt-1 text-neutral-500 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg h-fit transition"
                          title="Gelişmiş Seçenekleri Göster/Gizle"
                        >
                          {isDetailsCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </button>
                      </div>

                      {/* 🌟 SÜREKLİ GÖRÜNEN ÖZET BİLGİ ALANI (EMOJİSİZ & MONOKROM İKONLU) */}
                      <div className="flex flex-wrap items-center gap-2.5 px-2 pb-3 text-[11px] font-mono text-neutral-500">
                        <span className="flex items-center space-x-1">
                          <MapPin size={12}/>
                          <span>{locationValue || 'Konum Yok'}</span>
                        </span>
                        
                        {isUrgent && (
                          <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            ACİL
                          </span>
                        )}
                        
                        {deadlineDate && (
                          <span className="flex items-center space-x-1">
                            <Clock size={12}/>
                            <span>{deadlineDate} {deadlineTime}</span>
                          </span>
                        )}
                        
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

                      {!isDetailsCollapsed && (
                        <div className="mt-4 pt-5 border-t border-neutral-200/70 space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-mono uppercase font-semibold text-neutral-500 flex items-center space-x-1"><MapPin size={12} className="text-neutral-700" /><span>Konum</span></label>
                              <button type="button" onClick={fetchCurrentLocation} disabled={isLocating} className="text-[10px] font-mono text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-semibold">
                                <Navigation size={10} className={isLocating ? 'animate-spin' : ''} /><span>{isLocating ? 'Alınıyor...' : '📍 Konumu Güncelle'}</span>
                              </button>
                            </div>
                            <input type="text" value={locationValue} onChange={(e) => setLocationValue(e.target.value)} placeholder="Mevcut konumunuz..." className="w-full p-2.5 text-xs rounded-lg border border-neutral-200 outline-none bg-white focus:border-neutral-950 font-medium" />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-mono uppercase font-semibold text-neutral-500 flex items-center space-x-1"><Calendar size={12} className="text-neutral-700" /><span>En Son Tarih</span></label>
                                {deadlineDate && <button type="button" onClick={() => setDeadlineDate('')} className="text-[10px] text-rose-500 hover:underline">Temizle</button>}
                              </div>
                              <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} className="w-full p-2 text-xs font-mono rounded-lg border border-neutral-200 outline-none bg-white focus:border-neutral-950" />
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[11px] font-mono uppercase font-semibold text-neutral-500 flex items-center space-x-1"><Clock size={12} className="text-neutral-700" /><span>En Son Saat</span></label>
                                {deadlineTime && <button type="button" onClick={() => setDeadlineTime('')} className="text-[10px] text-rose-500 hover:underline">Temizle</button>}
                              </div>
                              <input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} className="w-full p-2 text-xs font-mono rounded-lg border border-neutral-200 outline-none bg-white focus:border-neutral-950" />
                            </div>
                            <div className="flex items-end">
                               <label className="flex items-center justify-center space-x-2 w-full p-2 h-[34px] bg-white rounded-lg border border-neutral-200 cursor-pointer select-none transition hover:bg-neutral-50">
                                <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="w-4 h-4 text-neutral-950 rounded border-neutral-300 focus:ring-neutral-950" />
                                <div className="flex items-center space-x-1.5 text-xs font-bold text-neutral-800">
                                  <Flame size={14} className={isUrgent ? 'text-rose-600 animate-bounce' : 'text-neutral-400'} /><span>ACİL</span>
                                </div>
                              </label>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <button type="button" onClick={() => togglePreferredChannel('PHONE')} className={`p-2 rounded-lg border text-left text-xs flex items-center justify-center sm:justify-start space-x-1.5 transition ${preferredChannels.includes('PHONE') ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-700'}`}><Phone size={13} /><span className="font-semibold text-[11px]">Telefon</span>{preferredChannels.includes('PHONE') && <Check size={12} className="ml-auto hidden sm:inline" />}</button>
                              <button type="button" onClick={() => togglePreferredChannel('SMS')} className={`p-2 rounded-lg border text-left text-xs flex items-center justify-center sm:justify-start space-x-1.5 transition ${preferredChannels.includes('SMS') ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-700'}`}><MessageSquare size={13} /><span className="font-semibold text-[11px]">SMS</span>{preferredChannels.includes('SMS') && <Check size={12} className="ml-auto hidden sm:inline" />}</button>
                              <button type="button" onClick={() => togglePreferredChannel('EMAIL')} className={`p-2 rounded-lg border text-left text-xs flex items-center justify-center sm:justify-start space-x-1.5 transition ${preferredChannels.includes('EMAIL') ? 'border-neutral-950 bg-neutral-950 text-white' : 'border-neutral-200 bg-white text-neutral-700'}`}><Mail size={13} /><span className="font-semibold text-[11px]">E-posta</span>{preferredChannels.includes('EMAIL') && <Check size={12} className="ml-auto hidden sm:inline" />}</button>
                              <button type="button" onClick={() => togglePreferredChannel('WHATSAPP')} className={`p-2 rounded-lg border text-left text-xs flex items-center justify-center sm:justify-start space-x-1.5 transition ${preferredChannels.includes('WHATSAPP') ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-neutral-200 bg-white text-neutral-700'}`}><MessageCircle size={13} /><span className="font-semibold text-[11px]">WhatsApp</span>{preferredChannels.includes('WHATSAPP') && <Check size={12} className="ml-auto hidden sm:inline" />}</button>
                            </div>
                            
                            {preferredChannels.includes('EMAIL') && (
                              <div className="animate-in fade-in duration-150">
                                <input ref={emailInputRef} type="email" required value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); if (errorMessage) setErrorMessage(''); }} placeholder="E-posta Adresiniz (Örn: adiniz@example.com)" className="w-full p-2 text-xs rounded-lg border border-neutral-200 outline-none bg-white focus:border-neutral-950 font-medium" />
                              </div>
                            )}
                          </div>

                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 mt-1 border-t border-neutral-200/60 px-1 text-[11px] text-neutral-400">
                        <span className="font-mono">Enter ile gönderin</span>
                        <button type="submit" disabled={loading || !queryText.trim()} className="ml-auto px-5 py-2 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-300 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center space-x-1.5">
                          {loading ? <span>Gönderiliyor...</span> : <><span>Gönder</span><ArrowRight size={14} /></>}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* D. BELİRSİZLİK ÇÖZÜM EKRANI (DISAMBIGUATE) */}
              {step === 'DISAMBIGUATE' && disambiguationData && (
                <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-center">
                    <h3 className="font-extrabold text-lg text-neutral-950">Hizmet Amacını Netleştirelim</h3>
                    <p className="text-xs text-neutral-500 mt-1">Lütfen tam olarak hangi hizmeti aradığınızı seçin:</p>
                  </div>
                  <div className="space-y-2">
                    {disambiguationData.options.map((option) => (
                      <button 
                        key={option.id} 
                        onClick={() => { 
                          setSelectedDisambiguation(option.text); 
                          submitFinalRequest(option.text); 
                        }} 
                        disabled={loading}
                        className="w-full text-left p-3.5 rounded-xl border border-neutral-200 hover:border-neutral-950 hover:bg-neutral-50 text-xs font-semibold flex items-center justify-between transition"
                      >
                        <span>{option.text}</span>
                        {loading && selectedDisambiguation === option.text ? <Navigation size={14} className="animate-spin text-neutral-400" /> : <ArrowRight size={14} className="text-neutral-400" />}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setStep('INPUT')} className="w-full py-2.5 text-xs text-neutral-500 hover:text-neutral-900 font-semibold transition">Geri Dön</button>
                </div>
              )}

              {/* E. MÜŞTERİ GEÇMİŞ TALEPLER */}
              {filteredPastCustomerRequests.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm mt-8">
                  <div onClick={() => setIsCustomerHistoryOpen(!isCustomerHistoryOpen)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 select-none">
                    <div className="flex items-center space-x-2"><History size={15} className="text-neutral-500" /><h3 className="text-xs font-mono uppercase font-bold text-neutral-700">Geçmiş Talepler ({filteredPastCustomerRequests.length})</h3></div>
                    {isCustomerHistoryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                  {isCustomerHistoryOpen && (
                    <div className="p-4 pt-0 border-t border-neutral-100">
                      
                      <div className="relative mb-3 mt-3">
                        <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
                        <input 
                          type="text" 
                          value={searchCustomerHistoryText} 
                          onChange={(e) => setSearchCustomerHistoryText(e.target.value)}
                          placeholder="Geçmiş taleplerde ara (talep, sağlayıcı vs.)..." 
                          className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border outline-none bg-neutral-50 focus:border-neutral-950 font-medium"
                        />
                        {searchCustomerHistoryText && (
                          <button onClick={() => setSearchCustomerHistoryText('')} className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700">
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {filteredPastCustomerRequests.length === 0 ? (
                          <div className="p-4 text-center text-xs text-neutral-400 font-mono">Aramanıza uygun geçmiş talep bulunamadı.</div>
                        ) : (
                          filteredPastCustomerRequests.map((req) => (
                            <div key={req.id} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 text-xs">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-neutral-900">"{req.raw_text}"</p>
                                  <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Sağlayıcı: <strong className="text-neutral-800">{req.provider_name || 'Bilinmiyor'}</strong> {req.provider_phone ? `(📞 ${req.provider_phone})` : ''} • {new Date(req.created_at).toLocaleDateString('tr-TR')}</p>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{req.status}</span>
                                  <button onClick={() => handleRepeatRequest(req)} className="p-1 text-neutral-500 hover:text-blue-700 hover:bg-blue-50 rounded transition" title="Bu Talebi Tekrarla"><RefreshCw size={13} /></button>
                                  <button onClick={() => handleDeleteRequest(req.id)} className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition" title="Sil"><Trash2 size={13} /></button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) :

          /* ---------------- 🛠️ 3. SERVİS SAĞLAYICI (PROVIDER EKRANI) ---------------- */
          session.role === 'PROVIDER' ? (
            <div className="max-w-3xl mx-auto w-full space-y-5">
              
              {/* Profil Akordeonu */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                <div onClick={() => setIsProfileOpen(!isProfileOpen)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 select-none">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-800"><Wrench size={16} /></div>
                    <div>
                      <h2 className="text-sm font-bold text-neutral-950">{providerProfile ? providerProfile.name : 'Sağlayıcı Profilinizi Oluşturun'}</h2>
                      <p className="text-[11px] text-neutral-500 font-mono">{session.phone} {providerProfile ? `• Skor: ${providerProfile.priority_score}` : '• Profil Tanımlanmamış'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-neutral-500">{isProfileOpen ? 'Gizle' : 'Düzenle'}</span>
                    {isProfileOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </div>
                </div>

                {isProfileOpen && (
                  <form onSubmit={handleSaveProviderProfile} className="p-5 pt-2 border-t border-neutral-100 space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">İşletme Adı *</label>
                        <input type="text" required value={providerFormData.name} onChange={(e) => setProviderFormData({ ...providerFormData, name: e.target.value })} placeholder="Örn: Erikli Su Kadıköy Bayi" className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950 font-medium" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">E-posta</label>
                        <input type="email" value={providerFormData.email} onChange={(e) => setProviderFormData({ ...providerFormData, email: e.target.value })} placeholder="info@isletme.com" className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-mono uppercase font-semibold text-neutral-500 flex items-center space-x-1"><Tag size={12} className="text-neutral-700" /><span>Hizmet Anahtar Kelimeleri (Virgülle Ayırın) *</span></label>
                        <div className="flex items-center space-x-2 text-[10px] font-mono font-bold">
                          <span className={providerKwMetrics.wordCount > MAX_KEYWORD_COUNT ? 'text-rose-600' : 'text-neutral-500'}>{providerKwMetrics.wordCount} / {MAX_KEYWORD_COUNT} Kelime</span><span className="text-neutral-300">•</span>
                          <span className={providerKwMetrics.charCount > MAX_KEYWORD_CHARS ? 'text-rose-600' : 'text-neutral-500'}>{providerKwMetrics.charCount} / {MAX_KEYWORD_CHARS} Karakter</span>
                        </div>
                      </div>
                      <textarea rows={3} required maxLength={MAX_KEYWORD_CHARS} value={providerFormData.serviceKeywords} onChange={(e) => setProviderFormData({ ...providerFormData, serviceKeywords: e.target.value })} placeholder="su, damacana, erikli, kadıköy, içme suyu..." className="w-full p-2.5 text-xs font-mono rounded-xl border border-neutral-200 outline-none bg-neutral-50 focus:bg-white focus:border-neutral-950 transition resize-none leading-relaxed" />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-3 text-xs font-mono">
                        <label className="flex items-center space-x-1 cursor-pointer"><input type="checkbox" checked={providerFormData.communicationChannels.includes('PHONE')} onChange={(e) => { const newCh = e.target.checked ? [...providerFormData.communicationChannels, 'PHONE'] : providerFormData.communicationChannels.filter(c => c !== 'PHONE'); setProviderFormData({ ...providerFormData, communicationChannels: newCh }); }} /><span>PHONE</span></label>
                        <label className="flex items-center space-x-1 cursor-pointer"><input type="checkbox" checked={providerFormData.communicationChannels.includes('SMS')} onChange={(e) => { const newCh = e.target.checked ? [...providerFormData.communicationChannels, 'SMS'] : providerFormData.communicationChannels.filter(c => c !== 'SMS'); setProviderFormData({ ...providerFormData, communicationChannels: newCh }); }} /><span>SMS</span></label>
                        <label className="flex items-center space-x-1 cursor-pointer"><input type="checkbox" checked={providerFormData.communicationChannels.includes('EMAIL')} onChange={(e) => { const newCh = e.target.checked ? [...providerFormData.communicationChannels, 'EMAIL'] : providerFormData.communicationChannels.filter(c => c !== 'EMAIL'); setProviderFormData({ ...providerFormData, communicationChannels: newCh }); }} /><span>EMAIL</span></label>
                        <label className="flex items-center space-x-1 cursor-pointer"><input type="checkbox" checked={providerFormData.communicationChannels.includes('WHATSAPP')} onChange={(e) => { const newCh = e.target.checked ? [...providerFormData.communicationChannels, 'WHATSAPP'] : providerFormData.communicationChannels.filter(c => c !== 'WHATSAPP'); setProviderFormData({ ...providerFormData, communicationChannels: newCh }); }} /><span>WHATSAPP</span></label>
                      </div>
                      <button type="submit" disabled={providerKwMetrics.wordCount > MAX_KEYWORD_COUNT || providerKwMetrics.charCount > MAX_KEYWORD_CHARS} className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-300 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"><Save size={13} /><span>Profili Kaydet</span></button>
                    </div>
                  </form>
                )}
              </div>

              {/* 🌟 AKTİF İŞ TALEPLERİ (SABİT) */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase font-bold text-neutral-950 flex items-center space-x-1.5">
                    <Building2 size={14} className="text-blue-600" />
                    <span>Aktif İşlerim ({activeProviderRequests.length})</span>
                  </h3>
                </div>
                <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
                  {activeProviderRequests.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-400 font-mono">Henüz eşleştiğiniz veya devam eden bir işiniz bulunmuyor.</div>
                  ) : (
                    activeProviderRequests.map((req) => {
                      const clientEmail = extractEmail(req.contact_value);
                      const cleanPhone = extractPhone(req.contact_value) || session.phone;
                      const phoneDigits = cleanPhone.replace(/\D/g, '');
                      const rawChannels = (req.preferred_channel || 'PHONE').toUpperCase();
                      const hasPhone = rawChannels.includes('PHONE') || rawChannels.includes('TELEFON');
                      const hasSms = rawChannels.includes('SMS');
                      const hasEmail = rawChannels.includes('EMAIL') || rawChannels.includes('E-POSTA');
                      const hasWhatsapp = rawChannels.includes('WHATSAPP');

                      const providerName = providerProfile?.name || req.provider_name || 'Hizmet Sağlayıcı';
                      const providerPhone = providerProfile?.phone || req.provider_phone || session.phone;
                      const providerEmail = providerProfile?.email || req.provider_email || '';
                      const providerLocation = req.location || 'İstanbul';

                      const emailBodyText = `Merhaba,\n\n"${req.raw_text}" talebiniz ile ilgili olarak iletişime geçiyorum.\n\nDetayları görüşmek ve hizmet planlamasını yapmak üzere tarafınıza dönüş yapılmıştır.\n\nSaygılarımızla,\n--------------------------------------------\n🏢 ${providerName}\n📍 Adres / Hizmet Bölgesi: ${providerLocation}\n📞 Tel: ${providerPhone}${providerEmail ? `\n📧 E-posta: ${providerEmail}` : ''}\n--------------------------------------------`;
                      const mailtoSubject = encodeURIComponent(`Mobool Hizmet Talebi Hk. (#REQ-${req.id})`);
                      const mailtoBody = encodeURIComponent(emailBodyText);
                      const mailtoLink = clientEmail ? `mailto:${clientEmail}?subject=${mailtoSubject}&body=${mailtoBody}` : null;

                      const commonMsgText = `Merhaba, Mobool üzerinden gönderdiğiniz #${req.id} numaralı "${req.raw_text}" talebiniz için iletişime geçiyorum.`;
                      const encodedCommonMsg = encodeURIComponent(commonMsgText);

                      const smsLink = `sms:${cleanPhone}${navigator.userAgent.match(/iPhone|iPad|iPod/i) ? '&' : '?'}body=${encodedCommonMsg}`;
                      const waLink = `https://wa.me/${phoneDigits}?text=${encodedCommonMsg}`;
                      const callLink = `tel:${cleanPhone}`;

                      return (
                        <div key={req.id} className="bg-[#FAFBFD] p-4 rounded-xl border border-neutral-200 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${req.status === 'MATCHED' ? 'bg-blue-50 text-blue-700 border border-blue-200' : req.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : req.status === 'PROVIDER_COMPLETED' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-neutral-100 text-neutral-800'}`}>
                                {req.status === 'MATCHED' ? 'ONAY BEKLİYOR' : req.status === 'PROVIDER_COMPLETED' ? 'HİZMET TESLİM EDİLDİ (MÜŞTERİ ONAYI BEKLENİYOR)' : req.status}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400 ml-1.5">#REQ-{req.id}</span>
                              <p className="text-sm font-semibold text-neutral-900 mt-1">"{req.raw_text}"</p>
                            </div>
                          </div>

                          <div className="p-2.5 bg-white rounded border border-neutral-200/70 text-xs space-y-2">
                            <p className="font-mono text-neutral-700">Müşteri İletişim: <strong className="text-neutral-900">{req.contact_value}</strong></p>

                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-neutral-500 pt-1 border-t border-neutral-100">
                              <span>📍 Konum: <strong>{req.location || 'Mevcut Konum'}</strong></span>
                              {req.is_urgent && <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold border border-rose-200">ACİL</span>}
                              {req.deadline_datetime && <span>⏰ En Son: <strong>{new Date(req.deadline_datetime).toLocaleString('tr-TR')}</strong></span>}
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-100 text-[11px] font-mono">
                              <span className="font-bold text-neutral-600 mr-1">İletişim Kanalları:</span>
                              {hasPhone && <a href={callLink} className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md font-semibold flex items-center space-x-1 transition shadow-xs"><Phone size={12} /><span>Ara</span></a>}
                              {hasSms && <a href={smsLink} className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-md font-semibold flex items-center space-x-1 transition shadow-xs"><MessageSquare size={12} /><span>SMS</span></a>}
                              {hasWhatsapp && <a href={waLink} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md font-semibold flex items-center space-x-1 transition shadow-xs"><MessageCircle size={12} /><span>WhatsApp</span></a>}
                              {hasEmail && mailtoLink && <a href={mailtoLink} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md font-semibold flex items-center space-x-1 transition shadow-xs"><Mail size={12} /><span>E-posta</span></a>}
                            </div>
                          </div>

                          <div className="flex items-center justify-end space-x-2 pt-1">
                            {req.status === 'MATCHED' && (
                              <>
                                <button onClick={() => handleCustomerNextProvider(req.id)} className="px-2.5 py-1 border hover:bg-neutral-100 text-neutral-700 rounded text-xs font-semibold">Pas Geç</button>
                                <button onClick={() => handleStatusChange(req.id, 'ACCEPTED')} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center space-x-1"><Check size={12} /><span>Kabul Et & İletişime Geç</span></button>
                              </>
                            )}
                            {req.status === 'ACCEPTED' && (
                              <button onClick={() => handleStatusChange(req.id, 'PROVIDER_COMPLETED')} className="px-3 py-1 bg-neutral-950 text-white rounded text-xs font-semibold flex items-center space-x-1"><ShieldCheck size={12} /><span>Hizmeti Teslim Et (Müşteri Onayına Sun)</span></button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 🌟 YENİ: AÇIK TALEP HAVUZU (AÇILIR KAPANIR / COLLAPSIBLE) */}
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm mt-5">
                <div onClick={() => setIsPoolOpen(!isPoolOpen)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 select-none">
                  <div className="flex items-center space-x-2">
                    <Inbox size={15} className="text-blue-600" />
                    <h3 className="text-xs font-mono uppercase font-bold text-neutral-700">Açık Talep Havuzu ({poolRequests.length})</h3>
                    {poolRequests.length > 0 && <span className="flex w-2 h-2 rounded-full bg-blue-500 animate-pulse ml-1"></span>}
                  </div>
                  {isPoolOpen ? <ChevronUp size={16} className="text-neutral-500"/> : <ChevronDown size={16} className="text-neutral-500"/>}
                </div>
                {isPoolOpen && (
                  <div className="p-4 pt-0 space-y-3 border-t border-neutral-100 max-h-[400px] overflow-y-auto">
                    {poolRequests.length === 0 ? (
                      <div className="p-8 text-center text-xs text-neutral-400 font-mono">Şu anda açık havuzda profilinize uygun yeni bir talep bulunmuyor.</div>
                    ) : (
                      poolRequests.map((req) => (
                        <div key={req.id} className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm space-y-3 hover:border-blue-400 transition">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${req.status === 'POOL' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                {req.status === 'POOL' ? 'İLK SİZ TALİP OLUN' : 'AKTİF (KUYRUĞA KATIL)'}
                              </span>
                              <span className="text-[10px] font-mono text-neutral-400 ml-1.5">#REQ-{req.id}</span>
                              <p className="text-base font-bold text-neutral-950 mt-1.5">"{req.raw_text}"</p>
                            </div>
                            <span className="text-[10px] text-neutral-400 font-mono flex items-center space-x-1"><Clock size={11} /> <span>{new Date(req.created_at).toLocaleTimeString('tr-TR')}</span></span>
                          </div>
                          <div className="p-2.5 bg-neutral-50 rounded border border-neutral-100 text-xs space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-neutral-500">
                              <span>📍 Konum: <strong className="text-neutral-800">{req.location || 'Bilinmiyor'}</strong></span>
                              {req.is_urgent && <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold border border-rose-200">ACİL</span>}
                              {req.deadline_datetime && <span>⏰ En Son: <strong>{new Date(req.deadline_datetime).toLocaleString('tr-TR')}</strong></span>}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] font-mono text-blue-600">
                              {req.status === 'POOL' ? 'Talebe ilk talip olan siz olarak müşteriyle hemen eşleşin.' : 'Başka bir sağlayıcı eşleşmiş, ancak kuyruğa girerek sıranızı bekleyebilirsiniz.'}
                            </span>
                            <button onClick={() => handleJoinPool(req.id)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm transition">
                              <UserCheck size={14} /><span>Sıraya Gir</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* SAĞLAYICI GEÇMİŞ TALEPLER */}
              {pastProviderRequests.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm mt-5">
                  <div onClick={() => setIsProviderHistoryOpen(!isProviderHistoryOpen)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 select-none">
                    <div className="flex items-center space-x-2"><History size={15} className="text-neutral-500" /><h3 className="text-xs font-mono uppercase font-bold text-neutral-700">Geçmiş İş Talepleri ({pastProviderRequests.length})</h3></div>
                    {isProviderHistoryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                  {isProviderHistoryOpen && (
                    <div className="p-4 pt-0 space-y-3 border-t border-neutral-100 max-h-[350px] overflow-y-auto">
                      {pastProviderRequests.map((req) => (
                        <div key={req.id} className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 text-xs mt-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-neutral-900">"{req.raw_text}"</p>
                              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Müşteri: {req.contact_value} • {new Date(req.created_at).toLocaleDateString('tr-TR')}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">{req.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          ) :

          /* ---------------- ⚙️ 4. ADMİN EKRANI ---------------- */
          (
            <div className="w-full mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <h2 className="text-lg font-bold text-neutral-950">Sistem Yönetim Paneli</h2>

                <div className="flex flex-wrap items-center gap-1 bg-neutral-100 p-1 rounded-lg border text-xs font-semibold">
                  <button onClick={() => setAdminTab('WOZ')} className={`px-3 py-1 rounded-md ${adminTab === 'WOZ' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>WoZ Havuzu ({pendingRequests.length})</button>
                  <button onClick={() => setAdminTab('PROVIDERS')} className={`px-3 py-1 rounded-md ${adminTab === 'PROVIDERS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>Sağlayıcılar ({filteredProviders.length}/{providers.length})</button>
                  <button onClick={() => setAdminTab('ALL_MATCHED')} className={`px-3 py-1 rounded-md flex items-center space-x-1 ${adminTab === 'ALL_MATCHED' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>
                    <Layers size={13} /><span>Tüm Talepler & Kuyruk ({filteredMatchedRequests.length})</span>
                  </button>
                  <button onClick={() => setAdminTab('SMS_LOGS')} className={`px-3 py-1 rounded-md ${adminTab === 'SMS_LOGS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>SMS Log ({filteredSmsLogs.length})</button>
                  <button onClick={() => setAdminTab('TESTS')} className={`px-3 py-1 rounded-md flex items-center space-x-1.5 ${adminTab === 'TESTS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}><FileCheck2 size={13} /><span>Test Senaryolar ({tests.length})</span></button>
                  <button onClick={() => setAdminTab('PROJECT')} className={`px-3 py-1 rounded-md flex items-center space-x-1.5 ${adminTab === 'PROJECT' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}><FolderKanban size={13} /><span>Yol Haritası ({features.length})</span></button>
                  
                  <button onClick={() => setAdminTab('SETTINGS')} className={`px-3 py-1 rounded-md flex items-center space-x-1.5 ${adminTab === 'SETTINGS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500'}`}>
                    <Settings size={13} /><span>Sistem Ayarları</span>
                  </button>
                </div>
              </div>

              {/* 🌟 YENİ: SİSTEM DEĞİŞKENLERİ İÇERİĞİ (TABULAR/TABLE TASARIM) */}
              {adminTab === 'SETTINGS' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                      <Settings className="text-neutral-700" size={18} />
                      <h3 className="font-bold text-neutral-950">Sistem Ayarları ve Parametreler</h3>
                    </div>

                    {/* Alt Sekmeler (Tabs) */}
                    <div className="flex items-center space-x-6 border-b border-neutral-200 mb-5">
                      <button onClick={() => setSettingsTab('GENERAL')} className={`pb-2.5 text-[11px] font-bold uppercase tracking-wider border-b-2 transition ${settingsTab === 'GENERAL' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`}>
                        Genel Kurallar
                      </button>
                      <button onClick={() => setSettingsTab('TIMEOUTS')} className={`pb-2.5 text-[11px] font-bold uppercase tracking-wider border-b-2 transition ${settingsTab === 'TIMEOUTS' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`}>
                        Zaman Aşımları (Timeout)
                      </button>
                      <button onClick={() => setSettingsTab('INTEGRATIONS')} className={`pb-2.5 text-[11px] font-bold uppercase tracking-wider border-b-2 transition ${settingsTab === 'INTEGRATIONS' ? 'border-neutral-950 text-neutral-950' : 'border-transparent text-neutral-400 hover:text-neutral-700'}`}>
                        API & Entegrasyon
                      </button>
                    </div>

                    {/* Sekme İçerikleri */}
                    <div className="min-h-[250px]">
                      
                      {/* --- GENEL AYARLAR TABLOSU --- */}
                      {settingsTab === 'GENERAL' && (
                        <div className="overflow-x-auto w-full border border-neutral-200 rounded-xl animate-in fade-in duration-200">
                          <table className="w-full text-left text-xs table-auto">
                            <thead className="bg-neutral-50 text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
                              <tr>
                                <th className="px-4 py-3 font-semibold w-1/4">Ayar Adı</th>
                                <th className="px-4 py-3 font-semibold w-2/4">Açıklama</th>
                                <th className="px-4 py-3 font-semibold w-32 text-center">Değer</th>
                                <th className="px-4 py-3 font-semibold w-24 text-right">İşlem</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 bg-white">
                              <tr className="hover:bg-neutral-50 transition">
                                <td className="px-4 py-3 align-middle font-bold text-neutral-900">
                                  <div className="flex items-center space-x-1.5">
                                    <Clock size={14} className="text-blue-600"/>
                                    <span>Varsayılan Bitiş Süresi</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 align-middle text-neutral-500">
                                  Müşteri özel bir son tarih belirlemezse, talep kaç gün sonra açık havuzdan otomatik düşsün?
                                </td>
                                <td className="px-4 py-3 align-middle text-center">
                                  <input 
                                    type="number" min="1" 
                                    value={systemSettings.default_deadline_days || ''} 
                                    onChange={(e) => setSystemSettings({...systemSettings, default_deadline_days: e.target.value})} 
                                    className="w-16 p-1.5 text-xs font-mono font-bold text-center rounded border border-neutral-300 outline-none focus:border-neutral-950" 
                                  />
                                </td>
                                <td className="px-4 py-3 align-middle text-right">
                                  <button onClick={() => handleSaveSystemSetting('default_deadline_days', systemSettings.default_deadline_days)} className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded text-xs font-semibold shadow-sm transition inline-flex items-center space-x-1">
                                    <Save size={12} /><span>Kaydet</span>
                                  </button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* --- ZAMAN AŞIMLARI TABLOSU --- */}
                      {settingsTab === 'TIMEOUTS' && (
                        <div className="overflow-x-auto w-full border border-neutral-200 rounded-xl animate-in fade-in duration-200">
                          <table className="w-full text-left text-xs table-auto">
                            <thead className="bg-neutral-50 text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
                              <tr>
                                <th className="px-4 py-3 font-semibold w-1/4">Ayar Adı</th>
                                <th className="px-4 py-3 font-semibold w-2/4">Açıklama</th>
                                <th className="px-4 py-3 font-semibold w-32 text-center">Değer</th>
                                <th className="px-4 py-3 font-semibold w-24 text-right">İşlem</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 bg-white">
                              {/* Timeout Onay Bekleme */}
                              <tr className="hover:bg-neutral-50 transition">
                                <td className="px-4 py-3 align-middle font-bold text-neutral-900">
                                  <div className="flex items-center space-x-1.5">
                                    <Timer size={14} className="text-rose-500"/>
                                    <span>Onay Bekleme (Dk)</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 align-middle text-neutral-500">
                                  Eşleşen sağlayıcı bu süre içinde işi <b>kabul etmezse</b>, sistem otomatik sıradakine geçer.
                                </td>
                                <td className="px-4 py-3 align-middle text-center">
                                  <input 
                                    type="number" min="1" 
                                    value={systemSettings.timeout_matched_mins || ''} 
                                    onChange={(e) => setSystemSettings({...systemSettings, timeout_matched_mins: e.target.value})} 
                                    className="w-16 p-1.5 text-xs font-mono font-bold text-center rounded border border-neutral-300 outline-none focus:border-neutral-950" 
                                  />
                                </td>
                                <td className="px-4 py-3 align-middle text-right">
                                  <button onClick={() => handleSaveSystemSetting('timeout_matched_mins', systemSettings.timeout_matched_mins)} className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded text-xs font-semibold shadow-sm transition inline-flex items-center space-x-1">
                                    <Save size={12} /><span>Kaydet</span>
                                  </button>
                                </td>
                              </tr>
                              
                              {/* Timeout Teslim Etmeme */}
                              <tr className="hover:bg-rose-50/30 transition">
                                <td className="px-4 py-3 align-middle font-bold text-rose-950">
                                  <div className="flex items-center space-x-1.5">
                                    <AlertTriangle size={14} className="text-rose-600"/>
                                    <span>Teslim Etmeme (Saat)</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 align-middle text-rose-700/80">
                                  Kabul edilen iş bu sürede <b>tamamlanmazsa</b> sıradakine geçer (Sahada kargaşa yaratabilir).
                                </td>
                                <td className="px-4 py-3 align-middle text-center">
                                  <input 
                                    type="number" min="1" 
                                    value={systemSettings.timeout_accepted_hours || ''} 
                                    onChange={(e) => setSystemSettings({...systemSettings, timeout_accepted_hours: e.target.value})} 
                                    className="w-16 p-1.5 text-xs font-mono font-bold text-center rounded border border-rose-300 outline-none focus:border-rose-950 text-rose-950" 
                                  />
                                </td>
                                <td className="px-4 py-3 align-middle text-right">
                                  <button onClick={() => handleSaveSystemSetting('timeout_accepted_hours', systemSettings.timeout_accepted_hours)} className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold shadow-sm transition inline-flex items-center space-x-1">
                                    <Save size={12} /><span>Kaydet</span>
                                  </button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* --- API & ENTEGRASYON TABLOSU --- */}
                      {settingsTab === 'INTEGRATIONS' && (
                        <div className="overflow-x-auto w-full border border-neutral-200 rounded-xl animate-in fade-in duration-200">
                          <table className="w-full text-left text-xs table-auto">
                            <thead className="bg-neutral-50 text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
                              <tr>
                                <th className="px-4 py-3 font-semibold w-1/4">Entegrasyon Adı</th>
                                <th className="px-4 py-3 font-semibold w-2/4">Açıklama</th>
                                <th className="px-4 py-3 font-semibold w-32 text-center">Değer</th>
                                <th className="px-4 py-3 font-semibold w-24 text-right">İşlem</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 bg-white">
                              <tr>
                                <td colSpan="4" className="px-4 py-12 text-center text-neutral-400">
                                  <Link2 size={24} className="mx-auto mb-2 text-neutral-300" />
                                  <span className="font-semibold text-neutral-600 block">WhatsApp & SMS API Değişkenleri</span>
                                  <span className="text-[10px]">Twilio ve Meta (WhatsApp Cloud API) webhook key ve token ayarları yakında buraya eklenecektir.</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                    </div>
                  </div>
                </div>
              )}

              {/* 4.0 WoZ HAVUZU */}
              {adminTab === 'WOZ' && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-4 max-h-[550px] overflow-y-auto pr-1 space-y-3">
                  {pendingRequests.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-400">WoZ havuzunda bekleyen veya manuel müdahale gerektiren talep bulunmuyor.</div>
                  ) : (
                    pendingRequests.map((req) => (
                      <div key={req.id} className="p-4 bg-neutral-50 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2"><span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">{req.status}</span><span className="text-neutral-400 font-mono">#REQ-{req.id}</span></div>
                          <p className="font-semibold text-neutral-950 text-sm">"{req.raw_text}"</p>
                          <div className="flex flex-wrap gap-2 text-neutral-500 font-mono text-[11px]">
                            <span>👤 İletişim: <strong className="text-neutral-800">{req.contact_value}</strong></span>
                            <span>📍 {req.location || 'Kadıköy'}</span>
                            {req.is_urgent && <span className="text-rose-600 font-bold">🔥 ACİL</span>}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <button onClick={() => { setWozAssignModalReq(req); setWozProviderSearch(''); }} className="px-3.5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition">
                            <UserCheck size={13} /><span>Sağlayıcı Seç & Ata</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 4.1 SAĞLAYICILAR */}
              {adminTab === 'PROVIDERS' && (
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="relative w-full sm:w-96">
                      <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
                      <input type="text" value={searchProviderText} onChange={(e) => setSearchProviderText(e.target.value)} placeholder="Firma adı, telefon veya anahtar kelime ara..." className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none bg-neutral-50 focus:border-neutral-950 font-medium" />
                      {searchProviderText && <button onClick={() => setSearchProviderText('')} className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700"><X size={13} /></button>}
                    </div>
                    <button onClick={() => { setEditingProviderId(null); setModalFormData({ name: '', phone: '', email: '', serviceKeywords: '', communicationChannels: ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'], priorityScore: 100 }); setIsModalOpen(true); }} className="px-3.5 py-1.5 bg-neutral-950 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shrink-0 shadow-sm w-full sm:w-auto justify-center">
                      <Plus size={13} /><span>Yeni Sağlayıcı Ekle</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 max-h-[550px] overflow-y-auto pr-1">
                    {filteredProviders.length === 0 ? (
                      <div className="p-8 text-center text-xs text-neutral-400">Aranan kelimeye uygun servis sağlayıcı bulunamadı.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {filteredProviders.map((prov) => (
                          <div key={prov.id} className="p-3.5 bg-neutral-50 hover:bg-[#F4F6F9] rounded-xl border border-neutral-200/90 flex flex-col justify-between space-y-2.5 text-xs transition shadow-xs group">
                            <div>
                              <div className="flex items-start justify-between">
                                <div onClick={() => handleOpenProviderDirectSession(prov.phone)} className="cursor-pointer hover:underline flex items-center space-x-1" title="Bu sağlayıcı olarak yeni sekmede oturum aç">
                                  <h3 className="font-bold text-neutral-900 group-hover:text-blue-600 transition">{prov.name}</h3><ExternalLink size={12} className="text-neutral-400 group-hover:text-blue-600 inline" />
                                </div>
                                <span className="text-[10px] font-mono bg-neutral-200 px-1.5 py-0.5 rounded font-bold text-neutral-700">Skor: {prov.priority_score}</span>
                              </div>
                              <p className="text-[11px] text-blue-700 font-mono font-semibold mt-0.5">📞 {prov.phone}</p>
                              {prov.email && <p className="text-[10px] text-neutral-500 font-mono">📧 {prov.email}</p>}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {(prov.service_keywords || []).slice(0, 5).map((kw, i) => (<span key={i} className="text-[10px] font-mono px-1.5 py-0.5 bg-white border rounded text-neutral-600">{kw}</span>))}
                                {(prov.service_keywords || []).length > 5 && <span className="text-[10px] font-mono text-neutral-400">+{prov.service_keywords.length - 5}</span>}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60">
                              <button onClick={() => handleOpenProviderDirectSession(prov.phone)} className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[11px] font-semibold flex items-center space-x-1 transition shadow-xs" title="Sağlayıcı olarak yeni sekmede paneli aç">
                                <LogIn size={12} /><span>Paneli Aç</span>
                              </button>
                              <div className="flex items-center space-x-1">
                                <button onClick={() => { setEditingProviderId(prov.id); setModalFormData({ name: prov.name, phone: prov.phone, email: prov.email || '', serviceKeywords: (prov.service_keywords || []).join(', '), communicationChannels: prov.communication_channels || ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'], priorityScore: prov.priority_score || 100 }); setIsModalOpen(true); }} className="p-1 hover:bg-neutral-200 rounded text-neutral-600 transition" title="Düzenle"><Edit3 size={13} /></button>
                                <button onClick={() => handleAdminDeleteProvider(prov.id)} className="p-1 text-rose-600 hover:bg-rose-50 rounded transition" title="Sil"><Trash2 size={13} /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 🌟 4.2 TÜM EŞLEŞMELER & KUYRUK EKRANI */}
              {adminTab === 'ALL_MATCHED' && (
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="relative w-full sm:w-80">
                      <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
                      <input type="text" value={searchMatchText} onChange={(e) => setSearchMatchText(e.target.value)} placeholder="Talep metni, tel, sağlayıcı ara..." className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none bg-neutral-50 focus:border-neutral-950 font-medium" />
                      {searchMatchText && <button onClick={() => setSearchMatchText('')} className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700"><X size={13} /></button>}
                    </div>
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <Filter size={13} className="text-neutral-500" />
                      <select value={matchStatusFilter} onChange={(e) => setMatchStatusFilter(e.target.value)} className="p-1.5 text-xs rounded-lg border outline-none bg-neutral-50 font-medium w-full sm:w-auto">
                        <option value="ALL">Tüm Durumlar</option>
                        <option value="POOL">POOL (Açık Havuzda)</option>
                        <option value="MATCHED">MATCHED (Onay Bekliyor)</option>
                        <option value="ACCEPTED">ACCEPTED (Kabul Edildi)</option>
                        <option value="PROVIDER_COMPLETED">PROVIDER_COMPLETED (Teslim Edildi)</option>
                        <option value="COMPLETED">COMPLETED (Tamamlandı)</option>
                        <option value="CANCELLED">CANCELLED (İptal)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm">
                    {sortedMatchedRequests.length === 0 ? (
                      <div className="p-8 text-center text-xs text-neutral-400">Arama kriterlerine uygun talep bulunamadı.</div>
                    ) : (
                      <div className="max-h-[650px] overflow-y-auto overflow-x-hidden w-full">
                        <table className="w-full text-left text-xs table-auto">
                          <thead className="bg-neutral-50 text-[10px] font-mono uppercase text-neutral-500 tracking-wider sticky top-0 z-10 shadow-sm">
                            <tr>
                              <SortableHeader label="ID / Tarih" sortKey="id" />
                              <SortableHeader label="Kuyruk" sortKey="queue" align="center" />
                              <SortableHeader label="Durum" sortKey="status" />
                              <SortableHeader label="Talep Metni" sortKey="raw_text" />
                              <SortableHeader label="Müşteri" sortKey="contact_value" />
                              <SortableHeader label="Sağlayıcı" sortKey="provider_name" />
                              <SortableHeader label="Konum / Aciliyet" sortKey="location" />
                              <th className="px-4 py-3 font-semibold border-b border-neutral-200 text-right">İşlem</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {sortedMatchedRequests.map((req) => (
                              <React.Fragment key={req.id}>
                                <tr className={`hover:bg-neutral-50 transition ${expandedQueueReqId === req.id ? 'bg-blue-50/30' : ''}`}>
                                  
                                  <td className="px-4 py-3 align-top whitespace-normal">
                                    <div className="font-mono font-bold text-neutral-900">#REQ-{req.id}</div>
                                    <div className="text-[10px] text-neutral-400 mt-0.5">{new Date(req.created_at).toLocaleDateString('tr-TR')}</div>
                                  </td>
                                  
                                  <td className="px-4 py-3 align-top text-center">
                                    {req.queueList && req.queueList.length > 0 ? (
                                      <button onClick={() => setExpandedQueueReqId(expandedQueueReqId === req.id ? null : req.id)} className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition whitespace-nowrap ${expandedQueueReqId === req.id ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-white hover:bg-neutral-50 text-neutral-700'}`}>
                                        <Users size={12} /><span>{req.queueList.length} Aday</span>{expandedQueueReqId === req.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                      </button>
                                    ) : (
                                      <span className="text-neutral-300 text-[10px] font-mono whitespace-nowrap">0 Aday</span>
                                    )}
                                  </td>

                                  <td className="px-4 py-3 align-top">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold inline-block whitespace-nowrap ${
                                      req.status === 'POOL' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                      req.status === 'MATCHED' ? 'bg-blue-100 text-blue-800' :
                                      req.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                                      req.status === 'PROVIDER_COMPLETED' ? 'bg-purple-100 text-purple-800' :
                                      req.status === 'COMPLETED' ? 'bg-emerald-200 text-emerald-950' : 'bg-neutral-200'
                                    }`}>
                                      {req.status}
                                    </span>
                                  </td>

                                  <td className="px-4 py-3 align-top font-semibold text-neutral-900 whitespace-normal">
                                    "{req.raw_text}"
                                  </td>

                                  <td className="px-4 py-3 align-top whitespace-normal">
                                    <div className="font-mono text-neutral-800">{req.contact_value}</div>
                                  </td>

                                  <td className="px-4 py-3 align-top whitespace-normal">
                                    {req.provider_name ? (
                                      <div className="space-y-1">
                                        <div className="font-bold text-neutral-900">{req.provider_name}</div>
                                        {req.provider_phone && (
                                          <div className="flex items-center space-x-1.5">
                                            <span className="font-mono text-[11px] text-blue-700">{req.provider_phone}</span>
                                            <button onClick={() => handleOpenProviderDirectSession(req.provider_phone)} className="text-[10px] text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-0.5 rounded transition" title="Giriş Yap"><ExternalLink size={11} /></button>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-neutral-400 italic text-[11px]">Atanmadı (Havuz)</span>
                                    )}
                                  </td>

                                  <td className="px-4 py-3 align-top whitespace-normal">
                                    <div className="text-neutral-700 flex items-center space-x-1">
                                      <span>{req.location || 'Kadıköy'}</span>
                                      {req.is_urgent && <Flame size={12} className="text-rose-600 shrink-0" title="Acil" />}
                                    </div>
                                  </td>

                                  <td className="px-4 py-3 align-top text-right">
                                    <button onClick={() => handleDeleteRequest(req.id)} className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition" title="Talebi Sil">
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>

                                {expandedQueueReqId === req.id && req.queueList && req.queueList.length > 0 && (
                                  <tr className="bg-blue-50/20 border-b border-blue-100/50">
                                    <td colSpan="8" className="px-4 py-4">
                                      <div className="pl-4 border-l-2 border-blue-400 py-1 space-y-2">
                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-800 font-mono">Kuyruktaki Sağlayıcılar ({req.queueList.length})</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                                          {req.queueList.map((qItem, qIdx) => (
                                            <div key={qIdx} className="bg-white p-2.5 rounded-lg border border-blue-100 shadow-xs flex flex-col space-y-1.5">
                                              <div className="flex items-center justify-between">
                                                <span className="font-bold text-[11px] text-neutral-900">#{qIdx + 1} {qItem.name}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${
                                                  qItem.interest_status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                                                  qItem.interest_status === 'SKIPPED' ? 'bg-rose-100 text-rose-800' :
                                                  'bg-amber-100 text-amber-800'
                                                }`}>
                                                  {qItem.interest_status}
                                                </span>
                                              </div>
                                              <div className="font-mono text-[10px] text-neutral-500">📞 {qItem.phone}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4.3 SMS LOGLARI */}
              {adminTab === 'SMS_LOGS' && (
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="relative w-full sm:w-80">
                      <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
                      <input type="text" value={searchSmsText} onChange={(e) => setSearchSmsText(e.target.value)} placeholder="Telefon veya SMS mesaj metninde ara..." className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none bg-neutral-50 focus:border-neutral-950 font-medium" />
                      {searchSmsText && <button onClick={() => setSearchSmsText('')} className="absolute right-2.5 top-2 text-neutral-400 hover:text-neutral-700"><X size={13} /></button>}
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <Filter size={13} className="text-neutral-500" />
                      <select value={smsRecipientFilter} onChange={(e) => setSmsRecipientFilter(e.target.value)} className="p-1.5 text-xs rounded-lg border outline-none bg-neutral-50 font-medium w-full sm:w-auto">
                        <option value="ALL">Tüm Alıcılar</option>
                        <option value="USER">USER (Müşteri Bildirimleri)</option>
                        <option value="PROVIDER">PROVIDER (Sağlayıcı Bildirimleri)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-neutral-200 p-4 max-h-[550px] overflow-y-auto pr-1 space-y-2.5">
                    {filteredSmsLogs.length === 0 ? (
                      <div className="p-8 text-center text-xs text-neutral-400">Kriterlere uygun SMS günlüğü bulunamadı.</div>
                    ) : (
                      filteredSmsLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-neutral-50 rounded-xl border space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
                            <div className="flex items-center space-x-2">
                              <span className={`font-bold px-1.5 py-0.5 rounded border ${log.recipient_type === 'USER' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-purple-50 text-purple-800 border-purple-200'}`}>{log.recipient_type}</span>
                              <span className="font-semibold text-neutral-900">{log.recipient_phone}</span>
                              <span className="px-2 py-0.5 bg-neutral-200/80 text-neutral-700 rounded font-mono font-bold flex items-center space-x-1"><Clock size={11} /><span>{new Date(log.created_at).toLocaleString('tr-TR')}</span></span>
                            </div>
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">{log.sent_status}</span>
                          </div>
                          <p className="text-xs font-mono bg-white p-2 rounded border leading-relaxed text-neutral-800">{log.message_body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 4.4 TEST SENARYOLARI */}
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

              {/* 4.5 PROJE / YOL HARİTASI */}
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
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 bg-neutral-100 text-neutral-700">{feat.status}</span>
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
          )
        )}

        {/* 5. WoZ SAĞLAYICI ATAMA FİLTRELİ POPUP MODAL */}
        {wozAssignModalReq && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-neutral-200 shadow-xl space-y-4 max-h-[90vh] flex flex-col justify-between">
              
              <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      #REQ-{wozAssignModalReq.id}
                    </span>
                    <h3 className="font-bold text-sm text-neutral-950">Sağlayıcı Ata & Eşleştir</h3>
                  </div>
                  <p className="text-xs text-neutral-600 font-medium mt-1">"{wozAssignModalReq.raw_text}"</p>
                  <p className="text-[11px] text-neutral-400 font-mono">Müşteri: {wozAssignModalReq.contact_value} • Konum: {wozAssignModalReq.location || 'Kadıköy'}</p>
                </div>
                <button onClick={() => setWozAssignModalReq(null)} className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition"><X size={18} /></button>
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-neutral-400" />
                <input type="text" autoFocus value={wozProviderSearch} onChange={(e) => setWozProviderSearch(e.target.value)} placeholder="Firma adı, telefon veya hizmet ara..." className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl border border-neutral-200 outline-none bg-neutral-50 focus:border-neutral-950 focus:bg-white transition font-medium" />
                {wozProviderSearch && <button onClick={() => setWozProviderSearch('')} className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700"><X size={14} /></button>}
              </div>

              <div className="overflow-y-auto space-y-2 max-h-[350px] pr-1 flex-1">
                {filteredWozProviders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400 font-mono">Arama kriterinize uygun sağlayıcı bulunamadı.</div>
                ) : (
                  filteredWozProviders.map((prov) => (
                    <div key={prov.id} className="p-3 bg-neutral-50 hover:bg-neutral-100/80 rounded-xl border border-neutral-200 flex items-center justify-between gap-3 text-xs transition group">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-neutral-900 truncate">{prov.name}</h4>
                          <span className="text-[9px] font-mono bg-neutral-200 px-1.5 py-0.2 rounded font-bold text-neutral-700">Skor: {prov.priority_score}</span>
                        </div>
                        <p className="text-[11px] text-blue-700 font-mono font-semibold">📞 {prov.phone}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(prov.service_keywords || []).slice(0, 4).map((kw, i) => (<span key={i} className="text-[9px] font-mono px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-neutral-600">{kw}</span>))}
                          {(prov.service_keywords || []).length > 4 && (<span className="text-[9px] font-mono text-neutral-400">+{(prov.service_keywords || []).length - 4}</span>)}
                        </div>
                      </div>
                      <button onClick={() => handleAdminAssign(wozAssignModalReq.id, prov.id)} className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shrink-0 shadow-xs flex items-center space-x-1 transition">
                        <Check size={12} /><span>Ata</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-[11px] text-neutral-400 font-mono">
                <span>{filteredWozProviders.length} Sağlayıcı Listelendi</span>
                <button type="button" onClick={() => setWozAssignModalReq(null)} className="px-3 py-1.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-semibold">Vazgeç</button>
              </div>

            </div>
          </div>
        )}

        {/* 6. ADMIN SAĞLAYICI DÜZENLEME / EKLEME MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-5 border space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b">
                <h3 className="font-bold text-sm text-neutral-950">{editingProviderId ? 'Sağlayıcıyı Düzenle' : 'Yeni Sağlayıcı Tanımla'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700"><X size={16} /></button>
              </div>

              <form onSubmit={handleAdminSaveProvider} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Firma Adı *</label>
                    <input type="text" required value={modalFormData.name} onChange={(e) => setModalFormData({ ...modalFormData, name: e.target.value })} className="w-full p-2 text-xs rounded-lg border outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Telefon *</label>
                    <input type="tel" required value={modalFormData.phone} onChange={(e) => setModalFormData({ ...modalFormData, phone: e.target.value })} className="w-full p-2 text-xs font-mono rounded-lg border outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">E-posta</label>
                    <input type="email" value={modalFormData.email} onChange={(e) => setModalFormData({ ...modalFormData, email: e.target.value })} placeholder="info@firma.com" className="w-full p-2 text-xs rounded-lg border outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Öncelik Skoru</label>
                    <input type="number" value={modalFormData.priorityScore} onChange={(e) => setModalFormData({ ...modalFormData, priorityScore: e.target.value })} className="w-full p-2 text-xs font-mono rounded-lg border outline-none" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-mono uppercase font-semibold text-neutral-500 flex items-center space-x-1">
                      <Tag size={12} className="text-neutral-700" /><span>Anahtar Kelimeler (Virgülle Ayırın) *</span>
                    </label>
                    <div className="flex items-center space-x-2 text-[10px] font-mono font-bold">
                      <span className={modalKwMetrics.wordCount > MAX_KEYWORD_COUNT ? 'text-rose-600' : 'text-neutral-500'}>{modalKwMetrics.wordCount} / {MAX_KEYWORD_COUNT} Kelime</span><span className="text-neutral-300">•</span>
                      <span className={modalKwMetrics.charCount > MAX_KEYWORD_CHARS ? 'text-rose-600' : 'text-neutral-500'}>{modalKwMetrics.charCount} / {MAX_KEYWORD_CHARS} Karakter</span>
                    </div>
                  </div>
                  <textarea rows={3} required maxLength={MAX_KEYWORD_CHARS} value={modalFormData.serviceKeywords} onChange={(e) => setModalFormData({ ...modalFormData, serviceKeywords: e.target.value })} placeholder="su, damacana, kadıköy, erikli, tesisat..." className="w-full p-2 text-xs font-mono rounded-lg border outline-none focus:border-neutral-950 resize-none bg-neutral-50" />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-3.5 py-1.5 border rounded-lg text-xs font-semibold text-neutral-700">Vazgeç</button>
                  <button type="submit" disabled={modalKwMetrics.wordCount > MAX_KEYWORD_COUNT || modalKwMetrics.charCount > MAX_KEYWORD_CHARS} className="px-4 py-1.5 bg-neutral-950 hover:bg-neutral-800 disabled:bg-neutral-300 text-white rounded-lg text-xs font-semibold shadow-sm">Kaydet</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* 🇨🇭 FOOTER */}
      <footer className="border-t border-neutral-200/80 bg-white py-4">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-1 text-xs text-neutral-400 font-mono">
          <div><span>Mobool</span> • <span>Multi-Tenant Servis Platformu</span></div>
          <div><span>İTÜ Bilişim Enstitüsü © 2026</span></div>
        </div>
      </footer>
    </div>
  );
}