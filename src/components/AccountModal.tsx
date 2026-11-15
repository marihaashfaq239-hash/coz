import { User } from 'firebase/auth';
import { LogOut, Package, ShieldCheck, UserCheck, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { CurrencyCode, formatPrice } from '../data/products';
import { StoredOrderSummary } from '../firebase';

interface AccountModalProps {
  isOpen: boolean;
  user: User | null;
  isAdmin: boolean;
  authReady: boolean;
  currency: CurrencyCode;
  userOrders: StoredOrderSummary[];
  onClose: () => void;
  onSignInGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onOpenAdmin: () => void;
}

export function AccountModal({
  isOpen,
  user,
  isAdmin,
  authReady,
  currency,
  userOrders,
  onClose,
  onSignInGoogle,
  onSignOut,
  onOpenAdmin,
}: AccountModalProps) {
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleSignIn = async () => {
    setBusy(true);
    setAuthError('');
    try {
      await onSignInGoogle();
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Unable to sign in right now.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await onSignOut();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="account-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="My Account"
          onClick={onClose}
        >
          <motion.div
            key="account-modal-panel"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl bg-white shadow-2xl max-h-[88vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-neutral-900">
            My Account &amp; Order History
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close account modal"
            className="w-9 h-9 flex items-center justify-center text-neutral-500 hover:text-neutral-950"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 sm:p-7 overflow-y-auto space-y-6">
          {!authReady ? (
            <p className="text-sm text-neutral-500">Checking session...</p>
          ) : !user ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-neutral-900">
                  Sign in to sync your wardrobe
                </h3>
                <p className="text-sm text-neutral-600 mt-1 leading-relaxed">
                  Save your wishlist permanently across devices, post verified product reviews, and track every Karachi delivery in real time.
                </p>
              </div>

              {authError && (
                <p role="alert" className="text-xs text-red-600 font-medium">
                  {authError}
                </p>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={handleSignIn}
                className="w-full h-11 bg-[#717fe0] hover:bg-[#5b69cf] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {busy ? 'Signing in...' : 'Continue with Google'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 font-display font-semibold">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900">
                        {user.displayName || 'Customer'}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAdmin();
                      }}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-neutral-900 hover:bg-[#717fe0] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      Admin Panel
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1.5 h-9 px-3 border border-neutral-300 hover:border-neutral-900 text-xs font-medium text-neutral-700 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    Sign Out
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-neutral-800">
                  Your Saved Orders ({userOrders.length})
                </h3>

                {userOrders.length === 0 ? (
                  <div className="py-8 text-center border border-neutral-200 bg-neutral-50">
                    <Package className="w-7 h-7 text-neutral-300 mx-auto mb-2" aria-hidden="true" />
                    <p className="text-xs text-neutral-600">
                      No orders placed under this account yet.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {userOrders.map((order) => (
                      <li
                        key={order.id}
                        className="p-4 border border-neutral-200 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-neutral-900">
                            Order #{order.orderNumber} · {order.placedAt}
                          </span>
                          <span className="font-semibold text-[#717fe0]">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-neutral-600">
                          {order.zoneLabel} · {order.paymentMethod}
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-neutral-800">
                          <span>
                            {order.itemsSummary
                              .map((i) => `${i.name} (${i.size}) x${i.quantity}`)
                              .join(', ')}
                          </span>
                          <span className="font-semibold tabular-nums shrink-0 ml-3">
                            {formatPrice(order.totalPkr, currency)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
