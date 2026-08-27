import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { moodColor } from '../utils/moodColor';
import { toDateKey } from '../utils/date';
import type { Activity, Mood } from '../types';

interface HistoryCalendarProps {
  activities: Activity[];
  moods: Mood[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  viewDate: Date;
  onViewDateChange: (date: Date) => void;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// Месячный календарь: каждый день — кружок, цвет которого отражает настроение в этот день,
// а маленькая точка снизу — была ли активность. Клик выбирает день для детального просмотра.
// Отображаемый месяц управляется извне (HistoryPage) — им же фильтруется "Полный список записей".
export const HistoryCalendar = ({ activities, moods, selectedDate, onSelectDate, viewDate, onViewDateChange }: HistoryCalendarProps) => {
  const dayData = useMemo(() => {
    const map = new Map<string, { activityCount: number; moodScore: number | null }>();

    for (const act of activities) {
      const key = toDateKey(new Date(act.createdAt));
      const entry = map.get(key) ?? { activityCount: 0, moodScore: null };
      entry.activityCount += 1;
      map.set(key, entry);
    }

    // moods уже отсортированы от новых к старым (HistoryPage), поэтому первая
    // встреченная запись на дату — самая свежая, ее и берем как настроение дня
    for (const mood of moods) {
      const key = toDateKey(new Date(mood.createdAt));
      const entry = map.get(key) ?? { activityCount: 0, moodScore: null };
      if (entry.moodScore === null) entry.moodScore = mood.score;
      map.set(key, entry);
    }

    return map;
  }, [activities, moods]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7; // неделя начинается с понедельника
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toDateKey(new Date());

  // Всегда ровно 6 строк (42 ячейки), даже если месяцу хватило бы 4-5 — иначе
  // при переключении месяцев календарь "прыгает" по высоте (из-за
  // вертикального центрирования блока в карточке фиксированной высоты).
  const cells: (Date | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length < 42) cells.push(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onViewDateChange(new Date(year, month - 1, 1))}
          className="text-text-muted hover:text-text p-1 rounded transition-colors"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="heading-caps text-xs font-medium text-text capitalize">
          {viewDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => onViewDateChange(new Date(year, month + 1, 1))}
          className="text-text-muted hover:text-text p-1 rounded transition-colors"
          aria-label="Следующий месяц"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="max-w-[440px] mx-auto">
        <div className="grid grid-cols-7 gap-3 text-center mb-1.5">
          {WEEKDAYS.map((d) => (
            <span key={d} className="text-xs text-text-muted font-light">{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {cells.map((date, i) => {
            if (!date) return <div key={`blank-${i}`} className="aspect-square" />;
            const key = toDateKey(date);
            const data = dayData.get(key);
            const isSelected = selectedDate === key;
            const isToday = key === todayKey;

            return (
              <button
                key={key}
                onClick={() => onSelectDate(isSelected ? null : key)}
                className={`relative aspect-square w-full rounded-full flex items-center justify-center text-sm transition-all hover:opacity-80 ${
                  data?.moodScore != null ? `${moodColor(data.moodScore)} text-ink` : 'bg-surface-2 text-text-muted'
                } ${isSelected ? 'ring-2 ring-brand ring-offset-2 ring-offset-surface' : ''} ${isToday ? 'font-semibold' : 'font-light'}`}
              >
                {date.getDate()}
                {data && data.activityCount > 0 && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand border border-surface" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
