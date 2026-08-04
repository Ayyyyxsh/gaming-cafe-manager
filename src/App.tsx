import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TabsNav, TabType } from './components/TabsNav';
import { NewSessionTab } from './components/NewSessionTab';
import { SessionsTab } from './components/SessionsTab';
import { BookingsTab } from './components/BookingsTab';
import { CustomersTab } from './components/CustomersTab';
import { SnacksTab } from './components/SnacksTab';
import { OffersTab } from './components/OffersTab';
import { StationsTab } from './components/StationsTab';
import { TodayTab } from './components/TodayTab';
import { HistoryTab } from './components/HistoryTab';
import { RazorpayTab } from './components/RazorpayTab';
import { LiveStationBoard } from './components/LiveStationBoard';
import { EditModal } from './components/EditModal';
import { AdminLogin } from './components/AdminLogin';

import { AppData, Session, Booking, SnackItem, Offer, Station, Customer } from './types';
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
  clearAllNotificationsAPI
} from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('view=live')) {
      return 'live';
    }
    return 'live';
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('omg_admin_auth') === 'true';
  });
  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem('omg_admin_pin') || '1234';
  });

  const [appData, setAppData] = useState<AppData>({
    stations: [],
    snacks: [],
    offers: [],
    customers: [],
    sessions: [],
    bookings: [],
    history: {},
    notifications: []
  });

  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [toasts, setToasts] = useState<{ id: string; msg: string; kind: 'ok' | 'warn' | 'info' }[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [editingHistoryContext, setEditingHistoryContext] = useState<{ date: string } | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

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

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem('omg_admin_auth', 'true');
    showToast('Welcome Admin Master!', 'ok');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('omg_admin_auth');
    showToast('Portal Locked', 'info');
  };

  const handleUpdateAdminPin = (newPin: string) => {
    setAdminPin(newPin);
    localStorage.setItem('omg_admin_pin', newPin);
    showToast('Admin Security PIN updated!', 'ok');
  };

  // Fetch initial data
  const loadData = useCallback(async () => {
    const data = await fetchAppData();
    if (data) {
      setAppData(data);
      setIsBackendConnected(true);
    } else {
      setIsBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // 3s real-time live sync across devices
    const handleFocus = () => loadData();
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
    const updatedData = await createSessionAPI(sessionData);
    if (updatedData) {
      setAppData(updatedData);
      showToast('Session started!', 'ok');
      addNotificationAPI({
        title: 'Session Started',
        msg: `${sessionData.name} started gaming`,
        kind: 'ok',
        type: 'session-start'
      });
    } else {
      showToast('Server update failed', 'warn');
    }
  };

  const handleEndSession = async (id: string) => {
    const updatedData = await endSessionAPI(id);
    if (updatedData) {
      setAppData(updatedData);
      showToast('Session ended', 'ok');
    }
  };

  const handleDeleteSession = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Session Record',
      msg: 'Are you sure you want to delete this session record?',
      confirmText: 'Delete Record',
      onConfirm: async () => {
        const updatedData = await deleteSessionAPI(id);
        if (updatedData) {
          setAppData(updatedData);
          showToast('Session record deleted', 'ok');
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

  const handleStartSessionFromBooking = (b: Booking) => {
    setActiveTab('new');
    showToast(`Converted booking for ${b.name}`, 'ok');
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

  if (!isAuthenticated) {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        adminPin={adminPin}
        onUpdateAdminPin={handleUpdateAdminPin}
        stations={appData.stations || []}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#08030f] text-[#ece6ff] font-['Rajdhani',sans-serif] relative px-3 sm:px-6 md:px-8 py-4 md:py-6 pb-24 max-w-[1920px] mx-auto">
      {/* Top Bar Header */}
      <Header
        notifications={appData.notifications || []}
        onMarkAllRead={handleMarkAllNotifsRead}
        onClearAll={handleClearAllNotifs}
        isBackendConnected={isBackendConnected}
        userRole="admin"
        onLogout={handleLogout}
      />

      {/* Main Tabs Navigation */}
      <TabsNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        activeSessionsCount={activeSessions.length}
      />

      {/* Tab Panels */}
      <main className="mt-2">
        {activeTab === 'live' && (
          <LiveStationBoard
            stations={appData.stations || []}
            sessions={appData.sessions || []}
            bookings={appData.bookings || []}
            onRefresh={loadData}
            isBackendConnected={isBackendConnected}
          />
        )}

        {activeTab === 'new' && (
          <NewSessionTab
            stations={appData.stations || []}
            snacks={appData.snacks || []}
            offers={appData.offers || []}
            customers={appData.customers || []}
            activeSessions={appData.sessions || []}
            onStartSession={handleStartSession}
            toast={showToast}
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

        {activeTab === 'offers' && (
          <OffersTab
            offers={appData.offers || []}
            onAddOffer={handleAddOffer}
            onUpdateOffer={handleUpdateOffer}
            onDeleteOffer={handleDeleteOffer}
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
            stations={appData.stations || []}
            onDeleteHistoryDay={handleDeleteHistoryDay}
            onDeleteHistoryRow={handleDeleteHistoryRow}
            onEditHistoryRow={(date, s) => handleEditSessionOpen(s, date)}
            toast={showToast}
          />
        )}

        {activeTab === 'razorpay' && (
          <RazorpayTab toast={showToast} />
        )}

      </main>

      {/* Edit / Profile Modal */}
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
