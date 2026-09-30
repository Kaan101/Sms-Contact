import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { 
  Briefcase, CheckCircle2, Clock, MapPin, Phone, MessageSquare, 
  Send, Sparkles, AlertCircle, Timer, Star, Check, X, RefreshCw,
  Folder, Calendar, DollarSign, FileText, ChevronDown, ChevronUp, Loader2,
  User, Award, ShieldCheck, Tag, ArrowRight, AlignLeft
} from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { 
  safeArray, safeUpper, extractAddress, extractGPS, 
  safeDateTime, calculateRemainingTime 
} from '../../../core/utils/helpers';
import CustomListsManager from '../../components/common/CustomListsManager';

const fetcher = (url) => axios.get(url).then(res => res.data);

// Tekil Talep Kartı
function ProviderRequestCard({ 
  req, 
  providerId, 
  API_BASE, 
  onRefresh, 
  systemSettings,
  userLists 
}) {
  const reqStatus = safeUpper(req.status) || 'MATCHED';
  
  const isReorder = Boolean(
    (req.provider_description && req.provider_description.includes('Tekrar')) ||
    (req.matched_budget && req.matched_target_date)
  );

  const initialBudget = req.provider_budget || req.matched_budget || '';
  const initialDate = useMemo(() => {
    const rawDate = req.provider_target_date || req.matched_target_date;
    if (!rawDate) return '';
    try {
      const d = new Date(rawDate);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  }, [req.provider_target_date, req.matched_target_date]);

  const [budget, setBudget] = useState(initialBudget);
  const [targetDate, setTargetDate] = useState(initialDate);
  const [description, setDescription] = useState(req.provider_description || '');
  const [isEditing, setIsEditing] = useState(false);

  const [btnLoading, setBtnLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // ⭐ YENİ: Listeye Ekleme Seçimi İçin React State
  const [selectedListId, setSelectedListId] = useState('');
  const [listFeedback, setListFeedback] = useState(null);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    setBudget(req.provider_budget || req.matched_budget || '');
    if (req.provider_target_date || req.matched_target_date) {
      try {
        const d = new Date(req.provider_target_date || req.matched_target_date);
        setTargetDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      } catch {}
    }
    if (req.provider_description) {
      setDescription(req.provider_description);
    }
  }, [req]);

  const saveDetails = async () => {
    await axios.post(`${API_BASE}/requests/${req.id}/providers/${providerId}/details`, {
      providerBudget: budget ? parseFloat(budget) : null,
      providerCurrency: 'TRY',
      providerTargetDate: targetDate ? new Date(targetDate).toISOString() : null,
      providerDescription: description || (isReorder ? 'Tekrarlanan Sipariş Onayı' : '')
    });
  };

  const handleAccept = async () => {
    setBtnLoading(true);
    setFeedback(null);
    try {
      await saveDetails();
      await axios.post(`${API_BASE}/requests/${req.id}/status`, { newStatus: 'ACCEPTED' });
      showFeedback('success', isReorder ? 'Sipariş devam ettirildi' : 'Kabul edildi');
      onRefresh();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'İşlem başarısız');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleComplete = async () => {
    setBtnLoading(true);
    setFeedback(null);
    try {
      await axios.post(`${API_BASE}/requests/${req.id}/status`, { newStatus: 'PROVIDER_COMPLETED' });
      showFeedback('success', 'Teslimat bildirildi');
      onRefresh();
    } catch (err) {
      showFeedback('error', 'Tamamlama başarısız');
    } finally {
      setBtnLoading(false);
    }
  };

  const handleSkip = async () => {
    setBtnLoading(true);
    setFeedback(null);
    try {
      await axios.post(`${API_BASE}/requests/${req.id}/next-provider`);
      showFeedback('success', 'Pas geçildi');
      onRefresh();
    } catch (err) {
      showFeedback('error', 'Hata oluştu');
    } finally {
      setBtnLoading(false);
    }
  };

  // ⭐ DÜZELTİLDİ: DOM yerine State kullanan liste ekleme fonksiyonu
  const handleAddToList = async () => {
    if (!selectedListId) {
      setListFeedback({ type: 'error', text: 'Liste seçin' });
      setTimeout(() => setListFeedback(null), 2500);
      return;
    }
    try {
      await axios.post(`${API_BASE}/lists/${selectedListId}/requests`, { requestId: req.id });
      setListFeedback({ type: 'success', text: 'Kaydedildi' });
      setSelectedListId(''); // Seçimi sıfırla
    } catch (e) {
      setListFeedback({ type: 'error', text: 'Eklenemedi' });
    } finally {
      setTimeout(() => setListFeedback(null), 2500);
    }
  };

  let timerDisplay = null;
  const refDate = req.updated_at || req.created_at || new Date().toISOString();
  if (reqStatus === 'MATCHED') {
    const remaining = calculateRemainingTime(refDate, systemSettings?.customer_selection_timeout_mins || 60, 'mins');
    if (remaining) timerDisplay = `Kabul Süresi: ${remaining}`;
  } else if (reqStatus === 'ACCEPTED') {
    if (targetDate) {
      const diffMs = new Date(targetDate).getTime() - Date.now();
      if (diffMs > 0) {
        const totalMins = Math.floor(diffMs / 60000);
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        timerDisplay = `Teslimata: ${h}sa ${m}dk`;
      } else {
        timerDisplay = 'Teslimat Süresi Doldu';
      }
    }
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-neutral-400">#REQ-{req.id}</span>
            <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded font-semibold">
              {safeDateTime(req.created_at)}
            </span>
            {isReorder && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                Tekrarlanan Sipariş
              </span>
            )}
            {req.is_urgent && (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                ACİL
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-neutral-950 mt-1">"{req.raw_text}"</h4>
          <p className="text-xs text-neutral-600 mt-1 flex items-center gap-1">
            <MapPin size={12} className="text-neutral-400 shrink-0" />
            <span>{extractAddress(req.location)}</span>
          </p>
          <p className="text-xs font-mono text-blue-700 font-semibold mt-1 flex items-center gap-1">
            <Phone size={12} className="text-blue-500 shrink-0" />
            <span>{req.contact_value}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {reqStatus === 'MATCHED' && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200">
              {isReorder ? 'Tekrar Talebi Geldi' : 'Onayınızı Bekliyor'}
            </span>
          )}
          {reqStatus === 'ACCEPTED' && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
              Üzerinizde (İşlemde)
            </span>
          )}
          {reqStatus === 'PROVIDER_COMPLETED' && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">
              Teslim Edildi
            </span>
          )}
          {reqStatus === 'COMPLETED' && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-neutral-100 text-neutral-700 border">
              Tamamlandı
            </span>
          )}

          {timerDisplay && (
            <span className="text-[10px] font-mono font-bold bg-neutral-50 border px-1.5 py-0.5 rounded text-neutral-600 flex items-center gap-1">
              <Timer size={11} /> {timerDisplay}
            </span>
          )}
        </div>
      </div>

      <div className="bg-neutral-50 rounded-xl border border-neutral-200/80 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
            <DollarSign size={14} className="text-emerald-600" />
            <span>Sipariş Şartları (Fiyat, Tarih & Açıklama)</span>
          </span>
          {reqStatus === 'MATCHED' && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              {isEditing ? 'Kapat' : 'Şartları Düzenle'}
            </button>
          )}
        </div>

        {reqStatus === 'MATCHED' ? (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1 font-bold">
                  Tutar (TRY) *
                </label>
                <input
                  type="number"
                  step="any"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Örn: 250"
                  className="w-full p-2 text-xs font-mono font-bold rounded-lg border border-neutral-200 bg-white outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1 font-bold">
                  Hedef Teslimat Tarihi / Saati *
                </label>
                <input
                  type="datetime-local"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full p-2 text-xs font-mono rounded-lg border border-neutral-200 bg-white outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-neutral-500 mb-1 font-bold flex items-center gap-1">
                <AlignLeft size={11} className="text-neutral-500" />
                <span>Teklif Notu / Açıklama (Opsiyonel)</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Örn: Malzeme dahil fiyat teklifidir, parçalar temin edildikten sonra montaj yapılacaktır..."
                className="w-full p-2 text-xs rounded-lg border border-neutral-200 bg-white outline-none focus:border-neutral-900 resize-none font-medium text-neutral-800 placeholder:text-neutral-400"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-xs font-mono">
            <div className="flex flex-wrap gap-4">
              <div>
                <span className="text-neutral-500">Maliyet / Tutar: </span>
                <strong className="text-emerald-700 font-bold">
                  {budget ? `${new Intl.NumberFormat('tr-TR').format(Number(budget))} TRY` : 'Belirtilmedi'}
                </strong>
              </div>
              <div>
                <span className="text-neutral-500">Hedef Teslimat: </span>
                <strong className="text-neutral-900 font-bold">
                  {targetDate ? safeDateTime(targetDate) : 'Belirtilmedi'}
                </strong>
              </div>
            </div>

            {description && (
              <div className="pt-1 text-[11px] font-sans text-neutral-700 bg-white p-2 rounded-lg border border-neutral-200/60">
                <span className="font-bold text-neutral-500 block text-[10px] uppercase font-mono mb-0.5">Sağlayıcı Notu:</span>
                <p className="italic text-neutral-800 leading-relaxed">"{description}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-neutral-100 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {reqStatus === 'ACCEPTED' && userLists?.length > 0 && (
            <div className="flex items-center gap-1.5">
              {/* ⭐ STATE KULLANARAK HATA ÖNLENİYOR */}
              <select
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
                className="p-1.5 text-xs rounded-lg border border-neutral-200 bg-white outline-none text-neutral-800"
              >
                <option value="">Listeye Kaydet...</option>
                {userLists.map(l => (
                  <option key={l.id} value={l.id}>{l.list_name}</option>
                ))}
              </select>
              
              {listFeedback && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all ${
                  listFeedback.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {listFeedback.text}
                </span>
              )}

              <button
                type="button"
                onClick={handleAddToList}
                className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Ekle
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          {feedback && (
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all animate-in fade-in slide-in-from-right-1 duration-200 flex items-center gap-1 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {feedback.type === 'success' ? <Check size={12} className="text-emerald-600" /> : <AlertCircle size={12} className="text-rose-600" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {reqStatus === 'MATCHED' && (
            <>
              {!isReorder && (
                <button
                  type="button"
                  disabled={btnLoading}
                  onClick={handleSkip}
                  className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 border rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Pas Geç
                </button>
              )}
              <button
                type="button"
                disabled={btnLoading}
                onClick={handleAccept}
                className={`px-5 py-2 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition ${
                  isReorder ? 'bg-neutral-950 hover:bg-neutral-800' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {btnLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>İşleniyor...</span>
                  </>
                ) : isReorder ? (
                  <>
                    <span>Devam</span>
                    <ArrowRight size={14} />
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Şartları Onayla & İşi Kabul Et</span>
                  </>
                )}
              </button>
            </>
          )}

          {reqStatus === 'ACCEPTED' && (
            <button
              type="button"
              disabled={btnLoading}
              onClick={handleComplete}
              className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition"
            >
              {btnLoading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Tamamlanıyor...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>İşi Teslim Et</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProviderDashboard() {
  const { session, API_BASE } = useAuth();

  const { data: providerInfoData, mutate: mutateProviderInfo } = useSWR(
    session?.phone ? `${API_BASE}/providers/by-phone?phone=${encodeURIComponent(session.phone)}` : null,
    fetcher
  );

  const provider = useMemo(() => {
    return providerInfoData?.provider || session || {};
  }, [providerInfoData, session]);

  const providerId = provider?.id || session?.id;

  const [activeTab, setActiveTab] = useState('ASSIGNED'); 
  const [filterStatus, setFilterStatus] = useState('ALL');

  const { data: rawSettings } = useSWR(`${API_BASE}/settings`, fetcher, { refreshInterval: 60000 });
  const systemSettings = rawSettings?.settings || { customer_selection_timeout_mins: 60, provider_completion_timeout_hours: 48 };

  const { data: assignedData, mutate: mutateAssigned, isValidating: isValidatingAssigned } = useSWR(
    providerId ? `${API_BASE}/requests/provider-requests?providerId=${providerId}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: poolData, mutate: mutatePool } = useSWR(
    providerId && activeTab === 'POOL' ? `${API_BASE}/requests/pool?providerId=${providerId}` : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  const [userLists, setUserLists] = useState([]);
  const fetchLists = async () => {
    if (!session?.phone) return;
    try {
      const res = await axios.get(`${API_BASE}/lists/PROVIDER/${session.phone}`);
      if (res.data?.lists) setUserLists(res.data.lists);
    } catch {}
  };

  useEffect(() => {
    fetchLists();
  }, [session?.phone]);

  const assignedRequests = useMemo(() => safeArray(assignedData?.requests), [assignedData]);
  const poolRequests = useMemo(() => safeArray(poolData?.poolRequests), [poolData]);

  const filteredAssigned = useMemo(() => {
    if (filterStatus === 'ALL') return assignedRequests;
    return assignedRequests.filter(r => safeUpper(r.status) === filterStatus);
  }, [assignedRequests, filterStatus]);

  const pendingCount = useMemo(() => {
    return assignedRequests.filter(r => safeUpper(r.status) === 'MATCHED').length;
  }, [assignedRequests]);

  const activeCount = useMemo(() => {
    return assignedRequests.filter(r => safeUpper(r.status) === 'ACCEPTED').length;
  }, [assignedRequests]);

  const [poolActionId, setPoolActionId] = useState(null);
  const [poolFeedbackMap, setPoolFeedbackMap] = useState({});

  const handleJoinPool = async (requestId) => {
    if (!providerId) {
      setPoolFeedbackMap(prev => ({ ...prev, [requestId]: { type: 'error', text: 'Kimlik doğrulanamadı' } }));
      setTimeout(() => setPoolFeedbackMap(prev => ({ ...prev, [requestId]: null })), 3000);
      return;
    }

    setPoolActionId(requestId);
    setPoolFeedbackMap(prev => ({ ...prev, [requestId]: null }));
    try {
      await axios.post(`${API_BASE}/requests/${requestId}/join-pool`, { providerId });
      setPoolFeedbackMap(prev => ({ ...prev, [requestId]: { type: 'success', text: 'Sıraya girildi' } }));
      mutatePool();
      mutateAssigned();
    } catch (err) {
      setPoolFeedbackMap(prev => ({ ...prev, [requestId]: { type: 'error', text: err.response?.data?.message || 'Hata oluştu' } }));
    } finally {
      setPoolActionId(null);
      setTimeout(() => setPoolFeedbackMap(prev => ({ ...prev, [requestId]: null })), 3500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 px-4 py-8">
      
      {/* PROFİL KARTI */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            {provider?.name ? provider.name.charAt(0).toUpperCase() : <User size={22} />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-neutral-900 text-base">{provider?.name || 'Hizmet Sağlayıcı'}</h3>
              <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldCheck size={11} /> Onaylı Profil
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">{provider?.phone || session?.phone}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
          <div className="flex flex-col items-center bg-amber-50/70 border border-amber-200/80 px-3.5 py-1.5 rounded-xl">
            <span className="text-[9px] font-mono text-amber-700 uppercase font-bold flex items-center gap-1">
              <Star size={10} fill="#f59e0b" className="text-amber-500" /> Müşteri Puanı
            </span>
            <span className="text-sm font-extrabold text-amber-900 mt-0.5">
              {provider?.avg_rating ? Number(parseFloat(provider.avg_rating).toFixed(1)) : '5.0'} / 5.0
            </span>
          </div>

          <div className="flex flex-col items-center bg-blue-50/70 border border-blue-200/80 px-3.5 py-1.5 rounded-xl">
            <span className="text-[9px] font-mono text-blue-700 uppercase font-bold flex items-center gap-1">
              <Award size={10} className="text-blue-500" /> Sistem Skoru
            </span>
            <span className="text-sm font-extrabold text-blue-900 mt-0.5">
              {provider?.priority_score || '100'} Puan
            </span>
          </div>
        </div>
      </div>

      {/* SEKMELER */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('ASSIGNED')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ASSIGNED' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Briefcase size={14} />
            <span>Görevlerim ({assignedRequests.length})</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('POOL')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'POOL' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Sparkles size={14} />
            <span>Açık Havuz</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LISTS')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'LISTS' ? 'bg-white text-neutral-950 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Folder size={14} />
            <span>Listelerim</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => { mutateAssigned(); mutateProviderInfo(); }}
          className="p-2 text-neutral-500 hover:text-neutral-900 bg-white border border-neutral-200 rounded-xl transition cursor-pointer shadow-xs"
          title="Yenile"
        >
          <RefreshCw size={14} className={isValidatingAssigned ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* GÖREVLERİM */}
      {activeTab === 'ASSIGNED' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'ALL', label: `Tümü (${assignedRequests.length})` },
              { id: 'MATCHED', label: `Onay Bekleyen (${pendingCount})` },
              { id: 'ACCEPTED', label: `İşlemde (${activeCount})` },
              { id: 'COMPLETED', label: 'Tamamlananlar' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  filterStatus === f.id
                    ? 'bg-neutral-950 text-white shadow-xs'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredAssigned.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-xs bg-white rounded-xl border border-dashed">
              Bu filtreye uygun herhangi bir görev bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssigned.map(req => (
                <ProviderRequestCard
                  key={req.id}
                  req={req}
                  providerId={providerId}
                  API_BASE={API_BASE}
                  onRefresh={mutateAssigned}
                  systemSettings={systemSettings}
                  userLists={userLists}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* AÇIK HAVUZ */}
      {activeTab === 'POOL' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900">
            Aşağıdaki talepler uzmanlık alanlarınızla eşleşen açık havuz talepleridir. 
            <strong> "Talip Ol"</strong> diyerek sıraya girebilirsiniz. Müşteri sizi seçtiğinde iş görevlerinize düşecektir.
          </div>

          {poolRequests.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-xs bg-white rounded-xl border border-dashed">
              Şu anda hizmet alanınıza uygun açık havuz talebi bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {poolRequests.map(req => {
                const isJoining = poolActionId === req.id;
                const poolFb = poolFeedbackMap[req.id];

                return (
                  <div key={req.id} className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-neutral-400">#REQ-{req.id}</span>
                        <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded font-semibold">
                          {safeDateTime(req.created_at)}
                        </span>
                        {req.is_urgent && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                            ACİL
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-neutral-950">"{req.raw_text}"</h4>
                      <p className="text-xs text-neutral-500 flex items-center gap-1">
                        <MapPin size={12} className="text-neutral-400 shrink-0" />
                        <span>{extractAddress(req.location)}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                      {poolFb && (
                        <div className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all animate-in fade-in duration-200 flex items-center gap-1 ${
                          poolFb.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {poolFb.type === 'success' ? <Check size={12} className="text-emerald-600" /> : <AlertCircle size={12} className="text-rose-600" />}
                          <span>{poolFb.text}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={isJoining}
                        onClick={() => handleJoinPool(req.id)}
                        className="px-4 py-2 bg-transparent hover:bg-neutral-100 text-neutral-800 border border-neutral-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isJoining ? (
                          <>
                            <Loader2 size={13} className="animate-spin text-neutral-600" />
                            <span>İletiliyor...</span>
                          </>
                        ) : (
                          <>
                            <Send size={13} className="text-neutral-600" />
                            <span>Talip Ol</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* LİSTELERİM */}
      {activeTab === 'LISTS' && (
        <CustomListsManager
          ownerType="PROVIDER"
          ownerId={session?.phone}
          onReworkRequest={() => {}}
          onDirectReorder={() => {}}
        />
      )}
    </div>
  );
}