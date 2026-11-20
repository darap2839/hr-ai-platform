import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  kc: { token: 'initial', init: vi.fn(), loadUserInfo: vi.fn(), updateToken: vi.fn(), logout: vi.fn() },
  setAuthToken: vi.fn(), updateSSEAuthToken: vi.fn(), disconnectSSEClient: vi.fn(),
}));
vi.mock('keycloak-js', () => ({ default: class { constructor() { return mocks.kc; } } }));
vi.mock('../../api/client', () => ({ setAuthToken: mocks.setAuthToken }));
vi.mock('../../api/sseNotifications', () => ({ updateSSEAuthToken: mocks.updateSSEAuthToken, disconnectSSEClient: mocks.disconnectSSEClient }));
import { KeycloakProvider, useKeycloak } from '../../contexts/KeycloakContext';
function Session() {
  const { authenticated, userInfo, logout } = useKeycloak();
  return <><span>{authenticated ? userInfo?.preferred_username : 'signed-out'}</span><button onClick={() => logout()}>Exit</button></>;
}
it('refreshes the Bearer token and clears authentication on logout', async () => {
  vi.useFakeTimers();
  mocks.kc.init.mockResolvedValue(true);
  mocks.kc.loadUserInfo.mockResolvedValue({ preferred_username: 'admin' });
  mocks.kc.updateToken.mockImplementation(async () => { mocks.kc.token = 'refreshed'; return true; });
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: 'http://localhost/auth', realm: 'platform', clientId: 'platform' }) });
  let view;
  try {
    await act(async () => { view = render(<KeycloakProvider><Session /></KeycloakProvider>); });
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(mocks.setAuthToken).toHaveBeenCalledWith('initial');
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    expect(mocks.setAuthToken).toHaveBeenLastCalledWith('refreshed');
    expect(mocks.updateSSEAuthToken).toHaveBeenCalledWith('refreshed');
    fireEvent.click(screen.getByText('Exit'));
    expect(mocks.setAuthToken).toHaveBeenLastCalledWith(null);
    expect(mocks.disconnectSSEClient).toHaveBeenCalled();
    expect(screen.getByText('signed-out')).toBeInTheDocument();
    const count = mocks.kc.updateToken.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(60000); });
    expect(mocks.kc.updateToken).toHaveBeenCalledTimes(count);
  } finally { view?.unmount(); vi.useRealTimers(); }
});
