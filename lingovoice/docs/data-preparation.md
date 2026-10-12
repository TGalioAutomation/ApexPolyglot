# LingoVoice — Tài liệu chuẩn bị dữ liệu từ vựng (Data Preparation)

> Phiên bản: 1.0 · Mục đích: chuẩn bị dữ liệu **trước** khi nhập vào app
> Trọng tâm: lộ trình CEFR (chuẩn tiếng Anh quốc tế) + học từ theo **tần suất phổ biến** xoay quanh **giao tiếp công việc**
> Phạm vi: tiếng Anh (chính) và 中文 (kèm theo); dữ liệu phục vụ Vocabulary Studio + lộ trình CEFR trong `public/`

> Vận hành: dùng `/admin` để chạy audit, batch preparation, kiểm duyệt và theo dõi job. App người học chỉ đọc JSON/WAV đã chuẩn bị; không khởi chạy generation khi đang học.

---

## 1. Mục tiêu

Chuẩn bị một kho từ vựng có cấu trúc, có chất lượng, theo thứ tự ưu tiên:

1. **Đủ để đo tiến độ CEFR**: từ A1 (~500) → C2 (~16.000 từ) với ranh giới rõ ràng.
2. **Ưu tiên tần suất**: từ phổ biến (freq 1–2) được chuẩn bị và đưa vào học **trước** từ hiếm.
3. **Nhóm giao tiếp công việc**: mỗi mức đều có một phần từ vựng `workplace` (họp, email, phỏng vấn, thuyết trình, đàm phán…) để người học hướng nghề nghiệp đạt nhanh.
4. **Chất lượng cao**: mỗi mục có IPA/từ loại/nghĩa tiếng Việt/ví dụ/collocations; dữ liệu sinh bởi AI **phải qua preview/edit + kiểm duyệt** trước khi vào kho.

---

## 2. Schema dữ liệu (một mục từ)

### 2.1 English

```json
{
  "id": "en-b1-meeting-01",
  "term": "attend",
  "pos": "verb",
  "ipa": "/əˈtend/",
  "meaning": "tham dự, có mặt",
  "example": "I will attend the meeting at ten.",
  "translation": "Tôi sẽ tham dự cuộc họp lúc mười giờ.",
  "collocations": ["attend a meeting", "attend a conference"],
  "freq": 1,
  "workplace": true,
  "topic": "Công việc",
  "cefr": "B1",
  "source": "oxford-3000 | bnc-top-1000",
  "reviewed": false
}
```

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | string | ✓ | unique, gợi ý: `{lang}-{cefr}-{topic}-{n}` |
| `term` | string | ✓ | từ/cụm chính |
| `pos` | string | ✓ | noun/verb/adjective/adverb/phrase… |
| `ipa` | string | ✓ (EN) | IPA có trọng âm `ˈ` |
| `meaning` | string | ✓ | nghĩa tiếng Việt ngắn, 1–2 nghĩa phổ biến nhất |
| `example` | string | ✓ | câu ví dụ tự nhiên, đúng level |
| `translation` | string | ✓ | dịch tiếng Việt câu ví dụ |
| `collocations` | string[] | ✓ | đúng 2 cụm hay dùng |
| `freq` | int 1–5 | ✓ | 1 = rất phổ biến … 5 = ít gặp (tham chiếu BNC/COCA) |
| `workplace` | boolean | ✓ | có dùng phổ biến trong giao tiếp công việc |
| `topic` | string | ✓ | chủ đề (Công việc, Học tập, Du lịch…) |
| `cefr` | string | ✓ | A1..C2 |
| `source` | string | khuyến khích | danh sách tham chiếu |
| `reviewed` | boolean | ✓ | đã qua human review |

### 2.2 中文

```json
{
  "id": "zh-a2-work-01",
  "term": "开会",
  "pinyin": "kāihuì",
  "meaning": "họp, họp hành",
  "example": "我们明天下午开会。",
  "examplePinyin": "Wǒmen míngtiān xiàwǔ kāihuì.",
  "translation": "Chúng ta họp vào chiều mai.",
  "note": "Verb-object: 开 + 会.",
  "freq": 1,
  "workplace": true,
  "topic": "Công việc",
  "cefr": "A2",
  "reviewed": false
}
```

