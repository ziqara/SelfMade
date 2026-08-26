import { useState } from 'react';

export interface ProfileFormValues {
  learningTrack: string;
  currentLevel: string;
  freeTimeStart: string;
  freeTimeEnd: string;
  sleepTime: string;
  preferredRest: string;
  dislikedRest: string;
}

interface ProfileFormProps {
  initialValues?: Partial<ProfileFormValues>;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  submitLabel: string;
  savingLabel: string;
}

const DEFAULT_VALUES: ProfileFormValues = {
  learningTrack: '',
  currentLevel: '',
  freeTimeStart: '19:00',
  freeTimeEnd: '22:00',
  sleepTime: '23:00',
  preferredRest: '',
  dislikedRest: '',
};

// Общая форма профиля/расписания — используется и при первичном онбординге, и в настройках.
export const ProfileForm = ({ initialValues, onSubmit, submitLabel, savingLabel }: ProfileFormProps) => {
  const [values, setValues] = useState<ProfileFormValues>({ ...DEFAULT_VALUES, ...initialValues });
  const [isSaving, setIsSaving] = useState(false);

  const setField = <K extends keyof ProfileFormValues>(field: K, value: ProfileFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-bold text-gray-700 mb-2">Вектор развития (что учим?)</label>
          <input
            type="text"
            value={values.learningTrack}
            onChange={(e) => setField('learningTrack', e.target.value)}
            required
            placeholder="Например: C# ASP.NET Core"
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-bold text-gray-700 mb-2">Текущий уровень</label>
          <input
            type="text"
            value={values.currentLevel}
            onChange={(e) => setField('currentLevel', e.target.value)}
            placeholder="Например: Junior+"
            className="w-full border p-2 rounded"
          />
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
        <h3 className="font-bold text-blue-900 mb-4">Твое расписание</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Свободное время (от):</label>
            <input
              type="time"
              value={values.freeTimeStart}
              onChange={(e) => setField('freeTimeStart', e.target.value)}
              required
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Свободное время (до):</label>
            <input
              type="time"
              value={values.freeTimeEnd}
              onChange={(e) => setField('freeTimeEnd', e.target.value)}
              required
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Время сна:</label>
            <input
              type="time"
              value={values.sleepTime}
              onChange={(e) => setField('sleepTime', e.target.value)}
              required
              className="w-full border p-2 rounded"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-bold text-gray-700 mb-2">Любимый отдых</label>
          <input
            type="text"
            value={values.preferredRest}
            onChange={(e) => setField('preferredRest', e.target.value)}
            required
            placeholder="Например: Sci-Fi, прогулки"
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-bold text-gray-700 mb-2">Нежелательный отдых</label>
          <input
            type="text"
            value={values.dislikedRest}
            onChange={(e) => setField('dislikedRest', e.target.value)}
            placeholder="Например: Бег, клубы"
            className="w-full border p-2 rounded"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className={`w-full text-white p-4 rounded-xl font-bold transition-colors ${
          isSaving ? 'bg-gray-400 cursor-wait' : 'bg-gray-800 hover:bg-black'
        }`}
      >
        {isSaving ? savingLabel : submitLabel}
      </button>
    </form>
  );
};
