import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import AppRouter from './router';

const AppContent = () => {
  return (
    <div className="App">
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
