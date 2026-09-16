import React from 'react';
import { useAuth } from '../../../core/context/AuthContext';
export default function AdminDashboard() {
  const { session } = useAuth();
  return <div className="p-8 font-bold text-xl">Admin Ekranı Yükleniyor...</div>;
}