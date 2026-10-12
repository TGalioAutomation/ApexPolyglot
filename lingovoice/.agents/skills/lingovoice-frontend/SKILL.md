---
name: lingovoice-frontend
description: Quy tắc UI LingoVoice — design token, theming theo stage tuổi, hợp đồng DOM/id với test, asset webp, a11y và mobile-first. Dùng khi sửa index.html, app.js, learning.js, styles.css, admin UI, thêm màn hình/view, đổi giao diện, hoặc tích hợp ảnh asset trong repo lingovoice.
---

# LingoVoice — Frontend & Design System

## Nguồn sự thật thiết kế

- `design-system/lingovoice-lifelong/MASTER.md` — token màu/typography/spacing/shadow + bảng 4 stage tuổi. Trang riêng (nếu có) trong `design-system/*/pages/` **ghi đè** MASTER.
- `docs/ui-design.md` — luồng màn hình, mapping asset, trạng thái lỗi/offline.
- App dùng `public/styles.css` với CSS variables (`--primary`, `--stage-accent`...). Đổi màu phải đi qua biến, không hardcode hex trong rule mới.

## Theming theo stage tuổi (bắt buộc)

4 stage 3–6 / 7–12 / 13–17 / 18–25 đổi accent qua `data-stage` trên `<body>`: `#D97706` / `#0284C7` / `#7C3AED` / `#0F766E`. Dữ liệu học **không bao giờ reset** khi đổi stage.

## Hợp đồng DOM với test (không phá vỡ)

- Tab panel: `#tab-today|path|vocab|writing|speaking|reading|listening|setup` + `role="tabpanel"`; nav: `#mainTabs` (top) và `#bottomNav` (mobile), `role="tablist"`.
- Test UI đọc text/aria của các phần tử này — đổi id/role/aria phải chạy lại `npm test` và cập nhật test có chủ đích.
- localStorage: key tiền tố `lv-` là hợp đồng sync với server (`POST /api/sync/push`) — xem `docs/data-model.md`.

## Asset webp (public/assets/) — dùng đúng chỗ

| Asset | Dùng cho |
|---|---|
| `splash-illustration.webp` | Màn splash/onboarding lần đầu |
| `default-learner-avatar.webp` | Avatar mặc định profile khi chưa có ảnh |
| `empty-state-today.webp` | Tab Today khi chưa có bài trong hôm nay |
| `error-retry.webp` | Màn lỗi toàn cục kèm nút thử lại |
| `offline-audio.webp` | Fallback khi audio/TTS lỗi hoặc mất mạng |

Ảnh phải có `alt` tiếng Việt mô tả; ảnh trang trí thuần dùng `alt=""`.

## A11y & mobile (Android WebView)

- Touch-target ≥ 48px (`--touch-target`); `:focus-visible` luôn thấy rõ; icon-button phải có `aria-label`.
- Mobile-first: bottom-nav chính, top-nav phụ; thử ở bề ngang 360px trước khi báo xong.
- Copy tiếng Việt; nội dung học EN/ZH giữ nguyên ngữ; số/liều lượng yếu tố vui tăng dần theo stage trẻ hơn.
