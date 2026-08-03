# Signature By Sarah Backend API

## Overview

The Signature By Sarah (SBS) Backend API powers the Signature By Sarah ecommerce platform. It provides product discovery and management, quotes, customer carts and favorites, contact and academy forms, gallery content, and role-protected administration endpoints.

The application is built with:

- Node.js and Express
- TypeScript with strict type checking
- PostgreSQL hosted through Supabase
- Supabase Auth for identity and access tokens
- A layered REST API architecture: routes, controllers, services, repositories, validators, and middleware

All API responses use a consistent JSON envelope with `success`, `message`, and `data` fields.

---

## Features

- Supabase authentication and application profiles
- Customer, admin, and super-admin roles
- Public product, collection, material, color, carousel, and customization catalog APIs
- Admin product management, images, variants, and collection assignments
- Public gallery with admin gallery management
- Guest and authenticated quote submission with quote status history
- Contact submissions and admin review
- SBS Academy registrations and admin review
- Authenticated customer carts with price snapshots
- Authenticated product favorites

---

## Setup

### Requirements

- Node.js 18 or later
- A PostgreSQL database (Supabase PostgreSQL is supported)
- A Supabase project configured for Auth

### Installation

```bash
npm install
```

Create a `.env` file with the variables described below, then start the development server:

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Database migrations

Apply the SQL files in `src/database/migrations` in numeric order to a new
database. Existing deployments should apply only the new migration:
`008_one_pending_draft_per_customer.sql` — adds the partial unique index that
enforces one active draft per authenticated customer at the database level.

### Production

```bash
npm start
```

`npm start` runs the compiled server at `dist/server.js`.

---

## Environment Variables

All variables below are required by the current runtime configuration unless a default is noted.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No (defaults to `5000`) | HTTP port used by Express. |
| `NODE_ENV` | No (defaults to `development`) | Application environment; enables production database SSL behavior when set to `production`. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `SUPABASE_URL` | Yes | Supabase project URL. |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public API key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service-role key used by the server to verify and resolve users. Keep secret. |
| `JWT_SECRET` | Yes | Application JWT configuration value. |
| `JWT_EXPIRES_IN` | No (defaults to `7d`) | Application JWT expiry configuration. |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID configuration. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret configuration. Keep secret. |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name required by the current environment loader. |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key required by the current environment loader. |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret required by the current environment loader. Keep secret. |
| `FRONTEND_URL` | Yes | Allowed CORS origin for the frontend. |

