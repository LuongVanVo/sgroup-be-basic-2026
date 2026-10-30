import pool from '../configs/db.config.js';
import { OrderEntity, ORDER_STATUS } from '../entities/order.entity.js';
import { OrderItemEntity } from '../entities/order-item.entity.js';
import * as orderRepo from '../repositories/order.repository.js';
import * as productRepo from '../repositories/product.repository.js';
import * as cacheService from './cache.service.js';

/**
 * 1. Tạo đơn hàng mới với Database Transaction (Bảo đảm tính toàn vẹn dữ liệu)
 */
export const createOrder = async (userId, { items, shippingAddress, phone, note }) => {
  // 1. Kiểm tra tính hợp lệ của dữ liệu đầu vào
  OrderEntity.validateCreateOrder({ items, shippingAddress, phone });
  items.forEach((item) => OrderItemEntity.validate(item));

  // 2. Bắt đầu phiên kết nối độc lập từ Connection Pool
  const conn = await pool.getConnection();

  try {
    // 3. Khởi tạo Database Transaction
    await conn.beginTransaction();

    let calculatedTotalAmount = 0;
    const validatedItems = [];

    // 4. Lặp qua từng sản phẩm để kiểm tra tồn kho và lấy giá thời điểm hiện tại (Snapshot Price)
    for (const item of items) {
      // Khóa dòng sản phẩm để tránh Race Condition (Nhiều người mua cùng lúc)
      const productRow = await productRepo.findProductByIdForUpdate(conn, item.productId);

      if (!productRow) {
        const err = new Error(`Sản phẩm với ID ${item.productId} không tồn tại trong hệ thống!`);
        err.statusCode = 404;
        throw err;
      }

      if (!productRow.is_active) {
        const err = new Error(`Sản phẩm [${productRow.name}] hiện đã ngừng kinh doanh!`);
        err.statusCode = 400;
        throw err;
      }

      if (productRow.stock < item.quantity) {
        const err = new Error(
          `Sản phẩm [${productRow.name}] không đủ tồn kho (Còn lại: ${productRow.stock}, Yêu cầu đặt: ${item.quantity})!`
        );
        err.statusCode = 400;
        throw err;
      }

      const unitPrice = Number(productRow.price);
      const subtotal = unitPrice * item.quantity;
      calculatedTotalAmount += subtotal;

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
      });

      // 5. Trừ số lượng tồn kho trong database
      await productRepo.decrementStock(conn, item.productId, item.quantity);
    }

    // 6. Tạo bản ghi đơn hàng chính (Order)
    const orderId = await orderRepo.createOrderInTransaction(conn, {
      userId,
      totalAmount: calculatedTotalAmount,
      shippingAddress: shippingAddress.trim(),
      phone: phone.trim(),
      note: note ? note.trim() : null,
      status: ORDER_STATUS.PENDING,
    });

    // 7. Tạo danh sách các mặt hàng chi tiết (Order Items)
    for (const vItem of validatedItems) {
      await orderRepo.createOrderItemInTransaction(conn, {
        orderId,
        productId: vItem.productId,
        quantity: vItem.quantity,
        unitPrice: vItem.unitPrice,
      });
    }

    // 8. Commit toàn bộ thay đổi vào Database
    await conn.commit();

    // 9. Xóa cache Redis của danh sách sản phẩm (vì tồn kho đã giảm)
    await cacheService.delByPattern('products:*');

    // 10. Trả về chi tiết đơn hàng vừa tạo thành công
    const createdOrder = await orderRepo.findOrderById(orderId);
    return createdOrder.toResponseObject();
  } catch (error) {
    // Nếu có bất kỳ lỗi nào xảy ra -> Rollback toàn bộ dữ liệu về trạng thái ban đầu
    await conn.rollback();
    throw error;
  } finally {
    // Luôn luôn giải phóng kết nối trả về cho Connection Pool
    conn.release();
  }
};

/**
 * 2. Lấy danh sách đơn hàng của người dùng đang đăng nhập
 */
export const getMyOrders = async (userId, { page = 1, limit = 20 } = {}) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 20);
  const offset = (pageNum - 1) * limitNum;

  const orders = await orderRepo.findOrdersByUserId(userId, { limit: limitNum, offset });
  return orders.map((o) => o.toResponseObject());
};

/**
 * 3. Xem chi tiết đơn hàng của bản thân
 */
export const getMyOrderDetail = async (userId, orderId) => {
  const numericOrderId = parseInt(orderId);
  if (isNaN(numericOrderId) || numericOrderId <= 0) {
    const err = new Error('Mã đơn hàng không hợp lệ!');
    err.statusCode = 400;
    throw err;
  }

  const order = await orderRepo.findOrderById(numericOrderId);
  if (!order) {
    const err = new Error(`Không tìm thấy đơn hàng với ID: ${orderId}`);
    err.statusCode = 404;
    throw err;
  }

  // Ràng buộc bảo mật: Người dùng chỉ được xem đơn hàng của chính mình!
  if (order.userId !== Number(userId)) {
    const err = new Error('Bạn không có quyền truy cập đơn hàng này!');
    err.statusCode = 403;
    throw err;
  }

  return order.toResponseObject();
};

