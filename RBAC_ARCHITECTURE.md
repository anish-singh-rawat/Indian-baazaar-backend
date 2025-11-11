# RBAC System Architecture & Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                          │
│              POST /api/product/create                           │
│              Authorization: Bearer <token>                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    checkPermission Middleware                    │
│                                                                  │
│  1. Extract & Verify JWT Token                                  │
│  2. Fetch User from Database                                    │
│  3. Check User Status (Active/Inactive)                         │
│  4. SUPER_ADMIN → Full Access ✓                                │
│  5. Otherwise → Check Permissions                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Permission Validation                          │
│                                                                  │
│  ┌──────────────────┐    ┌───────────────────┐                 │
│  │ Role Permissions │    │ User Permissions  │                 │
│  │  (from DB)       │    │  (Overrides)      │                 │
│  │                  │    │                   │                 │
│  │ - RETAILER role  │    │ + Granted perms   │                 │
│  │   has 19 perms   │    │ - Revoked perms   │                 │
│  └────────┬─────────┘    └─────────┬─────────┘                 │
│           │                         │                            │
│           └───────┬─────────────────┘                            │
│                   ▼                                              │
│        ┌──────────────────────────┐                             │
│        │   Merged Permission Set  │                             │
│        │                          │                             │
│        │   Does user have:        │                             │
│        │   resource: 'product'    │                             │
│        │   action: 'create'       │                             │
│        │   ?                      │                             │
│        └──────────┬───────────────┘                             │
│                   │                                              │
└───────────────────┼──────────────────────────────────────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
        ▼                        ▼
   ✅ YES                    ❌ NO
        │                        │
        │                        └──► 403 Forbidden
        │                             "Permission denied"
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Controller Function                           │
│                    createProduct()                               │
│                                                                  │
│  1. Create product with createdBy = req.userId                  │
│  2. Save to database                                            │
│  3. Return success response                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Permission Checking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Makes Request                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ Authenticate  │
                 │  JWT Token    │
                 └───────┬───────┘
                         │
                         ▼
              ┌──────────────────┐
              │ Is SUPER_ADMIN?  │
              └────┬─────────┬───┘
                   │         │
                 YES         NO
                   │         │
                   │         ▼
                   │    ┌─────────────────────┐
                   │    │ Fetch Role Perms    │
                   │    │ from RolePermission │
                   │    └──────────┬──────────┘
                   │               │
                   │               ▼
                   │    ┌─────────────────────┐
                   │    │ Fetch User Perms    │
                   │    │ from UserPermission │
                   │    └──────────┬──────────┘
                   │               │
                   │               ▼
                   │    ┌─────────────────────┐
                   │    │  Merge Permissions  │
                   │    │  Role + Granted     │
                   │    │  - Revoked          │
                   │    └──────────┬──────────┘
                   │               │
                   │               ▼
                   │    ┌─────────────────────┐
                   │    │ Check if permission │
                   │    │ matches resource    │
                   │    │ and action          │
                   │    └────┬────────────┬───┘
                   │         │            │
                   │       MATCH        NO MATCH
                   │         │            │
                   ▼         ▼            ▼
              ┌────────┐  ┌────────┐  ┌──────────┐
              │ ALLOW  │  │ ALLOW  │  │  DENY    │
              │  ✅    │  │  ✅    │  │   ❌     │
              └────┬───┘  └────┬───┘  └────┬─────┘
                   │           │            │
                   └─────┬─────┘            │
                         │                  │
                         ▼                  ▼
                  Execute Controller    Return 403
```

---

## Role Hierarchy

```
                    ┌─────────────────┐
                    │  SUPER_ADMIN    │
                    │  (56 perms)     │
                    │                 │
                    │  • Full Access  │
                    │  • Manage Perms │
                    │  • Manage Roles │
                    └────────┬────────┘
                             │
                   ┌─────────┴─────────┐
                   │                   │
         ┌─────────▼────────┐   ┌──────▼──────────┐
         │      ADMIN        │   │   RETAILER      │
         │   (52 perms)      │   │  (19 perms)     │
         │                   │   │                 │
         │  • All CRUD ops   │   │  • Own products │
         │  • View all data  │   │  • Product mgmt │
         │  • No perm mgmt   │   │  • Limited view │
         └─────────┬─────────┘   └──────┬──────────┘
                   │                    │
                   └─────────┬──────────┘
                             │
                      ┌──────▼────────┐
                      │     USER      │
                      │  (11 perms)   │
                      │               │
                      │  • Read-only  │
                      │  • Can order  │
                      └───────────────┘
```

---

## Data Visibility Rules

```
┌─────────────────────────────────────────────────────────────┐
│                   GET /api/product/getAllProducts            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ buildRoleBasedFilter │
              │    (req.user)        │
              └──────────┬───────────┘
                         │
         ┌───────────────┼────────────────┐
         │               │                │
         ▼               ▼                ▼
┌────────────────┐ ┌─────────────┐ ┌──────────────┐
│  SUPER_ADMIN   │ │    ADMIN    │ │   RETAILER   │
│     ADMIN      │ │             │ │              │
│                │ │             │ │              │
│  Filter: {}    │ │ Filter: {}  │ │ Filter: {    │
│  (no filter)   │ │ (no filter) │ │   createdBy: │
│                │ │             │ │   userId     │
│                │ │             │ │ }            │
└───────┬────────┘ └──────┬──────┘ └──────┬───────┘
        │                 │                │
        ▼                 ▼                ▼
  ┌──────────┐      ┌──────────┐    ┌──────────┐
  │ ALL      │      │ ALL      │    │ ONLY     │
  │ PRODUCTS │      │ PRODUCTS │    │ THEIR    │
  │          │      │          │    │ PRODUCTS │
  └──────────┘      └──────────┘    └──────────┘
