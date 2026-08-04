import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { fileURLToPath } from 'url';
import { supabase, mapBookingForSupabase, mapBookingFromSupabase } from './src/lib/supabase.js';

// Lazy Razorpay Client initialization
let razorpayClient: Razorpay | null = null;
function getRazorpay(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret || key_id.includes('YOUR_KEY_ID')) {
    return null;
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({ key_id, key_secret });
  }
  return razorpayClient;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
export const app = express();
app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Default Database Template
const DEFAULT_STATIONS = [
  { id: 'PC1', name: 'PC 1 (Pro)', kind: 'PC', icon: 'ti-device-desktop', color: 'purple', price30: 30, price60: 50, hasMulti: false, multi30: 0, multi60: 0 },
  { id: 'PC2', name: 'PC 2 (Pro)', kind: 'PC', icon: 'ti-device-desktop', color: 'purple', price30: 30, price60: 50, hasMulti: false, multi30: 0, multi60: 0 },
  { id: 'PC3', name: 'PC 3 (RTX 4080)', kind: 'PC', icon: 'ti-device-desktop', color: 'purple', price30: 35, price60: 60, hasMulti: false, multi30: 0, multi60: 0 },
  { id: 'PC4', name: 'PC 4 (RTX 4080)', kind: 'PC', icon: 'ti-device-desktop', color: 'purple', price30: 35, price60: 60, hasMulti: false, multi30: 0, multi60: 0 },
  { id: 'PS51', name: 'PS5 Zone 1', kind: 'PS5', icon: 'ti-device-gamepad-2', color: 'violet', price30: 50, price60: 90, hasMulti: true, multi30: 40, multi60: 60 },
  { id: 'PS52', name: 'PS5 Zone 2', kind: 'PS5', icon: 'ti-device-gamepad-2', color: 'violet', price30: 50, price60: 90, hasMulti: true, multi30: 40, multi60: 60 },
  { id: 'RACE1', name: 'Racing Rig Alpha', kind: 'RACE', icon: 'ti-steering-wheel', color: 'amber', price30: 60, price60: 110, hasMulti: false, multi30: 0, multi60: 0 },
  { id: 'VIP1', name: 'VIP PC Suite', kind: 'CUSTOM', icon: 'ti-crown', color: 'cyan', price30: 70, price60: 120, hasMulti: false, multi30: 0, multi60: 0 },
];

const DEFAULT_SNACKS = [
  { id: 'snk-1', name: 'Cold Coffee', price: 60, emoji: '☕' },
  { id: 'snk-2', name: 'Gamer Energy Drink', price: 90, emoji: '⚡' },
  { id: 'snk-3', name: 'Peri Peri Chips', price: 30, emoji: '🍟' },
  { id: 'snk-4', name: 'Water Bottle 1L', price: 20, emoji: '💧' },
  { id: 'snk-5', name: 'Cheese Burger', price: 85, emoji: '🍔' },
  { id: 'snk-6', name: 'Grilled Sandwich', price: 65, emoji: '🥪' },
  { id: 'snk-7', name: 'Hot Pizza Slice', price: 95, emoji: '🍕' },
  { id: 'snk-8', name: 'Loaded Nachos', price: 75, emoji: '🧀' },
];

const DEFAULT_OFFERS = [
  { id: 'of-1', title: 'Happy Hour +30m', desc: 'Get 30 mins bonus gaming time on 1hr+ slots', type: 'freetime', value: 30, badge: 'MOST POPULAR', emoji: '🎁', active: true, createdAt: '2026-08-01' },
  { id: 'of-2', title: 'Weekend Flat ₹50 Off', desc: 'Flat ₹50 discount on gaming bill above ₹200', type: 'flat', value: 50, badge: 'WEEKEND DEAL', emoji: '🔥', active: true, createdAt: '2026-08-01' },
  { id: 'of-3', title: '15% Student Discount', desc: '15% off total gaming bill for students', type: 'percent', value: 15, badge: 'STUDENT SPECIAL', emoji: '🎓', active: false, createdAt: '2026-08-01' },
];

