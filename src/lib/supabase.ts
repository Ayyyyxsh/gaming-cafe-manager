import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Booking, Session } from '../types';

export const SUPABASE_PROJECT_ID = 'ozzywiqrdczjumdasedw';
export const SUPABASE_DEFAULT_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_DEFAULT_KEY = 'sb_publishable_yw4fBsgC5zrmGcJYU2tnHA_nmoctM-_';

export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || SUPABASE_DEFAULT_URL;
export const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_DEFAULT_KEY;

// Validates whether genuine Supabase project URL & key are supplied
export const isSupabaseConfigured: boolean = Boolean(
  SUPABASE_URL &&
  SUPABASE_KEY &&
  SUPABASE_URL.startsWith('https://')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
      global: {
        // Enforce 3.5-second timeout so API routes never hang on network hiccups
        fetch: (url: any, options: RequestInit = {}) => {
          return fetch(url, {
            ...options,
            signal: options.signal || AbortSignal.timeout(3500)
          });
        }
      }
    })
  : null;

// Helper to format booking objects for Supabase table storage
export function mapBookingForSupabase(b: Partial<Booking>) {
  return {
    id: b.id,
    name: b.name || '',
    phone: b.phone || '',
    date: b.date || '',
    time: b.time || '',
    station_ids: b.stationIds ? JSON.stringify(b.stationIds) : JSON.stringify(b.stationId ? [b.stationId] : []),
    station_id: b.stationId || (b.stationIds && b.stationIds[0]) || '',
    duration: Number(b.duration || 60),
    advance: Number(b.advance || 0),
    notes: b.notes || '',
    status: b.status || 'confirmed',
    updated_at: new Date().toISOString()
  };
}

export function mapBookingFromSupabase(row: any): Booking {
  let stationIds: string[] = [];
  try {
    if (typeof row.station_ids === 'string') {
      stationIds = JSON.parse(row.station_ids);
    } else if (Array.isArray(row.station_ids)) {
      stationIds = row.station_ids;
    }
  } catch {
    stationIds = row.station_id ? [row.station_id] : [];
  }
  if (!stationIds.length && row.station_id) {
    stationIds = [row.station_id];
  }

  return {
    id: String(row.id),
    name: String(row.name || ''),
    phone: row.phone || '',
    date: String(row.date || ''),
    time: String(row.time || ''),
    stationIds,
    stationId: row.station_id || stationIds[0] || '',
    duration: Number(row.duration || 60),
    advance: Number(row.advance || 0),
    notes: row.notes || '',
    status: (row.status as 'pending' | 'confirmed' | 'cancelled' | 'converted') || 'confirmed'
  };
}

// Helper to format session objects for Supabase table storage
export function mapSessionForSupabase(s: Partial<Session>) {
  return {
    id: s.id,
    name: s.name || '',
    phone: s.phone || '',
    station_ids: s.stationIds ? JSON.stringify(s.stationIds) : JSON.stringify(s.stationId ? [s.stationId] : []),
    station_id: s.stationId || (s.stationIds && s.stationIds[0]) || '',
    mode: s.mode || null,
    players: s.players ? Number(s.players) : null,
    start_time: s.startTime || '',
    end_time: s.endTime || '',
    slots: s.slots ? JSON.stringify(s.slots) : JSON.stringify([{ mins: 30 }]),
    cart: s.cart ? JSON.stringify(s.cart) : JSON.stringify([]),
    gaming: Number(s.gaming || 0),
    snacks: Number(s.snacks || 0),
    discount: Number(s.discount || 0),
    total: Number(s.total || 0),
    offer: s.offer ? JSON.stringify(s.offer) : null,
    pm: s.pm || 'Cash',
    cash_amt: Number(s.cashAmt || 0),
    upi_amt: Number(s.upiAmt || 0),
    note: s.note || '',
    status: s.status || 'active',
    ended_at: s.endedAt || null,
    date: s.date || new Date().toISOString().split('T')[0],
    created_at: Number(s.createdAt || Date.now()),
    updated_at: new Date().toISOString()
  };
}

export function mapSessionFromSupabase(row: any): Session {
  let stationIds: string[] = [];
  try {
    if (typeof row.station_ids === 'string') {
      stationIds = JSON.parse(row.station_ids);
    } else if (Array.isArray(row.station_ids)) {
      stationIds = row.station_ids;
    }
  } catch {
    stationIds = row.station_id ? [row.station_id] : [];
  }
  if (!stationIds.length && row.station_id) {
    stationIds = [row.station_id];
  }

  let slots = [{ mins: 30 }];
  try {
    if (typeof row.slots === 'string') slots = JSON.parse(row.slots);
    else if (Array.isArray(row.slots)) slots = row.slots;
  } catch {}

  let cart = [];
  try {
    if (typeof row.cart === 'string') cart = JSON.parse(row.cart);
    else if (Array.isArray(row.cart)) cart = row.cart;
  } catch {}

  let offer = null;
  try {
    if (typeof row.offer === 'string') offer = JSON.parse(row.offer);
    else if (row.offer && typeof row.offer === 'object') offer = row.offer;
  } catch {}

  return {
    id: String(row.id),
    customerId: row.customer_id || null,
    name: String(row.name || ''),
    phone: row.phone || '',
    stationIds,
    stationId: row.station_id || stationIds[0] || '',
    mode: row.mode || null,
    players: row.players ? Number(row.players) : null,
    startTime: String(row.start_time || ''),
    endTime: String(row.end_time || ''),
    slots,
    cart,
    gaming: Number(row.gaming || 0),
    snacks: Number(row.snacks || 0),
    discount: Number(row.discount || 0),
    total: Number(row.total || 0),
    offer,
    pm: (row.pm as any) || 'Cash',
    cashAmt: Number(row.cash_amt || 0),
    upiAmt: Number(row.upi_amt || 0),
    note: row.note || '',
    status: (row.status as 'active' | 'ended') || 'active',
    endedAt: row.ended_at || undefined,
    date: String(row.date || ''),
    createdAt: row.created_at ? Number(row.created_at) : undefined
  };
}

export const SUPABASE_SQL_SCHEMA = `-- 1. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    station_ids JSONB,
    station_id TEXT,
    duration INTEGER DEFAULT 60,
    advance NUMERIC DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'confirmed',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access on bookings" ON public.bookings;
CREATE POLICY "Allow public access on bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);

-- 2. Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    station_ids JSONB,
    station_id TEXT,
    mode TEXT,
    players INTEGER,
    start_time TEXT,
    end_time TEXT,
    slots JSONB,
    cart JSONB,
    gaming NUMERIC DEFAULT 0,
    snacks NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    offer JSONB,
    pm TEXT DEFAULT 'Cash',
    cash_amt NUMERIC DEFAULT 0,
    upi_amt NUMERIC DEFAULT 0,
    note TEXT,
    status TEXT DEFAULT 'active',
    ended_at TEXT,
    date TEXT NOT NULL,
    created_at BIGINT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access on sessions" ON public.sessions;
CREATE POLICY "Allow public access on sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);`;
