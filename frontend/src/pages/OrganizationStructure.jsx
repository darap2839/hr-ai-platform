import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, MapPin, Phone, Search, Users, X } from 'lucide-react';

const mockEmployees = [
  { id: 1, full_name: 'Иванов Алексей Сергеевич', position: 'Генеральный директор', department: 'Руководство', email: 'a.ivanov@company.local', phone: '+7 (495) 100-10-01', location: 'Москва, офис 301' },
  { id: 2, full_name: 'Петрова Мария Андреевна', position: 'Руководитель отдела разработки', department: 'Отдел разработки', email: 'm.petrova@company.local', phone: '+7 (495) 100-10-12', location: 'Москва, офис 402' },
  { id: 3, full_name: 'Смирнов Дмитрий Олегович', position: 'Ведущий инженер-программист', department: 'Отдел разработки', email: 'd.smirnov@company.local', phone: '+7 (495) 100-10-13', location: 'Москва, офис 405' },
  { id: 4, full_name: 'Кузнецова Анна Викторовна', position: 'HR-менеджер', department: 'Отдел кадров', email: 'a.kuznetsova@company.local', phone: '+7 (495) 100-10-21', location: 'Москва, офис 208' },
  { id: 5, full_name: 'Волков Сергей Игоревич', position: 'Начальник конструкторского отдела', department: 'Конструкторский отдел', email: 's.volkov@company.local', phone: '+7 (495) 100-10-31', location: 'Москва, корпус Б' },
  { id: 6, full_name: 'Морозова Елена Павловна', position: 'Инженер-конструктор', department: 'Конструкторский отдел', email: 'e.morozova@company.local', phone: '+7 (495) 100-10-32', location: 'Москва, корпус Б' },
  { id: 7, full_name: 'Орлов Никита Романович', position: 'Системный администратор', department: 'ИТ-отдел', email: 'n.orlov@company.local', phone: '+7 (495) 100-10-41', location: 'Москва, офис 110' },
  { id: 8, full_name: 'Соколова Ольга Максимовна', position: 'Специалист по закупкам', department: 'Отдел снабжения', email: 'o.sokolova@company.local', phone: '+7 (495) 100-10-51', location: 'Москва, офис 215' },
];

const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

function EmployeeCard({ employee }) {
  return (
    <article className="directory-employee-card">
      <div className="directory-employee-avatar">{initials(employee.full_name)}</div>
      <div className="directory-employee-body">
        <div className="directory-employee-heading">
          <h2>{employee.full_name}</h2>
          <p>{employee.position}</p>
        </div>
        <span className="directory-employee-department">{employee.department}</span>
        <div className="directory-employee-contacts">
          <a href={`mailto:${employee.email}`}><Mail size={14} /> {employee.email}</a>
          <a href={`tel:${employee.phone}`}><Phone size={14} /> {employee.phone}</a>
          <span><MapPin size={14} /> {employee.location}</span>
        </div>
      </div>
    </article>
  );
}

export default function OrganizationStructure() {
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const selectedDepartment = searchParams.get('department') || '';
  const normalizedSearch = search.trim().toLowerCase();

  const employees = useMemo(() => {
    const departmentEmployees = selectedDepartment
      ? mockEmployees.filter((employee) => employee.department === selectedDepartment)
      : mockEmployees;
    if (!normalizedSearch) return departmentEmployees;
    return departmentEmployees.filter((employee) =>
      [employee.full_name, employee.position, employee.department, employee.email, employee.phone, employee.location]
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    );
  }, [normalizedSearch, selectedDepartment]);

  return (
    <div className="page-container organization-page">
      <div className="page-header">
        <div>
          <h1><Users size={25} /> Справочник</h1>
          <p>{selectedDepartment || 'Сотрудники компании и рабочие контакты'}</p>
        </div>
        <div className="directory-employee-count">
          <strong>{employees.length}</strong>
          <span>{selectedDepartment ? 'в отделе' : 'сотрудников'}</span>
        </div>
      </div>

      <section className="directory-search-panel">
        <div className="directory-search">
          <Search size={20} />
          <input value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по ФИО, должности, отделу или контакту" aria-label="Поиск сотрудников" />
          {search && <button type="button" className="icon-button" aria-label="Очистить поиск" onClick={() => setSearch('')}><X size={17} /></button>}
        </div>
      </section>

      <section className="directory-employees-section">
        <div className="directory-section-heading">
          <div>
            <h2>{selectedDepartment ? selectedDepartment : (search ? 'Результаты поиска' : 'Сотрудники')}</h2>
            <p>{employees.length} {employees.length === 1 ? 'сотрудник' : 'сотрудников'}</p>
          </div>
        </div>

        {employees.length > 0 ? (
          <div className="directory-employees-grid">
            {employees.map((employee) => <EmployeeCard key={employee.id} employee={employee} />)}
          </div>
        ) : (
          <div className="directory-empty">
            <div className="directory-empty-icon"><Search size={30} /></div>
            <h2>Ничего не найдено</h2>
            <p>Попробуйте поискать по фамилии, должности или названию отдела.</p>
          </div>
        )}
      </section>
    </div>
  );
}
