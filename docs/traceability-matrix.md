# Production Traceability Matrix

> Owner: QA Lead · Reviewers: Product, Design, Learning/AI, Engineering, Security/SRE
>
> Trạng thái: control baseline · Cập nhật: 2026-08-15

## 1. Mục đích và quy ước

Ma trận này chứng minh coverage giữa mục tiêu, requirement, thiết kế, implementation target và bằng chứng nghiệm thu. `Documented` nghĩa là tài liệu đủ để bắt đầu build; không nghĩa code đã hoàn thành.

Trạng thái:

- `Documented`: contract và acceptance đã có.
- `Prototype`: có bản demo local nhưng chưa đạt production gate.
- `Planned`: target đã định nghĩa, chưa có evidence implementation.
- `Blocked-decision`: cần quyết định product/legal/vendor trước launch.
- `Verified`: chỉ dùng sau khi evidence production-like được review.

## 2. Goal-to-capability coverage

| Capability ID | Area | Outcome/Requirement | Source of truth | Implementation target | Evidence bắt buộc | Hiện tại |
|---|---|---|---|---|---|---|
| CAP-001 | Product | Người Việt biết nên học gì tiếp theo | PRD Today/next-best-action | Today service + dashboard | E2E onboarding→Today; task ≤3 | Prototype |
| CAP-002 | Product | Lộ trình 90 ngày có thể điều chỉnh | PRD study plan | Plan/curriculum service | Contract + reschedule tests | Prototype |
| CAP-003 | Product | English và Chinese có track riêng | PRD language scope | Versioned curriculum/content | Coverage report từng language | Prototype |
| CAP-004 | Product | Level 1–7 không bị hiểu là chứng chỉ | PRD business rules | Copy + evidence policy | Content/legal review | Documented |
| CAP-005 | Product | Mục tiêu và tiến độ đo được | PRD KPI | Analytics/progress service | Event QA + dashboard reconciliation | Planned |
| CAP-006 | Product | Entitlement minh bạch | PRD subscriptions | Billing/entitlement service | Purchase/restore/refund tests | Blocked-decision |
| CAP-007 | Product | Admin quản trị content/rubric | PRD admin ops | Admin portal + audit log | RBAC/E2E/audit tests | Planned |
| CAP-008 | UX | Onboarding tới bài đầu không lạc hướng | UX onboarding flow | Responsive PWA flow | Usability + E2E + a11y | Prototype |
| CAP-009 | UX | Loading/empty/error/offline đều có recovery | UX state matrix | Client state system | State visual regression | Planned |
| CAP-010 | UX | Core flows dùng được bằng bàn phím/screen reader | UX accessibility | Semantic components/focus | WCAG 2.2 AA audit intent | Planned |
| CAP-011 | UX | UI đúng desktop/tablet/mobile | UX breakpoints | Responsive design system | Device/browser matrix | Prototype |
| CAP-012 | UX | VI chrome, English/Chinese learning content không trộn sai | UX localization | i18n/content renderer | Locale pseudo/test corpus | Planned |
| CAP-013 | Learning | Mỗi lesson có can-do, input, practice, output, feedback, retry | Learning spec | Lesson engine/player | Golden lesson validation | Prototype |
| CAP-014 | Learning | SRS ưu tiên item sắp quên | Learning spec | Review scheduler | Algorithm fixtures + retention events | Planned |
| CAP-015 | Learning | Mastery theo skill × modality × language | Learning spec | Learner model | Deterministic model tests | Planned |
| CAP-016 | Learning | Placement không lộ answer key | Learning/AI + OpenAPI | Assessment service | Contract/security tests | Prototype |
| CAP-017 | Learning | Weekly/phase checkpoint tạo evidence | Learning/AI spec | Assessment + evidence store | Blueprint/rubric/E2E | Prototype |
| CAP-018 | Learning | Level chỉ tăng khi đủ bốn điều kiện | Learning/AI spec | Policy engine | Boundary/property tests | Planned |
| CAP-019 | Learning | English pronunciation dùng audio evidence | Learning/AI spec | Pronunciation analyzer | Human-rated benchmark | Planned |
| CAP-020 | Learning | Chinese tone/character có rubric riêng | Learning/AI spec | Tone/character analyzer | Human-rated benchmark | Planned |
| CAP-021 | AI | AI trả feedback có cấu trúc và retry | Learning/AI spec | Tutor orchestrator | Schema + golden eval | Prototype |
| CAP-022 | AI | AI không tự sửa score/level | Learning/AI policy | Deterministic scorer/policy | Adversarial/contract tests | Prototype |
| CAP-023 | AI | Gemini/DeepSeek/OpenAI có routing/fallback | Learning/AI + architecture | Provider adapter/circuit breaker | Provider fault injection | Prototype |
| CAP-024 | AI | Prompt/model/content được version hóa | Learning/AI spec | AI run registry | Regression + rollback evidence | Planned |
| CAP-025 | AI | Prompt injection/unsafe output bị giới hạn | Learning/AI + Operations | Validator/moderation/tool policy | OWASP LLM test suite | Planned |
| CAP-026 | AI | Chi phí AI có budget cap | Learning/AI + Operations | Quota/cost control | Limit and alert test | Planned |
| CAP-027 | Architecture | Auth/session an toàn và nhiều thiết bị | Architecture/OpenAPI | Identity/session service | Authn/authz/CSRF tests | Planned |
| CAP-028 | Architecture | Progress không mất và mutation idempotent | Architecture/OpenAPI | PostgreSQL/transaction/idempotency | Retry/concurrency/restore tests | Planned |
| CAP-029 | Architecture | Offline queue đồng bộ không nhân đôi | Architecture | PWA sync engine | Conflict/offline E2E | Planned |
| CAP-030 | Architecture | API có version/error/pagination contract | Architecture/OpenAPI | `/v1` API gateway | OpenAPI/contract tests | Documented |
| CAP-031 | Architecture | Async job retry có DLQ và quan sát được | Architecture | Queue/workers | Retry/DLQ/poison job tests | Planned |
| CAP-032 | Architecture | Voice degrade an toàn | Architecture | ASR/TTS/OpenVox adapters | Outage/latency/no-audio tests | Prototype |
| CAP-033 | Security | User chỉ đọc/sửa tài nguyên của mình | Operations threat model | Row/object authorization | Cross-account security tests | Planned |
| CAP-034 | Security | Secret không vào client/log/repo | Operations | Secret manager/redaction | Secret scan/log tests | Prototype |
| CAP-035 | Security | Input/upload được giới hạn và kiểm tra | Operations/OpenAPI | Validation/upload service | Fuzz/malware/size tests | Planned |
| CAP-036 | Privacy | Consent tách theo purpose | Operations/OpenAPI | Consent ledger/enforcement | Consent matrix E2E | Planned |
| CAP-037 | Privacy | Audio/transcript retention thực thi được | Operations | Object lifecycle/delete workers | Retention/deletion audit | Planned |
| CAP-038 | Privacy | Export/delete tài khoản end-to-end | Operations/OpenAPI | Privacy jobs | DSR rehearsal + audit log | Planned |
| CAP-039 | Privacy | Launch được legal review tại thị trường mục tiêu | Operations | Policy/contract/vendor review | Signed legal checklist | Blocked-decision |
| CAP-040 | Operations | SLO/error budget/alert có owner | Operations | Observability stack/on-call | Alert drill + dashboard | Planned |
| CAP-041 | Operations | Backup/restore đạt RPO/RTO | Operations | Encrypted backup/restore | Restore drill report | Planned |
| CAP-042 | Operations | Deploy canary và rollback | Delivery/Operations | CI/CD + feature flags | Staging rollback drill | Planned |
| CAP-043 | Operations | Incident được phân loại và xử lý | Operations | On-call/runbooks/comms | Game day evidence | Planned |
| CAP-044 | QA | Test pyramid bao phủ core journeys | Operations QA | CI test suites | Coverage + pass artifacts | Prototype |
| CAP-045 | QA | Accessibility được kiểm tra tự động và thủ công | UX/Operations | CI + assistive tech QA | Audit report | Planned |
| CAP-046 | QA | Performance đáp ứng budget | Architecture/Operations | Load/perf suite | p95/p99 report | Planned |
| CAP-047 | QA | AI/content quality có golden set và human review | Learning/AI + Operations | Eval pipeline | Versioned eval report | Planned |
| CAP-048 | Governance | Mọi release có owner, gate và rollback | Delivery governance | Release workflow | Signed Go/No-Go | Documented |
| CAP-049 | Governance | Mọi contract change cập nhật docs/test | Docs index/governance | PR template/CI check | Traceability diff | Documented |
| CAP-050 | Governance | Open decisions không bị ngầm giả định | Delivery decision log | ADR process | Decision owner/date | Documented |

