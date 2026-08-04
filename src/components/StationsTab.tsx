import React, { useState } from 'react';
import { Monitor, Plus, Trash2, Edit3 } from 'lucide-react';
import { Station, Session } from '../types';

interface StationsTabProps {
  stations: Station[];
  activeSessions: Session[];
  onAddStation: (station: Partial<Station>) => void;
  onUpdateStation: (id: string, updates: Partial<Station>) => void;
  onDeleteStation: (id: string) => void;
  toast: (msg: string, kind?: 'ok' | 'warn' | 'info') => void;
}

const COLOR_OPTIONS: ('purple' | 'violet' | 'amber' | 'cyan' | 'rose' | 'emerald')[] = [
  'purple',
  'violet',
  'amber',
  'cyan',
  'rose',
  'emerald'
];

export const StationsTab: React.FC<StationsTabProps> = ({
  stations,
  activeSessions,
  onAddStation,
  onUpdateStation,
  onDeleteStation,
  toast
}) => {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'PC' | 'PS5' | 'RACE' | 'CUSTOM'>('PC');
  const [color, setColor] = useState<'purple' | 'violet' | 'amber' | 'cyan' | 'rose' | 'emerald'>('purple');
  const [price30, setPrice30] = useState<number>(30);
  const [price60, setPrice60] = useState<number>(50);
  const [hasMulti, setHasMulti] = useState<boolean>(false);
  const [multi30, setMulti30] = useState<number>(0);
  const [multi60, setMulti60] = useState<number>(0);

  const busyStationIds = new Set<string>();
  activeSessions.filter(s => s.status === 'active').forEach(s => {
    (s.stationIds || [s.stationId]).forEach(id => busyStationIds.add(id));
  });

  const handleCreate = () => {
    if (!name.trim()) {
      toast('Enter station name', 'warn');
      return;
    }

    onAddStation({
      name: name.trim(),
      kind,
      icon: kind === 'PS5' ? 'ti-device-gamepad-2' : kind === 'RACE' ? 'ti-steering-wheel' : 'ti-device-desktop',
      color,
      price30,
      price60,
      hasMulti,
      multi30: hasMulti ? multi30 : 0,
      multi60: hasMulti ? multi60 : 0
    });

    setName('');
    toast('Station created successfully', 'ok');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-4">
      {/* Stations List */}
      <div className="flex flex-col gap-4">
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2 mb-3">
            <Monitor className="w-4 h-4 text-[#ff4dab]" /> Gaming Station Inventory ({stations.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stations.map(st => {
              const isBusy = busyStationIds.has(st.id);

              return (
                <div
                  key={st.id}
                  className="p-3.5 rounded-xl border border-[rgba(168,85,247,0.18)] bg-[rgba(8,3,15,0.55)] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/30 text-purple-200 flex items-center justify-center">
                      <Monitor className="w-5 h-5 text-purple-300" />
                    </div>
                    <div className="flex flex-col">
                      <div className="font-['Exo_2'] font-bold text-xs text-white flex items-center gap-2">
                        {st.name}
                        {isBusy && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-extrabold uppercase">
                            In Use
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#9c8fc6] mt-0.5">
                        ₹{st.price30}/30m • ₹{st.price60}/hr
                        {st.hasMulti && ` • Multi ₹${st.multi60}/hr`}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (isBusy) {
                        toast('Cannot delete a station currently in use', 'warn');
                        return;
                      }
                      onDeleteStation(st.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                    title="Delete Station"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Add New Station Form */}
      <div className="flex flex-col gap-4">
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md flex flex-col gap-3">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#ff4dab]" /> Add New Gaming Station
          </h3>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Station Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. PC 5 (RTX 5090)"
              className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Category Kind</label>
              <select
                value={kind}
                onChange={e => setKind(e.target.value as any)}
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              >
                <option value="PC">Gaming PC</option>
                <option value="PS5">PlayStation 5</option>
                <option value="RACE">Racing Sim</option>
                <option value="CUSTOM">Custom Setup</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Color Theme</label>
              <select
                value={color}
                onChange={e => setColor(e.target.value as any)}
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              >
                {COLOR_OPTIONS.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">30 min Price (₹)</label>
              <input
                type="number"
                value={price30}
                onChange={e => setPrice30(Number(e.target.value) || 0)}
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">1 hour Price (₹)</label>
              <input
                type="number"
                value={price60}
                onChange={e => setPrice60(Number(e.target.value) || 0)}
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              id="multi-toggle"
              checked={hasMulti}
              onChange={e => setHasMulti(e.target.checked)}
              className="w-4 h-4 rounded border-purple-500 text-pink-600 focus:ring-0"
            />
            <label htmlFor="multi-toggle" className="text-xs uppercase font-bold text-[#9c8fc6] cursor-pointer">
              Enable Multiplayer Pricing Rate
            </label>
          </div>

          {hasMulti && (
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl border border-dashed border-purple-500/30 bg-purple-950/20">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-[#9c8fc6] font-bold">Multi 30m (₹/player)</label>
                <input
                  type="number"
                  value={multi30}
                  onChange={e => setMulti30(Number(e.target.value) || 0)}
                  className="bg-black/60 text-white border border-[rgba(168,85,247,0.2)] rounded-lg p-2 text-xs outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider text-[#9c8fc6] font-bold">Multi 1hr (₹/player)</label>
                <input
                  type="number"
                  value={multi60}
                  onChange={e => setMulti60(Number(e.target.value) || 0)}
                  className="bg-black/60 text-white border border-[rgba(168,85,247,0.2)] rounded-lg p-2 text-xs outline-none"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleCreate}
            className="py-2.5 rounded-xl font-['Exo_2'] font-extrabold uppercase tracking-widest text-xs text-white bg-gradient-to-r from-[#7c3aed] to-[#e91e8c] shadow hover:-translate-y-0.5 transition-transform"
          >
            Add Gaming Station
          </button>
        </div>
      </div>
    </div>
  );
};
