import React from 'react';
import '../styles/LandingPage.css';

const LandingPage = ({ onStart }) => {
  return (
    <div className="landing-full-screen">

      <div className="landing-bg-particles"></div>

      <div className="landing-content-hero">
        <div className="ai-badge-glow">AI TECHNOLOGY 2026</div>
        <h1>Интеллектуальный найм для <br/><span>радиоэлектронной отрасли</span></h1>
        <p>
          Система предиктивного анализа и автоматизированного подбора <br/>
          инженерных кадров с использованием нейронных сетей нового поколения.
        </p>
        <button className="btn-enter-platform" onClick={onStart}>
          ВОЙТИ В ПЛАТФОРМУ
        </button>
      </div>
    </div>
  );
};

export default LandingPage;