Lưu ý: với 中文, `pinyin` **luôn có dấu thanh**; màu không được là tín hiệu duy nhất cho thanh điệu.

---

## 3. Lộ trình số lượng từ theo CEFR (mục tiêu)

Số lượng là **ước lượng tham chiếu phổ biến** (CEFR vocabulary size estimates):

| Level | Tổng từ dồn tích | Thêm mới | Trọng tâm giao tiếp |
|---|---:|---:|---|
| **A1** | ~500 | 500 | chào hỏi, giới thiệu, số, thời gian |
| **A2** | ~1.500 | 1.000 | mua sắm, du lịch, hẹn lịch, email ngắn |
| **B1** | ~2.500 | 1.000 | họp, email, ý kiến, kế hoạch |
| **B2** | ~5.000 | 2.500 | thuyết trình, phỏng vấn, báo cáo |
| **C1** | ~8.000 | 3.000 | đàm phán, thuyết phục, văn phong linh hoạt |
| **C2** | ~16.000 | 8.000 | dùng gần như người bản xứ |

Mỗi mức, **ít nhất 20–30%** mục là `workplace: true` (trừ A1 có thể ~15%), để người học hướng công việc có lộ trình riêng.

### 3.1 Cách chọn từ theo tần suất (EN)

1. Lấy danh sách tần suất tham chiếu: **BNC/COCA top 5000**, **Oxford 3000/5000**, **English Profile (CEFR)**.
2. Gán CEFR theo nguồn (Oxford/English Profile đã gắn sẵn); với từ không có, ước lượng theo thứ hạng tần suất:
   - top 500 → A1
   - top 1.500 → A2
   - top 2.500 → B1
   - top 5.000 → B2
   - trên 5.000 nhưng phổ biến ngành → C1/C2
3. Gán `freq`:
   - top 500 → 1
   - 501–2.000 → 2
   - 2.001–5.000 → 3
   - 5.001–10.000 → 4
   - còn lại → 5
4. Đánh dấu `workplace` bằng danh sách tình huống nghề nghiệp (mục 4).

### 3.2 Nhóm giao tiếp công việc (workplace)

Danh mục tình huống ưu tiên (mỗi tình huống ~50–80 từ ở giai đoạn đủ dữ liệu):

| Tình huống | Ví dụ từ |
|---|---|
| Họp (meetings) | agenda, attend, discuss, minutes, decision, action item |
| Email & tin nhắn | attach, forward, reply, regarding, deadline, cc |
| Điện thoại | hold on, available, call back, extension, message |
| Phỏng vấn | experience, strength, weakness, salary, apply |
| Thuyết trình | slide, audience, summary, highlight, conclude |
| Đàm phán | offer, counter, budget, discount, agreement, term |
| Báo cáo & dự án | report, milestone, progress, status, risk, deliverable |
| Khách hàng & mua hàng | client, invoice, purchase, supplier, order, warranty |
| Lương & phúc lợi | salary, bonus, benefit, raise, leave, insurance |

Quy tắc: một từ chỉ vào **một tình huống chính** (ghi trong `topic`); nếu dùng rộng khắp thì `topic: "Công việc"`.

---

## 4. Quy trình chuẩn bị dữ liệu (pipeline)

```
[1] Trích danh sách tham chiếu (BNC/COCA/English Profile)
   → [2] Gán CEFR + freq + workplace theo quy tắc
   → [3] Sinh thẻ đầy đủ bằng LLM (schema + validator) — batch
   → [4] Preview/edit + dedupe + kiểm tra chất lượng (script)
   → [5] Human review mẫu + đánh dấu reviewed
   → [6] Xuất JSON → nạp vào app
```

### Bước 3 — Sinh thẻ bằng LLM (dùng endpoint đã có)

Dùng `POST /api/vocab/card` (schema trong `ai.mjs`) cho từng term, theo batch:

```bash
# ví dụ lệnh batch (skeleton)
node scripts/prep-vocab.mjs --lang en --cefr B1 --topic "Công việc" --limit 50
```

- Mỗi thẻ được trả về đúng schema; **bắt buộc** có `freq` 1–5, `workplace`, `pos`, `ipa`, `collocations` (EN).
- Thẻ AI **chưa tự động vào kho**: đi qua bước preview/edit (giao diện Word Bank đã có) hoặc file JSON trung gian.

