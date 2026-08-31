# Đặc tả API LingoVoice

> Quy ước chung: JSON body, lỗi trả `{ "error": "<mô tả>", "code": "<MÃ_LỖI>" }`.
> Body giới hạn 64KB (`MAX_BODY_BYTES`). Auth: Basic Auth chung (`APP_ACCESS_*`) cho toàn app;
> admin routes cần `ADMIN_ACCESS_*` (không set password → chỉ loopback). Các route `[account]`
> cần session cookie từ Auth API (mục bên dưới).

## 1. Auth & đồng bộ — MỚI (redesign 2026-08)

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký learner: `{ username, password, displayName?, ageGroup? }` → `{ user, token? }`; set cookie `lv_session` HttpOnly. Lỗi: `USERNAME_TAKEN`, `WEAK_PASSWORD` (≥8 ký tự) |
| POST | `/api/auth/login` | `{ username, password }` → `{ user }` + cookie. Lỗi: `INVALID_CREDENTIALS` |
| POST | `/api/auth/logout` | Xóa session (cookie + dòng `sessions`) → `{ ok: true }` |
| GET | `/api/auth/me` | `[account]` → `{ user: { id, username, displayName, role, ageGroup } }` hoặc 401 `NO_SESSION` |
| POST | `/api/sync/push` | `[account]` Upsert SRS/mistakes/progress/profile/teacherProfile — shape xem `data-model.md` §2 → `{ accepted: { srs, mistakes } }` |
| GET | `/api/sync/pull` | `[account]` → toàn bộ dữ liệu học của user (cùng shape push) |
| POST | `/api/sync/import-local` | `[account]` Import payload localStorage kiểu cũ (key `lv-*`, `lingovoice-progress`), idempotent → `{ imported: { srs, mistakes, profile } }` |

Session: token HMAC-SHA256 (`SESSION_SECRET`), cookie `HttpOnly; SameSite=Lax`, TTL 30 ngày.
Server thiếu `DATABASE_URL` → các route trên trả 503 `DB_UNAVAILABLE`.

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
| POST | `/api/teacher/chat` | `{ learnerId?, message, history[] }` → câu trả lời Cô Linh có inject trí nhớ dài hạn; câu ví dụ trong `【 】` được đọc TTS |
| GET | `/api/teacher/status` | Provider AI nào đang cấu hình/active |

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

## 6. Static

`GET /*` phục vụ `public/`; `/admin` → `public/admin/index.html`. Header bảo mật cơ bản +
Cache-Control dài hạn cho `assets/`.
