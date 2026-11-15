import { onAuthStateChanged, User } from 'firebase/auth';
import { ArrowUp, Search, SlidersHorizontal, X } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AboutPage } from './components/AboutPage';
import { AccountModal } from './components/AccountModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPage } from './components/CheckoutPage';
import { ContactPage, ContactSubmission } from './components/ContactPage';
import { Footer } from './components/Footer';
import { Header, InfoModalTab, NavDestination } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { InfoModal } from './components/InfoModal';
import { ProductCard } from './components/ProductCard';
import { QuickViewModal } from './components/QuickViewModal';
import { SeasonalEditSection } from './components/SeasonalEditSection';
import { StudioShowcaseSection } from './components/StudioShowcaseSection';
import { WishlistDrawer } from './components/WishlistDrawer';
import {
  CATEGORIES,
  CartItem,
  Category,
  CurrencyCode,
  INITIAL_REVIEWS,
  KARACHI_ZONES,
  OrderRecord,
  Product,
  ProductReview,
  PRODUCTS,
  SortOption,
} from './data/products';
import {
  auth,
  checkIsAdmin,
  createContactMessage,
  createFirestoreReview,
  createOrderInFirestore,
  FirestoreProductDoc,
  saveUserWishlist,
  signInWithGoogle,
  signOutUser,
  StoredContactMessage,
  StoredNewsletterSubscriber,
  StoredOrderSummary,
  subscribeAllOrdersAdmin,
  subscribeContactMessagesAdmin,
  subscribeFirestoreProducts,
  subscribeFirestoreReviews,
  subscribeNewsletterAdmin,
  subscribeNewsletterUser,
  subscribeUserOrders,
  subscribeUserPreferences,
} from './firebase';

type PriceRangeFilter = 'all' | 'under-4000' | '4000-10000' | 'over-10000';
type ActivePage = 'store' | 'about' | 'contact' | 'checkout';