### Bước 4 — Kiểm tra chất lượng (script tự động)

- **Dedupe**: trùng `term` (và `term` + `pos` nếu đa nghĩa) → cảnh báo/loại.
- **IPA**: có ít nhất 1 ký tự IPA + trọng âm `ˈ` (EN).
- **Nghĩa**: `meaning` không rỗng, ≤ 200 ký tự, không chứa term lặp thừa.
- **Ví dụ đúng level**: độ dài câu theo CEFR (A1 ≤ 6 từ, A2 ≤ 9, B1 ≤ 13, B2 ≤ 17, C1+ tự do).
- **freq hợp lệ**: 1–5 và khớp thứ hạng tham chiếu (sai lệch > 2 mức thì gắn cờ).
- **workplace**: từ trong danh sách tình huống phải có `workplace: true`.

### Bước 5 — Human review

- Mẫu duyệt: ≥ 5 mục/level/chủ đề, duyệt bởi người giỏi tiếng Anh/Trung + người Việt bản địa.
- Tiêu chí duyệt: nghĩa tiếng Việt tự nhiên, IPA đúng, collocations dùng thật, câu ví dụ không quá khó/dễ.
- Đánh dấu `reviewed: true` khi đạt; chỉ `reviewed` mới tính vào "từ đã học hợp lệ".

### Bước 6 — Nạp vào app

- Tệp: `data/vocab-en.json`, `data/vocab-zh.json` (không nằm trong `public/` trừ khi cần offline).
- App đọc: hiện tại `VOCAB_BASE` nội tuyến trong `public/learning.js`; chuyển sang **tải JSON** khi kho lớn (fetch `/data/vocab-en.json`) với cache local, giữ nguyên schema để Vocabulary Studio không đổi.
- Nhập thêm từ do người dùng tạo: `store.custom` (đã có) — không trùng với kho chính (dedupe theo `term`).

---

## 5. Định dạng tệp xuất

```json
{
  "version": 1,
  "lang": "en",
  "updatedAt": "2026-08-15",
  "items": [ /* mảng mục theo schema mục 2 */ ]
}
```

Kích thước theo giai đoạn (EN):

| Giai đoạn | Số từ | Phạm vi |
|---|---|---|
| MVP (hiện tại) | ~22 | demo nội tuyến |
| Giai đoạn 1 | 300 | A1–A2, ưu tiên freq 1–2 + workplace |
| Giai đoạn 2 | 1.500 | đủ A2 + phần B1 |
| Giai đoạn 3 | 2.500 | đủ B1 |
| Giai đoạn 4 | 5.000 | đủ B2 |
| Giai đoạn 5+ | 8.000+ | C1–C2 theo nhu cầu |

Ước lượng tốc độ chuẩn bị: ~100–200 mục/ngày với LLM batch + review (đã tính thời gian kiểm duyệt).

---

## 6. Tiêu chí hoàn thành (Definition of Ready)

- [ ] Schema ổn định (mục 2) và đã có validator tương ứng trong `ai.mjs`.
- [ ] Quy tắc CEFR + freq (mục 3) được code hóa trong script chuẩn bị.
- [ ] ≥ 300 mục EN (A1–A2) đạt mọi kiểm tra tự động, `reviewed` mẫu ≥ 30 mục.
- [ ] Nhóm workplace ≥ 60 mục tình huống công việc ở giai đoạn 1.
- [ ] App đọc được tệp JSON xuất mà không sửa schema Vocabulary Studio.
- [ ] Không có `term` trùng trong cùng ngôn ngữ.

---

## 7. Việc cần làm tiếp theo

1. Viết `scripts/prep-vocab.mjs` (batch gọi `/api/vocab/card` + kiểm tra chất lượng + xuất JSON).
2. Chuẩn bị danh sách 300 từ A1–A2 đầu tiên (nửa là freq 1–2, ~60 từ workplace).
3. Chuyển app đọc từ `data/vocab-en.json` + `data/vocab-zh.json` (giữ `store.custom` cho từ tự thêm).
4. Bổ sung human review cho mẫu mỗi level/chủ đề.
