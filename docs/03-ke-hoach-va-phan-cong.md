# Kế hoạch, phân công và minh chứng

## 1. Cách phát triển

Chọn **Agile theo vòng lặp ngắn**. Chốt trước phạm vi môn học, quyền, dữ liệu từng dịch vụ, hợp đồng API và tiêu chí demo. Sau đó tích hợp một lát cắt nghiệp vụ chạy qua cả ba dịch vụ, kiểm thử tình huống lỗi, rồi hoàn thiện UI và bộ nộp. Cách này phù hợp vì phần khó nằm ở hành vi khi các dịch vụ giao tiếp và có thể kiểm tra sớm bằng một luồng chạy. Waterfall phù hợp hơn nếu đề tài và hợp đồng đã cố định đầy đủ, nhưng dễ dồn kiểm thử tích hợp về cuối nếu nhóm bàn giao từng tầng riêng.

| Giai đoạn | Đầu ra và điều kiện qua giai đoạn | Tình trạng |
|---|---|---|
| **G0 · Chốt phạm vi** | Phân công, use case, quy tắc, hợp đồng, dữ liệu từng dịch vụ. Đối chiếu từng yêu cầu riêng của đề tài với tiêu chí kiểm thử. | Thiết kế cơ sở đã có. Còn đối chiếu phiếu riêng nếu môn học có phát hành. |
| **G1 · Lát cắt đặt thuê** | Ba tiến trình và ba cơ sở dữ liệu. Chạy luồng trực tuyến với bộ mô phỏng và luồng thanh toán sau khi nhận với xác nhận của nhân viên. | Dự kiến sau khi chốt thiết kế. |
| **G2 · Vòng đời thiết bị và thanh toán thực** | Bàn giao theo mã tài sản, nhận trả, xử lý trả muộn và thiết bị bảo trì. Tích hợp SePay cho nhánh trực tuyến và kiểm thử webhook chậm/trùng. | Dự kiến sau khi luồng chính chạy xuyên ba dịch vụ. |
| **G3 · Nghiệm thu và nộp** | Chạy theo hướng dẫn trên máy của cả hai thành viên, diễn tập demo, đính kèm minh chứng Git và tự đánh giá thật. Hoàn thiện yêu cầu từ phiếu riêng nếu có. | Dự kiến sau khi đạt tiêu chí kiểm thử. |

## 2. Chia 60/40

Đây là tỷ lệ kế hoạch theo yêu cầu của nhóm. Việc giảng viên có chấp nhận cách chia này hay không chưa được xác nhận. Dùng tên vai trò tạm trong tài liệu, điền họ tên thật và MSSV trước khi nộp.

Chia theo quyền sở hữu trọn gói. Mỗi người làm nghiệp vụ, database, API, giao diện thuộc dịch vụ, migration và ca kiểm thử của phần mình. Người còn lại rà soát hợp đồng và diễn tập chéo.

| Người | Dịch vụ | Điểm | Đầu ra |
|---|---|---:|---|
| Bạn | Thuê | 35 | Tài khoản, phân quyền, lịch thuê, biên bản, điều phối worker, giao diện Thuê, tích hợp và nghiệm thu xuyên dịch vụ. |
| Bạn | Thanh toán | 25 | Hai phương thức, mô phỏng, SePay, đối soát, giao diện QR và thu/hoàn, kiểm chứng ONLINE. |
| Thành viên 2 | Kho thiết bị | 40 | Danh mục, tài sản, giữ lịch, kiểm tra giao/trả, bảo trì, giao diện Kho, kiểm thử tranh tài sản và dữ liệu mẫu Kho. |

Bạn chủ trì cấu hình HTTPS, quy trình chạy migration và checklist phát hành. Mỗi chủ dịch vụ chịu trách nhiệm readiness, migration và xử lý lỗi của dịch vụ mình. Cả hai chạy staging, diễn tập phục hồi và xác nhận sẵn sàng trước khi mở production.

## 3. Minh chứng và tự đánh giá

Mỗi hạng mục cần một người chịu trách nhiệm, người còn lại rà soát hợp đồng hoặc chạy kiểm thử liên quan. Khi nộp, thay các ô dưới đây bằng dữ liệu có thật của nhóm. Tỷ lệ tự đánh giá phản ánh đóng góp thực tế sau nghiệm thu.

