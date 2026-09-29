import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { 
  Briefcase, CheckCircle2, Clock, MapPin, Phone, MessageSquare, 
  Send, Sparkles, AlertCircle, Timer, Star, Check, X, RefreshCw,
  Folder, Calendar, DollarSign, FileText, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { 
  safeArray, safeUpper, extractAddress, extractGPS, 
  safeDateTime, calculateRemainingTime 
} from '../../../core/utils/helpers';
import CustomListsManager from '../../components/common/CustomListsManager';

const fetcher = (url) => axios.get(url).then(res => res.data);

// Tekil Talep Kartı (Form durumlarını bağımsız yönetmek için alt bileşen)
function ProviderRequestCard({ 
  req, 
  providerId, 
  API_BASE, 
  onRefresh, 
  systemSettings,
  userLists 
}) {
  const reqStatus = safeUpper(req.status) || 'MATCHED';
  
  // Tutar ve Tarih State'leri (Gelen verilerle varsayılan olarak dolar)
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
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Talep güncellendiğinde formu senkronize et
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

  // Sağlayıcı Detaylarını Kaydet (Tutar / Tarih / Açıklama)
  const saveDetails = async () => {
    await axios.post(`${API_BASE}/requests/${req.id}/providers/${providerId}/details`, {
      providerBudget: budget ? parseFloat(budget) : null,
      providerCurrency: 'TRY',
      providerTargetDate: targetDate ? new Date(targetDate).toISOString() : null,
      providerDescription: description || 'Tekrarlanan Sipariş Onayı'
    });
  };

  // İşi Kabul Et
  const handleAccept = async () => {
    setLoading(true);
    try {
      // 1. Önce güncel tutar ve tarihi veri tabanına yaz
      await saveDetails();
      // 2. Statüyü ACCEPTED yap
      await axios.post(`${API_BASE}/requests/${req.id}/status`, { newStatus: 'ACCEPTED' });
      alert('Sipariş kabul edildi ve detaylar müşteriye iletildi.');
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'İşlem sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // İşi Tamamla / Teslim Et
  const handleComplete = async () => {
    if (!window.confirm('Bu hizmeti tamamladığınızı bildirmek istiyor musunuz?')) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/requests/${req.id}/status`, { newStatus: 'PROVIDER_COMPLETED' });
      alert('Hizmet tamamlandı olarak işaretlendi. Müşteri onayı bekleniyor.');
      onRefresh();
    } catch (err) {
      alert('Hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Pas Geç (Sıradakine Devret)
  const handleSkip = async () => {
    if (!window.confirm('Bu talebi pas geçmek istediğinize emin misiniz? Sıradaki sağlayıcıya iletilecektir.')) return;
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/requests/${req.id}/next-provider`);
      onRefresh();
    } catch (err) {
      alert('Pas geçme işlemi başarısız.');
    } finally {
      setLoading(false);
    }
  };

  // Zamanlayıcı hesabı
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
          <p className="text-xs font-mono text-blue-700 mt-1 flex items-center gap-1">
            <Phone size={12} className="text-blue-500 shrink-0" />
            <span>{req.contact_value}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {reqStatus === 'MATCHED' && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200">
              Onayınızı Bekliyor
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

      {/* TUTAR VE TARİH FORMU / BİLGİ ALANI */}
      <div className="bg-neutral-50 rounded-xl border border-neutral-200/80 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
            <DollarSign size={14} className="text-emerald-600" />
            <span>Sipariş Şartları (Fiyat & Teslimat Tarihi)</span>
          </span>
          {reqStatus === 'MATCHED' && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              {isEditing ? 'Düzenlemeyi Kapat' : 'Şartları Düzenle'}
            </button>
          )}
        </div>

        {reqStatus === 'MATCHED' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] font-mono uppercase text-neutral-500 block mb-1 font-bold">
                Teklif Edilen Tutar (TRY) *
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
        ) : (
          <div className="flex flex-wrap gap-4 text-xs font-mono">
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
        )}
      </div>

      {/* KART BUTONLARI */}
      <div className="flex items-center justify-between pt-1 border-t border-neutral-100 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {reqStatus === 'ACCEPTED' && userLists?.length > 0 && (
            <div className="flex items-center gap-1">
              <select
                id={`prov-list-${req.id}`}
                className="p-1.5 text-xs rounded-lg border border-neutral-200 bg-white outline-none text-neutral-800"
              >
                <option value="">Listeye Kaydet...</option>
                {userLists.map(l => (
                  <option key={l.id} value={l.id}>{l.list_name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={async () => {
                  const selectEl = document.getElementById(`prov-list-${req.id}`);
                  if (!selectEl?.value) return alert('Lütfen bir liste seçin.');
                  try {
                    await axios.post(`${API_BASE}/lists/${selectEl.value}/requests`, { requestId: req.id });
                    alert('Listeye kaydedildi.');
                  } catch (e) {
                    alert('Hata oluştu.');
                  }
                }}
                className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Ekle
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {reqStatus === 'MATCHED' && (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={handleSkip}
                className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 border rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Pas Geç
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleAccept}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 transition"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />}
                <span>Şartları Onayla & İşi Kabul Et</span>
              </button>
            </>
          )}

          {reqStatus === 'ACCEPTED' && (
            <button
              type="button"
              disabled={loading}
              onClick={handleComplete}
              className="px-4 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={14} />}
              <span>İşi Teslim Et</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProviderDashboard() {
  const { session, API_BASE } = useAuth();
  const providerId = session?.id;

  const [activeTab, setActiveTab] = useState('ASSIGNED'); // 'ASSIGNED' | 'POOL' | 'LISTS'
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Sistem Ayarları
  const { data: rawSettings } = useSWR(`${API_BASE}/settings`, fetcher, { refreshInterval: 60000 });
  const systemSettings = rawSettings?.settings || { customer_selection_timeout_mins: 60, provider_completion_timeout_hours: 48 };

  // Sağlayıcıya Atanan İşler (MATCHED, ACCEPTED, vb.)
  const { data: assignedData, mutate: mutateAssigned, isValidating: isValidatingAssigned } = useSWR(
    providerId ? `${API_BASE}/requests/provider-requests?providerId=${providerId}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  // Açık Havuzdaki Talepler
  const { data: poolData, mutate: mutatePool } = useSWR(
    providerId && activeTab === 'POOL' ? `${API_BASE}/requests/pool?providerId=${providerId}` : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  // Sağlayıcı Listeleri
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

  // Filtrelenmiş İşler
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

  // Havuzdaki Talebe Talip Ol (Sıraya Gir)
  const handleJoinPool = async (requestId) => {
    try {
      await axios.post(`${API_BASE}/requests/${requestId}/join-pool`, { providerId });
      alert('Talebe talip oldunuz. Müşteri sizi seçtiğinde bildirim alacaksınız.');
      mutatePool();
      mutateAssigned();
    } catch (err) {
      alert(err.response?.data?.message || 'Havuz işleminde hata oluştu.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 px-4 py-8">
      {/* ÜST BAŞLIK & SEKMELER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-neutral-950 flex items-center gap-2">
            <span>Sağlayıcı Paneli</span>
            <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
              v1.9.0-SYNC
            </span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {session?.name || 'Hizmet Sağlayıcı'} • {session?.phone}
          </p>
        </div>

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
      </div>

      {/* GÖREVLERİM SEKMESİ */}
      {activeTab === 'ASSIGNED' && (
        <div className="space-y-4">
          {/* FİLTRE BUTONLARI */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
            <div className="flex items-center gap-1.5">
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

            <button
              type="button"
              onClick={() => mutateAssigned()}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 bg-white border border-neutral-200 rounded-lg transition shrink-0 cursor-pointer shadow-xs"
              title="Listeyi Yenile"
            >
              <RefreshCw size={14} className={isValidatingAssigned ? 'animate-spin' : ''} />
            </button>
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

      {/* AÇIK HAVUZ SEKMESİ */}
      {activeTab === 'POOL' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900">
            Aşağıdaki talepler hizmet anahtar kelimelerinizle eşleşen açık havuz talepleridir. 
            <strong> "Talip Ol"</strong> butonuna basarak sıraya girebilirsiniz. Müşteri sizi seçtiğinde görevlerinize düşecektir.
          </div>

          {poolRequests.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-xs bg-white rounded-xl border border-dashed">
              Şu anda hizmet alanınıza uygun açık havuz talebi bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {poolRequests.map(req => (
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

                  <button
                    type="button"
                    onClick={() => handleJoinPool(req.id)}
                    className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                  >
                    <Send size={13} />
                    <span>Talebe Talip Ol</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LİSTELERİM SEKMESİ */}
      {activeTab === 'LISTS' && (
        <CustomListsManager
          ownerType="PROVIDER"
          ownerId={session?.phone}
          onReworkRequest={(origReq) => {
            alert(`Bu talep (#REQ-${origReq.id}) üzerinden müşteriye doğrudan ulaşıp yeni sipariş oluşturabilirsiniz.`);
          }}
          onDirectReorder={(origReq) => {
            alert(`Talep (#REQ-${origReq.id}) için müşteriye sipariş hatırlatması gönderildi.`);
          }}
        />
      )}
    </div>
  );
}