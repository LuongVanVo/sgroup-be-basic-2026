import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserEntity, USER_ROLES } from '../entities/user.entity.js';
import * as userRepo from '../repositories/user.repository.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || 'SGroup_Default_Secret_2026_!@#';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * Đăng ký tài khoản người dùng mới
 */
export const register = async ({ fullName, email, password, phone }) => {
  // 1. Kiểm tra định dạng dữ liệu đầu vào
  UserEntity.validateRegister({ fullName, email, password, phone });

  const normalizedEmail = email.trim().toLowerCase();

  // 2. Kiểm tra email đã tồn tại hay chưa
  const existingUser = await userRepo.findUserByEmail(normalizedEmail);
  if (existingUser) {
    const err = new Error('Email này đã được sử dụng, vui lòng chọn email khác!');
    err.statusCode = 409;
    throw err;
  }

  // 3. Băm mật khẩu bằng bcrypt (Salt rounds = 10)
  const passwordHash = await bcrypt.hash(password, 10);

  // 4. Lưu người dùng vào cơ sở dữ liệu
  const newUser = await userRepo.createUser({
    fullName: fullName.trim(),
    email: normalizedEmail,
    passwordHash,
    phone: phone ? phone.trim() : null,
    role: USER_ROLES.USER,
  });

  // 5. Tạo JWT Token đăng nhập
  const token = jwt.sign(
    {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    user: newUser.toResponseObject(),
    token,
  };
};

/**
 * Đăng nhập người dùng bằng email và mật khẩu
 */
export const login = async ({ email, password }) => {
  if (!email || !password) {
    const err = new Error('Vui lòng nhập đầy đủ email và mật khẩu!');
    err.statusCode = 400;
    throw err;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Tìm người dùng theo email
  const user = await userRepo.findUserByEmail(normalizedEmail);
  if (!user) {
    const err = new Error('Email hoặc mật khẩu không chính xác!');
    err.statusCode = 401;
    throw err;
  }

  // 2. Kiểm tra tài khoản có bị khóa không
  if (!user.isActive) {
    const err = new Error('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Admin!');
    err.statusCode = 403;
    throw err;
  }

  // 3. So khớp mật khẩu với hash trong DB
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const err = new Error('Email hoặc mật khẩu không chính xác!');
    err.statusCode = 401;
    throw err;
  }

  // 4. Tạo token JWT
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    user: user.toResponseObject(),
    token,
  };
};

/**
 * Lấy thông tin tài khoản đang đăng nhập
 */
export const getMe = async (userId) => {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    const err = new Error('Không tìm thấy tài khoản!');
    err.statusCode = 404;
    throw err;
  }
  return user.toResponseObject();
};
