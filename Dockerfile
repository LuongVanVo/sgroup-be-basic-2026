# Multi-platform compatible Dockerfile for SGroup Backend E-Commerce
FROM node:20-slim

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Thiết lập biến môi trường production
ENV NODE_ENV=production

# Copy file định nghĩa phụ thuộc trước để tối ưu Docker Layer Caching
COPY package*.json ./

# Cài đặt thư viện dependencies
RUN npm install --omit=dev

# Copy toàn bộ mã nguồn ứng dụng
COPY . .

# Mở cổng ứng dụng lắng nghe
EXPOSE 3000

# Lệnh khởi chạy ứng dụng
CMD ["node", "src/index.js"]
