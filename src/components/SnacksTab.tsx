import React, { useState } from 'react';
import { Coffee, Plus, Trash2, TrendingUp } from 'lucide-react';
import { SnackItem, Session } from '../types';

interface SnacksTabProps {
  snacks: SnackItem[];
  sessions: Session[];
  onAddSnack: (snack: Partial<SnackItem>) => void;
  onDeleteSnack: (id: string) => void;
  toast: (msg: string, kind?: 'ok' | 'warn' | 'info') => void;
}

export const SnacksTab: React.FC<SnacksTabProps> = ({
  snacks,
  sessions,
  onAddSnack,
  onDeleteSnack,
  toast
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(40);
  const [emoji, setEmoji] = useState('🍜');

  const handleCreate = () => {
    if (!name.trim()) {
      toast('Enter snack name', 'warn');
      return;
    }
    if (!price || price <= 0) {
      toast('Enter a valid price', 'warn');
      return;
    }

    onAddSnack({
      name: name.trim(),
      price,
      emoji: emoji.trim() || '🍪'
    });

    setName('');
    setPrice(40);
    setEmoji('🍜');
    toast('Added snack item', 'ok');
  };

  // Snack Sales Today Analytics
  const salesMap: Record<string, { name: string; emoji: string; qty: number; rev: number }> = {};
  sessions.forEach(s => {
    (s.cart || []).forEach(c => {
      if (!salesMap[c.id]) {
        salesMap[c.id] = { name: c.name, emoji: c.emoji, qty: 0, rev: 0 };
      }
      salesMap[c.id].qty += c.qty;
      salesMap[c.id].rev += c.qty * c.price;
    });
  });

  const salesList = Object.values(salesMap).sort((a, b) => b.rev - a.rev);
  const totalSnacksRevenue = salesList.reduce((sum, item) => sum + item.rev, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-4">
      {/* Snack Menu Directory */}
      <div className="flex flex-col gap-4">
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2 mb-3">
            <Coffee className="w-4 h-4 text-[#ff4dab]" /> Snack & Beverage Menu ({snacks.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {snacks.map(sn => (
              <div
                key={sn.id}
                className="p-3 rounded-xl border border-[rgba(168,85,247,0.18)] bg-[rgba(8,3,15,0.55)] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sn.emoji || '🍪'}</span>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-white">{sn.name}</span>
                    <span className="font-['Exo_2'] font-bold text-xs text-[#ff4dab]">₹{sn.price}</span>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteSnack(sn.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Snack Item Form */}
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md flex flex-col gap-3">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#ff4dab]" /> Add New Snack / Drink
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Item Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Maggi Noodle Cup"
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Price (₹) *</label>
              <input
                type="number"
                value={price || ''}
                onChange={e => setPrice(Number(e.target.value) || 0)}
                placeholder="40"
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Emoji Icon</label>
              <input
                type="text"
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                maxLength={4}
                placeholder="🍜"
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            className="py-2.5 rounded-xl font-['Exo_2'] font-extrabold uppercase tracking-widest text-xs text-white bg-gradient-to-r from-[#7c3aed] to-[#e91e8c] shadow hover:-translate-y-0.5 transition-transform"
          >
            Add to Menu
          </button>
        </div>
      </div>

      {/* Right Sidebar: Today Snack Sales Analytics */}
      <div className="flex flex-col gap-4">
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#ff4dab]" /> Today's Snack Sales
          </h3>

          {salesList.length === 0 ? (
            <div className="p-6 text-center text-[#9c8fc6] italic text-xs">No snack orders recorded today.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {salesList.map((item, i) => (
                <div key={i} className="p-2.5 rounded-xl border border-[rgba(168,85,247,0.15)] bg-black/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.emoji}</span>
                    <span className="font-bold text-white">{item.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold text-[10px]">
                      ×{item.qty}
                    </span>
                  </div>
                  <span className="font-['Exo_2'] font-bold text-white">₹{item.rev}</span>
                </div>
              ))}

              <div className="mt-2 pt-2 border-t border-dashed border-[rgba(168,85,247,0.2)] flex justify-between items-center text-sm font-['Exo_2'] font-extrabold text-white">
                <span>Total Snack Sales</span>
                <span className="text-[#ff4dab]">₹{totalSnacksRevenue}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
