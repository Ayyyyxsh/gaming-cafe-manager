import React, { useState, useMemo } from 'react';
import {
  Crown,
  ShieldCheck,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Phone,
  Trash2,
  Play,
  Filter,
  Search,
  Download,
  Database,
  Sparkles,
  Lock,
  LogOut,
  Plus,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Monitor,
  Check,
  Ban,
  FileText
} from 'lucide-react';
import { Booking, Station, Session } from '../types';
import { todayISO, fmtDateLong, to12, nowHHMM, generatePDFReport, generateBookingsPDFReport } from '../utils/helpers';

interface AdminPanelProps {
  adminProfile: { name: string; username: string } | null;
  singleSlotAvailable: boolean;
  bookings: Booking[];
  stations: Station[];
  sessions?: Session[];
  onSaveBooking: (booking: Partial<Booking>) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onDeleteBooking: (id: string) => void;
  onStartSessionFromBooking: (booking: Booking) => void;
  onLogout: () => void;
  onSwitchToCafeHUD: () => void;
  toast: (msg: string, kind?: 'ok' | 'warn' | 'info') => void;
  supabaseProjectId?: string;
  onRefreshData?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  adminProfile,
  singleSlotAvailable,
  bookings,
  stations,
  sessions = [],
  onSaveBooking,
  onUpdateBooking,
  onDeleteBooking,
  onStartSessionFromBooking,
  onLogout,
  onSwitchToCafeHUD,
  toast,
  supabaseProjectId = 'ozzywiqrdczjumdasedw',
  onRefreshData
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'converted' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming' | 'past'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isAddingBooking, setIsAddingBooking] = useState(false);

