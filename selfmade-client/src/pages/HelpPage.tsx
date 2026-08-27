import { useEffect } from 'react';
import { Sparkles, Target, PlayCircle, CalendarDays, Settings, Send } from 'lucide-react';
import { useHelpHintStore } from '../store/helpHintStore';

const STEPS = [
  {
    icon: Settings,
    title: '1. Профиль',
    text: 'Задай общее направление развития (например «Backend на C#»), расписание свободного времени и предпочтения по отдыху. Это контекст, на основе которого ИИ строит советы.',
  },
  {
    icon: Target,
    title: '2. Цели и категории',
    text: 'Категория — общая тема («Программирование», «Спорт»). Внутри категории добавляешь конкретные цели. Для целей развития можно нажать «План от ИИ» — он разложит цель на пошаговый план.',
  },
  {
    icon: PlayCircle,
    title: '3. Сессия на главной',
    text: '«Начать развиваться» запускает таймер. Пока сессия активна, отмечай выполненные шаги плана галочками. «Закончить развиваться» — итог: минуты, настроение, короткая рефлексия.',
  },
  {
    icon: Sparkles,
    title: '4. Совет от ИИ',
    text: 'Кнопка «Получить совет от ИИ» анализирует профиль, цели, сегодняшние активности и настроение — и предлагает конкретный следующий шаг в обучении и план восстановления на вечер.',
  },
  {
    icon: CalendarDays,
    title: '5. История',
    text: 'Весь журнал: выполненные задачи и дневник настроения. Данные оттуда тоже попадают в промпт для следующего совета — чем больше отмечено, тем точнее рекомендации.',
  },
];

export const HelpPage = () => {
  const markHelpVisited = useHelpHintStore((state) => state.markHelpVisited);

  useEffect(() => {
    markHelpVisited();
  }, [markHelpVisited]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
    <div className="w-full max-w-5xl mx-auto bg-surface/60 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/30 p-6 md:p-7 border border-border-subtle">
      <h1 className="heading-caps text-2xl font-light text-text mb-1 text-center">Как это работает</h1>
      <p className="text-text-muted font-light text-sm mb-5 text-center">
        Коротко про весь цикл — от настройки профиля до совета от ИИ на вечер.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3 bg-surface-2 border border-border-subtle rounded-xl p-3.5">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brand to-brand-dark flex items-center justify-center shrink-0">
              <Icon size={15} className="text-white" />
            </div>
            <div>
              <h2 className="heading-caps text-sm font-medium text-text mb-1">{title}</h2>
              <p className="text-text-muted font-light text-sm leading-snug">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-text-muted font-light text-sm leading-snug text-center mt-5">
        Совет: заметки настроения и рефлексия — не формальность. ИИ читает их при следующем совете,
        так что чем честнее и конкретнее, тем полезнее рекомендации.
      </p>

      <div className="flex items-center justify-center gap-5 mt-6 pt-5 border-t border-border-subtle">
        <a
          href="https://t.me/businessbossvip"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-text-muted hover:text-brand-light text-sm font-light transition-colors"
        >
          <Send size={14} />
          @businessbossvip
        </a>
        <a
          href="https://github.com/ziqara"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-text-muted hover:text-brand-light text-sm font-light transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.79-.25.79-.55 0-.27-.01-1.16-.02-2.1-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.7 1.25 3.36.95.1-.75.4-1.25.73-1.53-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.73 0c2.18-1.49 3.14-1.18 3.14-1.18.63 1.58.24 2.75.12 3.04.74.8 1.18 1.83 1.18 3.09 0 4.43-2.7 5.4-5.27 5.69.42.36.78 1.07.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .3.21.66.79.55A10.53 10.53 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
          </svg>
          github.com/ziqara
        </a>
      </div>
    </div>
    </div>
  );
};
