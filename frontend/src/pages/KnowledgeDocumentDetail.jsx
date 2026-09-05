import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Download, FileText, Folder, Pencil, Save, Tag, X } from 'lucide-react';
import { documentsApi } from '../api/client';

const typeLabels = {
  policy: 'Политика',
  procedure: 'Процедура',
  role_profile: 'Профиль должности',
  template: 'Шаблон',
  guide: 'Руководство'
};

const statusLabels = {
  draft: 'Черновик',
  published: 'Опубликован',
  archived: 'В архиве'
};

export default function KnowledgeDocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [documentItem, setDocumentItem] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const data = await documentsApi.getDocument(id);
        setDocumentItem(data);
      } catch (loadError) {
        setError(loadError.message || 'Не удалось загрузить документ');
      } finally {
        setLoading(false);
      }
    };
    loadDocument();
  }, [id]);

  const startEditing = () => {
    setFormData({
      title: documentItem.title || '',
      description: documentItem.description || '',
      doc_type: documentItem.doc_type || 'guide',
      department: documentItem.department || '',
      role: documentItem.role || '',
      content_text: documentItem.content_text || ''
    });
    setEditing(true);
  };

  const saveDocument = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await documentsApi.updateDocument(documentItem.id, formData);
      setDocumentItem(updated);
      setEditing(false);
    } catch (saveError) {
      setError(saveError.message || 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const downloadDocument = async () => {
    try {
      const blob = await documentsApi.getDocumentFile(documentItem.id, true);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = documentItem.file_name || `document-${documentItem.id}`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError.message || 'Не удалось скачать файл');
    }
  };

  if (loading) return <div className="page-container"><div className="loading-state">Загрузка...</div></div>;

  if (!documentItem) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <FileText size={48} />
          <p>{error || 'Документ не найден'}</p>
          <button className="primary-button" onClick={() => navigate('/knowledge-base')}>Вернуться к списку</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container knowledge-document-page">
      <div className="page-header knowledge-document-header">
        <div className="knowledge-document-heading">
          <button className="icon-button" aria-label="Вернуться к базе знаний" onClick={() => navigate('/knowledge-base')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{documentItem.title}</h1>
            <p>Документ базы знаний</p>
          </div>
        </div>
        <div className="knowledge-document-actions">
          {editing ? (
            <button className="secondary-button" type="button" onClick={() => setEditing(false)}>
              <X size={18} /> Отмена
            </button>
          ) : (
            <button className="secondary-button" type="button" onClick={startEditing}>
              <Pencil size={18} /> Редактировать
            </button>
          )}
          <button className="primary-button" type="button" onClick={downloadDocument} disabled={!documentItem.file_name}>
            <Download size={18} /> Скачать
          </button>
        </div>
      </div>

      <div className="knowledge-document-status">
        <span className={`badge badge-${documentItem.status === 'published' ? 'green' : documentItem.status === 'archived' ? 'gray' : 'yellow'}`}>
          {statusLabels[documentItem.status] || documentItem.status}
        </span>
      </div>

      {error && <div className="login-error" role="alert">{error}</div>}

      {editing ? (
        <form className="card knowledge-document-editor" onSubmit={saveDocument}>
          <label><span>Название *</span><input required value={formData.title} onChange={event => setFormData({ ...formData, title: event.target.value })} /></label>
          <label><span>Описание</span><textarea rows={3} value={formData.description} onChange={event => setFormData({ ...formData, description: event.target.value })} /></label>
          <div className="knowledge-document-editor-row">
            <label><span>Тип</span><select value={formData.doc_type} onChange={event => setFormData({ ...formData, doc_type: event.target.value })}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label><span>Отдел</span><input value={formData.department} onChange={event => setFormData({ ...formData, department: event.target.value })} /></label>
          </div>
          <label><span>Содержание</span><textarea rows={16} value={formData.content_text} onChange={event => setFormData({ ...formData, content_text: event.target.value })} /></label>
          <div className="knowledge-document-editor-footer">
            <button className="primary-button" type="submit" disabled={saving}><Save size={18} /> {saving ? 'Сохранение...' : 'Сохранить'}</button>
          </div>
        </form>
      ) : (
        <div className="knowledge-document-layout">
          <main className="knowledge-document-main">
            {documentItem.description && <section className="card"><h2>Краткое описание</h2><p>{documentItem.description}</p></section>}
            <section className="card">
              <h2><FileText size={20} /> Содержание документа</h2>
              <div className="knowledge-document-content">{documentItem.content_text || 'В документе нет извлечённого текста.'}</div>
            </section>
          </main>
          <aside className="knowledge-document-sidebar">
            <section className="card">
              <h3>Информация</h3>
              <dl className="knowledge-document-info">
                <div><Tag size={19} /><dt>Тип</dt><dd>{typeLabels[documentItem.doc_type] || documentItem.doc_type}</dd></div>
                {documentItem.department && <div><Folder size={19} /><dt>Отдел</dt><dd>{documentItem.department}</dd></div>}
                <div><Calendar size={19} /><dt>Добавлен</dt><dd>{new Date(documentItem.created_at).toLocaleDateString()}</dd></div>
              </dl>
            </section>
            <section className="card">
              <h3>Исходный файл</h3>
              <div className="knowledge-document-file"><FileText size={20} /><span>{documentItem.file_name}</span></div>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
