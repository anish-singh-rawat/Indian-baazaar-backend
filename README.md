# IndianBaazaar Backend

A scalable Node.js backend for the IndianBaazaar e-commerce platform, built with Express, MongoDB, Redis caching, and modular architecture.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Caching Strategy](#caching-strategy)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- User authentication & authorization (JWT, roles, permissions)
- Product, category, cart, wishlist (myList), order, and address management
- Banner, blog, notification, and home slider modules
- Shiprocket integration for shipping and tracking
- RESTful API design with modular controllers and routes
- Redis caching for GET APIs and cache invalidation on write operations
- File uploads (Cloudinary, Multer)
- Security best practices (Helmet, CORS, cookie-parser)
- Email notifications (Nodemailer)
- Robust error handling

---

## Tech Stack
- **Node.js** (Express)
- **MongoDB** (Mongoose)
- **Redis** (ioredis)
- **Cloudinary** (image uploads)
- **JWT** (authentication)
- **Nodemailer** (emails)
- **Multer** (file uploads)
- **Helmet, CORS** (security)
- **dotenv** (environment config)

---

## Project Structure
```
backend-buy/
├── config/           # DB, Redis, email, async patch
├── controllers/      # API logic (user, product, cart, etc.)
├── helper/           # Shiprocket integration, utilities
├── middlewares/      # Auth, permissions, validation
├── models/           # Mongoose schemas
├── route/            # Express routers
├── utils/            # Redis cache, tokens, templates, etc.
├── Validator/        # Request validation
├── uploads/          # File uploads
├── index.js          # App entry point
├── package.json      # Dependencies & scripts
└── .env              # Environment variables
```

---

## Setup & Installation
1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd backend-buy
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment:**
   - Copy `.env.example` to `.env` and fill in required values (MongoDB URI, Redis, JWT secret, Cloudinary, email, etc.)
4. **Start the server:**
   ```sh
   nodemon
   # or
   npm run dev
   ```

---

## Environment Variables
Required in `.env`:
- `PORT` - Server port
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing key
- `CLOUDINARY_*` - Cloudinary credentials
- `EMAIL_*` - Email service credentials

---

## API Overview
All endpoints are prefixed with `/api/`.
- `/api/user` - User registration, login, profile, permissions
- `/api/category` - Category CRUD
- `/api/product` - Product CRUD, search, filters
- `/api/cart` - Cart management
- `/api/myList` - Wishlist management
- `/api/address` - Address management
- `/api/homeSlides` - Home slider images
- `/api/bannerV1`, `/api/bannerList2` - Banner management
- `/api/blog` - Blog posts
- `/api/order` - Order placement, status, history
- `/api/notification` - User notifications
- `/api/permission` - Role/permission management
- `/api/shiprocket/*` - Shipping, tracking integration

See individual route files for details.

---

## Caching Strategy
- **Redis** is used for GET APIs (product, category, cart, wishlist, etc.).
- **Cache Invalidation:** On create, update, or delete operations, relevant cache keys are deleted to ensure data consistency.
- Utility functions: `getCache`, `setCache`, `delCache` in `utils/redisUtil.js`.

---

## Testing
- Use Postman or similar tools to test API endpoints.
- Automated tests can be added in the future for controllers and models.

---

## Contributing
1. Fork the repo and create your branch.
2. Make changes with clear commit messages.
3. Ensure code follows project style and passes linting.
4. Submit a pull request.

---

## License
This project is licensed under the ISC License.

---

**Contact:** For questions or support, reach out to the project maintainer.
