# Role-Based Access Control (RBAC) System - Documentation

## Overview

This project implements a comprehensive, dynamic Role-Based Access Control (RBAC) system for managing permissions across different user roles in the backend API.

## Features

✅ **Dynamic Permission Management** - Permissions stored in database and can be modified at runtime  
✅ **Four User Roles** - SUPER_ADMIN, ADMIN, RETAILER, USER  
✅ **Resource Ownership** - Retailers can only modify their own products  
✅ **Permission Inheritance** - User-specific permission overrides on top of role permissions  
✅ **Granular Access Control** - Control access at resource and action level  
✅ **Dashboard Filtering** - Role-based data visibility (admins see all, retailers see only their data)

## User Roles

### 1. SUPER_ADMIN
- **Full Access** to all endpoints
- Can manage permissions and roles
- Can assign/revoke permissions to any user or role
- Can perform all CRUD operations on all resources

### 2. ADMIN
- Access to most endpoints except permission/role management
- Can create, edit, delete any data
- Can view all data in dashboard
- Cannot modify the permission system itself

### 3. RETAILER
- Can create, edit, and delete **only their own products**
- Can add product images and manage product variations (RAM, size, weight)
- Can view categories and orders (read-only)
- Dashboard shows only their own products and related data
- **Ownership Check**: Cannot modify products created by others

### 4. USER
- Read-only access to most resources
- Can create orders
- Can browse products, categories, blogs, etc.
- Cannot create or modify products/categories/banners

## Database Models

### Permission Model
```javascript
{
  name: String,           // e.g., 'product.create'
  description: String,
  resource: String,       // e.g., 'product', 'category', 'user'
  action: String,         // 'create', 'read', 'update', 'delete', 'upload', 'manage'
  apiPath: String,        // e.g., '/api/product/create'
  method: String,         // 'GET', 'POST', 'PUT', 'DELETE'
  allowedRoles: [String], // ['SUPER_ADMIN', 'ADMIN', 'RETAILER']
  isActive: Boolean
}
```

### RolePermission Model
```javascript
{
  role: String,           // 'SUPER_ADMIN', 'ADMIN', 'RETAILER', 'USER'
  permissions: [ObjectId], // Array of Permission IDs
  description: String,
  isActive: Boolean
}
```

### UserPermission Model
```javascript
{
  userId: ObjectId,
  grantedPermissions: [ObjectId],  // Extra permissions granted to this user
  revokedPermissions: [ObjectId],  // Permissions removed from this user
  grantedBy: ObjectId,             // Admin who granted permissions
  notes: String
}
```

### Updated Product Model
```javascript
{
  // ... existing fields ...
  createdBy: ObjectId,  // Reference to User who created this product
}
```

## API Endpoints

### Permission Management (SUPER_ADMIN only)

#### Get All Permissions
```http
GET /api/permission/permissions
Authorization: Bearer <token>
```

#### Create Permission
```http
POST /api/permission/permissions
Authorization: Bearer <token>
Content-Type: application/json

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

#### Update Permission
```http
PUT /api/permission/permissions/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "allowedRoles": ["SUPER_ADMIN", "ADMIN", "RETAILER"]
}
```

#### Delete Permission
```http
DELETE /api/permission/permissions/:id
Authorization: Bearer <token>
```

### Role Management (SUPER_ADMIN only)

#### Get All Roles
```http
GET /api/permission/roles
Authorization: Bearer <token>
```

#### Get Role Permissions
```http
GET /api/permission/roles/:role/permissions
Authorization: Bearer <token>
```
Example: `/api/permission/roles/RETAILER/permissions`

#### Assign Permissions to Role
```http
POST /api/permission/roles/assign
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "RETAILER",
  "permissionIds": ["64a1b2c3d4e5f6g7h8i9j0k1", "64a1b2c3d4e5f6g7h8i9j0k2"]
}
```

#### Revoke Permissions from Role
```http
POST /api/permission/roles/revoke
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "RETAILER",
  "permissionIds": ["64a1b2c3d4e5f6g7h8i9j0k1"]
}
```

### User Permission Management (SUPER_ADMIN only)

#### Get User Permissions
```http
GET /api/permission/users/:userId/permissions
Authorization: Bearer <token>
```

#### Grant Permissions to User
```http
POST /api/permission/users/grant
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "permissionIds": ["64a1b2c3d4e5f6g7h8i9j0k2", "64a1b2c3d4e5f6g7h8i9j0k3"]
}
```

#### Revoke Permissions from User
```http
POST /api/permission/users/revoke
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "permissionIds": ["64a1b2c3d4e5f6g7h8i9j0k2"]
}
```

#### Check User Access
```http
POST /api/permission/check-access
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "resource": "product",
  "action": "create"
}
```

Response:
```json
{
  "message": "User has access",
  "success": true,
  "hasAccess": true,
  "resource": "product",
  "action": "create"
}
```

## Middleware Usage

### checkPermission Middleware

Protects routes with role-based and permission-based access control.

```javascript
import { checkPermission } from '../middlewares/checkPermission.js';

