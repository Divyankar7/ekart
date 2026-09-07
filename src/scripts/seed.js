/**
 * seed.js — eKart database seed script
 *
 * Run:  npm run seed
 *
 * What it does:
 *   1. Connects to MongoDB using MONGO_URI from .env
 *   2. Clears existing Products (Users are preserved unless stale)
 *   3. Fetches 194 real products from the DummyJSON API
 *   4. Transforms and inserts them into the eKart Product schema
 *   5. Re-inserts/updates the 2 test users (Alice & Bob)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const Product  = require('../models/Product');
const User     = require('../models/User');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return a Date that is exactly `n` days before now */
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

/** Return a random integer between min and max (inclusive) */
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generate a random createdAt date designed to hit the feed shelves:
 *   ~40 products get a date within the last 14 days → freshDrops
 *   the rest are spread across the past 15–365 days
 *
 * @param {number} index  — product index (0-based)
 * @param {number} total  — total product count
 */
const randomCreatedAt = (index, total) => {
  // First 40 products (after shuffle) → fresh
  const freshQuota = 40;
  if (index < freshQuota) {
    return daysAgo(rand(0, 13));        // 0–13 days ago  → freshDrops
  }
  return daysAgo(rand(15, 365));        // 15–365 days ago → older catalog
};

// ---------------------------------------------------------------------------
// Category mapping
// DummyJSON uses slugs like "mens-shirts", "womens-bags", "laptops".
// Map these to our eKart display categories.
// ---------------------------------------------------------------------------
const CATEGORY_MAP = {
  // Beauty & Personal Care
  'beauty':                     'beauty',
  'fragrances':                 'beauty',
  'skin-care':                  'beauty',

  // Electronics
  'laptops':                    'electronics',
  'smartphones':                'electronics',
  'tablets':                    'electronics',
  'mobile-accessories':         'electronics',

  // Apparel
  'mens-shirts':                'apparel',
  'womens-dresses':             'apparel',
  'womens-tops':                'apparel',
  'tops':                       'apparel',

  // Footwear
  'mens-shoes':                 'footwear',
  'womens-shoes':               'footwear',

  // Accessories
  'mens-watches':               'accessories',
  'womens-watches':             'accessories',
  'womens-bags':                'accessories',
  'womens-jewellery':           'accessories',
  'sunglasses':                 'accessories',

  // Home & Kitchen
  'furniture':                  'home & kitchen',
  'home-decoration':            'home & kitchen',
  'kitchen-accessories':        'home & kitchen',

  // Sports & Outdoors
  'sports-accessories':         'sports',
  'motorcycle':                 'automotive',
  'vehicle':                    'automotive',

  // Groceries & Food
  'groceries':                  'groceries',
};

/**
 * Normalise a DummyJSON category string to an eKart category slug.
 * Falls back to the raw value if no mapping exists.
 */
const mapCategory = (raw) =>
  CATEGORY_MAP[raw?.toLowerCase().trim()] ?? raw?.toLowerCase().trim() ?? 'general';

// ---------------------------------------------------------------------------
// Transform a DummyJSON product → eKart Product schema document
// ---------------------------------------------------------------------------
const transform = (item, index, total) => {
  const category = mapCategory(item.category);

  // Tags: combine API tags + category for richer text search
  const tags = Array.from(
    new Set([
      ...(Array.isArray(item.tags) ? item.tags.map((t) => t.toLowerCase()) : []),
      category,
      (item.brand || '').toLowerCase(),
    ])
  ).filter(Boolean);

  // Images: prefer images array, fall back to thumbnail
  const images =
    Array.isArray(item.images) && item.images.length
      ? item.images
      : [item.thumbnail].filter(Boolean);

  // Ratings: DummyJSON ratings can be low (1-2 stars). We floor at 3.5
  // so the catalogue looks healthy, but keep the relative differences.
  const rawRating = typeof item.rating === 'number' ? item.rating : 4.2;
  const ratingsAverage = Math.max(3.5, Math.min(5, rawRating));

  return {
    name:           item.title,
    description:    item.description || '',
    category,
    brand:          item.brand || 'Generic',
    price:          typeof item.price === 'number' ? item.price : 9.99,
    stock:          typeof item.stock === 'number' ? item.stock : 25,
    images,
    ratingsAverage,
    ratingsCount:   rand(45, 845),
    totalSales:     rand(50, 1250),
    tags,
    isActive:       true,
    createdAt:      randomCreatedAt(index, total),
  };
};

// ---------------------------------------------------------------------------
// Fetch all products from DummyJSON (with retry + backoff)
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchDummyProducts = async (retries = 4) => {
  console.log('🌐  Fetching products from DummyJSON API…');
  const url = 'https://dummyjson.com/products?limit=0';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);

      if (res.status === 429) {
        const wait = attempt * 3000; // 3s, 6s, 9s, 12s
        console.log(`    ⏳  Rate limited (429). Waiting ${wait / 1000}s before retry ${attempt}/${retries}…`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        throw new Error(`DummyJSON API error: ${res.status} ${res.statusText}`);
      }

      const json     = await res.json();
      const products = json.products;

      if (!Array.isArray(products) || products.length === 0) {
        throw new Error('DummyJSON returned no products.');
      }

      console.log(`    ✅  Fetched ${products.length} products from API.`);
      return products;
    } catch (err) {
      if (attempt === retries) throw err;
      const wait = attempt * 2000;
      console.log(`    ⚠️   Attempt ${attempt} failed (${err.message}). Retrying in ${wait / 1000}s…`);
      await sleep(wait);
    }
  }
};

