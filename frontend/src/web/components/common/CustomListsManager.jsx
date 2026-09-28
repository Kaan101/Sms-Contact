import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Folder, Plus, Trash2, Phone, User, Loader2 } from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';

export default function CustomListsManager({ ownerType, ownerId }) {
  const { API_BASE } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newListName, setNewListName] = useState('');
  const [activeListId, setActiveListId] = useState(null);
  const [newItem, setNewItem] = useState({ contactName: '', contactPhone: '', notes: '' });

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

  useEffect(() => {
    fetchLists();
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

  const handleAddItem = async (listId, e) => {
    e.preventDefault();
    if (!newItem.contactName.trim() || !newItem.contactPhone.trim()) {
      alert('Kişi adı ve telefon numarası zorunludur.');
      return;
    }
    try {
      await axios.post(`${API_BASE}/lists/${listId}/items`, newItem);
      setNewItem({ contactName: '', contactPhone: '', notes: '' });
      setActiveListId(null);
      fetchLists();
    } catch (err) {
      alert('Kişi listeye eklenemedi.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Bu kişiyi listeden çıkarmak istediğinize emin misiniz?')) return;
    try {
      await axios.delete(`${API_BASE}/lists/items/${itemId}`);
      fetchLists();
    } catch (err) {
      alert('Kişi silinemedi.');
    }
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
            <span>Özel Listelerim ({lists.length})</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">Favori sağlayıcılarınızı veya müşterilerinizi özel gruplar halinde organize edin.</p>
        </div>

        <form onSubmit={handleCreateList} className="flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Yeni liste adı..." 
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-neutral-200 outline-none focus:border-neutral-900 bg-neutral-50 w-52"
          />
          <button type="submit" className="px-4 py-2 bg-neutral-950 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition flex items-center gap-1 shrink-0">
            <Plus size={14} />
            <span>Oluştur</span>
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {lists.length === 0 ? (
          <div className="text-center py-10 text-neutral-400 text-xs bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
            Henüz hiç özel liste oluşturmadınız. Yukarıdan yeni bir liste ekleyerek başlayın.
          </div>
        ) : (
          lists.map((list) => {
            const isAddingToThis = activeListId === list.id;
            return (
              <div key={list.id} className="bg-neutral-50/70 rounded-xl border border-neutral-200 overflow-hidden transition">
                <div className="p-4 flex items-center justify-between bg-white border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900">{list.list_name}</span>
                    <span className="text-[10px] font-mono bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-bold">
                      {list.items ? list.items.length : 0} Kişi
                    </span>
                  </div>

                  <button 
                    onClick={() => setActiveListId(isAddingToThis ? null : list.id)} 
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  >
                    <Plus size={13} />
                    <span>{isAddingToThis ? 'Kapat' : 'Kişi Ekle'}</span>
                  </button>
                </div>

                {isAddingToThis && (
                  <form onSubmit={(e) => handleAddItem(list.id, e)} className="p-4 bg-blue-50/40 border-b border-blue-100 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
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
                      <button type="submit" className="w-full py-2 bg-neutral-950 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition">
                        Ekle
                      </button>
                    </div>
                  </form>
                )}

                <div className="p-4">
                  {!list.items || list.items.length === 0 ? (
                    <div className="text-xs text-neutral-400 italic py-2">Bu listede henüz kayıtlı kişi bulunmuyor.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {list.items.map((item) => (
                        <div key={item.id} className="p-3 bg-white rounded-xl border border-neutral-200 shadow-xs flex items-center justify-between">
                          <div className="space-y-1 min-w-0 pr-2">
                            <h4 className="font-bold text-xs text-neutral-900 truncate flex items-center gap-1">
                              <User size={12} className="text-neutral-400 shrink-0" />
                              <span>{item.contact_name}</span>
                            </h4>
                            <p className="text-[11px] font-mono text-blue-700 flex items-center gap-1">
                              <Phone size={11} className="text-blue-500 shrink-0" />
                              <span>{item.contact_phone}</span>
                            </p>
                            {item.notes && (
                              <p className="text-[10px] text-neutral-500 bg-neutral-50 p-1 rounded truncate">
                                📝 {item.notes}
                              </p>
                            )}
                          </div>
                          <button 
                            onClick={() => handleDeleteItem(item.id)} 
                            className="p-1.5 text-neutral-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition shrink-0"
                            title="Listeden Çıkar"
                          >
                            <Trash2 size={14} />
                          </button>
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