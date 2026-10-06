import TimeoutTracker from './TimeoutTracker';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import useSWR from 'swr'; 
import { 
  Download, Upload, Layers, FileCheck2, FolderKanban, Settings, 
  Plus, Search, Trash2, Clock, ExternalLink, ArrowUp, ArrowDown, 
  ArrowUpDown, X, ChevronUp, ChevronDown, Loader2, Timer,
  FileText, Bell, Filter, Activity, Briefcase, Tag, Star, Check
} from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { safeArray, safeString, safeLower, getKeywordMetrics, extractAddress, cleanContact, safeDateTime, safeDate } from '../../../core/utils/helpers';

import ProviderDashboardAkanTalep from './ProviderDashboard_AkanTalep';
import TrackerDashboardAkanTalep from './TrackerDashboard_AkanTalep';

const MAX_KEYWORD_CHARS = 1000;
const MAX_KEYWORD_COUNT = 50;

const fetcher = (url) => axios.get(url).then(res => res.data);

const SortableHeader = React.memo(({ label, sortKey, align = "left", sortConfig, handleRequestSort }) => {
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
});

// ZAMAN AŞIMI (TIMEOUT) CANLI SAYACI EKLENMİŞ SATIR BİLEŞENİ
const MatchedRequestRow = React.memo(({ req, onDelete, localSettings }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimeout, setIsTimeout] = useState(req.status === 'TIMEOUT');

  useEffect(() => {
    if (req.status === 'TIMEOUT' || req.status === 'TAMAMLANDI' || req.status === 'İPTAL') {
      setIsTimeout(req.status === 'TIMEOUT');
      return;
    }

    let timeoutMins = 15; 
    if (localSettings) {
      if (req.status === 'WAITING') {
        timeoutMins = localSettings.pool_lifespan_hours * 60; 
      } else if (req.status === 'MATCHED') {
        timeoutMins = localSettings.customer_selection_timeout_mins; 
      }
    }

    const startTime = req.created_at ? new Date(req.created_at).getTime() : Date.now();
    const expireTimeMs = startTime + (timeoutMins * 60 * 1000);

    const calculateTime = () => {
      const now = Date.now();
      const diff = expireTimeMs - now;
      if (diff <= 0) {
        setTimeLeft(0);
        setIsTimeout(true);
        return false; 
      } else {
        setTimeLeft(diff);
        return true; 
      }
    };

    if (!calculateTime()) return;

    const timer = setInterval(() => {
      if (!calculateTime()) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [req.created_at, req.status, localSettings]);

  const formatTime = (ms) => {
    if (ms <= 0) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    if (h > 0) return `${h} sa ${m} dk ${s} sn`;
    return `${m}:${s}`;
  };

  const displayStatus = isTimeout ? 'TIMEOUT' : req.status;

  return (
    <tr className="hover:bg-neutral-50 transition">
      <td className="px-4 py-3 font-mono text-neutral-900">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-bold">#REQ-{req.id}</span>
          {req.request_type === 'BILDIRIM' ? (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-800 border border-amber-200" title="Bildirim"><Bell size={10} /> BİLDİRİM</span>
          ) : (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-100 text-blue-800 border border-blue-200" title="Talep"><FileText size={10} /> TALEP</span>
          )}
        </div>
        {req.created_at && <div className="text-[10px] text-neutral-400">{safeDateTime(req.created_at)}</div>}
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${displayStatus === 'TIMEOUT' ? 'bg-rose-100 text-rose-800' : 'bg-neutral-200 text-neutral-800'}`}>
          {displayStatus}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-[11px] font-bold">
        {isTimeout ? (
           <span className="text-rose-600">00:00</span>
        ) : (
           <span className="text-amber-600 flex items-center space-x-1">
             <Clock size={10} className="animate-pulse" />
             <span>{formatTime(timeLeft)}</span>
           </span>
        )}
      </td>
      <td className="px-4 py-3 font-semibold text-neutral-900">
        <div>"{req.raw_text}"</div>
        {Array.isArray(req.tags) && req.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {req.tags.map((t, idx) => (
              <span key={idx} className="px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px] font-mono font-bold flex items-center gap-0.5">
                <Tag size={9} className="text-blue-500" />
                #{String(t).replace('#', '')}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3 font-mono text-neutral-800">{cleanContact(req.contact_value)}</td>
      <td className="px-4 py-3">{req.provider_name ? <span className="font-bold text-neutral-900">{req.provider_name}</span> : <span className="text-neutral-400 italic text-[11px]">Atanmadı</span>}</td>
      <td className="px-4 py-3 text-neutral-700">{extractAddress(req.location)}</td>
      <td className="px-4 py-3 text-right">
        <button onClick={() => onDelete(req.id)} className="p-1.5 text-neutral-400 hover:text-rose-600 rounded"><Trash2 size={14} /></button>
      </td>
    </tr>
  );
});

// ⭐ YENİ: ÇOKLU SEÇMELİ TAG DROPDOWN İÇEREN WOZ KARTI ⭐
const WozCard = React.memo(({ req, onAssign, onAddTag, onRemoveTag, availableTags }) => {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const [loadingId, setLoadingId] = useState(null);

  // Gelen tag'leri temizle (başındaki # işaretlerini atalım ki kıyaslaması kolay olsun)
  const reqTags = safeArray(req.tags).map(t => String(t).replace('#', ''));

  // Tag Ekle & Çıkar (Toggle Mantığı)
  const handleToggleTag = async (tagStr) => {
    setLoadingId(tagStr);
    if (reqTags.includes(tagStr)) {
      await onRemoveTag(req.id, tagStr);
    } else {
      await onAddTag(req.id, tagStr);
    }
    setLoadingId(null);
  };

  // Yeni Tag Ekle
  const handleAddNew = async () => {
    if (!newTagText.trim()) return;
    setLoadingId('NEW');
    await onAddTag(req.id, newTagText.trim());
    setNewTagText('');
    setLoadingId(null);
  };

  return (
    <div className="p-4 bg-neutral-50 rounded-xl border flex flex-col sm:flex-row justify-between gap-4 text-xs transition hover:border-neutral-300">
      <div className="space-y-1.5 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-neutral-400 font-bold">#REQ-{req.id}</span>
          {req.request_type === 'BILDIRIM' ? (
            <span className="text-[9px] font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-amber-700 flex items-center gap-1"><Bell size={10} /> BİLDİRİM</span>
          ) : (
            <span className="text-[9px] font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-blue-700 flex items-center gap-1"><FileText size={10} /> TALEP</span>
          )}
          {req.created_at && <span className="text-[10px] font-mono text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><Clock size={10} /> {safeDateTime(req.created_at)}</span>}
          {req.is_urgent && <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold border border-rose-200 text-[10px]">ACİL</span>}
        </div>
        <p className="font-semibold text-neutral-950 text-sm mt-1">"{req.raw_text}"</p>
        
        {/* Talepteki Çerçeveli Etiketleri Göster */}
        {reqTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {reqTags.map((t, idx) => (
              <span key={idx} className="group px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-md text-[9px] font-mono font-bold flex items-center gap-1 shadow-2xs transition-colors hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200">
                <Tag size={9} className="text-blue-500 group-hover:text-rose-500 transition-colors" />
                #{t}
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemoveTag(req.id, t); }} 
                  className="p-0.5 ml-0.5 hover:bg-rose-200/50 rounded-full transition-colors opacity-50 group-hover:opacity-100 cursor-pointer"
                  title="Etiketi Sil"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        
        <span className="text-[11px] text-neutral-500 block pt-1">👤 {cleanContact(req.contact_value)} | 📍 {extractAddress(req.location)}</span>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center mt-3 sm:mt-0 relative">
        {/* Çoklu Seçmeli Açılır Liste (Dropdown) */}
        <div className="relative">
          <button 
            onClick={() => setIsAddingTag(!isAddingTag)} 
            className="px-3 py-2 bg-white border border-neutral-200 text-neutral-700 hover:text-blue-700 hover:border-blue-300 rounded-xl text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Tag size={13} />
            <span>Tag Ekle</span>
            <ChevronDown size={13} className={`transition-transform ${isAddingTag ? 'rotate-180' : ''}`} />
          </button>

          {isAddingTag && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 p-2 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {safeArray(availableTags).map(t => {
                  const tagStr = String(t.tag_name).replace('#', '');
                  const isSelected = reqTags.includes(tagStr);
                  return (
                    <label key={t.id} className="flex items-center gap-2 p-2 hover:bg-blue-50/50 rounded-lg cursor-pointer text-[11px] font-bold text-neutral-700 transition">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleToggleTag(tagStr)}
                        className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                        disabled={loadingId === tagStr}
                      />
                      <span className="flex-1">#{tagStr}</span>
                      {loadingId === tagStr && <Loader2 size={10} className="animate-spin text-blue-500" />}
                    </label>
                  );
                })}
                {safeArray(availableTags).length === 0 && <div className="text-[10px] text-neutral-400 p-1">Sistemde kayıtlı etiket yok.</div>}
              </div>
              
              <div className="border-t border-neutral-100 pt-2 flex items-center gap-1.5">
                <input 
                  type="text" 
                  value={newTagText} 
                  onChange={(e) => setNewTagText(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNew()}
                  placeholder="Yeni etiket yaz & ekle..." 
                  className="w-full p-1.5 text-[11px] font-bold rounded border border-neutral-200 outline-none focus:border-neutral-900 bg-neutral-50"
                />
                <button disabled={loadingId === 'NEW' || !newTagText.trim()} onClick={handleAddNew} className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer disabled:opacity-50 transition shadow-xs">
                  {loadingId === 'NEW' ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                </button>
              </div>
            </div>
          )}
        </div>

        <button onClick={() => onAssign(req)} className="px-3.5 py-2 bg-neutral-950 text-white rounded-xl text-xs font-semibold shadow-sm transition hover:bg-neutral-800 shrink-0 cursor-pointer">Sağlayıcı Seç & Ata</button>
      </div>
    </div>
  );
});

const ProviderCard = React.memo(({ prov, onEdit, onDelete, onConnect }) => (
  <div className="p-3.5 bg-neutral-50 rounded-xl border shadow-xs">
    <h3 className="font-bold text-neutral-900">{prov.name}</h3>
    <p className="text-[11px] text-blue-700 font-mono mt-0.5">📞 {prov.phone}</p>
    <div className="mt-2 pt-2 border-t flex items-center justify-between">
      <div className="flex space-x-2">
        <button onClick={() => onEdit(prov)} className="text-neutral-600 hover:text-neutral-900 text-xs font-semibold transition">Düzenle</button>
        <button onClick={() => onDelete(prov.id)} className="text-rose-600 hover:text-rose-800 text-xs font-semibold transition">Sil</button>
      </div>
      <button onClick={() => onConnect(prov.phone)} className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center space-x-1 transition" title="Bu sağlayıcı olarak giriş yap">
        <ExternalLink size={12} /><span>Bağlan</span>
      </button>
    </div>
  </div>
));

const SmsLogCard = React.memo(({ log }) => (
  <div className="p-3 bg-neutral-50 rounded-xl border space-y-1">
    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono">
      <span className="font-semibold text-neutral-900">{log.recipient_phone}</span>
      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">{log.sent_status}</span>
    </div>
    <p className="text-xs font-mono bg-white p-2 rounded border leading-relaxed text-neutral-800">{log.message_body}</p>
  </div>
));

export default function AdminDashboard() {
  const { API_BASE } = useAuth();
  const [adminTab, setAdminTab] = useState('WOZ'); 
  
  const { data: rawPendingRequests, mutate: mutatePending } = useSWR(`${API_BASE}/requests/pending`, fetcher, { refreshInterval: adminTab === 'WOZ' ? 5000 : 0 });
  const { data: rawProviders, mutate: mutateProviders } = useSWR(`${API_BASE}/providers`, fetcher, { refreshInterval: adminTab === 'PROVIDERS' ? 30000 : 0 });
  const { data: rawMatchedRequests, mutate: mutateMatched } = useSWR(`${API_BASE}/requests/matched`, fetcher, { refreshInterval: adminTab === 'ALL_MATCHED' ? 5000 : 0 });
  const { data: rawSmsLogs, mutate: mutateSms } = useSWR(`${API_BASE}/notifications`, fetcher, { refreshInterval: adminTab === 'SMS_LOGS' ? 5000 : 0 });
  const { data: rawSettings, mutate: mutateSettings } = useSWR(`${API_BASE}/settings`, fetcher, { refreshInterval: adminTab === 'SETTINGS' ? 60000 : 0 });
  const { data: rawFeatures, mutate: mutateFeatures } = useSWR(`${API_BASE}/features`, fetcher);
  const { data: rawTests, mutate: mutateTests } = useSWR(`${API_BASE}/tests`, fetcher);
  
  // ⭐ TAGS HER ZAMAN ÇEKİLMELİ Kİ WOZ KARTINDAKİ DROPDOWN DOLU GELSİN ⭐
  const { data: rawTags, mutate: mutateTags } = useSWR(`${API_BASE}/tags`, fetcher);

  const pendingRequests = safeArray(rawPendingRequests?.requests);
  const providers = safeArray(rawProviders?.providers);
  const matchedRequests = safeArray(rawMatchedRequests?.requests);
  const smsLogs = safeArray(rawSmsLogs?.notifications);
  const features = safeArray(rawFeatures?.features);
  const tests = safeArray(rawTests?.tests);
  const tags = safeArray(rawTags?.tags);
  
  const [localSettings, setLocalSettings] = useState({
    pool_lifespan_hours: 72,
    customer_selection_timeout_mins: 60,
    provider_completion_timeout_hours: 48,
    customer_approval_timeout_hours: 24
  });

  useEffect(() => {
    if (rawSettings?.settings) {
      setLocalSettings(prev => ({ ...prev, ...rawSettings.settings }));
    }
  }, [rawSettings]);

  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
  const [wozAssignModalReq, setWozAssignModalReq] = useState(null);
  const [wozProviderSearch, setWozProviderSearch] = useState('');
  const [searchProviderText, setSearchProviderText] = useState('');
  
  const [searchMatchText, setSearchMatchText] = useState('');
  const [matchStatusFilter, setMatchStatusFilter] = useState('ALL');
  
  const [searchProjectText, setSearchProjectText] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState('ALL');

  const [searchSmsText, setSearchSmsText] = useState('');
  const [smsRecipientFilter, setSmsRecipientFilter] = useState('ALL');
  
  const [searchTagText, setSearchTagText] = useState('');
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTagId, setEditingTagId] = useState(null);
  const [tagFormData, setTagFormData] = useState({ tag_name: '', keywords: '', is_active: true });

  const [expandedFeatureId, setExpandedFeatureId] = useState(null);
  const [newFeature, setNewFeature] = useState({ title: '', description: '', targetDate: new Date().toISOString().split('T')[0], status: 'BEKLİYOR', priority: 'ORTA' });
  const [expandedTestId, setExpandedTestId] = useState(null);
  const [newTest, setNewTest] = useState({ title: '', description: '', testerName: 'İTÜ Test Ekibi', testDate: new Date().toISOString().split('T')[0], status: 'BEKLİYOR' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState(null);
  const [modalFormData, setModalFormData] = useState({ name: '', phone: '', email: '', serviceKeywords: '', communicationChannels: ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'], priorityScore: 100 });

  const mutateAllData = async () => {
    await Promise.all([mutatePending(), mutateProviders(), mutateMatched(), mutateSms(), mutateFeatures(), mutateTests(), mutateSettings(), mutateTags()]);
  };

  const handleEditTagClick = useCallback((tagItem) => {
    setEditingTagId(tagItem.id);
    setTagFormData({
      tag_name: tagItem.tag_name || '',
      keywords: safeArray(tagItem.keywords).join(', '),
      is_active: tagItem.is_active ?? true
    });
    setIsTagModalOpen(true);
  }, []);

  const handleAdminDeleteTag = useCallback(async (id) => {
    if (!window.confirm('Bu etiketi sistemden tamamen silmek istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API_BASE}/tags/${id}`);
      await mutateTags();
      alert("Etiket başarıyla silindi.");
    } catch (err) {
      alert("Silme işlemi başarısız oldu.");
    }
  }, [API_BASE, mutateTags]);

  const handleAdminSaveTag = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!tagFormData.tag_name?.trim()) {
      alert("Lütfen bir etiket adı girin.");
      return;
    }
    const keywordsArray = safeString(tagFormData.keywords).split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    
    const payload = {
      tag_name: tagFormData.tag_name.trim(),
      keywords: keywordsArray,
      is_active: Boolean(tagFormData.is_active)
    };

    try {
      if (editingTagId) {
        await axios.put(`${API_BASE}/tags/${editingTagId}`, payload);
      } else {
        await axios.post(`${API_BASE}/tags`, payload);
      }
      setIsTagModalOpen(false);
      await mutateTags();
      alert("Etiket başarıyla kaydedildi!");
    } catch (err) {
      alert(err.response?.data?.message || "Etiket kaydedilemedi.");
    }
  };

  const filteredTags = useMemo(() => safeArray(tags).filter(t => {
    if (!t) return false;
    const q = safeLower(searchTagText).trim();
    if (!q) return true;
    return safeLower(t.tag_name).includes(q) || safeArray(t.keywords).some(k => safeLower(k).includes(q));
  }), [tags, searchTagText]);


  const handleDeleteRequest = useCallback(async (requestId) => { 
    if (!window.confirm('Bu talebi silmek istediğinize emin misiniz?')) return; 
    try { await axios.delete(`${API_BASE}/requests/${Number(requestId)}`); await mutateMatched(); } catch {} 
  }, [API_BASE, mutateMatched]);

  const handleEditProviderClick = useCallback((prov) => {
    setEditingProviderId(prov.id); 
    setModalFormData({ 
      name: prov.name, phone: prov.phone, email: prov.email || '', 
      serviceKeywords: safeArray(prov.service_keywords).join(', '), 
      communicationChannels: safeArray(prov.communication_channels).length ? prov.communication_channels : ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'], 
      priorityScore: prov.priority_score || 100 
    }); 
    setIsModalOpen(true);
  }, []);

  const handleAdminDeleteProvider = useCallback(async (id) => { 
    if (!window.confirm('Sağlayıcıyı silmek istediğinize emin misiniz?')) return; 
    try { await axios.delete(`${API_BASE}/providers/${id}`); await mutateProviders(); alert("Sağlayıcı başarıyla silindi."); } 
    catch (err) { alert("Silme işlemi başarısız oldu."); } 
  }, [API_BASE, mutateProviders]);

  const handleOpenProviderDirectSession = useCallback((provPhone) => {
    if (!provPhone) return;
    const cleanPhone = encodeURIComponent(safeString(provPhone).trim());
    const directUrl = `${window.location.origin}${window.location.pathname}?role=PROVIDER&phone=${cleanPhone}`;
    window.open(directUrl, '_blank');
  }, []);

  const handleWozAssignClick = useCallback((req) => {
    setWozAssignModalReq(req); setWozProviderSearch('');
  }, []);

  // Tag Ekle (Woz)
  const handleAddTagToWozRequest = useCallback(async (requestId, newTag) => {
    try {
      await axios.post(`${API_BASE}/requests/${requestId}/tags`, { tag: newTag });
      await mutatePending();
    } catch (err) {
      alert(err.response?.data?.message || 'Tag eklenirken hata oluştu.');
    }
  }, [API_BASE, mutatePending]);

  // Tag Çıkar (Woz)
  const handleRemoveTagFromWozRequest = useCallback(async (requestId, tagToRemove) => {
    try {
      await axios.delete(`${API_BASE}/requests/${requestId}/tags/${encodeURIComponent(tagToRemove)}`);
      await mutatePending();
    } catch (err) {
      alert(err.response?.data?.message || 'Tag silinirken hata oluştu.');
    }
  }, [API_BASE, mutatePending]);

  const handleRequestSort = useCallback((key) => { 
    setSortConfig(prevConfig => {
      let direction = 'asc'; 
      if (prevConfig.key === key && prevConfig.direction === 'asc') direction = 'desc'; 
      return { key, direction };
    });
  }, []);

  const handleCreateTest = async (e) => { e.preventDefault(); if (!newTest.title.trim()) return; try { await axios.post(`${API_BASE}/tests`, newTest); setNewTest({ title: '', description: '', testerName: 'İTÜ Test Ekibi', testDate: new Date().toISOString().split('T')[0], status: 'BEKLİYOR' }); await mutateTests(); } catch (err) {} };
  const handleUpdateTest = async (id, updatedFields) => { try { await axios.put(`${API_BASE}/tests/${id}`, updatedFields); await mutateTests(); } catch (err) {} };
  const handleDeleteTest = async (id) => { if (!window.confirm('Emin misiniz?')) return; try { await axios.delete(`${API_BASE}/tests/${id}`); await mutateTests(); } catch {} };
  
  const handleCreateFeature = async (e) => { e.preventDefault(); if (!newFeature.title.trim()) return; try { await axios.post(`${API_BASE}/features`, newFeature); setNewFeature({ title: '', description: '', targetDate: new Date().toISOString().split('T')[0], status: 'BEKLİYOR', priority: 'ORTA' }); await mutateFeatures(); } catch (err) {} };
  const handleUpdateFeature = async (id, updatedFields) => { try { await axios.put(`${API_BASE}/features/${id}`, updatedFields); await mutateFeatures(); } catch (err) {} };
  const handleDeleteFeature = async (id) => { if (!window.confirm('Bu projeyi/özelliği silmek istediğinize emin misiniz?')) return; try { await axios.delete(`${API_BASE}/features/${id}`); await mutateFeatures(); } catch (err) { alert("Silme işlemi başarısız oldu."); } };

  const handleAdminAssign = async (requestId, providerId) => { if (!providerId) return; try { await axios.post(`${API_BASE}/requests/assign`, { requestId: parseInt(requestId, 10), providerId: parseInt(providerId, 10) }); setWozAssignModalReq(null); await mutatePending(); await mutateMatched(); } catch {} };
  
  const handleAdminSaveProvider = async (e) => { 
    if (e && e.preventDefault) e.preventDefault(); 
    if (!modalFormData.name?.trim() || !modalFormData.phone?.trim() || !modalFormData.serviceKeywords?.trim()) { alert("Lütfen Firma Adı, Telefon ve Anahtar Kelimeler alanlarını eksiksiz doldurun."); return; }
    const keywordsArray = safeString(modalFormData.serviceKeywords).split(',').map(k => k.trim().toLowerCase()).filter(Boolean); 
    const payload = { name: modalFormData.name.trim(), phone: modalFormData.phone.trim(), email: modalFormData.email ? modalFormData.email.trim() : null, serviceKeywords: keywordsArray.slice(0, MAX_KEYWORD_COUNT), communicationChannels: safeArray(modalFormData.communicationChannels).length ? modalFormData.communicationChannels : ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'], priorityScore: parseInt(modalFormData.priorityScore, 10) || 100 }; 
    try { 
      if (editingProviderId) { await axios.put(`${API_BASE}/providers/${editingProviderId}`, payload); } 
      else { await axios.post(`${API_BASE}/providers`, payload); }
      setIsModalOpen(false); await mutateProviders(); alert("Sağlayıcı başarıyla kaydedildi!");
    } catch (err) { alert(err.response?.data?.message || "Sağlayıcı kaydedilemedi. Telefon numarası zaten mevcut olabilir."); } 
  };
  
  const handleSaveSystemSetting = async (key, value) => { 
    try { 
      await axios.put(`${API_BASE}/settings`, { key, value }); 
      await mutateSettings(); 
      alert('Sistem parametresi başarıyla güncellendi!'); 
    } catch (err) { 
      alert('Hata oluştu.'); 
    } 
  };
  
  const filteredProviders = useMemo(() => safeArray(providers).filter(p => { if(!p) return false; const q = safeLower(searchProviderText).trim(); if (!q) return true; return safeLower(p.name).includes(q) || safeLower(p.phone).includes(q) || safeArray(p.service_keywords).some(k => safeLower(k).includes(q)); }), [providers, searchProviderText]);
  
  const filteredMatchedRequests = useMemo(() => safeArray(matchedRequests).filter(r => { 
    if(!r) return false; 
    const q = safeLower(searchMatchText).trim(); 
    const statusMatch = matchStatusFilter === 'ALL' || r.status === matchStatusFilter; 
    if (!statusMatch) return false; 
    if (!q) return true; 
    return safeLower(r.raw_text).includes(q) || safeLower(r.contact_value).includes(q) || safeLower(r.provider_name).includes(q) || safeLower(r.provider_phone).includes(q) || String(r.id).includes(q); 
  }), [matchedRequests, searchMatchText, matchStatusFilter]);
  
  const filteredFeatures = useMemo(() => safeArray(features).filter(feat => {
    if (!feat) return false;
    const q = safeLower(searchProjectText).trim();
    const statusMatch = projectStatusFilter === 'ALL' || feat.status === projectStatusFilter;
    if (!statusMatch) return false;
    if (!q) return true; 
    return safeLower(feat.title).includes(q) || safeLower(feat.description).includes(q);
  }), [features, searchProjectText, projectStatusFilter]);

  const sortedMatchedRequests = useMemo(() => { 
    let sortableItems = [...filteredMatchedRequests]; 
    if (sortConfig !== null) { 
      sortableItems.sort((a, b) => { 
        let valA = a[sortConfig.key]; let valB = b[sortConfig.key]; 
        if (sortConfig.key === 'queue') { valA = safeArray(a.queueList).length; valB = safeArray(b.queueList).length; } 
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

  const sortedWozRequests = useMemo(() => { 
    return [...safeArray(pendingRequests)].sort((a, b) => {
      const dateA = new Date(a?.created_at || 0).getTime();
      const dateB = new Date(b?.created_at || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b?.id || 0) - (a?.id || 0);
    });
  }, [pendingRequests]);
  
  const filteredSmsLogs = useMemo(() => safeArray(smsLogs).filter(log => { if(!log) return false; const q = safeLower(searchSmsText).trim(); const recipientMatch = smsRecipientFilter === 'ALL' || log.recipient_type === smsRecipientFilter; if (!recipientMatch) return false; if (!q) return true; return safeLower(log.recipient_phone).includes(q) || safeLower(log.message_body).includes(q); }), [smsLogs, searchSmsText, smsRecipientFilter]);
  const filteredWozProviders = useMemo(() => safeArray(providers).filter(p => { if(!p) return false; const q = safeLower(wozProviderSearch).trim(); if (!q) return true; return safeLower(p.name).includes(q) || safeLower(p.phone).includes(q) || safeArray(p.service_keywords).some(k => safeLower(k).includes(q)); }), [providers, wozProviderSearch]);

  const modalKwMetrics = getKeywordMetrics(modalFormData.serviceKeywords);

  const handleExportExcel = () => {
    let exportData = [];
    let sheetName = "Veriler";
    if (adminTab === 'WOZ') { exportData = pendingRequests; sheetName = "WoZ_Havuzu"; }
    else if (adminTab === 'PROVIDERS') { exportData = providers; sheetName = "Saglayicilar"; }
    else if (adminTab === 'ALL_MATCHED') { exportData = matchedRequests; sheetName = "Eslesmeler"; }
    else if (adminTab === 'SMS_LOGS') { exportData = smsLogs; sheetName = "SMS_Loglari"; }
    else if (adminTab === 'TESTS') { exportData = tests; sheetName = "Test_Senaryolari"; }
    else if (adminTab === 'PROJECT') { exportData = features; sheetName = "Proje_Yol_Haritasi"; }
    else if (adminTab === 'TAGS') { exportData = tags; sheetName = "Etiketler"; }
    if (!exportData || exportData.length === 0) { alert(`Şu an "${sheetName}" sekmesinde indirilecek herhangi bir veri bulunamadı!`); return; }
    try {
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, `Admin_${sheetName}_${new Date().getTime()}.xlsx`);
    } catch (error) { alert("Excel dosyası oluşturulurken bir hata oluştu."); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    alert("Excel dosyası alındı. Veriler okunuyor ve kaydediliyor...");
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const importedData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        if (!importedData || importedData.length === 0) { alert("Excel dosyası boş veya formatı hatalı."); return; }
        try {
          if (adminTab === 'PROVIDERS') {
            for (const item of importedData) {
              await axios.post(`${API_BASE}/providers`, {
                name: item.NAME || item.name || item.isim || 'İsimsiz Firma', phone: String(item.PHONE || item.phone || item.telefon || ''), email: item.EMAIL || item.email || item.eposta || null, serviceKeywords: String(item.SERVICEKEYWORDS || item.serviceKeywords || item.anahtarkelime || '').split(','), communicationChannels: ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'], priorityScore: parseInt(item.PRIORITYSCORE || item.priorityScore || 100, 10)
              });
            }
          } else if (adminTab === 'TESTS') {
            for (const item of importedData) { await axios.post(`${API_BASE}/tests`, { title: item.TITLE || item.title || 'Yeni Test', description: item.DESCRIPTION || item.description || '', testerName: item.TESTERNAME || item.testerName || 'Sistem', testDate: new Date().toISOString().split('T')[0], status: 'BEKLİYOR' }); }
          } else if (adminTab === 'PROJECT') {
            for (const item of importedData) { await axios.post(`${API_BASE}/features`, { title: item.TITLE || item.title || 'Yeni Özellik', description: item.DESCRIPTION || item.description || '', targetDate: new Date().toISOString().split('T')[0], status: item.STATUS || item.status || 'BEKLİYOR', priority: item.PRIORITY || item.priority || 'ORTA' }); }
          } else if (adminTab === 'TAGS') {
            for (const item of importedData) {
              await axios.post(`${API_BASE}/tags`, {
                tag_name: item.TAG_NAME || item.tag_name || item.etiket || 'Yeni Etiket',
                keywords: String(item.KEYWORDS || item.keywords || '').split(','),
                is_active: true
              });
            }
          } else { alert("Bu sekme için Excel'den içe aktarma işlemi desteklenmiyor."); return; }
          await mutateAllData();
          alert("İşlem Başarılı! Veriler veritabanına kaydedildi.");
        } catch (dbError) { alert("Veriler okundu ancak kaydedilirken hata oluştu. Lütfen formatı kontrol edin."); }
      } catch (error) { alert("Dosya okunamadı. Lütfen formatını kontrol edin."); } finally { e.target.value = null; }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="w-full max-w-[100%] mx-auto px-6 py-8 flex-1 flex flex-col justify-start space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <h2 className="text-2xl font-bold text-neutral-950">Sistem Yönetim Paneli</h2>
        
        {/* Üst Sekmeler / Menü Çubuğu */}
        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-100 p-1.5 rounded-xl border text-xs font-semibold">
          <button onClick={() => setAdminTab('WOZ')} className={`px-3 py-1.5 rounded-lg transition ${adminTab === 'WOZ' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>WoZ Havuzu ({pendingRequests.length})</button>
          <button onClick={() => setAdminTab('PROVIDERS')} className={`px-3 py-1.5 rounded-lg transition ${adminTab === 'PROVIDERS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>Sağlayıcılar ({filteredProviders.length}/{providers.length})</button>
          
          <button onClick={() => setAdminTab('TAGS')} className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${adminTab === 'TAGS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
            <Tag size={14} /><span>Etiketler</span>
          </button>

          <button onClick={() => setAdminTab('ALL_MATCHED')} className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 transition ${adminTab === 'ALL_MATCHED' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}><Layers size={14} /><span>Tüm Eşleşmeler</span></button>
          
          <button onClick={() => setAdminTab('TIMEOUT_TRACKER')} className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${adminTab === 'TIMEOUT_TRACKER' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}><Timer size={14} /><span>Timeout Takibi</span></button>
          
          <button onClick={() => setAdminTab('SMS_LOGS')} className={`px-3 py-1.5 rounded-lg transition ${adminTab === 'SMS_LOGS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>İşlem Log ({filteredSmsLogs.length})</button>
          <button onClick={() => setAdminTab('TESTS')} className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${adminTab === 'TESTS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}><FileCheck2 size={14} /><span>Test Senaryolar ({tests.length})</span></button>
          <button onClick={() => setAdminTab('PROJECT')} className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${adminTab === 'PROJECT' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}><FolderKanban size={14} /><span>Proje ({features.length})</span></button>
          <button onClick={() => setAdminTab('SETTINGS')} className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${adminTab === 'SETTINGS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}><Settings size={14} /><span>Ayarlar</span></button>

          <div className="h-4 w-px bg-neutral-300 mx-0.5"></div>
          
          <button 
            type="button"
            onClick={() => setAdminTab('LIVE_TRACKER')} 
            className={`px-3 py-1.5 rounded-lg border transition flex items-center space-x-1 font-bold cursor-pointer shadow-xs ${
              adminTab === 'LIVE_TRACKER' 
                ? 'bg-indigo-600 text-white border-indigo-700' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <Activity size={14} />
            <span>Canlı Takip</span>
          </button>

          <button 
            type="button"
            onClick={() => setAdminTab('PROVIDER_SIMULATION')} 
            className={`px-3 py-1.5 rounded-lg border transition flex items-center space-x-1 font-bold cursor-pointer shadow-xs ${
              adminTab === 'PROVIDER_SIMULATION' 
                ? 'bg-purple-600 text-white border-purple-700' 
                : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
            }`}
          >
            <Briefcase size={14} />
            <span>Sağlayıcı Simülasyon</span>
          </button>
        </div>
      </div>

      {adminTab !== 'LIVE_TRACKER' && adminTab !== 'PROVIDER_SIMULATION' && (
        <div className="w-full flex items-center justify-between gap-4 py-3 px-5 mb-2 bg-neutral-50 border border-neutral-200 rounded-xl shadow-sm">
          <div className="flex items-center space-x-2 text-neutral-500 text-sm font-medium">
            <span>Şu anki görünüm:</span>
            <span className="font-bold text-neutral-900 bg-white px-2 py-1 rounded border shadow-xs">{adminTab}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExportExcel} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm flex items-center space-x-2 transition cursor-pointer">
              <Download size={18} />
              <span>Seçili Sekmeyi İndir</span>
            </button>
            <label className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-sm flex items-center space-x-2 transition cursor-pointer">
              <Upload size={18} />
              <span>Excel'den Yükle</span>
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} onClick={(e) => { e.target.value = null; }} />
            </label>
          </div>
        </div>
      )}

      {adminTab === 'PROVIDER_SIMULATION' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm">
          <ProviderDashboardAkanTalep />
        </div>
      )}

      {adminTab === 'LIVE_TRACKER' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm min-h-[650px] relative">
          <TrackerDashboardAkanTalep />
        </div>
      )}

      {adminTab === 'TAGS' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-2xl">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="text" 
                value={searchTagText} 
                onChange={(e) => setSearchTagText(e.target.value)} 
                placeholder="Etiket adı veya anahtar kelime ara..." 
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-neutral-200 focus:border-neutral-900 outline-none transition" 
              />
            </div>
            <button 
              type="button" 
              onClick={() => { setEditingTagId(null); setTagFormData({ tag_name: '', keywords: '', is_active: true }); setIsTagModalOpen(true); }} 
              className="px-4 py-2 bg-neutral-950 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-sm hover:bg-neutral-800 transition cursor-pointer"
            >
              <Plus size={14} /><span>Yeni Etiket</span>
            </button>
          </div>
          
          <div className="max-h-[550px] overflow-y-auto">
            {!rawTags && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-neutral-400" size={20} /></div>}
            <table className="w-full text-left text-xs table-auto">
              <thead className="bg-neutral-50 text-[10px] font-mono uppercase text-neutral-500 sticky top-0 z-10 shadow-sm border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Etiket Adı</th>
                  <th className="px-4 py-3 font-semibold">Durum</th>
                  <th className="px-4 py-3 font-semibold">Eşleşme Kelimeleri (Keywords)</th>
                  <th className="px-4 py-3 font-semibold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredTags.length === 0 && rawTags ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-neutral-400 text-xs">Aradığınız kriterde etiket bulunamadı.</td>
                  </tr>
                ) : (
                  filteredTags.map((tItem) => (
                    <tr key={tItem.id} className="hover:bg-neutral-50 transition group">
                      <td className="px-4 py-3 font-mono text-[10px] text-neutral-400 font-bold">
                        #{tItem.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                          <Tag size={12} className="text-blue-500" />
                          <span>#{String(tItem.tag_name).replace('#', '')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${tItem.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-neutral-100 text-neutral-500 border-neutral-200'}`}>
                          {tItem.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {safeArray(tItem.keywords).map((kw, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-[9px] text-neutral-600 font-medium">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleEditTagClick(tItem)} className="p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 border border-transparent hover:border-neutral-200 rounded transition cursor-pointer" title="Düzenle">
                            <Settings size={14} />
                          </button>
                          <button onClick={() => handleAdminDeleteTag(tItem.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded transition cursor-pointer" title="Sil">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adminTab === 'WOZ' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button type="button" onClick={() => { setEditingProviderId(null); setModalFormData({ name: '', phone: '', email: '', serviceKeywords: '', communicationChannels: ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'], priorityScore: 100 }); setIsModalOpen(true); }} className="px-3.5 py-1.5 bg-neutral-950 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-sm transition hover:bg-neutral-800">
              <Plus size={13} /><span>Yeni Sağlayıcı Ekle</span>
            </button>
          </div>
          <div className="bg-white rounded-2xl border p-4 max-h-[550px] overflow-y-auto space-y-3 relative">
            {!rawPendingRequests && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-neutral-400" size={20} /></div>}
            {sortedWozRequests.length === 0 && rawPendingRequests ? (
               <div className="text-center text-xs text-neutral-400 py-6">Havuzda bekleyen talep yok.</div>
            ) : (
              sortedWozRequests.map((req) => (
                <WozCard 
                  key={req.id} 
                  req={req} 
                  onAssign={handleWozAssignClick} 
                  onAddTag={handleAddTagToWozRequest} 
                  onRemoveTag={handleRemoveTagFromWozRequest} 
                  availableTags={tags} 
                />
              ))
            )}
          </div>
        </div>
      )}

      {adminTab === 'TIMEOUT_TRACKER' && (
        <TimeoutTracker />
      )}

      {adminTab === 'PROVIDERS' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-2xl">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="text" 
                value={searchProviderText} 
                onChange={(e) => setSearchProviderText(e.target.value)} 
                onDoubleClick={() => setSearchProviderText('')} 
                placeholder="Firma adı, telefon veya anahtar kelime ara..." 
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-neutral-200 focus:border-neutral-900 outline-none transition" 
              />
            </div>
            <button 
              type="button" 
              onClick={() => { setEditingProviderId(null); setModalFormData({ name: '', phone: '', email: '', serviceKeywords: '', communicationChannels: ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'], priorityScore: 100 }); setIsModalOpen(true); }} 
              className="px-4 py-2 bg-neutral-950 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-sm hover:bg-neutral-800 transition cursor-pointer"
            >
              <Plus size={14} /><span>Yeni Sağlayıcı Ekle</span>
            </button>
          </div>
          
          <div className="max-h-[550px] overflow-y-auto">
            {!rawProviders && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-neutral-400" size={20} /></div>}
            <table className="w-full text-left text-xs table-auto">
              <thead className="bg-neutral-50 text-[10px] font-mono uppercase text-neutral-500 sticky top-0 z-10 shadow-sm border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">Firma Adı</th>
                  <th className="px-4 py-3 font-semibold">İletişim</th>
                  <th className="px-4 py-3 font-semibold text-center">Puan / Skor</th>
                  <th className="px-4 py-3 font-semibold">Anahtar Kelimeler</th>
                  <th className="px-4 py-3 font-semibold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProviders.length === 0 && rawProviders ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-neutral-400 text-xs">Aradığınız kriterde sağlayıcı bulunamadı.</td>
                  </tr>
                ) : (
                  filteredProviders.map((prov) => (
                    <tr key={prov.id} className="hover:bg-neutral-50 transition group">
                      <td className="px-4 py-3">
                        <div className="font-bold text-neutral-900">{prov.name}</div>
                        <div className="text-[9px] text-neutral-400 font-mono mt-0.5">ID: {prov.id}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-neutral-600">
                        <div>📞 {prov.phone}</div>
                        {prov.email && <div className="text-[10px] mt-0.5 font-sans">✉️ {prov.email}</div>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <Star size={10} fill="#f59e0b" className="text-amber-500" /> {prov.avg_rating ? Number(parseFloat(prov.avg_rating).toFixed(1)) : '5.0'}
                          </span>
                          <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            Skor: {prov.priority_score || 100}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {safeArray(prov.service_keywords).slice(0, 3).map((kw, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-[9px] text-neutral-600 font-medium">
                              {kw}
                            </span>
                          ))}
                          {safeArray(prov.service_keywords).length > 3 && (
                            <span className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-[9px] text-neutral-500 font-medium cursor-help" title={safeArray(prov.service_keywords).slice(3).join(', ')}>
                              +{safeArray(prov.service_keywords).length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleOpenProviderDirectSession(prov.phone)} className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded transition cursor-pointer" title="Bağlan">
                            <ExternalLink size={14} />
                          </button>
                          <button onClick={() => handleEditProviderClick(prov)} className="p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 border border-transparent hover:border-neutral-200 rounded transition cursor-pointer" title="Düzenle">
                            <Settings size={14} />
                          </button>
                          <button onClick={() => handleAdminDeleteProvider(prov.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded transition cursor-pointer" title="Sil">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adminTab === 'ALL_MATCHED' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col">
          <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-2xl">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="text" 
                placeholder="Talep ID, İçerik, Sağlayıcı veya Konum ara..." 
                value={searchMatchText}
                onChange={(e) => setSearchMatchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-neutral-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-none transition"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-neutral-500" />
              <select 
                value={matchStatusFilter}
                onChange={(e) => setMatchStatusFilter(e.target.value)}
                className="p-2 text-sm rounded-lg border border-neutral-200 bg-white focus:border-neutral-900 outline-none cursor-pointer font-medium text-neutral-700"
              >
                <option value="ALL">Tüm Durumlar</option>
                <option value="POOL">Havuzda (POOL)</option>
                <option value="MATCHED">Eşleşti (MATCHED)</option>
                <option value="ACCEPTED">Kabul Edildi (ACCEPTED)</option>
                <option value="PROVIDER_COMPLETED">Teslim Edildi (PROVIDER_COMPLETED)</option>
                <option value="COMPLETED">Tamamlandı (COMPLETED)</option>
                <option value="CANCELLED">İptal Edilenler (CANCELLED)</option>
              </select>
            </div>
          </div>

          <div className="max-h-[550px] overflow-y-auto">
            {!rawMatchedRequests && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-neutral-400" size={20} /></div>}
            <table className="w-full text-left text-xs table-auto">
              <thead className="bg-neutral-50 text-[10px] font-mono uppercase text-neutral-500 sticky top-0 z-10 shadow-sm border-b">
                <tr>
                  <SortableHeader label="ID / Tarih" sortKey="id" sortConfig={sortConfig} handleRequestSort={handleRequestSort} />
                  <SortableHeader label="Durum" sortKey="status" sortConfig={sortConfig} handleRequestSort={handleRequestSort} />
                  <th className="px-4 py-3 font-semibold border-b border-neutral-200 text-left">Zaman Aşımı</th>
                  <SortableHeader label="Talep Metni" sortKey="raw_text" sortConfig={sortConfig} handleRequestSort={handleRequestSort} />
                  <SortableHeader label="Müşteri" sortKey="contact_value" sortConfig={sortConfig} handleRequestSort={handleRequestSort} />
                  <SortableHeader label="Sağlayıcı" sortKey="provider_name" sortConfig={sortConfig} handleRequestSort={handleRequestSort} />
                  <SortableHeader label="Konum" sortKey="location" sortConfig={sortConfig} handleRequestSort={handleRequestSort} />
                  <th className="px-4 py-3 font-semibold border-b border-neutral-200 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sortedMatchedRequests.map((req) => (
                  <MatchedRequestRow 
                    key={req.id} 
                    req={req} 
                    onDelete={handleDeleteRequest} 
                    localSettings={localSettings} 
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {adminTab === 'SMS_LOGS' && (
        <div className="bg-white rounded-2xl border border-neutral-200 p-4 max-h-[550px] overflow-y-auto space-y-2.5">
          {!rawSmsLogs && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-neutral-400" size={20} /></div>}
          {filteredSmsLogs.map((log) => (
            <SmsLogCard key={log.id} log={log} />
          ))}
        </div>
      )}

      {adminTab === 'TESTS' && (
        <div className="space-y-4">
          <form onSubmit={handleCreateTest} className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between"><h3 className="text-xs font-mono uppercase font-bold text-neutral-700 flex items-center space-x-1.5"><Plus size={14} className="text-neutral-950" /><span>Yeni Test Senaryosu Ekle</span></h3><span className="text-[11px] font-mono text-neutral-400">Default: Bekliyor</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5"><div className="sm:col-span-5"><input type="text" required value={newTest.title} onChange={(e) => setNewTest({ ...newTest, title: e.target.value })} placeholder="Test Başlığı..." className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950" /></div><div className="sm:col-span-3"><input type="text" value={newTest.testerName} onChange={(e) => setNewTest({ ...newTest, testerName: e.target.value })} placeholder="Test Eden Kişi" className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950" /></div><div className="sm:col-span-2"><input type="date" value={newTest.testDate} onChange={(e) => setNewTest({ ...newTest, testDate: e.target.value })} className="w-full p-2 text-xs font-mono rounded-lg border outline-none focus:border-neutral-950" /></div><div className="sm:col-span-2"><button type="submit" className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 shadow-sm"><Plus size={13} /><span>Ekle</span></button></div></div>
            <div><textarea rows={2} value={newTest.description} onChange={(e) => setNewTest({ ...newTest, description: e.target.value })} placeholder="Test adımları ve beklenen sonuç açıklaması..." className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950 resize-none bg-neutral-50" /></div>
          </form>
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 max-h-[550px] overflow-y-auto space-y-2.5 pr-1">
            {!rawTests && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-neutral-400" size={20} /></div>}
            {tests.length === 0 && rawTests ? (<div className="p-8 text-center text-xs text-neutral-400">Henüz kayıtlı bir test senaryosu bulunmuyor.</div>) : (
              tests.map((testItem) => {
                const isExpanded = expandedTestId === testItem.id;
                return (
                  <div key={testItem.id} className="bg-[#FAFBFD] rounded-xl border border-neutral-200 overflow-hidden transition">
                    <div onClick={() => setExpandedTestId(isExpanded ? null : testItem.id)} className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-neutral-100/60 select-none text-xs"><div className="flex items-center space-x-3 flex-1 min-w-0 pr-2"><span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${testItem.status === 'BAŞARILI' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : testItem.status === 'BAŞARISIZ' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>{testItem.status}</span><p className="font-semibold text-neutral-900 truncate">{testItem.title}</p></div><div className="flex items-center space-x-3 text-neutral-400 shrink-0"><span className="font-mono text-[11px] hidden sm:inline">👤 {testItem.tester_name || 'Tester'}</span><span className="font-mono text-[11px] flex items-center space-x-1 hidden sm:inline-flex"><Clock size={12} /><span>{safeDate(testItem.test_date)}</span></span>{isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</div></div>
                    {isExpanded && (
                      <div className="p-4 pt-2 border-t border-neutral-200/80 bg-white space-y-3">
                        <div><label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Açıklama / Test Adımları</label><p className="text-xs text-neutral-700 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/70 font-mono leading-relaxed">{testItem.description || 'Açıklama belirtilmemiş.'}</p></div>
                        <div><label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Test Sonucu & Notlar</label><textarea rows={2} defaultValue={testItem.result_notes || ''} onBlur={(e) => handleUpdateTest(testItem.id, { resultNotes: e.target.value })} placeholder="Test sonucu, hata logu veya gözlemlerinizi yazın..." className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950 resize-none bg-neutral-50" /></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                          <div><label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Test Durumu</label><select value={testItem.status} onChange={(e) => handleUpdateTest(testItem.id, { status: e.target.value })} className="w-full p-2 rounded-lg border outline-none bg-neutral-50 font-semibold text-xs"><option value="BEKLİYOR">⏳ Bekliyor</option><option value="BAŞARILI">✅ Başarılı (Passed)</option><option value="BAŞARISIZ">❌ Başarısız (Failed)</option></select></div>
                          <div><label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Test Eden</label><input type="text" defaultValue={testItem.tester_name || ''} onBlur={(e) => handleUpdateTest(testItem.id, { testerName: e.target.value })} className="w-full p-2 rounded-lg border outline-none bg-neutral-50 text-xs" /></div>
                          <div><label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Test Tarihi</label><input type="date" defaultValue={(testItem.test_date || '').split('T')[0] || ''} onChange={(e) => handleUpdateTest(testItem.id, { testDate: e.target.value })} className="w-full p-2 rounded-lg border outline-none bg-neutral-50 font-mono text-xs" /></div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[11px] text-neutral-400"><span className="font-mono">Senaryo ID: #{testItem.id}</span><button onClick={() => handleDeleteTest(testItem.id)} className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center space-x-1 font-semibold transition"><Trash2 size={12} /><span>Senaryoyu Sil</span></button></div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {adminTab === 'PROJECT' && (
        <div className="space-y-4">
          <form onSubmit={handleCreateFeature} className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between"><h3 className="text-xs font-mono uppercase font-bold text-neutral-700 flex items-center space-x-1.5"><Plus size={14} className="text-neutral-950" /><span>Yeni Özellik / Geliştirme Fikri Ekle</span></h3><span className="text-[11px] font-mono text-neutral-400">Default: Bekliyor / Orta</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-5"><input type="text" required value={newFeature.title} onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })} placeholder="Özellik Başlığı..." className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950" /></div>
              <div className="sm:col-span-3"><input type="date" value={newFeature.targetDate} onChange={(e) => setNewFeature({ ...newFeature, targetDate: e.target.value })} className="w-full p-2 text-xs font-mono rounded-lg border outline-none focus:border-neutral-950" /></div>
              <div className="sm:col-span-2">
                <select value={newFeature.priority} onChange={(e) => setNewFeature({ ...newFeature, priority: e.target.value })} className="w-full p-2 text-xs rounded-lg border outline-none bg-neutral-50 font-medium">
                  <option value="DÜŞÜK">Düşük</option>
                  <option value="ORTA">Orta</option>
                  <option value="YÜKSEK">Yüksek</option>
                  <option value="KRİTİK">Kritik</option>
                </select>
              </div>
              <div className="sm:col-span-2"><button type="submit" className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1"><Plus size={13} /><span>Ekle</span></button></div>
            </div>
          </form>

          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Özellik / Proje ara..." 
                  value={searchProjectText}
                  onChange={(e) => setSearchProjectText(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-neutral-200 focus:border-neutral-900 outline-none transition"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-neutral-500" />
                <select 
                  value={projectStatusFilter}
                  onChange={(e) => setProjectStatusFilter(e.target.value)}
                  className="p-2 text-sm rounded-lg border border-neutral-200 bg-white focus:border-neutral-900 outline-none cursor-pointer font-medium text-neutral-700"
                >
                  <option value="ALL">Tüm Durumlar</option>
                  <option value="BEKLİYOR">Bekleyenler</option>
                  <option value="DEVAM EDİYOR">Devam Edenler</option>
                  <option value="TAMAMLANDI">Tamamlananlar</option>
                  <option value="İPTAL">İptal Edilenler</option>
                </select>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {!rawFeatures && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-neutral-400" size={20} /></div>}
              {filteredFeatures.length === 0 && rawFeatures ? (
                <div className="p-8 text-center text-xs text-neutral-400">Aradığınız kriterde proje/özellik bulunamadı.</div>
              ) : (
                <table className="w-full text-left text-xs table-auto">
                  <thead className="bg-neutral-50 text-[10px] font-mono uppercase text-neutral-500 sticky top-0 z-10 shadow-sm border-b">
                    <tr>
                      <th className="px-4 py-3 font-semibold">ID</th>
                      <th className="px-4 py-3 font-semibold">Özellik Başlığı</th>
                      <th className="px-4 py-3 font-semibold">Durum</th>
                      <th className="px-4 py-3 font-semibold">Öncelik</th>
                      <th className="px-4 py-3 font-semibold">Hedef Tarih</th>
                      <th className="px-4 py-3 font-semibold text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredFeatures.map((feat) => {
                      const isExpanded = expandedFeatureId === feat.id;
                      return (
                        <React.Fragment key={feat.id}>
                          <tr className={`hover:bg-blue-50/20 transition group ${isExpanded ? 'bg-blue-50/20' : ''}`}>
                            <td className="px-4 py-3 font-mono text-[10px] text-neutral-400 font-bold">#{feat.id}</td>
                            <td className="px-4 py-3 font-semibold text-neutral-900 w-1/3">{feat.title}</td>
                            
                            <td className="px-4 py-3">
                              <select 
                                value={feat.status} 
                                onChange={(e) => handleUpdateFeature(feat.id, { status: e.target.value })} 
                                className={`px-2 py-1.5 rounded-md text-[10px] font-bold border outline-none cursor-pointer ${feat.status === 'TAMAMLANDI' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : feat.status === 'İPTAL' ? 'bg-neutral-100 text-neutral-500 border-neutral-200' : 'bg-white text-neutral-700 border-neutral-200 shadow-sm'}`}
                              >
                                <option value="BEKLİYOR">Bekliyor</option>
                                <option value="DEVAM EDİYOR">Devam Ediyor</option>
                                <option value="TAMAMLANDI">Tamamlandı</option>
                                <option value="İPTAL">İptal</option>
                              </select>
                            </td>

                            <td className="px-4 py-3">
                              <select 
                                value={feat.priority} 
                                onChange={(e) => handleUpdateFeature(feat.id, { priority: e.target.value })} 
                                className={`px-2 py-1.5 rounded-md text-[10px] font-bold border outline-none cursor-pointer ${feat.priority === 'KRİTİK' ? 'bg-rose-50 text-rose-700 border-rose-200' : feat.priority === 'YÜKSEK' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-neutral-700 border-neutral-200 shadow-sm'}`}
                              >
                                <option value="DÜŞÜK">Düşük</option>
                                <option value="ORTA">Orta</option>
                                <option value="YÜKSEK">Yüksek</option>
                                <option value="KRİTİK">Kritik</option>
                              </select>
                            </td>

                            <td className="px-4 py-3">
                              <input 
                                type="date" 
                                defaultValue={(feat.target_date || '').split('T')[0]} 
                                onChange={(e) => handleUpdateFeature(feat.id, { targetDate: e.target.value })} 
                                className="px-2 py-1.5 bg-transparent border border-transparent hover:border-neutral-200 focus:border-neutral-900 rounded font-mono text-neutral-600 outline-none cursor-pointer transition" 
                              />
                            </td>

                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={() => setExpandedFeatureId(isExpanded ? null : feat.id)} 
                                  className={`p-1.5 rounded transition border shadow-xs ${isExpanded ? 'bg-neutral-100 border-neutral-300 text-neutral-900' : 'bg-white border-neutral-200 text-neutral-400 hover:text-neutral-900'}`}
                                  title="Açıklamayı Düzenle"
                                >
                                  {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                </button>
                                <button 
                                  onClick={() => handleDeleteFeature(feat.id)} 
                                  className="p-1.5 bg-white border border-rose-100 text-rose-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 shadow-xs rounded transition"
                                  title="Projeyi Sil"
                                >
                                  <Trash2 size={14}/>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-neutral-50/50">
                              <td colSpan="6" className="px-4 py-3 border-t border-neutral-100">
                                <div className="pl-6 border-l-2 border-blue-300">
                                   <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-400 mb-1">Özellik Açıklaması</label>
                                   <textarea 
                                     rows={3} 
                                     defaultValue={feat.description || ''} 
                                     onBlur={(e) => handleUpdateFeature(feat.id, { description: e.target.value })} 
                                     placeholder="Detaylı açıklama veya notlar ekleyin..." 
                                     className="w-full p-2.5 text-xs rounded-lg border border-neutral-200 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 resize-none bg-white shadow-inner transition" 
                                   />
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {adminTab === 'SETTINGS' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="text-neutral-700" size={18} />
              <h3 className="font-bold text-neutral-950">İş Akışı Zaman Aşımı (Timeout) Parametreleri</h3>
            </div>
            <div className="overflow-x-auto w-full border rounded-xl">
              <table className="w-full text-left text-xs table-auto">
                <thead className="bg-neutral-50 text-[10px] font-mono uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 w-1/4">Parametre Adı</th>
                    <th className="px-4 py-3 w-2/4">Açıklama / Senaryo</th>
                    <th className="px-4 py-3 w-32 text-center">Değer</th>
                    <th className="px-4 py-3 w-24 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  <tr className="hover:bg-neutral-50 transition">
                    <td className="px-4 py-3 font-bold text-neutral-900">Havuz Yaşam Süresi <span className="text-[9px] text-neutral-400 block font-mono">pool_lifespan_hours</span></td>
                    <td className="px-4 py-3 text-neutral-600 leading-relaxed">Açık havuza düşen bir talep için hiçbir sağlayıcı sıraya girmezse, talep kaç <span className="font-bold">saat</span> sonra sistem tarafından otomatik iptal edilsin?</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <input type="number" min="1" value={localSettings.pool_lifespan_hours} onChange={(e) => setLocalSettings({...localSettings, pool_lifespan_hours: e.target.value})} className="w-16 p-1.5 text-xs font-mono font-bold text-center rounded border outline-none focus:border-neutral-950" />
                        <span className="text-[10px] text-neutral-400 font-bold">Saat</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right"><button onClick={() => handleSaveSystemSetting('pool_lifespan_hours', localSettings.pool_lifespan_hours)} className="px-3 py-1.5 bg-neutral-950 text-white rounded text-xs font-semibold hover:bg-neutral-800 transition">Kaydet</button></td>
                  </tr>

                  <tr className="hover:bg-neutral-50 transition">
                    <td className="px-4 py-3 font-bold text-neutral-900">Müşteri Seçim Süresi <span className="text-[9px] text-neutral-400 block font-mono">customer_selection_timeout_mins</span></td>
                    <td className="px-4 py-3 text-neutral-600 leading-relaxed">Sağlayıcılar sıraya girdikten sonra, müşteri kaç <span className="font-bold">dakika</span> içinde seçim yapmazsa işlem askıya alınsın?</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <input type="number" min="1" value={localSettings.customer_selection_timeout_mins} onChange={(e) => setLocalSettings({...localSettings, customer_selection_timeout_mins: e.target.value})} className="w-16 p-1.5 text-xs font-mono font-bold text-center rounded border outline-none focus:border-neutral-950" />
                        <span className="text-[10px] text-neutral-400 font-bold">Dk</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right"><button onClick={() => handleSaveSystemSetting('customer_selection_timeout_mins', localSettings.customer_selection_timeout_mins)} className="px-3 py-1.5 bg-neutral-950 text-white rounded text-xs font-semibold hover:bg-neutral-800 transition">Kaydet</button></td>
                  </tr>

                  <tr className="hover:bg-neutral-50 transition">
                    <td className="px-4 py-3 font-bold text-neutral-900">İş Teslimat Süresi <span className="text-[9px] text-neutral-400 block font-mono">provider_completion_timeout_hours</span></td>
                    <td className="px-4 py-3 text-neutral-600 leading-relaxed">Sağlayıcı işi onayladıktan sonra, işi fiilen teslim etmesi için tanınan maksimum <span className="font-bold">saat</span> limiti.</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <input type="number" min="1" value={localSettings.provider_completion_timeout_hours} onChange={(e) => setLocalSettings({...localSettings, provider_completion_timeout_hours: e.target.value})} className="w-16 p-1.5 text-xs font-mono font-bold text-center rounded border outline-none focus:border-neutral-950" />
                        <span className="text-[10px] text-neutral-400 font-bold">Saat</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right"><button onClick={() => handleSaveSystemSetting('provider_completion_timeout_hours', localSettings.provider_completion_timeout_hours)} className="px-3 py-1.5 bg-neutral-950 text-white rounded text-xs font-semibold hover:bg-neutral-800 transition">Kaydet</button></td>
                  </tr>

                  <tr className="hover:bg-neutral-50 transition">
                    <td className="px-4 py-3 font-bold text-neutral-900">Otomatik Onay Süresi <span className="text-[9px] text-neutral-400 block font-mono">customer_approval_timeout_hours</span></td>
                    <td className="px-4 py-3 text-neutral-600 leading-relaxed">Sağlayıcı işi teslim ettikten sonra, müşteri onay butonuna basmazsa sistemin süreci otomatik tamamlaması için bekleyeceği <span className="font-bold">saat</span>.</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <input type="number" min="1" value={localSettings.customer_approval_timeout_hours} onChange={(e) => setLocalSettings({...localSettings, customer_approval_timeout_hours: e.target.value})} className="w-16 p-1.5 text-xs font-mono font-bold text-center rounded border outline-none focus:border-neutral-950" />
                        <span className="text-[10px] text-neutral-400 font-bold">Saat</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right"><button onClick={() => handleSaveSystemSetting('customer_approval_timeout_hours', localSettings.customer_approval_timeout_hours)} className="px-3 py-1.5 bg-neutral-950 text-white rounded text-xs font-semibold hover:bg-neutral-800 transition">Kaydet</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODALLAR */}
      {wozAssignModalReq && (
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9000]">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 border shadow-xl flex flex-col justify-between">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100"><div><h3 className="font-bold text-sm text-neutral-950">Sağlayıcı Ata & Eşleştir</h3><p className="text-xs text-neutral-600 font-medium mt-1">"{wozAssignModalReq.raw_text}"</p></div><button onClick={() => setWozAssignModalReq(null)} className="p-1 text-neutral-400 hover:text-neutral-700 transition"><X size={18} /></button></div>
            <div className="mt-4 flex items-center gap-2"><div className="relative flex-1"><Search size={14} className="absolute left-3 top-2.5 text-neutral-400" /><input type="text" value={wozProviderSearch} onChange={(e) => setWozProviderSearch(e.target.value)} placeholder="Sağlayıcı ara..." className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none focus:border-neutral-950 bg-neutral-50" /></div><button onClick={() => { setEditingProviderId(null); setModalFormData({ name: '', phone: '', email: '', serviceKeywords: '', communicationChannels: ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'], priorityScore: 100 }); setIsModalOpen(true); }} className="px-3.5 py-1.5 bg-neutral-950 text-white text-xs font-semibold rounded-lg flex items-center space-x-1"><Plus size={13} /><span>Yeni Ekle</span></button></div>
            <div className="overflow-y-auto space-y-2 max-h-[350px] mt-3 pt-1 flex-1">
              {filteredWozProviders.length === 0 && <div className="text-center text-xs text-neutral-400 py-6">Eşleşen sağlayıcı bulunamadı.</div>}
              {filteredWozProviders.map((prov) => (
                <div key={prov.id} className="p-3 bg-neutral-50 rounded-xl border flex items-center justify-between text-xs transition hover:bg-blue-50/50"><div className="flex-1"><h4 className="font-bold text-neutral-900">{prov.name}</h4><p className="text-[11px] text-blue-700 font-mono mt-0.5">📞 {prov.phone}</p></div><button onClick={() => handleAdminAssign(wozAssignModalReq.id, prov.id)} className="px-4 py-1.5 bg-neutral-950 text-white rounded-lg text-xs font-semibold">Ata</button></div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100"><h3 className="font-bold text-sm text-neutral-950">{editingProviderId ? 'Sağlayıcıyı Düzenle' : 'Yeni Sağlayıcı Tanımla'}</h3><button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700"><X size={16} /></button></div>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Firma Adı *</label><input type="text" value={modalFormData.name} onChange={(e) => setModalFormData({ ...modalFormData, name: e.target.value })} className="w-full p-2.5 text-xs rounded-xl border outline-none focus:border-neutral-950" /></div><div><label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Telefon *</label><input type="tel" value={modalFormData.phone} onChange={(e) => setModalFormData({ ...modalFormData, phone: e.target.value })} className="w-full p-2.5 text-xs font-mono rounded-xl border outline-none focus:border-neutral-950" /></div></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">E-posta</label><input type="email" value={modalFormData.email} onChange={(e) => setModalFormData({ ...modalFormData, email: e.target.value })} className="w-full p-2.5 text-xs rounded-xl border outline-none focus:border-neutral-950" /></div><div><label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Öncelik Skoru</label><input type="number" value={modalFormData.priorityScore} onChange={(e) => setModalFormData({ ...modalFormData, priorityScore: e.target.value })} className="w-full p-2.5 text-xs font-mono rounded-xl border outline-none focus:border-neutral-950" /></div></div>
              <div><div className="flex items-center justify-between mb-1.5"><label className="text-[10px] font-mono uppercase font-semibold text-neutral-500">Anahtar Kelimeler *</label><span className={modalKwMetrics.wordCount > MAX_KEYWORD_COUNT ? 'text-rose-600' : 'text-neutral-500'}>{modalKwMetrics.wordCount} / {MAX_KEYWORD_COUNT} Kelime</span></div><textarea rows={3} maxLength={MAX_KEYWORD_CHARS} value={modalFormData.serviceKeywords} onChange={(e) => setModalFormData({ ...modalFormData, serviceKeywords: e.target.value })} placeholder="virgülle ayırarak yazın..." className="w-full p-2.5 text-xs font-mono rounded-xl border outline-none focus:border-neutral-950 resize-none bg-neutral-50" /></div>
              
              <div className="pt-2 border-t border-neutral-100">
                <label className="text-[10px] font-mono uppercase text-neutral-600 mb-1.5 font-bold block">
                  Uzmanlık Etiketleri (Tags)
                </label>
                <div className="flex flex-wrap gap-2">
                  {safeArray(tags).map(t => {
                    const tagStr = String(t.tag_name).replace('#', '');
                    const isSelected = safeArray(modalFormData.tags).includes(tagStr);
                    return (
                      <label 
                        key={t.id} 
                        className={`px-2 py-1 border rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1 ${isSelected ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs' : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'}`}
                      >
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={isSelected}
                          onChange={(e) => {
                            const newTags = e.target.checked 
                              ? [...safeArray(modalFormData.tags), tagStr] 
                              : safeArray(modalFormData.tags).filter(val => val !== tagStr);
                            setModalFormData({ ...modalFormData, tags: newTags });
                          }} 
                        />
                        {isSelected && <Tag size={10} className="text-blue-500" />}
                        {tagStr}
                      </label>
                    );
                  })}
                  {safeArray(tags).length === 0 && <span className="text-[10px] text-neutral-400">Sistemde kayıtlı etiket yok.</span>}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-neutral-100"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50">Vazgeç</button><button type="button" onClick={handleAdminSaveProvider} disabled={modalKwMetrics.wordCount > MAX_KEYWORD_COUNT || modalKwMetrics.charCount > MAX_KEYWORD_CHARS} className="px-5 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold shadow-sm">Kaydet</button></div>
            </div>
          </div>
        </div>
      )}

      {isTagModalOpen && (
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-sm text-neutral-950">{editingTagId ? 'Etiketi Düzenle' : 'Yeni Etiket Tanımla'}</h3>
              <button onClick={() => setIsTagModalOpen(false)} className="text-neutral-400 hover:text-neutral-700"><X size={16} /></button>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Etiket Adı *</label>
                <div className="relative">
                  <Tag size={14} className="absolute left-3 top-3 text-neutral-400" />
                  <input type="text" value={tagFormData.tag_name} onChange={(e) => setTagFormData({ ...tagFormData, tag_name: e.target.value })} placeholder="Örn: Tesisat, Kombi..." className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border outline-none focus:border-neutral-950 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-neutral-500 mb-1">Eşleşme Kelimeleri (Keywords) *</label>
                <textarea rows={3} value={tagFormData.keywords} onChange={(e) => setTagFormData({ ...tagFormData, keywords: e.target.value })} placeholder="kombi, petek temizleme, su damlatıyor..." className="w-full p-2.5 text-xs font-mono rounded-xl border outline-none focus:border-neutral-950 resize-none bg-neutral-50" />
                <p className="text-[9px] text-neutral-400 mt-1">Sistem bu kelimeleri gördüğünde talebi bu etikete otomatik atar. Virgülle ayırarak yazın.</p>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <input type="checkbox" checked={tagFormData.is_active} onChange={(e) => setTagFormData({ ...tagFormData, is_active: e.target.checked })} className="w-4 h-4 rounded text-blue-600" />
                <span className="text-xs font-bold text-neutral-700">Aktif (Sistemde Kullanılsın)</span>
              </label>
              <div className="flex justify-end space-x-2 pt-3 border-t border-neutral-100">
                <button type="button" onClick={() => setIsTagModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-50">Vazgeç</button>
                <button type="button" onClick={handleAdminSaveTag} className="px-5 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold shadow-sm">Kaydet</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}