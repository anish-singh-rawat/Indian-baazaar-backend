/**
 * Helper functions for role-based filtering
 */

/**
 * Build MongoDB filter based on user role
 * @param {Object} user - User object with role and _id
 * @param {Object} baseFilter - Base filter to apply
 * @returns {Object} - Enhanced filter with role-based restrictions
 */
export function buildRoleBasedFilter(user, baseFilter = {}) {
  if (!user) {
    return baseFilter;
  }

  // SUPER_ADMIN and ADMIN can see everything
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
    return baseFilter;
  }

  // RETAILER can only see their own data
  if (user.role === 'RETAILER') {
    return {
      ...baseFilter,
      createdBy: user._id,
    };
  }

  // USER can see all data (for browsing products)
  return baseFilter;
}

/**
 * Check if user can modify a resource (ownership check)
 * @param {Object} user - User object with role and _id
 * @param {Object} resource - Resource object with createdBy field
 * @returns {boolean} - True if user can modify
 */
export function canModifyResource(user, resource) {
  if (!user || !resource) {
    return false;
  }

  // SUPER_ADMIN and ADMIN can modify anything
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
    return true;
  }

  // RETAILER can only modify their own resources
  if (user.role === 'RETAILER') {
    return resource.createdBy && resource.createdBy.toString() === user._id.toString();
  }

  return false;
}

/**
 * Filter array of resources based on user role
 * @param {Object} user - User object with role and _id
 * @param {Array} resources - Array of resources to filter
 * @returns {Array} - Filtered resources
 */
export function filterResourcesByRole(user, resources) {
  if (!user || !resources) {
    return resources;
  }

  // SUPER_ADMIN and ADMIN can see everything
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
    return resources;
  }

  // RETAILER can only see their own data
  if (user.role === 'RETAILER') {
    return resources.filter(resource => 
      resource.createdBy && resource.createdBy.toString() === user._id.toString()
    );
  }

  return resources;
}

export default {
  buildRoleBasedFilter,
  canModifyResource,
  filterResourcesByRole,
};
