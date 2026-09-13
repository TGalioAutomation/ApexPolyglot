# Đặc tả API LingoVoice

> Quy ước chung: JSON body, lỗi trả `{ "error": "<mô tả>", "code": "<MÃ_LỖI>" }`.
> Body giới hạn 64KB (`MAX_BODY_BYTES`). Auth: Basic Auth chung (`APP_ACCESS_*`) cho toàn app;
> admin routes cần `ADMIN_ACCESS_*` (không set password → chỉ loopback). Các route `[account]`
> cần session cookie từ Auth API (mục bên dưới).

## 1. Auth & đồng bộ — MỚI (redesign 2026-08)

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký learner/parent: `{ username, password, displayName?, ageGroup?, role? ("learner"\|"parent", mặc định learner) }` → `{ user, token? }`; set cookie `lv_session` HttpOnly. Lỗi: `USERNAME_TAKEN`, `WEAK_PASSWORD` (≥8 ký tự) |
| POST | `/api/auth/login` | `{ username, password }` → `{ user }` + cookie. Lỗi: `INVALID_CREDENTIALS` |
| POST | `/api/auth/logout` | Xóa session (cookie + dòng `sessions`) → `{ ok: true }` |
| GET | `/api/auth/me` | `[account]` → `{ user: { id, username, displayName, role, ageGroup } }` hoặc 401 `NO_SESSION` |
| POST | `/api/sync/push` | `[account]` Upsert SRS/mistakes/progress/profile/teacherProfile — shape xem `data-model.md` §2 → `{ accepted: { srs, mistakes } }` |
| GET | `/api/sync/pull` | `[account]` → toàn bộ dữ liệu học của user (cùng shape push) |
| POST | `/api/sync/import-local` | `[account]` Import payload localStorage kiểu cũ (key `lv-*`, `lingovoice-progress`), idempotent → `{ imported: { srs, mistakes, profile } }` |

Session: token HMAC-SHA256 (`SESSION_SECRET`), cookie `HttpOnly; SameSite=Lax`, TTL 30 ngày.
Server thiếu `DATABASE_URL` → các route trên trả 503 `DB_UNAVAILABLE`.

## 1b. Gamification & phụ huynh — MỚI (roadmap #4)

