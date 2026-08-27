// Общая шкала цвета настроения (1-5) — переиспользуется в дневнике и в календаре истории.
export const moodColor = (score: number) =>
  score >= 4 ? 'bg-green-400' : score === 3 ? 'bg-amber-400' : 'bg-red-400';
