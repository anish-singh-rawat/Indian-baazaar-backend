# Backend API Integration Guide - RBAC System

## System Overview

### How Roles and Permissions Work

#### **Role Hierarchy**

```
SUPER_ADMIN (Highest)
    ├── Can do everything
    ├── Manage permissions and roles
    └── View all data
    
ADMIN
    ├── Can perform CRUD on all resources
    ├── Cannot manage permissions
    └── View all data
    
RETAILER
    ├── Can create, edit, delete ONLY their own products
    ├── Can view categories (read-only)
    └── Dashboard shows only their data
    
USER (Lowest)
    ├── Read-only access to products, categories, etc.
    ├── Can create orders
    └── Cannot modify anything
```

#### **Permission Structure**

Each permission has:
- **Resource**: What it applies to (e.g., `product`, `category`, `user`)
- **Action**: What can be done (e.g., `create`, `read`, `update`, `delete`, `upload`)
- **API Path**: The actual endpoint (e.g., `/api/product/create`)
- **Method**: HTTP method (e.g., `POST`, `GET`, `PUT`, `DELETE`)
- **Allowed Roles**: Which roles have this permission by default

Example:
```json
{
  "name": "product.create",
  "resource": "product",
  "action": "create",
  "apiPath": "/api/product/create",
  "method": "POST",
  "allowedRoles": ["SUPER_ADMIN", "ADMIN", "RETAILER"]
}
```

---

### Dashboard Visibility Rules

| Role | What They See |
|------|---------------|
| **SUPER_ADMIN** | ✅ All products, users, orders, categories, ratings, analytics |
| **ADMIN** | ✅ All products, users, orders, categories, ratings, analytics |
| **RETAILER** | ⚠️ Only their own products, their product ratings, their sales data |
| **USER** | ✅ All public data (products, categories) but cannot modify |

**How It Works:**
- When a **RETAILER** calls `GET /api/product/getAllProducts`, the backend automatically filters to return only products where `createdBy` matches their user ID
- When **ADMIN** or **SUPER_ADMIN** calls the same endpoint, they get ALL products
- This filtering happens automatically in the backend - frontend doesn't need to do anything special

---


## Complete API Reference

### 2. Product APIs

#### 2.1 Get All Products (Role-based filtering)
```
GET /api/product/getAllProducts?page=1&limit=10
```

**Who can access:** SUPER_ADMIN, ADMIN, RETAILER (with filtering)

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)

**Response:**
```json
{
  "error": false,
  "success": true,
  "products": [
    {
      "_id": "64abc123...",
      "name": "Product Name",
      "description": "Product description",
      "price": 999,
      "oldPrice": 1299,
      "images": ["https://..."],
      "category": "64def456...",
      "createdBy": "64xyz789...",
      "rating": 4.5,
      "countInStock": 50,
      "createdAt": "2025-11-01T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 10,
  "totalCount": 100
}
```

**Behavior:**
- **SUPER_ADMIN/ADMIN:** Returns ALL products
- **RETAILER:** Returns ONLY products where `createdBy` matches their user ID

---

#### 2.2 Get Single Product
```
GET /api/product/:id
```

**Who can access:** Public (anyone)

**Example:**
```
GET /api/product/64abc123def456ghi789
```

**Response:**
```json
{
  "error": false,
  "success": true,
  "product": {
    "_id": "64abc123...",
    "name": "Product Name",
    "description": "Detailed description",
    "price": 999,
    "oldPrice": 1299,
    "images": ["https://..."],
    "brand": "Brand Name",
    "category": {...},
    "productRam": ["4GB", "8GB"],
    "size": ["S", "M", "L"],
    "productWeight": ["500g", "1kg"],
    "rating": 4.5,
    "createdBy": "64xyz789...",
    "createdAt": "2025-11-01T10:00:00Z"
  }
}
```

---

#### 2.3 Create Product
```
POST /api/product/create
```

