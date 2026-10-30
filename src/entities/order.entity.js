export const ORDER_STATUS = {
  PENDING: 'PENDING',
  SHIPPING: 'SHIPPING',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

// Các chuyển đổi trạng thái hợp lệ
export const ALLOWED_STATUS_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPING]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [], // Trạng thái kết thúc
  [ORDER_STATUS.CANCELLED]: [], // Trạng thái kết thúc
};

export class OrderEntity {
  constructor({
    id = null,
    user_id,
    total_amount = 0,
    status = ORDER_STATUS.PENDING,
    shipping_address,
    phone,
    note = null,
    created_at = null,
    updated_at = null,
    customer_name = null,
    customer_email = null,
    items = [],
  }) {
    this.id = id;
    this.userId = Number(user_id);
    this.totalAmount = Number(total_amount);
    this.status = status;
    this.shippingAddress = shipping_address;
    this.phone = phone;
    this.note = note;
    this.createdAt = created_at;
    this.updatedAt = updated_at;
    this.customerName = customer_name;
    this.customerEmail = customer_email;
    this.items = items;
  }

  static fromDatabaseRow(row, items = []) {
    if (!row) return null;
    return new OrderEntity({
      id: row.id,
      user_id: row.user_id,
      total_amount: row.total_amount,
      status: row.status,
      shipping_address: row.shipping_address,
      phone: row.phone,
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at,
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      items,
    });
  }

  toResponseObject() {
    return {
      id: this.id,
      userId: this.userId,
      customer: this.customerName ? {
        name: this.customerName,
        email: this.customerEmail,
      } : undefined,
      totalAmount: this.totalAmount,
      status: this.status,
      shippingAddress: this.shippingAddress,
      phone: this.phone,
      note: this.note,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      items: this.items.map((item) => (typeof item.toResponseObject === 'function' ? item.toResponseObject() : item)),
    };
  }

  /**
   * Kiểm tra tính hợp lệ của việc chuyển đổi trạng thái đơn hàng
   */
  static validateStatusTransition(currentStatus, newStatus) {
    if (!Object.values(ORDER_STATUS).includes(newStatus)) {
      const err = new Error(`Trạng thái [${newStatus}] không hợp lệ! Chỉ chấp nhận: ${Object.values(ORDER_STATUS).join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    if (currentStatus === ORDER_STATUS.DELIVERED || currentStatus === ORDER_STATUS.CANCELLED) {
      const err = new Error(`Đơn hàng đã ở trạng thái kết thúc [${currentStatus}], không thể thay đổi trạng thái nữa!`);
      err.statusCode = 400;
      throw err;
    }

    const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      const err = new Error(
        `Không thể chuyển trạng thái từ [${currentStatus}] sang [${newStatus}]! Các trạng thái được phép: ${allowedNext.join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }
  }

  /**
   * Validate dữ liệu khi tạo đơn hàng mới
   */
  static validateCreateOrder(data) {
    const { items, shippingAddress, phone } = data;

    if (!items || !Array.isArray(items) || items.length === 0) {
      const err = new Error('Đơn hàng phải chứa ít nhất 1 sản phẩm!');
      err.statusCode = 400;
      throw err;
    }

    if (!shippingAddress || typeof shippingAddress !== 'string' || shippingAddress.trim().length < 5) {
      const err = new Error('Địa chỉ giao hàng bắt buộc và phải có ít nhất 5 ký tự!');
      err.statusCode = 400;
      throw err;
    }

    if (!phone || !/^[0-9+]{9,15}$/.test(phone)) {
      const err = new Error('Số điện thoại người nhận không hợp lệ!');
      err.statusCode = 400;
      throw err;
    }
  }
}
