import PermissionModel from "../models/permission.model.js";
import RolePermissionModel from "../models/rolePermission.model.js";
import UserPermissionModel from "../models/userPermission.model.js";
import UserModel from "../models/user.model.js";

/**
 * Get all permissions
 */
export async function getAllPermissions(req, res) {
  try {
    const permissions = await PermissionModel.find().sort({ resource: 1, action: 1 });

    return res.status(200).json({
      message: "Permissions retrieved successfully",
      success: true,
      data: permissions,
    });
  } catch (error) {
    console.error("Get all permissions error:", error);
    return res.status(500).json({
      message: "Error retrieving permissions",
      success: false,
      error: error.message,
    });
  }
}

/**
 * Create a new permission (Super Admin only)
 */
export async function createPermission(req, res) {
  try {
    const { name, description, resource, action, apiPath, method, allowedRoles } = req.body;

    // Validation
    if (!name || !resource || !action || !apiPath || !method) {
      return res.status(400).json({
        message: "Name, resource, action, apiPath, and method are required",
        success: false,
      });
    }

    // Check if permission already exists
    const existingPermission = await PermissionModel.findOne({ name });
    if (existingPermission) {
      return res.status(400).json({
        message: "Permission with this name already exists",
        success: false,
      });
    }

    const permission = new PermissionModel({
      name,
      description,
      resource,
      action,
      apiPath,
      method,
      allowedRoles: allowedRoles || ["SUPER_ADMIN"],
    });

    await permission.save();

    // Invalidate permission cache after creation
    await delCache('permissions:all*');
    return res.status(201).json({
      message: "Permission created successfully",
      success: true,
      data: permission,
    });
  } catch (error) {
    console.error("Create permission error:", error);
    return res.status(500).json({
      message: "Error creating permission",
      success: false,
      error: error.message,
    });
  }
}

/**
 * Update a permission (Super Admin only)
 */
export async function updatePermission(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const permission = await PermissionModel.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!permission) {
      return res.status(404).json({
        message: "Permission not found",
        success: false,
      });
    }

    // Invalidate permission cache after update
    await delCache('permissions:all*');
    return res.status(200).json({
      message: "Permission updated successfully",
      success: true,
      data: permission,
    });
  } catch (error) {
    console.error("Update permission error:", error);
    return res.status(500).json({
      message: "Error updating permission",
      success: false,
      error: error.message,
    });
  }
}

/**
 * Delete a permission (Super Admin only)
 */
