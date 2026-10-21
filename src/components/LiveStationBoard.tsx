import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Monitor,
  RefreshCw,
  CheckCircle2,
  Flame,
  Clock,
  User,
  Share2,
  Radio,
  Volume2,
  VolumeX,
  Plus,
  Play,
  StopCircle,
  Edit3,
  AlertTriangle,
  Search,
  Gamepad2,
  Trophy,
  Filter,
  ArrowUpDown,
  Coins,
  Coffee,
  X,
  Check,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { Station, Session, Booking, Customer } from '../types';
import { todayISO, nowHHMM, addMin, slotPriceForStation, fmtMins, to12 } from '../utils/helpers';

interface LiveStationBoardProps {
  stations: Station[];
  sessions: Session[];
  bookings: Booking[];
  customers?: Customer[];
  onRefresh?: () => void;
  isBackendConnected?: boolean;
  onStartSession?: (sessionData: Partial<Session>) => void;
  onEndSession?: (id: string) => void;
  onEditSession?: (session: Session) => void;
  onSaveSessionUpdates?: (id: string, updates: Partial<Session>) => void;
  onNavigateToNewSession?: (stationId?: string) => void;
  onUpdateBooking?: (id: string, updates: Partial<Booking>) => void;
  toast?: (msg: string, kind?: 'ok' | 'warn' | 'info') => void;
}

// Synthesizer beep utility for audio notifications without external mp3 dependencies
function playSynthesizerChime(type: 'warning' | 'overtime') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'overtime') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15); // A4
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Audio might be blocked by browser autoplay policy until interacted with
  }
}

