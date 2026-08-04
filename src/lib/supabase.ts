import { createClient } from '@supabase/supabase-js';
import { Booking } from '../types';

export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://kefxydzqwdjzlmvnrjbt.supabase.co';
export const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_dQnGlvJPHMb8H1Hqkiglpg_jagv43s_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to format booking objects for Supabase table storage
export function mapBookingForSupabase(b: Partial<Booking>) {
  return {
    id: b.id,
    name: b.name,
    phone: b.phone || '',
    date: b.date,
    time: b.time,
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
    status: (row.status as 'pending' | 'confirmed' | 'cancelled') || 'confirmed'
  };
}
