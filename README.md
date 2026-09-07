# eKart — Personalized Discovery Feed API

Node.js / Express / Mongoose backend implementing a modular discovery feed with activity tracking.

---

## Project Structure

```
ekart/
├── src/
│   ├── config/
│   │   └── db.js                   # Mongoose connection
│   ├── middleware/
│   │   └── auth.js                 # protect + optionalAuth JWT middleware
│   ├── models/
│   │   ├── User.js                 # User schema (recentSearches, viewedProducts, categoryAffinity)
│   │   └── Product.js              # Product schema (text index, totalSales, ratingsAverage)
│   ├── controllers/
│   │   ├── activityController.js   # POST /api/users/track-activity
│   │   └── discoveryController.js  # GET  /api/discovery/feed
│   ├── routes/
│   │   ├── userRoutes.js
│   │   └── discoveryRoutes.js
│   ├── app.js                      # Express app (middleware, routes, error handler)
│   └── server.js                   # Entry point — DB connect + listen
├── .env.example
├── .gitignore
└── package.json
```

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env
# Edit .env and fill in MONGO_URI and JWT_SECRET

# 3. Start (development, with auto-reload)
npm run dev

# 4. Start (production)
npm start
```

---

## API Reference

### Authentication

All protected routes expect a Bearer token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

---

### POST /api/users/track-activity

Records a user interaction. Requires authentication.

**Request body:**

| Field       | Type                   | Required | Description                          |
|-------------|------------------------|----------|--------------------------------------|
| `type`      | `"view"` \| `"search"` | Yes      | Interaction type                     |
| `productId` | `string` (ObjectId)    | For view | Product that was viewed              |
| `query`     | `string`               | For search | Raw search term                    |
| `category`  | `string`               | No       | Category slug (boosts affinity score)|

**Behaviour:**
- `view` — deduplicates and prepends to `viewedProducts`, capped at **10**. Increments category affinity by **+1**.
- `search` — deduplicates by query string and prepends to `recentSearches`, capped at **5**. Increments category affinity by **+2**.

**Example — view:**
```json
POST /api/users/track-activity
{
  "type": "view",
  "productId": "664f1a2b3c4d5e6f7a8b9c0d",
  "category": "electronics"
}
```

**Example — search:**
```json
POST /api/users/track-activity
{
  "type": "search",
  "query": "wireless headphones",
  "category": "electronics"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Activity tracked successfully.",
  "data": {
    "recentSearches": [...],
    "viewedProductsCount": 3,
    "categoryAffinity": [
      { "category": "electronics", "score": 5 }
    ]
  }
}
```

---

### GET /api/discovery/feed

Returns a structured feed of product carousels. Works for both authenticated users and guests — no token required, but including one unlocks the personalized path.

#### Personalized response (logged-in user with history)

```json
{
  "success": true,
  "feedType": "personalized",
  "meta": {
    "userId": "...",
    "basedOnSearch": { "query": "wireless headphones", "category": "electronics" },
    "topCategories": ["electronics", "clothing", "books"]
  },
  "feed": {
    "continueBrowsing":    [ /* 4 most-recently viewed products */ ],
    "basedOnRecentSearch": [ /* 4 products matching latest search term */ ],
    "forYou":              [ /* 8 products from top-affinity categories, excl. viewed/bought */ ],
    "freshDrops":          [ /* 4 newest products added in last 14 days */ ],
    "trendingNow":         [ /* 4 highest totalSales + ratingsAverage products */ ]
  }
}
```

#### Cold-start response (guest or no history)

```json
{
  "success": true,
  "feedType": "cold-start",
  "meta": {
    "userId": null,
    "message": "Log in and start browsing to get a personalized feed tailored to you."
  },
  "feed": {
    "popularCategories": [ /* 6 top-selling products, one per category */ ],
    "trendingNow":       [ /* 6 top-selling/rated products */ ],
    "freshDrops":        [ /* 4 newest products added in last 14 days */ ]
  }
}
```

---

## Data Model Notes

### User — key fields

| Field              | Type     | Description                                    |
|--------------------|----------|------------------------------------------------|
| `recentSearches`   | Array    | Max 5, newest first. Each entry: `{ query, category, searchedAt }` |
| `viewedProducts`   | Array    | Max 10, newest first. Each entry: `{ product (ref), viewedAt }` |
| `categoryAffinity` | Array    | `{ category, score }` — incremented on each interaction |
| `purchasedProducts`| Array    | Product ObjectId refs — excluded from `forYou` shelf |

### Product — key fields

| Field           | Type   | Description                                        |
|-----------------|--------|----------------------------------------------------|
| `category`      | String | Lowercase slug, indexed                            |
| `totalSales`    | Number | Drives `trendingNow` sort                          |
| `ratingsAverage`| Number | Secondary sort for trending and `forYou`           |
| `createdAt`     | Date   | Auto-set by Mongoose timestamps — drives `freshDrops` |
| Text index      | —      | Across `name`, `description`, `tags` (weighted 10/1/5) |

---

## Design Decisions

- **`Promise.allSettled`** in the feed controller: all 5 shelf queries run concurrently and a single DB failure degrades gracefully (returns `[]` for that shelf) instead of breaking the whole response.
- **`optionalAuth`** on the feed route: one endpoint handles both guest and authenticated traffic without duplication.
- **Affinity delta weighting**: searches score `+2` vs views `+1` because a deliberate keyword search signals stronger intent than a passive product view.
- **Text index fallback**: queries shorter than 3 characters fall back to a case-insensitive regex on `name` so short queries (e.g. "TV") still return results.
