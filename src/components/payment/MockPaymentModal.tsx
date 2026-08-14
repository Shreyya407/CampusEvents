import React, { useState } from 'react';
import { formatCurrency, generateTransactionReference } from '../../lib/utils';

interface MockPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  amount: number;
  isWaitlist?: boolean;
  onPaymentSuccess: (txRef: string) => Promise<void>;
}

export const MockPaymentModal: React.FC<MockPaymentModalProps> = ({
  isOpen,
  onClose,
  eventTitle,
  amount,
  isWaitlist = false,
  onPaymentSuccess,
}) => {
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [cardHolder, setCardHolder] = useState('Student Account');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [upiId, setUpiId] = useState('student@okaxis');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Simulate network processing delay for authentic feel
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const txRef = generateTransactionReference();
      await onPaymentSuccess(txRef);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl border border-outline-variant shadow-2xl w-full max-w-md overflow-hidden relative">
        {/* Header */}
        <div className="bg-primary text-on-primary p-stack-md flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-fixed">credit_card</span>
              <h3 className="text-title-lg font-title-lg font-bold">
                {isWaitlist ? 'Waitlist Payment Checkout' : 'Event Payment Checkout'}
              </h3>
            </div>
            <p className="text-label-sm font-label-sm text-primary-fixed-dim mt-0.5">
              CampusEvents Secure Mock Gateway
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-on-primary/70 hover:text-on-primary p-1 rounded-full"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Payment Details */}
        <form onSubmit={handlePay} className="p-stack-md space-y-stack-md">
          <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant flex justify-between items-center">
            <div>
              <p className="text-label-sm font-label-sm text-on-surface-variant">Item</p>
              <p className="text-label-md font-label-md text-primary font-semibold truncate max-w-[220px]">
                {eventTitle}
              </p>
            </div>
            <div className="text-right">
              <p className="text-label-sm font-label-sm text-on-surface-variant">Total Fee</p>
              <p className="text-title-lg font-title-lg font-bold text-secondary">
                {formatCurrency(amount)}
              </p>
            </div>
          </div>

          {isWaitlist && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-body-sm flex gap-2">
              <span className="material-symbols-outlined text-amber-600 shrink-0">info</span>
              <p>
                You are paying to reserve a spot on the waitlist. If a seat becomes available, your ticket will automatically confirm. If not confirmed, a full refund will be recorded.
              </p>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="flex gap-2 border-b border-outline-variant pb-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 py-2 px-3 rounded-lg text-label-md font-label-md flex items-center justify-center gap-2 border transition-all ${
                paymentMethod === 'card'
                  ? 'bg-secondary text-on-secondary border-secondary font-semibold'
                  : 'bg-surface border-outline-variant text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">credit_card</span>
              Card
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('upi')}
              className={`flex-1 py-2 px-3 rounded-lg text-label-md font-label-md flex items-center justify-center gap-2 border transition-all ${
                paymentMethod === 'upi'
                  ? 'bg-secondary text-on-secondary border-secondary font-semibold'
                  : 'bg-surface border-outline-variant text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              UPI / QR
            </button>
          </div>

          {paymentMethod === 'card' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                  Card Holder Name
                </label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                  Card Number (Mock)
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                    placeholder="MM/YY"
                    required
                  />
                </div>
                <div>
                  <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-label-sm font-label-sm text-on-surface-variant mb-1">
                  UPI ID (Mock)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                  required
                />
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-error-container text-on-error-container text-body-sm rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3 bg-secondary text-on-secondary rounded-lg text-label-md font-label-md font-semibold hover:bg-on-secondary-fixed-variant transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  <span>Pay {formatCurrency(amount)} Now</span>
                </>
              )}
            </button>
            <p className="text-center text-label-sm font-label-sm text-on-surface-variant mt-2">
              🔒 Standard Mock Payment Sandbox
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
