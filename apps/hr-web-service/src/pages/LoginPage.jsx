import React, { useState } from 'react';
import { authService } from '../services/api';
import { LockOutlined, UserOutlined, LoadingOutlined } from '@ant-design/icons';
import '../styles/LoginPage.css';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Обращаемся к auth_router FastAPI
      await authService.login({ email, password });
      onLogin();
    } catch (err) {
      setError('Ошибка доступа: проверьте учетные данные');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper animate-fade">
      <div className="aurora-bg"></div>

      <div className="login-card">
        <div className="login-brand">
          <div className="brand-icon">R</div>
          <h1>RADAR-AI</h1>
          <p>Система интеллектуального рекрутинга</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form-fields">
          <div className="glass-input-box">
            <UserOutlined className="field-icon" />
            <input
              type="email"
              placeholder="Email или Логин"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>

          <div className="glass-input-box">
            <LockOutlined className="field-icon" />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-btn-neon" disabled={loading}>
            {loading ? <LoadingOutlined /> : 'ВОЙТИ В СИСТЕМУ'}
          </button>
        </form>

        <div className="login-extra-links">
          <span>Сброс пароля</span>
          <span className="dot">·</span>
          <span>Техподдержка</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;