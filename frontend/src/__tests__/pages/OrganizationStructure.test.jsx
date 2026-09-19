import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OrganizationStructure from '../../pages/OrganizationStructure';
import { organizationApi } from '../../api/client';


vi.mock('../../api/client', () => ({
  organizationApi: {
    getUnits: vi.fn(),
    createUnit: vi.fn(),
    updateUnit: vi.fn(),
    deactivateUnit: vi.fn()
  }
}));

const units = [{
  id: 1,
  name: 'Компания',
  code: 'ROOT',
  unit_type: 'company',
  parent_id: null,
  sort_order: 0,
  is_active: true,
  created_at: '2026-09-19T10:00:00Z',
  children: [{
    id: 2,
    name: 'HR',
    code: 'HR',
    unit_type: 'department',
    parent_id: 1,
    sort_order: 0,
    is_active: true,
    created_at: '2026-09-19T10:00:00Z',
    children: []
  }]
}];

describe('OrganizationStructure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    organizationApi.getUnits.mockResolvedValue(units);
    organizationApi.createUnit.mockResolvedValue({});
  });

  it('показывает иерархию подразделений', async () => {
    render(<OrganizationStructure />);

    expect(await screen.findByRole('button', { name: 'Добавить подразделение в Компания' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Добавить подразделение в HR' })).toBeInTheDocument();
    expect(screen.getByRole('tree', { name: 'Дерево подразделений' })).toBeInTheDocument();
  });

  it('создаёт дочернее подразделение из узла дерева', async () => {
    render(<OrganizationStructure />);
    const addChildButton = await screen.findByRole('button', { name: 'Добавить подразделение в Компания' });
    fireEvent.click(addChildButton);
    expect(screen.queryByLabelText('Код')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Порядок отображения')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Название *'), { target: { value: 'Финансы' } });
    fireEvent.change(screen.getByLabelText('Тип'), { target: { value: 'department' } });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(organizationApi.createUnit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Финансы',
        parent_id: 1,
        unit_type: 'department'
      }));
    });
  });
});
