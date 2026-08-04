import React, { useState } from 'react';
import { History, ChevronLeft, ChevronRight, Download, Share2, Trash2, Edit3, Calendar } from 'lucide-react';
import { Session, Station } from '../types';
import { pad, fmtDateLong, to12, fmtMins, generatePDFReport, shareWhatsApp, cashOf, upiOf } from '../utils/helpers';

interface HistoryTabProps {
  history: Record<string, Session[]>;
  stations: Station[];
  onDeleteHistoryDay: (date: string) => void;
  onDeleteHistoryRow: (date: string, id: string) => void;
  onEditHistoryRow: (date: string, session: Session) => void;
  toast: (msg: string, kind?: 'ok' | 'warn' | 'info') => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  history,
  stations,
  onDeleteHistoryDay,
  onDeleteHistoryRow,
  onEditHistoryRow,
  toast
}) => {
  const [currentDate] = useState(new Date());
  const [monthYear, setMonthYear] = useState({ y: currentDate.getFullYear(), m: currentDate.getMonth() });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const prevMonth = () => {
    setMonthYear(prev => {
      let m = prev.m - 1;
      let y = prev.y;
      if (m < 0) {
        m = 11;
        y--;
      }
      return { y, m };
    });
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setMonthYear(prev => {
      let m = prev.m + 1;
      let y = prev.y;
      if (m > 11) {
        m = 0;
        y++;
      }
      return { y, m };
    });
    setSelectedDate(null);
  };

  const monthLabel = new Date(monthYear.y, monthYear.m, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });

  const firstDayOfWeek = new Date(monthYear.y, monthYear.m, 1).getDay();
  const daysInMonth = new Date(monthYear.y, monthYear.m + 1, 0).getDate();

  const selectedSessions = selectedDate && history[selectedDate] ? history[selectedDate] : [];

  const getStationNames = (s: Session) => {
    const ids = s.stationIds || [s.stationId];
    return ids.map(id => stations.find(st => st.id === id)?.name || id).join(', ');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4">
      {/* Calendar Column */}
      <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-[rgba(168,85,247,0.2)] bg-[rgba(8,3,15,0.6)] text-white hover:border-pink-500 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-['Exo_2'] font-extrabold text-base text-white tracking-wider">
            {monthLabel}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-[rgba(168,85,247,0.2)] bg-[rgba(8,3,15,0.6)] text-white hover:border-pink-500 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[#9c8fc6] font-bold uppercase tracking-wider mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[50px] invisible" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const iso = `${monthYear.y}-${pad(monthYear.m + 1)}-${pad(dayNum)}`;
            const list = history[iso] || [];
            const hasData = list.length > 0;
            const dayRev = list.reduce((a, s) => a + (s.total || 0), 0);
            const isSelected = selectedDate === iso;

            return (
              <div
                key={iso}
                onClick={() => {
                  if (!hasData) {
                    toast('No archived sessions for this date', 'info');
                    return;
                  }
                  setSelectedDate(iso);
                }}
                className={`min-h-[50px] p-1.5 rounded-xl border flex flex-col justify-between cursor-pointer relative transition-all ${
                  isSelected
                    ? 'border-[#e91e8c] bg-gradient-to-br from-purple-900/40 to-pink-900/40 shadow-[0_0_0_2px_rgba(233,30,140,0.4)]'
                    : hasData
                    ? 'border-purple-500/40 bg-purple-950/20 hover:border-pink-500'
                    : 'border-white/5 bg-black/20 opacity-40 hover:opacity-100'
                }`}
              >
                <span className="font-['Exo_2'] font-bold text-xs text-white">{dayNum}</span>
                {hasData && (
                  <span className="text-[10px] text-[#ff4dab] font-extrabold truncate">
                    ₹{dayRev}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Panel */}
      <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md flex flex-col gap-3">
        {!selectedDate || !history[selectedDate] ? (
          <div className="p-12 text-center text-[#9c8fc6] flex flex-col items-center justify-center gap-2">
            <Calendar className="w-8 h-8 text-purple-400 opacity-60" />
            <span className="font-bold text-sm text-white">Select a highlighted calendar date</span>
            <span className="text-xs italic">
              Click any date with recorded revenue to view session logs and download PDF reports.
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
              <h3 className="text-xs uppercase tracking-wider text-[#9c8fc6] font-extrabold flex items-center gap-2">
                <History className="w-4 h-4 text-[#ff4dab]" /> {fmtDateLong(selectedDate)}
              </h3>
              <button
                onClick={() => onDeleteHistoryDay(selectedDate)}
                className="px-2.5 py-1 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-bold uppercase transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Day
              </button>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#9c8fc6]">Day Total Revenue</span>
                <div className="font-['Exo_2'] font-black text-3xl text-white">
                  ₹{selectedSessions.reduce((a, s) => a + (s.total || 0), 0)}
                </div>
              </div>
              <span className="text-xs text-[#9c8fc6] font-semibold">{selectedSessions.length} sessions</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 text-xs">
                <span className="text-[9px] uppercase font-bold text-emerald-300">Cash</span>
                <span className="font-['Exo_2'] font-bold text-emerald-400 block">
                  ₹{selectedSessions.reduce((a, s) => a + cashOf(s), 0)}
                </span>
              </div>

              <div className="p-2 rounded-lg border border-sky-500/30 bg-sky-950/20 text-xs">
                <span className="text-[9px] uppercase font-bold text-sky-300">UPI</span>
                <span className="font-['Exo_2'] font-bold text-sky-400 block">
                  ₹{selectedSessions.reduce((a, s) => a + upiOf(s), 0)}
                </span>
              </div>

              <div className="p-2 rounded-lg border border-amber-500/30 bg-amber-950/20 text-xs">
                <span className="text-[9px] uppercase font-bold text-amber-300">Snacks</span>
                <span className="font-['Exo_2'] font-bold text-amber-400 block">
                  ₹{selectedSessions.reduce((a, s) => a + (s.snacks || 0), 0)}
                </span>
              </div>
            </div>

            {/* Session Records Table */}
            <div className="overflow-x-auto max-h-[300px] border border-white/10 rounded-xl p-2 bg-black/20">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[#9c8fc6] font-bold uppercase">
                    <th className="p-1.5">#</th>
                    <th className="p-1.5">Customer</th>
                    <th className="p-1.5">Station</th>
                    <th className="p-1.5">Time</th>
                    <th className="p-1.5">Pay</th>
                    <th className="p-1.5">Total</th>
                    <th className="p-1.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSessions.map((s, i) => (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-purple-900/10">
                      <td className="p-1.5 font-bold text-purple-300">{i + 1}</td>
                      <td className="p-1.5 font-bold text-white">{s.name}</td>
                      <td className="p-1.5 text-[#ece6ff]">{getStationNames(s)}</td>
                      <td className="p-1.5 text-[#9c8fc6]">
                        {to12(s.startTime)} → {to12(s.endTime)}
                      </td>
                      <td className="p-1.5 text-[#ece6ff]">{s.pm}</td>
                      <td className="p-1.5 font-['Exo_2'] font-bold text-[#ff4dab]">₹{s.total}</td>
                      <td className="p-1.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditHistoryRow(selectedDate, s)}
                            className="p-1 rounded text-slate-300 hover:text-white"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteHistoryRow(selectedDate, s.id)}
                            className="p-1 rounded text-rose-400 hover:text-rose-300"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => {
                  generatePDFReport(selectedDate, selectedSessions);
                  toast('Historical PDF exported', 'ok');
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow"
              >
                <Download className="w-4 h-4" /> Export Day PDF
              </button>

              <button
                onClick={() => shareWhatsApp(selectedDate, selectedSessions)}
                className="flex-1 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow"
              >
                <Share2 className="w-4 h-4" /> Share WhatsApp
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
