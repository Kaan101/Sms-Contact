import React, { useState } from 'react';
import { 
  Users, Activity, CheckCircle, Clock, 
  MapPin, AlertCircle, RefreshCw, Filter, 
  Search, ShieldAlert, Timer
} from 'lucide-react';

// Sahte (Mock) Veritabanı
const mockDemands = [
  { id: 'DEM-1042', customer: '0532***4567', type: 'Emlak', details: 'Tarabya 3+1 Kiralık', status: 'MATCHED', provider: 'Tarabya Emlak', createdAt: '10:15', timeoutAt: '10:30' },
  { id: 'DEM-1043', customer: '0555***1234', type: 'Tesisat', details: 'Su kaçağı tespiti', status: 'WAITING', provider: '-', createdAt: '14:20', timeoutAt: '14:35' },
  { id: 'DEM-1044', customer: '0544***9876', type: 'Servis', details: 'Bosch çamaşır makinesi motor arızası', status: 'TIMEOUT', provider: '-', createdAt: '09:00', timeoutAt: '09:15' },
  { id: 'DEM-1045', customer: '0530***5555', type: 'Temizlik', details: 'Boş ev temizliği 2+1', status: 'WAITING', provider: '-', createdAt: '14:45', timeoutAt: '15:00' },
  { id: 'DEM-1046', customer: '0532***1111', type: 'Nakliye', details: 'Şehir içi eşya taşıma', status: 'MATCHED', provider: 'Hızlı Nakliyat', createdAt: '08:30', timeoutAt: '08:45' },
];

export default function AdminDashboard() {
  const [demands, setDemands] = useState(mockDemands);
  const [filter, setFilter] = useState('ALL'); // ALL, WAITING, MATCHED, TIMEOUT

  // İstatistikleri hesapla
  const stats = {
    total: demands.length,
    waiting: demands.filter(d => d.status === 'WAITING').length,
    matched: demands.filter(d => d.status === 'MATCHED').length,
    timeout: demands.filter(d => d.status === 'TIMEOUT').length,
  };

  const filteredDemands = demands.filter(d => filter === 'ALL' ? true : d.status === filter);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'WAITING':
        return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-[10px] font-bold tracking-wider flex items-center space-x-1"><Clock size={10} /><span>BEKLİYOR</span></span>;
      case 'MATCHED':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold tracking-wider flex items-center space-x-1"><CheckCircle size={10} /><span>EŞLEŞTİ</span></span>;
      case 'TIMEOUT':
        return <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded text-[10px] font-bold tracking-wider flex items-center space-x-1"><AlertCircle size={10} /><span>ZAMAN AŞIMI</span></span>;
      default:
        return null;
    }
  };

  // Zaman aşımı durumunu renklendirmek için yardımcı fonksiyon
  const getTimeoutStyle = (status) => {
    if (status === 'TIMEOUT') return 'text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100';
    if (status === 'MATCHED') return 'text-neutral-400 line-through';
    return 'text-amber-600 font-semibold animate-pulse';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 font-sans">
      
      {/* Üst Başlık ve Aksiyonlar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-neutral-950" size={28} /> Sistem Yönetimi
          </h1>
          <p className="text-sm text-neutral-500 font-medium mt-1">Tüm eşleşmeleri, zaman aşımlarını ve havuz durumunu canlı izleyin.</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-sm font-bold shadow-sm hover:bg-neutral-50 transition">
            <RefreshCw size={16} />
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center"><Activity size={20} /></div>
          <div><p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Toplam Talep</p><h3 className="text-2xl font-black text-neutral-900">{stats.total}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Clock size={20} /></div>
          <div><p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Bekleyen</p><h3 className="text-2xl font-black text-neutral-900">{stats.waiting}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle size={20} /></div>
          <div><p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Eşleşen</p><h3 className="text-2xl font-black text-neutral-900">{stats.matched}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><AlertCircle size={20} /></div>
          <div><p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Zaman Aşımı</p><h3 className="text-2xl font-black text-rose-700">{stats.timeout}</h3></div>
        </div>
      </div>

      {/* Tablo Alanı */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        
        {/* Tablo Filtreleri */}
        <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-neutral-50/50">
          <div className="flex space-x-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            {['ALL', 'WAITING', 'MATCHED', 'TIMEOUT'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  filter === f 
                    ? 'bg-neutral-950 text-white shadow-sm' 
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {f === 'ALL' ? 'Tümü' : f === 'WAITING' ? 'Bekleyenler' : f === 'MATCHED' ? 'Eşleşenler' : 'Zaman Aşımı (Timeout)'}
              </button>
            ))}
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Talep No veya Tel Ara..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-medium focus:border-neutral-950 outline-none"
            />
          </div>
        </div>

        {/* Veri Tablosu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-500 font-bold border-b border-neutral-200">
                <th className="p-4 pl-6">ID</th>
                <th className="p-4">Müşteri</th>
                <th className="p-4">Detay / Kategori</th>
                <th className="p-4">Durum</th>
                <th className="p-4">Oluşturulma</th>
                <th className="p-4 bg-rose-50/30 text-neutral-700 flex items-center gap-1.5"><Timer size={12} /> Timeout Bitiş</th>
                <th className="p-4">Sağlayıcı</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-neutral-700 divide-y divide-neutral-100">
              {filteredDemands.map((demand) => (
                <tr key={demand.id} className="hover:bg-neutral-50/80 transition">
                  <td className="p-4 pl-6 font-mono text-xs text-neutral-950 font-bold">{demand.id}</td>
                  <td className="p-4 font-mono text-xs">{demand.customer}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-neutral-900 font-bold text-xs">{demand.details}</span>
                      <span className="text-[10px] text-neutral-500 uppercase">{demand.type}</span>
                    </div>
                  </td>
                  <td className="p-4">{getStatusBadge(demand.status)}</td>
                  <td className="p-4 font-mono text-xs text-neutral-500">{demand.createdAt}</td>
                  
                  {/* YENİ EKLENEN TIMEOUT SÜTUNU */}
                  <td className="p-4">
                    <span className={`font-mono text-xs flex items-center gap-1 ${getTimeoutStyle(demand.status)}`}>
                      {demand.status === 'TIMEOUT' ? <AlertCircle size={12} /> : null}
                      {demand.timeoutAt}
                    </span>
                  </td>

                  <td className="p-4">
                    {demand.provider !== '-' ? (
                      <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                        <MapPin size={10} />
                        <span>{demand.provider}</span>
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-xs italic">Atanmadı</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredDemands.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-neutral-500 text-sm">
                    Bu filtreye uygun talep bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}