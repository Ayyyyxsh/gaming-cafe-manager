import React from 'react';
import {
  Zap,
  Gamepad2,
  Calendar,
  Users,
  Coffee,
  Gift,
  Monitor,
  BarChart3,
  History,
  Radio,
  TrendingUp,
  Crown
} from 'lucide-react';

export type TabType =
  | 'admin'
  | 'live'
  | 'new'
  | 'sessions'
  | 'bookings'
  | 'customers'
  | 'snacks'
  | 'stations'
  | 'today'
  | 'history'
  | 'dashboard';

interface TabsNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  activeSessionsCount: number;
  bookingsCount?: number;
  isAdmin?: boolean;
}

export const TabsNav: React.FC<TabsNavProps> = ({
  activeTab,
  onChangeTab,
  activeSessionsCount,
  bookingsCount = 0,
  isAdmin = false
}) => {
  const adminTabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'admin', label: 'Admin Panel (All Bookings)', icon: <Crown className="w-4 h-4 text-amber-300" />, badge: bookingsCount },
    { id: 'live', label: 'Live Station Monitor', icon: <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> },
    { id: 'new', label: 'New Session', icon: <Zap className="w-4 h-4 text-purple-400" /> },
    { id: 'sessions', label: 'Sessions', icon: <Gamepad2 className="w-4 h-4 text-purple-400" />, badge: activeSessionsCount },
    { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4 text-purple-400" /> },
    { id: 'snacks', label: 'Snacks', icon: <Coffee className="w-4 h-4 text-purple-400" /> },
    { id: 'stations', label: 'Stations', icon: <Monitor className="w-4 h-4 text-purple-400" /> },
    { id: 'today', label: 'Today', icon: <BarChart3 className="w-4 h-4 text-purple-400" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4 text-purple-400" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp className="w-4 h-4 text-cyan-400" /> },
  ];

  const publicTabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'bookings', label: 'Book a Station', icon: <Calendar className="w-4 h-4 text-cyan-400" /> },
    { id: 'live', label: 'Live Station Status', icon: <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> },
    { id: 'snacks', label: 'Café & Refreshments', icon: <Coffee className="w-4 h-4 text-pink-400" /> },
  ];

  const tabs = isAdmin ? adminTabs : publicTabs;


  return (
    <nav className="flex flex-wrap gap-2 my-4">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`font-['Exo_2'] cursor-pointer border rounded-xl px-4 py-2.5 font-bold tracking-wider uppercase text-[12.5px] inline-flex items-center gap-2 transition-all duration-150 backdrop-blur-md relative overflow-hidden ${
              isActive
                ? 'bg-gradient-to-r from-purple-900/70 via-black/75 to-cyan-950/70 border-cyan-400/80 text-white shadow-[0_0_25px_-5px_rgba(6,182,212,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-cyan-400/40'
                : 'bg-black/40 border-purple-500/25 text-[#d6cdfa] hover:border-cyan-500/40 hover:text-white hover:bg-purple-950/30 hover:-translate-y-0.5'
            }`}
          >
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-cyan-400 to-pink-500 shadow-[0_0_8px_#00f2fe]" />
            )}
            {tab.icon}
            <span className="tracking-wider">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold ml-1">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
