# Nhất quán cách viết số và ngày tháng

**Rule ID:** `no-mixed-number-notation` · **Mức độ:** info · **Ngôn ngữ:** Tiếng Việt

Rule này không khẳng định cách viết số nào "đúng" — tiếng Việt có nhiều cách viết số hàng nghìn và ngày tháng đều hợp lệ. Rule chỉ báo khi CÙNG MỘT tài liệu dùng lẫn lộn nhiều cách khác nhau, ví dụ vừa viết "1.234.567" (dấu chấm) vừa viết "3 456 789" (dấu cách) trong cùng một bài.

## Nguồn / Căn cứ

Quyết định 1989/QĐ-BGDĐT (25/5/2018), "Quy định về chính tả trong chương trình, sách giáo khoa giáo dục phổ thông", Bộ Giáo dục và Đào tạo:

- Điều 11: "Khi viết các số thập phân, sử dụng dấu phẩy để ngăn cách giữa phần nguyên và phần thập phân, ví dụ: 3,8; 5,21; 10,43,... Khi viết số có nhiều chữ số, viết theo nguyên tắc tách lớp từ phải qua trái, mỗi lớp gồm ba chữ số, được phân cách ra bằng khoảng cách viết một chữ số, ví dụ: 1 000; 34 456; 3 809 008; 1 234 567".
- Điều 10: "...thay các từ tháng, năm bằng dấu gạch nối... ví dụ: ngày 20-11-2017. Trong bài viết và tài liệu tham khảo, có thể thay các từ tháng, năm bằng dấu gạch xiên... ví dụ: ngày 20/11/2017; nhưng mỗi bài viết và tài liệu phải sử dụng một cách viết thống nhất."
- Điều 1 (giới hạn phạm vi áp dụng): "Văn bản này áp dụng đối với tổ chức, cá nhân xây dựng chương trình, biên soạn sách giáo khoa giáo dục phổ thông..." — tức đây là chuẩn cho sách giáo khoa, không phải chuẩn duy nhất cho mọi văn bản. Trong kế toán, hoá đơn, tài chính và báo chí, người Việt vẫn dùng dấu chấm cho hàng nghìn ("1.000") một cách chính thống trong lĩnh vực của nó.

Số liệu đo thật (corpus: 29 bài Wikipedia tiếng Việt, khoảng 1,5 triệu ký tự): 655 số tách bằng dấu chấm, 0 số tách bằng dấu cách. Riêng với dấu phẩy, rule chỉ coi là "tách hàng nghìn" khi có từ hai nhóm trở lên (ví dụ "1,234,567"), vì đo được 31 trường hợp một nhóm dấu phẩy duy nhất ("6,403") trong corpus và tất cả đều là số thập phân ba chữ số phần lẻ, không phải số hàng nghìn.

## Ví dụ

**❌ Bị gắn cờ (lẫn dấu chấm và dấu cách trong cùng một câu):**
> Doanh thu quý một đạt 1.234.567 đồng, quý hai đạt 2.345.678 đồng, quý ba đạt 3 456 789 đồng.

**Vì sao:** Tài liệu đa số dùng dấu chấm (hai lần), riêng số cuối lại dùng dấu cách — không phải vì dấu cách sai, mà vì tài liệu cần thống nhất một cách viết.

**✅ Tốt hơn (dùng nhất quán một cách viết trong cả tài liệu):**
> Doanh thu quý một đạt 1.234.567 đồng, quý hai đạt 2.345.678 đồng, quý ba đạt 3.456.789 đồng.

**❌ Bị gắn cờ (lẫn hai cách viết ngày tháng):**
> Văn bản ban hành ngày 20/11/2017, sửa đổi ngày 05/12/2018 và hết hiệu lực ngày 31-12-2020.

**Vì sao:** Quyết định 1989/QĐ-BGDĐT Điều 10 chấp nhận cả gạch xiên ("20/11/2017") lẫn gạch nối ("20-11-2017"), nhưng yêu cầu dùng thống nhất trong một tài liệu — ở đây tài liệu đang dùng lẫn cả hai.

**✅ Tốt hơn (Ví dụ minh họa, thống nhất về gạch xiên):**
> Văn bản ban hành ngày 20/11/2017, sửa đổi ngày 05/12/2018 và hết hiệu lực ngày 31/12/2020.
