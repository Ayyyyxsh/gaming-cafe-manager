import React, { useState } from 'react';
import {
  UserPlus,
  Monitor,
  Clock,
  Coffee,
  Gift,
  CreditCard,
  Plus,
  Minus,
  Trash2,
  Play,
  User,
  Users,
  Check,
  Split,
  FileText,
  GraduationCap
} from 'lucide-react';
import { Station, SnackItem, Offer, Customer, Session, CartItem, Slot } from '../types';
import { nowHHMM, addMin, slotPriceForStation, fmtMins, to12, normKey, todayISO } from '../utils/helpers';

interface NewSessionTabProps {
  stations: Station[];
  snacks: SnackItem[];
  offers?: Offer[];
  customers: Customer[];
  activeSessions: Session[];
  onStartSession: (sessionData: Partial<Session>) => void;
  toast: (msg: string, kind?: 'ok' | 'warn' | 'info') => void;
  preSelectedStationId?: string | null;
  onClearPreSelectedStation?: () => void;
}

const SLOT_CHIPS = [30, 60, 90, 120, 180];
const SLOT_DROPDOWN = [15, 30, 45, 60, 75, 90, 120, 150, 180, 210, 240, 300, 360];

export const NewSessionTab: React.FC<NewSessionTabProps> = ({
  stations,
  snacks,
  offers,
  customers,
  activeSessions,
  onStartSession,
  toast,
  preSelectedStationId,
  onClearPreSelectedStation
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [startTime, setStartTime] = useState(nowHHMM());
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>(() => {
    return preSelectedStationId ? [preSelectedStationId] : [];
  });
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [players, setPlayers] = useState<number>(2);
  const [slots, setSlots] = useState<Slot[]>([{ mins: 30 }]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [studentDiscountActive, setStudentDiscountActive] = useState<boolean>(false);
  const [pm, setPm] = useState<'Cash' | 'UPI' | 'Split' | 'Pending'>('Cash');
  const [cashAmt, setCashAmt] = useState<number>(0);
  const [upiAmt, setUpiAmt] = useState<number>(0);
  const [note, setNote] = useState('');

  // Sync preSelectedStationId if it changes
  React.useEffect(() => {
    if (preSelectedStationId) {
      setSelectedStationIds([preSelectedStationId]);
      if (onClearPreSelectedStation) {
        onClearPreSelectedStation();
      }
    }
  }, [preSelectedStationId, onClearPreSelectedStation]);

  // Busy station IDs
  const busyStationIds = new Set<string>();
  activeSessions.filter(s => s.status === 'active').forEach(s => {
    (s.stationIds || [s.stationId]).forEach(id => busyStationIds.add(id));
  });

  const matchedCustomer = customers.find(c => c.nameKey === normKey(name));

  const toggleStation = (id: string) => {
    if (busyStationIds.has(id)) return;
    setSelectedStationIds(prev => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter(stId => stId !== id) : [...prev, id];
      const anyMulti = next.some(stId => stations.find(s => s.id === stId)?.hasMulti);
      if (!anyMulti) setMode('single');
      return next;
    });
  };

  const addSlot = () => {
    setSlots(prev => [...prev, { mins: 30 }]);
  };

  const removeSlot = (index: number) => {
    if (slots.length <= 1) {
      toast('At least one slot is required', 'warn');
      return;
    }
    setSlots(prev => prev.filter((_, i) => i !== index));
  };

  const updateSlotMins = (index: number, mins: number) => {
    setSlots(prev => prev.map((s, i) => (i === index ? { mins } : s)));
  };

  const addToCart = (snack: SnackItem) => {
    setCart(prev => {
      const ex = prev.find(item => item.id === snack.id);
      if (ex) {
        return prev.map(item => (item.id === snack.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { id: snack.id, name: snack.name, price: snack.price, emoji: snack.emoji, qty: 1 }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.id === id) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Calculations
  const gamingTotal = selectedStationIds.reduce((total, sid) => {
    const st = stations.find(s => s.id === sid);
    if (!st) return total;
    return (
      total +
      slots.reduce((s, sl) => s + slotPriceForStation(st, mode, players, sl.mins), 0)
    );
  }, 0);

  const snacksTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const subtotal = gamingTotal + snacksTotal;

  // Student Discount: 15% discount on bill of 500 or more
  const isStudentEligible = subtotal >= 500;
  const studentDiscount = (studentDiscountActive && isStudentEligible)
    ? Math.round(subtotal * 0.15)
    : 0;

  const grandTotal = Math.max(0, subtotal - studentDiscount);

  const handleStart = async () => {
    if (!name.trim()) {
      toast('Enter customer name', 'warn');
      return;
    }
    if (selectedStationIds.length === 0) {
      toast('Pick at least one station', 'warn');
      return;
    }
    if (slots.length === 0) {
      toast('Add at least one duration slot', 'warn');
      return;
    }

    if (pm === 'Split') {
      if (cashAmt + upiAmt !== grandTotal) {
        toast(`Split total (₹${cashAmt + upiAmt}) must equal Grand Total (₹${grandTotal})`, 'warn');
        return;
      }
    }

    const totalMins = slots.reduce((a, b) => a + b.mins, 0);
    const start = startTime || nowHHMM();
    const end = addMin(start, totalMins);

    let finalCash = 0;
    let finalUpi = 0;
    if (pm === 'Cash') finalCash = grandTotal;
    else if (pm === 'UPI') finalUpi = grandTotal;
    else if (pm === 'Split') {
      finalCash = cashAmt;
      finalUpi = upiAmt;
    }

    const anyMulti = selectedStationIds.some(id => stations.find(s => s.id === id)?.hasMulti);

    const submitSessionData = (finalNote: string) => {
      let combinedNote = finalNote;
      if (studentDiscountActive && studentDiscount > 0) {
        combinedNote = combinedNote
          ? `${combinedNote} • Student Discount 15% (-₹${studentDiscount})`
          : `Student Discount 15% (-₹${studentDiscount})`;
      }

      onStartSession({
        name: name.trim(),
        phone: phone.trim(),
        stationIds: selectedStationIds,
        stationId: selectedStationIds[0],
        mode: anyMulti ? mode : null,
        players: anyMulti && mode === 'multi' ? players : null,
        startTime: start,
        endTime: end,
        slots: slots.map(s => ({ mins: s.mins })),
        cart: cart.map(c => ({ ...c })),
        gaming: gamingTotal,
        snacks: snacksTotal,
        discount: studentDiscount,
        total: grandTotal,
        offer: null,
        pm,
        cashAmt: finalCash,
        upiAmt: finalUpi,
        note: combinedNote,
        status: 'active',
        date: todayISO(),
        createdAt: Date.now()
      });

      // Reset Form
      setName('');
      setPhone('');
      setStartTime(nowHHMM());
      setSelectedStationIds([]);
      setSlots([{ mins: 30 }]);
      setCart([]);
      setStudentDiscountActive(false);
      setPm('Cash');
      setCashAmt(0);
      setUpiAmt(0);
      setNote('');
    };

    submitSessionData(note.trim());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-4">
      {/* Left Main Form Column */}
      <div className="flex flex-col gap-4">
        {/* Customer Details */}
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2 mb-3">
            <UserPlus className="w-4 h-4 text-[#ff4dab]" /> Customer Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">
                Customer Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                list="customer-suggestions"
                className="bg-[rgba(8,3,15,0.65)] color-[#ece6ff] border border-[rgba(168,85,247,0.22)] rounded-xl px-3 py-2.5 text-sm font-semibold focus:border-[#e91e8c] outline-none"
              />
              <datalist id="customer-suggestions">
                {customers.map(c => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">
                Phone (optional)
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="bg-[rgba(8,3,15,0.65)] color-[#ece6ff] border border-[rgba(168,85,247,0.22)] rounded-xl px-3 py-2.5 text-sm font-semibold focus:border-[#e91e8c] outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="bg-[rgba(8,3,15,0.65)] color-[#ece6ff] border border-[rgba(168,85,247,0.22)] rounded-xl px-3 py-2.5 text-sm font-semibold focus:border-[#e91e8c] outline-none"
              />
            </div>
          </div>

          {matchedCustomer && matchedCustomer.sessionCount > 0 && (
            <div className="mt-2.5 text-xs text-[#ff4dab] font-semibold tracking-wide flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> Returning Customer • {matchedCustomer.sessionCount} past sessions • ₹{matchedCustomer.totalSpent} lifetime
            </div>
          )}
        </div>

        {/* Station Selection */}
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2 mb-3">
            <Monitor className="w-4 h-4 text-[#ff4dab]" /> Select Station(s)
            <span className="text-[10px] text-[#9c8fc6] lowercase font-medium tracking-normal ml-1">
              (multi-select available)
            </span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {stations.map(st => {
              const isBusy = busyStationIds.has(st.id);
              const isSelected = selectedStationIds.includes(st.id);
              return (
                <div
                  key={st.id}
                  onClick={() => toggleStation(st.id)}
                  className={`relative p-3 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                    isBusy
                      ? 'opacity-40 grayscale border-slate-700 pointer-events-none bg-slate-900/40'
                      : isSelected
                      ? 'border-[#e91e8c] bg-gradient-to-br from-[rgba(124,58,237,0.25)] to-[rgba(233,30,140,0.20)] shadow-[0_0_0_2px_rgba(233,30,140,0.5)]'
                      : 'border-[rgba(168,85,247,0.22)] bg-[rgba(8,3,15,0.55)] hover:border-[#e91e8c]'
                  }`}
                >
                  {isBusy && (
                    <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-extrabold uppercase tracking-widest shadow">
                      BUSY
                    </span>
                  )}
                  <Monitor className="w-6 h-6 text-purple-300" />
                  <span className="font-['Exo_2'] font-bold text-xs text-white tracking-wide text-center">
                    {st.name}
                  </span>
                  <span className="text-[10px] text-[#9c8fc6] font-semibold uppercase tracking-wider">
                    ₹{st.price60}/hr
                  </span>
                </div>
              );
            })}
          </div>

          {/* Multiplayer Config for PS5 */}
          {selectedStationIds.some(id => stations.find(s => s.id === id)?.hasMulti) && (
            <div className="mt-3 p-3 rounded-xl border border-[rgba(168,85,247,0.2)] bg-[rgba(8,3,15,0.4)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-[#9c8fc6] font-bold">Mode:</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setMode('single')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 border transition-all ${
                      mode === 'single'
                        ? 'bg-[rgba(124,58,237,0.3)] border-[#e91e8c] text-white'
                        : 'bg-[rgba(8,3,15,0.5)] border-[rgba(168,85,247,0.2)] text-[#9c8fc6]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" /> Singleplayer
                  </button>
                  <button
                    onClick={() => setMode('multi')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 border transition-all ${
                      mode === 'multi'
                        ? 'bg-[rgba(124,58,237,0.3)] border-[#e91e8c] text-white'
                        : 'bg-[rgba(8,3,15,0.5)] border-[rgba(168,85,247,0.2)] text-[#9c8fc6]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Multiplayer
                  </button>
                </div>
              </div>

              {mode === 'multi' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-[#9c8fc6] font-bold">Players:</span>
                  <div className="flex items-center gap-2 border border-[rgba(168,85,247,0.2)] rounded-lg px-2 py-1 bg-[rgba(8,3,15,0.5)]">
                    <button
                      onClick={() => setPlayers(Math.max(2, players - 1))}
                      className="p-1 rounded hover:bg-white/10 text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-['Exo_2'] font-bold text-sm text-white px-1">{players}</span>
                    <button
                      onClick={() => setPlayers(Math.min(8, players + 1))}
                      className="p-1 rounded hover:bg-white/10 text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Time Slots */}
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#ff4dab]" /> Time Slots
          </h3>

          <div className="flex flex-col gap-2.5">
            {slots.map((sl, index) => {
              let cursor = startTime || nowHHMM();
              for (let i = 0; i < index; i++) cursor = addMin(cursor, slots[i].mins);
              const endTime = addMin(cursor, sl.mins);

              const price = selectedStationIds.reduce(
                (sum, sid) => sum + slotPriceForStation(stations.find(s => s.id === sid), mode, players, sl.mins),
                0
              );

              return (
                <div
                  key={index}
                  className="p-2.5 rounded-xl border border-dashed border-[rgba(168,85,247,0.3)] bg-[rgba(8,3,15,0.45)] flex flex-wrap items-center gap-2 justify-between"
                >
                  <div className="flex flex-wrap gap-1">
                    {SLOT_CHIPS.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => updateSlotMins(index, m)}
                        className={`px-2.5 py-1 rounded-full border text-xs font-bold transition-all ${
                          sl.mins === m
                            ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border-[#e91e8c] text-white shadow'
                            : 'bg-purple-950/20 border-[rgba(168,85,247,0.2)] text-[#9c8fc6] hover:border-pink-500/50 hover:text-white'
                        }`}
                      >
                        {fmtMins(m)}
                      </button>
                    ))}
                  </div>

                  <select
                    value={SLOT_DROPDOWN.includes(sl.mins) ? sl.mins : 'custom'}
                    onChange={e => {
                      if (e.target.value === 'custom') {
                        const val = prompt('Enter custom duration in minutes (5–600):', String(sl.mins));
                        if (val) {
                          const num = Math.max(5, Math.min(600, parseInt(val, 10) || 30));
                          updateSlotMins(index, num);
                        }
                      } else {
                        updateSlotMins(index, Number(e.target.value));
                      }
                    }}
                    className="bg-[rgba(15,10,32,0.85)] color-white border border-[rgba(168,85,247,0.22)] rounded-lg px-2 py-1 text-xs outline-none"
                  >
                    {SLOT_DROPDOWN.map(m => (
                      <option key={m} value={m}>
                        {fmtMins(m)}
                      </option>
                    ))}
                    {!SLOT_DROPDOWN.includes(sl.mins) && <option value="custom">Custom ({fmtMins(sl.mins)})</option>}
                  </select>

                  <span className="text-xs text-[#9c8fc6] font-semibold">
                    {to12(cursor)} → {to12(endTime)}
                  </span>

                  <span className="font-['Exo_2'] font-bold text-sm text-[#ff4dab] min-w-[50px] text-right">
                    ₹{price}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    className="p-1 rounded text-[#9c8fc6] hover:text-rose-400 hover:bg-white/10"
                    title="Remove slot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            onClick={addSlot}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-purple-500/50 bg-purple-600/10 text-xs font-bold uppercase tracking-wider text-purple-200 hover:border-pink-500 hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add another slot
          </button>
        </div>

        {/* Snacks Menu Grid */}
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2 mb-3">
            <Coffee className="w-4 h-4 text-[#ff4dab]" /> Add Snacks
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {snacks.map(sn => (
              <div
                key={sn.id}
                onClick={() => addToCart(sn)}
                className="p-2.5 rounded-xl border border-[rgba(168,85,247,0.2)] bg-[rgba(8,3,15,0.55)] hover:border-[#e91e8c] cursor-pointer flex flex-col items-center gap-1 transition-all hover:-translate-y-0.5"
              >
                <span className="text-2xl">{sn.emoji || '🍪'}</span>
                <span className="text-xs font-bold text-white text-center">{sn.name}</span>
                <span className="font-['Exo_2'] font-bold text-xs text-[#ff4dab]">₹{sn.price}</span>
              </div>
            ))}
          </div>

          {/* Cart Items */}
          {cart.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5 border-t border-[rgba(168,85,247,0.2)] pt-3">
              {cart.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg border border-[rgba(168,85,247,0.15)] bg-[rgba(8,3,15,0.4)] text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span>{item.emoji}</span>
                    <span className="font-bold text-white">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border border-[rgba(168,85,247,0.2)] rounded px-1.5 py-0.5 bg-black/40">
                      <button onClick={() => updateCartQty(item.id, -1)} className="hover:text-pink-400">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-['Exo_2'] font-bold text-white px-1">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} className="hover:text-pink-400">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-['Exo_2'] font-bold text-white min-w-[45px] text-right">
                      ₹{item.price * item.qty}
                    </span>
                    <button onClick={() => updateCartQty(item.id, -item.qty)} className="text-rose-400 hover:text-rose-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment & Session Note */}
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#ff4dab]" /> Payment & Confirmation
            </h3>
            <span className="text-[11px] font-mono text-[#9c8fc6]">
              Subtotal: <strong className="text-white">₹{subtotal}</strong>
            </span>
          </div>

          {/* Student Discount Option (15% on bill of 500) */}
          <div
            onClick={() => {
              if (!isStudentEligible && !studentDiscountActive) {
                toast(`Student discount requires a minimum bill of ₹500 (Current bill: ₹${subtotal})`, 'warn');
                return;
              }
              setStudentDiscountActive(!studentDiscountActive);
            }}
            className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
              studentDiscountActive && isStudentEligible
                ? 'border-emerald-500/80 bg-gradient-to-r from-emerald-950/40 via-purple-950/40 to-pink-950/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : isStudentEligible
                ? 'border-purple-500/40 bg-purple-950/20 hover:border-pink-500/60 hover:bg-purple-900/30'
                : 'border-white/10 bg-black/30 opacity-75 hover:opacity-100 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg border ${
                studentDiscountActive && isStudentEligible
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-purple-900/30 text-purple-300 border-purple-500/30'
              }`}>
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-white">Student Discount (15% OFF)</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                    isStudentEligible
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {isStudentEligible ? 'Bill ₹500+ Qualified' : 'Bill ₹500+ Only'}
                  </span>
                </div>
                <div className="text-[11px] text-[#9c8fc6] mt-0.5">
                  {isStudentEligible
                    ? studentDiscountActive
                      ? `✓ 15% discount applied! You save ₹${studentDiscount} on this bill`
                      : `Bill is ₹${subtotal} (≥ ₹500). Click to apply 15% discount (-₹${Math.round(subtotal * 0.15)})`
                    : `Add ₹${500 - subtotal} more to bill to qualify (Current: ₹${subtotal})`
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                studentDiscountActive && isStudentEligible
                  ? 'bg-emerald-500 border-emerald-400 text-black font-bold shadow'
                  : 'border-white/20 bg-black/40 text-transparent'
              }`}>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-[rgba(168,85,247,0.2)] bg-[rgba(8,3,15,0.45)] flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-[#9c8fc6]">
              <span>Gaming Charges</span>
              <span className="font-bold text-white">₹{gamingTotal}</span>
            </div>
            <div className="flex justify-between text-xs text-[#9c8fc6]">
              <span>Snacks Order</span>
              <span className="font-bold text-white">₹{snacksTotal}</span>
            </div>
            {studentDiscount > 0 && (
              <div className="flex justify-between text-xs text-emerald-400 font-bold">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" /> Student Discount (15%)
                </span>
                <span>-₹{studentDiscount}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-['Exo_2'] font-extrabold text-white border-t border-dashed border-[rgba(168,85,247,0.2)] pt-2 mt-1">
              <span>Grand Total</span>
              <span className="bg-gradient-to-r from-white via-pink-200 to-[#ff4dab] bg-clip-text text-transparent">
                ₹{grandTotal}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Payment Mode</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(['Cash', 'UPI', 'Split', 'Pending'] as const).map(modeOpt => (
                <button
                  key={modeOpt}
                  type="button"
                  onClick={() => setPm(modeOpt)}
                  className={`py-2 px-2.5 rounded-xl border text-[11px] font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    pm === modeOpt
                      ? modeOpt === 'Cash'
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow'
                        : modeOpt === 'UPI'
                        ? 'border-sky-500 bg-sky-500/20 text-sky-300 shadow'
                        : modeOpt === 'Split'
                        ? 'border-pink-500 bg-pink-500/20 text-pink-300 shadow'
                        : 'border-amber-500 bg-amber-500/20 text-amber-300 shadow animate-pulse'
                      : 'border-[rgba(168,85,247,0.2)] bg-[rgba(8,3,15,0.6)] text-[#ece6ff] hover:border-pink-500/50'
                  }`}
                >
                  {modeOpt === 'Split' && <Split className="w-3.5 h-3.5" />}
                  {modeOpt}
                </button>
              ))}
            </div>
          </div>

          {/* Split Mode Calculator */}
          {pm === 'Split' && (
            <div className="p-3 rounded-xl border border-dashed border-pink-500/40 bg-[rgba(8,3,15,0.45)] flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-[#9c8fc6] uppercase font-bold">Cash Portion (₹)</label>
                  <input
                    type="number"
                    value={cashAmt || ''}
                    onChange={e => setCashAmt(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-black/60 border border-[rgba(168,85,247,0.2)] rounded-lg p-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#9c8fc6] uppercase font-bold">UPI Portion (₹)</label>
                  <input
                    type="number"
                    value={upiAmt || ''}
                    onChange={e => setUpiAmt(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-black/60 border border-[rgba(168,85,247,0.2)] rounded-lg p-2 text-xs text-white outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const half = Math.floor(grandTotal / 2);
                    setCashAmt(half);
                    setUpiAmt(grandTotal - half);
                  }}
                  className="px-2 py-1 rounded bg-purple-900/30 border border-purple-500/30 text-[11px] font-bold text-purple-200"
                >
                  50 / 50 Split
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCashAmt(0);
                    setUpiAmt(0);
                  }}
                  className="px-2 py-1 rounded bg-slate-900/30 border border-slate-500/30 text-[11px] font-bold text-slate-300"
                >
                  Clear
                </button>
              </div>
              <div
                className={`text-xs font-semibold ${
                  cashAmt + upiAmt === grandTotal ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {cashAmt + upiAmt === grandTotal
                  ? `✓ Cash ₹${cashAmt} + UPI ₹${upiAmt} = ₹${grandTotal}`
                  : `Total enters ₹${cashAmt + upiAmt} (Target: ₹${grandTotal})`}
              </div>
            </div>
          )}

          {/* Note Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-pink-400" /> Session Note
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add any note for this session (e.g., Tournament match, Controller requested)..."
              maxLength={500}
              className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c] min-h-[60px]"
            />
          </div>

          <button
            onClick={handleStart}
            className="mt-2 w-full py-3.5 rounded-xl font-['Exo_2'] font-extrabold uppercase tracking-widest text-sm text-white bg-gradient-to-r from-[#7c3aed] to-[#e91e8c] shadow-[0_12px_40px_-10px_rgba(233,30,140,0.6)] hover:-translate-y-0.5 transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" /> Start Session Now
          </button>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#9c8fc6] pt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Auto-synced to Supabase Cloud (<code className="text-emerald-300 font-mono">ozzywiqrdczjumdasedw</code>)</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Live Station Availability & Active Overview */}
      <div className="flex flex-col gap-4">
        {/* Live Station Availability */}
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2 mb-3">
            <Monitor className="w-4 h-4 text-[#ff4dab]" /> Live Station Grid
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {stations.map(st => {
              const active = activeSessions.find(
                s => s.status === 'active' && (s.stationIds || [s.stationId]).includes(st.id)
              );

              return (
                <div
                  key={st.id}
                  className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
                    active
                      ? 'border-rose-500/50 bg-rose-950/20 text-rose-200'
                      : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        active ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                      }`}
                    />
                    <span className="truncate">{st.name}</span>
                  </div>
                  <span className="text-[10px] text-[#9c8fc6]">
                    {active ? `${active.name} (ends ${to12(active.endTime)})` : 'Available'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Operational Stats */}
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md flex flex-col gap-2">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold mb-1">
            Quick Today Overview
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl border border-[rgba(168,85,247,0.2)] bg-[rgba(8,3,15,0.5)]">
              <span className="text-[10px] text-[#9c8fc6] uppercase font-bold tracking-widest">Active</span>
              <div className="font-['Exo_2'] text-xl font-extrabold text-purple-300">
                {activeSessions.filter(s => s.status === 'active').length}
              </div>
            </div>

            <div className="p-2.5 rounded-xl border border-[rgba(168,85,247,0.2)] bg-[rgba(8,3,15,0.5)]">
              <span className="text-[10px] text-[#9c8fc6] uppercase font-bold tracking-widest">Total Revenue</span>
              <div className="font-['Exo_2'] text-xl font-extrabold text-[#ff4dab]">
                ₹{activeSessions.reduce((sum, s) => sum + (s.total || 0), 0)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
