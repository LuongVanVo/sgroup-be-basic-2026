import pool from '../configs/db.config.js';
import { ProductEntity } from '../entities/product.entity.js';

/**
 * Lấy danh sách sản phẩm có phân trang, tìm kiếm và lọc theo danh mục
 */
export const findProducts = async ({
  search = null,
  categoryId = null,
  isActive = true,
  limit = 20,
  offset = 0,
} = {}) => {
  let sql = `
    SELECT 
      p.id,
      p.name,
      p.description,
      p.price,
      p.stock,
      p.is_active,
      p.image_url,
      p.category_id,
      p.created_at,
      p.updated_at,
      c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (isActive !== null && isActive !== undefined) {
    sql += ' AND p.is_active = ?';
    params.push(isActive ? 1 : 0);
  }

  if (categoryId) {
    sql += ' AND p.category_id = ?';
    params.push(Number(categoryId));
  }

  if (search && search.trim() !== '') {
    sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern);
  }

  sql += ' ORDER BY p.id DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const [rows] = await pool.query(sql, params);
  return rows.map((row) => ProductEntity.fromDatabaseRow(row));
};

/**
 * Đếm tổng số sản phẩm thỏa mãn điều kiện lọc (dùng cho phân trang)
 */
export const countProducts = async ({ search = null, categoryId = null, isActive = true } = {}) => {
  let sql = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
  const params = [];

  if (isActive !== null && isActive !== undefined) {
    sql += ' AND is_active = ?';
    params.push(isActive ? 1 : 0);
  }
  if (categoryId) {
    sql += ' AND category_id = ?';
    params.push(Number(categoryId));
  }
  if (search && search.trim() !== '') {
    sql += ' AND (name LIKE ? OR description LIKE ?)';
    const searchPattern = `%${search.trim()}%`;
    params.push(searchPattern, searchPattern);
  }

  const [rows] = await pool.query(sql, params);
  return rows[0]?.total || 0;
};

/**
 * Lấy chi tiết sản phẩm theo ID
 */
export const findProductById = async (id) => {
  const [rows] = await pool.query(
    `
    SELECT 
      p.id,
      p.name,
      p.description,
      p.price,
      p.stock,
      p.is_active,
      p.image_url,
      p.category_id,
      p.created_at,
      p.updated_at,
      c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
    LIMIT 1
  `,
    [id]
  );

  if (!rows || rows.length === 0) return null;
  return ProductEntity.fromDatabaseRow(rows[0]);
};

/**
 * Khóa dòng sản phẩm để kiểm tra tồn kho trong Transaction (Pessimistic Locking)
 */
export const findProductByIdForUpdate = async (connection, id) => {
  const [rows] = await connection.query(
    'SELECT id, name, price, stock, is_active FROM products WHERE id = ? FOR UPDATE',
    [id]
  );
  if (!rows || rows.length === 0) return null;
  return rows[0];
};

/**
 * Tạo sản phẩm mới
 */
export const createProduct = async ({
  name,
  description = null,
  price,
  stock,
  categoryId = null,
  imageUrl = null,
  isActive = 1,
}) => {
  const [result] = await pool.query(
    `INSERT INTO products (name, description, price, stock, category_id, image_url, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, description, price, stock, categoryId, imageUrl, isActive ? 1 : 0]
  );

  return await findProductById(result.insertId);
};

/**
 * Cập nhật thông tin sản phẩm
 */
export const updateProduct = async (id, data) => {
  const updates = [];
  const params = [];

  const allowedFields = {
    name: 'name',
    description: 'description',
    price: 'price',
    stock: 'stock',
    categoryId: 'category_id',
    imageUrl: 'image_url',
    isActive: 'is_active',
  };

  for (const [key, dbColumn] of Object.entries(allowedFields)) {
    if (data[key] !== undefined) {
      updates.push(`${dbColumn} = ?`);
      let val = data[key];
      if (key === 'isActive') val = val ? 1 : 0;
      params.push(val);
    }
  }

  if (updates.length === 0) return await findProductById(id);

  params.push(id);
  await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);
  return await findProductById(id);
};

/**
 * Cập nhật số lượng tồn kho của sản phẩm
 */
export const updateProductStock = async (id, stock) => {
  await pool.query('UPDATE products SET stock = ? WHERE id = ?', [Number(stock), id]);
  return await findProductById(id);
};

/**
 * Cập nhật hình ảnh sản phẩm
 */
export const updateProductImage = async (id, imageUrl) => {
  await pool.query('UPDATE products SET image_url = ? WHERE id = ?', [imageUrl, id]);
  return await findProductById(id);
};

/**
 * Xóa sản phẩm (Mặc định Soft Delete: chuyển is_active = 0)
 */
export const deleteProduct = async (id, hardDelete = false) => {
  if (hardDelete) {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return true;
  }
  await pool.query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
  return true;
};

/**
 * Giảm tồn kho sản phẩm trong Transaction
 */
export const decrementStock = async (connection, productId, quantity) => {
  await connection.query(
    'UPDATE products SET stock = stock - ? WHERE id = ?',
    [Number(quantity), Number(productId)]
  );
};

/**
 * Tăng lại tồn kho sản phẩm (dùng khi hủy đơn) trong Transaction
 */
export const incrementStock = async (connection, productId, quantity) => {
  await connection.query(
    'UPDATE products SET stock = stock + ? WHERE id = ?',
    [Number(quantity), Number(productId)]
  );
};