**Who can access:** SUPER_ADMIN, ADMIN, RETAILER

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 999,
  "oldPrice": 1299,
  "discount": 23,
  "brand": "Brand Name",
  "category": "64def456...",
  "catName": "Electronics",
  "catId": "64def456...",
  "subCat": "Smartphones",
  "subCatId": "64ghi789...",
  "images": ["https://cloudinary.com/image1.jpg"],
  "bannerimages": ["https://cloudinary.com/banner1.jpg"],
  "bannerTitleName": "Hot Deal",
  "isDisplayOnHomeBanner": false,
  "countInStock": 100,
  "rating": 0,
  "isFeatured": false,
  "productRam": ["4GB", "8GB", "16GB"],
  "size": ["S", "M", "L"],
  "productWeight": ["500g", "1kg"]
}
```

**Response:**
```json
{
  "message": "Product Created successfully",
  "error": false,
  "success": true,
  "product": {
    "_id": "64new123...",
    "name": "New Product",
    "createdBy": "64retailer789...",
    ...
  }
}
```

**Note:** `createdBy` is automatically set to the authenticated user's ID.

---

#### 2.4 Update Product
```
PUT /api/product/updateProduct/:id
```

**Who can access:** SUPER_ADMIN, ADMIN, RETAILER (own products only)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Example:**
```
PUT /api/product/updateProduct/64abc123def456
```

**Request Body:**
```json
{
  "name": "Updated Product Name",
  "price": 1099,
  "discount": 15,
  "countInStock": 75
}
```

**Response (Success):**
```json
{
  "message": "The product is updated",
  "error": false,
  "success": true
}
```

**Response (Retailer tries to update another's product):**
```json
{
  "message": "Permission denied: You can only modify your own products",
  "error": true,
  "success": false
}
```

---

#### 2.5 Delete Product
```
DELETE /api/product/:id
```

**Who can access:** SUPER_ADMIN, ADMIN, RETAILER (own products only)

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```
DELETE /api/product/64abc123def456
```

**Response (Success):**
```json
{
  "message": "Product deleted successfully",
  "error": false,
  "success": true
}
```

**Response (Retailer tries to delete another's product):**
```json
{
  "message": "Permission denied: You can only delete your own products",
  "error": true,
  "success": false
}
```

---

#### 2.6 Upload Product Images
```
POST /api/product/uploadImages
```

**Who can access:** SUPER_ADMIN, ADMIN, RETAILER

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (form-data):**
```
images: [File, File, File]  // Multiple image files
```

**Response:**
```json
{
  "images": [
    "https://cloudinary.com/image1.jpg",
    "https://cloudinary.com/image2.jpg",
    "https://cloudinary.com/image3.jpg"
  ]
}
```

**Usage:** Upload images first, then use the returned URLs in the `images` array when creating a product.

---

#### 2.7 Upload Product Banner Images
```
POST /api/product/uploadBannerImages
```

**Who can access:** SUPER_ADMIN, ADMIN, RETAILER

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (form-data):**
```
bannerimages: [File, File]  // Banner image files
```

**Response:**
```json
{
  "images": [
    "https://cloudinary.com/banner1.jpg",
    "https://cloudinary.com/banner2.jpg"
  ]
}
```

---

#### 2.8 Delete Multiple Products
```
DELETE /api/product/deleteMultiple
```

**Who can access:** SUPER_ADMIN, ADMIN only

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "productIds": ["64abc123...", "64def456...", "64ghi789..."]
}
```

**Response:**
```json
{
  "message": "Products deleted successfully",
  "success": true,
  "deletedCount": 3
}
```

---

### 3. Category APIs

#### 3.1 Get All Categories
```
GET /api/category/
```

**Who can access:** Public (anyone)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64abc123...",
      "name": "Electronics",
      "images": ["https://..."],
      "color": "#FF5733",
      "subCategories": [
        {
          "_id": "64def456...",
          "name": "Smartphones",
          "subCategories": [...]
        }
      ],
      "createdAt": "2025-11-01T10:00:00Z"
    }
  ]
}
```

---

#### 3.2 Create Category
```
POST /api/category/create
```

**Who can access:** SUPER_ADMIN, ADMIN only

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New Category",
  "images": ["https://cloudinary.com/category.jpg"],
  "color": "#FF5733"
}
```

**Response:**
```json
{
  "message": "Category created successfully",
  "success": true,
  "data": {
    "_id": "64new123...",
    "name": "New Category",
    "images": ["https://..."],
    "color": "#FF5733"
  }
}
```

