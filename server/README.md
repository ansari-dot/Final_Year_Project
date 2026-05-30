# ReWearX Backend (Node.js + Express + MySQL)

AI-Powered Clothing Barter Platform – Node.js REST + Socket.IO API.

> **Backend Developer:** Arsalan Saleem (SP23-BSE-070)
>
> This implementation is **Node.js only** (no FastAPI). The recommendation
> engine ships with a content-based fallback ranker written in pure JS that
> uses categories, sizes, colors, conditions, and (optional) JSON feature
> vectors stored in `item_features`. A future FastAPI microservice can be
> wired in via `services/recommendationService.callFastAPIRecommend`.

---

## Tech Stack

| Component       | Technology                                |
|-----------------|--------------------------------------------|
| Runtime         | Node.js 22.x                               |
| Framework       | Express.js 4.x                             |
| Database        | MySQL 8.x (InnoDB)                         |
| ORM             | Sequelize 6.x                              |
| Real-Time       | Socket.IO 4.x                              |
| Auth            | JWT (24h access + 7d refresh)              |
| Hashing         | bcrypt (cost ≥ 12)                         |
| Validation      | express-validator                          |
| Image Storage   | Cloudinary                                 |
| Email           | Nodemailer (SendGrid SMTP / any SMTP)      |
| Logging         | Winston + Morgan                           |
| Rate Limiting   | express-rate-limit                         |

---

## Project Structure

```
server/
├── app.js                  Express app (middleware, routes, errors)
├── server.js               HTTP + Socket.IO bootstrap
├── package.json
├── .env.example
├── config/                 Env, DB, Cloudinary
├── controllers/            HTTP request handlers
├── middleware/             auth, RBAC, errors, rate limit, CORS, upload, audit
├── models/                 Sequelize models (16 tables)
├── routes/                 Express routers per resource
├── services/               Business logic + integrations
├── sockets/                Socket.IO server, events, auth
├── utils/                  logger, validators, tokens, email templates, seed
└── uploads/                Local fallback (Cloudinary is primary)
```

---

## Quick Start

### 1. Install

```bash
cd server
cp .env.example .env       # copy and fill in values
npm install
```

### 2. Configure `.env`

Required values to actually run:

```dotenv
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=rewearx
DB_USER=root
DB_PASSWORD=your_password

# JWT (use long random strings)
JWT_SECRET=replace_with_long_random_string
JWT_REFRESH_SECRET=replace_with_another_random_string

# Cloudinary (optional in dev; required for image uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (optional in dev – emails are logged to console if missing)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
EMAIL_FROM=ReWearX <no-reply@rewearx.com>
```

### 3. Create the database