const DEFAULT_CUSTOMERS = [
  { id: 'cust-1', nameKey: 'aarav sharma', name: 'Aarav Sharma', phone: '+91 9876543210', firstAt: '2026-07-15', lastAt: '2026-08-03', sessionCount: 12, totalSpent: 1450 },
  { id: 'cust-2', nameKey: 'rohan verma', name: 'Rohan Verma', phone: '+91 9812345678', firstAt: '2026-07-20', lastAt: '2026-08-02', sessionCount: 8, totalSpent: 920 },
  { id: 'cust-3', nameKey: 'ananya patel', name: 'Ananya Patel', phone: '+91 9988776655', firstAt: '2026-07-25', lastAt: '2026-08-03', sessionCount: 5, totalSpent: 680 },
];

function getInitialDB() {
  const today = new Date().toISOString().split('T')[0];
  return {
    stations: DEFAULT_STATIONS,
    snacks: DEFAULT_SNACKS,
    offers: DEFAULT_OFFERS,
    customers: DEFAULT_CUSTOMERS,
    sessions: [
      {
        id: 'sess-demo-1',
        customerId: 'cust-1',
        name: 'Aarav Sharma',
        phone: '+91 9876543210',
        stationIds: ['PC1'],
        stationId: 'PC1',
        mode: null,
        players: null,
        startTime: '10:00',
        endTime: '12:00',
        slots: [{ mins: 120 }],
        cart: [{ id: 'snk-1', name: 'Cold Coffee', price: 60, emoji: '☕', qty: 1 }],
        gaming: 100,
        snacks: 60,
        discount: 0,
        total: 160,
        offer: null,
        pm: 'UPI',
        cashAmt: 0,
        upiAmt: 160,
        note: 'Valorant Tournament match',
        status: 'ended',
        endedAt: '12:00',
        date: today
      },
      {
        id: 'sess-demo-2',
        customerId: 'cust-3',
        name: 'Ananya Patel',
        phone: '+91 9988776655',
        stationIds: ['PS51'],
        stationId: 'PS51',
        mode: 'multi',
        players: 2,
        startTime: '11:30',
        endTime: '13:00',
        slots: [{ mins: 90 }],
        cart: [{ id: 'snk-2', name: 'Gamer Energy Drink', price: 90, emoji: '⚡', qty: 2 }],
        gaming: 100,
        snacks: 180,
        discount: 30,
        total: 250,
        offer: { id: 'of-1', title: 'Happy Hour +30m', type: 'freetime', value: 30 },
        pm: 'Cash',
        cashAmt: 250,
        upiAmt: 0,
        note: 'FIFA 26 co-op sessions',
        status: 'ended',
        endedAt: '13:00',
        date: today
      }
    ],
    bookings: [
      {
        id: 'bk-demo-1',
        name: 'Rohan Verma',
        phone: '+91 9812345678',
        date: today,
        time: '17:00',
        stationIds: ['PC3', 'PC4'],
        stationId: 'PC3',
        duration: 120,
        advance: 100,
        notes: 'Dota 2 Duo Ranked Grind',
        status: 'confirmed'
      }
    ],
    history: {
      '2026-08-02': [
        {
          id: 'hist-s1',
          name: 'Vikram Singh',
          phone: '+91 9711223344',
          stationIds: ['RACE1'],
          stationId: 'RACE1',
          startTime: '14:00',
          endTime: '15:30',
          slots: [{ mins: 90 }],
          cart: [{ id: 'snk-1', name: 'Cold Coffee', price: 60, emoji: '☕', qty: 1 }],
          gaming: 170,
          snacks: 60,
          discount: 0,
          total: 230,
          pm: 'UPI',
          cashAmt: 0,
          upiAmt: 230,
          note: 'F1 2026 Time Trial practice',
          status: 'ended',
          date: '2026-08-02'
        },
        {
          id: 'hist-s2',
          name: 'Aarav Sharma',
          phone: '+91 9876543210',
          stationIds: ['PC2'],
          stationId: 'PC2',
          startTime: '16:00',
          endTime: '19:00',
          slots: [{ mins: 180 }],
          cart: [{ id: 'snk-3', name: 'Peri Peri Chips', price: 30, emoji: '🍟', qty: 2 }],
          gaming: 150,
          snacks: 60,
          discount: 0,
          total: 210,
          pm: 'Cash',
          cashAmt: 210,
          upiAmt: 0,
          note: 'CS2 competitive grind',
          status: 'ended',
          date: '2026-08-02'
        }
      ]
    },
    notifications: [
      {
        id: 'notif-boot',
        title: 'Server Active',
        msg: 'Gaming Cafe Backend Server loaded and ready.',
        kind: 'ok',
        type: 'system',
        ts: Date.now(),
        read: false
      }
    ]
  };
}

