## Authentication (/api/auth)

POST /api/auth/register: Đăng ký tài khoản mới.
POST /api/auth/login: Đăng nhập.
POST /api/auth/forgot-password: Yêu cầu đặt lại mật khẩu.
POST /api/auth/reset-password: Đặt lại mật khẩu mới.
POST /api/auth/google: Đăng nhập bằng Google.

## Restaurants (/api/restaurants)

GET /api/restaurants: Lấy danh sách nhà hàng.
GET /api/restaurants/featured: Lấy danh sách nhà hàng nổi bật.
GET /api/restaurants/categories/stats: Lấy thống kê danh mục.
GET /api/restaurants/:id: Lấy chi tiết nhà hàng theo ID.
POST /api/restaurants: Tạo nhà hàng mới (Admin).
PUT /api/restaurants/:id: Cập nhật thông tin nhà hàng (Admin).
DELETE /api/restaurants/:id: Xóa nhà hàng (Admin).

## Search (/api/search)

GET /api/search/advanced: Tìm kiếm nâng cao (Proxy gọi đến external service).

## Food Tours (/api/food-tours)
POST /api/food-tours: Tạo food tour mới.

## Contact (/api)
POST /api/about/contact: Gửi liên hệ từ trang About.
GET /api/admin/about/contact: Lấy danh sách liên hệ (Admin).

## System
GET /api/health: Kiểm tra trạng thái server.