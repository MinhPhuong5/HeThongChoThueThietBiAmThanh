# Hệ thống cho thuê thiết bị âm thanh

Bộ thiết kế SOA cho web thử nghiệm và vận hành thật. Ba dịch vụ Thuê, Kho thiết bị và Thanh toán dùng REST/JSON và ba database PostgreSQL riêng. Thiết kế tách local, staging và production.

- [Phân tích nghiệp vụ](docs/01-phan-tich.md)
- [Kiến trúc và hợp đồng API](docs/02-kien-truc-va-api.md) · [OpenAPI](contracts/openapi.json)
- [Phân công](docs/03-ke-hoach-va-phan-cong.md) · [Bản Word và từ điển dữ liệu](Phan-cong-cong-viec-SOA.docx)
- [Kế hoạch kiểm thử](docs/04-kiem-thu.md) · [Kế hoạch triển khai web](docs/06-trien-khai-web.md)

## Giai đoạn 1  Đăng ký và đăng nhập

Trên Windows, nhấp đúp [start.bat](start.bat). Launcher dùng Python và PostgreSQL đã cài trên máy. Nó kiểm tra ba bảng của database `rental`, khởi động FastAPI tại `http://127.0.0.1:8000` và mở trình duyệt. Giữ cửa sổ launcher mở khi dùng web.

Sao chép [.env.example](.env.example) thành `.env` ở thư mục gốc và điền `PGPASSWORD` một lần. Sửa `PGHOST`, `PGPORT`, `PGDATABASE` hoặc `PGUSER` nếu khác kết nối trong pgAdmin. `.env` được Git bỏ qua. Khi deploy, cấu hình các biến này qua phần biến môi trường hoặc secrets của máy chủ. Biến môi trường có ưu tiên cao hơn `.env`.

Chọn **Đăng ký** để tạo tài khoản khách bằng Gmail. Sau đăng ký, đăng nhập bằng tài khoản vừa tạo để mở `/home`. Nút **Đăng xuất** mở hộp xác nhận. Chọn **Ở lại** để tiếp tục hoặc xác nhận **Đăng xuất** để thu hồi phiên rồi quay về trang đăng nhập.
