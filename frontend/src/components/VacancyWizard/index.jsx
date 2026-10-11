import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Upload, ArrowLeft, ArrowRight, Check, MessageSquare } from 'lucide-react';

const emptyVacancy = { title: '', department: '', description: '', required_skills: '', salary_from: '', salary_to: '' };

export default function VacancyWizard({ onClose, onSave, initialVacancy = null, isEditing = false }) {
  const [step, setStep] = useState(initialVacancy ? 2 : 1);
  const [vacancy, setVacancy] = useState(() => {
    if (!initialVacancy) return emptyVacancy;
    return {
      ...emptyVacancy,
      ...initialVacancy,
      required_skills: Array.isArray(initialVacancy.required_skills)
        ? initialVacancy.required_skills.join(', ')
        : String(initialVacancy.required_skills || ''),
      salary_from: initialVacancy.salary_from ?? '',
      salary_to: initialVacancy.salary_to ?? ''
    };
  });
  const [dragActive, setDragActive] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: 'Привет! Я помогу создать вакансию. Напишите описание или загрузите файл.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const requestAI = async (messages, maxTokens = 256) => {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ messages, max_tokens: maxTokens })
    });

    if (!response.ok) {
      let detail = '';
      try {
        const errorBody = await response.json();
        detail = errorBody.detail || '';
      } catch {
        // Keep the user-facing error generic if the response is not JSON.
      }
      throw new Error(detail || `AI API вернул HTTP ${response.status}`);
    }

    const result = await response.json();
    const answer = result.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error('AI Engine вернул пустой ответ');
    return answer;
  };

  const extractVacancy = async (text) => {
    const answer = await requestAI([
      {
        role: 'system',
        content: 'Ты помощник HR-платформы. Извлеки из сообщения данные вакансии и верни только один корректный JSON-объект без Markdown и пояснений. Поля: title, department, description, required_skills, salary_from, salary_to. Все значения должны быть строками. Если значение не указано, оставь пустую строку. Не придумывай зарплату, навыки или условия, которых нет в исходном тексте. Если должность указана, но отдел не указан, предложи логичный отдел на русском языке.'
      },
      { role: 'user', content: text }
    ], 400);

    const jsonText = answer.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonText) throw new Error('Не удалось получить структурированные данные вакансии от AI');
    const parsed = JSON.parse(jsonText);
    const result = {
      title: String(parsed.title || ''),
      department: String(parsed.department || ''),
      description: String(parsed.description || ''),
      required_skills: String(parsed.required_skills || ''),
      salary_from: String(parsed.salary_from || ''),
      salary_to: String(parsed.salary_to || '')
    };
    if (!result.title || !result.department) {
      throw new Error('AI не смог определить название вакансии и отдел. Уточните описание и попробуйте ещё раз.');
    }
    setVacancy(result);
    setChatMessages(prev => [...prev, {
      type: 'bot',
      text: 'Черновик вакансии подготовлен на основе вашего описания. Проверьте и при необходимости исправьте поля на следующем шаге.'
    }]);
    setStep(2);
  };

  const parseVacancyFromText = async (text, { createVacancy = false } = {}) => {
    setAiProcessing(true);
    try {
      const answer = await requestAI([
        {
          role: 'system',
          content: 'Ты русскоязычный помощник HR-платформы для предприятия радиоэлектронной отрасли. Отвечай грамотно, кратко и только на русском языке. Отвечай на вопрос пользователя по существу. Не утверждай, что анализировал файл или подготовил вакансию, если этого не делал.'
        },
        { role: 'user', content: text }
      ]);
      setChatMessages(prev => [...prev, { type: 'bot', text: answer }]);

      const explicitVacancyRequest = /(?:создай|составь|подготовь|оформи)\s+(?:мне\s+)?ваканс|ваканси\w*\s+(?:для|на|по)/i.test(text);
      if (createVacancy || explicitVacancyRequest) {
        await extractVacancy(text);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        type: 'bot',
        text: `Не удалось получить ответ от AI. ${err.message || 'Проверьте, что AI Engine запущен, и попробуйте ещё раз.'}`
      }]);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    const userMsg = chatInput.trim();
    if (!userMsg || aiProcessing) return;

    setChatMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    setChatInput('');
    await parseVacancyFromText(userMsg);
  };

  const handleFileProcess = async (text) => {
    setChatMessages(prev => [...prev, { type: 'bot', text: '📁 Файл получен, обрабатываю...' }]);
    await parseVacancyFromText(text, { createVacancy: true });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      try {
        const text = await e.dataTransfer.files[0].text();
        handleFileProcess(text);
      } catch {
        setChatMessages(prev => [...prev, { type: 'bot', text: 'Не удалось прочитать файл.' }]);
      }
    }
  };

  const nextStep = () => {
    if (step === 1 && vacancy.title && vacancy.department) {
      setStep(2);
    } else if (step === 1) {
      alert('Пожалуйста, заполните хотя бы название и отдел');
    }
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSave = async () => {
    if (!vacancy.title || !vacancy.department) {
      alert('Пожалуйста, заполните название и отдел');
      return;
    }

    setSaving(true);
    try {
      await onSave(vacancy);
      setStep(3);
    } catch (err) {
      alert('Ошибка при сохранении: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(1100px, calc(100vw - 32px))',
          maxWidth: 'none',
          maxHeight: 'calc(100vh - 32px)',
          minWidth: 'min(720px, calc(100vw - 32px))',
          minHeight: 'min(600px, calc(100vh - 32px))',
          overflow: 'auto',
          resize: 'both'
        }}
      >
        <div className="modal-header">
          <h2>{isEditing ? 'Редактирование вакансии' : 'Создание вакансии'}</h2>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Progress Steps */}
        <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {['Ввод данных', 'Проверка', 'Готово'].map((label, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: step > idx + 1 ? '#166534' : step === idx + 1 ? '#0b73ff' : '#e2e8f0',
                  color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 'bold'
                }}>
                  {step > idx + 1 ? <Check size={16} /> : idx + 1}
                </div>
                <span style={{ fontSize: '14px', color: step === idx + 1 ? '#0b73ff' : '#64748b' }}>{label}</span>
                {idx < 2 && <div style={{ width: '40px', height: '2px', background: step > idx + 1 ? '#166534' : '#e2e8f0' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Input */}
        {step === 1 && (
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Chat Interface */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', height: '52vh', minHeight: '360px', maxHeight: '65vh', fontSize: '16px' }}>
                <div style={{ padding: '12px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontWeight: '500' }}>
                  <MessageSquare size={16} style={{ display: 'inline', marginRight: '8px' }} />Чат-помощник
                </div>
                <div style={{ flex: 1, padding: '16px', overflowY: 'auto', minHeight: 0, fontSize: '16px', lineHeight: 1.6 }}>
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{
                      marginBottom: '12px', padding: '12px 15px', borderRadius: '12px', fontSize: '16px', lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
                      background: msg.type === 'bot' ? '#f1f5f9' : '#dbeafe',
                      alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '90%'
                    }}>
                      {msg.text}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                    placeholder="Задайте вопрос или опишите вакансию..."
                    style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '16px', minWidth: 0 }}
                  />
                  <button onClick={handleSendMessage} className="primary-button" disabled={aiProcessing}>
                    {aiProcessing ? '...' : '→'}
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? '#0b73ff' : '#cbd5e1'}`,
                  borderRadius: '12px', padding: '32px', textAlign: 'center',
                  background: dragActive ? '#eff6ff' : '#f8fafc', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <input ref={fileInputRef} type="file" accept=".txt,.doc,.docx" onChange={async e => {
                  if (e.target.files?.[0]) {
                    const text = await e.target.files[0].text();
                    handleFileProcess(text);
                  }
                }} style={{ display: 'none' }} />
                <Upload size={40} color="#0b73ff" style={{ marginBottom: '12px' }} />
                <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>Перетащите файл сюда</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>или кликните для выбора</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Edit */}
        {step === 2 && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px' }}>Проверьте данные вакансии</h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Название *</label>
                <input
                  value={vacancy.title} onChange={e => setVacancy({ ...vacancy, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Отдел *</label>
                  <input
                    value={vacancy.department} onChange={e => setVacancy({ ...vacancy, department: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Зарплата от - до (руб.)</label>
                  <input
                    value={`${vacancy.salary_from || ''} - ${vacancy.salary_to || ''}`}
                    onChange={e => {
                      const [from, to] = e.target.value.split(' - ');
                      setVacancy({ ...vacancy, salary_from: from, salary_to: to });
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Описание</label>
                <textarea
                  value={vacancy.description} onChange={e => setVacancy({ ...vacancy, description: e.target.value })}
                  rows={4} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Навыки (через запятую)</label>
                <input
                  value={vacancy.required_skills} onChange={e => setVacancy({ ...vacancy, required_skills: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: '#d1fae5', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
              <Check size={40} color="#166534" />
            </div>
            <h2 style={{ marginBottom: '12px' }}>{isEditing ? 'Изменения сохранены!' : 'Вакансия создана!'}</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>Данные успешно сохранены в системе</p>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          {step > 1 && step < 3 ? (
            <button onClick={prevStep} className="secondary-button"><ArrowLeft size={18} /> Назад</button>
          ) : <div />}
          
          {step === 1 && (
            <button onClick={nextStep} className="primary-button" disabled={!vacancy.title || !vacancy.department}>
              Далее <ArrowRight size={18} />
            </button>
          )}
          
          {step === 2 && (
            <button onClick={handleSave} className="primary-button" disabled={saving} style={{ background: saving ? '#94a3b8' : '#166534' }}>
              {saving ? 'Сохранение...' : <><Check size={18} /> {isEditing ? 'Сохранить изменения' : 'Сохранить вакансию'}</>}
            </button>
          )}
          
          {step === 3 && (
            <button onClick={onClose} className="primary-button" style={{ background: '#166534' }}>
              <Check size={18} /> Готово
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
