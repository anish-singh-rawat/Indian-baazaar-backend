import { Router } from 'express';
import {
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  getRolePermissions,
  assignPermissionsToRole,
  revokePermissionsFromRole,
  getUserPermissions,
  grantPermissionsToUser,
  revokePermissionsFromUser,
  checkUserAccess,
  getAllRoles,
} from '../controllers/permission.controller.js';
import { checkPermission } from '../middlewares/checkPermission.js';

const permissionRouter = Router();

// Permission CRUD (Super Admin only)
permissionRouter.get('/permissions', checkPermission({ resource: 'permission', action: 'read' }), getAllPermissions);
permissionRouter.post('/permissions', checkPermission({ resource: 'permission', action: 'create' }), createPermission);
permissionRouter.put('/permissions/:id', checkPermission({ resource: 'permission', action: 'update' }), updatePermission);
permissionRouter.delete('/permissions/:id', checkPermission({ resource: 'permission', action: 'delete' }), deletePermission);

// Role-based permissions (Super Admin only)
permissionRouter.get('/roles', checkPermission({ resource: 'role', action: 'read' }), getAllRoles);
permissionRouter.get('/roles/:role/permissions', checkPermission({ resource: 'role', action: 'read' }), getRolePermissions);
permissionRouter.post('/roles/assign', checkPermission({ resource: 'role', action: 'update' }), assignPermissionsToRole);
permissionRouter.post('/roles/revoke', checkPermission({ resource: 'role', action: 'update' }), revokePermissionsFromRole);

// User-specific permissions (Super Admin only)
permissionRouter.get('/users/:userId/permissions', checkPermission({ resource: 'user', action: 'read' }), getUserPermissions);
permissionRouter.post('/users/grant', checkPermission({ resource: 'user', action: 'update' }), grantPermissionsToUser);
permissionRouter.post('/users/revoke', checkPermission({ resource: 'user', action: 'update' }), revokePermissionsFromUser);

// Check access (Admin and above)
permissionRouter.post('/check-access', checkPermission({ resource: 'permission', action: 'read' }), checkUserAccess);

export default permissionRouter;
