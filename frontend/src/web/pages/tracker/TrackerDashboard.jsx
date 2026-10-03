import React, { useState, useMemo } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import {
  Activity, Radio, CheckCircle2, Clock, MapPin, Phone,
  Send, Sparkles, AlertCircle, Timer, Star, Check, X,
  RefreshCw, DollarSign, AlignLeft, ShieldCheck,
  ChevronDown, ChevronUp, Loader2, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import {
  safeArray, safeUpper, extractAddress, extractGPS,
  safeDateTime, calculateRemainingTime
} from '../../../core/utils/helpers';

const fetcher = (url) => axios.get(url).then(res => res.data);

export default function TrackerDashboard() {
  const { session, API_BASE } = useAuth();

  // Aktif simülasyon / takip sağlayıcı kimliği
  const activeProviderId = session?.id || 113;

  // Sistem Ayarları
  const { data: rawSettings } = useSWR(`${API_BASE}/settings`, fetcher, { refreshInterval: 60000 });
  const systemSettings = rawSettings?.settings || {
    pool_lifespan_hours: 72,
    customer_selection_timeout_mins: 60,
    provider_completion_timeout_hours: 48
  };

  // 1. Havuzdaki Talepler (2.5 sn aralıkla canlı takip)
  const {
    data: poolData,
    mutate: mutatePool,
    isValidating: isValidatingPool
  } = useSWR(
    `${API_BASE}/requests/pool?providerId=${activeProviderId}`,
    fetcher,
    { refreshInterval: 2500, revalidateOnFocus: true }
  );

  // 2. Sağlayıcıya Atanan / Eşleşen Talepler (2 sn aralıkla canlı takip)
  const {
    data: assignedData,
    mutate: mutateAssigned,
    isValidating: isValidatingAssigned
  } = useSWR(
    `${API_BASE}/requests/provider-requests?providerId=${activeProviderId}&phone=${encodeURIComponent(session?.phone || '')}`,
    fetcher,
    { refreshInterval: 2000, revalidateOnFocus: true }
  );

  const poolRequests = useMemo(() => safeArray(poolData?.poolRequests), [poolData]);
  const assignedRequests = useMemo(() => safeArray(assignedData?.requests), [assignedData]);

  // Teklif Formları State'i: { [reqId]: { budget: '', targetDate: '', description: '', isOpen: false } }
  const [trackerBidForms, setTrackerBidForms] = useState({});
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [actionFeedbackMap, setActionFeedbackMap] = useState({});

  const showFeedback = (key, type, text) => {
    setActionFeedbackMap(prev => ({ ...prev, [key]: { type, text } }));
    setTimeout(() => {
      setActionFeedbackMap(prev => ({ ...prev, [key]: null }));
    }, 3500);
  };

  const toggleBidForm = (reqId) => {
    setTrackerBidForms(prev => ({
      ...prev,
      [reqId]: {
        budget: prev[reqId]?.budget || '',
        targetDate: prev[reqId]?.targetDate || '',
        description: prev[reqId]?.description || '',
        isOpen: !prev[reqId]?.isOpen
      }
    }));
  };

  const updateBidField = (reqId, field, value) => {
    setTrackerBidForms(prev => ({
      ...prev,
      [reqId]: {
        ...prev[reqId],
        [field]: value
      }
    }));
  };

  // ⭐ 1. HAVUZDAN TEKLİF VERİP SIRAYA GİRME (Paralel İstek)
  const handleJoinPoolWithBid = async (requestId) => {
    const actionKey = `join_${requestId}`;
    setActionLoadingKey(actionKey);

    const bid = trackerBidForms[requestId] || {};

    try {
      const requests = [
        axios.post(`${API_BASE}/requests/${requestId}/join-pool`, { providerId: activeProviderId })
      ];

      if (bid.budget || bid.targetDate || bid.description) {
        requests.push(
          axios.post(`${API_BASE}/requests/${requestId}/providers/${activeProviderId}/details`, {
            providerBudget: bid.budget !== '' ? parseFloat(bid.budget) : null,
            providerCurrency: 'TRY',
            providerTargetDate: bid.targetDate ? new Date(bid.targetDate).toISOString() : null,
            providerDescription: bid.description || ''
          })
        );
      }

      await Promise.all(requests);

      showFeedback(actionKey, 'success', 'Teklif iletildi ve sıraya girildi');
      toggleBidForm(requestId);

      // Ekranları beklemeden anında tazele
      mutatePool();
      mutateAssigned();
    } catch (err) {
      showFeedback(actionKey, 'error', err.response?.data?.message || 'İşlem başarısız');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // ⭐ 2. SAĞLAYICI KABUL ETME & DETAYLARI KESİNLEŞTİRME
  const handleAcceptRequest = async (req, customBid) => {
    const actionKey = `accept_${req.id}`;
    setActionLoadingKey(actionKey);

    try {
      const budgetVal = customBid?.budget !== undefined ? customBid.budget : (req.provider_budget ?? req.matched_budget);
      const dateVal = customBid?.targetDate !== undefined ? customBid.targetDate : (req.provider_target_date || req.matched_target_date);
      const descVal = customBid?.description !== undefined ? customBid.description : (req.provider_description || '');

      const requests = [
        axios.post(`${API_BASE}/requests/${req.id}/status`, { newStatus: 'ACCEPTED' }),
        axios.post(`${API_BASE}/requests/${req.id}/providers/${activeProviderId}/details`, {
          providerBudget: budgetVal !== '' && budgetVal !== null ? parseFloat(budgetVal) : null,
          providerCurrency: 'TRY',
          providerTargetDate: dateVal ? new Date(dateVal).toISOString() : null,
          providerDescription: descVal || ''
        })
      ];

      await Promise.all(requests);

      showFeedback(actionKey, 'success', 'Şartlar onaylandı ve iş kabul edildi');
      mutateAssigned();
    } catch (err) {
      showFeedback(actionKey, 'error', err.response?.data?.message || 'Hata oluştu');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // ⭐ 3. SAĞLAYICI TESLİMAT BİLDİRİMİ
  const handleCompleteRequest = async (requestId) => {
    const actionKey = `complete_${requestId}`;
    setActionLoadingKey(actionKey);
    try {
      await axios.post(`${API_BASE}/requests/${requestId}/status`, { newStatus: 'PROVIDER_COMPLETED' });
      showFeedback(actionKey, 'success', 'Teslimat bildirildi');
      mutateAssigned();
    } catch (err) {
      showFeedback(actionKey, 'error', 'Teslimat iletilemedi');
    } finally {
      setActionLoadingKey(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 px-4 py-8">
      {/* ÜST BİLGİ PANELİ */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="text-emerald-600" size={20} />
            <h2 className="text-lg font-black text-neutral-900 tracking-tight">Canlı Takip & Simülasyon Paneli</h2>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
              GERÇEK ZAMANLI
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Havuzdaki işleri izleyin, teklif sunarak sıraya girin ve müşteri seçimini anlık takip edin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { mutatePool(); mutateAssigned(); }}
          className="px-3 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 flex items-center gap-1.5 transition shadow-xs cursor-pointer"
        >
          <RefreshCw size={13} className={(isValidatingPool || isValidatingAssigned) ? 'animate-spin' : ''} />
          <span>Yenile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ========================================================= */}
        {/* SOL KOLON: AÇIK HAVUZ TALEPLERİ & TEKLİF VERME          */}
        {/* ========================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-200">
            <h3 className="text-sm font-extrabold text-neutral-800 flex items-center gap-2">
              <Radio size={15} className="text-blue-500 animate-pulse" />
              <span>Açık Havuz ({poolRequests.length})</span>
            </h3>
            <span className="text-[10px] font-mono text-neutral-400">Teklif Verilebilir</span>
          </div>

          {poolRequests.length === 0 ? (
            <div className="p-8 text-center bg-white border border-dashed rounded-2xl text-xs text-neutral-400">
              Havuzda şu an açık talep bulunmuyor.
            </div>
          ) : (
            poolRequests.map(req => {
              const actionKey = `join_${req.id}`;
              const isJoining = actionLoadingKey === actionKey;
              const feedback = actionFeedbackMap[actionKey];
              const formState = trackerBidForms[req.id] || { budget: '', targetDate: '', description: '', isOpen: false };

              return (
                <div key={req.id} className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden transition-all">
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-neutral-400">#REQ-{req.id}</span>
                        <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded font-semibold">
                          {safeDateTime(req.created_at)}
                        </span>
                        {req.is_urgent && (
                          <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                            ACİL
                          </span>
                        )}
                      </div>

                      {feedback && (
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all flex items-center gap-1 ${
                          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          {feedback.type === 'success' ? <Check size={10} /> : <AlertCircle size={10} />}
                          <span>{feedback.text}</span>
                        </div>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-neutral-900 leading-snug">"{req.raw_text}"</h4>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-neutral-400" />
                        <span>{extractAddress(req.location)}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleBidForm(req.id)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1 cursor-pointer"
                      >
                        {formState.isOpen ? (
                          <>
                            <span>Formu Kapat</span>
                            <ChevronUp size={13} />
                          </>
                        ) : (
                          <>
                            <span>Teklif Ver & Sıraya Gir</span>
                            <ChevronDown size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ⭐ AÇILIR TEKLİF PANELİ ⭐ */}
                  {formState.isOpen && (
                    <div className="border-t border-neutral-100 bg-neutral-50/80 p-4 space-y-3 animate-in fade-in duration-150">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[9px] font-bold uppercase text-neutral-600 block mb-1">
                            Tutar (TRY) *
                          </label>
                          <input
                            type="number"
                            placeholder="Örn: 500"
                            value={formState.budget}
                            onChange={(e) => updateBidField(req.id, 'budget', e.target.value)}
                            className="w-full p-2 text-xs font-mono font-bold bg-white border border-neutral-300 rounded-lg outline-none focus:border-neutral-900"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase text-neutral-600 block mb-1">
                            Hedef Teslimat *
                          </label>
                          <input
                            type="datetime-local"
                            value={formState.targetDate}
                            onChange={(e) => updateBidField(req.id, 'targetDate', e.target.value)}
                            className="w-full p-2 text-xs font-mono bg-white border border-neutral-300 rounded-lg outline-none focus:border-neutral-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold uppercase text-neutral-600 mb-1 flex items-center gap-1">
                          <AlignLeft size={10} />
                          <span>Şartlar / Teklif Notu</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Müşteriye özel fiyat veya malzeme şartınız..."
                          value={formState.description}
                          onChange={(e) => updateBidField(req.id, 'description', e.target.value)}
                          className="w-full p-2 text-xs bg-white border border-neutral-300 rounded-lg outline-none focus:border-neutral-900 resize-none"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          disabled={isJoining}
                          onClick={() => handleJoinPoolWithBid(req.id)}
                          className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          {isJoining ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                          <span>Teklifi İlet & Sıraya Gir</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ========================================================= */}
        {/* SAĞ KOLON: ÜZERİME DÜŞEN İŞLER & MÜŞTERİ SEÇİMİ          */}
        {/* ========================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-200">
            <h3 className="text-sm font-extrabold text-neutral-800 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Görevlerim & Eşleşmeler ({assignedRequests.length})</span>
            </h3>
            <span className="text-[10px] font-mono text-neutral-400">Aktif İşlemler</span>
          </div>

          {assignedRequests.length === 0 ? (
            <div className="p-8 text-center bg-white border border-dashed rounded-2xl text-xs text-neutral-400">
              Henüz onay bekleyen veya işlemde bir göreviniz yok. Havuzdan talep seçip sıraya girin.
            </div>
          ) : (
            assignedRequests.map(req => {
              const reqStatus = safeUpper(req.status);
              const isMatched = reqStatus === 'MATCHED';
              const isAccepted = reqStatus === 'ACCEPTED';
              const acceptKey = `accept_${req.id}`;
              const completeKey = `complete_${req.id}`;

              const isAccepting = actionLoadingKey === acceptKey;
              const isCompleting = actionLoadingKey === completeKey;

              const acceptFb = actionFeedbackMap[acceptKey];
              const completeFb = actionFeedbackMap[completeKey];

              return (
                <div key={req.id} className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-xs space-y-3.5">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-neutral-400">#REQ-{req.id}</span>
                        <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.2 rounded font-semibold">
                          {safeDateTime(req.created_at)}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-neutral-900 mt-1 leading-snug">"{req.raw_text}"</h4>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isMatched && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          Müşteri Sizi Seçti (Onay Bekliyor)
                        </span>
                      )}
                      {isAccepted && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-300">
                          İşlemde (Üzerinizde)
                        </span>
                      )}
                      {reqStatus === 'PROVIDER_COMPLETED' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">
                          Teslim Edildi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ⭐ MÜŞTERİ İLETİŞİM BİLGİSİ (SEÇİLDİĞİNDE DOĞRUDAN AÇILIR) ⭐ */}
                  <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <Phone size={14} className="text-emerald-700" />
                      <span className="font-bold text-neutral-800">Müşteri İletişim:</span>
                      <span className="font-mono font-black text-emerald-900">
                        {req.contact_value || 'Belirtilmedi'}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-700 font-bold uppercase">
                      İletişim Açık
                    </span>
                  </div>

                  {/* ŞARTLAR & TEKLİF BİLGİLERİ PANELİ */}
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70 space-y-2 text-xs">
                    <div className="flex flex-wrap gap-4 font-mono">
                      <div>
                        <span className="text-neutral-500">Maliyet / Tutar: </span>
                        <strong className="text-emerald-700 font-bold">
                          {req.provider_budget !== null && req.provider_budget !== undefined
                            ? `${new Intl.NumberFormat('tr-TR').format(Number(req.provider_budget))} TRY`
                            : 'Belirtilmedi'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-neutral-500">Hedef Teslimat: </span>
                        <strong className="text-neutral-900 font-bold">
                          {req.provider_target_date ? safeDateTime(req.provider_target_date) : 'Belirtilmedi'}
                        </strong>
                      </div>
                    </div>

                    {req.provider_description && (
                      <div className="pt-1.5 text-[11px] text-neutral-700 border-t border-neutral-200/50">
                        <span className="font-bold text-neutral-500 uppercase font-mono text-[9px] block">Teklif Notu:</span>
                        <p className="italic text-neutral-800 leading-relaxed">"{req.provider_description}"</p>
                      </div>
                    )}
                  </div>

                  {/* AKSİYON BUTONLARI */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-neutral-100">
                    {(acceptFb || completeFb) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1">
                        <Check size={10} />
                        <span>{(acceptFb || completeFb)?.text}</span>
                      </span>
                    )}

                    {isMatched && (
                      <button
                        type="button"
                        disabled={isAccepting}
                        onClick={() => handleAcceptRequest(req)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
                      >
                        {isAccepting ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />}
                        <span>Şartları Onayla & İşe Başla</span>
                      </button>
                    )}

                    {isAccepted && (
                      <button
                        type="button"
                        disabled={isCompleting}
                        onClick={() => handleCompleteRequest(req.id)}
                        className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
                      >
                        {isCompleting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        <span>İşi Teslim Et</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}