import mongoose from "mongoose";

// This model maps roles to their assigned permissions
const rolePermissionSchema = mongoose.Schema({
    role: {
        type: String,
        required: [true, "Role is required"],
        enum: ["SUPER_ADMIN", "ADMIN", "RETAILER", "USER"],
        unique: true
    },
    permissions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Permission'
    }],
    description: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const RolePermissionModel = mongoose.model("RolePermission", rolePermissionSchema);

export default RolePermissionModel;
