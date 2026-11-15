import heroEditorialImg from '../assets/images/hero_editorial_fashion_1794555104500.jpg';
import productCanvasWeekenderImg from '../assets/images/product_canvas_weekender_1794755383240.jpg';
import productCheckShirtImg from '../assets/images/product_check_shirt_1794555102942.jpg';
import productChelseaBootImg from '../assets/images/product_chelsea_boot_1794755384726.jpg';
import productWatchImg from '../assets/images/product_chronograph_watch_1794555104559.jpg';
import productCottonOvershirtImg from '../assets/images/product_cotton_overshirt_1794755382707.jpg';
import productCrossbodyBagImg from '../assets/images/product_crossbody_bag_1794755383219.jpg';
import productDenimJacketImg from '../assets/images/product_denim_jacket_1794555104203.jpg';
import productFieldWatchImg from '../assets/images/product_field_watch_1794755385196.jpg';
import productKnitPoloImg from '../assets/images/product_knit_polo_1794755383365.jpg';
import productLeatherToteImg from '../assets/images/product_leather_tote_1794555103065.jpg';
import productLinenTunicImg from '../assets/images/product_linen_blouse_1794755382559.jpg';
import productSneakerImg from '../assets/images/product_minimal_sneaker_1794555103788.jpg';
import productSuedeLoaferImg from '../assets/images/product_suede_loafer_1794755383701.jpg';
import productTrenchCoatImg from '../assets/images/product_trench_coat_1794555102579.jpg';
import productWhiteShirtImg from '../assets/images/product_white_shirt_1794555101875.jpg';
import productWhiteTeeImg from '../assets/images/product_white_tee_1794555102581.jpg';
import studioInteriorImg from '../assets/images/studio_karachi_interior_1794755384917.jpg';

export type Category = 'All Products' | 'Women' | 'Men' | 'Bag' | 'Shoes' | 'Watches';

export type CurrencyCode = 'PKR' | 'USD' | 'EUR' | 'GBP';

export type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

export type PaymentMethod = 'Cash on Delivery' | 'JazzCash' | 'Easypaisa' | 'Card';

export type OrderStatus =
  | 'Pending'
  | 'Packed'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface ColorVariant {
  name: string;
  hex: string;
}

export interface SizeChartRow {
  size: string;
  col1: string;
  col2: string;
  col3: string;
}

