import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { STUDIO_INTERIOR_IMAGE } from '../data/products';
import { ResilientImage } from './ResilientImage';

interface StudioShowcaseSectionProps {
  onOpenAbout: () => void;
  onTrackOrder: () => void;
}

const LUXURY_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function StudioShowcaseSection({
  onOpenAbout,
  onTrackOrder,
}: StudioShowcaseSectionProps) {
  const pillars = [
    {
      index: '01',
      title: 'Breathable Everyday Textiles',
      detail:
        'Combed organic cotton jersey, Italian poplin, and brushed wool melton selected for drape and Karachi humidity comfort.',
    },
    {
      index: '02',
      title: 'Same-Day Karachi Rider Dispatch',
      detail:
        '4–6 hour express rider delivery across DHA, Clifton, PECHS & Gulshan. Free nationwide delivery over Rs. 5,000.',
    },
    {
      index: '03',
      title: '30-Day In-Studio Exchanges',
      detail:
        'Exchange sizes effortlessly via doorstep pickup or walk into our Badar Commercial studio in DHA Phase 5.',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.55, ease: LUXURY_EASE }}
      aria-label="Karachi flagship studio and craft standards"
      className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 pb-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 bg-[#161618] text-white overflow-hidden">
        {/* Left Studio Photography */}
        <div className="lg:col-span-6 relative min-h-[340px] lg:min-h-full overflow-hidden group">
          <ResilientImage
            src={STUDIO_INTERIOR_IMAGE}
            alt="COZA STORE DHA Phase 5 Karachi flagship studio showroom"
            className="w-full h-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            fallbackLabel="DHA Phase 5 Flagship"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#161618]/75 via-transparent to-transparent"
          />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <p className="text-xs font-medium text-neutral-300">
              Flagship Showroom · Mon–Sat 11 AM – 9 PM
            </p>
            <p className="font-editorial text-xl font-medium mt-0.5">
              14-C Badar Commercial, DHA Phase 5, Karachi
            </p>
          </div>
        </div>

        {/* Right Craft Standards & Direct Actions */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between gap-8">
          <div>
            <p className="text-xs font-medium text-[#98a3f5] mb-2">
              The House Standard
            </p>
            <h2
              className="font-editorial text-3xl sm:text-4xl font-semibold text-white leading-[1.1] tracking-[-0.015em] mb-7"
              style={{ textWrap: 'balance' }}
            >
              Crafted for calm confidence from Clifton to Shahrah-e-Faisal
            </h2>

            <div className="divide-y divide-neutral-800 border-y border-neutral-800">
              {pillars.map((pillar) => (
                <div key={pillar.index} className="py-4 flex items-start gap-4">
                  <span className="text-xs font-medium text-neutral-500 tabular-nums pt-0.5 shrink-0">
                    {pillar.index}.
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {pillar.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onOpenAbout}
              className="group inline-flex items-center gap-2.5 bg-white text-neutral-900 hover:bg-[#717fe0] hover:text-white px-6 py-3 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
            >
              <span>Read Studio Story</span>
              <ArrowRight
                className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={onTrackOrder}
              className="inline-flex items-center gap-2 border border-neutral-700 hover:border-white text-neutral-200 hover:text-white px-5 py-3 text-xs font-medium transition-colors duration-200 whitespace-nowrap"
            >
              Track Karachi Dispatch
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
