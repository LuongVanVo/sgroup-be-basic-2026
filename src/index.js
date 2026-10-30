import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import rootRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { connectionDb } from './configs/db.config.js';
import { connectRedis, isRedisReady } from './configs/redis.config.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Core Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// 2. Healthcheck & Root test route
app.get('/', (req, res) => {
  res.json({
    message: '🚀 SGroup Backend E-Commerce API is running!',
    environment: process.env.NODE_ENV || 'development',
    redisConnected: isRedisReady(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// 3. Toàn bộ API chính được gắn vào tiền tố /api
app.use('/api', rootRouter);

// 4. Xử lý lỗi 404 Not Found
app.use(notFoundHandler);

// 5. Centralized Error Handler
app.use(errorHandler);

// 6. Khởi động Server sau khi kết nối Database & Redis
const startServer = async () => {
  try {
    // Kết nối Database MySQL
    await connectionDb();

    // Kết nối Redis Cache (không chặn server nếu Redis tạm thời chưa có)
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 Server đang lắng nghe tại: http://localhost:${PORT}`);
      console.log(`📚 API Docs: Gửi request tới /api/products, /api/auth,...`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('❌ Khởi động server thất bại:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
