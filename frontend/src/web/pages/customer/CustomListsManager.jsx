import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Folder, Plus, Trash2, Phone, User, Loader2, FileText, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { safeArray } from '../../../core/utils/helpers';

export default function CustomListsManager({ ownerType, ownerId, onSelectRequest }) {
  const { API_BASE } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newListName, setNewListName] = useState('');
  const [activeListId, setActiveListId] = useState(null);
  
  const [addMode, setAddMode] = useState('REQUEST');
  const [newItem, setNewItem] = useState({ contactName: '', contactPhone: '', notes: '' });
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [availableRequests, setAvailableRequests] = useState([]);

  const fetchLists = async () => {
    if (!ownerType || !ownerId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/lists/${ownerType}/${ownerId}`);
      if (res.data && res.data.status === 'success') {
        setLists(res.data.lists);
      }
    } catch (err) {
      console.error('Listeler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRequests = async () => {
    try {
      const endpoint = ownerType === 'CUSTOMER' 
        ? `${API_BASE}/requests/my-requests?phone=${encodeURIComponent(ownerId)}`
        : `${API_BASE}/requests/provider-requests?providerPhone=${encodeURIComponent(ownerId)}`;
      
      const res = await axios.get(endpoint);
      if (res.data && res.data.requests) {
        setAvailableRequests(safeArray(res.data.requests));
      }
    } catch (err) {
      console.error('Talepler yüklenemedi:', err);
    }
  };

  useEffect(() => {
    fetchLists();
    fetchAvailableRequests();
  }, [ownerType, ownerId]);

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      await axios.post(`${API_BASE}/lists`, {
        ownerType,
        ownerId,
        listName: newListName.trim()
      });
      setNewListName('');
      fetchLists();
    } catch (err) {
      alert('Liste oluşturulamadı.');
    }
  };

  const handleAddContactItem = async (listId, e) => {
    e.preventDefault();
    if (!newItem.contactName.trim() || !newItem.contactPhone.trim()) {
      alert('İsim ve telefon zorunludur.');
      return;
    }
    try {
      await axios.post(`${API_BASE}/lists/${listId}/items`, newItem);
      setNewItem({ contactName: '', contactPhone: '', notes: '' });
      setActiveListId(null);
      fetchLists();
    } catch (err) {
      alert('Kişi eklenemedi.');
    }
  };

  const handleAddRequestItem = async (listId, e) => {
    e.preventDefault();
    if (!selectedRequestId) {
      alert('Lütfen bir talep seçin.');
      return;
    }
    try {
      await axios.post(`${API_BASE}/lists/${listId}/requests`, { requestId: selectedRequestId });
      setSelectedRequestId('');
      setActiveListId(null);
      fetchLists();
    } catch (err) {
      alert(err.response?.data?.message || 'Talep listeye eklenemedi.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Bu öğeyi listeden çıkarmak istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API_BASE}/lists/items/${itemId}`);
      fetchLists();
    } catch (err) {
      alert('Öğe silinemedi.');
    }
  };

  const cleanPhoneNumber = (phoneStr) => {
    if (!phoneStr) return '';
    return phoneStr.split('|')[0].trim();
  };

  if (loading) {
    return <div className="flex justify-center p-6"><Loader2 className="animate-spin text-neutral-400" size={24} /></div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-6 shadow-sm">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h3 className="text-lg font-bold text-neutral-950 flex items-center gap-2">
            <Folder size={20} className="text-neutral-700" />
            <span>Listelerim ({lists.length})</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">Taleplerinizi veya iş ortaklarınızı listeler altında organize edin.</p>
        </div>

        <form onSubmit={handleCreateList} className="flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Yeni liste adı..." 
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-neutral-200 outline-none focus:border-neutral-900 bg-neutral-50 w-52"
          />
          <button type="submit" className="px-4 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition flex items-center gap-1 shrink-0 cursor-pointer">
            <Plus size={14} />
            <span>Liste Oluştur</span>
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {lists.length === 0 ? (
          <div className="text-center py-10 text-neutral-400 text-xs bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
            Henüz hiç liste oluşturmadınız. Yukarıdan yeni bir liste ekleyerek başlayın.
          </div>
        ) : (
          lists.map((list) => {
            const isAddingToThis = activeListId === list.id;
            
            // ⭐ Bu listede zaten ekli olan request_id'leri filtreleyelim ki tekrar seçilemesin
            const existingRequestIdsInList = safeArray(list.items).map(i => Number(i.request_id)).filter(Boolean);
            const filteredAvailableRequests = availableRequests.filter(req => !existingRequestIdsInList.includes(Number(req.id)));

            return (
              <div key={list.id} className="bg-neutral-50/70 rounded-xl border border-neutral-200 overflow-hidden transition">
                
                <div className="p-4 flex items-center justify-between bg-white border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900">{list.list_name}</span>
                    <span className="text-[10px] font-mono bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
                      {list.items ? list.items.length : 0} Öğe
                    </span>
                  </div>

                  <button 
                    onClick={() => setActiveListId(isAddingToThis ? null : list.id)} 
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${isAddingToThis ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-neutral-950 text-white hover:bg-neutral-800'}`}
                  >
                    <Plus size={14} className={isAddingToThis ? 'rotate-45 transition-transform' : 'transition-transform'} />
                    <span>{isAddingToThis ? 'İptal Et' : '+ Öğe Ekle'}</span>
                  </button>
                </div>

                {isAddingToThis && (
                  <div className="p-4 bg-blue-50/40 border-b border-blue-100 space-y-3 animate-in fade-in duration-200">
                    <div className="flex gap-2 text-xs">
                      <button 
                        type="button" 
                        onClick={() => setAddMode('REQUEST')} 
                        className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${addMode === 'REQUEST' ? 'bg-neutral-950 text-white shadow-sm' : 'bg-white text-neutral-600 border border-neutral-200'}`}
                      >
                        Sistemden Talep Ekle
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setAddMode('CONTACT')} 
                        className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${addMode === 'CONTACT' ? 'bg-neutral-950 text-white shadow-sm' : 'bg-white text-neutral-600 border border-neutral-200'}`}
                      >
                        Manuel Kişi / Firma Ekle
                      </button>
                    </div>

                    {addMode === 'REQUEST' ? (
                      <form onSubmit={(e) => handleAddRequestItem(list.id, e)} className="flex items-center gap-2">
                        <select 
                          value={selectedRequestId} 
                          onChange={(e) => setSelectedRequestId(e.target.value)}
                          className="flex-1 p-2 text-xs rounded-lg border border-neutral-200 bg-white outline-none focus:border-neutral-900 font-medium"
                        >
                          <option value="">-- Listeye Eklemek İçin Bir Talep Seçin --</option>
                          {filteredAvailableRequests.length === 0 ? (
                            <option disabled>Eklenebilecek başka talep kalmadı (Tümü ekli)</option>
                          ) : (
                            filteredAvailableRequests.map((req) => (
                              <option key={req.id} value={req.id}>
                                #REQ-{req.id} - "{req.raw_text}" ({req.status})
                              </option>
                            ))
                          )}
                        </select>
                        <button type="submit" className="px-5 py-2 bg-neutral-950 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition cursor-pointer shrink-0 shadow-sm">
                          Seçilen Talebi Ekle
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={(e) => handleAddContactItem(list.id, e)} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <div className="sm:col-span-4">
                          <input 
                            type="text" 
                            placeholder="İsim / Firma Adı *" 
                            value={newItem.contactName}
                            onChange={(e) => setNewItem({ ...newItem, contactName: e.target.value })}
                            className="w-full p-2 text-xs rounded-lg border border-neutral-200 bg-white outline-none focus:border-neutral-900"
                            required
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <input 
                            type="tel" 
                            placeholder="Telefon Numarası *" 
                            value={newItem.contactPhone}
                            onChange={(e) => setNewItem({ ...newItem, contactPhone: e.target.value })}
                            className="w-full p-2 text-xs font-mono rounded-lg border border-neutral-200 bg-white outline-none focus:border-neutral-900"
                            required
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input 
                            type="text" 
                            placeholder="Not (Opsiyonel)..." 
                            value={newItem.notes}
                            onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                            className="w-full p-2 text-xs rounded-lg border border-neutral-200 bg-white outline-none focus:border-neutral-900"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <button type="submit" className="w-full py-2 bg-neutral-950 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition cursor-pointer shadow-sm">
                            Ekle
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* LİSTEDEKİ ÖĞELER VE REWORK / İNCELE BUTONU (GARANTİLİ) */}
                <div className="p-4">
                  {!list.items || list.items.length === 0 ? (
                    <div className="text-xs text-neutral-400 italic py-2">Bu listede henüz kayıtlı öğe bulunmuyor.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {list.items.map((item) => (
                        <div key={item.id} className="p-3.5 bg-white rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-between space-y-2">
                          <div className="space-y-1 min-w-0">
                            <h4 className="font-bold text-xs text-neutral-950 truncate flex items-center gap-1.5">
                              {item.request_id ? <FileText size={13} className="text-blue-600 shrink-0" /> : <User size={13} className="text-neutral-500 shrink-0" />}
                              <span>{item.contact_name}</span>
                            </h4>
                            <p className="text-[11px] font-mono text-blue-700 flex items-center gap-1">
                              <Phone size={11} className="text-blue-500 shrink-0" />
                              <span>{cleanPhoneNumber(item.contact_phone)}</span>
                            </p>
                            {item.notes && (
                              <p className="text-[10px] text-neutral-600 bg-neutral-50 p-1.5 rounded border border-neutral-100 line-clamp-2">
                                📝 {item.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 mt-1">
                            <button 
                              onClick={() => {
                                if (item.request_id && onSelectRequest) {
                                  onSelectRequest(item.request_id);
                                } else {
                                  alert(item.request_id ? `Talep #${item.request_id} inceleniyor...` : 'Bu öğe manuel eklenen bir kişidir.');
                                }
                              }}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                              title="Bu talebi yeniden ele al ve incele"
                            >
                              <RefreshCw size={11} />
                              <span>Rework / İncele</span>
                            </button>

                            <button 
                              onClick={() => handleDeleteItem(item.id)} 
                              className="p-1.5 text-neutral-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0 cursor-pointer"
                              title="Listeden Çıkar"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}