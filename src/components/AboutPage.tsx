import { ArrowRight, CheckCircle2, Clock, ShieldCheck, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import {
  HERO_BANNER_IMAGE,
  PRODUCTS,
  STUDIO_INTERIOR_IMAGE,
} from '../data/products';
import { ResilientImage } from './ResilientImage';

interface AboutPageProps {
  onShopNow: () => void;
  onGoToContact: () => void;
}

const LUXURY_EASE = [0.16, 1, 0.3, 1] as const;

export function AboutPage({ onShopNow, onGoToContact }: AboutPageProps) {
  const trenchImage = PRODUCTS[3]?.image ?? HERO_BANNER_IMAGE;
  const toteImage = PRODUCTS[4]?.image ?? HERO_BANNER_IMAGE;
  const craftFrames = [
    {
      image: PRODUCTS[8]?.image ?? HERO_BANNER_IMAGE,
      title: 'Karachi Linen Tailoring',
      caption: 'Breathable Belgian linen & combed cotton cuts',
    },
    {
      image: PRODUCTS[11]?.image ?? toteImage,
      title: 'Saddle Leather Goods',
      caption: 'Vegetable-tanned hides & solid brass clasps',
    },
    {
      image: PRODUCTS[13]?.image ?? HERO_BANNER_IMAGE,
      title: 'Hand-Lasted Footwear',
      caption: 'Reverse-calf Italian suede & stitched soles',
    },
    {
      image: PRODUCTS[15]?.image ?? HERO_BANNER_IMAGE,
      title: 'Brushed Steel Horology',
      caption: '316L steel cases with domed sapphire glass',
    },
  ];

  return (
    <div className="bg-white">
      {/* Page Banner */}
      <section className="relative h-[240px] sm:h-[300px] w-full overflow-hidden bg-neutral-900">
        <motion.div
          initial={{ scale: 1.06, opacity: 0.85 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: LUXURY_EASE }}
          className="w-full h-full"
        >
          <ResilientImage
            src={STUDIO_INTERIOR_IMAGE}
            alt="COZA STORE DHA Phase 5 Karachi flagship studio interior"
            className="w-full h-full object-cover object-center opacity-60"
            fallbackLabel="About COZA STORE"
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
            Karachi · Est. Contemporary Wardrobe House
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: LUXURY_EASE }}
            className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-semibold text-white tracking-[-0.015em]"
            style={{ textWrap: 'balance' }}
          >
            About COZA STORE
          </motion.h1>
        </div>
      </section>

      {/* Story Section 1 */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.5, ease: LUXURY_EASE }}
        className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="text-xs font-medium text-[#717fe0] mb-2">
              01. Our Story
            </p>
            <h2
              className="font-editorial text-3xl sm:text-4xl font-semibold text-neutral-900 mb-5 leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Thoughtful silhouettes built for Karachi’s pace and climate
            </h2>
            <p className="text-sm sm:text-[15px] text-neutral-600 leading-relaxed mb-4">
              COZA STORE began in DHA Phase 5, Karachi with a clear objective: create a focused wardrobe of breathable shirts, tailored outerwear, full-grain leather carryalls, and minimalist footwear without seasonal clutter or inflated retail markups.
            </p>
            <p className="text-sm sm:text-[15px] text-neutral-600 leading-relaxed mb-7">
              From humid coastal afternoons along Clifton to formal studio meetings on Shahrah-e-Faisal, every fabric weight is tested locally—pairing high-twist combed cottons and Italian poplin with crisp winter wool blends when temperatures drop.
            </p>

            <blockquote className="border-t border-b border-neutral-200 py-5 text-sm text-neutral-700 italic leading-relaxed">
              &ldquo;Good wardrobe design is quiet: clean seams, honest natural fibers, and proportions you reach for every week without thinking twice.&rdquo;
              <footer className="not-italic text-xs font-medium text-neutral-500 mt-2">
                — Studio Design Team, Badar Commercial, Karachi
              </footer>
            </blockquote>
          </div>

          <div className="lg:col-span-5">
            <div className="group aspect-[3/4] lg:h-full w-full bg-[#efefef] overflow-hidden">
              <ResilientImage
                src={trenchImage}
                alt="Tailored olive wool trench coat from the COZA STORE studio"
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                fallbackLabel="COZA Studio Tailoring"
              />
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3-Column Studio Pillars */}
      <section className="border-y border-neutral-200 bg-neutral-50/70">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <Truck className="w-5 h-5 text-[#717fe0] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-display text-base font-semibold text-neutral-900 mb-1">
                Same-Day Karachi Dispatch
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                4–6 hour express rider delivery across DHA, Clifton, PECHS, and Gulshan. Complimentary nationwide shipping over Rs. 5,000.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <ShieldCheck className="w-5 h-5 text-[#717fe0] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-display text-base font-semibold text-neutral-900 mb-1">
                Transparent Local Payments
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Checkout with Cash on Delivery, JazzCash, Easypaisa, or Card—with live order status updates in your account.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Clock className="w-5 h-5 text-[#717fe0] shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-display text-base font-semibold text-neutral-900 mb-1">
                30-Day Easy Exchanges
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Swap sizes effortlessly via doorstep courier pickup or directly at our DHA Phase 5 flagship studio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section 2 */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.5, ease: LUXURY_EASE }}
        className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16 sm:py-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="group aspect-[3/4] lg:h-full w-full bg-[#efefef] overflow-hidden">
              <ResilientImage
                src={toteImage}
                alt="Full-grain vegetable-tanned cognac leather tote bag"
                className="w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                fallbackLabel="Full-Grain Leather Craft"
              />
            </div>
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col justify-center">
            <p className="text-xs font-medium text-[#717fe0] mb-2">
              02. Material Standards
            </p>
            <h2
              className="font-editorial text-3xl sm:text-4xl font-semibold text-neutral-900 mb-5 leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Small-batch leather, selvedge denim &amp; brushed steel
            </h2>
            <p className="text-sm sm:text-[15px] text-neutral-600 leading-relaxed mb-4">
              Every carryall in our Bag collection is cut from full-grain vegetable-tanned hides that deepen in character with daily commute wear, reinforced with solid brass hardware and padded laptop compartments.
            </p>
            <p className="text-sm sm:text-[15px] text-neutral-600 leading-relaxed mb-7">
              Our footwear and timepieces follow the same restraint: nappa calfskin court trainers with stitched rubber cup soles and 316L brushed stainless steel dress watches under 8mm thin.
            </p>

            <ul className="space-y-2.5 text-sm text-neutral-700 mb-8">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#717fe0] shrink-0" aria-hidden="true" />
                <span>100% combed cotton jersey &amp; Italian cotton poplin shirting</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#717fe0] shrink-0" aria-hidden="true" />
                <span>Double-inspected stitching and colorfast dyeing before dispatch</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#717fe0] shrink-0" aria-hidden="true" />
                <span>Dedicated customer support via WhatsApp &amp; in-studio appointments</span>
              </li>
            </ul>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onShopNow}
                className="group inline-flex items-center gap-2 bg-[#161618] hover:bg-[#717fe0] text-white px-6 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
              >
                Explore Collection
                <ArrowRight
                  className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                onClick={onGoToContact}
                className="inline-flex items-center gap-2 border border-neutral-300 hover:border-neutral-900 text-neutral-800 px-6 py-3 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
              >
                Visit Our Studio
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Studio Craft Lookbook Gallery */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pb-10">
        <div className="border-t border-neutral-200 pt-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-medium text-[#717fe0] mb-1.5">
                03. Studio Gallery
              </p>
              <h2 className="font-editorial text-3xl sm:text-4xl font-semibold text-neutral-900">
                Inside the Karachi Collection
              </h2>
            </div>
            <p className="text-sm text-neutral-500 max-w-md">
              Every silhouette, hide, and timepiece photographed in natural studio daylight without heavy retouching.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {craftFrames.map((frame, idx) => (
              <motion.figure
                key={frame.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{
                  duration: 0.45,
                  delay: idx * 0.06,
                  ease: LUXURY_EASE,
                }}
                className="group"
              >
                <div className="aspect-[3/4] w-full bg-[#efefef] overflow-hidden mb-3">
                  <ResilientImage
                    src={frame.image}
                    alt={frame.title}
                    className="w-full h-full object-cover object-center transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
                    fallbackLabel={frame.title}
                  />
                </div>
                <figcaption>
                  <p className="text-sm font-semibold text-neutral-900 transition-colors duration-150 group-hover:text-[#717fe0]">
                    {frame.title}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">{frame.caption}</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
