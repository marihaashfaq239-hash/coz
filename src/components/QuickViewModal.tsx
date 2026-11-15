import { User } from 'firebase/auth';
import { ArrowRight, Check, Heart, MessageCircle, Minus, Plus, Ruler, Star, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { FormEvent, useEffect, useState } from 'react';
import {
  CurrencyCode,
  formatPrice,
  Product,
  ProductReview,
  STORE_WHATSAPP_NUMBER,
} from '../data/products';
import { GarmentImage } from './GarmentImage';

interface QuickViewModalProps {
  product: Product | null;
  initialColor?: string;
  currency: CurrencyCode;
  isWishlisted: boolean;
  reviews: ProductReview[];
  user: User | null;
  onSignInGoogle: () => Promise<void>;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    size: string,
    color: string,
    quantity: number
  ) => void;
  onToggleWishlist: (productId: string) => void;
  onAddReview: (productId: string, review: Omit<ProductReview, 'id' | 'date'>) => Promise<void> | void;
  relatedProducts?: Product[];
  onSelectRelated?: (product: Product) => void;
}

type ModalTab = 'details' | 'reviews';
type ImageAngle = 'full' | 'upper' | 'fabric';
type MeasureUnit = 'in' | 'cm';

const IMAGE_ANGLES: { id: ImageAngle; label: string; imgClass: string }[] = [
  { id: 'full', label: 'Full Look', imgClass: 'object-cover object-top scale-100' },
  { id: 'upper', label: 'Fit Focus', imgClass: 'object-cover object-center scale-[1.28]' },
  { id: 'fabric', label: 'Detail Crop', imgClass: 'object-cover object-[50%_62%] scale-[1.55]' },
];

function convertInchesStringToCm(value: string): string {
  // Converts e.g. "33–34" or "14.5" or "24.0" to centimeters
  return value.replace(/\d+(?:\.\d+)?/g, (match) => {
    const num = parseFloat(match);
    if (Number.isNaN(num)) return match;
    return (num * 2.54).toFixed(1).replace(/\.0$/, '');
  });
}

function getCategoryMeasureTips(category: Product['category']): {
  fitSummary: string;
  steps: { label: string; detail: string }[];
} {
  switch (category) {
    case 'Women':
    case 'Men':
      return {
        fitSummary:
          'Cut to a modern tailored silhouette. If you prefer a relaxed layer or sit between two sizes, we recommend sizing up.',
        steps: [
          {
            label: 'Chest / Bust',
            detail:
              'Keep the tape level and measure around the fullest part of the chest under your arms.',
          },
          {
            label: 'Shoulder Width',
            detail:
              'Measure straight across the upper back from the outer edge of one shoulder seam to the other.',
          },
          {
            label: 'Garment Length',
            detail:
              'Measure vertically from the highest shoulder point beside the collar seam straight to the bottom hem.',
          },
        ],
      };
    case 'Shoes':
      return {
        fitSummary:
          'Built on standard European lasts. If you have a wider forefoot or fall between half sizes, choose the next EU size up.',
        steps: [
          {
            label: 'Heel-to-Toe Length',
            detail:
              'Stand barefoot with your heel lightly touching a wall on paper, mark the tip of your longest toe, and measure in cm.',
          },
          {
            label: 'Socks Allowance',
            detail:
              'Allow approximately 0.5 cm of ease beyond your measured foot length for all-day comfort.',
          },
          {
            label: 'Size Conversion',
            detail:
              'Compare your cm measurement against the EU, UK, and US columns above for the cleanest fit.',
          },
        ],
      };
    case 'Bag':
      return {
        fitSummary:
          'All bag dimensions are external edge-to-edge studio measurements rounded to the nearest tenth of an inch.',
        steps: [
          {
            label: 'Width & Profile',
            detail:
              'Measured horizontally across the widest structured body panel of the silhouette.',
          },
          {
            label: 'Vertical Clearance',
            detail:
              'Height reflects the main compartment body excluding upright carry handles.',
          },
          {
            label: 'Everyday Carry',
            detail:
              'Match width against your laptop or tablet dimensions before placing an order.',
          },
        ],
      };
    case 'Watches':
      return {
        fitSummary:
          'Choose 38mm for classic vintage dress proportions or 40mm for stronger contemporary wrist presence.',
        steps: [
          {
            label: 'Wrist Circumference',
            detail:
              'Wrap a flexible tape snugly just above your wrist bone where a timepiece naturally rests.',
          },
          {
            label: 'Case Diameter',
            detail:
              'Measured straight across the brushed 316L steel bezel excluding the crown.',
          },
          {
            label: 'Strap & Lug Balance',
            detail:
              'All COZA 20mm quick-release straps include micro-punched sizing holes fitting 15–21 cm wrists.',
          },
        ],
      };
  }
}

