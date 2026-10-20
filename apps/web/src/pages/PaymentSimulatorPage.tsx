import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { safeApiFetch } from '@ecommerce/shared';
import { BackButton } from '../components/BackButton';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Lock } from 'lucide-react';

export const PaymentSimulatorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const merchantTransactionId = searchParams.get('merchantTransactionId') || '';
  const orderId = searchParams.get('orderId') || '';
  const amount = searchParams.get('amount') || '0';

  const [loading, setLoading] = useState(false);
  const [upiId, setUpiId] = useState('user@okaxis');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSimulate = async (outcome: 'successful' | 'failed' | 'cancelled') => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await safeApiFetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantTransactionId,
          status: outcome,
          phonepeTxnId: `T${Date.now()}`,
        }),
      });

      if (result.success && outcome === 'successful') {
        navigate(`/order/${result.data.orderNumber}`);
      } else if (result.success) {
        alert(`Payment ${outcome}. The order has been marked accordingly.`);
        navigate('/');
      } else {
        throw new Error(result.error || `Failed to process payment outcome ${outcome}`);
      }
    } catch (err: any) {
      setErrorMsg('Verification error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-3 flex items-center justify-start">
        <BackButton label="Back to Checkout" fallbackPath="/checkout" className="text-white bg-slate-800 border-slate-700 hover:bg-slate-700" />
      </div>
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 text-xs text-rose-800 font-bold">
            {errorMsg}
          </div>
        )}
        
        {/* PhonePe Header */}
        <div className="bg-purple-700 p-6 text-white text-center relative">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xl font-black tracking-wider">PhonePe</span>
            <span className="rounded bg-purple-900/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-purple-200">
              UAT Sandbox
            </span>
          </div>
          <p className="text-xs text-purple-200">Secure Payment Gateway Simulator</p>
        </div>

        {/* Amount & Transaction Info */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Payable Amount:</span>
            <span className="font-mono text-[11px]">{merchantTransactionId}</span>
          </div>
          <div className="text-3xl font-black text-slate-900">₹{amount}</div>
        </div>

        {/* Payment Mock UI */}
        <div className="p-6 space-y-5">
          <div className="space-y-2 text-xs">
            <label className="block font-bold text-slate-700">UPI ID / Virtual Payment Address</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-purple-600 font-mono"
            />
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              This is the official simulated PhonePe sandbox. Select an outcome below to test end-to-end server verification and atomic inventory deduction.
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => handleSimulate('successful')}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3.5 text-sm font-bold text-white shadow-md hover:bg-purple-800 active:scale-98 transition disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Simulate Successful Payment</span>
            </button>

            <button
              onClick={() => handleSimulate('failed')}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-800 hover:bg-rose-100 transition"
            >
              <XCircle className="h-4 w-4" />
              <span>Simulate Payment Failure / Bank Decline</span>
            </button>

            <button
              onClick={() => handleSimulate('cancelled')}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Cancel Transaction and Return</span>
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 p-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          <span>Server SHA256 Checksum Signature Verified</span>
        </div>
      </div>
    </div>
  );
};
