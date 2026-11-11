# Ma trận kiểm thử đề xuất

## Giai đoạn 1  Đăng ký và đăng nhập

Đã kiểm tra trên PostgreSQL 18 tạm và Edge. Đăng ký Gmail hợp lệ tạo tài khoản khách, Gmail trùng trả `409` và mật khẩu sai trả `401`. Mật khẩu được lưu dưới dạng băm, cookie phiên có HttpOnly. Đăng nhập thành công mở trang chủ, đăng xuất thu hồi phiên. Thử lại token cũ hoặc truy cập trang chủ sau khi đăng xuất đều bị chặn.

Ma trận do nhóm đề xuất dựa trên yêu cầu môn học đã nhận, chưa phải bảng chấm điểm chính thức của giảng viên. Các mã HTTP dưới đây là kỳ vọng thiết kế, chưa phải kết quả chạy.

| Tiêu chí | Ca dự kiến | Kết quả mong đợi |
|---|---|---|
| Ba dịch vụ chạy riêng và có dữ liệu riêng | Khởi động ba tiến trình. Gọi API của từng dịch vụ và kiểm tra dữ liệu do dịch vụ đó sở hữu. | Mỗi tiến trình dùng một cổng. Dữ liệu nghiệp vụ của một dịch vụ được truy cập từ dịch vụ khác qua API. |
| Một quy trình phối hợp cả ba dịch vụ | Đặt nhiều thiết bị với thanh toán thành công. Đối chiếu lịch thuê, lượt giữ và khoản thu. | Lịch thuê được xác nhận, Kho giữ đủ thiết bị cho cả kỳ, số tiền khớp với danh sách thiết bị và thời lượng thuê. |
| Tái sử dụng dịch vụ trong nhiều quy trình | Đặt, bàn giao, hủy một lịch chưa giao và nhận trả một lượt đã giao. | Kho giữ lịch khi đặt, đánh dấu thiết bị đang thuê khi giao, giải phóng khi hủy và cập nhật tình trạng khi nhận trả. |
| Khả dụng theo kỳ | Cùng một bàn trộn âm thanh, thử giữ hai kỳ trùng nhau rồi thử hai kỳ nối tiếp. | Kỳ trùng bị chặn. Hai kỳ cách ít nhất 15 phút có thể đặt. Lượt sau chỉ được giao khi tài sản đã về và đạt kiểm tra. |
| Trả muộn ảnh hưởng lượt sau | A thuê bàn trộn âm thanh đến 17:00, B đã đặt từ 17:15. Đến 17:15 A chưa trả. | A hiện quá hạn. Kho chặn giao bàn trộn âm thanh cho B. Nếu bật Could, nhân viên chọn bàn trộn âm thanh cùng loại và Kho xác nhận đủ điều kiện để đổi tài sản và lưu đúng mã đã giao. |
| Tình trạng và phụ kiện | Nhận lại loa hoạt động tốt và micro hỏng hoặc thiếu bộ thu. Sau khi bổ sung/sửa, kiểm tra và mở lại micro. | Loa trở về khả dụng. Micro vào bảo trì và chỉ trở về khả dụng sau kiểm tra đạt. Biên bản lưu tình trạng từng tài sản. |
| Nhận trả khi còn khoản phải thu | Trả đầy đủ thiết bị của lượt thanh toán sau khi nhận nhưng chưa ghi nhận đã thu. | Lịch thuê ghi đã trả, Kho cập nhật đúng thiết bị, khoản phải thu vẫn mở để nhân viên xử lý. |
| Yêu cầu đồng thời | Hai khách cùng đặt bàn trộn cuối cho cùng ngày. | Một đơn được xác nhận, đơn còn lại hết hàng và không phát sinh thu. |
| Yêu cầu lặp | Gửi hai yêu cầu cùng khách, khóa và nội dung. Sau đó gửi lại khóa với nội dung khác. | Chỉ có một đơn, một lượt giữ và một khoản thu. Nội dung khác trả lỗi xung đột. |
| Lỗi giữa quy trình | Giả lập thanh toán từ chối sau khi Kho giữ thành công. | Đơn bị từ chối sau khi giải phóng giữ, số lượng khả dụng trở về mức ban đầu. |
| Webhook hợp lệ | Gửi tiền vào trong hạn, đúng mã, tài khoản và số tiền. | `201`, giao dịch ghi một lần; Thuê xác nhận qua polling. |
| Webhook lặp | Gửi lại cùng ID giao dịch. | `201`, số bản ghi và tác động không tăng. |
| Webhook thiếu khóa | Bỏ header xác thực. | `401 INVALID_WEBHOOK_AUTH`, không ghi giao dịch. |
| Webhook sai khóa | Gửi header `Apikey` với khóa khác cấu hình. | `401 INVALID_WEBHOOK_AUTH`, không ghi giao dịch. |
| Webhook sai tiền | Mã đúng nhưng số tiền lệch. | `201`, ngoại lệ hiển thị, đơn không xác nhận. |
| Giao dịch ngoài 15 phút | Thời điểm ngân hàng đúng mốc hết hạn hoặc sau mốc, yêu cầu chưa đóng. | HTTP `201`, lý do `OUT_OF_WINDOW` trong dữ liệu ngoại lệ; đơn không xác nhận. |
| Webhook sau khi đóng | Thời điểm ngân hàng trong hạn nhưng webhook đến sau khi đã đóng. | `201`, ngoại lệ `AFTER_CLOSE`, đơn không mở lại. |
| Webhook trễ trước khi đóng | Thời điểm ngân hàng trong hạn, webhook đến lúc đang đối soát hết hạn. | `201`; đơn chỉ xác nhận nếu lịch còn hiệu lực và chưa quá hạn đến nhận. |
| Phản hồi chậm | Giả lập webhook đến muộn hoặc gián đoạn sau khi đã ghi giao dịch. Gọi đối soát theo mã đơn. | Đơn giữ trạng thái chờ cho đến khi tìm được kết quả. Sau đối soát, đơn tiếp tục đúng bước và không phát sinh khoản thu trùng. |
| Thanh toán sau khi nhận | Tạo đơn, thử ghi nhận trước giao, bàn giao rồi xác nhận đã thu hai lần. | Đơn có thể được giao khi khoản phải thu còn mở. Chỉ ghi nhận thu sau giao, một lần duy nhất. Luồng không phát sinh yêu cầu tới SePay. |
| Hủy theo trạng thái | Hủy lúc QR còn hiệu lực, hủy lịch đã xác nhận hoặc thử hủy sau bàn giao. | `202` khi chờ đối soát/hoàn, `200` khi đã hủy, `409` nếu đã bàn giao. |
| Phân quyền và giao diện | Khách mở đơn của người khác. Nhân viên giao, nhận trả. | Khách chỉ xem được đơn của mình. Nhân viên thao tác đúng quyền và có thể demo trên giao diện. |
| Biên thời gian và giá | Giờ nhận trong quá khứ, hạn trả không sau giờ nhận, giờ nhận hoặc hạn trả ngoài giờ. Ca thuê 25 giờ dùng 09:00 ngày 1 đến 10:00 ngày 2, giờ Việt Nam. | Ba nhóm đầu vào sai trả `400` theo mã tương ứng. Ca 25 giờ tính hai ngày. |
| Giờ nhận trực tuyến quá gần | Với đồng hồ cố định, đặt `ONLINE` trước giờ nhận 5 phút. Lặp ca với `PAY_ON_RECEIPT` và cùng điều kiện kho. | `ONLINE` trả `400 PICKUP_TOO_SOON` trước khi giữ kho. `PAY_ON_RECEIPT` vẫn được tiếp nhận nếu hợp lệ. |
| Hạn QR đúng biên | Đặt `ONLINE` đúng 15 phút trước giờ nhận, rồi gửi lại cùng khóa. | Chấp nhận đơn. Hạn QR bằng giờ nhận và giữ nguyên khi gửi lại. |
| Trả thiếu khi tắt Could | Gửi biên bản thiếu một tài sản đã bàn giao. | `409 INCOMPLETE_RETURN`; trạng thái đơn và tài sản không đổi. |
| Giới hạn đơn trực tuyến đang chờ | Cùng khách gửi đơn trực tuyến thứ hai bằng khóa mới khi đơn đầu còn giữ lịch và chờ thanh toán hoặc đóng. | `409 ACTIVE_ONLINE_ORDER_LIMIT`; không phát sinh lượt giữ thứ hai. |
| Bàn giao trước giờ nhận | Nhân viên gọi bàn giao khi `now < pickup_at`. | `409 HANDOVER_TOO_EARLY`; không xuất kho. |
| Bàn giao từ hạn đến nhận | Gọi bàn giao đúng hạn đến nhận và sau hạn, khi đơn vẫn còn xác nhận. | `409 HANDOVER_WINDOW_CLOSED`; không xuất kho. |
| No-show quá sớm | Nhân viên gửi `reason=NO_SHOW` trước hạn đến nhận. | `409 NO_SHOW_TOO_EARLY`; đơn, lịch giữ và trạng thái tiền không đổi. |
| Ngoại lệ đã hoàn thủ công · Should | Nhân viên gửi `REFUNDED_MANUALLY` kèm tham chiếu hoàn cho giao dịch ngoại lệ. | `200`, ghi quyết định và tham chiếu; không xác nhận hay mở lại đơn. |
| Ngoại lệ không liên quan · Should | Nhân viên gửi `UNRELATED` kèm lý do cho giao dịch không liên quan đến đơn. | `200`, lưu lý do; không thay đổi đơn hoặc khoản thuê. |
| Mô phỏng chậm qua polling | Dùng `simulation_scenario=slow`, đồng hồ cố định và không gọi đối soát chủ động. | Trước 20 giây đơn vẫn `PAYMENT_PENDING`; từ mốc 20 giây, lượt polling tiếp theo đọc kết quả và chuyển `CONFIRMED`. |
| Xác thực và vai trò | Không token, khách gọi bàn giao, không khóa nội bộ, đọc đơn người khác. | Lần lượt `401`, `403`, `401`, `404`. |
| Bàn giao khi chưa thu trực tuyến | Nhân viên cố giao khi Thanh toán chưa xác nhận. | `409 PAYMENT_REQUIRED`; tài sản không chuyển sang đang thuê. |
| Hoàn trả từng phần và mất · Could | Hoàn trả một trong hai tài sản, gửi lặp biên bản, xác nhận tài sản còn thiếu đã mất. | `200 PARTIALLY_RETURNED`, không cập nhật lần hai; xác nhận mất `200 CLOSED_WITH_LOSS` và Kho ghi `LOST`. |
| Giữ chỗ hết hạn/no-show | Qua mốc 15 phút hoặc hạn đến nhận; thử cả trạng thái tiền chưa rõ và đã thu. | Job hết hạn QR hoặc thao tác no-show của nhân viên ghi trạng thái chờ khi chưa rõ; xác nhận chưa thu thì trả lịch. No-show đã thu vào luồng hoàn. API chi tiết trả `200` với trạng thái tương ứng. |
| Khởi động lại và polling lỗi | Dừng Thuê sau khi Kho hoặc Thanh toán ghi thành công. Khởi động lại, mô phỏng một lần GET Thanh toán lỗi rồi phục hồi. | Giữ bước chờ; API chi tiết trả `200` với trạng thái lưu. Job hoặc đối soát `202` khi chưa rõ, sau phục hồi ghi đúng một lần. |
| Chặn giả lập trên cấu hình thật | Gửi trường mô phỏng trong API tạo đơn ở môi trường thật. | `400`, không tạo khoản thu giả. |
| Hủy đơn trực tuyến đã thu | Hủy rồi nhân viên gọi `confirm-refund`, gửi lại cùng khóa. | `202 REFUND_PENDING`, sau xác nhận `200 CANCELLED`, chỉ một bản ghi hoàn. |
| Bàn giao bị chặn rồi hủy | Thiếu một món trong bộ đã thanh toán, sau đó hủy và xác nhận hoàn. | Bàn giao `409`, có sự kiện `HANDOVER_BLOCKED`, không món nào xuất kho. Hủy `202`, xác nhận hoàn `200`. |
| Báo mất gửi lặp · Could | Gọi `mark-loss` hai lần cùng mã và một lần đổi nội dung. | Hai lần đầu `200`, một biến động. Lần đổi trả `409 OPERATION_CONFLICT`. |
| Thay khác loại · Could | Nhân viên chọn tài sản khác loại. | `409 ASSET_TYPE_MISMATCH`, giữ nguyên phân bổ. |
| Tranh no-show, hủy và giao · Could | Kích hoạt ba thao tác quanh hạn đến nhận. | Tối đa một quyết định thay đổi trạng thái; thao tác thua `409` hoặc đọc lại trạng thái đã lưu. Không vừa xuất kho vừa trả lịch. |
| Lệch trạng thái giữ | Tạo fixture Thuê `CONFIRMED`, Kho `RELEASED`, thử bàn giao. | `409`, lưu sự kiện bị chặn và giữ dữ liệu cho đối soát. |
| Danh sách tài sản | Gọi với khách, rồi nhân viên dùng hai trang và bộ lọc. | Khách `403`. Nhân viên `200`, trang không trùng và tổng khớp. |
| Bảo trì chưa đạt | Gửi kết quả chưa đạt khi mở lại tài sản. | `409`, tài sản vẫn `MAINTENANCE` và không xuất hiện trong ứng viên. |

