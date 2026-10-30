import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/authorization.middleware.js';
import { uploadSingleImage } from '../middlewares/upload.middleware.js';

const router = express.Router();

// 1. Xem thông tin cá nhân (User/Admin đã đăng nhập)
router.get('/profile', verifyToken, userController.getProfile);

// 2. Cập nhật thông tin cá nhân (Họ tên, SĐT)
router.put('/profile', verifyToken, userController.updateProfile);

// 3. Upload avatar qua Cloudinary Pipeline
router.post('/profile/avatar', verifyToken, uploadSingleImage('avatar'), userController.updateAvatar);
router.patch('/profile/avatar', verifyToken, uploadSingleImage('avatar'), userController.updateAvatar);

// 4. Lấy danh sách toàn bộ người dùng (Admin)
router.get('/', verifyToken, requireAdmin, userController.getAllUsers);

export default router;
