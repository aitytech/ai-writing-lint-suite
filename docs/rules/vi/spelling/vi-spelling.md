# Kiểm tra chính tả tiếng Việt

**Rule ID:** `vi-spelling/misspelled` · **Mức độ:** warning · **Ngôn ngữ:** Tiếng Việt

Đây là chức năng kiểm tra chính tả thật, khác với các rule "văn phong AI" ở phần trên. Mỗi từ trong bài được đối chiếu với một từ điển tiếng Việt thật; từ nào không có trong từ điển sẽ được gợi ý sửa. Chức năng này chạy hoàn toàn trên máy, không có văn bản nào được gửi đi đâu cả.

## Cách hoạt động

Dùng thư viện nspell (một bộ kiểm tra chính tả kiểu Hunspell viết thuần bằng JavaScript) kết hợp với từ điển `dictionary-vi` (bộ từ hunspell-vi). Bộ dữ liệu nhỏ (khoảng 44KB), không cần WebAssembly hay thư viện gốc, nên chạy được trên mọi nơi PenCheck hoạt động.

Điểm đặc biệt: một chỉ mục khôi phục dấu được xây riêng từ chính bộ từ điển này, giúp xử lý trường hợp gõ tiếng Việt không dấu (rất phổ biến khi gõ nhanh, ví dụ gõ "duoc" thay vì "được"). Bình thường, thuật toán gợi ý sửa lỗi kiểu khoảng cách chỉnh sửa (edit-distance) của nspell không biết rằng việc cần làm là "thêm dấu vào lại" — nó thường không đưa ra được từ có dấu đúng trong danh sách gợi ý. Chỉ mục khôi phục dấu giải quyết đúng vấn đề này: mỗi từ trong từ điển được lập chỉ mục theo dạng không dấu của nó, nên một từ gõ không dấu như "duoc" có thể tra thẳng ra "được".

## Ví dụ

**Ví dụ minh họa (chưa có test file thật cho chức năng này, tự viết theo đúng cách mô tả trong mã nguồn):**

> Nhập: "toi dang hoc tieng viet"
>
> PenCheck gợi ý sửa từng từ không dấu về đúng dạng có dấu, ví dụ "hoc" → "học", "tieng" → "tiếng", "viet" → "việt".

Đây là ví dụ minh họa dựa trên đúng cơ chế được mô tả trong mã nguồn (chỉ mục khôi phục dấu tra theo dạng không dấu), chứ không lấy từ một test file có sẵn — vì file này hiện chưa có bộ test riêng.

Với lỗi chính tả có dấu bình thường (không phải lỗi thiếu dấu), PenCheck dùng thẳng gợi ý của nspell, hiển thị tối đa ba lựa chọn gần đúng nhất.

## Chạy ở đâu

Chức năng chính tả tiếng Việt này chạy giống hệt nhau trên mọi kênh sử dụng PenCheck — cả khi dùng qua Claude Desktop lẫn khi dùng qua ChatGPT hoặc bất kỳ ứng dụng nào gọi tới máy chủ chạy trên Cloudflare Workers. Không có phiên bản rút gọn nào cho tiếng Việt — đây là điểm khác biệt so với tiếng Anh, nơi bản đầy đủ (ngữ pháp, văn phong) chỉ có trên Claude Desktop.
