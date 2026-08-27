interface GoalProgressRingProps {
  title: string;
  completed: number;
  total: number;
  size?: number;
}

// Кольцевой индикатор прогресса по одной цели — доля выполненных шагов плана от ИИ.
export const GoalProgressRing = ({ title, completed, total, size = 64 }: GoalProgressRingProps) => {
  const pct = total > 0 ? completed / total : 0;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2 w-24 text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-border-subtle"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`transition-all duration-500 ${pct >= 1 ? 'text-green-400' : 'text-brand-light'}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-text">
          {Math.round(pct * 100)}%
        </div>
      </div>
      <span className="text-xs text-text-muted font-light leading-snug line-clamp-2" title={title}>
        {title}
      </span>
    </div>
  );
};