export function QuickViewModal({
  product,
  initialColor,
  currency,
  isWishlisted,
  reviews,
  user,
  onSignInGoogle,
  onClose,
  onAddToCart,
  onToggleWishlist,
  onAddReview,
  relatedProducts = [],
  onSelectRelated,
}: QuickViewModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('details');
  const [activeAngle, setActiveAngle] = useState<ImageAngle>('full');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [measureUnit, setMeasureUnit] = useState<MeasureUnit>('in');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewArea, setReviewArea] = useState('DHA / Clifton');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (product) {
      setActiveTab('details');
      setActiveAngle('full');
      setSizeGuideOpen(false);
      setMeasureUnit('in');
      setSelectedSize(product.sizes[0] ?? 'One Size');
      const matchedInitial =
        initialColor && product.variants.some((v) => v.name === initialColor)
          ? initialColor
          : product.variants[0]?.name ?? product.color;
      setSelectedColor(matchedInitial);
      setQuantity(1);
      setJustAdded(false);
      setReviewSubmitted(false);
    }
  }, [product, initialColor]);

  useEffect(() => {
    if (!product) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (sizeGuideOpen) {
          setSizeGuideOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [product, sizeGuideOpen, onClose]);

  const activeSize = selectedSize || product?.sizes[0] || 'One Size';
  const activeColor = selectedColor || product?.color || '';
  const baseHex = product?.variants[0]?.hex || product?.colorHex || '#f4f4f5';
  const activeVariantObj =
    product?.variants.find((v) => v.name === activeColor) ?? product?.variants[0];
  const activeAngleConfig =
    IMAGE_ANGLES.find((a) => a.id === activeAngle) ?? IMAGE_ANGLES[0];

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const whatsappText = encodeURIComponent(
    product
      ? `Assalam-o-Alaikum COZA STORE! I want to order:\n- Item: ${product.name}\n- Color: ${activeColor}\n- Size: ${activeSize}\n- Qty: ${quantity}\n- Price: ${formatPrice(product.pricePkr * quantity, currency)}`
      : ''
  );
  const whatsappUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${whatsappText}`;

  const handleAdd = () => {
    if (!product) return;
    onAddToCart(product, activeSize, activeColor, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!product || !reviewAuthor.trim() || !reviewComment.trim()) return;
    await onAddReview(product.id, {
      author: reviewAuthor.trim(),
      area: reviewArea.trim() || 'Karachi',
      rating: reviewRating,
      comment: reviewComment.trim(),
    });
    setReviewAuthor('');
    setReviewComment('');
    setReviewRating(5);
    setReviewSubmitted(true);
  };

  const availableStock = product?.stock ?? 24;
  const isOutOfStock = availableStock <= 0;
  const supportsInchCmToggle =
    product?.sizeChartHeaders.some((h) => h.includes('(in)')) ?? false;
  const measureTips = product ? getCategoryMeasureTips(product.category) : null;

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="quick-view-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-view-title"
          onClick={onClose}
        >
          <motion.div
            key="quick-view-dialog"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-4xl bg-white shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center bg-white/90 text-neutral-700 hover:text-neutral-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0]"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Left: Multi-Angle Studio Gallery with Live Color Preview & Complete the Look */}
        <div className="bg-[#f4f2ee] flex flex-col">
          <div className="relative aspect-[3/4] w-full overflow-hidden flex-1">
            <GarmentImage
              product={product}
              colorName={activeColor}
              alt={`${product.name} in ${activeColor} — ${activeAngleConfig.label}`}
              className={`w-full h-full transition-all duration-300 ease-out ${activeAngleConfig.imgClass}`}
              fallbackLabel={product.name}
            />
            <div className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 text-[11px] font-medium text-neutral-900 shadow-xs border border-neutral-200/70">
              <span
                className="w-3 h-3 rounded-full border border-neutral-300 shrink-0"
                style={{ backgroundColor: activeVariantObj?.hex ?? baseHex }}
                aria-hidden="true"
              />
              <span>Color: {activeColor}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 bg-white border-t border-neutral-200">
            {IMAGE_ANGLES.map((angle) => (
              <button
                key={angle.id}
                type="button"
                onClick={() => setActiveAngle(angle.id)}
                className={`py-2 px-2 text-xs font-medium border transition-colors ${
                  activeAngle === angle.id
                    ? 'border-[#717fe0] bg-[#717fe0]/10 text-[#4c58b6]'
                    : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
                }`}
              >
                {angle.label}
              </button>
            ))}
          </div>

          {relatedProducts.length > 0 && onSelectRelated && (
            <div className="p-3.5 bg-[#f8f7f4] border-t border-neutral-200">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-semibold tracking-wider text-neutral-600 uppercase">
                  Complete the Look
                </p>
                <span className="text-[11px] text-neutral-400">Pair with</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {relatedProducts.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectRelated(item)}
                    className="group text-left bg-white border border-neutral-200 hover:border-[#717fe0] p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#717fe0]"
                  >
                    <div className="relative aspect-[4/5] w-full bg-[#f4f2ee] overflow-hidden mb-1.5">
                      <GarmentImage
                        product={item}
                        colorName={item.color}
                        alt={item.name}
                        className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <p className="text-[11px] font-medium text-neutral-900 truncate group-hover:text-[#717fe0] transition-colors">
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <span className="text-[11px] text-neutral-500 tabular-nums">
                        {formatPrice(item.pricePkr, currency)}
                      </span>
                      <ArrowRight
                        className="w-2.5 h-2.5 text-neutral-400 group-hover:text-[#717fe0] shrink-0 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module + Size Guide + Reviews */}
        <div className="p-6 sm:p-8 flex flex-col justify-between gap-5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-2 pr-8">
              <div className="flex items-center gap-2 text-xs text-neutral-500 tabular-nums">
                <span>{product.category}</span>
                <span aria-hidden="true">·</span>
                <span
                  className={
                    isOutOfStock
                      ? 'text-red-600 font-medium'
                      : availableStock <= 5
                        ? 'text-amber-700 font-medium'
                        : 'text-neutral-600'
                  }
                >
                  {isOutOfStock
                    ? 'Out of Stock'
                    : availableStock <= 5
                      ? `Low Stock (${availableStock} left)`
                      : `In Stock (${availableStock} left)`}
                </span>
              </div>
              {reviews.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 hover:text-[#717fe0] tabular-nums"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
                  {avgRating.toFixed(1)} ({reviews.length})
                </button>
              )}
            </div>

            <h2
              id="quick-view-title"
              className="font-display text-2xl font-semibold text-neutral-900 mb-1.5"
            >
              {product.name}
            </h2>

            <p className="text-xl font-semibold text-neutral-900 tabular-nums mb-4">
              {formatPrice(product.pricePkr, currency)}
            </p>

            {/* Sub-Navigation Tabs: Details | Reviews */}
            <div className="flex items-center gap-5 border-b border-neutral-200 mb-5">
              {[
                { id: 'details', label: 'Details' },
                { id: 'reviews', label: `Reviews (${reviews.length})` },
              ].map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as ModalTab)}
                    className={`relative pb-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      isSelected
                        ? 'text-[#717fe0]'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {tab.label}
                    {isSelected && (
                      <motion.span
                        layoutId="quickview-tab-underline"
                        transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                        className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#717fe0]"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Details & Variants */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {product.description}
                </p>

                <p className="text-xs text-neutral-500 border-t border-neutral-200 pt-3">
                  Material: <span className="text-neutral-800">{product.material}</span>
                </p>

                {/* Color Variant Selector */}
                <div>
                  <span className="block text-xs font-medium text-neutral-700 mb-2">
                    Color — {activeColor}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((variant) => {
                      const isSelected = activeColor === variant.name;
                      return (
                        <button
                          key={variant.name}
                          type="button"
                          onClick={() => setSelectedColor(variant.name)}
                          className={`inline-flex items-center gap-2 h-9 px-2.5 border text-xs transition-colors ${
                            isSelected
                              ? 'border-neutral-900 bg-neutral-50 font-semibold text-neutral-900'
                              : 'border-neutral-300 text-neutral-700 hover:border-neutral-700'
                          }`}
                        >
                          <span
                            className="w-4 h-4 border border-neutral-300 shrink-0"
                            style={{ backgroundColor: variant.hex }}
                            aria-hidden="true"
                          />
                          {variant.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-neutral-700">
                      Select Size
                    </span>
                    <button
                      type="button"
                      onClick={() => setSizeGuideOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[#717fe0]/40 bg-[#717fe0]/[0.06] hover:bg-[#717fe0] text-xs font-semibold text-[#4c58b6] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0]"
                    >
                      <Ruler className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Size Guide</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => {
                      const active = activeSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-[44px] h-10 px-3 text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0] whitespace-nowrap ${
                            active
                              ? 'border-neutral-900 bg-neutral-900 text-white'
                              : 'border-neutral-300 bg-white text-neutral-800 hover:border-neutral-900'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Customer Reviews */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <div className="max-h-44 overflow-y-auto space-y-3 pr-1">
                  {reviews.length === 0 ? (
                    <p className="text-xs text-neutral-500">
                      No reviews yet. Be the first to review this piece.
                    </p>
                  ) : (
                    reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="pb-3 border-b border-neutral-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold text-neutral-900">
                            {rev.author} · <span className="font-normal text-neutral-500">{rev.area}</span>
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-amber-500 text-xs tabular-nums">
                            {Array.from({ length: rev.rating }).map((_, idx) => (
                              <Star
                                key={idx}
                                className="w-3 h-3 fill-current"
                                aria-hidden="true"
                              />
                            ))}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 leading-relaxed">
                          {rev.comment}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {!user ? (
                  <div className="pt-3 border-t border-neutral-200 space-y-2.5">
                    <p className="text-xs text-neutral-600">
                      Sign in with Google to post a verified customer review.
                    </p>
                    <button
                      type="button"
                      onClick={() => void onSignInGoogle()}
                      className="h-9 px-4 bg-[#717fe0] hover:bg-[#5b69cf] text-white text-xs font-semibold transition-colors"
                    >
                      Sign in with Google to Review
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="pt-3 border-t border-neutral-200 space-y-2.5"
                  >
                    <p className="text-xs font-semibold text-neutral-900">
                      Write a Verified Review
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={reviewAuthor}
                        onChange={(e) => setReviewAuthor(e.target.value)}
                        placeholder={user.displayName || 'Your name'}
                        required
                        className="h-9 px-2.5 text-xs border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                      />
                      <input
                        type="text"
                        value={reviewArea}
                        onChange={(e) => setReviewArea(e.target.value)}
                        placeholder="Karachi area (e.g. Clifton)"
                        className="h-9 px-2.5 text-xs border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-600">
                      <span>Rating:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          aria-label={`Rate ${star} stars`}
                          className="p-0.5"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= reviewRating
                                ? 'fill-amber-500 text-amber-500'
                                : 'text-neutral-300'
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your feedback on fit & fabric..."
                        required
                        className="flex-1 h-9 px-2.5 text-xs border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                      />
                      <button
                        type="submit"
                        className="h-9 px-3.5 bg-neutral-900 hover:bg-[#717fe0] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        Post
                      </button>
                    </div>
                    {reviewSubmitted && (
                      <p className="text-xs text-emerald-700 font-medium">
                        Verified review saved!
                      </p>
                    )}
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Primary Purchase Actions */}
          <div className="space-y-2.5 pt-4 border-t border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-neutral-300 h-11">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-10 h-full flex items-center justify-center text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <span className="w-10 text-center text-sm font-medium tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() =>
                    setQuantity((q) => Math.min(availableStock, q + 1))
                  }
                  aria-label="Increase quantity"
                  className="w-10 h-full flex items-center justify-center text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAdd}
                className="flex-1 h-11 px-6 bg-[#717fe0] hover:bg-[#5b69cf] disabled:bg-neutral-300 disabled:text-neutral-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#717fe0] whitespace-nowrap"
              >
                {isOutOfStock ? (
                  'Out of Stock'
                ) : justAdded ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    Added to Bag
                  </>
                ) : (
                  'Add to Bag'
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onToggleWishlist(product.id)}
                className="h-10 border border-neutral-300 hover:border-neutral-900 text-neutral-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    isWishlisted ? 'fill-[#717fe0] text-[#717fe0]' : ''
                  }`}
                  aria-hidden="true"
                />
                {isWishlisted ? 'Saved' : 'Save Wishlist'}
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 border border-emerald-700 text-emerald-800 hover:bg-emerald-700 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                Order via WhatsApp
              </a>
            </div>
          </div>
        </div>
          </motion.div>

          {/* Dedicated Detailed Size Guide Modal */}
          <AnimatePresence>
            {sizeGuideOpen && measureTips && (
              <motion.div
                key="size-guide-modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="size-guide-modal-title"
                onClick={(e) => {
                  e.stopPropagation();
                  setSizeGuideOpen(false);
                }}
              >
                <motion.div
                  key="size-guide-modal-dialog"
                  initial={{ opacity: 0, scale: 0.97, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: 8 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full max-w-2xl bg-white shadow-2xl border border-neutral-200 max-h-[88vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="px-6 py-5 border-b border-neutral-200 flex items-start justify-between gap-4 bg-[#f8f7f4]">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#717fe0] mb-1">
                        {product.category} Fit Specifications
                      </p>
                      <h3
                        id="size-guide-modal-title"
                        className="font-editorial text-2xl sm:text-3xl font-semibold text-neutral-900"
                      >
                        Size Guide &amp; Measurement Chart
                      </h3>
                      <p className="text-xs text-neutral-600 mt-1">
                        {product.name} · Material: {product.material}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSizeGuideOpen(false)}
                      aria-label="Close size guide modal"
                      className="w-9 h-9 flex items-center justify-center text-neutral-600 hover:text-neutral-950 bg-white border border-neutral-200 transition-colors"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-6">
                    {/* Fit Summary & Unit Switcher */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-xs text-neutral-700 leading-relaxed max-w-md">
                        {measureTips.fitSummary}
                      </p>

                      {supportsInchCmToggle && (
                        <div
                          className="inline-flex border border-neutral-300 bg-neutral-50 shrink-0 self-start"
                          role="group"
                          aria-label="Measurement unit"
                        >
                          <button
                            type="button"
                            onClick={() => setMeasureUnit('in')}
                            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                              measureUnit === 'in'
                                ? 'bg-neutral-900 text-white'
                                : 'text-neutral-600 hover:text-neutral-950'
                            }`}
                          >
                            Inches (in)
                          </button>
                          <button
                            type="button"
                            onClick={() => setMeasureUnit('cm')}
                            className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                              measureUnit === 'cm'
                                ? 'bg-neutral-900 text-white'
                                : 'text-neutral-600 hover:text-neutral-950'
                            }`}
                          >
                            Centimeters (cm)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Detailed Measurement Chart Table */}
                    <div className="overflow-x-auto border border-neutral-200">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-700">
                          <tr>
                            {product.sizeChartHeaders.map((header) => {
                              const formattedHeader =
                                supportsInchCmToggle && measureUnit === 'cm'
                                  ? header.replace('(in)', '(cm)')
                                  : header;
                              return (
                                <th
                                  key={header}
                                  className="py-3 px-4 font-semibold whitespace-nowrap"
                                >
                                  {formattedHeader}
                                </th>
                              );
                            })}
                            <th className="py-3 px-4 font-semibold text-right whitespace-nowrap">
                              Fit Selection
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 tabular-nums">
                          {product.sizeChart.map((row) => {
                            const isCurrentSize = activeSize === row.size;
                            const formatCell = (val: string) =>
                              supportsInchCmToggle && measureUnit === 'cm'
                                ? convertInchesStringToCm(val)
                                : val;

                            return (
                              <tr
                                key={row.size}
                                onClick={() => setSelectedSize(row.size)}
                                className={`cursor-pointer transition-colors ${
                                  isCurrentSize
                                    ? 'bg-[#717fe0]/[0.08]'
                                    : 'hover:bg-neutral-50'
                                }`}
                              >
                                <td className="py-3 px-4 font-semibold text-neutral-900">
                                  {row.size}
                                </td>
                                <td className="py-3 px-4 text-neutral-700">
                                  {formatCell(row.col1)}
                                </td>
                                <td className="py-3 px-4 text-neutral-700">
                                  {formatCell(row.col2)}
                                </td>
                                <td className="py-3 px-4 text-neutral-700">
                                  {formatCell(row.col3)}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {isCurrentSize ? (
                                    <span className="inline-flex items-center gap-1 text-[#4c58b6] font-semibold">
                                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                      Selected
                                    </span>
                                  ) : (
                                    <span className="text-neutral-500 hover:text-neutral-900 underline underline-offset-2">
                                      Choose
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* How to Measure Reference Grid */}
                    <div className="bg-[#f8f7f4] border border-neutral-200 p-4 sm:p-5 space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                        How to Measure for the Right Fit
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {measureTips.steps.map((step, index) => (
                          <div key={step.label} className="space-y-1">
                            <p className="text-xs font-semibold text-neutral-900">
                              <span className="text-[#717fe0] mr-1 tabular-nums">
                                0{index + 1}.
                              </span>
                              {step.label}
                            </p>
                            <p className="text-xs text-neutral-600 leading-relaxed">
                              {step.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Modal Footer Action */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-200">
                      <p className="text-xs text-neutral-600">
                        Active selection:{' '}
                        <strong className="text-neutral-900">Size {activeSize}</strong>{' '}
                        (click any chart row above to update)
                      </p>
                      <button
                        type="button"
                        onClick={() => setSizeGuideOpen(false)}
                        className="w-full sm:w-auto h-10 px-6 bg-[#161618] hover:bg-[#717fe0] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                      >
                        Apply Size {activeSize}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
