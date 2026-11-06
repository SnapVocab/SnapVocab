---
target: Shop screen
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:D:\\SnapVocab\\src\\features\\shop\\shop-screen.tsx"
target_fingerprint: "sha256:145e7ea6024dd9914427eddc88c6054599b7c24e7bc310610e4cc62e2c55e8c2"
target_path: "D:\\SnapVocab\\src\\features\\shop\\shop-screen.tsx"
timestamp: 2026-10-31T11-52-01Z
slug: src-features-shop-shop-screen-tsx
---
Method: design review only (detector not applicable, native platform)

Phạm vi: Learn hub và Shop/Boosters trên Android dark mode, đối chiếu mã nguồn. Không thay đổi UI; chưa thử mua thật, font scaling hay toàn bộ theme.

Learn: 26/36 (khoảng 7.2/10). Shop: 24/40 (6/10). Đây là điểm đánh giá UX, không phải kết quả đo usability với người dùng.

| Tiêu chí Nielsen | Learn | Shop |
|---|---:|---:|
| Trạng thái hệ thống | 3 | 2 |
| Ngôn ngữ, mô hình quen thuộc | 3 | 2 |
| Quyền kiểm soát, quay lại | 3 | 3 |
| Nhất quán | 3 | 2 |
| Ngăn lỗi | 4 | 3 |
| Nhận biết thay vì ghi nhớ | 3 | 3 |
| Hiệu quả thao tác | 3 | 2 |
| Thẩm mỹ, tối giản | 2 | 2 |
| Phục hồi lỗi | n/a | 3 |
| Hướng dẫn đúng ngữ cảnh | 2 | 2 |
| Tổng | 26/36 | 24/40 |

Learn không chấm phục hồi lỗi vì hub chỉ điều hướng, không có form hay tải dữ liệu riêng.

Nhận định thiết kế: Learn rõ cấu trúc nhưng còn giống một menu chức năng chung. Shop có dấu hiệu riêng của SnapVocab qua artwork XP, Coin và typography; các lớp nổi cùng nội dung lặp làm sự tập trung bị phân tán.

Điểm tốt: Learn có đúng hai lựa chọn lớn, nhãn và chevron rõ; giữ cấu trúc mở Collections/Quiz thành màn riêng. Shop có nút Coin + giá gọn và vẫn giữ bước xác nhận giao dịch. Vùng status bar/header ở hai màn dark mode đã liền màu.

Ưu tiên:
1. [P1, Shop] Nội dung chưa hỗ trợ quyết định mua. UI tiếng Anh nhưng tên và mô tả booster tiếng Việt, dùng KN thay XP. Ba ảnh giống nhau; mô tả bị cắt, thứ tự thời lượng đang 30/15/60 phút. Chuẩn hóa nội dung theo locale, đưa XP x2 và thời lượng ra ngắn gọn, sắp 15/30/60; trình bày rõ thời điểm hiệu lực. Gợi ý: impeccable clarify.
2. [P2, Shop] Dark mode còn các mảng artwork xanh gần trắng, kéo mắt mạnh hơn tên và giá. ARTWORK_BG chỉ có màu nền sáng. Thêm nền artwork dark riêng từ token, giữ màu và chi tiết của vật phẩm. Gợi ý: impeccable colorize.
3. [P2, Shop] Card dùng quá nhiều diện tích cho thông tin lặp. Mỗi gói booster đều có ảnh cao 100, nhãn BOOSTERS, viền đáy và shadow; mô tả vẫn bị cắt. Rút gọn artwork, bỏ nhãn loại khi đã lọc Boosters, ưu tiên hiệu ứng/thời lượng/giá và giảm lớp nổi. Giữ nút chỉ Coin + giá. Gợi ý: impeccable distill.
4. [P2, Learn] Collections chưa nói rõ nơi học/ôn flashcard. Vocabulary and learning topics dễ bị hiểu là màn quản lý kho từ; Quiz thì có hành động rõ hơn. Đổi mô tả Collections thành Học và ôn flashcard theo bộ sưu tập, Quiz thành Kiểm tra từ vựng theo chủ đề. Giữ nguyên hai lựa chọn và đường dẫn hiện tại. Gợi ý: impeccable clarify.

Tải nhận thức: Learn thấp, chỉ một quyết định giữa hai mục. Shop vừa: bốn nhóm lọc vẫn hợp lý, nhưng người mua phải đọc nội dung lặp để phân biệt ba gói booster. Không cần thêm mục để lấp khoảng trống Learn.

Hành trình cảm xúc: Learn bình tĩnh, dễ vào nhưng chưa gợi rõ hành động ôn tập. Shop vui và có tính phần thưởng; khi 0 Coin, nhiều lần chạm giá sẽ mở modal thiếu Coin, có nguy cơ tạo cảm giác bị ngắt quãng.

Persona: Jordan/người mới khó đoán Collections có ôn flashcard. Casey/người dùng điện thoại bị phân tâm khó phân biệt booster cùng artwork, dễ phải đọc lại thời lượng. Người dùng chữ lớn cần được kiểm tra riêng vì card giới hạn tên và mô tả hai dòng; chưa kết luận lỗi font scaling.

Quan sát nhỏ từ code: số dư có thể dùng cache/0 khi chưa có dữ liệu; nên phân biệt trạng thái chưa biết. STREAK_FREEZE có trong kiểu dữ liệu nhưng chưa có nhóm lọc riêng; đây là quyết định phân nhóm cần làm rõ, không phải lỗi được tái hiện trong mục Boosters.

Câu hỏi định hướng: Ưu tiên nội dung/quyết định mua, hình ảnh dark mode, hay độ rõ của Learn? Phạm vi chỉnh tiếp là Shop trước hay cả hai màn?
