// Живой переливающийся градиентный фон — используется по всему приложению для единого визуального языка.
// Важно: контейнеры-обертки над этим компонентом не должны иметь свой непрозрачный bg-*,
// иначе он перекроет пятна (z-index:-10 рисуется ниже непрозрачного фона обычного блока).
export const GradientBackground = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
    <div
      className="absolute -top-32 -left-24 w-[34rem] h-[34rem] rounded-full bg-brand/40"
      style={{ animation: 'floatBlob 20s ease-in-out infinite, hueShift 14s ease-in-out infinite' }}
    />
    <div
      className="absolute -bottom-40 -right-24 w-[38rem] h-[38rem] rounded-full bg-indigo-600/35 blur-3xl"
      style={{ animation: 'floatBlobAlt 24s ease-in-out infinite reverse, hueShift 18s ease-in-out infinite' }}
    />
    <div
      className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-fuchsia-500/25 blur-3xl"
      style={{ animation: 'floatBlob 16s ease-in-out infinite reverse, hueShift 11s ease-in-out infinite' }}
    />
    <div
      className="absolute bottom-1/4 left-1/3 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl"
      style={{ animation: 'floatBlobAlt 19s ease-in-out infinite' }}
    />
  </div>
);
