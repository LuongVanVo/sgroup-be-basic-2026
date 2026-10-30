import pool from '../configs/db.config.js';
import { OrderEntity } from '../entities/order.entity.js';
import { OrderItemEntity } from '../entities/order-item.entity.js';

/**
 * Tạo bản ghi Order bên trong Database Transaction
 */
export const createOrderInTransaction = async (
  connection,
  { userId, totalAmount, shippingAddress, phone, note = null, status = 'PENDING' }
) => {
  const [result] = await connection.query(
    `INSERT INTO orders (user_id, total_amount, status, shipping_address, phone, note)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, totalAmount, status, shippingAddress, phone, note]
  );
  return result.insertId;
};

/**
 * Tạo bản ghi OrderItem bên trong Database Transaction
 */
export const createOrderItemInTransaction = async (
  connection,
  { orderId, productId, quantity, unitPrice }
) => {
  await connection.query(
    `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
     VALUES (?, ?, ?, ?)`,
    [orderId, productId, quantity, unitPrice]
  );
};

/**
 * Lấy danh sách item kèm tên và ảnh sản phẩm của một đơn hàng
 */
export const findOrderItems = async (orderId) => {
  const [rows] = await pool.query(
    `
    SELECT 
      oi.id,
      oi.order_id,
      oi.product_id,
      oi.quantity,
      oi.unit_price,
      p.name AS product_name,
      p.image_url AS product_image_url
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
    ORDER BY oi.id ASC
  `,
    [orderId]
  );
  return rows.map((row) => OrderItemEntity.fromDatabaseRow(row));
};

/**
 * Lấy danh sách item của một đơn hàng trong Transaction
 */
export const findOrderItemsInTransaction = async (connection, orderId) => {
  const [rows] = await connection.query(
    'SELECT id, order_id, product_id, quantity, unit_price FROM order_items WHERE order_id = ?',
    [orderId]
  );
  return rows;
};

/**
 * Lấy danh sách đơn hàng của một User (kèm phân trang)
 */
export const findOrdersByUserId = async (userId, { limit = 20, offset = 0 } = {}) => {
  const [rows] = await pool.query(
    `
    SELECT 
      o.id,
      o.user_id,
      o.total_amount,
      o.status,
      o.shipping_address,
      o.phone,
      o.note,
      o.created_at,
      o.updated_at,
      u.full_name AS customer_name,
      u.email AS customer_email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.user_id = ?
    ORDER BY o.id DESC
    LIMIT ? OFFSET ?
  `,
    [userId, Number(limit), Number(offset)]
  );

  return rows.map((row) => OrderEntity.fromDatabaseRow(row));
};

/**
 * Lấy chi tiết một đơn hàng theo orderId
 */
export const findOrderById = async (orderId) => {
  const [rows] = await pool.query(
    `
    SELECT 
      o.id,
      o.user_id,
      o.total_amount,
      o.status,
      o.shipping_address,
      o.phone,
      o.note,
      o.created_at,
      o.updated_at,
      u.full_name AS customer_name,
      u.email AS customer_email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
    LIMIT 1
  `,
    [orderId]
  );

  if (!rows || rows.length === 0) return null;
  const items = await findOrderItems(orderId);
  return OrderEntity.fromDatabaseRow(rows[0], items);
};

/**
 * Lấy chi tiết đơn hàng trong Transaction (dùng để kiểm tra trạng thái trước khi hủy)
 */
export const findOrderByIdForUpdate = async (connection, orderId) => {
  const [rows] = await connection.query(
    'SELECT * FROM orders WHERE id = ? FOR UPDATE',
    [orderId]
  );
  if (!rows || rows.length === 0) return null;
  return rows[0];
};

/**
 * Lấy toàn bộ danh sách đơn hàng cho Admin
 */
export const findAllOrders = async ({ status = null, limit = 50, offset = 0 } = {}) => {
  let sql = `
    SELECT 
      o.id,
      o.user_id,
      o.total_amount,
      o.status,
      o.shipping_address,
      o.phone,
      o.note,
      o.created_at,
      o.updated_at,
      u.full_name AS customer_name,
      u.email AS customer_email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    sql += ' AND o.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY o.id DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const [rows] = await pool.query(sql, params);
  return rows.map((row) => OrderEntity.fromDatabaseRow(row));
};

/**
 * Đếm tổng số đơn hàng theo trạng thái
 */
export const countOrders = async ({ status = null } = {}) => {
  let sql = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  const [rows] = await pool.query(sql, params);
  return rows[0]?.total || 0;
};

/**
 * Cập nhật trạng thái đơn hàng
 */
export const updateOrderStatus = async (orderId, status) => {
  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
  return await findOrderById(orderId);
};

/**
 * Cập nhật trạng thái đơn hàng trong Transaction
 */
export const updateOrderStatusInTransaction = async (connection, orderId, status) => {
  await connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId]);
};
