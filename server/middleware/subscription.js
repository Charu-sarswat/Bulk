const Restaurant = require('../models/Restaurant');

/**
 * Restaurant Status Middleware
 *
 * This middleware is NOT a SaaS subscription gate.
 * It simply ensures that the restaurant associated with this request is:
 *   1. Not suspended by the Super Admin
 *   2. Still active (isActive flag)
 *
 * The Super Admin controls restaurant access via PATCH /api/superadmin/restaurants/:id/status.
 * SaaS billing/subscription plans (SubscriptionPlan, Subscription models) are a Super Admin
 * concern only and must never block Mess Admins or Customers from operating.
 */
module.exports = async function (req, res, next) {
  // Super Admin is always allowed through
  if (req.user && req.user.role === 'super_admin') {
    return next();
  }

  const restaurantId = req.restaurantId;

  // If no restaurant context, pass through (public routes, customer auth, etc.)
  if (!restaurantId) {
    return next();
  }

  try {
    const restaurant = await Restaurant.findById(restaurantId).lean();

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found.' });
    }

    if (restaurant.status === 'suspended' || !restaurant.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This restaurant has been suspended by the platform administrator.',
        code: 'RESTAURANT_SUSPENDED'
      });
    }

    // Restaurant is active — allow the request through
    next();
  } catch (err) {
    console.error('Restaurant status middleware error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
};
