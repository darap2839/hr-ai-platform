import React, { useState, useEffect } from 'react';
import { DatabaseOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import '../styles/VacancyPage.css';

const VacancyPage = () => {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Имитация бд
  useEffect(() => {
    setLoading(true);
    // Здесь будет запрос  axios.get('/vacancies')
    setTimeout(() => {
      // Пока база пустая, оставим массив пустым или добавим один тестовый объект
      // setVacancies([{ id: 1, title: 'Инженер СВЧ', dept: 'Отдел №4', status: 'Active' }]);
      setVacancies([]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="vacancy-container animate-fade">
      <div className="vacancy-header">
        <div>
          <h1>Реестр вакансий</h1>
          <p>Управление требованиями и компетенциями предприятия</p>
        </div>
        <button className="add-vacancy-btn">
          <PlusOutlined /> СОЗДАТЬ ВАКАНСИЮ
        </button>
      </div>

      <div className="vacancy-controls-glass">
        <div className="search-box">
          <SearchOutlined />
          <input type="text" placeholder="Поиск по названию или отделу..." />
        </div>
      </div>

      {vacancies.length === 0 && !loading ? (
        <div className="empty-state-glass">
          <DatabaseOutlined className="empty-icon" />
          <h2>База данных пуста</h2>
          <p>В системе пока нет активных вакансий. Создайте первую вакансию вручную или импортируйте из файла.</p>
        </div>
      ) : (
        <div className="vacancy-grid">
          {vacancies.map(v => (
            <div key={v.id} className="vacancy-card-glass">
              <div className="v-badge">{v.status}</div>
              <h3>{v.title}</h3>
              <span>{v.dept}</span>
              <button className="v-detail-btn">ДЕТАЛИ</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VacancyPage;