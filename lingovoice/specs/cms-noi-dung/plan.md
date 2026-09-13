# Plan — Nền tảng nội dung + Admin CMS (Roadmap #2)

> Kiến trúc + hợp đồng. Yêu cầu xem `spec.md`; danh sách việc xem `tasks.md`.

## Nguyên tắc kiến trúc
Nhân bản pattern "vocab-prepare" đã chứng minh: AI nháp (runStructured + validator) → lưu DB `draft` → admin duyệt → `reviewed` → learner đọc. **DB-first, literal fallback**: literal trong frontend đóng băng làm seed offline; nội dung mới chỉ qua DB.

## Data model

### Migration 007 (`db/migrations/007_content_lifecycle.sql`)
```sql
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'reviewed'
  CHECK (status IN ('draft','reviewed'));
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE readings   ADD (tương tự status/provider/model/updated_at);
ALTER TABLE roleplay_scenarios ADD (tương tự) + ADD COLUMN IF NOT EXISTS vi_title TEXT NOT NULL DEFAULT '';

-- lesson_items: cho phép kind 'sentence' (thư viện câu mẫu)
ALTER TABLE lesson_items DROP CONSTRAINT lesson_items_kind_check;
ALTER TABLE lesson_items ADD CONSTRAINT lesson_items_kind_check
  CHECK (kind IN ('vocab','quiz','listening','reading','shadow','sentence'));
CREATE INDEX IF NOT EXISTS content_status_idx ON lessons(status), ... (readings, roleplay_scenarios theo status);
```
Lưu ý: bảng đang rỗng (chưa dùng) → ALTER an toàn.

### Ánh xạ nội dung ↔ contract frontend (mirror literal)
| Loại | DB | API trả về (mirror) |
|---|---|---|
| Chủ đề câu mẫu | `lessons(title=topic_vi, metadata)` + `lesson_items(kind='sentence', payload={id,text,vi,pinyin})` | `[{topic, sentences:[{id,text,vi,pinyin?}]}]` |
| Bài đọc | `readings(body=paragraphs.join('\n\n'), metadata={questions}, level)` | `{ "<level>": [{id,level,title,paragraphs[],questions[]}] }` |
| Roleplay | `roleplay_scenarios(title, vi_title, persona, opening, prompts)` | `[{id, title, vi}]` (persona/opening/prompts cho phase sau) |

ID quy tắc: slug từ tiêu đề + suffix ngẫu nhiên khi trùng (`r-en-<slug>-<n4>`); literal seed giữ id gốc.

## API contracts

### Learner (public, sau Basic toàn app nếu bật)
- `GET /api/content/lessons?lang=en|zh` → `{lessons:[{topic,sentences:[...]}]}` — chỉ reviewed, sort order_index.
- `GET /api/content/readings?lang=` → `{levels:{"1":[...],"2":[...]}}` chỉ reviewed.
- `GET /api/content/roleplay?lang=` → `{scenarios:[{id,title,vi}]}` chỉ reviewed.
- DB tắt: 503 `{error:"DB_OFF",code:"DB_OFF"}`; lang sai: 400 `LANG_INVALID`.

### Admin (Basic auth admin, prefix `/api/admin/content`)
- `GET /api/admin/content/:type?lang=&status=` → `{type, items:[row...]}` (row có status/provider/model/updatedAt).
- `POST /api/admin/content/:type/ai-draft` body `{lang, level?, topic?}` → 201 row draft; 503 `NO_AI`.
- `POST /api/admin/content/:type` (tạo tay) body theo loại → 201 row.
- `PUT /api/admin/content/:type/:id` (sửa) → 200 row.
- `POST /api/admin/content/:type/:id/review` body `{reviewed:boolean}` → 200 row.
- `DELETE /api/admin/content/:type/:id` → 200 `{ok:true}`.
- `:type ∈ lessons|readings|roleplay`; sai → 400 `TYPE_INVALID`.
- Validate mỗi loại: mảng câu 1–12 mục, mỗi câu text ≤300 / vi ≤300 / pinyin ≤200; reading paragraphs 1–8 × ≤1200 ký tự, questions 0–10, options 2–4 & answer index hợp lệ; roleplay title ≤120, vi ≤160.
- Job seed: `POST /api/admin/jobs/content-seed` (type mới của AdminService, gọi `scripts/seed-content.mjs` logic import).

### Pregen
`collectContent(options)` nhận thêm `{store}`: khi có store và DB sống → gộp texts từ 3 bảng reviewed (câu mẫu, từng câu bài đọc tách như literal, opening/prompts roleplay) + literal fallback. `admin.startPregen` truyền store của server; chạy CLI `node pregen.mjs` tự tạo store nếu `DATABASE_URL` (migrate:false).

## Tech stack
Không thêm dependency. Server node:http thuần + `pg` có sẵn; admin UI vanilla JS mở rộng `public/admin/`; AI qua `ai.mjs` hiện có; test `node --test` + pattern mock của `server.test.mjs`.

## Frontend learner (tối thiểu, không phá test)
- `public/app.js`: hàm `LV.loadRemoteContent()` fetch 3 endpoint (Promise.allSettled, timeout 2.5s qua AbortController); kết quả gán đè key vào `LESSONS[lang]` (const object mutable) trước khi render màn lessons; thất bại → giữ literal.
- `public/learning.js`: tương tự cho `READING_TEXTS` (gán đè theo level-key) và `ROLEPLAY_SCENARIOS` (length=0 + push) TRƯỚC khi populate select/init màn học. Hook vào điểm init hiện có, giữ nguyên mọi id/role DOM.

## UI Admin CMS (`public/admin/`)
- Section mới "Nội dung học (CMS)" với 3 tab: Bài đọc / Kịch bản roleplay / Chủ đề câu mẫu. Mỗi tab: filter ngôn ngữ + status, bảng danh sách (tiêu đề, level/số câu, trạng thái chip, cập nhật), hàng thao tác: Sửa / Duyệt(↩Bỏ duyệt) / Xóa(confirm) / AI soạn nháp (nút riêng từng tab + cho hàng đang sửa).
- Trình soạn: modal form theo loại (các trường của loại đó), nút Lưu (PUT/POST), hiển thị lỗi validate từ server.
- Nút "Nạp nội dung gốc" (job content-seed) + sau khi duyệt nhắc chạy "Đảm bảo đủ audio" (job pregen hiện có).
- Theo `design-system/lingovoice-admin/MASTER.md`: dark, metric-card/panel pattern, chip status (accent=draft? dùng amber cho draft, accent green cho reviewed).

## Risks & mitigations
- extractLiteral eval giữ nguyên cho seed (chỉ chạy server-side, input là file repo).
- Bài đọc dài vs MAX_BODY_BYTES 64KB: tổng chữ validated ≤ ~10KB/bài — xa trần; vẫn bắt lỗi 413 thân thiện.
- Job 1-lúc-1 giữ nguyên (đủ cho quy mô này).
- Test DB: theo `TEST_DATABASE_URL` như db-integration.test.mjs; unit test validator/service chạy không cần DB (mock store).

## Commit plan
1. `feat: nội dung học lên DB + API đọc + seed (roadmap #2 phase A)` — migration, store, seed, API đọc, pregen nguồn DB, frontend fetch fallback, docs, test.
2. `feat: admin CMS soạn/duyệt nội dung + AI nháp (roadmap #2 phase B)` — API admin, AI draft fns, UI CMS, judge visual, docs, test.
