import React from 'react';
import { useAuth } from '../../../core/context/AuthContext';
export default function ProviderDashboard() {
  const { session } = useAuth();
  return <div className="p-8 font-bold text-xl">Sağlayıcı Ekranı - Tel: {session.phone}</div>;
}