const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token, access denied' });
  }

  // Expecting format: Bearer <token>
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token format is invalid, must be Bearer <token>' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_development');
    req.user = decoded.user;

    if (req.user) {
      if (req.user.role === 'super_admin') {
        const requestedId = req.header('X-Restaurant-ID') || req.query.restaurantId || (req.body && req.body.restaurantId);
        if (requestedId) {
          req.restaurantId = requestedId.toString();
        }
      } else if (req.user.restaurantId) {
        // Enforce the restaurant admin/staff/kitchen's restaurantId strictly from their verified JWT token
        req.restaurantId = req.user.restaurantId.toString();
      }
    }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid or has expired' });
  }
};
