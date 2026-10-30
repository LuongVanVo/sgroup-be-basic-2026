export class ProductEntity {
  constructor({
    id = null,
    name,
    description = null,
    price = 0,
    stock = 0,
    is_active = 1,
    image_url = null,
    category_id = null,
    category_name = null,
    created_at = null,
    updated_at = null,
  }) {
    this.id = id;
    this.name = name ? name.trim() : '';
    this.description = description;
    this.price = Number(price);
    this.stock = Number(stock);
    this.isActive = is_active === 1 || is_active === true;
    this.imageUrl = image_url;
    this.categoryId = category_id ? Number(category_id) : null;
    this.categoryName = category_name;
    this.createdAt = created_at;
    this.updatedAt = updated_at;
  }

  static fromDatabaseRow(row) {
    if (!row) return null;
    return new ProductEntity({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      stock: row.stock,
      is_active: row.is_active,
      image_url: row.image_url,
      category_id: row.category_id,
      category_name: row.category_name,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  toResponseObject() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      stock: this.stock,
      isActive: this.isActive,
      imageUrl: this.imageUrl,
      categoryId: this.categoryId,
      categoryName: this.categoryName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static validateCreate(data) {
    const { name, price, stock } = data;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      const err = new Error('Tên sản phẩm không được để trống!');
      err.statusCode = 400;
      throw err;
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      const err = new Error('Giá sản phẩm phải là số không âm (>= 0)!');
      err.statusCode = 400;
      throw err;
    }
    if (stock === undefined || isNaN(Number(stock)) || !Number.isInteger(Number(stock)) || Number(stock) < 0) {
      const err = new Error('Số lượng tồn kho phải là số nguyên không âm (>= 0)!');
      err.statusCode = 400;
      throw err;
    }
  }

  static validateUpdate(data) {
    const { name, price, stock } = data;
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      const err = new Error('Tên sản phẩm không được để trống!');
      err.statusCode = 400;
      throw err;
    }
    if (price !== undefined && (isNaN(Number(price)) || Number(price) < 0)) {
      const err = new Error('Giá sản phẩm phải là số không âm (>= 0)!');
      err.statusCode = 400;
      throw err;
    }
    if (stock !== undefined && (isNaN(Number(stock)) || !Number.isInteger(Number(stock)) || Number(stock) < 0)) {
      const err = new Error('Số lượng tồn kho phải là số nguyên không âm (>= 0)!');
      err.statusCode = 400;
      throw err;
    }
  }
}
