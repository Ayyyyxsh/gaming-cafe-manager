import React, { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { Session, Station, Customer } from '../types';
import { addMin, diffMin, slotPriceForStation, fmtMins, escapeHtml } from '../utils/helpers';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToEdit?: Session | null;
  historyContext?: { date: string } | null;
  customerProfile?: Customer | null;
  customerSessions?: Session[];
  stations: Station[];
  onSaveSession: (id: string, updates: Partial<Session>, isHistory?: boolean, date?: string) => void;
  onClearCustomerHistory?: (id: string) => void;
  onDeleteCustomerProfile?: (id: string) => void;
  toast: (msg: string, kind?: 'ok' | 'warn' | 'info') => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  sessionToEdit,
  historyContext,
  customerProfile,
  customerSessions = [],
  stations,
  onSaveSession,
  onClearCustomerHistory,
  onDeleteCustomerProfile,
  toast
}) => {
  if (!isOpen) return null;

  // Session Edit State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState<number>(30);
  const [mode, setMode] = useState<'single' | 'multi'>('single');
  const [players, setPlayers] = useState<number>(2);
  const [gaming, setGaming] = useState<number>(0);
  const [snacks, setSnacks] = useState<number>(0);
  const [pm, setPm] = useState<'Cash' | 'UPI' | 'Split' | 'Pending'>('Cash');
  const [cashAmt, setCashAmt] = useState<number>(0);
  const [upiAmt, setUpiAmt] = useState<number>(0);

  useEffect(() => {
    if (sessionToEdit) {
      setName(sessionToEdit.name || '');
      setPhone(sessionToEdit.phone || '');
      setNote(sessionToEdit.note || '');
      const stIds = sessionToEdit.stationIds || (sessionToEdit.stationId ? [sessionToEdit.stationId] : []);
      setSelectedStationIds(stIds);
      setStartTime(sessionToEdit.startTime || '');
      const dur = (sessionToEdit.slots || []).reduce((a, b) => a + (b.mins || 0), 0) || 30;
      setDuration(dur);
      setMode(sessionToEdit.mode === 'multi' ? 'multi' : 'single');
      setPlayers(sessionToEdit.players || 2);
      setGaming(sessionToEdit.gaming || 0);
      setSnacks(sessionToEdit.snacks || 0);
      setPm(sessionToEdit.pm || 'Cash');
      setCashAmt(sessionToEdit.cashAmt || 0);
      setUpiAmt(sessionToEdit.upiAmt || 0);
    }
  }, [sessionToEdit]);

  const toggleStation = (id: string) => {
    setSelectedStationIds(prev =>
      prev.includes(id) ? prev.filter(stId => stId !== id) : [...prev, id]
    );
  };

  const handleSaveSession = () => {
    if (!sessionToEdit) return;
    if (!name.trim()) {
      toast('Customer name is required', 'warn');
      return;
    }
    if (selectedStationIds.length === 0) {
      toast('Select at least one station', 'warn');
      return;
    }

    const total = gaming + snacks;
    let finalCash = 0;
    let finalUpi = 0;

    if (pm === 'Cash') finalCash = total;
    else if (pm === 'UPI') finalUpi = total;
    else if (pm === 'Split') {
      if (cashAmt + upiAmt !== total) {
        toast(`Split total (₹${cashAmt + upiAmt}) must equal total (₹${total})`, 'warn');
        return;
      }
      finalCash = cashAmt;
      finalUpi = upiAmt;
    }

    const endTime = addMin(startTime, duration);

    onSaveSession(
      sessionToEdit.id,
      {
        name: name.trim(),
        phone: phone.trim(),
        note: note.trim(),
        stationIds: selectedStationIds,
        stationId: selectedStationIds[0],
        startTime,
        endTime,
        slots: [{ mins: duration }],
        mode: mode === 'multi' ? 'multi' : null,
        players: mode === 'multi' ? players : null,
        gaming,
        snacks,
        total,
        pm,
        cashAmt: finalCash,
        upiAmt: finalUpi
      },
      !!historyContext,
      historyContext?.date
    );

    toast('Session updated successfully', 'ok');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-[rgba(168,85,247,0.3)] bg-gradient-to-b from-[rgba(36,24,65,0.95)] to-[rgba(19,13,36,0.95)] p-5 shadow-[0_30px_80px_-20px_rgba(233,30,140,0.4)] text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <h3 className="font-['Exo_2'] font-bold text-sm uppercase tracking-widest text-[#ff4dab]">
            {customerProfile ? `Customer Profile: ${customerProfile.name}` : 'Edit Session Record'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CUSTOMER PROFILE VIEW */}
        {customerProfile ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#e91e8c] text-white font-['Exo_2'] font-black text-2xl flex items-center justify-center shadow">
                {customerProfile.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-['Exo_2'] font-extrabold text-lg text-white">{customerProfile.name}</div>
                <div className="text-xs text-[#9c8fc6]">{customerProfile.phone || 'No phone recorded'}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-950/20">
                <span className="text-[10px] uppercase font-bold text-[#9c8fc6]">Total Spent</span>
                <span className="font-['Exo_2'] font-extrabold text-xl text-[#ff4dab] block">
                  ₹{customerProfile.totalSpent}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-950/20">
                <span className="text-[10px] uppercase font-bold text-[#9c8fc6]">Total Visits</span>
                <span className="font-['Exo_2'] font-extrabold text-xl text-purple-200 block">
                  {customerSessions.length}
                </span>
              </div>
              <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-950/20">
                <span className="text-[10px] uppercase font-bold text-[#9c8fc6]">First Visit</span>
                <span className="font-['Exo_2'] font-bold text-xs text-white block mt-1">
                  {customerProfile.firstAt}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase font-bold text-[#9c8fc6]">Past Session Log ({customerSessions.length})</span>
              <div className="max-h-[220px] overflow-y-auto border border-white/10 rounded-xl p-2 bg-black/40">
                {customerSessions.length === 0 ? (
                  <div className="p-4 text-center text-[#9c8fc6] text-xs italic">No session history found.</div>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[#9c8fc6] uppercase">
                        <th className="p-1.5">Date</th>
                        <th className="p-1.5">Stations</th>
                        <th className="p-1.5">Pay</th>
                        <th className="p-1.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerSessions.map(s => (
                        <tr key={s.id} className="border-b border-white/5">
                          <td className="p-1.5 text-white">{s.date}</td>
                          <td className="p-1.5 text-[#9c8fc6]">
                            {(s.stationIds || [s.stationId]).join(', ')}
                          </td>
                          <td className="p-1.5 text-[#9c8fc6]">{s.pm}</td>
                          <td className="p-1.5 text-right font-bold text-pink-400">₹{s.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              {onClearCustomerHistory && (
                <button
                  onClick={() => onClearCustomerHistory(customerProfile.id)}
                  className="px-3 py-2 rounded-xl bg-amber-600/30 border border-amber-500/40 text-amber-200 text-xs font-bold uppercase hover:bg-amber-600 hover:text-white"
                >
                  Clear History Only
                </button>
              )}
              {onDeleteCustomerProfile && (
                <button
                  onClick={() => onDeleteCustomerProfile(customerProfile.id)}
                  className="px-3 py-2 rounded-xl bg-rose-600/30 border border-rose-500/40 text-rose-200 text-xs font-bold uppercase hover:bg-rose-600 hover:text-white"
                >
                  Delete Customer
                </button>
              )}
              <button
                onClick={onClose}
                className="ml-auto px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold uppercase"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* SESSION EDIT FORM */
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#9c8fc6]">Customer Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-black/60 border border-[rgba(168,85,247,0.22)] rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#9c8fc6]">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-black/60 border border-[rgba(168,85,247,0.22)] rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[#9c8fc6] flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-pink-400" /> Session Note
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={500}
                placeholder="Add or update session notes..."
                className="w-full bg-black/60 border border-[rgba(168,85,247,0.22)] rounded-lg p-2 text-xs text-white outline-none min-h-[50px]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[#9c8fc6]">Stations (Multi-Select)</label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-black/40 border border-white/10">
                {stations.map(st => {
                  const isSelected = selectedStationIds.includes(st.id);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => toggleStation(st.id)}
                      className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-purple-600 border-[#e91e8c] text-white'
                          : 'bg-slate-900 border-slate-700 text-[#9c8fc6]'
                      }`}
                    >
                      {st.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#9c8fc6]">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full bg-black/60 border border-[rgba(168,85,247,0.22)] rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#9c8fc6]">Duration (Minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value) || 30)}
                  className="w-full bg-black/60 border border-[rgba(168,85,247,0.22)] rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#9c8fc6]">Gaming Charge (₹)</label>
                <input
                  type="number"
                  value={gaming}
                  onChange={e => setGaming(Number(e.target.value) || 0)}
                  className="w-full bg-black/60 border border-[rgba(168,85,247,0.22)] rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-[#9c8fc6]">Snacks Charge (₹)</label>
                <input
                  type="number"
                  value={snacks}
                  onChange={e => setSnacks(Number(e.target.value) || 0)}
                  className="w-full bg-black/60 border border-[rgba(168,85,247,0.22)] rounded-lg p-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[#9c8fc6]">Payment Mode</label>
              <select
                value={pm}
                onChange={e => setPm(e.target.value as any)}
                className="w-full bg-black/60 border border-[rgba(168,85,247,0.22)] rounded-lg p-2 text-xs text-white outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Split">Split</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {pm === 'Split' && (
              <div className="grid grid-cols-2 gap-2 p-2 rounded-lg border border-dashed border-pink-500/40 bg-black/40">
                <div>
                  <label className="text-[9px] uppercase text-[#9c8fc6]">Cash Portion (₹)</label>
                  <input
                    type="number"
                    value={cashAmt}
                    onChange={e => setCashAmt(Number(e.target.value) || 0)}
                    className="w-full bg-black/60 border border-white/10 rounded p-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase text-[#9c8fc6]">UPI Portion (₹)</label>
                  <input
                    type="number"
                    value={upiAmt}
                    onChange={e => setUpiAmt(Number(e.target.value) || 0)}
                    className="w-full bg-black/60 border border-white/10 rounded p-1.5 text-xs text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/10">
              <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold uppercase">
                Cancel
              </button>
              <button
                onClick={handleSaveSession}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-xs font-bold uppercase text-white shadow"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
