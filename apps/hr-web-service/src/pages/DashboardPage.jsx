import React from 'react';
import {
  UserOutlined,
  FileDoneOutlined,
  ThunderboltOutlined,
  RiseOutlined
} from '@ant-design/icons';


import DashboardHeader from '../components/Layout/DashboardHeader';
import '../styles/DashboardPage.css';

const DashboardPage = () => {
  const stats = [
    { id: 1, title: 'Всего кандидатов', value: '1,284', icon: <UserOutlined />, color: '#0066ff' },
    { id: 2, title: 'Проанализировано ИИ', value: '856', icon: <ThunderboltOutlined />, color: '#52c41a' },
    { id: 3, title: 'Открытых вакансий', value: '42', icon: <FileDoneOutlined />, color: '#faad14' },
    { id: 4, title: 'Эффективность подбора', value: '+14%', icon: <RiseOutlined />, color: '#13c2c2' },
  ];

  return (
    <div className="dashboard-container animate-fade">


      <DashboardHeader
        title="Система"
        subtitle="Добро пожаловать в центр управления ИИ-рекрутингом RADAR"
      />

      <div className="stats-grid">
        {stats.map(item => (
          <div key={item.id} className="stat-card-glass">
            <div className="stat-icon" style={{ color: item.color }}>
              {item.icon}
            </div>
            <div className="stat-info">
              <span className="stat-label">{item.title}</span>
              <span className="stat-value">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity и т.д. */}
      <div className="dashboard-content-main">
          {/* код активности и статусов */}
      </div>
    </div>
  );
};

export default DashboardPage;