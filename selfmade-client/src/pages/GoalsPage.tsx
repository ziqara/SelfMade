import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { toast } from '../store/toastStore';
import type { Category, UserInterest } from '../types';

export const GoalsPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [interests, setInterests] = useState<UserInterest[]>([]);
  
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
      toast.error('Ошибка при создании категории');
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
      toast.error('Ошибка при добавлении цели');
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm p-8 border border-gray-100">
      <h1 className="text-3xl font-bold mb-8">Цели и Категории</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Левая колонка: Формы */}
        <div className="space-y-8">
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h2 className="text-xl font-bold mb-4">1. Создать категорию</h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <input type="text" placeholder="Название (напр. Программирование)" value={categoryName} onChange={e => setCategoryName(e.target.value)} className="w-full border p-3 rounded-lg" required />
              <input type="text" placeholder="Описание (опционально)" value={categoryDesc} onChange={e => setCategoryDesc(e.target.value)} className="w-full border p-3 rounded-lg" />
              <div className="flex items-center gap-4">
                <label className="font-medium text-gray-700">Тип:</label>
                <select value={categoryType} onChange={e => setCategoryType(e.target.value)} className="border p-3 rounded-lg w-full bg-white">
                  <option value="Обучение">Обучение</option>
                  <option value="Спорт">Спорт</option>
                  <option value="Отдых">Отдых</option>
                  <option value="Работа">Работа</option>
                  <option value="Другое">Другое</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-gray-800 text-white p-3 rounded-lg font-bold hover:bg-gray-900 transition-colors">Создать категорию</button>
            </form>
          </div>

          <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
            <h2 className="text-xl font-bold mb-4">2. Добавить цель развития</h2>
            <form onSubmit={handleInterestSubmit} className="space-y-4">
              {categories.length > 0 ? (
                <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="w-full border p-3 rounded-lg bg-white">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ) : (
                <p className="text-sm text-red-500 mb-2">Сначала создайте категорию выше!</p>
              )}
              <input type="text" placeholder="Например: Сделать аутентификацию" value={interestTitle} onChange={e => setInterestTitle(e.target.value)} className="w-full border p-3 rounded-lg" required />
              <label className="flex items-center gap-3 cursor-pointer p-2">
                <input type="checkbox" checked={isDevGoal} onChange={e => setIsDevGoal(e.target.checked)} className="w-5 h-5 rounded text-orange-600" />
                <span className="text-gray-800 font-medium">Это цель для развития (увидит ИИ)</span>
              </label>
              <button type="submit" className="w-full bg-orange-500 text-white p-3 rounded-lg font-bold hover:bg-orange-600 transition-colors">Сохранить цель</button>
            </form>
          </div>
        </div>

        {/* Правая колонка: Списки */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-4 text-orange-700">Твои глобальные цели</h2>
            {interests.length === 0 ? (
              <p className="text-gray-500">Цели пока не добавлены.</p>
            ) : (
              <ul className="space-y-3">
                {interests.map(interest => (
                  <li key={interest.id} className="p-4 bg-white border rounded-lg shadow-sm flex items-start gap-3">
                    <span className={interest.isDevelopmentGoal ? 'text-orange-500 text-xl' : 'text-gray-400 text-xl'}>
                      {interest.isDevelopmentGoal ? '🎯' : '📌'}
                    </span>
                    <span className="font-medium text-gray-800">{interest.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-700">Доступные категории</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <span key={c.id} className="px-3 py-1 bg-gray-100 border text-gray-700 rounded-full text-sm font-medium">
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