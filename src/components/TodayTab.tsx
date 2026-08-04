import React from 'react';
import {
  BarChart3,
  Download,
  Share2,
  Archive,
  CreditCard,
  DollarSign,
  Coffee,
  Clock,
  Tv,
  Gamepad2,
  FileText
} from 'lucide-react';
import { Session, Station } from '../types';
import {
  todayISO,
  fmtDateLong,
  cashOf,
  upiOf,
  to12,
  fmtMins,
  generatePDFReport,
  shareWhatsApp,
  escapeHtml
} from '../utils/helpers';

interface TodayTabProps {
  sessions: Session[];
  stations: Station[];
  onArchiveDay: () => void;
  toast: (msg: string, kind?: 'ok' | 'warn' | 'info') => void;
}

export const TodayTab: React.FC<TodayTabProps> = ({
  sessions,
  stations,
  onArchiveDay,
  toast
}) => {
  const ended = sessions.filter(s => s.status === 'ended');
  const active = sessions.filter(s => s.status === 'active');
  const reportSessions = sessions;

  const grandRevenue = sessions.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalCash = sessions.reduce((sum, s) => sum + cashOf(s), 0);
  const totalUpi = sessions.reduce((sum, s) => sum + upiOf(s), 0);
  const totalSnacks = sessions.reduce((sum, s) => sum + (s.snacks || 0), 0);
  const totalPending = sessions.reduce((sum, s) => (s.pm === 'Pending' ? sum + (s.total || 0) : sum), 0);

  const getKindRevenue = (kind: string) => {
    return sessions.reduce((sum, s) => {
      const ids = s.stationIds || [s.stationId];
      const matching = ids.filter(id => stations.find(st => st.id === id)?.kind === kind).length;
      if (!matching || !ids.length) return sum;
      return sum + ((s.gaming || 0) * matching) / ids.length;
    }, 0);
  };

  const getStationNames = (s: Session) => {
    const ids = s.stationIds || [s.stationId];
    return ids.map(id => stations.find(st => st.id === id)?.name || id).join(', ');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Today Header Overview Card */}
      <div className="p-6 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.7)] to-[rgba(19,13,36,0.8)] backdrop-blur-md flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(168,85,247,0.18)] pb-3">
          <div>
            <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#ff4dab]" /> Today's Financial Summary
            </h3>
            <span className="text-lg font-['Exo_2'] font-extrabold text-white mt-0.5 block">
              {fmtDateLong(todayISO())}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (reportSessions.length === 0) {
                  toast('No sessions to export today', 'warn');
                  return;
                }
                generatePDFReport(todayISO(), reportSessions);
                toast('PDF Report generated and downloaded!', 'ok');
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 border border-emerald-400/40 text-white font-['Exo_2'] font-extrabold text-xs uppercase tracking-wider hover:bg-emerald-500 transition-colors flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </button>

            <button
              onClick={() => {
                if (reportSessions.length === 0) {
                  toast('No sessions to share today', 'warn');
                  return;
                }
                shareWhatsApp(todayISO(), reportSessions);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 border border-emerald-500/40 text-white font-['Exo_2'] font-extrabold text-xs uppercase tracking-wider hover:bg-emerald-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Share2 className="w-4 h-4" /> WhatsApp Summary
            </button>

            <button
              onClick={onArchiveDay}
              className="px-3.5 py-2 rounded-xl bg-rose-600/30 border border-rose-500/50 text-rose-200 font-['Exo_2'] font-extrabold text-xs uppercase tracking-wider hover:bg-rose-600 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Archive className="w-4 h-4" /> End Day & Archive
            </button>
          </div>
        </div>

        {/* Big Grand Total Display */}
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#9c8fc6] font-bold">
            Grand Today Revenue • {sessions.length} sessions ({ended.length} completed, {active.length} active)
          </span>
          <span className="font-['Exo_2'] font-black text-5xl sm:text-6xl bg-gradient-to-r from-white via-pink-200 to-[#ff4dab] bg-clip-text text-transparent">
            ₹{grandRevenue}
          </span>
        </div>

        {/* Main Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
            <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">Cash Collected</span>
            <span className="font-['Exo_2'] font-extrabold text-2xl text-emerald-400 block mt-1">₹{totalCash}</span>
          </div>

          <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-950/20">
            <span className="text-[10px] uppercase font-bold text-sky-300 tracking-wider">UPI Received</span>
            <span className="font-['Exo_2'] font-extrabold text-2xl text-sky-400 block mt-1">₹{totalUpi}</span>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Snacks Revenue</span>
            <span className="font-['Exo_2'] font-extrabold text-2xl text-amber-400 block mt-1">₹{totalSnacks}</span>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20">
            <span className="text-[10px] uppercase font-bold text-rose-300 tracking-wider">Pending Dues</span>
            <span className="font-['Exo_2'] font-extrabold text-2xl text-rose-400 block mt-1">₹{totalPending}</span>
          </div>
        </div>

        {/* Category Revenue Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20">
            <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider">PC Gaming</span>
            <span className="font-['Exo_2'] font-extrabold text-xl text-purple-300 block mt-1">
              ₹{getKindRevenue('PC')}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-pink-500/30 bg-pink-950/20">
            <span className="text-[10px] uppercase font-bold text-pink-300 tracking-wider">PS5 Lounge</span>
            <span className="font-['Exo_2'] font-extrabold text-xl text-pink-300 block mt-1">
              ₹{getKindRevenue('PS5')}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Racing Sim</span>
            <span className="font-['Exo_2'] font-extrabold text-xl text-amber-300 block mt-1">
              ₹{getKindRevenue('RACE')}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20">
            <span className="text-[10px] uppercase font-bold text-cyan-300 tracking-wider">Custom/VIP</span>
            <span className="font-['Exo_2'] font-extrabold text-xl text-cyan-300 block mt-1">
              ₹{getKindRevenue('CUSTOM')}
            </span>
          </div>
        </div>

        {/* Detailed Session Breakdown Table */}
        <div className="mt-4 p-4 rounded-xl border border-[rgba(168,85,247,0.2)] bg-[rgba(8,3,15,0.4)] flex flex-col gap-2 overflow-x-auto">
          <h4 className="text-xs uppercase tracking-wider text-[#9c8fc6] font-bold flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-pink-400" /> Today's Session Detailed Log ({sessions.length})
          </h4>

          {sessions.length === 0 ? (
            <div className="p-6 text-center text-[#9c8fc6] italic text-xs">
              No sessions recorded today yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[rgba(168,85,247,0.2)] text-[#9c8fc6] font-['Exo_2'] font-extrabold uppercase tracking-wider">
                  <th className="p-2">#</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2">Station</th>
                  <th className="p-2">Slots</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">Snacks</th>
                  <th className="p-2">Note</th>
                  <th className="p-2">Payment</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-purple-900/10">
                    <td className="p-2 font-bold text-purple-300">{i + 1}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        s.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-2 font-bold text-white">{s.name}</td>
                    <td className="p-2 text-[#ece6ff]">{getStationNames(s)}</td>
                    <td className="p-2 text-[#9c8fc6]">{s.slots.map(sl => fmtMins(sl.mins)).join(' + ')}</td>
                    <td className="p-2 text-[#9c8fc6]">
                      {to12(s.startTime)} → {to12(s.endTime)}
                    </td>
                    <td className="p-2 text-[#9c8fc6]">
                      {s.cart.map(c => `${c.emoji}${c.name}×${c.qty}`).join(', ') || '—'}
                    </td>
                    <td className="p-2">
                      {s.note && s.note.trim() ? (
                        <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-400/40 text-[11px] font-semibold">
                          {s.note}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-2 text-[#ece6ff]">
                      {s.pm === 'Split' ? `Split ₹${s.cashAmt}/₹${s.upiAmt}` : s.pm}
                    </td>
                    <td className="p-2 text-right font-['Exo_2'] font-extrabold text-[#ff4dab]">₹{s.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
