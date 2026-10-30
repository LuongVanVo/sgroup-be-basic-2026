export class CategoryEntity {
  constructor({ id = null, name, description = null, created_at = null }) {
    this.id = id;
    this.name = name ? name.trim() : '';
    this.description = description;
    this.createdAt = created_at;
  }

  static fromDatabaseRow(row) {
    if (!row) return null;
    return new CategoryEntity({
      id: row.id,
      name: row.name,
      description: row.description,
      created_at: row.created_at,
    });
  }

  toResponseObject() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
    };
  }

  static validate(data) {
    const { name } = data;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      const err = new Error('Tên danh mục không được để trống!');
      err.statusCode = 400;
      throw err;
    }
  }
}
