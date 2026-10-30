import redisClient, { isRedisReady } from '../configs/redis.config.js';

/**
 * Cache Service - Cung cấp tầng đệm dữ liệu (Cache-Aside Pattern) qua Redis
 */
export const get = async (key) => {
  if (!isRedisReady()) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn(`[CacheService] Lỗi khi đọc key [${key}]:`, err.message);
    return null;
  }
};

export const set = async (key, value, ttlSeconds = 300) => {
  if (!isRedisReady()) return false;
  try {
    const stringValue = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await redisClient.set(key, stringValue, 'EX', ttlSeconds);
    } else {
      await redisClient.set(key, stringValue);
    }
    return true;
  } catch (err) {
    console.warn(`[CacheService] Lỗi khi ghi key [${key}]:`, err.message);
    return false;
  }
};

export const del = async (key) => {
  if (!isRedisReady()) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    console.warn(`[CacheService] Lỗi khi xóa key [${key}]:`, err.message);
    return false;
  }
};

/**
 * Xóa toàn bộ các key khớp với pattern (ví dụ: 'products:*')
 */
export const delByPattern = async (pattern) => {
  if (!isRedisReady()) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await redisClient.del(...keys);
    }
    return true;
  } catch (err) {
    console.warn(`[CacheService] Lỗi khi xóa pattern [${pattern}]:`, err.message);
    return false;
  }
};
