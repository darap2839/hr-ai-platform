import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import OrganizationStructure from '../../pages/OrganizationStructure';

function directory(url = '/organization') {
  return render(<MemoryRouter initialEntries={[url]}><OrganizationStructure /></MemoryRouter>);
}

describe('Organization employee directory', () => {
  it('shows employee cards with position, department and internal phone', () => {
    directory();
    expect(screen.getByRole('heading', { name: 'Справочник' })).toBeInTheDocument();
    const card = screen.getByRole('button', { name: /Иванов Алексей Сергеевич/ });
    expect(within(card).getByText('Генеральный директор')).toBeInTheDocument();
    expect(within(card).getByText('Руководство')).toBeInTheDocument();
    expect(within(card).getByText(/вн\. 101/)).toBeInTheDocument();
  });

  it('combines department navigation and search, and clears search', () => {
    directory('/organization?department=' + encodeURIComponent('Отдел разработки'));
    expect(screen.queryByRole('button', { name: /Иванов Алексей/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Петрова Мария/ })).toBeInTheDocument();
    const search = screen.getByRole('textbox', { name: 'Поиск сотрудников' });
    fireEvent.change(search, { target: { value: 'Ведущий инженер' } });
    expect(screen.getByRole('button', { name: /Смирнов Дмитрий/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Петрова Мария/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Очистить поиск' }));
    expect(screen.getByRole('button', { name: /Петрова Мария/ })).toBeInTheDocument();
  });

  it('shows an empty state for an unmatched search', () => {
    directory();
    fireEvent.change(screen.getByRole('textbox', { name: 'Поиск сотрудников' }), { target: { value: 'Несуществующий сотрудник' } });
    expect(screen.getByRole('heading', { name: 'Ничего не найдено' })).toBeInTheDocument();
  });

  it('opens employee details with contacts and inactive status, then closes them', () => {
    directory();
    fireEvent.click(screen.getByRole('button', { name: /Лебедев Максим/ }));
    const modal = screen.getByRole('dialog', { name: 'Лебедев Максим Ильич' });
    expect(within(modal).getByText('Неактивен')).toBeInTheDocument();
    expect(within(modal).getByText('113')).toBeInTheDocument();
    expect(within(modal).getByRole('link', { name: /Написать/ })).toHaveAttribute('href', 'mailto:m.lebedev@company.local');
    fireEvent.click(within(modal).getByRole('button', { name: 'Закрыть' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
