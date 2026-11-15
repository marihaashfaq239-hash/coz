import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import {
  CurrencyCode,
  formatPrice,
  HERO_BANNER_IMAGE,
  Product,
} from '../data/products';
import { ResilientImage } from './ResilientImage';

interface HeroBannerProps {
  onShopNow: () => void;
  onExploreStudio?: () => void;
  featuredProduct?: Product;
  currency?: CurrencyCode;
  onInspectFeatured?: (product: Product) => void;
}

const LUXURY_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function HeroBanner({
  onShopNow,
  onExploreStudio,
  featuredProduct,
  currency = 'PKR',
  onInspectFeatured,
}: HeroBannerProps) {
  return (
    <section
      aria-label="Seasonal collection spotlight"
      className="relative w-full overflow-hidden bg-[#161618]"
    >
      <div className="relative min-h-[520px] sm:min-h-[580px] lg:h-[640px] w-full">
        <motion.div
          initial={{ scale: 1.07, opacity: 0.85 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: LUXURY_EASE }}
          className="absolute inset-0 w-full h-full"
        >
          <ResilientImage
            src={HERO_BANNER_IMAGE}
            alt="Models in tailored stone trench coats and crisp white shirting inside a sunlit minimalist studio"
            className="w-full h-full object-cover object-center"
            fallbackLabel="Autumn Tailoring Collection"
          />
        </motion.div>

        {/* Measured multi-stop editorial contrast scrim */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#111113]/90 via-[#111113]/55 to-[#111113]/20"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#111113]/85 via-[#111113]/30 to-transparent"
        />

        <div className="relative z-10 h-full min-h-[520px] sm:min-h-[580px] lg:h-[640px] max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col justify-between pt-14 pb-8">
          <div />

          {/* Main Asymmetric Campaign Grid */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: LUXURY_EASE }}
              className="max-w-xl text-white"
            >
              <p className="text-xs sm:text-sm font-medium tracking-wide text-neutral-300 mb-3">
                Autumn / Winter 2026 · Karachi Edition
              </p>

              <h1
                className="font-editorial font-semibold text-white leading-[1.04] tracking-[-0.015em] mb-5"
                style={{
                  fontSize: 'clamp(2.65rem, 5.2vw, 4.35rem)',
                  textWrap: 'balance',
                }}
              >
                Tailored silhouettes for{' '}
                <span className="italic font-medium text-neutral-200">
                  calm everyday wear
                </span>
              </h1>

              <p className="text-sm sm:text-base text-neutral-200 leading-relaxed mb-8 max-w-md">
                Crisp Italian poplin, brushed wool outerwear, and full-grain vegetable-tanned carryalls tailored for Karachi’s climate.
              </p>

              <div className="flex flex-wrap items-center gap-6">
                <button
                  type="button"
                  onClick={onShopNow}
                  className="group inline-flex items-center gap-2.5 bg-white text-neutral-900 hover:bg-[#717fe0] hover:text-white px-7 py-3.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap shrink-0 shadow-md"
                >
                  <span>Shop Collection</span>
                  <ArrowRight
                    className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>

                {onExploreStudio && (
                  <button
                    type="button"
                    onClick={onExploreStudio}
                    className="text-sm font-medium text-neutral-200 hover:text-white underline underline-offset-4 decoration-neutral-400 hover:decoration-white transition-colors duration-200 whitespace-nowrap"
                  >
                    Our Karachi Studio
                  </button>
                )}
              </div>
            </motion.div>

            {/* Desktop Signature Campaign Lookbook Inset */}
            {featuredProduct && onInspectFeatured && (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.14, ease: LUXURY_EASE }}
                onClick={() => onInspectFeatured(featuredProduct)}
                className="group hidden lg:flex items-center gap-4 p-3 pr-5 bg-[#161618]/85 hover:bg-[#161618] backdrop-blur-md border border-white/15 hover:border-white/35 text-left transition-all duration-200 hover:-translate-y-0.5 max-w-[320px] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <div className="w-16 h-20 bg-neutral-800 shrink-0 overflow-hidden">
                  <ResilientImage
                    src={featuredProduct.image}
                    alt={featuredProduct.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    fallbackLabel={featuredProduct.name}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-neutral-400 mb-0.5">
                    Featured Look
                  </p>
                  <p className="font-editorial text-lg font-semibold text-white truncate">
                    {featuredProduct.name}
                  </p>
                  <div className="flex items-center justify-between gap-3 mt-1">
                    <span className="text-xs font-medium text-neutral-200 tabular-nums">
                      {formatPrice(featuredProduct.pricePkr, currency)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#a5b0ff] group-hover:text-white transition-colors">
                      Inspect
                      <ArrowUpRight
                        className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </div>
                </div>
              </motion.button>
            )}
          </div>

          {/* Architectural Campaign Hairline Strip */}
          <div className="hidden sm:grid grid-cols-3 gap-6 pt-5 border-t border-white/15 text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 tabular-nums">01.</span>
              <span>Italian Poplin, Belgian Linen &amp; Full-Grain Hides</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 tabular-nums">02.</span>
              <span>Same-Day Rider Dispatch Across DHA, Clifton &amp; PECHS</span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-neutral-400 tabular-nums">03.</span>
              <span>Free Delivery Over Rs. 5,000 · COD &amp; JazzCash</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
