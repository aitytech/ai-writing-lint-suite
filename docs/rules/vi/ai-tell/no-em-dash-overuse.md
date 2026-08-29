# Lạm dụng dấu gạch ngang dài

**Rule ID:** `no-em-dash-overuse` · **Mức độ:** info · **Ngôn ngữ:** Tiếng Việt

Rule này đếm số lần dấu gạch ngang dài (—) xuất hiện trong một đoạn văn. Chữ Việt về cơ bản không dùng dấu này để chêm ý giữa câu, nên khi nó xuất hiện nhiều lần trong cùng một đoạn, rất có thể văn bản được viết (hoặc dịch) bởi một mô hình AI được huấn luyện chủ yếu trên tiếng Anh.

## Nguồn / Căn cứ

Đây là dấu hiệu văn phong AI được báo cáo rộng rãi nhất ở các model GPT-4/4o và Claude gần đây (dùng — làm dấu nối/chêm mặc định nhiều hơn hẳn văn người viết thật). Kiểm chứng trên 500 bài báo tiếng Việt thật (binhvq_news_vi, 20.500 từ): dấu — xuất hiện 0 lần. Lưu ý trung thực từ chính nguồn của rule: khả năng bắt đúng văn AI thật (recall) chưa được kiểm chứng trên một bộ dữ liệu văn AI tiếng Việt có nhãn quy mô lớn, vì hiện chưa có bộ dữ liệu tương đương HC3 cho tiếng Việt — đây là ước lượng tốt nhất cho tới khi tìm được dữ liệu phù hợp.

## Ví dụ

**❌ Bị gắn cờ:**
> Dịch vụ tự khởi động lại — thường trong vài giây — khi bộ nhớ vượt quá giới hạn cấu hình, đồng thời hệ thống ghi lại sự kiện để xem xét sau. Đội vận hành hiếm khi cần can thiệp — toàn bộ quy trình được thiết kế để chạy mà không cần ai theo dõi trực tiếp.

**Vì sao:** Đoạn này dùng dấu gạch ngang dài ba lần trong một đoạn ngắn — vượt hẳn cách viết tiếng Việt tự nhiên, vốn gần như không dùng dấu này.

**✅ Tốt hơn (Ví dụ minh họa, thay bằng dấu ngoặc đơn và liên từ):**
> Dịch vụ tự khởi động lại (thường trong vài giây) khi bộ nhớ vượt quá giới hạn cấu hình, đồng thời hệ thống ghi lại sự kiện để xem xét sau. Đội vận hành hiếm khi cần can thiệp, vì toàn bộ quy trình được thiết kế để chạy mà không cần ai theo dõi trực tiếp.
