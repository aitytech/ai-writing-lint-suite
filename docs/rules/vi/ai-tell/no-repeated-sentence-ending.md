# Kết câu lặp lại liên tiếp

**Rule ID:** `no-repeated-sentence-ending` · **Mức độ:** info · **Ngôn ngữ:** Tiếng Việt

Rule này theo dõi phần kết thúc của các câu liên tiếp trong một đoạn văn. Nếu từ ba câu trở lên liên tiếp đều kết bằng cùng một cụm quen thuộc (như "...là rất quan trọng", "...cần được xem xét") hoặc cùng một cụm từ bất kỳ, đây là dấu hiệu công thức hoá kiểu văn AI — người viết thật thường tự nhiên đổi cách kết câu.

## Ví dụ

**❌ Bị gắn cờ:**
> Thời gian là rất quan trọng. Ngân sách là rất quan trọng. Nhân sự cũng là rất quan trọng.

**Vì sao:** Ba câu liên tiếp đều kết bằng đúng mẫu "là rất quan trọng/cần thiết" — lặp công thức kết câu là dấu hiệu văn AI.

**✅ Tốt hơn:**
> Việc này rất quan trọng. Cần bố trí thêm nhân sự để xử lý kịp thời. Kết quả cuối cùng phụ thuộc vào tốc độ triển khai.

**❌ Bị gắn cờ (kiểu khác, không nằm trong danh sách mẫu cố định):**
> Đội ngũ cần chuẩn bị kỹ càng. Kế hoạch cũng cần chuẩn bị kỹ càng. Ngân sách cũng cần chuẩn bị kỹ càng.

**Vì sao:** Ba câu liên tiếp đều kết thúc bằng đúng cụm "kỹ càng" — rule vẫn bắt được cả những cụm lặp lại không nằm trong danh sách mẫu cố định.
