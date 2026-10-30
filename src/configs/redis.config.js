import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

let isReady = false;

// Khởi tạo Redis client với cơ chế tự động kết nối lại
const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  retryStrategy(times) {
    if (times > 5) {
      console.warn('[Redis] Quá 5 lần thử kết nối thất bại, tạm thời vô hiệu hóa cache.');
      return null;
    }
    const delay = Math.min(times * 1000, 3000);
    return delay;
  },
});

redisClient.on('connect', () => {
  isReady = true;
  console.log(`[Redis] Kết nối thành công tới ${REDIS_HOST}:${REDIS_PORT}`);
});

redisClient.on('ready', () => {
  isReady = true;
});

redisClient.on('error', (err) => {
  isReady = false;
  console.warn(`[Redis Warning] Lỗi kết nối Redis: ${err.message}. Hệ thống tiếp tục dùng MySQL trực tiếp.`);
});

redisClient.on('close', () => {
  isReady = false;
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.warn(`[Redis Warning] Không thể kết nối ban đầu tới Redis (${err.message}). Tiếp tục chạy không cache.`);
  }
};

export const isRedisReady = () => isReady;

export default redisClient;
