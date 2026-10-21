import { AppData, Session, Booking, SnackItem, Offer, Station } from './types';

const API_BASE = '/api';

export async function fetchAppData(): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/data`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('Backend API sync offline/paused:', err);
    return null;
  }
}

export async function createSessionAPI(session: Partial<Session>): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API create session notice:', err);
    return null;
  }
}

export async function updateSessionAPI(id: string, updates: Partial<Session>): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API update session notice:', err);
    return null;
  }
}

export async function endSessionAPI(id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/sessions/${id}/end`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API end session notice:', err);
    return null;
  }
}

export async function deleteSessionAPI(id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/sessions/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API delete session notice:', err);
    return null;
  }
}

export async function createBookingAPI(booking: Partial<Booking>): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API create booking notice:', err);
    return null;
  }
}

export async function updateBookingAPI(id: string, updates: Partial<Booking>): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API update booking notice:', err);
    return null;
  }
}

export async function deleteBookingAPI(id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API delete booking notice:', err);
    return null;
  }
}

export async function createSnackAPI(snack: Partial<SnackItem>): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/snacks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snack)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API create snack notice:', err);
    return null;
  }
}

export async function deleteSnackAPI(id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/snacks/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API delete snack notice:', err);
    return null;
  }
}

export async function createOfferAPI(offer: Partial<Offer>): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offer)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API create offer notice:', err);
    return null;
  }
}

export async function updateOfferAPI(id: string, updates: Partial<Offer>): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/offers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API update offer notice:', err);
    return null;
  }
}

export async function deleteOfferAPI(id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/offers/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API delete offer notice:', err);
    return null;
  }
}

export async function createStationAPI(station: Partial<Station>): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/stations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(station)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API create station notice:', err);
    return null;
  }
}

export async function updateStationAPI(id: string, updates: Partial<Station>): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/stations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API update station notice:', err);
    return null;
  }
}

export async function deleteStationAPI(id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/stations/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API delete station notice:', err);
    return null;
  }
}

export async function deleteCustomerAPI(id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API delete customer notice:', err);
    return null;
  }
}

export async function wipeAllCustomersAPI(): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API wipe customers notice:', err);
    return null;
  }
}

export async function archiveDayAPI(): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/archive-day`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API archive day notice:', err);
    return null;
  }
}

export async function deleteHistoryDayAPI(date: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/history/${date}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API delete history day notice:', err);
    return null;
  }
}

export async function deleteHistoryRowAPI(date: string, id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/history/${date}/row/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API delete history row notice:', err);
    return null;
  }
}

export async function addNotificationAPI(notif: { title: string; msg: string; kind?: string; type?: string; dedupKey?: string }): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notif)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.warn('API add notification notice:', err);
    return null;
  }
}

export async function markAllNotificationsReadAPI(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, { method: 'POST' });
    return res.ok;
  } catch (err) {
    console.warn('API mark all read notice:', err);
    return false;
  }
}

export async function clearAllNotificationsAPI(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notifications`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.warn('API clear all notifications notice:', err);
    return false;
  }
}

export async function fetchAdminStatusAPI(): Promise<{
  hasAdminAccount: boolean;
  adminName?: string | null;
  adminUsername?: string | null;
  singleSlotAvailable: boolean;
}> {
  try {
    const res = await fetch(`${API_BASE}/admin/status`);
    if (!res.ok) throw new Error('Status failed');
    return await res.json();
  } catch {
    return {
      hasAdminAccount: false,
      singleSlotAvailable: true
    };
  }
}

export async function registerAdminAPI(data: { name: string; username: string; password: string }): Promise<{
  success: boolean;
  message?: string;
  admin?: { name: string; username: string };
}> {
  try {
    const res = await fetch(`${API_BASE}/admin/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error registering admin' };
  }
}

export async function loginAdminAPI(data: { username: string; password: string }): Promise<{
  success: boolean;
  message?: string;
  admin?: { name: string; username: string };
}> {
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error logging in' };
  }
}
