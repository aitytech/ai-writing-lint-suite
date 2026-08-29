# Dấu vết AI còn sót lại trong bài viết

**Rule ID:** `no-ai-artifact-leakage` · **Mức độ:** error · **Ngôn ngữ:** Tiếng Việt

Rule này bắt những câu chữ chỉ có nghĩa khi đang trò chuyện với một trợ lý AI nhưng vô tình bị để sót lại trong bài đã đăng: câu tự nhận "tôi là AI", lời nhắc về giới hạn dữ liệu huấn luyện, hoặc chỗ để trống mẫu kiểu "[điền email vào đây]" chưa được điền nội dung thật.

## Nguồn / Căn cứ

Nhóm lỗi này được tìm ra qua khảo sát các công cụ tương tự đang có (github.com/gist bonus414/AI-Writing-Linter, nghiên cứu ngày 2026-08-21), và xác nhận trực tiếp là chưa từng xuất hiện trong bản gốc tiếng Nhật lẫn các bản tiếng Anh/Việt trước đây của bộ công cụ này. Rule này được xếp mức lỗi (error), khác với phần lớn rule còn lại của bộ công cụ, vì đây gần như chắc chắn là sai sót thật chứ không phải một lựa chọn văn phong. Đã kiểm chứng: 0% báo động giả trên 500 bài báo tiếng Việt thật.

## Ví dụ

**❌ Bị gắn cờ:**
> Với tư cách là một AI, tôi không thể duyệt web theo thời gian thực được.

**Vì sao:** Câu tự nhận là AI là dấu vết trợ lý chat còn sót lại, không phải giọng văn của người viết thật.

**✅ Tốt hơn:**
> Không thể duyệt web theo thời gian thực.
>
> *(Ví dụ minh họa: bỏ phần tự nhận là AI, giữ nguyên thông tin thật của câu.)*

**❌ Bị gắn cờ (kiểu khác):**
> Tính đến thời điểm huấn luyện, tính năng này vẫn chưa được ra mắt chính thức.

**Vì sao:** Đây là lời nhắc về giới hạn dữ liệu huấn luyện của AI, không có ý nghĩa gì với người đọc bài viết.

**❌ Bị gắn cờ (kiểu khác):**
> Liên hệ chúng tôi qua [điền email vào đây] để biết thêm chi tiết về dịch vụ.

**Vì sao:** Đây là một khoảng trống mẫu chưa được điền nội dung thật — không chỉ là vấn đề văn phong, mà là thiếu thông tin.
