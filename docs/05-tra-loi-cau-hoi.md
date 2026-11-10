# Trả lời 42 câu hỏi rà soát

1. **Phiếu riêng:** Chưa có thông tin xác nhận đã phát phiếu hay cách giảng viên giao đề tài. Hỏi trong hai ngày làm việc đầu; hết ngày thứ hai thì chốt G0 theo đề đã nhận nếu chưa có phiếu.
2. **Rubric:** Căn cứ hiện có là nội dung yêu cầu môn học bạn gửi. Chưa xác nhận đó là bảng chấm điểm chính thức. Nội dung cho phép REST/HTTP hoặc SOAP và không nêu bắt buộc queue, gateway, registry hay OpenAPI/WSDL. Ma trận 04 do nhóm chuyển yêu cầu thành ca kiểm thử.
3. **Stack:** Đề xuất Python 3.12, FastAPI/Pydantic, Uvicorn, PostgreSQL với ba database, SQLAlchemy, psycopg và Alembic, pytest/httpx và web HTML/CSS/JavaScript. Xác nhận lựa chọn tại G0.
4. **Mở rộng:** Cọc và phụ phí là khoản riêng ở Thanh toán. Phí trả muộn/hư hỏng cần bổ sung dữ liệu và phản hồi API hoàn trả cùng ca kiểm thử. Gia hạn cần kiểm tra lại lịch Kho; giao tận nơi cần địa chỉ, lịch giao và bằng chứng bàn giao ở Thuê.
5. **60/40:** Chưa xác nhận giảng viên chấp nhận tỷ lệ. Bạn sở hữu Thuê 35% và Thanh toán 25%. Thành viên 2 sở hữu Kho 40%. Mỗi phần gồm API, database, giao diện và kiểm thử thuộc dịch vụ.
6. **Chủ hợp đồng:** Bạn chịu trách nhiệm cuối về hợp đồng liên dịch vụ. Thành viên 2 rà soát phần Kho và xác nhận dữ liệu đủ cho web.
7. **Kiểm thử tích hợp:** Bạn sở hữu `tests/integration/` và chạy toàn bộ ma trận trước nộp. Thành viên 2 viết ca Kho và chạy lại bộ demo độc lập.
8. **Lịch Agile:** Đề xuất ba vòng 5 ngày làm việc sau G0. Mỗi vòng có demo và review. Definition of Done gồm hợp đồng, dữ liệu lưu, ca tự động, rà soát và minh chứng. Hạn nộp/demo chính thức chưa có, cần xác minh trước hết G0.
9. **Làm song song:** Bạn dùng stub Kho khi làm Thuê và bộ mô phỏng khi làm Thanh toán. Thành viên 2 dùng stub Thuê cho web và chạy Kho riêng. Dùng fixture theo hợp đồng chung rồi nối ba API thật cuối vòng 1.
10. **Tên thật:** Chưa có họ tên và MSSV. Nhãn tạm được giữ trong bản làm việc, cần điền thông tin thật trước khi nộp.
11. **Thời hạn thanh toán:** Thuê tính `expires_at = min(created_at + 15 phút, pickup_at)` và truyền sang Thanh toán. Đơn `ONLINE` có giờ nhận chưa qua nhưng cách thời điểm tạo dưới 15 phút trả `400 PICKUP_TOO_SOON`. Điều kiện này không áp dụng cho `PAY_ON_RECEIPT`. Hết hạn thì ẩn QR và đối soát trước khi trả lịch.
12. **Hủy QR:** Khách được yêu cầu hủy khi chờ tiền. Nếu xác nhận chưa thu, đóng đơn và trả lịch. Nếu đã thu, xử lý hoàn. Nếu chưa rõ, chờ đối soát.
13. **Không đến:** Hạn đến nhận là mốc sớm nhất trong giờ hẹn cộng 60 phút, hạn trả và giờ đóng cửa. Nhân viên đóng với lý do `NO_SHOW`; job tự động thuộc Could. Chỉ đóng lịch chưa giao, sau khi đối chiếu trạng thái giữ và trạng thái tiền.
14. **Lượt B không giao được:** Lưu sự kiện `HANDOVER_BLOCKED` và hiển thị trên chi tiết đơn. Nhân viên có thể hỗ trợ hủy, hoàn toàn bộ nếu đã thu hoặc đóng khoản phải thu nếu chưa thu.
15. **Tính quá hạn:** Tính khi đọc, từ lúc `now > due_at` và còn tài sản chưa hoàn trả. Kho áp dụng ngay khi tra khả dụng. Job hết hạn thanh toán/no-show là cơ chế riêng.
16. **Lịch tương lai:** Giữ phân bổ hiện có. Nhân viên kiểm tra và đổi tài sản cùng loại khi chuẩn bị bàn giao nếu tài sản thay thế đáp ứng kỳ thuê.
17. **Trả thiếu hoặc mất:** Khi bật Could, cho trả từng phần. Món đã về và đạt kiểm tra được mở lại ngay. Món chưa về vẫn ngoài kho; nhân viên có thể ghi `LOST` khi xác nhận mất. Lượt thuê chỉ đóng khi mọi món đã được xử lý.
18. **Giờ hoạt động:** Đề xuất 08:00–20:00 giờ Việt Nam. Không giao sớm. Khách đến trễ vẫn được giao trước hạn đến nhận nếu Kho đáp ứng.
19. **Ghi thực thu sau hoàn trả:** UC10 và API cùng cho phép với lượt `PAY_ON_RECEIPT` đã bàn giao, kể cả đã hoàn trả hoặc đóng do mất, miễn khoản phải thu còn mở.
20. **Phụ phí:** MVP không thu thêm vì trả muộn, mất hoặc hư hỏng. Vẫn ghi nhận thời lượng quá hạn và sự cố.
21. **Giá và đầu vào:** Kỳ thuê phải dài hơn 0 và tối đa 30 ngày. Tối thiểu tính một ngày, 25 giờ tính hai ngày. Trả `400 PICKUP_IN_PAST` hoặc `400 INVALID_RENTAL_PERIOD` tương ứng.
22. **Thất bại:** `failure` là kịch bản mô phỏng. Luồng SePay theo dõi giao dịch tiền vào; chưa thấy giao dịch thì tiếp tục chờ hoặc đóng sau hết hạn và đối soát.
23. **Xác thực webhook:** SePay hỗ trợ cả HMAC-SHA256 và API Key. Thiết kế demo chọn API Key qua `Authorization: Apikey <secret>`, nên ca kiểm thử kiểm tra khóa thiếu/sai. [Hướng dẫn SePay](https://docs.sepay.vn/tich-hop-webhooks.html)
24. **Máy nhận webhook:** Reverse proxy của môi trường thật chuyển webhook HTTPS tới Thanh toán. Hai thành viên dùng staging tách biệt với mô phỏng để nghiệm thu.
25. **Tài khoản ngân hàng:** Chưa xác nhận có tài khoản phù hợp. Mô phỏng chạy trên staging. Chỉ mở ONLINE thật sau khi xác nhận tài khoản, HTTPS và kiểm chứng thu/hoàn.
26. **Xác nhận hoàn:** Nhân viên dùng `POST /api/orders/{id}/confirm-refund` với số tiền và tham chiếu sau khi kiểm tra đã hoàn. Thuê kiểm quyền và chuyển sang Thanh toán.
27. **Giới hạn mô phỏng:** Chỉ bật bộ mô phỏng ở local/test với fixture riêng. Cấu hình thật từ chối trường mô phỏng và không cho client đổi nhà cung cấp.
28. **Nguồn số tiền:** Thuê lấy giá đã chốt từ Kho, gửi sang Thanh toán qua API nội bộ. MVP tin Thuê; Thanh toán lưu số tiền và đối chiếu giao dịch thực với số tiền đó.
29. **Phụ thuộc vòng:** Bỏ `payment-updated`. SePay gọi Thanh toán; Thuê đọc trạng thái đã lưu mỗi 5 giây với đơn đang chờ và thử lại nếu gián đoạn.
30. **Tài khoản:** Thuê sở hữu tài khoản, mật khẩu băm, phiên và vai trò. Khách tự đăng ký và chỉ nhận vai trò CUSTOMER. Quy trình cấp tài khoản nhân viên thuộc quản trị nội bộ.
31. **API nhân viên:** Có `GET /api/assets` để xem và lọc tài sản, kèm API mở lại sau bảo trì. Danh mục quản lý bằng seed trong MVP.
32. **Hai loại lịch:** Thuê quản lý cam kết với khách. Kho phân bổ tài sản theo mã đơn. `CONFIRMED` mà Kho `RELEASED` là sai lệch, phải chặn giao để kiểm tra lại hoặc hủy/hoàn.
33. **Hợp đồng:** Đã bổ sung trường request/response, nhóm lỗi, quy tắc `200/201/202/409` và phân trang. Bản nháp OpenAPI nằm trong `contracts/`, cần rà soát schema phản hồi chi tiết ở G0.
34. **Chuẩn hóa khóa lặp:** Quy đổi thời điểm về UTC, chuẩn hóa mã loại, từ chối loại lặp, sắp theo mã rồi so số lượng và phương thức. Cùng khóa khác nội dung trả `409`.
35. **Tuần tự hóa:** Thuê dùng khóa dòng PostgreSQL cho các transaction ngắn. Worker nhận việc bằng khóa hàng và lease, lưu bước chờ trước HTTP và đối soát sau khi khởi động lại.
36. **Múi giờ:** Lưu UTC. API nhận ISO 8601 có múi giờ. Hiển thị và kiểm tra giờ hoạt động theo `Asia/Ho_Chi_Minh`.
37. **Ca còn thiếu:** Đã bổ sung khởi động lại, kỳ không hợp lệ, phân quyền, thiếu khóa nội bộ, chưa thu trực tuyến, trả thiếu và hủy QR. Ca mất callback nội bộ đổi thành ca Thuê tạm thời không đọc được Thanh toán.
38. **HTTP status:** Ghi mã mong đợi ngay trong kế hoạch cho các ca gọi API. Ca thuần trạng thái hoặc job định kỳ kiểm bằng trạng thái lưu và API đọc sau xử lý.
39. **Bàn giao và hoàn trả:** Dùng “bàn giao” khi khách nhận, “hoàn trả” khi thiết bị về kho và “thanh toán khi nhận thiết bị” cho `PAY_ON_RECEIPT`.
40. **Thiết bị và trạng thái:** Dùng “bàn trộn âm thanh”. API dùng mã tiếng Anh; giao diện và diễn giải dùng nhãn tiếng Việt.
41. **UC09:** Đưa ra khỏi sơ đồ nghiệp vụ. Các ca mô phỏng nằm trong kế hoạch kiểm thử. Đã đánh số liên tục và cập nhật các tham chiếu.
42. **Biểu đồ:** Đã thêm nhánh hủy khi chờ tiền, đối soát trước giải phóng và nhánh trả thiếu chuyển `PARTIALLY_RETURNED`.
