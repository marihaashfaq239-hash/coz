# COZA STORE Security Specification

## 1. Data Invariants
1. **Admin Authority**: Only verified admins (`marihaashfaq239@gmail.com` with `email_verified == true` or registered `/admins/{uid}` docs) can create, update, or delete `/products/{productId}` or transition `/orders/{orderId}` status.
2. **Product Integrity**: Product IDs must match `^[a-zA-Z0-9_-]+$` (`<= 128` chars), prices and stock must be non-negative numbers, and `updatedAt` must equal `request.time`.
3. **Order Ownership & State Locking**:
   - Verified customers may create `/orders/{orderId}` only with `userId == request.auth.uid`, initial `status == 'Pending'`, `createdAt == request.time`, `updatedAt == request.time`, and bounded `items` (`1 <= size <= 25`).
   - Customers may read (`get` / `list`) ONLY their own orders (`resource.data.userId == request.auth.uid`).
   - Orders cannot be deleted; only admins may update `status` and `updatedAt` (`affectedKeys().hasOnly(['status', 'updatedAt'])`), and non-admins are blocked from terminal state changes.
4. **User Preference Isolation**: `/users/{userId}` holds only `uid`, `displayName`, bounded `wishlistIds` (`<= 50`), and `updatedAt`, accessible strictly to `request.auth.uid == userId` or admins.
5. **Review Integrity**: Verified users may create reviews only with `authorUid == request.auth.uid`, rating in `[1, 5]`, and `createdAt == request.time`.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Product Write**: `POST /products/hack-item` with `auth: null` -> DENIED.
2. **Non-Admin Product Price Tampering**: Customer updates `/products/esprit-ruffle-shirt` `{ pricePkr: 1 }` -> DENIED.
3. **Spoofed Admin Email (Unverified)**: Write with `email: 'marihaashfaq239@gmail.com'`, `email_verified: false` -> DENIED.
4. **ID Poisoning**: Create `/orders/<1500-char-id>` -> DENIED by `isValidId()`.
5. **Order Ownership Spoofing**: User A creates `/orders/CZ-9999` with `userId: 'userB'` -> DENIED.
6. **Order Status Shortcutting**: User creates `/orders/CZ-9998` with `status: 'Delivered'` -> DENIED (must start `'Pending'`).
7. **Shadow Field Injection on Order**: Create order with extra `isPaidOverride: true` -> DENIED by `keys().hasOnly(...)`.
8. **Cross-User Order Scraping**: User A queries `list /orders` without `where('userId', '==', uidA)` -> DENIED by `allow list` `resource.data.userId == request.auth.uid`.
9. **Cross-User PII Read**: User A `get /orders/orderOwnedByB` -> DENIED.
10. **Forged Server Timestamp**: Create review with client `createdAt: '2020-01-01'` -> DENIED (`createdAt == request.time`).
11. **Unbounded Wishlist Array**: User writes `/users/uidA` with 500 `wishlistIds` -> DENIED (`wishlistIds.size() <= 50`).
12. **Review Impersonation**: User A creates review with `authorUid: 'userB'` -> DENIED.