function loadDB() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const init = getInitialDB();
      fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2), 'utf-8');
      return init;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading DB, using fallback:', err);
    return getInitialDB();
  }
}

function saveDB(db: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

// Supabase Sync Helpers for Bookings
async function fetchBookingsFromSupabase(): Promise<any[] | null> {
  try {
    const { data, error } = await supabase.from('bookings').select('*');
    if (error) {
      // Table missing or RLS not set up - return null cleanly to fall back to local JSON DB
      return null;
    }
    if (data && Array.isArray(data)) {
      return data.map(mapBookingFromSupabase);
    }
    return [];
  } catch {
    return null;
  }
}

async function syncBookingToSupabase(booking: any) {
  try {
    const payload = mapBookingForSupabase(booking);
    const { error } = await supabase.from('bookings').upsert(payload);
    if (error) {
      console.warn('Supabase sync info:', error.message);
    } else {
      console.log('✅ Booking successfully synced to Supabase (kefxydzqwdjzlmvnrjbt):', booking.id);
    }
  } catch (err: any) {
    console.warn('Supabase sync notice:', err?.message || err);
  }
}

async function deleteBookingFromSupabase(id: string) {
  try {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) {
      console.warn('Supabase delete notice:', error.message);
    } else {
      console.log('✅ Booking deleted from Supabase:', id);
    }
  } catch (err: any) {
    console.warn('Supabase delete notice:', err?.message || err);
  }
}

// REST API Endpoints

const SQL_SETUP_SNIPPET = `CREATE TABLE IF NOT EXISTS public.bookings (
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

-- Enable RLS and public access
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public access" ON public.bookings;
CREATE POLICY "Allow public access" ON public.bookings FOR ALL USING (true) WITH CHECK (true);`;

// Razorpay Payment Gateway Endpoints
app.get('/api/razorpay/config', (req: Request, res: Response) => {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  const isConfigured = Boolean(process.env.RAZORPAY_KEY_SECRET && keyId && !keyId.includes('YOUR_KEY_ID'));
  res.json({
    keyId: isConfigured ? keyId : (keyId || 'rzp_test_demo'),
    isConfigured,
    mode: isConfigured ? 'live_or_test' : 'demo_sandbox',
    currency: 'INR'
  });
});

app.post('/api/razorpay/create-order', async (req: Request, res: Response) => {
  try {
    const { amount, receipt, notes } = req.body;
    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const rzp = getRazorpay();
    const amountInPaise = Math.round(numAmount * 100);
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_demo';

    if (rzp) {
      const order = await rzp.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {}
      });
      return res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        isSimulated: false
      });
    } else {
      // Demo / Test Sandbox mode fallback order when keys are pending
      const simulatedId = `order_sim_${Math.random().toString(36).substring(2, 12)}`;
      return res.json({
        success: true,
        orderId: simulatedId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: keyId.includes('YOUR_KEY_ID') ? 'rzp_test_demo' : keyId,
        isSimulated: true,
        notice: 'Razorpay keys pending in .env. Running in interactive Test Sandbox mode.'
      });
    }
  } catch (err: any) {
    console.error('Razorpay Order Creation Error:', err);
    res.status(500).json({ success: false, message: err?.message || 'Failed to create Razorpay Order' });
  }
});