## 3. Requirement-ID coverage

Các range dưới đây là ánh xạ trực tiếp từ requirement ID sang capability, specification triển khai và nhóm test. Mỗi ID trong range kế thừa đầy đủ mapping của hàng; khi một requirement đổi phạm vi, hàng này phải đổi trong cùng pull request.

| Requirement IDs | Capability | Design/contract | Test suite bắt buộc |
|---|---|---|---|
| FR-001–FR-014 | CAP-003, CAP-008, CAP-027, CAP-036 | UX onboarding; Architecture identity; OpenAPI auth/profile/consent | auth, consent, onboarding E2E, authz |
| FR-015–FR-026 | CAP-001, CAP-002, CAP-015 | UX Today/path; Learning Goal Controller; OpenAPI plans/path | planner rules, prerequisite property, Today E2E |
| FR-027–FR-038 | CAP-013, CAP-028 | UX lesson; Learning lesson grammar; session API | exercise contract, retry/idempotency E2E |
| FR-039–FR-048 | CAP-013, CAP-019, CAP-020 | UX reader/listener; curriculum catalog | content fixtures, playback/reader accessibility |
| FR-049–FR-058 | CAP-019, CAP-020, CAP-032 | UX speaking; speech policy; voice API | audio quality, low-confidence, human-rated eval |
| FR-059–FR-077 | CAP-021–CAP-026 | Learning AI orchestrator; tutor API; AI ops | schema, safety, prompt injection, provider fault/cost |
| FR-078–FR-086 | CAP-032, CAP-037 | Architecture voice; Operations privacy | OpenVox adapter, fallback, consent/retention |
| FR-087–FR-105 | CAP-016–CAP-018, CAP-022 | Assessment blueprint; assessment API; policy engine | answer-key isolation, deterministic score, promotion properties |
| FR-106–FR-114 | CAP-014, CAP-015 | SRS/mastery spec; review API | scheduler fixtures, offline dedupe, retention |
| FR-115–FR-123 | CAP-004, CAP-005 | UX progress; analytics model | reconciliation, evidence labeling, anti-XP bypass |
| FR-124–FR-132 | CAP-009, CAP-012 | UX notification matrix; notification API | timezone, preference, delivery/deeplink |
| FR-133–FR-144 | CAP-006, CAP-028 | Billing/entitlement architecture + API | webhook idempotency, restore/refund, server entitlement |
| FR-145–FR-150 | CAP-028, CAP-029 | Offline/sync architecture | conflict, retry, multi-device E2E |
| FR-151–FR-164 | CAP-007, CAP-020, CAP-025 | Admin/content workflow + API | RBAC, publish/rollback, moderation audit |
| FR-165–FR-170 | CAP-025, CAP-033, CAP-039, CAP-043 | Trust/support operations + API | report/block/escalation, abuse/rate-limit |
| FR-171–FR-180 | CAP-005, CAP-040, CAP-046, CAP-047 | Event taxonomy; observability | schema/dedupe/data quality, alert/load/eval |
| BR-001–BR-011 | CAP-004, CAP-016–CAP-020, CAP-022 | Level/evidence/scoring policy | boundary/property, transcript-only UI, rubric version |
| BR-012–BR-024 | CAP-001, CAP-002, CAP-013–CAP-015, CAP-020 | Goal Controller, curriculum, feedback | budget, scheduler, lesson/content validation |
| BR-025–BR-030 | CAP-023–CAP-026, CAP-032, CAP-037 | Provider/voice/privacy policies | secret scan, fallback, consent/retention |
| BR-031–BR-040 | CAP-006, CAP-007, CAP-010, CAP-012, CAP-028, CAP-035 | Entitlement, content, idempotency, timezone | paywall/a11y, billing/admin, replay/timezone |
| NFR-001–NFR-004 | CAP-046 | Architecture performance budgets; Operations SLO | load, RUM, asset budget CI |
| NFR-005–NFR-008 | CAP-028, CAP-040, CAP-041, CAP-043 | Reliability/DR operations | fault injection, restore, incident drill |
| NFR-009–NFR-014 | CAP-033–CAP-039 | Security/privacy operations | SAST/SCA/DAST, authz, DSR/retention |
| NFR-015–NFR-019 | CAP-010, CAP-012, CAP-045 | UX accessibility/localization | keyboard, screen reader, contrast, locale |
| NFR-020–NFR-022 | CAP-009, CAP-011, CAP-029, CAP-032 | Compatibility/PWA/capability design | browser/device, offline, feature detection |
| AC-001–AC-004 | CAP-001–CAP-003, CAP-008, CAP-013, CAP-028 | Core learner journeys | persisted journey E2E + idempotency |
| AC-005–AC-010 | CAP-016–CAP-023, CAP-032, CAP-034 | Assessment/AI/voice contracts | security/contract/fault injection |
| AC-011–AC-014 | CAP-005–CAP-007, CAP-028, CAP-029 | Sync, billing, admin, analytics | multi-device/billing/admin/event suites |
| AC-015–AC-018 | CAP-010, CAP-036–CAP-047 | Accessibility, privacy, performance, curriculum | manual+automated audit, DSR, load/RUM, coverage report |

