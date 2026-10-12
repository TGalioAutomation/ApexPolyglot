/* LingoVoice — SRS core (SM-2 lite, 4 mức đánh giá)
 * Dùng chung cho Learn & Review, và cho cả browser lẫn test Node (UMD).
 * Thang 4 mức: 1=Lại, 2=Khó, 3=Tốt, 5=Dễ.
 * Quy tắc:
 *  - Không hiển thị nghĩa trước khi tự nhớ (phần UI xử lý).
 *  - Không tự đánh dấu mastered sau một lượt Dễ: cần 3 lượt tốt liên tiếp.
 *  - Interval: Lại ~1 phút, Khó ~1 ngày, Tốt ~3 ngày, Dễ ~10 ngày.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SRS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const MINUTE = 60 * 1000;
  const DAY = 24 * 60 * 60 * 1000;

  const GRADES = { again: 1, hard: 2, good: 3, easy: 5 };
  const GRADE_LABELS = { 1: 'Lại', 2: 'Khó', 3: 'Tốt', 5: 'Dễ' };

  // Khoảng ôn theo mức (ms)
  function intervalMs(grade) {
    if (grade <= 1) return MINUTE;          // 1 phút
    if (grade === 2) return 1 * DAY;        // 1 ngày
    if (grade === 3) return 3 * DAY;        // 3 ngày
    return 10 * DAY;                        // 10 ngày
  }

  // Nhãn dễ hiểu cho một khoảng thời gian (ms)
  function intervalLabel(ms) {
    if (ms < 2 * MINUTE) return '1 phút';
    const days = Math.round(ms / DAY);
    if (days < 1) return 'hôm nay';
    if (days === 1) return '1 ngày';
    if (days < 14) return `${days} ngày`;
    return `${Math.round(days / 7)} tuần`;
  }

  // Nhãn cho mức đánh giá (dùng khi hiện interval dự kiến)
  function gradeIntervalLabel(grade) {
    return intervalLabel(intervalMs(grade));
  }

  // Đánh giá một item: trả về trạng thái mới + interval
  // current: { state, reps, consecutiveGood }
  function evaluate(current, grade) {
    const reps = (current && current.reps || 0) + 1;
    const consecutiveGood = (grade >= 3) ? ((current && current.consecutiveGood || 0) + 1) : 0;
    let state = 'learning';
    if (grade === 2) state = 'difficult';
    else if (grade >= 3) state = consecutiveGood >= 3 ? 'mastered' : 'review';
    // again (1) giữ learning
    const interval = intervalMs(grade);
    const mastered = state === 'mastered';
    return {
      state,
      intervalMs: mastered ? 0 : interval,
      dueAt: mastered ? null : Date.now() + interval,
      reps,
      consecutiveGood,
      difficult: grade === 2,
      mastered
    };
  }

  // Trạng thái xuất phát cho từ mới
  function initial() {
    return { state: 'new', reps: 0, consecutiveGood: 0, dueAt: null, lastGrade: null };
  }

  // Đếm theo trạng thái cho một tập item {id: {state,...}}
  function stats(itemsMap) {
    const out = { new: 0, learning: 0, review: 0, mastered: 0, difficult: 0, due: 0 };
    const now = Date.now();
    for (const it of Object.values(itemsMap || {})) {
      out[it.state] = (out[it.state] || 0) + 1;
      if (it.state !== 'difficult' && it.difficult) out.difficult += 1;
      if (it.state !== 'mastered' && (it.dueAt === null || it.dueAt <= now)) out.due += 1;
    }
    return out;
  }

  // Dựng chuỗi bước cho phiên học từ mới theo kỹ thuật tích lũy (cumulative):
  // mỗi từ mới được giới thiệu (learn) rồi xen kẽ 1 lần kiểm tra ngẫu nhiên
  // một từ ĐÃ học trước đó trong phiên (ưu tiên từ chưa được kiểm tra lần nào),
  // để kho từ tích lũy dần thay vì học từ sau quên từ trước.
  // rand injectable để test xác định được.
  function buildLearnSteps(ids, rand) {
    rand = rand || Math.random;
    const steps = [];
    const learned = [];
    const checks = Object.create(null);
    for (const id of ids) {
      steps.push({ t: 'learn', id });
      learned.push(id);
      if (learned.length < 2) continue;
      const pool = learned.filter((x) => x !== id);
      const unchecked = pool.filter((x) => !checks[x]);
      const from = unchecked.length ? unchecked : pool;
      const pick = from[Math.min(from.length - 1, Math.floor(rand() * from.length))];
      checks[pick] = (checks[pick] || 0) + 1;
      steps.push({ t: 'check', id: pick });
    }
    return steps;
  }

  // Tóm tắt một phiên học (dùng khi kết thúc session)
  function summarize(records) {
    const total = records.length;
    const good = records.filter((r) => r.grade >= 3).length;
    const again = records.filter((r) => r.grade <= 1).length;
    return { total, good, again, relearn: again };
  }

  return { GRADES, GRADE_LABELS, intervalMs, intervalLabel, gradeIntervalLabel, evaluate, initial, stats, summarize, buildLearnSteps, MINUTE, DAY };
});
