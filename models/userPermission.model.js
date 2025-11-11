import mongoose from "mongoose";

// This model stores user-specific permission overrides
// Allows super_admin to grant/revoke specific permissions to individual users
const userPermissionSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "User ID is required"]
    },
    grantedPermissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
    }],
    revokedPermissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
    }],
    grantedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

// Index for fast user permission lookups
userPermissionSchema.index({ userId: 1 });

const UserPermissionModel = mongoose.model("UserPermission", userPermissionSchema);

export default UserPermissionModel;