XP: lượt đúng +10, lượt sai +2, từ học mới +3, mỗi phút học +1 (tối đa 60 XP/ngày từ phút).
Cấp độ theo tổng XP: Hạt giống 0 → Mầm non 100 → Chồi xanh 300 → Cây nhỏ 600 → Cây vững 1000 → Cây cổ thụ 2000 → Khu rừng nhỏ 3500.
Định nghĩa huy hiệu/cấp độ là code thuần trong `db/gamification.mjs`; DB chỉ lưu huy hiệu đã đạt (`earned_badges`).
`day` là khóa NGÀY THEO MÚI GIỜ CỦA NGƯỜI HỌC (`YYYY-MM-DD`, client gửi; server chấp nhận lệch tối đa +1 ngày so UTC, lùi xa tối đa 400 ngày).

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/activity` | `[account]` Ghi nhận hoạt động: `{ day?, minutes ≤240, words ≤500, attempts ≤200: [{ kind: vocab\|listening\|writing\|speaking\|reading\|quiz, itemRef?, correct?, grade 1-5?, lang? }] }` → cộng dồn `daily_activity`, chấm XP, phát huy hiệu mới → summary (như GET summary) + `{ added: { xp, minutes, words, attempts } }` |
| GET | `/api/gamification/summary?day=` | `[account]` → `{ xp: { total, today, week }, streak: { current, longest }, level, badges: [{ id, name, icon, desc, earned, earnedAt }], newBadges, srs: { total, mastered }, days: 14 ngày gần nhất, activity: { daysActive, minutes7d, words7d, lastActiveDay, missedDays } }` |
| POST | `/api/parent/invite` | `[parent]` Tạo mã liên kết 8 ký tự (1 lần dùng, hạn 7 ngày) → `{ code, expiresAt }` |
| GET | `/api/parent/invites` | `[parent]` Mã còn hiệu lực chưa dùng |
| GET | `/api/parent/children` | `[parent]` Con đã liên kết + tóm tắt: streak, XP, phút/7 ngày, ngày học gần nhất |
| GET | `/api/parent/children/{id}/dashboard?day=` | `[parent]` Nhánh liên kết bắt buộc (404 `CHILD_NOT_LINKED`) → dashboard 14 ngày: days[], streak, xp, srs (+`due`), attempts theo kỹ năng, topMistakes, badges, suggestions[] (rule-based, không AI) |
| DELETE | `/api/parent/children/{id}` | `[parent]` Gỡ liên kết |
| POST | `/api/parent/link` | `[account]` Con nhập mã: `{ code }` → `{ parent }`. Lỗi 404 `INVITE_CODE_INVALID` |
| GET | `/api/parent/links` | `[account]` Danh sách phụ huynh đang chia sẻ |
| DELETE | `/api/parent/link/{parentId}` | `[account]` Con ngừng chia sẻ |

Sai vai trò → 403 `ROLE_REQUIRED` (ví dụ learner gọi `/api/parent/invite`).

## 2. Giọng nói

| Method | Path | Auth | Mô tả |
|---|---|---|---|
| GET | `/healthz` | mở | Health check |
| GET | `/api/voice/status` | app | Trạng thái OpenVox + model/voice đang dùng + `{ deliveryMode: "prepared-only", prepared: stats }` |
| POST | `/api/voice/prepared` | app | `{ text ≤2000, language: "en"\|"zh", model?, voice?, speed? }` → WAV từ manifest pregen. 404 `AUDIO_NOT_PREPARED` → client fallback giọng máy |
| POST | `/api/voice/teacher` | app | `{ text ≤2000, language: "vi"\|"en"\|"zh", ... }` → WAV tổng hợp có cache đĩa (dành cho câu trả lời động của Cô Linh) |
| GET | `/api/voice/options` | app | Model + voice khả dụng theo ngôn ngữ |
| POST | `/api/voice/speak` | admin | Tổng hợp live — control-plane only |
| POST | `/api/voice/speak/stream` | admin | Streaming TTS (SSE `audio.chunk`), vừa stream vừa cache |

## 3. Học tập

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/placement/start` | `{ language }` → đề 6 câu (không kèm đáp án) |
| POST | `/api/placement/submit` | `{ language, answers }` → `{ overall, level 1-7, skills, weakest, caveat }` — định tuyến 100%, LLM không tham gia |
| POST | `/api/vocab/card` | `{ term, language }` → thẻ từ vựng AI sinh, JSON schema nghiêm ngặt (EN: ipa/pos/collocations×2/freq/workplace; ZH: pinyin có thanh điệu) |
| POST | `/api/writing/feedback` | `{ prompt, text }` → `{ praise, fix, corrected, why, retry }` |
| POST | `/api/roleplay/turn` | `{ scenario, history[], userText }` → `{ reply, hint }` |
| POST | `/api/roleplay/feedback` | `{ scenario, history[] }` → `{ praise, topFix, corrected, next }` |
| POST | `/api/pronunciation/feedback` | `{ target ≤300, heard ≤300 (transcript STT), language, level 1-7?, ipa?, diff?: [{ word, heard, status ok\|wrong\|missing } ≤60] }` → `{ score 0-100, praise, issues ≤4: [{ word, heardAs, tip }], drill }` — client so từng từ bằng `public/pron-core.cjs` (không cần mạng, chấm theo bản STT khớp nhất trong các alternatives) và gửi kèm `diff`; khi có `diff` server chấm lại `score` bằng cùng bộ so (LLM không tự bịa điểm) và chỉ nhận issues cho từ máy đánh dấu sai/thiếu. Lỗi: 400 thiếu input, 503 `NO_AI`, 502 `AI_ERROR` |
| POST | `/api/teacher/chat` | `{ learnerId?, message, history[] }` → câu trả lời Cô Linh có inject trí nhớ dài hạn; câu ví dụ trong `【 】` được đọc TTS |
| GET | `/api/teacher/status` | Provider AI nào đang cấu hình/active |

### 3c. Nội dung học (roadmap #2 — DB-first, literal fallback)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/content/lessons?lang=en\|zh` | `{ lessons: [{ topic, sentences: [{ id, text, vi, pinyin? }] }] }` — chủ đề câu mẫu **đã duyệt** từ DB, sort `order_index`. Mirror literal `LESSONS` trong `app.js` |
| GET | `/api/content/readings?lang=en\|zh` | `{ levels: { "<1-7>": [{ id, level, title, paragraphs[], questions[] }] } }` — bài đọc đã duyệt. Mirror `READING_TEXTS` |
| GET | `/api/content/roleplay?lang=en\|zh` | `{ scenarios: [{ id, title, vi }] }` — kịch bản roleplay đã duyệt. Mirror `ROLEPLAY_SCENARIOS` |

Lỗi: `400 LANG_INVALID` (thiếu/sai lang), `404 NOT_FOUND` (loại lạ), `503 DB_UNAVAILABLE` (chưa bật PostgreSQL — frontend fallback về literal đóng băng trong `public/app.js`/`learning.js`, xem `public/content-core.cjs`). Nội dung nháp (`draft`) không bao giờ lọt các endpoint này.

## 3b. Thi thử TOEIC cuối buổi

