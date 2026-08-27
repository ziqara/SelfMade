// Живой переливающийся градиентный фон — используется и на странице входа, и во всем приложении,
// чтобы визуальный язык был единым (не только на экране авторизации).
export const GradientBackground = () => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
    <div
      className="absolute -top-32 -left-24 w-[32rem] h-[32rem] rounded-full bg-brand/25"
      style={{ animation: 'floatBlob 20s ease-in-out infinite, hueShift 16s ease-in-out infinite' }}
    />
    <div
      className="absolute -bottom-40 -right-24 w-[36rem] h-[36rem] rounded-full bg-indigo-600/20 blur-3xl"
      style={{ animation: 'floatBlobAlt 24s ease-in-out infinite reverse' }}
    />
    <div
      className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-fuchsia-500/10 blur-3xl"
      style={{ animation: 'floatBlob 15s ease-in-out infinite' }}
    />
  </div>
);
