const Restaurant = require('../models/Restaurant');
const fs = require('fs');
const path = require('path');

module.exports = async function(req, res, next) {
  const logMsg = `[TENANT] Method: ${req.method} | URL: ${req.originalUrl} | User: ${JSON.stringify(req.user)} | Header X-Restaurant-ID: ${req.header('X-Restaurant-ID')}\n`;
  try {
    fs.appendFileSync(path.join(__dirname, '../debug_log.txt'), logMsg, 'utf8');
  } catch (e) {}

  // If req.user is set (from auth middleware)
  if (req.user) {
    if (req.user.role === 'super_admin') {
      // Super Admin can specify restaurantId via header, query, or body
      const requestedId = req.header('X-Restaurant-ID') || req.query.restaurantId || req.body.restaurantId;
      if (requestedId) {
        req.restaurantId = requestedId;
      }
      return next();
    }
    
    // For admin/staff, restaurantId is always taken from their token
    if (req.user.restaurantId) {
      req.restaurantId = req.user.restaurantId.toString();
      return next();
    }
  }
  
  // For customers, public routes, or endpoints without auth, look for restaurantId in header, query, or body
  const publicId = req.header('X-Restaurant-ID') || req.query.restaurantId || req.body.restaurantId;
  if (publicId) {
    req.restaurantId = publicId;
  }
  
  next();
};