Example:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=http://localhost:3000
```

---

## Authentication

Authentication uses Supabase Auth. This API verifies a Supabase access token and resolves it to an SBS application profile.

Protected requests must include:

```http
Authorization: Bearer <access_token>
```

Roles are:

| Role | Access |
| --- | --- |
| `customer` | Own profile, cart, favorites, and quote history. |
| `admin` | Customer access plus all `/api/admin/*` endpoints. |
| `super_admin` | Same administrative endpoint access as `admin`. |

Token sign-up, sign-in, password recovery, and OAuth flows are provided by Supabase Auth. The backend route currently exposed for authentication is `GET /api/auth/me`.

---

# API Documentation

Base URL examples below assume `http://localhost:5000`.

Authentication labels:

- **Public** — no token required.
- **Customer token** — any valid authenticated SBS user token.
- **Admin/Super Admin token** — valid authenticated token with `admin` or `super_admin` role.

## Health

| Method | Route | Auth | Purpose / usage |
| --- | --- | --- | --- |
| `GET` | `/` | Public | Simple server availability response. |
| `GET` | `/api/health` | Public | Health check for local tooling and deployment platforms. |

## Authentication

| Method | Route | Auth | Purpose / usage |
| --- | --- | --- | --- |
| `GET` | `/api/auth/me` | Customer token | Returns the authenticated SBS profile, including role. Use after obtaining a Supabase access token. |

## Products

### Public catalog

| Method | Route | Auth | Purpose / usage |
| --- | --- | --- | --- |
| `GET` | `/api/products` | Public | Lists published, non-deleted products. Supports `collection`, `color`, `category`, `gender`, `size`, `material`, and `sort` filters. |
| `GET` | `/api/products/featured` | Public | Lists published featured products. |
| `GET` | `/api/products/hero` | Public | Lists published hero products. |
| `GET` | `/api/products/:slug` | Public | Returns one published product with `colors`, `materials`, and `sizes` catalog arrays. |

### Admin product management

| Method | Route | Auth | Purpose / usage |
| --- | --- | --- | --- |
| `POST` | `/api/admin/products` | Admin/Super Admin token | Creates a product. |
| `PATCH` | `/api/admin/products/:id` | Admin/Super Admin token | Partially updates an active product. |
| `DELETE` | `/api/admin/products/:id` | Admin/Super Admin token | Soft-deletes a product by setting `deleted_at`. |
| `POST` | `/api/admin/products/:id/images` | Admin/Super Admin token | Stores image metadata; does not upload a file. |
| `DELETE` | `/api/admin/products/:id/images/:imageId` | Admin/Super Admin token | Removes one image metadata record. |
| `POST` | `/api/admin/products/:id/collections` | Admin/Super Admin token | Assigns a product to a collection. Duplicate assignments are rejected. |
| `DELETE` | `/api/admin/products/:id/collections/:collectionId` | Admin/Super Admin token | Removes only the product-to-collection relationship. |
| `POST` | `/api/admin/products/:id/variants` | Admin/Super Admin token | Adds a product variant. |
| `PATCH` | `/api/admin/products/:id/variants/:variantId` | Admin/Super Admin token | Partially updates a product variant. |
| `DELETE` | `/api/admin/products/:id/variants/:variantId` | Admin/Super Admin token | Removes a product variant. |

Create a product:

```json
{
  "name": "Classic Leather Loafer",
  "slug": "classic-leather-loafer",
  "description": "Handcrafted leather loafer.",
  "category": "Shoes",
  "basePrice": 85000,
  "isCustomizable": true,
  "status": "draft",
  "isFeatured": false,
  "isHero": false,
  "colors": [
    { "name": "Brown", "hex": "#8B4513" },
    { "name": "Black", "hex": "#000000" }
  ],
  "materials": [
    { "name": "Full Grain Leather" }
  ],
  "sizes": [40, 41, 42]
}
```

`category` is an optional free-form label (for example, `Shoes`, `Bags`, `Belts`, `Wallets`, or `Accessories`) and is separate from collections. `status` is one of `draft`, `published`, or `archived`. Product updates accept any non-empty subset of the same fields, including `category`.

`gender` is optional and can be `male`, `female`, or `unisex`. Valid product sort values are `newest`, `price_asc`, `price_desc`, `size_asc`, `size_desc`, and `collection_sort`. `size_asc` and `size_desc` order products by their minimum and maximum assigned size respectively; products with no sizes sort last. `collection_sort` orders products by their `sort_order` within the filtered collection. Color filtering uses an exact hex code (for example `%23111111`); `collection` and `material` use their slugs (for example `mens-shoes` and `full-grain-leather`); `size` uses the numeric size value. Material objects in product and material responses include `id`, `name`, and `slug`.

`colors`, `materials`, and `sizes` are optional create/update fields. Supplying one replaces that product's corresponding availability list in the same transaction. The API creates or reuses the necessary catalog records; no prior catalog request is needed. Sizes are stored through `sizes` and `product_sizes`, independently of legacy product variants. All product list and detail responses include `colors`, `materials`, and `sizes`; color objects expose both `hex` and `hexCode`.

Add image metadata:

```json
{
  "imageUrl": "https://images.example.com/loafer.jpg",
  "imagePublicId": "products/loafer-main",
  "altText": "Classic leather loafer",
  "sortOrder": 0,
  "isPrimary": true
}
```

Assign a collection:

```json
{ "collectionId": "00000000-0000-0000-0000-000000000000" }
```

Create or update a variant. All fields are optional for creation because database defaults apply; update requests must include at least one field.

```json
{
  "sizeLabel": "42",
  "sizeValue": 42,
  "sku": "SBS-LOAFER-42-BROWN",
  "priceAdjustment": 5000,
  "colorId": "00000000-0000-0000-0000-000000000000",
  "isAvailable": true,
  "sortOrder": 0
}
```

## Collections

| Method | Route | Auth | Purpose / usage |
| --- | --- | --- | --- |
| `GET` | `/api/collections` | Public | Lists published collections; use `?featured=true` for homepage collections. |
| `GET` | `/api/collections/:slug` | Public | Returns a published collection and its published products. |
| `GET` | `/api/admin/collections` | Admin/Super Admin token | Lists all collections, including drafts and archived collections. |
| `POST` | `/api/admin/collections` | Admin/Super Admin token | Creates a collection. |
| `PATCH` | `/api/admin/collections/:id` | Admin/Super Admin token | Partially updates a collection. |
| `DELETE` | `/api/admin/collections/:id` | Admin/Super Admin token | Deletes a collection. |

Create a collection:

```json
{
  "name": "Men's Shoes",
  "slug": "mens-shoes",
  "description": "Handcrafted shoes for men.",
  "imageUrl": "https://images.example.com/mens-shoes.jpg",
  "imagePublicId": "collections/mens-shoes",
  "status": "draft",
  "isFeatured": false,
  "sortOrder": 0
}
```

Updates accept any non-empty subset of these fields.

## Homepage carousel

| Method | Route | Auth | Purpose / usage |
| --- | --- | --- | --- |
| `GET` | `/api/home/carousel` | Public | Lists active carousel slides by `sortOrder`. |
| `GET` | `/api/admin/home/carousel` | Admin/Super Admin token | Lists all carousel slides, including inactive ones. |
| `POST` | `/api/admin/home/carousel` | Admin/Super Admin token | Creates a carousel slide. |
| `PATCH` | `/api/admin/home/carousel/:id` | Admin/Super Admin token | Updates a carousel slide. |
| `DELETE` | `/api/admin/home/carousel/:id` | Admin/Super Admin token | Deletes a carousel slide. |

Carousel create body:

```json
{
  "imageUrl": "https://images.example.com/home-slide.jpg",
  "imagePublicId": "homepage/slide-01",
  "sortOrder": 0,
  "isActive": true
}
```

## Custom order builder

| Method | Route | Auth | Purpose / usage |
| --- | --- | --- | --- |
| `GET` | `/api/customizations` | Public | Returns active customization categories with active options. |
| `GET` | `/api/admin/customizations` | Admin/Super Admin token | Returns all categories and options, including inactive items. |
| `POST` | `/api/admin/customizations/categories` | Admin/Super Admin token | Creates a category. |
| `PATCH` | `/api/admin/customizations/categories/:id` | Admin/Super Admin token | Updates a category. |
| `DELETE` | `/api/admin/customizations/categories/:id` | Admin/Super Admin token | Deletes a category and its options. |
| `POST` | `/api/admin/customizations/options` | Admin/Super Admin token | Creates an option. |
| `PATCH` | `/api/admin/customizations/options/:id` | Admin/Super Admin token | Updates an option. |
| `DELETE` | `/api/admin/customizations/options/:id` | Admin/Super Admin token | Deletes an option. |

Categories and options use a reusable `active`/`inactive` status and `sortOrder`. The migration seeds Shoe Types with the requested styles and creates empty Materials, Soles, and Colours categories for the admin to populate.

## Materials and Colors

| Method | Route | Auth | Purpose / usage |
| --- | --- | --- | --- |
| `GET` | `/api/materials` | Public | Lists active materials. |
| `GET` | `/api/colors` | Public | Lists active colors. |

Material responses include `id`, `name`, `slug`, `description`, and `imageUrl`. The stable `slug` is the value accepted by `GET /api/products?material=...`.

## Gallery

| Method | Route | Auth | Purpose / usage |
| --- | --- | --- | --- |
| `GET` | `/api/gallery` | Public | Lists published gallery images. |
| `POST` | `/api/admin/gallery` | Admin/Super Admin token | Stores gallery image metadata; does not upload a file. |
| `DELETE` | `/api/admin/gallery/:id` | Admin/Super Admin token | Deletes a gallery image record. |

Create gallery metadata:

```json
{
  "title": "Workshop craftsmanship",
  "imageUrl": "https://images.example.com/workshop.jpg",
  "imagePublicId": "gallery/workshop-01",
  "category": "workshop",
  "sortOrder": 0,
  "isPublished": true
}
```

`category` must be `workshop`, `craftsmanship`, or `completed_work`.

## Contact

| Method | Route | Auth | Purpose / usage |
| --- | --- | --- | --- |
| `POST` | `/api/contact` | Public | Submits a contact-form message. |
| `GET` | `/api/admin/contact` | Admin/Super Admin token | Returns all contact submissions, newest first. |
| `GET` | `/api/admin/contact/:id` | Admin/Super Admin token | Returns one contact submission. |

Submit a contact form:

```json
{
  "name": "Ada Okafor",
  "email": "ada@example.com",
  "phone": "+2348012345678",
  "subject": "Custom shoes enquiry",
  "message": "I would like to discuss a custom order."
}
```

`name`, `email`, and `message` are required. `phone` and `subject` are optional.

## Academy Applications

| Method | Route | Auth | Purpose / usage |
| --- | --- | --- | --- |
| `POST` | `/api/academy/register` | Public | Submits an SBS Academy application. |
| `GET` | `/api/admin/academy/applications` | Admin/Super Admin token | Returns all applications, newest first. |
| `GET` | `/api/admin/academy/applications/:id` | Admin/Super Admin token | Returns one application. |

Submit an application:

```json
{
  "fullName": "Ada Okafor",
  "email": "ada@example.com",
  "phone": "+2348012345678",
  "country": "Nigeria",
  "experienceLevel": "beginner",
  "motivation": "I want to learn leather craftsmanship."
}
```

`fullName`, `email`, and `phone` are required. `experienceLevel` may be `beginner`, `intermediate`, or `advanced`.

## Quotes

| Method | Route | Auth | Purpose / usage |
| --- | --- | --- | --- |
| `POST` | `/api/quotes` | Public; customer token optional | Submits a guest or authenticated quote. Guests must provide `guestName` and `guestEmail`. |
| `GET` | `/api/quotes/my` | Customer token | Lists only the authenticated customer's quote history. |
| `GET` | `/api/quotes/:id` | Customer token | Returns one quote owned by the authenticated customer, including items and status history. |
| `PATCH` | `/api/quotes/:id` | Customer token | Updates an owned, still-pending customer quote. |
| `GET` | `/api/admin/quotes` | Admin/Super Admin token | Lists all quotes. An optional `?status=` filter is supported. |
| `GET` | `/api/admin/quotes/:id` | Admin/Super Admin token | Returns one quote with customer details, items, and status history. |
| `PATCH` | `/api/admin/quotes/:id/status` | Admin/Super Admin token | Updates quote status and writes a history entry. |

Submit a guest quote:

```json
{
  "guestName": "Ada Okafor",
  "guestEmail": "ada@example.com",
  "guestPhone": "+2348012345678",
  "customerNotes": "Please contact me with available options.",
  "items": [
    {
      "productId": "00000000-0000-0000-0000-000000000000",
      "productName": "Classic Leather Loafer",
      "imageUrlSnapshot": "https://images.example.com/loafer.jpg",
      "shoeNameSnapshot": "Classic Loafer",
      "toeStyleSnapshot": "Round toe",
      "size": 42,
      "material": "Full Grain Leather",
      "color": "Brown",
      "quantity": 1,
      "unitPriceSnapshot": 85000,
      "customMeasurements": { "footLength": 27 },
      "customNotes": "Slightly wider fit."
    }
  ]
}
```

All quote-item snapshot and customisation fields are optional and nullable: `productNameSnapshot`, `variantLabelSnapshot`, `materialNameSnapshot`, `colorNameSnapshot`, `imageUrlSnapshot`, `shoeNameSnapshot`, `toeStyleSnapshot`, `size`, `customMeasurements`, `customNotes`, and `unitPriceSnapshot`. This allows a customer to save a partially configured item. When a value is supplied it is stored as an immutable snapshot; omitted or `null` values are stored as `null`, not placeholder strings. `productId` is also nullable — a fully custom shoe that does not correspond to any product record can be quoted by omitting or setting `productId` to `null`. Legacy `productName`, `material`, and `color` input aliases remain supported for compatibility.

New quotes have two independent lifecycle fields: `status` is the admin workflow (`pending`, `reviewing`, `approved`, `completed`, or `cancelled`), while `customerStatus` tracks customer submission and starts as `pending`.

### Active quote draft lifecycle

Authenticated customers have **one active draft** at a time:

```
Customer calls POST /api/quotes
  ↓
If a pending draft exists → merge items/notes into it (no new record)
If no pending draft exists → create a new quote with customerStatus = pending
  ↓
Customer calls PATCH /api/quotes/:id to add, remove, or update items
  ↓
Customer sets customerStatus = completed to submit the draft
  ↓
Completed quote enters history — cannot be edited
  ↓
Customer may now create a new pending draft
```

This is enforced at both the application layer and the database layer via a partial unique index on `(profile_id) WHERE customer_status = 'pending'`.

### customerStatus vs status

| Field | Controlled by | Values | Purpose |
| --- | --- | --- | --- |
| `customerStatus` | Customer | `pending`, `completed` | Tracks whether the customer has finished building and submitted their draft. |
| `status` | Admin | `pending`, `reviewing`, `approved`, `completed`, `cancelled` | Admin review workflow. Independent of `customerStatus`. |

Setting `customerStatus = completed` does **not** change the admin `status`. The admin workflow begins after the customer submits.

### Nullable productId

`productId` on a quote item is optional and nullable. A customer building a fully custom shoe — with custom measurements, materials, and notes but no matching product in the catalogue — can submit a quote item with `productId: null`. The snapshot fields capture all relevant details.

Update a customer quote:

```json
{
  "customerNotes": "Please use the darker leather.",
  "customerStatus": "completed",
  "items": [
    {
      "productId": "00000000-0000-0000-0000-000000000000",
      "productNameSnapshot": "Classic Leather Loafer",
      "imageUrlSnapshot": "https://images.example.com/loafer.jpg",
      "shoeNameSnapshot": "Classic Loafer",
      "toeStyleSnapshot": "Round toe",
      "quantity": 2,
      "unitPriceSnapshot": 85000
    }
  ]
}
```

All fields are optional, but at least one must be supplied. When `items` is supplied it replaces the quote's item list, allowing additions, removals, and quantity changes in one request. Item snapshot fields are accepted directly and returned by the quote GET/PATCH responses. Admin-only fields, including admin notes and the admin workflow status, are not accepted.

A draft item can therefore be created or updated before customisation is complete:

```json
{
  "items": [
    {
      "productId": "00000000-0000-0000-0000-000000000000",
      "quantity": 1,
      "productNameSnapshot": null,
      "imageUrlSnapshot": null,
      "unitPriceSnapshot": null
    }
  ]
}
```

For authenticated submissions, send a customer token; guest contact fields are not required. Quote statuses are `pending`, `reviewing`, `approved`, `completed`, and `cancelled`.

Update quote status:

```json
{
  "status": "reviewing",
  "note": "Measurements are being reviewed."
}
```

## Cart

Cart endpoints are authenticated-only. A cart belongs to the authenticated profile. Adding the same product, variant, color, material, and size combination increases its quantity instead of creating a duplicate. The current product/variant and option price is saved in the existing `unit_price_snapshot` field when the item is first added. The selected primary product image URL is also stored as `imageUrlSnapshot` on the cart item; this snapshot is returned directly and is not changed if product images are later updated.

| Method | Route | Auth | Purpose / usage |
| --- | --- | --- | --- |
| `GET` | `/api/cart` | Customer token | Returns the current cart, product details, selected variant details, and available image metadata. Creates an empty cart if needed. |
| `POST` | `/api/cart/items` | Customer token | Adds an item or increases the quantity of an existing product/variant entry. |
| `PATCH` | `/api/cart/items/:id` | Customer token | Changes an owned cart item's quantity; quantity must be greater than zero. |
| `DELETE` | `/api/cart/items/:id` | Customer token | Removes an owned cart item. |
| `DELETE` | `/api/cart` | Customer token | Clears all items from the current cart. |

Add an item:

```json
{
  "productId": "00000000-0000-0000-0000-000000000000",
  "selectedColor": "Brown",
  "selectedMaterial": "Full Grain Leather",
  "selectedSize": 42,
  "quantity": 1
}
```

`selectedColor`, `selectedMaterial`, and `selectedSize` must be available on the product. `selectedSize` is validated through `product_sizes`; it does not create or resolve a product variant. `variantId` remains supported for legacy variant use independently of `selectedSize`.

Update quantity:

```json
{ "quantity": 3 }
```

## Favorites

Favorites belong to authenticated profiles. Each profile can favorite a product only once.

| Method | Route | Auth | Purpose / usage |
| --- | --- | --- | --- |
| `GET` | `/api/favorites` | Customer token | Lists the authenticated profile's favorite products with image metadata. |
| `POST` | `/api/favorites/:productId` | Customer token | Adds an active product to favorites. |
| `DELETE` | `/api/favorites/:productId` | Customer token | Removes an owned favorite by product ID. |

Example usage:

```http
POST /api/favorites/00000000-0000-0000-0000-000000000000
Authorization: Bearer <access_token>
```

---

## Deployment

### Render

Configure the Render service with all required environment variables, including `DATABASE_URL`, the Supabase values, OAuth values, Cloudinary values, and `FRONTEND_URL`.

| Setting | Value |
| --- | --- |
| Build command | `npm install --include=dev && npm run build` |
| Start command | `node dist/server.js` |
| Health check path | `GET /api/health` |

Set `NODE_ENV=production`. The server uses SSL for PostgreSQL connections in production.

After deployment, use the configured Render URL as the API base URL and set `FRONTEND_URL` to the deployed frontend origin for CORS.
