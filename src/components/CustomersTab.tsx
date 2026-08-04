import React, { useState } from 'react';
import { Users, Search, Trash2, Calendar, Award, Phone } from 'lucide-react';
import { Customer, Session } from '../types';
import { fmtDateLong, normKey } from '../utils/helpers';

interface CustomersTabProps {
  customers: Customer[];
  sessions: Session[];
  history: Record<string, Session[]>;
  onDeleteCustomer: (id: string) => void;
  onWipeAllCustomers: () => void;
  onOpenProfile: (customer: Customer) => void;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  customers,
  sessions,
  history,
  onDeleteCustomer,
  onWipeAllCustomers,
  onOpenProfile
}) => {
  const [search, setSearch] = useState('');

  const filtered = customers
    .filter(
      c =>
        !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search)
    )
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt));

  const topCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 8);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-4">
      {/* Search & Main Directory Column */}
      <div className="flex flex-col gap-4">
        {/* Search Header */}
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-[#ff4dab]" /> Search Customer CRM
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-[#9c8fc6]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by customer name or phone number..."
              className="w-full bg-[rgba(8,3,15,0.65)] text-white border border-[rgba(168,85,247,0.22)] rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:border-[#e91e8c]"
            />
          </div>
        </div>

        {/* Directory Table */}
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2">
              <Users className="w-4 h-4 text-[#ff4dab]" /> Customer Directory ({filtered.length})
            </h3>
            {customers.length > 0 && (
              <button
                onClick={onWipeAllCustomers}
                className="px-2.5 py-1 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-600 hover:text-white text-xs font-bold uppercase transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Wipe All
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center text-[#9c8fc6] italic text-xs">
              No customers found. Customers automatically populate when you start gaming sessions.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map(c => {
                const initials = c.name
                  .split(/\s+/)
                  .map(w => w[0] || '')
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={c.id}
                    onClick={() => onOpenProfile(c)}
                    className="p-3 rounded-xl border border-[rgba(168,85,247,0.18)] bg-[rgba(19,13,36,0.55)] hover:border-[#e91e8c] cursor-pointer flex items-center justify-between gap-3 transition-all hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#e91e8c] text-white font-['Exo_2'] font-black text-sm flex items-center justify-center shrink-0">
                        {initials || '?'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="font-['Exo_2'] font-bold text-sm text-white flex items-center gap-2">
                          <span className="truncate">{c.name}</span>
                          {c.phone && <span className="text-[10px] text-[#9c8fc6] font-normal">{c.phone}</span>}
                        </div>
                        <div className="text-[11px] text-[#9c8fc6] flex items-center gap-2">
                          <span>Last visit: {fmtDateLong(c.lastAt)}</span>
                          <span>• {c.sessionCount} sessions</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="font-['Exo_2'] font-extrabold text-base text-[#ff4dab] whitespace-nowrap">
                        ₹{c.totalSpent}
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteCustomer(c.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                        title="Delete customer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: Top Champions */}
      <div className="flex flex-col gap-4">
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <h3 className="text-xs uppercase tracking-[0.22em] text-[#9c8fc6] font-extrabold flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-[#ff4dab]" /> Top Cafe Champions
          </h3>

          {topCustomers.length === 0 ? (
            <div className="p-4 text-center text-[#9c8fc6] italic text-xs">No customer records yet.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {topCustomers.map((c, i) => (
                <div key={c.id} className="p-2.5 rounded-xl border border-[rgba(168,85,247,0.15)] bg-black/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-['Exo_2'] font-black text-xs text-purple-400">#{i + 1}</span>
                    <span className="font-bold text-xs text-white truncate max-w-[120px]">{c.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-['Exo_2'] font-bold text-xs text-[#ff4dab]">₹{c.totalSpent}</div>
                    <div className="text-[9px] text-[#9c8fc6]">{c.sessionCount} visits</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
