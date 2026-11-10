# Hệ thống cho thuê thiết bị âm thanh

Bộ thiết kế SOA cho web thử nghiệm và vận hành thật. Ba dịch vụ Thuê, Kho thiết bị và Thanh toán dùng REST/JSON và ba database PostgreSQL riêng. Thiết kế tách local, staging và production.

- [Phân tích nghiệp vụ](docs/01-phan-tich.md)
- [Kiến trúc và hợp đồng API](docs/02-kien-truc-va-api.md) · [OpenAPI](contracts/openapi.json)
- [Phân công](docs/03-ke-hoach-va-phan-cong.md) · [Bản Word và từ điển dữ liệu](Phan-cong-cong-viec-SOA.docx)
- [Kế hoạch kiểm thử](docs/04-kiem-thu.md) · [Kế hoạch triển khai web](docs/06-trien-khai-web.md)

## Giai đoạn 1  Xem giao diện đăng nhập và đăng ký

Trên Windows, nhấp đúp [start.bat](start.bat). Tệp mở giao diện đăng nhập bằng trình duyệt mặc định. Bấm **Đăng ký** để chuyển sang biểu mẫu đăng ký và **Đăng nhập** để quay lại. Có thể mở trực tiếp [web/index.html](web/index.html).

Bản xem thử kiểm tra Gmail, các trường bắt buộc và mật khẩu ngay trên trang. Sau khi điền đăng ký hợp lệ, thông báo mô phỏng hiện ở mép trên rồi giao diện quay về Đăng nhập. Dùng dữ liệu mẫu vì biểu mẫu không gửi hoặc lưu thông tin. Có thể mở trực tiếp bằng trình duyệt. Các tài liệu SOA và OpenAPI ở trên mô tả các giai đoạn sau.