export interface ProductReview {
  id: string;
  author: string;
  area: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Product {
  id: string;
  name: string;
  category: Exclude<Category, 'All Products'>;
  pricePkr: number;
  stock?: number;
  color: string;
  colorHex: string;
  variants: ColorVariant[];
  sizes: string[];
  sizeChartHeaders: [string, string, string, string];
  sizeChart: SizeChartRow[];
  material: string;
  description: string;
  image: string;
  featuredRank: number;
  tag?: string;
}

export interface CartItem {
  product: Product;
  size: string;
  color: string;
  quantity: number;
}

export interface KarachiZone {
  id: string;
  label: string;
  eta: string;
  feePkr: number;
}

export interface OrderRecord {
  orderNumber: string;
  placedAt: string;
  customerName: string;
  email: string;
  phone: string;
  zoneLabel: string;
  address: string;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  promoCode?: string;
  discountPkr: number;
  items: CartItem[];
  subtotalPkr: number;
  shippingPkr: number;
  totalPkr: number;
  status: string;
}

export const KARACHI_ZONES: KarachiZone[] = [
  {
    id: 'dha-clifton',
    label: 'DHA & Clifton (Karachi)',
    eta: 'Same-Day Express (4–6 hrs)',
    feePkr: 150,
  },
  {
    id: 'pechs-gulshan',
    label: 'PECHS, Bahadurabad & Gulshan (Karachi)',
    eta: 'Same-Day Courier (6–8 hrs)',
    feePkr: 200,
  },
  {
    id: 'north-nazimabad',
    label: 'North Nazimabad, FB Area & Jauhar (Karachi)',
    eta: 'Next-Day Delivery',
    feePkr: 250,
  },
  {
    id: 'saddar-shahrah',
    label: 'Saddar, Garden & Shahrah-e-Faisal (Karachi)',
    eta: 'Same-Day Courier',
    feePkr: 200,
  },
  {
    id: 'nationwide',
    label: 'Lahore, Islamabad & Nationwide',
    eta: '2–3 Business Days',
    feePkr: 350,
  },
];

export const FREE_DELIVERY_THRESHOLD_PKR = 5000;

export const PROMO_CODES: Record<
  string,
  { label: string; type: 'percent' | 'flat' | 'freeship'; value: number; minSubtotalPkr: number }
> = {
  COZA10: {
    label: 'COZA10 (10% off)',
    type: 'percent',
    value: 10,
    minSubtotalPkr: 0,
  },
  KARACHI500: {
    label: 'KARACHI500 (Rs. 500 off orders Rs. 3,000+)',
    type: 'flat',
    value: 500,
    minSubtotalPkr: 3000,
  },
  FREESHIP: {
    label: 'FREESHIP (Free Delivery)',
    type: 'freeship',
    value: 0,
    minSubtotalPkr: 0,
  },
};

export const STORE_WHATSAPP_NUMBER = '923003584194';

export const CURRENCY_CONFIG: Record<CurrencyCode, { symbol: string; rateFromPkr: number }> = {
  PKR: { symbol: 'Rs. ', rateFromPkr: 1 },
  USD: { symbol: '$', rateFromPkr: 1 / 278 },
  EUR: { symbol: '€', rateFromPkr: 1 / 302 },
  GBP: { symbol: '£', rateFromPkr: 1 / 352 },
};

export function formatPrice(amountPkr: number, currency: CurrencyCode): string {
  const { symbol, rateFromPkr } = CURRENCY_CONFIG[currency];
  const converted = amountPkr * rateFromPkr;
  if (currency === 'PKR') {
    return `${symbol}${Math.round(converted).toLocaleString('en-PK')}`;
  }
  return `${symbol}${converted.toFixed(2)}`;
}

export const CATEGORIES: Category[] = [
  'All Products',
  'Women',
  'Men',
  'Bag',
  'Shoes',
  'Watches',
];

export const HERO_BANNER_IMAGE = heroEditorialImg;
export const STUDIO_INTERIOR_IMAGE = studioInteriorImg;

const WOMENS_TOP_HEADERS: [string, string, string, string] = [
  'Size',
  'Chest (in)',
  'Shoulder (in)',
  'Length (in)',
];

const WOMENS_TOP_CHART: SizeChartRow[] = [
  { size: 'XS', col1: '33–34', col2: '14.5', col3: '24.0' },
  { size: 'S', col1: '35–36', col2: '15.0', col3: '24.5' },
  { size: 'M', col1: '37–38', col2: '15.5', col3: '25.5' },
  { size: 'L', col1: '39–41', col2: '16.2', col3: '26.5' },
  { size: 'XL', col1: '42–44', col2: '17.0', col3: '27.5' },
];

const MENS_TOP_HEADERS: [string, string, string, string] = [
  'Size',
  'Chest (in)',
  'Shoulder (in)',
  'Length (in)',
];

const MENS_TOP_CHART: SizeChartRow[] = [
  { size: 'S', col1: '37–38', col2: '17.0', col3: '27.5' },
  { size: 'M', col1: '39–40', col2: '17.8', col3: '28.5' },
  { size: 'L', col1: '41–43', col2: '18.5', col3: '29.5' },
  { size: 'XL', col1: '44–46', col2: '19.3', col3: '30.5' },
];

export const PRODUCTS: Product[] = [
  {
    id: 'esprit-ruffle-shirt',
    name: 'Esprit Ruffle Shirt',
    category: 'Women',
    pricePkr: 2250,
    stock: 28,
    color: 'Optic White',
    colorHex: '#f4f4f5',
    variants: [
      { name: 'Optic White', hex: '#f4f4f5' },
      { name: 'Soft Ivory', hex: '#f5f0e6' },
      { name: 'Carbon Black', hex: '#27272a' },
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    sizeChartHeaders: WOMENS_TOP_HEADERS,
    sizeChart: WOMENS_TOP_CHART.slice(0, 4),
    material: '100% Combed Organic Cotton',
    description:
      'Cut in a relaxed architectural silhouette from breathable mid-weight combed cotton jersey. Ideal for Karachi weather with a clean crew neckline.',
    image: productWhiteTeeImg,
    featuredRank: 1,
    tag: 'Essential',
  },
  {
    id: 'herschel-supply',
    name: 'Herschel Poplin Shirt',
    category: 'Women',
    pricePkr: 4500,
    stock: 22,
    color: 'Ivory White',
    colorHex: '#fafaf9',
    variants: [
      { name: 'Ivory White', hex: '#fafaf9' },
      { name: 'Powder Blue', hex: '#dbeafe' },
      { name: 'Warm Sand', hex: '#e7e0d3' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    sizeChartHeaders: WOMENS_TOP_HEADERS,
    sizeChart: WOMENS_TOP_CHART,
    material: 'Crisp Italian Cotton Poplin',
    description:
      'Tailored button-down poplin shirt featuring mother-of-pearl buttons, curved shirttail hem, and structured cuffs for office-to-evening wear.',
    image: productWhiteShirtImg,
    featuredRank: 2,
  },
  {
    id: 'only-check-trouser',
    name: 'Only Check Slim Shirt',
    category: 'Men',
    pricePkr: 3450,
    stock: 25,
    color: 'Chambray Blue',
    colorHex: '#5b7db1',
    variants: [
      { name: 'Chambray Blue', hex: '#5b7db1' },
      { name: 'Slate Gray', hex: '#64748b' },
      { name: 'Navy Check', hex: '#1e3a5f' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    sizeChartHeaders: MENS_TOP_HEADERS,
    sizeChart: MENS_TOP_CHART,
    material: 'Yarn-Dyed Cotton Twill',
    description:
      'Fine micro-check short-sleeve shirt woven from breathable yarn-dyed cotton. Finished with a crisp button-down collar and tailored waist.',
    image: productCheckShirtImg,
    featuredRank: 3,
  },
  {
    id: 'classic-trench-coat',
    name: 'Classic Trench Coat',
    category: 'Women',
    pricePkr: 11500,
    stock: 14,
    color: 'Moss Olive',
    colorHex: '#4a5233',
    variants: [
      { name: 'Moss Olive', hex: '#4a5233' },
      { name: 'Camel Stone', hex: '#b59a7b' },
      { name: 'Espresso Charcoal', hex: '#2c2927' },
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    sizeChartHeaders: WOMENS_TOP_HEADERS,
    sizeChart: WOMENS_TOP_CHART.slice(0, 4),
    material: 'Brushed Wool-Blend Melton',
    description:
      'Double-breasted belted wool-blend trench coat with a removable plush espresso collar, tortoise buckle belt, and deep welt pockets.',
    image: productTrenchCoatImg,
    featuredRank: 4,
    tag: 'New Season',
  },
  {
    id: 'avelina-leather-tote',
    name: 'Avelina Leather Tote',
    category: 'Bag',
    pricePkr: 14500,
    stock: 10,
    color: 'Cognac Tan',
    colorHex: '#8b4513',
    variants: [
      { name: 'Cognac Tan', hex: '#8b4513' },
      { name: 'Espresso Brown', hex: '#422006' },
      { name: 'Matte Black', hex: '#18181b' },
    ],
    sizes: ['One Size'],
    sizeChartHeaders: ['Spec', 'Width (in)', 'Height (in)', 'Depth (in)'],
    sizeChart: [{ size: 'One Size', col1: '15.0', col2: '11.5', col3: '5.2' }],
    material: 'Full-Grain Vegetable-Tanned Leather',
    description:
      'Structured everyday carryall crafted from full-grain vegetable-tanned leather with brass hardware, reinforced base, and an interior 14-inch laptop sleeve.',
    image: productLeatherToteImg,
    featuredRank: 5,
    tag: 'Limited Run',
  },
  {
    id: 'nordic-court-sneaker',
    name: 'Nordic Court Sneaker',
    category: 'Shoes',
    pricePkr: 9800,
    stock: 19,
    color: 'Chalk Suede',
    colorHex: '#e7e5e4',
    variants: [
      { name: 'Chalk Suede', hex: '#e7e5e4' },
      { name: 'Stone Gray', hex: '#a8a29e' },
      { name: 'Triple White', hex: '#fafafa' },
    ],
    sizes: ['39', '40', '41', '42', '43', '44'],
    sizeChartHeaders: ['EU Size', 'UK Size', 'US Men', 'Foot (cm)'],
    sizeChart: [
      { size: '39', col1: '5.5', col2: '6.5', col3: '24.6' },
      { size: '40', col1: '6.5', col2: '7.5', col3: '25.4' },
      { size: '41', col1: '7.5', col2: '8.5', col3: '26.2' },
      { size: '42', col1: '8.5', col2: '9.5', col3: '27.0' },
      { size: '43', col1: '9.5', col2: '10.5', col3: '27.8' },
      { size: '44', col1: '10.5', col2: '11.5', col3: '28.5' },
    ],
    material: 'Nappa Leather & Italian Suede',
    description:
      'Minimalist low-top court trainer pairing supple chalk calfskin with tonal suede overlays on a stitched natural rubber cup sole.',
    image: productSneakerImg,
    featuredRank: 6,
  },
  {
    id: 'atelier-steel-watch',
    name: 'Atelier Dress Watch',
    category: 'Watches',
    pricePkr: 16500,
    stock: 9,
    color: 'Slate Charcoal',
    colorHex: '#3f3f46',
    variants: [
      { name: 'Slate Charcoal', hex: '#3f3f46' },
      { name: 'Brushed Silver', hex: '#d4d4d8' },
    ],
    sizes: ['38mm', '40mm'],
    sizeChartHeaders: ['Case', 'Lug Width', 'Thickness', 'Wrist Fit'],
    sizeChart: [
      { size: '38mm', col1: '20mm', col2: '7.4mm', col3: '15–19 cm' },
      { size: '40mm', col1: '20mm', col2: '7.8mm', col3: '17–21 cm' },
    ],
    material: '316L Brushed Steel & Sapphire',
    description:
      'Ultra-slim brushed stainless steel timepiece with a sunray matte charcoal dial, domed sapphire crystal, and supple black calfskin strap.',
    image: productWatchImg,
    featuredRank: 7,
  },
  {
    id: 'selvedge-chore-jacket',
    name: 'Selvedge Chore Jacket',
    category: 'Men',
    pricePkr: 8900,
    stock: 16,
    color: 'Deep Indigo',
    colorHex: '#1e293b',
    variants: [
      { name: 'Deep Indigo', hex: '#1e293b' },
      { name: 'Washed Slate', hex: '#475569' },
      { name: 'Olive Twill', hex: '#4d5d42' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    sizeChartHeaders: MENS_TOP_HEADERS,
    sizeChart: MENS_TOP_CHART,
    material: '12oz Japanese Selvedge Cotton',
    description:
      'Workwear-inspired utility jacket cut from unwashed 12oz selvedge denim with triple-stitched patch pockets and corozo nut buttons.',
    image: productDenimJacketImg,
    featuredRank: 8,
  },
  {
    id: 'sand-linen-tunic',
    name: 'Sand Linen Tunic',
    category: 'Women',
    pricePkr: 3850,
    stock: 24,
    color: 'Warm Oatmeal',
    colorHex: '#d6cfc2',
    variants: [
      { name: 'Warm Oatmeal', hex: '#d6cfc2' },
      { name: 'Crisp White', hex: '#fafaf9' },
      { name: 'Muted Sage', hex: '#8b9585' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    sizeChartHeaders: WOMENS_TOP_HEADERS,
    sizeChart: WOMENS_TOP_CHART,
    material: '100% Washed Belgian Linen',
    description:
      'Relaxed-drape longline tunic tailored from pre-washed breathable linen with rolled cuffs built specifically for humid Karachi afternoons.',
    image: productLinenTunicImg,
    featuredRank: 9,
    tag: 'Karachi Linen',
  },
  {
    id: 'stone-twill-overshirt',
    name: 'Stone Twill Overshirt',
    category: 'Men',
    pricePkr: 5400,
    stock: 20,
    color: 'Stone Beige',
    colorHex: '#cfc7b8',
    variants: [
      { name: 'Stone Beige', hex: '#cfc7b8' },
      { name: 'Moss Olive', hex: '#555d47' },
      { name: 'Charcoal', hex: '#2f3136' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    sizeChartHeaders: MENS_TOP_HEADERS,
    sizeChart: MENS_TOP_CHART,
    material: 'Brushed 8oz Cotton Twill',
    description:
      'Structured dual-pocket overshirt bridging smart-casual shirting and light evening outerwear, detailed with horn buttons.',
    image: productCottonOvershirtImg,
    featuredRank: 10,
  },
  {
    id: 'espresso-knit-polo',
    name: 'Merino Knit Polo',
    category: 'Men',
    pricePkr: 4200,
    stock: 22,
    color: 'Slate Navy',
    colorHex: '#2c3545',
    variants: [
      { name: 'Slate Navy', hex: '#2c3545' },
      { name: 'Espresso', hex: '#3e2d26' },
      { name: 'Heather Gray', hex: '#71717a' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    sizeChartHeaders: MENS_TOP_HEADERS,
    sizeChart: MENS_TOP_CHART,
    material: 'Fine-Gauge Combed Merino & Cotton',
    description:
      'Lightweight 14-gauge knit polo featuring a structured collar that holds its shape cleanly under blazers or worn solo.',
    image: productKnitPoloImg,
    featuredRank: 11,
  },
  {
    id: 'saddle-crossbody-bag',
    name: 'Saddle Leather Crossbody',
    category: 'Bag',
    pricePkr: 11800,
    stock: 11,
    color: 'Dark Espresso',
    colorHex: '#3f281f',
    variants: [
      { name: 'Dark Espresso', hex: '#3f281f' },
      { name: 'Cognac Tan', hex: '#8b4513' },
      { name: 'Matte Black', hex: '#18181b' },
    ],
    sizes: ['One Size'],
    sizeChartHeaders: ['Spec', 'Width (in)', 'Height (in)', 'Depth (in)'],
    sizeChart: [{ size: 'One Size', col1: '10.5', col2: '8.2', col3: '3.4' }],
    material: 'Full-Grain Saddle Leather & Brass',
    description:
      'Compact everyday messenger bag crafted in small batches with heavy brass buckle hardware, front utility pocket, and adjustable shoulder strap.',
    image: productCrossbodyBagImg,
    featuredRank: 12,
    tag: 'Small Batch',
  },
  {
    id: 'waxed-canvas-weekender',
    name: 'Waxed Canvas Weekender',
    category: 'Bag',
    pricePkr: 13200,
    stock: 8,
    color: 'Olive Canvas',
    colorHex: '#595a42',
    variants: [
      { name: 'Olive Canvas', hex: '#595a42' },
      { name: 'Slate Navy', hex: '#2e3847' },
    ],
    sizes: ['One Size'],
    sizeChartHeaders: ['Spec', 'Length (in)', 'Height (in)', 'Volume'],
    sizeChart: [{ size: 'One Size', col1: '20.5', col2: '12.0', col3: '38 L' }],
    material: '18oz Waxed Canvas & Bridle Leather',
    description:
      'Carry-on compliant travel duffle pairing weather-resistant waxed canvas with vegetable-tanned bridle handles and a detachable crossbody strap.',
    image: productCanvasWeekenderImg,
    featuredRank: 13,
  },
  {
    id: 'tobacco-suede-loafer',
    name: 'Tobacco Suede Loafer',
    category: 'Shoes',
    pricePkr: 10900,
    stock: 15,
    color: 'Tobacco Suede',
    colorHex: '#7c4728',
    variants: [
      { name: 'Tobacco Suede', hex: '#7c4728' },
      { name: 'Dark Snuff', hex: '#4a2e1f' },
      { name: 'Stone Taupe', hex: '#a39585' },
    ],
    sizes: ['39', '40', '41', '42', '43', '44'],
    sizeChartHeaders: ['EU Size', 'UK Size', 'US Men', 'Foot (cm)'],
    sizeChart: [
      { size: '39', col1: '5.5', col2: '6.5', col3: '24.6' },
      { size: '40', col1: '6.5', col2: '7.5', col3: '25.4' },
      { size: '41', col1: '7.5', col2: '8.5', col3: '26.2' },
      { size: '42', col1: '8.5', col2: '9.5', col3: '27.0' },
      { size: '43', col1: '9.5', col2: '10.5', col3: '27.8' },
      { size: '44', col1: '10.5', col2: '11.5', col3: '28.5' },
    ],
    material: 'Italian Reverse-Calf Suede',
    description:
      'Unlined flexible penny loafer built on a Blake-stitched leather sole with cushioned calfskin footbed for effortless all-day wear.',
    image: productSuedeLoaferImg,
    featuredRank: 14,
  },
  {
    id: 'matte-chelsea-boot',
    name: 'Matte Leather Chelsea Boot',
    category: 'Shoes',
    pricePkr: 12800,
    stock: 12,
    color: 'Matte Black',
    colorHex: '#18181b',
    variants: [
      { name: 'Matte Black', hex: '#18181b' },
      { name: 'Dark Espresso', hex: '#3d281f' },
    ],
    sizes: ['39', '40', '41', '42', '43', '44'],
    sizeChartHeaders: ['EU Size', 'UK Size', 'US Men', 'Foot (cm)'],
    sizeChart: [
      { size: '39', col1: '5.5', col2: '6.5', col3: '24.6' },
      { size: '40', col1: '6.5', col2: '7.5', col3: '25.4' },
      { size: '41', col1: '7.5', col2: '8.5', col3: '26.2' },
      { size: '42', col1: '8.5', col2: '9.5', col3: '27.0' },
      { size: '43', col1: '9.5', col2: '10.5', col3: '27.8' },
      { size: '44', col1: '10.5', col2: '11.5', col3: '28.5' },
    ],
    material: 'Full-Grain Box Calfskin & Storm Welt',
    description:
      'Clean-profile pull-on Chelsea boot shaped with a subtly tapered round toe, woven rear pull tab, and low-profile Vibram rubber heel.',
    image: productChelseaBootImg,
    featuredRank: 15,
    tag: 'Autumn Core',
  },
  {
    id: 'altus-field-watch',
    name: 'Altus Field Watch',
    category: 'Watches',
    pricePkr: 14900,
    stock: 11,
    color: 'Cream / Olive Strap',
    colorHex: '#63684a',
    variants: [
      { name: 'Cream / Olive Strap', hex: '#63684a' },
      { name: 'Cream / Cognac Strap', hex: '#8b4513' },
    ],
    sizes: ['38mm', '40mm'],
    sizeChartHeaders: ['Case', 'Lug Width', 'Thickness', 'Wrist Fit'],
    sizeChart: [
      { size: '38mm', col1: '20mm', col2: '8.2mm', col3: '15–19 cm' },
      { size: '40mm', col1: '20mm', col2: '8.6mm', col3: '17–21 cm' },
    ],
    material: 'Brushed 316L Steel & Pebble Leather',
    description:
      'Everyday field timepiece pairing an anti-reflective sapphire crystal and matte cream dial with a hand-stitched olive calfskin strap.',
    image: productFieldWatchImg,
    featuredRank: 16,
  },
];

export const INITIAL_REVIEWS: Record<string, ProductReview[]> = {
  'esprit-ruffle-shirt': [
    {
      id: 'rev-1',
      author: 'Sana Tariq',
      area: 'Clifton Block 4',
      rating: 5,
      date: 'Nov 2026',
      comment: 'Fabric is super breathable for Karachi humidity and keeps its shape after washing.',
    },
    {
      id: 'rev-2',
      author: 'Hira Siddiqui',
      area: 'DHA Phase 6',
      rating: 5,
      date: 'Oct 2026',
      comment: 'Clean neckline and true-to-size fit. Received same-day delivery within 5 hours.',
    },
  ],
  'herschel-supply': [
    {
      id: 'rev-3',
      author: 'Marium Raza',
      area: 'PECHS Block 2',
      rating: 5,
      date: 'Nov 2026',
      comment: 'Crisp poplin finish — looks sharp for office meetings without wrinkling easily.',
    },
  ],
  'only-check-trouser': [
    {
      id: 'rev-4',
      author: 'Bilal Ahmed',
      area: 'Gulshan-e-Iqbal',
      rating: 4,
      date: 'Oct 2026',
      comment: 'Great slim cut and lightweight weave. Size L fits comfortably.',
    },
  ],
  'classic-trench-coat': [
    {
      id: 'rev-5',
      author: 'Zoya Mansoor',
      area: 'DHA Phase 5',
      rating: 5,
      date: 'Nov 2026',
      comment: 'Lovely olive tone and tailored drape. Worth every rupee for winter travel.',
    },
  ],
  'avelina-leather-tote': [
    {
      id: 'rev-6',
      author: 'Nadia Farooq',
      area: 'Bahadurabad',
      rating: 5,
      date: 'Nov 2026',
      comment: 'Fits my 14-inch MacBook cleanly and the stitching is solid full-grain leather.',
    },
  ],
  'nordic-court-sneaker': [
    {
      id: 'rev-7',
      author: 'Hamza Qureshi',
      area: 'North Nazimabad',
      rating: 5,
      date: 'Oct 2026',
      comment: 'Comfortable sole right out of the box and goes with both chinos and denim.',
    },
  ],
  'atelier-steel-watch': [
    {
      id: 'rev-8',
      author: 'Saad Javed',
      area: 'Clifton Block 2',
      rating: 5,
      date: 'Nov 2026',
      comment: 'Minimal dial looks far more expensive in person. 38mm sits very cleanly.',
    },
  ],
  'selvedge-chore-jacket': [
    {
      id: 'rev-9',
      author: 'Usman Sheikh',
      area: 'Shahrah-e-Faisal',
      rating: 5,
      date: 'Oct 2026',
      comment: 'Heavyweight indigo denim with proper pockets. Ideal evening jacket.',
    },
  ],
  'sand-linen-tunic': [
    {
      id: 'rev-10',
      author: 'Amina Farhan',
      area: 'DHA Phase 8',
      rating: 5,
      date: 'Nov 2026',
      comment: 'Pure washed linen feel without being sheer. Super airy for Karachi heat.',
    },
  ],
  'stone-twill-overshirt': [
    {
      id: 'rev-11',
      author: 'Taimur Ali',
      area: 'Clifton Block 5',
      rating: 5,
      date: 'Nov 2026',
      comment: 'Clean layering piece over tees. Stitching around the cuffs is really neat.',
    },
  ],
  'espresso-knit-polo': [
    {
      id: 'rev-12',
      author: 'Faraz Siddiqui',
      area: 'Gulshan Block 13-D',
      rating: 5,
      date: 'Nov 2026',
      comment: 'Collar stands nicely all day and the knit weight feels refined.',
    },
  ],
  'saddle-crossbody-bag': [
    {
      id: 'rev-13',
      author: 'Maham Tariq',
      area: 'PECHS Block 6',
      rating: 5,
      date: 'Nov 2026',
      comment: 'Solid brass buckle and thick leather grain — fits iPad mini plus essentials.',
    },
  ],
  'waxed-canvas-weekender': [
    {
      id: 'rev-14',
      author: 'Omer Baig',
      area: 'DHA Phase 2',
      rating: 5,
      date: 'Oct 2026',
      comment: 'Used it for a weekend trip to Islamabad. Fits overhead cabin sizing easily.',
    },
  ],
  'tobacco-suede-loafer': [
    {
      id: 'rev-15',
      author: 'Daniyal Karim',
      area: 'Saddar / Clifton',
      rating: 5,
      date: 'Nov 2026',
      comment: 'Soft suede that needs zero breaking-in period. Very clean last shape.',
    },
  ],
  'matte-chelsea-boot': [
    {
      id: 'rev-16',
      author: 'Zainab Waqar',
      area: 'Tipu Sultan Road',
      rating: 5,
      date: 'Nov 2026',
      comment: 'Bought size 40 as a gift and the leather grain looks understated and sharp.',
    },
  ],
  'altus-field-watch': [
    {
      id: 'rev-17',
      author: 'Kamran Habib',
      area: 'DHA Phase 4',
      rating: 5,
      date: 'Nov 2026',
      comment: 'Cream dial with olive strap looks timeless on the wrist. Sapphire crystal is crisp.',
    },
  ],
};

export const JOURNAL_ARTICLES = [
  {
    id: 'autumn-silhouette',
    date: 'October 2026',
    category: 'Lookbook',
    title: 'Proportion & Calm: The Autumn Capsule',
    excerpt:
      'Why breathable combed poplin, unlined melton wool, and tonal chalk footwear anchor a ten-piece seasonal wardrobe without excess.',
  },
  {
    id: 'vegetable-tanning',
    date: 'September 2026',
    category: 'Materials',
    title: 'Inside Our Full-Grain Leather Studio',
    excerpt:
      'A closer look at slow vegetable tanning, solid brass buckles, and how natural hides develop a warm patina over years of daily carry.',
  },
  {
    id: 'garment-care',
    date: 'August 2026',
    category: 'Care Guide',
    title: 'Extending the Life of Wool & Selvedge',
    excerpt:
      'Cold air brushing, cedar hangers, and low-temperature steaming keep tailored outerwear crisp across seasons.',
  },
];

export const FAQ_ITEMS = [
  {
    question: 'When does free delivery in Karachi apply?',
    answer:
      'All standard orders over Rs. 5,000 qualify automatically for complimentary delivery across Karachi and nationwide. Below Rs. 5,000, area-wise Karachi courier rates range from Rs. 150 to Rs. 250.',
  },
  {
    question: 'Can I pay via JazzCash, Easypaisa, or Cash on Delivery?',
    answer:
      'Yes. We accept Cash on Delivery across Karachi and Pakistan, plus instant JazzCash, Easypaisa, and Card payments at checkout.',
  },
  {
    question: 'What promo codes are currently active?',
    answer:
      'Use COZA10 for 10% off your order, KARACHI500 for Rs. 500 off orders above Rs. 3,000, or FREESHIP for complimentary courier delivery.',
  },
];
