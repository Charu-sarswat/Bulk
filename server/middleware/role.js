const fs = require('fs');
const path = require('path');

module.exports = function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const logPrefix = `[ROLECHECK] URL: ${req.originalUrl} | Allowed: [${allowedRoles.join(', ')}] | req.user: ${JSON.stringify(req.user)}`;
    
    if (!req.user) {
      try { fs.appendFileSync(path.join(__dirname, '../debug_log.txt'), `${logPrefix} -> 401: No user token attached\n`, 'utf8'); } catch (e) {}
      return res.status(401).json({ message: 'Unauthorized, no user token attached' });
    }

    // Super Admin platform owner bypass
    if (req.user.role === 'super_admin') {
      try { fs.appendFileSync(path.join(__dirname, '../debug_log.txt'), `${logPrefix} -> Super Admin bypass approved\n`, 'utf8'); } catch (e) {}
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      try { fs.appendFileSync(path.join(__dirname, '../debug_log.txt'), `${logPrefix} -> 403 Forbidden: role mismatch. User role: '${req.user.role}'\n`, 'utf8'); } catch (e) {}
      return res.status(403).json({ 
        message: `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Your role is '${req.user.role}'.` 
      });
    }

    try { fs.appendFileSync(path.join(__dirname, '../debug_log.txt'), `${logPrefix} -> Role approved\n`, 'utf8'); } catch (e) {}
    next();
  };
};
