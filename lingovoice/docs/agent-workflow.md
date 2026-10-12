# Quy trình phát triển bằng AI Agent — LingoVoice

> Tài liệu chuẩn hóa cách người + AI agent phối hợp làm việc trên repo này.
> Áp dụng cho ZCode và các AI agent tương tự (Claude Code, Cursor...).

## 1. Nguyên tắc

1. **Docs là nguồn sự thật.** Agent đọc `AGENTS.md` + `docs/` trước khi code; mọi thay đổi kiến trúc phải cập nhật docs trong cùng commit.
2. **Skills là bộ quy tắc chuyên ngành.** 3 skill workspace đi kèm repo:
   - `lingovoice-dev` — quy ước tổng, vòng kiểm chứng (tự kích hoạt với mọi task).
   - `lingovoice-backend` — server/API/DB/auth/sync (kích hoạt khi sửa backend).
   - `lingovoice-frontend` — design system, hợp đồng DOM, a11y (kích hoạt khi sửa UI).
3. **Không tin — hãy kiểm chứng.** Mọi task kết thúc bằng `npm run check` + `npm test`; UI thì thêm judge visual.

## 2. Bốn vai trò agent

| Vai trò | Nhiệm vụ | Định nghĩa |
|---|---|---|
| **Planner** | Khảo sát code, đề xuất phương án, tách task nhỏ, chỉ ra rủi ro | `.agents/agents/lingovoice-planner.md` |
| **Implementer** | Viết code + test theo kế hoạch, tuân thủ skill chuyên ngành | `.agents/agents/lingovoice-implementer.md` |
| **Reviewer** | Đọc diff, soi guardrails + hợp đồng API/DOM, yêu cầu sửa | `.agents/agents/lingovoice-reviewer.md` |
| **Judge** | Chấm accepting visual trên ảnh render UI (nếu task đổi giao diện) | dùng agent `judge` sẵn có của ZCode |

Người điều phối (hoặc agent chính) giữ vai trò **Orchestrator**: nhận yêu cầu → gọi Planner → chốt phương án với người → dispatch Implementer → chạy Reviewer (+ Judge nếu UI) → commit.

## 3. Vòng đời một task

```
Yêu cầu → Planner (kế hoạch + câu hỏi làm rõ)
        → Người duyệt kế hoạch
        → Implementer (code + test + docs)
        → npm run check && npm test
        → Reviewer (diff + guardrails)
        → [UI] Judge visual trên ảnh render
        → Commit theo convention → PR vào main
```

## 4. Định nghĩa hoàn thành (Definition of Done)

- [ ] `npm run check` xanh, `npm test` xanh (integration DB chạy khi có `TEST_DATABASE_URL`).
- [ ] API/schema/UI đổi → `docs/api-spec.md` / `data-model.md` / `ui-design.md` cập nhật.
- [ ] Không vi phạm guardrails trong `AGENTS.md` (secret, id/role/aria test, placement LLM...).
- [ ] UI: từng view đã render + judge pass; touch-target ≥ 48px; có trạng thái lỗi/offline.
- [ ] Commit message theo convention, không lẫn file rác (`.env`, `cache/`, `.DS_Store`).

## 5. Phân nhánh & commit

- Nhánh: `feat/<việc>`, `fix/<lỗi>`, `redesign/<lớn>`; `main` chỉ nhận qua merge được review.
- Commit: `feat|fix|refactor|docs|test|chore: mô tả ngắn`.
- WIP chưa xong → commit lên nhánh `wip/*` để không mất, không merge.

## 6. Khi nào phải hỏi người

- Đổi hợp đồng dữ liệu phá vỡ tương thích (sync, localStorage, schema cũ).
- Thêm dependency mới hoặc service hạ tầng mới.
- Thay đổi định giá sản phẩm (stage tuổi, persona giáo viên, mức độ gamification).
