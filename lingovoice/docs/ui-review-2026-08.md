# Báo cáo review UI/UX — LingoVoice (2026-08-31)

> Rà soát theo khung `uiux-design-review` (WCAG 2.1 AA + visual design + interaction)
> kết hợp `ui-ux-pro-max`, trên bản capture video 7 luồng (`videos/01..07.webm`, 390×844)
> + screenshot từng panel + kiểm tra DOM/CSS.

## A. Đã sửa trong đợt này

| # | Mức | Phát hiện | Bản sửa |
|---|---|---|---|
| A1 | **P0** | **Bài luyện nghe hiện luôn câu tiếng Anh** khi tạo câu mới (`startQuiz` mở `#quizText` ngay) + nhãn nút đã là "Nghe lại câu" trước khi nghe lần nào → luyện nghe biến thành luyện đọc, trái chính đề bài | Ẩn text tới khi trả lời xong (mở để đối chiếu sau khi chọn); nhãn "Nghe câu" chỉ đổi "Nghe lại câu" sau lần phát đầu (`app.js`) |
| A2 | **P1** | Quiz **tự phát audio** khi vào tab (autoplay bị trình duyệt chặn → kéo theo chip trạng thái nhảy màu cam oan) + vi phạm WCAG 1.4.2 (âm thanh ngoài ý muốn) | Bỏ autoplay; người học bấm "Nghe câu" chủ động |
| A3 | **P1** | Chip trạng thái âm thanh mobile thu thành chấm tròn, thông tin chỉ truyền bằng **màu chấm** (WCAG 1.4.1) | Badge "!" khi degraded/broken + `title` tooltip + bấm chip hiện toast giải thích (commit 31e3833) |
| A4 | **P2** | Toast thông báo đè lên FAB Cô Linh + vùng CTA đáy màn ở 390px | Toast mobile nâng lên `bottom: 170px` |
| A5 | **P2** | Keycap "Space" trong nút primary: nền sáng + chữ trắng → chìm chữ | Keycap nền trắng mờ trên nút tối (commit ca52f65) |
| A6 | **P2** | Banner lỗi/thẻ offline đè nút hành động đáy màn | Chuyển lên dưới topbar; lệch vị trí nhau khi cùng hiện (commit 936e7cf) |
| A7 | **P3** | Nút đóng banner lỗi 32px (< chuẩn 44px target); chữ stage-rail 9.5px quá nhỏ | Nút 40px; chữ 11px |
| A8 | **P3** | Thông báo lỗi form tài khoản dùng `role=status` — screen reader không đọc ngay | Chuyển `role=alert` khi lỗi (WCAG 3.3.1) |

## B. Khuyến nghị (chưa sửa — cần quyết định thiết kế/scope)

| # | Mức | Quan sát | Đề xuất |
|---|---|---|---|
| B1 | P2 | Dock Cô Linh mở rồi **persist đè ~60% panel Luyện tập** trên mobile, chỉ có nút X nhỏ để đóng | Thêm nút thu gọn dock thành dải mỏng; hoặc tự thu khi chuyển sang panel luyện tập |
| B2 | P3 | Footer dock lộ "**AI: deepseek**" cho người học — chi tiết kỹ thuật không cần thiết với learner | Chỉ hiển thị với role admin, hoặc đổi文案 chung "AI đồng hành" |
| B3 | P3 | Tab **Thiết lập rất dài** (hồ sơ → placement → tài khoản → Cô Linh → dữ liệu, 7+ màn cuộn) | Thêm dải điều hướng anchor/section chip đầu tab |
| B4 | P3 | Thiếu **skip-link** tới nội dung chính cho bàn phím (WCAG 2.4.1) | Thêm "Tới nội dung chính" ẩn-hiện-khi-focus |
| B5 | P3 | Onboarding mặc định chọn sẵn 18–25 — phụ huynh cho trẻ 3–12 phải chủ động đổi | Cân nhắc hỏi độ tuổi ngay câu hỏi đầu |
| B6 | P3 | Chưa có khối `[data-theme="dark"]` ở mức runtime (token đã sẵn sàng) | Bật theo roadmap #5 |

## C. Những gì đạt (không cần sửa)

- Design token nhất quán (indigo/green + stage accent), bo góc/shadow theo MASTER.md.
- Điều hướng kép top-nav + bottom-nav rõ ràng, active state đúng `aria-current`.
- Flashcard SRS: luồng hiện đáp án → 4 nút chấm có nhãn + phím tắt, contrast tốt.
- Empty/error/offline states có minh họa + CTA, không dead-end.
- Touch target các nút chính ≥ 48px; focus-visible toàn cục.
- Bản ghi video kiểm chứng: `videos/01-today` → `07-onboarding`.
