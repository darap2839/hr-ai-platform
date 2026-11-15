import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Sidebar from '../../components/layout/Sidebar';
it('shows the actual OIDC identity instead of the demo profile', () => {
  const { container } = render(<MemoryRouter><Sidebar user={{ name: 'Test Admin', username: 'admin', roles: ['admin'] }} isOpen onToggle={() => {}} /></MemoryRouter>);
  expect(screen.getByText('Test Admin')).toBeInTheDocument();
  expect(container.querySelector('#profile-login')).toHaveTextContent('admin');
  expect(container.querySelector('#profile-avatar')).toHaveTextContent('TA');
  expect(screen.queryByText('Дарья Попова')).not.toBeInTheDocument();
  expect(screen.queryByText('depopova')).not.toBeInTheDocument();
});
