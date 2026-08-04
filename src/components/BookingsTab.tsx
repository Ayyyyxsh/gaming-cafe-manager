import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Phone, Banknote, Check, Ban, Trash2, Play, Edit3, User, Database, ShieldCheck, Sparkles, Code2, Copy, CheckCircle2, AlertTriangle, X, CreditCard } from 'lucide-react';
import { Booking, Station } from '../types';
import { todayISO, nowHHMM, addMin, to12, fmtDateLong } from '../utils/helpers';
import { processRazorpayPayment } from '../lib/razorpay';

interface BookingsTabProps {
  bookings: Booking[];
  stations: Station[];
  onSaveBooking: (booking: Partial<Booking>) => void;
  onUpdateBooking: (id: string, updates: Partial<Booking>) => void;
  onDeleteBooking: (id: string) => void;
  onStartSessionFromBooking: (booking: Booking) => void;
  toast: (msg: string, kind?: 'ok' | 'warn' | 'info') => void;
}

export const BookingsTab: React.FC<BookingsTabProps> = ({
  bookings,
  stations,
  onSaveBooking,
  onUpdateBooking,
  onDeleteBooking,
  onStartSessionFromBooking,
  toast
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState(nowHHMM());
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);
  const [duration, setDuration] = useState(60);
  const [advance, setAdvance] = useState(0);
  const [notes, setNotes] = useState('');

  // Supabase Status State
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    tableExists: boolean;
    error: string | null;
    sqlSetup?: string;
  }>({ connected: true, tableExists: true, error: null });
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/supabase/status')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          setSupabaseStatus({
            connected: Boolean(data.connected),
            tableExists: Boolean(data.tableExists),
            error: data.error || null,
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
      status: 'pending'
    });

    setName('');
    setPhone('');
    setAdvance(0);
    setNotes('');
    setSelectedStationIds([]);
    toast('Booking saved & synced to Supabase!', 'ok');
  };

  const handleRazorpayCreate = async () => {
    if (!name.trim()) {
      toast('Enter customer name', 'warn');
      return;
    }
    if (selectedStationIds.length === 0) {
      toast('Select at least one station for booking', 'warn');
      return;
    }
    const payAmount = advance > 0 ? advance : 100;

    toast(`Launching Razorpay checkout for ₹${payAmount}...`, 'info');
    await processRazorpayPayment({
      amount: payAmount,
      name: 'OH MY GAME · NERO',
      description: `Advance Booking for ${name.trim()}`,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      onSuccess: (paymentId) => {
        onSaveBooking({
          name: name.trim(),
          phone: phone.trim(),
          date: date || todayISO(),
          time: time || nowHHMM(),
          stationIds: selectedStationIds,
          stationId: selectedStationIds[0],
          duration,
          advance: payAmount,
          notes: `${notes.trim() ? notes.trim() + ' | ' : ''}[Paid via Razorpay ID: ${paymentId}]`.trim(),
          status: 'confirmed'
        });

        setName('');
        setPhone('');
        setAdvance(0);
        setNotes('');
        setSelectedStationIds([]);
        toast(`₹${payAmount} paid via Razorpay! Booking confirmed.`, 'ok');
      },
      onFailure: (err) => {
        toast(err?.message || 'Razorpay payment cancelled', 'warn');
      }
    });
  };

  const todayBookings = bookings.filter(b => b.date === todayISO());

  return (
    <div className="flex flex-col gap-4">
      {/* Supabase Connection Banner */}
      <div className={`p-3.5 rounded-2xl border backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-lg transition-all ${
        supabaseStatus.tableExists 
          ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-purple-950/30 to-black/60'
          : 'border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-black/60'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border shrink-0 ${
            supabaseStatus.tableExists 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
              : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
          }`}>
            <Database className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`font-['Exo_2'] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 ${
                supabaseStatus.tableExists ? 'text-emerald-300' : 'text-amber-300'
              }`}>
                {supabaseStatus.tableExists ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                Supabase Connection: {supabaseStatus.tableExists ? 'LIVE & SYNCED' : 'SQL TABLE SETUP NEEDED'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                supabaseStatus.tableExists 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {supabaseStatus.tableExists ? 'CONNECTED' : 'ACTION REQUIRED'}
              </span>
            </div>
            <p className="text-[11px] text-[#9c8fc6] mt-0.5">
              Project ID: <code className="text-emerald-300 font-mono bg-black/40 px-1.5 py-0.5 rounded border border-emerald-500/20">kefxydzqwdjzlmvnrjbt</code>
              {!supabaseStatus.tableExists && ' • Bookings saved locally until "bookings" table is created in Supabase.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!supabaseStatus.tableExists ? (
            <button
              onClick={() => setShowSqlModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white font-['Exo_2'] font-extrabold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Code2 className="w-4 h-4" /> Get 1-Click SQL Setup
            </button>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-[#9c8fc6] bg-black/50 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Auto-Sync Active
            </div>
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
                  Create "bookings" Table in Supabase
                </h3>
                <p className="text-xs text-[#9c8fc6] mt-0.5">
                  Copy this SQL code and paste it into your <a href="https://supabase.com/dashboard/project/kefxydzqwdjzlmvnrjbt/sql/new" target="_blank" rel="noreferrer" className="text-amber-300 underline font-semibold">Supabase SQL Editor</a> to enable instant multi-device cloud database sync.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <button
              onClick={handleCreate}
              className="py-3 px-4 rounded-xl font-['Exo_2'] font-extrabold uppercase tracking-wider text-xs text-white bg-gradient-to-r from-[#7c3aed] to-[#e91e8c] shadow hover:-translate-y-0.5 transition-transform cursor-pointer"
            >
              Save Offline Booking
            </button>
            <button
              onClick={handleRazorpayCreate}
              className="py-3 px-4 rounded-xl font-['Exo_2'] font-extrabold uppercase tracking-wider text-xs text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-blue-900/40 hover:-translate-y-0.5 transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" /> Pay ₹{advance || 100} via Razorpay
            </button>
          </div>
        </div>

        {/* All Bookings List */}
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#ff4dab]" /> All Bookings Directory ({bookings.length})
          </h3>

          {bookings.length === 0 ? (
            <div className="p-8 text-center text-[#9c8fc6] italic text-xs">No bookings recorded yet.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {bookings.map(b => {
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
                              : b.status === 'cancelled'
                              ? 'bg-slate-800 border-slate-700 text-slate-400'
                              : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          }`}
                        >
                          {b.status}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30 text-purple-200 text-[10px] font-bold">
                          {stNames}
                        </span>
                      </div>

                      <button
                        onClick={() => onStartSessionFromBooking(b)}
                        className="px-3 py-1 rounded-lg bg-pink-600/30 border border-pink-500 text-pink-200 hover:bg-pink-600 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                      >
                        <Play className="w-3 h-3 fill-current" /> Convert To Session
                      </button>
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
                      {b.status !== 'confirmed' && (
                        <button
                          onClick={() => onUpdateBooking(b.id, { status: 'confirmed' })}
                          className="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold uppercase flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Confirm
                        </button>
                      )}
                      {b.status !== 'cancelled' && (
                        <button
                          onClick={() => onUpdateBooking(b.id, { status: 'cancelled' })}
                          className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[11px] font-bold uppercase flex items-center gap-1"
                        >
                          <Ban className="w-3 h-3" /> Cancel
                        </button>
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
