# Chiến lược kiểm thử LingoVoice

## 1. Các tầng test

| Tầng | Công cụ | Phạm vi | Yêu cầu môi trường |
|---|---|---|---|
| Syntax + audit | `npm run check` | `node --check` mọi module + audit vocab data | không |
| Unit logic | `node --test` | SRS (`srs-core`), writing-core, placement, voice-design, vocab data | không |
| API/UI integration | `node --test test/server.test.mjs` + `test/*-ui.test.mjs` | HTTP thật với **mock OpenVox + mock DeepSeek** (không cần service ngoài) | không |
| DB integration | `node --test test/db-integration.test.mjs` | Migration + store + auth + sync trên PostgreSQL thật | `TEST_DATABASE_URL` |
| Content (roadmap #2) | `node --test test/content-core.test.mjs test/content-seed.test.mjs test/content-api.test.mjs` | Gộp nội dung DB vào literal (UMD), validate CMS + seed idempotent, API đọc `/api/content/*` (spawn server, DB chết → 503; DB sống → shape mirror literal) | phần DB sống cần `TEST_DATABASE_URL` |

`npm test` **phải xanh mà không cần PostgreSQL/OpenVox/key AI** — nhờ inject store mock
và mock server cho service ngoài. DB test tự skip khi không set `TEST_DATABASE_URL`.

## 2. Hợp đồng test UI

Test UI khởi tạo DOM từ `public/index.html` thật (parse/innerHTML) và đọc id/role/aria:
`#mainTabs`, `#bottomNav`, `#tab-*`. Redesign UI không được phá các hợp đồng này;
nếu thay đổi có chủ đích → sửa test cùng commit + nêu lý do trong commit message.

## 3. Mock pattern

Mock server OpenVox/DeepSeek khởi động trong chính test file (`node:http` listen cổng 0),
trỏ env sang mock rồi mới import server — mô phỏng cả lỗi 429/503/timeout để test fallback.

## 4. Kiểm chứng visual

Task đổi UI kết thúc bằng: render từng view (server thật + trình duyệt headless), chụp ảnh,
tự soát + judge: layout vỡ, contrast, touch-target, trạng thái empty/error. Ảnh lưu ngoài repo.

## 5. Smoke trước khi bàn giao

```bash
npm start &                        # hoặc docker compose up
curl -s localhost:4174/healthz
curl -s -X POST localhost:4174/api/auth/register -d '{"username":"smoke","password":"password123"}'
curl -s -X POST localhost:4174/api/sync/push -b cookie.txt -d '{...}'
```