app.post('/api/razorpay/verify-payment', (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (razorpay_order_id && razorpay_order_id.startsWith('order_sim_')) {
      return res.json({
        success: true,
        verified: true,
        paymentId: razorpay_payment_id || `pay_sim_${Date.now()}`,
        isSimulated: true,
        message: 'Test payment completed successfully'
      });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret || key_secret.includes('YOUR_KEY_SECRET')) {
      return res.json({
        success: true,
        verified: true,
        paymentId: razorpay_payment_id || `pay_sim_${Date.now()}`,
        isSimulated: true,
        message: 'Payment recorded (Sandbox verification)'
      });
    }

    const hmac = crypto.createHmac('sha256', key_secret);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generated_signature = hmac.digest('hex');

    if (generated_signature === razorpay_signature) {
      return res.json({
        success: true,
        verified: true,
        paymentId: razorpay_payment_id
      });
    } else {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Razorpay signature verification failed'
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message || 'Verification failed' });
  }
});
app.get('/api/supabase/status', async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from('bookings').select('id').limit(1);
    const isTableMissing = error?.message?.includes('schema cache') || error?.message?.includes('does not exist');
    
    res.json({
      connected: true,
      tableExists: !error,
      projectId: 'kefxydzqwdjzlmvnrjbt',
      error: error ? error.message : null,
      message: !error 
        ? 'Supabase database live & sync active' 
        : isTableMissing 
          ? 'Table public.bookings needs to be created in Supabase SQL Editor'
          : error.message,
      sqlSetup: SQL_SETUP_SNIPPET
    });
  } catch (err: any) {
    res.json({
      connected: false,
      tableExists: false,
      projectId: 'kefxydzqwdjzlmvnrjbt',
      error: err?.message || String(err),
      sqlSetup: SQL_SETUP_SNIPPET
    });
  }
});

// 1. Get full database state
app.get('/api/data', async (req: Request, res: Response) => {
  const db = loadDB();
  const supabaseBookings = await fetchBookingsFromSupabase();
  if (supabaseBookings && supabaseBookings.length > 0) {
    db.bookings = supabaseBookings;
    saveDB(db);
  }
  res.json({ success: true, data: db, supabaseConnected: true, projectId: 'kefxydzqwdjzlmvnrjbt' });
});

// 2. Add Notification
app.post('/api/notifications', (req: Request, res: Response) => {
  const db = loadDB();
  const { title, msg, kind, type, dedupKey } = req.body;
  if (dedupKey) {
    const now = Date.now();
    const exists = db.notifications.find((n: any) => n.dedupKey === dedupKey && (now - n.ts) < 60000);
    if (exists) {
      return res.json({ success: true, notification: exists });
    }
  }
  const notif = {
    id: 'n-' + Math.random().toString(36).substring(2, 9),
    title,
    msg,
    kind: kind || 'warn',
    type: type || 'general',
    ts: Date.now(),
    read: false,
    dedupKey
  };
  db.notifications.unshift(notif);
  if (db.notifications.length > 200) db.notifications.length = 200;
  saveDB(db);
  res.json({ success: true, notification: notif });
});

app.post('/api/notifications/mark-all-read', (req: Request, res: Response) => {
  const db = loadDB();
  db.notifications.forEach((n: any) => { n.read = true; });
  saveDB(db);
  res.json({ success: true });
});

app.delete('/api/notifications', (req: Request, res: Response) => {
  const db = loadDB();
  db.notifications = [];
  saveDB(db);
  res.json({ success: true });
});

