export interface Station {
  id: string;
  name: string;
  kind: 'PC' | 'PS5' | 'RACE' | 'CUSTOM';
  icon: string;
  color: 'purple' | 'violet' | 'amber' | 'cyan' | 'rose' | 'emerald';
  price30: number;
  price60: number;
  hasMulti?: boolean;
  multi30?: number;
  multi60?: number;
}

export interface SnackItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  qty: number;
}

export interface Offer {
  id: string;
  title: string;
  desc?: string;
  type: 'freetime' | 'flat' | 'percent' | 'note';
  value: number;
  badge?: string;
  emoji: string;
  active: boolean;
  createdAt?: string;
}

export interface Slot {
  mins: number;
}

export interface Session {
  id: string;
  customerId?: string | null;
  name: string;
  phone?: string;
  stationIds: string[];
  stationId?: string; // legacy support
  mode?: 'single' | 'multi' | null;
  players?: number | null;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  slots: Slot[];
  cart: CartItem[];
  gaming: number;
  snacks: number;
  discount: number;
  total: number;
  offer?: {
    id: string;
    title: string;
    type: string;
    value: number;
    freeMins?: number;
  } | null;
  pm: 'Cash' | 'UPI' | 'Split' | 'Pending';
  cashAmt?: number;
  upiAmt?: number;
  note?: string;
  status: 'active' | 'ended';
  endedAt?: string;
  date: string; // "YYYY-MM-DD"
  createdAt?: number;
}

export interface Booking {
  id: string;
  name: string;
  phone?: string;
  date: string;
  time: string;
  stationIds: string[];
  stationId?: string;
  duration: number;
  advance: number;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'converted';
}

export interface Customer {
  id: string;
  nameKey: string;
  name: string;
  phone?: string;
  firstAt: string;
  lastAt: string;
  sessionCount: number;
  totalSpent: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  msg: string;
  kind: 'ok' | 'warn' | 'info';
  type: string;
  ts: number;
  read: boolean;
  dedupKey?: string;
}

export interface AppData {
  stations: Station[];
  snacks: SnackItem[];
  offers: Offer[];
  customers: Customer[];
  sessions: Session[];
  bookings: Booking[];
  history: Record<string, Session[]>;
  notifications: NotificationItem[];
}
