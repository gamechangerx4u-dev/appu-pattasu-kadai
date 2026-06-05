# Appu Crackers Application Flow

This document outlines the architecture, data flows, and security mechanics for the features implemented in the application.

---

## 1. Category Ordering Flow
Allows administrators to organize categories in a custom order shown on the website.

```
[Admin Page UI] --(Click Up/Down arrow)--> [Swaps order locally in UI state]
      |
      +---> [PUT /api/categories/reorder] (Sends array of category IDs in new sequence)
                  |
                  v
            [Category.bulkWrite()] (Database updates the 'order' field to match indices)
```

- **Database Key**: `order` (Number, default: `0`).
- **Retrieval**: Client fetches categories using `.sort({ order: 1, name: 1 })` so they are displayed in the custom order, and fallback alphabetically.

---

## 2. Multi-Category Products Flow
Enables a single product to belong to multiple categories simultaneously.

```
[Admin Product Form] --(Select multiple Checkboxes)--> [Sends 'categories' array to API]
                                                               |
                                                               v
                                                    [normalizeProductBody()]
                                                               |
                                  +----------------------------+----------------------------+
                                  |                                                         |
                                  v                                                         v
                    ['categories' saved in DB]                                ['category' fallback string (index 0)]
                                  |                                                         |
                                  v                                                         v
                    [Home Page Multi-filtering]                                   [Legacy components compatibility]
```

- **Filtering**: When a user selects a category on the homepage, products are matched if the selected category exists anywhere inside the product's `categories` array.
- **Backward Compatibility**: The first item of the array is copied to the single `category` string field so legacy pages/components continue functioning without changes.

---

## 3. ACID Order Checkout & Stock Management Flow
Secures the purchase lifecycle, preventing negative stock levels (overselling) during checkout.

```
[Checkout Page (Cart)] --(Payment Receipt + Info)--> [POST /api/orders]
                                                           |
                                                           v
                                              [Start MongoDB Session Transaction]
                                                           |
                                                           v
                                            [Verify Stock for each Cart Item]
                                                           |
                                      +--------------------+--------------------+
                                      | (Stock < Qty)                           | (Stock >= Qty)
                                      v                                         v
                             [Abort Transaction]                        [Deduct Stock (Product.save)]
                             [Return Error Code]                                |
                                                                                v
                                                                        [Create Order Document]
                                                                                |
                                                                                v
                                                                        [Commit Transaction]
                                                                                |
                                      +-----------------------------------------+-----------------------------------------+
                                      v                                                                                   v
                             [Client clears Cart state]                                                              [sendOrderEmail()]
                             [Session checkout wiped]                                                            [Dispatches HTML Email to]
                             [Invoice Auto-downloaded]                                                           [appucrackers@gmail.com]
```

- **Nodemailer Dispatch**: On transaction commit, `sendOrderEmail` formats a premium HTML invoice and dispatches it in the background to `appucrackers@gmail.com`.
- **Cart Clearing**: `clearCart()` is invoked on the client side, resetting the `localStorage` shopping cart immediately on order completion.

---

## 4. Secure Admin Authentication Flow
Eliminates storing passwords in plaintext inside the server environment files.

```
[Admin Login / Change Password]
            |
            v
   [crypto.pbkdf2Sync()] (Hashes input with 16-byte random salt, 1000 iterations, SHA-512)
            |
      +-----+-----+
      |           |
      v           v
  [Login]      [Change Password]
      |           |
      v           v
[Compares DB]  [Updates 'passwordHash' & 'salt' fields in 'AdminAuth' collection]
```

- **Initial Seed**: If the MongoDB `AdminAuth` config collection is empty, the database seeds the default password (`admin123`) in its hashed form automatically on server boot.
- **API Protection**: JWT middleware verifies tokens in memory using `ADMIN_TOKEN_SECRET` without hitting the database on every authenticated API request, keeping routing fast.
