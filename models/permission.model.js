import mongoose from "mongoose";

const permissionSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Permission name is required"],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    resource: {
        type: String,
        required: [true, "Resource is required"],
        // e.g., 'product', 'category', 'user', 'order', 'banner', etc.
    },
    action: {
        type: String,
        required: [true, "Action is required"],
        enum: ['create', 'read', 'update', 'delete', 'upload', 'manage'],
        // manage = full CRUD access
    },
    apiPath: {
        type: String,
        required: [true, "API path is required"],
        // e.g., '/api/product/create', '/api/category/:id'
    },
    method: {
        type: String,
        required: [true, "HTTP method is required"],
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    allowedRoles: [{
        type: String,
        enum: ["SUPER_ADMIN", "ADMIN", "RETAILER", "USER"],
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Compound index for faster lookups
permissionSchema.index({ resource: 1, action: 1 });
permissionSchema.index({ apiPath: 1, method: 1 });

const PermissionModel = mongoose.model("Permission", permissionSchema);

export default PermissionModel;
