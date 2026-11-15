import { Database, Mail, Package, Plus, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { FormEvent, useEffect, useState } from 'react';
import {
  Category,
  CurrencyCode,
  formatPrice,
  OrderStatus,
  Product,
  PRODUCTS,
} from '../data/products';
import {
  deductOrderStockAdmin,
  deleteProductAdmin,
  FirestoreProductDoc,
  seedDefaultProductsAdmin,
  StoredContactMessage,
  StoredNewsletterSubscriber,
  StoredOrderSummary,
  updateOrderStatusAdmin,
  upsertProductAdmin,
} from '../firebase';

interface AdminDashboardModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  currency: CurrencyCode;
  orders: StoredOrderSummary[];
  messages: StoredContactMessage[];
  subscribers: StoredNewsletterSubscriber[];
  products: Product[];
  firestoreProductsCount: number;
  onClose: () => void;
}

type AdminTab = 'orders' | 'products' | 'messages' | 'subscribers';

const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Packed',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

const PRODUCT_CATEGORIES: Exclude<Category, 'All Products'>[] = [
  'Women',
  'Men',
  'Bag',
  'Shoes',
  'Watches',
];

export function AdminDashboardModal({
  isOpen,
  isAdmin,
  currency,
  orders,
  messages,
  subscribers,
  products,
  firestoreProductsCount,
  onClose,
}: AdminDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [statusMessage, setStatusMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] =
    useState<Exclude<Category, 'All Products'>>('Women');
  const [newPrice, setNewPrice] = useState('3500');
  const [newStock, setNewStock] = useState('20');
  const [newColor, setNewColor] = useState('Ivory White');
  const [newMaterial, setNewMaterial] = useState('100% Cotton Poplin');
  const [newDescription, setNewDescription] = useState('');
  const [newImageIdx, setNewImageIdx] = useState(0);
  const [newCustomImageUrl, setNewCustomImageUrl] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleStatusChange = async (
    order: StoredOrderSummary,
    nextStatus: OrderStatus
  ) => {
    setBusyId(order.id);
    setStatusMessage('');
    try {
      await updateOrderStatusAdmin(order.id, nextStatus);
      let stockNote = '';
      if (order.status === 'Pending' && nextStatus === 'Packed') {
        const deductedCount = await deductOrderStockAdmin(
          order.itemsSummary,
          products
        );
        if (deductedCount > 0) {
          stockNote = ` Stock auto-deducted for ${deductedCount} catalog item(s).`;
        }
      }
      setStatusMessage(
        `Order #${order.orderNumber} updated to ${nextStatus}.${stockNote}`
      );
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to update order status.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleSeedCatalog = async () => {
    setBusyId('seed');
    setStatusMessage('');
    try {
      await seedDefaultProductsAdmin();
      setStatusMessage(
        `Synced all ${PRODUCTS.length} default catalog items to Firestore.`
      );
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to sync catalog.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleQuickUpdateProduct = async (
    product: Product,
    pricePkr: number,
    stock: number
  ) => {
    setBusyId(product.id);
    setStatusMessage('');
    try {
      const docPayload: FirestoreProductDoc = {
        id: product.id,
        name: product.name,
        category: product.category,
        pricePkr,
        stock,
        color: product.color,
        colorHex: product.colorHex,
        material: product.material,
        description: product.description,
        image: product.image,
        tag: product.tag,
        featuredRank: product.featuredRank,
      };
      await upsertProductAdmin(docPayload);
      setStatusMessage(`Updated ${product.name} (${formatPrice(pricePkr, currency)}, Stock: ${stock}).`);
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to update product.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newDescription.trim()) {
      setStatusMessage('Please enter a product name and description.');
      return;
    }
    const slug = `${newName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`;
    const chosenTemplate = PRODUCTS[newImageIdx] ?? PRODUCTS[0];

    const imageToUse = newCustomImageUrl.trim() || chosenTemplate.image;

    setBusyId('add');
    setStatusMessage('');
    try {
      await upsertProductAdmin({
        id: slug,
        name: newName.trim(),
        category: newCategory,
        pricePkr: Math.max(100, Number(newPrice) || 2500),
        stock: Math.max(0, Number(newStock) || 10),
        color: newColor.trim() || 'Classic',
        colorHex: '#d4d4d8',
        material: newMaterial.trim() || 'Cotton Blend',
        description: newDescription.trim(),
        image: imageToUse,
        tag: 'New Drop',
        featuredRank: products.length + 1,
      });
      setNewName('');
      setNewDescription('');
      setNewCustomImageUrl('');
      setStatusMessage(`Added "${newName.trim()}" to the live catalog.`);
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to add product.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    setBusyId(productId);
    setStatusMessage('');
    try {
      await deleteProductAdmin(productId);
      setStatusMessage(`Removed "${name}" from Firestore catalog.`);
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Failed to remove product.'
      );
    } finally {
      setBusyId(null);
    }
  };

  const totalRevenuePkr = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.totalPkr, 0);

  return (
    <AnimatePresence>
      {isOpen && isAdmin && (
        <motion.div
          key="admin-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Store Admin Dashboard"
          onClick={onClose}
        >
          <motion.div
            key="admin-modal-panel"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-5xl bg-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="px-6 py-4 bg-[#222222] text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#717fe0]" aria-hidden="true" />
            <div>
              <h2 className="font-display text-base font-semibold">
                COZA STORE Admin Dashboard
              </h2>
              <p className="text-[11px] text-neutral-400">
                Karachi Operations · Live Orders &amp; Inventory Control
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close admin dashboard"
            className="w-9 h-9 flex items-center justify-center text-neutral-300 hover:text-white"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Summary KPI Bar + Tab Switcher */}
        <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-1.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'orders'
                  ? 'border-[#717fe0] text-[#717fe0]'
                  : 'border-transparent text-neutral-600 hover:text-neutral-950'
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`py-1.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'products'
                  ? 'border-[#717fe0] text-[#717fe0]'
                  : 'border-transparent text-neutral-600 hover:text-neutral-950'
              }`}
            >
              Products &amp; Stock ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('messages')}
              className={`py-1.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'messages'
                  ? 'border-[#717fe0] text-[#717fe0]'
                  : 'border-transparent text-neutral-600 hover:text-neutral-950'
              }`}
            >
              Messages ({messages.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('subscribers')}
              className={`py-1.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'subscribers'
                  ? 'border-[#717fe0] text-[#717fe0]'
                  : 'border-transparent text-neutral-600 hover:text-neutral-950'
              }`}
            >
              Newsletter ({subscribers.length})
            </button>
          </div>

          <div className="flex items-center gap-5 text-xs text-neutral-600 tabular-nums">
            <span>
              Total Revenue:{' '}
              <strong className="text-neutral-900">
                {formatPrice(totalRevenuePkr, currency)}
              </strong>
            </span>
            <span>
              DB Synced Products:{' '}
              <strong className="text-neutral-900">{firestoreProductsCount}</strong>
            </span>
          </div>
        </div>

        {statusMessage && (
          <div className="px-6 py-2.5 bg-[#717fe0]/10 border-b border-[#717fe0]/20 text-xs font-medium text-[#3b47a3]">
            {statusMessage}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="py-12 text-center border border-neutral-200 bg-neutral-50">
                  <Package className="w-8 h-8 text-neutral-300 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm font-medium text-neutral-800">
                    No customer orders recorded in Firestore yet
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Signed-in customer orders placed at checkout will appear here live.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-neutral-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-700">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Order</th>
                        <th className="py-3 px-4 font-semibold">Customer &amp; Zone</th>
                        <th className="py-3 px-4 font-semibold">Payment</th>
                        <th className="py-3 px-4 font-semibold">Total</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {orders.map((order) => (
                        <tr key={order.id} className="align-top">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-neutral-900">
                              #{order.orderNumber}
                            </p>
                            <p className="text-neutral-500">{order.placedAt}</p>
                            <p className="text-neutral-500 mt-1">
                              {order.itemsSummary
                                .map((i) => `${i.name} x${i.quantity}`)
                                .join(', ')}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-neutral-900">
                              {order.customerName}
                            </p>
                            <p className="text-neutral-600">{order.phone}</p>
                            <p className="text-neutral-500 mt-0.5 max-w-[220px]">
                              {order.zoneLabel} — {order.address}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-neutral-800 font-medium">
                              {order.paymentMethod}
                            </p>
                            {order.transactionId && (
                              <p className="text-neutral-500">
                                TID: {order.transactionId}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-neutral-900 tabular-nums whitespace-nowrap">
                            {formatPrice(order.totalPkr, currency)}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              aria-label={`Order ${order.orderNumber} status`}
                              disabled={busyId === order.id}
                              value={order.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  order,
                                  e.target.value as OrderStatus
                                )
                              }
                              className="h-9 px-2.5 border border-neutral-300 bg-white text-xs font-medium focus:outline-none focus:border-[#717fe0]"
                            >
                              {ORDER_STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Live Catalog &amp; Stock Control
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Update prices in PKR, manage stock quantities, or add new seasonal pieces.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyId === 'seed'}
                  onClick={handleSeedCatalog}
                  className="inline-flex items-center gap-2 h-9 px-4 border border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <Database className="w-3.5 h-3.5" aria-hidden="true" />
                  {busyId === 'seed'
                    ? 'Syncing...'
                    : 'Sync Default Catalog to Database'}
                </button>
              </div>

              <div className="overflow-x-auto border border-neutral-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-700">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Product</th>
                      <th className="py-2.5 px-4 font-semibold">Category</th>
                      <th className="py-2.5 px-4 font-semibold">Price (PKR)</th>
                      <th className="py-2.5 px-4 font-semibold">Stock</th>
                      <th className="py-2.5 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 tabular-nums">
                    {products.map((product) => (
                      <ProductAdminRow
                        key={product.id}
                        product={product}
                        busy={busyId === product.id}
                        onSave={handleQuickUpdateProduct}
                        onDelete={handleDeleteProduct}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add New Product Form */}
              <form
                onSubmit={handleAddProduct}
                className="p-5 bg-neutral-50 border border-neutral-200 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#717fe0]" aria-hidden="true" />
                  <h4 className="text-sm font-semibold text-neutral-900">
                    Add New Product
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Product name (e.g. Linen Kurta Shirt)"
                    required
                    className="h-10 px-3 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                  />
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(
                        e.target.value as Exclude<Category, 'All Products'>
                      )
                    }
                    className="h-10 px-3 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newImageIdx}
                    onChange={(e) => setNewImageIdx(Number(e.target.value))}
                    className="h-10 px-3 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                  >
                    {PRODUCTS.map((p, idx) => (
                      <option key={p.id} value={idx}>
                        Studio Photo: {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="number"
                    min={100}
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="Price (PKR)"
                    className="h-10 px-3 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                  />
                  <input
                    type="number"
                    min={0}
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="Stock qty"
                    className="h-10 px-3 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                  />
                  <input
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    placeholder="Color"
                    className="h-10 px-3 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                  />
                  <input
                    type="text"
                    value={newMaterial}
                    onChange={(e) => setNewMaterial(e.target.value)}
                    placeholder="Material"
                    className="h-10 px-3 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="url"
                    value={newCustomImageUrl}
                    onChange={(e) => setNewCustomImageUrl(e.target.value)}
                    placeholder="Optional custom image URL (https://...)"
                    className="h-10 px-3 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                  />
                  <input
                    type="text"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Short product description..."
                    required
                    className="sm:col-span-2 h-10 px-3 text-xs bg-white border border-neutral-300 focus:outline-none focus:border-[#717fe0]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={busyId === 'add'}
                    className="h-10 px-5 bg-[#717fe0] hover:bg-[#5b69cf] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    {busyId === 'add' ? 'Saving...' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="py-12 text-center border border-neutral-200 bg-neutral-50">
                  <Mail className="w-8 h-8 text-neutral-300 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm font-medium text-neutral-800">
                    No customer inquiries received yet
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Messages sent from the Contact page by signed-in users appear here.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {messages.map((msg) => (
                    <li
                      key={msg.id}
                      className="p-4 border border-neutral-200 space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-neutral-900">
                          {msg.name} ({msg.email})
                        </span>
                        <span className="text-neutral-500">
                          {msg.topic} · {msg.createdAtLabel}
                        </span>
                      </div>
                      {msg.orderNumber && (
                        <p className="text-[#717fe0] font-medium">
                          Order Ref: {msg.orderNumber}
                        </p>
                      )}
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        {msg.message}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {activeTab === 'subscribers' && (
            <div className="space-y-4">
              {subscribers.length === 0 ? (
                <div className="py-12 text-center border border-neutral-200 bg-neutral-50">
                  <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm font-medium text-neutral-800">
                    No newsletter subscribers saved yet
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Signed-in customers who subscribe in the footer appear here live.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-neutral-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-700">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold">Email</th>
                        <th className="py-2.5 px-4 font-semibold">Source</th>
                        <th className="py-2.5 px-4 font-semibold">Subscribed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {subscribers.map((sub) => (
                        <tr key={sub.id}>
                          <td className="py-2.5 px-4 font-medium text-neutral-900">
                            {sub.email}
                          </td>
                          <td className="py-2.5 px-4 text-neutral-600">{sub.source}</td>
                          <td className="py-2.5 px-4 text-neutral-500 tabular-nums">
                            {sub.createdAtLabel}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ProductAdminRow({
  product,
  busy,
  onSave,
  onDelete,
}: {
  product: Product;
  busy: boolean;
  onSave: (product: Product, pricePkr: number, stock: number) => Promise<void>;
  onDelete: (id: string, name: string) => Promise<void>;
}) {
  const [price, setPrice] = useState(String(product.pricePkr));
  const [stock, setStock] = useState(String(product.stock ?? 24));

  useEffect(() => {
    setPrice(String(product.pricePkr));
    setStock(String(product.stock ?? 24));
  }, [product.pricePkr, product.stock]);

  return (
    <tr>
      <td className="py-2.5 px-4 font-medium text-neutral-900">
        {product.name}
      </td>
      <td className="py-2.5 px-4 text-neutral-600">{product.category}</td>
      <td className="py-2.5 px-4">
        <input
          type="number"
          min={1}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          aria-label={`Price in PKR for ${product.name}`}
          className="w-24 h-8 px-2 border border-neutral-300 bg-white text-xs tabular-nums"
        />
      </td>
      <td className="py-2.5 px-4">
        <input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          aria-label={`Stock count for ${product.name}`}
          className="w-16 h-8 px-2 border border-neutral-300 bg-white text-xs tabular-nums"
        />
      </td>
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              onSave(product, Number(price) || product.pricePkr, Number(stock) || 0)
            }
            className="h-8 px-3 bg-neutral-900 hover:bg-[#717fe0] text-white text-xs font-medium transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(product.id, product.name)}
            aria-label={`Delete ${product.name}`}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  );
}
