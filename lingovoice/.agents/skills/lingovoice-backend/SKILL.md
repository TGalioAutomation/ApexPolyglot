---
name: lingovoice-backend
description: Hướng dẫn viết/sửa backend LingoVoice — server.mjs, ai.mjs, voice.mjs, db/ (PostgreSQL), auth và sync API. Dùng khi thêm/sửa route API, lớp dữ liệu, migration, đăng nhập, đồng bộ SRS/progress, job admin, hoặc tích hợp AI/TTS trong repo lingovoice.
---

# LingoVoice — Backend & Data Layer

## Mẫu route trong server.mjs

- Toàn bộ dùng `node:http`; đọc JSON body có giới hạn `MAX_BODY_BYTES` (64KB); trả `{ error: "CODE" }` kèm status phù hợp (400 input, 401 auth, 404 `AUDIO_NOT_PREPARED`, 503 `NO_AI`...).
- Auth: Basic Auth chung cho app/admin (env `APP_ACCESS_*`, `ADMIN_ACCESS_*`); account per-learner dùng session cookie HMAC qua `db/auth.mjs` — xem `docs/api-spec.md` mục Auth.
- Route mới phải có: validate → gọi store → trả JSON → mục mới trong `docs/api-spec.md` → test trong `test/server.test.mjs` (mock như các route cũ).

## Lớp dữ liệu (db/)

- `db/store.mjs` là **interface store**: toàn bộ truy vấn đi qua đây, không ai khác chạm `pg` trực tiếp. Lý do: test unit inject store giả (giữ `npm test` chạy không cần PG), integration test chỉ chạy khi có `TEST_DATABASE_URL`.
- `db/migrate.mjs` + `db/migrations/NNN_tên.sql`: migration bất biến, đã merge thì không sửa file cũ — tạo file mới. Mỗi migration phải chạy được lặp lại an toàn (IF NOT EXISTS), ghi vào `schema_migrations`.
- Password hash: `node:crypto` scrypt + salt riêng; session token: HMAC-SHA256 ký bằng `SESSION_SECRET`, lưu hash trong `sessions`.
- Upsert sync: dùng `INSERT ... ON CONFLICT ... DO UPDATE` — hợp đồng sync nằm ở `docs/data-model.md` (mục sync).

## Tích hợp AI / TTS

- `ai.mjs`: provider thử theo thứ tự fallback (DeepSeek → Gemini → OpenAI), JSON có schema phải qua validator khớp **đúng tập key**. Giọng/nhân vật giáo viên đổi qua `teacherProfile` trong memory, không hardcode trong prompt.
- `voice.mjs`: cache key SHA-256 gồm (designVersion | lang | model | voice | text | speed | params); đổi thiết kế giọng phải tăng `designVersion` để cache tái sinh.
- Pregen: literal mới trong `public/app.js`/`learning.js` cần audio → chạy `npm run pregen` và commit manifest.

## Checklist hoàn thành task backend

1. `npm run check` + `npm test` xanh.
2. Route/schema mới → docs cập nhật.
3. Không commit `.env`, `data/`, `cache/`.
4. Không log secret; không trả secret qua API admin.
