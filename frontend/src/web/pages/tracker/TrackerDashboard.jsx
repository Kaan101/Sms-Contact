import React from 'react';
import { useAuth } from '../../../core/context/AuthContext';
export default function TrackerDashboard() {
  const { session } = useAuth();
  return <div className="p-8 font-bold text-xl">Takip Ekranı Yükleniyor...</div>;
}