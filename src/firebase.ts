import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  OrderRecord,
  OrderStatus,
  Product,
  ProductReview,
  PRODUCTS,
} from './data/products';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const BOOTSTRAP_ADMIN_EMAIL = 'marihaashfaq239@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
  return signOut(auth);
}

export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }
  const path = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

function sanitizeId(raw: string): string {
  return raw
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 128);
}

// --- User Preferences (Wishlist) ---
export async function saveUserWishlist(user: User, wishlistIds: string[]) {
  const path = `users/${user.uid}`;
  const boundedIds = wishlistIds
    .map((id) => sanitizeId(id))
    .filter(Boolean)
    .slice(0, 50);
  const displayName = (user.displayName || user.email || 'Customer').slice(0, 100);
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid,
        displayName,
        wishlistIds: boundedIds,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeUserPreferences(
  userId: string,
  onData: (wishlistIds: string[]) => void
): Unsubscribe {
  const path = `users/${userId}`;
  return onSnapshot(
    doc(db, 'users', userId),
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data.wishlistIds)) {
          onData(data.wishlistIds.filter((v): v is string => typeof v === 'string'));
        }
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

// --- Products (Public Read, Admin Write) ---
export interface FirestoreProductDoc {
  id: string;
  name: string;
  category: Product['category'];
  pricePkr: number;
  stock: number;
  color: string;
  colorHex: string;
  material: string;
  description: string;
  image: string;
  tag?: string;
  featuredRank: number;
}

export function subscribeFirestoreProducts(
  onData: (docs: FirestoreProductDoc[]) => void
): Unsubscribe {
  const path = 'products';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items: FirestoreProductDoc[] = snapshot.docs.map((d) => {
        const raw = d.data();
        return {
          id: String(raw.id ?? d.id),
          name: String(raw.name ?? ''),
          category: (raw.category ?? 'Women') as Product['category'],
          pricePkr: Number(raw.pricePkr ?? 0),
          stock: Number(raw.stock ?? 0),
          color: String(raw.color ?? 'Classic'),
          colorHex: String(raw.colorHex ?? '#d4d4d8'),
          material: String(raw.material ?? ''),
          description: String(raw.description ?? ''),
          image: String(raw.image ?? ''),
          tag: typeof raw.tag === 'string' && raw.tag ? raw.tag : undefined,
          featuredRank: Number(raw.featuredRank ?? 99),
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function upsertProductAdmin(product: FirestoreProductDoc) {
  const safeId = sanitizeId(product.id);
  const path = `products/${safeId}`;
  const payload: Record<string, unknown> = {
    id: safeId,
    name: product.name.trim().slice(0, 120),
    category: product.category,
    pricePkr: Math.max(1, Math.round(product.pricePkr)),
    stock: Math.max(0, Math.round(product.stock)),
    color: product.color.trim().slice(0, 60),
    colorHex: product.colorHex.trim().slice(0, 20),
    material: product.material.trim().slice(0, 120),
    description: product.description.trim().slice(0, 1000),
    image: product.image.trim().slice(0, 1000),
    featuredRank: Math.max(0, Math.round(product.featuredRank)),
    updatedAt: serverTimestamp(),
  };
  if (product.tag && product.tag.trim()) {
    payload.tag = product.tag.trim().slice(0, 40);
  }
  try {
    await setDoc(doc(db, 'products', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductAdmin(productId: string) {
  const safeId = sanitizeId(productId);
  const path = `products/${safeId}`;
  try {
    await deleteDoc(doc(db, 'products', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedDefaultProductsAdmin() {
  for (const p of PRODUCTS) {
    await upsertProductAdmin({
      id: p.id,
      name: p.name,
      category: p.category,
      pricePkr: p.pricePkr,
      stock: p.stock ?? 24,
      color: p.color,
      colorHex: p.colorHex,
      material: p.material,
      description: p.description,
      image: p.image,
      tag: p.tag,
      featuredRank: p.featuredRank,
    });
  }
}

// --- Reviews ---
export function subscribeFirestoreReviews(
  onData: (reviewsByProduct: Record<string, ProductReview[]>) => void
): Unsubscribe {
  const path = 'reviews';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const grouped: Record<string, ProductReview[]> = {};
      snapshot.docs.forEach((d) => {
        const raw = d.data();
        const pid = String(raw.productId ?? '');
        if (!pid) return;
        const rev: ProductReview = {
          id: d.id,
          author: String(raw.author ?? 'Customer'),
          area: String(raw.area ?? 'Karachi'),
          rating: Number(raw.rating ?? 5),
          date: String(raw.date ?? 'Nov 2026'),
          comment: String(raw.comment ?? ''),
        };
        if (!grouped[pid]) grouped[pid] = [];
        grouped[pid].push(rev);
      });
      onData(grouped);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createFirestoreReview(
  user: User,
  productId: string,
  review: Omit<ProductReview, 'id' | 'date'>
) {
  const reviewId = sanitizeId(`rev-${productId}-${Date.now()}`);
  const path = `reviews/${reviewId}`;
  const dateLabel = new Date().toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  try {
    await setDoc(doc(db, 'reviews', reviewId), {
      productId: sanitizeId(productId),
      authorUid: user.uid,
      author: review.author.trim().slice(0, 80),
      area: review.area.trim().slice(0, 80) || 'Karachi',
      rating: Math.min(5, Math.max(1, Math.round(review.rating))),
      comment: review.comment.trim().slice(0, 600),
      date: dateLabel,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

// --- Orders ---
export async function createOrderInFirestore(
  user: User,
  order: OrderRecord
): Promise<void> {
  const safeId = sanitizeId(order.orderNumber);
  const path = `orders/${safeId}`;
  const compactItems = order.items.slice(0, 25).map((item) => ({
    productId: item.product.id,
    name: item.product.name.slice(0, 120),
    pricePkr: item.product.pricePkr,
    size: item.size.slice(0, 30),
    color: item.color.slice(0, 60),
    quantity: item.quantity,
  }));

  const payload: Record<string, unknown> = {
    userId: user.uid,
    orderNumber: order.orderNumber.slice(0, 32),
    customerName: order.customerName.trim().slice(0, 100),
    email: order.email.trim().slice(0, 160),
    phone: order.phone.trim().slice(0, 30),
    zoneLabel: order.zoneLabel.trim().slice(0, 120),
    address: order.address.trim().slice(0, 300),
    paymentMethod: order.paymentMethod,
    discountPkr: Math.max(0, Math.round(order.discountPkr)),
    subtotalPkr: Math.max(0, Math.round(order.subtotalPkr)),
    shippingPkr: Math.max(0, Math.round(order.shippingPkr)),
    totalPkr: Math.max(0, Math.round(order.totalPkr)),
    status: 'Pending',
    items: compactItems,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (order.transactionId?.trim()) {
    payload.transactionId = order.transactionId.trim().slice(0, 80);
  }
  if (order.promoCode?.trim()) {
    payload.promoCode = order.promoCode.trim().slice(0, 40);
  }

  try {
    await setDoc(doc(db, 'orders', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export interface StoredOrderSummary {
  id: string;
  userId: string;
  orderNumber: string;
  placedAt: string;
  customerName: string;
  email: string;
  phone: string;
  zoneLabel: string;
  address: string;
  paymentMethod: OrderRecord['paymentMethod'];
  transactionId?: string;
  promoCode?: string;
  discountPkr: number;
  subtotalPkr: number;
  shippingPkr: number;
  totalPkr: number;
  status: OrderStatus;
  itemsSummary: {
    productId?: string;
    name: string;
    size: string;
    color: string;
    quantity: number;
    pricePkr: number;
  }[];
}

function mapDocToOrder(id: string, raw: Record<string, unknown>): StoredOrderSummary {
  const ts = raw.createdAt as { toDate?: () => Date } | undefined;
  const placedAt = ts?.toDate
    ? ts.toDate().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Just now';

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  return {
    id,
    userId: String(raw.userId ?? ''),
    orderNumber: String(raw.orderNumber ?? id),
    placedAt,
    customerName: String(raw.customerName ?? ''),
    email: String(raw.email ?? ''),
    phone: String(raw.phone ?? ''),
    zoneLabel: String(raw.zoneLabel ?? ''),
    address: String(raw.address ?? ''),
    paymentMethod: (raw.paymentMethod ?? 'Cash on Delivery') as OrderRecord['paymentMethod'],
    transactionId:
      typeof raw.transactionId === 'string' ? raw.transactionId : undefined,
    promoCode: typeof raw.promoCode === 'string' ? raw.promoCode : undefined,
    discountPkr: Number(raw.discountPkr ?? 0),
    subtotalPkr: Number(raw.subtotalPkr ?? 0),
    shippingPkr: Number(raw.shippingPkr ?? 0),
    totalPkr: Number(raw.totalPkr ?? 0),
    status: (raw.status ?? 'Pending') as OrderStatus,
    itemsSummary: rawItems.map((i: Record<string, unknown>) => ({
      productId: typeof i.productId === 'string' ? i.productId : undefined,
      name: String(i.name ?? 'Item'),
      size: String(i.size ?? ''),
      color: String(i.color ?? ''),
      quantity: Number(i.quantity ?? 1),
      pricePkr: Number(i.pricePkr ?? 0),
    })),
  };
}

export function subscribeUserOrders(
  userId: string,
  onData: (orders: StoredOrderSummary[]) => void
): Unsubscribe {
  const path = 'orders';
  const q = query(collection(db, path), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) =>
        mapDocToOrder(d.id, d.data() as Record<string, unknown>)
      );
      orders.sort((a, b) => b.orderNumber.localeCompare(a.orderNumber));
      onData(orders);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeAllOrdersAdmin(
  onData: (orders: StoredOrderSummary[]) => void
): Unsubscribe {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) =>
        mapDocToOrder(d.id, d.data() as Record<string, unknown>)
      );
      onData(orders);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function updateOrderStatusAdmin(
  orderId: string,
  status: OrderStatus
) {
  const safeId = sanitizeId(orderId);
  const path = `orders/${safeId}`;
  try {
    await updateDoc(doc(db, 'orders', safeId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// --- Contact Messages ---
export interface StoredContactMessage {
  id: string;
  userId: string;
  name: string;
  email: string;
  topic: string;
  orderNumber?: string;
  message: string;
  createdAtLabel: string;
}

export async function createContactMessage(
  user: User,
  inquiry: {
    name: string;
    email: string;
    topic: string;
    orderNumber?: string;
    message: string;
  }
) {
  const messageId = sanitizeId(`msg-${Date.now()}`);
  const path = `contactMessages/${messageId}`;
  const payload: Record<string, unknown> = {
    userId: user.uid,
    name: inquiry.name.trim().slice(0, 100),
    email: inquiry.email.trim().slice(0, 160),
    topic: inquiry.topic.trim().slice(0, 100),
    message: inquiry.message.trim().slice(0, 1500),
    createdAt: serverTimestamp(),
  };
  if (inquiry.orderNumber?.trim()) {
    payload.orderNumber = inquiry.orderNumber.trim().slice(0, 40);
  }
  try {
    await setDoc(doc(db, 'contactMessages', messageId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeContactMessagesAdmin(
  onData: (messages: StoredContactMessage[]) => void
): Unsubscribe {
  const path = 'contactMessages';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: StoredContactMessage[] = snapshot.docs.map((d) => {
        const raw = d.data();
        const ts = raw.createdAt as { toDate?: () => Date } | undefined;
        const createdAtLabel = ts?.toDate
          ? ts.toDate().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Just now';
        return {
          id: d.id,
          userId: String(raw.userId ?? ''),
          name: String(raw.name ?? ''),
          email: String(raw.email ?? ''),
          topic: String(raw.topic ?? ''),
          orderNumber:
            typeof raw.orderNumber === 'string' ? raw.orderNumber : undefined,
          message: String(raw.message ?? ''),
          createdAtLabel,
        };
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// --- Admin Stock Adjustment & Newsletter Subscribers ---
export async function deductOrderStockAdmin(
  items: { productId?: string; quantity: number }[],
  catalogProducts: Product[]
): Promise<number> {
  let updatedCount = 0;
  for (const item of items) {
    if (!item.productId) continue;
    const safeId = sanitizeId(item.productId);
    const catalogMatch = catalogProducts.find((p) => p.id === safeId);
    if (!catalogMatch) continue;
    const nextStock = Math.max(0, (catalogMatch.stock ?? 24) - item.quantity);
    await upsertProductAdmin({
      id: catalogMatch.id,
      name: catalogMatch.name,
      category: catalogMatch.category,
      pricePkr: catalogMatch.pricePkr,
      stock: nextStock,
      color: catalogMatch.color,
      colorHex: catalogMatch.colorHex,
      material: catalogMatch.material,
      description: catalogMatch.description,
      image: catalogMatch.image,
      tag: catalogMatch.tag,
      featuredRank: catalogMatch.featuredRank,
    });
    updatedCount += 1;
  }
  return updatedCount;
}

export interface StoredNewsletterSubscriber {
  id: string;
  userId: string;
  email: string;
  source: string;
  createdAtLabel: string;
}

export async function subscribeNewsletterUser(user: User, email: string) {
  const path = `newsletterSubscribers/${user.uid}`;
  try {
    await setDoc(doc(db, 'newsletterSubscribers', user.uid), {
      userId: user.uid,
      email: email.trim().slice(0, 160),
      source: 'footer',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeNewsletterAdmin(
  onData: (subscribers: StoredNewsletterSubscriber[]) => void
): Unsubscribe {
  const path = 'newsletterSubscribers';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: StoredNewsletterSubscriber[] = snapshot.docs.map((d) => {
        const raw = d.data();
        const ts = raw.createdAt as { toDate?: () => Date } | undefined;
        const createdAtLabel = ts?.toDate
          ? ts.toDate().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'Just now';
        return {
          id: d.id,
          userId: String(raw.userId ?? ''),
          email: String(raw.email ?? ''),
          source: String(raw.source ?? 'footer'),
          createdAtLabel,
        };
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
