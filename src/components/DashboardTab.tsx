import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Coffee,
  Gamepad2,
  DollarSign,
  Calendar,
  Layers,
  Award,
  Sparkles,
  PieChart as PieIcon,
  ShoppingBag,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Session, Station, SnackItem } from '../types';
import { cashOf, upiOf } from '../utils/helpers';

interface DashboardTabProps {
  history: Record<string, Session[]>;
  todaySessions: Session[];
  stations: Station[];
  snacks: SnackItem[];
}

type TimeRange = '7d' | '14d' | '30d' | 'all';
type RevenueChartMode = 'area' | 'bar' | 'payment';
type SnackSortMode = 'units' | 'revenue';

const PIE_COLORS = [
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#f97316', // Orange
];

export const DashboardTab: React.FC<DashboardTabProps> = ({
  history,
  todaySessions,
  stations,
  snacks
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [includeToday, setIncludeToday] = useState<boolean>(true);
  const [revenueChartMode, setRevenueChartMode] = useState<RevenueChartMode>('area');
  const [snackSortMode, setSnackSortMode] = useState<SnackSortMode>('units');

  // 1. Consolidate sessions across all history dates + optionally today
  const aggregatedData = useMemo(() => {
    const datesMap: Record<string, Session[]> = { ...history };

    if (includeToday && todaySessions && todaySessions.length > 0) {
      const todayKey = new Date().toISOString().split('T')[0];
      const existing = datesMap[todayKey] || [];
      // Deduplicate by session ID
      const mergedMap = new Map<string, Session>();
      existing.forEach(s => mergedMap.set(s.id, s));
      todaySessions.forEach(s => mergedMap.set(s.id, s));
      datesMap[todayKey] = Array.from(mergedMap.values());
    }

    const allDates = Object.keys(datesMap).sort();

    // Filter by TimeRange
    let filteredDates = allDates;
    if (timeRange !== 'all') {
      const daysCount = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysCount);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      filteredDates = allDates.filter(d => d >= cutoffStr);
      // If none match cutoff (e.g. older sample data), fall back to taking the last N dates
      if (filteredDates.length === 0 && allDates.length > 0) {
        filteredDates = allDates.slice(-daysCount);
      }
    }

    // Daily Revenue Array for Recharts
    const dailyTrends = filteredDates.map(dateStr => {
      const daySessions = datesMap[dateStr] || [];
      const totalRev = daySessions.reduce((sum, s) => sum + (s.total || 0), 0);
      const gamingRev = daySessions.reduce((sum, s) => sum + (s.gaming || 0), 0);
      const snacksRev = daySessions.reduce((sum, s) => sum + (s.snacks || 0), 0);
      const cashRev = daySessions.reduce((sum, s) => sum + cashOf(s), 0);
      const upiRev = daySessions.reduce((sum, s) => sum + upiOf(s), 0);
      const pendingRev = daySessions.reduce((sum, s) => (s.pm === 'Pending' ? sum + (s.total || 0) : sum), 0);
      const discount = daySessions.reduce((sum, s) => sum + (s.discount || 0), 0);
      const totalMinutes = daySessions.reduce((sum, s) => {
        const slotsMin = (s.slots || []).reduce((acc, slot) => acc + (slot.mins || 0), 0);
        return sum + slotsMin;
      }, 0);

      // Format date for label: "02 Aug"
      const parts = dateStr.split('-');
      let dateLabel = dateStr;
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (!isNaN(d.getTime())) {
          dateLabel = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        }
      }

      return {
        date: dateStr,
        dateLabel,
        total: totalRev,
        gaming: gamingRev,
        snacks: snacksRev,
        cash: cashRev,
        upi: upiRev,
        pending: pendingRev,
        discount,
        sessionsCount: daySessions.length,
        hours: Math.round((totalMinutes / 60) * 10) / 10
      };
    });

    // Snack Popularity Aggregation
    const snackStatsMap: Record<
      string,
      { id: string; name: string; emoji: string; unitsSold: number; revenue: number; unitPrice: number }
    > = {};

    filteredDates.forEach(dateStr => {
      const daySessions = datesMap[dateStr] || [];
      daySessions.forEach(session => {
        (session.cart || []).forEach(item => {
          const rawName = item.name || (item as any).snack?.name || 'Snack';
          const rawEmoji = item.emoji || (item as any).snack?.emoji || '🍿';
          const qty = Number(item.qty) || 0;
          const price = Number(item.price) || 0;
          const key = rawName.trim().toLowerCase();

          if (!snackStatsMap[key]) {
            snackStatsMap[key] = {
              id: item.id || key,
              name: rawName,
              emoji: rawEmoji,
              unitsSold: 0,
              revenue: 0,
              unitPrice: price
            };
          }

          snackStatsMap[key].unitsSold += qty;
          snackStatsMap[key].revenue += qty * price;
        });
      });
    });

    const snacksPopularityList = Object.values(snackStatsMap).map(s => ({
      ...s,
      displayName: `${s.emoji} ${s.name}`
    }));

    // Station Revenue Breakdown
    const stationRevenueMap: Record<string, { kind: string; revenue: number; count: number }> = {};
    filteredDates.forEach(dateStr => {
      const daySessions = datesMap[dateStr] || [];
      daySessions.forEach(session => {
        const sIds = session.stationIds || (session.stationId ? [session.stationId] : []);
        const portion = (session.gaming || 0) / Math.max(1, sIds.length);
        sIds.forEach(sid => {
          const st = stations.find(s => s.id === sid);
          const kind = st?.kind || 'Other';
          if (!stationRevenueMap[kind]) {
            stationRevenueMap[kind] = { kind, revenue: 0, count: 0 };
          }
          stationRevenueMap[kind].revenue += portion;
          stationRevenueMap[kind].count += 1;
        });
      });
    });

    const stationDistribution = Object.values(stationRevenueMap).map(st => ({
      name: st.kind,
      revenue: Math.round(st.revenue),
      count: st.count
    }));

    // Overall KPI Totals
    const totalRevenue = dailyTrends.reduce((sum, d) => sum + d.total, 0);
    const totalGaming = dailyTrends.reduce((sum, d) => sum + d.gaming, 0);
    const totalSnacks = dailyTrends.reduce((sum, d) => sum + d.snacks, 0);
    const totalCash = dailyTrends.reduce((sum, d) => sum + d.cash, 0);
    const totalUpi = dailyTrends.reduce((sum, d) => sum + d.upi, 0);
    const totalSessions = dailyTrends.reduce((sum, d) => sum + d.sessionsCount, 0);
    const totalHours = dailyTrends.reduce((sum, d) => sum + d.hours, 0);
    const activeDaysCount = dailyTrends.filter(d => d.sessionsCount > 0).length || 1;
    const avgDailyRevenue = Math.round(totalRevenue / activeDaysCount);

    // Peak Revenue Day
    let peakDay: { date: string; dateLabel: string; total: number } | null = null;
    dailyTrends.forEach(d => {
      if (!peakDay || d.total > peakDay.total) {
        peakDay = { date: d.date, dateLabel: d.dateLabel, total: d.total };
      }
    });

    // Total snack units sold
    const totalSnackUnits = snacksPopularityList.reduce((sum, s) => sum + s.unitsSold, 0);

    return {
      dailyTrends,
      snacksPopularityList,
      stationDistribution,
      totalRevenue,
      totalGaming,
      totalSnacks,
      totalCash,
      totalUpi,
      totalSessions,
      totalHours: Math.round(totalHours * 10) / 10,
      avgDailyRevenue,
      peakDay,
      totalSnackUnits,
      datesCount: dailyTrends.length
    };
  }, [history, todaySessions, includeToday, timeRange, stations]);

  // Sorted snacks list for visualization
  const sortedSnacks = useMemo(() => {
    return [...aggregatedData.snacksPopularityList].sort((a, b) => {
      if (snackSortMode === 'units') {
        return b.unitsSold - a.unitsSold;
      }
      return b.revenue - a.revenue;
    });
  }, [aggregatedData.snacksPopularityList, snackSortMode]);

  // Custom Chart Tooltip for Daily Trends
  const CustomDailyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#130d24]/95 border border-purple-500/40 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs min-w-[200px]">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5 mb-2">
            <span className="font-['Exo_2'] font-bold text-white text-sm">
              {data.dateLabel}
            </span>
            <span className="text-[#9c8fc6] font-mono text-[11px]">{data.date}</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#9c8fc6] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                Total Revenue:
              </span>
              <span className="font-bold text-cyan-300 font-mono text-sm">₹{data.total}</span>
            </div>
            <div className="flex items-center justify-between pl-4 text-[#cfc5ef]">
              <span>🎮 Gaming Time:</span>
              <span className="font-mono text-purple-300">₹{data.gaming}</span>
            </div>
            <div className="flex items-center justify-between pl-4 text-[#cfc5ef]">
              <span>🍿 Snacks & Drinks:</span>
              <span className="font-mono text-emerald-300">₹{data.snacks}</span>
            </div>
            <div className="border-t border-purple-500/10 pt-1.5 mt-1.5 flex items-center justify-between text-[#9c8fc6]">
              <span>💳 Cash / UPI:</span>
              <span className="font-mono text-[11px]">
                ₹{data.cash} / ₹{data.upi}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#9c8fc6]">
              <span>🕹️ Sessions & Time:</span>
              <span className="font-mono text-[11px]">
                {data.sessionsCount} sessions ({data.hours} hrs)
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Chart Tooltip for Snacks
  const CustomSnackTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#130d24]/95 border border-emerald-500/40 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs min-w-[180px]">
          <div className="flex items-center gap-2 font-['Exo_2'] font-bold text-white text-sm border-b border-emerald-500/20 pb-1.5 mb-2">
            <span className="text-lg">{data.emoji}</span>
            <span>{data.name}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#9c8fc6]">Units Sold:</span>
              <span className="font-bold text-emerald-300 font-mono text-sm">
                {data.unitsSold} units
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#9c8fc6]">Total Revenue:</span>
              <span className="font-bold text-cyan-300 font-mono text-sm">
                ₹{data.revenue}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#9c8fc6]">
              <span>Price per item:</span>
              <span className="font-mono">₹{data.unitPrice}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* 1. Header with Controls */}
      <div className="p-4 sm:p-5 rounded-2xl border border-[rgba(168,85,247,0.25)] bg-gradient-to-r from-[rgba(36,24,65,0.65)] via-[rgba(26,17,49,0.7)] to-[rgba(19,13,36,0.85)] backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-['Exo_2'] font-black text-xl sm:text-2xl text-white tracking-wider flex items-center gap-2">
                Business Analytics & Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-[#9c8fc6]">
                Visualizing daily revenue trends, refreshment sales, and station performance from history data.
              </p>
            </div>
          </div>
        </div>

        {/* Time Range Filter and Source Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex rounded-xl bg-[rgba(8,3,15,0.7)] border border-purple-500/20 p-1">
            {(['7d', '14d', '30d', 'all'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-['Exo_2'] font-bold tracking-wider cursor-pointer transition-all ${
                  timeRange === range
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-[#9c8fc6] hover:text-white hover:bg-purple-500/10'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : range === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-500/20 bg-[rgba(8,3,15,0.5)] cursor-pointer text-xs font-bold text-[#ece6ff] hover:border-purple-400 transition-colors">
            <input
              type="checkbox"
              checked={includeToday}
              onChange={e => setIncludeToday(e.target.checked)}
              className="accent-purple-500 rounded cursor-pointer"
            />
            <span>Include Today</span>
          </label>
        </div>
      </div>

      {/* 2. Top Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl border border-[rgba(6,182,212,0.3)] bg-gradient-to-b from-[rgba(6,182,212,0.12)] to-[rgba(19,13,36,0.6)] backdrop-blur-md">
          <div className="flex items-center justify-between text-cyan-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider font-['Exo_2']">Total Revenue</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="font-['Exo_2'] font-black text-2xl sm:text-3xl text-white">
            ₹{aggregatedData.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#9c8fc6] mt-1 flex items-center gap-2">
            <span className="text-purple-300">₹{aggregatedData.totalGaming} Play</span>
            <span>•</span>
            <span className="text-emerald-300">₹{aggregatedData.totalSnacks} Food</span>
          </div>
        </div>

        {/* Daily Average */}
        <div className="p-4 rounded-2xl border border-[rgba(168,85,247,0.3)] bg-gradient-to-b from-[rgba(168,85,247,0.12)] to-[rgba(19,13,36,0.6)] backdrop-blur-md">
          <div className="flex items-center justify-between text-purple-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider font-['Exo_2']">Daily Average</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="font-['Exo_2'] font-black text-2xl sm:text-3xl text-white">
            ₹{aggregatedData.avgDailyRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-[#9c8fc6] mt-1">
            Across {aggregatedData.datesCount} recorded date{aggregatedData.datesCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Peak Day */}
        <div className="p-4 rounded-2xl border border-[rgba(245,158,11,0.3)] bg-gradient-to-b from-[rgba(245,158,11,0.12)] to-[rgba(19,13,36,0.6)] backdrop-blur-md">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider font-['Exo_2']">Peak Day</span>
            <Award className="w-4 h-4" />
          </div>
          <div className="font-['Exo_2'] font-black text-2xl sm:text-3xl text-white">
            ₹{(aggregatedData.peakDay?.total || 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-300/80 mt-1 truncate">
            {aggregatedData.peakDay ? aggregatedData.peakDay.dateLabel : 'No history yet'}
          </div>
        </div>

        {/* Snacks Sold */}
        <div className="p-4 rounded-2xl border border-[rgba(16,185,129,0.3)] bg-gradient-to-b from-[rgba(16,185,129,0.12)] to-[rgba(19,13,36,0.6)] backdrop-blur-md">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider font-['Exo_2']">Snacks Sold</span>
            <Coffee className="w-4 h-4" />
          </div>
          <div className="font-['Exo_2'] font-black text-2xl sm:text-3xl text-white">
            {aggregatedData.totalSnackUnits} <span className="text-sm font-normal text-emerald-300">items</span>
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1">
            ₹{aggregatedData.totalSnacks.toLocaleString('en-IN')} refreshment sales
          </div>
        </div>

        {/* Total Gaming Sessions & Hours */}
        <div className="p-4 rounded-2xl border border-[rgba(236,72,153,0.3)] bg-gradient-to-b from-[rgba(236,72,153,0.12)] to-[rgba(19,13,36,0.6)] backdrop-blur-md">
          <div className="flex items-center justify-between text-pink-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider font-['Exo_2']">Gaming Play</span>
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div className="font-['Exo_2'] font-black text-2xl sm:text-3xl text-white">
            {aggregatedData.totalSessions} <span className="text-sm font-normal text-pink-300">sessions</span>
          </div>
          <div className="text-[11px] text-[#9c8fc6] mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-pink-400" />
            <span>{aggregatedData.totalHours} hours logged</span>
          </div>
        </div>
      </div>

      {/* 3. Main Chart: Daily Revenue Trends */}
      <div className="p-5 rounded-2xl border border-[rgba(168,85,247,0.25)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-['Exo_2'] font-extrabold text-lg text-white tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Daily Revenue Trends
            </h3>
            <p className="text-xs text-[#9c8fc6]">
              Timeline progression of total earnings, separated by gaming time and refreshments
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex rounded-xl bg-[rgba(8,3,15,0.7)] border border-purple-500/20 p-1 self-start sm:self-auto">
            <button
              onClick={() => setRevenueChartMode('area')}
              className={`px-3 py-1.5 rounded-lg text-xs font-['Exo_2'] font-bold cursor-pointer transition-all ${
                revenueChartMode === 'area'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'text-[#9c8fc6] hover:text-white'
              }`}
            >
              Area Stack
            </button>
            <button
              onClick={() => setRevenueChartMode('bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-['Exo_2'] font-bold cursor-pointer transition-all ${
                revenueChartMode === 'bar'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'text-[#9c8fc6] hover:text-white'
              }`}
            >
              Gaming vs Snacks Bar
            </button>
            <button
              onClick={() => setRevenueChartMode('payment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-['Exo_2'] font-bold cursor-pointer transition-all ${
                revenueChartMode === 'payment'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                  : 'text-[#9c8fc6] hover:text-white'
              }`}
            >
              Cash vs UPI
            </button>
          </div>
        </div>

        {aggregatedData.dailyTrends.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-purple-500/20 rounded-xl">
            <Calendar className="w-10 h-10 text-purple-400 mb-2 opacity-50" />
            <p className="font-bold text-white">No historical session dates recorded yet</p>
            <p className="text-xs text-[#9c8fc6] mt-1 max-w-sm">
              Complete sessions and archive days in the Today tab to visualize longitudinal revenue curves here.
            </p>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {revenueChartMode === 'area' ? (
                <AreaChart data={aggregatedData.dailyTrends} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorGaming" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSnacks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(168,85,247,0.15)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dateLabel" stroke="#9c8fc6" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9c8fc6" fontSize={11} tickLine={false} tickFormatter={val => `₹${val}`} />
                  <Tooltip content={<CustomDailyTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '14px', fontSize: '12px' }}
                    formatter={value => (
                      <span className="text-[#ece6ff] font-['Exo_2'] capitalize">
                        {value === 'total' ? 'Total (₹)' : value === 'gaming' ? 'Gaming (₹)' : 'Snacks (₹)'}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="gaming"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorGaming)"
                  />
                  <Area
                    type="monotone"
                    dataKey="snacks"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSnacks)"
                  />
                </AreaChart>
              ) : revenueChartMode === 'bar' ? (
                <BarChart data={aggregatedData.dailyTrends} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(168,85,247,0.15)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dateLabel" stroke="#9c8fc6" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9c8fc6" fontSize={11} tickLine={false} tickFormatter={val => `₹${val}`} />
                  <Tooltip content={<CustomDailyTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '14px', fontSize: '12px' }}
                    formatter={value => (
                      <span className="text-[#ece6ff] font-['Exo_2'] capitalize">
                        {value === 'gaming' ? 'Gaming (₹)' : 'Snacks (₹)'}
                      </span>
                    )}
                  />
                  <Bar dataKey="gaming" fill="#a855f7" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  <Bar dataKey="snacks" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              ) : (
                <BarChart data={aggregatedData.dailyTrends} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(168,85,247,0.15)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="dateLabel" stroke="#9c8fc6" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9c8fc6" fontSize={11} tickLine={false} tickFormatter={val => `₹${val}`} />
                  <Tooltip content={<CustomDailyTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '14px', fontSize: '12px' }}
                    formatter={value => (
                      <span className="text-[#ece6ff] font-['Exo_2'] capitalize">
                        {value === 'cash' ? 'Cash Received (₹)' : 'UPI Received (₹)'}
                      </span>
                    )}
                  />
                  <Bar dataKey="cash" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={45} />
                  <Bar dataKey="upi" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 4. Two-Column Grid: Snack Popularity Bar Chart & Snack Share Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-5">
        {/* Snack Popularity Ranked Bar Chart */}
        <div className="p-5 rounded-2xl border border-[rgba(16,185,129,0.25)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-['Exo_2'] font-extrabold text-lg text-white tracking-wider flex items-center gap-2">
                <Coffee className="w-4 h-4 text-emerald-400" />
                Snack & Drink Popularity
              </h3>
              <p className="text-xs text-[#9c8fc6]">
                Ranked order of cafe refreshment items ordered during gaming sessions
              </p>
            </div>

            {/* Sort Toggle */}
            <div className="inline-flex rounded-xl bg-[rgba(8,3,15,0.7)] border border-emerald-500/20 p-1 self-start sm:self-auto">
              <button
                onClick={() => setSnackSortMode('units')}
                className={`px-2.5 py-1 rounded-lg text-xs font-['Exo_2'] font-bold cursor-pointer transition-all ${
                  snackSortMode === 'units'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-[#9c8fc6] hover:text-white'
                }`}
              >
                By Units Sold
              </button>
              <button
                onClick={() => setSnackSortMode('revenue')}
                className={`px-2.5 py-1 rounded-lg text-xs font-['Exo_2'] font-bold cursor-pointer transition-all ${
                  snackSortMode === 'revenue'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-[#9c8fc6] hover:text-white'
                }`}
              >
                By Revenue (₹)
              </button>
            </div>
          </div>

          {sortedSnacks.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-emerald-500/20 rounded-xl">
              <ShoppingBag className="w-10 h-10 text-emerald-400 mb-2 opacity-50" />
              <p className="font-bold text-white">No snack purchases recorded yet</p>
              <p className="text-xs text-[#9c8fc6] mt-1 max-w-xs">
                Add snacks to customer gaming session carts in New Session or Edit modal to view analytics.
              </p>
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedSnacks}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid stroke="rgba(16,185,129,0.15)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    stroke="#9c8fc6"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={val => (snackSortMode === 'revenue' ? `₹${val}` : `${val}`)}
                  />
                  <YAxis
                    type="category"
                    dataKey="displayName"
                    stroke="#ece6ff"
                    fontSize={11}
                    tickLine={false}
                    width={130}
                  />
                  <Tooltip content={<CustomSnackTooltip />} />
                  <Bar
                    dataKey={snackSortMode === 'units' ? 'unitsSold' : 'revenue'}
                    radius={[0, 6, 6, 0]}
                    maxBarSize={28}
                  >
                    {sortedSnacks.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Snack Revenue Share Donut / Pie Chart */}
        <div className="p-5 rounded-2xl border border-[rgba(168,85,247,0.25)] bg-gradient-to-b from-[rgba(36,24,65,0.55)] to-[rgba(19,13,36,0.7)] backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="font-['Exo_2'] font-extrabold text-lg text-white tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-400" />
              Refreshments Share
            </h3>
            <p className="text-xs text-[#9c8fc6] mb-3">
              Distribution of cafe revenue across top snack & beverage categories
            </p>
          </div>

          {sortedSnacks.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-purple-500/20 rounded-xl">
              <PieIcon className="w-10 h-10 text-purple-400 mb-2 opacity-50" />
              <p className="font-bold text-white">No snack share data</p>
            </div>
          ) : (
            <div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sortedSnacks}
                      dataKey="revenue"
                      nameKey="displayName"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {sortedSnacks.map((_, index) => (
                        <Cell
                          key={`pie-cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                          stroke="#130d24"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          const pct =
                            aggregatedData.totalSnacks > 0
                              ? Math.round((item.revenue / aggregatedData.totalSnacks) * 100)
                              : 0;
                          return (
                            <div className="bg-[#130d24]/95 border border-purple-500/40 rounded-xl p-2.5 shadow-xl text-xs">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{item.emoji}</span>
                                <span>{item.name}</span>
                              </div>
                              <div className="text-cyan-300 font-mono font-bold mt-1">
                                ₹{item.revenue} ({pct}% share)
                              </div>
                              <div className="text-[#9c8fc6] text-[11px]">
                                {item.unitsSold} units sold
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-28 overflow-y-auto pr-1">
                {sortedSnacks.slice(0, 6).map((snk, idx) => {
                  const pct =
                    aggregatedData.totalSnacks > 0
                      ? Math.round((snk.revenue / aggregatedData.totalSnacks) * 100)
                      : 0;
                  return (
                    <div
                      key={snk.id || idx}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-[rgba(8,3,15,0.4)] border border-purple-500/10 text-xs"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                        />
                        <span className="truncate text-white">{snk.emoji} {snk.name}</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold ml-1">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Additional Insight: Station Revenue Distribution */}
      {aggregatedData.stationDistribution.length > 0 && (
        <div className="p-5 rounded-2xl border border-[rgba(168,85,247,0.25)] bg-gradient-to-b from-[rgba(36,24,65,0.45)] to-[rgba(19,13,36,0.65)] backdrop-blur-md">
          <h3 className="font-['Exo_2'] font-extrabold text-base text-white tracking-wider flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-cyan-400" />
            Station Category Gaming Performance
          </h3>
          <p className="text-xs text-[#9c8fc6] mb-4">
            Gaming revenue distribution across PC stations, PS5 zones, and Racing simulators
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {aggregatedData.stationDistribution.map(st => {
              const pct =
                aggregatedData.totalGaming > 0
                  ? Math.round((st.revenue / aggregatedData.totalGaming) * 100)
                  : 0;
              return (
                <div
                  key={st.name}
                  className="p-3.5 rounded-xl border border-purple-500/20 bg-[rgba(8,3,15,0.5)] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs text-[#9c8fc6] mb-1">
                    <span className="font-bold uppercase tracking-wider">{st.name}</span>
                    <span className="text-cyan-400 font-mono font-bold">{pct}%</span>
                  </div>
                  <div className="font-['Exo_2'] font-black text-xl text-white">
                    ₹{st.revenue.toLocaleString('en-IN')}
                  </div>
                  <div className="w-full bg-purple-950/60 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
