import TimeoutTracker from './TimeoutTracker';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import useSWR from 'swr'; 
import { 
  Download, Upload, Layers, FileCheck2, FolderKanban, Settings, 
  Plus, Search, Trash2, Clock, ExternalLink, ArrowUp, ArrowDown, 
  ArrowUpDown, X, ChevronUp, ChevronDown, Loader2, Timer,
  FileText, Bell, Filter, Activity, Briefcase, Tag
} from 'lucide-react';
import { useAuth } from '../../../core/context/AuthContext';
import { safeArray, safeString, safeLower, getKeywordMetrics, extractAddress, cleanContact, safeDateTime, safeDate } from '../../../core/utils/helpers';

// ⭐ İLGİLİ SİMÜLASYON BİLEŞENLERİ DOĞRUDAN ÇAĞRILIYOR
import ProviderDashboardAkanTalep from './ProviderDashboard_AkanTalep';
import TrackerDashboardAkanTalep from './TrackerDashboard_AkanTalep';

const MAX_KEYWORD_CHARS = 1000;
const MAX_KEYWORD_COUNT = 50;

const fetcher = (url) => axios.get(url).then(res => res.data);

const SortableHeader = React.memo(({ label, sortKey, align = "left", sortConfig, handleRequestSort }) => {
  if (!sortConfig) return null;
  const isActive = sortConfig.key === sortKey;
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  const justifyClass = align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start';
  
  return (
    <th className={`px-4 py-3 font-semibold border-b border-neutral-200 cursor-pointer hover:bg-neutral-100 transition group select-none whitespace-nowrap ${alignClass}`} onClick={() => handleRequestSort(sortKey)}>
      <div className={`flex items-center space-x-1 ${justifyClass}`}>
        <span>{label}</span>
        <span className={`${isActive ? 'text-neutral-900' : 'text-neutral-300 group-hover:text-neutral-500'} transition`}>
          {isActive ? (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : (<ArrowUpDown size={12} />)}
        </span>
      </div>
    </th>
  );
});

// ZAMAN AŞIMI (TIMEOUT) CANLI SAYACI EKLENMİŞ SATIR BİLEŞENİ
const MatchedRequestRow = React.memo(({ req, onDelete, localSettings }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimeout, setIsTimeout] = useState(req.status === 'TIMEOUT');

  useEffect(() => {
    if (req.status === 'TIMEOUT' || req.status === 'TAMAMLANDI' || req.status === 'İPTAL') {
      setIsTimeout(req.status === 'TIMEOUT');
      return;
    }

    let timeoutMins = 15; 
    if (localSettings) {
      if (req.status === 'WAITING') {
        timeoutMins = localSettings.pool_lifespan_hours * 60; 
      } else if (req.status === 'MATCHED') {
        timeoutMins = localSettings.customer_selection_timeout_mins; 
      }
    }

    const startTime = req.created_at ? new Date(req.created_at).getTime() : Date.now();
    const expireTimeMs = startTime + (timeoutMins * 60 * 1000);

    const calculateTime = () => {
      const now = Date.now();
      const diff = expireTimeMs - now;
      if (diff <= 0) {
        setTimeLeft(0);
        setIsTimeout(true);
        return false; 
      } else {
        setTimeLeft(diff);
        return true; 
      }
    };

    if (!calculateTime()) return;

    const timer = setInterval(() => {
      if (!calculateTime()) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [req.created_at, req.status, localSettings]);

  const formatTime = (ms) => {
    if (ms <= 0) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    if (h > 0) return `${h} sa ${m} dk ${s} sn`;
    return `${m}:${s}`;
  };

  const displayStatus = isTimeout ? 'TIMEOUT' : req.status;

  return (
    <tr className="hover:bg-neutral-50 transition">
      <td className="px-4 py-3 font-mono text-neutral-900">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-bold">#REQ-{req.id}</span>
          {req.request_type === 'BILDIRIM' ? (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-800 border border-amber-200" title="Bildirim"><Bell size={10} /> BİLDİRİM</span>
          ) : (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-100 text-blue-800 border border-blue-200" title="Talep"><FileText size={10} /> TALEP</span>
          )}
        </div>
        {req.created_at && <div className="text-[10px] text-neutral-400">{safeDateTime(req.created_at)}</div>}
      </td>
      <td className="px