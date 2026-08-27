import { useEffect, useState } from 'react';
import { Target, Bookmark, Sparkles } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../api/client';
import { toast } from '../store/toastStore';
import { GoalPlanCard } from '../components/GoalPlanCard';
import type { Category, UserInterest } from '../types';

export const GoalsPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [interests, setInterests] = useState<UserInterest[]>([]);
  const [isGeneratingGoals, setIsGeneratingGoals] = useState(false);

  // Состояния форм
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [categoryType, setCategoryType] = useState('Обучение');

  const [interestTitle, setInterestTitle] = useState('');
  const [isDevGoal, setIsDevGoal] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const loadData = async () => {
    try {
      const [catRes, intRes] = await Promise.all([
        apiClient.get<Category[]>('/categories'),
        apiClient.get<UserInterest[]>('/userinterests/my')
      ]);
      setCategories(catRes.data);
      setInterests(intRes.data);
      if (catRes.data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(catRes.data[0].id.toString());
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadData переиспользуется после сабмита форм, не только на маунте
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/categories', { name: categoryName, description: categoryDesc, type: categoryType });
      setCategoryName(''); setCategoryDesc(''); setCategoryType('Обучение');
      toast.success('Категория создана!');
      loadData();
    } catch (error) {
      console.error('Ошибка при создании категории:', error);
      toast.error(getApiErrorMessage(error) || 'Ошибка при создании категории');
    }
  };

  const handleGenerateGoals = async () => {
    setIsGeneratingGoals(true);
    try {
      const response = await apiClient.post<{ message: string; count: number }>('/userinterests/generate');
      toast.success(response.data.message);
      if (response.data.count > 0) loadData();
    } catch (error) {
      console.error('Ошибка генерации целей:', error);
      toast.error(getApiErrorMessage(error) || 'Не удалось предложить цели.');
    } finally {
      setIsGeneratingGoals(false);
    }
  };

  const handleInterestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/userinterests', { categoryId: parseInt(selectedCategoryId), title: interestTitle, isDevelopmentGoal: isDevGoal });
      setInterestTitle('');
      toast.success('Цель добавлена!');
      loadData();
    } catch (error) {
      console.error('Ошибка при добавлении цели:', error);
      toast.error(getApiErrorMessage(error) || 'Ошибка при добавлении цели');
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-surface/60 backdrop-blur-2xl rounded-xl shadow-sm p-8 border border-border-subtle">
      <h1 className="heading-caps text-2xl font-light text-text mb-2">Цели и категории</h1>
      <p className="text-text-muted font-light mb-8">
        Конкретные шаги в рамках общего направления, которое задано в «Профиле». Каждая цель привязана к категории — общей теме вроде «Программирование» или «Спорт».
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* Левая колонка: Формы */}
        <div className="space-y-8">
          <div className="bg-surface-2 p-6 rounded-xl border border-border-subtle">
            <h2 className="heading-caps text-sm font-medium mb-4 text-text-muted">1. Создать категорию</h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <input type="text" placeholder="Программирование" value={categoryName} onChange={e => setCategoryName(e.target.value)} className="w-full border border-border-subtle bg-surface text-text placeholder-text-muted font-light p-3 rounded-lg" required />
              <input type="text" placeholder="Описание (опционально)" value={categoryDesc} onChange={e => setCategoryDesc(e.target.value)} className="w-full border border-border-subtle bg-surface text-text placeholder-text-muted font-light p-3 rounded-lg" />
              <div className="flex items-center gap-4">
                <label className="text-text-muted font-light">Тип:</label>
                <select value={categoryType} onChange={e => setCategoryType(e.target.value)} className="border border-border-subtle p-3 rounded-lg w-full bg-surface text-text font-light">
                  <option value="Обучение">Обучение</option>
                  <option value="Спорт">Спорт</option>
                  <option value="Отдых">Отдых</option>
                  <option value="Работа">Работа</option>
                  <option value="Другое">Другое</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-surface text-text border border-border-subtle p-3 rounded-lg font-medium hover:bg-surface-2 hover:border-brand/30 transition-colors">Создать категорию</button>
            </form>
          </div>

          <div className="bg-rose-500/10 p-6 rounded-xl border border-rose-500/20">
            <h2 className="heading-caps text-sm font-medium mb-4 text-rose-300">2. Добавить цель развития</h2>
            <form onSubmit={handleInterestSubmit} className="space-y-4">
              {categories.length > 0 ? (
                <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full border border-border-subtle p-3 rounded-lg bg-surface text-text font-light">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ) : (
                <p className="text-sm text-red-400 font-light mb-2">Сначала создайте категорию выше.</p>
              )}
              <input type="text" placeholder="Сделать аутентификацию" value={interestTitle} onChange={e => setInterestTitle(e.target.value)} className="w-full border border-border-subtle bg-surface text-text placeholder-text-muted font-light p-3 rounded-lg" required />
              <label className="flex items-center gap-3 cursor-pointer p-2">
                <input type="checkbox" checked={isDevGoal} onChange={e => setIsDevGoal(e.target.checked)} className="w-5 h-5 rounded text-rose-500" />
                <span className="text-text font-light">Это цель для развития (увидит ИИ)</span>
              </label>
              <button type="submit" className="w-full bg-rose-500 text-white p-3 rounded-lg font-medium hover:bg-rose-400 transition-colors">Сохранить цель</button>
            </form>
          </div>
        </div>

        {/* Правая колонка: Списки */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="heading-caps text-sm font-medium text-rose-300">Твои глобальные цели</h2>
              <button
                onClick={handleGenerateGoals}
                disabled={isGeneratingGoals}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0 ${
                  isGeneratingGoals
                    ? 'text-text-muted border-border-subtle cursor-wait'
                    : 'text-rose-300 border-rose-500/30 hover:bg-rose-500/10'
                }`}
              >
                <Sparkles size={13} />
                {isGeneratingGoals ? 'Придумываю цели...' : 'Предложить цели (ИИ)'}
              </button>
            </div>
            <p className="text-xs text-text-muted font-light -mt-2 mb-4">
              ИИ сам разложит общее направление из «Профиля» на конкретные цели — не нужно придумывать их вручную.
            </p>
            {interests.length === 0 ? (
              <p className="text-text-muted font-light">Цели пока не добавлены.</p>
            ) : (
              <ul className="space-y-3">
                {interests.map(interest => (
                  <li key={interest.id} className="p-4 bg-surface-2 border border-border-subtle rounded-lg shadow-sm">
                    <div className="flex items-start gap-3">
                      {interest.isDevelopmentGoal
                        ? <Target size={18} className="text-rose-400 shrink-0 mt-0.5" />
                        : <Bookmark size={18} className="text-text-muted shrink-0 mt-0.5" />}
                      <span className="font-normal text-text">{interest.title}</span>
                    </div>
                    {interest.isDevelopmentGoal && (
                      <GoalPlanCard goalId={interest.id} goalTitle={interest.title} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="heading-caps text-sm font-medium mb-4 text-text-muted">Доступные категории</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <span key={c.id} className="px-3 py-1 bg-surface-2 border border-border-subtle text-text-muted rounded-full text-sm font-light">
                  {c.name} ({c.type})
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};