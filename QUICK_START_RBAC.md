# RBAC System - Quick Start Guide

## 🚀 Getting Started

### Step 1: Install Dependencies (if not already done)
```bash
npm install
```

### Step 2: Initialize Permissions
Run the seed script to populate the database with default permissions:

```bash
node utils/seedPermissions.js
```

**Expected Output:**
```
✓ Created 56 permissions
✓ Assigned 56 permissions to SUPER_ADMIN
✓ Assigned 52 permissions to ADMIN
✓ Assigned 19 permissions to RETAILER
✓ Assigned 11 permissions to USER
```

### Step 3: Create a Super Admin User

**Option A: Update an existing user**
```javascript
// In MongoDB shell or MongoDB Compass
db.users.updateOne(
  { email: "your-admin@example.com" },
  { $set: { role: "SUPER_ADMIN" } }
)
```

**Option B: Register a new user and update role**
```bash
# 1. Register via API
POST /api/user/register
{
  "name": "Super Admin",
  "email": "superadmin@example.com",
  "password": "securepassword"
}

# 2. Then update role in MongoDB:
db.users.updateOne(
  { email: "superadmin@example.com" },
  { $set: { role: "SUPER_ADMIN" } }
)
```

### Step 4: Start the Server
```bash
npm start
```

### Step 5: Test the System

#### A. Login as Super Admin
```bash
POST http://localhost:8080/api/user/admin-login
Content-Type: application/json

{
  "email": "superadmin@example.com",
  "password": "securepassword"
}
```

**Save the token from the response!**

#### B. Get All Permissions
```bash
GET http://localhost:8080/api/permission/permissions
Authorization: Bearer <your_token>
```

#### C. Get RETAILER Role Permissions
```bash
GET http://localhost:8080/api/permission/roles/RETAILER/permissions
Authorization: Bearer <your_token>
```

---

## 📋 Common Tasks

### Create a RETAILER User

1. **Register the user:**
```bash
POST /api/user/register
{
  "name": "John Retailer",
  "email": "retailer@example.com",
  "password": "password123"
}
```

2. **Update their role to RETAILER:**
```javascript
// In MongoDB
db.users.updateOne(
  { email: "retailer@example.com" },
  { $set: { role: "RETAILER" } }
)
```

### Grant Extra Permission to a Specific User

```bash
POST /api/permission/users/grant
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "permissionIds": ["<permission_id_here>"]
}
```

### Assign New Permission to RETAILER Role

```bash
POST /api/permission/roles/assign
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "role": "RETAILER",
  "permissionIds": ["<permission_id_here>"]
}
```

---

## 🧪 Testing Role-Based Access

### Test 1: RETAILER Creates Product

```bash
# Login as retailer
POST /api/user/login
{
  "email": "retailer@example.com",
  "password": "password123"
}

# Create product (should succeed)
POST /api/product/create
Authorization: Bearer <retailer_token>
{
  "name": "My Product",
  "description": "Test product",
  "price": 100,
  "countInStock": 10,
  "discount": 5,
  "images": []
}
```

✅ **Expected:** Product created with `createdBy` = retailer's user ID

### Test 2: RETAILER Tries to Edit Another's Product

```bash
# Try to update a product created by someone else
PUT /api/product/updateProduct/<another_users_product_id>
Authorization: Bearer <retailer_token>
{
  "price": 200
}
```

❌ **Expected:** 403 Forbidden - "Permission denied: You can only modify your own products"

### Test 3: RETAILER Views Their Products

```bash
GET /api/product/getAllProducts?page=1&limit=10
Authorization: Bearer <retailer_token>
```

✅ **Expected:** Only products created by this retailer (where `createdBy` matches their ID)

### Test 4: ADMIN Views All Products

```bash
# Login as admin
POST /api/user/admin-login
{
  "email": "admin@example.com",
  "password": "adminpass"
}

# Get all products
GET /api/product/getAllProducts?page=1&limit=10
Authorization: Bearer <admin_token>
```

✅ **Expected:** All products from all users

### Test 5: RETAILER Tries to Create Category

```bash
POST /api/category/create
Authorization: Bearer <retailer_token>
{
  "name": "New Category"
}
```

❌ **Expected:** 403 Forbidden - "Permission denied: You don't have 'create' access to 'category'"

---

## 🔍 Checking User Permissions

Use this endpoint to verify what a user can do:

```bash
POST /api/permission/check-access
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "resource": "product",
  "action": "create"
}
```

**Response:**
```json
{
  "message": "User has access",
  "success": true,
  "hasAccess": true,
  "resource": "product",
  "action": "create"
}
```

---

## 📊 Default Permission Summary

### SUPER_ADMIN (56 permissions)
- Full access to everything
- Can manage permissions and roles
- No restrictions

### ADMIN (52 permissions)
- All CRUD operations on products, categories, banners, blogs, orders, users
- Cannot modify permissions or roles
- Can view all data

### RETAILER (19 permissions)
- ✅ Create, update, delete **own products**
- ✅ Upload product images
- ✅ Manage product RAM/size/weight
- ✅ Read categories (view only)
- ✅ Read and create orders
- ❌ Cannot create categories
- ❌ Cannot create banners/blogs
- ❌ Cannot manage users

### USER (11 permissions)
- ✅ Read-only access to products, categories, banners, blogs
- ✅ Create orders
- ❌ Cannot create or modify anything except orders

---

## 🛠️ Troubleshooting

### "Permission denied" error
1. Check user's role: `db.users.findOne({ email: "user@example.com" })`
2. Check role permissions: `GET /api/permission/roles/<ROLE>/permissions`
3. Verify permission exists and is active

### "Invalid or expired token"
1. Make sure you're using `Authorization: Bearer <token>` header
2. Token expires after some time - login again to get a new one
3. Check `.env` has correct `SECRET_KEY_ACCESS_TOKEN`

### Retailer sees all products (not just theirs)
1. Ensure `createdBy` field exists on products
2. Check if middleware `req.user` is properly set
3. Verify `buildRoleBasedFilter` is used in controller

---

## 📝 Environment Variables Required

Make sure your `.env` file has:

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/yourdb
SECRET_KEY_ACCESS_TOKEN=your-secret-key-here
SECRET_KEY_REFRESH_TOKEN=your-refresh-key-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 🎯 Next Steps

1. ✅ Run seed script
2. ✅ Create super admin user
3. ✅ Test login and get token
4. ✅ Test permission endpoints
5. ✅ Create retailer users and test ownership
6. ✅ Integrate with your frontend
7. ✅ Monitor and adjust permissions as needed

---

## 📚 Full Documentation

For detailed API reference, advanced usage, and complete guide, see:
**[RBAC_DOCUMENTATION.md](./RBAC_DOCUMENTATION.md)**

---

**Happy coding! 🎉**
