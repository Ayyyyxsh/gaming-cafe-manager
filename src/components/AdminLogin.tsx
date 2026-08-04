import React, { useState } from 'react';
import { ShieldCheck, Lock, KeyRound, Eye, EyeOff, Sparkles, ShieldAlert, CheckCircle2, Crown } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (role: 'admin', profile?: { name: string }) => void;
  adminPin: string;
  onUpdateAdminPin: (newPin: string) => void;
  stations?: { id: string; name: string; kind: string }[];
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  adminPin,
  onUpdateAdminPin,
}) => {
  // Admin PIN State
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmNewPin, setConfirmNewPin] = useState<string>('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<string>('');

  const handleKeypadPress = (val: string) => {
    setErrorMsg('');
    if (val === 'CLEAR') {
      setPinInput('');
    } else if (val === 'BACK') {
      setPinInput(prev => prev.slice(0, -1));
    } else {
      if (pinInput.length < 8) {
        setPinInput(prev => prev + val);
      }
    }
  };

  const handleAdminSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    // Allow default PIN '1234' or saved adminPin
    if (pinInput === adminPin || pinInput === '1234') {
      onLoginSuccess('admin', { name: 'Admin Master' });
    } else {
      setErrorMsg('Invalid Admin Passcode! Default PIN is 1234');
      setPinInput('');
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeSuccess('');
    setErrorMsg('');

    if (oldPin !== adminPin && oldPin !== '1234') {
      setErrorMsg('Current PIN is incorrect.');
      return;
    }
    if (newPin.length < 4) {
      setErrorMsg('New PIN must be at least 4 digits.');
      return;
    }
    if (newPin !== confirmNewPin) {
      setErrorMsg('New PIN and Confirm PIN do not match.');
      return;
    }

    onUpdateAdminPin(newPin);
    setPinChangeSuccess('Admin Master PIN successfully updated!');
    setTimeout(() => {
      setIsChangingPin(false);
      setPinInput(newPin);
      setOldPin('');
      setNewPin('');
      setConfirmNewPin('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#08030f] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(124,58,237,0.35),rgba(255,255,255,0))] flex items-center justify-center p-4 relative overflow-hidden font-sans text-white">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-gradient-to-b from-[#180f2e]/90 to-[#0d071b]/95 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(124,58,237,0.4)] backdrop-blur-2xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="relative group">
            <img
              src="/logo.jpg"
              alt="OH MY GAME Logo"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.7),0_0_50px_rgba(168,85,247,0.4)] transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-red-600 to-purple-600 text-white p-1.5 rounded-full shadow-lg border border-black" title="Admin Control Center">
              <Crown className="w-4 h-4 text-amber-300" />
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="font-['Exo_2'] font-black text-2xl tracking-wider bg-gradient-to-r from-white via-red-200 to-[#ff4dab] bg-clip-text text-transparent uppercase">
              OH MY GAME · NERO
            </h1>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#9c8fc6] font-bold mt-1 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Admin Master Control Panel
            </p>
          </div>
        </div>

        {/* ADMIN MODE FORM */}
        {!isChangingPin ? (
          <form onSubmit={handleAdminSubmit} className="flex flex-col gap-4">
            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* PIN Input Display */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold flex items-center justify-between">
                <span>Enter Admin Master Passcode</span>
                <span className="text-emerald-400/80 font-mono text-[10px]">Default PIN: 1234</span>
              </label>

              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-red-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => {
                    setErrorMsg('');
                    setPinInput(e.target.value);
                  }}
                  placeholder="••••"
                  maxLength={8}
                  className="w-full bg-black/60 border border-purple-500/30 rounded-2xl py-3.5 pl-10 pr-10 text-center text-xl font-mono tracking-[0.4em] font-extrabold text-white placeholder-purple-500/40 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition-all shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 text-purple-400 hover:text-white transition-colors cursor-pointer"
                  title={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Touchscreen Keypad */}
            <div className="grid grid-cols-3 gap-2 mt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'BACK'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleKeypadPress(val)}
                  className={`py-2.5 rounded-xl font-['Exo_2'] font-bold text-sm border transition-all cursor-pointer active:scale-95 ${
                    val === 'CLEAR'
                      ? 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-900/50 text-xs'
                      : val === 'BACK'
                      ? 'bg-amber-950/40 border-amber-500/30 text-amber-300 hover:bg-amber-900/50 text-xs'
                      : 'bg-white/5 border-white/10 text-white hover:bg-red-600/20 hover:border-red-500/40'
                  }`}
                >
                  {val === 'BACK' ? '⌫' : val}
                </button>
              ))}
            </div>

            {/* Quick Helper Links */}
            <div className="flex items-center justify-between text-[11px] text-[#9c8fc6]">
              <button
                type="button"
                onClick={() => {
                  setPinInput('1234');
                  setErrorMsg('');
                }}
                className="hover:text-pink-300 transition-colors flex items-center gap-1 cursor-pointer underline"
              >
                <Sparkles className="w-3 h-3 text-amber-400" /> Auto-fill Default PIN (1234)
              </button>

              <button
                type="button"
                onClick={() => setIsChangingPin(true)}
                className="hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer underline"
              >
                <KeyRound className="w-3 h-3 text-purple-400" /> Change Admin PIN
              </button>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-purple-600 to-pink-600 text-white font-['Exo_2'] font-extrabold text-sm uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-red-600/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4 text-amber-300" /> Unlock Admin Dashboard
            </button>
          </form>
        ) : (
          /* Change PIN Form */
          <form onSubmit={handleChangePinSubmit} className="flex flex-col gap-4">
            <h3 className="font-['Exo_2'] font-bold text-base text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-400" /> Change Admin Master PIN
            </h3>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            {pinChangeSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {pinChangeSuccess}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#9c8fc6] font-bold uppercase">Current PIN</label>
              <input
                type="password"
                required
                value={oldPin}
                onChange={(e) => setOldPin(e.target.value)}
                placeholder="Current PIN (default 1234)"
                className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#9c8fc6] font-bold uppercase">New PIN (4+ Digits)</label>
              <input
                type="password"
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Enter new passcode"
                className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#9c8fc6] font-bold uppercase">Confirm New PIN</label>
              <input
                type="password"
                required
                value={confirmNewPin}
                onChange={(e) => setConfirmNewPin(e.target.value)}
                placeholder="Re-enter new passcode"
                className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(false);
                  setErrorMsg('');
                }}
                className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-purple-600/30"
              >
                Save New PIN
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
