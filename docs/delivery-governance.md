# Delivery, Governance và Decision Framework

> Owner: Program/Product Lead · Reviewers: Engineering, Design, Learning/AI, Security/SRE/QA
>
> Trạng thái: production operating model · Cập nhật: 2026-08-15

## 1. Mục đích

Tài liệu này biến product design thành chương trình delivery có owner, gate, bằng chứng và cơ chế ra quyết định. Timeline là forecast; quality gate không được bỏ chỉ để giữ ngày.

## 2. Workstreams

| Workstream | Kết quả | Accountable | Consulted |
|---|---|---|---|
| Product & research | Problem validation, PRD, KPI | Product Lead | Design, Learning |
| UX & accessibility | Flows, design system, usability | Design Lead | Frontend, QA |
| Learning & content | Curriculum, rubric, content QA | Learning Lead | AI, Product |
| AI platform | Orchestration, provider, eval, guardrails | AI Lead | Learning, Security |
| Application | Web/PWA, API, data, billing | Engineering Lead | Product, SRE |
| Voice | ASR, scoring, OpenVox/TTS | Voice/ML Lead | Learning, Privacy |
| Trust | Security, privacy, abuse, legal review | Security/Privacy Lead | All leads |
| Reliability & release | CI/CD, SLO, incident, support | SRE/QA Lead | Engineering |

Một người có thể giữ nhiều vai trò trong team nhỏ, nhưng trách nhiệm không được bỏ trống.

## 3. Delivery phases và exit gate

### Phase A — Discovery and calibration, 2–3 tuần

Deliverables:

- Phỏng vấn tối thiểu 8–12 người học mục tiêu.
- Chốt primary language launch strategy và target segment.
- Placement/rubric prototype được hai chuyên gia ngôn ngữ review.
- Data/privacy map và threat model bản đầu.
- Prototype usability test cho onboarding → first lesson → result.

Exit gate: ít nhất 8 phỏng vấn hợp lệ, tối thiểu 5/8 người trong usability test hoàn tất onboarding → first lesson không cần trợ giúp nghiêm trọng, ít nhất 60% người thuộc target segment xác nhận vấn đề xảy ra hằng tuần, và không còn quyết định P0 chưa có owner. Đây là ngưỡng discovery tạm thời; Product Lead phải ký trước khi qua gate.

### Phase B — Foundation alpha, 4–6 tuần

Deliverables:

- Auth/profile/consent, PostgreSQL, migration và audit trail.
- Curriculum/content registry, session/attempt tracking, SRS nền tảng.
- Placement cho một ngôn ngữ launch; voice fallback.
- CI, environment separation, logs/metrics/traces, backup automation.

Exit gate: core journey pass; restore test pass; không có security P0/P1.

### Phase C — Learning beta, 6–8 tuần

Deliverables:

- Lesson player đầy đủ, reader/listener, practice hub, checkpoints.
- Adaptive next-best-action và error notebook.
- AI structured output, validator, golden eval và cost guardrail.
- English + Chinese content coverage theo launch decision.

Exit gate: rubric inter-rater target đạt; AI/content acceptance đạt; D7 instrumentation tin cậy.

### Phase D — Voice tutor beta, 6–8 tuần

Deliverables:

- Realtime conversation, ASR confidence, OpenVox streaming/fallback.
- Pronunciation/tone analyzer chuyên biệt.
- Consent audio, retention job, export/delete.
- Load, chaos/provider outage và abuse test.

Exit gate: voice SLO và privacy test pass; feedback quality qua human review.

### Phase E — Public launch, 2–4 tuần hardening

Deliverables:

- Billing/entitlements nếu monetization được bật.
- Support/admin/moderation, status communication, incident rehearsal.
- Accessibility audit, security test, legal review và launch checklist.
- Rollback/feature flag, canary và post-launch war room.

Exit gate: Go/No-Go board ký dựa trên evidence ở mục 7.

## 4. Prioritization

Mỗi item được chấm:

```text
priority = (learning impact × confidence × reach × risk reduction)
           / (engineering effort × operational complexity)
```

P0 không đồng nghĩa “làm ngay” nếu chưa an toàn; P0 nghĩa là không thể launch nếu thiếu. Thứ tự mặc định:

