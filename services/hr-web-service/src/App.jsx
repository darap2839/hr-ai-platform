import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  AppstoreOutlined, FileSearchOutlined, TeamOutlined,
  DatabaseOutlined, SettingOutlined, LogoutOutlined
} from '@ant-design/icons';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import MatchesPage from './pages/MatchesPage';
import VacancyPage from './pages/VacancyPage';
import SettingsPage from './pages/SettingsPage';
import './styles/App.css';

function App() {
  const [isAuth, setIsAuth] = useState(true);//позже заменить false
  const location = useLocation();
  const navigate = useNavigate();

  // Логика для неавторизованных пользователей
  if (!isAuth) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage onStart={() => navigate('/login')} />} />
        <Route path="/login" element={<LoginPage onLogin={() => {setIsAuth(true); navigate('/dashboard');}} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <div className="glow-bg"></div>

      <aside className="sidebar-glass">
        <div className="logo">RADAR-AI</div>

        <nav className="nav-group">

          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
            <div className="nav-icon-wrapper"><AppstoreOutlined /></div>
            <span>Дашборд</span>
          </Link>
          <Link to="/vacancies" className={location.pathname === '/vacancies' ? 'active' : ''}>
            <div className="nav-icon-wrapper"><DatabaseOutlined /></div>
            <span>Вакансии</span>
          </Link>
          <Link to="/upload" className={location.pathname === '/upload' ? 'active' : ''}>
            <div className="nav-icon-wrapper"><FileSearchOutlined /></div>
            <span>AI Анализ</span>
          </Link>
          <Link to="/matches" className={location.pathname === '/matches' ? 'active' : ''}>
            <div className="nav-icon-wrapper"><TeamOutlined /></div>
            <span>Матчинг</span>
          </Link>
        </nav>

        <div className="sidebar-bottom-exit">

          <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
            <div className="nav-icon-wrapper"><SettingOutlined /></div>
            <span>Настройки</span>
          </Link>
          <button className="exit-btn" onClick={() => {setIsAuth(false); navigate('/');}}>
            <div className="nav-icon-wrapper"><LogoutOutlined /></div>
            <span>Выход</span>
          </button>
        </div>
      </aside>

      <main className="main-panel">
        <div className="content-viewport">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/vacancies" element={<VacancyPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default App;