import {
  ArrowRight,
  ArrowUp,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Category, STORE_WHATSAPP_NUMBER } from '../data/products';
import { InfoModalTab } from './Header';

interface FooterProps {
  onSelectCategory: (category: Category) => void;
  onOpenInfo: (tab: InfoModalTab) => void;
  onNavigatePage: (page: 'store' | 'about' | 'contact' | 'checkout') => void;
  onSubscribeNewsletter: (email: string) => Promise<boolean>;
}

export function Footer({
  onSelectCategory,
  onOpenInfo,
  onNavigatePage,
  onSubscribeNewsletter,
}: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribedMessage, setSubscribedMessage] = useState('');

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    const cleaned = email.trim();
    if (!cleaned || !cleaned.includes('@')) {
      setSubscribedMessage('Please enter a valid email address.');
      return;
    }
    setSubscribing(true);
    setSubscribedMessage('');
    try {
      const savedToCloud = await onSubscribeNewsletter(cleaned);
      setSubscribedMessage(
        savedToCloud
          ? `Saved ${cleaned} to COZA STORE newsletter dispatches.`
          : `Subscribed ${cleaned} — sign in anytime to sync across devices.`
      );
      setEmail('');
    } catch {
      setSubscribedMessage('Unable to subscribe right now. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerCategories: Category[] = ['Women', 'Men', 'Bag', 'Shoes', 'Watches'];
  const paymentBadges = ['COD', 'JazzCash', 'Easypaisa', 'Visa / MC'];
  const whatsappUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    'Assalam-o-Alaikum COZA STORE Karachi! I need assistance with my order.'
  )}`;

  return (
    <footer className="no-print bg-[#161618] text-neutral-300 mt-20 border-t border-neutral-800">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Top Executive House Bar */}
        <div className="py-10 border-b border-neutral-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <button
              type="button"
              onClick={() => {
                onNavigatePage('store');
                scrollToTop();
              }}
              className="font-display text-xl tracking-tight text-white hover:text-[#98a3f5] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0]"
            >
              <span className="font-bold">COZA</span>{' '}
              <span className="font-normal text-neutral-300">STORE</span>
            </button>
            <p className="text-xs text-neutral-400 mt-1.5">
              Contemporary Apparel, Leather Goods &amp; Timepieces · Karachi Flagship
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className="group self-start sm:self-auto inline-flex items-center gap-2 h-9 px-4 border border-neutral-700 hover:border-white text-xs font-medium text-neutral-200 hover:text-white transition-all duration-200 whitespace-nowrap"
          >
            <span>Back to Top</span>
            <ArrowUp
              className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Main 5-Column Corporate & Atelier Grid */}
        <div className="py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* Col 1: Brand Concierge */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-xs font-semibold tracking-wider text-white">
              Client Concierge
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">
              Personal sizing guidance, bespoke alterations, and same-day dispatch across Karachi &amp; nationwide couriers across Pakistan.
            </p>
            <div className="space-y-2.5 pt-1 text-xs text-neutral-300">
              <p className="flex items-center gap-2.5">
                <Phone className="w-3.5 h-3.5 text-[#98a3f5] shrink-0" aria-hidden="true" />
                <span className="tabular-nums">+92 (21) 3584-0194</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="w-3.5 h-3.5 text-[#98a3f5] shrink-0" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => onNavigatePage('contact')}
                  className="hover:text-white transition-colors"
                >
                  care@cozastore.pk
                </button>
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 text-neutral-200 hover:text-white transition-colors pt-1"
              >
                <MessageCircle
                  className="w-3.5 h-3.5 text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="tabular-nums">WhatsApp Desk: 0300-3584194</span>
                <ArrowRight
                  className="w-3 h-3 opacity-60 transition-transform duration-200 group-hover:translate-x-1 group-hover:opacity-100"
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>

          {/* Col 2: Collections */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold tracking-wider text-white mb-4">
              Collections
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory('All Products')}
                  className="group inline-flex items-center text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    All Archive
                  </span>
                </button>
              </li>
              {footerCategories.map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => onSelectCategory(cat)}
                    className="group inline-flex items-center text-neutral-400 hover:text-white transition-colors duration-200"
                  >
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                      {cat}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Client Services */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold tracking-wider text-white mb-4">
              Client Services
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigatePage('checkout')}
                  className="group inline-flex items-center text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    Checkout &amp; Payment
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo('track')}
                  className="group inline-flex items-center text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    Track Dispatch
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenInfo('faq')}
                  className="group inline-flex items-center text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    Shipping &amp; Exchanges
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigatePage('about')}
                  className="group inline-flex items-center text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    About the House
                  </span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigatePage('contact')}
                  className="group inline-flex items-center text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    Contact Studio
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Flagship Studio */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-semibold tracking-wider text-white mb-4">
              Karachi Flagship
            </h3>
            <div className="space-y-3 text-xs text-neutral-400 leading-relaxed">
              <p className="flex items-start gap-2">
                <MapPin
                  className="w-3.5 h-3.5 text-[#98a3f5] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>
                  14-C, 26th Street, Badar Commercial, DHA Phase 5, Karachi 75500
                </span>
              </p>
              <p className="flex items-start gap-2">
                <Clock
                  className="w-3.5 h-3.5 text-[#98a3f5] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span className="tabular-nums">
                  Mon–Sat: 11:00 AM – 9:00 PM
                  <br />
                  Sun: 2:00 PM – 8:00 PM
                </span>
              </p>
              <button
                type="button"
                onClick={() => onOpenInfo('journal')}
                className="inline-block text-xs font-medium text-neutral-200 hover:text-white underline underline-offset-4 decoration-neutral-600 pt-1"
              >
                Read Studio Journal
              </button>
            </div>
          </div>

          {/* Col 5: Private Dispatches */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold tracking-wider text-white mb-4">
              Private Dispatches
            </h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Receive seasonal capsule lookbooks, linen restock alerts, and private DHA studio invitations.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2.5">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <div className="flex border border-neutral-700 focus-within:border-[#717fe0] transition-colors duration-200 bg-neutral-900/60">
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 min-w-0 bg-transparent px-3.5 h-10 text-sm text-white placeholder:text-neutral-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  aria-label="Subscribe to newsletter"
                  className="group px-4 h-10 bg-[#717fe0] hover:bg-white text-white hover:text-neutral-900 disabled:opacity-60 text-xs font-semibold transition-colors duration-200 inline-flex items-center gap-1.5 shrink-0"
                >
                  <span>{subscribing ? 'Saving' : 'Join'}</span>
                  <ArrowRight
                    className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              </div>
              {subscribedMessage ? (
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {subscribedMessage}
                </p>
              ) : (
                <p className="text-[11px] text-neutral-500">
                  Complimentary unsubscribe anytime. Strictly private dispatches.
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Legal, Policies & Payment Methods Bar */}
        <div className="border-t border-neutral-800/90 py-7 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-2">
            <p>&copy; {new Date().getFullYear()} COZA STORE Karachi. All rights reserved.</p>
            <button
              type="button"
              onClick={() => onOpenInfo('faq')}
              className="hover:text-neutral-300 transition-colors"
            >
              Shipping &amp; Returns
            </button>
            <button
              type="button"
              onClick={() => onOpenInfo('about')}
              className="hover:text-neutral-300 transition-colors"
            >
              House Standards
            </button>
          </div>

          <div
            className="flex flex-wrap items-center justify-center gap-2"
            aria-label="Accepted payment methods"
          >
            {paymentBadges.map((method) => (
              <span
                key={method}
                className="px-2.5 py-1 border border-neutral-700/90 text-[11px] font-medium text-neutral-300 tracking-wide"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
