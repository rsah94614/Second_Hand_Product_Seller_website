import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import AppRouter from './router';
import EmailVerificationBanner from '../components/EmailVerificationBanner';

const AppContent = () => {
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
