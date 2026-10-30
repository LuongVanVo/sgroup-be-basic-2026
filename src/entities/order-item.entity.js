export class OrderItemEntity {
  constructor({
    id = null,
    order_id = null,
    product_id,
    quantity,
    unit_price,
    product_name = null,
    product_image_url = null,
  }) {
    this.id = id;
    this.orderId = order_id ? Number(order_id) : null;
    this.productId = Number(product_id);
    this.quantity = Number(quantity);
    this.unitPrice = Number(unit_price);
    this.productName = product_name;
    this.productImageUrl = product_image_url;
    this.subtotal = Number((this.quantity * this.unitPrice).toFixed(2));
  }

  static fromDatabaseRow(row) {
    if (!row) return null;
    return new OrderItemEntity({
      id: row.id,
      order_id: row.order_id,
      product_id: row.product_id,
      quantity: row.quantity,
      unit_price: row.unit_price,
      product_name: row.product_name,
      product_image_url: row.product_image_url,
    });
  }

  toResponseObject() {
    return {
      id: this.id,
      productId: this.productId,
      productName: this.productName,
      productImageUrl: this.productImageUrl,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      subtotal: this.subtotal,
    };
  }

  static validate(item) {
    const { productId, quantity } = item;
    if (!productId || isNaN(Number(productId)) || Number(productId) <= 0) {
      const err = new Error('Mã sản phẩm (productId) không hợp lệ!');
      err.statusCode = 400;
      throw err;
    }
    if (!quantity || isNaN(Number(quantity)) || !Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      const err = new Error(`Số lượng đặt của sản phẩm ID ${productId} phải là số nguyên dương (> 0)!`);
      err.statusCode = 400;
      throw err;
    }
  }
}
