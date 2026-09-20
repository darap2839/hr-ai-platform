import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Crown,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Plus,
  UserRound,
  Users,
  X
} from 'lucide-react';
import { organizationApi } from '../api/client';


const unitTypeLabels = {
  company: 'Компания',
  directorate: 'Управление',
  department: 'Департамент',
  team: 'Команда'
};

const initials = (name) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map(part => part[0])
  .join('')
  .toUpperCase();

const emptyEmployee = {
  full_name: '',
  position: '',
  email: '',
  phone: '',
  location: '',
  is_manager: false
};

function EmployeeCard({ employee, manager = false }) {
  return (
    <article className={manager ? 'organization-manager-card' : 'organization-employee-card'}>
      <div className="organization-employee-avatar">{initials(employee.full_name)}</div>
      <div className="organization-employee-info">
        <strong>{employee.full_name}</strong>
        <span>{employee.position}</span>
        <div className="organization-employee-contacts">
          {employee.email && <a href={`mailto:${employee.email}`}><Mail size={13} /> {employee.email}</a>}
          {employee.phone && <a href={`tel:${employee.phone}`}><Phone size={13} /> {employee.phone}</a>}
          {employee.location && <span><MapPin size={13} /> {employee.location}</span>}
        </div>
      </div>
      {manager && <Crown className="organization-manager-mark" size={21} aria-label="Руководитель" />}
    </article>
  );
}

