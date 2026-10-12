# Tasks — CMS nội dung (Roadmap #2)

> Test-first: mỗi task функциональ có test tương ứng chạy `npm test`. ✅ = xong.

## Phase A — nội dung lên DB + API đọc (commit 1)
- [ ] A1. Migration `007_content_lifecycle.sql` (status/provider/model/updated_at cho 3 bảng; vi_title cho roleplay; kind 'sentence'; index status). Test: `test/content-store.test.mjs` chạy migration lên TEST_DATABASE_URL (skip nếu thiếu).
- [ ] A2. `db/store.mjs`: methods content — `listContent`, `getContent`, `upsertContent` (lesson: transaction cha+items), `setContentStatus`, `deleteContent`, `contentCounts`. Test unit với mock pool? Không — integration qua TEST_DATABASE_URL; phần thuần logic (mapping payload↔row) tách hàm `db/content-map.mjs` test không cần DB.
- [ ] A3. `scripts/seed-content.mjs`: extract literal (tái dùng `extractLiteral` export từ pregen.mjs) → upsert reviewed theo id gốc; in thống kê; idempotent. Test unit: chạy với store in-memory giả (interface hàm upsert) kiểm không nhân bản.
- [ ] A4. API đọc `GET /api/content/lessons|readings|roleplay` trong server.mjs: chỉ reviewed, mirror shape, `DB_OFF` 503, `LANG_INVALID` 400. Test: server.test.mjs (DB chết → DB_OFF; có TEST_DATABASE_URL → seed + đọc đúng shape).
- [ ] A5. `pregen.mjs`: `collectContent({store})` gộp nguồn DB reviewed; admin.startPregen truyền store; CLI tự nối DATABASE_URL. Test: collectContent với store mock trả texts mong muốn.
- [ ] A6. Frontend fetch fallback: app.js (`LESSONS`) + learning.js (`READING_TEXTS`, `ROLEPLAY_SCENARIOS`) hook init, timeout 2.5s, không đổi id/role DOM. Test: `test/content-ui.test.mjs` — mock fetch thành công → literal bị thay; fetch fail → giữ nguyên.
- [ ] A7. Docs: api-spec §3 (API đọc), data-model (cột mới + ERD), architecture (nguồn nội dung DB-first), testing. `npm run check` + `npm test` xanh.

## Phase B — Admin CMS + AI nháp (commit 2)
- [ ] B1. `ai.mjs`: `generateReadingDraft({lang,level})`, `generateRoleplayDraft({lang})`, `generateLessonDraft({lang,topic})` + validator chặt. Test unit: mock provider trả JSON sai shape → null/retry; đúng shape → qua.
- [ ] B2. API admin `/api/admin/content/*` (list/ai-draft/create/update/review/delete) + job `content-seed`. Validate theo plan; test integration (TEST_DATABASE_URL) + unit validator không DB.
- [ ] B3. UI CMS trong `public/admin/`: 3 tab + bảng + modal soạn + nút AI nháp/duyệt/xóa + nút nạp gốc. Test: `test/admin-content-ui.test.mjs` (DOM id/role ổn định, render trạng thái rỗng/lỗi).
- [ ] B4. Judge visual các màn admin mới (render thật + screenshot); sửa tới pass.
- [ ] B5. Docs: api-spec §5, ui-design (màn CMS), roadmap-2026 đánh dấu tiến độ #2 phase A/B. `npm run check` + `npm test` xanh.

## Song song hoá
A1→A2→(A3‖A4)→A5→A6→A7; B1‖B2 → B3 → B4 → B5.
