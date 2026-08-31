# ADR-003: Giữ vanilla JS cho frontend

**Trạng thái:** Đã chấp nhận (2026-08-31)

## Quyết định
Không đưa framework vào (React/Vue/Preact). Frontend tiếp tục HTML/CSS/JS thuần, tái cấu trúc
thành module view/state/api-client, giữ hợp đồng DOM mà test phụ thuộc.

## Lý do
- Android WebView wrapper hiện tại load URL trực tiếp — zero build pipeline, zero node_modules.
- 11 test UI đang xanh dựa trên DOM tĩnh của `index.html`.
- Quy mô view (8 tab) vẫn nằm trong ngưỡng vanilla quản lý được.

## Hệ quả
- Component hóa bằng hàm render + template string; state tập trung trong object `state`.
- Khi số view vượt ~15 hoặc cần reactivity phức tạp → mở lại ADR này.
