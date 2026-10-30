import * as userService from '../services/user.service.js';

export const getProfile = async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user.id);
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone } = req.body;
    const updated = await userService.updateProfile(req.user.id, { fullName, phone });
    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công!',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAvatar = async (req, res, next) => {
  try {
    const result = await userService.updateAvatar(req.user.id, req.file.buffer);
    return res.status(200).json({
      success: true,
      message: 'Cập nhật avatar thành công!',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const users = await userService.getAllUsers({ page, limit });
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
