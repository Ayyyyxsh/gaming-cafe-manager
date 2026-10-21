import React from 'react';
import { ShieldCheck, Lock, KeyRound, Database, Heart, Clock, MapPin, Phone, Crown } from 'lucide-react';

interface FooterProps {
  isAdmin: boolean;
  adminProfile?: { name: string; username?: string } | null;
  singleSlotAvailable: boolean;
  onOpenAdminAuth: () => void;
  onOpenAdminPanel?: () => void;
  onLogoutAdmin: () => void;
  supabaseProjectId?: string | null;
}

export const Footer: React.FC<FooterProps> = ({
  isAdmin,
  adminProfile,
  singleSlotAvailable,
  onOpenAdminAuth,
  onOpenAdminPanel,
  onLogoutAdmin,
  supabaseProjectId = 'ozzywiqrdczjumdasedw'
}) => {
  return (
    <footer className="mt-14 border-t border-purple-500/20 pt-8 pb-12 text-[#9c8fc6] text-xs">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
        {/* Brand & Hours */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-['Exo_2'] font-black text-sm tracking-wider text-white uppercase">
              OH MY GAME · NERO
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
              Esports Hub
            </span>
          </div>
          <p className="text-[11px] text-[#9c8fc6] flex items-center gap-3 flex-wrap justify-center md:justify-start">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-pink-400" /> 10:00 AM – 11:00 PM (Daily)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-400" /> Supabase: <code className="text-emerald-300 font-mono">{supabaseProjectId}</code>
            </span>
          </p>
        </div>

        {/* Admin Link Section (Only here in the footer) */}
        <div className="flex flex-col items-center md:items-end gap-2">
          {!isAdmin ? (
            <div className="flex flex-col items-center md:items-end gap-1">
              {singleSlotAvailable ? (
                <button
                  type="button"
                  onClick={onOpenAdminAuth}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-pink-500/20 border border-amber-500/40 text-amber-200 hover:border-amber-400 hover:text-white hover:scale-105 transition-all text-xs font-['Exo_2'] font-extrabold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  <KeyRound className="w-4 h-4 text-amber-400 animate-pulse" />
                  Admin Sign-Up (1 Slot Available)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAdminAuth}
                  className="px-4 py-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/35 hover:border-purple-400 text-purple-200 hover:text-white transition-all text-xs font-['Exo_2'] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Lock className="w-4 h-4 text-purple-400" />
                  Admin Portal Login
                </button>
              )}
              <span className="text-[10px] text-[#9c8fc6]/80 italic">
                {singleSlotAvailable
                  ? '⚡ 1 single admin slot open — click to create master account'
                  : '🔒 Admin account registered. Login to view all bookings.'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-black/40 border border-emerald-500/30 flex-wrap justify-end">
              <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Admin: <strong className="text-white">{adminProfile?.name || 'Administrator'}</strong></span>
              </div>
              {onOpenAdminPanel && (
                <button
                  type="button"
                  onClick={onOpenAdminPanel}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span>Admin Panel</span>
                </button>
              )}
              <button
                type="button"
                onClick={onLogoutAdmin}
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-xs font-bold transition-all cursor-pointer"
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 text-center text-[10px] text-[#9c8fc6]/60 flex items-center justify-center gap-1">
        <span>OH MY GAME · NERO Gaming Café Management System</span>
      </div>
    </footer>
  );
};