---

#### 3.3 Update Category
```
PUT /api/category/:id
```

**Who can access:** SUPER_ADMIN, ADMIN only

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Example:**
```
PUT /api/category/64abc123def456
```

**Request Body:**
```json
{
  "name": "Updated Category Name",
  "color": "#00FF00"
}
```

**Response:**
```json
{
  "message": "Category updated successfully",
  "success": true
}
```

---

#### 3.4 Delete Category
```
DELETE /api/category/:id
```

**Who can access:** SUPER_ADMIN, ADMIN only

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```
DELETE /api/category/64abc123def456
```

**Response:**
```json
{
  "message": "Category deleted successfully",
  "success": true
}
```

---

### 4. Permission Management APIs (SUPER_ADMIN Only)

#### 4.1 Get All Permissions
```
GET /api/permission/permissions
```

**Who can access:** SUPER_ADMIN, ADMIN (read-only)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Permissions retrieved successfully",
  "success": true,
  "data": [
    {
      "_id": "64abc123...",
      "name": "product.create",
      "description": "Create products",
      "resource": "product",
      "action": "create",
      "apiPath": "/api/product/create",
      "method": "POST",
      "allowedRoles": ["SUPER_ADMIN", "ADMIN", "RETAILER"],
      "isActive": true
    },
    {
      "_id": "64def456...",
      "name": "category.create",
      "description": "Create categories",
      "resource": "category",
      "action": "create",
      "apiPath": "/api/category/create",
      "method": "POST",
      "allowedRoles": ["SUPER_ADMIN", "ADMIN"],
      "isActive": true
    }
  ]
}
```

---

#### 4.2 Create Permission
```
POST /api/permission/permissions
```

**Who can access:** SUPER_ADMIN only

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "product.export",
  "description": "Export products to CSV",
  "resource": "product",
  "action": "read",
  "apiPath": "/api/product/export",
  "method": "GET",
  "allowedRoles": ["SUPER_ADMIN", "ADMIN"]
}
```

**Response:**
```json
{
  "message": "Permission created successfully",
  "success": true,
  "data": {
    "_id": "64new123...",
    "name": "product.export",
    "resource": "product",
    "action": "read",
    ...
  }
}
```

---

#### 4.3 Get Role Permissions
```
GET /api/permission/roles/:role/permissions
```

**Who can access:** SUPER_ADMIN, ADMIN (read-only)

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```
GET /api/permission/roles/RETAILER/permissions
```

**Response:**
```json
{
  "message": "Role permissions retrieved successfully",
  "success": true,
  "data": {
    "role": "RETAILER",
    "permissions": [
      {
        "_id": "64abc123...",
        "name": "product.create",
        "resource": "product",
        "action": "create",
        ...
      },
      {
        "_id": "64def456...",
        "name": "product.update",
        "resource": "product",
        "action": "update",
        ...
      }
    ],
    "description": "Retailer can manage products and view categories/orders"
  }
}
```

---

#### 4.4 Assign Permissions to Role
```
POST /api/permission/roles/assign
```

**Who can access:** SUPER_ADMIN only

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "role": "RETAILER",
  "permissionIds": [
    "64abc123...",
    "64def456...",
    "64ghi789..."
  ]
}
```

**Response:**
```json
{
  "message": "Permissions assigned to role successfully",
  "success": true,
  "data": {
    "role": "RETAILER",
    "permissions": [...]
  }
}
```

**Purpose:** Grant additional permissions to a role (e.g., allow RETAILER to delete multiple products).

---

#### 4.5 Revoke Permissions from Role
```
POST /api/permission/roles/revoke
```

**Who can access:** SUPER_ADMIN only

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "role": "RETAILER",
  "permissionIds": [
    "64abc123..."
  ]
}
```

**Response:**
```json
{
  "message": "Permissions revoked from role successfully",
  "success": true,
  "data": {
    "role": "RETAILER",
    "permissions": [...]
  }
}
```

**Purpose:** Remove permissions from a role (e.g., prevent RETAILER from uploading banner images).

---

#### 4.6 Get User Permissions
```
GET /api/permission/users/:userId/permissions
```

