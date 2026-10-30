export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

export class UserEntity {
  constructor({
    id = null,
    full_name,
    email,
    password_hash = null,
    role = USER_ROLES.USER,
    phone = null,
    avatar_url = null,
    is_active = 1,
    created_at = null,
    updated_at = null,
  }) {
    this.id = id;
    this.fullName = full_name;
    this.email = email ? email.trim().toLowerCase() : null;
    this.passwordHash = password_hash;
    this.role = Object.values(USER_ROLES).includes(role) ? role : USER_ROLES.USER;
    this.phone = phone;
    this.avatarUrl = avatar_url;
    this.isActive = is_active === 1 || is_active === true;
    this.createdAt = created_at;
    this.updatedAt = updated_at;
  }

  /**
   * Chuyển đổi dữ liệu thô từ Database sang User Entity
   */
  static fromDatabaseRow(row) {
    if (!row) return null;
    return new UserEntity({
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      password_hash: row.password_hash,
      role: row.role,
      phone: row.phone,
      avatar_url: row.avatar_url,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  /**
   * Định dạng trả về cho Client: Tuyệt đối LOẠI BỎ thông tin nhạy cảm (password_hash)
   */
  toResponseObject() {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      role: this.role,
      phone: this.phone,
      avatarUrl: this.avatarUrl,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Validate dữ liệu đăng ký người dùng
   */
  static validateRegister(data) {
    const { fullName, email, password, phone } = data;
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      const err = new Error('Họ và tên bắt buộc và phải có tối thiểu 2 ký tự!');
      err.statusCode = 400;
      throw err;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      const err = new Error('Email không hợp lệ!');
      err.statusCode = 400;
      throw err;
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      const err = new Error('Mật khẩu bắt buộc và phải có tối thiểu 6 ký tự!');
      err.statusCode = 400;
      throw err;
    }
    if (phone && !/^[0-9+]{9,15}$/.test(phone)) {
      const err = new Error('Số điện thoại không hợp lệ (chỉ gồm 9-15 chữ số)!');
      err.statusCode = 400;
      throw err;
    }
  }

  /**
   * Validate dữ liệu cập nhật thông tin cá nhân
   */
  static validateUpdateProfile(data) {
    const { fullName, phone } = data;
    if (fullName !== undefined && (typeof fullName !== 'string' || fullName.trim().length < 2)) {
      const err = new Error('Họ và tên phải có tối thiểu 2 ký tự!');
      err.statusCode = 400;
      throw err;
    }
    if (phone !== undefined && phone !== null && !/^[0-9+]{9,15}$/.test(phone)) {
      const err = new Error('Số điện thoại không hợp lệ!');
      err.statusCode = 400;
      throw err;
    }
  }
}
