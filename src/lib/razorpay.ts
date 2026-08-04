export interface RazorpayPaymentOptions {
  amount: number; // in INR rupees
  name: string;
  description: string;
  customerName?: string;
  customerPhone?: string;
  notes?: Record<string, any>;
  onSuccess: (paymentId: string, orderId: string) => void;
  onFailure?: (error: any) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

let scriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('Failed to load Razorpay SDK script');
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export async function processRazorpayPayment(options: RazorpayPaymentOptions): Promise<void> {
  const { amount, name, description, customerName, customerPhone, notes, onSuccess, onFailure } = options;

  try {
    // 1. Request Order Creation from Backend
    const orderRes = await fetch('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        receipt: `rcpt_${Date.now()}`,
        notes: notes || {}
      })
    });

    const orderData = await orderRes.json();
    if (!orderData.success) {
      throw new Error(orderData.message || 'Failed to create payment order');
    }

    const { orderId, keyId, isSimulated } = orderData;

    // 2. Load Razorpay script if real keys are configured
    const scriptLoaded = await loadRazorpayScript();

    if (scriptLoaded && window.Razorpay && !isSimulated) {
      // Real Razorpay Checkout Modal
      const rzpOptions = {
        key: keyId,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'OH MY GAME · NERO',
        description: `${name} - ${description}`,
        image: '/logo.jpg',
        order_id: orderId,
        prefill: {
          name: customerName || 'Gaming Cafe Customer',
          contact: customerPhone || ''
        },
        theme: {
          color: '#ef4444' // Neon Red to match OH MY GAME brand
        },
        handler: async function (response: any) {
          try {
            // Verify payment signature on backend
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              onSuccess(response.razorpay_payment_id, response.razorpay_order_id);
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (err) {
            if (onFailure) onFailure(err);
          }
        },
        modal: {
          ondismiss: function () {
            if (onFailure) onFailure(new Error('Payment modal closed by user'));
          }
        }
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.on('payment.failed', function (response: any) {
        if (onFailure) onFailure(response.error);
      });
      rzp.open();
    } else {
      // Interactive Test Sandbox Payment (If Razorpay Live Keys not yet provided in .env)
      const payId = `pay_rzp_test_${Math.random().toString(36).substring(2, 10)}`;
      
      // Auto-verify test payment
      const verifyRes = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: payId
        })
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        onSuccess(payId, orderId);
      } else {
        throw new Error(verifyData.message || 'Test payment failed');
      }
    }
  } catch (err: any) {
    console.error('Razorpay Payment Exception:', err);
    if (onFailure) onFailure(err);
  }
}