**Who can access:** SUPER_ADMIN, ADMIN (read-only)

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```
GET /api/permission/users/64abc123def456/permissions
```

**Response:**
```json
{
  "message": "User permissions retrieved successfully",
  "success": true,
  "data": {
    "user": {
      "id": "64abc123...",
      "name": "John Retailer",
      "email": "john@example.com",
      "role": "RETAILER"
    },
    "rolePermissions": [
      // All permissions for RETAILER role
    ],
    "userOverrides": {
      "granted": [
        // Extra permissions granted to this specific user
      ],
      "revoked": [
        // Permissions removed from this specific user
      ],
      "grantedBy": {
        "_id": "64superadmin...",
        "name": "Super Admin",
        "email": "admin@example.com"
      }
    }
  }
}
```

---

#### 4.7 Grant Permissions to User
```
POST /api/permission/users/grant
```

**Who can access:** SUPER_ADMIN only

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "64abc123...",
  "permissionIds": [
    "64def456...",
    "64ghi789..."
  ]
}
```

**Response:**
```json
{
  "message": "Permissions granted to user successfully",
  "success": true,
  "data": {
    "userId": "64abc123...",
    "grantedPermissions": [...],
    "revokedPermissions": [],
    "grantedBy": "64superadmin..."
  }
}
```

**Purpose:** Give a specific user extra permissions beyond their role (e.g., allow a specific RETAILER to delete multiple products).

---

#### 4.8 Revoke Permissions from User
```
POST /api/permission/users/revoke
```

**Who can access:** SUPER_ADMIN only

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "64abc123...",
  "permissionIds": [
    "64def456..."
  ]
}
```

**Response:**
```json
{
  "message": "Permissions revoked from user successfully",
  "success": true,
  "data": {
    "userId": "64abc123...",
    "grantedPermissions": [],
    "revokedPermissions": [...],
    "grantedBy": "64superadmin..."
  }
}
```

**Purpose:** Remove specific permissions from a user (e.g., prevent a specific RETAILER from creating products temporarily).

---

#### 4.9 Check User Access
```
POST /api/permission/check-access
```

**Who can access:** SUPER_ADMIN, ADMIN

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "64abc123...",
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

**Purpose:** Check if a specific user has permission to perform an action (useful for debugging or showing/hiding UI elements).

---

### 5. Order APIs

#### 5.1 Get All Orders
```
GET /api/order/
```

**Who can access:** SUPER_ADMIN, ADMIN, RETAILER (filtered)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "_id": "64abc123...",
      "userId": "64user123...",
      "products": [...],
      "totalAmount": 2999,
      "status": "Pending",
      "shippingAddress": {...},
      "createdAt": "2025-11-01T10:00:00Z"
    }
  ]
}
```

---

#### 5.2 Update Order Status
```
PUT /api/order/order-status/:id
```

**Who can access:** SUPER_ADMIN, ADMIN only

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Example:**
```
PUT /api/order/order-status/64abc123def456
```

**Request Body:**
```json
{
  "status": "Shipped"
}
```

**Response:**
```json
{
  "message": "Order status updated successfully",
  "success": true
}
```

---

#### 5.3 Delete Order
```
DELETE /api/order/deleteOrder/:id
```

**Who can access:** SUPER_ADMIN, ADMIN only

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```
DELETE /api/order/deleteOrder/64abc123def456
```

**Response:**
```json
{
  "message": "Order deleted successfully",
  "success": true
}
```

---

### 6. Banner APIs

#### 6.1 Get All Banners (V1)
```
GET /api/bannerV1/
```

**Who can access:** Public (anyone)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64abc123...",
      "title": "Summer Sale",
      "images": ["https://..."],
      "link": "/products/sale",
      "isActive": true
    }
  ]
}
```

---

#### 6.2 Create Banner
```
POST /api/bannerV1/add
```

