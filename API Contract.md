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






Các thư viện để tạo FE cho Admin
Để tạo giao diện Admin chuyên nghiệp hiện tại, mình đã sử dụng kết hợp các công nghệ sau:

React (v18): Thư viện cốt lõi để xây dựng giao diện người dùng (đã có sẵn trong dự án).
Tailwind CSS (v4): Framework CSS ưu tiên tiện ích (utility-first) phiên bản mới nhất. Giúp thiết kế nhanh, nhất quán và dễ tùy chỉnh chủ đề (theme).
Sử dụng @tailwindcss/postcss để tích hợp với quy trình build.
Lucide React: Bộ icon hiện đại, nhẹ và rất đẹp (thay thế cho các icon cũ hoặc SVG thủ công). Đây là thư viện mình đã cài thêm.
Font Inter (Google Fonts): Phông chữ sans-serif hiện đại, rất phổ biến cho các giao diện dashboard/admin nhờ tính dễ đọc và sạch sẽ.
Vite: Công cụ build tool siêu tốc (đã có sẵn).