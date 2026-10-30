/**
 * Automated End-to-End API Test Suite
 * Khóa học SGroup Backend Basic 2026 - Final Project
 */

const BASE_URL = 'http://localhost:3000';
let userToken = '';
let adminToken = '';
let createdUserId = null;
let createdProductId = null;
let createdOrderId = null;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const assert = (condition, message) => {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
  }
};

const request = async (method, path, { headers = {}, body = null } = {}) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, options);
  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }
  return { status: res.status, data };
};

const runTestSuite = async () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 BẮT ĐẦU CHẠY KIỂM THỬ TOÀN BỘ RESTFUL API (E2E SUITE)`);
  console.log(`Target Server: ${BASE_URL}`);
  console.log(`=============================================================\n`);

  // -------------------------------------------------------------
  // SUITE 1: HEALTHCHECK & ROOT
  // -------------------------------------------------------------
  console.log(`📦 [TEST SUITE 1: SERVER HEALTH & REDIS CONNECTIVITY]`);
  {
    const res = await request('GET', '/');
    assert(res.status === 200, 'Root endpoint trả về HTTP 200');
    assert(res.data?.message?.includes('running'), 'Server thông báo đang chạy');
    assert(res.data?.redisConnected === true, 'Redis đã kết nối thành công (redisConnected: true)');
  }

  // -------------------------------------------------------------
  // SUITE 2: AUTHENTICATION
  // -------------------------------------------------------------
  console.log(`\n🔑 [TEST SUITE 2: AUTHENTICATION & SECURITY]`);
  {
    // 2.1. Đăng ký tài khoản mới
    const randomEmail = `test_${Date.now()}@gmail.com`;
    const regRes = await request('POST', '/api/auth/register', {
      body: {
        fullName: 'Nguyễn Văn Kiểm Thử',
        email: randomEmail,
        password: 'User@123',
        phone: '0981122334',
      },
    });
    assert(regRes.status === 201, 'Đăng ký tài khoản mới thành công (HTTP 201)');
    assert(regRes.data?.data?.user?.email === randomEmail, 'User mới có đúng email');
    assert(!regRes.data?.data?.user?.passwordHash, 'Mật khẩu băm (passwordHash) đã được ẩn');
    assert(typeof regRes.data?.data?.token === 'string', 'Cấp token JWT sau khi đăng ký');

    // 2.2. Kiểm tra trùng lặp email (Conflict 409)
    const dupRes = await request('POST', '/api/auth/register', {
      body: {
        fullName: 'Người Trùng Email',
        email: randomEmail,
        password: 'User@123',
      },
    });
    assert(dupRes.status === 409, 'Chặn đăng ký trùng email (HTTP 409 Conflict)');

    // 2.3. Đăng nhập sai mật khẩu (Unauthorized 401)
    const wrongPassRes = await request('POST', '/api/auth/login', {
      body: { email: randomEmail, password: 'WrongPassword' },
    });
    assert(wrongPassRes.status === 401, 'Chặn đăng nhập sai mật khẩu (HTTP 401)');

    // 2.4. Đăng nhập User mẫu
    const loginUserRes = await request('POST', '/api/auth/login', {
      body: { email: 'user@gmail.com', password: 'User@123' },
    });
    assert(loginUserRes.status === 200, 'Đăng nhập User mẫu thành công (HTTP 200)');
    userToken = loginUserRes.data?.data?.token;
    assert(!!userToken, 'Lấy được userToken hợp lệ');

    // 2.5. Đăng nhập Admin mẫu
    const loginAdminRes = await request('POST', '/api/auth/login', {
      body: { email: 'admin@gmail.com', password: 'Admin@123' },
    });
    assert(loginAdminRes.status === 200, 'Đăng nhập Admin mẫu thành công (HTTP 200)');
    adminToken = loginAdminRes.data?.data?.token;
    assert(loginAdminRes.data?.data?.user?.role === 'admin', 'Xác nhận role của tài khoản là [admin]');

    // 2.6. Lấy thông tin user hiện tại (/api/auth/me)
    const meRes = await request('GET', '/api/auth/me', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(meRes.status === 200, 'Gọi /api/auth/me với token thành công');
    assert(meRes.data?.data?.email === 'user@gmail.com', 'Thông tin đúng tài khoản');
  }

  // -------------------------------------------------------------
  // SUITE 3: USER PROFILE & AUTHORIZATION
  // -------------------------------------------------------------
  console.log(`\n👤 [TEST SUITE 3: USER PROFILE & ROLE-BASED ACCESS CONTROL]`);
  {
    // 3.1. Xem profile cá nhân
    const profileRes = await request('GET', '/api/users/profile', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(profileRes.status === 200, 'User xem profile cá nhân thành công');
    assert(profileRes.data?.data?.role === 'user', 'Role là user');

    // 3.2. Cập nhật profile cá nhân
    const updateProfileRes = await request('PUT', '/api/users/profile', {
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        fullName: 'Nguyễn Văn Khách VIP Updated',
        phone: '0977889900',
      },
    });
    assert(updateProfileRes.status === 200, 'Cập nhật profile thành công (HTTP 200)');
    assert(updateProfileRes.data?.data?.fullName === 'Nguyễn Văn Khách VIP Updated', 'Tên đã cập nhật mới');

    // 3.3. Quyền Admin: Xem danh sách toàn bộ users
    const adminGetUsersRes = await request('GET', '/api/users', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminGetUsersRes.status === 200, 'Admin lấy danh sách users thành công');
    assert(Array.isArray(adminGetUsersRes.data?.data), 'Dữ liệu trả về là mảng');

    // 3.4. Kiểm tra phân quyền: User gọi API Admin bị chặn (403 Forbidden)
    const userCallAdminRes = await request('GET', '/api/users', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(userCallAdminRes.status === 403, 'Chặn User gọi API của Admin (HTTP 403 Forbidden)');
  }

  // -------------------------------------------------------------
  // SUITE 4: CATEGORIES
  // -------------------------------------------------------------
  console.log(`\n📁 [TEST SUITE 4: CATEGORIES API]`);
  {
    const catRes = await request('GET', '/api/categories');
    assert(catRes.status === 200, 'Lấy danh mục sản phẩm công khai thành công');
    assert(catRes.data?.data?.length >= 4, 'Đã seed sẵn ít nhất 4 danh mục');
  }

  // -------------------------------------------------------------
  // SUITE 5: PRODUCTS & REDIS CACHING
  // -------------------------------------------------------------
  console.log(`\n📱 [TEST SUITE 5: PRODUCTS CATALOG & REDIS CACHE-ASIDE]`);
  {
    // 5.1. Lấy danh sách sản phẩm (Lần 1 - Miss hoặc Hit)
    const p1 = await request('GET', '/api/products?page=1&limit=5');
    assert(p1.status === 200, 'Lấy danh sách sản phẩm thành công');
    assert(Array.isArray(p1.data?.data), 'Danh sách trả về mảng sản phẩm');

    // 5.2. Lấy danh sách sản phẩm (Lần 2 - Bắt buộc Cache Hit từ Redis)
    const p2 = await request('GET', '/api/products?page=1&limit=5');
    assert(p2.status === 200, 'Lần gọi thứ 2 thành công');
    assert(p2.data?.fromCache === true, 'Xác nhận dữ liệu được lấy từ Redis Cache (fromCache: true)');

    // 5.3. Xem chi tiết sản phẩm ID 1
    const detailRes = await request('GET', '/api/products/1');
    assert(detailRes.status === 200, 'Xem chi tiết sản phẩm ID 1 thành công');
    assert(detailRes.data?.data?.name?.includes('iPhone'), 'Sản phẩm đúng là iPhone 15 Pro Max');

    // 5.4. Admin thêm sản phẩm mới (Tự xóa Cache Redis)
    const newProdRes = await request('POST', '/api/products', {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'Tai nghe Apple AirPods Pro 2',
        description: 'Chống ồn chủ động 2x, chip H2',
        price: 5990000,
        stock: 50,
        categoryId: 4,
      },
    });
    assert(newProdRes.status === 201, 'Admin thêm sản phẩm mới thành công (HTTP 201)');
    createdProductId = newProdRes.data?.data?.id;
    assert(!!createdProductId, `Lấy được mã sản phẩm mới vừa tạo (ID: ${createdProductId})`);

    // 5.5. Kiểm tra Cache Invalidation (Danh sách sản phẩm phải cập nhật và fromCache: false)
    const pAfterCreate = await request('GET', '/api/products?page=1&limit=5');
    assert(pAfterCreate.data?.fromCache === false, 'Cache Redis đã tự động bị xóa (Invalidated) sau khi tạo sản phẩm');

    // 5.6. Admin cập nhật tồn kho
    const updateStockRes = await request('PATCH', `/api/products/${createdProductId}/stock`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { stock: 100 },
    });
    assert(updateStockRes.status === 200, 'Admin cập nhật tồn kho thành công');
    assert(updateStockRes.data?.data?.stock === 100, 'Số lượng tồn kho cập nhật thành 100');

    // 5.7. Admin sửa thông tin sản phẩm
    const updateProdRes = await request('PUT', `/api/products/${createdProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { name: 'Tai nghe Apple AirPods Pro 2 (USB-C)' },
    });
    assert(updateProdRes.status === 200, 'Admin sửa tên sản phẩm thành công');
    assert(updateProdRes.data?.data?.name === 'Tai nghe Apple AirPods Pro 2 (USB-C)', 'Tên đã được cập nhật');
  }

  // -------------------------------------------------------------
  // SUITE 6: ORDERS & DATABASE TRANSACTIONS
  // -------------------------------------------------------------
  console.log(`\n💳 [TEST SUITE 6: ORDERS & DATABASE TRANSACTIONS]`);
  {
    // Lấy tồn kho hiện tại của sản phẩm 1
    const p1Before = await request('GET', '/api/products/1');
    const stockBefore = p1Before.data?.data?.stock;

    // 6.1. User tạo đơn hàng mới (Mua 2 chiếc iPhone ID: 1)
    const createOrderRes = await request('POST', '/api/orders', {
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        items: [{ productId: 1, quantity: 2 }],
        shippingAddress: '456 Hoàng Diệu, Hải Châu, Đà Nẵng',
        phone: '0977889900',
        note: 'Đơn hàng test tự động',
      },
    });
    assert(createOrderRes.status === 201, 'User tạo đơn hàng thành công (HTTP 201 Created)');
    createdOrderId = createOrderRes.data?.data?.id;
    assert(createOrderRes.data?.data?.status === 'PENDING', 'Đơn hàng mới có trạng thái [PENDING]');
    assert(createOrderRes.data?.data?.items?.length === 1, 'Đơn hàng chứa đúng 1 loại mặt hàng');

    // 6.2. Kiểm chứng Database Transaction đã trừ tồn kho
    const p1After = await request('GET', '/api/products/1');
    const stockAfter = p1After.data?.data?.stock;
    assert(stockAfter === stockBefore - 2, `Tồn kho đã bị trừ chính xác 2 chiếc (${stockBefore} -> ${stockAfter})`);

    // 6.3. User xem danh sách đơn hàng của mình
    const myOrdersRes = await request('GET', '/api/orders/my-orders', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(myOrdersRes.status === 200, 'User xem danh sách đơn hàng thành công');
    const hasCreatedOrder = myOrdersRes.data?.data?.some((o) => o.id === createdOrderId);
    assert(hasCreatedOrder, 'Đơn hàng vừa tạo xuất hiện trong danh sách của User');

    // 6.4. User xem chi tiết đơn hàng vừa tạo
    const orderDetailRes = await request('GET', `/api/orders/my-orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(orderDetailRes.status === 200, 'User xem chi tiết đơn hàng thành công');
    assert(orderDetailRes.data?.data?.items[0]?.quantity === 2, 'Số lượng mặt hàng trong chi tiết đúng bằng 2');

    // 6.5. User hủy đơn hàng PENDING (Transaction hoàn trả tồn kho)
    const cancelOrderRes = await request('PATCH', `/api/orders/my-orders/${createdOrderId}/cancel`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(cancelOrderRes.status === 200, 'User hủy đơn hàng PENDING thành công');
    assert(cancelOrderRes.data?.data?.status === 'CANCELLED', 'Trạng thái chuyển sang [CANCELLED]');

    // 6.6. Kiểm chứng Transaction hoàn trả lại tồn kho
    const p1Restored = await request('GET', '/api/products/1');
    assert(p1Restored.data?.data?.stock === stockBefore, `Tồn kho đã được hoàn trả nguyên vẹn (${p1Restored.data?.data?.stock} chiếc)`);
  }

  // -------------------------------------------------------------
  // SUITE 7: ADMIN ORDER MANAGEMENT & STATE MACHINE
  // -------------------------------------------------------------
  console.log(`\n👑 [TEST SUITE 7: ADMIN ORDER MANAGEMENT & STATE MACHINE]`);
  {
    // Tạo 1 đơn mới để Admin duyệt
    const newOrderForAdmin = await request('POST', '/api/orders', {
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        items: [{ productId: 2, quantity: 1 }],
        shippingAddress: '99 Bạch Đằng, Đà Nẵng',
        phone: '0905123456',
      },
    });
    const orderIdToShip = newOrderForAdmin.data?.data?.id;

    // 7.1. Admin xem danh sách toàn bộ đơn hàng
    const adminOrdersRes = await request('GET', '/api/orders/admin', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminOrdersRes.status === 200, 'Admin lấy toàn bộ đơn hàng thành công');
    const orderList = Array.isArray(adminOrdersRes.data?.data) ? adminOrdersRes.data.data : adminOrdersRes.data?.data?.orders;
    assert(orderList && orderList.length > 0, 'Có danh sách đơn hàng');

    // 7.2. Admin lọc đơn theo trạng thái PENDING
    const adminFilterRes = await request('GET', '/api/orders/admin?status=PENDING', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminFilterRes.status === 200, 'Admin lọc đơn theo status=PENDING thành công');
    const filteredList = Array.isArray(adminFilterRes.data?.data) ? adminFilterRes.data.data : adminFilterRes.data?.data?.orders;
    const allPending = filteredList && filteredList.length > 0 && filteredList.every((o) => o.status === 'PENDING');
    assert(allPending, 'Tất cả đơn lọc ra đều có status là PENDING');

    // 7.3. Admin duyệt đơn PENDING -> SHIPPING
    const toShippingRes = await request('PATCH', `/api/orders/admin/${orderIdToShip}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'SHIPPING' },
    });
    assert(toShippingRes.status === 200, 'Admin chuyển trạng thái sang [SHIPPING] thành công');
    assert(toShippingRes.data?.data?.status === 'SHIPPING', 'Trạng thái đã là SHIPPING');

    // 7.4. Admin chuyển trạng thái SHIPPING -> DELIVERED (Hoàn tất)
    const toDeliveredRes = await request('PATCH', `/api/orders/admin/${orderIdToShip}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'DELIVERED' },
    });
    assert(toDeliveredRes.status === 200, 'Admin chuyển trạng thái sang [DELIVERED] thành công');
    assert(toDeliveredRes.data?.data?.status === 'DELIVERED', 'Trạng thái đã là DELIVERED');

    // 7.5. Bẫy State Machine: Không cho phép đổi trạng thái của đơn đã DELIVERED
    const invalidStateRes = await request('PATCH', `/api/orders/admin/${orderIdToShip}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'PENDING' },
    });
    assert(invalidStateRes.status === 400, 'State Machine chặn đổi trạng thái từ [DELIVERED] về lại [PENDING] (HTTP 400)');
  }

  // -------------------------------------------------------------
  // SUITE 8: EDGE CASES & BUSINESS VALIDATIONS
  // -------------------------------------------------------------
  console.log(`\n🛡️ [TEST SUITE 8: EDGE CASES & ERROR HANDLING]`);
  {
    // 8.1. Đặt hàng vượt quá số lượng tồn kho
    const overStockRes = await request('POST', '/api/orders', {
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        items: [{ productId: 1, quantity: 99999 }],
        shippingAddress: 'Địa chỉ ảo',
        phone: '0900000000',
      },
    });
    assert(overStockRes.status === 400, 'Chặn đặt hàng vượt tồn kho (HTTP 400 Bad Request)');
    assert(overStockRes.data?.message?.includes('không đủ tồn kho'), 'Thông báo lỗi rõ ràng');

    // 8.2. Đặt hàng với giỏ hàng rỗng
    const emptyCartRes = await request('POST', '/api/orders', {
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        items: [],
        shippingAddress: 'Địa chỉ ảo',
        phone: '0900000000',
      },
    });
    assert(emptyCartRes.status === 400, 'Chặn đơn hàng không có sản phẩm nào (HTTP 400)');

    // 8.3. Truy cập route không tồn tại (404 Not Found)
    const notFoundRes = await request('GET', '/api/not-existing-endpoint');
    assert(notFoundRes.status === 404, 'Bắt lỗi 404 Not Found chính xác');
  }

  // -------------------------------------------------------------
  // TỔNG KẾT KẾT QUẢ
  // -------------------------------------------------------------
  console.log(`\n=============================================================`);
  console.log(`📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ:`);
  console.log(`   - Tổng số test case: ${totalTests}`);
  console.log(`   - Số test THÀNH CÔNG: ${passedTests} ✅`);
  console.log(`   - Số test THẤT BẠI:   ${failedTests} ${failedTests > 0 ? '❌' : '🎉'}`);
  console.log(`   - Tỷ lệ đạt chuẩn:    ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  console.log(`=============================================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
};

runTestSuite().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
