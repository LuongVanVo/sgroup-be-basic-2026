import multer from 'multer';

// 1. Cấu hình lưu file tạm trong RAM dưới dạng Buffer
const storage = multer.memoryStorage();

// 2. Bộ lọc định dạng file (Chỉ cho phép định dạng ảnh phổ biến)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận các định dạng ảnh: .jpg, .jpeg, .png, .webp!'), false);
  }
};

// 3. Khởi tạo instance multer với giới hạn mặc định 5MB
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});

// 4. Wrapper Middleware để bắt lỗi Multer thân thiện
export const uploadSingleImage = (fieldName = 'image') => {
  const uploadMiddleware = upload.single(fieldName);

  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Dung lượng file vượt quá giới hạn cho phép (Tối đa 5MB)!',
          });
        }
        return res.status(400).json({ success: false, message: `Lỗi upload: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: `Vui lòng chọn file đính kèm với key là [${fieldName}]!`,
        });
      }

      next();
    });
  };
};
