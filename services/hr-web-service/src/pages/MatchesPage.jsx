import React from 'react';
import {
  CheckCircleOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import '../styles/MatchesPage.css';

const MatchesPage = () => {
  const matches = [
    {
      id: 1,
      name: "Алексей Соколов",
      position: "Инженер-конструктор (СВЧ)",
      score: 94,
      potential: "Ведущий разработчик антенных систем",
      tags: ["Altium Designer", "ГОСТ", "СВЧ-цепи"]
    },
    {
      id: 2,
      name: "Мария Иванова",
      position: "Программист ПЛИС",
      score: 88,
      potential: "Архитектор встраиваемых систем",
      tags: ["Verilog", "Xilinx", "Python"]
    },
    {
      id: 3,
      name: "Игорь Петров",
      position: "Инженер-схемотехник",
      score: 72,
      potential: "Технический аудитор документации",
      tags: ["P-CAD", "ЭКБ", "Аналоговые цепи"]
    }
  ];

  return (
    <div className="matches-layout animate-fade">
      <div className="matches-header">
        <h1>Результаты ИИ-сопоставления</h1>
        <p>Анализ соответствия кандидатов активным вакансиям предприятия</p>
      </div>

      <div className="matches-list">
        {matches.map(candidate => (
          <div key={candidate.id} className="match-glass-row">
            <div className="score-circle-area">
              <div className="progress-ring" style={{'--p': candidate.score}}>
                <span>{candidate.score}%</span>
              </div>
            </div>

            <div className="candidate-info">
              <h3>{candidate.name}</h3>
              <span className="target-pos">Вакансия: {candidate.position}</span>
              <div className="skill-tags">
                {candidate.tags.map(tag => (
                  <span key={tag} className="tag-glass">{tag}</span>
                ))}
              </div>
            </div>

            <div className="ai-insight-block">
              <div className="insight-label">
                <ThunderboltOutlined /> ИИ-Потенциал
              </div>
              <p>{candidate.potential}</p>
              <span className="status-verify"><SafetyCertificateOutlined /> Подтверждено ИИ</span>
            </div>

            <div className="action-area">
              <button className="btn-view-profile">
                ОТКРЫТЬ ОТЧЕТ <ArrowRightOutlined />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatchesPage;