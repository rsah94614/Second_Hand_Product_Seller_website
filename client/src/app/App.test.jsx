import React from 'react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('../context/AuthContext', () => ({
    AuthProvider: ({ children }) => <div data-testid="auth-mock">{children}</div>,
    useAuth: vi.fn(() => ({ user: null, loading: false })),
}));

vi.mock('../context/SocketContext', () => ({
    SocketProvider: ({ children }) => <div data-testid="socket-mock">{children}</div>,
}));

vi.mock('./router', () => ({
    default: () => <div data-testid="router-mock">App Router</div>,
}));

vi.mock('../components/EmailVerificationBanner', () => ({
    default: () => <div data-testid="banner-mock">Banner</div>,
}));

describe('App Root Component', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders without crashing and mounts contexts', () => {
        const { getByTestId } = render(<App />);

        // Verify context providers are mounted
        expect(getByTestId('auth-mock')).toBeInTheDocument();
        expect(getByTestId('socket-mock')).toBeInTheDocument();

        // Verify the children are rendered
        expect(getByTestId('router-mock')).toBeInTheDocument();
        expect(getByTestId('banner-mock')).toBeInTheDocument();
    });
});