1. Data safety, auth, consent, scoring integrity.
2. Core learning loop và progress durability.
3. Assessment/adaptation accuracy.
4. Voice/AI experience.
5. Engagement and monetization.

## 5. Backlog taxonomy

- `EPIC`: outcome có thể đo.
- `FEATURE`: capability người dùng/admin.
- `ENABLER`: architecture, platform, compliance, observability.
- `CONTENT`: curriculum/lesson/rubric asset.
- `EXPERIMENT`: hypothesis, metric, guardrail, stop rule.
- `DEFECT`: sai hành vi so với contract.
- `RISK`: threat hoặc uncertainty cần mitigation.

Mỗi ticket phải liên kết requirement ID (`FR`, `LR`, `AI`, `NFR`, `SEC`, `OPS`) và test/evidence dự kiến.

## 6. Review cadence

| Cadence | Cuộc họp/Artifact | Quyết định |
|---|---|---|
| Hằng ngày | Delivery sync 15 phút | Blocker và owner |
| Hằng tuần | Product-learning review | Outcome, content, rubric |
| Hằng tuần | Reliability/security review | Incidents, vulnerabilities, SLO |
| Hai tuần | Demo + release readiness | Scope/gate tiếp theo |
| Hằng tháng | AI model/prompt review | Provider, cost, eval, rollback |
| Mỗi phase | Go/No-Go | Chấp nhận exit gate |
| Hằng quý | Strategy/privacy review | KPI, retention, vendor/legal changes |

## 7. Go/No-Go evidence

### Go khi tất cả điều kiện đúng

- Traceability không có P0/P1 thiếu test.
- Migrations và rollback đã chạy ở staging snapshot.
- Backup restore đạt RPO/RTO mục tiêu.
- Security, privacy, accessibility và AI/content gate có reviewer.
- SLO dashboard/alerts/runbook đã sẵn sàng.
- Support biết release, known issues và escalation path.
- Product owner chấp nhận known risks bằng văn bản.

### No-Go khi có một điều kiện

- Có thể mất/corrupt progress hoặc assessment evidence.
- Secret/PII có nguy cơ lộ; authz chưa chứng minh isolation.
- AI có thể tự tăng level, tạo nội dung không kiểm soát hoặc vượt budget không giới hạn.
- Audio được lưu/chuyển provider trái consent.
- Không có rollback cho migration không tương thích.
- Core journey hoặc payment/refund (nếu bật) fail.

## 8. Feature flag và rollout

- Mọi tính năng AI, voice scoring, billing và schema migration rủi ro có kill switch.
- Rollout: internal → 1% canary → 10% → 50% → 100%. Observation tối thiểu: 24 giờ cho 1% và 10%, 48 giờ cho 50%; mỗi bước cần ít nhất 1.000 core-journey attempts hoặc đủ 7 ngày nếu traffic thấp. Security/privacy incident hoặc hard-threshold breach rollback ngay, không chờ hết cửa sổ.
- Guardrails: error rate, p95 latency, AI invalid output, cost/session, support contact, learning completion.
- Tự rollback khi chạm hard threshold; human review cho soft threshold.
- Flag có owner, expiry date và cleanup ticket.

## 9. Experiment governance

Mỗi experiment ghi:

- Hypothesis và segment.
- Primary metric, guardrail và minimum detectable effect.
- Sample/timebox; không peeking để quyết định tùy ý.
- Privacy/ethics review nếu thay đổi nudges, trẻ vị thành niên hoặc AI behavior.
- Stop rule khi harm/complaint/error tăng.
- Kết quả gồm inconclusive; không chỉ ship/win.

Không A/B test bằng cách cố tình làm giảm chất lượng giáo dục, che giá, tạo dark pattern hoặc trì hoãn quyền export/delete.

## 10. Documentation governance

- PR thay đổi behavior phải cập nhật PRD/UX/API/traceability tương ứng.
- OpenAPI breaking change cần version và migration window.
- Rubric/prompt/model change cần version, golden eval và rollback pointer.
- SLO/retention/consent change cần Security/Privacy/SRE approval.
- Tài liệu obsolete được đánh dấu `retired`, không xóa lịch sử quyết định.

## 11. RACI cho quyết định quan trọng

