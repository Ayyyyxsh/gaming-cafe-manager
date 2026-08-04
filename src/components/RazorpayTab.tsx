import React, { useState, useEffect } from 'react';
import { CreditCard, ShieldCheck, Sparkles, AlertCircle, Copy, CheckCircle2, RefreshCw, Zap, DollarSign, ExternalLink, Key, Smartphone, FileText } from 'lucide-react';
import { processRazorpayPayment } from '../lib/razorpay';

interface RazorpayTabProps {
  toast: (msg: string, kind?: 'ok' | 'warn' | 'info') => void;
}

export const RazorpayTab: React.FC<RazorpayTabProps> = ({ toast }) => {
  const [config, setConfig] = useState<{
    keyId: string;
    isConfigured: boolean;
    mode: string;
    currency: string;
  }>({
    keyId: '',
    isConfigured: false,
    mode: 'demo_sandbox',
    currency: 'INR'
  });

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [amount, setAmount] = useState<number>(100);
  const [customerName, setCustomerName] = useState<string>('Gamer Guest');
  const [customerPhone, setCustomerPhone] = useState<string>('9876543210');
  const [note, setNote] = useState<string>('Gaming Session / Advance');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentLogs, setPaymentLogs] = useState<Array<{
    id: string;
    paymentId: string;
    orderId: string;
    amount: number;
    time: string;
    status: string;
  }>>([]);

  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await fetch('/api/razorpay/config');
      const data = await res.json();
      setConfig(data);
    } catch {
      toast('Could not fetch Razorpay configuration', 'warn');
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleTestPayment = async () => {
    if (amount <= 0) {
      toast('Please enter a valid amount', 'warn');
      return;
    }

    setIsProcessing(true);
    toast('Initiating Razorpay payment order...', 'info');

    await processRazorpayPayment({
      amount,
      name: 'OH MY GAME · NERO',
      description: note || 'Test Gateway Payment',
      customerName,
      customerPhone,
      onSuccess: (paymentId, orderId) => {
        setIsProcessing(false);
        toast(`Payment Successful! Payment ID: ${paymentId}`, 'ok');
        setPaymentLogs(prev => [
          {
            id: 'log-' + Math.random().toString(36).substring(2, 9),
            paymentId,
            orderId,
            amount,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            status: 'Success (Verified)'
          },
          ...prev
        ]);
      },
      onFailure: (err) => {
        setIsProcessing(false);
        const errMsg = err?.message || 'Payment cancelled or failed';
        toast(errMsg, 'warn');
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner: Razorpay Status & Branding */}
      <div className="p-4 rounded-2xl border border-blue-500/40 bg-gradient-to-r from-blue-950/40 via-purple-950/40 to-black/70 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/40 shrink-0 shadow-inner">
            <CreditCard className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-['Exo_2'] font-black text-sm uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Razorpay Payment Gateway
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                config.isConfigured
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {config.isConfigured ? 'LIVE / TEST KEYS CONNECTED' : 'SANDBOX DEMO MODE'}
              </span>
            </div>
            <p className="text-xs text-[#9c8fc6] mt-1">
              Key ID: <code className="text-blue-300 font-mono bg-black/50 px-2 py-0.5 rounded border border-blue-500/30">{config.keyId || 'rzp_test_demo'}</code>
              {!config.isConfigured && ' • Using built-in test sandbox. Add RAZORPAY_KEY_SECRET to .env for live Razorpay Checkout.'}
            </p>
          </div>
        </div>

        <button
          onClick={fetchConfig}
          disabled={loadingConfig}
          className="px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingConfig ? 'animate-spin' : ''}`} /> Refresh Status
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5">
        {/* Left Column: Interactive Payment Tester */}
        <div className="p-5 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.6)] to-[rgba(19,13,36,0.75)] backdrop-blur-md flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[rgba(168,85,247,0.2)] pb-3">
            <h3 className="font-['Exo_2'] font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#ff4dab]" /> Test Razorpay Payment Checkout
            </h3>
            <span className="text-xs text-[#9c8fc6] font-semibold">INR (₹) Gateway</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold block mb-1">
                Payment Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-white font-bold text-sm">₹</span>
                <input
                  type="number"
                  value={amount || ''}
                  onChange={e => setAmount(Number(e.target.value) || 0)}
                  placeholder="100"
                  className="w-full bg-black/60 border border-[rgba(168,85,247,0.25)] rounded-xl py-2 pl-8 pr-3 text-sm text-white font-bold outline-none focus:border-pink-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold block mb-1">
                Quick Select Amount
              </label>
              <div className="flex items-center gap-1.5">
                {[50, 100, 250, 500].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                      amount === amt
                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-pink-500 text-white shadow'
                        : 'bg-black/40 border-[rgba(168,85,247,0.2)] text-[#9c8fc6] hover:text-white'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold block mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Name"
                className="w-full bg-black/60 border border-[rgba(168,85,247,0.25)] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold block mb-1">
                Customer Phone
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="Phone"
                className="w-full bg-black/60 border border-[rgba(168,85,247,0.25)] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#9c8fc6] font-bold block mb-1">
              Payment Purpose / Note
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Gaming Pass / Booking Advance"
              className="w-full bg-black/60 border border-[rgba(168,85,247,0.25)] rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-pink-500"
            />
          </div>

          <button
            onClick={handleTestPayment}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:brightness-110 text-white font-['Exo_2'] font-black text-sm uppercase tracking-wider shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <CreditCard className="w-5 h-5" />
            {isProcessing ? 'Processing Payment...' : `Pay ₹${amount} via Razorpay`}
          </button>

          {/* Payment Logs */}
          <div className="mt-4 pt-4 border-t border-[rgba(168,85,247,0.2)]">
            <h4 className="text-xs uppercase tracking-wider text-[#9c8fc6] font-bold mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-400" /> Recent Session Payment Receipts ({paymentLogs.length})
            </h4>

            {paymentLogs.length === 0 ? (
              <div className="p-4 rounded-xl bg-black/30 text-center text-xs text-[#9c8fc6] italic">
                No test payments executed in this browser session yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {paymentLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ₹{log.amount} Paid
                      </div>
                      <div className="text-[10px] text-[#9c8fc6] font-mono mt-0.5">
                        Payment ID: {log.paymentId}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 font-bold">{log.status}</span>
                      <div className="text-[10px] text-[#9c8fc6]">{log.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Key Setup Instructions & API Architecture */}
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-2xl border border-[rgba(168,85,247,0.22)] bg-gradient-to-b from-[rgba(36,24,65,0.6)] to-[rgba(19,13,36,0.75)] backdrop-blur-md flex flex-col gap-3">
            <h3 className="font-['Exo_2'] font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" /> Connecting Live Razorpay API Keys
            </h3>

            <p className="text-xs text-[#9c8fc6] leading-relaxed">
              To accept real payments via UPI, Credit/Debit Cards, NetBanking, or Wallets using your official Razorpay Merchant Account:
            </p>

            <ol className="flex flex-col gap-2 text-xs text-[#ece6ff] list-decimal list-inside pl-1">
              <li className="p-2 rounded-xl bg-black/40 border border-purple-500/20">
                Log into your <a href="https://dashboard.razorpay.com/" target="_blank" rel="noreferrer" className="text-blue-400 underline font-bold inline-flex items-center gap-1">Razorpay Dashboard <ExternalLink className="w-3 h-3" /></a>
              </li>
              <li className="p-2 rounded-xl bg-black/40 border border-purple-500/20">
                Go to <span className="text-pink-300 font-semibold">Account & Settings ➔ API Keys</span> and generate your <code className="text-amber-300 bg-black/60 px-1 py-0.5 rounded">Key ID</code> & <code className="text-amber-300 bg-black/60 px-1 py-0.5 rounded">Key Secret</code>.
              </li>
              <li className="p-2 rounded-xl bg-black/40 border border-purple-500/20">
                Add them to your project's <code className="text-blue-300 font-mono bg-black/60 px-1.5 py-0.5 rounded">.env.example</code> or AI Studio Secrets:
              </li>
            </ol>

            <div className="p-3 bg-black/80 border border-blue-500/30 rounded-xl font-mono text-[11px] text-blue-300 flex flex-col gap-1 shadow-inner">
              <div>RAZORPAY_KEY_ID="rzp_live_xxxxxxxx"</div>
              <div>RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxx"</div>
              <div>VITE_RAZORPAY_KEY_ID="rzp_live_xxxxxxxx"</div>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-black/60 backdrop-blur-md flex flex-col gap-3">
            <h3 className="font-['Exo_2'] font-extrabold text-sm text-emerald-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Secure Backend HMAC Verification
            </h3>
            <p className="text-xs text-[#9c8fc6] leading-relaxed">
              All payment transactions are pre-registered on server-side (<code className="text-emerald-300 bg-black/50 px-1 rounded">/api/razorpay/create-order</code>) and verified via HMAC SHA256 signatures (<code className="text-emerald-300 bg-black/50 px-1 rounded">/api/razorpay/verify-payment</code>) to guarantee zero spoofing or fraud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
