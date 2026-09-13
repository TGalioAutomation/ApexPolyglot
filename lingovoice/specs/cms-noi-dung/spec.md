# Spec — Nền tảng nội dung + Admin CMS (Roadmap #2)

> WHAT & WHY. Kiến trúc/chọn kỹ thuật xem `plan.md`. Nguồn: `docs/roadmap-2026.md` #2 + `research.md`.

## Vấn đề
Bài học (thư viện câu), bài đọc, kịch bản roleplay hardcode trong `public/app.js` / `public/learning.js`. Thêm nội dung phải sửa code + chạy pregen — giáo viên/quản trị không tự làm được.

## Mục tiêu (kết quả cho người dùng)
1. **Quản trị tự thêm nội dung không cần dev**: qua dashboard admin, soạn/duyệt bài đọc, kịch bản roleplay, chủ đề câu mẫu; nội dung mới hiện cho người học ngay sau khi duyệt.
2. **AI soạn nháp**: với mỗi loại nội dung, 1 click tạo nháp (LLM có schema), người chỉ review/chỉnh rồi duyệt.
3. **Người học không bị gián đoạn**: nội dung đọc từ DB (đã duyệt), nhưng khi DB tắt/lỗi thì app vẫn chạy với bộ literal hiện tại (guest + offline-first giữ nguyên).
4. **Audio nội dung mới có sẵn**: pregen quét cả nội dung trong DB, không chỉ literal.

## Phạm vi
**Trong:**
- Vòng đời nội dung 3 loại: chủ đề câu mẫu (lessons + lesson_items), bài đọc (readings), kịch bản roleplay (roleplay_scenarios) — status `draft` → `reviewed`.
- API đọc public (learner) + API admin CRUD/AI-nháp/duyệt.
- UI CMS trong `public/admin/` (danh sách + trình soạn + AI nháp + duyệt/xóa).
- Script nạp nội dung gốc (literal → DB, idempotent) + nút chạy trong admin.
- Pregen mở rộng nguồn quét: DB (reviewed) + literal (fallback).
- Docs (api-spec, data-model, architecture, ui-design, testing, roadmap) + test unit/integration/UI.

**Ngoài (ghi rõ để không làm):**
- Không đụng pipeline vocab (`data/vocab-*.json`, prep-vocab, audit) — đã chạy ổn.
- Không làm lesson plan đầy đủ theo kind vocab/quiz/listening/shadow (phase sau của #2).
- Không lọc nội dung theo stage ở UI người học (cột stage chỉ nhập liệu, trả về qua API).
- Không thay đổi hợp đồng roleplay server (`scenario.title`), placement, TOEIC, sync.

## Yêu cầu chức năng
- **FR1 API đọc**: `GET /api/content/lessons|readings|roleplay?lang=` trả CHỈ nội dung `reviewed`, shape mirror literal hiện tại để frontend thay trực tiếp. DB tắt → lỗi JSON chuẩn, frontend fallback literal.
- **FR2 Seed**: nạp 3 khối literal vào DB status `reviewed`, id giữ nguyên; chạy lại không nhân bản (upsert theo id).
- **FR3 Admin CRUD**: list (lọc theo loại/ngôn ngữ/status), tạo tay, sửa, xóa, duyệt/bỏ duyệt. Validate input (giới hạn chiều dài, enum), lỗi `{error:"<CODE>"}`.
- **FR4 AI nháp**: `POST /api/admin/content/:type/ai-draft` sinh nháp draft theo lang (+level/topic tuỳ loại); validator chặt như `generateVocabCard`; không có AI → 503 `NO_AI`.
- **FR5 Pregen**: `collectContent()` ưu tiên nguồn DB (reviewed) khi có store; giữ literal khi không có DB. Manifest an toàn theo bbc4772.
- **FR6 UI admin**: mục "Nội dung học" trong dashboard: bảng danh sách theo tab loại, trình soạn dạng form, nút "AI soạn nháp", nút duyệt (đổi nhãn màu trạng thái draft/reviewed), nút xóa có xác nhận. Theo design-system admin, tiếng Việt, touch-target ≥48px, có trạng thái lỗi/rỗng.
- **FR7 Frontend learner**: khi khởi động, fetch `/api/content/*` (timeout ngắn); DB trả nội dung → thay literal; lỗi/rỗng → giữ literal. Không đổi id/role DOM của test hiện có.

## Yêu cầu phi chức năng
- Route mới tôn trọng `MAX_BODY_BYTES`; bài đọc dài bị chặn với thông báo rõ (không cắt âm thầm).
- Không expose secret; admin vẫn Basic Auth riêng như hiện tại.
- `npm run check` + `npm test` xanh; test DB chỉ chạy khi có `TEST_DATABASE_URL`.

## Done khi
- Admin duyệt 1 bài đọc mới → F5 app người học thấy bài đó trong list đọc (DB bật), nghe được audio sau pregen; tắt DB → app vẫn học bình thường với nội dung gốc.
- Docs cập nhật cùng commit; judge visual pass các màn admin mới.
