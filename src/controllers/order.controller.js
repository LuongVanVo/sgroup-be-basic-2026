import * as orderService from '../services/order.service.js';

/**
 * 1. Khách hàng tạo đơn hàng mới (Database Transaction)
 */
export const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items, shippingAddress, phone, note } = req.body;

    const order = await orderService.createOrder(userId, {
      items,
      shippingAddress,
      phone,
      note,
    });

    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công! Đơn hàng đang ở trạng thái PENDING.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Khách hàng xem danh sách đơn hàng của mình
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit } = req.query;

    const orders = await orderService.getMyOrders(userId, { page, limit });
    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Khách hàng xem chi tiết một đơn hàng
 */
export const getMyOrderDetail = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await orderService.getMyOrderDetail(userId, id);
    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Khách hàng hủy đơn hàng của mình (Chỉ khi PENDING)
 */
export const cancelMyOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const order = await orderService.cancelMyOrder(userId, id);
    return res.status(200).json({
      success: true,
      message: 'Hủy đơn hàng thành công! Số lượng sản phẩm đã được hoàn trả lại kho.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Admin xem danh sách toàn bộ đơn hàng
 */
export const getAllOrdersForAdmin = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await orderService.getAllOrdersForAdmin({ status, page, limit });

    return res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Admin xem chi tiết đơn hàng
 */
export const getOrderDetailForAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderDetailForAdmin(id);

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Admin cập nhật trạng thái đơn hàng (State Machine)
 */
export const updateOrderStatusForAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trường [status] mới!',
      });
    }

    const updated = await orderService.updateOrderStatusForAdmin(id, status);
    return res.status(200).json({
      success: true,
      message: `Cập nhật trạng thái đơn hàng sang [${status}] thành công!`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
