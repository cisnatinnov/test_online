function getHistoryDate(row) {
  const rawDate = row?.createdAt ?? row?.created_at ?? row?.date ?? null;
  if (!rawDate) return '-';

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getHistoryDate };
}

if (typeof window !== 'undefined') {
  window.getHistoryDate = getHistoryDate;
}
