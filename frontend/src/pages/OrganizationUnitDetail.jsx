import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Crown,
  Mail,
  MapPin,
  Phone,
  UserRound,
  Users
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [unitData, employeeData] = await Promise.all([
          organizationApi.getUnit(id),
          organizationApi.getEmployees(id)
        ]);
        setUnit(unitData);
        setEmployees(employeeData);
      } catch (loadError) {
        setError(loadError.message || 'Не удалось загрузить подразделение');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

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
          <span>{employees.length} сотрудников</span>
        </div>
        {team.length > 0 ? (
          <div className="organization-employees-grid">
            {team.map(employee => <EmployeeCard key={employee.id} employee={employee} />)}
          </div>
        ) : (
          <div className="organization-directory-empty">Сотрудники пока не добавлены</div>
        )}
      </section>
    </div>
  );
}
