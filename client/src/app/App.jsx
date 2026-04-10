import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import AppRouter from './router';

const App = () => (
  <AuthProvider>
    <SocketProvider>
      <div className="App">
        <main>
          <AppRouter />
        </main>
      </div>
    </SocketProvider>
  </AuthProvider>
);

export default App;
