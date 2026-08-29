# Viết Hoa Từng Chữ kiểu tiếng Anh giữa câu

**Rule ID:** `no-improper-capitalization` · **Mức độ:** info · **Ngôn ngữ:** Tiếng Việt

Rule này bắt thói quen viết hoa chữ cái đầu của mỗi từ giữa câu (Title Case) theo kiểu tiếng Anh, lọt vào câu văn tiếng Việt bình thường — ví dụ "Chúng tôi Cung Cấp Dịch Vụ Tốt Nhất Cho Bạn." Tiếng Việt chỉ viết hoa chữ cái đầu câu; chỉ tên người và tên địa lí mới được viết hoa mọi âm tiết, còn tên cơ quan, tổ chức hay ngày lễ chỉ viết hoa âm tiết đầu của mỗi bộ phận.

## Nguồn / Căn cứ

- Microsoft Vietnamese Localization Style Guide (vie-vnm-StyleGuide.pdf, mục 4.1.5 Capitalization): "In Vietnamese, only the first character in a sentence is capitalized", kèm ví dụ Do: "Chọn tất cả" / Don't: "Chọn Tất Cả".
- Quyết định 1989/QĐ-BGDĐT (25/5/2018), Điều 4 khoản 1 điểm a: "Đối với tên người, tên địa lí trong tiếng Việt... Viết hoa chữ cái đầu của mỗi âm tiết tạo thành tên. Ví dụ: Triệu Thị Trinh, Trần Quốc Tuấn... Cửu Long, Nam Định". Điểm d: tên thiên thể dùng như thuật ngữ khoa học cũng viết hoa mọi âm tiết ("Mặt Trời, Trái Đất, Mặt Trăng").
- Nghị định 78/2025/NĐ-CP (01/4/2025), Phụ lục I, Mục 2: Mục II khoản 1 điểm a (tên người) — "Viết hoa chữ cái đầu tất cả các âm tiết" ("Nguyễn Ái Quốc, Trần Phú, Giàng A Pao, Kơ Pa Kơ Lơng"); Mục IV khoản 1 (tên cơ quan, tổ chức) và Mục V khoản 4 (tên ngày lễ) — chỉ viết hoa âm tiết đầu của mỗi bộ phận ("Bộ Tư pháp", "Viện kiểm sát nhân dân", "ngày Quốc khánh"; chú ý "và" trong "Bộ Giáo dục và Đào tạo" vẫn viết thường).

Số liệu đo thật: chạy trên 29 bài Wikipedia tiếng Việt (khoảng 1,56 triệu ký tự), rule báo 7 lần trên toàn bộ corpus — 1 lần đúng là lỗi Title Case thật, 6 lần còn lại là do lỗi trích xuất văn bản (mất dấu chấm câu, ký hiệu chú thích dính chữ). Trên 15 câu tiếng Việt viết đúng (đủ tên người, địa danh, thiên thể, tên cơ quan, tên ngày lễ): 0 lần báo nhầm. Trên 15 câu cố ý viết Title Case sai: bắt được đủ 15/15. Vì bản chất là một heuristic thống kê, rule chạy ở mức `info`.

## Ví dụ

**❌ Bị gắn cờ:**
> Chúng tôi Cung Cấp Dịch Vụ Tốt Nhất Cho Bạn.

**Vì sao:** Chuỗi "Cung Cấp Dịch Vụ Tốt Nhất Cho Bạn" viết hoa từng chữ giữa câu, trong đó "Cho" là một hư từ — hư từ hầu như không bao giờ là một âm tiết trong tên riêng tiếng Việt, nên đây là thói quen Title Case của tiếng Anh chứ không phải tên riêng.

**✅ Tốt hơn:**
> Chúng tôi cung cấp dịch vụ tốt nhất cho bạn.

**❌ Bị gắn cờ (tên cơ quan viết sai):**
> Hôm qua Bộ Tài Nguyên Và Môi Trường vừa ban hành quy định mới.

**Vì sao:** Theo Nghị định 78/2025/NĐ-CP, tên cơ quan chỉ viết hoa âm tiết đầu mỗi bộ phận, và từ nối "và" phải viết thường.

**✅ Tốt hơn:**
> Hôm qua Bộ Tài nguyên và Môi trường vừa ban hành quy định mới.

**Ví dụ không bị báo (để so sánh):** "Trần Quốc Tuấn là danh tướng thời nhà Trần." và "Bộ Giáo dục và Đào tạo ban hành quy định về chính tả trong sách giáo khoa." đều đúng chuẩn, không bị rule này gắn cờ.