// 3. Sessions Endpoints
app.post('/api/sessions', (req: Request, res: Response) => {
  const db = loadDB();
  const session = req.body;
  session.id = session.id || ('sess-' + Math.random().toString(36).substring(2, 10));
  db.sessions.push(session);

  // Auto upsert customer
  const normKey = (session.name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (normKey) {
    let cust = db.customers.find((c: any) => c.nameKey === normKey);
    if (!cust) {
      cust = {
        id: 'cust-' + Math.random().toString(36).substring(2, 10),
        nameKey: normKey,
        name: session.name.trim(),
        phone: session.phone || '',
        firstAt: session.date || new Date().toISOString().split('T')[0],
        lastAt: session.date || new Date().toISOString().split('T')[0],
        sessionCount: 1,
        totalSpent: session.total || 0
      };
      db.customers.push(cust);
    } else {
      cust.sessionCount++;
      cust.totalSpent += (session.total || 0);
      cust.lastAt = session.date || new Date().toISOString().split('T')[0];
      if (session.phone && !cust.phone) cust.phone = session.phone;
    }
  }

  saveDB(db);
  res.json({ success: true, session, data: db });
});

app.put('/api/sessions/:id', (req: Request, res: Response) => {
  const db = loadDB();
  const { id } = req.params;
  const index = db.sessions.findIndex((s: any) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }
  db.sessions[index] = { ...db.sessions[index], ...req.body };
  saveDB(db);
  res.json({ success: true, session: db.sessions[index], data: db });
});

app.post('/api/sessions/:id/end', (req: Request, res: Response) => {
  const db = loadDB();
  const { id } = req.params;
  const session = db.sessions.find((s: any) => s.id === id);
  if (!session) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }
  session.status = 'ended';
  const now = new Date();
  session.endedAt = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  saveDB(db);
  res.json({ success: true, session, data: db });
});

app.delete('/api/sessions/:id', (req: Request, res: Response) => {
  const db = loadDB();
  const { id } = req.params;
  db.sessions = db.sessions.filter((s: any) => s.id !== id);
  saveDB(db);
  res.json({ success: true, data: db });
});

// 4. Bookings Endpoints
app.post('/api/bookings', async (req: Request, res: Response) => {
  const db = loadDB();
  const booking = req.body;
  booking.id = booking.id || ('bk-' + Math.random().toString(36).substring(2, 10));
  db.bookings.push(booking);
  saveDB(db);

  // Sync with Supabase
  await syncBookingToSupabase(booking);

  res.json({ success: true, booking, data: db });
});

app.put('/api/bookings/:id', async (req: Request, res: Response) => {
  const db = loadDB();
  const { id } = req.params;
  const index = db.bookings.findIndex((b: any) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }
  db.bookings[index] = { ...db.bookings[index], ...req.body };
  saveDB(db);

  // Sync with Supabase
  await syncBookingToSupabase(db.bookings[index]);

  res.json({ success: true, booking: db.bookings[index], data: db });
});

app.delete('/api/bookings/:id', async (req: Request, res: Response) => {
  const db = loadDB();
  const { id } = req.params;
  db.bookings = db.bookings.filter((b: any) => b.id !== id);
  saveDB(db);

  // Delete from Supabase
  await deleteBookingFromSupabase(id);

  res.json({ success: true, data: db });
});


// 5. Snacks Endpoints
app.post('/api/snacks', (req: Request, res: Response) => {
  const db = loadDB();
  const snack = req.body;
  snack.id = snack.id || ('snk-' + Math.random().toString(36).substring(2, 10));
  db.snacks.push(snack);
  saveDB(db);
  res.json({ success: true, snack, data: db });
});

app.put('/api/snacks/:id', (req: Request, res: Response) => {
  const db = loadDB();
  const { id } = req.params;
  const index = db.snacks.findIndex((s: any) => s.id === id);
  if (index !== -1) {
    db.snacks[index] = { ...db.snacks[index], ...req.body };
    saveDB(db);
  }
  res.json({ success: true, data: db });
});

app.delete('/api/snacks/:id', (req: Request, res: Response) => {
  const db = loadDB();
  const { id } = req.params;
  db.snacks = db.snacks.filter((s: any) => s.id !== id);
  saveDB(db);
  res.json({ success: true, data: db });
});

// 6. Offers Endpoints
app.post('/api/offers', (req: Request, res: Response) => {
  const db = loadDB();
  const offer = req.body;
  offer.id = offer.id || ('of-' + Math.random().toString(36).substring(2, 10));
  db.offers.push(offer);
  saveDB(db);
  res.json({ success: true, offer, data: db });
});

