/* LingoVoice — Pronunciation core (so transcript nhận dạng giọng nói với câu mục tiêu)
 * Dùng chung cho mode "Phát âm" và cho cả browser lẫn test Node (UMD).
 * Nguyên tắc:
 *  - STT sai nghe = khả năng phát âm sai, nên so TỪNG TỪ (không so cả câu) để chỉ đúng chỗ sửa.
 *  - Tiếng Anh: tách theo từ; tiếng Trung: tách theo chữ Hán (không có khoảng trắng).
 *  - Điểm word-accuracy chỉ là số liệu tức thì ở client; nhận xét AI do server trả.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Pron = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // Tách câu thành đơn vị so sánh. ZH: mỗi chữ Hán một đơn vị (bỏ dấu câu/latin).
  function tokenize(text, lang) {
    const s = String(text || '');
    if (lang === 'zh') {
      const han = s.match(/[\u4e00-\u9fff]/g) || [];
      return han.map((c) => c.toLowerCase());
    }
    const words = s.toLowerCase().match(/[a-zà-ỹăâđêôơư][a-zà-ỹăâđêôơư']*/gi) || [];
    return words.map((w) => w.replace(/^'+|'+$/g, '')).filter(Boolean);
  }

  // Tỉ lệ giống nhau 2 chuỗi (Levenshtein chuẩn hóa 0..1)
  function similarity(a, b) {
    if (a === b) return 1;
    if (!a.length || !b.length) return 0;
    const m = a.length, n = b.length;
    let prev = new Array(n + 1), cur = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      [prev, cur] = [cur, prev];
    }
    return 1 - prev[n] / Math.max(m, n);
  }

  // Align từng từ mục tiêu với transcript: ok (khớp ≥0.9), wrong (khớp chỗ nhưng lệch âm), missing (không có).
  // Ngưỡng 0.9 (chặt) vì STT nghe lệch một âm = khả năng phát âm sai — đúng thứ cần chỉ ra
  // ("schedule" nói thành "skedule" phải là wrong, không phải ok).
  // Thuật toán: Levenshtein trên mảng đơn vị; chi phí thay = 1 - similarity (nên từ lệch nhẹ vẫn align thành wrong thay vì wrong+missing).
  function align(target, heard, lang) {
    const T = tokenize(target, lang), H = tokenize(heard, lang);
    const m = T.length, n = H.length;
    const SUB_THRESHOLD = 0.9;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const sub = dp[i - 1][j - 1] + (1 - similarity(T[i - 1], H[j - 1]));
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, sub);
      }
    }
    // backtrack
    const out = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0) {
        const sub = dp[i - 1][j - 1] + (1 - similarity(T[i - 1], H[j - 1]));
        if (Math.abs(dp[i][j] - sub) < 1e-9) {
          const status = similarity(T[i - 1], H[j - 1]) >= SUB_THRESHOLD ? 'ok' : 'wrong';
          out.push({ word: T[i - 1], heard: H[j - 1], status });
          i--; j--; continue;
        }
      }
      if (i > 0 && Math.abs(dp[i][j] - (dp[i - 1][j] + 1)) < 1e-9) {
        out.push({ word: T[i - 1], heard: null, status: 'missing' });
        i--; continue;
      }
      // từ nghe được nhưng không khớp mục tiêu nào (thừa) — bỏ qua
      j--;
      if (j < 0) break;
    }
    return out.reverse();
  }

  // Word accuracy 0..100 (làm tròn); từ wrong được cộng theo độ giống THẬT với chỗ STT nghe
  // (vd "skedule" ~0.75) thay vì điểm phẳng — nói lệch nhẹ phải cao điểm hơn sai hẳn sang từ khác.
  function score(aligned) {
    if (!aligned.length) return 0;
    let pts = 0;
    for (const a of aligned) {
      if (a.status === 'ok') pts += 1;
      else if (a.status === 'wrong') pts += similarity(a.word, a.heard || '');
    }
    return Math.round((pts / aligned.length) * 100);
  }

  // Các từ cần AI nhận xét: sai trước, thiếu sau, tối đa 4.
  function wrongWords(aligned, max = 4) {
    const wrong = aligned.filter((a) => a.status === 'wrong');
    const missing = aligned.filter((a) => a.status === 'missing');
    return wrong.concat(missing).slice(0, max);
  }

  return { tokenize, similarity, align, score, wrongWords };
});
