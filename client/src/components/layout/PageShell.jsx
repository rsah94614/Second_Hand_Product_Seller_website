import React from 'react';
import Header from '../Header';
import Footer from '../Footer';

export function PageShell({
  children,
  className = '',
  hideHeader = false,
  hideFooter = false,
  maxWidth = 'max-w-7xl',
  containerClassName = '',
}) {
  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 ${className}`}>
      {!hideHeader && <Header />}
      
      <main className={`flex-1 flex flex-col w-full mx-auto pb-12 ${maxWidth} ${containerClassName}`}>
        {children}
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}
