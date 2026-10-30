import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || 'SGroup_Default_Secret_2026_!@#';

/**
 * Middleware xác thực người dùng bằng JWT Token
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Truy cập bị từ chối: Vui lòng đăng nhập (Thiếu Authorization header)!',
      });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Định dạng token không hợp lệ (Yêu cầu: Bearer <token>)!',
      });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Gắn thông tin người dùng đã giải mã vào req.user
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token xác thực không hợp lệ!',
    });
  }
};

export const requireAuth = verifyToken;
