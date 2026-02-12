import React from 'react';
import {
  RobotOutlined,
  SafetyOutlined,
  BellOutlined,
  GlobalOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import '../styles/SettingsPage.css';

const SettingsPage = () => {
  return (
    <div className="settings-container animate-fade">
      <div className="settings-header">
        <h1>Настройки платформы</h1>
        <p>Конфигурация параметров ИИ и системных допусков</p>
      </div>

      <div className="settings-grid">
        {/* Модуль ИИ */}
        <div className="settings-card-glass">
          <div className="card-title">
            <RobotOutlined /> <span>Ядро Radar-AI</span>
          </div>
          <div className="setting-control">
            <label>Точность семантического анализа (Match Sensitivity)</label>
            <input type="range" className="ai-slider" defaultValue="85" />
          </div>
          <div className="setting-control">
            <label>Приоритетная модель обучения</label>
            <select className="glass-select">
              <option>Radio-Engineering v4.2 (Default)</option>
              <option>Micro-Circuitry Expert (Deep)</option>
              <option>HR-Standard v1.0</option>
            </select>
          </div>
        </div>

        {/* Модуль Безопасности */}
        <div className="settings-card-glass">
          <div className="card-title">
            <SafetyOutlined /> <span>Протоколы безопасности</span>
          </div>
          <div className="setting-control flex-row">
            <label>Автоматическая проверка форм допуска</label>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>
          <div className="setting-control flex-row">
            <label>Шифрование данных кандидатов</label>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>
        </div>


        <div className="settings-card-glass">
          <div className="card-title">
            <BellOutlined /> <span>Уведомления и алерты</span>
          </div>
          <div className="setting-control flex-row">
            <label>Критические уведомления (Email/Telegram)</label>
            <label className="switch">
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
          </div>
          <div className="setting-control">
            <label>Частота отчетов о матчинге</label>
            <select className="glass-select">
              <option>Мгновенно по завершении</option>
              <option>Ежедневно (сводка)</option>
            </select>
          </div>
        </div>


        <div className="settings-card-glass info-card">
          <div className="card-title">
            <GlobalOutlined /> <span>Статус системы</span>
          </div>
          <div className="setting-control">
            <div className="flex-row">
              <span style={{color: '#a1a1aa', fontSize: '13px'}}>Версия ядра:</span>
              <span style={{color: '#0066ff', fontWeight: 'bold'}}>RADAR-2026.04</span>
            </div>
            <div className="flex-row" style={{marginTop: '10px'}}>
              <span style={{color: '#a1a1aa', fontSize: '13px'}}>Статус сервера:</span>
              <span style={{color: '#52c41a'}}>ONLINE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;