```sql
CREATE DATABASE rewearx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The first run with `NODE_ENV=development` will auto-`sync({ alter: true })`
all tables. For production, switch to migrations.

### 4. Seed (categories + admin user)

```bash
npm run db:seed
```

Default admin credentials (change in production!):
- email: `admin@rewearx.com`
- password: `Admin@123456`

### 5. Run

```bash
npm run dev      # nodemon
# or
npm start
```

API: http://localhost:5000/api/v1
Health: http://localhost:5000/health

---

## REST API Reference (Base: `/api/v1`)

### Authentication

| Method | Endpoint                       | Access  | Description                               |
|--------|--------------------------------|---------|-------------------------------------------|
| POST   | `/auth/register`               | Public  | Register `{ email, password, name, gender }` |
| POST   | `/auth/login`                  | Public  | Returns `{ accessToken, refreshToken }`   |
| POST   | `/auth/logout`                 | Auth    | Client deletes the JWT                    |
| POST   | `/auth/forgot-password`        | Public  | Send reset email                          |
| POST   | `/auth/reset-password`         | Public  | `{ token, password }`                     |
| GET    | `/auth/verify-email/:token`    | Public  | Verify email                              |
| POST   | `/auth/resend-verification`    | Auth    | Re-send verification email                |
| POST   | `/auth/refresh`                | Public  | `{ refreshToken }` → new access token     |
| POST   | `/auth/change-password`        | Auth    | `{ currentPassword, newPassword }`        |
| GET    | `/auth/me`                     | Auth    | Current user                              |

### Users

| Method | Endpoint                          | Access | Description |
|--------|-----------------------------------|--------|-------------|
| GET    | `/users/me`                       | Auth   | My profile + stats |
| PUT    | `/users/me`                       | Auth   | Update profile |
| POST   | `/users/me/avatar`                | Auth   | Multipart `image` upload |
| GET    | `/users/me/preferences`           | Auth   | Get preferences |
| PUT    | `/users/me/preferences`           | Auth   | Update preferences |
| GET    | `/users/me/addresses`             | Auth   | List addresses |
| POST   | `/users/me/addresses`             | Auth   | Add address |
| DELETE | `/users/me/addresses/:id`         | Auth   | Delete address |
| GET    | `/users/:id`                      | Auth   | Public profile |
| GET    | `/users/:id/reviews`              | Public | Reviews + aggregate rating |

### Items

| Method | Endpoint                              | Access | Description |
|--------|---------------------------------------|--------|-------------|
| GET    | `/items`                              | Public | List/filter items |
| POST   | `/items`                              | Auth   | Create item (multipart `images[]`) |
| GET    | `/items/:id`                          | Public | Get item |
| PUT    | `/items/:id`                          | Auth   | Update owned item |
| DELETE | `/items/:id`                          | Auth   | Soft-delete (sets `is_available=0`) |
| GET    | `/items/user/:userId`                 | Public | List user items |
| POST   | `/items/:id/images`                   | Auth   | Upload more images |
| DELETE | `/items/:id/images/:imgId`            | Auth   | Remove image |
| PUT    | `/items/:id/images/:imgId/primary`    | Auth   | Set primary image |

### Search

| Method | Endpoint    | Access | Description |
|--------|-------------|--------|-------------|
| GET    | `/search`   | Public | Filters: `q, categoryId, gender, condition, size, color, brand, page, limit` |

### Swaps

| Method | Endpoint                | Access | Description |
|--------|-------------------------|--------|-------------|
| POST   | `/swaps`                | Auth   | Create swap request |
| GET    | `/swaps`                | Auth   | My swaps (`?role=sent\|received\|all&status=pending`) |
| GET    | `/swaps/:id`            | Auth   | Swap details |
| PUT    | `/swaps/:id/status`     | Auth   | `{ status: accepted\|rejected\|cancelled\|completed }` |

### Conversations & Messages

| Method | Endpoint                         | Access | Description |
|--------|----------------------------------|--------|-------------|
| GET    | `/conversations`                 | Auth   | My conversations + unread count |
| GET    | `/conversations/:id/messages`    | Auth   | Message history (paginated) |
| POST   | `/conversations/:id/messages`    | Auth   | Send message |
| PUT    | `/conversations/:id/read`        | Auth   | Mark all as read |

### Recommendations

| Method | Endpoint                          | Access | Description |
|--------|-----------------------------------|--------|-------------|
| GET    | `/recommendations?limit=20`       | Auth   | Personalized ranked items |
| GET    | `/recommendations?refresh=true`   | Auth   | Force regenerate |

### Reviews

| Method | Endpoint    | Access | Description |
|--------|-------------|--------|-------------|
| POST   | `/reviews`  | Auth   | `{ swapRequestId, revieweeId, rating, comment }` (after completion) |

### Saved Items

| Method | Endpoint            | Access | Description |
|--------|---------------------|--------|-------------|
| GET    | `/saved`            | Auth   | My bookmarks |
| POST   | `/saved/:itemId`    | Auth   | Bookmark |
| DELETE | `/saved/:itemId`    | Auth   | Remove bookmark |

### Notifications

| Method | Endpoint                       | Access | Description |
|--------|--------------------------------|--------|-------------|
| GET    | `/notifications`               | Auth   | List + unread count |
| GET    | `/notifications/unread-count`  | Auth   | Just the count |
| PUT    | `/notifications/:id/read`      | Auth   | Mark read |
| PUT    | `/notifications/read-all`      | Auth   | Mark all read |

### Reports

| Method | Endpoint    | Access | Description |
|--------|-------------|--------|-------------|
| POST   | `/reports`  | Auth   | `{ reportedUserId, reportedItemId?, reason, description? }` |

### Categories

| Method | Endpoint              | Access | Description |
|--------|-----------------------|--------|-------------|
| GET    | `/categories`         | Public | Active categories + item counts |
| POST   | `/categories`         | Admin  | Create |
| PUT    | `/categories/:id`     | Admin  | Update |
| DELETE | `/categories/:id`     | Admin  | Deactivate |

### Admin

| Method | Endpoint                           | Access | Description |
|--------|------------------------------------|--------|-------------|
| GET    | `/admin/users`                     | Admin  | List users (search/status/role) |
| PUT    | `/admin/users/:id/status`          | Admin  | `{ status: active\|blocked }` |
| GET    | `/admin/items`                     | Admin  | List all items |
| DELETE | `/admin/items/:id`                 | Admin  | Force-delete item |
| GET    | `/admin/reports`                   | Admin  | List reports (`?status=`) |
| PUT    | `/admin/reports/:id`               | Admin  | `{ status, adminNotes? }` |
| GET    | `/admin/stats`                     | Admin  | Platform analytics |

---

## Response Envelope

```json
{
  "success": true,
  "message": "OK",
  "data": { },
  "pagination": { "totalItems": 0, "totalPages": 1, "currentPage": 1, "pageSize": 20, "hasNext": false, "hasPrev": false }
}
```

Errors:

```json
{
  "success": false,
  "message": "Validation failed",
  "details": [{ "field": "email", "message": "Invalid email" }]
}
```

---

## Authentication Flow

1. `POST /auth/register` → user receives verification email + JWT.
2. Use the access token as `Authorization: Bearer <token>`.
3. On 401 with TokenExpiredError, call `POST /auth/refresh` with the refresh token.

---

## Socket.IO Real-Time

**Connect** (after login):

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT' },
  transports: ['websocket', 'polling'],
});

socket.on('connected', ({ userId }) => console.log('Online as', userId));
socket.on('error', console.error);
```

