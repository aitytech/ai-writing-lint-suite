# Vốn từ lặp lại quá nhiều

**Rule ID:** `no-low-lexical-diversity` · **Mức độ:** info · **Ngôn ngữ:** Tiếng Việt

Rule này đo tỷ lệ số từ nội dung khác nhau trên tổng số từ nội dung trong một đoạn văn (bỏ qua các hư từ như "là", "của", "và"...). Nếu một đoạn đủ dài mà lại dùng đi dùng lại rất ít từ vựng khác nhau, đó là dấu hiệu thống kê của văn phong AI đã được nghiên cứu học thuật xác nhận.

## Ví dụ

**❌ Bị gắn cờ:**
> Hệ thống xử lý dữ liệu nhanh. Hệ thống xử lý dữ liệu tốt. Hệ thống xử lý dữ liệu ổn. Hệ thống xử lý dữ liệu ngay. Hệ thống xử lý dữ liệu luôn. Hệ thống xử lý dữ liệu mãi. Hệ thống xử lý dữ liệu ngon. Hệ thống xử lý dữ liệu chuẩn. Hệ thống xử lý dữ liệu êm. Hệ thống xử lý dữ liệu gọn.

**Vì sao:** Đoạn này có 70 từ nội dung nhưng tỷ lệ từ độc nhất chỉ khoảng 23%, dưới ngưỡng 45% — gần như toàn bộ đoạn chỉ xoay quanh cụm "Hệ thống xử lý dữ liệu" lặp lại, chỉ đổi từ cuối câu.

**✅ Tốt hơn:**
> Thị trường tăng điểm hôm thứ Ba sau khi ngân hàng trung ương phát tín hiệu tạm dừng. Nhà đầu tư đón nhận tin này tích cực, dù giới phân tích cảnh báo rủi ro lạm phát vẫn còn. Cổ phiếu bán lẻ dẫn đầu đà tăng trong khi nhóm năng lượng tụt lại phía sau.
