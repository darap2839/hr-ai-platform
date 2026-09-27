import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronRight, Edit3, Network, Plus, Power, Search, Users, X } from 'lucide-react';
import { organizationApi } from '../api/client';

const unitTypeLabels = {
  company: 'Компания',
  directorate: 'Управление',
  department: 'Департамент',
  team: 'Команда'
};

const childUnitTypes = {
  company: 'directorate',
  directorate: 'department',
  department: 'team',
  team: 'team'
};

const emptyForm = { name: '', unit_type: 'department', parent_id: '', is_active: true };

const flattenUnits = (units, depth = 0, parentName = '') => units.flatMap(unit => [
  { ...unit, depth, parentName },
  ...flattenUnits(unit.children || [], depth + 1, unit.name)
]);

function DirectoryCard({ unit, onOpen, onAddChild, onEdit, onDeactivate }) {
  const children = unit.children || [];

  return (
    <article className={`organization-directory-card${unit.is_active ? '' : ' inactive'}`}>
      <button type="button" className="organization-directory-main" onClick={() => onOpen(unit)}>
        <div className="organization-directory-icon"><Building2 size={22} /></div>
        <div className="organization-directory-content">
          <div className="organization-directory-title-row">
            <h2>{unit.name}</h2>
            <ChevronRight size={18} />
          </div>
          <span className="organization-directory-type">{unitTypeLabels[unit.unit_type] || unit.unit_type}</span>
          {unit.description && <p>{unit.description}</p>}
          <div className="organization-directory-meta">
            <span><Users size={14} /> Открыть сотрудников</span>
            {children.length > 0 && <span><Network size={14} /> {children.length} {children.length === 1 ? 'подразделение' : 'подразделений'}</span>}
            {!unit.is_active && <span>Отключено</span>}
          </div>
        </div>
      </button>
      <div className="organization-directory-actions">
        <button type="button" className="icon-button" aria-label={`Добавить подразделение в ${unit.name}`} onClick={() => onAddChild(unit)}><Plus size={17} /></button>
        <button type="button" className="icon-button" aria-label={`Редактировать ${unit.name}`} onClick={() => onEdit(unit)}><Edit3 size={16} /></button>
        {unit.is_active && <button type="button" className="icon-button organization-disable" aria-label={`Отключить ${unit.name}`} onClick={() => onDeactivate(unit)}><Power size={16} /></button>}
      </div>
    </article>
  );
}