export default function OrganizationUnitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editUnitOpen, setEditUnitOpen] = useState(false);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [unitForm, setUnitForm] = useState({ name: '', description: '', email: '', phone: '' });
  const [employeeForm, setEmployeeForm] = useState(emptyEmployee);
  const [saving, setSaving] = useState(false);

  const loadUnit = async () => {
    const unitData = await organizationApi.getUnit(id);
    setUnit(unitData);
    return unitData;
  };

  const loadEmployees = async () => {
    const employeeData = await organizationApi.getEmployees(id);
    setEmployees(employeeData);
    return employeeData;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        await Promise.all([loadUnit(), loadEmployees()]);
      } catch (loadError) {
        setError(loadError.message || 'Не удалось загрузить подразделение');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const openUnitEditor = () => {
    setUnitForm({
      name: unit.name,
      description: unit.description || '',
      email: unit.email || '',
      phone: unit.phone || ''
    });
    setEditUnitOpen(true);
  };

  const saveUnit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await organizationApi.updateUnit(id, {
        name: unitForm.name.trim(),
        description: unitForm.description.trim() || null,
        email: unitForm.email.trim() || null,
        phone: unitForm.phone.trim() || null
      });
      await loadUnit();
      setEditUnitOpen(false);
    } catch (saveError) {
      setError(saveError.message || 'Не удалось сохранить подразделение');
    } finally {
      setSaving(false);
    }
  };

  const openEmployeeCreator = () => {
    setEmployeeForm(emptyEmployee);
    setEmployeeModalOpen(true);
  };

  const saveEmployee = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await organizationApi.createEmployee(id, {
        full_name: employeeForm.full_name.trim(),
        position: employeeForm.position.trim(),
        email: employeeForm.email.trim() || null,
        phone: employeeForm.phone.trim() || null,
        location: employeeForm.location.trim() || null,
        is_manager: employeeForm.is_manager
      });
      await loadEmployees();
      setEmployeeModalOpen(false);
    } catch (saveError) {
      setError(saveError.message || 'Не удалось добавить сотрудника');
    } finally {
      setSaving(false);
    }
  };

  const closeModals = () => {
    if (saving) return;
    setEditUnitOpen(false);
    setEmployeeModalOpen(false);
  };

  if (loading) return <div className="page-container"><div className="loading-state">Загрузка...</div></div>;
  if (error || !unit) {
    return <div className="page-container"><div className="login-error" role="alert">{error || 'Подразделение не найдено'}</div></div>;
  }

  const manager = employees.find(employee => employee.is_manager);
  const team = employees.filter(employee => !employee.is_manager);

  return (
    <div className="page-container organization-detail-page">
      <button type="button" className="organization-detail-back" onClick={() => navigate('/organization')}>
        <ArrowLeft size={18} /> К оргструктуре
      </button>

      <section className="organization-detail-hero">
        <div className="organization-detail-title">
          <div><Building2 size={26} /></div>
          <div>
            <h1>{unit.name}</h1>
            <span className="organization-detail-type">{unitTypeLabels[unit.unit_type] || unit.unit_type}</span>
            <p>{unit.description || 'Описание подразделения пока не добавлено.'}</p>
          </div>
        </div>
        {(unit.email || unit.phone) && (
          <div className="organization-contact-list" aria-label="Контакты подразделения">
            {unit.email && <a href={`mailto:${unit.email}`}><Mail size={17} /> {unit.email}</a>}
            {unit.phone && <a href={`tel:${unit.phone}`}><Phone size={17} /> {unit.phone}</a>}
          </div>
        )}
        <button type="button" className="secondary-button organization-detail-edit" onClick={openUnitEditor}>
          <Edit3 size={17} /> Редактировать отдел
        </button>
      </section>

      <section className="organization-section">
        <div className="organization-section-header">
          <h2><UserRound size={20} /> Руководитель</h2>
        </div>
        {manager
          ? <EmployeeCard employee={manager} manager />
          : <div className="organization-directory-empty">Руководитель пока не назначен</div>}
      </section>

      <section className="organization-section">
        <div className="organization-section-header">
          <h2><Users size={20} /> Сотрудники</h2>
          <div className="organization-section-actions">
            <span>{employees.length} сотрудников</span>
            <button type="button" className="primary-button" onClick={openEmployeeCreator}>
              <Plus size={17} /> Добавить сотрудника
            </button>
          </div>
        </div>
        {team.length > 0 ? (
          <div className="organization-employees-grid">
            {team.map(employee => <EmployeeCard key={employee.id} employee={employee} />)}
          </div>
        ) : (
          <div className="organization-directory-empty">Сотрудники пока не добавлены</div>
        )}
      </section>

      {editUnitOpen && (
        <div className="modal-overlay" onClick={closeModals}>
          <form className="modal-content organization-modal" onSubmit={saveUnit} onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <div><h2>Редактировать отдел</h2><p>Основная информация корпоративного справочника</p></div>
              <button type="button" className="icon-button" aria-label="Закрыть" onClick={closeModals}><X size={20} /></button>
            </div>
            <div className="organization-form">
              <div className="form-group">
                <label htmlFor="unit-detail-name">Название *</label>
                <input id="unit-detail-name" required value={unitForm.name} onChange={event => setUnitForm({ ...unitForm, name: event.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="unit-detail-description">Описание</label>
                <textarea id="unit-detail-description" rows="5" value={unitForm.description} onChange={event => setUnitForm({ ...unitForm, description: event.target.value })} />
              </div>
              <div className="organization-form-row">
                <div className="form-group">
                  <label htmlFor="unit-detail-email">Общий email</label>
                  <input id="unit-detail-email" type="email" value={unitForm.email} onChange={event => setUnitForm({ ...unitForm, email: event.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="unit-detail-phone">Общий телефон</label>
                  <input id="unit-detail-phone" value={unitForm.phone} onChange={event => setUnitForm({ ...unitForm, phone: event.target.value })} />
                </div>
              </div>
            </div>
            <div className="form-actions organization-modal-actions">
              <button type="button" className="secondary-button" onClick={closeModals}>Отмена</button>
              <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
          </form>
        </div>
      )}

      {employeeModalOpen && (
        <div className="modal-overlay" onClick={closeModals}>
          <form className="modal-content organization-modal" onSubmit={saveEmployee} onClick={event => event.stopPropagation()}>
            <div className="modal-header">
              <div><h2>Новый сотрудник</h2><p>Рабочий профиль для корпоративного справочника</p></div>
              <button type="button" className="icon-button" aria-label="Закрыть" onClick={closeModals}><X size={20} /></button>
            </div>
            <div className="organization-form">
              <div className="form-group">
                <label htmlFor="employee-name">ФИО *</label>
                <input id="employee-name" required value={employeeForm.full_name} onChange={event => setEmployeeForm({ ...employeeForm, full_name: event.target.value })} />
              </div>
              <div className="form-group">
                <label htmlFor="employee-position">Должность *</label>
                <input id="employee-position" required value={employeeForm.position} onChange={event => setEmployeeForm({ ...employeeForm, position: event.target.value })} />
              </div>
              <div className="organization-form-row">
                <div className="form-group">
                  <label htmlFor="employee-email">Рабочий email</label>
                  <input id="employee-email" type="email" value={employeeForm.email} onChange={event => setEmployeeForm({ ...employeeForm, email: event.target.value })} />
                </div>
                <div className="form-group">
                  <label htmlFor="employee-phone">Рабочий телефон</label>
                  <input id="employee-phone" value={employeeForm.phone} onChange={event => setEmployeeForm({ ...employeeForm, phone: event.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="employee-location">Местоположение</label>
                <input id="employee-location" placeholder="Например, Москва или офис 305" value={employeeForm.location} onChange={event => setEmployeeForm({ ...employeeForm, location: event.target.value })} />
              </div>
              <label className="organization-inactive-toggle">
                <input type="checkbox" checked={employeeForm.is_manager} onChange={event => setEmployeeForm({ ...employeeForm, is_manager: event.target.checked })} />
                Назначить руководителем отдела
              </label>
            </div>
            <div className="form-actions organization-modal-actions">
              <button type="button" className="secondary-button" onClick={closeModals}>Отмена</button>
              <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Добавление...' : 'Добавить'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
