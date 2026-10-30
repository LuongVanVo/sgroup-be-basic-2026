import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sgroup_db',
  charset: 'utf8mb4',

  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

/**
 * Kiểm tra kết nối Database với cơ chế Retry (hữu ích khi chạy Docker Compose)
 */
export const connectionDb = async (maxRetries = 5, delayMs = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const conn = await pool.getConnection();
      console.log(`[Database] Kết nối MySQL thành công tới [${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'sgroup_db'}]`);
      conn.release();
      return true;
    } catch (err) {
      console.warn(`[Database Warning] Lần thử ${attempt}/${maxRetries} thất bại (${err.message}). Đang thử lại sau ${delayMs / 1000}s...`);
      if (attempt === maxRetries) {
        console.error('[Database Fatal] Không thể kết nối tới MySQL sau nhiều lần thử:', err.message);
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

export default pool;
