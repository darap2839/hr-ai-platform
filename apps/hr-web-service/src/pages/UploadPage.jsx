import React, { useState } from 'react';
import {
  InboxOutlined,
  LoadingOutlined,
  ScanOutlined,
  SafetyOutlined,
  FileTextOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import '../styles/UploadPage.css';
import { resumeService } from '../services/api';

const startAnalysis = async (e) => {
  const file = e.target.files[0];
  if (file) {
    setFileName(file.name);
    setStage('scanning');

    try {
      // Отправляем файл в hr-api-service
      const result = await resumeService.uploadResume(file);
      console.log('Результат анализа ИИ:', result);

      // Сохраняем результат, чтобы MatchesPage мог его показать
      localStorage.setItem('lastAnalysis', JSON.stringify(result));

      setStage('result');
    } catch (error) {
      alert('Ошибка при анализе файла');
      setStage('upload');
    }
  }
};

const UploadPage = () => {
  const [stage, setStage] = useState('upload'); // upload, scanning, result
  const [fileName, setFileName] = useState('');

  const startAnalysis = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);
      setStage('scanning');
      // Имитация глубокого анализа ИИ
      setTimeout(() => setStage('result'), 3500);
    }
  };

  return (
    <div className="upload-container animate-fade">
      <div className="upload-header">
        <h1>Интеллектуальный анализатор</h1>
        <p>ИИ-движок для извлечения компетенций из технической документации и резюме</p>
      </div>

      <div className="glass-analysis-card">
        {stage === 'upload' && (
          <div className="upload-dropzone" onClick={() => document.getElementById('file-id').click()}>
            <div className="scanner-line"></div>
            <InboxOutlined className="upload-icon" />
            <h3>Загрузите документ для анализа</h3>
            <p>PDF, DOCX или TXT (Макс. 15MB)</p>
            <input type="file" id="file-id" hidden onChange={startAnalysis} />
            <button className="btn-select">ВЫБРАТЬ ФАЙЛ</button>
          </div>
        )}

        {stage === 'scanning' && (
          <div className="scanning-stage">
            <div className="ai-loader">
              <LoadingOutlined />
            </div>
            <h2>СКАНИРОВАНИЕ: {fileName}</h2>
            <div className="scanning-steps">
              <div className="step active">Поиск ключевых слов (ГОСТ, ЭКБ)...</div>
              <div className="step">Анализ инженерного стека...</div>
              <div className="step">Оценка потенциала роста...</div>
            </div>
          </div>
        )}

        {stage === 'result' && (
          <div className="analysis-result-preview">
            <div className="result-top">
              <div className="file-info-mini">
                <FileTextOutlined /> <span>{fileName}</span>
              </div>
              <div className="match-pill">Анализ завершен</div>
            </div>

            <div className="ai-summary">
              <div className="insight-icon"><ThunderboltOutlined /></div>
              <div className="insight-text">
                <h3>Экспертное заключение ИИ:</h3>
                <p>Выявлен высокий уровень владения САПР Altium Designer и опыт работы с ПЛИС Xilinx.
                   Кандидат обладает редкой компетенцией в области СВЧ-проектирования (до 24 ГГц).</p>
              </div>
            </div>

            <div className="next-steps-grid">
              <div className="step-card">
                <ScanOutlined />
                <span>Метрики: 9.4/10</span>
              </div>
              <div className="step-card">
                <SafetyOutlined />
                <span>Допуск: Гр. III</span>
              </div>
            </div>

            <button className="btn-go-to-matches" onClick={() => window.location.href='/matches'}>
              ПЕРЕЙТИ К МАТЧИНГУ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;