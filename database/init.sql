-- ========================================================
-- KHỞI TẠO CƠ SỞ DỮ LIỆU SGROUP E-COMMERCE API
-- ========================================================
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE DATABASE IF NOT EXISTS sgroup_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE sgroup_db;

-- 1. Bảng users (Quản lý tài khoản & phân quyền)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    phone VARCHAR(20) DEFAULT NULL,
    avatar_url VARCHAR(500) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng categories (Danh mục sản phẩm)
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng products (Sản phẩm & Tồn kho)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    category_id INT DEFAULT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_categories
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE SET NULL,
    INDEX idx_products_category (category_id),
    INDEX idx_products_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng orders (Đơn hàng)
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status ENUM('PENDING', 'SHIPPING', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    shipping_address VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    note TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_users
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng order_items (Chi tiết từng món hàng trong đơn)
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE RESTRICT,
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================
-- SEED DATA ĐẦY ĐỦ CHO TOÀN BỘ CÁC BẢNG (FULL SEED DATA)
-- ========================================================

-- 1. Seed Bảng USERS
-- Mật khẩu chung:
-- admin@gmail.com     -> Admin@123
-- user@gmail.com      -> User@123
-- customer2@gmail.com -> User@123
INSERT INTO users (id, full_name, email, password_hash, role, phone, avatar_url, is_active)
VALUES 
(1, 'Hệ Thống Quản Trị (Admin)', 'admin@gmail.com', '$2b$10$ieocuBVbpz7g7qtydarNE.TDtqK78O/HiAoSyw3DZ0mOIIrXjcOYq', 'admin', '0901234567', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 1),
(2, 'Nguyễn Văn Khách (User 1)', 'user@gmail.com', '$2b$10$WXRn0ZTz1dOENBo3a4tr8.rUg7.M6YWc/DkBWL90YQ6.1wiRynBSO', 'user', '0987654321', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 1),
(3, 'Trần Thị Mai (User 2)', 'customer2@gmail.com', '$2b$10$WXRn0ZTz1dOENBo3a4tr8.rUg7.M6YWc/DkBWL90YQ6.1wiRynBSO', 'user', '0912345678', NULL, 1)
ON DUPLICATE KEY UPDATE id=id;

-- 2. Seed Bảng CATEGORIES
INSERT INTO categories (id, name, description) VALUES
(1, 'Điện thoại', 'Các dòng điện thoại thông minh chính hãng Apple, Samsung, Xiaomi'),
(2, 'Laptop', 'Máy tính xách tay cao cấp cho văn phòng, đồ họa và lập trình'),
(3, 'Máy tính bảng', 'Tablet phục vụ học tập, giải trí và thiết kế đồ họa'),
(4, 'Phụ kiện', 'Tai nghe không dây, bàn phím cơ, củ sạc nhanh và chuột bluetooth')
ON DUPLICATE KEY UPDATE id=id;

-- 3. Seed Bảng PRODUCTS
INSERT INTO products (id, name, description, price, stock, category_id, image_url, is_active) VALUES
(1, 'iPhone 15 Pro Max 256GB', 'Titan tự nhiên, chip A17 Pro 3nm, camera tiềm vọng zoom quang 5x đỉnh cao.', 29990000.00, 25, 1, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600', 1),
(2, 'Samsung Galaxy S24 Ultra 512GB', 'Khung viền Titan, bút S-Pen, tích hợp bộ công cụ trí tuệ nhân tạo Galaxy AI.', 27490000.00, 30, 1, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600', 1),
(3, 'MacBook Pro 14 M3 Pro 18GB/512GB', 'Màu Space Black, màn hình Liquid Retina XDR 120Hz mượt mà, thời lượng pin 22h.', 48990000.00, 15, 2, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600', 1),
(4, 'Dell XPS 15 9530 Core i7', 'Màn hình OLED 3.5K sắc nét, vỏ nhôm nguyên khối, card đồ họa rời RTX 4050.', 38500000.00, 10, 2, 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600', 1),
(5, 'iPad Pro 11 M2 Wi-Fi 128GB', 'Màn hình Liquid Retina ProMotion 120Hz, hỗ trợ Apple Pencil Hover thế hệ 2.', 19490000.00, 20, 3, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600', 1),
(6, 'Tai nghe chống ồn Sony WH-1000XM5', 'Chống ồn chủ động kép hàng đầu thế giới, codec LDAC chất lượng cao, pin 30h.', 7990000.00, 40, 4, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', 1),
(7, 'Bàn phím cơ Aula F75 Không dây', 'Mạch xuôi, gót gõ êm với switch Reaper, 3 chế độ kết nối (Type-C, 2.4G, BT5.0).', 1250000.00, 50, 4, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600', 1),
(8, 'Chuột không dây Logitech MX Master 3S', 'Cảm biến 8000 DPI trên mọi mặt kính, cuộn điện từ MagSpeed cực nhanh và êm.', 2290000.00, 35, 4, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600', 1)
ON DUPLICATE KEY UPDATE id=id;

-- 4. Seed Bảng ORDERS (Đầy đủ 4 trạng thái: DELIVERED, SHIPPING, PENDING, CANCELLED)
INSERT INTO orders (id, user_id, total_amount, status, shipping_address, phone, note, created_at) VALUES
-- Đơn 1: Đã giao thành công (DELIVERED) của User 2
(1, 2, 37980000.00, 'DELIVERED', '123 Lê Duẩn, Quận Hải Châu, Đà Nẵng', '0987654321', 'Giao giờ hành chính, gọi trước 15p', '2026-10-15 09:30:00'),

-- Đơn 2: Đang trên đường vận chuyển (SHIPPING) của User 2
(2, 2, 48990000.00, 'SHIPPING', '456 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh', '0987654321', 'Hàng giá trị cao cần bọc xốp cẩn thận', '2026-10-18 14:15:00'),

-- Đơn 3: Đơn hàng mới tạo đang chờ duyệt (PENDING) của User 3
(3, 3, 27490000.00, 'PENDING', '789 Trần Phú, Quận Ba Đình, Hà Nội', '0912345678', 'Giao buổi chiều sau 17h', '2026-10-20 10:00:00'),

-- Đơn 4: Đơn hàng đã bị hủy (CANCELLED) của User 3
(4, 3, 3540000.00, 'CANCELLED', '102 Bạch Đằng, Quận Bình Thạnh, TP. Hồ Chí Minh', '0912345678', 'Đổi ý không mua nữa', '2026-10-19 11:00:00')
ON DUPLICATE KEY UPDATE id=id;

-- 5. Seed Bảng ORDER_ITEMS (Chi tiết các mặt hàng trong từng đơn)
INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
-- Đơn 1: Mua 1 iPhone 15 Pro Max (29,990,000) + 1 Tai nghe Sony XM5 (7,990,000) = 37,980,000
(1, 1, 1, 1, 29990000.00),
(2, 1, 6, 1, 7990000.00),

-- Đơn 2: Mua 1 MacBook Pro 14 M3 (48,990,000)
(3, 2, 3, 1, 48990000.00),

-- Đơn 3: Mua 1 Samsung Galaxy S24 Ultra (27,490,000)
(4, 3, 2, 1, 27490000.00),

-- Đơn 4: Mua 1 Bàn phím Aula F75 (1,250,000) + 1 Chuột MX Master 3S (2,290,000) = 3,540,000
(5, 4, 7, 1, 1250000.00),
(6, 4, 8, 1, 2290000.00)
ON DUPLICATE KEY UPDATE id=id;
