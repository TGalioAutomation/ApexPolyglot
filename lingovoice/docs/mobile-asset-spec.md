# Mobile asset contract — LingoVoice

Tài liệu này là danh sách chuẩn cho icon và hình ảnh của web mobile/WebView Android. Mục tiêu là một hệ thống hình ảnh nhất quán cho người học 3–25 tuổi, nhẹ, dễ tải và accessible.

## Nguyên tắc bắt buộc

- Icon UI dùng một họ SVG inline/vector duy nhất, nét `currentColor`, viewBox `24 24`, stroke mặc định 2px.
- Nút chỉ có icon phải có `aria-label`; icon đứng cạnh nhãn chữ phải có `aria-hidden="true"`.
- Vùng chạm tối thiểu 44×44px (preschool dùng 52–56px).
- Ảnh nội dung dùng WebP; AVIF là biến thể tối ưu thêm khi pipeline hỗ trợ. Không dùng ảnh 2K/4K cho vùng hiển thị nhỏ.
- Ảnh ngoài màn hình dùng `loading="lazy"`, `decoding="async"`, có `width`/`height` để tránh layout shift.
- Ảnh có ý nghĩa phải có alt tiếng Việt; ảnh trang trí dùng `alt=""` và `aria-hidden="true"`.
- Không dùng emoji làm icon điều hướng hoặc trạng thái.

## Inventory hiện tại

| Asset | Vị trí | Trạng thái | Ghi chú |
|---|---|---:|---|
| Brand mark LingoVoice | `public/index.html`, admin | Có | SVG inline, dùng cho web/admin |
| Android launcher icon | `android/.../drawable/ic_launcher.xml` | Có | Vector 48dp; cần bổ sung adaptive/round icon trước khi phát hành store |
| Navigation icons | `public/index.html` | Có | Home, path, practice, Cô Linh, settings |
| Learning action icons | `public/index.html`, `public/app.js` | Có | Play, check, microphone, send, close, volume |
| Animated Cô Linh avatar | `public/app.js` | Có | SVG, 5 trạng thái: idle/listening/thinking/speaking/error |
| Cô Linh onboarding illustration | `public/assets/co-linh-guide.webp` | Có | 1024×1536, WebP ~86KB, transparent, lazy-loaded |
| Default learner avatar | `public/assets/default-learner-avatar.webp` | Có | 256×256 WebP, dùng trong header journey; alt rỗng vì avatar trang trí |

## Icon set cần chốt cho mobile

### Core navigation — P0

`home`, `path`, `practice`, `teacher`, `settings`, `back`, `close`, `chevron-right`, `menu`.

### Learning actions — P0

`play`, `pause`, `replay`, `slow`, `microphone`, `send`, `check`, `x`, `volume`, `volume-off`, `translate`, `bookmark`, `eye`, `lock`.

### Feedback and state — P0

`success`, `warning`, `error`, `info`, `loading`, `offline`, `sync`, `cloud-check`, `wifi-off`, `help`.

### Progress and motivation — P1

`streak`, `star`, `trophy`, `badge`, `level`, `calendar`, `timer`, `target`, `flame`.

### Content metaphors — P1

`book-open`, `vocabulary`, `headphones`, `speaking`, `writing`, `reading`, `listening`, `globe`, `briefcase`, `school`.

### Admin/control-plane — P1

`dashboard`, `audio-library`, `data`, `jobs`, `audit`, `user`, `shield`, `key`, `refresh`, `download`, `filter`.

## Image set cần có

### P0 — release mobile

| Asset | Kích thước xuất | Định dạng | Trạng thái |
|---|---:|---|---:|
| Cô Linh onboarding full-body | 1024×1536, hiển thị 76–112px | WebP transparent | Đã có |
| Cô Linh avatar/teacher stage | 512×512 hoặc SVG | SVG/WebP | Đang dùng SVG động |
| Empty state: chưa có bài hôm nay | 800×600 | WebP | Đã tạo: `public/assets/empty-state-today.webp` |
| Empty state: offline/audio chưa sẵn sàng | 800×600 | WebP | Đã tạo: `public/assets/offline-audio.webp` |
| Error/retry illustration | 800×600 | WebP | Đã tạo: `public/assets/error-retry.webp` |
| Default learner avatar | 256×256 | SVG/WebP | Đã tạo: `public/assets/default-learner-avatar.webp` |
| Android adaptive icon foreground/background | 108×108dp | Vector/XML | Cần tạo |
| Splash illustration/logo | 512×512 | Vector/WebP | Đã tạo: `public/assets/splash-illustration.webp` |

### P1 — cá nhân hóa 4 giai đoạn

Mỗi giai đoạn cần một illustration ngang và một sticker nhỏ, cùng silhouette và màu accent theo design system:

- 3–6: khám phá bằng hình, màu cam ấm, ít chi tiết.
- 7–12: thử thách từ/câu, xanh da trời, vui và rõ hình khối.
- 13–17: phản xạ và mục tiêu trường học, tím, năng động vừa phải.
- 18–25: ứng dụng đại học/công việc, teal, trưởng thành và gọn.

Kích thước: hero 1200×800, card 640×480, sticker 256×256; WebP, nền transparent cho sticker.

### P1 — content illustrations

`vocabulary`, `speaking`, `listening`, `reading`, `writing`, `review`, `placement`, `teacher-memory`, `journey-complete`.

Mỗi chủ đề cần 1 ảnh ngang cho card và 1 icon/sticker; không nhúng chữ vào ảnh để dễ dịch Anh–Việt–Trung.

### P2 — store and marketing

- Android feature graphic: 1024×500.
- Screenshot frames: 1080×1920 cho onboarding, Hôm nay, Lộ trình, Cô Linh, luyện tập.
- Social preview: 1200×630.
- App icon exports: 512×512 PNG, adaptive foreground/background.

## Quy tắc tích hợp

1. Asset được đặt trong `public/assets/` với tên kebab-case, không dùng tên ngẫu nhiên của generator.
2. Mọi asset mới phải có dòng inventory trong tài liệu này và test source reference nếu được dùng trong UI.
3. Ảnh character động vẫn ưu tiên SVG/CSS; raster chỉ dùng cho hero, onboarding, empty state và store art.
4. Không thay thế icon SVG bằng PNG để sửa nhanh; icon cần scale sắc nét và giữ `currentColor`.
5. Trước release chạy kiểm tra kích thước file, alt text, lazy loading, dark/light contrast và không overflow ở 375px.

## Việc tiếp theo đề xuất

1. Tạo bộ P0 empty/error/offline và default avatar.
2. Chuyển Android launcher sang adaptive + round icon.
3. Tạo bộ 4 stage illustration P1.
4. Dựng screenshot/store pack sau khi UI mobile được khóa.
