import { User } from 'firebase/auth';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { FormEvent, useEffect, useState } from 'react';
import {
  CartItem,
  CurrencyCode,
  formatPrice,
  FREE_DELIVERY_THRESHOLD_PKR,
  KARACHI_ZONES,
  OrderRecord,
  PaymentMethod,
  PROMO_CODES,
  STORE_WHATSAPP_NUMBER,
} from '../data/products';
import { GarmentImage } from './GarmentImage';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  currency: CurrencyCode;
  selectedZoneId: string;
  appliedPromoCode: string | null;
  onApplyPromoCode: (code: string | null) => void;
  user: User | null;
  onSignInGoogle: () => Promise<void>;
  onChangeZone: (zoneId: string) => void;
  onClose: () => void;
  onUpdateQuantity: (productId: string, size: string, color: string, delta: number) => void;
  onRemoveItem: (productId: string, size: string, color: string) => void;
  onOrderComplete: (order: OrderRecord) => Promise<void> | void;
  onProceedToCheckout: () => void;
}

type DrawerStep = 'bag' | 'checkout' | 'confirmation';

export function CartDrawer({
  isOpen,
  items,
  currency,
  selectedZoneId,
  appliedPromoCode,
  onApplyPromoCode,
  user,
  onSignInGoogle,
  onChangeZone,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onOrderComplete,
  onProceedToCheckout,
}: CartDrawerProps) {
  const [step, setStep] = useState<DrawerStep>('bag');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash on Delivery');
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [formError, setFormError] = useState('');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName((prev) => prev || user.displayName || '');
      setEmail((prev) => prev || user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen && step === 'confirmation') {
      setStep('bag');
    }
  }, [isOpen, step]);

  const activeZone =
    KARACHI_ZONES.find((z) => z.id === selectedZoneId) ?? KARACHI_ZONES[0];

  const subtotalPkr = items.reduce(
    (sum, item) => sum + item.product.pricePkr * item.quantity,
    0
  );

  const promoDef = appliedPromoCode ? PROMO_CODES[appliedPromoCode] : undefined;
  let discountPkr = 0;
  if (promoDef && subtotalPkr >= promoDef.minSubtotalPkr) {
    if (promoDef.type === 'percent') {
      discountPkr = Math.round((subtotalPkr * promoDef.value) / 100);
    } else if (promoDef.type === 'flat') {
      discountPkr = promoDef.value;
    }
  }

  const netSubtotalPkr = Math.max(0, subtotalPkr - discountPkr);
  const qualifiesFreeShipping =
    netSubtotalPkr >= FREE_DELIVERY_THRESHOLD_PKR ||
    subtotalPkr === 0 ||
    promoDef?.type === 'freeship';
  const shippingPkr = qualifiesFreeShipping ? 0 : activeZone.feePkr;
  const totalPkr = netSubtotalPkr + shippingPkr;
  const remainingForFreeShipping = Math.max(
    0,
    FREE_DELIVERY_THRESHOLD_PKR - netSubtotalPkr
  );
  const progressPercent = Math.min(
    100,
    (netSubtotalPkr / FREE_DELIVERY_THRESHOLD_PKR) * 100
  );

  const handleApplyPromo = (e: FormEvent) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    const matched = PROMO_CODES[code];
    if (!matched) {
      setPromoMessage('Invalid code. Try COZA10, KARACHI500, or FREESHIP.');
      return;
    }
    if (subtotalPkr < matched.minSubtotalPkr) {
      setPromoMessage(
        `${code} requires a minimum subtotal of ${formatPrice(matched.minSubtotalPkr, currency)}.`
      );
      return;
    }
    onApplyPromoCode(code);
    setPromoMessage(`${matched.label} applied.`);
    setPromoInput('');
  };

  const whatsappSummary = [
    'Assalam-o-Alaikum COZA STORE! Order Summary:',
    ...items.map(
      (i) =>
        `• ${i.product.name} (${i.color}, Size ${i.size}) x${i.quantity} = ${formatPrice(
          i.product.pricePkr * i.quantity,
          currency
        )}`
    ),
    `Delivery Zone: ${activeZone.label} (${activeZone.eta})`,
    discountPkr > 0 ? `Promo (${appliedPromoCode}): -${formatPrice(discountPkr, currency)}` : '',
    `Delivery Fee: ${shippingPkr === 0 ? 'Free' : formatPrice(shippingPkr, currency)}`,
    `Total: ${formatPrice(totalPkr, currency)}`,
  ]
    .filter(Boolean)
    .join('\n');

  const whatsappUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    whatsappSummary
  )}`;

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(whatsappSummary);
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 1800);
    } catch {
      setCopiedWhatsApp(false);
    }
  };

  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !postalCode.trim()
    ) {
      setFormError('Please complete all customer and delivery address fields.');
      return;
    }
    if (
      (paymentMethod === 'JazzCash' || paymentMethod === 'Easypaisa') &&
      !transactionId.trim()
    ) {
      setFormError(
        `Please enter your ${paymentMethod} Transaction Reference ID (TID).`
      );
      return;
    }
    setFormError('');

    const orderNumber = `CZ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: OrderRecord = {
      orderNumber,
      placedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      customerName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      zoneLabel: activeZone.label,
      address: `${address.trim()}, ${postalCode.trim()}`,
      paymentMethod,
      transactionId:
        paymentMethod === 'JazzCash' || paymentMethod === 'Easypaisa'
          ? transactionId.trim()
          : undefined,
      promoCode: appliedPromoCode ?? undefined,
      discountPkr,
      items: [...items],
      subtotalPkr,
      shippingPkr,
      totalPkr,
      status: user ? 'Pending' : 'Confirmed — Preparing Dispatch',
    };

    setSubmitting(true);
    try {
      await onOrderComplete(newOrder);
      setConfirmedOrder(newOrder);
      onApplyPromoCode(null);
      setPromoMessage('');
      setTransactionId('');
      setStep('confirmation');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to save order right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cart-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Shopping Bag"
          onClick={onClose}
        >
          <motion.div
            key="cart-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('bag')}
                aria-label="Back to bag"
                className="w-8 h-8 flex items-center justify-center text-neutral-600 hover:text-neutral-950"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            <h2 className="font-display text-base font-semibold text-neutral-900">
              {step === 'bag' && 'Shopping Bag'}
              {step === 'checkout' && 'Karachi & Nationwide Checkout'}
              {step === 'confirmation' && 'Order Confirmed'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close shopping bag"
            className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-neutral-950 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Step 1: Bag Contents */}
        {step === 'bag' && (
          <>
            {items.length > 0 && (
              <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-200">
                <p className="text-xs text-neutral-700 mb-2">
                  {qualifiesFreeShipping
                    ? 'Your order qualifies for complimentary Karachi & nationwide delivery.'
                    : `Add ${formatPrice(remainingForFreeShipping, currency)} more for free delivery.`}
                </p>
                <div className="w-full h-1.5 bg-neutral-200 overflow-hidden">
                  <div
                    className="h-full bg-[#717fe0] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <ShoppingBag className="w-10 h-10 text-neutral-300 mb-3 stroke-[1.5]" aria-hidden="true" />
                  <p className="text-sm font-medium text-neutral-900 mb-1">
                    Your bag is currently empty
                  </p>
                  <p className="text-xs text-neutral-500 mb-6 max-w-[240px]">
                    Explore our seasonal essentials and add your favorite silhouettes to get started.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-semibold hover:bg-[#717fe0] transition-colors"
                  >
                    Browse Collection
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <ul className="divide-y divide-neutral-200">
                    {items.map((item) => (
                      <li
                        key={`${item.product.id}-${item.size}-${item.color}`}
                        className="py-4 first:pt-0 flex gap-4"
                      >
                        <div className="relative w-20 h-24 bg-[#efefef] shrink-0 overflow-hidden">
                          <GarmentImage
                            product={item.product}
                            colorName={item.color}
                            alt={`${item.product.name} (${item.color})`}
                            className="w-full h-full object-cover object-top"
                            fallbackLabel={item.product.name}
                          />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-neutral-900 truncate">
                                {item.product.name}
                              </p>
                              <p className="text-xs text-neutral-500 mt-0.5">
                                Size {item.size} · {item.color}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                onRemoveItem(item.product.id, item.size, item.color)
                              }
                              aria-label={`Remove ${item.product.name}`}
                              className="text-neutral-400 hover:text-neutral-800 p-1"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-neutral-300 h-8">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQuantity(
                                    item.product.id,
                                    item.size,
                                    item.color,
                                    -1
                                  )
                                }
                                aria-label="Decrease item quantity"
                                className="w-7 h-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100"
                              >
                                <Minus className="w-3 h-3" aria-hidden="true" />
                              </button>
                              <span className="w-7 text-center text-xs font-medium tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQuantity(
                                    item.product.id,
                                    item.size,
                                    item.color,
                                    1
                                  )
                                }
                                aria-label="Increase item quantity"
                                className="w-7 h-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100"
                              >
                                <Plus className="w-3 h-3" aria-hidden="true" />
                              </button>
                            </div>

                            <span className="text-sm font-medium text-neutral-900 tabular-nums">
                              {formatPrice(item.product.pricePkr * item.quantity, currency)}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Karachi Delivery Zone Selector */}
                  <div className="pt-4 border-t border-neutral-200">
                    <label
                      htmlFor="bag-zone-select"
                      className="block text-xs font-semibold text-neutral-800 mb-1.5"
                    >
                      Delivery Area (Karachi / Nationwide)
                    </label>
                    <select
                      id="bag-zone-select"
                      value={selectedZoneId}
                      onChange={(e) => onChangeZone(e.target.value)}
                      className="w-full h-10 px-3 text-xs border border-neutral-300 bg-white focus:outline-none focus:border-[#717fe0]"
                    >
                      {KARACHI_ZONES.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.label} — {formatPrice(zone.feePkr, currency)}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Estimated dispatch: {activeZone.eta}
                    </p>
                  </div>

                  {/* Promo Code Input */}
                  <div className="pt-2">
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag
                          className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2"
                          aria-hidden="true"
                        />
                        <label htmlFor="promo-code-input" className="sr-only">
                          Promo code
                        </label>
                        <input
                          id="promo-code-input"
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          placeholder="Promo code (COZA10, KARACHI500)"
                          className="w-full h-9 pl-8 pr-3 text-xs border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                        />
                      </div>
                      <button
                        type="submit"
                        className="h-9 px-4 border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white text-xs font-semibold transition-colors"
                      >
                        Apply
                      </button>
                    </form>
                    {(promoMessage || appliedPromoCode) && (
                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <p className="text-[11px] text-neutral-600">
                          {promoMessage ||
                            (promoDef ? `${promoDef.label} applied.` : '')}
                        </p>
                        {appliedPromoCode && (
                          <button
                            type="button"
                            onClick={() => {
                              onApplyPromoCode(null);
                              setPromoMessage('');
                            }}
                            className="text-[11px] text-[#717fe0] hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-neutral-200 bg-white space-y-3">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal</span>
                    <span className="tabular-nums font-medium text-neutral-900">
                      {formatPrice(subtotalPkr, currency)}
                    </span>
                  </div>
                  {discountPkr > 0 && (
                    <div className="flex justify-between text-emerald-700 text-xs">
                      <span>Discount ({appliedPromoCode})</span>
                      <span className="tabular-nums font-medium">
                        -{formatPrice(discountPkr, currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-600">
                    <span>Delivery ({activeZone.eta.split('(')[0].trim()})</span>
                    <span className="tabular-nums">
                      {shippingPkr === 0 ? 'Free' : formatPrice(shippingPkr, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-neutral-900 pt-2 border-t border-neutral-100">
                    <span>Total</span>
                    <span className="tabular-nums">
                      {formatPrice(totalPkr, currency)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onProceedToCheckout();
                  }}
                  className="w-full h-11 bg-[#161618] hover:bg-[#717fe0] text-white text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#717fe0]"
                >
                  Proceed to Payment Page
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 border border-emerald-700 text-emerald-800 hover:bg-emerald-700 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    Order via WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyWhatsApp}
                    className="h-10 border border-neutral-300 text-neutral-700 hover:border-neutral-900 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    {copiedWhatsApp ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                        Copied Summary
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                        Copy Summary
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Step 2: Checkout Form with JazzCash / Easypaisa / COD / Card */}
        {step === 'checkout' && (
          <form
            onSubmit={handleCheckoutSubmit}
            className="flex-1 overflow-y-auto px-6 py-5 flex flex-col justify-between gap-5"
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-neutral-800 mb-2">
                  Payment Method
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      'Cash on Delivery',
                      'JazzCash',
                      'Easypaisa',
                      'Card',
                    ] as const
                  ).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`h-10 px-3 text-xs font-medium border transition-colors ${
                        paymentMethod === method
                          ? 'border-[#717fe0] bg-[#717fe0]/10 text-[#4c58b6]'
                          : 'border-neutral-300 text-neutral-700 hover:border-neutral-900'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {(paymentMethod === 'JazzCash' || paymentMethod === 'Easypaisa') && (
                <div className="p-3.5 bg-neutral-50 border border-neutral-200 space-y-2.5">
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    Send <span className="font-semibold tabular-nums">{formatPrice(totalPkr, currency)}</span> via{' '}
                    <span className="font-semibold">{paymentMethod}</span> to:
                    <br />
                    Account Title: <span className="font-semibold">COZA STUDIO KARACHI</span>
                    <br />
                    Mobile Account: <span className="font-semibold tabular-nums">0300-3584194</span>
                  </p>
                  <div>
                    <label
                      htmlFor="checkout-tid"
                      className="block text-xs font-medium text-neutral-700 mb-1"
                    >
                      {paymentMethod} Transaction ID (TID)
                    </label>
                    <input
                      id="checkout-tid"
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. TID-84920144"
                      className="w-full h-9 px-3 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label htmlFor="checkout-zone" className="block text-xs font-medium text-neutral-700 mb-1">
                    Delivery Zone
                  </label>
                  <select
                    id="checkout-zone"
                    value={selectedZoneId}
                    onChange={(e) => onChangeZone(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-neutral-300 bg-white focus:outline-none focus:border-[#717fe0]"
                  >
                    {KARACHI_ZONES.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="checkout-name" className="block text-xs font-medium text-neutral-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ayesha Khan"
                    className="w-full h-10 px-3 text-sm border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="checkout-email" className="block text-xs font-medium text-neutral-700 mb-1">
                      Email
                    </label>
                    <input
                      id="checkout-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ayesha@example.com"
                      className="w-full h-10 px-3 text-sm border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                    />
                  </div>

                  <div>
                    <label htmlFor="checkout-phone" className="block text-xs font-medium text-neutral-700 mb-1">
                      Mobile Number
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300 2345678"
                      className="w-full h-10 px-3 text-sm border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="checkout-address" className="block text-xs font-medium text-neutral-700 mb-1">
                    Street Address
                  </label>
                  <input
                    id="checkout-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House 14, Block 5 Clifton, Karachi"
                    className="w-full h-10 px-3 text-sm border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                  />
                </div>

                <div>
                  <label htmlFor="checkout-postal" className="block text-xs font-medium text-neutral-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    id="checkout-postal"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="75600"
                    className="w-full h-10 px-3 text-sm border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                  />
                </div>
              </div>

              {!user && (
                <div className="p-3 bg-neutral-50 border border-neutral-200 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-neutral-600 leading-snug">
                    Sign in with Google to save this order permanently to your account &amp; Admin tracking.
                  </p>
                  <button
                    type="button"
                    onClick={() => void onSignInGoogle()}
                    className="h-8 px-3 bg-neutral-900 hover:bg-[#717fe0] text-white text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {formError && (
                <p role="alert" className="text-xs text-red-600 font-medium">
                  {formError}
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-neutral-200 space-y-3">
              <div className="flex justify-between text-sm font-semibold text-neutral-900">
                <span>Order Total ({paymentMethod})</span>
                <span className="tabular-nums">{formatPrice(totalPkr, currency)}</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-[#717fe0] hover:bg-[#5b69cf] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
              >
                {submitting ? 'Submitting Order...' : 'Place Order'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Confirmation Receipt */}
        {step === 'confirmation' && confirmedOrder && (
          <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-3 text-emerald-700">
                <CheckCircle2 className="w-7 h-7 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs font-medium text-neutral-500">
                    Order #{confirmedOrder.orderNumber}
                  </p>
                  <h3 className="font-display text-lg font-semibold text-neutral-900">
                    {confirmedOrder.status}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-neutral-600 leading-relaxed">
                Thank you, {confirmedOrder.customerName}. Dispatch confirmation prepared for{' '}
                <span className="font-medium text-neutral-900">{confirmedOrder.email}</span>.
              </p>

              <div className="border border-neutral-200 p-4 space-y-2 text-xs text-neutral-600">
                <div className="flex justify-between gap-3">
                  <span>Delivery Zone</span>
                  <span className="text-neutral-900 font-medium text-right">
                    {confirmedOrder.zoneLabel}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Address</span>
                  <span className="text-neutral-900 font-medium text-right max-w-[200px]">
                    {confirmedOrder.address}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method</span>
                  <span className="text-neutral-900 font-medium">
                    {confirmedOrder.paymentMethod}
                    {confirmedOrder.transactionId ? ` (${confirmedOrder.transactionId})` : ''}
                  </span>
                </div>
                {confirmedOrder.discountPkr > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Promo ({confirmedOrder.promoCode})</span>
                    <span className="tabular-nums">
                      -{formatPrice(confirmedOrder.discountPkr, currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-neutral-100 text-sm font-semibold text-neutral-900">
                  <span>Order Total</span>
                  <span className="tabular-nums">
                    {formatPrice(confirmedOrder.totalPkr, currency)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full h-11 bg-neutral-900 hover:bg-[#717fe0] text-white text-sm font-semibold transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
