import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Edit3,
  Network,
  Plus,
  Power,
  X
} from 'lucide-react';
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

const emptyForm = {
  name: '',
  unit_type: 'department',
  parent_id: '',
  is_active: true
};

const flattenUnits = (units, depth = 0) => units.flatMap(unit => [
  { ...unit, depth },
  ...flattenUnits(unit.children || [], depth + 1)
]);

function OrganizationNode({ unit, onAddChild, onEdit, onDeactivate, onOpen }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = unit.children?.length > 0;

  return (
    <div className="organization-branch">
      <article className={`organization-node${unit.is_active ? '' : ' inactive'}`}>
        <button
          type="button"
          className="organization-expand"
          aria-label={`${expanded ? 'Свернуть' : 'Развернуть'} ${unit.name}`}
          onClick={() => setExpanded(value => !value)}
          disabled={!hasChildren}
        >
          {hasChildren
            ? (expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />)
            : <span />}
        </button>
        <div className="organization-node-icon"><Building2 size={20} /></div>
        <button type="button" className="organization-node-content organization-node-link" onClick={() => onOpen(unit)} aria-label={`Открыть ${unit.name}`}>
          <strong>{unit.name}</strong>
          <div>
            <span>{unitTypeLabels[unit.unit_type] || unit.unit_type}</span>
            {!unit.is_active && <span>Отключено</span>}
          </div>
        </button>
        <div className="organization-node-actions">
          <button type="button" className="icon-button" aria-label={`Добавить подразделение в ${unit.name}`} onClick={() => onAddChild(unit)}>
            <Plus size={18} />
          </button>
          <button type="button" className="icon-button" aria-label={`Редактировать ${unit.name}`} onClick={() => onEdit(unit)}>
            <Edit3 size={17} />
          </button>
          {unit.is_active && (
            <button type="button" className="icon-button organization-disable" aria-label={`Отключить ${unit.name}`} onClick={() => onDeactivate(unit)}>
              <Power size={17} />
            </button>
          )}
        </div>
      </article>

      {hasChildren && expanded && (
        <div className="organization-children">
          {unit.children.map(child => (
            <OrganizationNode
              key={child.id}
              unit={child}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrganizationStructure() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const flatUnits = useMemo(() => flattenUnits(units), [units]);

  const loadUnits = async () => {
    setLoading(true);
    setError('');
    try {
      setUnits(await organizationApi.getUnits(showInactive));
    } catch (loadError) {
      setError(loadError.message || 'Не удалось загрузить оргструктуру');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnits();
  }, [showInactive]);

  const openCreate = (parent = null) => {
    setEditingUnit(null);
    setFormData({
      ...emptyForm,
      unit_type: parent ? childUnitTypes[parent.unit_type] : 'company',
      parent_id: parent?.id || ''
    });
    setModalOpen(true);
  };

  const openEdit = (unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      unit_type: unit.unit_type,
      parent_id: unit.parent_id || '',
      is_active: unit.is_active
    });
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
    const payload = {
      ...formData,
      name: formData.name.trim(),
      parent_id: formData.parent_id ? Number(formData.parent_id) : null
    };
    if (!editingUnit) delete payload.is_active;

    try {
      if (editingUnit) {
        await organizationApi.updateUnit(editingUnit.id, payload);
      } else {
        await organizationApi.createUnit(payload);
      }
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
          <h1><Network size={25} /> Оргструктура</h1>
          <p>Подразделения компании и их иерархия</p>
        </div>
        <button type="button" className="primary-button" onClick={() => openCreate()}>
          <Plus size={18} /> Добавить подразделение
        </button>
      </div>

      <div className="organization-toolbar">
        <div>
          <strong>Структура компании</strong>
          <span>{flatUnits.length} подразделений</span>
        </div>
        <label className="organization-inactive-toggle">
          <input type="checkbox" checked={showInactive} onChange={event => setShowInactive(event.target.checked)} />
          Показывать отключённые
        </label>
      </div>

      {error && <div className="login-error" role="alert">{error}</div>}
      {loading ? (
        <div className="loading-state">Загрузка...</div>
      ) : units.length === 0 ? (
        <div className="empty-state organization-empty">
          <Network size={48} />
          <p>Оргструктура пока не создана.</p>
          <button type="button" className="primary-button" onClick={() => openCreate()}>
            <Plus size={18} /> Добавить первое подразделение
          </button>
        </div>
      ) : (
        <div className="organization-tree" role="tree" aria-label="Дерево подразделений">
          {units.map(unit => (
            <OrganizationNode
              key={unit.id}
              unit={unit}
              onAddChild={openCreate}
              onEdit={openEdit}
              onDeactivate={deactivateUnit}
              onOpen={unit => navigate(`/organization/units/${unit.id}`)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <form className="modal-content organization-modal" onSubmit={saveUnit} onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{editingUnit ? 'Редактировать подразделение' : 'Новое подразделение'}</h2>
                <p>{editingUnit ? 'Измените положение или данные узла' : 'Добавьте узел в структуру компании'}</p>
              </div>
              <button type="button" className="icon-button" aria-label="Закрыть" onClick={closeModal}><X size={20} /></button>
            </div>
            <div className="organization-form">
              <div className="form-group">
                <label htmlFor="organization-name">Название *</label>
                <input id="organization-name" required value={formData.name} onChange={event => setFormData({ ...formData, name: event.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="organization-type">Тип</label>
                <select id="organization-type" value={formData.unit_type} onChange={event => setFormData({ ...formData, unit_type: event.target.value })}>
                  {Object.entries(unitTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="organization-parent">Родительское подразделение</label>
                <select id="organization-parent" value={formData.parent_id} onChange={event => setFormData({ ...formData, parent_id: event.target.value })}>
                  <option value="">Нет — корневой уровень</option>
                  {flatUnits.filter(unit => unit.id !== editingUnit?.id).map(unit => (
                    <option key={unit.id} value={unit.id}>{'— '.repeat(unit.depth)}{unit.name}</option>
                  ))}
                </select>
              </div>
              {editingUnit && (
                <label className="organization-inactive-toggle">
                  <input type="checkbox" checked={formData.is_active} onChange={event => setFormData({ ...formData, is_active: event.target.checked })} />
                  Подразделение активно
                </label>
              )}
            </div>
            <div className="form-actions organization-modal-actions">
              <button type="button" className="secondary-button" onClick={closeModal}>Отмена</button>
              <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
