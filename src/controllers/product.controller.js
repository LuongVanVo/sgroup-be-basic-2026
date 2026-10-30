import * as productService from '../services/product.service.js';

export const getProducts = async (req, res, next) => {
  try {
    const { search, categoryId, page, limit, isActive } = req.query;
    // Khách vãng lai và User thông thường chỉ thấy sản phẩm đang hoạt động (isActive = true)
    const isAdmin = req.user && req.user.role === 'admin';
    const filterActive = isAdmin && isActive !== undefined ? isActive === 'true' : true;

    const result = await productService.getProducts({
      search,
      categoryId,
      isActive: filterActive,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
      fromCache: result.fromCache,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await productService.getProductById(id);

    return res.status(200).json({
      success: true,
      data: result.product,
      fromCache: result.fromCache,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const newProduct = await productService.createProduct(req.body);
    return res.status(201).json({
      success: true,
      message: 'Thêm sản phẩm mới thành công!',
      data: newProduct,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await productService.updateProduct(id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công!',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    const updated = await productService.updateProductStock(id, stock);
    return res.status(200).json({
      success: true,
      message: 'Cập nhật tồn kho thành công!',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await productService.uploadProductImage(id, req.file.buffer);
    return res.status(200).json({
      success: true,
      message: 'Upload hình ảnh sản phẩm thành công!',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hard } = req.query;
    await productService.deleteProduct(id, hard === 'true');
    return res.status(200).json({
      success: true,
      message: 'Xóa / Vô hiệu hóa sản phẩm thành công!',
    });
  } catch (error) {
    next(error);
  }
};
