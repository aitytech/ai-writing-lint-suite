# Nhất quán cách viết thuật ngữ (Wi-Fi, email, website...)

**Rule ID:** `prh` · **Mức độ:** info · **Ngôn ngữ:** Tiếng Việt

Rule này kiểm tra xem một số thuật ngữ công nghệ vay mượn (Wi-Fi, email, website, online, offline, username, smartphone, laptop, chatbot...) có được viết đúng theo một dạng chuẩn thống nhất hay không, thay vì lúc thì "Wifi", lúc thì "WiFi", lúc thì "wifi" trong cùng một bài. Rule cũng kiểm tra khoảng trắng quanh dấu gạch ngang khi biểu thị khoảng số, và khoảng trắng thừa trước dấu câu.

## Nguồn / Căn cứ

Từ điển thuật ngữ được xây dựng trong nội bộ, dựa trên: CNCF Cloud Native Glossary bản tiếng Việt (github.com/cncf/glossary, cộng đồng dịch, ra mắt 2025) để xác nhận thuật ngữ nào thực sự được cộng đồng kỹ thuật dùng; Wikipedia tiếng Việt's "Cẩm nang về văn phong" cho hai quy tắc về khoảng trắng; và Microsoft Vietnamese Localization Style Guide (vie-vnm-StyleGuide.pdf) để xác nhận độc lập một số thuật ngữ như "máy chủ" cho "server". Quy tắc khoảng số trích nguyên văn từ Cẩm nang về văn phong: `"20–30" đúng, "20 – 30" sai (không có khoảng trắng quanh gạch ngang khi biểu thị khoảng số)`. Quy tắc khoảng trắng trước dấu câu: `"Giữa từ cuối của câu và các dấu câu không có khoảng trống."`

Lưu ý: rule cố tình KHÔNG đụng đến các trường hợp còn đang gây tranh cãi về chính tả (ví dụ cặp "kĩ/kỹ") — chỉ kiểm tra tính nhất quán của cùng một thuật ngữ trong một tài liệu, không áp đặt cách viết nào là "đúng duy nhất" khi cả cộng đồng còn chưa thống nhất.

## Ví dụ

**❌ Bị gắn cờ:**
> Tôi dùng wifi ở nhà.

**Vì sao:** "wifi" nên viết thống nhất thành "Wi-Fi".

**✅ Tốt hơn:**
> Tôi dùng Wi-Fi ở nhà.

**❌ Bị gắn cờ (khoảng trắng quanh khoảng số):**
> Khoảng 20 – 30 người tham dự sự kiện.

**Vì sao:** Khi biểu thị khoảng số, không nên có khoảng trắng quanh dấu gạch ngang.

**✅ Tốt hơn:**
> Khoảng 20–30 người tham dự sự kiện.

**❌ Bị gắn cờ (khoảng trắng thừa trước dấu câu):**
> Xin chào , tôi là trợ lý ảo.

**✅ Tốt hơn:**
> Xin chào, tôi là trợ lý ảo.
