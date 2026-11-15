import { User } from 'firebase/auth';
import { PackageCheck, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { FormEvent, useEffect, useState } from 'react';
import {
  CurrencyCode,
  FAQ_ITEMS,
  formatPrice,
  JOURNAL_ARTICLES,
  OrderRecord,
} from '../data/products';
import { StoredOrderSummary } from '../firebase';
import { InfoModalTab } from './Header';

interface InfoModalProps {
  activeTab: InfoModalTab | null;
  currency: CurrencyCode;
  user: User | null;
  recentOrders: OrderRecord[];
  userOrders: StoredOrderSummary[];
  onSignInGoogle: () => Promise<void>;
  onClose: () => void;
  onChangeTab: (tab: InfoModalTab) => void;
}

const SAMPLE_ORDER_NUMBER = 'CZ-1042';

export function InfoModal({
  activeTab,
  currency,
  user,
  recentOrders,
  userOrders,
  onSignInGoogle,
  onClose,
  onChangeTab,
}: InfoModalProps) {
  const [lookupInput, setLookupInput] = useState('');
  const [lookupResult, setLookupResult] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTab) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeTab, onClose]);

  const lookupOrderByCode = (rawCode: string) => {
    const cleaned = rawCode.trim().toUpperCase().replace(/^#/, '');
    if (!cleaned) {
      setLookupResult('Enter an order number such as CZ-1042.');
      return;
    }

    const storedMatch = userOrders.find(
      (o) => o.orderNumber.toUpperCase() === cleaned
    );
    if (storedMatch) {
      const itemsText = storedMatch.itemsSummary
        .map((i) => `${i.name} x${i.quantity}`)
        .join(', ');
      setLookupResult(
        `Order #${storedMatch.orderNumber} (${storedMatch.placedAt}) — Status: ${storedMatch.status}. Zone: ${storedMatch.zoneLabel}. Items: ${itemsText}.`
      );
      return;
    }

    const sessionMatch = recentOrders.find(
      (o) => o.orderNumber.toUpperCase() === cleaned
    );
    if (sessionMatch) {
      setLookupResult(
        `Order #${sessionMatch.orderNumber} (${sessionMatch.placedAt}) — ${sessionMatch.status}. Shipping to ${sessionMatch.address}.`
      );
      return;
    }

    if (cleaned === SAMPLE_ORDER_NUMBER) {
      setLookupResult(
        'Order #CZ-1042 — Out for Delivery via DHA & Clifton Express. Estimated arrival within 4–6 hours.'
      );
      return;
    }

    setLookupResult(
      `No active shipment found for "#${cleaned}". Place an order, sign in to load saved orders, or try ${SAMPLE_ORDER_NUMBER}.`
    );
  };

  const handleTrackSubmit = (e: FormEvent) => {
    e.preventDefault();
    lookupOrderByCode(lookupInput);
  };

  const tabs: { id: InfoModalTab; label: string }[] = [
    { id: 'journal', label: 'Journal' },
    { id: 'about', label: 'About' },
    { id: 'faq', label: 'Help & FAQs' },
    { id: 'track', label: 'Track Order' },
  ];

  return (
    <AnimatePresence>
      {activeTab && (
        <motion.div
          key="info-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Store information"
          onClick={onClose}
        >
          <motion.div
            key="info-modal-panel"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl bg-white shadow-2xl max-h-[88vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-5 overflow-x-auto">
                {tabs.map((tab) => {
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onChangeTab(tab.id)}
                      className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'text-[#717fe0]'
                          : 'text-neutral-600 hover:text-neutral-950'
                      }`}
                    >
                      {tab.label}
                      {isSelected && (
                        <motion.span
                          layoutId="infomodal-tab-underline"
                          transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                          className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#717fe0]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-9 h-9 flex items-center justify-center text-neutral-500 hover:text-neutral-950 shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {activeTab === 'journal' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-semibold text-neutral-900">
                  Studio Journal
                </h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Notes on textiles, seasonal proportions, and long-term garment care.
                </p>
              </div>
              <div className="divide-y divide-neutral-200">
                {JOURNAL_ARTICLES.map((article) => (
                  <article key={article.id} className="py-5 first:pt-2 last:pb-0">
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1.5">
                      <span>{article.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{article.date}</span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-neutral-900 mb-1.5">
                      {article.title}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-semibold text-neutral-900">
                About COZA STORE
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Founded as an independent contemporary wardrobe house, COZA STORE focuses on quiet proportions, breathable natural fibers, and small-batch footwear and leather goods designed for multi-year daily wear.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-neutral-200">
                <div>
                  <p className="font-display text-xl font-semibold text-neutral-900 tabular-nums">
                    100%
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Traceable natural cotton, wool, and full-grain hides
                  </p>
                </div>
                <div>
                  <p className="font-display text-xl font-semibold text-neutral-900 tabular-nums">
                    30 Days
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Complimentary size exchanges and straightforward returns
                  </p>
                </div>
                <div>
                  <p className="font-display text-xl font-semibold text-neutral-900 tabular-nums">
                    48 Hours
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Dispatch turnaround from our studio warehouse
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-semibold text-neutral-900">
                Help &amp; Frequently Asked Questions
              </h2>
              <div className="divide-y divide-neutral-200">
                {FAQ_ITEMS.map((item) => (
                  <div key={item.question} className="py-4 first:pt-1 last:pb-0">
                    <h3 className="text-sm font-semibold text-neutral-900 mb-1.5">
                      {item.question}
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'track' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-semibold text-neutral-900">
                  Track Your Order
                </h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Enter your order reference (for example, {SAMPLE_ORDER_NUMBER}) to view live dispatch progress.
                </p>
              </div>

              <form onSubmit={handleTrackSubmit} className="flex gap-2">
                <label htmlFor="track-order-input" className="sr-only">
                  Order Number
                </label>
                <input
                  id="track-order-input"
                  type="text"
                  value={lookupInput}
                  onChange={(e) => setLookupInput(e.target.value)}
                  placeholder="Order number (e.g. CZ-1042)"
                  className="flex-1 h-10 px-3 text-sm border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                />
                <button
                  type="submit"
                  className="h-10 px-5 bg-[#717fe0] hover:bg-[#5b69cf] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  Check Status
                </button>
              </form>

              {lookupResult && (
                <div className="p-4 bg-neutral-50 border border-neutral-200 text-sm text-neutral-800 flex items-start gap-2.5">
                  <PackageCheck className="w-4 h-4 text-[#717fe0] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{lookupResult}</span>
                </div>
              )}

              {!user && (
                <div className="p-3.5 bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-3">
                  <p className="text-xs text-neutral-600">
                    Sign in with Google to track all saved orders and live studio updates.
                  </p>
                  <button
                    type="button"
                    onClick={() => void onSignInGoogle()}
                    className="h-8 px-3 bg-neutral-900 hover:bg-[#717fe0] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {userOrders.length > 0 && (
                <div className="pt-4 border-t border-neutral-200 space-y-3">
                  <h3 className="text-xs font-semibold text-neutral-700">
                    Your Live Account Orders ({userOrders.length})
                  </h3>
                  <ul className="space-y-2">
                    {userOrders.map((order) => (
                      <li
                        key={order.id}
                        className="p-3 border border-neutral-200 text-xs flex items-center justify-between gap-4"
                      >
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setLookupInput(order.orderNumber);
                              lookupOrderByCode(order.orderNumber);
                            }}
                            className="font-semibold text-neutral-900 hover:text-[#717fe0] text-left"
                          >
                            Order #{order.orderNumber} — {order.status}
                          </button>
                          <p className="text-neutral-500 mt-0.5">
                            {order.zoneLabel} · {order.paymentMethod}
                          </p>
                        </div>
                        <span className="font-semibold text-neutral-900 tabular-nums shrink-0">
                          {formatPrice(order.totalPkr, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recentOrders.length > 0 && (
                <div className="pt-4 border-t border-neutral-200 space-y-3">
                  <h3 className="text-xs font-semibold text-neutral-700">
                    Orders Placed This Session
                  </h3>
                  <ul className="space-y-2">
                    {recentOrders.map((order) => (
                      <li
                        key={order.orderNumber}
                        className="p-3 border border-neutral-200 text-xs flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="font-semibold text-neutral-900">
                            Order #{order.orderNumber} — {order.status}
                          </p>
                          <p className="text-neutral-500 mt-0.5">
                            {order.items.length} item(s) · {order.paymentMethod}
                          </p>
                        </div>
                        <span className="font-semibold text-neutral-900 tabular-nums">
                          {formatPrice(order.totalPkr, currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
