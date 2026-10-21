import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, KeyRound, Eye, EyeOff, Crown, AlertTriangle, CheckCircle2, X, Sparkles, ShieldAlert } from 'lucide-react';
import { registerAdminAPI, loginAdminAPI } from '../api';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  singleSlotAvailable: boolean;
  onLoginSuccess: (admin: { name: string; username: string }) => void;
  toast: (msg: string, kind?: 'ok' | 'warn' | 'info') => void;
  onStatusUpdated?: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  singleSlotAvailable,
  onLoginSuccess,
  toast,
  onStatusUpdated
}) => {
  const [activeMode, setActiveMode] = useState<'signup' | 'login'>(singleSlotAvailable ? 'signup' : 'login');
  
  // Sign up fields
  const [name, setName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveMode(singleSlotAvailable ? 'signup' : 'login');
      setErrorMsg('');
    }
  }, [isOpen, singleSlotAvailable]);

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!singleSlotAvailable) {
      setErrorMsg('Admin account slot is already claimed and permanently closed.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!signupUsername.trim()) {
      setErrorMsg('Please enter an admin username or email.');
      return;
    }
    if (signupPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerAdminAPI({
        name: name.trim(),
        username: signupUsername.trim(),
        password: signupPassword
      });

      if (res.success && res.admin) {
        toast('Master Admin account created! Single slot is now closed.', 'ok');
        if (onStatusUpdated) onStatusUpdated();
        onLoginSuccess(res.admin);
        onClose();
      } else {
        setErrorMsg(res.message || 'Failed to create admin account.');
      }
    } catch {
      setErrorMsg('Network error while creating admin account.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginUsername.trim() || !loginPassword) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginAdminAPI({
        username: loginUsername.trim(),
        password: loginPassword
      });

      if (res.success && res.admin) {
        toast(`Welcome back, ${res.admin.name}!`, 'ok');
        onLoginSuccess(res.admin);
        onClose();
      } else {
        setErrorMsg(res.message || 'Invalid username or password.');
      }
    } catch {
      setErrorMsg('Network error during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#160c2b] via-[#100820] to-[#080412] border border-purple-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.9),0_0_35px_rgba(168,85,247,0.25)] text-white">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#9c8fc6] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Back to Website"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2.5 mb-5">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg border border-purple-400/40">
              <Crown className="w-7 h-7 text-amber-300" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#100820]" />
          </div>

          <div>
            <h2 className="font-['Exo_2'] font-black text-xl text-white tracking-wider uppercase">
              OH MY GAME · NERO
            </h2>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#ff4dab] font-bold mt-0.5">
              Admin Control Center
            </p>
          </div>
        </div>

        {/* Slot Availability Banner */}
        <div className={`p-3 rounded-2xl border text-xs mb-4 flex items-start gap-2.5 ${
          singleSlotAvailable
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            : 'bg-purple-950/30 border-purple-500/30 text-purple-200'
        }`}>
          {singleSlotAvailable ? (
            <KeyRound className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          ) : (
            <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <div className="font-extrabold flex items-center gap-2">
              <span>{singleSlotAvailable ? 'Single Admin Slot Available (1/1)' : 'Admin Slot Closed'}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider border ${
                singleSlotAvailable 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {singleSlotAvailable ? 'OPEN' : 'LOCKED'}
              </span>
            </div>
            <p className="text-[11px] text-[#ece6ff]/80 mt-0.5 leading-snug">
              {singleSlotAvailable
                ? 'Only 1 admin account can be created. Once created, nobody else will be allowed to sign up.'
                : 'The master admin account has been created. Further registrations are permanently locked.'}
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-black/50 border border-purple-500/20 mb-4">
          <button
            type="button"
            disabled={!singleSlotAvailable}
            onClick={() => {
              setActiveMode('signup');
              setErrorMsg('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-['Exo_2'] font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeMode === 'signup'
                ? 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-md'
                : singleSlotAvailable
                ? 'text-[#9c8fc6] hover:text-white cursor-pointer'
                : 'text-[#9c8fc6]/40 cursor-not-allowed'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign Up {singleSlotAvailable ? '(1 Slot)' : '(Locked)'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('login');
              setErrorMsg('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-['Exo_2'] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'login'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                : 'text-[#9c8fc6] hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* SIGN UP FORM (Single Slot Only) */}
        {activeMode === 'signup' && (
          singleSlotAvailable ? (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">
                  Admin Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Aayush Kumar"
                  className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-500/40 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">
                  Admin Username or Email
                </label>
                <input
                  type="text"
                  required
                  value={signupUsername}
                  onChange={e => setSignupUsername(e.target.value)}
                  placeholder="e.g. admin or yourname@gmail.com"
                  className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-500/40 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signupPassword}
                      onChange={e => setSignupPassword(e.target.value)}
                      placeholder="Min 4 chars"
                      className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3.5 py-2.5 pr-8 text-xs text-white placeholder-purple-500/40 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9c8fc6] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-500/40 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-purple-600 to-pink-600 hover:brightness-110 text-white font-['Exo_2'] font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4 text-amber-300" />
                {loading ? 'Creating Account...' : 'Claim Slot & Create Admin Account'}
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-xl border border-purple-500/30 bg-black/40 text-center flex flex-col gap-2">
              <Lock className="w-8 h-8 text-purple-400 mx-auto" />
              <div className="font-['Exo_2'] font-bold text-sm text-white">Single Admin Slot Claimed</div>
              <p className="text-xs text-[#9c8fc6]">
                This system allows exactly 1 admin account. The slot has been claimed and closed. Please use the Login tab.
              </p>
              <button
                onClick={() => setActiveMode('login')}
                className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
              >
                Go to Admin Login
              </button>
            </div>
          )
        )}

        {/* LOGIN FORM */}
        {activeMode === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">
                Admin Username or Email
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
                placeholder="Enter admin username or email"
                className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-purple-500/40 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/60 border border-purple-500/30 rounded-xl px-3.5 py-2.5 pr-8 text-xs text-white placeholder-purple-500/40 focus:outline-none focus:border-purple-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9c8fc6] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:brightness-110 text-white font-['Exo_2'] font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-purple-600/30 cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Authenticating...' : 'Sign In to Admin Panel'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
