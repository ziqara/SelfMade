import { useAuthStore } from '../store/authStore';
import { apiClient, getApiErrorMessage } from '../api/client';
import { toast } from '../store/toastStore';
import { ProfileForm, type ProfileFormValues } from '../components/ProfileForm';

export const ProfilePage = () => {
  const { profile, fetchProfile } = useAuthStore();

  const handleSubmit = async (values: ProfileFormValues) => {
    try {
      // Используем тот же эндпоинт, что и в анкете онбординга
      await apiClient.post('/profile', {
        learningTrack: values.learningTrack,
        currentLevel: values.currentLevel,
        freeTimeStart: values.freeTimeStart.length === 5 ? values.freeTimeStart + ':00' : values.freeTimeStart,
        freeTimeEnd: values.freeTimeEnd.length === 5 ? values.freeTimeEnd + ':00' : values.freeTimeEnd,
        sleepTime: values.sleepTime.length === 5 ? values.sleepTime + ':00' : values.sleepTime,
        preferredRest: values.preferredRest,
        dislikedRest: values.dislikedRest,
      });

      toast.success('Настройки профиля успешно обновлены!');
      await fetchProfile(); // Обновляем данные в глобальном хранилище
    } catch (error) {
      console.error('Ошибка:', error);
      toast.error(getApiErrorMessage(error) || 'Не удалось обновить профиль. Попробуйте еще раз.');
    }
  };

  if (!profile) {
    return <div className="p-8 text-gray-500">Загрузка профиля...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8 border border-gray-100">
      <h1 className="text-3xl font-bold mb-2">Настройки ИИ-наставника ⚙️</h1>
      <p className="text-gray-500 mb-8">Обнови свое расписание и векторы развития, чтобы ИИ давал более точные советы.</p>

      <ProfileForm
        initialValues={{
          learningTrack: profile.learningTrack || '',
          currentLevel: profile.currentLevel || '',
          preferredRest: profile.preferredRest || '',
          dislikedRest: profile.dislikedRest || '',
          // Обрезаем секунды "HH:mm:ss" -> "HH:mm" для HTML-инпутов
          freeTimeStart: profile.freeTimeStart?.substring(0, 5) || '19:00',
          freeTimeEnd: profile.freeTimeEnd?.substring(0, 5) || '22:00',
          sleepTime: profile.sleepTime?.substring(0, 5) || '23:00',
        }}
        onSubmit={handleSubmit}
        submitLabel="Сохранить изменения"
        savingLabel="Сохранение..."
      />
    </div>
  );
};
