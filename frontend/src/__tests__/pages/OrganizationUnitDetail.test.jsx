import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OrganizationUnitDetail from '../../pages/OrganizationUnitDetail';
import { organizationApi } from '../../api/client';


vi.mock('../../api/client', () => ({
  organizationApi: {
    getUnit: vi.fn(),
    getEmployees: vi.fn()
  }
}));

describe('OrganizationUnitDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    organizationApi.getUnit.mockResolvedValue({
      id: 2,
      name: 'Отдел персонала',
      unit_type: 'department',
      description: 'Развитие команды',
      email: 'hr@example.com',
      phone: '+7 900 000-00-00'
    });
    organizationApi.getEmployees.mockResolvedValue([
      { id: 1, full_name: 'Анна Иванова', position: 'Директор по персоналу', is_manager: true, email: 'anna@example.com' },
      { id: 2, full_name: 'Иван Петров', position: 'Специалист', is_manager: false, location: 'Москва' }
    ]);
  });

  it('показывает профиль отдела, руководителя и сотрудников', async () => {
    render(
      <MemoryRouter initialEntries={['/organization/units/2']}>
        <Routes>
          <Route path="/organization/units/:id" element={<OrganizationUnitDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Отдел персонала' })).toBeInTheDocument();
    expect(screen.getByText('Развитие команды')).toBeInTheDocument();
    expect(screen.getByText('Анна Иванова')).toBeInTheDocument();
    expect(screen.getByText('Иван Петров')).toBeInTheDocument();
    expect(organizationApi.getEmployees).toHaveBeenCalledWith('2');
  });
});