export default function OrganizationStructure() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const flatUnits = useMemo(() => flattenUnits(units), [units]);
  const normalizedSearch = search.trim().toLowerCase();

  const visibleUnits = useMemo(() => {
    if (!normalizedSearch) return units;
    const matches = unit => {
      const selfMatches = unit.name.toLowerCase().includes(normalizedSearch)
        || (unit.description || '').toLowerCase().includes(normalizedSearch);
      const children = (unit.children || []).filter(matches);
      return selfMatches || children.length > 0 ? { ...unit, children } : null;
    };
    return units.map(matches).filter(Boolean);
  }, [units, normalizedSearch]);

  const loadUnits = async () => {
    setLoading(true);
    setError('');
    try {
      setUnits(await organizationApi.getUnits(showInactive));
    } catch (loadError) {
      setError(loadError.message === 'Request failed: 502'
        ? 'Не удалось получить данные справочника. Проверьте доступность сервера.'
        : (loadError.message || 'Не удалось загрузить справочник'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUnits(); }, [showInactive]);

  const openCreate = (parent = null) => {
    setEditingUnit(null);
    setFormData({ ...emptyForm, unit_type: parent ? childUnitTypes[parent.unit_type] : 'company', parent_id: parent?.id || '' });
    setModalOpen(true);
  };

  const openEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({ name: unit.name, unit_type: unit.unit_type, parent_id: unit.parent_id || '', is_active: unit.is_active });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingUnit(null);
    setError('');
  };

  const saveUnit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = { ...formData, name: formData.name.trim(), parent_id: formData.parent_id ? Number(formData.parent_id) : null };
    if (!editingUnit) delete payload.is_active;
    try {
      if (editingUnit) await organizationApi.updateUnit(editingUnit.id, payload);
      else await organizationApi.createUnit(payload);
      setModalOpen(false);
      setEditingUnit(null);
      await loadUnits();
    } catch (saveError) {
      setError(saveError.message || 'Не удалось сохранить подразделение');
    } finally {
      setSaving(false);
    }
  };

  const deactivateUnit = async (unit) => {
    if (!window.confirm(`Отключить подразделение «${unit.name}»?`)) return;
    setError('');
    try {
      await organizationApi.deactivateUnit(unit.id);
      await loadUnits();
    } catch (deactivateError) {
      setError(deactivateError.message || 'Не удалось отключить подразделение');
    }
  };

  return (
    <div className="page-container organization-page">
      <div className="page-header">
        <div>
          <h1><Network size={25} /> Справочник компании</h1>
          <p>Подразделения, сотрудники и рабочие контакты</p>
        </div>
        <button type="button" className="primary-button" onClick={() => openCreate()}><Plus size={18} /> Добавить подразделение</button>
      </div>

      <section className="organization-directory-toolbar">
        <div className="organization-directory-search">
          <Search size={19} />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Найти подразделение" aria-label="Поиск подразделения" />
          {search && <button type="button" className="icon-button" aria-label="Очистить поиск" onClick={() => setSearch('')}><X size={17} /></button>}
        </div>
        <div className="organization-directory-summary">
          <strong>{flatUnits.length}</strong>
          <span>{flatUnits.length === 1 ? 'подразделение' : 'подразделений'}</span>
        </div>
        <label className="organization-inactive-toggle">
          <input type="checkbox" checked={showInactive} onChange={event => setShowInactive(event.target.checked)} />
          Показывать отключённые
        </label>
      </section>

      {error && <div className="login-error" role="alert">{error}</div>}
      {loading ? (
        <div className="loading-state">Загрузка справочника...</div>
      ) : visibleUnits.length === 0 ? (
        <div className="empty-state organization-empty">
          <div className="organization-empty-icon"><Network size={42} /></div>
          <h2>{search ? 'Ничего не найдено' : 'Справочник пока пуст'}</h2>
          <p>{search ? 'Попробуйте изменить запрос или очистить поиск.' : 'Добавьте первое подразделение, чтобы начать формировать корпоративный справочник.'}</p>
          {!search && <button type="button" className="primary-button" onClick={() => openCreate()}><Plus size={18} /> Добавить первое подразделение</button>}
        </div>
      ) : (
        <section className="organization-directory-grid" aria-label="Подразделения компании">
          {visibleUnits.map(unit => (
            <DirectoryCard
              key={unit.id}
              unit={unit}
              onOpen={unit => navigate(`/organization/units/${unit.id}`)}
              onAddChild={openCreate}
              onEdit={openEdit}
              onDeactivate={deactivateUnit}
            />
          ))}
        </section>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <form className="modal-content organization-modal" onSubmit={saveUnit} onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <div><h2>{editingUnit ? 'Редактировать подразделение' : 'Новое подразделение'}</h2><p>{editingUnit ? 'Измените данные подразделения' : 'Добавьте подразделение в справочник компании'}</p></div>
              <button type="button" className="icon-button" aria-label="Закрыть" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="organization-form">
              <div className="form-group"><label htmlFor="organization-name">Название *</label><input id="organization-name" required value={formData.name} onChange={event => setFormData({ ...formData, name: event.target.value })} /></div>
              <div className="form-group"><label htmlFor="organization-type">Тип</label><select id="organization-type" value={formData.unit_type} onChange={event => setFormData({ ...formData, unit_type: event.target.value })}>{Object.entries(unitTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div className="form-group"><label htmlFor="organization-parent">Родительское подразделение</label><select id="organization-parent" value={formData.parent_id} onChange={event => setFormData({ ...formData, parent_id: event.target.value })}><option value="">Нет — корневой уровень</option>{flatUnits.filter(unit => unit.id !== editingUnit?.id).map(unit => <option key={unit.id} value={unit.id}>{'— '.repeat(unit.depth)}{unit.name}</option>)}</select></div>
              {editingUnit && <label className="organization-inactive-toggle"><input type="checkbox" checked={formData.is_active} onChange={event => setFormData({ ...formData, is_active: event.target.checked })} /> Подразделение активно</label>}
            </div>
            <div className="form-actions organization-modal-actions"><button type="button" className="secondary-button" onClick={closeModal}>Отмена</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
