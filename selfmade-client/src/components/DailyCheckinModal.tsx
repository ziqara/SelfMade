import { useState } from 'react';
import { motion } from 'motion/react';
import { apiClient, getApiErrorMessage } from '../api/client';
import { toast } from '../store/toastStore';

interface DailyCheckinModalProps {
  onDone: () => void;
  onSkip: () => void;
}

const MOOD_LABELS = ['Тяжело', 'Так себе', 'Нормально', 'Хорошо', 'Отлично'];
const moodColor = (value: number) =>
  value >= 4 ? 'bg-green-400' : value === 3 ? 'bg-amber-400' : 'bg-red-400';

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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md bg-surface border border-border-subtle rounded-2xl shadow-2xl shadow-black/40 p-6"
      >
        <h2 className="text-xl font-medium text-text">Как прошел день?</h2>
        <p className="text-text-muted font-light text-sm mt-1">Пара слов — это поможет ИИ давать более точные советы.</p>

        <div className="flex justify-between mt-6 mb-4">
          {MOOD_LABELS.map((label, i) => {
            const value = i + 1;
            return (
              <button
                key={value}
                onClick={() => setScore(value)}
                className="flex flex-col items-center gap-1.5 group"
                aria-label={label}
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    score === value ? `${moodColor(value)} text-ink scale-110` : 'bg-surface-2 text-text-muted group-hover:bg-border-subtle'
                  }`}
                >
                  {value}
                </span>
                <span className={`text-[10px] font-light ${score === value ? 'text-text' : 'text-text-muted'}`}>{label}</span>
              </button>
            );
          })}
        </div>

        <textarea
          placeholder="Что сегодня делал? (необязательно)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full border border-border-subtle bg-surface-2 text-text placeholder-text-muted font-light p-3 rounded-lg text-sm resize-none"
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onSkip}
            className="flex-1 text-text-muted font-normal py-3 rounded-xl hover:bg-surface-2 transition-colors"
          >
            Пропустить
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 text-white font-medium py-3 rounded-xl transition-colors ${
              isSubmitting ? 'bg-brand/40 cursor-wait' : 'bg-gradient-to-r from-brand to-brand-dark hover:brightness-110'
            }`}
          >
            {isSubmitting ? 'Сохраняю...' : 'Записать'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
