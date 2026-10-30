import pool from '../configs/db.config.js';
import { UserEntity } from '../entities/user.entity.js';

/**
 * Tìm người dùng theo Email bằng Raw SQL
 */
export const findUserByEmail = async (email) => {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email.trim().toLowerCase()]
  );
  if (!rows || rows.length === 0) return null;
  return UserEntity.fromDatabaseRow(rows[0]);
};

/**
 * Tìm người dùng theo ID bằng Raw SQL
 */
export const findUserById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  if (!rows || rows.length === 0) return null;
  return UserEntity.fromDatabaseRow(rows[0]);
};

/**
 * Tạo tài khoản người dùng mới vào Database
 */
export const createUser = async ({ fullName, email, passwordHash, phone = null, role = 'user' }) => {
  const [result] = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, phone, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [fullName, email.trim().toLowerCase(), passwordHash, role, phone]
  );

  return await findUserById(result.insertId);
};

/**
 * Cập nhật thông tin cá nhân (Họ tên, SĐT)
 */
export const updateUserProfile = async (id, { fullName, phone }) => {
  const updates = [];
  const params = [];

  if (fullName !== undefined) {
    updates.push('full_name = ?');
    params.push(fullName);
  }
  if (phone !== undefined) {
    updates.push('phone = ?');
    params.push(phone);
  }

  if (updates.length === 0) return await findUserById(id);

  params.push(id);
  await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
    params
  );

  return await findUserById(id);
};

/**
 * Cập nhật đường dẫn Avatar của người dùng
 */
export const updateUserAvatar = async (id, avatarUrl) => {
  await pool.query(
    'UPDATE users SET avatar_url = ? WHERE id = ?',
    [avatarUrl, id]
  );
  return await findUserById(id);
};

/**
 * Lấy danh sách toàn bộ người dùng (Dành cho Admin)
 */
export const findAllUsers = async ({ limit = 50, offset = 0 } = {}) => {
  const [rows] = await pool.query(
    'SELECT * FROM users ORDER BY id DESC LIMIT ? OFFSET ?',
    [Number(limit), Number(offset)]
  );
  return rows.map((row) => UserEntity.fromDatabaseRow(row));
};
