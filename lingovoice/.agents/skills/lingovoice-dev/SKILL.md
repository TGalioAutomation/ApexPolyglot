---
name: lingovoice-dev
description: Quy ước tổng và vòng kiểm chứng của dự án LingoVoice (webapp học tiếng Anh/Trung voice-driven). Dùng mỗi khi làm bất kỳ task nào trong repo lingovoice — feature, bug, refactor, test hay docs — kể cả khi người dùng không nhắc đến "quy ước" hay "kiến trúc".
---

# LingoVoice — Quy ước dự án

## Bối cảnh bắt buộc nắm trước khi code

1. Đọc `AGENTS.md` ở root (bản đồ repo, guardrails, lệnh chuẩn).
2. Đọc tài liệu liên quan trong `docs/`: đổi API → `docs/api-spec.md`; đổi dữ liệu → `docs/data-model.md`; đổi UI → `docs/ui-design.md`.
3. Kiến trúc cốt lõi: `server.mjs` (node:http thuần) → `ai.mjs` (LLM đa provider) / `voice.mjs` (OpenVox TTS + cache) / `db/` (PostgreSQL store). Frontend SPA vanilla trong `public/`.

## Triết lý không được phá vỡ

- **Ít dependency nhất có thể.** Node core trước, package sau. Dependency hiện có: `pg` (PostgreSQL). Muốn thêm package mới phải nêu lý do trong commit/PR.
- **Placement 100% định tuyến** (`placement.mjs`). LLM không bao giờ chấm bài xếp lớp.
- **Audio learner-facing chỉ trả từ manifest pregen** (`deliveryMode: prepared-only`); thiếu thì client fallback giọng máy, server không tổng hợp live cho learner.
- **Trí nhớ giáo viên là thứ làm nên sản phẩm** — mọi prompt LLM phải inject memory qua `buildMemoryPrompt`.

## Vòng kiểm chứng (bắt buộc trước khi báo xong)

```bash
npm run check   # syntax + audit vocab
npm test        # node --test, phải xanh toàn bộ
```

- Sửa backend có nhánh DB → nếu `TEST_DATABASE_URL` khả dụng, chạy thêm integration test (`node --test test/db-integration.test.mjs`).
- Đổi UI → render từng view và tự soát + judge visual; kiểm tra touch-target ≥ 48px và `:focus-visible`.
- Đổi API/schema/UI → cập nhật docs tương ứng **trong cùng commit**.

## Lỗi môi trường thường gặp

- Repo nằm trong đường dẫn có dấu tiếng Việt, máy này có 2 bản sao NFC/NFD trùng tên: tool file theo đường dẫn tuyệt đối có thể trượt vào bản trống. Luôn dùng **đường dẫn tương đối qua Bash**.
- Port mặc định 4174; OpenVox tại `http://127.0.0.1:8000` — không có OpenVox thì TTS trả 503 và client fallback, không phải lỗi chết.
- Không có key AI thì các route LLM trả 503 `NO_AI` — app vẫn phải chạy được phần còn lại.