export const LiveStationBoard: React.FC<LiveStationBoardProps> = ({
  stations = [],
  sessions = [],
  bookings = [],
  customers = [],
  onRefresh,
  isBackendConnected = true,
  onStartSession,
  onEndSession,
  onEditSession,
  onSaveSessionUpdates,
  onNavigateToNewSession,
  onUpdateBooking,
  toast
}) => {
  // 1-second live ticker
  const [tick, setTick] = useState<number>(0);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [lastSynced, setLastSynced] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Filters & Views
  const [statusFilter, setStatusFilter] = useState<'all' | 'free' | 'busy' | 'expiring' | 'booked'>('all');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'default' | 'urgent' | 'busy-first' | 'free-first'>('default');

  // Sound alert state
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('omg_live_sound_enabled') === 'true';
    } catch {
      return false;
    }
  });

  // Modals state
  const [quickStartStation, setQuickStartStation] = useState<Station | null>(null);
  const [quickGamerName, setQuickGamerName] = useState<string>('Gamer');
  const [quickDurationMins, setQuickDurationMins] = useState<number>(60);
  const [quickMode, setQuickMode] = useState<'single' | 'multi'>('single');
  const [quickPlayers, setQuickPlayers] = useState<number>(2);
  const [quickPaymentMethod, setQuickPaymentMethod] = useState<'Cash' | 'UPI'>('UPI');
  const [quickStudentDiscount, setQuickStudentDiscount] = useState<boolean>(false);

  const [confirmEndModal, setConfirmEndModal] = useState<{
    isOpen: boolean;
    session: Session | null;
    stationName: string;
  }>({ isOpen: false, session: null, stationName: '' });

  const [extendingSessionId, setExtendingSessionId] = useState<string | null>(null);

  // Keep track of alerted sessions to prevent chiming on every tick
  const alertedWarningSessionsRef = useRef<Set<string>>(new Set());
  const alertedOvertimeSessionsRef = useRef<Set<string>>(new Set());

  // 1-second timer effect
  useEffect(() => {
    const updateTimes = () => {
      const d = new Date();
      setCurrentTimeStr(d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setTick(t => t + 1);
    };
    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update last synced on data change
  useEffect(() => {
    const d = new Date();
    setLastSynced(d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
  }, [sessions, stations, bookings]);

  // Persist sound preference
  const toggleSound = () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    try {
      localStorage.setItem('omg_live_sound_enabled', String(next));
    } catch {
      // ignore
    }
    if (next) {
      playSynthesizerChime('warning');
      if (toast) toast('Audio alerts enabled for low time & overtime', 'ok');
    } else {
      if (toast) toast('Audio alerts muted', 'info');
    }
  };

  // Distinct hardware platforms available
  const availableKinds = useMemo(() => {
    const kinds = new Set<string>();
    stations.forEach(s => {
      if (s.kind) kinds.add(s.kind);
    });
    return Array.from(kinds);
  }, [stations]);

  // Active Sessions & Confirmed Bookings
  const activeSessions = useMemo(() => {
    return (sessions || []).filter(s => s && s.status === 'active');
  }, [sessions]);

  const todayBookings = useMemo(() => {
    const today = todayISO();
    return (bookings || []).filter(
      b => b && b.date === today && (b.status === 'confirmed' || b.status === 'pending')
    );
  }, [bookings]);

  // Comprehensive Station Status Mapping
  const stationStatusList = useMemo(() => {
    const now = new Date();
    const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    return stations.map(station => {
      // 1. Locate active session
      const activeSession = activeSessions.find(s => {
        if (s.stationIds && Array.isArray(s.stationIds) && s.stationIds.includes(station.id)) return true;
        if (s.stationId === station.id) return true;
        return false;
      });

      // 2. Locate upcoming booking today
      const upcomingBooking = todayBookings.find(b => {
        if (b.stationIds && Array.isArray(b.stationIds) && b.stationIds.includes(station.id)) return true;
        if (b.stationId === station.id) return true;
        return false;
      });

      let remainingSecs: number | null = null;
      let elapsedPercent = 0;
      let isOverdue = false;
      let isExpiringSoon = false;
      let formattedTimer = '';
      let durationMins = 0;

      if (activeSession) {
        durationMins = (activeSession.slots || []).reduce((acc, sl) => acc + (sl.mins || 0), 0) || 30;
        const startHHMM = activeSession.startTime || nowHHMM();
        let endHHMM = activeSession.endTime;
        if (!endHHMM) {
          endHHMM = addMin(startHHMM, durationMins);
        }

        const [sh, sm] = (startHHMM || '00:00').split(':').map(Number);
        const [eh, em] = (endHHMM || '00:00').split(':').map(Number);

        let startSecs = (isNaN(sh) ? 0 : sh) * 3600 + (isNaN(sm) ? 0 : sm) * 60;
        let endSecs = (isNaN(eh) ? 0 : eh) * 3600 + (isNaN(em) ? 0 : em) * 60;

        // Handle overnight sessions (e.g. 23:30 to 01:00)
        if (endSecs < startSecs) {
          endSecs += 24 * 3600;
        }
        let adjustedNowSecs = nowSecs;
        if (nowSecs < startSecs && endSecs > 24 * 3600) {
          adjustedNowSecs += 24 * 3600;
        }

        const totalSecs = Math.max(1, endSecs - startSecs);
        remainingSecs = endSecs - adjustedNowSecs;
        const elapsedSecs = adjustedNowSecs - startSecs;

        elapsedPercent = Math.max(0, Math.min(100, Math.round((elapsedSecs / totalSecs) * 100)));
        isOverdue = remainingSecs <= 0;
        isExpiringSoon = remainingSecs > 0 && remainingSecs <= 900; // <= 15 minutes

        const absSecs = Math.abs(remainingSecs);
        const h = Math.floor(absSecs / 3600);
        const m = Math.floor((absSecs % 3600) / 60);
        const s = absSecs % 60;

        if (isOverdue) {
          formattedTimer = `+${h > 0 ? `${h}h ` : ''}${m}m ${String(s).padStart(2, '0')}s OVERTIME`;
        } else {
          formattedTimer = `${h > 0 ? `${h}h ` : ''}${m}m ${String(s).padStart(2, '0')}s left`;
        }

        // Trigger sound alerts if enabled
        if (isSoundEnabled) {
          if (isOverdue && !alertedOvertimeSessionsRef.current.has(activeSession.id)) {
            alertedOvertimeSessionsRef.current.add(activeSession.id);
            playSynthesizerChime('overtime');
          } else if (isExpiringSoon && remainingSecs <= 300 && !alertedWarningSessionsRef.current.has(activeSession.id)) {
            alertedWarningSessionsRef.current.add(activeSession.id);
            playSynthesizerChime('warning');
          }
        }
      }

      const isBusy = Boolean(activeSession);
      const isBooked = !isBusy && Boolean(upcomingBooking);

      return {
        station,
        status: isBusy ? ('busy' as const) : isBooked ? ('booked' as const) : ('free' as const),
        activeSession,
        upcomingBooking,
        remainingSecs,
        elapsedPercent,
        isOverdue,
        isExpiringSoon,
        formattedTimer,
        durationMins
      };
    });
  }, [stations, activeSessions, todayBookings, tick, isSoundEnabled]);

  // Overall Floor Metrics
  const totalCount = stations.length;
  const busyCount = stationStatusList.filter(s => s.status === 'busy').length;
  const freeCount = stationStatusList.filter(s => s.status === 'free').length;
  const bookedCount = stationStatusList.filter(s => s.status === 'booked').length;
  const overdueCount = stationStatusList.filter(s => s.isOverdue).length;
  const expiringCount = stationStatusList.filter(s => s.isExpiringSoon).length;
  const occupancyRate = totalCount > 0 ? Math.round((busyCount / totalCount) * 100) : 0;
  const activeFloorRevenue = activeSessions.reduce((acc, s) => acc + (s.total || 0), 0);
  const activeGamersCount = activeSessions.reduce((acc, s) => acc + (s.mode === 'multi' ? (s.players || 2) : 1), 0);

  // Filter and Search Pipeline
  const filteredStations = useMemo(() => {
    let result = stationStatusList;

    // 1. Status Filter
    if (statusFilter === 'free') {
      result = result.filter(item => item.status === 'free');
    } else if (statusFilter === 'busy') {
      result = result.filter(item => item.status === 'busy');
    } else if (statusFilter === 'expiring') {
      result = result.filter(item => item.isExpiringSoon || item.isOverdue);
    } else if (statusFilter === 'booked') {
      result = result.filter(item => item.status === 'booked');
    }

    // 2. Kind/Hardware Filter
    if (kindFilter !== 'all') {
      result = result.filter(item => item.station.kind === kindFilter);
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => {
        const stName = (item.station.name || '').toLowerCase();
        const gamerName = (item.activeSession?.name || '').toLowerCase();
        const gamerPhone = (item.activeSession?.phone || '').toLowerCase();
        const bookerName = (item.upcomingBooking?.name || '').toLowerCase();
        return stName.includes(q) || gamerName.includes(q) || gamerPhone.includes(q) || bookerName.includes(q);
      });
    }

    // 4. Sorting
    if (sortBy === 'urgent') {
      // Lowest remaining seconds first (overdue or expiring first), then busy, then free
      result = [...result].sort((a, b) => {
        if (a.remainingSecs !== null && b.remainingSecs !== null) {
          return a.remainingSecs - b.remainingSecs;
        }
        if (a.remainingSecs !== null) return -1;
        if (b.remainingSecs !== null) return 1;
        return 0;
      });
    } else if (sortBy === 'busy-first') {
      result = [...result].sort((a, b) => {
        const score = (item: typeof a) => (item.status === 'busy' ? 2 : item.status === 'booked' ? 1 : 0);
        return score(b) - score(a);
      });
    } else if (sortBy === 'free-first') {
      result = [...result].sort((a, b) => {
        const score = (item: typeof a) => (item.status === 'free' ? 2 : item.status === 'booked' ? 1 : 0);
        return score(b) - score(a);
      });
    }

    return result;
  }, [stationStatusList, statusFilter, kindFilter, searchQuery, sortBy]);

  // Copy shareable live link
  const liveShareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?view=live` : '';
  const handleCopyShareLink = () => {
    if (liveShareUrl) {
      navigator.clipboard.writeText(liveShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      if (toast) toast('Live Mobile Monitor link copied to clipboard!', 'ok');
    }
  };

  // Quick 1-click Extension Handler
  const handleQuickExtend = async (session: Session, extraMins: number) => {
    if (!onSaveSessionUpdates) return;
    setExtendingSessionId(session.id);

    try {
      const curSlots = session.slots && session.slots.length ? session.slots : [{ mins: 30 }];
      const curTotalMins = curSlots.reduce((a, b) => a + (b.mins || 0), 0);
      const newTotalMins = curTotalMins + extraMins;
      const newSlots = [...curSlots, { mins: extraMins }];
      const newEndTime = addMin(session.endTime || addMin(session.startTime, curTotalMins), extraMins);

      // Recalculate gaming cost across all stations
      const stIds = session.stationIds && session.stationIds.length ? session.stationIds : (session.stationId ? [session.stationId] : []);
      let newGaming = 0;
      stIds.forEach(id => {
        const stn = stations.find(s => s.id === id);
        newGaming += slotPriceForStation(stn, session.mode, session.players, newTotalMins);
      });

      const newTotal = Math.max(0, newGaming + (session.snacks || 0) - (session.discount || 0));
      const updates: Partial<Session> = {
        slots: newSlots,
        endTime: newEndTime,
        gaming: newGaming,
        total: newTotal
      };

      if (session.pm === 'Cash') updates.cashAmt = newTotal;
      if (session.pm === 'UPI') updates.upiAmt = newTotal;

      await onSaveSessionUpdates(session.id, updates);
      if (toast) toast(`Added +${extraMins} mins to ${session.name}'s session!`, 'ok');
    } catch (err) {
      console.error('Quick extend error:', err);
      if (toast) toast('Failed to extend session', 'warn');
    } finally {
      setExtendingSessionId(null);
    }
  };

  // Quick Launch from Free Station
  const handleLaunchQuickStart = () => {
    if (!quickStartStation || !onStartSession) return;

    const stn = quickStartStation;
    const nowTime = nowHHMM();
    const endTime = addMin(nowTime, quickDurationMins);
    const gamingCost = slotPriceForStation(
      stn,
      quickMode,
      quickMode === 'multi' ? quickPlayers : 1,
      quickDurationMins
    );

    const isStudentEligible = gamingCost >= 500;
    const discount = (quickStudentDiscount && isStudentEligible) ? Math.round(gamingCost * 0.15) : 0;
    const finalTotal = Math.max(0, gamingCost - discount);

    const newSessionData: Partial<Session> = {
      name: quickGamerName.trim() || 'Gamer',
      stationIds: [stn.id],
      stationId: stn.id,
      mode: quickMode,
      players: quickMode === 'multi' ? quickPlayers : 1,
      startTime: nowTime,
      endTime: endTime,
      slots: [{ mins: quickDurationMins }],
      cart: [],
      gaming: gamingCost,
      snacks: 0,
      discount: discount,
      total: finalTotal,
      note: discount > 0 ? `Student Discount 15% (-₹${discount})` : undefined,
      pm: quickPaymentMethod,
      cashAmt: quickPaymentMethod === 'Cash' ? finalTotal : 0,
      upiAmt: quickPaymentMethod === 'UPI' ? finalTotal : 0,
      status: 'active',
      date: todayISO()
    };

    onStartSession(newSessionData);
    setQuickStartStation(null);
    setQuickGamerName('Gamer');
    setQuickStudentDiscount(false);
    if (toast) toast(`Session started on ${stn.name}!`, 'ok');
  };

  // Convert confirmed booking to active session
  const handleCheckInBooking = (booking: Booking) => {
    if (!onStartSession) return;

    const stIds = booking.stationIds || (booking.stationId ? [booking.stationId] : []);
    const stn = stations.find(s => stIds.includes(s.id));
    const nowTime = nowHHMM();
    const duration = booking.duration || 60;
    const endTime = addMin(nowTime, duration);
    const gamingCost = slotPriceForStation(stn, 'single', 1, duration);
    const total = Math.max(0, gamingCost - (booking.advance || 0));

    onStartSession({
      name: booking.name,
      phone: booking.phone || '',
      stationIds: stIds,
      stationId: stIds[0] || '',
      startTime: nowTime,
      endTime: endTime,
      slots: [{ mins: duration }],
      cart: [],
      gaming: gamingCost,
      snacks: 0,
      discount: booking.advance || 0,
      total: total,
      pm: total > 0 ? 'UPI' : 'Cash',
      upiAmt: total > 0 ? total : 0,
      cashAmt: 0,
      note: `Converted from reservation (Adv: ₹${booking.advance || 0})`,
      status: 'active',
      date: todayISO()
    });

    if (onUpdateBooking) {
      onUpdateBooking(booking.id, { status: 'converted' });
    }

    if (toast) toast(`Checked in reservation for ${booking.name}!`, 'ok');
  };

  const quickBaseCost = quickStartStation
    ? slotPriceForStation(
        quickStartStation,
        quickMode,
        quickMode === 'multi' ? quickPlayers : 1,
        quickDurationMins
      )
    : 0;
  const quickIsEligible = quickBaseCost >= 500;
  const quickDisc = (quickStudentDiscount && quickIsEligible) ? Math.round(quickBaseCost * 0.15) : 0;
  const quickFinalPrice = Math.max(0, quickBaseCost - quickDisc);

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      
      {/* Real-time Status Command Ribbon */}
      <div className="p-4 md:p-5 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/70 via-black/85 to-blue-950/70 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 text-white shadow-xl shadow-purple-950/60 relative shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#07030d] animate-ping" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-['Exo_2'] font-black text-lg md:text-xl text-white uppercase tracking-wider flex items-center gap-2">
                Live Station Command Monitor
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live 1s Real-time
              </span>
              {isBackendConnected ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Synced
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1">
                  Offline Cache
                </span>
              )}
            </div>
            <p className="text-xs text-[#9c8fc6] mt-1 flex flex-wrap items-center gap-2">
              <span>Station occupancy & console countdowns</span>
              <span>•</span>
              <span>Floor Clock: <strong className="text-emerald-300 font-mono font-bold text-xs">{currentTimeStr || '—'}</strong></span>
              <span>•</span>
              <span className="hidden md:inline">Last refreshed: <span className="text-purple-300 font-mono">{lastSynced}</span></span>
            </p>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sound Alert Toggle */}
          <button
            onClick={toggleSound}
            title={isSoundEnabled ? 'Audio alerts active for overtime & low time' : 'Audio alerts muted'}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              isSoundEnabled
                ? 'bg-purple-600/30 text-purple-200 border-purple-500/50 shadow-md shadow-purple-950/40'
                : 'bg-black/50 text-[#9c8fc6] border-purple-500/20 hover:text-white'
            }`}
          >
            {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-zinc-400" />}
            <span className="hidden sm:inline">{isSoundEnabled ? 'Alerts ON' : 'Alerts OFF'}</span>
          </button>

          {/* Manual Refresh */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          {/* Share Link */}
          <button
            onClick={handleCopyShareLink}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-blue-900/40 hover:brightness-110 cursor-pointer"
          >
            {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedLink ? 'Copied!' : 'Share Board'}</span>
          </button>
        </div>
      </div>

      {/* Floor Metrics HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Stations */}
        <div className="p-3.5 rounded-2xl border border-purple-500/25 bg-black/50 backdrop-blur-md flex flex-col justify-between shadow-lg">
          <span className="text-[10px] uppercase tracking-wider text-[#9c8fc6] font-bold flex items-center gap-1">
            <Monitor className="w-3.5 h-3.5 text-purple-400" /> Total Stations
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-['Exo_2'] font-black text-2xl text-white">{totalCount}</span>
            <span className="text-[11px] text-[#9c8fc6]">Units</span>
          </div>
        </div>

        {/* Free Stations */}
        <div className="p-3.5 rounded-2xl border border-emerald-500/35 bg-emerald-950/25 backdrop-blur-md flex flex-col justify-between shadow-lg shadow-emerald-950/20">
          <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Free & Ready
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-['Exo_2'] font-black text-2xl text-emerald-300">{freeCount}</span>
            <span className="text-[11px] font-bold text-emerald-400/80">Available</span>
          </div>
        </div>

        {/* Active Gamers / Busy */}
        <div className="p-3.5 rounded-2xl border border-rose-500/35 bg-rose-950/25 backdrop-blur-md flex flex-col justify-between shadow-lg shadow-rose-950/20">
          <span className="text-[10px] uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" /> Busy / Playing
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-['Exo_2'] font-black text-2xl text-rose-300">{busyCount}</span>
            <span className="text-[11px] font-bold text-rose-300/80">{activeGamersCount} Players</span>
          </div>
        </div>

        {/* Expiring / Overdue */}
        <div className={`p-3.5 rounded-2xl border backdrop-blur-md flex flex-col justify-between shadow-lg transition-all ${
          overdueCount > 0 
            ? 'border-rose-500/60 bg-rose-950/40 shadow-rose-950/40 animate-pulse' 
            : expiringCount > 0 
            ? 'border-amber-500/40 bg-amber-950/25' 
            : 'border-purple-500/20 bg-black/50'
        }`}>
          <span className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Attention Needed
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className={`font-['Exo_2'] font-black text-2xl ${overdueCount > 0 ? 'text-rose-400' : 'text-amber-300'}`}>
              {overdueCount > 0 ? `${overdueCount} Overdue` : `${expiringCount} Soon`}
            </span>
            <span className="text-[10px] text-amber-300/80">{overdueCount > 0 ? 'Needs Clear' : '< 15m left'}</span>
          </div>
        </div>

        {/* Floor Utilization Rate */}
        <div className="p-3.5 rounded-2xl border border-blue-500/30 bg-blue-950/25 backdrop-blur-md flex flex-col justify-between shadow-lg">
          <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-blue-400" /> Occupancy Rate
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-['Exo_2'] font-black text-2xl text-blue-300">{occupancyRate}%</span>
            <div className="w-16 h-2 bg-black/60 rounded-full overflow-hidden border border-blue-500/30">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all" style={{ width: `${occupancyRate}%` }} />
            </div>
          </div>
        </div>

        {/* Active Floor Value */}
        <div className="p-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-950/25 backdrop-blur-md flex flex-col justify-between shadow-lg">
          <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-cyan-400" /> Active Floor Total
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-['Exo_2'] font-black text-2xl text-cyan-300">₹{activeFloorRevenue}</span>
            <span className="text-[10px] text-cyan-300/70">in play</span>
          </div>
        </div>
      </div>

      {/* Interactive Controls, Filter Tabs & Search Bar */}
      <div className="p-3.5 rounded-2xl border border-purple-500/20 bg-black/40 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'bg-black/50 text-[#9c8fc6] hover:text-white border border-purple-500/20'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('free')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'free'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'bg-black/50 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Free ({freeCount})
          </button>
          <button
            onClick={() => setStatusFilter('busy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'busy'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                : 'bg-black/50 text-rose-400 hover:text-rose-300 border border-rose-500/20'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Busy ({busyCount})
          </button>
          {(expiringCount > 0 || overdueCount > 0) && (
            <button
              onClick={() => setStatusFilter('expiring')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                statusFilter === 'expiring'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                  : 'bg-black/50 text-amber-400 hover:text-amber-300 border border-amber-500/30'
              }`}
            >
              <AlertTriangle className="w-3 h-3" /> Attention ({expiringCount + overdueCount})
            </button>
          )}
          {bookedCount > 0 && (
            <button
              onClick={() => setStatusFilter('booked')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === 'booked'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'bg-black/50 text-blue-400 hover:text-white border border-blue-500/20'
              }`}
            >
              Booked ({bookedCount})
            </button>
          )}
        </div>

        {/* Hardware Zone Selector & Search Input */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end min-w-[280px]">
          {/* Hardware Kind Dropdown */}
          {availableKinds.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#9c8fc6] font-bold uppercase hidden md:inline">Zone:</span>
              <select
                value={kindFilter}
                onChange={e => setKindFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-black/60 border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400 cursor-pointer"
              >
                <option value="all">All Hardware</option>
                {availableKinds.map(k => (
                  <option key={k} value={k}>{k} Stations</option>
                ))}
              </select>
            </div>
          )}

          {/* Sort Order */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#9c8fc6] hidden sm:inline" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="px-2.5 py-1.5 rounded-xl bg-black/60 border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400 cursor-pointer"
            >
              <option value="default">Station Order</option>
              <option value="urgent">Urgent / Time Remaining</option>
              <option value="busy-first">Busy First</option>
              <option value="free-first">Free First</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[160px] max-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9c8fc6]" />
            <input
              type="text"
              placeholder="Search station / gamer..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-black/60 border border-purple-500/30 text-xs text-white placeholder-[#9c8fc6]/60 focus:outline-none focus:border-purple-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9c8fc6] hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Stations */}
      {filteredStations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-purple-500/20 bg-black/30 backdrop-blur-md">
          <Monitor className="w-10 h-10 text-purple-400/40 mx-auto mb-2" />
          <p className="text-white font-bold text-sm">No gaming stations match your current filters</p>
          <p className="text-xs text-[#9c8fc6] mt-1">Try resetting the status filter or clearing your search term.</p>
          <button
            onClick={() => { setStatusFilter('all'); setKindFilter('all'); setSearchQuery(''); }}
            className="mt-3 px-4 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredStations.map(({ station, status, activeSession, upcomingBooking, remainingSecs, elapsedPercent, isOverdue, isExpiringSoon, formattedTimer, durationMins }) => {
            const isBusy = status === 'busy';
            const isBooked = status === 'booked';
            const isFree = status === 'free';

            // Distinct station icon by type
            const renderStationIcon = () => {
              const k = (station.kind || '').toUpperCase();
              if (k === 'PS5') return <Gamepad2 className="w-5 h-5" />;
              if (k === 'RACE') return <Trophy className="w-5 h-5" />;
              return <Monitor className="w-5 h-5" />;
            };

            return (
              <div
                key={station.id}
                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden shadow-xl ${
                  isOverdue
                    ? 'border-rose-500/80 bg-gradient-to-b from-rose-950/60 via-purple-950/40 to-black/90 shadow-rose-950/60 ring-2 ring-rose-500/50 animate-pulse'
                    : isExpiringSoon
                    ? 'border-amber-500/70 bg-gradient-to-b from-amber-950/50 via-purple-950/30 to-black/90 shadow-amber-950/40 ring-1 ring-amber-500/40'
                    : isBusy
                    ? 'border-purple-500/60 bg-gradient-to-b from-purple-950/50 via-black/80 to-black/90 shadow-purple-950/30'
                    : isBooked
                    ? 'border-blue-500/50 bg-gradient-to-b from-blue-950/40 via-purple-950/20 to-black/90'
                    : 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 via-purple-950/20 to-black/90 hover:border-emerald-400 hover:shadow-emerald-950/30'
                }`}
              >
                {/* Station Top Bar: Hardware, Name & Rates */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${
                        isOverdue
                          ? 'bg-rose-500/25 text-rose-300 border-rose-500/50'
                          : isExpiringSoon
                          ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                          : isBusy
                          ? 'bg-purple-500/25 text-purple-300 border-purple-500/50'
                          : isBooked
                          ? 'bg-blue-500/25 text-blue-300 border-blue-500/50'
                          : 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50'
                      }`}>
                        {renderStationIcon()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-['Exo_2'] font-black text-sm md:text-base text-white uppercase tracking-wider truncate">
                          {station.name}
                        </h3>
                        <div className="text-[10px] text-[#9c8fc6] font-medium flex items-center gap-1.5 mt-0.5">
                          <span>₹{station.price30}/30m</span>
                          <span>•</span>
                          <span>₹{station.price60}/hr</span>
                          {station.hasMulti && <span className="text-cyan-300 font-bold">2P+</span>}
                        </div>
                      </div>
                    </div>

                    {/* Live Status Badge */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1 shrink-0 ${
                      isOverdue
                        ? 'bg-rose-500/30 text-rose-200 border-rose-500/70 shadow-sm'
                        : isExpiringSoon
                        ? 'bg-amber-500/30 text-amber-200 border-amber-500/60'
                        : isBusy
                        ? 'bg-purple-500/30 text-purple-200 border-purple-500/50'
                        : isBooked
                        ? 'bg-blue-500/30 text-blue-200 border-blue-500/50'
                        : 'bg-emerald-500/30 text-emerald-200 border-emerald-500/50'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isOverdue
                          ? 'bg-rose-400 animate-ping'
                          : isExpiringSoon
                          ? 'bg-amber-400 animate-pulse'
                          : isBusy
                          ? 'bg-purple-400'
                          : isBooked
                          ? 'bg-blue-400'
                          : 'bg-emerald-400'
                      }`} />
                      {isOverdue ? 'OVERDUE' : isExpiringSoon ? 'ENDING SOON' : isBusy ? 'BUSY' : isBooked ? 'RESERVED' : 'FREE'}
                    </span>
                  </div>

                  {/* Body Content by Status */}
                  {isBusy && activeSession ? (
                    <div className="flex flex-col gap-2.5 my-1">
                      {/* Gamer Header Info */}
                      <div className="p-3 rounded-xl bg-black/60 border border-purple-500/25 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-white font-bold text-xs">
                          <span className="flex items-center gap-1.5 text-white truncate max-w-[170px]">
                            <User className="w-3.5 h-3.5 text-purple-400 shrink-0" /> {activeSession.name}
                          </span>
                          <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                            {activeSession.pm}
                          </span>
                        </div>

                        {/* Start and End Times */}
                        <div className="flex items-center justify-between text-[11px] text-[#9c8fc6]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-400" />
                            {activeSession.startTime} → {activeSession.endTime || '—'}
                          </span>
                          <span className="font-mono font-bold text-white">₹{activeSession.total}</span>
                        </div>

                        {/* Multi-station or Multiplayer Notice */}
                        {(activeSession.stationIds?.length || 0) > 1 && (
                          <div className="text-[10px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded-lg flex items-center justify-between">
                            <span>Dual Station Session:</span>
                            <span className="font-bold">{(activeSession.stationIds || []).join(' + ')}</span>
                          </div>
                        )}

                        {activeSession.mode === 'multi' && (
                          <div className="text-[10px] text-amber-300 bg-amber-950/40 border border-amber-500/20 px-2 py-0.5 rounded-lg flex items-center justify-between">
                            <span>Multiplayer Mode:</span>
                            <span className="font-bold">{activeSession.players || 2} Players</span>
                          </div>
                        )}

                        {/* Snack Items Summary if any */}
                        {activeSession.cart && activeSession.cart.length > 0 && (
                          <div className="text-[10px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Coffee className="w-2.5 h-2.5 text-emerald-400" /> Snacks ({activeSession.cart.reduce((a, b) => a + b.qty, 0)}):
                            </span>
                            <span className="font-bold">₹{activeSession.snacks || 0}</span>
                          </div>
                        )}
                      </div>

                      {/* Live Digital Countdown & Progress Bar */}
                      <div className={`p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                        isOverdue
                          ? 'bg-rose-950/40 border-rose-500/40'
                          : isExpiringSoon
                          ? 'bg-amber-950/40 border-amber-500/40'
                          : 'bg-black/60 border-purple-500/25'
                      }`}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[10px] uppercase font-bold text-[#9c8fc6]">Remaining Time:</span>
                          <span className={`font-mono font-black text-xs ${
                            isOverdue
                              ? 'text-rose-400 animate-pulse'
                              : isExpiringSoon
                              ? 'text-amber-300'
                              : 'text-emerald-300'
                          }`}>
                            {formattedTimer}
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full h-2 bg-black/80 rounded-full overflow-hidden border border-purple-500/30">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              isOverdue
                                ? 'bg-rose-500 animate-pulse'
                                : isExpiringSoon
                                ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                : 'bg-gradient-to-r from-purple-500 to-emerald-400'
                            }`}
                            style={{ width: `${elapsedPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : isBooked && upcomingBooking ? (
                    <div className="p-3 rounded-xl bg-black/60 border border-blue-500/30 flex flex-col gap-2 my-1">
                      <div className="flex items-center justify-between text-white font-bold text-xs">
                        <span className="flex items-center gap-1.5 text-blue-300 truncate max-w-[170px]">
                          <User className="w-3.5 h-3.5" /> {upcomingBooking.name}
                        </span>
                        <span className="text-[10px] text-blue-400 font-mono">
                          Adv: ₹{upcomingBooking.advance || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#9c8fc6]">
                        <Clock className="w-3 h-3 text-blue-400" />
                        Reserved today at <strong className="text-white ml-1">{to12(upcomingBooking.time)}</strong> ({upcomingBooking.duration}m)
                      </div>
                      {onStartSession && (
                        <button
                          onClick={() => handleCheckInBooking(upcomingBooking)}
                          className="w-full mt-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Play className="w-3 h-3" /> Check In / Start Early
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20 text-center flex flex-col items-center justify-center gap-1.5 my-1 min-h-[96px]">
                      <span className="text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Console Clean & Ready
                      </span>
                      <p className="text-[10px] text-[#9c8fc6]">Open for walk-in or phone bookings</p>
                    </div>
                  )}
                </div>

                {/* Card Bottom: Quick Actions Bar */}
                <div className="mt-3 pt-3 border-t border-purple-500/20">
                  {isBusy && activeSession ? (
                    <div className="flex flex-col gap-2">
                      {/* Quick Extend Buttons: +15m / +30m / +60m */}
                      {onSaveSessionUpdates && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-[#9c8fc6] font-bold shrink-0">Extend:</span>
                          <button
                            disabled={extendingSessionId === activeSession.id}
                            onClick={() => handleQuickExtend(activeSession, 15)}
                            className="flex-1 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 text-[10px] font-bold transition-all cursor-pointer text-center"
                          >
                            +15m
                          </button>
                          <button
                            disabled={extendingSessionId === activeSession.id}
                            onClick={() => handleQuickExtend(activeSession, 30)}
                            className="flex-1 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 text-[10px] font-bold transition-all cursor-pointer text-center"
                          >
                            +30m
                          </button>
                          <button
                            disabled={extendingSessionId === activeSession.id}
                            onClick={() => handleQuickExtend(activeSession, 60)}
                            className="flex-1 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/30 text-[10px] font-bold transition-all cursor-pointer text-center"
                          >
                            +1h
                          </button>
                        </div>
                      )}

                      {/* Primary Actions: Edit / End Session */}
                      <div className="flex items-center gap-2">
                        {onEditSession && (
                          <button
                            onClick={() => onEditSession(activeSession)}
                            className="flex-1 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" /> Edit Bill
                          </button>
                        )}

                        {onEndSession && (
                          <button
                            onClick={() => setConfirmEndModal({ isOpen: true, session: activeSession, stationName: station.name })}
                            className="flex-1 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 text-xs font-extrabold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <StopCircle className="w-3.5 h-3.5" /> End Session
                          </button>
                        )}
                      </div>
                    </div>
                  ) : isFree ? (
                    <div className="flex items-center gap-2">
                      {/* Quick Start Button */}
                      {onStartSession && (
                        <button
                          onClick={() => {
                            setQuickStartStation(station);
                            setQuickGamerName('Gamer');
                            setQuickDurationMins(60);
                            setQuickMode('single');
                            setQuickPlayers(2);
                            setQuickPaymentMethod('UPI');
                          }}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" /> Quick Start
                        </button>
                      )}

                      {/* Full Config / Jump to New Session */}
                      {onNavigateToNewSession && (
                        <button
                          onClick={() => onNavigateToNewSession(station.id)}
                          className="px-2.5 py-2 rounded-xl bg-black/60 hover:bg-purple-600/20 border border-purple-500/30 text-[#9c8fc6] hover:text-white text-xs font-bold transition-all cursor-pointer"
                          title="Open Full Session Setup"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[10px] text-[#9c8fc6]">
                      <span>Reserved</span>
                      <span className="text-blue-400 font-bold">Awaiting Customer</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK START MODAL */}
      {quickStartStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#120822] border border-purple-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="font-['Exo_2'] font-black text-lg text-white uppercase tracking-wider">
                    Quick Launch Session
                  </h3>
                  <p className="text-xs text-emerald-300 font-bold">
                    Station: {quickStartStation.name} ({quickStartStation.kind})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickStartStation(null)}
                className="p-2 rounded-xl bg-black/40 text-[#9c8fc6] hover:text-white hover:bg-purple-900/40 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Gamer Name Input */}
            <div>
              <label className="text-xs uppercase font-extrabold text-[#9c8fc6] tracking-wider block mb-1.5">
                Customer / Gamer Name
              </label>
              <input
                type="text"
                value={quickGamerName}
                onChange={e => setQuickGamerName(e.target.value)}
                placeholder="Enter customer name..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-purple-500/30 text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Duration Selector */}
            <div>
              <label className="text-xs uppercase font-extrabold text-[#9c8fc6] tracking-wider block mb-1.5">
                Play Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 120].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setQuickDurationMins(mins)}
                    className={`py-2 rounded-xl text-xs font-extrabold uppercase transition-all cursor-pointer border ${
                      quickDurationMins === mins
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md'
                        : 'bg-black/50 text-[#9c8fc6] border-purple-500/20 hover:text-white'
                    }`}
                  >
                    {fmtMins(mins)}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Selector (Single / Multi if station supports it) */}
            {quickStartStation.hasMulti && (
              <div>
                <label className="text-xs uppercase font-extrabold text-[#9c8fc6] tracking-wider block mb-1.5">
                  Controller Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickMode('single')}
                    className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                      quickMode === 'single'
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-black/50 text-[#9c8fc6] border-purple-500/20 hover:text-white'
                    }`}
                  >
                    🎮 1 Player (Single)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickMode('multi')}
                    className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                      quickMode === 'multi'
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-black/50 text-[#9c8fc6] border-purple-500/20 hover:text-white'
                    }`}
                  >
                    🎮🎮 2 Players (Multi)
                  </button>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <label className="text-xs uppercase font-extrabold text-[#9c8fc6] tracking-wider block mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQuickPaymentMethod('UPI')}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                    quickPaymentMethod === 'UPI'
                      ? 'bg-blue-600 text-white border-blue-400'
                      : 'bg-black/50 text-[#9c8fc6] border-purple-500/20 hover:text-white'
                  }`}
                >
                  📱 UPI / Online
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPaymentMethod('Cash')}
                  className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                    quickPaymentMethod === 'Cash'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-black/50 text-[#9c8fc6] border-purple-500/20 hover:text-white'
                  }`}
                >
                  💵 Cash
                </button>
              </div>
            </div>

            {/* Student Discount Option */}
            <div
              onClick={() => {
                if (!quickIsEligible && !quickStudentDiscount) {
                  if (toast) toast(`Student discount requires bill of ₹500 or more (Current: ₹${quickBaseCost})`, 'warn');
                  return;
                }
                setQuickStudentDiscount(!quickStudentDiscount);
              }}
              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                quickStudentDiscount && quickIsEligible
                  ? 'bg-emerald-950/40 border-emerald-500/80 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : quickIsEligible
                  ? 'bg-purple-950/30 border-purple-500/40 hover:border-pink-500/50'
                  : 'bg-black/40 border-white/10 opacity-70'
              }`}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className={`w-4 h-4 ${quickStudentDiscount && quickIsEligible ? 'text-emerald-400' : 'text-purple-400'}`} />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    Student Discount (15% OFF)
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                      quickIsEligible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {quickIsEligible ? '₹500+ Qualified' : 'Bill ₹500+ Only'}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#9c8fc6]">
                    {quickIsEligible
                      ? quickStudentDiscount
                        ? `✓ 15% discount applied (-₹${quickDisc})`
                        : `Click to apply 15% discount (-₹${Math.round(quickBaseCost * 0.15)})`
                      : `Add duration to reach ₹500 bill (Current: ₹${quickBaseCost})`}
                  </div>
                </div>
              </div>
              <div className={`w-5 h-5 rounded flex items-center justify-center border text-xs ${
                quickStudentDiscount && quickIsEligible
                  ? 'bg-emerald-500 border-emerald-400 text-black font-bold'
                  : 'border-white/20 bg-black/40 text-transparent'
              }`}>
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            {/* Price Preview */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-purple-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#9c8fc6] font-bold block">Estimated Bill</span>
                <span className="text-xs text-[#9c8fc6]">
                  {fmtMins(quickDurationMins)} on {quickStartStation.name}
                  {quickDisc > 0 && <span className="text-emerald-400 ml-1 font-bold">(15% OFF applied)</span>}
                </span>
              </div>
              <div className="text-right">
                {quickDisc > 0 && (
                  <div className="text-xs text-slate-400 line-through">₹{quickBaseCost}</div>
                )}
                <span className="font-['Exo_2'] font-black text-2xl text-emerald-300">
                  ₹{quickFinalPrice}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuickStartStation(null)}
                className="flex-1 py-2.5 rounded-xl bg-black/50 hover:bg-black/80 border border-purple-500/30 text-[#9c8fc6] text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchQuickStart}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-900/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM END SESSION MODAL */}
      {confirmEndModal.isOpen && confirmEndModal.session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#120822] border border-rose-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40">
                <StopCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-['Exo_2'] font-black text-lg text-white uppercase tracking-wider">
                  End Gaming Session?
                </h3>
                <p className="text-xs text-[#9c8fc6] mt-0.5">
                  Station: <span className="text-white font-bold">{confirmEndModal.stationName}</span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-purple-500/25 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#9c8fc6]">Gamer:</span>
                <span className="font-bold text-white">{confirmEndModal.session.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#9c8fc6]">Payment Mode:</span>
                <span className="font-bold text-cyan-300">{confirmEndModal.session.pm}</span>
              </div>
              <div className="flex justify-between border-t border-purple-500/20 pt-1.5 mt-1 font-bold text-sm">
                <span className="text-white">Total Bill:</span>
                <span className="text-emerald-300">₹{confirmEndModal.session.total}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmEndModal({ isOpen: false, session: null, stationName: '' })}
                className="flex-1 py-2.5 rounded-xl bg-black/50 hover:bg-black/80 border border-purple-500/30 text-[#9c8fc6] text-xs font-bold transition-all cursor-pointer"
              >
                Keep Playing
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onEndSession && confirmEndModal.session) {
                    onEndSession(confirmEndModal.session.id);
                  }
                  setConfirmEndModal({ isOpen: false, session: null, stationName: '' });
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-900/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Yes, End Session
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