**Who can access:** SUPER_ADMIN, ADMIN only

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "New Banner",
  "images": ["https://cloudinary.com/banner.jpg"],
  "link": "/products/new",
  "isActive": true
}
```

**Response:**
```json
{
  "message": "Banner created successfully",
  "success": true,
  "data": {
    "_id": "64new123...",
    "title": "New Banner",
    ...
  }
}
```

---

#### 6.3 Update Banner
```
PUT /api/bannerV1/:id
```

**Who can access:** SUPER_ADMIN, ADMIN only

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Example:**
```
PUT /api/bannerV1/64abc123def456
```

**Request Body:**
```json
{
  "title": "Updated Banner Title",
  "isActive": false
}
```

**Response:**
```json
{
  "message": "Banner updated successfully",
  "success": true
}
```

---

#### 6.4 Delete Banner
```
DELETE /api/bannerV1/:id
```

**Who can access:** SUPER_ADMIN, ADMIN only

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```
DELETE /api/bannerV1/64abc123def456
```

**Response:**
```json
{
  "message": "Banner deleted successfully",
  "success": true
}
```

---

### 7. Blog APIs

#### 7.2 Create Blog
```
POST /api/blog/add
```

**Who can access:** SUPER_ADMIN, ADMIN only

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "New Blog Post",
  "content": "Blog content here...",
  "images": ["https://cloudinary.com/blog.jpg"],
  "author": "Admin Name"
}
```

**Response:**
```json
{
  "message": "Blog created successfully",
  "success": true,
  "data": {
    "_id": "64new123...",
    "title": "New Blog Post",
    ...
  }
}
```

---

#### 7.3 Update Blog
```
PUT /api/blog/:id
```

**Who can access:** SUPER_ADMIN, ADMIN only

---

#### 7.4 Delete Blog
```
DELETE /api/blog/:id
```

**Who can access:** SUPER_ADMIN, ADMIN only

---

### 8. Home Slides APIs

#### 8.2 Create Home Slide
```
POST /api/homeSlides/add
```

**Who can access:** SUPER_ADMIN, ADMIN only

---

#### 8.3 Update Home Slide
```
PUT /api/homeSlides/:id
```

**Who can access:** SUPER_ADMIN, ADMIN only

---

#### 8.4 Delete Home Slide
```
DELETE /api/homeSlides/:id
```

**Who can access:** SUPER_ADMIN, ADMIN only

---

## Frontend Integration Guide

### For Junior/New Frontend Developers

This section explains how to integrate the backend APIs into your frontend application step by step.

---

### Step 1: Setup Base Configuration

Create an API configuration file:

```javascript
// src/config/api.js
const API_BASE_URL = 'http://localhost:8080/api';

export const API_ENDPOINTS = {
  // Auth
  REGISTER: `${API_BASE_URL}/user/register`,
  LOGIN: `${API_BASE_URL}/user/login`,
  ADMIN_LOGIN: `${API_BASE_URL}/user/admin-login`,
  LOGOUT: `${API_BASE_URL}/user/logout`,
  USER_DETAILS: `${API_BASE_URL}/user/user-details`,
  
  // Products
  PRODUCTS_ALL: `${API_BASE_URL}/product/getAllProducts`,
  PRODUCT_SINGLE: (id) => `${API_BASE_URL}/product/${id}`,
  PRODUCT_CREATE: `${API_BASE_URL}/product/create`,
  PRODUCT_UPDATE: (id) => `${API_BASE_URL}/product/updateProduct/${id}`,
  PRODUCT_DELETE: (id) => `${API_BASE_URL}/product/${id}`,
  PRODUCT_UPLOAD_IMAGES: `${API_BASE_URL}/product/uploadImages`,
  
  // Categories
  CATEGORIES_ALL: `${API_BASE_URL}/category`,
  CATEGORY_CREATE: `${API_BASE_URL}/category/create`,
  CATEGORY_UPDATE: (id) => `${API_BASE_URL}/category/${id}`,
  CATEGORY_DELETE: (id) => `${API_BASE_URL}/category/${id}`,
  
  // Permissions
  PERMISSIONS_ALL: `${API_BASE_URL}/permission/permissions`,
  ROLE_PERMISSIONS: (role) => `${API_BASE_URL}/permission/roles/${role}/permissions`,
  ASSIGN_ROLE_PERMISSIONS: `${API_BASE_URL}/permission/roles/assign`,
  USER_PERMISSIONS: (userId) => `${API_BASE_URL}/permission/users/${userId}/permissions`,
  GRANT_USER_PERMISSIONS: `${API_BASE_URL}/permission/users/grant`,
};

export default API_BASE_URL;
```