**Join a chat & send a message**:

```js
socket.emit('join-room', { conversationId: 42 }, (ack) => console.log(ack));

socket.emit('send-message', {
  conversationId: 42,
  message: 'Hi! Are you still interested in swapping?',
});

socket.on('receive-message', (msg) => {
  // { id, conversationId, senderId, senderName, message, attachmentUrl, createdAt }
});
```

**Other events**:
- `typing` / `stop-typing` → `typing-indicator` / `stop-typing-indicator`
- `message-read` → `read-receipt`
- Server pushes `notification` to `user:<userId>` room
- Server pushes `swap-status-update` to participants on lifecycle changes

---

## Database (Sequelize)

| Model              | Table              | Purpose |
|--------------------|--------------------|---------|
| `User`             | `users`            | Accounts (RBAC: user/admin) |
| `Address`          | `addresses`        | User addresses |
| `Category`         | `categories`       | Item categories |
| `ClothingItem`     | `clothing_items`   | Listings |
| `ClothingImage`    | `clothing_images`  | Images per item (≤ 5) |
| `ItemFeatures`     | `item_features`    | AI feature vectors (JSON in TEXT) |
| `UserPreferences`  | `user_preferences` | Personalization |
| `UserInterests`    | `user_interests`   | M2M user × category |
| `SavedItem`        | `saved_items`      | Bookmarks |
| `SwapRequest`      | `swap_requests`    | Swap lifecycle |
| `Conversation`     | `conversations`    | One per swap |
| `Message`          | `messages`         | Chat history |
| `Review`           | `reviews`          | Post-swap ratings |
| `Report`           | `reports`          | Moderation queue |
| `Notification`     | `notifications`    | In-app + email |
| `Recommendation`   | `recommendations`  | Cached scored items |

Foreign key constraints, soft-deletion via `is_available`/`status` flags,
indexes on `email`, `status`, `is_available`, FK columns.

---

## Security Checklist

- [x] bcrypt (cost 12) password hashing
- [x] JWT access (24h) + refresh (7d)
- [x] RBAC middleware (`requireAdmin`)
- [x] express-validator on every endpoint
- [x] CORS whitelist
- [x] express-rate-limit (general + stricter on auth routes)
- [x] Centralized error handler (no stack traces in prod)
- [x] Sequelize parameterized queries (no raw SQL)
- [x] Image uploads validated (mime + 5 MB)
- [x] Audit logger for admin actions
- [x] Socket auth with JWT + per-socket message rate limit

---

## Scripts

```bash
npm start         # production
npm run dev       # nodemon hot-reload
npm run db:seed   # seed default categories + admin
```

---

## Notes on the Recommendation Service

The architecture document describes a separate FastAPI microservice with
EfficientNet-B0 + DistilBERT + scikit-learn cosine similarity. Per the user
request, the AI microservice has been **omitted**. Instead:

1. `recommendationService.generateRecommendations` ranks items using a
   weighted score over user preferences, similarity of feature vectors
   (when present in `item_features.image_vector`), freshness, and popularity.
2. `recommendationService.callFastAPIRecommend` is a stub that, when wired
   to a future FastAPI service, will be used preferentially.
3. Cached results are persisted to the `recommendations` table with a
   1-hour TTL and a `?refresh=true` override.

---

## License

MIT © 2024 Arsalan Saleem (SP23-BSE-070)
