import { User } from 'firebase/auth';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Lock,
  MessageCircle,
  Minus,
  Plus,
  Printer,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Tag,
  Trash2,
  Truck,
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

interface CheckoutPageProps {
  items: CartItem[];
  currency: CurrencyCode;
  selectedZoneId: string;
  appliedPromoCode: string | null;
  onApplyPromoCode: (code: string | null) => void;
  user: User | null;
  onSignInGoogle: () => Promise<void>;
  onChangeZone: (zoneId: string) => void;
  onUpdateQuantity: (
    productId: string,
    size: string,
    color: string,
    delta: number
  ) => void;
  onRemoveItem: (productId: string, size: string, color: string) => void;
  onOrderComplete: (order: OrderRecord) => Promise<void> | void;
  onContinueShopping: () => void;
  onTrackOrder: () => void;
}

const LUXURY_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function CheckoutPage({
  items,
  currency,
  selectedZoneId,
  appliedPromoCode,
  onApplyPromoCode,
  user,
  onSignInGoogle,
  onChangeZone,
  onUpdateQuantity,
  onRemoveItem,
  onOrderComplete,
  onContinueShopping,
  onTrackOrder,
}: CheckoutPageProps) {
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('Cash on Delivery');
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const [copiedAccount, setCopiedAccount] = useState(false);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    if (user) {
      setFullName((prev) => prev || user.displayName || '');
      setEmail((prev) => prev || user.email || '');
      setCardName((prev) => prev || user.displayName || '');
    }
  }, [user]);

  const activeZone =
    KARACHI_ZONES.find((z) => z.id === selectedZoneId) ?? KARACHI_ZONES[0];

  const subtotalPkr = items.reduce(
    (sum, item) => sum + item.product.pricePkr * item.quantity,
    0
  );

  const promoDef = appliedPromoCode
    ? PROMO_CODES[appliedPromoCode]
    : undefined;
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
        `${code} requires a minimum subtotal of ${formatPrice(
          matched.minSubtotalPkr,
          currency
        )}.`
      );
      return;
    }
    onApplyPromoCode(code);
    setPromoMessage(`${matched.label} applied.`);
    setPromoInput('');
  };

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText('0300-3584194');
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 1800);
    } catch {
      setCopiedAccount(false);
    }
  };

  const handleFormatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    const grouped = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(grouped);
  };

  const handleFormatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`);
    } else {
      setCardExpiry(digits);
    }
  };

  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (
      !fullName.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !postalCode.trim()
    ) {
      setFormError(
        'Please complete your name, contact details, and full delivery address.'
      );
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

    let safeReference: string | undefined;
    if (paymentMethod === 'Card') {
      const rawDigits = cardNumber.replace(/\s+/g, '');
      if (!cardName.trim() || rawDigits.length < 12 || cardExpiry.length < 5 || cardCvv.length < 3) {
        setFormError(
          'Please enter valid cardholder name, card number, expiry (MM/YY), and CVV.'
        );
        return;
      }
      safeReference = `CARD-••••${rawDigits.slice(-4)}`;
    } else if (paymentMethod === 'JazzCash' || paymentMethod === 'Easypaisa') {
      safeReference = transactionId.trim();
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
      transactionId: safeReference,
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
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to complete order right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappSummary = [
    'Assalam-o-Alaikum COZA STORE Karachi! Checkout Assistance:',
    ...items.map(
      (i) =>
        `• ${i.product.name} (${i.color}, Size ${i.size}) x${i.quantity} = ${formatPrice(
          i.product.pricePkr * i.quantity,
          currency
        )}`
    ),
    `Zone: ${activeZone.label}`,
    `Total: ${formatPrice(totalPkr, currency)}`,
  ].join('\n');

  const whatsappUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    whatsappSummary
  )}`;

  const paymentOptions: {
    id: PaymentMethod;
    title: string;
    subtitle: string;
    icon: typeof Truck;
  }[] = [
    {
      id: 'Cash on Delivery',
      title: 'Cash on Delivery',
      subtitle: 'Pay rider at your doorstep across Pakistan',
      icon: Truck,
    },
    {
      id: 'JazzCash',
      title: 'JazzCash Mobile Wallet',
      subtitle: 'Instant local transfer · Zero extra fee',
      icon: Smartphone,
    },
    {
      id: 'Easypaisa',
      title: 'Easypaisa Mobile Wallet',
      subtitle: 'Instant local transfer · Zero extra fee',
      icon: Smartphone,
    },
    {
      id: 'Card',
      title: 'Debit / Credit Card',
      subtitle: 'Visa, Mastercard & PayPak encrypted payment',
      icon: CreditCard,
    },
  ];

  return (
    <div className="bg-white min-h-[75vh]">
      {/* Top Executive Checkout Header Bar */}
      <section className="no-print bg-[#f8f7f4] border-b border-neutral-200">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={onContinueShopping}
                className="group inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 mb-3 transition-colors"
              >
                <ArrowLeft
                  className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
                <span>Back to Collection</span>
              </button>
              <h1
                className="font-editorial text-3xl sm:text-5xl font-semibold text-neutral-900 tracking-[-0.015em]"
                style={{ textWrap: 'balance' }}
              >
                {confirmedOrder ? 'Order Confirmation' : 'Checkout & Payment'}
              </h1>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-600">
              <Lock className="w-3.5 h-3.5 text-[#717fe0]" aria-hidden="true" />
              <span>Karachi Same-Day Courier · Encrypted Payment Desk</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {confirmedOrder ? (
          /* Post-Order Confirmation View */
          <motion.div
            id="checkout-confirmation-receipt"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: LUXURY_EASE }}
            className="max-w-2xl mx-auto border border-neutral-200 p-8 sm:p-11 bg-white space-y-7"
          >
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-neutral-200">
              <div className="flex items-start gap-4">
                <CheckCircle2
                  className="w-8 h-8 text-emerald-700 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-medium text-neutral-500 tabular-nums">
                    COZA STORE Karachi Invoice · Order #{confirmedOrder.orderNumber} · {confirmedOrder.placedAt}
                  </p>
                  <h2 className="font-editorial text-3xl font-semibold text-neutral-900 mt-1">
                    {confirmedOrder.status}
                  </h2>
                  <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                    Thank you, <span className="font-semibold text-neutral-900">{confirmedOrder.customerName}</span>. Dispatch confirmation prepared for{' '}
                    <span className="font-medium text-neutral-900">{confirmedOrder.email}</span>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="no-print shrink-0 inline-flex items-center gap-1.5 h-9 px-3 border border-neutral-300 hover:border-neutral-900 text-xs font-medium text-neutral-800 transition-colors whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Print / Save Invoice</span>
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Customer Contact</span>
                <span className="text-neutral-900 font-medium text-right tabular-nums">
                  {confirmedOrder.phone}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Delivery Area</span>
                <span className="text-neutral-900 font-medium text-right">
                  {confirmedOrder.zoneLabel}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Shipping Address</span>
                <span className="text-neutral-900 font-medium text-right max-w-xs">
                  {confirmedOrder.address}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-neutral-500">Payment Method</span>
                <span className="text-neutral-900 font-medium text-right">
                  {confirmedOrder.paymentMethod}
                  {confirmedOrder.transactionId
                    ? ` (${confirmedOrder.transactionId})`
                    : ''}
                </span>
              </div>
            </div>

            <div className="border-t border-b border-neutral-200 py-4 space-y-3">
              {confirmedOrder.items.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}-${item.color}`}
                  className="flex items-center justify-between gap-3 text-xs text-neutral-700"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-10 h-12 bg-[#efefef] shrink-0 overflow-hidden">
                      <GarmentImage
                        product={item.product}
                        colorName={item.color}
                        alt={item.product.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <span className="truncate">
                      {item.product.name} ({item.color}, Size {item.size}) &times;{' '}
                      {item.quantity}
                    </span>
                  </div>
                  <span className="font-semibold text-neutral-900 tabular-nums shrink-0">
                    {formatPrice(item.product.pricePkr * item.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="tabular-nums text-neutral-900 font-medium">
                  {formatPrice(confirmedOrder.subtotalPkr, currency)}
                </span>
              </div>
              {confirmedOrder.discountPkr > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Promo Discount ({confirmedOrder.promoCode})</span>
                  <span className="tabular-nums font-medium">
                    -{formatPrice(confirmedOrder.discountPkr, currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="tabular-nums text-neutral-900 font-medium">
                  {confirmedOrder.shippingPkr === 0
                    ? 'Free'
                    : formatPrice(confirmedOrder.shippingPkr, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-neutral-900 pt-2 border-t border-neutral-200">
                <span>Total Paid / Payable</span>
                <span className="tabular-nums text-lg">
                  {formatPrice(confirmedOrder.totalPkr, currency)}
                </span>
              </div>
            </div>

            <div className="no-print flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onTrackOrder}
                className="flex-1 h-11 bg-[#161618] hover:bg-[#717fe0] text-white text-xs font-semibold transition-colors"
              >
                Track Live Order Status
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="h-11 px-5 border border-neutral-300 hover:border-neutral-900 text-neutral-800 text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2"
              >
                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Print Invoice</span>
              </button>
              <button
                type="button"
                onClick={onContinueShopping}
                className="flex-1 h-11 border border-neutral-300 hover:border-neutral-900 text-neutral-800 text-xs font-semibold transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </motion.div>
        ) : items.length === 0 ? (
          /* Empty Bag Notice */
          <div className="max-w-lg mx-auto py-16 text-center border border-neutral-200 p-8 bg-[#f8f7f4]">
            <ShoppingBag
              className="w-10 h-10 text-neutral-300 mx-auto mb-3 stroke-[1.5]"
              aria-hidden="true"
            />
            <h2 className="font-editorial text-2xl font-semibold text-neutral-900 mb-2">
              Your Shopping Bag is Empty
            </h2>
            <p className="text-sm text-neutral-600 mb-6">
              Add silhouettes from our collection before proceeding to payment.
            </p>
            <button
              type="button"
              onClick={onContinueShopping}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#161618] hover:bg-[#717fe0] text-white text-xs font-semibold transition-colors"
            >
              <span>Browse Collection</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          /* 2-Column Dedicated Payment & Order Summary Workspace */
          <form
            onSubmit={handleCheckoutSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start"
          >
            {/* Left: Delivery Details & Payment Selection */}
            <div className="lg:col-span-7 space-y-10">
              {!user && (
                <div className="p-4 bg-[#f8f7f4] border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck
                      className="w-5 h-5 text-[#717fe0] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <p className="text-xs text-neutral-700 leading-relaxed">
                      Sign in with Google to save this order permanently to your COZA Account &amp; live Karachi rider tracking.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void onSignInGoogle()}
                    className="h-9 px-4 bg-[#161618] hover:bg-[#717fe0] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    Sign In with Google
                  </button>
                </div>
              )}

              {/* Step 1: Delivery Information */}
              <div className="space-y-5">
                <div className="pb-3 border-b border-neutral-200 flex items-baseline justify-between">
                  <h2 className="font-editorial text-2xl font-semibold text-neutral-900">
                    01. Shipping &amp; Contact Information
                  </h2>
                  <span className="text-xs text-neutral-500">Karachi &amp; Nationwide</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="pay-zone"
                      className="block text-xs font-semibold text-neutral-800 mb-1.5"
                    >
                      Delivery Zone
                    </label>
                    <select
                      id="pay-zone"
                      value={selectedZoneId}
                      onChange={(e) => onChangeZone(e.target.value)}
                      className="w-full h-11 px-3.5 text-sm border border-neutral-300 bg-white focus:outline-none focus:border-[#717fe0]"
                    >
                      {KARACHI_ZONES.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.label} — {zone.eta} ({formatPrice(zone.feePkr, currency)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="pay-name"
                      className="block text-xs font-semibold text-neutral-800 mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="pay-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ayesha Khan"
                      className="w-full h-11 px-3.5 text-sm border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pay-email"
                      className="block text-xs font-semibold text-neutral-800 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="pay-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ayesha@example.com"
                      className="w-full h-11 px-3.5 text-sm border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pay-phone"
                      className="block text-xs font-semibold text-neutral-800 mb-1.5"
                    >
                      Mobile Number (For Courier Calls)
                    </label>
                    <input
                      id="pay-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300 2345678"
                      className="w-full h-11 px-3.5 text-sm border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pay-postal"
                      className="block text-xs font-semibold text-neutral-800 mb-1.5"
                    >
                      Postal Code
                    </label>
                    <input
                      id="pay-postal"
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="75500"
                      className="w-full h-11 px-3.5 text-sm border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="pay-address"
                      className="block text-xs font-semibold text-neutral-800 mb-1.5"
                    >
                      Street Address &amp; Landmark
                    </label>
                    <input
                      id="pay-address"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House 14-B, Street 8, DHA Phase 5, Karachi"
                      className="w-full h-11 px-3.5 text-sm border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Payment Method */}
              <div className="space-y-5">
                <div className="pb-3 border-b border-neutral-200 flex items-baseline justify-between">
                  <h2 className="font-editorial text-2xl font-semibold text-neutral-900">
                    02. Payment Method
                  </h2>
                  <span className="text-xs text-neutral-500">All transactions verified</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {paymentOptions.map((option) => {
                    const Icon = option.icon;
                    const active = paymentMethod === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPaymentMethod(option.id)}
                        className={`p-4 border text-left transition-all duration-200 flex items-start gap-3.5 ${
                          active
                            ? 'border-[#717fe0] bg-[#717fe0]/[0.05] shadow-xs'
                            : 'border-neutral-200 hover:border-neutral-400 bg-white'
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 shrink-0 mt-0.5 ${
                            active ? 'text-[#717fe0]' : 'text-neutral-400'
                          }`}
                          aria-hidden="true"
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-semibold ${
                              active ? 'text-neutral-950' : 'text-neutral-800'
                            }`}
                          >
                            {option.title}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5 leading-snug">
                            {option.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Payment Instructions Panel */}
                <AnimatePresence mode="wait">
                  {paymentMethod === 'Cash on Delivery' && (
                    <motion.div
                      key="cod-details"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: LUXURY_EASE }}
                      className="p-5 bg-[#f8f7f4] border border-neutral-200 text-xs text-neutral-700 leading-relaxed"
                    >
                      Pay <strong className="text-neutral-900 tabular-nums">{formatPrice(totalPkr, currency)}</strong> in cash to the COZA STORE rider upon parcel inspection at your doorstep. Our rider calls 15 minutes prior to arrival.
                    </motion.div>
                  )}

                  {(paymentMethod === 'JazzCash' || paymentMethod === 'Easypaisa') && (
                    <motion.div
                      key="wallet-details"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: LUXURY_EASE }}
                      className="p-5 bg-[#f8f7f4] border border-neutral-200 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
                        <div className="text-xs text-neutral-700 space-y-1">
                          <p>
                            Transfer exact total{' '}
                            <strong className="text-neutral-950 tabular-nums">
                              {formatPrice(totalPkr, currency)}
                            </strong>{' '}
                            via <strong>{paymentMethod}</strong> to:
                          </p>
                          <p>
                            Account Title: <strong>COZA STUDIO KARACHI</strong> · Account:{' '}
                            <strong className="tabular-nums">0300-3584194</strong>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyAccountNumber}
                          className="h-9 px-3 border border-neutral-300 bg-white hover:border-neutral-900 text-xs font-medium text-neutral-800 inline-flex items-center gap-1.5 shrink-0 self-start"
                        >
                          {copiedAccount ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                              Copy Number
                            </>
                          )}
                        </button>
                      </div>

                      <div>
                        <label
                          htmlFor="pay-tid"
                          className="block text-xs font-semibold text-neutral-800 mb-1.5"
                        >
                          {paymentMethod} Transaction Reference ID (TID)
                        </label>
                        <input
                          id="pay-tid"
                          type="text"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="e.g. TID-84920144"
                          className="w-full h-11 px-3.5 text-sm bg-white border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                        />
                      </div>
                    </motion.div>
                  )}

                  {paymentMethod === 'Card' && (
                    <motion.div
                      key="card-details"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: LUXURY_EASE }}
                      className="p-5 bg-[#f8f7f4] border border-neutral-200 space-y-4"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label
                            htmlFor="card-holder"
                            className="block text-xs font-semibold text-neutral-800 mb-1.5"
                          >
                            Name on Card
                          </label>
                          <input
                            id="card-holder"
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="Ayesha Khan"
                            className="w-full h-11 px-3.5 text-sm bg-white border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label
                            htmlFor="card-number"
                            className="block text-xs font-semibold text-neutral-800 mb-1.5"
                          >
                            Card Number
                          </label>
                          <input
                            id="card-number"
                            type="text"
                            inputMode="numeric"
                            value={cardNumber}
                            onChange={(e) => handleFormatCardNumber(e.target.value)}
                            placeholder="4242 4242 4242 4242"
                            className="w-full h-11 px-3.5 text-sm bg-white border border-neutral-300 tabular-nums focus:outline-none focus:border-[#717fe0]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="card-expiry"
                            className="block text-xs font-semibold text-neutral-800 mb-1.5"
                          >
                            Expiry Date (MM/YY)
                          </label>
                          <input
                            id="card-expiry"
                            type="text"
                            inputMode="numeric"
                            value={cardExpiry}
                            onChange={(e) => handleFormatExpiry(e.target.value)}
                            placeholder="08/29"
                            className="w-full h-11 px-3.5 text-sm bg-white border border-neutral-300 tabular-nums focus:outline-none focus:border-[#717fe0]"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="card-cvv"
                            className="block text-xs font-semibold text-neutral-800 mb-1.5"
                          >
                            Security Code (CVV)
                          </label>
                          <input
                            id="card-cvv"
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) =>
                              setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                            }
                            placeholder="123"
                            className="w-full h-11 px-3.5 text-sm bg-white border border-neutral-300 tabular-nums focus:outline-none focus:border-[#717fe0]"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {formError && (
                  <p role="alert" className="text-xs font-medium text-red-600">
                    {formError}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Sticky Order Summary */}
            <aside className="lg:col-span-5 lg:sticky lg:top-24 border border-neutral-200 bg-[#f8f7f4] p-6 sm:p-8 space-y-6">
              <div className="flex items-baseline justify-between pb-4 border-b border-neutral-200">
                <h2 className="font-editorial text-2xl font-semibold text-neutral-900">
                  Order Summary
                </h2>
                <span className="text-xs text-neutral-500 tabular-nums">
                  {items.reduce((s, i) => s + i.quantity, 0)} piece(s)
                </span>
              </div>

              {/* Itemized List */}
              <ul className="divide-y divide-neutral-200 max-h-80 overflow-y-auto pr-1">
                {items.map((item) => (
                  <li
                    key={`${item.product.id}-${item.size}-${item.color}`}
                    className="py-3.5 first:pt-0 flex gap-3.5"
                  >
                    <div className="relative w-16 h-20 bg-[#efefef] shrink-0 overflow-hidden">
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
                        <div className="min-w-0">
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
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-neutral-300 bg-white h-7">
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
                            aria-label="Decrease quantity"
                            className="w-6 h-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100"
                          >
                            <Minus className="w-3 h-3" aria-hidden="true" />
                          </button>
                          <span className="w-6 text-center text-xs font-medium tabular-nums">
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
                            aria-label="Increase quantity"
                            className="w-6 h-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100"
                          >
                            <Plus className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>

                        <span className="text-xs font-semibold text-neutral-900 tabular-nums">
                          {formatPrice(item.product.pricePkr * item.quantity, currency)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Promo Code */}
              <div className="pt-2 border-t border-neutral-200">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag
                      className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleApplyPromo(e);
                        }
                      }}
                      placeholder="Promo code (COZA10, KARACHI500)"
                      className="w-full h-10 pl-8 pr-3 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="h-10 px-4 border border-neutral-900 bg-white text-neutral-900 hover:bg-neutral-900 hover:text-white text-xs font-semibold transition-colors"
                  >
                    Apply
                  </button>
                </div>
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

              {/* Price Breakdown */}
              <div className="space-y-2 text-sm border-t border-neutral-200 pt-4">
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
                <div className="flex justify-between text-base font-semibold text-neutral-950 pt-3 border-t border-neutral-200">
                  <span>Total ({paymentMethod})</span>
                  <span className="tabular-nums text-lg">
                    {formatPrice(totalPkr, currency)}
                  </span>
                </div>
              </div>

              {/* Primary Payment Submit Button */}
              <div className="space-y-2.5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-[#161618] hover:bg-[#717fe0] disabled:opacity-60 text-white text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {submitting
                      ? 'Confirming Order...'
                      : paymentMethod === 'Cash on Delivery'
                        ? 'Confirm COD Order'
                        : `Complete ${paymentMethod} Payment`}
                  </span>
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-10 border border-neutral-300 bg-white hover:border-emerald-700 text-neutral-700 hover:text-emerald-800 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  Need Help? Order via WhatsApp
                </a>
              </div>
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}
