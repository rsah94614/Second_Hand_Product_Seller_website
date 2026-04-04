import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../../context/AuthContext';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const renderProtectedRoute = (authState, allowedRoles = ['admin']) => {
  useAuth.mockReturnValue(authState);

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/protected"
          element={(
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Secret Area</div>
            </ProtectedRoute>
          )}
        />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the loading state while auth is resolving', () => {
    renderProtectedRoute({ user: null, loading: true });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    renderProtectedRoute({ user: null, loading: false });

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('shows an access restricted message for disallowed roles', () => {
    renderProtectedRoute({
      user: { role: 'user' },
      loading: false,
    });

    expect(screen.getByText('Access restricted')).toBeInTheDocument();
  });

  it('renders children for an allowed role', () => {
    renderProtectedRoute({
      user: { role: 'admin' },
      loading: false,
    });

    expect(screen.getByText('Secret Area')).toBeInTheDocument();
  });
});
