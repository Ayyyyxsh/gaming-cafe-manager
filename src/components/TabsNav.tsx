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
  CreditCard,
  Radio
} from 'lucide-react';

export type TabType =
  | 'live'
  | 'new'
  | 'sessions'
  | 'bookings'
  | 'customers'
  | 'snacks'
  | 'offers'
  | 'stations'
  | 'today'
  | 'history'
  | 'razorpay';

interface TabsNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  activeSessionsCount: number;
}

export const TabsNav: React.FC<TabsNavProps> = ({
  activeTab,
  onChangeTab,
  activeSessionsCount
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'live', label: 'Live Station Monitor', icon: <Radio className="w-4 h-4 text-emerald-400 animate-pulse" /> },
    { id: 'new', label: 'New Session', icon: <Zap className="w-4 h-4 text-purple-400" /> },
    { id: 'sessions', label: 'Sessions', icon: <Gamepad2 className="w-4 h-4 text-purple-400" />, badge: activeSessionsCount },
    { id: 'bookings', label: 'Bookings', icon: <Calendar className="w-4 h-4 text-purple-400" /> },
    { id: 'razorpay', label: 'Razorpay', icon: <CreditCard className="w-4 h-4 text-blue-400" /> },
    { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4 text-purple-400" /> },
    { id: 'snacks', label: 'Snacks', icon: <Coffee className="w-4 h-4 text-purple-400" /> },
    { id: 'offers', label: 'Offers', icon: <Gift className="w-4 h-4 text-purple-400" /> },
    { id: 'stations', label: 'Stations', icon: <Monitor className="w-4 h-4 text-purple-400" /> },
    { id: 'today', label: 'Today', icon: <BarChart3 className="w-4 h-4 text-purple-400" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4 text-purple-400" /> },
  ];


  return (
    <nav className="flex flex-wrap gap-2 my-4">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className={`font-['Exo_2'] cursor-pointer border rounded-xl px-4 py-2.5 font-bold tracking-wider uppercase text-[12.5px] inline-flex items-center gap-2 transition-all duration-150 backdrop-blur-md ${
              isActive
                ? 'bg-gradient-to-br from-[rgba(124,58,237,0.4)] to-[rgba(233,30,140,0.35)] border-[rgba(233,30,140,0.65)] text-white shadow-[0_0_0_1px_rgba(233,30,140,0.35),0_8px_30px_-8px_rgba(233,30,140,0.55)]'
                : 'bg-[rgba(36,24,65,0.45)] border-[rgba(168,85,247,0.22)] text-[#ece6ff] hover:border-[rgba(168,85,247,0.5)] hover:-translate-y-0.5'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
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