// Basic usage - check resource and action
router.post('/create', 
  checkPermission({ resource: 'product', action: 'create' }), 
  createProduct
);

// Just authentication (no permission check)
router.get('/user-details', 
  checkPermission(), 
  getUserDetails
);

// With ownership check (for retailers)
router.put('/updateProduct/:id', 
  checkPermission({ resource: 'product', action: 'update', checkOwnership: true }), 
  updateProduct
);
```

### How Permission Checking Works

1. **Extract and verify JWT token** from Authorization header
2. **Fetch user** from database
3. **SUPER_ADMIN bypass** - Super admins have full access to everything
4. **Fetch role permissions** from RolePermission collection
5. **Fetch user-specific permissions** from UserPermission collection
6. **Merge permissions**:
   - Start with role permissions
   - Add granted permissions
   - Remove revoked permissions
7. **Check if any permission matches** the required resource + action
8. **For retailers with ownership check** - verify `createdBy` field matches user ID

## Setup & Installation

### 1. Initialize Permissions

Run the seed script to populate default permissions:

```bash
node utils/seedPermissions.js
```

This will:
- Create all default permissions for products, categories, banners, users, etc.
- Assign permissions to each role (SUPER_ADMIN, ADMIN, RETAILER, USER)
- Set up the permission hierarchy

### 2. Create Your First Super Admin

Use your existing user registration/creation method, then update the user's role in MongoDB:

```javascript
// In MongoDB shell or using a script
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "SUPER_ADMIN" } }
)
```

### 3. Test the System

Login as SUPER_ADMIN and test permission management:

```bash
# Login
POST /api/user/admin-login
{
  "email": "admin@example.com",
  "password": "yourpassword"
}

# Get all permissions
GET /api/permission/permissions
Authorization: Bearer <token>

# Get RETAILER permissions
GET /api/permission/roles/RETAILER/permissions
Authorization: Bearer <token>
```

## Role-Based Data Filtering

### Dashboard Visibility Rules

The system automatically filters data based on user role:

#### SUPER_ADMIN & ADMIN
- See **all products** regardless of creator
- See all users, orders, ratings
- Full visibility across the entire system

#### RETAILER
- See **only their own products** (where `createdBy` = their user ID)
- See their own product ratings
- See orders related to their products
- Limited visibility in analytics/dashboard

#### Implementation

The `buildRoleBasedFilter` utility is used in controllers:

```javascript
import { buildRoleBasedFilter } from '../utils/roleFilters.js';

export async function getAllProducts(req, res) {
  // Build filter based on user role
  const filter = buildRoleBasedFilter(req.user, {});
  
  // For RETAILER: filter = { createdBy: userId }
  // For ADMIN/SUPER_ADMIN: filter = {}
  
  const products = await ProductModel.find(filter);
  // ...
}
```

### Ownership Checks

For update/delete operations, the system verifies ownership:

```javascript
import { canModifyResource } from '../utils/roleFilters.js';

export async function updateProduct(req, res) {
  const product = await ProductModel.findById(req.params.id);
  
  // Check if user can modify this product
  if (!canModifyResource(req.user, product)) {
    return res.status(403).json({
      message: "Permission denied: You can only modify your own products"
    });
  }
  
  // Proceed with update...
}
```

## Testing the RBAC System

### Test Scenario 1: RETAILER Creates Product

```bash
# Login as RETAILER
POST /api/user/login
{
  "email": "retailer@example.com",
  "password": "password"
}

# Create a product (should succeed)
POST /api/product/create
Authorization: Bearer <retailer_token>
{
  "name": "My Product",
  "price": 100,
  // ... other fields
}

# The product will have createdBy = retailer's userId
```

### Test Scenario 2: RETAILER Tries to Edit Another's Product

```bash
# Try to update product created by someone else (should fail with 403)
PUT /api/product/updateProduct/<other_users_product_id>
Authorization: Bearer <retailer_token>

