import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import PermissionModel from "../models/permission.model.js";
import RolePermissionModel from "../models/rolePermission.model.js";
import UserPermissionModel from "../models/userPermission.model.js";
import dotenv from 'dotenv';
dotenv.config();

/**
 * Dynamic Permission Middleware
 * Validates user authentication and checks if user has permission to access the requested resource
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.resource - Resource name (e.g., 'product', 'category')
 * @param {string} options.action - Action type (e.g., 'create', 'read', 'update', 'delete')
 * @param {boolean} options.checkOwnership - Whether to check if user owns the resource (for retailers)
 */
export const checkPermission = (options = {}) => {
  const { resource, action, checkOwnership = false } = options;

  return async (req, res, next) => {
    try {
      // 1. Extract and verify token
      let token = req.headers?.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          message: "Access token is required in Authorization header",
          success: false,
        });
      }

      const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);

      if (!decoded?.id) {
        return res.status(401).json({
          message: "Invalid token",
          success: false,
        });
      }

      // 2. Fetch user
      const user = await UserModel.findById(decoded.id);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
          success: false,
        });
      }

      if (user.status !== "Active") {
        return res.status(403).json({
          message: "Account is inactive or suspended",
          success: false,
        });
      }

      // Attach user info to request
      req.userId = user._id;
      req.user = user;
      req.userRole = user.role;

      // 3. SUPER_ADMIN has full access to everything
      if (user.role === "SUPER_ADMIN") {
        return next();
      }

      // 4. If no resource/action specified, just authenticate (basic auth check)
      if (!resource || !action) {
        return next();
      }

      // 5. Check permissions for ADMIN, RETAILER, USER
      const hasPermission = await checkUserPermission(user, resource, action, req);

      if (!hasPermission) {
        return res.status(403).json({
          message: `Permission denied: You don't have '${action}' access to '${resource}'`,
          success: false,
          requiredPermission: { resource, action }
        });
      }

      // 6. For retailers with checkOwnership enabled, verify resource ownership
      if (checkOwnership && user.role === "RETAILER") {
        // Ownership check will be done in the controller (since we need to fetch the resource)
        // We just flag it here
        req.checkOwnership = true;
      }

      next();
    } catch (error) {
      console.error("Permission Check Error:", error);
      return res.status(401).json({
        message: "Invalid or expired token",
        success: false,
        error: error.message,
      });
    }
  };
};

/**
 * Check if user has permission for a specific resource and action
 */
async function checkUserPermission(user, resource, action, req) {
  try {
    const userRole = user.role;
    const method = req.method;
    let path = req.route?.path || req.path;

    // Normalize path: replace route params with generic :id pattern
    path = path.replace(/\/[0-9a-fA-F]{24}/g, '/:id');

    // 1. Get role-based permissions
    const rolePermissions = await RolePermissionModel.findOne({ role: userRole })
      .populate('permissions');

    // 2. Get user-specific permissions (overrides)
    const userPermissions = await UserPermissionModel.findOne({ userId: user._id })
      .populate('grantedPermissions revokedPermissions');

    // 3. Build the final permission set
    let allowedPermissions = [];

    // Start with role permissions
    if (rolePermissions && rolePermissions.permissions) {
      allowedPermissions = rolePermissions.permissions.filter(p => p.isActive);
    }

    // Add user-granted permissions
    if (userPermissions && userPermissions.grantedPermissions) {
      allowedPermissions = [...allowedPermissions, ...userPermissions.grantedPermissions];
    }

    // Remove user-revoked permissions
    if (userPermissions && userPermissions.revokedPermissions) {
      const revokedIds = userPermissions.revokedPermissions.map(p => p._id.toString());
      allowedPermissions = allowedPermissions.filter(
        p => !revokedIds.includes(p._id.toString())
      );
    }

    // 4. Check if any permission matches the required resource and action
    const hasPermission = allowedPermissions.some(permission => {
      // Check resource match
      const resourceMatch = permission.resource === resource || permission.resource === '*';
      
      // Check action match (manage = all actions)
      const actionMatch = permission.action === action || permission.action === 'manage';
      
      // Check if role is in allowedRoles
      const roleAllowed = permission.allowedRoles.includes(userRole);

      // Optional: Check API path and method match for stricter control
      let pathMatch = true;
      if (permission.apiPath && permission.method) {
        const normalizedPermPath = permission.apiPath.replace(/\/:[^/]+/g, '/:id');
        pathMatch = normalizedPermPath === path || permission.apiPath === '*';
        const methodMatch = permission.method === method;
        pathMatch = pathMatch && methodMatch;
      }

      return resourceMatch && actionMatch && roleAllowed && pathMatch && permission.isActive;
    });

    return hasPermission;
  } catch (error) {
    console.error("Error checking user permission:", error);
    return false;
  }
}

/**
 * Middleware to check resource ownership (for retailers)
 * Use this after checkPermission middleware
 */
export const checkOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      // Only apply to retailers
      if (req.userRole !== "RETAILER") {
        return next();
      }

      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({
          message: "Resource ID is required",
          success: false,
        });
      }

      // Fetch the resource
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          message: "Resource not found",
          success: false,
        });
      }

      // Check if user owns this resource
      if (resource.createdBy && resource.createdBy.toString() !== req.userId.toString()) {
        return res.status(403).json({
          message: "Permission denied: You can only modify your own resources",
          success: false,
        });
      }

      // Attach resource to request for use in controller
      req.resource = resource;
      next();
    } catch (error) {
      console.error("Ownership check error:", error);
      return res.status(500).json({
        message: "Error checking resource ownership",
        success: false,
        error: error.message,
      });
    }
  };
};

/**
 * Simple authentication middleware (no permission check)
 * Use this for routes that just need user authentication
 */
export const authenticate = checkPermission();

export default checkPermission;