Với các ca phía trên có nhiều bước, tra cứu hoặc tải danh sách trả `200`; đặt mới đã xử lý trả `201`, đặt còn chờ `202`, lặp đã xử lý `200` và lặp khác nội dung `409`. Tranh thiết bị cuối trả `409 ASSET_UNAVAILABLE` cho yêu cầu thua. Bàn giao bị chặn bởi lượt trả muộn trả `409`; ghi thực thu, mở lại tài sản và xác nhận hoàn thành công trả `200`. Khi API chưa xác nhận được thao tác đã lưu, trả `202`.

Khi phát triển, mỗi ca cần ghi dữ liệu đầu vào, trạng thái trước/sau, HTTP status và minh chứng chạy. Các tình huống riêng từ phiếu đề tài cần được bổ sung vào ma trận khi có nội dung chính thức.

## Nghiệm thu web staging và production

Chạy tích hợp trên PostgreSQL cùng phiên bản với production. Dùng database sạch qua Alembic cho mỗi đợt và đo trên staging HTTPS. Các ca dưới đây là kế hoạch, chưa có kết quả đo.

| Ca | Điều kiện đạt |
|---|---|
| Migration và quyền database | Ba database khởi tạo từ trống. Role ứng dụng của mỗi dịch vụ bị từ chối khi kết nối database của dịch vụ khác hoặc chạy DDL. |
| Hai worker cùng xử lý | Hai instance nhận công việc, một instance mất lease giữa bước. Kết quả cũ không ghi đè kết quả mới. Không thu, hoàn hoặc giữ trùng. |
| Tranh lịch trên PostgreSQL | Hai transaction đặt cùng tài sản trong cửa sổ chồng nhau, kể cả phần đệm. Một yêu cầu thắng, yêu cầu thua trả `409 ASSET_UNAVAILABLE`. Hai tài sản độc lập không khóa lẫn nhau. |
| Tài khoản thật và phiên | Nhân viên cấp khách, đổi mật khẩu tạm, đăng xuất và reset. Phiên cũ bị thu hồi, người khác không xem được đơn. Staging có seed, production không có tài khoản mẫu. |
| HTTPS và tuyến nội bộ | Gọi từ Internet chỉ tới UI, API công khai và webhook. Đường nội bộ không truy cập được. Webhook sai xác thực trả `401`. |
| Tải bình thường và spam | Chạy tải tăng dần có đọc danh mục, tạo đơn, polling, tranh tài sản và gửi lặp. Ghi RPS, tỷ lệ đọc/ghi, p95, `429`, `5xx` và mức sử dụng pool. Spam bị hạn chế với `429` và `Retry-After`. Không đặt chồng hoặc thu trùng. Chốt ngưỡng phát hành sau khi có số đo baseline và dự báo tải thực. |
| Sao lưu và khôi phục | Khôi phục cả ba database sang môi trường cô lập. Đối chiếu đơn, lượt giữ và giao dịch theo mã. Ghi lại thời gian khôi phục và cách xử lý sai lệch. |
| Đóng hoặc mở ONLINE thật | Khi chưa được bật, API trả `503 ONLINE_UNAVAILABLE` và không giữ thiết bị. Khi bật, giao dịch được phép xác nhận đúng một lần, webhook lặp không tạo thu mới, hoàn thủ công lưu tham chiếu. |