---

### Step 2: Create an API Service Helper

```javascript
// src/services/apiService.js
import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### Step 3: Login & Store Token

```javascript
// src/services/authService.js
import apiClient from './apiService';
import { API_ENDPOINTS } from '../config/api';

export const authService = {
  // Login user
  async login(email, password) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
        email,
        password,
      });
      
      if (response.data.success) {
        // Store token in localStorage
        localStorage.setItem('authToken', response.data.data.access_token);
        localStorage.setItem('refreshToken', response.data.data.refresh_token);
        localStorage.setItem('userRole', response.data.data.user.role);
        localStorage.setItem('userId', response.data.data.user._id);
        
        return response.data;
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Admin login
  async adminLogin(email, password) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.ADMIN_LOGIN, {
        email,
        password,
      });
      
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.data.access_token);
        localStorage.setItem('refreshToken', response.data.data.refresh_token);
        localStorage.setItem('userRole', response.data.data.user.role);
        localStorage.setItem('userId', response.data.data.user._id);
        
        return response.data;
      }
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  },

  // Logout
  async logout() {
    try {
      await apiClient.get(API_ENDPOINTS.LOGOUT);
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Get current user details
  async getUserDetails() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_DETAILS);
      return response.data;
    } catch (error) {
      console.error('Get user details error:', error);
      throw error;
    }
  },

  // Check if user is logged in
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  },

  // Get user role
  getUserRole() {
    return localStorage.getItem('userRole');
  },
};
```

---

### Step 4: Fetch Data Based on User Role

```javascript
// src/services/productService.js
import apiClient from './apiService';
import { API_ENDPOINTS } from '../config/api';

