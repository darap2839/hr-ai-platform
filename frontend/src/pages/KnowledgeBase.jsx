// frontend/src/pages/KnowledgeBase.jsx
import { useState, useEffect, useRef } from 'react';
import { documentsApi } from '../api/client';
import { FileText, Search, Plus, Upload, X, Check, ArrowLeft, MoreVertical, ExternalLink, Download, Pencil, Trash2 } from 'lucide-react';

function KnowledgeBase() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    doc_type: '',
    department: '',
    search: ''
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editingDocument, setEditingDocument] = useState(null);

  // Загрузка документов
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.doc_type) params.append('doc_type', filters.doc_type);
      if (filters.department) params.append('department', filters.department);
      if (filters.search) params.append('search', filters.search);
      
      const response = await documentsApi.getDocuments(params);
      setDocuments(response);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [filters]);

  const handleUpload = async (formData) => {
    const document = await documentsApi.uploadDocument(formData);
    await fetchDocuments();
    return document;
  };

  const handleOpenDocument = async (doc) => {
    setActiveMenuId(null);
    try {
      const blob = await documentsApi.getDocumentFile(doc.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      alert('Не удалось открыть файл: ' + error.message);
    }
  };

  const handleDownloadDocument = async (doc) => {
    setActiveMenuId(null);
    try {
      const blob = await documentsApi.getDocumentFile(doc.id, true);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.file_name || `document-${doc.id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Не удалось скачать файл: ' + error.message);
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (!window.confirm(`Удалить документ «${doc.title}»?`)) return;

    try {
      await documentsApi.deleteDocument(doc.id);
      setActiveMenuId(null);
      await fetchDocuments();
    } catch (error) {
      alert('Не удалось удалить документ: ' + error.message);
    }
  };

  const handleUpdateDocument = async (id, payload) => {
    await documentsApi.updateDocument(id, payload);
    setEditingDocument(null);
    await fetchDocuments();
  };

  return (
    <div className="page-container" onClick={() => setActiveMenuId(null)}>
      {/* Заголовок */}
      <div className="page-header">
        <div>
          <h1><FileText size={24} /> База знаний</h1>
          <p>Локальные документы, профили должностей и инструкции</p>
        </div>
        <button className="primary-button" onClick={() => setShowUploadModal(true)}>
          <Plus size={18} /> Добавить документ
        </button>
      </div>

      {/* Фильтры */}
      <div className="search-bar">
        <div className="filters-grid">
          <div className="search-input-wrapper">
            <Search size={18} />
            <input
              type="text"
              placeholder="Поиск по документам..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
          
          <select
            value={filters.doc_type}
            onChange={(e) => setFilters({...filters, doc_type: e.target.value})}
          >
            <option value="">Все типы</option>
            <option value="policy">Политика</option>
            <option value="procedure">Процедура</option>
            <option value="role_profile">Профиль должности</option>
            <option value="template">Шаблон</option>
            <option value="guide">Руководство</option>
          </select>
          
          <select
            value={filters.department}
            onChange={(e) => setFilters({...filters, department: e.target.value})}
          >
            <option value="">Все отделы</option>
            <option value="HR">HR</option>
            <option value="IT">IT</option>
            <option value="Finance">Финансы</option>
            <option value="Legal">Юридический</option>
          </select>
        </div>
      </div>

      {/* Список документов */}
      {loading ? (
        <div className="loading-state">Загрузка...</div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} />
          <p>Документов нет. Загрузите первый документ или создайте профиль должности.</p>
        </div>
      ) : (
        <div className="data-list">
          {documents.map((doc) => (
            <div key={doc.id} className="data-card">
              <div className="data-card-header" style={{ position: 'relative', paddingRight: '48px' }}>
                <div className="data-card-title">
                  <button
                    type="button"
                    onClick={() => handleOpenDocument(doc)}
                    style={{ border: 0, background: 'transparent', padding: 0, color: 'inherit', textAlign: 'left' }}
                  >
                    <h3 style={{ margin: 0 }}>{doc.title}</h3>
                  </button>
                  <div className="data-card-badges">
                    <span className={`badge badge-${
                      doc.doc_type === 'role_profile' ? 'purple' :
                      doc.doc_type === 'policy' ? 'blue' :
                      'gray'
                    }`}>
                      {doc.doc_type}
                    </span>
                    {doc.department && (
                      <span className="badge badge-gray">{doc.department}</span>
                    )}
                    {doc.role && (
                      <span className="badge badge-indigo">{doc.role}</span>
                    )}
                  </div>
                </div>

                <div style={{ position: 'absolute', top: '-4px', right: 0 }}>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Действия с документом ${doc.title}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveMenuId(activeMenuId === doc.id ? null : doc.id);
                    }}
                  >
                    <MoreVertical size={20} />
                  </button>

                  {activeMenuId === doc.id && (
                    <div
                      onClick={event => event.stopPropagation()}
                      style={{
                        position: 'absolute', top: '44px', right: 0, zIndex: 20,
                        width: '220px', padding: '8px', border: '1px solid #e2e8f0',
                        borderRadius: '12px', background: '#fff',
                        boxShadow: '0 18px 45px rgba(15, 23, 42, 0.16)'
                      }}
                    >
                      <button className="document-menu-item" onClick={() => handleOpenDocument(doc)}>
                        <ExternalLink size={17} /> Открыть
                      </button>
                      <button className="document-menu-item" onClick={() => handleDownloadDocument(doc)}>
                        <Download size={17} /> Скачать
                      </button>
                      <button
                        className="document-menu-item"
                        onClick={() => {
                          setEditingDocument(doc);
                          setActiveMenuId(null);
                        }}
                      >
                        <Pencil size={17} /> Внести изменения
                      </button>
                      <button className="document-menu-item document-menu-item-danger" onClick={() => handleDeleteDocument(doc)}>
                        <Trash2 size={17} /> Удалить
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {doc.description && (
                <p className="data-card-description">{doc.description}</p>
              )}
              
              <div className="data-card-footer">
                <span className="text-muted">📅 {new Date(doc.created_at).toLocaleDateString()}</span>
                <button
                  type="button"
                  className="document-file-link"
                  onClick={() => handleOpenDocument(doc)}
                  disabled={!doc.file_name}
                >
                  📄 {doc.file_name || 'Без файла'}
                </button>
                <span className={`badge badge-${doc.status === 'published' ? 'green' : 'yellow'}`}>
                  {doc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно загрузки */}
      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} onSubmit={handleUpload} />
      )}

      {editingDocument && (
        <EditDocumentModal
          document={editingDocument}
          onClose={() => setEditingDocument(null)}
          onSubmit={handleUpdateDocument}
        />
      )}
    </div>
  );
}

function EditDocumentModal({ document: documentItem, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: documentItem.title || '',
    description: documentItem.description || '',
    doc_type: documentItem.doc_type || 'guide',
    department: documentItem.department || '',
    role: documentItem.role || '',
    content_text: documentItem.content_text || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (event) => {
    event.preventDefault();
    if (!formData.title.trim()) {
      alert('Название документа обязательно');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(documentItem.id, formData);
    } catch (error) {
      alert('Не удалось сохранить изменения: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    background: '#fff'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={event => event.stopPropagation()}
        style={{ width: 'calc(100vw - 48px)', maxWidth: '720px', overflowX: 'hidden' }}
      >
        <div className="modal-header">
          <h2><Pencil size={22} /> Изменить документ</h2>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'grid', gap: '18px', padding: '24px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Название *</label>
            <input
              required
              value={formData.title}
              onChange={event => setFormData({ ...formData, title: event.target.value })}
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Тип документа</label>
            <select
              value={formData.doc_type}
              onChange={event => setFormData({ ...formData, doc_type: event.target.value })}
              style={fieldStyle}
            >
              <option value="guide">Руководство</option>
              <option value="policy">Политика</option>
              <option value="procedure">Процедура</option>
              <option value="role_profile">Профиль должности</option>
              <option value="template">Шаблон</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Описание</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={event => setFormData({ ...formData, description: event.target.value })}
              style={{ ...fieldStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Извлечённый текст</label>
            <textarea
              rows={10}
              value={formData.content_text}
              onChange={event => setFormData({ ...formData, content_text: event.target.value })}
              style={{ ...fieldStyle, minHeight: '220px', lineHeight: 1.5, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Отдел</label>
              <input
                value={formData.department}
                onChange={event => setFormData({ ...formData, department: event.target.value })}
                style={fieldStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Должность</label>
              <input
                value={formData.role}
                onChange={event => setFormData({ ...formData, role: event.target.value })}
                style={fieldStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', paddingTop: '8px' }}>
            <button type="button" className="secondary-button" onClick={onClose}>Отмена</button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Компонент модалки с wizard
function UploadModal({ onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    doc_type: 'guide',
    department: '',
    role: '',
    content_text: '',
    file: null
  });
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const fileInputRef = useRef(null);

  const handleContinue = async () => {
    if (!formData.file) {
      setExtractionError('Сначала выберите файл');
      return;
    }

    setExtracting(true);
    setExtractionError('');
    try {
      const preview = await documentsApi.previewDocument(formData.file);
      setFormData(prev => ({
        ...prev,
        title: prev.title || preview.title || '',
        content_text: preview.content_text || ''
      }));
      setStep(2);
    } catch (error) {
      setExtractionError(error.message || 'Не удалось извлечь данные из файла');
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.file) {
      alert('Пожалуйста, заполните название и выберите файл');
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          data.append(key, formData[key]);
        }
      });
      await onSubmit(data);
      setStep(3);
    } catch (error) {
      alert('Ошибка загрузки: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setUploading(false);
    }
  };

  const getDocTypeLabel = (type) => {
    const labels = {
      policy: 'Политика',
      procedure: 'Процедура',
      role_profile: 'Профиль должности',
      template: 'Шаблон',
      guide: 'Руководство'
    };
    return labels[type] || type;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: 'calc(100vw - 48px)', maxWidth: '760px', overflowX: 'hidden' }}>
        <div className="modal-header">
          <h2><FileText size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />Загрузить документ</h2>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Progress Steps */}
        <div style={{ padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
            {['Файл', 'Редактирование', 'Готово'].map((label, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flex: idx < 2 ? '1 1 0' : '0 0 auto',
                  minWidth: 0,
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: step > idx + 1 ? '#166534' : step === idx + 1 ? '#0b73ff' : '#e2e8f0',
                  color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 'bold'
                }}>
                  {step > idx + 1 ? <Check size={16} /> : idx + 1}
                </div>
                <span style={{ fontSize: '14px', color: step === idx + 1 ? '#0b73ff' : '#64748b' }}>{label}</span>
                {idx < 2 && (
                  <div
                    style={{
                      flex: '1 1 auto',
                      minWidth: '40px',
                      height: '2px',
                      margin: '0 16px',
                      borderRadius: '999px',
                      background: step > idx + 1 ? '#166534' : '#e2e8f0'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: File Upload */}
        {step === 1 && (
          <div style={{ padding: '40px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '8px' }}>Загрузите документ</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Поддерживаемые форматы: PDF, DOCX, TXT</p>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #cbd5e1',
                borderRadius: '12px', padding: '48px 24px', textAlign: 'center',
                background: '#f8fafc', cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <input 
                ref={fileInputRef} 
                type="file" 
                accept=".pdf,.docx,.txt" 
                onChange={e => {
                  if (e.target.files?.[0]) {
                    setFormData(prev => ({
                      ...prev,
                      file: e.target.files[0],
                      title: '',
                      content_text: ''
                    }));
                    setExtractionError('');
                  }
                }} 
                style={{ display: 'none' }} 
              />
              
              {formData.file ? (
                <div style={{ padding: '20px' }}>
                  <div style={{ 
                    width: '64px', height: '64px', 
                    background: '#d1fae5', borderRadius: '12px', 
                    display: 'grid', placeItems: 'center', 
                    margin: '0 auto 16px' 
                  }}>
                    <FileText size={32} color="#166534" />
                  </div>
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600', fontSize: '16px' }}>{formData.file.name}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    {(formData.file.size / 1024).toFixed(1)} KB
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', width: '100%', marginTop: '24px' }}>
                    <button
                      type="button"
                      className="secondary-button"
                      style={{ minWidth: '130px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }}
                    >
                      Заменить
                    </button>
                    <button
                      type="button"
                      className="primary-button"
                      style={{ minWidth: '170px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleContinue();
                      }}
                      disabled={extracting}
                    >
                      {extracting ? 'Обрабатываем файл...' : 'Продолжить'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload size={48} color="#0b73ff" style={{ marginBottom: '16px' }} />
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600', fontSize: '16px' }}>
                    Кликните для выбора файла
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
                    или перетащите сюда
                  </p>
                </div>
              )}
            </div>

            {extractionError && (
              <div className="login-error" style={{ marginTop: '16px' }}>
                {extractionError}
              </div>
            )}

          </div>
        )}

        {/* Step 2: Document Details */}
        {step === 2 && (
          <div style={{ width: '100%', padding: '24px', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 20px' }}>Данные документа</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', width: '100%', minWidth: 0, gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Название *</label>
                <input
                  type="text"
                  placeholder="Например: Инструкция по онбордингу"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Тип документа *</label>
                <select
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                  value={formData.doc_type}
                  onChange={e => setFormData({...formData, doc_type: e.target.value})}
                >
                  <option value="guide">Руководство</option>
                  <option value="policy">Политика</option>
                  <option value="role_profile">Профиль должности</option>
                  <option value="procedure">Процедура</option>
                  <option value="template">Шаблон</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Описание</label>
                <textarea
                  placeholder="Краткое описание документа..."
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                  Извлечённый текст
                </label>
                <p style={{ margin: '0 0 8px', color: '#64748b', fontSize: '13px' }}>
                  Проверьте и отредактируйте информацию перед сохранением в базу знаний.
                </p>
                <textarea
                  placeholder="Текст документа появится здесь после обработки файла"
                  rows={12}
                  value={formData.content_text}
                  onChange={e => setFormData({...formData, content_text: e.target.value})}
                  style={{ width: '100%', minHeight: '260px', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical', lineHeight: '1.55', fontFamily: 'inherit', background: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', width: '100%', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Отдел</label>
                  <input
                    type="text"
                    placeholder="Например: IT, HR"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                    value={formData.department}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                  />
                </div>

                {formData.doc_type === 'role_profile' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Должность</label>
                    <input
                      type="text"
                      placeholder="Например: Python Developer"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    />
                  </div>
                )}
              </div>

              {/* File Preview */}
              {formData.file && (
                <div style={{ 
                  width: '100%', padding: '12px', background: '#f1f5f9', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', gap: '12px', boxSizing: 'border-box'
                }}>
                  <FileText size={20} color="#0b73ff" />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: '500', fontSize: '14px' }}>{formData.file.name}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                      {(formData.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', gap: '24px', paddingTop: '16px', boxSizing: 'border-box' }}>
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="secondary-button"
                >
                  <ArrowLeft size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Назад
                </button>
                <button 
                  type="submit" 
                  className="primary-button" 
                  disabled={uploading}
                  style={{ background: uploading ? '#94a3b8' : '#166534' }}
                >
                  {uploading ? 'Загрузка...' : <><Check size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Загрузить</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ 
              width: '80px', height: '80px', background: '#d1fae5', 
              borderRadius: '50%', display: 'grid', placeItems: 'center', 
              margin: '0 auto 24px' 
            }}>
              <Check size={40} color="#166534" />
            </div>
            <h2 style={{ marginBottom: '12px' }}>Документ загружен!</h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              {formData.title} успешно добавлен в базу знаний
            </p>
            <button onClick={onClose} className="primary-button" style={{ background: '#166534' }}>
              <Check size={18} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Готово
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default KnowledgeBase;