  // New Booking Form state (for admin manual entry)
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDate, setNewDate] = useState(todayISO());
  const [newTime, setNewTime] = useState(nowHHMM());
  const [newDuration, setNewDuration] = useState(60);
  const [newStationIds, setNewStationIds] = useState<string[]>([]);
  const [newAdvance, setNewAdvance] = useState(0);
  const [newNotes, setNewNotes] = useState('');

  const todayStr = todayISO();

  // Metrics
  const totalBookingsCount = bookings.length;
  const todayBookingsCount = bookings.filter(b => b.date === todayStr).length;
  const upcomingBookingsCount = bookings.filter(b => b.date >= todayStr && b.status !== 'cancelled' && b.status !== 'converted').length;
  const totalAdvanceCollected = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((acc, b) => acc + (Number(b.advance) || 0), 0);

  // Filtering
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Status filter
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;

      // Date filter
      if (dateFilter === 'today' && b.date !== todayStr) return false;
      if (dateFilter === 'upcoming' && b.date < todayStr) return false;
      if (dateFilter === 'past' && b.date >= todayStr) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (b.name || '').toLowerCase().includes(q);
        const phoneMatch = (b.phone || '').toLowerCase().includes(q);
        const notesMatch = (b.notes || '').toLowerCase().includes(q);
        const stationMatch = (b.stationIds || [b.stationId || '']).some(sId => sId.toLowerCase().includes(q));
        if (!nameMatch && !phoneMatch && !notesMatch && !stationMatch) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort by date descending, then time
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.time || '').localeCompare(a.time || '');
    });
  }, [bookings, statusFilter, dateFilter, searchQuery, todayStr]);

  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      toast('No bookings to export with current filters', 'warn');
      return;
    }

    const headers = ['Booking ID', 'Customer Name', 'Phone', 'Date', 'Time', 'Duration (Mins)', 'Advance (INR)', 'Stations', 'Status', 'Notes'];
    const rows = filteredBookings.map(b => [
      `"${b.id}"`,
      `"${(b.name || '').replace(/"/g, '""')}"`,
      `"${(b.phone || '').replace(/"/g, '""')}"`,
      `"${b.date || ''}"`,
      `"${b.time || ''}"`,
      b.duration || 60,
      b.advance || 0,
      `"${(b.stationIds || [b.stationId || '']).join(', ')}"`,
      `"${b.status}"`,
      `"${(b.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `omg_nero_bookings_export_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast(`Exported ${filteredBookings.length} bookings to CSV!`, 'ok');
  };

  const handleExportDayPDF = () => {
    if (!sessions || sessions.length === 0) {
      toast('No sessions recorded for today to export', 'warn');
      return;
    }
    generatePDFReport(todayISO(), sessions, {
      stations,
      managerName: adminProfile?.name || 'Administrator',
      cafeName: 'OH MY GAME — N.E.R.O SPORTS'
    });
    toast('Professional Day Audit PDF generated and downloaded!', 'ok');
  };

  const handleExportBookingsPDF = () => {
    if (filteredBookings.length === 0) {
      toast('No bookings to export with current filters', 'warn');
      return;
    }
    const filterLabel =
      dateFilter === 'today'
        ? "Today's Bookings"
        : dateFilter === 'upcoming'
        ? 'Upcoming Bookings'
        : dateFilter === 'past'
        ? 'Past Bookings'
        : 'All Bookings';
    generateBookingsPDFReport(filteredBookings, stations, 'OH MY GAME — N.E.R.O SPORTS', filterLabel);
    toast(`Exported ${filteredBookings.length} bookings to PDF!`, 'ok');
  };

  const handleCreateAdminBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast('Please enter customer name', 'warn');
      return;
    }
    if (newStationIds.length === 0 && stations.length > 0) {
      toast('Please select at least one station', 'warn');
      return;
    }

    onSaveBooking({
      name: newName.trim(),
      phone: newPhone.trim(),
      date: newDate || todayStr,
      time: newTime || nowHHMM(),
      duration: newDuration,
      stationIds: newStationIds.length > 0 ? newStationIds : [(stations[0]?.id || 'PC1')],
      stationId: newStationIds[0] || stations[0]?.id || 'PC1',
      advance: Number(newAdvance) || 0,
      notes: newNotes.trim(),
      status: Number(newAdvance) > 0 ? 'confirmed' : 'pending'
    });

    setNewName('');
    setNewPhone('');
    setNewAdvance(0);
    setNewNotes('');
    setNewStationIds([]);
    setIsAddingBooking(false);
    toast('Booking added successfully!', 'ok');
  };

  const getStationNames = (b: Booking) => {
    const ids = b.stationIds && b.stationIds.length > 0 ? b.stationIds : (b.stationId ? [b.stationId] : []);
    if (ids.length === 0) return 'Any Station';
    return ids.map(id => {
      const st = stations.find(s => s.id === id);
      return st ? st.name : id;
    }).join(', ');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Admin Header Bar */}
      <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-r from-[#170a2c] via-[#100720] to-[#080314] border border-purple-500/35 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.8),0_0_25px_rgba(168,85,247,0.15)] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Admin Identity */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg border border-purple-400/40">
              <Crown className="w-7 h-7 text-amber-300" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#100720]" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-['Exo_2'] font-black text-xl md:text-2xl text-white tracking-wider uppercase">
                Admin Control Panel
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Admin Active
              </span>
            </div>

            <p className="text-xs text-[#9c8fc6] mt-1 flex items-center gap-2 flex-wrap">
              <span>Admin: <strong className="text-white">{adminProfile?.name || 'Administrator'}</strong></span>
              {adminProfile?.username && (
                <>
                  <span>•</span>
                  <span className="text-purple-300 font-mono">@{adminProfile.username}</span>
                </>
              )}
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <Database className="w-3 h-3" /> Supabase Backend Connected
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
          {onRefreshData && (
            <button
              onClick={() => {
                onRefreshData();
                toast('Refreshing bookings data...', 'info');
              }}
              className="px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-purple-500/30 text-[#d6cdfa] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Refresh bookings from server"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sync</span>
            </button>
          )}

          <button
            onClick={() => setIsAddingBooking(!isAddingBooking)}
            className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-pink-400" />
            <span>{isAddingBooking ? 'Close Form' : 'New Booking'}</span>
          </button>

          {sessions && sessions.length > 0 && (
            <button
              onClick={handleExportDayPDF}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 border border-emerald-400/40 text-emerald-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Export professional, systematic Day Operations & Revenue Audit PDF"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Day PDF</span>
            </button>
          )}

          <button
            onClick={onSwitchToCafeHUD}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-900/60 to-cyan-950/60 hover:from-purple-900/80 hover:to-cyan-950/80 border border-cyan-500/40 text-cyan-200 hover:text-white text-xs font-['Exo_2'] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span>Café Live Station HUD</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Log out of Admin Panel"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Admin</span>
          </button>
        </div>
      </div>

      {/* Single Slot Enforced Security Banner */}
      <div className="p-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-black/40 to-black/40 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>Admin Single Slot Status: <strong className="text-emerald-400">Claimed & Locked (1/1)</strong></span>
              <span className="text-[9px] px-2 py-0.2 rounded-full font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                LOCKED
              </span>
            </div>
            <p className="text-[11px] text-[#9c8fc6] mt-0.5">
              Registration slot is completely closed. Nobody else is allowed to create an admin account.
            </p>
          </div>
        </div>

        <div className="text-[11px] text-[#9c8fc6] font-mono shrink-0 bg-black/40 px-3 py-1.5 rounded-xl border border-purple-500/20">
          Supabase Table: <span className="text-cyan-300">public.bookings</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Bookings */}
        <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/25 backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between text-[#9c8fc6] text-xs uppercase tracking-wider font-bold">
            <span>Total Bookings</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-['Exo_2'] text-white mt-2">
            {totalBookingsCount}
          </div>
          <p className="text-[11px] text-[#9c8fc6] mt-1">Recorded on website</p>
        </div>

        {/* Today's Bookings */}
        <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/25 backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between text-[#9c8fc6] text-xs uppercase tracking-wider font-bold">
            <span>Today's Bookings</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-['Exo_2'] text-cyan-300 mt-2">
            {todayBookingsCount}
          </div>
          <p className="text-[11px] text-[#9c8fc6] mt-1">{fmtDateLong(todayStr)}</p>
        </div>

        {/* Upcoming Bookings */}
        <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/25 backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between text-[#9c8fc6] text-xs uppercase tracking-wider font-bold">
            <span>Upcoming / Active</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-['Exo_2'] text-amber-300 mt-2">
            {upcomingBookingsCount}
          </div>
          <p className="text-[11px] text-[#9c8fc6] mt-1">Awaiting check-in</p>
        </div>

        {/* Total Advance Received */}
        <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/25 backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between text-[#9c8fc6] text-xs uppercase tracking-wider font-bold">
            <span>Advance Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-['Exo_2'] text-emerald-300 mt-2">
            ₹{totalAdvanceCollected}
          </div>
          <p className="text-[11px] text-[#9c8fc6] mt-1">Pre-paid booking deposit</p>
        </div>
      </div>

      {/* Manual Booking Drawer for Admin */}
      {isAddingBooking && (
        <form onSubmit={handleCreateAdminBooking} className="p-5 md:p-6 rounded-3xl bg-black/60 border border-purple-500/40 backdrop-blur-xl animate-in fade-in duration-200 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-3">
            <h3 className="font-['Exo_2'] font-bold text-base text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-pink-400" /> Add New Customer Booking
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingBooking(false)}
              className="text-xs text-[#9c8fc6] hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Customer Name *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-500/40 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Phone Number</label>
              <input
                type="text"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-500/40 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Date & Time</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <input
                  type="time"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Duration (Minutes)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[30, 60, 90, 120].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setNewDuration(m)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      newDuration === m
                        ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                        : 'bg-black/40 border-purple-500/20 text-[#9c8fc6] hover:text-white'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Advance Deposit Paid (₹)</label>
              <input
                type="number"
                min="0"
                step="10"
                value={newAdvance}
                onChange={e => setNewAdvance(Number(e.target.value))}
                placeholder="0"
                className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Notes / Game Requests</label>
              <input
                type="text"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="e.g. Valorant Tournament, 2 controllers"
                className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3 py-2 text-xs text-white placeholder-purple-500/40 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Station Selection */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Select Station(s) to Reserve</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {stations.map(st => {
                const isSel = newStationIds.includes(st.id);
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setNewStationIds(prev =>
                        prev.includes(st.id) ? prev.filter(id => id !== st.id) : [...prev, st.id]
                      );
                    }}
                    className={`p-2 rounded-xl text-center border text-xs font-bold transition-all cursor-pointer ${
                      isSel
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-pink-400 text-white shadow-md'
                        : 'bg-black/40 border-purple-500/20 text-[#9c8fc6] hover:text-white'
                    }`}
                  >
                    <div>{st.name}</div>
                    <div className="text-[10px] opacity-75">{st.kind}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-['Exo_2'] font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-600/30 cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Save Booking & Sync to Supabase
          </button>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/25 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#9c8fc6] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by customer, phone, notes, station..."
            className="w-full bg-black/60 border border-purple-500/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-purple-500/40 focus:outline-none focus:border-cyan-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#9c8fc6] hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-start md:justify-end">
          {/* Status filter */}
          <div className="flex items-center rounded-xl bg-black/60 border border-purple-500/30 p-0.5 text-xs">
            {(['all', 'confirmed', 'pending', 'converted', 'cancelled'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1.5 rounded-lg font-bold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-[#9c8fc6] hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Date filter */}
          <div className="flex items-center rounded-xl bg-black/60 border border-purple-500/30 p-0.5 text-xs">
            {(['all', 'today', 'upcoming', 'past'] as const).map(df => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-2.5 py-1.5 rounded-lg font-bold capitalize transition-all ${
                  dateFilter === df
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-[#9c8fc6] hover:text-white'
                }`}
              >
                {df}
              </button>
            ))}
          </div>

          {/* Export CSV & PDF */}
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download CSV spreadsheet of bookings"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleExportBookingsPDF}
            className="px-3 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/40 text-purple-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Download systematic, professional PDF audit report of bookings"
          >
            <FileText className="w-3.5 h-3.5 text-pink-400" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Bookings List / Cards */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-[#9c8fc6] px-1 font-bold">
          <span>Displaying {filteredBookings.length} of {bookings.length} Bookings</span>
          <span>Synced with Supabase: <code className="text-cyan-300 font-mono">{supabaseProjectId}</code></span>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-12 rounded-3xl bg-black/30 border border-purple-500/20 text-center flex flex-col items-center justify-center gap-3">
            <Calendar className="w-12 h-12 text-[#9c8fc6]/40" />
            <h4 className="font-['Exo_2'] font-bold text-base text-white">No Bookings Found</h4>
            <p className="text-xs text-[#9c8fc6] max-w-sm">
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search query or status/date filters above.'
                : 'No bookings have been made on the website yet. Customers can reserve a station on the Book a Station tab.'}
            </p>
            <button
              onClick={() => setIsAddingBooking(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
            >
              Create First Booking
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredBookings.map(b => {
              const isToday = b.date === todayStr;
              const isConfirmed = b.status === 'confirmed';
              const isConverted = b.status === 'converted';
              const isCancelled = b.status === 'cancelled';

              return (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                    isConverted
                      ? 'bg-black/30 border-purple-500/20 opacity-75'
                      : isCancelled
                      ? 'bg-black/30 border-rose-500/20 opacity-60'
                      : isToday
                      ? 'bg-gradient-to-br from-[#160b28] to-[#0a0515] border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                      : 'bg-black/40 border-purple-500/25'
                  }`}
                >
                  {/* Top: Customer & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                      <div className="font-['Exo_2'] font-bold text-base text-white flex items-center gap-2">
                        <span>{b.name || 'Gamer'}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded font-black text-[9px] uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            TODAY
                          </span>
                        )}
                      </div>
                      {b.phone ? (
                        <a
                          href={`tel:${b.phone}`}
                          className="text-xs text-purple-300 hover:text-white flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3 text-pink-400" />
                          <span>{b.phone}</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#9c8fc6] mt-0.5">No phone provided</span>
                      )}
                    </div>

                    {/* Status Pill */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0 ${
                      isConverted
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : isCancelled
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : isConfirmed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  {/* Middle: Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-black/40 border border-purple-500/15">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#9c8fc6] font-bold block">Date & Time</span>
                      <span className="text-white font-mono font-bold">{b.date} • {to12(b.time)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#9c8fc6] font-bold block">Duration</span>
                      <span className="text-cyan-300 font-bold">{b.duration || 60} mins</span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-[10px] uppercase tracking-wider text-[#9c8fc6] font-bold block">Station(s) Reserved</span>
                      <span className="text-purple-200 font-bold">{getStationNames(b)}</span>
                    </div>

                    {b.advance > 0 && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#9c8fc6] font-bold block">Advance Paid</span>
                        <span className="text-emerald-300 font-bold">₹{b.advance}</span>
                      </div>
                    )}

                    {b.notes && (
                      <div className={b.advance > 0 ? '' : 'col-span-2'}>
                        <span className="text-[10px] uppercase tracking-wider text-[#9c8fc6] font-bold block">Notes</span>
                        <span className="text-[#ece6ff] truncate block" title={b.notes}>{b.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Admin Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      {!isConverted && !isCancelled && (
                        <button
                          onClick={() => {
                            onStartSessionFromBooking(b);
                            toast(`Checked in ${b.name}! Session is now live.`, 'ok');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-['Exo_2'] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                          title="Check in customer and start live timer on station"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Check In</span>
                        </button>
                      )}

                      {!isConfirmed && !isConverted && !isCancelled && (
                        <button
                          onClick={() => {
                            onUpdateBooking(b.id, { status: 'confirmed' });
                            toast(`Booking for ${b.name} confirmed!`, 'ok');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Mark Confirmed"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm</span>
                        </button>
                      )}

                      {!isCancelled && !isConverted && (
                        <button
                          onClick={() => {
                            onUpdateBooking(b.id, { status: 'cancelled' });
                            toast(`Booking for ${b.name} marked cancelled`, 'info');
                          }}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs transition-all cursor-pointer"
                          title="Cancel Booking"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Delete booking record for ${b.name}?`)) {
                          onDeleteBooking(b.id);
                          toast('Booking deleted', 'ok');
                        }
                      }}
                      className="p-1.5 rounded-xl text-[#9c8fc6] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete Record"
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
  );
};
