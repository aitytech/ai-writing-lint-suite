# Cụm từ sáo rỗng, phóng đại kiểu AI

**Rule ID:** `no-ai-hype-expressions` · **Mức độ:** error · **Ngôn ngữ:** Tiếng Việt

Rule này bắt các cụm từ tuyệt đối hoá, phóng đại, ẩn dụ hoa mỹ hoặc mở bài sáo rỗng mà mô hình AI rất hay dùng, ví dụ "mang tính đột phá", "giải pháp toàn diện", "chìa khóa thành công", hoặc mở đầu đoạn văn bằng "Trong kỷ nguyên AI, ...". Đây không phải lỗi chính tả, mà là những cách nói nghe sáo mòn, thiếu thông tin cụ thể.

Rule không dựa trên nguồn chính thức bên ngoài — danh sách cụm từ được rút ra và kiểm chứng bằng cách so với 500 bài báo tiếng Việt thật (VnExpress, Viblo).

## Ví dụ

**❌ Bị gắn cờ:**
> Sản phẩm này mang tính đột phá trong ngành.

**Vì sao:** "mang tính đột phá/cách mạng" là cụm sáo rỗng hay gặp trong văn AI — không nói rõ điều gì thực sự thay đổi.

**✅ Tốt hơn (Ví dụ minh họa):**
> Sản phẩm này giúp giảm khoảng 30% thời gian xử lý so với phiên bản trước.

**❌ Bị gắn cờ (kiểu khác):**
> Trong kỷ nguyên AI, mọi thứ đều thay đổi.

**Vì sao:** "Trong kỷ nguyên/thời đại số/AI" đứng ở đầu câu hoặc đầu đoạn là cách mở bài sáo rỗng điển hình của văn AI.

**Lưu ý thú vị:** cùng cụm từ này KHÔNG bị báo nếu nó mô tả đúng chủ đề bài viết giữa câu/tiêu đề, ví dụ câu sau vẫn hợp lệ: "Kinh tế học Token trong kỷ nguyên AI đa phương thức: phân tích kỹ thuật và chi phí." Rule chỉ nhắm vào cách dùng làm câu mở đầu sáo rỗng, không cấm cụm từ này nói chung.
