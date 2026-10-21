import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, Trash2, CheckCheck, Lock, LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { NotificationItem } from '../types';
import { to12, pad, LOGO_B64, timeAgo } from '../utils/helpers';

interface HeaderProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClearAll: () => void;
  isBackendConnected: boolean;
  userRole?: 'admin' | 'staff';
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  notifications,
  onMarkAllRead,
  onClearAll,
  isBackendConnected,
  userRole = 'admin',
  onLogout
}) => {
  const [timeStr, setTimeStr] = useState<string>('--:--');
  const [dateStr, setDateStr] = useState<string>('—');
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTimeStr(to12(`${pad(d.getHours())}:${pad(d.getMinutes())}`));
      setDateStr(d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-[rgba(168,85,247,0.25)] bg-gradient-to-b from-[rgba(20,12,38,0.88)] to-[rgba(9,5,18,0.95)] backdrop-blur-2xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)]">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3.5">
        <div className="relative group">
          <img
            src="/logo.jpg"
            alt="OH MY GAME Logo"
            referrerPolicy="no-referrer"
            className="w-13 h-13 rounded-2xl object-cover border-2 border-red-500/80 shadow-[0_0_0_2px_#06030c,0_0_20px_rgba(239,68,68,0.7),0_0_35px_rgba(168,85,247,0.35)] transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-2">
            <span className="font-['Exo_2'] font-extrabold text-xl tracking-wider bg-gradient-to-r from-white via-[#e2c4ff] to-[#00f2fe] bg-clip-text text-transparent">
              OH MY GAME · NERO
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                isBackendConnected
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isBackendConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {isBackendConnected ? 'ACTIVE' : 'LOCAL CACHE'}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-cyan-500/35 bg-cyan-950/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              CYBER HUD
            </span>
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border border-purple-500/35 bg-purple-950/40 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.25)]" title="Connected to Supabase Project ozzywiqrdczjumdasedw">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SUPABASE: ozzywiqrdczjumdasedw
            </span>
          </div>
          <span className="text-[#9c8fc6] font-semibold tracking-[0.25em] text-[11px] mt-1 uppercase">
            N.E.R.O Sports • Café Manager
          </span>
        </div>
      </div>

      {/* Right Controls: Notifications & Clock */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Bell Notification Inbox Toggle */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative w-11 h-11 rounded-xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(40,28,72,0.7)] to-[rgba(19,13,36,0.7)] text-[#ff4dab] flex items-center justify-center cursor-pointer transition-transform hover:-translate-y-0.5 hover:border-[rgba(233,30,140,0.55)]"
            title="Notifications Inbox"
          >
            <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-[#e91e8c] to-[#a855f7] text-white text-[11px] font-extrabold flex items-center justify-center border-2 border-[#08030f] shadow-[0_4px_10px_-2px_rgba(233,30,140,0.6)]">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Inbox Dropdown Panel */}
          {isNotifOpen && (
            <div className="absolute top-14 right-0 w-80 max-w-[calc(100vw-2rem)] max-h-[70vh] flex flex-col border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(28,18,56,0.98)] to-[rgba(15,10,32,0.98)] rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] z-50 overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between p-3.5 border-b border-[rgba(168,85,247,0.22)] bg-[rgba(8,3,15,0.4)]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#ff4dab]" />
                  <span className="font-['Exo_2'] font-bold text-xs uppercase tracking-widest text-[#ff4dab]">
                    Notifications ({notifications.length})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={onMarkAllRead}
                    className="p-1 text-xs text-[#9c8fc6] hover:text-white transition-colors"
                    title="Mark all read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClearAll}
                    className="p-1 text-xs text-[#9c8fc6] hover:text-rose-400 transition-colors"
                    title="Clear inbox"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto p-2 flex flex-col gap-1.5 max-h-[calc(70vh-60px)]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-[#9c8fc6] text-xs italic">
                    No notifications yet.<br />Session and booking updates will appear here.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs transition-colors ${
                        !n.read
                          ? 'bg-[rgba(233,30,140,0.08)] border-[rgba(233,30,140,0.25)] text-white'
                          : 'bg-[rgba(168,85,247,0.04)] border-transparent text-[#9c8fc6]'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.kind === 'ok' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : n.kind === 'warn' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Info className="w-4 h-4 text-sky-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white tracking-wide">{n.title}</div>
                        <div className="text-[11px] leading-relaxed mt-0.5 text-[#ece6ff]">{n.msg}</div>
                        <div className="text-[10px] text-[#9c8fc6] mt-1 uppercase tracking-wider">
                          {timeAgo(n.ts)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live Clock */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end leading-none text-right">
            <span className="font-mono text-xl font-bold tracking-wider text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.35)]">{timeStr}</span>
            <span className="text-[#9c8fc6] text-[11px] tracking-[0.18em] uppercase mt-1 flex items-center gap-1">
              {userRole === 'admin' ? (
                <span className="text-emerald-400 font-bold flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /> Admin Portal</span>
              ) : (
                <span className="text-purple-400 font-bold flex items-center gap-0.5"><UserCheck className="w-3 h-3" /> Public Hub</span>
              )}
              • {dateStr}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
