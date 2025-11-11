import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PermissionModel from '../models/permission.model.js';
import RolePermissionModel from '../models/rolePermission.model.js';
import connectDB from '../config/connectDb.js';

dotenv.config();

/**
 * Initial permissions setup for the RBAC system
 * Run this script once to populate default permissions
 * 
 * Usage: node utils/seedPermissions.js
 */

const permissions = [
  // Product permissions
  { name: 'product.create', description: 'Create products', resource: 'product', action: 'create', apiPath: '/api/product/create', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER'] },
  { name: 'product.read', description: 'View products', resource: 'product', action: 'read', apiPath: '/api/product/*', method: 'GET', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER', 'USER'] },
  { name: 'product.update', description: 'Update products', resource: 'product', action: 'update', apiPath: '/api/product/updateProduct/:id', method: 'PUT', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER'] },
  { name: 'product.delete', description: 'Delete products', resource: 'product', action: 'delete', apiPath: '/api/product/:id', method: 'DELETE', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER'] },
  { name: 'product.upload', description: 'Upload product images', resource: 'product', action: 'upload', apiPath: '/api/product/uploadImages', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER'] },
  { name: 'product.uploadBanner', description: 'Upload product banner images', resource: 'product', action: 'upload', apiPath: '/api/product/uploadBannerImages', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER'] },
  { name: 'product.deleteMultiple', description: 'Delete multiple products', resource: 'product', action: 'delete', apiPath: '/api/product/deleteMultiple', method: 'DELETE', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  
  // Product RAMS permissions
  { name: 'productRAMS.create', description: 'Create product RAM options', resource: 'productRAMS', action: 'create', apiPath: '/api/product/productRAMS/create', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER'] },
  { name: 'productRAMS.update', description: 'Update product RAM options', resource: 'productRAMS', action: 'update', apiPath: '/api/product/productRAMS/:id', method: 'PUT', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER'] },
  { name: 'productRAMS.delete', description: 'Delete product RAM options', resource: 'productRAMS', action: 'delete', apiPath: '/api/product/productRAMS/:id', method: 'DELETE', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER'] },
  
  // Product Size permissions
  { name: 'productSize.create', description: 'Create product size options', resource: 'productSize', action: 'create', apiPath: '/api/product/productSize/create', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER'] },
  { name: 'productSize.update', description: 'Update product size options', resource: 'productSize', action: 'update', apiPath: '/api/product/productSize/:id', method: 'PUT', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER'] },
  { name: 'productSize.delete', description: 'Delete product size options', resource: 'productSize', action: 'delete', apiPath: '/api/product/productSize/:id', method: 'DELETE', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER'] },
  
  // Product Weight permissions
  { name: 'productWeight.create', description: 'Create product weight options', resource: 'productWeight', action: 'create', apiPath: '/api/product/productWeight/create', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER'] },
  { name: 'productWeight.update', description: 'Update product weight options', resource: 'productWeight', action: 'update', apiPath: '/api/product/productWeight/:id', method: 'PUT', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER'] },
  { name: 'productWeight.delete', description: 'Delete product weight options', resource: 'productWeight', action: 'delete', apiPath: '/api/product/productWeight/:id', method: 'DELETE', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER'] },

  // Category permissions
  { name: 'category.create', description: 'Create categories', resource: 'category', action: 'create', apiPath: '/api/category/create', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'category.read', description: 'View categories', resource: 'category', action: 'read', apiPath: '/api/category/*', method: 'GET', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER', 'USER'] },
  { name: 'category.update', description: 'Update categories', resource: 'category', action: 'update', apiPath: '/api/category/:id', method: 'PUT', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'category.delete', description: 'Delete categories', resource: 'category', action: 'delete', apiPath: '/api/category/:id', method: 'DELETE', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'category.upload', description: 'Upload category images', resource: 'category', action: 'upload', apiPath: '/api/category/uploadImages', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },

  // Banner V1 permissions
  { name: 'bannerV1.create', description: 'Create banners', resource: 'bannerV1', action: 'create', apiPath: '/api/bannerV1/add', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'bannerV1.read', description: 'View banners', resource: 'bannerV1', action: 'read', apiPath: '/api/bannerV1/*', method: 'GET', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER', 'USER'] },
  { name: 'bannerV1.update', description: 'Update banners', resource: 'bannerV1', action: 'update', apiPath: '/api/bannerV1/:id', method: 'PUT', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'bannerV1.delete', description: 'Delete banners', resource: 'bannerV1', action: 'delete', apiPath: '/api/bannerV1/:id', method: 'DELETE', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'bannerV1.upload', description: 'Upload banner images', resource: 'bannerV1', action: 'upload', apiPath: '/api/bannerV1/uploadImages', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },

  // Banner List2 permissions
  { name: 'bannerList2.create', description: 'Create banner list 2', resource: 'bannerList2', action: 'create', apiPath: '/api/bannerList2/add', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'bannerList2.read', description: 'View banner list 2', resource: 'bannerList2', action: 'read', apiPath: '/api/bannerList2/*', method: 'GET', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER', 'USER'] },
  { name: 'bannerList2.update', description: 'Update banner list 2', resource: 'bannerList2', action: 'update', apiPath: '/api/bannerList2/:id', method: 'PUT', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'bannerList2.delete', description: 'Delete banner list 2', resource: 'bannerList2', action: 'delete', apiPath: '/api/bannerList2/:id', method: 'DELETE', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'bannerList2.upload', description: 'Upload banner list 2 images', resource: 'bannerList2', action: 'upload', apiPath: '/api/bannerList2/uploadImages', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },

  // Blog permissions
  { name: 'blog.create', description: 'Create blogs', resource: 'blog', action: 'create', apiPath: '/api/blog/add', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'blog.read', description: 'View blogs', resource: 'blog', action: 'read', apiPath: '/api/blog/*', method: 'GET', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER', 'USER'] },
  { name: 'blog.update', description: 'Update blogs', resource: 'blog', action: 'update', apiPath: '/api/blog/:id', method: 'PUT', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'blog.delete', description: 'Delete blogs', resource: 'blog', action: 'delete', apiPath: '/api/blog/:id', method: 'DELETE', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'blog.upload', description: 'Upload blog images', resource: 'blog', action: 'upload', apiPath: '/api/blog/uploadImages', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },

  // Home Slides permissions
  { name: 'homeSlides.create', description: 'Create home slides', resource: 'homeSlides', action: 'create', apiPath: '/api/homeSlides/add', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'homeSlides.read', description: 'View home slides', resource: 'homeSlides', action: 'read', apiPath: '/api/homeSlides/*', method: 'GET', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER', 'USER'] },
  { name: 'homeSlides.update', description: 'Update home slides', resource: 'homeSlides', action: 'update', apiPath: '/api/homeSlides/:id', method: 'PUT', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'homeSlides.delete', description: 'Delete home slides', resource: 'homeSlides', action: 'delete', apiPath: '/api/homeSlides/:id', method: 'DELETE', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'homeSlides.upload', description: 'Upload home slide images', resource: 'homeSlides', action: 'upload', apiPath: '/api/homeSlides/uploadImages', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },

  // User permissions
  { name: 'user.read', description: 'View users', resource: 'user', action: 'read', apiPath: '/api/user/*', method: 'GET', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'user.update', description: 'Update users', resource: 'user', action: 'update', apiPath: '/api/user/:id', method: 'PUT', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'user.delete', description: 'Delete users', resource: 'user', action: 'delete', apiPath: '/api/user/deleteUser/:id', method: 'DELETE', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'user.deleteMultiple', description: 'Delete multiple users', resource: 'user', action: 'delete', apiPath: '/api/user/deleteMultiple', method: 'DELETE', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'user.avatar', description: 'Update user avatar', resource: 'user', action: 'update', apiPath: '/api/user/user-avatar', method: 'PUT', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },

  // Order permissions
  { name: 'order.create', description: 'Create orders', resource: 'order', action: 'create', apiPath: '/api/order/*', method: 'POST', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER', 'USER'] },
  { name: 'order.read', description: 'View orders', resource: 'order', action: 'read', apiPath: '/api/order/*', method: 'GET', allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'RETAILER', 'USER'] },
  { name: 'order.update', description: 'Update order status', resource: 'order', action: 'update', apiPath: '/api/order/order-status/:id', method: 'PUT', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'order.delete', description: 'Delete orders', resource: 'order', action: 'delete', apiPath: '/api/order/deleteOrder/:id', method: 'DELETE', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },

  // Permission management (Super Admin only)
  { name: 'permission.create', description: 'Create permissions', resource: 'permission', action: 'create', apiPath: '/api/permission/permissions', method: 'POST', allowedRoles: ['SUPER_ADMIN'] },
  { name: 'permission.read', description: 'View permissions', resource: 'permission', action: 'read', apiPath: '/api/permission/permissions', method: 'GET', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'permission.update', description: 'Update permissions', resource: 'permission', action: 'update', apiPath: '/api/permission/permissions/:id', method: 'PUT', allowedRoles: ['SUPER_ADMIN'] },
  { name: 'permission.delete', description: 'Delete permissions', resource: 'permission', action: 'delete', apiPath: '/api/permission/permissions/:id', method: 'DELETE', allowedRoles: ['SUPER_ADMIN'] },

  // Role management (Super Admin only)
  { name: 'role.read', description: 'View roles', resource: 'role', action: 'read', apiPath: '/api/permission/roles/*', method: 'GET', allowedRoles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'role.update', description: 'Update role permissions', resource: 'role', action: 'update', apiPath: '/api/permission/roles/*', method: 'POST', allowedRoles: ['SUPER_ADMIN'] },
];

async function seedPermissions() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing permissions
    console.log('Clearing existing permissions...');
    await PermissionModel.deleteMany({});
    await RolePermissionModel.deleteMany({});

    // Insert permissions
    console.log('Inserting permissions...');
    const createdPermissions = await PermissionModel.insertMany(permissions);
    console.log(`✓ Created ${createdPermissions.length} permissions`);

    // Create role-permission mappings
    console.log('Creating role-permission mappings...');

    // SUPER_ADMIN - all permissions
    const superAdminPermissions = createdPermissions.map(p => p._id);
    await RolePermissionModel.create({
      role: 'SUPER_ADMIN',
      permissions: superAdminPermissions,
      description: 'Super Admin has full access to all resources'
    });
    console.log(`✓ Assigned ${superAdminPermissions.length} permissions to SUPER_ADMIN`);

    // ADMIN - all except permission/role management
    const adminPermissions = createdPermissions
      .filter(p => !['permission.create', 'permission.update', 'permission.delete', 'role.update'].includes(p.name))
      .map(p => p._id);
    await RolePermissionModel.create({
      role: 'ADMIN',
      permissions: adminPermissions,
      description: 'Admin has access to most resources except permission management'
    });
    console.log(`✓ Assigned ${adminPermissions.length} permissions to ADMIN`);

    // RETAILER - only product-related permissions
    const retailerPermissions = createdPermissions
      .filter(p => 
        p.resource === 'product' || 
        p.resource === 'productRAMS' || 
        p.resource === 'productSize' || 
        p.resource === 'productWeight' ||
        (p.resource === 'category' && p.action === 'read') ||
        (p.resource === 'order' && (p.action === 'create' || p.action === 'read'))
      )
      .map(p => p._id);
    await RolePermissionModel.create({
      role: 'RETAILER',
      permissions: retailerPermissions,
      description: 'Retailer can manage products and view categories/orders'
    });
    console.log(`✓ Assigned ${retailerPermissions.length} permissions to RETAILER`);

    // USER - read-only access
    const userPermissions = createdPermissions
      .filter(p => 
        p.action === 'read' || 
        (p.resource === 'order' && p.action === 'create')
      )
      .map(p => p._id);
    await RolePermissionModel.create({
      role: 'USER',
      permissions: userPermissions,
      description: 'Regular users can view data and create orders'
    });
    console.log(`✓ Assigned ${userPermissions.length} permissions to USER`);

    console.log('\n✅ Permission seeding completed successfully!');
    console.log('\nRole Summary:');
    console.log(`- SUPER_ADMIN: ${superAdminPermissions.length} permissions (full access)`);
    console.log(`- ADMIN: ${adminPermissions.length} permissions`);
    console.log(`- RETAILER: ${retailerPermissions.length} permissions`);
    console.log(`- USER: ${userPermissions.length} permissions`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding permissions:', error);
    process.exit(1);
  }
}

seedPermissions();
