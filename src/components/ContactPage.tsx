import { User } from 'firebase/auth';
import {
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import { motion } from 'motion/react';
import { FormEvent, useEffect, useState } from 'react';
import {
  CurrencyCode,
  formatPrice,
  KARACHI_ZONES,
  STORE_WHATSAPP_NUMBER,
  STUDIO_INTERIOR_IMAGE,
} from '../data/products';
import { ResilientImage } from './ResilientImage';

export interface ContactSubmission {
  name: string;
  email: string;
  topic: string;
  orderNumber?: string;
  message: string;
}

interface ContactPageProps {
  user: User | null;
  currency: CurrencyCode;
  onSignInGoogle: () => Promise<void>;
  onSubmitInquiry: (inquiry: ContactSubmission) => Promise<void>;
}

const TOPICS = [
  'Order & Delivery Inquiry',
  'Size & Fit Guidance',
  'Returns & Exchanges',
  'Studio Appointment (DHA Phase 5)',
  'Bulk / Corporate Orders',
];

const LUXURY_EASE = [0.16, 1, 0.3, 1] as const;

export function ContactPage({
  user,
  currency,
  onSignInGoogle,
  onSubmitInquiry,
}: ContactPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [orderNumber, setOrderNumber] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sentConfirmation, setSentConfirmation] = useState('');

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.displayName || '');
      setEmail((prev) => prev || user.email || '');
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please enter your name, email address, and message.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await onSubmitInquiry({
        name: name.trim(),
        email: email.trim(),
        topic,
        orderNumber: orderNumber.trim() || undefined,
        message: message.trim(),
      });
      setSentConfirmation(
        user
          ? 'Your message has been saved to our studio desk. Our Karachi team typically replies within 2 business hours.'
          : 'Thank you for reaching out! Your message has been received — for instant replies, you can also chat with us on WhatsApp.'
      );
      setOrderNumber('');
      setMessage('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to send message right now.'
      );
    } finally {
      setSending(false);
    }
  };

  const whatsappContactUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Assalam-o-Alaikum COZA STORE Karachi! I have a question regarding an order or product.'
  )}`;

  return (
    <div className="bg-white">
      {/* Page Banner */}
      <section className="relative h-[220px] sm:h-[270px] w-full overflow-hidden bg-neutral-900">
        <motion.div
          initial={{ scale: 1.06, opacity: 0.85 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: LUXURY_EASE }}
          className="w-full h-full"
        >
          <ResilientImage
            src={STUDIO_INTERIOR_IMAGE}
            alt="COZA STORE DHA Phase 5 Karachi flagship studio"
            className="w-full h-full object-cover object-center opacity-55"
            fallbackLabel="Contact COZA STORE"
          />
        </motion.div>
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-neutral-950/75 via-neutral-950/45 to-neutral-950/50"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: LUXURY_EASE }}
            className="text-xs font-medium tracking-wide text-neutral-300 mb-2"
          >
            DHA Phase 5 · Karachi Flagship
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: LUXURY_EASE }}
            className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-semibold text-white tracking-[-0.015em]"
            style={{ textWrap: 'balance' }}
          >
            Contact Us
          </motion.h1>
        </div>
      </section>

      {/* Main 2-Column Contact Workspace */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: 0.5, ease: LUXURY_EASE }}
        className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 border border-neutral-200">
          {/* Left: Message Form */}
          <div className="p-7 sm:p-11 border-b lg:border-b-0 lg:border-r border-neutral-200">
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-neutral-900 mb-2">
              Send Us A Message
            </h2>
            <p className="text-sm text-neutral-500 mb-7">
              Questions about sizing, same-day Karachi dispatch, or custom studio appointments? Write to our team directly.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-medium text-neutral-700 mb-1.5"
                  >
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ayesha Khan"
                    className="w-full h-11 px-3.5 text-sm border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-medium text-neutral-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ayesha@example.com"
                    className="w-full h-11 px-3.5 text-sm border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contact-topic"
                    className="block text-xs font-medium text-neutral-700 mb-1.5"
                  >
                    Inquiry Topic
                  </label>
                  <select
                    id="contact-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full h-11 px-3 text-sm border border-neutral-300 bg-white focus:outline-none focus:border-[#717fe0]"
                  >
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="contact-order"
                    className="block text-xs font-medium text-neutral-700 mb-1.5"
                  >
                    Order # (Optional)
                  </label>
                  <input
                    id="contact-order"
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. CZ-1042"
                    className="w-full h-11 px-3.5 text-sm border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-medium text-neutral-700 mb-1.5"
                >
                  How Can We Help?
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your order, sizing question, or preferred Karachi delivery window..."
                  className="w-full p-3.5 text-sm border border-neutral-300 focus:outline-none focus:border-[#717fe0] resize-y"
                />
              </div>

              {error && (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {error}
                </p>
              )}

              {sentConfirmation && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{sentConfirmation}</span>
                </div>
              )}

              {!user && (
                <div className="p-3.5 bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Sign in with Google to save your inquiry directly to our Karachi studio desk, or message us on WhatsApp below.
                  </p>
                  <button
                    type="button"
                    onClick={() => void onSignInGoogle()}
                    className="h-9 px-3.5 bg-neutral-900 hover:bg-[#717fe0] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    Sign In
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 h-11 px-6 bg-[#161618] hover:bg-[#717fe0] disabled:opacity-60 text-white text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  {sending ? 'Sending...' : 'Submit Message'}
                </button>

                <a
                  href={whatsappContactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 px-5 border border-emerald-700 text-emerald-800 hover:bg-emerald-700 hover:text-white text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  Chat on WhatsApp
                </a>
              </div>
            </form>
          </div>

          {/* Right: Studio Location, Direct Contact & Delivery Schedule */}
          <div className="p-7 sm:p-11 bg-neutral-50/50 flex flex-col justify-between gap-8">
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-neutral-900 mb-2">
                  Karachi Flagship &amp; Support
                </h2>
                <p className="text-sm text-neutral-500">
                  Walk in for tailored fittings, pickup, or in-person size exchanges.
                </p>
              </div>

              <div className="space-y-5 pt-2">
                <div className="flex items-start gap-3.5">
                  <MapPin className="w-4 h-4 text-[#717fe0] shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      Studio Address
                    </p>
                    <p className="text-sm text-neutral-600 mt-0.5 leading-relaxed">
                      Building 14-C, 26th Street, Badar Commercial Area
                      <br />
                      DHA Phase 5, Karachi 75500
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Phone className="w-4 h-4 text-[#717fe0] shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      Let&rsquo;s Talk
                    </p>
                    <p className="text-sm text-neutral-600 mt-0.5 tabular-nums">
                      Studio Desk: +92 (21) 3584-0194
                      <br />
                      WhatsApp Support: +92 300 3584194
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Mail className="w-4 h-4 text-[#717fe0] shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      Customer Care Email
                    </p>
                    <p className="text-sm text-[#717fe0] mt-0.5">
                      care@cozastore.pk
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <Clock className="w-4 h-4 text-[#717fe0] shrink-0 mt-1" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      Studio Hours
                    </p>
                    <p className="text-sm text-neutral-600 mt-0.5 tabular-nums">
                      Monday – Saturday: 11:00 AM – 9:00 PM
                      <br />
                      Sunday: 2:00 PM – 8:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Karachi Courier Rate Schedule */}
            <div className="pt-6 border-t border-neutral-200">
              <p className="text-xs font-semibold text-neutral-900 mb-3">
                Karachi &amp; Nationwide Dispatch Rates (Free over {formatPrice(5000, currency)})
              </p>
              <div className="border border-neutral-200 bg-white divide-y divide-neutral-200 text-xs">
                {KARACHI_ZONES.map((zone) => (
                  <div
                    key={zone.id}
                    className="px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors duration-150 hover:bg-neutral-50"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">{zone.label}</p>
                      <p className="text-[11px] text-neutral-500">{zone.eta}</p>
                    </div>
                    <span className="font-semibold text-neutral-800 tabular-nums shrink-0">
                      {formatPrice(zone.feePkr, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
