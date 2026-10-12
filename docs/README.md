# LingoPilot Production Documentation

> Bộ tài liệu chuẩn để thiết kế, xây dựng, kiểm thử và vận hành webapp LingoPilot.
>
> Phiên bản tài liệu: 1.0 · Trạng thái: implementation-planning baseline · Cập nhật: 2026-08-15

## 1. Cách đọc bộ tài liệu

LingoPilot hiện là prototype chạy local. Các tài liệu trong thư mục này mô tả **target production**, không tuyên bố rằng code hiện tại đã đạt production. Mọi hạng mục phải được xác nhận bằng test, log, review hoặc artifact tương ứng trước khi đổi trạng thái release.

Các tài liệu hiện là artifact local chưa commit. Development chỉ được bắt đầu cho phạm vi không phụ thuộc quyết định `Proposed`; feature bị chặn không được release trước khi có named owner, decision record được chấp thuận và evidence theo gate.

Thứ tự ưu tiên khi tài liệu mâu thuẫn:

1. Quyết định mới nhất trong [Decision log](delivery-governance.md#12-decision-log).
2. Yêu cầu có ID trong [Product requirements](product-requirements.md).
3. Contract máy đọc trong [OpenAPI](openapi.yaml).
4. Các specification chuyên môn.
5. [Full product design](full-product-design.md) và [Design goal](design-goal.md) dùng làm nền tảng/ý tưởng ban đầu.
6. Code và test là nguồn sự thật cho **trạng thái prototype hiện tại**, không phải target production.

Nếu một thay đổi ảnh hưởng mục tiêu học tập, dữ liệu cá nhân, điểm/level, billing hoặc public API, thay đổi đó cần ADR/decision record và review của owner liên quan.

## 2. Bản đồ tài liệu

| Tài liệu | Câu hỏi được trả lời | Owner đề xuất | Trạng thái |
|---|---|---|---|
| [Design goal](design-goal.md) | Vì sao sản phẩm tồn tại? | Product Lead | Baseline |
| [Full product design](full-product-design.md) | Ý tưởng tổng thể và benchmark là gì? | Product Lead | Baseline |
| [Product requirements](product-requirements.md) | Phải xây chức năng nào và quy tắc nào? | Product Manager | Production spec |
| [UX & design system](ux-design-system.md) | Người dùng đi qua luồng nào, UI phản hồi ra sao? | Product Design | Production spec |
| [Learning & AI spec](learning-ai-spec.md) | Học như thế nào, AI được phép làm gì, đánh giá ra sao? | Learning/AI Lead | Production spec |
| [Curriculum catalog](curriculum-catalog.md) | Unit, lesson, prerequisite, rubric và checkpoint cụ thể là gì? | Curriculum Lead | Production spec |
| [Technical architecture](technical-architecture.md) | Hệ thống, data, API và voice được xây thế nào? | Engineering Lead | Production spec |
| [OpenAPI](openapi.yaml) | Contract core chính thức; endpoint mở rộng nằm trong Technical architecture | Backend Lead | Contract baseline |
| [Production operations](production-operations.md) | Bảo mật, riêng tư, SRE, QA và incident vận hành thế nào? | Security/SRE/QA Lead | Production spec |
| [Delivery & governance](delivery-governance.md) | Ai quyết định, triển khai theo gate nào? | Program/Product Lead | Operating model |
| [Traceability matrix](traceability-matrix.md) | Mỗi yêu cầu được thiết kế, xây và kiểm chứng ở đâu? | QA Lead | Control document |

## 3. Phạm vi sản phẩm đã chốt

- Web/PWA cho người Việt học English và Chinese.
- Mục tiêu chính: nghe, đọc, nói; viết chỉ hỗ trợ production và ghi nhớ.
- Lộ trình 90 ngày, ngân sách mặc định 35 phút/ngày.
- Level 1–7 là thang nội bộ dựa trên evidence, không phải chứng chỉ CEFR/HSK.
- Placement, weekly checkpoint và phase checkpoint cho từng ngôn ngữ.
- AI teacher dùng provider adapter Gemini/DeepSeek/OpenAI; OpenVox ưu tiên TTS local.
- AI tạo bài, phản hồi và yêu cầu học; scoring/level do rubric và policy engine kiểm soát.
- Production target có tài khoản, đồng bộ nhiều thiết bị, consent, export/delete, observability, rate limit, backup và rollback.

## 4. Nguyên tắc bất biến

1. **Learning before engagement:** bằng chứng năng lực quan trọng hơn XP hoặc streak.
2. **One useful next action:** mỗi lần mở app phải biết việc học tốt nhất tiếp theo.
3. **Output and retry:** mọi lesson tạo output quan sát được và cho phép sửa ngay.
4. **AI is bounded:** AI không tự cấp level, không chấm pronunciation từ transcript, không được có quyền ngoài contract.
5. **Privacy by default:** thu thập tối thiểu; audio là opt-in; key chỉ ở server.
6. **Graceful degradation:** AI/voice lỗi không làm mất bài làm hoặc chặn học cốt lõi.
7. **Evidence over claim:** release, accessibility, security và learning outcome chỉ được công bố khi có bằng chứng.
8. **Two languages, native treatment:** English và Chinese dùng chung platform nhưng có pedagogy, rubric, audio và content QA riêng.

## 5. Definition of ready cho development

Một epic chỉ ready khi có:

- Requirement ID, owner, priority và out-of-scope.
- User journey cùng loading/empty/error/offline/permission states.
- Business rule, data field, retention class và analytics event liên quan.
- API/schema hoặc ghi rõ client-only.
- Accessibility acceptance criteria.
- Security/privacy review trigger.
- Test oracle: điều kiện nào chứng minh pass/fail.
- Rollout, feature flag và rollback plan nếu rủi ro từ mức medium.

## 6. Definition of done cho production

- Functional acceptance đạt và traceability cập nhật.
- Unit, integration, contract, E2E và regression liên quan đều pass.
- Security/privacy/AI/content review không còn blocker.
- SLO, dashboard, alert và runbook đã hoạt động ở production-like environment.
- Migration, backup/restore và rollback được diễn tập nếu có thay đổi dữ liệu.
- Accessibility flow chính được test tự động và thủ công.
- Product analytics chứng minh event đúng, không chứa dữ liệu cấm.
- Release owner ký gate; post-release owner và thời gian theo dõi được ghi nhận.

## 7. Quản trị thay đổi tài liệu

- Thay đổi nhỏ: sửa trực tiếp, cập nhật ngày và reviewer.
- Thay đổi contract: cập nhật requirement, OpenAPI, test và traceability trong cùng pull request.
- Thay đổi kiến trúc/học thuật/rubric/privacy: thêm decision record trong `delivery-governance.md` trước khi triển khai.
- Requirement bị bỏ: giữ ID, đổi trạng thái `retired`; không tái sử dụng ID.
- Mỗi release candidate chạy kiểm tra link, lint Markdown/YAML, OpenAPI validation và audit coverage.

## 8. Chuẩn tham chiếu

Bộ tài liệu dùng các chuẩn làm **mục tiêu kiểm chứng**, không tuyên bố đã được chứng nhận:

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level AA cho accessibility.
- [OWASP Top 10:2025](https://owasp.org/Top10/2025/) và ASVS cho secure design/verification.
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) cho AI threat model.
- [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) và GenAI Profile cho AI governance/evaluation.
- [Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15](https://vanban.chinhphu.vn/?docid=214590&pageid=27160), hiệu lực 2026-01-01; phạm vi nghĩa vụ cụ thể phải được luật sư xác nhận trước public launch.

## 9. Trạng thái triển khai hiện tại

Prototype đã có dashboard, practice room cơ bản, progress localStorage, OpenVox adapter, AI provider adapter, placement/checkpoint demo và integration test. Khoảng cách tới production được ghi trong `technical-architecture.md`; release gate nằm trong `production-operations.md` và `delivery-governance.md`.
