import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowRight, Phone, PhoneCall, MessageSquare, Plus, Trash2, Edit3, X, Clock, LogOut, 
  KeyRound, History, Building2, Check, Ban, ShieldCheck, SkipForward, Layers, Radio, 
  User, Wrench, Shield, Save, ChevronDown, ChevronUp, FolderKanban, Calendar, Star, 
  Sparkles, MapPin, Flame, CheckCircle2, Navigation 
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [session, setSession] = useState(() => JSON.parse(localStorage.getItem('sc_session')));
  const [selectedRole, setSelectedRole] = useState('CUSTOMER');
  const [step, setStep] = useState('INPUT');
  const [myRequests, setMyRequests] = useState([]);
  const [providerRequests, setProviderRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [queryText, setQueryText] = useState('');
  const [locationValue, setLocationValue] = useState('İstanbul, Türkiye');
  const [isUrgent, setIsUrgent] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadlineTime, setDeadlineTime] = useState('18:00');
  
  // Accordion State
  const [isCustomerHistoryOpen, setIsCustomerHistoryOpen] = useState(false);
  const [isProviderHistoryOpen, setIsProviderHistoryOpen] = useState(false);

  // Veri Çekme
  const fetchData = async () => {
    if (!session) return;
    if (session.role === 'CUSTOMER') {
      const res = await axios.get(`${API_BASE}/requests/my-requests?phone=${encodeURIComponent(session.phone)}`);
      setMyRequests(res.data.requests);
    } else if (session.role === 'PROVIDER') {
      const res = await axios.get(`${API_BASE}/requests/provider-requests?phone=${encodeURIComponent(session.phone)}`);
      setProviderRequests(res.data.requests);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [session]);

  const handleCreateRequest = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/requests`, {
        rawText: queryText,
        contactValue: session.phone,
        location: locationValue,
        isUrgent,
        deadlineDatetime: `${deadlineDate}T${deadlineTime}:00`
      });
      setQueryText('');
      setStep('INPUT');
      fetchData();
    } catch (e) { alert("Talep oluşturulamadı: " + e.message); }
    setLoading(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    await axios.post(`${API_BASE}/requests/${id}/status`, { newStatus });
    fetchData();
  };

  const handleSendReview = async (reqId, type, rating, comment) => {
    await axios.post(`${API_BASE}/reviews`, { requestId: reqId, reviewerType: type, rating, comment });
    fetchData();
  };

  // Basit Render Yapısı
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {!session ? (
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow mt-20">
          <h2 className="text-xl font-bold mb-4">Giriş Yap</h2>
          <input className="w-full border p-2 mb-4" placeholder="Telefon" onChange={(e) => setInputPhone(e.target.value)} />
          <button className="w-full bg-black text-white p-2" onClick={() => { localStorage.setItem('sc_session', JSON.stringify({role: 'CUSTOMER', phone: inputPhone})); window.location.reload(); }}>Giriş</button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Müşteri Görünümü */}
          {session.role === 'CUSTOMER' && (
            <div className="space-y-6">
              {/* Aktif Talepler */}
              {myRequests.filter(r => ['MATCHED', 'ACCEPTED', 'PROVIDER_COMPLETED'].includes(r.status)).map(req => (
                <div key={req.id} className="bg-white p-4 rounded-lg shadow">
                  <p className="font-bold">{req.raw_text}</p>
                  <button onClick={() => handleStatusChange(req.id, 'COMPLETED')} className="bg-green-600 text-white p-2 mt-2 rounded">Hizmeti Tamamla</button>
                </div>
              ))}
              
              {/* Geçmiş Talepler (Collapsed) */}
              <div className="bg-white rounded-lg shadow">
                <button className="w-full p-4 flex justify-between" onClick={() => setIsCustomerHistoryOpen(!isCustomerHistoryOpen)}>
                  Geçmiş Talepler {isCustomerHistoryOpen ? <ChevronUp /> : <ChevronDown />}
                </button>
                {isCustomerHistoryOpen && (
                  <div className="p-4 border-t">
                    {myRequests.filter(r => r.status === 'COMPLETED').map(req => (
                      <div key={req.id} className="border-b py-2">
                        {req.raw_text} - <Star className="inline text-yellow-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}