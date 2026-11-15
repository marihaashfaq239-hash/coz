import { User } from 'firebase/auth';
import { Heart, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { CurrencyCode } from '../data/products';

export type NavDestination = 'Shop' | 'Women' | 'Men' | 'About' | 'Contact';
export type InfoModalTab = 'journal' | 'about' | 'faq' | 'track';

interface HeaderProps {
  activeNav: NavDestination;
  onSelectNav: (nav: NavDestination) => void;
  onOpenInfo: (tab: InfoModalTab) => void;
  user: User | null;
  isAdmin: boolean;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  currency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onToggleSearch: () => void;
}

const NAV_LINKS: NavDestination[] = ['Shop', 'Women', 'Men', 'About', 'Contact'];

export function Header({
  activeNav,
  onSelectNav,
  onOpenInfo,
  user,
  isAdmin,
  onOpenAccount,
  onOpenAdmin,
  currency,
  onCurrencyChange,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onToggleSearch,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (item: NavDestination) => {
    setMobileMenuOpen(false);
    onSelectNav(item);
  };

  return (
    <>
      {/* Non-sticky top utility bar so mobile sticky header stays compact (<= 64px) */}
      <div className="no-print bg-[#161618] text-neutral-300 text-xs border-b border-neutral-800">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-9 flex items-center justify-between gap-4">
          <p className="truncate text-neutral-300">
            Free delivery across Karachi &amp; Pakistan on orders over Rs. 5,000
          </p>
          <div className="flex items-center divide-x divide-neutral-700 shrink-0">
            <button
              type="button"
              onClick={() => onOpenInfo('faq')}
              className="hidden sm:inline-block px-3 py-1 hover:text-white transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#717fe0]"
            >
              Help &amp; FAQs
            </button>
            <button
              type="button"
              onClick={() => onOpenInfo('track')}
              className="hidden md:inline-block px-3 py-1 hover:text-white transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#717fe0]"
            >
              Track Order
            </button>
            <button
              type="button"
              onClick={onOpenAccount}
              className="px-3 py-1 hover:text-white transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#717fe0]"
            >
              {user
                ? user.displayName?.split(' ')[0] || 'My Account'
                : 'My Account'}
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="px-3 py-1 text-[#a5b0ff] hover:text-white font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#717fe0]"
              >
                Admin
              </button>
            )}
            <label className="sr-only" htmlFor="currency-select">
              Select Currency
            </label>
            <select
              id="currency-select"
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              className="bg-transparent pl-3 pr-1 py-1 text-neutral-200 hover:text-white focus:outline-none cursor-pointer"
            >
              <option value="PKR" className="bg-[#161618] text-white">
                PKR
              </option>
              <option value="USD" className="bg-[#161618] text-white">
                USD
              </option>
              <option value="EUR" className="bg-[#161618] text-white">
                EUR
              </option>
              <option value="GBP" className="bg-[#161618] text-white">
                GBP
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Sticky Navigation Bar — 3 Zones */}
      <header
        className={`no-print sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b transition-shadow duration-200 ${
          scrolled ? 'border-neutral-200 shadow-sm' : 'border-neutral-200/70'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('Shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-display text-lg tracking-tight text-neutral-900 hover:text-[#717fe0] transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0] rounded-sm"
          >
            <span className="font-bold">COZA</span>{' '}
            <span className="font-normal">STORE</span>
          </a>

          {/* Zone 2: 5 Concise Single-line Navigation Links */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-7"
          >
            {NAV_LINKS.map((item) => {
              const isActive = activeNav === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`relative py-1.5 text-sm font-medium transition-colors duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0] rounded-sm ${
                    isActive
                      ? 'text-[#717fe0]'
                      : 'text-neutral-700 hover:text-neutral-950'
                  }`}
                >
                  {item}
                  {isActive && (
                    <motion.span
                      layoutId="header-nav-underline"
                      transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                      className="absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#717fe0]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Utility Icons (Search, Bag, Wishlist) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleSearch}
              aria-label="Search products"
              className="w-10 h-10 flex items-center justify-center text-neutral-700 hover:text-[#717fe0] transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0]"
            >
              <Search className="w-[19px] h-[19px]" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onOpenCart}
              aria-label={`Shopping bag with ${cartCount} items`}
              className="relative w-10 h-10 flex items-center justify-center text-neutral-700 hover:text-[#717fe0] transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0]"
            >
              <ShoppingBag className="w-[19px] h-[19px]" aria-hidden="true" />
              <span className="absolute top-1.5 right-1 min-w-[16px] h-4 px-1 bg-[#717fe0] text-white text-[10px] font-semibold leading-4 text-center rounded-sm tabular-nums">
                {cartCount}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenWishlist}
              aria-label={`Wishlist with ${wishlistCount} saved items`}
              className="relative w-10 h-10 flex items-center justify-center text-neutral-700 hover:text-[#717fe0] transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0]"
            >
              <Heart className="w-[19px] h-[19px]" aria-hidden="true" />
              <span className="absolute top-1.5 right-1 min-w-[16px] h-4 px-1 bg-[#717fe0] text-white text-[10px] font-semibold leading-4 text-center rounded-sm tabular-nums">
                {wishlistCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden w-11 h-11 flex items-center justify-center text-neutral-800 hover:text-[#717fe0] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0]"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              key="mobile-nav-drawer"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              aria-label="Mobile navigation"
              className="md:hidden border-t border-neutral-200 bg-white px-4 py-3 space-y-1"
            >
              {NAV_LINKS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    activeNav === item
                      ? 'bg-neutral-100 text-[#717fe0]'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {item}
                </button>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
