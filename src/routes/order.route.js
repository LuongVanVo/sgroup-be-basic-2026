import express from 'express';
import * as orderController from '../controllers/order.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/authorization.middleware.js';

const router = express.Router();

// ==========================================
// 1. ENDPOINTS DÀNH CHO USER (ĐÃ ĐĂNG NHẬP)
// ==========================================

// Tạo đơn hàng mới với Database Transaction (Kiểm tra tồn kho & snapshot giá)
router.post('/', verifyToken, orderController.createOrder);

// Xem danh sách đơn hàng của bản thân
router.get('/my-orders', verifyToken, orderController.getMyOrders);

// Xem chi tiết một đơn hàng của bản thân
router.get('/my-orders/:id', verifyToken, orderController.getMyOrderDetail);

// Người dùng hủy đơn hàng (Chỉ khi trạng thái PENDING)
router.patch('/my-orders/:id/cancel', verifyToken, orderController.cancelMyOrder);

// ==========================================
// 2. ENDPOINTS DÀNH CHO ADMIN
// ==========================================

// Admin xem danh sách toàn bộ đơn hàng trong hệ thống (lọc theo status)
router.get('/admin', verifyToken, requireAdmin, orderController.getAllOrdersForAdmin);

// Admin xem chi tiết bất kỳ đơn hàng nào
router.get('/admin/:id', verifyToken, requireAdmin, orderController.getOrderDetailForAdmin);

// Admin cập nhật trạng thái đơn hàng (PENDING -> SHIPPING -> DELIVERED hoặc PENDING -> CANCELLED)
router.patch('/admin/:id/status', verifyToken, requireAdmin, orderController.updateOrderStatusForAdmin);

export default router;
