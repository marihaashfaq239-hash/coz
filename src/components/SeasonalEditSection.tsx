import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Category, PRODUCTS } from '../data/products';
import { ResilientImage } from './ResilientImage';

interface SeasonalEditSectionProps {
  onSelectDepartment: (category: Category) => void;
}

const LUXURY_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function SeasonalEditSection({
  onSelectDepartment,
}: SeasonalEditSectionProps) {
  const departments: {
    index: string;
    title: string;
    subtitle: string;
    category: Category;
    image: string;
    alt: string;
  }[] = [
    {
      index: '01',
      title: "Women's Tailoring",
      subtitle: 'Italian cotton poplin, Belgian linen & wool coats',
      category: 'Women',
      image: PRODUCTS[3].image,
      alt: 'Tailored olive wool trench coat in warm daylight',
    },
    {
      index: '02',
      title: "Men's Outerwear & Shirting",
      subtitle: 'Brushed twill overshirts, knitwear & Japanese selvedge',
      category: 'Men',
      image: PRODUCTS[9]?.image ?? PRODUCTS[2].image,
      alt: 'Structured stone twill overshirt worn with tailored trousers',
    },
    {
      index: '03',
      title: 'Leather & Horology',
      subtitle: 'Full-grain saddle leather bags & brushed 316L watches',
      category: 'Bag',
      image: PRODUCTS[4].image,
      alt: 'Full-grain vegetable-tanned cognac leather carryall tote',
    },
  ];

  return (
    <section
      aria-label="Curated seasonal departments"
      className="bg-[#f8f7f4] border-b border-neutral-200/80"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-18">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-9">
          <div>
            <p className="text-xs font-medium text-[#717fe0] mb-1.5">
              Curated Departments
            </p>
            <h2
              className="font-editorial text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-[-0.015em]"
              style={{ textWrap: 'balance' }}
            >
              The Seasonal Edit
            </h2>
          </div>
          <p className="text-sm text-neutral-600 max-w-sm leading-relaxed">
            Small-batch silhouettes photographed in natural Karachi daylight. Select any edit to filter the archive below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {departments.map((dept, idx) => (
            <motion.button
              key={dept.title}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{
                duration: 0.5,
                delay: idx * 0.08,
                ease: LUXURY_EASE,
              }}
              onClick={() => onSelectDepartment(dept.category)}
              className="group relative aspect-[4/5] w-full overflow-hidden bg-neutral-900 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0]"
            >
              <ResilientImage
                src={dept.image}
                alt={dept.alt}
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                fallbackLabel={dept.title}
              />

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#111113]/85 via-[#111113]/25 to-transparent transition-opacity duration-300 group-hover:opacity-95"
              />

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 text-white">
                <p className="text-[11px] font-medium text-neutral-300 tabular-nums mb-1.5">
                  {dept.index} · Collection
                </p>
                <h3 className="font-editorial text-2xl sm:text-[26px] font-semibold leading-tight text-white mb-1.5">
                  {dept.title}
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed mb-4 max-w-xs">
                  {dept.subtitle}
                </p>
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-white pt-3 border-t border-white/25 w-full justify-between">
                  <span>Explore Edit</span>
                  <ArrowRight
                    className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
