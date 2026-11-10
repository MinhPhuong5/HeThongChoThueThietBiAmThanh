# Triển khai web thử nghiệm và vận hành thật

Đây là thiết kế triển khai. Các bước bên dưới là điều kiện nghiệm thu cần thực hiện sau khi viết ứng dụng. Lần triển khai đầu dành cho một điểm cho thuê. Khách tự đăng ký với vai trò CUSTOMER.

## Môi trường

| Môi trường | Cấu hình | Dữ liệu và thanh toán |
|---|---|---|
| Local | Docker Compose chạy ba dịch vụ và PostgreSQL. Mỗi dịch vụ có Alembic migration riêng. | Seed tài khoản, thiết bị và thanh toán mô phỏng. |
| Staging | Tên miền HTTPS riêng, cùng phiên bản PostgreSQL và cấu trúc triển khai với production. | Dữ liệu giả và provider mô phỏng. Tách database, tài khoản, bí mật và endpoint với production. |
| Production | Tên miền HTTPS, reverse proxy, ba ứng dụng, worker điều phối và PostgreSQL lưu bền vững. Chọn PostgreSQL được quản lý hoặc máy chủ riêng có sao lưu và giám sát. | Tài sản, tài khoản và thanh toán thật. Bật ONLINE sau khi kiểm chứng SePay. |

## Mạng và dữ liệu

- Reverse proxy chỉ công khai giao diện, `/api/` và `POST /webhooks/sepay`. Các đường dẫn `/internal/`, migration, health nội bộ và PostgreSQL nằm trong mạng riêng. Giới hạn kích thước request, đặt timeout và dùng bí mật nội bộ theo dịch vụ. Một origin cho web và API trình duyệt.
- PostgreSQL dùng ba database `rental`, `inventory`, `payment`. Tách role chạy ứng dụng khỏi role migration và giới hạn quyền kết nối. Dùng `UUID` hoặc `BIGINT` cho định danh, `TIMESTAMPTZ` cho thời điểm, `BIGINT` cho VNĐ, `INTEGER` cho số lượng, `BOOLEAN` cho cờ và `JSONB` cho chi tiết có cấu trúc biến đổi. Mỗi ứng dụng có giới hạn connection pool. Tổng kết nối phải nằm trong ngân sách của cụm.
- Mỗi bản phát hành chạy migration một lần với role riêng, kiểm tra readiness và triển khai theo từng dịch vụ. Sao lưu định kỳ cả ba database, kiểm thử khôi phục trong môi trường cô lập và đối soát đơn, lượt giữ, giao dịch sau khi phục hồi. Ghi nhận thời điểm khôi phục của từng database. Không mở lại ghi mới nếu còn sai lệch tiền hoặc thiết bị cần xử lý.

## Chống spam và ghi đồng thời

- Đặt hạn mức theo IP ở reverse proxy, thêm hạn mức theo tài khoản cho tạo đơn và thử đăng nhập tại Thuê bằng bộ đếm nguyên tử dùng chung. Dùng `429` và `Retry-After`. Điều chỉnh ngưỡng sau kiểm thử tải. Webhook có giới hạn riêng và chống lặp theo ID giao dịch.
- Dùng khóa duy nhất cho idempotency, một đơn trực tuyến đang giữ lịch trên mỗi khách, khóa dòng khi đổi trạng thái, và exclusion constraint cho lịch tài sản chồng nhau. Giao dịch database kết thúc trước khi gọi HTTP. Worker lưu bước chờ và tiếp tục theo lease. [Kiểm soát khóa dòng PostgreSQL](https://www.postgresql.org/docs/current/sql-select.html) · [Ràng buộc khoảng thời gian](https://www.postgresql.org/docs/current/rangetypes.html#RANGETYPES-CONSTRAINT)
- Theo dõi độ trễ p95, số `429`/`5xx`, mức sử dụng pool, công việc quá hạn lease, đơn chờ đối soát và thời gian kể từ webhook hợp lệ cuối. Báo động theo ngưỡng xác định sau lần chạy staging đầu. Dùng mã truy vết qua ba dịch vụ và lược dữ liệu cá nhân, bí mật, mật khẩu, token khỏi log.

## Mở thanh toán thật

1. Chủ dịch vụ Thanh toán xác nhận tài khoản nhận, cấu hình mã và endpoint HTTPS, bật xác thực webhook, thiết lập retry theo cấu hình SePay và kiểm tra gửi thử. [Hướng dẫn webhook SePay](https://docs.sepay.vn/tich-hop-webhooks.html)
2. Production chạy bằng provider thật. Chặn dữ liệu seed và trường mô phỏng. Nếu chưa nghiệm thu ONLINE, web ẩn phương thức này và API trả `503 ONLINE_UNAVAILABLE`. Khách vẫn có thể chọn thanh toán khi nhận thiết bị nếu nghiệp vụ đã nghiệm thu.
3. Thử giao dịch giá trị nhỏ có phép của nhóm, đối chiếu tài khoản nhận, mã và số tiền. Kiểm tra webhook gửi lặp, luồng mất webhook và tra cứu giao dịch. Kiểm chứng quy trình hoàn thủ công và lưu tham chiếu ngân hàng. Chỉ mở ONLINE cho khách sau khi các bước này đạt.
4. Khi sự cố chưa rõ kết quả tiền, giữ bước chờ, hiển thị hướng dẫn và tra cứu trước khi gửi lại hoặc giải phóng thiết bị. Nhân viên có danh sách ngoại lệ để xử lý tiền đến muộn hoặc lệch số tiền. Ghi nhận ai thao tác và thời điểm.

## Điều kiện mở web cho khách

- Có domain, TLS, thông tin vận hành và cách liên hệ khi có sự cố. Kiểm tra tự đăng ký khách, quyền truy cập và đổi mật khẩu. Kiểm chứng việc cấp tài khoản nhân viên trước khi mở các thao tác nội bộ. Tài khoản demo chỉ có ở môi trường thử.
- Ca Must chạy với PostgreSQL thật, hai lần chạy độc lập từ bản dựng sạch. Staging vượt bài kiểm thử tải đã thống nhất và không ghi trùng tiền, đặt chồng thiết bị hoặc mất lịch sau khởi động lại.
- Có minh chứng phục hồi database và hướng dẫn rollback. Số liệu tải phải ghi kèm cấu hình máy, lượng request/giây, tỷ lệ đọc/ghi, độ trễ và tỷ lệ lỗi. Chưa công bố năng lực phục vụ trước khi đo.
- Với ONLINE, hoàn tất quy trình kiểm chứng SePay và hoàn tiền phía trên. Thiếu domain, hạ tầng, thông tin xác thực hoặc phê duyệt giao dịch thật thì giữ tính năng ở staging hoặc đóng ONLINE ở production.
