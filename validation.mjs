export function validateLanguageAllocation(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (Object.keys(value).sort().join('|') !== 'en|zh-CN') return false;
  const en = value.en;
  const zh = value['zh-CN'];
  return Number.isInteger(en) && Number.isInteger(zh) && en >= 0 && en <= 100 && zh >= 0 && zh <= 100 && en + zh === 100;
}