## 4. Core journey traceability

| Journey | UX spec | API/data | Learning/AI | Security/privacy | Test oracle |
|---|---|---|---|---|---|
| Signup → consent → profile | UX onboarding | `/auth/session`, `/me/profile`, `/me/consents` | Goal capture | Session/consent policy | User vào placement; consent optional không bị ép |
| Placement EN/ZH | UX assessment | `/assessment-runs*` | Blueprint/rubric | Answer-key isolation, audio consent | Resume được; score deterministic; evidence label đúng |
| Nhận study plan | UX `/today`, `/path/:language` | `GET /today`, `/study-plans/{language}`, `/courses/{language}/path` | Goal Controller | No sensitive analytics | ≤3 task, đủ phút, prerequisite hợp lệ |
| Học lesson | UX lesson player | `/learning-sessions*` | Lesson grammar + feedback | Input limits | Refresh/resume; retry; completion idempotent |
| Voice practice | UX voice | `/voice/*` | Pronunciation/tone policies | Consent/provider disclosure | Low confidence không bị chấm chắc chắn |
| AI conversation | UX conversation | `/tutor/conversations*` | Orchestrator/guardrails | Prompt injection/abuse/cost | Provider fail có fallback; output schema hợp lệ |
| Review SRS | UX `/review` | `/reviews/due`, `/reviews/{itemId}/attempts` | SRS/mastery | Minimal data | Due order đúng; offline retry không duplicate |
| Checkpoint → level evidence | UX progress | `/assessment-runs*`, `/progress/summary` | Promotion policy | Auditability | Không tăng level nếu thiếu một điều kiện |
| Settings/privacy | UX settings | `/me/profile`, `/me/consents`, `/me/exports`, `DELETE /me` | Memory control | Export/delete/withdraw | Request có status; retention enforcement có audit |
| Subscription | UX `/settings/subscription` | `/billing/plans`, `/billing/checkout-sessions`, `/billing/subscription*`, `/entitlements` | Không ảnh hưởng score | Payment vendor/minimal data | Entitlement/restore/refund nhất quán |
| Admin content publish | UX `/admin/content` | `/admin/content/items*` và `/publish` | Validator/human review | RBAC/audit trail | Draft→review→publish→rollback có evidence |

