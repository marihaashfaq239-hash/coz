import { Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { CurrencyCode, formatPrice, Product } from '../data/products';
import { ResilientImage } from './ResilientImage';

interface WishlistDrawerProps {
  isOpen: boolean;
  products: Product[];
  currency: CurrencyCode;
  onClose: () => void;
  onRemove: (productId: string) => void;
  onMoveToBag: (product: Product) => void;
}

export function WishlistDrawer({
  isOpen,
  products,
  currency,
  onClose,
  onRemove,
  onMoveToBag,
}: WishlistDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="wishlist-drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Saved Wishlist"
          onClick={onClose}
        >
          <motion.div
            key="wishlist-drawer-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-neutral-900">
            Saved Wishlist
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close wishlist"
            className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-neutral-950 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <Heart className="w-10 h-10 text-neutral-300 mb-3 stroke-[1.5]" aria-hidden="true" />
              <p className="text-sm font-medium text-neutral-900 mb-1">
                No saved items yet
              </p>
              <p className="text-xs text-neutral-500 mb-6 max-w-[240px]">
                Tap the heart icon on any product to keep track of pieces you love.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-semibold hover:bg-[#717fe0] transition-colors"
              >
                Explore Products
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-200">
              {products.map((product) => (
                <li key={product.id} className="group py-4 flex gap-4">
                  <div className="w-20 h-24 bg-[#efefef] shrink-0 overflow-hidden">
                    <ResilientImage
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover object-top transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                      fallbackLabel={product.name}
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5 tabular-nums">
                          {formatPrice(product.pricePkr, currency)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(product.id)}
                        aria-label={`Remove ${product.name} from wishlist`}
                        className="text-neutral-400 hover:text-neutral-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onMoveToBag(product)}
                      className="mt-3 inline-flex items-center justify-center gap-1.5 h-9 px-3 border border-neutral-900 text-neutral-900 hover:bg-[#717fe0] hover:border-[#717fe0] hover:text-white text-xs font-semibold transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                      Move to Bag
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
