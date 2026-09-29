import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Folder, Plus, Trash2, Edit2, ChevronRight, ChevronDown, 
  RefreshCw, Copy, Send, Check, X, AlertCircle, Loader2,
  Calendar, MapPin, Tag, Phone, ArrowRight, FileText, Bell
} from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { 
  safeArray, safeDateTime, extractAddress, extractCode, isCodeHiddenReq 
} from '../../../core/utils/helpers';

export default function CustomListsManager({ 
  ownerType = 'CUSTOMER', // 'CUSTOMER' | 'PROVIDER'
  ownerId, 
  onReworkRequest, 
  onDirectReorder 
}) {
  const { API_BASE } = useAuth();

  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedListId, setSelectedListId] = useState(null);
  const [listItems, setListItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Yeni Liste Oluşturma State'i
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

  // Düğme Aksiyon ve Geri Bildirim State'leri
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [actionFeedbackMap, setActionFeedbackMap] = useState({});

  const showActionFeedback = (key, type, text) => {
    setActionFeedbackMap(prev => ({ ...(prev || {}), [key]: { type, text } }));
    setTimeout(() => {
      setActionFeedbackMap(prev => ({ ...(prev || {}), [key]: null }));
    }, 3500);
  };

  // 1. Listeleri Getir
  const fetchLists = async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/lists/${ownerType}/${encodeURIComponent(ownerId)}`);
      const fetchedLists = safeArray(res?.data?.lists);
      setLists(fetchedLists);
      if (fetchedLists.length > 0 && !selectedListId) {
        setSelectedListId(fetchedLists[0].id);
      }
    } catch (err) {
      console.error('Listeler alınamadı:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, [ownerId, ownerType]);

  // 2. Seçili Listenin İçindeki Talepleri Getir
  const fetchListItems = async (listId) => {
    if (!listId) return;
    setItemsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/lists/${listId}/requests`);
      setListItems(safeArray(res?.data?.requests));
    } catch (err) {
      console.error('Liste öğeleri alınamadı:', err);
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedListId) {
      fetchListItems(selectedListId);
    } else {
      setListItems([]);
    }
  }, [selectedListId]);

  // Yeni Liste Oluştur
  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    const actionKey = 'create_list';
    setActionLoadingKey(actionKey);
    try {
      const res = await axios.post(`${API_BASE}/lists`, {
        ownerType,
        ownerId,
        listName: newListName.trim()
      });
      showActionFeedback(actionKey, 'success', 'Liste oluşturuldu');
      setNewListName('');
      setIsCreatingList(false);
      await fetchLists();
      if (res?.data?.list?.id) {
        setSelectedListId(res.data.list.id);
      }
    } catch (err) {
      showActionFeedback(actionKey, 'error', 'Oluşturulamadı');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Liste Sil
  const handleDeleteList = async (listId) => {
    const actionKey = `delete_list_${listId}`;
    setActionLoadingKey(actionKey);
    try {
      await axios.delete(`${API_BASE}/lists/${listId}`);
      showActionFeedback(actionKey, 'success', 'Liste silindi');
      if (selectedListId === listId) {
        setSelectedListId(null);
      }
      await fetchLists();
    } catch (err) {
      showActionFeedback(actionKey, 'error', 'Silinemedi');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Listeden Öğe Çıkar
  const handleRemoveItem = async (requestId) => {
    if (!selectedListId) return;
    const actionKey = `remove_item_${requestId}`;
    setActionLoadingKey(actionKey);
    try {
      await axios.delete(`${API_BASE}/lists/${selectedListId}/requests/${requestId}`);
      showActionFeedback(actionKey, 'success', 'Listeden çıkarıldı');
      await fetchListItems(selectedListId);
    } catch (err) {
      showActionFeedback(actionKey, 'error', 'Çıkarılamadı');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Doğrudan Yeniden Sipariş Et Butonu
  const handleReorderClick = async (req) => {
    const actionKey = `reorder_${req.id}`;
    setActionLoadingKey(actionKey);
    try {
      if (onDirectReorder) {
        await onDirectReorder(req);
        showActionFeedback(actionKey, 'success', 'Sipariş iletildi');
      }
    } catch (err) {
      showActionFeedback(actionKey, 'error', 'Sipariş verilemedi');
    } finally {
      setActionLoadingKey(null);
    }
  };

  // Forma Aktar Butonu
  const handleReworkClick = (req) => {
    const actionKey = `rework_${req.id}`;
    if (onReworkRequest) {
      onReworkRequest(req);
      showActionFeedback(actionKey, 'success', 'Forma aktarıldı');
    }
  };

  const selectedList = lists.find(l => l.id === selectedListId);

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs p-5 space-y-6">
      
      {/* BAŞLIK & YENİ LİSTE EKLEME BUTONU */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
        <div>
          <h3 className="font-extrabold text-neutral-900 text-base flex items-center gap-2">
            <Folder size={18} className="text-neutral-700" />
            <span>Kişisel Listelerim</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Sık kullandığınız işleri listelere kaydedip tek tıkla tekrarlayabilir veya forma aktarabilirsiniz.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {actionFeedbackMap?.create_list && (
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all animate-in fade-in flex items-center gap-1 ${
              actionFeedbackMap.create_list.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {actionFeedbackMap.create_list.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}
              <span>{actionFeedbackMap.create_list.text}</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCreatingList(!isCreatingList)}
            className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            <span>Yeni Liste</span>
          </button>
        </div>
      </div>

      {/* YENİ LİSTE OLUŞTURMA FORMU */}
      {isCreatingList && (
        <form onSubmit={handleCreateList} className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 flex items-center gap-2 animate-in fade-in duration-150">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Liste adı girin (Örn: Düzenli Ofis Temizliği)..."
            className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-neutral-900 font-medium"
            autoFocus
          />
          <button
            type="button"
            onClick={() => { setIsCreatingList(false); setNewListName(''); }}
            className="p-2 text-neutral-500 hover:text-neutral-700 bg-white border border-neutral-200 rounded-lg cursor-pointer transition"
          >
            <X size={14} />
          </button>
          <button
            type="submit"
            disabled={actionLoadingKey === 'create_list' || !newListName.trim()}
            className="px-4 py-2 bg-neutral-950 text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 transition flex items-center gap-1"
          >
            {actionLoadingKey === 'create_list' && <Loader2 size={12} className="animate-spin" />}
            <span>Oluştur</span>
          </button>
        </form>
      )}

      {/* LİSTELER YATAY SEKMELERİ */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {lists.length === 0 ? (
          <span className="text-neutral-400 text-xs italic py-1">Henüz oluşturulmuş bir liste yok.</span>
        ) : (
          lists.map(lst => {
            const isSelected = selectedListId === lst.id;
            const deleteKey = `delete_list_${lst.id}`;
            const isDeleting = actionLoadingKey === deleteKey;

            return (
              <div 
                key={lst.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-neutral-950 text-white border-neutral-950 shadow-xs' 
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                }`}
                onClick={() => setSelectedListId(lst.id)}
              >
                <Folder size={13} className={isSelected ? 'text-white' : 'text-neutral-500'} />
                <span className="font-bold">{lst.list_name}</span>
                
                {/* Liste Sil Butonu */}
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteList(lst.id);
                  }}
                  className={`ml-1 p-0.5 rounded transition cursor-pointer ${
                    isSelected ? 'hover:bg-neutral-800 text-neutral-400 hover:text-rose-300' : 'hover:bg-neutral-100 text-neutral-400 hover:text-rose-600'
                  }`}
                  title="Listeyi Sil"
                >
                  {isDeleting ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* SEÇİLİ LİSTENİN İÇERİĞİ */}
      {selectedList && (
        <div className="space-y-3 pt-2 border-t border-neutral-100">
          <div className="flex items-center justify-between text-xs text-neutral-500 font-mono">
            <span>
              <strong>{selectedList.list_name}</strong> ({listItems.length} Kayıtlı Talep)
            </span>
            <button
              type="button"
              onClick={() => fetchListItems(selectedList.id)}
              className="hover:text-neutral-900 transition flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={11} className={itemsLoading ? 'animate-spin' : ''} />
              <span>Yenile</span>
            </button>
          </div>

          {itemsLoading ? (
            <div className="py-8 flex items-center justify-center text-xs text-neutral-400 gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Kayıtlar yükleniyor...</span>
            </div>
          ) : listItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400 border border-dashed rounded-xl">
              Bu listede henüz kayıtlı bir iş bulunmuyor. Taleplerim sekmesindeki işlerin altındaki "Bu işi listenize kaydedin" alanından ekleyebilirsiniz.
            </div>
          ) : (
            <div className="space-y-3">
              {listItems.map(req => {
                const reworkKey = `rework_${req.id}`;
                const reorderKey = `reorder_${req.id}`;
                const removeKey = `remove_item_${req.id}`;

                const isReordering = actionLoadingKey === reorderKey;
                const isRemoving = actionLoadingKey === removeKey;

                const reorderFb = actionFeedbackMap?.[reorderKey];
                const reworkFb = actionFeedbackMap?.[reworkKey];
                const removeFb = actionFeedbackMap?.[removeKey];

                const reqCode = extractCode(req.location);
                const isHidden = isCodeHiddenReq(req.location);

                return (
                  <div 
                    key={req.id}
                    className="p-3.5 bg-neutral-50/70 border border-neutral-200/90 rounded-xl space-y-2.5 shadow-2xs hover:bg-neutral-50 transition"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-1 flex-1 min-w-[220px]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-neutral-400">#REQ-{req.id}</span>
                          <span className="font-bold px-1.5 py-0.2 rounded border text-[9px] flex items-center gap-1 bg-white text-neutral-800 border-neutral-200">
                            {req.request_type === 'BILDIRIM' ? <Bell size={10} className="text-amber-500" /> : <FileText size={10} className="text-blue-600" />}
                            {req.request_type === 'BILDIRIM' ? 'Bildirim' : 'Talep'}
                          </span>
                          {req.is_urgent && (
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                              ACİL
                            </span>
                          )}
                          {reqCode && (
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold border flex items-center gap-1 ${
                              isHidden ? 'bg-neutral-100 text-neutral-600 border-neutral-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            }`}>
                              <Tag size={9}/> KOD: {reqCode}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-neutral-900 leading-snug pt-0.5">"{req.raw_text}"</h4>

                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-neutral-500 font-mono pt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin size={11} className="text-neutral-400" />
                            <span>{extractAddress(req.location)}</span>
                          </span>
                          {req.provider_name && (
                            <span>
                              Sağlayıcı: <strong className="text-neutral-800">{req.provider_name}</strong>
                            </span>
                          )}
                          {req.matched_budget && (
                            <span className="text-emerald-700 font-bold">
                              💰 {new Intl.NumberFormat('tr-TR').format(Number(req.matched_budget))} TRY
                            </span>
                          )}
                        </div>
                      </div>

                      {/* AKSİYON BUTONLARI VE SOL TARAFTAKİ GERİ BİLDİRİMLER */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center ml-auto">
                        {/* Ortak Rozet Bildirimi */}
                        {(reorderFb || reworkFb || removeFb) && (
                          <div className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all animate-in fade-in flex items-center gap-1 ${
                            (reorderFb || reworkFb || removeFb)?.type === 'success'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            {(reorderFb || reworkFb || removeFb)?.type === 'success' ? <Check size={10} /> : <AlertCircle size={10} />}
                            <span>{(reorderFb || reworkFb || removeFb)?.text}</span>
                          </div>
                        )}

                        {/* Listeden Çıkar Butonu */}
                        <button
                          type="button"
                          disabled={isRemoving}
                          onClick={() => handleRemoveItem(req.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 border border-neutral-200 bg-white rounded-lg transition cursor-pointer"
                          title="Listeden Çıkar"
                        >
                          {isRemoving ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        </button>

                        {/* Forma Aktar Butonu */}
                        <button
                          type="button"
                          onClick={() => handleReworkClick(req)}
                          className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Bilgileri talep formuna kopyala"
                        >
                          <Copy size={11} />
                          <span>Forma Aktar</span>
                        </button>

                        {/* Doğrudan Tekrarla Butonu */}
                        {ownerType === 'CUSTOMER' && (
                          <button
                            type="button"
                            disabled={isReordering}
                            onClick={() => handleReorderClick(req)}
                            className="px-3.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                            title="Aynı şartlarla sağlayıcıya doğrudan ilet"
                          >
                            {isReordering ? (
                              <>
                                <Loader2 size={11} className="animate-spin" />
                                <span>İletiliyor...</span>
                              </>
                            ) : (
                              <>
                                <RefreshCw size={11} />
                                <span>Tekrarla</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}