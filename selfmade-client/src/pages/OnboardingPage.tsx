import { apiClient, getApiErrorMessage } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';
import { ProfileForm, type ProfileFormValues } from '../components/ProfileForm';

export const OnboardingPage = () => {
  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  const handleSubmit = async (values: ProfileFormValues) => {
    try {
      await apiClient.post('/profile', {
        learningTrack: values.learningTrack,
        currentLevel: values.currentLevel,
        freeTimeStart: values.freeTimeStart + ':00', // Добавляем секунды для C# TimeOnly
        freeTimeEnd: values.freeTimeEnd + ':00',
        sleepTime: values.sleepTime + ':00',
        preferredRest: values.preferredRest,
        dislikedRest: values.dislikedRest,
      });

      toast.success('Профиль успешно сохранен!');
      await fetchProfile();
    } catch (error) {
      console.error('Ошибка:', error);
      toast.error(getApiErrorMessage(error) || 'Не удалось сохранить профиль. Попробуйте еще раз.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-2xl bg-surface/60 backdrop-blur-2xl border border-border-subtle rounded-2xl shadow-2xl shadow-black/30 p-8 md:p-10">
        <h2 className="heading-caps text-xl font-light text-text mb-2 text-center">Настройка профиля</h2>
        <p className="text-text-muted font-light mb-6 text-center">Заполни данные, чтобы ИИ мог составить расписание.</p>

        <ProfileForm
          initialValues={{ freeTimeStart: '19:30', freeTimeEnd: '23:00', sleepTime: '23:30' }}
          onSubmit={handleSubmit}
          submitLabel="Сохранить настройки"
          savingLabel="Сохранение..."
        />
      </div>
    </div>
  );
};