/**
 * 4. Người dùng tự hủy đơn hàng (Chỉ được hủy khi trạng thái là PENDING)
 */
export const cancelMyOrder = async (userId, orderId) => {
  const numericOrderId = parseInt(orderId);
  if (isNaN(numericOrderId) || numericOrderId <= 0) {
    const err = new Error('Mã đơn hàng không hợp lệ!');
    err.statusCode = 400;
    throw err;
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Khóa dòng đơn hàng để kiểm tra
    const orderRow = await orderRepo.findOrderByIdForUpdate(conn, numericOrderId);
    if (!orderRow) {
      const err = new Error(`Không tìm thấy đơn hàng với ID: ${orderId}`);
      err.statusCode = 404;
      throw err;
    }

    if (orderRow.user_id !== Number(userId)) {
      const err = new Error('Bạn không có quyền hủy đơn hàng này!');
      err.statusCode = 403;
      throw err;
    }

    if (orderRow.status !== ORDER_STATUS.PENDING) {
      const err = new Error(
        `Không thể hủy đơn hàng! Chỉ đơn hàng ở trạng thái [PENDING] mới được phép hủy (Hiện tại: [${orderRow.status}]).`
      );
      err.statusCode = 400;
      throw err;
    }

    // Hoàn trả lại số lượng tồn kho cho các sản phẩm
    const items = await orderRepo.findOrderItemsInTransaction(conn, numericOrderId);
    for (const item of items) {
      await productRepo.incrementStock(conn, item.product_id, item.quantity);
    }

    // Cập nhật trạng thái thành CANCELLED
    await orderRepo.updateOrderStatusInTransaction(conn, numericOrderId, ORDER_STATUS.CANCELLED);

    await conn.commit();

    // Xóa cache Redis sản phẩm để cập nhật tồn kho mới
    await cacheService.delByPattern('products:*');

    const updatedOrder = await orderRepo.findOrderById(numericOrderId);
    return updatedOrder.toResponseObject();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

/**
 * 5. Lấy danh sách toàn bộ đơn hàng (Dành cho Admin)
 */
export const getAllOrdersForAdmin = async ({ status = null, page = 1, limit = 50 } = {}) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 50);
  const offset = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    orderRepo.findAllOrders({ status, limit: limitNum, offset }),
    orderRepo.countOrders({ status }),
  ]);

  return {
    orders: orders.map((o) => o.toResponseObject()),
    pagination: {
      currentPage: pageNum,
      pageSize: limitNum,
      totalItems: total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  };
};

/**
 * 6. Xem chi tiết bất kỳ đơn hàng nào (Dành cho Admin)
 */
export const getOrderDetailForAdmin = async (orderId) => {
  const numericOrderId = parseInt(orderId);
  if (isNaN(numericOrderId) || numericOrderId <= 0) {
    const err = new Error('Mã đơn hàng không hợp lệ!');
    err.statusCode = 400;
    throw err;
  }

  const order = await orderRepo.findOrderById(numericOrderId);
  if (!order) {
    const err = new Error(`Không tìm thấy đơn hàng với ID: ${orderId}`);
    err.statusCode = 404;
    throw err;
  }

  return order.toResponseObject();
};

/**
 * 7. Cập nhật trạng thái đơn hàng (Dành cho Admin với State Machine)
 */
export const updateOrderStatusForAdmin = async (orderId, newStatus) => {
  const numericOrderId = parseInt(orderId);
  if (isNaN(numericOrderId) || numericOrderId <= 0) {
    const err = new Error('Mã đơn hàng không hợp lệ!');
    err.statusCode = 400;
    throw err;
  }

  const existingOrder = await orderRepo.findOrderById(numericOrderId);
  if (!existingOrder) {
    const err = new Error(`Không tìm thấy đơn hàng với ID: ${orderId}`);
    err.statusCode = 404;
    throw err;
  }

  // Kiểm tra chuyển đổi trạng thái hợp lệ
  OrderEntity.validateStatusTransition(existingOrder.status, newStatus);

  // Nếu Admin chuyển trạng thái sang CANCELLED -> Hoàn lại tồn kho bằng Transaction
  if (newStatus === ORDER_STATUS.CANCELLED) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const items = await orderRepo.findOrderItemsInTransaction(conn, numericOrderId);
      for (const item of items) {
        await productRepo.incrementStock(conn, item.product_id, item.quantity);
      }

      await orderRepo.updateOrderStatusInTransaction(conn, numericOrderId, ORDER_STATUS.CANCELLED);
      await conn.commit();

      await cacheService.delByPattern('products:*');
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } else {
    // Cập nhật trạng thái thông thường (SHIPPING hoặc DELIVERED)
    await orderRepo.updateOrderStatus(numericOrderId, newStatus);
  }

  const updated = await orderRepo.findOrderById(numericOrderId);
  return updated.toResponseObject();
};
