(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WritingCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function normalizeText(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[.,!?;:'"“”‘’。，！？；：]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokens(value, language) {
    const normalized = normalizeText(value);
    if (!normalized) return [];
    if (language === 'zh') return normalized.replace(/\s+/g, '').split('').filter(Boolean);
    return normalized.split(' ').filter(Boolean);
  }

  function compareText(answer, target, language) {
    const answerTokens = tokens(answer, language);
    const targetTokens = tokens(target, language);
    const total = targetTokens.length;
    const positionMatches = targetTokens.reduce((count, token, index) => count + (answerTokens[index] === token ? 1 : 0), 0);
    const remaining = [...targetTokens];
    let presentMatches = 0;
    for (const token of answerTokens) {
      const index = remaining.indexOf(token);
      if (index !== -1) { presentMatches += 1; remaining.splice(index, 1); }
    }
    return {
      exact: normalizeText(answer) === normalizeText(target),
      total,
      answerCount: answerTokens.length,
      positionMatches,
      positionAccuracy: total ? positionMatches / total : 0,
      wordAccuracy: total ? presentMatches / total : 0,
      missing: remaining
    };
  }

  function createChunks(sentence, language) {
    if (language === 'zh') {
      const clean = String(sentence || '').trim();
      const punctuation = /[，。！？；：]/;
      const chunks = [];
      let current = '';
      for (const char of clean) {
        current += char;
        if (punctuation.test(char) || current.replace(punctuation, '').length >= 3) {
          chunks.push(current); current = '';
        }
      }
      if (current) chunks.push(current);
      return chunks.filter(Boolean);
    }
    const words = String(sentence || '').trim().split(/\s+/).filter(Boolean);
    const size = Math.max(1, Math.ceil(words.length / 5));
    const chunks = [];
    for (let index = 0; index < words.length; index += size) chunks.push(words.slice(index, index + size).join(' '));
    return chunks;
  }

  function shuffleChunks(chunks, random = Math.random) {
    const shuffled = chunks.map((text, index) => ({ id: `chunk-${index}`, text, order: index }));
    for (let index = shuffled.length - 1; index > 0; index--) {
      const swap = Math.floor(random() * (index + 1));
      [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
    }
    if (shuffled.length > 1 && shuffled.every((chunk, index) => chunk.order === index)) {
      [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
    }
    return shuffled;
  }

  return { normalizeText, tokens, compareText, createChunks, shuffleChunks };
});
