import * as authService from '../services/auth.service.js';

export const register = async (req, res, next) => {
  try {
    const { fullName, email, password, phone } = req.body;
    const result = await authService.register({ fullName, email, password, phone });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
