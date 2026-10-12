# ADR-002: Đăng nhập + session cho người học

**Trạng thái:** Đã chấp nhận (2026-08-31)

## Quyết định
- Account tối giản: `username` + `password` (không email bắt buộc — đối tượng có trẻ em),
  optional `displayName`, `ageGroup`.
- Hash **scrypt** (node:crypto) + salt riêng mỗi user; so sánh `timingSafeEqual`.
- Session: token ngẫu nhiên 32B (base64url); server chỉ lưu **SHA-256(token)**
  của token trong bảng `sessions` (thu hồi được); cookie `lv_session` HttpOnly SameSite=Lax, TTL 30 ngày.
- Giữ nguyên Basic Auth cho app/admin hiện có (tầng ngoài); session account là tầng per-learner bên trong.

## Lý do không chọn
- JWT stateless: không thu hồi được, phải thêm refresh flow — không cần cho quy mô hiện tại.
- bcrypt/argon2: thêm native dep, scrypt trong node core là đủ.

## Hệ quả
Đổi `SESSION_SECRET` → toàn bộ session cũ hết hạn (chấp nhận được).
