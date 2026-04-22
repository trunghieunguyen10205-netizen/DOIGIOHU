const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập vào tài nguyên này' });
  }
  next();
};

const requireStaffOrAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập vào tài nguyên này' });
  }
  next();
};

module.exports = {
  requireAdmin,
  requireStaffOrAdmin
};
