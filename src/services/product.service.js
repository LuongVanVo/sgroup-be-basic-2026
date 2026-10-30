import { ProductEntity } from '../entities/product.entity.js';
import * as productRepo from '../repositories/product.repository.js';
import * as cacheService from './cache.service.js';
import * as uploadService from './upload.service.js';

/**
 * Lấy danh sách sản phẩm (Áp dụng Cache-Aside qua Redis)
 */
export const getProducts = async ({
  search = null,
  categoryId = null,
  isActive = true,
  page = 1,
  limit = 20,
} = {}) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 20);
  const offset = (pageNum - 1) * limitNum;

  // 1. Tạo cache key tương ứng với bộ filter
  const cacheKey = `products:list:s=${search || ''}:c=${categoryId || ''}:act=${isActive}:p=${pageNum}:l=${limitNum}`;

  // 2. Thử lấy từ Redis
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) {
    return {
      ...cachedData,
      fromCache: true,
    };
  }

  // 3. Nếu miss cache -> Truy vấn MySQL
  const [products, total] = await Promise.all([
    productRepo.findProducts({
      search,
      categoryId,
      isActive,
      limit: limitNum,
      offset,
    }),
    productRepo.countProducts({ search, categoryId, isActive }),
  ]);

  const result = {
    products: products.map((p) => p.toResponseObject()),
    pagination: {
      currentPage: pageNum,
      pageSize: limitNum,
      totalItems: total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
    fromCache: false,
  };

  // 4. Ghi kết quả vào Redis (Cache 300 giây = 5 phút)
  await cacheService.set(cacheKey, {
    products: result.products,
    pagination: result.pagination,
  }, 300);

  return result;
};

/**
 * Lấy chi tiết sản phẩm theo ID (Áp dụng Cache-Aside qua Redis)
 */
export const getProductById = async (id) => {
  const numericId = parseInt(id);
  if (isNaN(numericId) || numericId <= 0) {
    const err = new Error('ID sản phẩm không hợp lệ!');
    err.statusCode = 400;
    throw err;
  }

  const cacheKey = `products:detail:${numericId}`;

  // 1. Kiểm tra cache Redis
  const cachedProduct = await cacheService.get(cacheKey);
  if (cachedProduct) {
    return {
      product: cachedProduct,
      fromCache: true,
    };
  }

  // 2. Truy vấn MySQL
  const product = await productRepo.findProductById(numericId);
  if (!product) {
    const err = new Error(`Không tìm thấy sản phẩm với ID: ${id}`);
    err.statusCode = 404;
    throw err;
  }

  const responseProduct = product.toResponseObject();

  // 3. Lưu cache 600 giây (10 phút)
  await cacheService.set(cacheKey, responseProduct, 600);

  return {
    product: responseProduct,
    fromCache: false,
  };
};

/**
 * Thêm sản phẩm mới (Admin) -> Xóa toàn bộ cache sản phẩm
 */
export const createProduct = async (data) => {
  ProductEntity.validateCreate(data);

  const newProduct = await productRepo.createProduct({
    name: data.name.trim(),
    description: data.description ? data.description.trim() : null,
    price: data.price,
    stock: data.stock,
    categoryId: data.categoryId || null,
    imageUrl: data.imageUrl || null,
    isActive: data.isActive !== undefined ? data.isActive : 1,
  });

  // Invalidate Redis Cache
  await cacheService.delByPattern('products:*');

  return newProduct.toResponseObject();
};

/**
 * Cập nhật thông tin sản phẩm (Admin) -> Xóa cache
 */
export const updateProduct = async (id, data) => {
  const numericId = parseInt(id);
  if (isNaN(numericId) || numericId <= 0) {
    const err = new Error('ID sản phẩm không hợp lệ!');
    err.statusCode = 400;
    throw err;
  }

  const existing = await productRepo.findProductById(numericId);
  if (!existing) {
    const err = new Error(`Không tìm thấy sản phẩm với ID: ${id}`);
    err.statusCode = 404;
    throw err;
  }

  ProductEntity.validateUpdate(data);

  const updatedProduct = await productRepo.updateProduct(numericId, data);

  // Invalidate Redis Cache
  await cacheService.delByPattern('products:*');

  return updatedProduct.toResponseObject();
};

/**
 * Cập nhật số lượng tồn kho (Admin) -> Xóa cache
 */
export const updateProductStock = async (id, stock) => {
  const numericId = parseInt(id);
  if (isNaN(numericId) || numericId <= 0) {
    const err = new Error('ID sản phẩm không hợp lệ!');
    err.statusCode = 400;
    throw err;
  }

  const stockNum = Number(stock);
  if (isNaN(stockNum) || !Number.isInteger(stockNum) || stockNum < 0) {
    const err = new Error('Số lượng tồn kho phải là số nguyên không âm (>= 0)!');
    err.statusCode = 400;
    throw err;
  }

  const existing = await productRepo.findProductById(numericId);
  if (!existing) {
    const err = new Error(`Không tìm thấy sản phẩm với ID: ${id}`);
    err.statusCode = 404;
    throw err;
  }

  const updatedProduct = await productRepo.updateProductStock(numericId, stockNum);

  // Invalidate Redis Cache
  await cacheService.delByPattern('products:*');

  return updatedProduct.toResponseObject();
};

/**
 * Upload ảnh sản phẩm qua Cloudinary (Admin) -> Xóa cache
 */
export const uploadProductImage = async (id, fileBuffer) => {
  const numericId = parseInt(id);
  if (isNaN(numericId) || numericId <= 0) {
    const err = new Error('ID sản phẩm không hợp lệ!');
    err.statusCode = 400;
    throw err;
  }

  const existing = await productRepo.findProductById(numericId);
  if (!existing) {
    const err = new Error(`Không tìm thấy sản phẩm với ID: ${id}`);
    err.statusCode = 404;
    throw err;
  }

  // 1. Upload Cloudinary
  const uploadResult = await uploadService.uploadImage(fileBuffer, 'ecommerce/products');
  const imageUrl = uploadResult.secure_url;

  // 2. Cập nhật MySQL
  const updatedProduct = await productRepo.updateProductImage(numericId, imageUrl);

  // Invalidate Redis Cache
  await cacheService.delByPattern('products:*');

  return {
    imageUrl,
    product: updatedProduct.toResponseObject(),
  };
};

/**
 * Xóa hoặc vô hiệu hóa sản phẩm (Admin) -> Xóa cache
 */
export const deleteProduct = async (id, hardDelete = false) => {
  const numericId = parseInt(id);
  if (isNaN(numericId) || numericId <= 0) {
    const err = new Error('ID sản phẩm không hợp lệ!');
    err.statusCode = 400;
    throw err;
  }

  const existing = await productRepo.findProductById(numericId);
  if (!existing) {
    const err = new Error(`Không tìm thấy sản phẩm với ID: ${id}`);
    err.statusCode = 404;
    throw err;
  }

  await productRepo.deleteProduct(numericId, hardDelete);

  // Invalidate Redis Cache
  await cacheService.delByPattern('products:*');

  return true;
};