## 5. Non-functional verification matrix

| Area | Target baseline | Pre-launch evidence | Owner |
|---|---|---|---|
| Availability | Theo SLO trong Operations; chưa claim trước load forecast | 30-day staging/prod-like SLI | SRE |
| Latency | CRUD p95 <500 ms; voice target theo architecture | Load report theo endpoint/tier | Engineering/SRE |
| Durability | Không mất acknowledged progress | Failure injection + restore | Backend/SRE |
| Security | OWASP Top 10/ASVS risk-based coverage | SAST/SCA/DAST/manual review | Security |
| Privacy | Purpose limitation, consent, DSR, retention | Data map + DSR rehearsal | Privacy |
| Accessibility | WCAG 2.2 AA intent cho full core flows | Automated + keyboard + screen reader | Design/QA |
| Compatibility | Current/previous major browsers, responsive | Browser/device report | QA |
| AI quality | Schema validity, groundedness, pedagogy, safety | Golden/human eval by version | AI/Learning |
| Content quality | Correct language/level/audio/attribution | Human review + sampled audit | Learning |
| Cost | Budget/session and monthly cap | Load/cost model + alerts | Product/AI/SRE |

## 6. Requirement completion rule

Một hàng chỉ chuyển sang `Verified` khi:

1. Requirement/contract được reviewer đúng vai trò chấp nhận.
2. Implementation liên kết commit/release artifact.
3. Test scope đủ rộng với requirement, không dùng smoke test để chứng minh quality toàn hệ thống.
4. Evidence có ngày, environment, version và owner.
5. Known limitation được ghi rõ và không mâu thuẫn release gate.

