import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Sidebar from '../../components/layout/Sidebar';
it('keeps the requested demo display without changing the signed-in identity', () => {
  const { container } = render(<MemoryRouter><Sidebar user={{ name: 'Test Admin', username: 'admin', roles: ['admin'] }} isOpen onToggle={() => {}} /></MemoryRouter>);
  expect(screen.getByText('Дарья Попова')).toBeInTheDocument();
  expect(container.querySelector('#profile-login')).toHaveTextContent('depopova');
  expect(container.querySelector('#profile-avatar')).toHaveTextContent('ДП');
  expect(screen.queryByText('Test Admin')).not.toBeInTheDocument();
  expect(container.querySelector('#profile-role')).toHaveTextContent('HR business partner');
});