Đề sinh **phía client** bằng `public/toeic-core.cjs` (deterministic theo số đề, không dùng LLM — như placement):
50 đề × thời lượng 10 phút (12 câu) / 15 phút (18 câu) / 30 phút (36 câu), 5 dạng câu phỏng TOEIC
(meaning/fill/collocation/listen/translate) ánh xạ sang kỹ năng `vocab` / `reading` / `listening`.
Từ mục tiêu lấy từ SRS của người học (ưu tiên đang học > đến hạn ôn > chưa đến hạn > đã thành thạo),
thiếu thì bơm từ kho vocab theo CEFR dễ lên. Audio câu nghe dùng đúng luồng prepared (pregen term).

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/toeic/submit` | `[account]` `{ day?, form 1-50, durationMin 10\|15\|30, usedSec, attempts[] ≤100: [{ kind: vocab\|reading\|listening, itemRef?, correct }] }` — attempts là nguồn chân lý của điểm (mỗi câu 1 lượt, bỏ trống = `correct:false`). Server tự tính lại total/correct/score/byKind, lưu 1 dòng `learning_sessions` (`skill='toeic'`, stats kèm form/thời lượng) + attempts gắn `session_id`, cộng XP/phút vào `daily_activity` (không double với `/api/activity` — client không tự queue các lượt này) → response = gamification summary (như `/api/activity`) + `{ added, result }`. Lỗi: 400 `TOEIC_INVALID` (0 câu hợp lệ), 401 `NO_SESSION`, 503 `DB_UNAVAILABLE` |
| GET | `/api/toeic/history` | `[account]` → `{ history: [{ id, at, form, durationMin, usedSec, total, correct, score, byKind }] (60 đề gần nhất, mới trước), skills: { vocab/reading/listening: { total, correct } }, stats: { tests, avgScore, bestScore, minutes, recentAvgScore (5 đề gần nhất), previousAvgScore (các đề trước đó) } }` |

Khách chưa đăng nhập: kết quả chỉ lưu localStorage `lv-toeic` (xem `data-model.md`); khi có tài khoản
client gọi submit và xoá nhãn chưa-đồng-bộ sau khi thành công.

## 4. Trí nhớ giáo viên

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/memory?learner=` | Load memory (mặc định `default`). Sau redesign: đọc từ PG khi đăng nhập, fallback JSON file |
| POST | `/api/memory` | `{ learnerId, patch }` deep-merge → memory mới |
| POST | `/api/memory/note` | `{ learnerId, note ≤500 }` thêm note (tối đa 50 note) |

## 5. Quản trị (admin)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/admin/overview` | Tổng quan: Node/OpenVox/AI, catalog WAV, memory, DB |
| GET | `/api/admin/jobs`, `/api/admin/jobs/{id}` | Trạng thái job queue (PG `jobs`, fallback in-memory) |
| POST | `/api/admin/jobs/pregen` \| `audit` \| `vocab` | Nặn job sinh audio / audit vocab / chuẩn bị vocab |
| GET | `/api/admin/vocab?lang=&q=&level=` | Lọc vocab |
| POST | `/api/admin/vocab/review` | Đánh dấu `reviewed` (ghi atomic tmp+rename) |
| GET | `/data/vocab-{en,zh}.json` | Catalog vocab phục vụ client |

### 5b. CMS nội dung học (roadmap #2) — MỚI

`:type ∈ lessons\|readings\|roleplay` (sai → 400 `TYPE_INVALID`). Toàn bộ nhóm yêu cầu Basic Auth admin. Lỗi dùng chung: 400 `LANG_INVALID`/`TITLE_REQUIRED`/`LEVEL_INVALID`/`SENTENCES_INVALID`/`PARAGRAPHS_INVALID`/`ANSWER_INVALID`…, 404 `CONTENT_NOT_FOUND`, 503 `NO_AI`/`DB_UNAVAILABLE`, 502 `AI_ERROR`.

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/admin/content/:type?lang=&status=` | Danh sách (status rỗng = tất cả); item có `status/provider/model/updatedAt` + nội dung theo loại |
| POST | `/api/admin/content/:type` | Tạo bản nháp: `{ lang, topic\|title, sentences\|paragraphs+questions\|vi+persona+opening+prompts }` → 201 item |
| PUT | `/api/admin/content/:type/:id` | Sửa (giữ nguyên status) → 200 item |
| POST | `/api/admin/content/:type/:id/review` | `{ reviewed: boolean }` → chuyển `draft ↔ reviewed` |
| DELETE | `/api/admin/content/:type/:id` | Xóa vĩnh viễn → `{ ok: true }` |
| POST | `/api/admin/content/:type/ai-draft` | `{ lang, level?, topic?, theme? }` → AI soạn nháp (validator schema như vocab card) → 201 item `draft` |
| POST | `/api/admin/jobs/content-seed` | Job nạp nội dung gốc (literal frontend) vào DB, upsert `reviewed` idempotent |

Nội dung `reviewed` được learner đọc qua §3c và được `pregen` quét audio; `draft` chỉ admin thấy.

## 6. Static

`GET /*` phục vụ `public/`; `/admin` → `public/admin/index.html`. Header bảo mật cơ bản +
Cache-Control dài hạn cho `assets/`.
