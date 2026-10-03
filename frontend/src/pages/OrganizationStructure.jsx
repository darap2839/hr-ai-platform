import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, MapPin, Phone, Search, Users, X, Building2, BriefcaseBusiness, Hash, CircleCheck, CircleX } from 'lucide-react';

const mockEmployees = [
  { id: 1, full_name: 'Иванов Алексей Сергеевич', position: 'Генеральный директор', department: 'Руководство', email: 'a.ivanov@company.local', phone: '+7 (495) 100-10-01', location: 'Москва, офис 301' },
  { id: 2, full_name: 'Петрова Мария Андреевна', position: 'Руководитель отдела разработки', department: 'Отдел разработки', email: 'm.petrova@company.local', phone: '+7 (495) 100-10-12', location: 'Москва, офис 402' },
  { id: 3, full_name: 'Смирнов Дмитрий Олегович', position: 'Ведущий инженер-программист', department: 'Отдел разработки', email: 'd.smirnov@company.local', phone: '+7 (495) 100-10-13', location: 'Москва, офис 405' },
  { id: 4, full_name: 'Кузнецова Анна Викторовна', position: 'HR-менеджер', department: 'Отдел кадров', email: 'a.kuznetsova@company.local', phone: '+7 (495) 100-10-21', location: 'Москва, офис 208' },
  { id: 5, full_name: 'Волков Сергей Игоревич', position: 'Начальник конструкторского отдела', department: 'Конструкторский отдел', email: 's.volkov@company.local', phone: '+7 (495) 100-10-31', location: 'Москва, корпус Б' },
  { id: 6, full_name: 'Морозова Елена Павловна', position: 'Инженер-конструктор', department: 'Конструкторский отдел', email: 'e.morozova@company.local', phone: '+7 (495) 100-10-32', location: 'Москва, корпус Б' },
  { id: 7, full_name: 'Орлов Никита Романович', position: 'Системный администратор', department: 'ИТ-отдел', email: 'n.orlov@company.local', phone: '+7 (495) 100-10-41', location: 'Москва, офис 110' },
  { id: 9, full_name: 'Фёдоров Артём Викторович', position: 'Начальник производственного отдела', department: 'Производственный отдел', email: 'a.fedorov@company.local', phone: '+7 (495) 100-10-61', location: 'Москва, производственный корпус' },
  { id: 10, full_name: 'Беляева Ирина Дмитриевна', position: 'Инженер по качеству', department: 'Отдел испытаний и качества', email: 'i.belyaeva@company.local', phone: '+7 (495) 100-10-71', location: 'Москва, испытательный корпус' },
  { id: 11, full_name: 'Романов Кирилл Андреевич', position: 'Ведущий инженер по радиоэлектронным системам', department: 'Отдел радиоэлектронных систем', email: 'k.romanov@company.local', phone: '+7 (495) 100-10-81', location: 'Москва, корпус В' },
  { id: 12, full_name: 'Громова Наталья Сергеевна', position: 'Инженер-технолог', department: 'Производственный отдел', email: 'n.gromova@company.local', phone: '+7 (495) 100-10-62', location: 'Москва, производственный корпус' },
  { id: 13, full_name: 'Лебедев Максим Ильич', position: 'Инженер по испытаниям', department: 'Отдел испытаний и качества', email: 'm.lebedev@company.local', phone: '+7 (495) 100-10-72', location: 'Москва, испытательный корпус' },
  { id: 14, full_name: 'Захаров Павел Алексеевич', position: 'Инженер-схемотехник', department: 'Отдел радиоэлектронных систем', email: 'p.zakharov@company.local', phone: '+7 (495) 100-10-82', location: 'Москва, корпус В' },
  { id: 8, full_name: 'Соколова Ольга Максимовна', position: 'Специалист по закупкам', department: 'Отдел снабжения', email: 'o.sokolova@company.local', phone: '+7 (495) 100-10-51', location: 'Москва, офис 215' },
];

const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

function EmployeeCard({ employee, onOpen }) {
  const active = employee.id !== 13;
  return (
    <button type="button" className="directory-employee-card" onClick={() => onOpen(employee)}>
      <div className="directory-employee-avatar">{initials(employee.full_name)}</div>
      <div className="directory-employee-body">
        <div className="directory-employee-heading"><h2>{employee.full_name}</h2><p>{employee.position}</p></div>
        <span className="directory-employee-department">{employee.department}</span>
        <div className="directory-employee-contacts">
          <span><Phone size={14} /> вн. {100 + employee.id}</span>
          <span><MapPin size={14} /> {employee.location}</span>
        </div>
      </div>
      <span className={`directory-status-dot ${active ? 'active' : 'inactive'}`} title={active ? 'Активен' : 'Неактивен'} />
    </button>
  );
}

function EmployeeModal({ employee, onClose }) {
  if (!employee) return null;
  const active = employee.id !== 13;
  return (
    <div className="directory-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="directory-employee-modal" role="dialog" aria-modal="true" aria-labelledby="employee-modal-title">
        <button type="button" className="directory-modal-close" onClick={onClose} aria-label="Закрыть"><X size={20} /></button>
        <div className="directory-modal-profile">
          <div className="directory-modal-avatar">{initials(employee.full_name)}</div>
          <div>
            <span className={`directory-modal-status ${active ? 'active' : 'inactive'}`}>
              {active ? <CircleCheck size={14} /> : <CircleX size={14} />}{active ? 'Активен' : 'Неактивен'}
            </span>
            <h2 id="employee-modal-title">{employee.full_name}</h2>
            <p>{employee.position}</p>
          </div>
        </div>
        <div className="directory-modal-grid">
          <div><BriefcaseBusiness size={18} /><span><small>Должность</small><strong>{employee.position}</strong></span></div>
          <div><Building2 size={18} /><span><small>Отдел</small><strong>{employee.department}</strong></span></div>
          <div><MapPin size={18} /><span><small>Рабочее место</small><strong>{employee.location}</strong></span></div>
          <div><Hash size={18} /><span><small>Внутренний номер</small><strong>{100 + employee.id}</strong></span></div>
          <div><Phone size={18} /><span><small>Телефон</small><strong>{employee.phone}</strong></span></div>
          <div><Mail size={18} /><span><small>Рабочая почта</small><strong>{employee.email}</strong></span></div>
        </div>
        <div className="directory-modal-footer">
          <a href={`mailto:${employee.email}`}><Mail size={16} /> Написать</a>
          <a href={`tel:${employee.phone}`}><Phone size={16} /> Позвонить</a>
        </div>
      </section>
      <EmployeeModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
    </div>
  );
}

export default function OrganizationStructure() {
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
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
            {employees.map((employee) => <EmployeeCard key={employee.id} employee={employee} onOpen={setSelectedEmployee} />)}
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
