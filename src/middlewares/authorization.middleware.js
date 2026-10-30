/**
 * Middleware phân quyền (Role-based Authorization)
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Truy cập bị từ chối: Vui lòng đăng nhập trước!',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Truy cập bị từ chối: Yêu cầu quyền [${allowedRoles.join(' hoặc ')}]! Vai trò hiện tại của bạn là: [${req.user.role}].`,
      });
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireUser = requireRole('user', 'admin');