// ---------------------------------------------------------------------------
// Build test users
// Must be called AFTER products are inserted to reference real ObjectIds.
// ---------------------------------------------------------------------------
const buildUsers = async (insertedProducts) => {
  const find = (fragment) =>
    insertedProducts.find((p) =>
      p.name.toLowerCase().includes(fragment.toLowerCase())
    );

  // Pick products for Alice's history — prefer electronics if available
  const electronics = insertedProducts.filter((p) => p.category === 'electronics');
  const pick        = (arr, n) => arr.slice(0, n);
  const historyPool = electronics.length >= 5 ? electronics : insertedProducts;

  const [p1, p2, p3, p4, p5] = pick(historyPool, 5);

  // Fallback names for products from DummyJSON (no fixed names guaranteed)
  const laptop   = find('laptop')   || find('macbook') || p1;
  const phone    = find('iphone')   || find('samsung') || find('phone') || p2;
  const tablet   = find('ipad')     || find('tablet')  || p3;
  const keyboard = find('keyboard') || find('gaming')  || p4;
  const watch    = find('watch')    || find('smart')   || p5;

  const hashedPassword = await bcrypt.hash('password123', 12);

  const userA = {
    name:  'Alice Sharma',
    email: 'alice@ekart.dev',
    password: hashedPassword,
    recentSearches: [
      { query: 'wireless headphones', category: 'electronics', searchedAt: daysAgo(0) },
      { query: 'noise cancellation earbuds', category: 'electronics', searchedAt: daysAgo(1) },
      { query: 'mechanical keyboard', category: 'electronics', searchedAt: daysAgo(3) },
      { query: 'best tablet 2024',   category: 'electronics', searchedAt: daysAgo(5) },
      { query: 'logitech mouse',     category: 'electronics', searchedAt: daysAgo(7) },
    ],
    viewedProducts: [
      laptop   && { product: laptop._id,   viewedAt: daysAgo(0) },
      phone    && { product: phone._id,    viewedAt: daysAgo(1) },
      tablet   && { product: tablet._id,   viewedAt: daysAgo(2) },
      keyboard && { product: keyboard._id, viewedAt: daysAgo(3) },
      watch    && { product: watch._id,    viewedAt: daysAgo(4) },
    ].filter(Boolean),
    categoryAffinity: [
      { category: 'electronics', score: 18 },
      { category: 'accessories', score: 4  },
      { category: 'apparel',     score: 2  },
    ],
    purchasedProducts: laptop ? [laptop._id] : [],
  };

  const userB = {
    name:  'Bob Nair',
    email: 'bob@ekart.dev',
    password: hashedPassword,
    recentSearches:   [],
    viewedProducts:   [],
    categoryAffinity: [],
    purchasedProducts:[],
  };

  return [userA, userB];
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const seed = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌  MONGO_URI is not set. Copy .env.example → .env and fill it in.');
    process.exit(1);
  }

  console.log('🌱  Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log(`✅  Connected: ${mongoose.connection.host}\n`);

  // ── 1. Fetch from DummyJSON ───────────────────────────────────────────────
  const rawProducts = await fetchDummyProducts();

  // Shuffle so randomCreatedAt index assignment is not biased by API order
  const shuffled = rawProducts.sort(() => Math.random() - 0.5);

  // ── 2. Transform ──────────────────────────────────────────────────────────
  const transformed = shuffled.map((item, idx) =>
    transform(item, idx, shuffled.length)
  );
  console.log(`\n🔄  Transformed ${transformed.length} products.`);

  // ── 3. Clear products ─────────────────────────────────────────────────────
  console.log('🗑️   Clearing existing products…');
  await Product.deleteMany({});
  console.log('    Products cleared.\n');

  // ── 4. Insert products ────────────────────────────────────────────────────
  console.log(`📦  Inserting ${transformed.length} products…`);
  const insertedProducts = await Product.insertMany(transformed, {
    timestamps: false,  // preserve our explicit createdAt values
  });
  console.log(`    ✅  ${insertedProducts.length} products inserted.\n`);

  // Summary by category
  const byCategory = insertedProducts.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});
  console.log('    Category breakdown:');
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, n]) => console.log(`       • ${cat.padEnd(20)} ${n}`));

  // ── 5. Clear + re-insert test users ──────────────────────────────────────
  console.log('\n🗑️   Clearing existing users…');
  await User.deleteMany({});
  console.log('    Users cleared.');

  console.log('👤  Inserting 2 test users…');
  const userDocs       = await buildUsers(insertedProducts);
  const insertedUsers  = await User.insertMany(userDocs, { timestamps: false });
  insertedUsers.forEach((u) =>
    console.log(`    ✅  ${u.name} (${u.email})`)
  );

  // ── 6. Summary ────────────────────────────────────────────────────────────
  const freshCount    = insertedProducts.filter((p) => new Date(p.createdAt) >= daysAgo(14)).length;
  const trendingCount = insertedProducts.filter((p) => p.totalSales > 100 && p.ratingsAverage >= 4.0).length;
  const lowStockCount = insertedProducts.filter((p) => p.stock < 5).length;

  console.log('\n📊  Seed summary:');
  console.log(`    Products total  : ${insertedProducts.length}`);
  console.log(`    Fresh drops     : ${freshCount}  (createdAt ≤ 14 days ago)`);
  console.log(`    Trending items  : ${trendingCount}  (sales > 100 & rating ≥ 4.0)`);
  console.log(`    Low-stock items : ${lowStockCount}  (stock < 5)`);
  console.log(`    Users           : ${insertedUsers.length}`);
  console.log(`       • Alice Sharma — active shopper (electronics affinity, history seeded)`);
  console.log(`       • Bob Nair     — new user (cold-start fallback)`);
  console.log('\n🎉  Seed complete.\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  mongoose.connection.close().catch(() => {});
  process.exit(1);
});
