# PenCheck kiểm tra gì trong văn bản tiếng Việt

PenCheck là công cụ giúp rà lại một bài viết tiếng Việt trước khi đăng, tìm ba nhóm vấn đề khác nhau: dấu hiệu văn phong AI, cách viết thuật ngữ/số liệu chưa nhất quán, và lỗi chính tả thật. Trang này liệt kê toàn bộ nhóm rule đang hoạt động, và trỏ tới trang giải thích chi tiết từng rule.

## Ba nhóm kiểm tra

**1. Dấu hiệu văn phong AI (`ai-tell/`)** — nhóm rule lớn nhất, tìm những đặc điểm hay gặp ở văn bản do AI viết ra: cụm từ sáo rỗng ("mang tính đột phá", "giải pháp toàn diện"), danh sách trình bày máy móc (emoji lặp lại đầu mỗi gạch đầu dòng), câu văn quá đều đặn về độ dài hoặc cách kết thúc, vốn từ nghèo nàn, dấu câu đơn điệu, và những dấu vết trợ lý chat còn sót lại trong bản đăng (như câu tự nhận là AI). Đa số các rule này ở mức thông tin (`info`) — chỉ là gợi ý cân nhắc, riêng bốn rule ở mức lỗi (`error`) là những trường hợp gần như chắc chắn là sai sót, không phải lựa chọn văn phong.

**2. Nhất quán cách viết (`notation/`)** — nhóm rule không phán xét cách viết nào "đúng", mà chỉ nhắc khi CÙNG một tài liệu dùng lẫn lộn nhiều cách viết khác nhau cho cùng một thứ: lúc thì "Wifi", lúc thì "Wi-Fi"; lúc thì "1.234.567", lúc thì "1 234 567"; hoặc viết hoa từng chữ kiểu tiếng Anh giữa câu tiếng Việt. Nhiều rule trong nhóm này dựa trên văn bản pháp luật thật của Việt Nam (Quyết định 1989/QĐ-BGDĐT, Nghị định 78/2025/NĐ-CP).

**3. Chính tả (`spelling/`)** — kiểm tra chính tả thật bằng từ điển tiếng Việt, kèm khả năng khôi phục dấu cho những từ gõ không dấu (ví dụ "duoc" → "được").

## Danh sách rule

| File | Rule ID | Mô tả | Mức độ |
|---|---|---|---|
| [ai-tell/no-ai-artifact-leakage.md](ai-tell/no-ai-artifact-leakage.md) | `no-ai-artifact-leakage` | Dấu vết trợ lý chat còn sót lại (tự nhận là AI, placeholder chưa điền) | error |
| [ai-tell/no-ai-emphasis-patterns.md](ai-tell/no-ai-emphasis-patterns.md) | `no-ai-emphasis-patterns` | Emoji + in đậm lặp lại máy móc, in đậm thừa trong tiêu đề | error |
| [ai-tell/no-ai-hype-expressions.md](ai-tell/no-ai-hype-expressions.md) | `no-ai-hype-expressions` | Cụm từ sáo rỗng, phóng đại kiểu AI | error |
| [ai-tell/no-ai-list-formatting.md](ai-tell/no-ai-list-formatting.md) | `no-ai-list-formatting` | Danh sách trình bày máy móc (emoji/khuôn in đậm lặp lại) | error |
| [ai-tell/no-em-dash-overuse.md](ai-tell/no-em-dash-overuse.md) | `no-em-dash-overuse` | Lạm dụng dấu gạch ngang dài (—) | info |
| [ai-tell/no-low-lexical-diversity.md](ai-tell/no-low-lexical-diversity.md) | `no-low-lexical-diversity` | Vốn từ lặp lại quá nhiều trong một đoạn | info |
| [ai-tell/no-low-punctuation-entropy.md](ai-tell/no-low-punctuation-entropy.md) | `no-low-punctuation-entropy` | Dấu câu quá đơn điệu | info |
| [ai-tell/no-monotonous-function-word-bigrams.md](ai-tell/no-monotonous-function-word-bigrams.md) | `no-monotonous-function-word-bigrams` | Lặp khuôn cặp hư từ giữa các câu | info |
| [ai-tell/no-repeated-sentence-ending.md](ai-tell/no-repeated-sentence-ending.md) | `no-repeated-sentence-ending` | Nhiều câu liên tiếp kết thúc giống nhau | info |
| [ai-tell/no-uniform-sentence-rhythm.md](ai-tell/no-uniform-sentence-rhythm.md) | `no-uniform-sentence-rhythm` | Các câu liên tiếp dài gần bằng nhau, nhịp điệu đều đều | info |
| [ai-tell/tech-writing-guideline.md](ai-tell/tech-writing-guideline.md) | `tech-writing-guideline` | Gợi ý viết rõ ràng hơn theo khung 7C | info |
| [notation/prh.md](notation/prh.md) | `prh` | Thuật ngữ vay mượn viết chưa nhất quán (Wi-Fi, email, website...) | info |
| [notation/no-mixed-number-notation.md](notation/no-mixed-number-notation.md) | `no-mixed-number-notation` | Cách viết số/ngày tháng chưa nhất quán trong tài liệu | info |
| [notation/no-improper-capitalization.md](notation/no-improper-capitalization.md) | `no-improper-capitalization` | Viết Hoa Từng Chữ kiểu tiếng Anh giữa câu | info |
| [spelling/vi-spelling.md](spelling/vi-spelling.md) | `vi-spelling/misspelled` | Lỗi chính tả thật, kèm khôi phục dấu cho từ gõ không dấu | warning |

## Tiếng Việt chạy đầy đủ ở mọi nơi

Toàn bộ 15 rule ở trên — cả nhóm dấu hiệu AI, nhóm nhất quán cách viết, lẫn chức năng chính tả — chạy giống hệt nhau dù dùng PenCheck qua Claude Desktop hay qua ChatGPT (và bất kỳ ứng dụng nào khác gọi tới máy chủ chạy trên Cloudflare Workers). Không có sự khác biệt nào giữa hai bên: cùng một bộ rule, cùng một mức độ nghiêm trọng, cùng một kết quả.

Đây là điểm khác với tiếng Anh, nơi Claude Desktop có thêm một số lớp kiểm tra ngữ pháp và văn phong chuyên sâu (Harper, Vale) mà bản chạy trên Cloudflare Workers không có do giới hạn dung lượng. Với tiếng Việt thì không tồn tại khoảng cách đó, vì bộ từ điển chính tả (khoảng 44KB, thuần JavaScript, không cần WebAssembly) đủ nhỏ để chạy được ở bất kỳ đâu PenCheck hoạt động.
