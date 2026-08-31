# AGENTS.md — Quy tắc làm việc cho AI agent trong repo LingoVoice

> File này được ZCode (và các AI agent tương thích) tự động nạp khi mở repo.
> Mọi agent làm việc trên repo này **phải** tuân thủ các quy tắc dưới đây.

## 1. Dự án là gì

**LingoVoice** — webapp học tiếng Anh + tiếng Trung voice-driven cho người Việt 3–25 tuổi,
chia 4 stage tuổi (3–6, 7–12, 13–17, 18–25). Giáo viên AI "Cô Linh" có trí nhớ dài hạn,
TTS local qua OpenVox, học từ vựng SRS, viết, nói (shadowing + gọi điện roleplay), đọc, nghe.

## 2. Bản đồ repo

| Vị trí | Vai trò |
|---|---|
| `server.mjs` | HTTP server (node:http thuần), static + toàn bộ API |
| `ai.mjs` | Adapter LLM đa provider (DeepSeek → Gemini → OpenAI) + prompt giáo viên + JSON có schema |
| `voice.mjs` | Client OpenVox TTS + cache WAV trên đĩa (SHA-256 key) + manifest |
| `admin.mjs` | Job queue quản trị (pregen audio, audit vocab, chuẩn bị vocab) |
| `memory.mjs` | Trí nhớ dài hạn giáo viên (từng là JSON file; nay lên PostgreSQL qua `db/`) |
| `db/` | **Lớp dữ liệu PostgreSQL**: `migrations/*.sql`, `migrate.mjs`, `store.mjs`, `auth.mjs` |
| `placement.mjs` | Ngân hàng câu hỏi placement + chấm điểm all-định-tuyến (LLM không chấm placement) |
| `pregen.mjs` | Sinh trước audio cho literal frontend (chạy `npm run pregen`) |
| `public/` | SPA vanilla JS: `index.html`, `app.js`, `learning.js`, `styles.css`, `srs-core.cjs`, `writing-core.cjs` |
| `public/admin/` | Dashboard quản trị riêng |
| `public/assets/` | Ảnh minh họa webp (splash, avatar, empty-state, error, offline) |
| `design-system/` | Thiết kế chuẩn UI: `lingovoice-lifelong/MASTER.md` (app) + `lingovoice-admin/MASTER.md` |
| `docs/` | **Tài liệu thiết kế chuẩn** — architecture, data-model, api-spec, ui-design, testing, roadmap, agent-workflow |
| `test/` | Test `node --test`; mock OpenVox + mock DeepSeek trong `server.test.mjs` |
| `android/` | WebView wrapper (Java thuần) + SpeechRecognizer native cho STT |

## 3. Lệnh chuẩn

```bash
npm run check   # node --check toàn bộ module + audit dữ liệu vocab — chạy TRƯỚC KHI commit
npm test        # node --test test/ — phải xanh
npm start       # chạy server, mặc định port 4174
npm run pregen  # sinh trước audio TTS (cần OpenVox)
docker compose up -d postgres   # bật PostgreSQL local
npm run migrate # chạy migration DB (cần DATABASE_URL)
```

## 4. Quy ước code

- **ESM** (`"type": "module"`), file backend đuôi `.mjs`; shared frontend logic dùng `.cjs` để nạp được từ test.
- **Ít dependency nhất có thể**: node:http, node:crypto (scrypt/HMAC), node:sqlite… chỉ thêm package khi thực sự cần (hiện có: `pg`).
- Route mới phải: validate input (giới hạn `MAX_BODY_BYTES`), trả lỗi JSON dạng `{ error: "<CODE>" }`, cập nhật `docs/api-spec.md`, có test.
- Không bao giờ expose secret qua API admin; key AI/TTS chỉ nằm trong `.env`.
- Comment tiếng Việt hoặc tiếng Anh ngắn gọn, chỉ khi code tự nó không diễn giải được ràng buộc.

## 5. Guardrails (cấm / cẩn thận)

- **Cấm** commit `.env`, `data/learner-memory.json`, `cache/`, `.zcode/`, `.DS_Store`.
- **Cấm** đổi `id`/`role`/`aria-*` của các phần tử DOM mà `test/*-ui.test.mjs` phụ thuộc nếu chưa chạy lại test và cập nhật test có chủ đích.
- **Cấm** đưa key AI chấm placement — placement phải định tuyến 100%.
- localStorage frontend dùng key tiền tố `lv-` (`lv-profile`, `lv-srs`, `lv-mistakes`…) — đây là hợp đồng với `POST /api/sync/push`, đổi phải cập nhật cả hai phía.
- Copy UI **tiếng Việt** là ngôn ngữ chính; nội dung học tiếng Anh/Trung giữ nguyên ngữ.

## 6. Môi trường máy này (quan trọng)

- Thư mục repo chứa ký tự tiếng Việt và tồn tại **hai bản sao trùng tên NFC/NFD** trên volume.
  Tool đọc/ghi file theo đường dẫn tuyệt đối có thể trượt vào bản trống.
  → **Luôn thao tác file bằng đường dẫn TƯƠNG ĐỐI từ thư mục repo qua Bash.**
- Node ≥ 22 (máy dev đang chạy v26): dùng được `node:sqlite` nếu cần công cụ phụ, nhưng DB chính là PostgreSQL.

## 7. Vòng làm việc chuẩn của agent

1. Đọc tài liệu liên quan trong `docs/` trước khi code (kiến trúc, api-spec, data-model).
2. Lập kế hoạch ngắn → implement → `npm run check` + `npm test`.
3. Đổi giao diện: chụp màn hình các view đã render và chạy judge visual trước khi báo xong.
4. Cập nhật docs trong cùng commit nếu thay đổi API/schema/UI.
5. Commit theo convention: `feat|fix|refactor|docs|test|chore: mô tả ngắn (tiếng Việt hoặc tiếng Anh)`.
6. Làm trên nhánh `feat/*` hoặc `redesign/*`; không commit trực tiếp lên `main`.

Chi tiết vai trò agent (Planner / Implementer / Reviewer / Judge): xem `docs/agent-workflow.md`.
