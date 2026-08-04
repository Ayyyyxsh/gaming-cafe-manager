import React, { useState, useEffect } from 'react';
import { Monitor, RefreshCw, Smartphone, QrCode, CheckCircle2, Flame, Clock, User, ShieldCheck, Share2, Copy, Sparkles, Radio } from 'lucide-react';
import { Station, Session, Booking } from '../types';
import { todayISO, nowHHMM } from '../utils/helpers';

interface LiveStationBoardProps {
  stations: Station[];
  sessions: Session[];
  bookings: Booking[];
  onRefresh?: () => void;
  isBackendConnected?: boolean;
}

export const LiveStationBoard: React.FC<LiveStationBoardProps> = ({
  stations,
  sessions,
  bookings,
  onRefresh,
  isBackendConnected = true
}) => {
  const [lastSynced, setLastSynced] = useState<string>(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [copiedLink, setCopiedLink] = useState(false);
  const [filter, setFilter] = useState<'all' | 'free' | 'busy'>('all');

  useEffect(() => {
    setLastSynced(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, [sessions, stations]);

  const activeSessions = sessions.filter(s => s.status === 'active');
  const todayBookings = bookings.filter(b => b.date === todayISO() && b.status === 'confirmed');

  // Map each station to its current live status and session info
  const stationStatusMap = stations.map(station => {
    // Find active session for this station
    const activeSession = activeSessions.find(s => 
      (s.stationIds && s.stationIds.includes(station.id)) || s.stationId === station.id
    );

    // Find upcoming booking for today
    const upcomingBooking = todayBookings.find(b => 
      (b.stationIds && b.stationIds.includes(station.id)) || b.stationId === station.id
    );

    const isBusy = Boolean(activeSession);
    const isBooked = !isBusy && Boolean(upcomingBooking);

    return {
      station,
      status: isBusy ? ('busy' as const) : isBooked ? ('booked' as const) : ('free' as const),
      activeSession,
      upcomingBooking
    };
  });

  const totalCount = stations.length;
  const busyCount = stationStatusMap.filter(s => s.status === 'busy').length;
  const freeCount = stationStatusMap.filter(s => s.status === 'free').length;
  const bookedCount = stationStatusMap.filter(s => s.status === 'booked').length;
  const occupancyRate = totalCount > 0 ? Math.round((busyCount / totalCount) * 100) : 0;

  const filteredStations = stationStatusMap.filter(item => {
    if (filter === 'free') return item.status === 'free';
    if (filter === 'busy') return item.status === 'busy' || item.status === 'booked';
    return true;
  });

  const liveShareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?view=live` : '';

  const handleCopyShareLink = () => {
    if (liveShareUrl) {
      navigator.clipboard.writeText(liveShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      {/* Real-time Status Header */}
      <div className="p-4 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/60 via-black/80 to-blue-950/60 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/40 relative">
            <Radio className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-black animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-['Exo_2'] font-black text-lg text-white uppercase tracking-wider flex items-center gap-2">
                Live Station Occupancy Board
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live 3s Sync
              </span>
            </div>
            <p className="text-xs text-[#9c8fc6] mt-0.5">
              Real-time gaming console status for owner & staff across any phone or tablet • Last synced at <span className="text-purple-300 font-mono font-bold">{lastSynced}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> Refresh Now
            </button>
          )}

          <button
            onClick={handleCopyShareLink}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-blue-900/40 hover:brightness-110 cursor-pointer"
          >
            {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
            {copiedLink ? 'Link Copied!' : 'Share Live Mobile Board'}
          </button>
        </div>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-purple-500/20 bg-black/50 backdrop-blur-md flex flex-col justify-between">
          <span className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Total Gaming Stations</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-['Exo_2'] font-black text-2xl text-white">{totalCount}</span>
            <Monitor className="w-5 h-5 text-purple-400 opacity-60" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-md flex flex-col justify-between">
          <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Free & Ready
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-['Exo_2'] font-black text-2xl text-emerald-300">{freeCount}</span>
            <span className="text-xs font-bold text-emerald-400/80">Available Now</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 backdrop-blur-md flex flex-col justify-between">
          <span className="text-[11px] uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" /> Currently Busy
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-['Exo_2'] font-black text-2xl text-rose-300">{busyCount}</span>
            <span className="text-xs font-bold text-rose-400/80">Active Gamers</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 backdrop-blur-md flex flex-col justify-between">
          <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">Occupancy Rate</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-['Exo_2'] font-black text-2xl text-amber-300">{occupancyRate}%</span>
            <Flame className="w-5 h-5 text-amber-400 opacity-80" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-black/40 text-[#9c8fc6] hover:text-white'
            }`}
          >
            All Stations ({totalCount})
          </button>
          <button
            onClick={() => setFilter('free')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              filter === 'free'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-black/40 text-[#9c8fc6] hover:text-white'
            }`}
          >
            🟢 Free ({freeCount})
          </button>
          <button
            onClick={() => setFilter('busy')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              filter === 'busy'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-black/40 text-[#9c8fc6] hover:text-white'
            }`}
          >
            🔴 Busy ({busyCount})
          </button>
        </div>

        <span className="text-xs text-[#9c8fc6] hidden sm:inline-block font-semibold">
          Auto-updates instantly across mobile & desktop
        </span>
      </div>

      {/* Grid of Stations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredStations.map(({ station, status, activeSession, upcomingBooking }) => {
          const isBusy = status === 'busy';
          const isBooked = status === 'booked';

          return (
            <div
              key={station.id}
              className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden shadow-xl ${
                isBusy
                  ? 'border-rose-500/50 bg-gradient-to-b from-rose-950/40 via-purple-950/30 to-black/80 shadow-rose-950/30'
                  : isBooked
                  ? 'border-amber-500/40 bg-gradient-to-b from-amber-950/30 via-purple-950/20 to-black/80'
                  : 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 via-purple-950/20 to-black/80 hover:border-emerald-400'
              }`}
            >
              {/* Top Status Badge & Icon */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-xl border ${
                    isBusy
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : isBooked
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-['Exo_2'] font-black text-sm text-white uppercase tracking-wider">
                      {station.name}
                    </h3>
                    <div className="text-[10px] text-[#9c8fc6] mt-0.5">
                      ₹{station.price30}/30m • ₹{station.price60}/hr
                    </div>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1 shrink-0 ${
                  isBusy
                    ? 'bg-rose-500/25 text-rose-200 border-rose-500/50 animate-pulse'
                    : isBooked
                    ? 'bg-amber-500/25 text-amber-200 border-amber-500/50'
                    : 'bg-emerald-500/25 text-emerald-200 border-emerald-500/50'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isBusy ? 'bg-rose-400 animate-ping' : isBooked ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  {isBusy ? 'BUSY' : isBooked ? 'RESERVED' : 'FREE'}
                </span>
              </div>

              {/* Body: Active Gamer / Booking details */}
              {isBusy && activeSession ? (
                <div className="p-3 rounded-xl bg-black/60 border border-rose-500/30 flex flex-col gap-1.5 text-xs my-1">
                  <div className="flex items-center justify-between text-white font-bold">
                    <span className="flex items-center gap-1.5 text-rose-300">
                      <User className="w-3.5 h-3.5" /> {activeSession.name}
                    </span>
                    <span className="text-[10px] text-purple-300 font-mono bg-purple-950/60 px-1.5 py-0.5 rounded">
                      {activeSession.pm}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#9c8fc6]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-400" /> {activeSession.startTime} → {activeSession.endTime}
                    </span>
                    <span className="font-bold text-white">₹{activeSession.total}</span>
                  </div>
                </div>
              ) : isBooked && upcomingBooking ? (
                <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 flex flex-col gap-1.5 text-xs my-1">
                  <div className="flex items-center justify-between text-white font-bold">
                    <span className="flex items-center gap-1.5 text-amber-300">
                      <User className="w-3.5 h-3.5" /> {upcomingBooking.name}
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono">
                      Advance: ₹{upcomingBooking.advance}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#9c8fc6]">
                    <Clock className="w-3 h-3 text-amber-400" /> Reserved at {upcomingBooking.time} ({upcomingBooking.duration}m)
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 text-center text-xs text-emerald-300/80 font-semibold my-1">
                  Station is clean & open for walk-in
                </div>
              )}

              {/* Bottom status line */}
              <div className="mt-2 pt-2 border-t border-purple-500/20 flex items-center justify-between text-[10px] text-[#9c8fc6]">
                <span>Type: {station.kind}</span>
                <span className={isBusy ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {isBusy ? 'Session Running' : 'Ready'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
