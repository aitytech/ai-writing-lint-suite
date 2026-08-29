# Lạm dụng chữ in đậm và emoji nhấn mạnh

**Rule ID:** `no-ai-emphasis-patterns` · **Mức độ:** error · **Ngôn ngữ:** Tiếng Việt

Rule này bắt kiểu trình bày máy móc hay gặp trong văn bản do AI viết: emoji đứng ngay trước chữ in đậm, các tiền tố in đậm lặp đi lặp lại như "**Lưu ý**:" hay "**Quan trọng**:" ở đầu đoạn/đầu gạch đầu dòng, và chữ in đậm thừa ngay bên trong tiêu đề (bản thân tiêu đề đã là một hình thức nhấn mạnh rồi).

Rule này không dựa trên nguồn chính thức bên ngoài — đây là quan sát văn phong nội bộ về cách AI hay trình bày văn bản.

## Ví dụ

**❌ Bị gắn cờ (Ví dụ minh họa — chưa có test file thật cho rule này):**
> ✅ **Lưu ý:** Hãy sao lưu dữ liệu trước khi cập nhật.

**Vì sao:** Emoji đứng ngay trước chữ in đậm, cộng thêm tiền tố "**Lưu ý**:" lặp lại máy móc, là kiểu trình bày thường thấy trong văn bản AI hơn là cách người thật hay viết.

**✅ Tốt hơn (Ví dụ minh họa):**
> Nhớ sao lưu dữ liệu trước khi cập nhật.

**❌ Bị gắn cờ (Ví dụ minh họa, dạng tiêu đề):**
> ## **Hướng dẫn cài đặt**

**Vì sao:** Tiêu đề markdown tự nó đã là một dạng nhấn mạnh, in đậm thêm bên trong là thừa.

**✅ Tốt hơn (Ví dụ minh họa):**
> ## Hướng dẫn cài đặt
