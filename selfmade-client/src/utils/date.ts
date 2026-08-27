// Локальный (не UTC) ключ даты вида "yyyy-mm-dd" — используется для группировки записей по дню в календаре истории.
export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
