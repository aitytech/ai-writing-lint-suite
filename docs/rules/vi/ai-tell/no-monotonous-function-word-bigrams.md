# Lặp khuôn hư từ giữa các câu

**Rule ID:** `no-monotonous-function-word-bigrams` · **Mức độ:** info · **Ngôn ngữ:** Tiếng Việt

Rule này nhìn vào từng cặp hư từ đứng cạnh nhau (ví dụ "là một", "và có") xuất hiện trong đoạn văn, rồi đo xem các cặp đó có đa dạng hay không. Nếu một đoạn cứ lặp đi lặp lại cùng một vài cặp hư từ, đây là dấu hiệu văn phong AI ở cấp độ cấu trúc câu, khác với việc lặp từ vựng thông thường.

## Ví dụ

**❌ Bị gắn cờ:**
> Đây là một điều tốt. Đó cũng là một điều hay. Đây cũng là một điều đúng. Đó là một điều thật. Đây là một điều rõ. Đó cũng là một điều chắc.

**Vì sao:** Cặp hư từ "là một" chiếm phần lớn trong tổng 12 cặp hư từ được đếm, khiến entropy của toàn đoạn chỉ còn khoảng 1,73 bit, dưới ngưỡng 2,2 bit — dấu hiệu câu văn được ghép theo cùng một khuôn lặp lại.

**✅ Tốt hơn:**
> Thị trường tăng điểm hôm thứ Ba sau khi ngân hàng trung ương phát tín hiệu tạm dừng. Nhà đầu tư đón nhận tin này tích cực, dù giới phân tích cảnh báo rủi ro lạm phát vẫn còn. Cổ phiếu bán lẻ dẫn đầu đà tăng trong khi nhóm năng lượng tụt lại phía sau.
