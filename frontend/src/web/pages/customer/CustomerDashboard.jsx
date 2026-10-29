import React, { useState, useEffect, useRef, useMemo, Component } from 'react';
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
  FileText, Bell, Folder, CheckCircle2, MessageSquarePlus, Copy, RefreshCw, FolderPlus,
  DollarSign, AlignLeft
} from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { 
  safeArray, safeString, safeLower, safeUpper, extractAddress, extractGPS, 
  extractCode, isCodeHiddenReq, cleanContact, extractPhoneForWa, safeDateTime, calculateRemainingTime 
} from '../../../core/utils/helpers';
import { UniversalMapController, SharedMapClickHandler } from '../../components/maps/MapComponents';
import CustomListsManager from '../../components/common/CustomListsManager';

class SafeDashboardBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('CustomerDashboard Render Hatası:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-xl mx-auto my-12 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-base text-rose-800">
            <AlertTriangle size={20} />
            <span>Arayüz Yüklenirken Bir Hata Oluştu</span>
          </div>
          <p className="text-xs font-mono bg-white p-3 rounded-lg border border-rose-100 overflow-x-auto text-rose-700">
            {String(this.state.error?.message || this.state.error)}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-rose-900 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-rose-950 transition"
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const fetcher = (url) => axios.get(url).then(res => res.data);

function CustomerDashboardContent() {
  const { session, API_BASE } = useAuth();
  
  const { data: rawSettings } = useSWR(`${API_BASE}/settings`, fetcher, { refreshInterval: 60000 });
  const systemSettings = rawSettings?.settings || { 
    pool_lifespan_hours: 72, 
    customer_selection_timeout_mins: 60, 
    provider_completion_timeout_hours: 48, 
    customer_approval_timeout_hours: 24 
  };

  const mapIcons = useMemo(() => ({
    custom: new L.DivIcon({ 
      html: `<div style="margin-top: -32px; margin-left: -16px; filter: drop-shadow(0px 4px 2px rgba(0,0,0,0.3));"><svg width="32" height="32" viewBox="0 0 24 24" fill="#171717" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg></div>`, 
      className: '', 
      iconSize: [0, 0], 
      iconAnchor: [0, 0] 
    })
  }), []);

  const [step, setStep] = useState('INPUT');
  const [queryText, setQueryText] = useState('');
  const [disambiguationData, setDisambiguationData] = useState(null);
  
  const [requestType, setRequestType] = useState('TALEP');
  const [activeTab, setActiveTab] = useState('REQUESTS'); 
  
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

  const [userLists, setUserLists] = useState([]);
  
  const [successMessage, setSuccessMessage] = useState('');
  const [successTags, setSuccessTags] = useState([]);

  useEffect(() => {
    if (session?.phone) {
      axios.get(`${API_BASE}/lists/CUSTOMER/${encodeURIComponent(session.phone)}`)
        .then(res => { if(res?.data?.lists) setUserLists(res.data.lists); })
        .catch(() => {});
    }
  }, [API_BASE, session?.phone]);

  useEffect(() => { localStorage.setItem('sc_company_code', companyCode); }, [companyCode]);
  useEffect(() => { localStorage.setItem('sc_is_code_hidden', isCodeHidden); }, [isCodeHidden]);

  const defaultPosition = useMemo(() => ({ lat: 41.0082, lng: 28.9784 }), []);
  const [mapPosition, setMapPosition] = useState(defaultPosition);
  const [mapSearchText, setMapSearchText] = useState('');
  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [actionFeedbackMap, setActionFeedbackMap] = useState({});
  const [reviewFlowMap, setReviewFlowMap] = useState({});

  const [selectedListIds, setSelectedListIds] = useState({});

  const showActionFeedback = (key, type, text) => {
    setActionFeedbackMap(prev => ({ ...(prev || {}), [key]: { type, text } }));
    setTimeout(() => {
      setActionFeedbackMap(prev => ({ ...(prev || {}), [key]: null }));
    }, 3500);
  };
  
  const [isActiveCustomerRequestsOpen, setIsActiveCustomerRequestsOpen] = useState(true);
  const [isPendingReviewsOpen, setIsPendingReviewsOpen] = useState(true);
  const [isCustomerHistoryOpen, setIsCustomerHistoryOpen] = useState(false);
  
  const [searchCustomerHistoryText, setSearchCustomerHistoryText] = useState(''); 
  const [expandedCustomerQueueReqId, setExpandedCustomerQueueReqId] = useState(null);
  const [expandedProviderReviewId, setExpandedProviderReviewId] = useState(null); 

  const [reviewRatingsMap, setReviewRatingsMap] = useState({});
  const [reviewCommentMap, setReviewCommentMap] = useState({});
  
  const [reviewedRequestsMap, setReviewedRequestsMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sc_reviewed_requests') || '{}'); } catch { return {}; }
  });

  const emailInputRef = useRef(null);
  const mapSearchInputRef = useRef(null);

  const customerPhoneQuery = session?.phone ? `phone=${encodeURIComponent(session.phone)}` : null;
  
  const { data: customerRequestsRes, mutate: mutateCustomerReqs } = useSWR(
     customerPhoneQuery ? `${API_BASE}/requests/my-requests?${customerPhoneQuery}` : null, 
     fetcher, 
     { refreshInterval: 3000 }
  );
  
  const myCustomerRequests = useMemo(() => safeArray(customerRequestsRes?.requests), [customerRequestsRes]);

  const populateFormWithPastRequest = (pastReq) => {
    if (!pastReq) return;
    const actionKey = `copy_${pastReq.id}`;
    setActionLoadingKey(actionKey);

    setQueryText(pastReq.raw_text || '');
    if (pastReq.request_type) setRequestType(pastReq.request_type);

    if (pastReq.deadline_datetime && pastReq.created_at) {
      try {
        const oldCreated = new Date(pastReq.created_at).getTime();
        const oldDeadline = new Date(pastReq.deadline_datetime).getTime();
        const diffMs = oldDeadline - oldCreated;

        if (diffMs > 0 && !isNaN(diffMs)) {
          const newTargetDateObj = new Date(Date.now() + diffMs);
          const yyyy = newTargetDateObj.getFullYear();
          const mm = String(newTargetDateObj.getMonth() + 1).padStart(2, '0');
          const dd = String(newTargetDateObj.getDate()).padStart(2, '0');
          const hours = String(newTargetDateObj.getHours()).padStart(2, '0');
          const mins = String(newTargetDateObj.getMinutes()).padStart(2, '0');

          setDeadlineDate(`${yyyy}-${mm}-${dd}`);
          setDeadlineTime(`${hours}:${mins}`);
        }
      } catch (e) {
        setDeadlineDate('');
        setDeadlineTime('23:59');
      }
    } else {
      setDeadlineDate('');
      setDeadlineTime('23:59');
    }

    if (pastReq.location) {
      const extractedAddr = extractAddress(pastReq.location);
      if (extractedAddr) setLocationValue(extractedAddr);

      const coords = extractGPS(pastReq.location);
      if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        setMapPosition({ lat: coords[0], lng: coords[1] });
        setCoordinates(`${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`);
      }

      const code = extractCode(pastReq.location);
      if (code) {
        setCompanyCode(code);
        setIsCodeHidden(isCodeHiddenReq(pastReq.location));
      }
    }

    setIsUrgent(Boolean(pastReq.is_urgent));

    if (pastReq.preferred_channel) {
      const channels = pastReq.preferred_channel
        .split(',')
        .map(c => c.trim().toUpperCase())
        .filter(c => ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'].includes(c));
      if (channels.length > 0) {
        setPreferredChannels(channels);
      }
    }

    setActiveTab('REQUESTS');
    setStep('INPUT');
    setIsDetailsCollapsed(false);
    showActionFeedback(actionKey, 'success', 'Aktarıldı');
    setActionLoadingKey(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDirectReorderAction = async (origReq) => {
    if (!origReq) return;
    const targetProviderId = origReq.matched_provider_id || origReq.provider_id;
    if (!targetProviderId) return;

    const actionKey = `reorder_${origReq.id}`;
    setActionLoadingKey(actionKey);

    try {
      let finalBudget = origReq.matched_budget || origReq.provider_budget || 0;
      let newTargetDate = null;

      if (origReq.matched_target_date && origReq.created_at) {
        const oldCreated = new Date(origReq.created_at).getTime();
        const oldTarget = new Date(origReq.matched_target_date).getTime();
        const diffMs = oldTarget - oldCreated; 
        if (diffMs > 0 && !isNaN(diffMs)) {
          newTargetDate = new Date(Date.now() + diffMs).toISOString();
        }
      }
      if (!newTargetDate) {
        newTargetDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      }

      const payload = {
        rawText: origReq.raw_text,
        contactValue: origReq.contact_value || session?.phone,
        preferredChannel: origReq.preferred_channel || 'PHONE, SMS, WHATSAPP',
        location: origReq.location || 'İstanbul, Türkiye',
        isUrgent: origReq.is_urgent || false,
        requestType: origReq.request_type || 'TALEP',
        targetProviderId: targetProviderId,
        suggestedBudget: finalBudget,
        suggestedTargetDate: newTargetDate,
        suggestedDescription: 'Tekrarlanan Sipariş',
        oldRequestId: origReq.id
      };

      await axios.post(`${API_BASE}/requests/direct-reorder`, payload);
      mutateCustomerReqs(); 
      showActionFeedback(actionKey, 'success', 'Tekrarlandı');
    } catch (err) {
      showActionFeedback(actionKey, 'error', 'Hata oluştu');
    } finally {
      setActionLoadingKey(null);
    }
  };

  const applyFallbackLocation = (pastRequests) => {
    const validReq = safeArray(pastRequests).find(r => r?.location && !r.location.includes('Bilinmiyor') && !r.location.includes('Belirtilmedi'));
    if (validReq) {
      setLocationValue(extractAddress(validReq.location) || 'İstanbul, Türkiye');
      const coords = extractGPS(validReq.location);
      if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        setMapPosition({ lat: coords[0], lng: coords[1] });
        setCoordinates(`${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`);
      } else {
        setMapPosition(defaultPosition);
        setCoordinates('41.008200, 28.978400');
      }
    } else {
      setLocationValue('İstanbul, Türkiye');
      setMapPosition(defaultPosition);
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
          if (!isNaN(