# 🏫 UniStudy - Hệ Thống Đặt Phòng Học Trực Tuyến & Chống Xung Đột Đồng Thời (Realtime Study Room Booking)

Ứng dụng đặt phòng học thông minh được xây dựng với **React (TypeScript) + Node.js (Express) + Socket.io + SQLite (WAL Mode & ACID Transactions)**, giải quyết triệt để bài toán **Race Condition / Concurrency Conflict (2 người cùng đặt 1 phòng trong cùng một thời điểm)**.

---

## ✨ Tính Năng Nổi Bật

1. **Khám Phá & Bộ Lọc Phòng Học Đa Tham Số:**
   * Xem phòng theo **Ngày** và **Ca học cố định** (Ca 1 đến Ca 6).
   * Lọc theo **Vị trí (Tầng 1, Tầng 2, Tầng 3)**.
   * Lọc theo **Kích cỡ sức chứa** (2-4 người, 5-8 người, 9-15 người, >15 người).
   * Lọc theo trạng thái (*Chỉ hiện phòng còn trống* / *Phòng bảo trì*).
   * Tìm kiếm từ khóa theo tên phòng hoặc mã phòng (`P.101`, `R-102`...).
   * Thẻ phòng hiển thị đầy đủ: Ảnh chụp sắc nét, mã phòng, tầng, sức chứa, mô tả và trạng thái thời gian thực.

2. **Cơ Chế Giải Quyết Concurrency Conflict (Mức 2):**
   * **Database Constraint**: `UNIQUE(room_id, booking_date, slot_id) WHERE status = 'CONFIRMED'`.
   * **ACID Transaction**: Xử lý đặt phòng nguyên khối (atomic). Người bấm trước commit thành công (`201 Created`); người bấm sau lập tức nhận mã lỗi `409 Conflict` kèm thông báo thân thiện.
   * **WebSocket Realtime Live Sync**: Khi có người đặt hoặc hủy phòng, Server broadcast sự kiện qua Socket.io. Thẻ phòng trên màn hình tất cả người dùng khác tự động đổi trạng thái và vô hiệu hóa nút đặt ngay lập tức mà không cần F5.

3. **Nghiệp Vụ Đặt & Hủy Phòng Chuẩn:**
   * **Giới hạn ca học:** 1 sinh viên tối đa **3 ca học / ngày**.
   * **Quy tắc hủy phòng 3 tiếng:** Chỉ được phép hủy phòng trước giờ bắt đầu ca học **tối thiểu 3 tiếng**. Nếu dưới 3 tiếng, hệ thống tự động khóa nút hủy.
   * Khi hủy phòng thành công, khung giờ lập tức mở lại realtime cho người khác đặt.

4. **Trang Quản Trị Admin (Admin Dashboard):**
   * Thống kê tổng số phòng, phòng sẵn sàng, phòng bảo trì, tổng lượt đặt trong ngày và toàn thời gian.
   * Quản lý phòng: Thêm phòng mới, sửa thông tin, bật/tắt chế độ bảo trì, xóa phòng.
   * Quản lý lịch đặt toàn trường: Xem tất cả các lượt đặt của sinh viên, lọc theo ngày/trạng thái và quyền can thiệp hủy lịch khi cần.

5. **Trang Cá Nhân (Profile) & Lịch Sử Đặt Phòng:**
   * Hiển thị thông tin sinh viên: Họ tên, Email, MSSV, Khoa, SĐT.
   * Lịch sử phân chia theo 3 tab rõ ràng: *Sắp tới*, *Đã hoàn thành*, *Đã hủy*.
   * Nút hủy phòng thông minh gắn liền quy định 3 tiếng.

---

## 👥 Danh Sách Tài Khoản Mẫu (Pre-seeded Accounts)

Bạn có thể đăng nhập bằng các tài khoản mẫu dưới đây hoặc tự bấm **Đăng ký** tài khoản mới:

