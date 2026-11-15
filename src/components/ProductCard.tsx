import { Heart, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { CurrencyCode, formatPrice, Product } from '../data/products';
import { GarmentImage } from './GarmentImage';

interface ProductCardProps {
  product: Product;
  currency: CurrencyCode;
  isWishlisted: boolean;
  averageRating: number;
  reviewCount: number;
  index?: number;
  onToggleWishlist: (productId: string) => void;
  onQuickView: (product: Product, selectedColor?: string) => void;
}

const CARD_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function ProductCard({
  product,
  currency,
  isWishlisted,
  averageRating,
  reviewCount,
  index = 0,
  onToggleWishlist,
  onQuickView,
}: ProductCardProps) {
  const [selectedVariantName, setSelectedVariantName] = useState<string>(
    product.variants[0]?.name ?? product.color
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{
        duration: 0.45,
        delay: Math.min((index % 4) * 0.05, 0.15),
        ease: CARD_EASE,
      }}
      className="group flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f4f2ee]">
        <button
          type="button"
          onClick={() => onQuickView(product, selectedVariantName)}
          aria-label={`View details for ${product.name}`}
          className="relative block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#717fe0]"
        >
          <GarmentImage
            product={product}
            colorName={selectedVariantName}
            alt={`${product.name} in ${selectedVariantName}`}
            className="w-full h-full object-cover object-top transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
            fallbackLabel={product.name}
          />
        </button>

        {/* Quiet unboxed editorial caption for signature drops */}
        {product.tag && (
          <span className="pointer-events-none absolute top-3 left-3 text-[11px] font-medium tracking-wide text-neutral-800 bg-white/85 backdrop-blur-sm px-2 py-0.5">
            {product.tag}
          </span>
        )}

        {/* Subtle bottom hover gradient veil behind Quick View */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/35 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center px-4">
          <button
            type="button"
            onClick={() => onQuickView(product, selectedVariantName)}
            className="pointer-events-auto opacity-0 translate-y-2.5 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0 focus-visible:opacity-100 focus-visible:translate-y-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] bg-white/95 backdrop-blur-sm text-neutral-900 hover:bg-[#161618] hover:text-white px-6 py-2.5 text-xs font-semibold tracking-wide shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0] whitespace-nowrap"
          >
            Quick View
          </button>
        </div>
      </div>

      <div className="pt-3.5 pb-1 flex flex-col gap-1.5 border-b border-transparent group-hover:border-neutral-200 transition-colors duration-300">
        <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span>{product.category}</span>
            {product.stock !== undefined && product.stock === 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-red-600 font-medium">Sold Out</span>
              </>
            )}
            {reviewCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 text-neutral-700 tabular-nums">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                  {averageRating.toFixed(1)}
                </span>
              </>
            )}
          </div>

          {/* Interactive Colorway Swatches */}
          <div
            className="flex items-center gap-1.5 shrink-0"
            aria-label={`${product.variants.length} colors available`}
          >
            {product.variants.slice(0, 3).map((variant) => {
              const isSelected = selectedVariantName === variant.name;
              return (
                <button
                  key={variant.name}
                  type="button"
                  title={`Preview ${variant.name}`}
                  aria-label={`Preview ${variant.name} color`}
                  aria-pressed={isSelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVariantName(variant.name);
                  }}
                  className={`w-3 h-3 rounded-full border transition-transform duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#717fe0] ${
                    isSelected
                      ? 'border-neutral-900 ring-1 ring-neutral-900 ring-offset-1 scale-110'
                      : 'border-neutral-300/90 hover:scale-110'
                  }`}
                  style={{ backgroundColor: variant.hex }}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            onClick={() => onQuickView(product, selectedVariantName)}
            className="text-left text-[15px] font-medium text-neutral-900 hover:text-[#717fe0] transition-colors duration-200 leading-snug focus-visible:outline-none focus-visible:underline"
          >
            {product.name}
          </button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.82 }}
            onClick={() => onToggleWishlist(product.id)}
            aria-label={
              isWishlisted
                ? `Remove ${product.name} from wishlist`
                : `Save ${product.name} to wishlist`
            }
            aria-pressed={isWishlisted}
            className={`-mt-1 -mr-1.5 w-9 h-9 shrink-0 flex items-center justify-center rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0] ${
              isWishlisted
                ? 'text-[#717fe0]'
                : 'text-neutral-400 hover:text-neutral-800'
            }`}
          >
            <Heart
              className={`w-[17px] h-[17px] transition-transform duration-200 ${
                isWishlisted ? 'fill-current scale-110' : 'group-hover:scale-105'
              }`}
              aria-hidden="true"
            />
          </motion.button>
        </div>

        <p className="text-[15px] font-medium text-neutral-700 tabular-nums">
          {formatPrice(product.pricePkr, currency)}
        </p>
      </div>
    </motion.article>
  );
}
