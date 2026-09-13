# Research — Roadmap #2: Nền tảng nội dung + Admin CMS

> Digest nghiên cứu (app-explorer, 2026-09-13). Đầu vào cho app-architect viết spec/plan/tasks. Chỉ WHAT & WHY.

## 1. Mục roadmap chọn

`docs/roadmap-2026.md` — **#2 Nền tảng nội dung + Admin CMS** (thứ tự gợi ý: #1 ✅ → #4 ✅ → **#2** → #5 → #3).

Trích yêu cầu gốc:
> "bài học/tài liệu đọc/kịch bản roleplay đang hardcode trong `app.js`/`learning.js` — thêm nội dung phải đụng code + pregen audio."
> "đưa `lessons/lesson_items/readings/roleplay_scenarios` vào DB (schema đã có sẵn trong migration 004*); admin CMS soạn nội dung; pipeline AI soạn nháp → human review → duyệt (`reviewed`) → tự sinh audio pregen theo job."
> Done khi: "giáo viên/quản trị tự thêm bài mà không cần dev; nội dung mới ra mắt trong ngày."

(*) Ghi chú: schema nội dung thực tế nằm ở **`db/migrations/003_content.sql`**, không phải 004 (004 là activity/gamification).

## 2. Hiện trạng liên quan