export async function deletePermission(req, res) {
  try {
    const { id } = req.params;

    const permission = await PermissionModel.findByIdAndDelete(id);

    if (!permission) {
      return res.status(404).json({
        message: "Permission not found",
        success: false,
      });
    }

    // Remove this permission from all role permissions
    await RolePermissionModel.updateMany(
      {},
      { $pull: { permissions: id } }
    );

    // Remove from user permissions
    await UserPermissionModel.updateMany(
      {},
      {
        $pull: {
          grantedPermissions: id,
          revokedPermissions: id,
        },
      }
    );

    // Invalidate permission cache after deletion
    await delCache('permissions:all*');
    return res.status(200).json({
      message: "Permission deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Delete permission error:", error);
    return res.status(500).json({
      message: "Error deleting permission",
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get permissions for a specific role
 */
export async function getRolePermissions(req, res) {
  try {
    const { role } = req.params;

    const rolePermissions = await RolePermissionModel.findOne({ role })
      .populate('permissions');

    if (!rolePermissions) {
      return res.status(404).json({
        message: "Role permissions not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Role permissions retrieved successfully",
      success: true,
      data: rolePermissions,
    });
  } catch (error) {
    console.error("Get role permissions error:", error);
    return res.status(500).json({
      message: "Error retrieving role permissions",
      success: false,
      error: error.message,
    });
  }
}

/**
 * Assign permissions to a role (Super Admin only)
 */
export async function assignPermissionsToRole(req, res) {
  try {
    const { role, permissionIds } = req.body;

    if (!role || !permissionIds || !Array.isArray(permissionIds)) {
      return res.status(400).json({
        message: "Role and permissionIds array are required",
        success: false,
      });
    }

    // Verify all permission IDs exist
    const permissions = await PermissionModel.find({ _id: { $in: permissionIds } });
    if (permissions.length !== permissionIds.length) {
      return res.status(400).json({
        message: "Some permission IDs are invalid",
        success: false,
      });
    }

    // Update or create role permissions
    let rolePermissions = await RolePermissionModel.findOne({ role });

    if (rolePermissions) {
      // Add new permissions (avoid duplicates)
      const existingIds = rolePermissions.permissions.map(p => p.toString());
      const newPermissions = permissionIds.filter(id => !existingIds.includes(id));
      rolePermissions.permissions.push(...newPermissions);
      await rolePermissions.save();
    } else {
      rolePermissions = new RolePermissionModel({
        role,
        permissions: permissionIds,
      });
      await rolePermissions.save();
    }

    await rolePermissions.populate('permissions');

    return res.status(200).json({
      message: "Permissions assigned to role successfully",
      success: true,
      data: rolePermissions,
    });
  } catch (error) {
    console.error("Assign permissions to role error:", error);
    return res.status(500).json({
      message: "Error assigning permissions to role",
      success: false,
      error: error.message,
    });
  }
}

/**
 * Revoke permissions from a role (Super Admin only)
 */
export async function revokePermissionsFromRole(req, res) {
  try {
    const { role, permissionIds } = req.body;

    if (!role || !permissionIds || !Array.isArray(permissionIds)) {
      return res.status(400).json({
        message: "Role and permissionIds array are required",
        success: false,
      });
    }

    const rolePermissions = await RolePermissionModel.findOne({ role });

    if (!rolePermissions) {
      return res.status(404).json({
        message: "Role permissions not found",
        success: false,
      });
    }

    // Remove specified permissions
    rolePermissions.permissions = rolePermissions.permissions.filter(
      p => !permissionIds.includes(p.toString())
    );

    await rolePermissions.save();
    await rolePermissions.populate('permissions');

    return res.status(200).json({
      message: "Permissions revoked from role successfully",
      success: true,
      data: rolePermissions,
    });
  } catch (error) {
    console.error("Revoke permissions from role error:", error);
    return res.status(500).json({
      message: "Error revoking permissions from role",
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get permissions for a specific user
 */
export async function getUserPermissions(req, res) {
  try {
    const { userId } = req.params;

    // Get user's role permissions
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    const rolePermissions = await RolePermissionModel.findOne({ role: user.role })
      .populate('permissions');

    // Get user-specific permission overrides
    const userPermissions = await UserPermissionModel.findOne({ userId })
      .populate('grantedPermissions revokedPermissions grantedBy');

    return res.status(200).json({
      message: "User permissions retrieved successfully",
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        rolePermissions: rolePermissions?.permissions || [],
        userOverrides: {
          granted: userPermissions?.grantedPermissions || [],
          revoked: userPermissions?.revokedPermissions || [],
          grantedBy: userPermissions?.grantedBy || null,
        },
      },
    });
  } catch (error) {
    console.error("Get user permissions error:", error);
    return res.status(500).json({
      message: "Error retrieving user permissions",
      success: false,
      error: error.message,
    });
  }
}

/**
 * Grant specific permissions to a user (Super Admin only)
 */
export async function grantPermissionsToUser(req, res) {
  try {
    const { userId, permissionIds } = req.body;

    if (!userId || !permissionIds || !Array.isArray(permissionIds)) {
      return res.status(400).json({
        message: "userId and permissionIds array are required",
        success: false,
      });
    }

    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Verify all permission IDs exist
    const permissions = await PermissionModel.find({ _id: { $in: permissionIds } });
    if (permissions.length !== permissionIds.length) {
      return res.status(400).json({
        message: "Some permission IDs are invalid",
        success: false,
      });
    }

    // Update or create user permissions
    let userPermissions = await UserPermissionModel.findOne({ userId });

    if (userPermissions) {
      // Add new granted permissions (avoid duplicates)
      const existingIds = userPermissions.grantedPermissions.map(p => p.toString());
      const newPermissions = permissionIds.filter(id => !existingIds.includes(id));
      userPermissions.grantedPermissions.push(...newPermissions);
      
      // Remove from revoked if previously revoked
      userPermissions.revokedPermissions = userPermissions.revokedPermissions.filter(
        p => !permissionIds.includes(p.toString())
      );

      userPermissions.grantedBy = req.userId;
      await userPermissions.save();
    } else {
      userPermissions = new UserPermissionModel({
        userId,
        grantedPermissions: permissionIds,
        revokedPermissions: [],
        grantedBy: req.userId,
      });
      await userPermissions.save();
    }

    await userPermissions.populate('grantedPermissions revokedPermissions grantedBy');

    return res.status(200).json({
      message: "Permissions granted to user successfully",
      success: true,
      data: userPermissions,
    });
  } catch (error) {
    console.error("Grant permissions to user error:", error);
    return res.status(500).json({
      message: "Error granting permissions to user",
      success: false,
      error: error.message,
    });
  }
}

/**
 * Revoke specific permissions from a user (Super Admin only)
 */
export async function revokePermissionsFromUser(req, res) {
  try {
    const { userId, permissionIds } = req.body;

    if (!userId || !permissionIds || !Array.isArray(permissionIds)) {
      return res.status(400).json({
        message: "userId and permissionIds array are required",
        success: false,
      });
    }

    // Verify user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Update or create user permissions
    let userPermissions = await UserPermissionModel.findOne({ userId });

    if (userPermissions) {
      // Remove from granted permissions
      userPermissions.grantedPermissions = userPermissions.grantedPermissions.filter(
        p => !permissionIds.includes(p.toString())
      );

      // Add to revoked permissions (avoid duplicates)
      const existingRevokedIds = userPermissions.revokedPermissions.map(p => p.toString());
      const newRevoked = permissionIds.filter(id => !existingRevokedIds.includes(id));
      userPermissions.revokedPermissions.push(...newRevoked);

      await userPermissions.save();
    } else {
      userPermissions = new UserPermissionModel({
        userId,
        grantedPermissions: [],
        revokedPermissions: permissionIds,
        grantedBy: req.userId,
      });
      await userPermissions.save();
    }

    await userPermissions.populate('grantedPermissions revokedPermissions grantedBy');

    return res.status(200).json({
      message: "Permissions revoked from user successfully",
      success: true,
      data: userPermissions,
    });
  } catch (error) {
    console.error("Revoke permissions from user error:", error);
    return res.status(500).json({
      message: "Error revoking permissions from user",
      success: false,
      error: error.message,
    });
  }
}

/**
 * Check if user has access to a specific endpoint
 */
export async function checkUserAccess(req, res) {
  try {
    const { userId, resource, action } = req.body;

    if (!userId || !resource || !action) {
      return res.status(400).json({
        message: "userId, resource, and action are required",
        success: false,
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Super admin has all access
    if (user.role === "SUPER_ADMIN") {
      return res.status(200).json({
        message: "User has access",
        success: true,
        hasAccess: true,
      });
    }

    // Get role permissions
    const rolePermissions = await RolePermissionModel.findOne({ role: user.role })
      .populate('permissions');

    // Get user-specific permissions
    const userPermissions = await UserPermissionModel.findOne({ userId })
      .populate('grantedPermissions revokedPermissions');

    let allowedPermissions = [];

    if (rolePermissions && rolePermissions.permissions) {
      allowedPermissions = rolePermissions.permissions.filter(p => p.isActive);
    }

    if (userPermissions && userPermissions.grantedPermissions) {
      allowedPermissions = [...allowedPermissions, ...userPermissions.grantedPermissions];
    }

    if (userPermissions && userPermissions.revokedPermissions) {
      const revokedIds = userPermissions.revokedPermissions.map(p => p._id.toString());
      allowedPermissions = allowedPermissions.filter(
        p => !revokedIds.includes(p._id.toString())
      );
    }

    const hasAccess = allowedPermissions.some(permission => {
      const resourceMatch = permission.resource === resource || permission.resource === '*';
      const actionMatch = permission.action === action || permission.action === 'manage';
      const roleAllowed = permission.allowedRoles.includes(user.role);
      return resourceMatch && actionMatch && roleAllowed && permission.isActive;
    });

    return res.status(200).json({
      message: hasAccess ? "User has access" : "User does not have access",
      success: true,
      hasAccess,
      resource,
      action,
    });
  } catch (error) {
    console.error("Check user access error:", error);
    return res.status(500).json({
      message: "Error checking user access",
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get all roles with their permissions
 */
export async function getAllRoles(req, res) {
  try {
    const roles = await RolePermissionModel.find().populate('permissions');

    return res.status(200).json({
      message: "Roles retrieved successfully",
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error("Get all roles error:", error);
    return res.status(500).json({
      message: "Error retrieving roles",
      success: false,
      error: error.message,
    });
  }
}