const CART_STORAGE_KEY = 'coza_karachi_cart_v1';
const WISHLIST_STORAGE_KEY = 'coza_karachi_wishlist_v1';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('store');
  const [activeNav, setActiveNav] = useState<NavDestination>('Shop');
  const [selectedCategory, setSelectedCategory] = useState<Category>('All Products');
  const [currency, setCurrency] = useState<CurrencyCode>('PKR');
  const [selectedZoneId, setSelectedZoneId] = useState<string>(KARACHI_ZONES[0].id);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [priceRange, setPriceRange] = useState<PriceRangeFilter>('all');

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [firestoreProducts, setFirestoreProducts] = useState<FirestoreProductDoc[]>([]);
  const [firestoreReviews, setFirestoreReviews] = useState<
    Record<string, ProductReview[]>
  >({});
  const [localReviews, setLocalReviews] = useState<Record<string, ProductReview[]>>({});

  const [userOrders, setUserOrders] = useState<StoredOrderSummary[]>([]);
  const [adminOrders, setAdminOrders] = useState<StoredOrderSummary[]>([]);
  const [adminMessages, setAdminMessages] = useState<StoredContactMessage[]>([]);
  const [adminSubscribers, setAdminSubscribers] = useState<
    StoredNewsletterSubscriber[]
  >([]);
  const [sessionStockAdjustments, setSessionStockAdjustments] = useState<
    Record<string, number>
  >({});

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CartItem[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [
      {
        product: PRODUCTS[0],
        size: 'M',
        color: PRODUCTS[0].color,
        quantity: 1,
      },
      {
        product: PRODUCTS[2],
        size: 'L',
        color: PRODUCTS[2].color,
        quantity: 1,
      },
    ];
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  const [sessionOrders, setSessionOrders] = useState<OrderRecord[]>([]);

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewInitialColor, setQuickViewInitialColor] = useState<string | undefined>(
    undefined
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [infoModalTab, setInfoModalTab] = useState<InfoModalTab | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const catalogRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 520);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Persist cart & guest wishlist locally
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // ignore storage quota
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      // ignore storage quota
    }
  }, [wishlistIds]);

  // Firebase Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (nextUser) {
        const adminStatus = await checkIsAdmin(nextUser);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
        setUserOrders([]);
        setAdminOrders([]);
        setAdminMessages([]);
        setAdminSubscribers([]);
      }
    });
    return () => unsub();
  }, []);

  // Public Firestore listeners (Products & Reviews)
  useEffect(() => {
    const unsubProducts = subscribeFirestoreProducts((docs) => {
      setFirestoreProducts(docs);
    });
    const unsubReviews = subscribeFirestoreReviews((grouped) => {
      setFirestoreReviews(grouped);
    });
    return () => {
      unsubProducts();
      unsubReviews();
    };
  }, []);

  // Authenticated User Listeners (Preferences & Order History)
  useEffect(() => {
    if (!authReady || !user) return;
    const unsubPrefs = subscribeUserPreferences(user.uid, (savedWishlist) => {
      setWishlistIds(savedWishlist);
    });
    const unsubOrders = subscribeUserOrders(user.uid, (orders) => {
      setUserOrders(orders);
    });
    return () => {
      unsubPrefs();
      unsubOrders();
    };
  }, [authReady, user]);

  // Admin Orders, Contact Messages & Newsletter Subscribers Listeners
  useEffect(() => {
    if (!authReady || !user || !isAdmin) return;
    const unsubAdminOrders = subscribeAllOrdersAdmin((orders) => {
      setAdminOrders(orders);
    });
    const unsubAdminMessages = subscribeContactMessagesAdmin((messages) => {
      setAdminMessages(messages);
    });
    const unsubAdminSubscribers = subscribeNewsletterAdmin((subscribers) => {
      setAdminSubscribers(subscribers);
    });
    return () => {
      unsubAdminOrders();
      unsubAdminMessages();
      unsubAdminSubscribers();
    };
  }, [authReady, user, isAdmin]);

  // Reset local stock deductions when Firestore catalog updates
  useEffect(() => {
    if (firestoreProducts.length > 0) {
      setSessionStockAdjustments({});
    }
  }, [firestoreProducts]);

  // Merge static base catalog with live Firestore overrides / admin additions
  const mergedProducts: Product[] = useMemo(() => {
    const applySessionDeduction = (item: Product): Product => {
      const deducted = sessionStockAdjustments[item.id] ?? 0;
      const baseStock = item.stock ?? 24;
      return {
        ...item,
        stock: Math.max(0, baseStock - deducted),
      };
    };

    if (firestoreProducts.length === 0) {
      return PRODUCTS.map(applySessionDeduction);
    }

    const fsMap = new Map(firestoreProducts.map((d) => [d.id, d]));
    const updatedBase = PRODUCTS.map((base) => {
      const override = fsMap.get(base.id);
      if (!override) return base;
      fsMap.delete(base.id);
      return {
        ...base,
        name: override.name || base.name,
        category: override.category || base.category,
        pricePkr: override.pricePkr || base.pricePkr,
        stock: override.stock,
        color: override.color || base.color,
        colorHex: override.colorHex || base.colorHex,
        material: override.material || base.material,
        description: override.description || base.description,
        image: override.image || base.image,
        tag: override.tag,
        featuredRank: override.featuredRank ?? base.featuredRank,
      };
    });

    const customAdded: Product[] = Array.from(fsMap.values()).map((docItem) => {
      const template =
        PRODUCTS.find((p) => p.category === docItem.category) ?? PRODUCTS[0];
      return {
        ...template,
        id: docItem.id,
        name: docItem.name,
        category: docItem.category,
        pricePkr: docItem.pricePkr,
        stock: docItem.stock,
        color: docItem.color,
        colorHex: docItem.colorHex,
        variants: [{ name: docItem.color, hex: docItem.colorHex }],
        material: docItem.material,
        description: docItem.description,
        image: docItem.image,
        tag: docItem.tag,
        featuredRank: docItem.featuredRank,
      };
    });

    return [...updatedBase, ...customAdded].map(applySessionDeduction);
  }, [firestoreProducts, sessionStockAdjustments]);

  // Merge initial reviews + Firestore reviews + local session reviews
  const reviewsByProduct: Record<string, ProductReview[]> = useMemo(() => {
    const combined: Record<string, ProductReview[]> = {};
    for (const product of mergedProducts) {
      const base = INITIAL_REVIEWS[product.id] ?? [];
      const fs = firestoreReviews[product.id] ?? [];
      const local = localReviews[product.id] ?? [];
      combined[product.id] = [...local, ...fs, ...base];
    }
    return combined;
  }, [mergedProducts, firestoreReviews, localReviews]);

  const scrollToCatalog = () => {
    setTimeout(() => {
      catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const navigateToPage = (page: ActivePage) => {
    setActivePage(page);
    if (page === 'about') setActiveNav('About');
    else if (page === 'contact') setActiveNav('Contact');
    else setActiveNav('Shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectNav = (nav: NavDestination) => {
    setActiveNav(nav);
    if (nav === 'About') {
      setActivePage('about');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (nav === 'Contact') {
      setActivePage('contact');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActivePage('store');
    if (nav === 'Shop') {
      setSelectedCategory('All Products');
    } else if (nav === 'Women') {
      setSelectedCategory('Women');
    } else if (nav === 'Men') {
      setSelectedCategory('Men');
    }
    scrollToCatalog();
  };

  const handleCategoryTabClick = (category: Category) => {
    setSelectedCategory(category);
    if (category === 'Women') setActiveNav('Women');
    else if (category === 'Men') setActiveNav('Men');
    else setActiveNav('Shop');
  };

  const handleFooterCategorySelect = (category: Category) => {
    setActivePage('store');
    handleCategoryTabClick(category);
    scrollToCatalog();
  };

  const handleToggleSearch = () => {
    if (activePage !== 'store') {
      setActivePage('store');
      setActiveNav('Shop');
      setSearchOpen(true);
      setTimeout(() => {
        catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        searchInputRef.current?.focus();
      }, 90);
      return;
    }
    setSearchOpen((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          searchInputRef.current?.focus();
        }, 80);
      }
      return next;
    });
  };

  const handleToggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      if (user) {
        void saveUserWishlist(user, next);
      }
      return next;
    });
  };

  const handleAddToCart = (
    product: Product,
    size: string,
    color: string,
    quantity: number
  ) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.size === size &&
          item.color === color
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }
      return [
        ...prev,
        {
          product,
          size,
          color,
          quantity,
        },
      ];
    });
  };

  const handleUpdateCartQuantity = (
    productId: string,
    size: string,
    color: string,
    delta: number
  ) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId &&
          item.size === size &&
          item.color === color
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (
    productId: string,
    size: string,
    color: string
  ) => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.size === size &&
            item.color === color
          )
      )
    );
  };

  const handleMoveWishlistToBag = (product: Product) => {
    handleAddToCart(
      product,
      product.sizes[0] ?? 'One Size',
      product.color,
      1
    );
    handleToggleWishlist(product.id);
    setWishlistOpen(false);
    setCartOpen(true);
  };

  const handleAddReview = async (
    productId: string,
    review: Omit<ProductReview, 'id' | 'date'>
  ) => {
    if (user && user.emailVerified) {
      await createFirestoreReview(user, productId, review);
      return;
    }
    const newReview: ProductReview = {
      ...review,
      id: `rev-${Date.now()}`,
      date: 'Nov 2026',
    };
    setLocalReviews((prev) => ({
      ...prev,
      [productId]: [newReview, ...(prev[productId] ?? [])],
    }));
  };

  const handleOrderComplete = async (order: OrderRecord) => {
    if (user && user.emailVerified) {
      await createOrderInFirestore(user, order);
    }
    setSessionStockAdjustments((prev) => {
      const next = { ...prev };
      for (const item of order.items) {
        next[item.product.id] = (next[item.product.id] ?? 0) + item.quantity;
      }
      return next;
    });
    setSessionOrders((prev) => [order, ...prev]);
    setCartItems([]);
    setAppliedPromoCode(null);
  };

  const handleContactSubmit = async (inquiry: ContactSubmission) => {
    if (user && user.emailVerified) {
      await createContactMessage(user, inquiry);
    }
  };

  const handleSubscribeNewsletter = async (email: string): Promise<boolean> => {
    try {
      localStorage.setItem('coza_newsletter_email_v1', email);
    } catch {
      // ignore storage errors
    }
    if (user && user.emailVerified) {
      await subscribeNewsletterUser(user, email);
      return true;
    }
    return false;
  };

  const handleSignInGoogle = async () => {
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOutUser();
  };

  const resetAllFilters = () => {
    setSelectedCategory('All Products');
    setSearchQuery('');
    setPriceRange('all');
    setSortBy('featured');
    setActiveNav('Shop');
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const list = mergedProducts.filter((product) => {
      if (
        selectedCategory !== 'All Products' &&
        product.category !== selectedCategory
      ) {
        return false;
      }

      if (priceRange === 'under-4000' && product.pricePkr >= 4000) return false;
      if (
        priceRange === '4000-10000' &&
        (product.pricePkr < 4000 || product.pricePkr > 10000)
      ) {
        return false;
      }
      if (priceRange === 'over-10000' && product.pricePkr <= 10000) return false;

      if (query) {
        const haystack =
          `${product.name} ${product.category} ${product.color} ${product.material}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.pricePkr - b.pricePkr;
      if (sortBy === 'price-desc') return b.pricePkr - a.pricePkr;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      return a.featuredRank - b.featuredRank;
    });
  }, [mergedProducts, selectedCategory, priceRange, searchQuery, sortBy]);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistProducts = mergedProducts.filter((p) => wishlistIds.includes(p.id));
  const hasActiveFilters =
    selectedCategory !== 'All Products' ||
    priceRange !== 'all' ||
    sortBy !== 'featured' ||
    searchQuery.trim() !== '';

  const quickViewRelatedProducts = useMemo(() => {
    if (!quickViewProduct) return [];
    const others = mergedProducts.filter((p) => p.id !== quickViewProduct.id);
    const complementary = others.filter((p) => p.category !== quickViewProduct.category);
    const sameCategory = others.filter((p) => p.category === quickViewProduct.category);
    return [...complementary, ...sameCategory].slice(0, 3);
  }, [mergedProducts, quickViewProduct]);

  return (
    <MotionConfig reducedMotion="user">
      <div id="top" className="min-h-screen flex flex-col bg-white text-neutral-900">
        <Header
          activeNav={activeNav}
          onSelectNav={handleSelectNav}
          onOpenInfo={(tab) => setInfoModalTab(tab)}
          user={user}
          isAdmin={isAdmin}
          onOpenAccount={() => setAccountOpen(true)}
          onOpenAdmin={() => setAdminOpen(true)}
          currency={currency}
          onCurrencyChange={setCurrency}
          cartCount={totalCartCount}
          wishlistCount={wishlistIds.length}
          onOpenCart={() => setCartOpen(true)}
          onOpenWishlist={() => setWishlistOpen(true)}
          onToggleSearch={handleToggleSearch}
        />

        <main className="flex-1">
          <AnimatePresence mode="wait">
            {activePage === 'about' ? (
              <motion.div
                key="page-about"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              >
                <AboutPage
                  onShopNow={() => {
                    setActivePage('store');
                    setActiveNav('Shop');
                    setSelectedCategory('All Products');
                    scrollToCatalog();
                  }}
                  onGoToContact={() => navigateToPage('contact')}
                />
              </motion.div>
            ) : activePage === 'contact' ? (
              <motion.div
                key="page-contact"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              >
                <ContactPage
                  user={user}
                  currency={currency}
                  onSignInGoogle={handleSignInGoogle}
                  onSubmitInquiry={handleContactSubmit}
                />
              </motion.div>
            ) : activePage === 'checkout' ? (
              <motion.div
                key="page-checkout"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              >
                <CheckoutPage
                  items={cartItems}
                  currency={currency}
                  selectedZoneId={selectedZoneId}
                  appliedPromoCode={appliedPromoCode}
                  onApplyPromoCode={setAppliedPromoCode}
                  user={user}
                  onSignInGoogle={handleSignInGoogle}
                  onChangeZone={setSelectedZoneId}
                  onUpdateQuantity={handleUpdateCartQuantity}
                  onRemoveItem={handleRemoveCartItem}
                  onOrderComplete={handleOrderComplete}
                  onContinueShopping={() => navigateToPage('store')}
                  onTrackOrder={() => setInfoModalTab('track')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="page-store"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Section 1: Editorial Storefront Hero */}
                <HeroBanner
                  onShopNow={scrollToCatalog}
                  onExploreStudio={() => navigateToPage('about')}
                  featuredProduct={mergedProducts[3] ?? mergedProducts[0]}
                  currency={currency}
                  onInspectFeatured={(p) => {
                    setQuickViewInitialColor(undefined);
                    setQuickViewProduct(p);
                  }}
                />

                {/* Section 2: Curated Department Lookbook Triptych */}
                <SeasonalEditSection
                  onSelectDepartment={(cat) => {
                    handleCategoryTabClick(cat);
                    scrollToCatalog();
                  }}
                />

                {/* Section 3: Product Catalog Toolbar & Grid */}
                <section
                  ref={catalogRef}
                  aria-label="Product catalog"
                  className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 sm:pt-16 pb-8 scroll-mt-20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-7">
                    <div>
                      <p className="text-xs font-medium text-[#717fe0] mb-1">
                        Complete Archive
                      </p>
                      <h2
                        className="font-editorial text-3xl sm:text-4xl font-semibold text-neutral-900 tracking-[-0.015em]"
                        style={{ textWrap: 'balance' }}
                      >
                        Autumn / Winter Collection
                      </h2>
                    </div>
                    <p className="text-xs text-neutral-500 tabular-nums">
                      Showing {filteredProducts.length} of {mergedProducts.length} curated silhouettes
                    </p>
                  </div>

              {/* Category Tabs & Filter / Search Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-neutral-200/80">
                <div
                  role="tablist"
                  aria-label="Product categories"
                  className="flex items-center gap-6 sm:gap-8 overflow-x-auto pb-1 md:pb-0"
                >
                  {CATEGORIES.map((category) => {
                    const isSelected = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => handleCategoryTabClick(category)}
                        className={`relative py-1.5 text-[15px] transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0] rounded-sm ${
                          isSelected
                            ? 'text-neutral-950 font-medium'
                            : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                      >
                        {category}
                        {isSelected && (
                          <motion.span
                            layoutId="category-tab-underline"
                            transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                            className="absolute left-0 right-0 bottom-0 h-[1.5px] bg-neutral-900"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setFilterPanelOpen((prev) => !prev)}
                aria-expanded={filterPanelOpen}
                className={`inline-flex items-center gap-2 h-10 px-4 text-sm border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0] ${
                  filterPanelOpen
                    ? 'border-[#717fe0] bg-[#717fe0] text-white'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-950'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                Filter
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchOpen((prev) => !prev);
                  if (!searchOpen) {
                    setTimeout(() => searchInputRef.current?.focus(), 60);
                  }
                }}
                aria-expanded={searchOpen}
                className={`inline-flex items-center gap-2 h-10 px-4 text-sm border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0] ${
                  searchOpen
                    ? 'border-[#717fe0] bg-[#717fe0] text-white'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-950'
                }`}
              >
                <Search className="w-3.5 h-3.5" aria-hidden="true" />
                Search
              </button>
            </div>
          </div>

          {/* Expandable Search Bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                key="catalog-search-bar"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="pt-5"
              >
                <div className="relative flex items-center border border-neutral-300 bg-white transition-colors focus-within:border-[#717fe0]">
                  <Search
                    className="w-4 h-4 text-neutral-400 ml-4 shrink-0"
                    aria-hidden="true"
                  />
                  <label htmlFor="catalog-search-input" className="sr-only">
                    Search products
                  </label>
                  <input
                    ref={searchInputRef}
                    id="catalog-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shirts, coats, leather totes, sneakers, watches..."
                    className="w-full h-12 px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search query"
                      className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-neutral-800 mr-1 transition-colors"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expandable Filter & Sort Panel */}
          <AnimatePresence>
            {filterPanelOpen && (
              <motion.div
                key="catalog-filter-panel"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="mt-5 p-6 bg-neutral-50 border border-neutral-200 grid grid-cols-1 sm:grid-cols-3 gap-6"
              >
                <div>
                  <p className="text-xs font-semibold text-neutral-900 mb-3">
                    Sort By
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {[
                      { id: 'featured', label: 'Featured' },
                      { id: 'price-asc', label: 'Price: Low to High' },
                      { id: 'price-desc', label: 'Price: High to Low' },
                      { id: 'name-asc', label: 'Alphabetical (A–Z)' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSortBy(option.id as SortOption)}
                        className={`block text-left transition-all duration-150 ${
                          sortBy === option.id
                            ? 'text-[#717fe0] font-medium translate-x-0.5'
                            : 'text-neutral-600 hover:text-neutral-950 hover:translate-x-0.5'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-neutral-900 mb-3">
                    Price Range
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {[
                      { id: 'all', label: 'All Prices' },
                      { id: 'under-4000', label: 'Under Rs. 4,000' },
                      { id: '4000-10000', label: 'Rs. 4,000 — Rs. 10,000' },
                      { id: 'over-10000', label: 'Over Rs. 10,000' },
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setPriceRange(option.id as PriceRangeFilter)}
                        className={`block text-left transition-all duration-150 ${
                          priceRange === option.id
                            ? 'text-[#717fe0] font-medium translate-x-0.5'
                            : 'text-neutral-600 hover:text-neutral-950 hover:translate-x-0.5'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-900 mb-3">
                      Active Selection
                    </p>
                    <p className="text-sm text-neutral-600 tabular-nums">
                      Showing {filteredProducts.length} of {mergedProducts.length} pieces
                    </p>
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="mt-4 self-start text-xs font-semibold text-[#717fe0] hover:underline"
                    >
                      Reset all filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 4-Column Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-display text-lg font-medium text-neutral-900 mb-2">
                No matching pieces found
              </p>
              <p className="text-sm text-neutral-500 mb-6">
                Try clearing your search term or selecting a broader price range.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-6 py-2.5 bg-neutral-900 hover:bg-[#717fe0] text-white text-xs font-semibold transition-colors"
              >
                Show All Products
              </button>
            </div>
          ) : (
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-7 gap-y-10">
              {filteredProducts.map((product, idx) => {
                const productReviews = reviewsByProduct[product.id] ?? [];
                const avgRating =
                  productReviews.length > 0
                    ? productReviews.reduce((s, r) => s + r.rating, 0) /
                      productReviews.length
                    : 0;

                return (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={idx}
                    currency={currency}
                    isWishlisted={wishlistIds.includes(product.id)}
                    averageRating={avgRating}
                    reviewCount={productReviews.length}
                    onToggleWishlist={handleToggleWishlist}
                    onQuickView={(p, initialCol) => {
                      setQuickViewInitialColor(initialCol);
                      setQuickViewProduct(p);
                    }}
                  />
                );
              })}
            </div>
          )}
        </section>

                {/* Section 4: Dark Architectural Flagship Studio Showcase */}
                <StudioShowcaseSection
                  onOpenAbout={() => navigateToPage('about')}
                  onTrackOrder={() => setInfoModalTab('track')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

      <Footer
        onSelectCategory={handleFooterCategorySelect}
        onOpenInfo={(tab) => setInfoModalTab(tab)}
        onNavigatePage={navigateToPage}
        onSubscribeNewsletter={handleSubscribeNewsletter}
      />

      <QuickViewModal
        product={quickViewProduct}
        initialColor={quickViewInitialColor}
        currency={currency}
        isWishlisted={
          quickViewProduct ? wishlistIds.includes(quickViewProduct.id) : false
        }
        reviews={
          quickViewProduct ? reviewsByProduct[quickViewProduct.id] ?? [] : []
        }
        user={user}
        onSignInGoogle={handleSignInGoogle}
        onClose={() => {
          setQuickViewProduct(null);
          setQuickViewInitialColor(undefined);
        }}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        onAddReview={handleAddReview}
        relatedProducts={quickViewRelatedProducts}
        onSelectRelated={(nextProduct) => {
          setQuickViewInitialColor(undefined);
          setQuickViewProduct(nextProduct);
        }}
      />

      <CartDrawer
        isOpen={cartOpen}
        items={cartItems}
        currency={currency}
        selectedZoneId={selectedZoneId}
        appliedPromoCode={appliedPromoCode}
        onApplyPromoCode={setAppliedPromoCode}
        user={user}
        onSignInGoogle={handleSignInGoogle}
        onChangeZone={setSelectedZoneId}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onOrderComplete={handleOrderComplete}
        onProceedToCheckout={() => navigateToPage('checkout')}
      />

      <WishlistDrawer
        isOpen={wishlistOpen}
        products={wishlistProducts}
        currency={currency}
        onClose={() => setWishlistOpen(false)}
        onRemove={handleToggleWishlist}
        onMoveToBag={handleMoveWishlistToBag}
      />

      <InfoModal
        activeTab={infoModalTab}
        currency={currency}
        user={user}
        recentOrders={sessionOrders}
        userOrders={userOrders}
        onSignInGoogle={handleSignInGoogle}
        onClose={() => setInfoModalTab(null)}
        onChangeTab={(tab) => setInfoModalTab(tab)}
      />

      <AccountModal
        isOpen={accountOpen}
        user={user}
        isAdmin={isAdmin}
        authReady={authReady}
        currency={currency}
        userOrders={userOrders}
        onClose={() => setAccountOpen(false)}
        onSignInGoogle={handleSignInGoogle}
        onSignOut={handleSignOut}
        onOpenAdmin={() => setAdminOpen(true)}
      />

        <AdminDashboardModal
          isOpen={adminOpen}
          isAdmin={isAdmin}
          currency={currency}
          orders={adminOrders}
          messages={adminMessages}
          subscribers={adminSubscribers}
          products={mergedProducts}
          firestoreProductsCount={firestoreProducts.length}
          onClose={() => setAdminOpen(false)}
        />

        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              key="floating-scroll-top"
              type="button"
              initial={{ opacity: 0, y: 12, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.92 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Scroll to top"
              className="no-print fixed bottom-6 right-6 z-40 w-10 h-10 bg-[#161618] hover:bg-[#717fe0] text-white shadow-lg border border-neutral-800 hover:border-[#717fe0] flex items-center justify-center transition-colors duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717fe0]"
            >
              <ArrowUp className="w-4 h-4" aria-hidden="true" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