### 2.1 Nội dung đang hardcode ở frontend (3 nguồn)
- **LESSONS** — `public/app.js:5`: object `{en:[], zh:[]}`, mỗi ngôn ngữ ~5 chủ đề × 3 câu `{id, text, vi, pinyin?}`. Dùng ở màn lessons/quiz (`app.js:150,357,369,554,1243`).
- **ROLEPLAY_SCENARIOS** — `public/learning.js:49`: 6 kịch bản `{id, title, vi}` (restaurant, airport, shopping, interview, hotel, meeting). Select ở `learning.js:3308`; cả object gửi lên `/api/roleplay/turn` (`learning.js:1826`).
- **READING_TEXTS** — `public/learning.js:64` (sau ROLEPLAY): `{en:{1..n:[...]}, zh:{...}}`, mỗi bài `{id, level, title, paragraphs[], questions[{q, options[], answer}]}`.
- **VOCAB_BASE** — `public/learning.js` (literal fallback) + kho chính `data/vocab-en.json` (150 items) / `data/vocab-zh.json` — tổng ~859 mục vocabulary. ĐÃ có pipeline riêng (không thuộc scope #2, nhưng là pattern mẫu).

### 2.2 DB schema đã có sẵn (chưa dùng)
`db/migrations/003_content.sql` — comment gốc: *"Frontend hiện vẫn đọc literal"*:
- `lessons(id, lang, stage, title, order_index, metadata)` — **chưa có cột status/reviewed**.
- `lesson_items(id uuid, lesson_id→lessons, kind ∈ vocab|quiz|listening|reading|shadow, payload jsonb, audio_text, order_index)`.
- `readings(id, lang, level, title, body, metadata)` — body là TEXT (frontend hiện tách `paragraphs[]` + `questions[]` → cần quy ước JSON: `body` text thuần, `metadata.paragraphs/questions` hoặc đổi contract).
- `roleplay_scenarios(id, lang, stage, title, persona, opening, prompts jsonb)` — **đa trường hơn** object frontend `{id,title,vi}` hiện tại.
- `vocab_items` có `reviewed/provider/model` — lessons/readings/roleplay **thiếu cả ba** → cần migration bổ sung (status nháp/duyệt + nguồn AI).

### 2.3 Admin hiện tại
- Bảo vệ: Basic Auth riêng `ADMIN_ACCESS_USER/PASSWORD` (`server.mjs:38-40,254-261`); khi chưa cấu hình chỉ cho loopback. KHÔNG dùng role trong bảng users — admin là kênh riêng, không cần account.
- Route admin: `/api/admin/overview|jobs|jobs/pregen|jobs/audit|jobs/vocab|vocab|vocab/review` (`server.mjs:589-620`).
- `admin.mjs` (215 dòng): `AdminService` — **job queue in-memory, 1 job chạy/1 lúc** (409 nếu bận), types: `audio-pregen`, `data-audit`, `vocab-prepare` (spawn `scripts/prep-vocab.mjs`). `listVocab`/`setVocabReviewed` đọc/ghi **trực tiếp file JSON** `data/vocab-*.json` (atomic qua .tmp+rename) — không qua DB.
- Bảng `jobs` (migration 005) + `store.upsertJob/listJobs` (**db/store.mjs:212-230**) **tồn tại nhưng chưa được dùng** — admin không persist job; constraint `type ∈ (pregen,audit,vocab)` sẽ chặn type mới nếu bắt đầu dùng.
- Dashboard `public/admin/` (index.html 102 dòng + admin.js 119): 1 trang, metric cards + panel Trạng thái dịch vụ / Tạo audio hàng loạt / Kho dữ liệu học (vocab filter+reviewed toggle) / danh sách job poll 2s. Design system: `design-system/lingovoice-admin/MASTER.md` (dark dashboard, density 7/10).

### 2.4 Pattern có sẵn để tái dùng
- **AI nháp có schema**: `ai.mjs` `runStructured({system,user,validator})` (ai.mjs:167-190) + `generateVocabCard` (ai.mjs:194+) — provider fallback DeepSeek→Gemini→OpenAI, validator chặt key + độ dài. Đây là mẫu chuẩn cho "AI soạn nháp bài đọc/kịch bản".
- **Pipeline vocab nháp→review→JSON**: `scripts/prep-vocab.mjs` (đọc terms → AI card → quality check → xuất JSON) + admin job `vocab-prepare` + toggle `reviewed` trong dashboard. **#2 nhân bản pattern này cho 3 loại nội dung còn lại, chuyển đích từ file JSON sang DB.**
- **Pregen audio**: `pregen.mjs` `collectContent()` quét literal LESSONS/VOCAB_BASE/READING_TEXTS/placement bằng `extractLiteral` (eval JS literal) — **fragile**: CMS đưa nội dung lên DB mà không cập nhật collectContent thì audio nội dung mới sẽ KHÔNG được sinh. Cần nguồn collect từ DB (hoặc pregen nhắm mục tiêu theo bài vừa duyệt).
- **Roleplay server** (`server.mjs:834-850`): chỉ cần `scenario.title` — hợp đồng lỏng, DB schema già hơn frontend (persona/opening/prompts chưa được UI dùng).

### 2.5 Ràng buộc nền
- Guest mode + offline-first: app phải chạy khi không đăng nhập/không có DB (server báo "Máy chủ chưa bật database.") → frontend **không được bỏ literal ngay**; DB content cần fallback về literal hiện tại.
- `MAX_BODY_BYTES` mặc định 64KB (`server.mjs:36`) — bài đọc dài + payload JSON có thể chạm trần → route CMS cần cân nhắc nới có kiểm soát hoặc chia nhỏ.
- Quy ước route mới: validate input, lỗi `{error:"<CODE>"}`, docs api-spec §5 (Quản trị), có test; UI copy tiếng Việt.

## 3. Gap cần lấp

1. **Migration**: thêm cột vòng đời (`status draft/reviewed` hoặc `reviewed bool` + `provider/model/updated_at`) cho `lessons`, `readings`, `roleplay_scenarios` (lesson_items theo lesson cha); quy ước ánh xạ payload frontend ↔ cột DB (readings: paragraphs+questions; roleplay: persona/opening/prompts vs `{id,title,vi}`).
2. **Seed**: import 3 khối literal hiện tại vào DB với trạng thái đã duyệt (đảm bảo parity — người học không thấy thay đổi).
3. **API đọc public** (learner): `GET /api/content/...` trả nội dung đã duyệt theo lang/stage/level; frontend fetch rồi fallback literal khi lỗi/rỗng. (Chưa có route `/api/content*` nào — đã grep xác nhận.)
4. **API admin CMS**: list/CRUD nháp + "AI soạn nháp" (runStructured validator riêng cho từng loại) + duyệt/bỏ duyệt + xóa; nằm trong nhóm Basic-auth admin.
5. **Job pregen theo nội dung**: sau khi duyệt, sinh audio cho các text mới (mở rộng AdminService job type + nguồn collect từ DB; lưu ý constraint bảng jobs nếu bắt đầu persist; giữ manifest clobber-safe bbc4772).
6. **UI admin CMS**: panel/màn quản lý 3 loại nội dung trong `public/admin/` (danh sách + trình soạn + nút AI nháp + duyệt) theo design-system admin; vocab đã có UI riêng, không đụng.
7. **Docs + test**: api-spec §5 mở rộng, data-model (sơ đồ + từ điển dữ liệu), architecture (luồng CMS→pregen), testing, ui-design; test unit (validator, seed, API) + integration (server.test.mjs pattern mock) + UI test.

## 4. Rủi ro & open questions

- **Q1 — Phạm vi "bài học" (lessons)**: LESSONS hiện chỉ là thư viện câu theo chủ đề, chưa phải "bài học có cấu trúc" (lesson_items kind vocab/quiz/... chưa có UI tương ứng). Có thể #2 chỉ cần CMS cho **readings + roleplay + lesson_sentences**, còn lesson_items đầy đủ để phase sau? → architect quyết + ghi ADR.
- **Q2 — Nơi lưu `vi` (nhãn tiếng Việt)**: lessons cần topic `vi`, roleplay cần label `vi`; schema chưa có cột → đưa vào `metadata`/`persona` hay thêm cột?
- **Q3 — Fallback literal doubles maintenance**: giữ literal làm fallback nghĩa là sửa 2 nơi. Lựa chọn: (a) literal đóng băng làm "seed offline", nội dung mới chỉ qua DB; (b) sinh file literal từ DB. Khuyến nghị (a) + ghi rõ trong docs.
- **R4 — extractLiteral eval fragile**: khi frontend fetch từ DB, literal vẫn cần cho pregen fallback → collectContent cần thêm nhánh đọc DB và ưu tiên DB khi có.
- **R5 — 64KB body**: form soạn bài đọc dài (nhiều paragraph + questions) có thể vượt MAX_BODY_BYTES → validate + thông báo thân thiện, không âm thầm cắt.
- **R6 — Đa thức giả định stage**: lessons/roleplay có cột stage nhưng frontend hiện không lọc theo stage — CMS nhập stage cho tương lai, API đọc trả tất cả reviewed (đơn giản nhất phase 1).
- **R7 — job 1-lúc-1**: duyệt nhiều bài liên tiếp muốn pregen gộp batch; giữ ràng buộc 1 job (tránh đè OpenVox) + hàng đợi gom input, hoặc chỉ report "chạy pregen thủ công sau khi duyệt xong".
- **R8 — Test cần DB**: content API phụ thuộc PostgreSQL; test integration phải theo pattern hiện có (server.test.mjs dùng store thật hay bỏ qua khi không DATABASE_URL? — kiểm tra khi viết plan).

## 5. Khuyến nghị hướng tiếp cận (WHAT & WHY)

1. **Nhân bản pattern vocab-prepare** (đã chứng minh) thay vì thiết kế pipeline mới: AI nháp qua `runStructured` + validator chặt → lưu DB status `draft` → admin duyệt → `reviewed`. Lý do: giảm rủi ro, code mẫu cùng repo, UI đã quen.
2. **3 phase để hút giá trị sớm**:
   - Phase A (lõi): migration vòng đời + seed literal → DB + API đọc public + frontend fetch-with-fallback. Xong là "nội dung vào DB, learner không đổi hành vi".
   - Phase B (CMS): API admin CRUD + AI nháp + duyệt + UI admin cho **readings & roleplay** (giá trị ngay — 2 loại này adding content miễn phẳng).
   - Phase C (lesson_items đầy đủ + pregen tự động theo duyệt + stage filtering) — chỉ khi A+B ổn.
3. **Pregen**: phase B dùng nút "sinh audio cho nội dung mới" (job type mới, collect từ DB) thay vì auto-trigger phức tạp; giữ 1-job-running.
4. **Không đụng gì**: vocab pipeline (đã chạy), placement, TOEIC, sync.

## 6. Docs cần cập nhật khi implement
- `docs/api-spec.md` — §5 Quản trị (route CMS) + §3 (API đọc content learner).
- `docs/data-model.md` — ERD + từ điển dữ liệu (bảng content + cột mới).
- `docs/architecture.md` — luồng CMS → review → pregen; nguồn nội dung (DB-first, literal fallback).
- `docs/ui-design.md` — màn CMS admin.
- `docs/testing.md` — test matrix mới.
- `docs/roadmap-2026.md` — đánh dấu #2 (một khi hoàn tất các phase chính).