| Quyết định | A | R | C | I |
|---|---|---|---|---|
| Product scope/KPI | Product Lead | PM | Learning, Design, Eng | Team |
| Level/rubric | Learning Lead | Assessment Specialist | AI, Product | QA |
| AI model/prompt | AI Lead | AI Engineer | Learning, Security | SRE |
| Data retention/consent | Privacy Lead | Backend/Product | Legal, Security | Support |
| Architecture/API | Engineering Lead | Tech Leads | SRE, Security | Product |
| Release production | Program Lead | SRE/QA | All leads | Company |
| Incident severity | Incident Commander | On-call | Security/Product | Stakeholders |

## 12. Decision log

| ID | Trạng thái | Quyết định | Lý do | Hệ quả/Follow-up |
|---|---|---|---|---|
| PDR-001 | Accepted | Level 1–7 là thang nội bộ | Tránh claim chứng chỉ thiếu căn cứ | UI phải ghi rõ; level dựa evidence |
| PDR-002 | Accepted | 90 ngày là program, không là lời hứa đạt L7 | Outcome phụ thuộc baseline/nỗ lực | Hiển thị target + confidence |
| PDR-003 | Accepted | AI không sở hữu scoring/level | Giảm hallucination và bias | Deterministic rubric/policy engine |
| PDR-004 | Accepted | Provider adapter Gemini/DeepSeek/OpenAI | Tránh lock-in, có fallback/cost control | Structured schema + eval theo provider |
| PDR-005 | Accepted | OpenVox local-first cho TTS | Riêng tư, chi phí, latency local | Browser/cloud fallback có disclosure |
| PDR-006 | Accepted | Audio lưu theo opt-in | Audio là dữ liệu nhạy cảm | Consent, retention, delete job |
| PDR-007 | Proposed | Launch English-first hay song song | Ảnh hưởng content/QA/headcount | Product owner quyết định sau discovery |
| PDR-008 | Proposed | Account/cloud-first hay local-first | Ảnh hưởng sync/privacy/onboarding | Chốt trước Foundation alpha |
| PDR-009 | Proposed | Provider phoneme/tone scoring | Transcript không đủ | Benchmark với human-rated corpus |
| PDR-010 | Proposed | Đối tượng tối thiểu 16/18 tuổi | Nghĩa vụ với trẻ em thay đổi | Legal/product decision trước signup |
| PDR-011 | Proposed | Subscription/B2B sequencing | Ảnh hưởng entitlement/billing | Chốt trước Public launch |

## 13. Risk register

| Risk | Likelihood | Impact | Owner | Mitigation | Trigger |
|---|---|---|---|---|---|
| Hứa hẹn Level 7 gây hiểu nhầm | Medium | High | Product | Wording + evidence confidence | Complaint/conversion copy |
| AI feedback sai | Medium | High | AI/Learning | Validator, golden eval, report, rollback | Eval/complaint threshold |
| Tone/pronunciation score thiếu chính xác | High | High | Voice/Learning | Human calibration, confidence, no-score state | Inter-rater thấp |
| Provider outage/cost spike | Medium | Medium | AI/SRE | Fallback, cache, budget cap, circuit breaker | Cost/error alert |
| Mất progress | Low | Critical | Engineering/SRE | Transaction, idempotency, backup/restore | Consistency alert |
| Audio/privacy misuse | Low | Critical | Privacy/Security | Opt-in, encryption, retention/delete | Audit/DSR failure |
| Hai ngôn ngữ làm loãng chất lượng | High | High | Product/Learning | Launch sequencing, content gate | Coverage/quality thấp |
| Streak tạo áp lực xấu | Medium | Medium | Product/Design | Recovery day, no shame copy | Research complaint |

## 14. Open decisions cần product owner chốt

1. Launch segment và ngôn ngữ đầu tiên.
2. Tuổi tối thiểu và chiến lược minor/guardian.
3. Local-first hay cloud-first cho public V1.
4. Retention raw audio/transcript theo từng purpose.
5. Voice scoring provider và ngưỡng confidence.
6. Pricing, trial, refund và B2B sequencing.
7. Community correction có nằm trong V1 không.
8. SLO/traffic/cost envelope sau khi có forecast kinh doanh.

Các quyết định này không chặn việc xây foundation, nhưng chặn public launch hoặc feature tương ứng.
