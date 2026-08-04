import React, { useState } from 'react';
import { Gift, Plus, Trash2, Edit3, ToggleLeft, ToggleRight } from 'lucide-react';
import { Offer } from '../types';

interface OffersTabProps {
  offers: Offer[];
  onAddOffer: (offer: Partial<Offer>) => void;
  onUpdateOffer: (id: string, updates: Partial<Offer>) => void;
  onDeleteOffer: (id: string) => void;
  toast: (msg: string, kind?: 'ok' | 'warn' | 'info') => void;
}

export const OffersTab: React.FC<OffersTabProps> = ({
  offers,
  onAddOffer,
  onUpdateOffer,
  onDeleteOffer,
  toast
}) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<'freetime' | 'flat' | 'percent' | 'note'>('freetime');
  const [value, setValue] = useState<number>(30);
  const [badge, setBadge] = useState('');
  const [emoji, setEmoji] = useState('🎁');

  const handleCreate = () => {
    if (!title.trim()) {
      toast('Enter offer title', 'warn');
      return;
    }

    onAddOffer({
      title: title.trim(),
      desc: desc.trim(),
      type,
      value: type === 'note' ? 0 : value,
      badge: badge.trim(),
      emoji: emoji.trim() || '🎁',
      active: true,
      createdAt: new Date().toISOString().split('T')[0]
    });

    setTitle('');
    setDesc('');
    setBadge('');
    setValue(30);
    toast('Offer created!', 'ok');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-4">
      {/* Active Offers Directory */}
      <div className="flex flex-col gap-4">
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2 mb-3">
            <Gift className="w-4 h-4 text-[#ff4dab]" /> Custom Promotional Offers ({offers.length})
          </h3>

          {offers.length === 0 ? (
            <div className="p-8 text-center text-[#9c8fc6] italic text-xs">No active promo offers configured.</div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {offers.map(of => (
                <div
                  key={of.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    of.active
                      ? 'border-[#e91e8c]/50 bg-gradient-to-r from-purple-900/30 to-pink-900/30'
                      : 'border-[rgba(168,85,247,0.18)] bg-[rgba(8,3,15,0.4)] opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl">{of.emoji || '🎁'}</span>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-white">{of.title}</span>
                        {of.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[9px] font-extrabold border border-pink-500/30">
                            {of.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#9c8fc6] truncate mt-0.5">{of.desc}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-['Exo_2'] font-bold text-xs text-[#ff4dab] whitespace-nowrap">
                      {of.type === 'flat'
                        ? `₹${of.value} OFF`
                        : of.type === 'percent'
                        ? `${of.value}% OFF`
                        : of.type === 'freetime'
                        ? `+${of.value}m FREE`
                        : 'Manual Note'}
                    </span>

                    <button
                      onClick={() => onUpdateOffer(of.id, { active: !of.active })}
                      className="p-1 rounded text-pink-400 hover:text-white"
                      title={of.active ? 'Disable offer' : 'Enable offer'}
                    >
                      {of.active ? <ToggleRight className="w-6 h-6 text-pink-500" /> : <ToggleLeft className="w-6 h-6 text-slate-500" />}
                    </button>

                    <button
                      onClick={() => onDeleteOffer(of.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400"
                      title="Delete offer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: Create Offer Form */}
      <div className="flex flex-col gap-4">
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md flex flex-col gap-3">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#ff4dab]" /> Add New Promo Offer
          </h3>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Offer Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Weekend Gamer Bonanza"
              className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Description</label>
            <input
              type="text"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="e.g. Get 30 min free gaming time on 1hr+ bookings"
              className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Discount Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              >
                <option value="freetime">Free Time (+Minutes)</option>
                <option value="flat">Flat Amount (₹ Off)</option>
                <option value="percent">Percentage (% Off)</option>
                <option value="note">Special Note Only</option>
              </select>
            </div>

            {type !== 'note' && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">
                  {type === 'freetime' ? 'Free Minutes' : type === 'flat' ? 'Flat ₹ Off' : 'Percentage %'}
                </label>
                <input
                  type="number"
                  value={value || ''}
                  onChange={e => setValue(Number(e.target.value) || 0)}
                  placeholder="30"
                  className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold">Badge Label</label>
              <input
                type="text"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder="HOT DEAL"
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
                placeholder="🎁"
                className="bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl p-2.5 text-xs outline-none focus:border-[#e91e8c]"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            className="py-2.5 rounded-xl font-['Exo_2'] font-extrabold uppercase tracking-widest text-xs text-white bg-gradient-to-r from-[#7c3aed] to-[#e91e8c] shadow hover:-translate-y-0.5 transition-transform"
          >
            Create Offer
          </button>
        </div>
      </div>
    </div>
  );
};
