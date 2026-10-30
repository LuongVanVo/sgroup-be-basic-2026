import express from 'express';
import * as productController from '../controllers/product.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/authorization.middleware.js';
import { uploadSingleImage } from '../middlewares/upload.middleware.js';

const router = express.Router();

// 1. Lấy danh sách sản phẩm (Công khai - Có cache Redis & phân trang)
router.get('/', productController.getProducts);

// 2. Lấy chi tiết sản phẩm theo ID (Công khai - Có cache Redis)
router.get('/:id', productController.getProductById);

// 3. Thêm sản phẩm mới (Admin)
router.post('/', verifyToken, requireAdmin, productController.createProduct);

// 4. Cập nhật thông tin sản phẩm (Admin)
router.put('/:id', verifyToken, requireAdmin, productController.updateProduct);

// 5. Cập nhật số lượng tồn kho (Admin)
router.patch('/:id/stock', verifyToken, requireAdmin, productController.updateStock);

// 6. Upload / Cập nhật hình ảnh sản phẩm qua Cloudinary (Admin)
router.post('/:id/image', verifyToken, requireAdmin, uploadSingleImage('image'), productController.uploadImage);

// 7. Xóa hoặc vô hiệu hóa sản phẩm (Admin)
router.delete('/:id', verifyToken, requireAdmin, productController.deleteProduct);

export default router;
