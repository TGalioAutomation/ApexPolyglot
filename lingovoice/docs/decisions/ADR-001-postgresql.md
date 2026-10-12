# ADR-001: Chọn PostgreSQL làm database chính

**Trạng thái:** Đã chấp nhận (2026-08-31) · **Quyết định bởi:** chủ dự án

## Bối cảnh
Dữ liệu học nằm ở localStorage + JSON file (`learner-memory.json` ghi cả file mỗi lần,
không atomic, mất khi đổi máy). Cần database thật cho account + đồng bộ.

## Các phương án
1. **SQLite (node:sqlite)** — zero-dep, 1 file; yếu khi nhiều instance/backup đa server.
2. **PostgreSQL** — chuẩn công nghiệp, JSONB, scale ngang được, cần service chạy kèm + dep `pg`.
3. JSON cải tiến — ít thay đổi nhất nhưng vẫn không phải DB thật.

## Quyết định
**PostgreSQL 16**, thêm dep `pg` (driver duy nhất ngoài node core). Lý do: định hướng
multi-user/scale của sản phẩm, JSONB cho payload linh hoạt (lesson_items, teacher_profile),
hệ sinh thái backup/monitoring. Dự án chị lingopilot đã chuẩn hóa PG trước đó — tái sử dụng kinh nghiệm migration.

## Hệ quả
- Docker compose thêm service postgres; `.env` thêm `DATABASE_URL`.
- App phải chạy được (giảm tính năng) khi PG vắng: route DB trả 503 `DB_UNAVAILABLE`.
- Test không bắt buộc PG: store là interface có thể inject mock.
