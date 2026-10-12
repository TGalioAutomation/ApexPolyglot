# ADR-004: Chiến lược đồng bộ offline-first

**Trạng thái:** Đã chấp nhận (2026-08-31)

## Quyết định
- **Offline-first:** localStorage (`lv-*`) là nơi ghi chính; server là bản chân lý đám mây.
- Sync đẩy/kéo theo item, merge **last-write-wins theo `updatedAt` từng item** (không theo phiên đồng bộ).
- Upsert idempotent bằng khóa nghiệp vụ `(user_id, lang, term)` cho SRS; mistake là append-only.
- Import legacy 1 lần: `/api/sync/import-local` map key localStorage cũ → schema mới, gọi lại không nhân đôi.
- Conflict hiếm (1 learner 1 người) — chấp nhận LWW; nếu sau này có multi-device mạnh → mở lại ADR (CRDT/merge thông minh hơn).

## Hệ quả
Mọi item đồng bộ bắt buộc có `updatedAt` (ISO 8601). Client phải set khi ghi local.
