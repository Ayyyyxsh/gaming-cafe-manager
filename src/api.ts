import { AppData, Session, Booking, SnackItem, Offer, Station } from './types';

const API_BASE = '/api';

export async function fetchAppData(): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/data`);
    if (!res.ok) throw new Error('Failed to fetch app data');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API fetch error:', err);
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
    if (!res.ok) throw new Error('Failed to create session');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API create session error:', err);
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
    if (!res.ok) throw new Error('Failed to update session');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API update session error:', err);
    return null;
  }
}

export async function endSessionAPI(id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/sessions/${id}/end`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to end session');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API end session error:', err);
    return null;
  }
}

export async function deleteSessionAPI(id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/sessions/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete session');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API delete session error:', err);
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
    if (!res.ok) throw new Error('Failed to create booking');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API create booking error:', err);
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
    if (!res.ok) throw new Error('Failed to update booking');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API update booking error:', err);
    return null;
  }
}

export async function deleteBookingAPI(id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete booking');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API delete booking error:', err);
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
    if (!res.ok) throw new Error('Failed to create snack');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API create snack error:', err);
    return null;
  }
}

export async function deleteSnackAPI(id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/snacks/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete snack');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API delete snack error:', err);
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
    if (!res.ok) throw new Error('Failed to create offer');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API create offer error:', err);
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
    if (!res.ok) throw new Error('Failed to update offer');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API update offer error:', err);
    return null;
  }
}

export async function deleteOfferAPI(id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/offers/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete offer');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API delete offer error:', err);
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
    if (!res.ok) throw new Error('Failed to create station');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API create station error:', err);
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
    if (!res.ok) throw new Error('Failed to update station');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API update station error:', err);
    return null;
  }
}

export async function deleteStationAPI(id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/stations/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete station');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API delete station error:', err);
    return null;
  }
}

export async function deleteCustomerAPI(id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/customers/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete customer');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API delete customer error:', err);
    return null;
  }
}

export async function wipeAllCustomersAPI(): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to wipe customers');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API wipe customers error:', err);
    return null;
  }
}

export async function archiveDayAPI(): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/archive-day`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to archive day');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API archive day error:', err);
    return null;
  }
}

export async function deleteHistoryDayAPI(date: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/history/${date}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete history day');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API delete history day error:', err);
    return null;
  }
}

export async function deleteHistoryRowAPI(date: string, id: string): Promise<AppData | null> {
  try {
    const res = await fetch(`${API_BASE}/history/${date}/row/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete history row');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API delete history row error:', err);
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
    if (!res.ok) throw new Error('Failed to add notification');
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('API add notification error:', err);
    return null;
  }
}

export async function markAllNotificationsReadAPI(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, { method: 'POST' });
    return res.ok;
  } catch (err) {
    console.error('API mark all read error:', err);
    return false;
  }
}

export async function clearAllNotificationsAPI(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notifications`, { method: 'DELETE' });
    return res.ok;
  } catch (err) {
    console.error('API clear all notifications error:', err);
    return false;
  }
}
