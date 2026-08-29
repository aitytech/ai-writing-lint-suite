# Nhịp câu đơn điệu

**Rule ID:** `no-uniform-sentence-rhythm` · **Mức độ:** info · **Ngôn ngữ:** Tiếng Việt

Rule này so sánh độ dài của các câu liên tiếp trong một đoạn văn (mặc định xét cửa sổ bốn câu liền nhau). Nếu độ dài giữa các câu đó gần như bằng nhau tuyệt đối, đây là dấu hiệu nhịp điệu đơn điệu thường gặp ở văn AI — người viết thật thường tự nhiên xen câu ngắn, câu dài khác nhau.

## Nguồn / Căn cứ

Ngưỡng mặc định (chênh lệch tối đa 15% trong cửa sổ bốn câu) được hiệu chỉnh dựa trên văn bản thật: ở ngưỡng này, 0 trên 6 bài báo VnExpress/Viblo thật được kiểm tra đã kích hoạt rule — văn viết của người thật thường có đủ độ lệch độ dài giữa bốn câu liên tiếp để không bị báo.

## Ví dụ

**❌ Bị gắn cờ:**
> AI xử lý dữ liệu khá là nhanh. Con người xử lý dữ liệu khá chậm. Máy tính hoạt động suốt ngày đêm. Nhân viên chỉ làm việc tám tiếng.

**Vì sao:** Bốn câu liên tiếp có độ dài gần bằng nhau, chênh lệch chỉ khoảng 9% — dưới ngưỡng 15%, cho cảm giác nhịp điệu máy móc, đều đều.

**✅ Tốt hơn:**
> AI giúp tiết kiệm thời gian. Công cụ xử lý dữ liệu nhanh và chính xác hơn nhiều so với cách làm thủ công trước đây. Nhân viên tập trung việc quan trọng. Chi phí giảm.
