import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 1. Đăng ký tài khoản mới (Guest)
router.post('/register', authController.register);

// 2. Đăng nhập hệ thống (Guest)
router.post('/login', authController.login);

// 3. Lấy thông tin tài khoản đang đăng nhập
router.get('/me', verifyToken, authController.getMe);

export default router;
