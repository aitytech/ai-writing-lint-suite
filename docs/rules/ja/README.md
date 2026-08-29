# PenCheck 日本語ルール一覧

PenCheckは、文章を書いたあとに「機械的な言い回しが残っていないか」「日本語として自然か」「表記が document内で揺れていないか」をチェックするツールです。このページでは、日本語の文章に対して実際に動いている31個のルールを、それぞれ何を見つけてくれるのか分かる形でまとめています。

ルールは3つのグループに分かれています。

- **AI-tellルール**（12個）— AIが書いた文章によく現れる癖を見つけます。誇張した宣伝文句、機械的に揃えられた箇条書き、同じ文末の繰り返しなど、「読んでいて機械っぽいな」と感じる原因になる書き方です。
- **文法ルール**（7個）— 助詞の重複、ら抜き言葉、文体の混在など、日本語として昔から気をつけるべきとされてきた本物の文法・作文チェックです。
- **校正ルール**（12個）— プロの校正者が日々チェックしている、表記の統一（表記ゆれ）・言葉の誤用・読みやすさに関するルールです。同じ用語をサーバー／サーバのようにバラバラに書いていないか、句読点の使い方が偏っていないか、といった点を見ます。

## AI-tellルール（12個）

| ルールID | 何を見つけるか | 重要度 |
|---|---|---|
| [ai-tech-writing-guideline](./ai-tell/ai-tech-writing-guideline.md) | 冗長な言い回し、抽象的な評価表現、受け身に偏った説明など、技術文書の読みやすさを損なう書き方 | info |
| [no-ai-artifact-leakage](./ai-tell/no-ai-artifact-leakage.md) | 「私はAIですので」のような自己言及や「【挿入：URL】」のような埋め忘れたテンプレートの残存 | error |
| [no-ai-colon-continuation](./ai-tell/no-ai-colon-continuation.md) | 述語で終えた文の直後にコードブロックや箇条書きを続ける、英語構文の直訳のような書き方 | error |
| [no-ai-emphasis-patterns](./ai-tell/no-ai-emphasis-patterns.md) | 絵文字＋太字や「**注意**：」のような強調の機械的な多用 | error |
| [no-ai-hype-expressions](./ai-tell/no-ai-hype-expressions.md) | 「革命的な」「ゲームチェンジャー」のような根拠のない誇張表現 | error |
| [no-ai-list-formatting](./ai-tell/no-ai-list-formatting.md) | 箇条書きが「**見出し**：説明」の型や装飾絵文字で機械的に揃っている状態 | error |
| [no-em-dash-overuse](./ai-tell/no-em-dash-overuse.md) | ダッシュ記号（—・―）の多用 | info |
| [no-low-lexical-diversity](./ai-tell/no-low-lexical-diversity.md) | 段落内で使い回されている語彙の少なさ | info |
| [no-low-punctuation-entropy](./ai-tell/no-low-punctuation-entropy.md) | 句読点・約物の種類の偏り | info |
| [no-monotonous-function-word-bigrams](./ai-tell/no-monotonous-function-word-bigrams.md) | 「〜は〜を〜します」のような助詞の並びの単調さ | info |
| [no-repeated-sentence-ending](./ai-tell/no-repeated-sentence-ending.md) | 同じ文末表現の連続 | info |
| [no-uniform-sentence-rhythm](./ai-tell/no-uniform-sentence-rhythm.md) | 文の長さがずっと揃っている単調なリズム | info |

## 文法ルール（7個）

| ルールID | 何を見つけるか | 重要度 |
|---|---|---|
| [max-ten](./grammar/max-ten.md) | 1つの文の中で読点（、）が使われすぎている状態 | error |
| [no-double-negative-ja](./grammar/no-double-negative-ja.md) | 「〜なくもない」のような遠回しな二重否定表現 | error |
| [no-doubled-conjunction](./grammar/no-doubled-conjunction.md) | 隣り合う文の頭で同じ接続詞が続けて使われている状態 | error |
| [no-doubled-conjunctive-particle-ga](./grammar/no-doubled-conjunctive-particle-ga.md) | 1つの文の中で逆接の「が」が繰り返し使われている状態 | error |
| [no-doubled-joshi](./grammar/no-doubled-joshi.md) | 同じ助詞（で・は・が など）が近い間隔で繰り返し出てくる状態 | error |
| [no-dropping-the-ra](./grammar/no-dropping-the-ra.md) | 「食べれる」のような、いわゆる「ら抜き言葉」 | error |
| [no-mix-dearu-desumasu](./grammar/no-mix-dearu-desumasu.md) | 「である」調と「ですます」調が同じ文書内で混在している状態 | error |

## 校正ルール（12個）

| ルールID | 何を見つけるか | 重要度 |
|---|---|---|
| [ja-no-abusage](./proofreading/ja-no-abusage.md) | 「適応」と「適用」の混同など、よくある言葉の誤用 | error |
| [ja-no-mixed-period](./proofreading/ja-no-mixed-period.md) | 段落の文末に句点「。」が付いていない状態 | info |
| [ja-no-redundant-expression](./proofreading/ja-no-redundant-expression.md) | 「〜することが可能です」のような回りくどい言い回し | info |
| [ja-no-successive-word](./proofreading/ja-no-successive-word.md) | コピー＆ペーストなどで同じ単語がうっかり2回続いている状態 | error |
| [ja-no-weak-phrase](./proofreading/ja-no-weak-phrase.md) | 「〜かも」のような、断定を避ける弱い言い回し | info |
| [ja-unnatural-alphabet](./proofreading/ja-unnatural-alphabet.md) | 日本語の文中に1文字だけのアルファベットが唐突に現れる、IME変換ミスの痕跡 | info |
| [max-comma](./proofreading/max-comma.md) | 1つの文の中で半角カンマ「,」が多用されている状態 | info |
| [max-kanji-continuous-len](./proofreading/max-kanji-continuous-len.md) | 漢字だけの文字列が長く連続している状態 | info |
| [no-exclamation-question-mark](./proofreading/no-exclamation-question-mark.md) | 文中の「！」「？」の使用 | info |
| [no-hankaku-kana](./proofreading/no-hankaku-kana.md) | 「ﾊﾝｶｸ」のような半角カタカナ | error |
| [no-mixed-width-notation](./proofreading/no-mixed-width-notation.md) | 数字やアルファベットの全角・半角表記が同じ文書内で入り混じっている状態 | info |
| [prh](./proofreading/prh.md) | 「サーバー」と「サーバ」のような、同じ言葉の表記ゆれ | info |

## Claude DesktopでもChatGPTでも、同じルールが同じように動きます

英語のルールセットには、Claude Desktop版とWeb版（ChatGPTなどから使えるバージョン）とで検出精度に差がある項目が一部あります（Web版では軽量な代替チェックに置き換えている部分があるため）。日本語のルールセットにはこの差がありません。ここで紹介した31個のルールは、Claude Desktop版でもWeb版でも同じ数・同じ内容がそのまま動きます。これは、日本語の文章解析に、環境を選ばず軽く動く専用の解析エンジンを採用しているためです。どちらの環境で使っても、チェックされる項目やその精度に違いはありません。