app.put('/api/offers/:id', (req: Request, res: Response) => {
  const db = loadDB();
  const { id } = req.params;
  const index = db.offers.findIndex((o: any) => o.id === id);
  if (index !== -1) {
    db.offers[index] = { ...db.offers[index], ...req.body };
    saveDB(db);
  }
  res.json({ success: true, data: db });
});

app.delete('/api/offers/:id', (req: Request, res: Response) => {
  const db = loadDB();
  const { id } = req.params;
  db.offers = db.offers.filter((o: any) => o.id !== id);
  saveDB(db);
  res.json({ success: true, data: db });
});

// 7. Stations Endpoints
app.post('/api/stations', (req: Request, res: Response) => {
  const db = loadDB();
  const station = req.body;
  station.id = station.id || ('ST-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  db.stations.push(station);
  saveDB(db);
  res.json({ success: true, station, data: db });
});

app.put('/api/stations/:id', (req: Request, res: Response) => {
  const db = loadDB();
  const { id } = req.params;
  const index = db.stations.findIndex((st: any) => st.id === id);
  if (index !== -1) {
    db.stations[index] = { ...db.stations[index], ...req.body };
    saveDB(db);
  }
  res.json({ success: true, data: db });
});

app.delete('/api/stations/:id', (req: Request, res: Response) => {
  const db = loadDB();
  const { id } = req.params;
  db.stations = db.stations.filter((st: any) => st.id !== id);
  saveDB(db);
  res.json({ success: true, data: db });
});

// 8. Customers & History Endpoints
app.delete('/api/customers/:id', (req: Request, res: Response) => {
  const db = loadDB();
  const { id } = req.params;
  const cust = db.customers.find((c: any) => c.id === id);
  if (cust) {
    const key = cust.nameKey;
    db.customers = db.customers.filter((c: any) => c.id !== id);
    db.sessions = db.sessions.filter((s: any) => (s.name || '').trim().toLowerCase().replace(/\s+/g, ' ') !== key);
    db.bookings = db.bookings.filter((b: any) => (b.name || '').trim().toLowerCase().replace(/\s+/g, ' ') !== key);
    Object.keys(db.history).forEach(d => {
      db.history[d] = db.history[d].filter((s: any) => (s.name || '').trim().toLowerCase().replace(/\s+/g, ' ') !== key);
      if (!db.history[d].length) delete db.history[d];
    });
    saveDB(db);
  }
  res.json({ success: true, data: db });
});

app.delete('/api/customers', (req: Request, res: Response) => {
  const db = loadDB();
  db.customers = [];
  db.sessions = [];
  db.bookings = [];
  db.history = {};
  saveDB(db);
  res.json({ success: true, data: db });
});

// Archive Day
app.post('/api/archive-day', (req: Request, res: Response) => {
  const db = loadDB();
  if (!db.sessions || db.sessions.length === 0) {
    return res.status(400).json({ success: false, message: 'No sessions recorded today to archive' });
  }

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Mark active sessions as ended
  db.sessions.forEach((s: any) => {
    if (s.status === 'active') {
      s.status = 'ended';
      s.endedAt = s.endedAt || timeStr;
    }
  });

  const today = new Date().toISOString().split('T')[0];
  db.history[today] = (db.history[today] || []).concat(db.sessions);
  const archivedCount = db.sessions.length;
  db.sessions = [];
  saveDB(db);
  res.json({ success: true, archivedCount, date: today, data: db });
});

app.delete('/api/history/:date', (req: Request, res: Response) => {
  const db = loadDB();
  const { date } = req.params;
  delete db.history[date];
  saveDB(db);
  res.json({ success: true, data: db });
});

app.delete('/api/history/:date/row/:id', (req: Request, res: Response) => {
  const db = loadDB();
  const { date, id } = req.params;
  if (db.history[date]) {
    db.history[date] = db.history[date].filter((s: any) => s.id !== id);
    if (!db.history[date].length) delete db.history[date];
    saveDB(db);
  }
  res.json({ success: true, data: db });
});

// Vite / Static Files Middleware setup
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 Gaming Cafe Backend running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();

export default app;