# Response:
{
  "message": "Permission denied: You can only modify your own products",
  "error": true,
  "success": false
}
```

### Test Scenario 3: ADMIN Edits Any Product

```bash
# Login as ADMIN
POST /api/user/admin-login
{
  "email": "admin@example.com",
  "password": "adminpass"
}

# Update any product (should succeed)
PUT /api/product/updateProduct/<any_product_id>
Authorization: Bearer <admin_token>
{
  "price": 150
}

# Response: Success
```

### Test Scenario 4: SUPER_ADMIN Assigns Custom Permission

```bash
# Grant a specific retailer permission to delete products
POST /api/permission/users/grant
Authorization: Bearer <super_admin_token>
{
  "userId": "64a1b2c3d4e5f6g7h8i9j0k1",
  "permissionIds": ["<product.deleteMultiple_permission_id>"]
}
```

## Protected Routes Summary

### Products
- ✅ `POST /api/product/create` - SUPER_ADMIN, ADMIN, RETAILER
- ✅ `POST /api/product/uploadImages` - SUPER_ADMIN, ADMIN, RETAILER
- ✅ `PUT /api/product/updateProduct/:id` - SUPER_ADMIN, ADMIN, RETAILER (own products only)
- ✅ `DELETE /api/product/:id` - SUPER_ADMIN, ADMIN, RETAILER (own products only)
- ✅ `DELETE /api/product/deleteMultiple` - SUPER_ADMIN, ADMIN

### Categories
- ✅ `POST /api/category/create` - SUPER_ADMIN, ADMIN
- ✅ `PUT /api/category/:id` - SUPER_ADMIN, ADMIN
- ✅ `DELETE /api/category/:id` - SUPER_ADMIN, ADMIN

### Banners, Blogs, HomeSlides
- ✅ All create/update/delete operations - SUPER_ADMIN, ADMIN only

### Users
- ✅ `PUT /api/user/:id` - SUPER_ADMIN, ADMIN
- ✅ `PUT /api/user/user-avatar` - SUPER_ADMIN, ADMIN

## Troubleshooting

### Issue: Permission Denied Error
**Problem**: User gets 403 "Permission denied" error  
**Solution**: 
1. Check if user's role has the required permission
2. Verify permission exists in database
3. Check if permission is active (`isActive: true`)
4. For retailers, verify they own the resource

### Issue: Token Invalid
**Problem**: 401 "Invalid or expired token"  
**Solution**:
1. Ensure JWT token is sent in `Authorization: Bearer <token>` header
2. Token must be valid and not expired
3. SECRET_KEY_ACCESS_TOKEN must match in .env

### Issue: RETAILER Sees All Products
**Problem**: Retailer dashboard shows all products instead of just theirs  
**Solution**:
1. Ensure `buildRoleBasedFilter` is used in the controller
2. Verify `createdBy` field is set when creating products
3. Check that `req.user` is properly attached by middleware

## Advanced Usage

### Custom Permission for Specific User

```javascript
// Grant product.deleteMultiple to a specific retailer
POST /api/permission/users/grant
{
  "userId": "retailer_user_id",
  "permissionIds": ["product.deleteMultiple_permission_id"]
}
```

### Temporarily Disable a Permission

```javascript
// Update permission to inactive
PUT /api/permission/permissions/:id
{
  "isActive": false
}
```

### Create Custom Resource Permission

```javascript
// Add permission for a new resource
POST /api/permission/permissions
{
  "name": "analytics.view",
  "description": "View analytics dashboard",
  "resource": "analytics",
  "action": "read",
  "apiPath": "/api/analytics/*",
  "method": "GET",
  "allowedRoles": ["SUPER_ADMIN", "ADMIN"]
}
```

## Security Best Practices

1. **Always use HTTPS** in production
2. **Rotate JWT secrets** regularly
3. **Audit permission changes** - log who grants/revokes permissions
4. **Principle of least privilege** - give users minimum necessary permissions
5. **Review permissions regularly** - remove unused or overly permissive access
6. **Test ownership checks** - ensure retailers can't bypass ownership validation

## Migration from Old adminAuth System

The old `adminAuth` middleware has been replaced with the new `checkPermission` middleware. All routes have been updated to use the new RBAC system.

**Before:**
```javascript
router.post('/create', adminAuth, createProduct);
```

**After:**
```javascript
router.post('/create', checkPermission({ resource: 'product', action: 'create' }), createProduct);
```

## Support

For issues or questions about the RBAC system, please check:
1. This documentation
2. The seed script output for default permissions
3. MongoDB collections: `permissions`, `rolepermissions`, `userpermissions`

---

**Built with ❤️ for secure, scalable permission management**
