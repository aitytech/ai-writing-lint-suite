# Gợi ý chất lượng viết kỹ thuật (khung 7C)

**Rule ID:** `tech-writing-guideline` · **Mức độ:** info · **Ngôn ngữ:** Tiếng Việt

Rule này gom nhiều gợi ý nhỏ về cách viết rõ ràng hơn, dựa theo khung "7 C" của viết kỹ thuật: Clear (rõ ràng), Concise (súc tích), Correct (chính xác), Coherent (mạch lạc), Concrete (cụ thể), Complete (đầy đủ), Courteous (lịch sự). Rule chỉ ra các cụm từ thừa, câu bị động che giấu chủ thể, tuyên bố không định lượng, thuật ngữ dùng lẫn lộn trong cùng tài liệu, cấu trúc song song lạm dụng, cách diễn đạt mơ hồ, và trích dẫn nguồn không cụ thể.

## Nguồn / Căn cứ

Được chuyển thể từ `ai-tech-writing-guideline.ts` của bản tiếng Nhật cùng bộ công cụ, giữ nguyên cấu trúc năm nhóm gốc (súc tích/chủ động/cụ thể/nhất quán/cấu trúc) nhưng viết lại toàn bộ mẫu bằng tiếng Việt gốc. Ba nhóm được thêm ngày 2026-08-21 (song song/mơ hồ/trực tiếp) sau khi khảo sát công cụ tương tự (github.com/gist bonus414/AI-Writing-Linter) — các mẫu tiếng Việt tương ứng đã được kiểm chứng trên 500 bài báo thật (binhvq_news_vi): cả ba đều hiếm gặp (0–0,2%), độ chính xác tốt.

## Ví dụ

**❌ Bị gắn cờ (cụm thừa):**
> Chúng tôi cập nhật file cấu hình với mục đích để sửa lỗi.

**Vì sao:** "với mục đích để" là cụm thừa, chỉ cần dùng "để" là đủ.

**✅ Tốt hơn (Ví dụ minh họa):**
> Chúng tôi cập nhật file cấu hình để sửa lỗi.

**❌ Bị gắn cờ (bị động che chủ thể):**
> Thay đổi này được thực hiện bởi script triển khai.

**Vì sao:** Câu bị động kiểu "được thực hiện bởi" thường che mất chủ thể thực hiện hành động — nên nêu rõ ai/cái gì làm việc đó nếu có thể.

**❌ Bị gắn cờ (cấu trúc song song lạm dụng):**
> Công cụ này không chỉ giúp viết nhanh hơn mà còn cải thiện chất lượng đầu ra.

**Vì sao:** "không chỉ X mà còn Y" là cấu trúc hay bị lạm dụng trong văn AI — nếu không thực sự cần nhấn mạnh sự tương phản, nói thẳng ý chính sẽ rõ ràng hơn.
