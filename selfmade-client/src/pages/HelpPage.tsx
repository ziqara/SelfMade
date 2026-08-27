import { Sparkles, Target, PlayCircle, CalendarDays, Settings } from 'lucide-react';

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
  return (
    <div className="max-w-4xl mx-auto bg-surface/60 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/30 p-6 md:p-7 border border-border-subtle">
      <h1 className="heading-caps text-xl font-light text-text mb-1 text-center">Как это работает</h1>
      <p className="text-text-muted font-light text-sm mb-5 text-center">
        Коротко про весь цикл — от настройки профиля до совета от ИИ на вечер.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3 bg-surface-2 border border-border-subtle rounded-xl p-3.5">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brand to-brand-dark flex items-center justify-center shrink-0">
              <Icon size={15} className="text-white" />
            </div>
            <div>
              <h2 className="heading-caps text-xs font-medium text-text mb-0.5">{title}</h2>
              <p className="text-text-muted font-light text-xs leading-snug">{text}</p>
            </div>
          </div>
        ))}

        <div className="flex gap-3 bg-brand/10 border border-brand/20 rounded-xl p-3.5">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-brand to-brand-dark flex items-center justify-center shrink-0">
            <Sparkles size={15} className="text-white" />
          </div>
          <p className="text-text-muted font-light text-xs leading-snug self-center">
            Совет: заметки настроения и рефлексия — не формальность. ИИ читает их при следующем совете,
            так что чем честнее и конкретнее, тем полезнее рекомендации.
          </p>
        </div>
      </div>
    </div>
  );
};
