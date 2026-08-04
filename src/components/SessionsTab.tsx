import React, { useState, useEffect } from 'react';
import { Gamepad2, Hourglass, Edit3, Trash2, StopCircle, FileText, CheckCircle2 } from 'lucide-react';
import { Session, Station } from '../types';
import { to12, diffMin, fmtMins, cashOf, upiOf, escapeHtml } from '../utils/helpers';

interface SessionsTabProps {
  sessions: Session[];
  stations: Station[];
  onEndSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onEditSession: (session: Session) => void;
}

export const SessionsTab: React.FC<SessionsTabProps> = ({
  sessions,
  stations,
  onEndSession,
  onDeleteSession,
  onEditSession
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const getStationNames = (s: Session) => {
    const ids = s.stationIds || [s.stationId];
    return ids.map(id => stations.find(st => st.id === id)?.name || id).join(', ');
  };

  const activeSessions = sessions.filter(s => s.status === 'active');
  const endedSessions = sessions.filter(s => s.status === 'ended');

  return (
    <div className="flex flex-col gap-4">
      {/* Today's Active & Ended Sessions */}
      <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
        <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2 mb-4">
          <Gamepad2 className="w-4 h-4 text-[#ff4dab]" /> Today's Gaming Sessions ({sessions.length})
        </h3>

        {sessions.length === 0 ? (
          <div className="p-8 text-center text-[#9c8fc6] italic text-sm">
            No gaming sessions logged today yet. Start a session from the New Session tab!
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {[...activeSessions, ...endedSessions].map(s => {
              const remainingMins = diffMin(s.endTime);
              const totalSec = Math.round(remainingMins * 60);
              const absSec = Math.abs(totalSec);
              const h = Math.floor(absSec / 3600);
              const m = Math.floor((absSec % 3600) / 60);
              const sec = absSec % 60;

              const timerLabel =
                (totalSec < 0 ? '-' : '') +
                (h > 0
                  ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
                  : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`);

              const isOverdue = s.status === 'active' && totalSec < 0;
              const isWarning = s.status === 'active' && totalSec > 0 && totalSec <= 300;

              const initials = s.name
                .split(/\s+/)
                .map(w => w[0] || '')
                .join('')
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={s.id}
                  className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    s.status === 'active'
                      ? 'border-emerald-500/50 bg-[rgba(19,13,36,0.75)] shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                      : 'border-[rgba(168,85,247,0.18)] bg-[rgba(8,3,15,0.45)] opacity-85'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#e91e8c] text-white font-['Exo_2'] font-black text-lg flex items-center justify-center shrink-0 shadow">
                      {initials || '?'}
                    </div>

                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-['Exo_2'] font-extrabold text-base text-white tracking-wide">
                          {s.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-200 text-[10px] font-extrabold uppercase">
                          {getStationNames(s)}
                        </span>
                        {s.mode === 'multi' && (
                          <span className="px-2 py-0.5 rounded-full bg-pink-900/40 border border-pink-500/30 text-pink-200 text-[10px] font-extrabold uppercase">
                            {s.players}P Multi
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            s.pm === 'Cash'
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                              : s.pm === 'UPI'
                              ? 'bg-sky-500/10 border-sky-500/40 text-sky-300'
                              : s.pm === 'Split'
                              ? 'bg-pink-500/10 border-pink-500/40 text-pink-300'
                              : 'bg-amber-500/10 border-amber-500/40 text-amber-300 animate-pulse'
                          }`}
                        >
                          {s.pm === 'Split'
                            ? `Split ₹${s.cashAmt || 0} Cash / ₹${s.upiAmt || 0} UPI`
                            : s.pm}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#9c8fc6]">
                        <span>
                          {to12(s.startTime)} → {to12(s.endTime)}
                        </span>

                        {s.status === 'active' ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-['Exo_2'] font-extrabold text-xs border ${
                              isOverdue
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                                : isWarning
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 animate-pulse'
                                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            }`}
                          >
                            <Hourglass className="w-3 h-3" /> {timerLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Ended {s.endedAt ? to12(s.endedAt) : ''}
                          </span>
                        )}
                      </div>

                      {/* Slot & Snack chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {(s.slots || []).map((sl, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800/40 text-[10px] text-purple-200 font-bold">
                            {fmtMins(sl.mins)}
                          </span>
                        ))}
                        {(s.cart || []).map((c, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 text-[10px] text-amber-300 font-bold">
                            {c.emoji} {c.name} ×{c.qty}
                          </span>
                        ))}
                      </div>

                      {/* Session Note */}
                      {s.note && s.note.trim() && (
                        <div className="mt-2 p-2 rounded-lg border border-pink-500/30 bg-gradient-to-r from-pink-950/20 to-purple-950/20 text-pink-100 text-xs flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
                          <span className="whitespace-pre-wrap break-words">{escapeHtml(s.note)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 border-[rgba(168,85,247,0.15)] pt-2 md:pt-0">
                    <div className="flex flex-col items-end">
                      <span className="font-['Exo_2'] font-extrabold text-xl text-white">₹{s.total}</span>
                      <span className="text-[10px] uppercase text-[#9c8fc6] font-bold tracking-widest">
                        {s.discount > 0 ? `Incl ₹${s.discount} Discount` : 'Total Paid'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {s.status === 'active' && (
                        <button
                          onClick={() => onEndSession(s.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-wider hover:bg-rose-600 hover:text-white transition-colors flex items-center gap-1"
                        >
                          <StopCircle className="w-3.5 h-3.5" /> End
                        </button>
                      )}
                      <button
                        onClick={() => onEditSession(s)}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-200 text-xs font-bold uppercase tracking-wider hover:bg-purple-600 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => onDeleteSession(s.id)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
