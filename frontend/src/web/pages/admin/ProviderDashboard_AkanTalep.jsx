import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { 
  Briefcase, CheckCircle2, Clock, MapPin, Phone, MessageSquare, 
  Send, Sparkles, AlertCircle, Timer, Star, Check, X, RefreshCw,
  Folder, Calendar, DollarSign, FileText, ChevronDown, ChevronUp, Loader2,
  User, Award, ShieldCheck, Tag, ArrowRight, AlignLeft, Play,
  PhoneCall, MessageCircle // ⭐ BEYAZ EKRAN SEBEBİ BURADAKİ EKSİKLİKLERDİ
} from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { 
  safeArray, safeUpper, extractAddress, extractGPS, 
  safeDateTime, calculateRemainingTime, safeString, extractPhoneForWa 
} from '../../../core/utils/helpers';
import CustomListsManager from '../../components/common/CustomListsManager';

const fetcher = (url) => axios.get(url).then(res => res.data);

// Tekil Talep Kartı Bileşeni
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

  // Gelen teklif ve eşleşme değerlerini güvenli oku
  const initialBudget = req.provider_budget ?? req.matched_budget ?? '';
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
  const [description, setDescription] = useState(req.provider_description || req.notes || '');

  const [btnLoading, setBtnLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [selectedListId, setSelectedListId] = useState('');
  const [listFeedback, setListFeedback] = useState(null);

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Backend'den veri güncellendiğinde input değerlerini eşitle
  useEffect(() => {
    setBudget(req.provider_budget ?? req.matched_budget ?? '');
    const rawDate = req.provider_target_date || req.matched_target_date;
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        setTargetDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      } catch {}
    } else {
      setTargetDate('');
    }
    setDescription(req.provider_description || req.notes || '');
  }, [req]);

  // Kabul Et & Şartları Kaydet (Paralel İstek)
  const handleAccept = async () => {
    setBtnLoading(true);
    setFeedback(null);
    try {
      const requests = [
        axios.post(`${API_BASE}/requests/${req.id}/status`, { newStatus: 'ACCEPTED' }),
        axios.post(`${API_BASE}/requests/${req.id}/providers/${providerId}/details`, {
          providerBudget: budget !== '' ? parseFloat(budget) : null,
          providerCurrency: 'TRY',
          providerTargetDate: targetDate ? new Date(targetDate).toISOString() : null,
          providerDescription: description || (isReorder ? 'Tekrarlanan Sipariş Onayı' : '')
        })
      ];

      await Promise.all(requests);
      
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

  const handleAddToList = async () => {
    if (!selectedListId) {
      setListFeedback({ type: 'error', text: 'Liste seçin' });
      setTimeout(() => setListFeedback(null), 2500);
      return;
    }
    try {
      await axios.post(`${API_BASE}/lists/${selectedListId}/requests`, { requestId: req.id });
      setListFeedback({ type: 'success', text: 'Kaydedildi' });
      setSelectedListId(''); 
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

  const forceRevealContact = ['MATCHED', 'ACCEPTED', 'PROVIDER_COMPLETED'].includes(reqStatus); 
  const rawContact = safeString(req.contact_value).replace(/\|HIDDEN/gi, '').replace(/\|SHARED/gi, '').trim();
  const displayContact = forceRevealContact ? rawContact : 'Gizli (Müşteri Seçince Açılacak)';
  const showWhatsApp = forceRevealContact && safeString(req.preferred_channel).includes('WHATSAPP');

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

          {/* ⭐ YENİ: ATANAN TALEP ÜZERİNDE ETİKETLER ⭐ */}
          {Array.isArray(req.tags) && req.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {req.tags.map((tagItem, tIdx) => (
                <span 
                  key={tIdx} 
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-md text-[9px] font-mono font-bold flex items-center gap-1 shadow-2xs"
                >
                  <Tag size={9} className="text-blue-500" />
                  #{String(tagItem).replace('#', '')}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-neutral-600 mt-1 flex items-center gap-1">
            <MapPin size={12} className="text-neutral-400 shrink-0" />
            <span>{extractAddress(req.location)}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {reqStatus === 'MATCHED' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200">Onayınızı Bekliyor</span>}
          {reqStatus === 'ACCEPTED' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">Üzerinizde (İşlemde)</span>}
          {reqStatus === 'PROVIDER_COMPLETED' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">Teslim Edildi</span>}
          {reqStatus === 'COMPLETED' && <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-neutral-100 text-neutral-700 border">Tamamlandı</span>}
          {timerDisplay && <span className="text-[10px] font-mono font-bold bg-neutral-50 border px-1.5 py-0.5 rounded text-neutral-600 flex items-center gap-1"><Timer size={11} /> {timerDisplay}</span>}
        </div>
      </div>

      {/* MÜŞTERİ İLETİŞİM KUTUSU */}
      <div className={`p-2.5 rounded-lg border flex items-center justify-between ${forceRevealContact ? 'bg-emerald-50 border-emerald-200' : 'bg-neutral-50 border-neutral-200'}`}>
        <div className="flex flex-col">
          <span className="text-[10px] font-mono uppercase font-semibold text-neutral-500">
            {forceRevealContact ? '✅ Müşteri İletişim (Açık)' : 'Müşteri İletişim'}
          </span>
          <span className={`text-xs font-bold mt-0.5 ${forceRevealContact ? 'text-neutral-900 font-mono text-sm' : 'text-neutral-400'}`}>{displayContact}</span>
        </div>
        {forceRevealContact && (
          <div className="flex items-center gap-2">
            <a href={`tel:${rawContact}`} onClick={(e) => e.stopPropagation()} className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold flex items-center space-x-1 shadow-sm transition shrink-0 cursor-pointer">
              <PhoneCall size={12} />
              <span>Ara</span>
            </a>
            {showWhatsApp && (
              <a href={`https://wa.me/${extractPhoneForWa(rawContact)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-[10px] font-bold flex items-center space-x-1 shadow-sm transition shrink-0 cursor-pointer">
                <MessageCircle size={12} />
                <span>Yaz</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* ŞARTLAR PANELİ: MATCHED AŞAMASINDA SALT OKUNUR (KİLİTLİ) */}
      <div className="bg-neutral-50 rounded-xl border border-neutral-200/80 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
            <DollarSign size={14} className="text-emerald-600" />
            <span>{reqStatus === 'MATCHED' ? 'Kabul Edilen Teklif Şartlarınız' : 'Onaylanan Şartlar'}</span>
          </span>
        </div>

        {reqStatus === 'MATCHED' ? (
          <div className="space-y-3 pt-1 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1 font-bold">Son Tutar (TRY)</label>
                <input
                  type="text"
                  readOnly
                  value={budget ? `${new Intl.NumberFormat('tr-TR').format(Number(budget))} TRY` : 'Belirtilmedi'}
                  className="w-full p-2 text-xs font-mono font-bold rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-600 outline-none cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1 font-bold">Son Teslimat Tarihi</label>
                <input
                  type="text"
                  readOnly
                  value={targetDate ? safeDateTime(targetDate) : 'Belirtilmedi'}
                  className="w-full p-2 text-xs font-mono rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-600 outline-none cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono uppercase text-neutral-500 mb-1 font-bold flex items-center gap-1">
                <AlignLeft size={11} /> <span>Teklif Notu / Açıklama</span>
              </label>
              <textarea
                rows={2}
                readOnly
                value={description || 'Açıklama girilmemiş.'}
                className="w-full p-2 text-xs rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-600 outline-none resize-none font-medium cursor-not-allowed"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-xs font-mono animate-in fade-in duration-200">
            <div className="flex flex-wrap gap-4">
              <div><span className="text-neutral-500">Maliyet / Tutar: </span><strong className="text-emerald-700 font-bold text-sm">{budget !== '' ? `${new Intl.NumberFormat('tr-TR').format(Number(budget))} TRY` : 'Belirtilmedi'}</strong></div>
              <div><span className="text-neutral-500">Hedef Teslimat: </span><strong className="text-neutral-900 font-bold">{targetDate ? safeDateTime(targetDate) : 'Belirtilmedi'}</strong></div>
            </div>
            {description && (
              <div className="pt-1 text-[11px] font-sans text-neutral-700 bg-white p-2 rounded-lg border border-neutral-200/60 shadow-xs">
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
              <select value={selectedListId} onChange={(e) => setSelectedListId(e.target.value)} className="p-1.5 text-xs rounded-lg border border-neutral-200 bg-white outline-none text-neutral-800">
                <option value="">Listeye Kaydet...</option>
                {userLists.map(l => <option key={l.id} value={l.id}>{l.list_name}</option>)}
              </select>
              {listFeedback && <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${listFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{listFeedback.text}</span>}
              <button type="button" onClick={handleAddToList} className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold cursor-pointer">Ekle</button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          {feedback && (
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
              {feedback.type === 'success' ? <Check size={12} className="text-emerald-600" /> : <AlertCircle size={12} className="text-rose-600" />}
              <span>{feedback.text}</span>
            </div>
          )}

          {reqStatus === 'MATCHED' && (
            <>
              <button type="button" disabled={btnLoading} onClick={handleSkip} className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 border rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50">Pas Geç</button>
              <button type="button" disabled={btnLoading} onClick={handleAccept} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition">
                {btnLoading ? <><Loader2 size={13} className="animate-spin" /><span>İşleniyor...</span></> : <><Check size={14} /><span>Şartları Onayla & İşi Kabul Et</span></>}
              </button>
            </>
          )}

          {reqStatus === 'ACCEPTED' && (
            <button type="button" disabled={btnLoading} onClick={handleComplete} className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition">
              {btnLoading ? <><Loader2 size={13} className="animate-spin" /><span>Tamamlanıyor...</span></> : <><CheckCircle2 size={14} /><span>İşi Teslim Et</span></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProviderDashboardAkanTalep() {
  const { API_BASE } = useAuth();
  
  // Tüm sağlayıcıları çekerek adminin istediği sağlayıcıyı simüle etmesini sağlıyoruz
  const { data: providersRes } = useSWR(`${API_BASE}/providers`, fetcher);
  const providersList = useMemo(() => safeArray(providersRes?.providers), [providersRes]);

  const [selectedProviderId, setSelectedProviderId] = useState('');
  const activeProvider = useMemo(() => {
    if (!selectedProviderId && providersList.length > 0) return providersList[0];
    return providersList.find(p => String(p.id) === String(selectedProviderId)) || null;
  }, [providersList, selectedProviderId]);

  const currentProviderId = activeProvider?.id || null;

  // Açık Havuzdaki Talepleri Canlı Çek (Akan Talep Akışı - 2.5 saniye)
  const { data: poolRes, mutate: mutatePool, isValidating: isPoolValidating } = useSWR(
    `${API_BASE}/requests/pool`,
    fetcher,
    { refreshInterval: 2500 }
  );

  // Seçili sağlayıcıya atanmış talepleri çek
  const { data: assignedRes, mutate: mutateAssigned } = useSWR(
    currentProviderId ? `${API_BASE}/requests/provider-requests?providerId=${currentProviderId}` : null,
    fetcher,
    { refreshInterval: 2500 }
  );

  const poolRequests = useMemo(() => safeArray(poolRes?.poolRequests || poolRes?.requests), [poolRes]);
  const assignedRequests = useMemo(() => safeArray(assignedRes?.requests), [assignedRes]);

  const [simTab, setSimTab] = useState('POOL'); // 'POOL' | 'ASSIGNED'
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [offerMap, setOfferMap] = useState({});

  const showFeedback = (id, type, message) => {
    setFeedbackMap(prev => ({ ...prev, [id]: { type, message } }));
    setTimeout(() => {
      setFeedbackMap(prev => ({ ...prev, [id]: null }));
    }, 3500);
  };

  // Simülasyonda Sağlayıcı Olarak İşe Talip Olma
  const handleSimulateClaim = async (reqId) => {
    if (!currentProviderId) {
      showFeedback(reqId, 'error', 'Lütfen önce simüle edilecek bir sağlayıcı seçin.');
      return;
    }

    setActionLoadingId(reqId);
    const offer = offerMap[reqId] || {};

    try {
      await axios.post(`${API_BASE}/requests/${reqId}/join-pool`, {
        providerId: currentProviderId
      });

      if (offer.budget || offer.description) {
        await axios.post(`${API_BASE}/requests/${reqId}/providers/${currentProviderId}/details`, {
          providerBudget: offer.budget ? parseFloat(offer.budget) : null,
          providerCurrency: 'TRY',
          providerTargetDate: offer.targetDate ? new Date(offer.targetDate).toISOString() : null,
          providerDescription: offer.description || 'Simülasyon Teklifi'
        });
      }

      showFeedback(reqId, 'success', `${activeProvider.name} adına sıraya girildi!`);
      mutatePool();
      mutateAssigned();
    } catch (err) {
      console.error('Simülasyon talep hatası:', err);
      showFeedback(reqId, 'error', err?.response?.data?.message || 'İşlem başarısız.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="w-full space-y-5 font-sans">
      
      {/* SİMÜLASYON KONTROL PANELİ VE SAĞLAYICI SEÇİCİ */}
      <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-900 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            <Play size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-neutral-950 text-sm">Sağlayıcı Simülasyonu (Canlı Akan Talep)</h3>
              <span className="text-[10px] font-mono bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full font-bold">
                Admin Test Modu
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Havuzdaki talepleri canlı izleyin ve seçilen sağlayıcı profiliyle anında teklif verin.
            </p>
          </div>
        </div>

        {/* Sağlayıcı Değiştirici */}
        <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
          <label className="text-[10px] font-mono uppercase font-bold text-neutral-500 whitespace-nowrap">Simüle Edilen:</label>
          <select 
            value={selectedProviderId}
            onChange={(e) => setSelectedProviderId(e.target.value)}
            className="w-full md:w-48 p-2 text-xs rounded-lg border border-purple-300 bg-white font-bold outline-none focus:border-purple-600 shadow-xs cursor-pointer"
          >
            {providersList.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
            ))}
          </select>
        </div>
      </div>

      {/* SİMÜLASYON SEKMELERİ */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-xl border text-xs font-semibold">
          <button
            onClick={() => setSimTab('POOL')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              simTab === 'POOL' ? 'bg-white text-neutral-950' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Sparkles size={14} />
            <span>Açık Havuz</span>
            <span className="bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-mono text-[10px]">{poolRequests.length}</span>
          </button>
          
          <button
            onClick={() => setSimTab('ASSIGNED')}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              simTab === 'ASSIGNED' ? 'bg-white text-neutral-950' : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <Briefcase size={14} />
            <span>Gelen Görevler</span>
            <span className="bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded font-mono text-[10px]">{assignedRequests.length}</span>
          </button>
        </div>

        <button
          onClick={() => { mutatePool(); mutateAssigned(); }}
          className="p-2.5 text-neutral-500 hover:text-neutral-900 bg-white border border-neutral-200 rounded-xl transition cursor-pointer shadow-xs"
          title="Yenile"
        >
          <RefreshCw size={15} className={isPoolValidating ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* İÇERİK: HAVUZ EKRANI */}
      {simTab === 'POOL' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>Aşağıdaki talepler açık havuza düşen anlık taleplerdir. <strong>{activeProvider?.name || 'Seçili Sağlayıcı'}</strong> adına "Talip Ol" diyerek teklif iletebilirsiniz.</p>
          </div>

          {poolRequests.length === 0 ? (
            <div className="text-center py-16 text-neutral-400 text-sm bg-white rounded-2xl border border-dashed">
              Şu anda açık havuzda talep bulunmuyor.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {poolRequests.map(req => {
                const isLoading = actionLoadingId === req.id;
                const fb = feedbackMap[req.id];
                const currentOffer = offerMap[req.id] || { budget: '', targetDate: '', description: '' };

                return (
                  <div key={req.id} className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm hover:border-blue-300 transition-all space-y-4">
                    
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-neutral-400">#REQ-{req.id}</span>
                          <span className="text-[10px] font-mono text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded font-semibold">{safeDateTime(req.created_at)}</span>
                          {req.is_urgent && <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">ACİL</span>}
                        </div>
                        <h4 className="text-sm font-bold text-neutral-950">"{req.raw_text}"</h4>

                        {/* ⭐ YENİ: HAVUZDAKİ İŞİN ÜZERİNDE ETİKETLER ⭐ */}
                        {Array.isArray(req.tags) && req.tags.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            {req.tags.map((tagItem, tIdx) => (
                              <span 
                                key={tIdx} 
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-md text-[9px] font-mono font-bold flex items-center gap-1 shadow-2xs"
                              >
                                <Tag size={9} className="text-blue-500" />
                                #{String(tagItem).replace('#', '')}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-[11px] text-neutral-500 flex items-center gap-1 pt-1">
                          <MapPin size={12} className="text-neutral-400 shrink-0" />
                          <span>{extractAddress(req.location)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-50/80 rounded-xl border border-neutral-200 space-y-3">
                      <div className="text-[10px] font-bold text-emerald-700 flex items-center gap-1"><DollarSign size={12} /> Teklif Belirle</div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <input 
                          type="number" 
                          placeholder="Tutar (TRY)" 
                          value={currentOffer.budget} 
                          onChange={(e) => setOfferMap({ ...offerMap, [req.id]: { ...currentOffer, budget: e.target.value } })}
                          className="p-2 border rounded-lg outline-none focus:border-neutral-900 bg-white" 
                        />
                        <input 
                          type="datetime-local" 
                          value={currentOffer.targetDate} 
                          onChange={(e) => setOfferMap({ ...offerMap, [req.id]: { ...currentOffer, targetDate: e.target.value } })}
                          className="p-2 border rounded-lg outline-none focus:border-neutral-900 bg-white" 
                        />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Özel Not (Opsiyonel)" 
                        value={currentOffer.description} 
                        onChange={(e) => setOfferMap({ ...offerMap, [req.id]: { ...currentOffer, description: e.target.value } })}
                        className="w-full p-2 text-xs border rounded-lg outline-none focus:border-neutral-900 bg-white" 
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                      <div>
                        {fb && (
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded border animate-in fade-in ${fb.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                            {fb.message}
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleSimulateClaim(req.id)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        <span>Simüle Et & Talip Ol</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* İÇERİK: GELEN GÖREVLER */}
      {simTab === 'ASSIGNED' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
            <strong>{activeProvider?.name || 'Seçili Sağlayıcı'}</strong> üzerine atanmış veya onayı beklenen görevler.
          </div>

          {assignedRequests.length === 0 ? (
            <div className="text-center py-16 text-neutral-400 text-sm bg-white rounded-2xl border border-dashed">
              Bu sağlayıcıya atanmış bir görev bulunmuyor.
            </div>
          ) : (
            <div className="space-y-4">
              {assignedRequests.map(req => (
                <ProviderRequestCard
                  key={req.id}
                  req={req}
                  providerId={currentProviderId}
                  API_BASE={API_BASE}
                  onRefresh={mutateAssigned}
                  systemSettings={{}}
                  userLists={[]}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}