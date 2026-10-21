import React, { useState, useMemo, useEffect } from 'react';
import {
  History,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Trash2,
  Edit3,
  Calendar,
  TrendingUp,
  BarChart3,
  Search,
  Clock,
  CreditCard,
  Coffee,
  Gamepad2,
  Eye,
  CheckCircle2,
  DollarSign,
  Layers
} from 'lucide-react';
import { Session, Station } from '../types';
import {
  pad,
  fmtDateLong,
  to12,
  generatePDFReport,
  shareWhatsApp,
  cashOf,
  upiOf,
  todayISO
} from '../utils/helpers';

interface HistoryTabProps {
  history: Record<string, Session[]>;
  currentSessions?: Session[];
  stations: Station[];
  onDeleteHistoryDay: (date: string) => void;
  onDeleteHistoryRow: (date: string, id: string) => void;
  onEditHistoryRow: (date: string, session: Session) => void;
  toast: (msg: string, kind?: 'ok' | 'warn' | 'info') => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  history,
  currentSessions = [],
  stations,
  onDeleteHistoryDay,
  onDeleteHistoryRow,
  onEditHistoryRow,
  toast
}) => {
  const [currentDate] = useState(new Date());
  const [monthYear, setMonthYear] = useState({ y: currentDate.getFullYear(), m: currentDate.getMonth() });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'dayToDay' | 'calendar'>('dayToDay');
  const [searchDayQuery, setSearchDayQuery] = useState('');
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');

  // 1. Merge archived history with any floor/current sessions grouped by true operating date
  const combinedHistory = useMemo(() => {
    const map: Record<string, Session[]> = {};

    // 1. Populate from history archive, ensuring each session maps to its actual operating date
    if (history) {
      for (const [dateKey, list] of Object.entries(history)) {
        if (Array.isArray(list) && list.length > 0) {
          list.forEach(s => {
            const d = (s.date && typeof s.date === 'string' && s.date.trim())
              ? s.date.split('T')[0]
              : dateKey;
            if (!map[d]) {
              map[d] = [];
            }
            if (!map[d].some(existing => existing.id === s.id)) {
              map[d].push(s);
            }
          });
        }
      }
    }

    // 2. Merge all current floor & ended sessions by their operating date
    if (currentSessions && currentSessions.length > 0) {
      currentSessions.forEach(s => {
        const d = (s.date && typeof s.date === 'string' && s.date.trim())
          ? s.date.split('T')[0]
          : todayISO();
        if (!map[d]) {
          map[d] = [];
        }
        if (!map[d].some(existing => existing.id === s.id)) {
          map[d].push(s);
        }
      });
    }

    return map;
  }, [history, currentSessions]);

  // All recorded dates sorted newest first (YYYY-MM-DD)
  const allRecordedDates = useMemo(() => {
    return Object.keys(combinedHistory).sort((a, b) => b.localeCompare(a));
  }, [combinedHistory]);

  // Auto-select latest active date if none selected or if selected date has no data
  useEffect(() => {
    if (allRecordedDates.length > 0) {
      if (!selectedDate || !combinedHistory[selectedDate]) {
        const latest = allRecordedDates[0];
        setSelectedDate(latest);
        // Sync calendar month to latest recorded date
        const [yStr, mStr] = latest.split('-');
        const yNum = parseInt(yStr, 10);
        const mNum = parseInt(mStr, 10) - 1;
        if (!isNaN(yNum) && !isNaN(mNum)) {
          setMonthYear({ y: yNum, m: mNum });
        }
      }
    }
  }, [allRecordedDates, selectedDate, combinedHistory]);

  const handleSelectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    const [yStr, mStr] = dateKey.split('-');
    const yNum = parseInt(yStr, 10);
    const mNum = parseInt(mStr, 10) - 1;
    if (!isNaN(yNum) && !isNaN(mNum)) {
      setMonthYear({ y: yNum, m: mNum });
    }
  };

  // Aggregate Metrics Across ALL Day-to-Day History
  const totalAllTimeRevenue = useMemo(() => {
    return allRecordedDates.reduce((sum, d) => {
      const list = combinedHistory[d] || [];
      return sum + list.reduce((a, s) => a + (Number(s.total) || 0), 0);
    }, 0);
  }, [combinedHistory, allRecordedDates]);

  const totalAllTimeGaming = useMemo(() => {
    return allRecordedDates.reduce((sum, d) => {
      const list = combinedHistory[d] || [];
      return sum + list.reduce((a, s) => a + (Number(s.gaming) || 0), 0);
    }, 0);
  }, [combinedHistory, allRecordedDates]);

  const totalAllTimeSnacks = useMemo(() => {
    return allRecordedDates.reduce((sum, d) => {
      const list = combinedHistory[d] || [];
      return sum + list.reduce((a, s) => a + (Number(s.snacks) || 0), 0);
    }, 0);
  }, [combinedHistory, allRecordedDates]);

  const totalAllTimeCash = useMemo(() => {
    return allRecordedDates.reduce((sum, d) => {
      const list = combinedHistory[d] || [];
      return sum + list.reduce((a, s) => a + cashOf(s), 0);
    }, 0);
  }, [combinedHistory, allRecordedDates]);

  const totalAllTimeUpi = useMemo(() => {
    return allRecordedDates.reduce((sum, d) => {
      const list = combinedHistory[d] || [];
      return sum + list.reduce((a, s) => a + upiOf(s), 0);
    }, 0);
  }, [combinedHistory, allRecordedDates]);

  const totalAllTimeSessionsCount = useMemo(() => {
    return allRecordedDates.reduce((sum, d) => sum + (combinedHistory[d] || []).length, 0);
  }, [combinedHistory, allRecordedDates]);

  const totalOperatingDaysCount = allRecordedDates.length;
  const avgDailyRevenue = totalOperatingDaysCount > 0
    ? Math.round(totalAllTimeRevenue / totalOperatingDaysCount)
    : 0;

  // Selected Month Revenue & Metrics
  const selectedMonthPrefix = `${monthYear.y}-${pad(monthYear.m + 1)}`;
  const monthDates = useMemo(() => {
    return allRecordedDates.filter(d => d.startsWith(selectedMonthPrefix));
  }, [allRecordedDates, selectedMonthPrefix]);

  const totalMonthRevenue = useMemo(() => {
    return monthDates.reduce((sum, d) => {
      return sum + (combinedHistory[d] || []).reduce((a, s) => a + (Number(s.total) || 0), 0);
    }, 0);
  }, [monthDates, combinedHistory]);

  const totalMonthSessions = useMemo(() => {
    return monthDates.reduce((sum, d) => sum + (combinedHistory[d] || []).length, 0);
  }, [monthDates, combinedHistory]);

  // Peak Day identification
  const peakDayInfo = useMemo(() => {
    let peakDate = '';
    let peakRev = 0;
    allRecordedDates.forEach(d => {
      const list = combinedHistory[d] || [];
      const r = list.reduce((a, s) => a + (Number(s.total) || 0), 0);
      if (r > peakRev) {
        peakRev = r;
        peakDate = d;
      }
    });
    return { date: peakDate, revenue: peakRev };
  }, [combinedHistory, allRecordedDates]);

  // Filtered Day-to-Day List for Ledger View
  const filteredDayToDayDates = useMemo(() => {
    if (!searchDayQuery.trim()) return allRecordedDates;
    const q = searchDayQuery.trim().toLowerCase();
    return allRecordedDates.filter(d => {
      const fullDateStr = fmtDateLong(d).toLowerCase();
      return d.toLowerCase().includes(q) || fullDateStr.includes(q);
    });
  }, [allRecordedDates, searchDayQuery]);

  // Calendar calculations
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
  };

  const monthLabel = new Date(monthYear.y, monthYear.m, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });

  const firstDayOfWeek = new Date(monthYear.y, monthYear.m, 1).getDay();
  const daysInMonth = new Date(monthYear.y, monthYear.m + 1, 0).getDate();

  // Selected Day Sessions & Details
  const selectedSessions = useMemo(() => {
    return selectedDate && combinedHistory[selectedDate] ? combinedHistory[selectedDate] : [];
  }, [selectedDate, combinedHistory]);

  const filteredSelectedSessions = useMemo(() => {
    if (!sessionSearchQuery.trim()) return selectedSessions;
    const q = sessionSearchQuery.trim().toLowerCase();
    return selectedSessions.filter(s => {
      const nameMatch = (s.name || '').toLowerCase().includes(q);
      const phoneMatch = (s.phone || '').toLowerCase().includes(q);
      const stationMatch = (s.stationIds || [s.stationId || '']).some(st => st.toLowerCase().includes(q));
      return nameMatch || phoneMatch || stationMatch;
    });
  }, [selectedSessions, sessionSearchQuery]);

  const selectedDayTotalRev = useMemo(() => {
    return selectedSessions.reduce((a, s) => a + (Number(s.total) || 0), 0);
  }, [selectedSessions]);

  const selectedDayGamingRev = useMemo(() => {
    return selectedSessions.reduce((a, s) => a + (Number(s.gaming) || 0), 0);
  }, [selectedSessions]);

  const selectedDaySnacksRev = useMemo(() => {
    return selectedSessions.reduce((a, s) => a + (Number(s.snacks) || 0), 0);
  }, [selectedSessions]);

  const selectedDayCash = useMemo(() => {
    return selectedSessions.reduce((a, s) => a + cashOf(s), 0);
  }, [selectedSessions]);

  const selectedDayUpi = useMemo(() => {
    return selectedSessions.reduce((a, s) => a + upiOf(s), 0);
  }, [selectedSessions]);

  const getStationNames = (s: Session) => {
    const ids = s.stationIds || [s.stationId];
    return ids.map(id => stations.find(st => st.id === id)?.name || id).join(', ');
  };

  // Reusable Selected Day Financial Inspector
  const renderDayInspector = () => (
    <div className="p-4 sm:p-5 rounded-2xl border border-purple-500/25 bg-gradient-to-b from-[#180e2b]/90 to-[#0e071c]/95 backdrop-blur-md flex flex-col gap-3.5 shadow-xl">
      {!selectedDate || !combinedHistory[selectedDate] ? (
        <div className="p-12 text-center text-[#9c8fc6] flex flex-col items-center justify-center gap-2">
          <Calendar className="w-10 h-10 text-purple-400 opacity-60" />
          <span className="font-bold text-sm text-white">Select an Operating Date</span>
          <span className="text-xs italic">
            Click any day in the table or calendar to inspect full financial breakdown and session logs.
          </span>
        </div>
      ) : (
        <>
          {/* Header Bar */}
          <div className="flex items-center justify-between gap-2 border-b border-purple-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-xs uppercase tracking-wider text-[#9c8fc6] font-extrabold flex items-center gap-2">
                <History className="w-4 h-4 text-pink-400" />
                <span>{fmtDateLong(selectedDate)}</span>
              </h3>
              {selectedDate === todayISO() && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  LIVE TODAY
                </span>
              )}
            </div>
            <button
              onClick={() => onDeleteHistoryDay(selectedDate)}
              className="px-2.5 py-1 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
              title="Delete all sessions for this day"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Day</span>
            </button>
          </div>

          {/* Day Total Revenue Hero */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-purple-950/40 to-black/60 border border-emerald-500/40 flex items-center justify-between shadow-md">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Day Total Revenue
              </span>
              <div className="font-['Exo_2'] font-black text-3xl sm:text-4xl text-emerald-400 mt-0.5">
                ₹{selectedDayTotalRev.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-200 font-bold text-xs">
                {selectedSessions.length} Sessions Logged
              </span>
              <div className="text-[10px] text-[#9c8fc6] mt-1 font-mono">{selectedDate}</div>
            </div>
          </div>

          {/* Day Revenue Breakdown Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col">
              <span className="text-[9px] uppercase font-bold text-emerald-300 flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Cash
              </span>
              <span className="font-['Exo_2'] font-bold text-sm text-emerald-400 mt-0.5">
                ₹{selectedDayCash}
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-sky-500/30 bg-sky-950/20 flex flex-col">
              <span className="text-[9px] uppercase font-bold text-sky-300 flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> UPI
              </span>
              <span className="font-['Exo_2'] font-bold text-sm text-sky-400 mt-0.5">
                ₹{selectedDayUpi}
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/20 flex flex-col">
              <span className="text-[9px] uppercase font-bold text-purple-300 flex items-center gap-1">
                <Gamepad2 className="w-3 h-3" /> Gaming
              </span>
              <span className="font-['Exo_2'] font-bold text-sm text-purple-400 mt-0.5">
                ₹{selectedDayGamingRev}
              </span>
            </div>

            <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 flex flex-col">
              <span className="text-[9px] uppercase font-bold text-amber-300 flex items-center gap-1">
                <Coffee className="w-3 h-3" /> Snacks
              </span>
              <span className="font-['Exo_2'] font-bold text-sm text-amber-400 mt-0.5">
                ₹{selectedDaySnacksRev}
              </span>
            </div>
          </div>

          {/* Session Filter Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9c8fc6] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sessionSearchQuery}
              onChange={e => setSessionSearchQuery(e.target.value)}
              placeholder="Search customer, phone, or station in this day..."
              className="w-full bg-black/50 border border-purple-500/25 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-purple-500/40 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Session Records Table */}
          <div className="overflow-x-auto max-h-[300px] border border-purple-500/20 rounded-xl p-1 bg-black/30">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-500/20 text-[#9c8fc6] font-['Exo_2'] font-extrabold uppercase text-[10px]">
                  <th className="p-1.5">#</th>
                  <th className="p-1.5">Customer</th>
                  <th className="p-1.5">Station</th>
                  <th className="p-1.5">Time</th>
                  <th className="p-1.5">Pay</th>
                  <th className="p-1.5">Total</th>
                  <th className="p-1.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10">
                {filteredSelectedSessions.map((s, i) => (
                  <tr key={s.id} className="hover:bg-purple-900/15">
                    <td className="p-1.5 font-bold text-purple-300">{i + 1}</td>
                    <td className="p-1.5">
                      <span className="font-bold text-white block">{s.name}</span>
                      {s.phone && (
                        <span className="text-[10px] text-[#9c8fc6] font-mono">{s.phone}</span>
                      )}
                    </td>
                    <td className="p-1.5 text-[#ece6ff]">{getStationNames(s)}</td>
                    <td className="p-1.5 text-[#9c8fc6] text-[11px]">
                      {to12(s.startTime)} → {to12(s.endTime)}
                    </td>
                    <td className="p-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-cyan-300">
                        {s.pm}
                      </span>
                    </td>
                    <td className="p-1.5 font-['Exo_2'] font-bold text-emerald-400">₹{s.total}</td>
                    <td className="p-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditHistoryRow(selectedDate, s)}
                          className="p-1 rounded text-slate-300 hover:text-white"
                          title="Edit Session"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteHistoryRow(selectedDate, s.id)}
                          className="p-1 rounded text-rose-400 hover:text-rose-300"
                          title="Delete Session"
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

          {/* Export Actions for Selected Day */}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => {
                generatePDFReport(selectedDate, selectedSessions, {
                  stations,
                  cafeName: 'OH MY GAME — N.E.R.O SPORTS'
                });
                toast('Professional Day Audit PDF generated and downloaded!', 'ok');
              }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 border border-emerald-400/40 text-white font-extrabold text-xs uppercase flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 transition-all cursor-pointer"
              title="Export systematic, professional audit PDF report for this date"
            >
              <Download className="w-4 h-4" /> Export Day PDF
            </button>

            <button
              onClick={() => shareWhatsApp(selectedDate, selectedSessions)}
              className="flex-1 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow hover:bg-emerald-600 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> Share WhatsApp
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* =========================================================================
          TOP EXECUTIVE DAY-TO-DAY REVENUE METRICS BAR
          ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Day-to-Day Historical Revenue */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#120826] via-[#1a0f35] to-[#0c051a] border border-purple-500/30 backdrop-blur-md relative overflow-hidden flex flex-col justify-between shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-500" />
          <div className="flex items-center justify-between text-[#9c8fc6] text-xs uppercase tracking-wider font-bold">
            <span className="text-emerald-300 font-extrabold">Total Day-to-Day Revenue</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black font-['Exo_2'] text-emerald-400 tracking-tight">
              ₹{totalAllTimeRevenue.toLocaleString('en-IN')}
            </span>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#9c8fc6]">
              <span>{totalOperatingDaysCount} Operating Days</span>
              <span>•</span>
              <span className="text-purple-300 font-semibold">{totalAllTimeSessionsCount} Sessions</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-purple-500/15 flex flex-wrap items-center justify-between gap-1 text-[10px] text-[#9c8fc6]">
            <span>Cash: <strong className="text-emerald-300">₹{totalAllTimeCash}</strong></span>
            <span>UPI: <strong className="text-cyan-300">₹{totalAllTimeUpi}</strong></span>
            <span>Gaming: <strong className="text-purple-300">₹{totalAllTimeGaming}</strong></span>
            <span>Snacks: <strong className="text-amber-300">₹{totalAllTimeSnacks}</strong></span>
          </div>
        </div>

        {/* Card 2: Selected Day Revenue */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0e1a2b] via-[#13243d] to-[#08121f] border border-cyan-500/30 backdrop-blur-md relative overflow-hidden flex flex-col justify-between shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
          <div className="flex items-center justify-between text-[#9c8fc6] text-xs uppercase tracking-wider font-bold">
            <span className="truncate text-cyan-300">Day Revenue ({selectedDate || 'Select Day'})</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black font-['Exo_2'] text-cyan-300 tracking-tight">
              ₹{selectedDayTotalRev.toLocaleString('en-IN')}
            </span>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#9c8fc6]">
              <span>{selectedSessions.length} sessions logged</span>
              {selectedDate === todayISO() && (
                <span className="px-1 py-0.2 rounded text-[9px] font-black uppercase bg-cyan-500/30 text-cyan-200">
                  LIVE TODAY
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-cyan-500/15 flex items-center justify-between text-[10px] text-[#9c8fc6]">
            <span>Cash: <strong className="text-emerald-300">₹{selectedDayCash}</strong></span>
            <span>UPI: <strong className="text-cyan-300">₹{selectedDayUpi}</strong></span>
            <span>Snacks: <strong className="text-amber-300">₹{selectedDaySnacksRev}</strong></span>
          </div>
        </div>

        {/* Card 3: Selected Month Revenue */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1b0826] via-[#240e34] to-[#11051b] border border-pink-500/30 backdrop-blur-md relative overflow-hidden flex flex-col justify-between shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-rose-500" />
          <div className="flex items-center justify-between text-[#9c8fc6] text-xs uppercase tracking-wider font-bold">
            <span className="truncate">{monthLabel} Total</span>
            <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-300">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black font-['Exo_2'] text-pink-300 tracking-tight">
              ₹{totalMonthRevenue.toLocaleString('en-IN')}
            </span>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#9c8fc6]">
              <span>{monthDates.length} recorded days</span>
              <span>•</span>
              <span className="text-pink-200 font-semibold">{totalMonthSessions} sessions</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-pink-500/15 flex items-center justify-between text-[10px] text-[#9c8fc6]">
            <span>Active Days: <strong className="text-white">{monthDates.length} / {daysInMonth}</strong></span>
          </div>
        </div>

        {/* Card 4: Daily Average & Peak Revenue */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1f1608] via-[#2a1e0b] to-[#140e04] border border-amber-500/30 backdrop-blur-md relative overflow-hidden flex flex-col justify-between shadow-lg">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />
          <div className="flex items-center justify-between text-[#9c8fc6] text-xs uppercase tracking-wider font-bold">
            <span>Daily Average Revenue</span>
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black font-['Exo_2'] text-amber-300 tracking-tight">
              ₹{avgDailyRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-amber-200/80 block mt-1 truncate">
              Peak: ₹{peakDayInfo.revenue.toLocaleString('en-IN')} ({peakDayInfo.date || 'N/A'})
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-amber-500/15 flex items-center justify-between text-[10px] text-[#9c8fc6]">
            <span>Avg Sessions/Day: <strong className="text-white">{totalOperatingDaysCount ? Math.round(totalAllTimeSessionsCount / totalOperatingDaysCount) : 0}</strong></span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE TOGGLE & DAY-TO-DAY ACTION BAR
          ========================================================================= */}
      <div className="p-3.5 px-4 rounded-2xl bg-black/40 border border-purple-500/30 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-[#9c8fc6] font-bold flex items-center gap-1.5">
            <History className="w-4 h-4 text-purple-400" /> View History By:
          </span>
          <div className="flex items-center p-1 rounded-xl bg-black/50 border border-purple-500/30">
            <button
              onClick={() => setViewMode('dayToDay')}
              className={`px-3 py-1.5 rounded-lg text-xs font-['Exo_2'] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'dayToDay'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-[#9c8fc6] hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Day-to-Day Breakdown Ledger</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-['Exo_2'] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                  : 'text-[#9c8fc6] hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendar Grid Matrix</span>
            </button>
          </div>
        </div>

        {/* Global Quick Export / Info */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {selectedDate && combinedHistory[selectedDate] && (
            <button
              onClick={() => {
                generatePDFReport(selectedDate, combinedHistory[selectedDate], {
                  stations,
                  cafeName: 'OH MY GAME — N.E.R.O SPORTS'
                });
                toast(`Exported Day PDF for ${fmtDateLong(selectedDate)}!`, 'ok');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/40 text-white font-['Exo_2'] font-extrabold text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Download professional day audit PDF for selected day"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Day PDF ({selectedDate})</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          VIEW MODE 1: DAY-TO-DAY REVENUE BREAKDOWN LEDGER TABLE & INSPECTOR
          ========================================================================= */}
      {viewMode === 'dayToDay' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_1fr] gap-4">
          {/* Day-to-Day Breakdown Table */}
          <div className="p-4 sm:p-5 rounded-2xl border border-purple-500/25 bg-gradient-to-b from-[#180e2b]/80 to-[#0e071c]/90 backdrop-blur-md flex flex-col gap-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
              <div>
                <h3 className="font-['Exo_2'] font-black text-lg text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-pink-400" />
                  <span>Day-to-Day Revenue Ledger</span>
                </h3>
                <p className="text-xs text-[#9c8fc6] mt-0.5">
                  Showing all operating dates with individual daily revenue, split payments, and sessions count.
                </p>
              </div>

              {/* Search Days */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#9c8fc6] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchDayQuery}
                  onChange={e => setSearchDayQuery(e.target.value)}
                  placeholder="Filter day (e.g. Oct 18)..."
                  className="w-full bg-black/60 border border-purple-500/30 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-purple-500/40 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {filteredDayToDayDates.length === 0 ? (
              <div className="p-12 text-center text-[#9c8fc6] flex flex-col items-center justify-center gap-2">
                <Calendar className="w-10 h-10 text-purple-400/50" />
                <span className="font-bold text-sm text-white">No revenue history matches filter</span>
                <span className="text-xs italic">All recorded sessions appear here day-by-day.</span>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-purple-500/20 bg-black/30">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-purple-500/30 bg-[#0f0720] text-[#9c8fc6] font-['Exo_2'] font-extrabold uppercase tracking-wider text-[11px]">
                      <th className="p-3">#</th>
                      <th className="p-3">Operating Date</th>
                      <th className="p-3">Total Day Revenue</th>
                      <th className="p-3">Gaming Charge</th>
                      <th className="p-3">Café & Snacks</th>
                      <th className="p-3">Cash / UPI Split</th>
                      <th className="p-3 text-center">Sessions</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-500/10">
                    {filteredDayToDayDates.map((dateKey, index) => {
                      const daySessions = combinedHistory[dateKey] || [];
                      const dayTotal = daySessions.reduce((a, s) => a + (Number(s.total) || 0), 0);
                      const dayGaming = daySessions.reduce((a, s) => a + (Number(s.gaming) || 0), 0);
                      const daySnacks = daySessions.reduce((a, s) => a + (Number(s.snacks) || 0), 0);
                      const dayCash = daySessions.reduce((a, s) => a + cashOf(s), 0);
                      const dayUpi = daySessions.reduce((a, s) => a + upiOf(s), 0);
                      const isToday = dateKey === todayISO();
                      const isSelected = selectedDate === dateKey;
                      const maxRev = peakDayInfo.revenue || 1;
                      const pctOfPeak = Math.min(100, Math.round((dayTotal / maxRev) * 100));

                      return (
                        <tr
                          key={dateKey}
                          onClick={() => handleSelectDate(dateKey)}
                          className={`transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-900/30 border-l-4 border-l-pink-500 shadow-inner'
                              : 'hover:bg-purple-950/20'
                          }`}
                        >
                          <td className="p-3 font-bold text-purple-300">
                            {index + 1}
                          </td>

                          {/* Operating Date */}
                          <td className="p-3">
                            <div className="font-['Exo_2'] font-extrabold text-sm text-white flex items-center gap-2">
                              <span>{fmtDateLong(dateKey)}</span>
                              {isToday && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                                  TODAY
                                </span>
                              )}
                              {dateKey === peakDayInfo.date && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40">
                                  PEAK
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#9c8fc6] font-mono">{dateKey}</span>
                          </td>

                          {/* Total Day Revenue */}
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <span className="font-['Exo_2'] font-black text-base text-emerald-400">
                                ₹{dayTotal.toLocaleString('en-IN')}
                              </span>
                              {/* Relative revenue visual progress bar */}
                              <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                                  style={{ width: `${pctOfPeak}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Gaming */}
                          <td className="p-3 font-bold text-purple-300">
                            ₹{dayGaming.toLocaleString('en-IN')}
                          </td>

                          {/* Snacks */}
                          <td className="p-3">
                            {daySnacks > 0 ? (
                              <span className="font-bold text-amber-300">
                                ₹{daySnacks.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-[#9c8fc6]/60">—</span>
                            )}
                          </td>

                          {/* Cash / UPI */}
                          <td className="p-3">
                            <div className="flex flex-col text-[11px]">
                              <span className="text-emerald-300 font-semibold">Cash: ₹{dayCash}</span>
                              <span className="text-cyan-300 font-semibold">UPI: ₹{dayUpi}</span>
                            </div>
                          </td>

                          {/* Sessions Count */}
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white font-bold text-xs">
                              {daySessions.length}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => handleSelectDate(dateKey)}
                                className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/60 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Inspect session logs"
                              >
                                <Eye className="w-3.5 h-3.5 text-pink-400" />
                                <span>Inspect</span>
                              </button>

                              <button
                                onClick={() => {
                                  generatePDFReport(dateKey, daySessions, {
                                    stations,
                                    cafeName: 'OH MY GAME — N.E.R.O SPORTS'
                                  });
                                  toast(`Exported Day PDF for ${dateKey}!`, 'ok');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/60 border border-emerald-400/40 text-emerald-200 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Export professional day audit PDF"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-400" />
                                <span>PDF</span>
                              </button>

                              <button
                                onClick={() => shareWhatsApp(dateKey, daySessions)}
                                className="p-1 rounded-lg bg-emerald-700/30 hover:bg-emerald-700/60 border border-emerald-500/40 text-emerald-300 hover:text-white transition-all cursor-pointer"
                                title="Share WhatsApp Summary"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Ledger Summary Footer */}
                  <tfoot>
                    <tr className="border-t-2 border-purple-500/40 bg-[#0f0720] text-white font-['Exo_2'] font-black text-xs">
                      <td colSpan={2} className="p-3 uppercase tracking-wider text-pink-400">
                        Total Day-to-Day Reconciled ({filteredDayToDayDates.length} Days)
                      </td>
                      <td className="p-3 text-emerald-300 text-sm">
                        ₹{filteredDayToDayDates.reduce((sum, d) => sum + (combinedHistory[d] || []).reduce((a, s) => a + (Number(s.total) || 0), 0), 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-purple-300">
                        ₹{filteredDayToDayDates.reduce((sum, d) => sum + (combinedHistory[d] || []).reduce((a, s) => a + (Number(s.gaming) || 0), 0), 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-amber-300">
                        ₹{filteredDayToDayDates.reduce((sum, d) => sum + (combinedHistory[d] || []).reduce((a, s) => a + (Number(s.snacks) || 0), 0), 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-[11px] text-[#9c8fc6]">
                        Cash+UPI Reconciled
                      </td>
                      <td className="p-3 text-center text-white">
                        {filteredDayToDayDates.reduce((sum, d) => sum + (combinedHistory[d] || []).length, 0)}
                      </td>
                      <td className="p-3 text-right text-[11px] text-[#9c8fc6]">
                        Official History
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Selected Day Details Inspector displayed right alongside the table! */}
          {renderDayInspector()}
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: CALENDAR MATRIX & SELECTED DAY INSPECTOR
          ========================================================================= */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4">
          {/* Calendar Column */}
          <div className="p-4 sm:p-5 rounded-2xl border border-purple-500/25 bg-gradient-to-b from-[#180e2b]/80 to-[#0e071c]/90 backdrop-blur-md flex flex-col justify-between shadow-xl">
            {/* Calendar Month Header */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-purple-500/20 pb-3">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg border border-purple-500/30 bg-black/60 text-white hover:border-pink-500 cursor-pointer transition-colors"
                  title="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex flex-col items-center">
                  <span className="font-['Exo_2'] font-black text-base text-white tracking-wider">
                    {monthLabel}
                  </span>
                  <span className="text-[11px] text-pink-300 font-extrabold mt-0.5">
                    Month Total: ₹{totalMonthRevenue.toLocaleString('en-IN')} ({totalMonthSessions} sessions)
                  </span>
                </div>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg border border-purple-500/30 bg-black/60 text-white hover:border-pink-500 cursor-pointer transition-colors"
                  title="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Days Header */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[#9c8fc6] font-bold uppercase tracking-wider mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="py-1">{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[58px] invisible" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const iso = `${monthYear.y}-${pad(monthYear.m + 1)}-${pad(dayNum)}`;
                  const list = combinedHistory[iso] || [];
                  const hasData = list.length > 0;
                  const dayRev = list.reduce((a, s) => a + (Number(s.total) || 0), 0);
                  const isSelected = selectedDate === iso;
                  const isToday = iso === todayISO();

                  return (
                    <div
                      key={iso}
                      onClick={() => {
                        if (!hasData) {
                          toast('No recorded sessions for this date', 'info');
                          return;
                        }
                        handleSelectDate(iso);
                      }}
                      className={`min-h-[58px] p-1.5 rounded-xl border flex flex-col justify-between cursor-pointer relative transition-all ${
                        isSelected
                          ? 'border-[#ff4dab] bg-gradient-to-br from-purple-900/60 to-pink-900/50 shadow-[0_0_12px_rgba(255,77,171,0.4)] ring-2 ring-[#ff4dab]/60'
                          : hasData
                          ? 'border-purple-500/40 bg-purple-950/30 hover:border-pink-400 hover:bg-purple-900/40 shadow-sm'
                          : 'border-white/5 bg-black/20 opacity-40 hover:opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-['Exo_2'] font-bold text-xs text-white">
                          {dayNum}
                        </span>
                        {isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" title="Today" />
                        )}
                      </div>

                      {hasData ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] sm:text-[11px] font-['Exo_2'] font-black text-emerald-400 leading-tight truncate">
                            ₹{dayRev.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[9px] text-[#9c8fc6] font-semibold leading-none">
                            {list.length} sess
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-[#9c8fc6]/40 text-center">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calendar Footer Info */}
            <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-between text-xs text-[#9c8fc6]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Days with recorded revenue</span>
              </span>
              <span>Total Recorded: <strong className="text-white">{allRecordedDates.length} Days</strong></span>
            </div>
          </div>

          {/* Selected Day Details Inspector */}
          {renderDayInspector()}
        </div>
      )}
    </div>
  );
};
