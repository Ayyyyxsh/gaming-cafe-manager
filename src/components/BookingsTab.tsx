import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Phone, Banknote, Check, Ban, Trash2, Play, Edit3, User, Database, ShieldCheck, Sparkles, Code2, Copy, CheckCircle2, AlertTriangle, X, Search, Filter, Crown } from 'lucide-react';
import { Booking, Station } from '../types';
import { todayISO, nowHHMM, addMin, to12, fmtDateLong } from '../utils/helpers';

interface BookingsTabProps {
  bookings: Booking[];
  stations: Station[];
  onSaveBooking: (booking: Partial<Booking>) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onDeleteBooking: (id: string) => void;
  onStartSessionFromBooking: (booking: Booking) => void;
  toast: (msg: string, kind?: 'ok' | 'warn' | 'info') => void;
  isAdmin?: boolean;
}

export const BookingsTab: React.FC<BookingsTabProps> = ({
  bookings,
  stations,
  onSaveBooking,
  onUpdateBooking,
  onDeleteBooking,
  onStartSessionFromBooking,
  toast,
  isAdmin = false
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState(nowHHMM());
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);
  const [duration, setDuration] = useState(60);
  const [advance, setAdvance] = useState(0);
  const [notes, setNotes] = useState('');

  // Admin Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'converted' | 'cancelled'>('all');

  // Supabase Status State
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    configured?: boolean;
    tableExists: boolean;
    projectId?: string | null;
    error: string | null;
    message?: string;
    sqlSetup?: string;
  }>({ connected: false, configured: false, tableExists: false, error: null });
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/supabase/status')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setSupabaseStatus({
            connected: Boolean(data.connected),
            configured: Boolean(data.configured),
            tableExists: Boolean(data.tableExists),
            projectId: data.projectId || null,
            error: data.error || null,
            message: data.message,
            sqlSetup: data.sqlSetup
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleCopySql = () => {
    if (supabaseStatus.sqlSetup) {
      navigator.clipboard.writeText(supabaseStatus.sqlSetup);
      setCopied(true);
      toast('SQL script copied to clipboard!', 'ok');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const toggleStation = (id: string) => {
    setSelectedStationIds(prev =>
      prev.includes(id) ? prev.filter(stId => stId !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast('Enter customer name', 'warn');
      return;
    }
    if (selectedStationIds.length === 0) {
      toast('Select at least one station for booking', 'warn');
      return;
    }

    onSaveBooking({
      name: name.trim(),
      phone: phone.trim(),
      date: date || todayISO(),
      time: time || nowHHMM(),
      stationIds: selectedStationIds,
      stationId: selectedStationIds[0],
      duration,
      advance,
      notes: notes.trim(),
      status: advance > 0 ? 'confirmed' : 'pending'
    });

    setName('');
    setPhone('');
    setAdvance(0);
    setNotes('');
    setSelectedStationIds([]);
    toast('Booking saved & confirmed successfully!', 'ok');
  };

  const todayBookings = bookings.filter(b => b.date === todayISO());

  const filteredBookings = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.name.toLowerCase().includes(q);
      const matchPhone = (b.phone || '').includes(q);
      const matchDate = (b.date || '').includes(q);
      const matchNotes = (b.notes || '').toLowerCase().includes(q);
      const matchStation = (b.stationIds || [b.stationId]).some(id => {
        const s = stations.find(st => st.id === id);
        return s?.name.toLowerCase().includes(q) || id.toLowerCase().includes(q);
      });
      return matchName || matchPhone || matchDate || matchNotes || matchStation;
    }
    return true;
  });

  const totalAdvance = bookings.reduce((sum, b) => sum + (b.advance || 0), 0);
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const convertedCount = bookings.filter(b => b.status === 'converted').length;

  return (
    <div className="flex flex-col gap-4">
      {/* Database Connection Banner */}
      <div className={`p-3.5 rounded-2xl border backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-lg transition-all ${
        supabaseStatus.configured && supabaseStatus.tableExists 
          ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-purple-950/30 to-black/60'
          : supabaseStatus.configured
          ? 'border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-black/60'
          : 'border-purple-500/30 bg-gradient-to-r from-purple-950/30 via-black/70 to-black/60'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border shrink-0 ${
            supabaseStatus.configured && supabaseStatus.tableExists 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
              : supabaseStatus.configured
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              : 'bg-purple-500/20 text-purple-400 border-purple-500/40'
          }`}>
            <Database className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`font-['Exo_2'] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 ${
                supabaseStatus.configured && supabaseStatus.tableExists
                  ? 'text-emerald-300'
                  : supabaseStatus.configured
                  ? 'text-amber-300'
                  : 'text-purple-300'
              }`}>
                {supabaseStatus.configured && supabaseStatus.tableExists ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : supabaseStatus.configured ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                )}
                {supabaseStatus.configured && supabaseStatus.tableExists
                  ? 'Supabase Cloud: LIVE & SYNCED (Bookings & Sessions)'
                  : supabaseStatus.configured
                  ? 'Supabase Cloud: TABLES SETUP NEEDED'
                  : 'Database Engine: LOCAL PERSISTENT STORAGE ACTIVE'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                supabaseStatus.configured && supabaseStatus.tableExists 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : supabaseStatus.configured
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
              }`}>
                {supabaseStatus.configured && supabaseStatus.tableExists
                  ? 'CONNECTED'
                  : supabaseStatus.configured
                  ? 'ACTION REQUIRED'
                  : 'READY'}
              </span>
            </div>
            <p className="text-[11px] text-[#9c8fc6] mt-0.5">
              {supabaseStatus.configured && supabaseStatus.projectId ? (
                <>
                  Project ID: <code className="text-emerald-300 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-emerald-500/20">{supabaseStatus.projectId}</code>
                  {supabaseStatus.tableExists 
                    ? ' • Connected! Every booking and gaming session is automatically saved to your Supabase tables.' 
                    : ' • Connected! Run the SQL setup script once in Supabase SQL editor to create the "bookings" & "sessions" tables.'}
                </>
              ) : (
                'All bookings and sessions are automatically saved to server persistent storage (data/db.json). Zero latency.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {supabaseStatus.configured && !supabaseStatus.tableExists ? (
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white font-['Exo_2'] font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Code2 className="w-4 h-4" /> Get 1-Click SQL Setup
            </button>
          ) : supabaseStatus.configured && supabaseStatus.tableExists ? (
            <div className="flex items-center gap-2 text-[11px] text-[#9c8fc6] bg-black/50 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Bookings & Sessions Synced
            </div>
          ) : (
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-purple-400" /> Cloud Sync Setup
            </button>
          )}
        </div>
      </div>

      {/* SQL Setup Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#120b24] border border-amber-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowSqlModal(false)}
              className="absolute top-4 right-4 text-[#9c8fc6] hover:text-white p-1 rounded-lg bg-white/5 hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Code2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-['Exo_2'] font-black text-lg text-white uppercase tracking-wider">
                  Create "bookings" & "sessions" Tables in Supabase
                </h3>
                <p className="text-xs text-[#9c8fc6] mt-0.5">
                  Copy this SQL code and paste it into your <a href={`https://supabase.com/dashboard/project/${supabaseStatus.projectId || 'ozzywiqrdczjumdasedw'}/sql/new`} target="_blank" rel="noreferrer" className="text-amber-300 underline font-semibold">Supabase SQL Editor ({supabaseStatus.projectId || 'ozzywiqrdczjumdasedw'})</a> to enable instant multi-device cloud database sync.
                </p>
              </div>
            </div>

            <div className="relative bg-black/80 border border-purple-500/30 rounded-2xl p-4 font-mono text-xs text-emerald-300 overflow-x-auto max-h-60 leading-relaxed shadow-inner">
              <pre>{supabaseStatus.sqlSetup}</pre>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-[#9c8fc6]">
                Steps: Open Supabase Dashboard ➔ SQL Editor ➔ Paste SQL ➔ Click "Run"
              </span>
              <button
                onClick={handleCopySql}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-purple-600 text-white font-['Exo_2'] font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-4">

      {/* Create & List Column */}
      <div className="flex flex-col gap-4">
        {/* New Booking Form */}
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md flex flex-col gap-3">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#ff4dab]" /> Create Advance Booking
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Customer Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Customer name"
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Booking Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Start Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Duration</label>
              <select
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              >
                <option value={30}>30 mins</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Select Station(s)</label>
            <div className="flex flex-wrap gap-2 p-2 border border-[rgba(168,85,247,0.2)] rounded-xl bg-black/20">
              {stations.map(st => {
                const isSelected = selectedStationIds.includes(st.id);
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => toggleStation(st.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-purple-600 border-[#e91e8c] text-white shadow'
                        : 'bg-slate-900/60 border-slate-700 text-[#9c8fc6] hover:border-purple-500'
                    }`}
                  >
                    {st.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Advance Paid (₹)</label>
              <input
                type="number"
                value={advance || ''}
                onChange={e => setAdvance(Number(e.target.value) || 0)}
                placeholder="0"
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Special Notes</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Special controller requests, group bookings..."
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              />
            </div>
          </div>

          <div className="mt-2">
            <button
              onClick={handleCreate}
              className="w-full py-3 px-4 rounded-xl font-['Exo_2'] font-extrabold uppercase tracking-wider text-xs text-white bg-gradient-to-r from-[#7c3aed] to-[#e91e8c] shadow-lg shadow-purple-900/40 hover:-translate-y-0.5 transition-transform cursor-pointer flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Save & Confirm Booking
            </button>
          </div>
        </div>

        {/* All Bookings List */}
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#ff4dab]" /> 
              {isAdmin ? 'Admin Bookings Control Center' : 'All Bookings Directory'} ({bookings.length})
            </h3>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                  Total Advance: ₹{totalAdvance}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black">
                  Confirmed: {confirmedCount}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                  Pending: {pendingCount}
                </span>
              </div>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 mb-3 pt-1 border-t border-white/5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by customer, phone, date, station..."
                className="w-full bg-black/50 border border-purple-500/25 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-purple-400/40 outline-none focus:border-cyan-400 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {(['all', 'confirmed', 'pending', 'converted', 'cancelled'] as const).map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all border cursor-pointer ${
                    statusFilter === status
                      ? 'bg-purple-600 border-purple-400 text-white shadow'
                      : 'bg-black/40 border-purple-500/20 text-[#9c8fc6] hover:text-white'
                  }`}
                >
                  {status === 'all' ? `All (${bookings.length})` : status}
                </button>
              ))}
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-[#9c8fc6] italic text-xs">
              {searchQuery || statusFilter !== 'all' 
                ? 'No bookings match your current search/filter.' 
                : 'No bookings recorded yet.'}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredBookings.map(b => {
                const stNames = (b.stationIds || [b.stationId])
                  .map(id => stations.find(st => st.id === id)?.name || id)
                  .join(', ');
                const endT = addMin(b.time, b.duration);

                return (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl border border-[rgba(168,85,247,0.18)] bg-[rgba(19,13,36,0.6)] flex flex-col gap-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-['Exo_2'] font-bold text-sm text-white">{b.name}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            b.status === 'confirmed'
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : b.status === 'converted'
                              ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                              : b.status === 'cancelled'
                              ? 'bg-slate-800 border-slate-700 text-slate-400'
                              : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          }`}
                        >
                          {b.status === 'converted' ? 'Converted' : b.status}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30 text-purple-200 text-[10px] font-bold">
                          {stNames}
                        </span>
                      </div>

                      {b.status === 'converted' ? (
                        <div className="px-3 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/50 text-cyan-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> In Session
                        </div>
                      ) : (
                        <button
                          onClick={() => onStartSessionFromBooking(b)}
                          className="px-3 py-1 rounded-lg bg-pink-600/30 border border-pink-500 text-pink-200 hover:bg-pink-600 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" /> Convert To Session
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#9c8fc6]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-400" /> {fmtDateLong(b.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-purple-400" /> {to12(b.time)} → {to12(endT)} ({b.duration}m)
                      </span>
                      {b.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-purple-400" /> {b.phone}
                        </span>
                      )}
                      {b.advance > 0 && (
                        <span className="text-emerald-400 font-bold">Advance: ₹{b.advance}</span>
                      )}
                    </div>

                    {b.notes && (
                      <div className="text-xs text-pink-200 bg-pink-950/20 p-2 rounded border border-pink-500/20">
                        {b.notes}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-1 border-t border-white/5 pt-2">
                      {b.status !== 'confirmed' && b.status !== 'converted' && (
                        <button
                          onClick={() => onUpdateBooking(b.id, { status: 'confirmed' })}
                          className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold uppercase flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Confirm
                        </button>
                      )}
                      {b.status !== 'cancelled' && b.status !== 'converted' && (
                        <button
                          onClick={() => onUpdateBooking(b.id, { status: 'cancelled' })}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[11px] font-bold uppercase flex items-center gap-1"
                        >
                          <Ban className="w-3 h-3" /> Cancel
                        </button>
                      )}
                      {b.status === 'converted' && (
                        <span className="text-[11px] text-cyan-300 flex items-center gap-1.5 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Active Session Created
                        </span>
                      )}
                      <button
                        onClick={() => onDeleteBooking(b.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 ml-auto"
                        title="Delete booking"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: Today's Bookings */}
      <div className="flex flex-col gap-4">
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#ff4dab]" /> Today's Scheduled Bookings ({todayBookings.length})
          </h3>

          {todayBookings.length === 0 ? (
            <div className="p-4 text-center text-[#9c8fc6] italic text-xs">No bookings scheduled for today.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {todayBookings.map(b => (
                <div key={b.id} className="p-2.5 rounded-xl border border-[rgba(168,85,247,0.2)] bg-black/40">
                  <div className="font-bold text-xs text-white flex items-center justify-between">
                    <span>{b.name}</span>
                    <span className="text-pink-400">{to12(b.time)}</span>
                  </div>
                  <div className="text-[11px] text-[#9c8fc6] mt-0.5">
                    {(b.stationIds || [b.stationId]).join(', ')} • {b.duration} min
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10">
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {b.advance > 0 ? `Adv: ₹${b.advance}` : 'No Adv'}
                    </span>
                    {b.status === 'converted' ? (
                      <span className="text-[10px] text-cyan-300 font-bold uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> In Session
                      </span>
                    ) : (
                      <button
                        onClick={() => onStartSessionFromBooking(b)}
                        className="px-2 py-0.5 rounded bg-pink-600/30 border border-pink-500 text-pink-200 hover:bg-pink-600 hover:text-white text-[10px] font-bold uppercase flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" /> Convert
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};
