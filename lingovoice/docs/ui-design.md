# Thiết kế UI LingoVoice

> Nguồn sự thật token: `design-system/lingovoice-lifelong/MASTER.md`. Tài liệu này mô tả
> cách áp dụng: luồng màn hình, hợp đồng DOM, asset, trạng thái hệ thống.

## 1. Design tokens (styles.css)

Toàn bộ màu/bo/shadow đi qua CSS variables, không hardcode hex:

- Màu nền tảng: `--primary #4F46E5`, `--accent #16A34A`, `--background #EEF2FF`, `--card #FFF`...
- Theming stage qua `body[data-stage="preschool|child|teen|young-adult"]` → cặp
  `--stage-accent` / `--stage-soft`: `#D97706/#FFF7ED`, `#0284C7/#F0F9FF`, `#7C3AED/#F5F3FF`, `#0F766E/#ECFDF5`.
- Typography: Be Vietnam Pro (heading) + Noto Sans (body), Google Fonts.
- Spacing scale `--space-xs..3xl` (4→64px), radius 18/24px, shadow 4 mức, `--touch-target: 48px`.
- Dark mode: các biến phải có sẵn trong `:root` block `[data-theme="dark"]` (triển khai nội dung sau — roadmap #5).

## 2. Bản đồ màn hình (SPA 8 tab)

| Tab | id panel | Nội dung chính | Trạng thái đặc biệt |
|---|---|---|---|
| Hôm nay | `#tab-today` | Plan ngày, streak, banner hành trình 90 ngày | trống → `empty-state-today.webp` + CTA bắt đầu |
| Lộ trình | `#tab-path` | Roadmap 3 chặng, next-best-action | — |
| Từ vựng | `#tab-vocab` | Flashcard SRS, quiz, sổ lỗi sai | — |
| Viết | `#tab-writing` | Xếp chunk, chính tả, dịch ngược, viết tự do | — |
| Nói | `#tab-speaking` | Shadowing ASR + gọi điện roleplay | mất mic → hướng dẫn mở quyền |
| Đọc | `#tab-reading` | Graded readers 3 mức, đọc theo câu | — |
| Nghe | `#tab-listening` | Nghe–chọn, nghe–viết | audio lỗi → `offline-audio.webp` |
| Thiết lập | `#tab-setup` | Profile, stage tuổi, giọng Cô Linh, **tài khoản + đồng bộ (mới)** | — |

Splash/onboarding lần đầu: `splash-illustration.webp` + 3 câu giới thiệu → nút bắt đầu.
Avatar mặc định: `default-learner-avatar.webp` trong profile và topbar.

## 3. Trạng thái hệ thống (bắt buộc cho mọi view tải dữ liệu)

| Trạng thái | Biểu hiện |
|---|---|
| Loading | Skeleton shimmer, không nhảy layout |
| Empty | Illustration + 1 câu tiếng Việt + CTA |
| Error | `error-retry.webp` + nút "Thử lại" — giữ nguyên input người dùng |
| Offline/audio lỗi | `offline-audio.webp` + tự fallback giọng máy |
| Đăng nhập/sync | Chip trạng thái trong setup: "Đã đồng bộ lúc HH:mm" / "Chưa đăng nhập — dữ liệu chỉ trên máy này" |

## 4. Hợp đồng DOM & a11y

- Nav: `#mainTabs` (top, `role="tablist"`) + `#bottomNav` (mobile). Panel: `#tab-*` `role="tabpanel"`.
- Test UI (`test/*-ui.test.mjs`) đọc các id/role/aria này — **không đổi** khi redesign; chỉ đổi visual.
- Nút icon phải có `aria-label`; focus `:focus-visible` rõ ràng; tương phản ≥ 4.5:1 với chữ nội dung.
- Mobile-first 360px; bottom-nav là điều hướng chính; mọi nút ≥ 48px.

## 5. Nguyên tắc tiếng (copy)

- Product copy **tiếng Việt**, xưng hô thân thiện theo stage (em/con — bạn/anh chị).
- Nội dung học EN/ZH giữ nguyên ngữ, hiển thị phân biệt rõ (font-weight + màu phụ đề).
- Yêu cầu vui nhộn chỉ tăng theo stage trẻ (3–12); stage 18–25 tối giản, uy tín.