export const productService = {
  // Get all products (automatically filtered by backend based on role)
  async getAllProducts(page = 1, limit = 10) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PRODUCTS_ALL, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error('Get products error:', error);
      throw error;
    }
  },

  // Get single product
  async getProduct(productId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PRODUCT_SINGLE(productId));
      return response.data;
    } catch (error) {
      console.error('Get product error:', error);
      throw error;
    }
  },

  // Create product
  async createProduct(productData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.PRODUCT_CREATE, productData);
      return response.data;
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  },

  // Update product
  async updateProduct(productId, productData) {
    try {
      const response = await apiClient.put(
        API_ENDPOINTS.PRODUCT_UPDATE(productId),
        productData
      );
      return response.data;
    } catch (error) {
      console.error('Update product error:', error);
      throw error;
    }
  },

  // Delete product
  async deleteProduct(productId) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.PRODUCT_DELETE(productId));
      return response.data;
    } catch (error) {
      console.error('Delete product error:', error);
      throw error;
    }
  },

  // Upload images
  async uploadImages(files) {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('images', file);
      });

      const response = await apiClient.post(
        API_ENDPOINTS.PRODUCT_UPLOAD_IMAGES,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Upload images error:', error);
      throw error;
    }
  },
};
```

---

### Step 5: React Component Examples

#### Login Component

```javascript
// src/components/Login.jsx
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      let response;
      if (isAdmin) {
        response = await authService.adminLogin(email, password);
      } else {
        response = await authService.login(email, password);
      }

      if (response.success) {
        const userRole = response.data.user.role;
        
        // Redirect based on role
        if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (userRole === 'RETAILER') {
          navigate('/retailer/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div>
      <h2>{isAdmin ? 'Admin Login' : 'User Login'}</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label>
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          Admin Login
        </label>
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default Login;
```

---

#### Product List Component (with Role-based Filtering)

```javascript
// src/components/ProductList.jsx
import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { authService } from '../services/authService';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const userRole = authService.getUserRole();

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productService.getAllProducts(page, 10);
      if (response.success) {
        setProducts(response.products);
        setTotalPages(response.totalPages);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId);
        fetchProducts(); // Refresh list
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Products</h2>
      {userRole === 'RETAILER' && (
        <p>Showing only your products</p>
      )}
      
      <div className="product-grid">
        {products.map((product) => (
          <div key={product._id} className="product-card">
            <img src={product.images[0]} alt={product.name} />
            <h3>{product.name}</h3>
            <p>${product.price}</p>
            
            {/* Show edit/delete buttons based on role */}
            {(userRole === 'SUPER_ADMIN' || 
              userRole === 'ADMIN' || 
              userRole === 'RETAILER') && (
              <div>
                <button onClick={() => navigate(`/products/edit/${product._id}`)}>
                  Edit
                </button>
                <button onClick={() => handleDelete(product._id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div>
        <button 
          disabled={page === 1} 
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button 
          disabled={page === totalPages} 
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default ProductList;
```

---

#### Create Product Component

```javascript
// src/components/CreateProduct.jsx
import React, { useState } from 'react';
import { productService } from '../services/productService';
import { useNavigate } from 'react-router-dom';

function CreateProduct() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    oldPrice: '',
    discount: '',
    brand: '',
    countInStock: '',
    images: [],
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    setImageFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Step 1: Upload images first
      setUploading(true);
      let imageUrls = [];
      
      if (imageFiles.length > 0) {
        const uploadResponse = await productService.uploadImages(imageFiles);
        imageUrls = uploadResponse.images;
      }

      // Step 2: Create product with image URLs
      const productData = {
        ...formData,
        images: imageUrls,
        price: parseFloat(formData.price),
        oldPrice: parseFloat(formData.oldPrice),
        discount: parseFloat(formData.discount),
        countInStock: parseInt(formData.countInStock),
      };

      const response = await productService.createProduct(productData);
      
      if (response.success) {
        alert('Product created successfully!');
        navigate('/products');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create product');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h2>Create New Product</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Product Name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
        
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleInputChange}
          required
        />
        
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleInputChange}
          required
        />
        
        <input
          type="number"
          name="oldPrice"
          placeholder="Old Price"
          value={formData.oldPrice}
          onChange={handleInputChange}
        />
        
        <input
          type="number"
          name="discount"
          placeholder="Discount %"
          value={formData.discount}
          onChange={handleInputChange}
        />
        
        <input
          type="text"
          name="brand"
          placeholder="Brand"
          value={formData.brand}
          onChange={handleInputChange}
        />
        
        <input
          type="number"
          name="countInStock"
          placeholder="Stock Count"
          value={formData.countInStock}
          onChange={handleInputChange}
          required
        />
        
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
        />
        
        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
}

export default CreateProduct;
```

---

### Step 6: Protected Routes (Role-based Access)

```javascript
// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

function ProtectedRoute({ children, allowedRoles }) {
  const isAuthenticated = authService.isAuthenticated();
  const userRole = authService.getUserRole();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}

export default ProtectedRoute;

// Usage in App.jsx:
/*
<Route
  path="/admin/dashboard"
  element={
    <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/retailer/dashboard"
  element={
    <ProtectedRoute allowedRoles={['RETAILER']}>
      <RetailerDashboard />
    </ProtectedRoute>
  }
/>
*/
```

---

## Role-Based Access Examples

### Example 1: SUPER_ADMIN Managing Permissions

```javascript
// Super admin assigns new permission to RETAILER role
const assignPermission = async () => {
  const response = await fetch('http://localhost:8080/api/permission/roles/assign', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${superAdminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'RETAILER',
      permissionIds: ['64abc123...', '64def456...'],
    }),
  });
  
  const data = await response.json();
  console.log(data); // { success: true, message: "Permissions assigned..." }
};
```

---

### Example 2: ADMIN Viewing All Products

```javascript
// Admin sees ALL products (no filtering)
const getAllProducts = async () => {
  const response = await fetch('http://localhost:8080/api/product/getAllProducts?page=1&limit=10', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  });
  
  const data = await response.json();
  console.log(data.products); // Returns ALL products from all users
};
```

---

### Example 3: RETAILER Viewing Only Their Products

```javascript
// Retailer sees ONLY their products (automatic filtering by backend)
const getMyProducts = async () => {
  const response = await fetch('http://localhost:8080/api/product/getAllProducts?page=1&limit=10', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${retailerToken}`,
    },
  });
  
  const data = await response.json();
  console.log(data.products); // Returns ONLY products where createdBy = retailer's ID
};
```

---

### Example 4: RETAILER Trying to Edit Another's Product

```javascript
// Retailer tries to update a product they don't own
const updateOthersProduct = async () => {
  const response = await fetch('http://localhost:8080/api/product/updateProduct/64someoneElsesProduct', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${retailerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price: 999,
    }),
  });
  
  const data = await response.json();
  console.log(data); 
  // { 
  //   error: true, 
  //   success: false, 
  //   message: "Permission denied: You can only modify your own products" 
  // }
};
```

---

### Example 5: USER Trying to Create Product

```javascript
// Regular user tries to create a product (no permission)
const createProduct = async () => {
  const response = await fetch('http://localhost:8080/api/product/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'New Product',
      price: 100,
    }),
  });
  
  const data = await response.json();
  console.log(data); 
  // { 
  //   success: false, 
  //   message: "Permission denied: You don't have 'create' access to 'product'" 
  // }
};
```

---


### Common HTTP Status Codes

| Code | Meaning | When It Happens |
|------|---------|-----------------|
| **200** | OK | Request successful |
| **201** | Created | Resource created successfully |
| **400** | Bad Request | Invalid request data or missing required fields |
| **401** | Unauthorized | Missing token, invalid token, or expired token |
| **403** | Forbidden | Valid token but user doesn't have permission |
| **404** | Not Found | Resource (product, user, etc.) not found |
| **500** | Internal Server Error | Something went wrong on the server |

---

### Error Response Structure

All error responses follow this structure:

```json
{
  "message": "Error message explaining what went wrong",
  "success": false,
  "error": true
}
```

**Example - Permission Denied:**
```json
{
  "message": "Permission denied: You don't have 'create' access to 'category'",
  "success": false,
  "requiredPermission": {
    "resource": "category",
    "action": "create"
  }
}
```

**Example - Token Expired:**
```json
{
  "message": "Invalid or expired token",
  "success": false,
  "error": "TokenExpiredError"
}
```

---

### Frontend Error Handling Example

```javascript
// src/utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || 'Something went wrong';

    switch (status) {
      case 400:
        return `Invalid request: ${message}`;
      case 401:
        // Redirect to login
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return 'Session expired. Please login again.';
      case 403:
        return `Access denied: ${message}`;
      case 404:
        return `Not found: ${message}`;
      case 500:
        return 'Server error. Please try again later.';
      default:
        return message;
    }
  } else if (error.request) {
    // Request was made but no response
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An error occurred';
  }
};

// Usage:
try {
  await productService.createProduct(data);
} catch (err) {
  const errorMessage = handleApiError(err);
  alert(errorMessage);
}
```

---

## Quick Reference Cheat Sheet

### Authentication
```javascript
// Login
POST /api/user/login
Body: { email, password }
Returns: { access_token, user: { role, ... } }

// Admin Login
POST /api/user/admin-login
Body: { email, password }
Returns: { access_token, user: { role, ... } }

// Get User Details
GET /api/user/user-details
Headers: Authorization: Bearer <token>
```

### Products (Role-based Filtering)
```javascript
// Get All Products
GET /api/product/getAllProducts?page=1&limit=10
Headers: Authorization: Bearer <token>
ADMIN/SUPER_ADMIN: Returns all products
RETAILER: Returns only their products

// Create Product
POST /api/product/create
Headers: Authorization: Bearer <token>
Body: { name, price, description, ... }
Role: SUPER_ADMIN, ADMIN, RETAILER

// Update Product
PUT /api/product/updateProduct/:id
Headers: Authorization: Bearer <token>
Body: { price, name, ... }
RETAILER: Can update only their products
ADMIN: Can update any product

// Delete Product
DELETE /api/product/:id
Headers: Authorization: Bearer <token>
RETAILER: Can delete only their products
ADMIN: Can delete any product
```

### Permissions (SUPER_ADMIN Only)
```javascript
// Get All Permissions
GET /api/permission/permissions
Headers: Authorization: Bearer <token>

// Assign Permission to Role
POST /api/permission/roles/assign
Headers: Authorization: Bearer <token>
Body: { role: "RETAILER", permissionIds: [...] }

// Grant Permission to User
POST /api/permission/users/grant
Headers: Authorization: Bearer <token>
Body: { userId: "...", permissionIds: [...] }
```

---
