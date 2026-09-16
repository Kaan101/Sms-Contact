import React, { createContext, useState, useContext } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Session (Oturum) durumunu başlatırken URL parametrelerini veya LocalStorage'ı kontrol ediyoruz
  const [session, setSession] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRole = urlParams.get('role');
      const urlPhone = urlParams.get('phone');

      if (urlRole && urlPhone) {
        const directSession = {
          role: urlRole.toUpperCase(),
          phone: decodeURIComponent(urlPhone),
          authenticatedAt: new Date().toISOString()
        };
        localStorage.setItem('sc_session', JSON.stringify(directSession));
        window.history.replaceState({}, document.title, window.location.pathname);
        return directSession;
      }
      const saved = localStorage.getItem('sc_session');
      return saved ? JSON.parse(saved) : null;
    } catch { 
      return null; 
    }
  });

  // Merkezi Çıkış Yapma (Logout) Fonksiyonu
  const handleLogout = () => {
    localStorage.removeItem('sc_session');
    localStorage.removeItem('sc_company_code');
    localStorage.removeItem('sc_is_code_hidden');
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, setSession, handleLogout, API_BASE }}>
      {children}
    </AuthContext.Provider>
  );
}

// Alt bileşenlerin bu verileri kolayca çekebilmesi için özel kancamız (Hook)
export const useAuth = () => useContext(AuthContext);