## 7. Documentation completion audit

| Tiêu chí của mục tiêu docs | Evidence | Kết quả |
|---|---|---|
| Triết lý sản phẩm | Design goal, Docs index, PRD | Documented |
| Chức năng đầy đủ | PRD + core journeys + OpenAPI | Documented |
| UX/UI/design system | UX specification | Documented |
| Learning/curriculum/assessment | Learning & AI specification | Documented |
| AI teacher/multi-agent/provider | Learning & AI + Architecture | Documented |
| Architecture/API/data/voice | Technical architecture + OpenAPI | Documented |
| Security/privacy/legal review points | Production operations | Documented |
| SRE/incident/backup/deploy | Production operations | Documented |
| QA/accessibility/performance/AI eval | Production operations + matrix | Documented |
| Roadmap/ownership/decision/risk | Delivery governance | Documented |
| Prototype-to-production gap | Technical architecture + docs index | Documented |
| Machine-checkable documentation baseline | `npm run docs:check` | Passed 2026-08-15 |

## 8. Documentation audit evidence

Audit ngày 2026-08-15 ghi nhận:

- Các artifact bắt buộc trong `docs/` đều tồn tại và có nội dung; số lượng được CI báo thay vì cố định trong prose.
- Bộ docs có hơn 9.000 dòng và hơn 71.000 từ, không tính source code ứng dụng.
- PRD có đủ 180 ID `FR`, 40 ID `BR`, 22 ID `NFR` và 18 ID `AC` duy nhất.
- Traceability có 50 capability bao phủ Product, UX, Learning, AI, Architecture, Security, Privacy, Operations, QA và Governance.
- OpenAPI 3.1 phải parse thành công; path/schema count được CI báo sau mỗi thay đổi contract.
- `npm test` pass: JavaScript syntax, server integration và documentation checks.
- Documentation check xác nhận local link hợp lệ, code fence có language tag, file bắt buộc đủ, requirement taxonomy và route core có mặt.
- Cross-document audit đã đồng bộ ngân sách 15/25/35/50 phút, daily plan 12/10/10/3, scoring 30/35/35, `zh-CN`, checkpoint schedule, provider order và Level 1–7 wording.

Kết quả audit chỉ chứng minh **implementation-planning baseline** cho phần không bị quyết định mở chặn. Nó không chứng minh code hiện tại đã production-ready; trạng thái implementation của từng capability vẫn nằm ở cột `Hiện tại` trong mục 2 và release cần toàn bộ evidence tương ứng.
