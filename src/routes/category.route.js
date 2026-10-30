import express from 'express';
import * as categoryController from '../controllers/category.controller.js';

const router = express.Router();

// Lấy danh sách toàn bộ danh mục sản phẩm (Công khai)
router.get('/', categoryController.getAllCategories);

export default router;
