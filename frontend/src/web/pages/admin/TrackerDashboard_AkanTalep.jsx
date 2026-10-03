import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Activity, MapPin, Phone, Clock, DollarSign, AlignLeft,
  Send, ShieldCheck, Check, AlertCircle, RefreshCw, Loader2,
  ChevronDown, ChevronUp, Radio, User, Flame, Tag, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import {
  safeArray, safeUpper, extractAddress, extractGPS,
  safeDateTime, calculateRemainingTime
} from '../../../core/utils/helpers';
import { UniversalMapController } from '../../components/maps/MapComponents';

const fetcher = (url) => axios.get(url).then(res => res.data);

// Harita İkonları
const createMarkerIcon = (color, label) => {
  return new L.DivIcon({
    html: `
      <div style="
        background-color: ${color};
        color: white;
        border: 2px solid white;
        border-radius: 9999px;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
        padding: 4px 8px;
        font-size: 10px;
        font-weight: 800;
        display: flex;
        align-items: center;
        gap: 4px;
        white-space: nowrap;
        transform: translate(-50%, -100%);
      ">
        <span>${label}</span>
      </div>
    `,
    className: '',
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  });
};

export default function TrackerDashboard() {
  const { session, API_BASE } = useAuth();
  const defaultPosition = useMemo(() => ({ lat: 41.0082, lng: 28.9784 }), []);

  // Aktif sağlayıcı kimliği
  const activeProviderId = session?.id || 113;

  // 1. Havuz Talepleri (Haritada ve listede gösterilir)
  const { data: poolData, mutate: mutatePool } = useSWR(
    `${API_BASE}/requests/pool?providerId=${activeProviderId}`,
    fetcher,
    { refreshInterval: 3000, revalidateOnFocus: true }
  );

  // 2. Sağlayıcıya Eşleşen/Atanan Talepler
  const { data: assignedData, mutate: mutateAssigned } = useSWR(
    `${API_BASE}/requests/provider-requests?providerId=${activeProviderId}&phone=${encodeURIComponent(session?.phone || '')}`,
    fetcher,
    { refreshInterval: 2500, revalidateOnFocus: true }
  );

  const poolRequests = useMemo(() => safeArray(poolData?.poolRequests), [poolData]);
  const assignedRequests = useMemo(() => safeArray(assignedData?.requests), [assignedData]);

  // Tüm harita talepleri (Havuz + Atananlar tekilleştirilerek)
  const allMapRequests = useMemo(() => {
    const map = new Map();
    assignedRequests.forEach(r => map.set(r.id, { ...r, source: 'ASSIGNED' }));
    poolRequests.forEach(r => {
      if (!map.has(r.id)) map.set(r.id, { ...r, source: 'POOL' });
    });
    return Array.from(map.values());
  }, [poolRequests, assignedRequests]);

  const [selectedReqId, setSelectedReqId] = useState(null);
  const selectedReq = useMemo(() => {
    return allMapRequests.find(r => r.id === selectedReqId) || allMapRequests[0] || null;
  }, [allMapRequests, selectedReqId]);

  // Harita odağı
  const mapCenter = useMemo(() => {
    if (selectedReq?.location) {
      const coords = extractGPS(selectedReq.location);
      if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        return { lat: coords[0], lng: coords[1] };
      }
    }
    return defaultPosition;
  }, [selectedReq, defaultPosition]);

  // Teklif Formu State'leri
  const [isBidFormOpen, setIsBidFormOpen] = useState(false);
  const [bidData, setBidData] = useState({ budget: '', targetDate: '', description: '' });
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  const showFeedback = (type, text) => {
    setActionFeedback({ type, text });
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Seçilen talep değiştikçe teklif alanlarını güncelle
  useEffect(() => {
    if (selectedReq) {
      setBidData({
        budget: selectedReq.provider_budget ?? selectedReq.matched_budget ?? '',
        targetDate: (() => {
          const rawDate = selectedReq.provider_target_date || selectedReq.matched_target_date;
          if (!rawDate) return '';
          try {
            const d = new Date(rawDate);
            return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          } catch {
            return '';
          }
        })(),
        description: selectedReq.provider_description || ''
      });
      setIsBidFormOpen(false);
    }
  }, [selectedReq?.id]);

  // ⭐ 1. HAVUZDAN TEKLİF İLE SIRAYA GİR
  const handleJoinPoolWithBid = async (requestId) => {
    const actionKey = `join_${requestId}`;
    setActionLoadingKey(actionKey);
    try {
      const requests = [
        axios.post(`${API_BASE}/requests/${requestId}/join-pool`, { providerId: activeProviderId })
      ];

      if (bidData.budget || bidData.targetDate || bidData.description) {
        requests.push(
          axios.post(`${API_BASE}/requests/${requestId}/providers/${activeProviderId}/details`, {
            providerBudget: bidData.budget !== '' ? parseFloat(bidData.budget) : null,
            providerCurrency: 'TRY',
            providerTargetDate: bidData.targetDate ? new Date(bidData.targetDate).toISOString() : null,
            providerDescription: bidData.description || ''
          })
        );
      }

      await Promise.all(requests);
      showFeedback('success', 'Teklif iletildi & sıraya girildi');
      setIsBidFormOpen(false);
      mutatePool();
      mutateAssigned();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'İşlem yapılamadı');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // ⭐ 2. SAĞLAYICI KABUL ETME & ŞARTLARI ONAYLAMA
  const handleAcceptRequest = async (requestId) => {
    const actionKey = `accept_${requestId}`;
    setActionLoadingKey(actionKey);
    try {
      const requests = [
        axios.post(`${API_BASE}/requests/${requestId}/status`, { newStatus: 'ACCEPTED' }),
        axios.post(`${API_BASE}/requests/${requestId}/providers/${activeProviderId}/details`, {
          providerBudget: bidData.budget !== '' ? parseFloat(bidData.budget) : null,
          providerCurrency: 'TRY',
          providerTargetDate: bidData.targetDate ? new Date(bidData.targetDate).toISOString() : null,
          providerDescription: bidData.description || ''
        })
      ];

      await Promise.all(requests);
      showFeedback('success', 'Şartlar onaylandı ve iş kabul edildi');
      mutateAssigned();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Onaylanamadı');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // ⭐ 3. SAĞLAYICI TESLİM ETME
  const handleCompleteRequest = async (requestId) => {
    const actionKey = `complete_${requestId}`;
    setActionLoadingKey(actionKey);
    try {
      await axios.post(`${API_BASE}/requests/${requestId}/status`, { newStatus: 'PROVIDER_COMPLETED' });
      showFeedback('success', 'Teslimat bildirildi');
      mutateAssigned();
    } catch (err) {
      showFeedback('error', 'Teslimat iletilemedi');
    } finally {
      setActionLoadingKey(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-4 px-4 py-6">
      {/* ÜST BAŞLIK */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
            <Activity size={18} className="text-emerald-600" />
            <span>Canlı Talep & Harita Takip Ekranı</span>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              CANLI GPS
            </span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Harita üzerindeki talepleri inceleyin, şartlarınızı sunarak sıraya girin veya atanan işi yönetin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {actionFeedback && (
            <div className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {actionFeedback.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
              <span>{actionFeedback.text}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => { mutatePool(); mutateAssigned(); }}
            className="p-2 bg-neutral-950 text-white rounded-xl hover:bg-neutral-800 transition cursor-pointer shadow-xs"
            title="Yenile"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ANA GÖVDE: SOL HARİTA (65%) - SAĞ DETAY & TEKLİF FORMU (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[620px]">
        {/* HARİTA ALANI */}
        <div className="lg:col-span-8 h-[550px] lg:h-[650px] rounded-2xl overflow-hidden border border-neutral-200 shadow-xs relative bg-neutral-100">
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <ZoomControl position="bottomright" />
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
            <UniversalMapController center={[mapCenter.lat, mapCenter.lng]} />

            {allMapRequests.map((req) => {
              const coords = extractGPS(req.location);
              if (!coords || coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) return null;

              const isSelected = selectedReq?.id === req.id;
              const isAssigned = req.source === 'ASSIGNED';
              const markerColor = isAssigned ? '#059669' : '#2563eb';
              const markerLabel = `#${req.id} ${isAssigned ? 'GÖREV' : 'HAVUZ'}`;

              return (
                <Marker
                  key={req.id}
                  position={[coords[0], coords[1]]}
                  icon={createMarkerIcon(markerColor, markerLabel)}
                  eventHandlers={{
                    click: () => setSelectedReqId(req.id)
                  }}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-neutral-900">#REQ-{req.id}</p>
                      <p className="text-neutral-700">"{req.raw_text}"</p>
                      <p className="text-[10px] text-neutral-500 font-mono">{extractAddress(req.location)}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* HARİTA İÇİ HIZLI TALEP LİSTESİ (ALT ŞERİT) */}
          <div className="absolute bottom-3 left-3 right-14 z-[1000] flex gap-2 overflow-x-auto pb-1">
            {allMapRequests.map(r => {
              const isSelected = selectedReq?.id === r.id;
              const isAssigned = r.source === 'ASSIGNED';

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReqId(r.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 backdrop-blur-md border shadow-sm cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-950 text-white border-neutral-950'
                      : 'bg-white/90 text-neutral-800 border-white/60 hover:bg-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isAssigned ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                  <span>#{r.id}</span>
                  <span className="text-[10px] opacity-75 truncate max-w-[120px]">{r.raw_text}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SAĞ PANEL: SEÇİLİ TALEP DETAYI, TEKLİF FORMU & İLETİŞİM */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs space-y-4">
          {!selectedReq ? (
            <div className="py-20 text-center text-xs text-neutral-400">
              Haritadan veya aşağıdaki listeden bir talep seçin.
            </div>
          ) : (
            <>
              {/* TALEP BAŞLIĞI */}
              <div className="space-y-1 pb-3 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-neutral-400">#REQ-{selectedReq.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedReq.source === 'ASSIGNED' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                      {selectedReq.source === 'ASSIGNED' ? 'GÖREVİMDE' : 'AÇIK HAVUZ'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">{safeDateTime(selectedReq.created_at)}</span>
                </div>

                <h3 className="text-sm font-bold text-neutral-900 pt-1 leading-snug">
                  "{selectedReq.raw_text}"
                </h3>

                <p className="text-xs text-neutral-500 flex items-center gap-1 pt-0.5">
                  <MapPin size={12} className="text-neutral-400 shrink-0" />
                  <span>{extractAddress(selectedReq.location)}</span>
                </p>
              </div>

              {/* ⭐ MÜŞTERİ İLETİŞİM ALANI (MÜŞTERİ SEÇTİĞİNDE AÇILIR) ⭐ */}
              {selectedReq.matched_provider_id === activeProviderId ? (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
                    <ShieldCheck size={13} className="text-emerald-700" />
                    <span>Müşteri Sizi Seçti • İletişim Açık</span>
                  </span>
                  <div className="flex items-center gap-2 pt-0.5">
                    <Phone size={14} className="text-emerald-700" />
                    <span className="text-xs font-mono font-black text-neutral-900">
                      {selectedReq.contact_value || 'Belirtilmedi'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-400 text-xs flex items-center gap-2">
                  <Phone size={13} />
                  <span className="text-[11px] font-medium">İletişim bilgisi müşteri sizi seçtikten sonra açılacaktır.</span>
                </div>
              )}

              {/* ⭐ TEKLİF & ŞARTLAR FORMU (TUTAR, TARİH, AÇIKLAMA) ⭐ */}
              <div className="p-3.5 bg-neutral-50/80 border border-neutral-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                    <DollarSign size={14} className="text-emerald-600" />
                    <span>Teklif Şartları (Fiyat, Tarih & Not)</span>
                  </span>
                  {selectedReq.source === 'POOL' && (
                    <button
                      type="button"
                      onClick={() => setIsBidFormOpen(!isBidFormOpen)}
                      className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      {isBidFormOpen ? 'Gizle' : 'Düzenle'}
                    </button>
                  )}
                </div>

                {/* HAVUZDAYSA VE FORM AÇIKSA VEYA EŞLEŞMİŞSE DÜZENLENEBİLİR ALANLAR */}
                {(isBidFormOpen || selectedReq.status === 'MATCHED') ? (
                  <div className="space-y-2.5 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold uppercase text-neutral-600 block mb-1">
                          Tutar (TRY) *
                        </label>
                        <input
                          type="number"
                          placeholder="Örn: 600"
                          value={bidData.budget}
                          onChange={(e) => setBidData(prev => ({ ...prev, budget: e.target.value }))}
                          className="w-full p-2 text-xs font-mono font-bold bg-white border border-neutral-300 rounded-lg outline-none focus:border-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase text-neutral-600 block mb-1">
                          Hedef Teslimat *
                        </label>
                        <input
                          type="datetime-local"
                          value={bidData.targetDate}
                          onChange={(e) => setBidData(prev => ({ ...prev, targetDate: e.target.value }))}
                          className="w-full p-2 text-xs font-mono bg-white border border-neutral-300 rounded-lg outline-none focus:border-neutral-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold uppercase text-neutral-600 mb-1 flex items-center gap-1">
                        <AlignLeft size={10} />
                        <span>Açıklama / Özel Not</span>
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Müşteriye teklif şartınızı yazın..."
                        value={bidData.description}
                        onChange={(e) => setBidData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full p-2 text-xs bg-white border border-neutral-300 rounded-lg outline-none focus:border-neutral-900 resize-none font-medium"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Kayıtlı Tutar:</span>
                      <strong className="text-emerald-700 font-bold">
                        {bidData.budget ? `${new Intl.NumberFormat('tr-TR').format(Number(bidData.budget))} TRY` : 'Belirtilmedi'}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Hedef Tarih:</span>
                      <strong className="text-neutral-900 font-bold">
                        {bidData.targetDate ? safeDateTime(bidData.targetDate) : 'Belirtilmedi'}
                      </strong>
                    </div>
                    {bidData.description && (
                      <p className="text-[11px] font-sans italic text-neutral-700 bg-white p-2 rounded border border-neutral-200 mt-1">
                        "{bidData.description}"
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* AKSİYON BUTONLARI */}
              <div className="pt-2">
                {selectedReq.source === 'POOL' && (
                  <button
                    type="button"
                    disabled={actionLoadingKey === `join_${selectedReq.id}`}
                    onClick={() => handleJoinPoolWithBid(selectedReq.id)}
                    className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    {actionLoadingKey === `join_${selectedReq.id}` ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} />
                    )}
                    <span>Teklifi İlet & Sıraya Gir</span>
                  </button>
                )}

                {selectedReq.source === 'ASSIGNED' && selectedReq.status === 'MATCHED' && (
                  <button
                    type="button"
                    disabled={actionLoadingKey === `accept_${selectedReq.id}`}
                    onClick={() => handleAcceptRequest(selectedReq.id)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    {actionLoadingKey === `accept_${selectedReq.id}` ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                    <span>Şartları Onayla & İşi Kabul Et</span>
                  </button>
                )}

                {selectedReq.source === 'ASSIGNED' && selectedReq.status === 'ACCEPTED' && (
                  <button
                    type="button"
                    disabled={actionLoadingKey === `complete_${selectedReq.id}`}
                    onClick={() => handleCompleteRequest(selectedReq.id)}
                    className="w-full py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    {actionLoadingKey === `complete_${selectedReq.id}` ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    <span>İşi Teslim Et</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}