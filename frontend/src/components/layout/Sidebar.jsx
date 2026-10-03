import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, Briefcase, CalendarDays, HelpCircle, Menu, Users, BookOpen, Network, ChevronDown, ArrowLeft, LayoutGrid } from 'lucide-react';

export default function Sidebar({ user, isOpen, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();

  const departments = [
    'Конструкторский отдел',
    'Отдел разработки',
    'Производственный отдел',
    'Отдел радиоэлектронных систем',
    'Отдел испытаний и качества',
    'Отдел снабжения',
    'Отдел кадров',
    'ИТ-отдел',
  ];

  const navItems = [
    { label: 'Вакансии', icon: Briefcase, path: '/vacancies', id: 'nav-vacancies' },
    { label: 'Кандидаты', icon: Users, path: '/candidates', id: 'nav-candidates' },
    { label: 'Подбор', icon: CalendarDays, path: '/recruitment', id: 'nav-recruitment' },
    { label: 'База знаний', icon: BookOpen, path: '/knowledge-base', id: 'nav-knowledge-base' },
    { label: 'Оргструктура', icon: Network, path: '/organization', id: 'nav-organization' },
    { label: 'Аналитика', icon: BarChart3, path: '/analytics', id: 'nav-analytics' },
    { label: 'Поддержка', icon: HelpCircle, path: '/support', id: 'nav-support' },
  ];

  const isDirectory = location.pathname === '/organization';
  const selectedDepartment = new URLSearchParams(location.search).get('department') || '';

  const isActive = (path) => {
    if (path === '/vacancies') return location.pathname === '/vacancies' || location.pathname === '/';
    return location.pathname === path;
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`} id="main-sidebar">
      <div className="sidebar-header" id="sidebar-header">
        <div className="brand-row">
          <button
            className="brand-button"
            type="button"
            onClick={() => navigate('/vacancies')}
            title="HR AI Platform"
          >
            <span className="brand-mark">HR</span>
            <span className="brand-text">AI</span>
          </button>
          <button
            className="sidebar-toggle-btn"
            onClick={onToggle}
            id="sidebar-toggle-btn"
            title={isOpen ? 'Свернуть меню' : 'Развернуть меню'}
            type="button"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      <div className="profile" id="sidebar-profile">
        <div className="profile-avatar" id="profile-avatar">ДП</div>
        <strong id="profile-name">{user?.full_name || 'Дарья Попова'}</strong>
        <span id="profile-role">{user?.role || 'HR business partner'}</span>
        <small id="profile-login">{user?.login || 'depopova'}</small>
      </div>

      {isDirectory ? (
        <nav className="nav-section sidebar-directory-nav" id="sidebar-nav" aria-label="Навигация справочника">
          <p id="nav-section-label">справочник</p>

          <button
            type="button"
            className="directory-sidebar-back"
            onClick={() => navigate('/vacancies')}
          >
            <ArrowLeft size={17} />
            <span className="nav-label">Все разделы</span>
          </button>

          <button
            type="button"
            className={`directory-sidebar-all ${!selectedDepartment ? 'active' : ''}`}
            onClick={() => navigate('/organization')}
          >
            <LayoutGrid size={17} />
            <span className="nav-label">Все сотрудники</span>
          </button>

          <div className="sidebar-departments">
            <div className="sidebar-subnav-title">
              <span>отделы</span>
              <ChevronDown size={14} />
            </div>

            {departments.map((department) => (
              <button
                key={department}
                type="button"
                className={`sidebar-department-item ${selectedDepartment === department ? 'active' : ''}`}
                onClick={() => navigate(`/organization?department=${encodeURIComponent(department)}`)}
              >
                <span className="sidebar-department-dot" />
                <span>{department}</span>
              </button>
            ))}
          </div>
        </nav>
      ) : (
        <nav className="nav-section" id="sidebar-nav" aria-label="Основная навигация">
          <p id="nav-section-label">основное</p>
          {navItems.map(({ label, icon: Icon, path, id }) => (
            <button
              key={path}
              id={id}
              className={`nav-item ${isActive(path) ? 'active' : ''}`}
              onClick={() => navigate(path)}
              title={!isOpen ? label : undefined}
              type="button"
            >
              <Icon size={18} />
              <span className="nav-label">{label}</span>
            </button>
          ))}
        </nav>
      )}
    </aside>
  );
}
