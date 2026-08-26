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
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-2">Настройка профиля</h2>
      <p className="text-gray-600 mb-6">Заполни данные, чтобы ИИ мог составить расписание.</p>

      <ProfileForm
        initialValues={{ freeTimeStart: '19:30', freeTimeEnd: '23:00', sleepTime: '23:30' }}
        onSubmit={handleSubmit}
        submitLabel="Сохранить настройки"
        savingLabel="Сохранение..."
      />
    </div>
  );
};
