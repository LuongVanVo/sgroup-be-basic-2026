import { UserEntity } from '../entities/user.entity.js';
import * as userRepo from '../repositories/user.repository.js';
import * as uploadService from './upload.service.js';

export const getProfile = async (userId) => {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    const err = new Error('Không tìm thấy người dùng!');
    err.statusCode = 404;
    throw err;
  }
  return user.toResponseObject();
};

export const updateProfile = async (userId, { fullName, phone }) => {
  UserEntity.validateUpdateProfile({ fullName, phone });

  const updatedUser = await userRepo.updateUserProfile(userId, {
    fullName: fullName ? fullName.trim() : undefined,
    phone: phone ? phone.trim() : undefined,
  });

  return updatedUser.toResponseObject();
};

export const updateAvatar = async (userId, fileBuffer) => {
  if (!fileBuffer) {
    const err = new Error('Không có file ảnh nào được gửi lên!');
    err.statusCode = 400;
    throw err;
  }

  // 1. Upload qua Cloudinary Pipeline
  const uploadResult = await uploadService.uploadImage(fileBuffer, 'ecommerce/avatars');
  const avatarUrl = uploadResult.secure_url;

  // 2. Cập nhật vào MySQL
  const updatedUser = await userRepo.updateUserAvatar(userId, avatarUrl);

  return {
    avatarUrl,
    user: updatedUser.toResponseObject(),
  };
};

export const getAllUsers = async ({ page = 1, limit = 50 } = {}) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, parseInt(limit) || 50);
  const offset = (pageNum - 1) * limitNum;

  const users = await userRepo.findAllUsers({ limit: limitNum, offset });
  return users.map((u) => u.toResponseObject());
};
