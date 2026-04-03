import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import AppRouter from './router';

const App = () => (
  <AuthProvider>
    <div className="App">
      <main>
        <AppRouter />
      </main>
    </div>
  </AuthProvider>
);

export default App;