| Vai trò | Họ tên | Email | Mật khẩu | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Ban Quản Trị Thư Viện | `admin@studyroom.edu.vn` | `admin123` | Quản lý phòng & toàn bộ lịch đặt |
| **Sinh viên 1** | Nguyễn Văn An | `nguyenan@studyroom.edu.vn` | `user123` | Dùng để đặt phòng / hủy phòng |
| **Sinh viên 2** | Trần Thị Bình | `tranthib@studyroom.edu.vn` | `user123` | Dùng để test tranh chấp phòng với SV1 |

---

## 🧪 Hướng Dẫn Tự Test Kịch Bản 2 Người Cùng Đặt 1 Phòng (Race Condition)

1. Mở trình duyệt thường tại: `http://localhost:5173`
   * Bấm **Đăng Nhập** -> Nhập email `nguyenan@studyroom.edu.vn`, mật khẩu `user123`.
2. Mở thêm 1 cửa sổ **Ẩn danh (Incognito Window)** hoặc trình duyệt khác tại: `http://localhost:5173`
   * Bấm **Đăng Nhập** -> Nhập email `tranthib@studyroom.edu.vn`, mật khẩu `user123`.
3. Cả 2 tab cùng chọn cùng 1 **Ngày** và cùng 1 **Ca học** (ví dụ: Ca 3 hôm nay).
4. Tìm một phòng còn trống (ví dụ: `P.101` hoặc `P.102`):
   * Cả 2 cùng bấm **"Đặt phòng ngay"** để mở Popup xác nhận.
   * Tab 1 (Nguyễn Văn An) bấm **"Xác Nhận Đặt Phòng"**.
   * Ngay tức khắc, tab 2 (Trần Thị Bình) sẽ nhận thông báo realtime và thẻ phòng đổi sang màu xám *"Đã có người đặt"*.
   * Nếu Trần Thị Bình vẫn kịp bấm xác nhận trong cùng 1 giây, Backend Transaction sẽ trả về thông báo lỗi **409 Conflict**: *"Rất tiếc! Phòng và khung giờ này vừa có người hoàn tất đặt trước bạn vài giây..."* và tuyệt đối không bao giờ bị trùng lịch.

---

## 🚀 Cách Chạy Ứng Dụng

Hệ thống hỗ trợ cả **Web App** và **Mobile App (Expo Go)** kết nối chung 1 backend:
* **Web Frontend:** `http://localhost:5173`
* **Mobile App (Expo Go):** `exp://10.60.46.152:8081`
* **Backend API & Realtime Socket:** `http://localhost:5000` (hoặc `http://10.60.46.152:5000`)

### Lệnh chạy từng phần:
```bash
# 1. Chạy Backend (Express + Socket.io + SQLite)
npm run server

# 2. Chạy Web Frontend (React + Vite)
npm run client

# 3. Chạy Mobile App (Expo Metro Bundler)
npm run mobile
```

---

## 📱 Hướng Dẫn Mở App Trên Điện Thoại Bằng Expo Go

1. Đảm bảo điện thoại của bạn kết nối **cùng mạng Wi-Fi** với máy tính.
2. Mở ứng dụng **Expo Go** trên điện thoại:
   * **Cách 1:** Nhập trực tiếp địa chỉ: `exp://10.60.46.152:8081` (mục *Enter URL manually*).
   * **Cách 2:** Quét mã QR xuất hiện trên terminal khi chạy `npm run mobile`.
3. Trải nghiệm đầy đủ 4 tab:
   * 🔍 **Đặt Phòng:** Cuộn ngang chọn Ngày & Ca học, lọc tầng, chạm đặt phòng realtime kèm rung Haptic.
   * 📅 **Lịch Sử:** Theo dõi phòng đã đặt, quy tắc hủy phòng 3 tiếng.
   * 👤 **Cá Nhân:** Quản lý thông tin tài khoản sinh viên.
   * 🛡️ **Quản Trị (Admin):** Thống kê, bật/tắt bảo trì phòng học, duyệt hủy lịch toàn trường.
