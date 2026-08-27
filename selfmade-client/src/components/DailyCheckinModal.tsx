import { useState } from 'react';
import { apiClient, getApiErrorMessage } from '../api/client';
import { toast } from '../store/toastStore';

interface DailyCheckinModalProps {
  onDone: () => void;
  onSkip: () => void;
}

const MOOD_EMOJIS = ['😫', '☹️', '😐', '🙂', '🤩'];

// Разовый вопрос при первом заходе за день — общий сбор данных о том, как прошел день,
// а не только про учебу/план от ИИ.
export const DailyCheckinModal = ({ onDone, onSkip }: DailyCheckinModalProps) => {
  const [score, setScore] = useState(4);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.post('/moods', { score, note: note.trim() || 'Без заметки' });
      toast.success('Записал, спасибо!');
      onDone();
    } catch (error) {
      console.error('Ошибка записи чек-ина:', error);
      toast.error(getApiErrorMessage(error) || 'Не удалось сохранить.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-bold text-gray-800">Как прошел день? 👋</h2>
        <p className="text-gray-500 text-sm mt-1">Пара слов — это поможет ИИ давать более точные советы.</p>

        <div className="flex justify-between mt-6 mb-4">
          {MOOD_EMOJIS.map((emoji, i) => {
            const value = i + 1;
            return (
              <button
                key={value}
                onClick={() => setScore(value)}
                className={`text-3xl w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  score === value ? 'bg-blue-100 scale-110' : 'hover:bg-gray-100'
                }`}
                aria-label={`Оценка ${value}`}
              >
                {emoji}
              </button>
            );
          })}
        </div>

        <textarea
          placeholder="Что сегодня делал? (необязательно)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full border p-3 rounded-lg text-sm resize-none"
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onSkip}
            className="flex-1 text-gray-500 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Пропустить
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 text-white font-bold py-3 rounded-xl transition-colors ${
              isSubmitting ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Сохраняю...' : 'Записать'}
          </button>
        </div>
      </div>
    </div>
  );
};
