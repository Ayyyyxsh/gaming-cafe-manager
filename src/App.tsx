import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { TabsNav, TabType } from './components/TabsNav';
import { NewSessionTab } from './components/NewSessionTab';
import { SessionsTab } from './components/SessionsTab';
import { BookingsTab } from './components/BookingsTab';
import { CustomersTab } from './components/CustomersTab';
import { SnacksTab } from './components/SnacksTab';
import { StationsTab } from './components/StationsTab';
import { TodayTab } from './components/TodayTab';
import { HistoryTab } from './components/HistoryTab';
import { DashboardTab } from './components/DashboardTab';
import { LiveStationBoard } from './components/LiveStationBoard';
import { EditModal } from './components/EditModal';
import { AdminPanel } from './components/AdminPanel';
import { AdminAuthModal } from './components/AdminAuthModal';
import { Footer } from './components/Footer';

import { AppData, Session, Booking, SnackItem, Offer, Station, Customer } from './types';
import { nowHHMM, addMin, todayISO, slotPriceForStation } from './utils/helpers';
import {
  fetchAppData,
  createSessionAPI,
  updateSessionAPI,
  endSessionAPI,
  deleteSessionAPI,
  createBookingAPI,
  updateBookingAPI,
  deleteBookingAPI,
  createSnackAPI,
  deleteSnackAPI,
  createOfferAPI,
  updateOfferAPI,
  deleteOfferAPI,
  createStationAPI,
  updateStationAPI,
  deleteStationAPI,
  deleteCustomerAPI,
  wipeAllCustomersAPI,
  archiveDayAPI,
  deleteHistoryDayAPI,
  deleteHistoryRowAPI,
  addNotificationAPI,
  markAllNotificationsReadAPI,
  clearAllNotificationsAPI,
  fetchAdminStatusAPI
} from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('view=live')) {
      return 'live';
    }
    return 'live';
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('omg_admin_auth') === 'true';
  });
  const [adminProfile, setAdminProfile] = useState<{ name: string; username: string } | null>(() => {
    try {
      const stored = localStorage.getItem('omg_admin_profile');
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });
  const [singleSlotAvailable, setSingleSlotAvailable] = useState<boolean>(true);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);

  const [appData, setAppData] = useState<AppData>(() => {
    try {
      const cached = localStorage.getItem('omg_gaming_cafe_db_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // ignore
    }
    return {
      stations: [],
      snacks: [],
      offers: [],
      customers: [],
      sessions: [],
      bookings: [],
      history: {},
      notifications: []
    };
  });

  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [toasts, setToasts] = useState<{ id: string; msg: string; kind: 'ok' | 'warn' | 'info' }[]>([]);

  // Ref tracking pending optimistic sessions to prevent race condition overwrite from polling
  const pendingSessionsRef = useRef<Map<string, Session>>(new Map());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editingHistoryContext, setEditingHistoryContext] = useState<{ date: string } | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [preSelectedStationId, setPreSelectedStationId] = useState<string | null>(null);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    msg: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    msg: '',
    confirmText: 'Confirm',
    onConfirm: () => {}
  });

  const showToast = useCallback((msg: string, kind: 'ok' | 'warn' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, msg, kind }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  }, []);

  const loadAdminStatus = useCallback(async () => {
    try {
      const status = await fetchAdminStatusAPI();
      setSingleSlotAvailable(status.singleSlotAvailable);
      if (status.hasAdminAccount && !adminProfile && status.adminName) {
        setAdminProfile({
          name: status.adminName,
          username: status.adminUsername || 'admin'
        });
      }
    } catch (e) {
      console.warn('Failed to fetch admin status:', e);
    }
  }, [adminProfile]);

  const handleAdminLoginSuccess = (admin: { name: string; username: string }) => {
    setIsAdmin(true);
    setAdminProfile(admin);
    localStorage.setItem('omg_admin_auth', 'true');
    localStorage.setItem('omg_admin_profile', JSON.stringify(admin));
    setActiveTab('admin');
    loadAdminStatus();
    showToast(`Welcome Master Admin ${admin.name}!`, 'ok');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setAdminProfile(null);
    localStorage.removeItem('omg_admin_auth');
    localStorage.removeItem('omg_admin_profile');
    setActiveTab('live');
    showToast('Logged out of Admin Portal', 'info');
  };

  // Fetch initial data
  const loadData = useCallback(async () => {
    const data = await fetchAppData();
    if (data) {
      // Merge any pending optimistic sessions that haven't arrived in data.sessions yet
      let mergedSessions = data.sessions || [];
      if (pendingSessionsRef.current.size > 0) {
        pendingSessionsRef.current.forEach((pendingSession, id) => {
          if (!mergedSessions.some((s: Session) => s.id === id)) {
            mergedSessions = [pendingSession, ...mergedSessions];
          }
        });
      }
      const finalData: AppData = { ...data, sessions: mergedSessions };
      setAppData(finalData);
      setIsBackendConnected(true);
      try {
        localStorage.setItem('omg_gaming_cafe_db_cache', JSON.stringify(finalData));
      } catch {
        // ignore
      }
    } else {
      setIsBackendConnected(false);
      try {
        const cached = localStorage.getItem('omg_gaming_cafe_db_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            setAppData(parsed);
          }
        }
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    loadData();
    loadAdminStatus();
    const interval = setInterval(loadData, 3000); // 3s real-time live sync across devices
    const handleFocus = () => {
      loadData();
      loadAdminStatus();
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [loadData]);

  // Actions
  const handleStartSession = async (sessionData: Partial<Session>) => {
    // 1. Generate unique session ID and creation timestamp immediately
    const sessionId = sessionData.id || ('sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));
    const nowTime = nowHHMM();
    const optimisticSession: Session = {
      id: sessionId,
      name: sessionData.name || 'Gamer',
      phone: sessionData.phone || '',
      stationIds: sessionData.stationIds || (sessionData.stationId ? [sessionData.stationId] : []),
      stationId: sessionData.stationId || (sessionData.stationIds && sessionData.stationIds[0]) || '',
      mode: sessionData.mode || null,
      players: sessionData.players || null,
      startTime: sessionData.startTime || nowTime,
      endTime: sessionData.endTime || addMin(sessionData.startTime || nowTime, 60),
      slots: sessionData.slots || [{ mins: 60 }],
      cart: sessionData.cart || [],
      gaming: sessionData.gaming || 0,
      snacks: sessionData.snacks || 0,
      discount: sessionData.discount || 0,
      total: sessionData.total || 0,
      offer: sessionData.offer || null,
      pm: sessionData.pm || 'Cash',
      cashAmt: sessionData.cashAmt || 0,
      upiAmt: sessionData.upiAmt || 0,
      note: sessionData.note || '',
      status: 'active',
      date: sessionData.date || todayISO(),
      createdAt: Date.now()
    };

    // 2. Protect optimistic session from background polling race conditions
    pendingSessionsRef.current.set(sessionId, optimisticSession);

    // 3. Immediately update UI state with 0ms latency
    setAppData(prev => {
      const existingWithout = (prev.sessions || []).filter(s => s.id !== sessionId);
      const nextSessions = [optimisticSession, ...existingWithout];
      const nextData: AppData = {
        ...prev,
        sessions: nextSessions
      };
      try {
        localStorage.setItem('omg_gaming_cafe_db_cache', JSON.stringify(nextData));
      } catch {
        // ignore
      }
      return nextData;
    });

    // 4. Instantly switch to the Sessions tab so the user sees the new session immediately
    setActiveTab('sessions');
    showToast('Session started!', 'ok');

    // 5. Background sync with server
    try {
      const updatedData = await createSessionAPI(optimisticSession);
      pendingSessionsRef.current.delete(sessionId);
      if (updatedData) {
        setAppData(updatedData);
        try {
          localStorage.setItem('omg_gaming_cafe_db_cache', JSON.stringify(updatedData));
        } catch {
          // ignore
        }
        addNotificationAPI({
          title: 'Session Started',
          msg: `${optimisticSession.name} started gaming`,
          kind: 'ok',
          type: 'session-start'
        });
      }
    } catch (err) {
      pendingSessionsRef.current.delete(sessionId);
      console.warn('Backend sync warning on session create:', err);
    }
  };

  const handleEndSession = async (id: string) => {
    // 1. Instant optimistic update so ending a session feels instant
    const now = new Date();
    const endedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setAppData(prev => {
      const nextSessions = (prev.sessions || []).map(s =>
        s.id === id ? { ...s, status: 'ended' as const, endedAt: endedTime } : s
      );
      const nextData = { ...prev, sessions: nextSessions };
      try {
        localStorage.setItem('omg_gaming_cafe_db_cache', JSON.stringify(nextData));
      } catch {
        // ignore
      }
      return nextData;
    });
    showToast('Session ended', 'ok');

    const updatedData = await endSessionAPI(id);
    if (updatedData) {
      setAppData(updatedData);
    }
  };

  const handleDeleteSession = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Session Record',
      msg: 'Are you sure you want to delete this session record?',
      confirmText: 'Delete Record',
      onConfirm: async () => {
        // Optimistic delete immediately
        setAppData(prev => {
          const nextSessions = (prev.sessions || []).filter(s => s.id !== id);
          const nextData = { ...prev, sessions: nextSessions };
          try {
            localStorage.setItem('omg_gaming_cafe_db_cache', JSON.stringify(nextData));
          } catch {
            // ignore
          }
          return nextData;
        });
        showToast('Session record deleted', 'ok');
        const updatedData = await deleteSessionAPI(id);
        if (updatedData) {
          setAppData(updatedData);
        }
      }
    });
  };

  const handleEditSessionOpen = (s: Session, historyDate?: string) => {
    setEditingSession(s);
    setEditingHistoryContext(historyDate ? { date: historyDate } : null);
    setViewingCustomer(null);
    setIsModalOpen(true);
  };

  const handleSaveSessionUpdates = async (
    id: string,
    updates: Partial<Session>,
    isHistory?: boolean,
    date?: string
  ) => {
    if (isHistory && date) {
      // History row update via API
      const updatedData = await updateSessionAPI(id, updates);
      if (updatedData) setAppData(updatedData);
    } else {
      const updatedData = await updateSessionAPI(id, updates);
      if (updatedData) setAppData(updatedData);
    }
    loadData();
  };

  // Bookings
  const handleSaveBooking = async (b: Partial<Booking>) => {
    const updatedData = await createBookingAPI(b);
    if (updatedData) {
      setAppData(updatedData);
      showToast('Booking saved', 'ok');
    }
  };

  const handleUpdateBooking = async (id: string, updates: Partial<Booking>) => {
    const updatedData = await updateBookingAPI(id, updates);
    if (updatedData) {
      setAppData(updatedData);
      showToast('Booking updated', 'ok');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    const updatedData = await deleteBookingAPI(id);
    if (updatedData) {
      setAppData(updatedData);
      showToast('Booking deleted', 'ok');
    }
  };

  const handleStartSessionFromBooking = async (b: Booking) => {
    // 1. Determine stations to activate
    const stIds = (b.stationIds && b.stationIds.length > 0)
      ? b.stationIds
      : (b.stationId ? [b.stationId] : [(appData.stations && appData.stations[0]?.id) || '1']);

    // 2. Locate station records
    const primaryStation = (appData.stations || []).find(s => stIds.includes(s.id)) || (appData.stations || [])[0];

    // 3. Timing calculation: gaming session starts right now with the booked duration
    const nowTime = nowHHMM();
    const duration = b.duration || 60;
    const endTime = addMin(nowTime, duration);

    // 4. Calculate gaming cost across all booked stations
    let gamingCost = 0;
    for (const sId of stIds) {
      const st = (appData.stations || []).find(s => s.id === sId) || primaryStation;
      gamingCost += slotPriceForStation(st, 'single', 1, duration);
    }
    if (gamingCost === 0 && primaryStation) {
      gamingCost = slotPriceForStation(primaryStation, 'single', 1, duration);
    }

    // 5. Account for any advance payment made at reservation
    const advancePaid = Number(b.advance) || 0;
    const remainingTotal = Math.max(0, gamingCost - advancePaid);

    // 6. Assemble complete active session record
    const newSessionData: Partial<Session> = {
      name: b.name || 'Gamer',
      phone: b.phone || '',
      stationIds: stIds,
      stationId: stIds[0] || '',
      mode: 'single',
      players: 1,
      startTime: nowTime,
      endTime: endTime,
      slots: [{ mins: duration }],
      cart: [],
      gaming: gamingCost,
      snacks: 0,
      discount: advancePaid,
      total: remainingTotal,
      pm: remainingTotal > 0 ? 'UPI' : 'Cash',
      upiAmt: remainingTotal > 0 ? remainingTotal : 0,
      cashAmt: 0,
      note: b.notes
        ? `${b.notes} • Converted from booking (Advance: ₹${advancePaid})`
        : `Converted from booking (Advance: ₹${advancePaid})`,
      status: 'active',
      date: todayISO(),
      createdAt: Date.now()
    };

    // 7. Start the active session (adds to optimistic state, switches tab to 'sessions', saves cache, and syncs via API)
    await handleStartSession(newSessionData);

    // 8. Update the booking status to 'converted' so it reflects in the Booking Directory
    await handleUpdateBooking(b.id, { status: 'converted' });

    showToast(`Converted booking for ${b.name} into active session!`, 'ok');
  };

  // Snacks
  const handleAddSnack = async (snack: Partial<SnackItem>) => {
    const updatedData = await createSnackAPI(snack);
    if (updatedData) setAppData(updatedData);
  };

  const handleDeleteSnack = async (id: string) => {
    const updatedData = await deleteSnackAPI(id);
    if (updatedData) setAppData(updatedData);
  };

  // Offers
  const handleAddOffer = async (offer: Partial<Offer>) => {
    const updatedData = await createOfferAPI(offer);
    if (updatedData) setAppData(updatedData);
  };

  const handleUpdateOffer = async (id: string, updates: Partial<Offer>) => {
    const updatedData = await updateOfferAPI(id, updates);
    if (updatedData) setAppData(updatedData);
  };

  const handleDeleteOffer = async (id: string) => {
    const updatedData = await deleteOfferAPI(id);
    if (updatedData) setAppData(updatedData);
  };

  // Stations
  const handleAddStation = async (station: Partial<Station>) => {
    const updatedData = await createStationAPI(station);
    if (updatedData) setAppData(updatedData);
  };

  const handleUpdateStation = async (id: string, updates: Partial<Station>) => {
    const updatedData = await updateStationAPI(id, updates);
    if (updatedData) setAppData(updatedData);
  };

  const handleDeleteStation = async (id: string) => {
    const updatedData = await deleteStationAPI(id);
    if (updatedData) setAppData(updatedData);
  };

  // Customers
  const handleDeleteCustomer = async (id: string) => {
    const updatedData = await deleteCustomerAPI(id);
    if (updatedData) setAppData(updatedData);
  };

  const handleWipeAllCustomers = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Wipe All Customer Records',
      msg: 'Are you sure you want to wipe ALL customer profiles and lifetime logs? This cannot be undone.',
      confirmText: 'Wipe All',
      onConfirm: async () => {
        const updatedData = await wipeAllCustomersAPI();
        if (updatedData) {
          setAppData(updatedData);
          showToast('All customer records wiped', 'ok');
        }
      }
    });
  };

  const handleOpenCustomerProfile = (cust: Customer) => {
    setViewingCustomer(cust);
    setEditingSession(null);
    setEditingHistoryContext(null);
    setIsModalOpen(true);
  };

  // Archive Day
  const handleArchiveDay = async () => {
    const totalSessions = appData.sessions.length;
    if (totalSessions === 0) {
      showToast('No sessions recorded today to archive', 'warn');
      return;
    }
    const activeCount = appData.sessions.filter(s => s.status === 'active').length;
    const endedCount = appData.sessions.filter(s => s.status === 'ended').length;

    let msg = `Archive ${totalSessions} session(s) from today to History?`;
    if (activeCount > 0) {
      msg = `There are ${activeCount} active and ${endedCount} completed session(s). Archiving will auto-end active sessions and move all ${totalSessions} session(s) to History. Proceed?`;
    }

    setConfirmModal({
      isOpen: true,
      title: 'End Day & Archive Operations',
      msg,
      confirmText: 'End Day & Archive',
      onConfirm: async () => {
        const updatedData = await archiveDayAPI();
        if (updatedData) {
          setAppData(updatedData);
          showToast('Day archived to History!', 'ok');
        } else {
          showToast('Failed to archive day', 'warn');
        }
      }
    });
  };

  // History
  const handleDeleteHistoryDay = async (date: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete History Day',
      msg: `Are you sure you want to delete all archived sessions for ${date}?`,
      confirmText: 'Delete Day',
      onConfirm: async () => {
        const updatedData = await deleteHistoryDayAPI(date);
        if (updatedData) {
          setAppData(updatedData);
          showToast('Archived day deleted', 'ok');
        }
      }
    });
  };

  const handleDeleteHistoryRow = async (date: string, id: string) => {
    const updatedData = await deleteHistoryRowAPI(date, id);
    if (updatedData) setAppData(updatedData);
  };

  // Notifications
  const handleMarkAllNotifsRead = async () => {
    await markAllNotificationsReadAPI();
    loadData();
  };

  const handleClearAllNotifs = async () => {
    await clearAllNotificationsAPI();
    loadData();
  };

  const activeSessions = appData.sessions.filter(s => s.status === 'active');

  const customerSessionsForProfile = viewingCustomer
    ? [...appData.sessions, ...Object.values(appData.history).flat()].filter(
        s => (s.name || '').trim().toLowerCase() === viewingCustomer.nameKey
      )
    : [];

  return (
    <div className="min-h-screen w-full bg-[#06030c] text-[#f1edff] font-['Rajdhani',sans-serif] relative px-3 sm:px-6 md:px-8 py-4 md:py-6 pb-24 max-w-[1920px] mx-auto">
      {/* Top Bar Header */}
      <Header
        notifications={appData.notifications || []}
        onMarkAllRead={handleMarkAllNotifsRead}
        onClearAll={handleClearAllNotifs}
        isBackendConnected={isBackendConnected}
        userRole={isAdmin ? 'admin' : 'staff'}
        onLogout={handleAdminLogout}
      />

      {/* Main Tabs Navigation */}
      <TabsNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        activeSessionsCount={activeSessions.length}
        bookingsCount={(appData.bookings || []).length}
        isAdmin={isAdmin}
      />

      {/* Tab Panels */}
      <main className="mt-2">
        {activeTab === 'admin' && (
          <AdminPanel
            adminProfile={adminProfile}
            singleSlotAvailable={singleSlotAvailable}
            bookings={appData.bookings || []}
            stations={appData.stations || []}
            sessions={appData.sessions || []}
            onSaveBooking={handleSaveBooking}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={handleDeleteBooking}
            onStartSessionFromBooking={handleStartSessionFromBooking}
            onLogout={handleAdminLogout}
            onSwitchToCafeHUD={() => setActiveTab('live')}
            toast={showToast}
            onRefreshData={loadData}
          />
        )}
        {activeTab === 'live' && (
          <LiveStationBoard
            stations={appData.stations || []}
            sessions={appData.sessions || []}
            bookings={appData.bookings || []}
            customers={appData.customers || []}
            onRefresh={loadData}
            isBackendConnected={isBackendConnected}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            onEditSession={s => handleEditSessionOpen(s)}
            onSaveSessionUpdates={handleSaveSessionUpdates}
            onNavigateToNewSession={(stationId?: string) => {
              if (stationId) setPreSelectedStationId(stationId);
              setActiveTab('new');
            }}
            onUpdateBooking={handleUpdateBooking}
            toast={showToast}
          />
        )}

        {activeTab === 'new' && (
          <NewSessionTab
            stations={appData.stations || []}
            snacks={appData.snacks || []}
            customers={appData.customers || []}
            activeSessions={appData.sessions || []}
            onStartSession={handleStartSession}
            toast={showToast}
            preSelectedStationId={preSelectedStationId}
            onClearPreSelectedStation={() => setPreSelectedStationId(null)}
          />
        )}

        {activeTab === 'sessions' && (
          <SessionsTab
            sessions={appData.sessions || []}
            stations={appData.stations || []}
            onEndSession={handleEndSession}
            onDeleteSession={handleDeleteSession}
            onEditSession={s => handleEditSessionOpen(s)}
          />
        )}

        {activeTab === 'bookings' && (
          <BookingsTab
            bookings={appData.bookings || []}
            stations={appData.stations || []}
            onSaveBooking={handleSaveBooking}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={handleDeleteBooking}
            onStartSessionFromBooking={handleStartSessionFromBooking}
            toast={showToast}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersTab
            customers={appData.customers || []}
            sessions={appData.sessions || []}
            history={appData.history || {}}
            onDeleteCustomer={handleDeleteCustomer}
            onWipeAllCustomers={handleWipeAllCustomers}
            onOpenProfile={handleOpenCustomerProfile}
          />
        )}

        {activeTab === 'snacks' && (
          <SnacksTab
            snacks={appData.snacks || []}
            sessions={appData.sessions || []}
            onAddSnack={handleAddSnack}
            onDeleteSnack={handleDeleteSnack}
            toast={showToast}
          />
        )}

        {activeTab === 'stations' && (
          <StationsTab
            stations={appData.stations || []}
            activeSessions={appData.sessions || []}
            onAddStation={handleAddStation}
            onUpdateStation={handleUpdateStation}
            onDeleteStation={handleDeleteStation}
            toast={showToast}
          />
        )}

        {activeTab === 'today' && (
          <TodayTab
            sessions={appData.sessions || []}
            stations={appData.stations || []}
            onArchiveDay={handleArchiveDay}
            toast={showToast}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab
            history={appData.history || {}}
            currentSessions={appData.sessions || []}
            stations={appData.stations || []}
            onDeleteHistoryDay={handleDeleteHistoryDay}
            onDeleteHistoryRow={handleDeleteHistoryRow}
            onEditHistoryRow={(date, s) => handleEditSessionOpen(s, date)}
            toast={showToast}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardTab
            history={appData.history || {}}
            todaySessions={appData.sessions || []}
            stations={appData.stations || []}
            snacks={appData.snacks || []}
          />
        )}

      </main>

      {/* Edit / Profile Modal */}
      {isModalOpen && (
        <EditModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          sessionToEdit={editingSession}
          historyContext={editingHistoryContext}
          customerProfile={viewingCustomer}
          customerSessions={customerSessionsForProfile}
          stations={appData.stations || []}
          onSaveSession={handleSaveSessionUpdates}
          onDeleteCustomerProfile={handleDeleteCustomer}
          toast={showToast}
        />
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#130d24] border border-[#a855f7]/40 rounded-2xl p-6 max-w-md w-full flex flex-col gap-4 shadow-2xl">
            <h3 className="text-base font-['Exo_2'] font-bold text-white flex items-center gap-2">
              <span className="text-rose-500">⚠️</span> {confirmModal.title}
            </h3>
            <p className="text-xs text-[#ece6ff]/80 leading-relaxed font-sans">
              {confirmModal.msg}
            </p>
            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-rose-600/30"
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer with Admin Sign-up or Login link (Strictly in the footer) */}
      <Footer
        isAdmin={isAdmin}
        adminProfile={adminProfile}
        singleSlotAvailable={singleSlotAvailable}
        onOpenAdminAuth={() => setIsAdminAuthModalOpen(true)}
        onOpenAdminPanel={() => setActiveTab('admin')}
        onLogoutAdmin={handleAdminLogout}
      />

      {/* Admin Single-Slot Auth Modal (Sign up or Login) */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        singleSlotAvailable={singleSlotAvailable}
        onLoginSuccess={handleAdminLoginSuccess}
        toast={showToast}
        onStatusUpdated={loadAdminStatus}
      />

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-xl border font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce ${
              t.kind === 'ok'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : t.kind === 'warn'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
                : 'bg-purple-950/90 border-purple-500/50 text-purple-200'
            }`}
          >
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