| Thành viên | Tỷ lệ kế hoạch | Issue/commit/PR hoặc tài liệu do mình thực hiện | Minh chứng chạy | Tự đánh giá thực tế |
|---|---:|---|---|---|
| Bạn | 60% | Điền mã và phạm vi thay đổi | Điền log, ảnh hoặc mục demo | Điền kết quả, phần đã bàn giao và phần còn vướng |
| Thành viên 2 | 40% | Điền mã và phạm vi thay đổi | Điền log, ảnh hoặc mục demo | Điền kết quả, phần đã bàn giao và phần còn vướng |

## 4. Mốc tương đối và điều kiện hoàn thành

- Ngày 1 là ngày nhóm bắt đầu. Đến cuối ngày làm việc thứ hai, xác minh phiếu đề tài, rubric và lịch nộp/demo với giảng viên. Nếu chưa có phiếu, chốt G0 theo yêu cầu đã nhận và đưa yêu cầu mới vào backlog khi có xác nhận. Hạn nộp/demo chính thức chưa được cung cấp.
- Sau G0, đề xuất ba vòng 5 ngày làm việc. Vòng 1 đưa luồng giữ lịch và thanh toán mô phỏng lên demo. Vòng 2 thêm bàn giao, trả từng phần, quá hạn và kiểm thử lỗi. Vòng 3 hoàn thiện đối soát, SePay và bộ nộp. Mỗi vòng review một luồng chạy được và điều chỉnh ưu tiên vòng sau. G0–G3 là mốc nghiệm thu, công việc Kho, Thuê, Thanh toán và web chạy song song theo hợp đồng.
- Trong G0, bạn chốt schema và fixture chung. Bạn dùng stub Kho để làm Thuê, kiểm thử Thanh toán bằng giao dịch mô phỏng. Thành viên 2 dựng Kho riêng và dùng stub Thuê cho web. Cuối vòng 1 thay stub bằng API thật của ba dịch vụ; bộ mô phỏng thanh toán vẫn dùng cùng hợp đồng.
- Definition of Done: hợp đồng và quy tắc cập nhật, API chạy với dữ liệu lưu được, ca thành công và lỗi liên quan qua tự động, thành viên kia rà soát, có bước demo và bằng chứng trước/sau. G3 yêu cầu cả hai chạy local bằng mô phỏng.
- Demo môn học dùng staging với mô phỏng. Production ONLINE chỉ mở sau khi chốt tài khoản nhận, HTTPS, kiểm chứng thu/hoàn và đủ điều kiện phát hành. Nếu thiếu điều kiện, production chỉ mở phương thức thanh toán khi nhận sau nghiệm thu.

## 5. Ưu tiên trong 17 ngày làm việc

| Tầng | Phạm vi |
|---|---|
| **Must** | Ba dịch vụ, lịch theo tài sản và đệm kiểm tra, tra cứu/đặt, hai phương thức thanh toán, mô phỏng ba tình huống, chống lặp và tranh thiết bị, QR hết hạn và đối soát, hủy/hoàn thủ công, bàn giao đủ bộ, hoàn trả đủ bộ có kiểm tra tình trạng, khóa tài sản bảo trì, xử lý no-show thủ công và kiểm thử tích hợp. |
| **Should** | Màn hình đối soát, bảo trì và các cải tiến vận hành. Kết nối SePay, kiểm chứng webhook và xử lý ngoại lệ là điều kiện bắt buộc riêng trước khi mở ONLINE thật. |
| **Could** | Hoàn trả từng phần, báo mất, quét no-show tự động và chọn tài sản thay thế. Chỉ đưa vào bản nộp khi các ca Must đã đạt. |

Ngày 1–2 chốt hợp đồng, schema PostgreSQL, migration và stub. Ngày 3–7 nối ba API và chạy hai phương thức với mô phỏng. Ngày 8–12 hoàn thiện bàn giao, hoàn trả đủ bộ và đường lỗi. Ngày 13–17 ưu tiên chạy Must trên staging HTTPS, kiểm tra tải và hoàn thiện hồ sơ demo; chỉ kéo Should/Could vào khi còn thời gian. Thành viên 2 tự động hóa ca Kho và chạy smoke web song song, bạn giữ kiểm thử giao dịch liên dịch vụ và nghiệm thu chung. Khi chưa bật Could, trả thiếu chưa kết thúc lượt thuê; nhân viên xử lý ngoài hệ thống và chỉ lập biên bản hoàn trả đủ bộ khi thu hồi đủ.
