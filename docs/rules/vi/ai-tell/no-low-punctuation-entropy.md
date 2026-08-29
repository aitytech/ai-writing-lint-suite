# Dấu câu quá đơn điệu

**Rule ID:** `no-low-punctuation-entropy` · **Mức độ:** info · **Ngôn ngữ:** Tiếng Việt

Rule này đo độ đa dạng của các loại dấu câu (chấm, phẩy, hỏi, than, chấm phẩy, hai chấm, gạch ngang, chấm lửng, ngoặc, nháy) trong một đoạn văn đủ dài. Nếu đoạn đó gần như chỉ dùng một loại dấu câu duy nhất (thường là dấu chấm), đây là dấu hiệu thống kê của văn phong AI đã được nghiên cứu xác nhận — người viết thật thường trộn nhiều loại dấu câu khác nhau một cách tự nhiên.

## Ví dụ

**❌ Bị gắn cờ:**
> Cái này hoạt động tốt. Nó xử lý dữ liệu. Nó lưu kết quả. Nó xử lý lỗi. Nó ghi sự kiện. Nó tiết kiệm thời gian. Nó giảm chi phí. Nó tăng tốc độ. Nó tăng độ chính xác. Nó đơn giản hoá công việc. Nó giúp đội nhóm. Nó mở rộng dễ dàng. Nó chạy hàng ngày. Nó cập nhật thường xuyên. Nó luôn ổn định. Nó hoạt động nhất quán.

**Vì sao:** Toàn bộ đoạn chỉ dùng đúng một loại dấu câu là dấu chấm, lặp lại theo khuôn câu ngắn giống hệt nhau — entropy dấu câu rất thấp.

**✅ Tốt hơn:**
> Khoan đã—thật sao? Tôi không nghĩ vậy; điều này thay đổi mọi thứ. "Anh chắc chưa," cô hỏi, "hay chỉ đoán thôi..." Anh không chắc lắm (không hoàn toàn), nhưng vẫn gật đầu, nửa tin nửa ngờ.
