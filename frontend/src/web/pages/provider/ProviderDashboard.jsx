import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Phone, Edit3, User, Clock, MapPin, Trash2, Layers, ChevronUp, ChevronDown, ShieldCheck, MessageCircle } from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { safeArray, safeString, safeDateTime, getProviderContactDisplay, extractAddress, extractPhoneForWa } from '../../../core/utils/helpers';

export default function ProviderDashboard() {
  const { session, API_BASE } = useAuth();
  
  const [providerProfile, setProviderProfile] = useState(null);
  const [providerRequests, setProviderRequests] = useState([]);
  const [poolRequests, setPoolRequests] = useState([]); 
  const [hiddenPoolRequests, setHiddenPoolRequests] = useState([]); 
  const [isPoolOpen, setIsPoolOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [providerFormData, setProviderFormData] = useState({ 
    name: '', phone: '', email: '', serviceKeywords: '', communicationChannels: ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'], priorityScore: 100 
  });

  const fetchProviderData = async (shouldUpdateForm = false) => {
    if (!session?.phone) return;
    try {
      // API Call mantığı aynen korundu
      const pRes = await axios.get(`${API_BASE}/providers/by-phone?phone=${encodeURIComponent(session.phone)}`);
      const prov = pRes?.data?.provider;
      
      if (!prov) {
         setProviderProfile(null);
         return;
      }
      
      setProviderProfile(prov);

      if (shouldUpdateForm) {
        setProviderFormData({
          name: prov.name || '', phone: prov.phone || '', email: prov.email || '',
          serviceKeywords: safeArray(prov.service_keywords).join(', '),
          communicationChannels: safeArray(prov.communication_channels).length ? prov.communication_channels : ['PHONE', 'SMS', 'EMAIL', 'WHATSAPP'],
          priorityScore: prov.priority_score || 100
        });
      }

      const rRes = await axios.get(`${API_BASE}/requests/provider-requests?providerId=${prov.id}&phone=${encodeURIComponent(session.phone)}`);
      setProviderRequests(safeArray(rRes?.data?.requests));

      const poolRes = await axios.get(`${API_BASE}/requests/pool?providerId=${prov.id}`);
      setPoolRequests(safeArray(poolRes?.data?.poolRequests));
    } catch (err) {
      if (err.response?.status === 404) { setProviderProfile(null); setProviderRequests([]); setPoolRequests([]); }
    }
  };

  useEffect(() => {
    fetchProviderData(true);
    const interval = setInterval(() => fetchProviderData(false), 5000);
    return () => clearInterval(interval);
  }, [session]);

  const handleSaveProviderProfile = async (e) => { 
    e.preventDefault(); 
    const keywordsArray = safeString(providerFormData.serviceKeywords).split(',').map(k => k.trim().toLowerCase()).filter(Boolean); 
    const payload = { name: providerFormData.name.trim(), phone: session.phone, email: providerFormData.email ? providerFormData.email.trim() : null, serviceKeywords: keywordsArray.slice(0, 50), communicationChannels: providerFormData.communicationChannels, priorityScore: parseInt(providerFormData.priorityScore, 10) || 100 }; 
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

  const handleStatusChange = async (requestId, newStatus) => { 
    try { await axios.post(`${API_BASE}/requests/${Number(requestId)}/status`, { newStatus }); await fetchProviderData(false); } catch (err) {} 
  };

  const handleProviderSkip = async (requestId) => {
    if (!window.confirm('Bu talebi pas geçmek istediğinize emin misiniz?')) return;
    try { await axios.post(`${API_BASE}/requests/${Number(requestId)}/status`, { newStatus: 'PROVIDER_SKIPPED' }); await fetchProviderData(false); } catch (err) { alert('İşlem başarısız oldu.'); }
  };

  const handleJoinPool = async (requestId) => { 
    if (!providerProfile) { alert("Önce profilinizi oluşturup kaydetmelisiniz!"); return; } 
    try { 
        await axios.post(`${API_BASE}/requests/${requestId}/join-pool`, { providerId: providerProfile.id }); 
        await fetchProviderData(false); 
        alert('Başarıyla sıraya girdiniz!');
    } catch (err) { alert(err.response?.data?.message || 'İşlem başarısız veya zaten sıradaydınız.'); } 
  };

  const activeProviderRequests = safeArray(providerRequests).filter(r => r && ['MATCHED', 'ACCEPTED', 'PROVIDER_COMPLETED'].includes(safeString(r.status).toUpperCase()));
  const visiblePoolRequests = safeArray(poolRequests).filter(req => !hiddenPoolRequests.includes(req.id));

  return (
    <div className="max-w-3xl mx-auto w-full space-y-5 p-6 md:p-8">
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-neutral-950 tracking-tight">{providerProfile?.name ? providerProfile.name : 'Sağlayıcı Paneli'}</h2>
              <div className="flex items-center space-x-1.5 text-xs text-neutral-500 font-mono mt-1"><Phone size={12} /><span>{session.phone}</span></div>
            </div>
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="px-3.5 py-1.5 border hover:bg-neutral-50 text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-sm"><Edit3 size={13} /><span>Profili Düzenle</span></button>
        </div>

        {isProfileOpen && (
          <form onSubmit={handleSaveProviderProfile} className="bg-white p-5 rounded-2xl border shadow-sm space-y-3.5">
            <input type="text" required value={providerFormData.name} onChange={(e) => setProviderFormData({ ...providerFormData, name: e.target.value })} placeholder="İşletme Adı" className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950" />
            <textarea rows={3} required value={providerFormData.serviceKeywords} onChange={(e) => setProviderFormData({ ...providerFormData, serviceKeywords: e.target.value })} placeholder="Anahtar kelimeleriniz (virgülle ayırın)" className="w-full p-2 text-xs rounded-lg border outline-none focus:border-neutral-950" />
            <button type="submit" className="px-4 py-2 bg-neutral-950 text-white rounded-xl text-xs font-semibold">Profili Kaydet</button>
          </form>
        )}

        {/* AKTİF İŞLERİM */}
        <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-mono uppercase font-bold text-neutral-950">Aktif İşlerim ({activeProviderRequests.length})</h3>
          <div className="space-y-3">
            {activeProviderRequests.map((req) => (
              <div key={req.id} className="bg-[#FAFBFD] p-4 rounded-xl border space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-neutral-900 leading-snug">"{req.raw_text}" - <span className="text-[10px] bg-blue-100 text-blue-800 px-2 rounded">{req.status}</span></p>
                    {req.created_at && <span className="text-[10px] font-mono text-neutral-400 shrink-0">{safeDateTime(req.created_at)}</span>}
                  </div>
                  <p className="text-xs text-neutral-700 mt-2 flex items-center space-x-1.5"><User size={13} className="text-neutral-400" /><span>Müşteri: <strong>{getProviderContactDisplay(req)}</strong></span></p>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-neutral-100">
                    {req.status === 'MATCHED' && safeString(req.contact_value).includes('|SHARED') && (
                      <div className="flex space-x-2"><button onClick={() => handleStatusChange(req.id, 'ACCEPTED')} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold">İşi Kabul Et</button><button onClick={() => handleProviderSkip(req.id)} className="px-3 py-1.5 border text-rose-600 rounded-lg text-xs font-semibold">Pas Geç</button></div>
                    )}
                    {req.status === 'MATCHED' && safeString(req.contact_value).includes('|HIDDEN') && (
                      <div className="flex items-center space-x-2"><span className="px-3 py-1.5 bg-neutral-100 text-neutral-500 rounded-lg text-xs font-semibold border border-neutral-200">Müşteri Onayı Bekleniyor</span><button onClick={() => handleProviderSkip(req.id)} className="px-3 py-1.5 border text-rose-600 rounded-lg text-xs font-semibold">Pas Geç</button></div>
                    )}
                    {req.status === 'ACCEPTED' && (
                      <><button onClick={() => handleStatusChange(req.id, 'PROVIDER_COMPLETED')} className="px-3 py-1.5 bg-neutral-950 text-white rounded-lg text-xs font-semibold shadow-sm">Teslim Et</button>
                        {safeString(req.preferred_channel).includes('WHATSAPP') && req.contact_value && (
                          <a href={`https://wa.me/${extractPhoneForWa(req.contact_value)}?text=${encodeURIComponent('Merhaba, "' + req.raw_text + '" talebinizi aldım. Size nasıl yardımcı olabilirim?')}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5"><MessageCircle size={14} /><span>WhatsApp'tan Yaz</span></a>
                        )}
                      </>
                    )}
                  </div>
              </div>
            ))}
          </div>
        </div>

        {/* AÇIK TALEP HAVUZU */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all">
          <div onClick={() => setIsPoolOpen(!isPoolOpen)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50 select-none transition">
            <h3 className="text-xs font-mono uppercase font-bold text-neutral-700 flex items-center space-x-1.5"><Layers size={14} className="text-blue-500" /><span>Açık Talep Havuzu ({visiblePoolRequests.length})</span></h3>
            <div className="text-neutral-400">{isPoolOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
          </div>
          
          {isPoolOpen && (
            <div className="p-4 pt-0 border-t border-neutral-100 bg-neutral-50/30">
              <div className="space-y-3 mt-3 max-h-[400px] overflow-y-auto pr-1">
                {visiblePoolRequests.length === 0 ? (<div className="text-center text-xs text-neutral-400 py-6">Havuzda size uygun yeni talep bulunmuyor.</div>) : (
                  visiblePoolRequests.map((req) => (
                    <div key={req.id} className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm transition hover:shadow-md">
                      <p className="text-sm font-semibold text-neutral-900 leading-snug">"{req.raw_text}"</p>
                      <div className="space-y-1.5 mt-2.5 mb-3 text-[10px] text-neutral-500 font-mono">
                         <p className="flex items-center space-x-1.5 text-blue-600 font-semibold"><Clock size={11}/><span>{safeDateTime(req.created_at)}</span></p>
                         <p className="flex items-center space-x-1.5"><User size={11}/><span>{getProviderContactDisplay(req)}</span></p>
                         {req.location && <p className="flex items-center space-x-1.5"><MapPin size={11}/><span>{extractAddress(req.location)}</span></p>}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
                        <button onClick={() => handleJoinPool(req.id)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition">Sıraya Gir</button>
                        <button onClick={() => setHiddenPoolRequests(prev => [...prev, req.id])} className="px-3 py-1.5 border hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-neutral-500 rounded-lg text-xs font-semibold transition flex items-center space-x-1"><Trash2 size={12}/><span>Kaldır</span></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}