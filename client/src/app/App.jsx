import React, { useEffect } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import AppRouter from './router';
import EmailVerificationBanner from '../components/EmailVerificationBanner';
import { useCsrfToken } from '../hooks/useCsrfToken';

const AppContent = () => {
  // Initialize CSRF token for all requests
  const { loading: csrfLoading, error: csrfError } = useCsrfToken();

  useEffect(() => {
    if (csrfError) {
      console.error('CSRF token initialization failed:', csrfError);
    }
  }, [csrfError]);

  return (
    <div className="App">
      <EmailVerificationBanner />
      <main>
        <AppRouter />
      </main>
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  </AuthProvider>
);

export default App;