```

---

## Ownership Check Flow (RETAILER)

```
┌─────────────────────────────────────────────────────────────┐
│        PUT /api/product/updateProduct/64abc123              │
│        Authorization: Bearer <retailer_token>               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  checkPermission     │
              │  - Validates user    │
              │  - Checks permission │
              └──────────┬───────────┘
                         │
                         ▼ Permission OK
              ┌──────────────────────┐
              │  updateProduct()     │
              │  Controller          │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Fetch existing       │
              │ product from DB      │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ canModifyResource    │
              │ (user, product)      │
              └──────────┬───────────┘
                         │
         ┌───────────────┼────────────────┐
         │                                │
         ▼                                ▼
  product.createdBy                product.createdBy
  === user._id                     !== user._id
         │                                │
         ▼                                ▼
  ┌────────────┐                   ┌──────────────┐
  │  ALLOW     │                   │   DENY       │
  │  Update ✅ │                   │   403 ❌     │
  └────────────┘                   └──────────────┘
```

---

## Permission Assignment Flow

```
┌─────────────────────────────────────────────────────────────┐
│  SUPER_ADMIN: POST /api/permission/roles/assign             │
│  {                                                          │
│    role: "RETAILER",                                        │
│    permissionIds: ["64abc123", "64abc124"]                  │
│  }                                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Verify SUPER_ADMIN  │
              │  has permission      │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Find RolePermission │
              │  for RETAILER        │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Add permission IDs  │
              │  to role.permissions │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Save to database    │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  All RETAILER users  │
              │  now have these      │
              │  permissions         │
              └──────────────────────┘
```

---

## Database Schema Relationships

```
┌──────────────┐         ┌────────────────┐
│    User      │         │  Permission    │
│              │         │                │
│ _id          │         │ _id            │
│ name         │         │ name           │
│ email        │         │ resource       │
│ role  ───────┼────┐    │ action         │
│              │    │    │ apiPath        │
└──────────────┘    │    │ method         │
                    │    │ allowedRoles[] │
                    │    └────────────────┘
                    │            ▲
                    │            │
                    ▼            │
         ┌──────────────────┐   │
         │ RolePermission   │   │
         │                  │   │
         │ role (String)    │   │
         │ permissions[]────┼───┘
         │                  │
         └──────────────────┘
                    ▲
                    │
                    │
         ┌──────────┴───────┐
         │ UserPermission   │
         │                  │
         │ userId           │
         │ grantedPerms[]───┼───┐
         │ revokedPerms[]───┼───┤
         │ grantedBy        │   │
         └──────────────────┘   │
                                │
                        ┌───────┴────────┐
                        │                │
                        ▼                ▼
                To Permission      To Permission
                   (granted)          (revoked)
```

---

## Permission Merge Logic

```
User Effective Permissions = 
  (Role Permissions + User Granted Permissions) - User Revoked Permissions

Example for RETAILER user with overrides:

┌────────────────────────────────────────────────────────────┐
│ Role: RETAILER                                             │
│ Role Permissions: [product.create, product.update, ...]   │
│                   (19 permissions)                         │
└────────────────────────────────────────────────────────────┘
                         +
┌────────────────────────────────────────────────────────────┐
│ User Granted: [category.create]                           │
│ (Super admin gave this user extra permission)             │
└────────────────────────────────────────────────────────────┘
                         -
┌────────────────────────────────────────────────────────────┐
│ User Revoked: [product.deleteMultiple]                    │
│ (Super admin removed this permission from user)           │
└────────────────────────────────────────────────────────────┘
                         =
┌────────────────────────────────────────────────────────────┐
│ Effective: 19 permissions                                  │
│ - product.deleteMultiple                                   │
│ + category.create                                          │
│ = 19 total (custom set for this user)                     │
└────────────────────────────────────────────────────────────┘
```

---

## API Request Flow Example

```
1. CLIENT
   │
   │ POST /api/product/create
   │ Authorization: Bearer eyJhbGc...
   │ { name: "New Product", price: 100 }
   │
   ▼
2. EXPRESS SERVER
   │
   │ Route: productRouter.post('/create', 
   │          checkPermission({ resource: 'product', action: 'create' }),
   │          createProduct
   │        )
   │
   ▼
3. checkPermission MIDDLEWARE
   │
   ├─ Verify JWT → Extract userId
   ├─ Fetch User from DB
   ├─ Check: user.role === 'RETAILER'
   ├─ Fetch RolePermission for RETAILER
   ├─ Fetch UserPermission for this user
   ├─ Merge permissions
   └─ Check: Does merged set include 'product.create'?
      │
      ├─ YES → req.user = user; next()
      │
      └─ NO → return 403
   │
   ▼
4. createProduct CONTROLLER
   │
   ├─ Create product
   ├─ Set createdBy = req.userId (from middleware)
   ├─ Save to database
   └─ Return success response
   │
   ▼
5. CLIENT RECEIVES
   │
   └─ 200 OK { message: "Product created", product: {...} }
```

---

## Summary

This RBAC system provides:

✅ **Flexibility** - Permissions can be modified without code changes  
✅ **Granularity** - Control access at resource + action level  
✅ **Scalability** - Easy to add new roles and permissions  
✅ **Security** - Token-based auth + ownership verification  
✅ **Auditability** - Track who granted permissions  
✅ **User Experience** - Role-based dashboard filtering  

---

**End of Architecture Documentation**
